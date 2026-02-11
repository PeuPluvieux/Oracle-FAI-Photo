/**
 * Oracle FAI Photos - Camera Module
 * Handles camera access, device selection, video stream, and orientation
 *
 * Uses minimal constraints so the camera behaves like the native camera app
 * (no zoom, native colors/quality). Aspect ratio cropping is handled at
 * capture time only, not on the live preview.
 */

const Camera = {
    stream: null,
    videoElement: null,
    devices: [],
    currentDeviceId: null,
    currentOrientation: 'portrait', // 'portrait' or 'landscape'

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

    // Get photo settings for current orientation
    getPhotoSettings(orientation) {
        const orient = orientation || this.currentOrientation;
        return CONFIG.photo[orient] || CONFIG.photo.portrait;
    },

    // Start camera with specific device and orientation
    // Uses minimal constraints to get native camera feel (no forced zoom/crop)
    async start(deviceId = null, orientation = 'portrait') {
        try {
            // Stop any existing stream
            this.stop();

            this.currentOrientation = orientation;

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
                // When selecting a specific device, drop facingMode
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
            console.log(`Camera started (${orientation}): ${videoTrack.label} - ${actualSettings.width}x${actualSettings.height}`);
            return true;
        } catch (error) {
            console.error('Error starting camera:', error);
            throw error;
        }
    },

    // Switch to different camera (keep current orientation)
    async switchCamera(deviceId) {
        if (deviceId !== this.currentDeviceId) {
            await this.start(deviceId, this.currentOrientation);
        }
    },

    // Stop camera stream
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
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
