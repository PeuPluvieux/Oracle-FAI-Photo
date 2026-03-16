/**
 * Oracle FAI Photos - Main Application
 * Initializes and coordinates all modules.
 * Supports session resume from IndexedDB/localStorage after crash/reload.
 */

const App = {
    // Initialize application
    async init() {
        console.log('Oracle FAI Photos - Initializing...');

        Capture.init();
        await Storage.init();
        this.setupEventListeners();
        await this.checkForResume();

        // Restore saved template opacity
        const savedOpacity = localStorage.getItem('templateOpacity');
        if (savedOpacity !== null) {
            this._templateOpacity = parseFloat(savedOpacity);
            this._applyTemplateOpacity();
        }

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
            this.acquireWakeLock();
            // Show torch button if supported
            const torchBtn = document.getElementById('torch-btn');
            if (torchBtn) torchBtn.classList.toggle('hidden', !Camera._torchSupported);
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

        // Packout component quantity inputs (update photo count on change)
        for (const inputId of Object.keys(Screens.packoutComponentInputs)) {
            const el = document.getElementById(inputId);
            if (el) {
                el.addEventListener('input', () => {
                    Screens.updatePhotoCount();
                });
                el.addEventListener('change', () => {
                    Screens.updatePhotoCount();
                });
            }
        }

        // Switch stack orientation modal buttons
        document.getElementById('switch-orient-portrait').addEventListener('click', () => {
            this.confirmSwitchOrientation('portrait');
        });
        document.getElementById('switch-orient-landscape').addEventListener('click', () => {
            this.confirmSwitchOrientation('landscape');
        });

        // Barcode scan buttons
        document.getElementById('scan-sn-btn').addEventListener('click', () => {
            this.startScan('serial-number', 'Serial Number (SN)');
        });
        document.getElementById('scanner-close-btn').addEventListener('click', () => {
            this.stopScan();
        });

        // Camera screen
        document.getElementById('camera-back-btn').addEventListener('click', () => {
            // Warn if photos have been captured - going back then hitting "Start Camera"
            // calls Storage.clearAll() which would delete everything
            if (SESSION.capturedPhotos.length > 0) {
                if (!confirm(`You have ${SESSION.capturedPhotos.length} photo(s) saved.\n\nGoing back will NOT delete them — you can resume this session from the home screen.\n\nContinue?`)) {
                    return;
                }
            }
            // Clear any pending retake state so it doesn't carry over
            this._retakeIndex = null;
            this._retakeQueueIndex = null;
            this._savedPhotoIndex = null;
            this._capturing = false;
            this._resetSkipBtn();
            Camera.stop();
            this.releaseWakeLock();
            Screens.show('info');
        });

        // Finish Early button
        document.getElementById('finish-early-btn').addEventListener('click', () => {
            this.finishEarly();
        });

        // Tap-to-focus on camera preview
        document.getElementById('camera-preview').addEventListener('click', (e) => {
            const video = e.target;
            const rect = video.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            // Show visual focus indicator
            this.showFocusIndicator(e.clientX, e.clientY);

            // Attempt hardware focus
            Camera.focusAtPoint(x, y);
        });

        document.getElementById('capture-btn').addEventListener('click', () => {
            this.capturePhoto();
        });

        // Skip button: two-tap protection — first tap arms it, second tap within 2s skips
        document.getElementById('skip-btn').addEventListener('click', () => {
            this.handleSkipTap();
        });

        // Template opacity toggle
        document.getElementById('opacity-toggle-btn').addEventListener('click', () => {
            this.cycleTemplateOpacity();
        });

        // Pinch-to-zoom on camera preview
        this._setupPinchZoom();

        // Gallery button (view captured photos mid-session)
        document.getElementById('gallery-btn').addEventListener('click', () => {
            Screens.openGallery();
        });

        document.getElementById('gallery-close-btn').addEventListener('click', () => {
            Screens.closeGallery();
            Camera.resume();
        });

        // Photo preview modal
        document.getElementById('preview-close-btn').addEventListener('click', () => {
            Screens.closePhotoPreview();
            Camera.resume();
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

        // Torch toggle
        document.getElementById('torch-btn').addEventListener('click', async () => {
            const on = await Camera.toggleTorch();
            const btn = document.getElementById('torch-btn');
            btn.classList.toggle('border-yellow-400', on);
            btn.classList.toggle('border-gray-500', !on);
            btn.querySelector('svg').classList.toggle('text-yellow-400', on);
            btn.querySelector('svg').classList.toggle('text-gray-400', !on);
        });

        // Auto-dismiss landscape prompt on device rotation
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                const isLandscape = window.innerWidth > window.innerHeight;
                const prompt = document.getElementById('landscape-prompt');
                if (!prompt) return;
                if (isLandscape) {
                    prompt.classList.add('hidden');
                } else {
                    const photo = SESSION.getCurrentPhoto();
                    prompt.classList.toggle('hidden', !(photo && photo.orientation === 'landscape'));
                }
            }, 150);
        });

        // Rotate selected photos on review screen
        document.getElementById('rotate-selected-btn').addEventListener('click', () => {
            this.rotateSelectedPhotos();
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

        // Reset switch orientations for fresh session
        SESSION.switchOrientations = {};

        // Start camera
        try {
            await Camera.init();
            await Camera.start();
            Screens.updateCameraUI();
            this.acquireWakeLock();
            // Show torch button if supported
            const torchBtn = document.getElementById('torch-btn');
            if (torchBtn) torchBtn.classList.toggle('hidden', !Camera._torchSupported);
        } catch (error) {
            console.error('Camera error:', error);
            Screens.showError('Unable to access camera. Please ensure camera permissions are granted.');
            Screens.show('info');
        }
    },

    // Capture photo
    async capturePhoto() {
        // Lock prevents double-tap or rapid presses firing two captures at once
        if (this._capturing) return;
        if (!Camera.isActive()) {
            Screens.showError('Camera is not active');
            return;
        }

        this._capturing = true;
        try {
            // Check if we're in retake mode
            if (this._retakeIndex !== null) {
                const photoInfo = SESSION.photoQueue[this._retakeQueueIndex];

                // Capture full-res (for IDB) + thumbnail (for memory)
                const { fullDataUrl, thumbDataUrl } = Capture.captureRetake();

                const retakenPhoto = { ...photoInfo, dataUrl: thumbDataUrl, timestamp: Date.now() };
                SESSION.capturedPhotos[this._retakeIndex] = retakenPhoto;

                Storage.savePhoto({ ...retakenPhoto, dataUrl: fullDataUrl });
                Storage.saveSession(SESSION.toJSON());
                console.log('Photo retaken:', photoInfo.id);

                SESSION.currentPhotoIndex = this._savedPhotoIndex;
                this._retakeIndex     = null;
                this._retakeQueueIndex = null;
                this._savedPhotoIndex  = null;

                Screens.updateCameraUI();
                Screens.updateLastPhotoThumb();
                return;
            }

            const photo = Capture.captureAndStore();
            console.log('Photo captured:', photo.filename);
            this._resetSkipBtn();

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
        } finally {
            // Always release lock so the next capture can proceed
            this._capturing = false;
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

    // Capture lock - prevents double-tap firing two captures simultaneously
    _capturing: false,

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
        Camera.resume();
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
        Camera.resume();
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

    // Rotate selected photos 90° clockwise (from review screen)
    async rotateSelectedPhotos() {
        const indices = Screens.getSelectedPhotos();
        if (indices.length === 0) { Screens.showError('Please select photos to rotate.'); return; }
        for (const i of indices) {
            const photo = SESSION.capturedPhotos[i];
            if (!photo) continue;
            const rotated = await Export.rotateImage90CW(photo.dataUrl);
            SESSION.capturedPhotos[i] = { ...photo, dataUrl: rotated };
            // Update full-res in IndexedDB too
            try {
                const all = await Storage.loadPhotos();
                const full = all.find(p => p.id === photo.id);
                if (full) {
                    const rotatedFull = await Export.rotateImage90CW(full.dataUrl);
                    Storage.savePhoto({ ...full, dataUrl: rotatedFull });
                }
            } catch (e) {}
        }
        Screens.renderPhotosGrid();
    },

    // Start new session - clear everything
    async startNewSession() {
        SESSION.reset();
        await Storage.clearAll();
        Screens.show('landing');
    },

    // Finish session early - confirm, stop camera, go to review
    finishEarly() {
        if (SESSION.capturedPhotos.length === 0) return;

        const count = SESSION.capturedPhotos.length;
        const total = SESSION.photoQueue.length;
        if (!confirm(`Finish with ${count} of ${total} photos?\nYou can resume later from the home screen.`)) {
            return;
        }

        Camera.stop();
        this.releaseWakeLock();
        Screens.show('review');
        Screens.renderPhotosGrid();
    },

    // ── Barcode Scanner ──────────────────────────────────────────
    _scannerReader: null,
    _scannerStream: null,
    _scannerAnimFrame: null,

    // Open scanner modal and start decoding for the given field
    async startScan(targetFieldId, fieldLabel) {
        document.getElementById('scanner-title').textContent = `Scan ${fieldLabel}`;
        document.getElementById('scanner-modal').classList.remove('hidden');

        // Request camera with higher resolution for better barcode reads
        const constraints = {
            audio: false,
            video: {
                facingMode: 'environment',
                width:  { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
            Screens.showError('Could not access camera for scanning. Check camera permissions.');
            this.stopScan();
            return;
        }

        this._scannerStream = stream;
        const videoEl = document.getElementById('scanner-video');
        videoEl.srcObject = stream;
        await videoEl.play();

        // Try native BarcodeDetector first (Chrome/Edge on Android — very fast)
        if ('BarcodeDetector' in window) {
            this._startNativeScan(targetFieldId, videoEl);
        } else if (typeof ZXing !== 'undefined') {
            this._startZxingScan(targetFieldId, videoEl, stream);
        } else {
            Screens.showError('Barcode scanner failed to load. Please check your internet connection.');
            this.stopScan();
        }
    },

    // Native BarcodeDetector API (Chrome on Android — near-instant)
    _startNativeScan(targetFieldId, videoEl) {
        const detector = new BarcodeDetector({
            formats: ['code_128', 'code_39', 'qr_code', 'data_matrix', 'pdf417']
        });

        const scan = async () => {
            if (!this._scannerStream) return; // stopped
            try {
                const barcodes = await detector.detect(videoEl);
                if (barcodes.length > 0) {
                    document.getElementById(targetFieldId).value = barcodes[0].rawValue;
                    this.stopScan();
                    return;
                }
            } catch { /* frame not ready yet */ }
            this._scannerAnimFrame = requestAnimationFrame(scan);
        };
        this._scannerAnimFrame = requestAnimationFrame(scan);
    },

    // ZXing fallback — restrict to relevant formats only (much faster than MultiFormat)
    _startZxingScan(targetFieldId, videoEl, stream) {
        const hints = new Map();
        hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
            ZXing.BarcodeFormat.CODE_128,
            ZXing.BarcodeFormat.CODE_39,
            ZXing.BarcodeFormat.QR_CODE,
            ZXing.BarcodeFormat.DATA_MATRIX
        ]);
        hints.set(ZXing.DecodeHintType.TRY_HARDER, true);

        const reader = new ZXing.BrowserMultiFormatReader(hints);
        this._scannerReader = reader;

        // Feed the already-open stream directly instead of re-opening camera
        reader.decodeFromStream(stream, videoEl, (result) => {
            if (result) {
                const text = result.getText ? result.getText() : String(result);
                document.getElementById(targetFieldId).value = text;
                this.stopScan();
            }
        });
    },

    // Stop scanner and release camera stream
    stopScan() {
        // Cancel native scan loop
        if (this._scannerAnimFrame) {
            cancelAnimationFrame(this._scannerAnimFrame);
            this._scannerAnimFrame = null;
        }
        // Stop ZXing reader
        if (this._scannerReader) {
            try { this._scannerReader.reset(); } catch (e) {}
            this._scannerReader = null;
        }
        // Release camera stream
        if (this._scannerStream) {
            this._scannerStream.getTracks().forEach(t => t.stop());
            this._scannerStream = null;
        }
        const video = document.getElementById('scanner-video');
        if (video) video.srcObject = null;
        document.getElementById('scanner-modal').classList.add('hidden');
    },

    // Show a yellow focus indicator at the tapped position
    showFocusIndicator(clientX, clientY) {
        const existing = document.querySelector('.focus-indicator');
        if (existing) existing.remove();
        const indicator = document.createElement('div');
        indicator.className = 'focus-indicator';
        indicator.style.left = clientX + 'px';
        indicator.style.top  = clientY + 'px';
        document.body.appendChild(indicator);
        indicator.addEventListener('animationend', () => indicator.remove());
    },

    // ── Screen Wake Lock ─────────────────────────────────────────────────
    _wakeLock: null,

    async acquireWakeLock() {
        if (!('wakeLock' in navigator)) return;
        try {
            this._wakeLock = await navigator.wakeLock.request('screen');
            // Re-acquire if page becomes visible again after being hidden
            document.addEventListener('visibilitychange', this._reacquireWakeLock.bind(this), { once: true });
        } catch (e) { /* wake lock not granted – screen may still dim */ }
    },

    async _reacquireWakeLock() {
        if (document.visibilityState === 'visible' && Screens.currentScreen === 'camera') {
            await this.acquireWakeLock();
        }
    },

    releaseWakeLock() {
        if (this._wakeLock) {
            this._wakeLock.release().catch(() => {});
            this._wakeLock = null;
        }
    },

    // ── Template opacity toggle ──────────────────────────────────────────
    _templateOpacity: 0.5,      // default 50%
    _opacitySteps: [0.5, 0.7, 0.2, 0],  // 50% → 70% → 20% → hidden → back

    cycleTemplateOpacity() {
        const idx = this._opacitySteps.indexOf(this._templateOpacity);
        this._templateOpacity = this._opacitySteps[(idx + 1) % this._opacitySteps.length];
        this._applyTemplateOpacity();
        localStorage.setItem('templateOpacity', this._templateOpacity);
    },

    _applyTemplateOpacity() {
        const overlay = document.getElementById('template-overlay');
        if (overlay) {
            // Set opacity on the container so it affects all content uniformly
            // (template <img> AND the fallback frame guide <div> for photos without templates)
            overlay.style.opacity = this._templateOpacity;
        }
        const label = document.getElementById('opacity-label');
        if (label) {
            const pct = Math.round(this._templateOpacity * 100);
            label.textContent = this._templateOpacity === 0 ? 'Off' : `${pct}%`;
        }
    },

    // ── Skip button two-tap protection ───────────────────────────────────
    _skipPending: false,
    _skipTimer: null,

    handleSkipTap() {
        const btn = document.getElementById('skip-btn');
        if (!this._skipPending) {
            // First tap: arm the button
            this._skipPending = true;
            btn.textContent = 'Confirm?';
            btn.classList.remove('skip-btn-idle');
            btn.classList.add('skip-btn-confirm');
            // Auto-reset after 2s if not confirmed
            this._skipTimer = setTimeout(() => this._resetSkipBtn(), 2000);
        } else {
            // Second tap: actually skip
            clearTimeout(this._skipTimer);
            this._resetSkipBtn();
            this.skipPhoto();
        }
    },

    _resetSkipBtn() {
        this._skipPending = false;
        clearTimeout(this._skipTimer);
        const btn = document.getElementById('skip-btn');
        if (btn) {
            btn.textContent = 'Skip';
            btn.classList.remove('skip-btn-confirm');
            btn.classList.add('skip-btn-idle');
        }
    },

    // ── Switch Stack Orientation Modal ────────────────────────────────────
    _pendingStackNum: null,

    // Called after updateCameraUI when in packout mode.
    // Shows orientation modal for the first AT photo of each new switch stack.
    checkSwitchOrientation() {
        const photo = SESSION.getCurrentPhoto();
        const match = photo?.id.match(/^SW(\d+)$/);
        if (!match) return;
        const n = parseInt(match[1]);
        if (SESSION.switchOrientations[n] !== undefined) return;
        document.getElementById('switch-orient-title').textContent = `Switch Stack ${n} orientation?`;
        document.getElementById('switch-orient-modal').classList.remove('hidden');
        this._pendingStackNum = n;
    },

    // Confirm orientation choice for the pending stack and update all its photos.
    confirmSwitchOrientation(orientation) {
        SESSION.setStackOrientation(this._pendingStackNum, orientation);
        this._pendingStackNum = null;
        document.getElementById('switch-orient-modal').classList.add('hidden');
        Screens.updateCameraUI();
    },

    // ── Pinch-to-zoom ────────────────────────────────────────────────────
    _pinchStartDist: 0,
    _pinchStartZoom: 1,

    _setupPinchZoom() {
        const preview = document.getElementById('camera-preview');

        preview.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                this._pinchStartDist = this._touchDist(e.touches);
                this._pinchStartZoom = Camera._zoomCurrent;
            }
        }, { passive: false });

        preview.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 2) return;
            e.preventDefault();

            if (!Camera._zoomSupported) return;

            const dist  = this._touchDist(e.touches);
            const scale = dist / this._pinchStartDist;
            const newZoom = Math.max(Camera._zoomMin,
                            Math.min(Camera._zoomMax, this._pinchStartZoom * scale));

            Camera.setZoom(newZoom);
            this._showZoomIndicator(newZoom);
        }, { passive: false });
    },

    _touchDist(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    },

    _zoomHideTimer: null,
    _showZoomIndicator(zoom) {
        const el = document.getElementById('zoom-indicator');
        if (!el) return;
        el.textContent = `${zoom.toFixed(1)}×`;
        el.classList.remove('hidden');
        el.style.opacity = '1';
        clearTimeout(this._zoomHideTimer);
        this._zoomHideTimer = setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => el.classList.add('hidden'), 300);
        }, 1500);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
