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

            // Minimal constraints - let the camera use its native settings
            // Only request back camera and high resolution, no forced aspect ratio
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 3840 },   // Request highest available resolution
                    height: { ideal: 2160 }
                },
                audio: false
            };

            // Use specific device if provided
            if (deviceId) {
                constraints.video = {
                    deviceId: { exact: deviceId },
                    width: { ideal: 3840 },
                    height: { ideal: 2160 }
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

    // Get video dimensions
    getDimensions() {
        if (!this.videoElement) return { width: 0, height: 0 };
        return {
            width: this.videoElement.videoWidth,
            height: this.videoElement.videoHeight
        };
    }
};
