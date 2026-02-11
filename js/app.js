/**
 * Oracle FAI Photos - Main Application
 * Initializes and coordinates all modules
 */

const App = {
    // Initialize application
    async init() {
        console.log('Oracle FAI Photos - Initializing...');

        // Initialize modules
        Capture.init();

        // Setup event listeners
        this.setupEventListeners();

        console.log('Oracle FAI Photos - Ready');
    },

    // Hardcoded credentials
    credentials: { username: 'admin', password: 'mitacqad123' },

    // Setup all event listeners
    setupEventListeners() {
        // Login screen
        document.getElementById('login-btn').addEventListener('click', () => {
            this.handleLogin();
        });

        // Allow Enter key to submit login
        document.getElementById('login-password').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        document.getElementById('login-username').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('login-password').focus();
        });

        // Landing screen
        document.getElementById('start-btn').addEventListener('click', () => {
            Screens.show('mode');
        });

        // Mode selection screen
        document.getElementById('pretest-btn').addEventListener('click', () => {
            SESSION.mode = 'pretest';
            Screens.show('info');
            Screens.initInfoScreen();
        });

        document.getElementById('packout-btn').addEventListener('click', () => {
            SESSION.mode = 'packout';
            Screens.show('info');
            Screens.initInfoScreen();
        });

        document.getElementById('mode-back-btn').addEventListener('click', () => {
            Screens.show('landing');
        });

        // Info screen
        document.getElementById('info-back-btn').addEventListener('click', () => {
            Screens.show('mode');
        });

        document.getElementById('info-continue-btn').addEventListener('click', () => {
            this.startCameraSession();
        });

        // Component quantity input listeners (update photo count on change)
        for (const inputId of Object.keys(Screens.componentInputs)) {
            const el = document.getElementById(inputId);
            if (el) {
                el.addEventListener('input', () => {
                    Screens.updatePhotoCount();
                });
            }
        }

        // Packout door branding checkbox
        const doorBranding = document.getElementById('door-branding');
        if (doorBranding) {
            doorBranding.addEventListener('change', () => {
                Screens.updatePhotoCount();
            });
        }

        // Camera screen
        document.getElementById('camera-back-btn').addEventListener('click', () => {
            Camera.stop();
            Screens.show('info');
        });

        document.getElementById('capture-btn').addEventListener('click', () => {
            this.capturePhoto();
        });

        document.getElementById('skip-btn').addEventListener('click', () => {
            this.skipPhoto();
        });

        // Camera selection
        document.getElementById('camera-select').addEventListener('change', (e) => {
            if (e.target.value) {
                Camera.switchCamera(e.target.value);
            }
        });

        // Review screen
        document.getElementById('download-zip-btn').addEventListener('click', () => {
            Export.downloadZip();
        });

        document.getElementById('email-btn').addEventListener('click', () => {
            Export.emailZip();
        });

        document.getElementById('new-session-btn').addEventListener('click', () => {
            this.startNewSession();
        });

        document.getElementById('retake-btn').addEventListener('click', () => {
            this.retakeSelected();
        });

        // Error modal
        document.getElementById('error-close-btn').addEventListener('click', () => {
            Screens.hideError();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (Screens.currentScreen === 'camera' && e.code === 'Space') {
                e.preventDefault();
                this.capturePhoto();
            }
        });
    },

    // Handle login
    handleLogin() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        if (username === this.credentials.username && password === this.credentials.password) {
            errorEl.classList.add('hidden');
            Screens.show('landing');
        } else {
            errorEl.classList.remove('hidden');
        }
    },

    // Start camera session
    async startCameraSession() {
        // Get form values
        const formValues = Screens.getInfoFormValues();

        // Set session values
        SESSION.partNumber = formValues.partNumber;
        SESSION.serialNumber = formValues.serialNumber;

        // Set component quantities
        for (const [key, qty] of Object.entries(formValues.components)) {
            SESSION.components[key] = qty;
        }

        // Set packout options
        SESSION.hasDoorBranding = formValues.hasDoorBranding;

        // Initialize photo queue
        SESSION.initPhotoQueue();

        if (SESSION.photoQueue.length === 0) {
            Screens.showError('No photos to take. Please check your options.');
            return;
        }

        // Switch to camera screen
        Screens.show('camera');

        // Start camera with the orientation of the first photo
        try {
            await Camera.init();
            const firstPhoto = SESSION.getCurrentPhoto();
            const orientation = firstPhoto ? firstPhoto.orientation : 'portrait';
            await Camera.start(null, orientation);
            Screens.updateCameraUI();
        } catch (error) {
            console.error('Camera error:', error);
            Screens.showError('Unable to access camera. Please ensure camera permissions are granted.');
            Screens.show('info');
        }
    },

    // Capture photo
    async capturePhoto() {
        if (!Camera.isActive()) {
            Screens.showError('Camera is not active');
            return;
        }

        try {
            const photo = Capture.captureAndStore();
            console.log('Photo captured:', photo.filename);

            // Check if more photos to take
            if (SESSION.nextPhoto()) {
                // Check if orientation changed for next photo
                const nextPhoto = SESSION.getCurrentPhoto();
                if (nextPhoto && nextPhoto.orientation !== photo.orientation) {
                    await Camera.start(Camera.currentDeviceId, nextPhoto.orientation);
                }

                // Update UI for next photo
                Screens.updateCameraUI();
            } else {
                // All photos taken, go to review
                Camera.stop();
                Screens.show('review');
                Screens.renderPhotosGrid();
            }
        } catch (error) {
            console.error('Capture error:', error);
            Screens.showError('Failed to capture photo. Please try again.');
        }
    },

    // Skip current photo
    async skipPhoto() {
        const currentPhoto = SESSION.getCurrentPhoto();

        // Move to next photo without capturing
        if (SESSION.nextPhoto()) {
            // Check if orientation changed
            const nextPhoto = SESSION.getCurrentPhoto();
            if (nextPhoto && currentPhoto && nextPhoto.orientation !== currentPhoto.orientation) {
                await Camera.start(Camera.currentDeviceId, nextPhoto.orientation);
            }

            Screens.updateCameraUI();
        } else {
            // All photos done, go to review
            Camera.stop();
            Screens.show('review');
            Screens.renderPhotosGrid();
        }
    },

    // Retake selected photos
    retakeSelected() {
        const selectedIndices = Screens.getSelectedPhotos();

        if (selectedIndices.length === 0) {
            Screens.showError('Please select photos to retake.');
            return;
        }

        // Remove selected photos from captured list (in reverse order)
        selectedIndices.sort((a, b) => b - a).forEach(index => {
            SESSION.capturedPhotos.splice(index, 1);
        });

        // Re-render grid
        Screens.renderPhotosGrid();
    },

    // Start new session
    startNewSession() {
        SESSION.reset();
        Screens.show('landing');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
