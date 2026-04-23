/**
 * L11 FAI Photos - Export Module
 * Loads full-resolution photos from IndexedDB for export (SESSION only holds thumbnails).
 * Reports progress via the export-progress-overlay in the UI.
 */

const Export = {
    defaultEmail: 'patrick.parco@mitaccomputing.com',

    getZipFilename() {
        const parts = [];
        if (SESSION.partNumber)   parts.push(SESSION.partNumber);
        if (SESSION.serialNumber) parts.push(SESSION.serialNumber);
        if (parts.length > 0) return `${parts.join('_')}.zip`;
        const date = new Date().toISOString().split('T')[0];
        const mode = SESSION.mode === 'pretest' ? 'Pretest' : 'Packout';
        return `FAI_${mode}_${date}.zip`;
    },

    // ── Progress overlay ───────────────────────────────────────────────────
    _showProgress(label) {
        document.getElementById('export-progress-label').textContent = label || 'Preparing photos…';
        document.getElementById('export-progress-bar').style.width   = '0%';
        document.getElementById('export-progress-pct').textContent   = '0%';
        document.getElementById('export-progress-overlay').classList.remove('hidden');
    },
    _updateProgress(pct) {
        const p = Math.round(pct);
        document.getElementById('export-progress-bar').style.width = `${p}%`;
        document.getElementById('export-progress-pct').textContent  = `${p}%`;
    },
    _hideProgress() {
        document.getElementById('export-progress-overlay').classList.add('hidden');
    },

    // ── Build ZIP (full-res from IndexedDB) ────────────────────────────────
    async buildZip() {
        if (typeof JSZip === 'undefined') {
            Screens.showError('JSZip library not loaded. Please check your internet connection.');
            return null;
        }
        const sessionPhotos = SESSION.capturedPhotos;
        if (sessionPhotos.length === 0) {
            Screens.showError('No photos to export.');
            return null;
        }

        this._showProgress('Loading full-resolution photos…');

        // Load full-res blobs from IndexedDB (keyed by photo id)
        let fullResMap = {};
        try {
            const allPhotos = await Storage.loadPhotos();
            allPhotos.forEach(p => { fullResMap[p.id] = p; });
        } catch (e) {
            console.warn('Could not load from IndexedDB, using thumbnails:', e);
        }

        const zip = new JSZip();
        this._updateProgress(10);

        for (let i = 0; i < sessionPhotos.length; i++) {
            const sp        = sessionPhotos[i];
            const fullPhoto = fullResMap[sp.id] || sp;  // fallback to thumbnail

            let blob;
            if (fullPhoto.orientation === 'landscape') {
                blob = await this.rotateImageToLandscape(fullPhoto.dataUrl);
            } else {
                blob = await this.reencodeForExport(fullPhoto.dataUrl);
            }
            zip.file(sp.filename, blob);

            // 10–70% while adding files
            this._updateProgress(10 + (i + 1) / sessionPhotos.length * 60);
        }

        // Add metadata.json for the FAI report builder
        const metadata = {
            part_number:   SESSION.partNumber   || '',
            serial_number: SESSION.serialNumber || '',
            fai_state:     SESSION.mode === 'pretest' ? 'Pretest' : 'Packout',
            rack_code:     SESSION.rackType     || '',
            photos:        SESSION.capturedPhotos.map(p => p.filename)
        };
        zip.file('metadata.json', JSON.stringify(metadata, null, 2));

        this._updateProgress(70);

        const zipBlob = await zip.generateAsync(
            { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 3 } },
            zipMeta => this._updateProgress(70 + zipMeta.percent * 0.3)
        );

        this._updateProgress(100);
        return zipBlob;
    },

    // ── Scale helper: returns a canvas capped at maxExportDimension ───────
    _scaledCanvas(img) {
        const max = CONFIG.photo.maxExportDimension;
        let w = img.width, h = img.height;
        if (w > max || h > max) {
            if (w >= h) { h = Math.round(h * max / w); w = max; }
            else        { w = Math.round(w * max / h); h = max; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        return canvas;
    },

    // ── Rotate portrait → landscape ────────────────────────────────────────
    rotateImageToLandscape(dataUrl) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                // Scale based on pre-rotation dimensions; post-rotation longest side = img.height
                const max = CONFIG.photo.maxExportDimension;
                let sw = img.width, sh = img.height;
                if (sh > max || sw > max) {
                    if (sh >= sw) { sw = Math.round(sw * max / sh); sh = max; }
                    else          { sh = Math.round(sh * max / sw); sw = max; }
                }
                // Canvas is rotated: width=sh, height=sw
                const canvas = document.createElement('canvas');
                canvas.width = sh; canvas.height = sw;
                const ctx = canvas.getContext('2d');
                ctx.translate(0, canvas.height);
                ctx.rotate(-Math.PI / 2);
                ctx.drawImage(img, 0, 0, sw, sh);
                canvas.toBlob(blob => resolve(blob), CONFIG.photo.format, CONFIG.photo.exportQuality);
            };
            img.src = dataUrl;
        });
    },

    // Re-encode a dataUrl at CONFIG.photo.exportQuality without rotating
    reencodeForExport(dataUrl) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                const canvas = this._scaledCanvas(img);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(blob => resolve(blob), CONFIG.photo.format, CONFIG.photo.exportQuality);
            };
            img.src = dataUrl;
        });
    },

    // ── Download ZIP ───────────────────────────────────────────────────────
    async downloadZip() {
        try {
            const zipBlob = await this.buildZip();
            if (!zipBlob) { this._hideProgress(); return; }
            setTimeout(() => this._hideProgress(), 500);

            const zipFilename = this.getZipFilename();
            const zipFile = new File([zipBlob], zipFilename, { type: 'application/zip' });

            // iOS PWA: navigator.share is the only reliable way to save a file
            if (navigator.canShare && navigator.canShare({ files: [zipFile] })) {
                try {
                    await navigator.share({
                        title: `FAI Photos — ${zipFilename}`,
                        files: [zipFile]
                    });
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') return;  // user cancelled
                    console.warn('Web Share failed, falling back to link download:', err);
                }
            }

            // Desktop / non-PWA Safari fallback
            this.downloadZipBlob(zipBlob, zipFilename);
        } catch (e) {
            this._hideProgress();
            Screens.showError('Failed to build ZIP. Please try again.');
            console.error('downloadZip error:', e);
        }
    },

    // ── Share / Email ZIP ──────────────────────────────────────────────────
    async emailZip() {
        try {
            const zipBlob = await this.buildZip();
            if (!zipBlob) { this._hideProgress(); return; }
            setTimeout(() => this._hideProgress(), 500);

            const zipFilename = this.getZipFilename();
            const zipFile = new File([zipBlob], zipFilename, { type: 'application/zip' });

            if (navigator.canShare && navigator.canShare({ files: [zipFile] })) {
                try {
                    await navigator.share({
                        title: `FAI Photos - ${zipFilename}`,
                        text: `FAI ${SESSION.mode === 'pretest' ? 'Pretest' : 'Packout'} photos` +
                              `${SESSION.partNumber   ? ' - PN: ' + SESSION.partNumber   : ''}` +
                              `${SESSION.serialNumber ? ' - SN: ' + SESSION.serialNumber : ''}`,
                        files: [zipFile]
                    });
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') return;
                    console.warn('Web Share failed:', err);
                }
            }

            // Fallback: download + mailto
            this.downloadZipBlob(zipBlob, zipFilename);
            const subject = encodeURIComponent(`FAI Photos - ${zipFilename.replace('.zip', '')}`);
            const body    = encodeURIComponent(
                `FAI ${SESSION.mode === 'pretest' ? 'Pretest' : 'Packout'} Photos\n` +
                `${SESSION.partNumber   ? 'PN: ' + SESSION.partNumber   + '\n' : ''}` +
                `${SESSION.serialNumber ? 'SN: ' + SESSION.serialNumber + '\n' : ''}` +
                `\nAttached ZIP file: ${zipFilename}`
            );
            window.open(`mailto:${this.defaultEmail}?subject=${subject}&body=${body}`, '_self');
        } catch (e) {
            this._hideProgress();
            Screens.showError('Failed to share ZIP. Please try again.');
            console.error('emailZip error:', e);
        }
    },

    downloadZipBlob(blob, filename) {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    // Rotate a dataUrl 90° clockwise; returns a new dataUrl
    rotateImage90CW(dataUrl) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.height; canvas.height = img.width;
                const ctx = canvas.getContext('2d');
                ctx.translate(canvas.width, 0);
                ctx.rotate(Math.PI / 2);
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(blob => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result);
                    reader.readAsDataURL(blob);
                }, CONFIG.photo.format, CONFIG.photo.quality);
            };
            img.src = dataUrl;
        });
    },

    // Rotate a dataUrl 90° counter-clockwise; returns a new dataUrl
    rotateImage90CCW(dataUrl) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.height; canvas.height = img.width;
                const ctx = canvas.getContext('2d');
                ctx.translate(0, canvas.height);
                ctx.rotate(-Math.PI / 2);
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(blob => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result);
                    reader.readAsDataURL(blob);
                }, CONFIG.photo.format, CONFIG.photo.quality);
            };
            img.src = dataUrl;
        });
    },

    async downloadPhoto(capturedPhoto) {
        let photoToExport = capturedPhoto;
        try {
            const all  = await Storage.loadPhotos();
            const full = all.find(p => p.id === capturedPhoto.id);
            if (full) photoToExport = full;
        } catch (e) { /* use thumbnail as fallback */ }

        let blob;
        if (photoToExport.orientation === 'landscape') {
            blob = await this.rotateImageToLandscape(photoToExport.dataUrl);
        } else {
            blob = Capture.dataUrlToBlob(photoToExport.dataUrl);
        }

        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = capturedPhoto.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};
