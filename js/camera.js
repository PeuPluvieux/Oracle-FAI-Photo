/**
 * Oracle FAI Photos - Camera Module
 * Handles camera access, device selection, video stream, and auto-recovery.
 *
 * Uses minimal constraints so the camera behaves like the native camera app
 * (no zoom, native colors/quality). All photos are portrait - no orientation switching.
 * Auto-recovers the stream when the user returns from a tab switch.
 */

const Camera = {
    stream: null,
    videoElement: null,
    devices: [],
    currentDeviceId: null,
    _visibilityHandler: null,
    _focusSupported: false,
    // Zoom
    _zoomSupported: false,
    // Torch
    _torchSupported: false,
    _torchEnabled: false,
    _zoomMin: 1,
    _zoomMax: 1,
    _zoomCurrent: 1,

    // Initialize camera module
    async init() {
        this.videoElement = document.getElementById('camera-preview');
        await this.loadDevices();
        this.setupDeviceSelector();
    },

    // Get list of video input devices
    async loadDevices() {
        try {
            // Request permission first to get device labels
            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
            tempStream.getTracks().forEach(track => track.stop());

            const allDevices = await navigator.mediaDevices.enumerateDevices();
            this.devices = allDevices.filter(device => device.kind === 'videoinput');
            console.log('Available cameras:', this.devices);
        } catch (error) {
            console.error('Error loading devices:', error);
            throw error;
        }
    },

    // Setup camera selection dropdown
    setupDeviceSelector() {
        const select = document.getElementById('camera-select');
        select.innerHTML = '';

        if (this.devices.length === 0) {
            select.innerHTML = '<option value="">No cameras found</option>';
            return;
        }

        this.devices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Camera ${index + 1}`;
            select.appendChild(option);
        });
    },

    // Start camera stream
    // Uses minimal constraints to get native camera feel (no forced zoom/crop)
    async start(deviceId = null) {
        try {
            // Stop any existing stream (but don't remove visibility handler yet)
            this._stopStream();

            // Request 4:3 aspect ratio - matches native camera app's 4:3 mode
            // This gives the same field of view as the native camera
            const constraints = {
                video: {
                    facingMode: 'environment',
                    aspectRatio: { ideal: 4 / 3 },
                    width: { ideal: 4032 },
                    height: { ideal: 3024 }
                },
                audio: false
            };

            // Use specific device if provided
            if (deviceId) {
                constraints.video = {
                    deviceId: { exact: deviceId },
                    aspectRatio: { ideal: 4 / 3 },
                    width: { ideal: 4032 },
                    height: { ideal: 3024 }
                };
            }

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();

            // Update current device ID
            const videoTrack = this.stream.getVideoTracks()[0];
            this.currentDeviceId = videoTrack.getSettings().deviceId;

            // Update selector to match current device
            const select = document.getElementById('camera-select');
            select.value = this.currentDeviceId;

            const actualSettings = videoTrack.getSettings();
            console.log(`Camera started: ${videoTrack.label} - ${actualSettings.width}x${actualSettings.height}`);

            // Check device capabilities (focus + zoom)
            this._checkCapabilities();

            // Install visibility handler for auto-recovery
            this._installVisibilityHandler();

            return true;
        } catch (error) {
            console.error('Error starting camera:', error);
            throw error;
        }
    },

    // Switch to different camera
    async switchCamera(deviceId) {
        if (deviceId !== this.currentDeviceId) {
            await this.start(deviceId);
        }
    },

    // Auto-recover camera after tab switch kills the stream
    async recover() {
        if (this.isActive()) return; // Stream is fine, nothing to do

        console.log('Camera stream lost, attempting recovery...');
        try {
            await this.start(this.currentDeviceId);
            console.log('Camera recovered successfully');
        } catch (err) {
            console.error('Camera recovery failed:', err);
        }
    },

    // Stop camera stream and remove visibility handler
    stop() {
        this._stopStream();
        this._removeVisibilityHandler();
    },

    // Stop the media stream only (internal)
    _stopStream() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
    },

    // Install visibilitychange listener for auto-recovery
    _installVisibilityHandler() {
        // Don't double-install
        if (this._visibilityHandler) return;

        this._visibilityHandler = () => {
            if (document.visibilityState === 'visible') {
                this.recover();
            }
        };
        document.addEventListener('visibilitychange', this._visibilityHandler);
    },

    // Remove visibilitychange listener
    _removeVisibilityHandler() {
        if (this._visibilityHandler) {
            document.removeEventListener('visibilitychange', this._visibilityHandler);
            this._visibilityHandler = null;
        }
    },

    // Check if camera is active
    isActive() {
        return this.stream !== null && this.stream.active;
    },

    // Ensure video is playing - call after closing any modal overlay on iOS
    // Stream may still be active but video element can pause under a modal
    async resume() {
        if (!this.isActive()) {
            // Stream was lost - full restart
            await this.start(this.currentDeviceId);
        } else if (this.videoElement && this.videoElement.paused) {
            // Stream fine but video paused - just unpause
            try { await this.videoElement.play(); } catch (e) {}
        }
    },

    // Get video dimensions
    getDimensions() {
        if (!this.videoElement) return { width: 0, height: 0 };
        return {
            width: this.videoElement.videoWidth,
            height: this.videoElement.videoHeight
        };
    },

    // Check device capabilities: focus and zoom
    _checkCapabilities() {
        this._focusSupported = false;
        this._zoomSupported  = false;
        this._zoomMin        = 1;
        this._zoomMax        = 1;
        this._zoomCurrent    = 1;
        this._torchSupported = false;

        if (!this.stream) return;
        const track = this.stream.getVideoTracks()[0];
        if (!track) return;

        try {
            const cap = track.getCapabilities();
            if (cap) {
                if (cap.focusMode && cap.focusMode.includes('manual')) {
                    this._focusSupported = true;
                }
                if (cap.zoom) {
                    this._zoomSupported = true;
                    this._zoomMin = cap.zoom.min || 1;
                    this._zoomMax = cap.zoom.max || 1;
                    this._zoomCurrent = track.getSettings().zoom || 1;
                }
                if (cap.torch) this._torchSupported = true;
            }
        } catch (e) { /* getCapabilities not available */ }

        console.log(`Zoom supported: ${this._zoomSupported} (${this._zoomMin}–${this._zoomMax})`);
        console.log(`Focus supported: ${this._focusSupported}`);
        console.log(`Torch supported: ${this._torchSupported}`);
    },

    // Apply a zoom level (clamped to device min/max)
    async setZoom(level) {
        if (!this._zoomSupported || !this.stream) return;
        const track = this.stream.getVideoTracks()[0];
        if (!track) return;

        const clamped = Math.max(this._zoomMin, Math.min(this._zoomMax, level));
        try {
            await track.applyConstraints({ advanced: [{ zoom: clamped }] });
            this._zoomCurrent = clamped;
        } catch (e) { /* zoom constraint not accepted */ }
    },

    // Attempt hardware focus at normalised (x, y) coordinates (0–1)
    async focusAtPoint(x, y) {
        if (!this.stream) return;
        const track = this.stream.getVideoTracks()[0];
        if (!track) return;
        try {
            await track.applyConstraints({ advanced: [{ pointOfInterest: { x, y } }] });
        } catch (e) { /* visual indicator still shows even without hardware focus */ }
    },

    // Toggle torch/flashlight on supported devices
    async toggleTorch() {
        if (!this._torchSupported || !this.stream) return;
        this._torchEnabled = !this._torchEnabled;
        const track = this.stream.getVideoTracks()[0];
        if (!track) return;
        try {
            await track.applyConstraints({ advanced: [{ torch: this._torchEnabled }] });
        } catch (e) { this._torchEnabled = !this._torchEnabled; }
        return this._torchEnabled;
    }
};
