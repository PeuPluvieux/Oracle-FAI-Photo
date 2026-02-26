/**
 * Oracle FAI Photos - Capture Module
 * Captures the full camera frame without cropping.
 * Saves to IndexedDB immediately after capture via Storage module.
 */

const Capture = {
    canvas: null,
    ctx: null,
    _audioCtx: null,

    // Initialize capture module
    init() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    },

    // Capture photo from video stream - full frame, no cropping
    capturePhoto() {
        const video = Camera.videoElement;

        if (!video || !Camera.isActive()) {
            throw new Error('Camera is not active');
        }

        // Use full camera resolution - no aspect ratio cropping
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        this.canvas.width = videoWidth;
        this.canvas.height = videoHeight;

        // Draw full video frame to canvas
        this.ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

        // Convert to data URL
        const dataUrl = this.canvas.toDataURL(CONFIG.photo.format, CONFIG.photo.quality);

        // Trigger all capture feedback simultaneously
        this.triggerFlash();
        this.playShutterSound();
        this.animateCaptureButton();
        this.freezeFrame(dataUrl);

        return dataUrl;
    },

    // Trigger visual flash effect
    triggerFlash() {
        const overlay = document.getElementById('template-overlay');
        const flash = document.createElement('div');
        flash.className = 'absolute inset-0 bg-white flash-effect';
        overlay.appendChild(flash);

        setTimeout(() => {
            flash.remove();
        }, 300);
    },

    // Capture and store current photo
    captureAndStore() {
        const photoInfo = SESSION.getCurrentPhoto();
        if (!photoInfo) {
            console.error('No photo in queue');
            return null;
        }

        const dataUrl = this.capturePhoto();

        // Store captured photo in session
        const capturedPhoto = {
            ...photoInfo,
            dataUrl: dataUrl,
            timestamp: Date.now()
        };

        SESSION.capturedPhotos.push(capturedPhoto);

        // Fire-and-forget save to IndexedDB
        Storage.savePhoto(capturedPhoto);

        // Persist updated session metadata
        Storage.saveSession(SESSION.toJSON());

        return capturedPhoto;
    },

    // Play a short shutter click sound via Web Audio API
    playShutterSound() {
        try {
            if (!this._audioCtx) {
                this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = this._audioCtx;
            const duration = 0.06;
            const bufferSize = ctx.sampleRate * duration;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
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
        } catch (e) {
            // Audio not available - silent fallback
        }
    },

    // Show captured frame over live video briefly
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

    // Animate the capture button with a shrink-bounce pulse
    animateCaptureButton() {
        const btn = document.getElementById('capture-btn');
        if (!btn) return;
        btn.classList.remove('capture-pulse');
        // Force reflow to restart animation
        void btn.offsetWidth;
        btn.classList.add('capture-pulse');
        btn.addEventListener('animationend', () => {
            btn.classList.remove('capture-pulse');
        }, { once: true });
    },

    // Convert data URL to Blob
    dataUrlToBlob(dataUrl) {
        const parts = dataUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new Blob([u8arr], { type: mime });
    }
};
