/**
 * Oracle FAI Photos - Main Application
 * Initializes and coordinates all modules.
 * Supports session resume from IndexedDB/localStorage after crash/reload.
 */

const App = {
    // Initialize application
    async init() {
        console.log('Oracle FAI Photos - Initializing...');

        // Initialize modules
        Capture.init();
        await Storage.init();

        // Setup event listeners
        this.setupEventListeners();

        // Check for a saved session to resume
        await this.checkForResume();

        // Warn before leaving mid-session
        window.addEventListener('beforeunload', (e) => {
            if (SESSION.capturedPhotos.length > 0 && Screens.currentScreen === 'camera') {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        console.log('Oracle FAI Photos - Ready');
    },

    // Hardcoded credentials
    credentials: { username: 'admin', password: 'mitacqad123' },

    // Check for a previously saved session and prompt to resume
    async checkForResume() {
        const savedSession = Storage.loadSession();
        if (!savedSession || !savedSession.mode) return;

        const photoCount = await Storage.getPhotoCount();
        if (photoCount === 0) {
            // Session metadata exists but no photos - clean up
            await Storage.clearAll();
            return;
        }

        // Show resume modal with session details
        const modeText = savedSession.mode === 'pretest' ? 'Pretest FAI' : 'Packout FAI';
        document.getElementById('resume-mode').textContent = modeText;

        let pnSn = '';
        if (savedSession.partNumber) pnSn += `PN: ${savedSession.partNumber}`;
        if (savedSession.serialNumber) {
            if (pnSn) pnSn += ' | ';
            pnSn += `SN: ${savedSession.serialNumber}`;
        }
        document.getElementById('resume-pn-sn').textContent = pnSn || 'No PN/SN';
        document.getElementById('resume-photo-count').textContent = `${photoCount} photo${photoCount !== 1 ? 's' : ''} captured`;

        document.getElementById('resume-modal').classList.remove('hidden');
    },

    // Resume a saved session - restore state and go to camera
    async resumeSession() {
        document.getElementById('resume-modal').classList.add('hidden');

        const savedSession = Storage.loadSession();
        if (!savedSession) return;

        // Restore SESSION state from saved metadata
        SESSION.fromJSON(savedSession);

        // Load photos from IndexedDB
        const photos = await Storage.loadPhotos();

        // Match loaded photos back into capturedPhotos in queue order
        SESSION.capturedPhotos = [];
        for (const photo of photos) {
            SESSION.capturedPhotos.push(photo);
        }

        // Go to camera screen and resume
        Screens.show('camera');

        try {
            await Camera.init();
            await Camera.start();
            Screens.updateCameraUI();
            Screens.updateLastPhotoThumb();
        } catch (error) {
            console.error('Camera error on resume:', error);
            Screens.showError('Unable to access camera. Please ensure camera permissions are granted.');
            Screens.show('info');
        }
    },

    // Decline resume - clear saved data and start fresh
    async startFresh() {
        document.getElementById('resume-modal').classList.add('hidden');
        await Storage.clearAll();
    },

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

        // Gallery button (view captured photos mid-session)
        document.getElementById('gallery-btn').addEventListener('click', () => {
            Screens.openGallery();
        });

        document.getElementById('gallery-close-btn').addEventListener('click', () => {
            Screens.closeGallery();
        });

        // Photo preview modal
        document.getElementById('preview-close-btn').addEventListener('click', () => {
            Screens.closePhotoPreview();
        });

        document.getElementById('preview-retake-btn').addEventListener('click', () => {
            this.retakeSinglePhoto();
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

        // Resume modal
        document.getElementById('resume-continue-btn').addEventListener('click', () => {
            this.resumeSession();
        });

        document.getElementById('resume-fresh-btn').addEventListener('click', () => {
            this.startFresh();
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

        // Clear any stale data from a previous session
        await Storage.clearAll();

        // Persist initial session metadata
        Storage.saveSession(SESSION.toJSON());

        // Switch to camera screen
        Screens.show('camera');

        // Start camera
        try {
            await Camera.init();
            await Camera.start();
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
            // Check if we're in retake mode
            if (this._retakeIndex !== null) {
                // Retake: capture and replace the specific photo
                const photoInfo = SESSION.photoQueue[this._retakeQueueIndex];
                const dataUrl = Capture.capturePhoto();

                const retakenPhoto = {
                    ...photoInfo,
                    dataUrl: dataUrl,
                    timestamp: Date.now()
                };

                SESSION.capturedPhotos[this._retakeIndex] = retakenPhoto;

                // Update in IndexedDB
                Storage.savePhoto(retakenPhoto);
                Storage.saveSession(SESSION.toJSON());

                console.log('Photo retaken:', photoInfo.id);

                // Exit retake mode - restore original position
                SESSION.currentPhotoIndex = this._savedPhotoIndex;
                this._retakeIndex = null;
                this._retakeQueueIndex = null;
                this._savedPhotoIndex = null;

                Screens.updateCameraUI();
                Screens.updateLastPhotoThumb();
                return;
            }

            const photo = Capture.captureAndStore();
            console.log('Photo captured:', photo.filename);

            // Update thumbnail
            Screens.updateLastPhotoThumb();

            // Check if more photos to take
            if (SESSION.nextPhoto()) {
                // Persist updated index
                Storage.saveSession(SESSION.toJSON());
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
    skipPhoto() {
        // Move to next photo without capturing
        if (SESSION.nextPhoto()) {
            Storage.saveSession(SESSION.toJSON());
            Screens.updateCameraUI();
        } else {
            // All photos done, go to review
            Camera.stop();
            Screens.show('review');
            Screens.renderPhotosGrid();
        }
    },

    // Retake state
    _retakeIndex: null,       // Index in capturedPhotos being retaken
    _retakeQueueIndex: null,  // Index in photoQueue for the photo being retaken
    _savedPhotoIndex: null,   // Original queue position to restore after retake

    // Retake a single photo from the gallery preview
    retakeSinglePhoto() {
        const index = parseInt(document.getElementById('preview-retake-btn').dataset.index);
        const photo = SESSION.capturedPhotos[index];
        if (!photo) return;

        // Find this photo's position in the queue by matching ID
        const queueIndex = SESSION.photoQueue.findIndex(p => p.id === photo.id);

        // Save current position and enter retake mode
        this._retakeIndex = index;
        this._retakeQueueIndex = queueIndex >= 0 ? queueIndex : SESSION.currentPhotoIndex;
        this._savedPhotoIndex = SESSION.currentPhotoIndex;

        // Temporarily point to the retake photo so the template overlay shows correctly
        if (queueIndex >= 0) {
            SESSION.currentPhotoIndex = queueIndex;
        }

        // Close modals and update camera UI to show the retake photo's template
        Screens.closePhotoPreview();
        Screens.closeGallery();
        Screens.updateCameraUI();
    },

    // Retake a single photo directly from the gallery grid
    retakeSingleFromGallery(index) {
        const photo = SESSION.capturedPhotos[index];
        if (!photo) return;

        // Find this photo's position in the queue by matching ID
        const queueIndex = SESSION.photoQueue.findIndex(p => p.id === photo.id);

        // Save current position and enter retake mode
        this._retakeIndex = index;
        this._retakeQueueIndex = queueIndex >= 0 ? queueIndex : SESSION.currentPhotoIndex;
        this._savedPhotoIndex = SESSION.currentPhotoIndex;

        // Temporarily point to the retake photo so the template overlay shows correctly
        if (queueIndex >= 0) {
            SESSION.currentPhotoIndex = queueIndex;
        }

        // Close gallery and update camera UI to show the retake photo's template
        Screens.closeGallery();
        Screens.updateCameraUI();
    },

    // Retake selected photos (from review screen)
    retakeSelected() {
        const selectedIndices = Screens.getSelectedPhotos();

        if (selectedIndices.length === 0) {
            Screens.showError('Please select photos to retake.');
            return;
        }

        // Remove selected photos from captured list (in reverse order)
        selectedIndices.sort((a, b) => b - a).forEach(index => {
            const photo = SESSION.capturedPhotos[index];
            if (photo) {
                Storage.deletePhoto(photo.id);
            }
            SESSION.capturedPhotos.splice(index, 1);
        });

        Storage.saveSession(SESSION.toJSON());

        // Re-render grid
        Screens.renderPhotosGrid();
    },

    // Start new session - clear everything
    async startNewSession() {
        SESSION.reset();
        await Storage.clearAll();
        Screens.show('landing');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
