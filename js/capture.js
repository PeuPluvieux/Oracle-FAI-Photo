/**
 * Oracle FAI Photos - Capture Module
 * Handles photo capture from video stream (without overlay)
 * Supports portrait and landscape orientations
 */

const Capture = {
    canvas: null,
    ctx: null,

    // Initialize capture module
    init() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    },

    // Capture photo from video stream
    // IMPORTANT: This captures the raw video - no template/overlay included
    capturePhoto() {
        const video = Camera.videoElement;

        if (!video || !Camera.isActive()) {
            throw new Error('Camera is not active');
        }

        // Get orientation-specific settings from current photo
        const currentPhoto = SESSION.getCurrentPhoto();
        const orientation = currentPhoto ? currentPhoto.orientation : Camera.currentOrientation;
        const settings = Camera.getPhotoSettings(orientation);

        // Set canvas to desired output size
        this.canvas.width = settings.width;
        this.canvas.height = settings.height;

        // Calculate source dimensions to maintain aspect ratio
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const videoAspect = videoWidth / videoHeight;
        const targetAspect = settings.aspectRatio;

        let sx, sy, sw, sh;

        if (videoAspect > targetAspect) {
            // Video is wider - crop sides
            sh = videoHeight;
            sw = videoHeight * targetAspect;
            sx = (videoWidth - sw) / 2;
            sy = 0;
        } else {
            // Video is taller - crop top/bottom
            sw = videoWidth;
            sh = videoWidth / targetAspect;
            sx = 0;
            sy = (videoHeight - sh) / 2;
        }

        // Draw video frame to canvas (no overlay!)
        this.ctx.drawImage(
            video,
            sx, sy, sw, sh,           // Source rectangle
            0, 0, this.canvas.width, this.canvas.height  // Destination
        );

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

        // Store captured photo
        const capturedPhoto = {
            ...photoInfo,
            dataUrl: dataUrl,
            timestamp: Date.now()
        };

        SESSION.capturedPhotos.push(capturedPhoto);

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
