/**
 * L11 FAI Photos - Capture Module
 * Memory-optimised: full-resolution photos go to IndexedDB,
 * lightweight thumbnails (≤600px) stay in SESSION.capturedPhotos for display.
 * Export always reads full-res blobs from IndexedDB.
 */

const Capture = {
    canvas: null,       // full-res canvas (reused)
    ctx: null,
    _thumbCanvas: null, // thumbnail canvas (reused)
    _thumbCtx: null,
    _audioCtx: null,

    init() {
        this.canvas = document.createElement('canvas');
        this.ctx    = this.canvas.getContext('2d');
        this._thumbCanvas = document.createElement('canvas');
        this._thumbCtx    = this._thumbCanvas.getContext('2d');
    },

    // ── Crop parameters ────────────────────────────────────────────────────
    // Returns the centre-crop region that produces a 3:4 portrait frame.
    _getCropParams() {
        const video  = Camera.videoElement;
        const vw     = video.videoWidth;
        const vh     = video.videoHeight;
        const target = 3 / 4;          // portrait 4:3  (width/height)
        const ratio  = vw / vh;

        let sx, sy, sw, sh;
        if (ratio > target) {           // wider than 3:4 → trim sides
            sh = vh;
            sw = Math.round(vh * target);
            sx = Math.round((vw - sw) / 2);
            sy = 0;
        } else if (ratio < target) {    // taller than 3:4 → trim top/bottom
            sw = vw;
            sh = Math.round(vw / target);
            sx = 0;
            sy = Math.round((vh - sh) / 2);
        } else {
            sx = 0; sy = 0; sw = vw; sh = vh;
        }
        return { sx, sy, sw, sh };
    },

    // ── Full-res capture (used internally) ────────────────────────────────
    // Returns a full-resolution 3:4 data URL AND fires all feedback effects.
    capturePhoto() {
        const video = Camera.videoElement;
        if (!video || !Camera.isActive()) throw new Error('Camera is not active');

        const { sx, sy, sw, sh } = this._getCropParams();
        this.canvas.width  = sw;
        this.canvas.height = sh;
        this.ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);

        const dataUrl = this.canvas.toDataURL(CONFIG.photo.format, CONFIG.photo.quality);

        this.triggerFlash();
        this.playShutterSound();
        this.animateCaptureButton();
        this.freezeFrame(dataUrl);

        return dataUrl;
    },

    // ── Thumbnail (same video frame, smaller canvas) ───────────────────────
    // Max 600 px wide — enough for gallery/review display, ~10× less RAM.
    _captureThumbnail(maxW = 600) {
        const video = Camera.videoElement;
        const { sx, sy, sw, sh } = this._getCropParams();
        const scale = Math.min(1, maxW / sw);
        const tw = Math.round(sw * scale);
        const th = Math.round(sh * scale);

        this._thumbCanvas.width  = tw;
        this._thumbCanvas.height = th;
        this._thumbCtx.drawImage(video, sx, sy, sw, sh, 0, 0, tw, th);

        return this._thumbCanvas.toDataURL('image/jpeg', 0.72);
    },

    // ── Capture + store ────────────────────────────────────────────────────
    // Saves full-res to IndexedDB, keeps thumbnail in SESSION memory.
    captureAndStore() {
        const photoInfo = SESSION.getCurrentPhoto();
        if (!photoInfo) {
            console.error('No photo in queue');
            return null;
        }

        const video = Camera.videoElement;
        if (!video || !Camera.isActive()) throw new Error('Camera is not active');

        // 1. Draw full-res to canvas → triggers feedback effects
        const { sx, sy, sw, sh } = this._getCropParams();
        this.canvas.width  = sw;
        this.canvas.height = sh;
        this.ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
        const fullDataUrl = this.canvas.toDataURL(CONFIG.photo.format, CONFIG.photo.quality);

        // 2. Feedback (uses full-res for freeze frame)
        this.triggerFlash();
        this.playShutterSound();
        this.animateCaptureButton();
        this.freezeFrame(fullDataUrl);

        // 3. Thumbnail for in-memory display (same frame, smaller canvas)
        const scale = Math.min(1, 600 / sw);
        const tw = Math.round(sw * scale);
        const th = Math.round(sh * scale);
        this._thumbCanvas.width  = tw;
        this._thumbCanvas.height = th;
        this._thumbCtx.drawImage(video, sx, sy, sw, sh, 0, 0, tw, th);
        const thumbDataUrl = this._thumbCanvas.toDataURL('image/jpeg', 0.72);

        // 4. In-memory record uses thumbnail
        const capturedPhoto = {
            ...photoInfo,
            dataUrl:   thumbDataUrl,
            timestamp: Date.now()
        };
        SESSION.capturedPhotos.push(capturedPhoto);

        // 5. Persist full-res to IndexedDB
        Storage.savePhoto({ ...capturedPhoto, dataUrl: fullDataUrl });
        Storage.saveSession(SESSION.toJSON());

        return capturedPhoto;
    },

    // ── Retake capture (same as captureAndStore but returns data, doesn't push) ──
    // Used by app.js retake flow to replace a specific index in capturedPhotos.
    captureRetake() {
        const video = Camera.videoElement;
        if (!video || !Camera.isActive()) throw new Error('Camera is not active');

        const { sx, sy, sw, sh } = this._getCropParams();

        // Full res
        this.canvas.width  = sw;
        this.canvas.height = sh;
        this.ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
        const fullDataUrl = this.canvas.toDataURL(CONFIG.photo.format, CONFIG.photo.quality);

        // Feedback
        this.triggerFlash();
        this.playShutterSound();
        this.animateCaptureButton();
        this.freezeFrame(fullDataUrl);

        // Thumbnail
        const scale = Math.min(1, 600 / sw);
        const tw = Math.round(sw * scale);
        const th = Math.round(sh * scale);
        this._thumbCanvas.width  = tw;
        this._thumbCanvas.height = th;
        this._thumbCtx.drawImage(video, sx, sy, sw, sh, 0, 0, tw, th);
        const thumbDataUrl = this._thumbCanvas.toDataURL('image/jpeg', 0.72);

        return { fullDataUrl, thumbDataUrl };
    },

    // ── Feedback helpers ───────────────────────────────────────────────────
    triggerFlash() {
        const overlay = document.getElementById('template-overlay');
        const flash = document.createElement('div');
        flash.className = 'absolute inset-0 bg-white flash-effect';
        overlay.appendChild(flash);
        setTimeout(() => flash.remove(), 300);
    },

    playShutterSound() {
        try {
            if (!this._audioCtx) {
                this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx        = this._audioCtx;
            const bufferSize = Math.round(ctx.sampleRate * 0.06);
            const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data       = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 4000;
            filter.Q.value = 1;
            const gain = ctx.createGain();
            gain.gain.value = 0.3;
            source.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            source.start();
        } catch (e) { /* audio not available */ }
    },

    freezeFrame(dataUrl) {
        const viewport = document.getElementById('camera-viewport');
        if (!viewport) return;
        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;z-index:5;transition:opacity 0.15s ease-out;';
        viewport.appendChild(img);
        setTimeout(() => {
            img.style.opacity = '0';
            setTimeout(() => img.remove(), 150);
        }, 250);
    },

    animateCaptureButton() {
        const btn = document.getElementById('capture-btn');
        if (!btn) return;
        btn.classList.remove('capture-pulse');
        void btn.offsetWidth; // force reflow
        btn.classList.add('capture-pulse');
        btn.addEventListener('animationend', () => btn.classList.remove('capture-pulse'), { once: true });
    },

    // ── Utility ───────────────────────────────────────────────────────────
    dataUrlToBlob(dataUrl) {
        const parts = dataUrl.split(',');
        const mime  = parts[0].match(/:(.*?);/)[1];
        const bstr  = atob(parts[1]);
        let n = bstr.length;
        const u8 = new Uint8Array(n);
        while (n--) u8[n] = bstr.charCodeAt(n);
        return new Blob([u8], { type: mime });
    }
};
