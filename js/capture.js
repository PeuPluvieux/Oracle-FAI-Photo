/**
 * Oracle FAI Photos - Capture Module
 * Captures the full camera frame without cropping.
 * Saves to IndexedDB immediately after capture via Storage module.
 */

const Capture = {
    canvas: null,
    ctx: null,

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

        // Trigger flash effect
        this.triggerFlash();

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
