/**
 * Oracle FAI Photos - Export Module
 * Handles zip download and email sharing
 */

const Export = {
    // Default email recipient
    defaultEmail: 'patrick.parco@mitaccomputing.com',

    // Generate zip filename from session PN/SN
    getZipFilename() {
        const parts = [];
        if (SESSION.partNumber) parts.push(SESSION.partNumber);
        if (SESSION.serialNumber) parts.push(SESSION.serialNumber);

        if (parts.length > 0) {
            return `${parts.join('_')}.zip`;
        }

        // Fallback if no PN/SN
        const date = new Date().toISOString().split('T')[0];
        const mode = SESSION.mode === 'pretest' ? 'Pretest' : 'Packout';
        return `FAI_${mode}_${date}.zip`;
    },

    // Build zip blob from captured photos
    async buildZip() {
        if (typeof JSZip === 'undefined') {
            Screens.showError('JSZip library not loaded. Please check your internet connection.');
            return null;
        }

        const photos = SESSION.capturedPhotos;
        if (photos.length === 0) {
            Screens.showError('No photos to export.');
            return null;
        }

        const zip = new JSZip();

        for (const photo of photos) {
            const blob = Capture.dataUrlToBlob(photo.dataUrl);
            zip.file(photo.filename, blob);
        }

        return await zip.generateAsync({ type: 'blob' });
    },

    // Download photos as ZIP
    async downloadZip() {
        const zipBlob = await this.buildZip();
        if (!zipBlob) return;

        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.getZipFilename();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    // Email ZIP via Web Share API or mailto fallback
    async emailZip() {
        const zipBlob = await this.buildZip();
        if (!zipBlob) return;

        const zipFilename = this.getZipFilename();
        const zipFile = new File([zipBlob], zipFilename, { type: 'application/zip' });

        // Try Web Share API with files (works on mobile + modern desktop)
        if (navigator.canShare && navigator.canShare({ files: [zipFile] })) {
            try {
                await navigator.share({
                    title: `FAI Photos - ${zipFilename}`,
                    text: `FAI ${SESSION.mode === 'pretest' ? 'Pretest' : 'Packout'} photos${SESSION.partNumber ? ' - PN: ' + SESSION.partNumber : ''}${SESSION.serialNumber ? ' - SN: ' + SESSION.serialNumber : ''}`,
                    files: [zipFile]
                });
                return;
            } catch (err) {
                if (err.name === 'AbortError') return; // User cancelled
                console.warn('Web Share failed, trying fallback:', err);
            }
        }

        // Fallback: download the zip and open mailto
        this.downloadZipBlob(zipBlob, zipFilename);

        const subject = encodeURIComponent(`FAI Photos - ${zipFilename.replace('.zip', '')}`);
        const body = encodeURIComponent(
            `FAI ${SESSION.mode === 'pretest' ? 'Pretest' : 'Packout'} Photos\n` +
            `${SESSION.partNumber ? 'PN: ' + SESSION.partNumber + '\n' : ''}` +
            `${SESSION.serialNumber ? 'SN: ' + SESSION.serialNumber + '\n' : ''}` +
            `\nPlease find the attached ZIP file (${zipFilename}) downloaded to your device.`
        );

        window.open(`mailto:${this.defaultEmail}?subject=${subject}&body=${body}`, '_self');
    },

    // Helper: download a zip blob directly
    downloadZipBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    // Download a single photo
    downloadPhoto(capturedPhoto) {
        const blob = Capture.dataUrlToBlob(capturedPhoto.dataUrl);
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = capturedPhoto.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    },

    // Helper delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
