/**
 * L11 FAI Photos - Main Application
 * Initializes and coordinates all modules.
 * Supports session resume from IndexedDB/localStorage after crash/reload.
 */

const App = {
    // Initialize application
    async init() {
        console.log('L11 FAI Photos - Initializing...');

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

        console.log('L11 FAI Photos - Ready');
    },

    // Auth — PBKDF2(SHA-256, 100k iterations) of the login password
    // To change the password: run scripts/hash-password.js and paste new values here
    _auth: {
        username:   'admin',
        saltHex:    '11142069afa31d6ff23bb597b52383a5',
        hashHex:    'ac87d9cd3ea3322d4014aeef96981ca847d87c42caa5dad968d6ca0bf32570f2',
        iterations: 100000
    },
    _loginFailures:    0,
    _loginLockedUntil: null,

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

        const rackLabel = (CONFIG.rackTypes[savedSession.rackType] || {}).label || savedSession.rackType || '';
        document.getElementById('resume-rack-type').textContent = rackLabel;
        document.getElementById('resume-modal').classList.remove('hidden');
    },

    // Resume a saved session - restore state and go to camera
    async resumeSession() {
        document.getElementById('resume-modal').classList.add('hidden');

        const savedSession = Storage.loadSession();
        if (!savedSession) return;

        // Restore SESSION state from saved metadata
        SESSION.fromJSON(savedSession);

        // Re-initialize pills with correct labels for the restored mode
        Screens._initSectionPills();

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
        // Select-all on focus for all number inputs (static + dynamic)
        document.addEventListener('focusin', e => {
            if (e.target.matches('input[type="number"]')) e.target.select();
        });

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

        document.getElementById('logout-btn').addEventListener('click', async () => {
            SESSION.reset();
            await Storage.clearAll();
            Screens.show('login');
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
            if (SESSION.mode === 'packout') {
                this._showPackoutChecklist();
            } else {
                this.startCameraSession();
            }
        });

        // Component quantity input listeners — event delegation on the container so dynamically
        // rendered selects (including new Template Maker components) are covered automatically.
        const pretestOptionsEl = document.getElementById('pretest-options');
        if (pretestOptionsEl) {
            pretestOptionsEl.addEventListener('change', e => {
                if (e.target.tagName === 'SELECT' && e.target.id.startsWith('qty-')) {
                    Screens.updatePhotoCount();
                }
            });
        }

        // Packout door branding checkbox
        const doorBranding = document.getElementById('door-branding');
        if (doorBranding) {
            doorBranding.addEventListener('change', () => Screens.updatePhotoCount());
        }

        // Packout simple count inputs (pkServers, pkSwitches, pkAkPns)
        for (const inputId of Object.keys(Screens.packoutComponentInputs)) {
            const el = document.getElementById(inputId);
            if (el) {
                el.addEventListener('input',  () => Screens.updatePhotoCount());
                el.addEventListener('change', () => Screens.updatePhotoCount());
            }
        }

        // When server group or switch stack count changes, re-render per-group AT rows
        ['qty-pk-servers', 'qty-pk-switches'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input',  () => Screens.updatePhotoCount());
                el.addEventListener('change', () => Screens.updatePhotoCount());
            }
        });

        // Rack type dropdown
        document.getElementById('rack-type').addEventListener('change', (e) => {
            SESSION.rackType = e.target.value;
            Screens.updatePhotoCount();
        });

        // Start-From section selector buttons
        document.querySelectorAll('.start-section-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.start-section-btn').forEach(b => {
                    b.classList.remove('active-section-btn', 'bg-oracle-accent', 'border-oracle-accent', 'text-white');
                    b.classList.add('bg-gray-700', 'border-gray-600', 'text-gray-300');
                });
                btn.classList.add('active-section-btn', 'bg-oracle-accent', 'border-oracle-accent', 'text-white');
                btn.classList.remove('bg-gray-700', 'border-gray-600', 'text-gray-300');
                SESSION.startSection = btn.dataset.startSection || null;
                Screens.updatePhotoCount();
            });
        });

        // Add custom component button
        const addCustomBtn = document.getElementById('add-custom-component');
        if (addCustomBtn) {
            addCustomBtn.addEventListener('click', () => {
                this._customComponentValues.push({ name: '', units: 1, frontATs: 0, rearATs: 0 });
                this._renderCustomComponentRows();
                this._syncPackoutAtArrays();
                document.getElementById('total-photo-count').textContent = SESSION.calculateTotalPhotos();
            });
        }

        // Save Now button
        document.getElementById('save-now-btn')?.addEventListener('click', () => this.saveNow());

        // Already-captured banner buttons
        document.getElementById('already-keep-btn')?.addEventListener('click', () => {
            document.getElementById('already-captured-banner').classList.add('hidden');
            this.skipPhoto();
        });
        document.getElementById('already-retake-btn')?.addEventListener('click', () => {
            const photo = SESSION.getCurrentPhoto();
            if (!photo) return;
            const capturedIndex = SESSION.capturedPhotos.findIndex(p => p.id === photo.id);
            if (capturedIndex >= 0) {
                this._retakeIndex      = capturedIndex;
                this._retakeQueueIndex = SESSION.currentPhotoIndex;
                // After retake completes, advance to the next uncaptured photo
                this._savedPhotoIndex  = SESSION.currentPhotoIndex + 1 < SESSION.photoQueue.length
                    ? SESSION.currentPhotoIndex + 1
                    : SESSION.currentPhotoIndex;
            }
            document.getElementById('already-captured-banner').classList.add('hidden');
            Screens.updateCameraUI();
        });

        // Packout pre-start checklist — checkbox change → update confirm button state
        ['chk-ppa', 'chk-snap1', 'chk-panels', 'chk-backdrop'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => this._updateChecklistBtn());
        });

        // Packout checklist confirm button
        document.getElementById('checklist-confirm-btn')?.addEventListener('click', () => {
            document.getElementById('packout-checklist-modal').classList.add('hidden');
            this.startCameraSession();
        });

        // Packout snapshot gate confirm button
        document.getElementById('snapshot-gate-confirm-btn')?.addEventListener('click', () => {
            const photo = SESSION.getCurrentPhoto();
            if (photo?.section === 'bagged_rack')    SESSION.checkpointBagging = true;
            if (photo?.section === 'rack_in_carton') SESSION.checkpointCarton  = true;
            Storage.saveSession(SESSION.toJSON());
            document.getElementById('snapshot-gate-modal').classList.add('hidden');
            Camera.resume();
        });

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
        document.getElementById('scanner-manual-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.stopScan();
            document.getElementById('serial-number').focus();
        });
        document.getElementById('scanner-torch-btn').addEventListener('click', () => {
            this._toggleTorch();
        });

        // Camera screen
        document.getElementById('camera-back-btn').addEventListener('click', () => {
            // If mid-retake, show choice dialog instead of going back immediately
            if (this._savedPhotoIndex !== null) {
                document.getElementById('retake-choice-modal').classList.remove('hidden');
                return;
            }
            // Warn if photos have been captured - going back then hitting "Start Camera"
            // calls Storage.clearAll() which would delete everything
            if (SESSION.capturedPhotos.length > 0) {
                if (!confirm(`You have ${SESSION.capturedPhotos.length} photo(s) saved.\n\nGoing back will NOT delete them — you can resume this session from the home screen.\n\nContinue?`)) {
                    return;
                }
            }
            this._capturing = false;
            this._resetSkipBtn();
            Camera.stop();
            this.releaseWakeLock();
            Screens.show('info');
        });

        // Retake choice modal buttons
        document.getElementById('retake-continue-btn').addEventListener('click', () => {
            SESSION.currentPhotoIndex = this._savedPhotoIndex;
            this._retakeIndex = null;
            this._retakeQueueIndex = null;
            this._savedPhotoIndex = null;
            this._capturing = false;
            this._resetSkipBtn();
            document.getElementById('retake-choice-modal').classList.add('hidden');
            Camera.stop();
            this.releaseWakeLock();
            Screens.show('info');
        });

        document.getElementById('retake-restart-btn').addEventListener('click', () => {
            this._retakeIndex = null;
            this._retakeQueueIndex = null;
            this._savedPhotoIndex = null;
            this._capturing = false;
            this._resetSkipBtn();
            document.getElementById('retake-choice-modal').classList.add('hidden');
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

        // Auto-hide landscape prompt after flash animation completes
        document.getElementById('landscape-prompt').addEventListener('animationend', (e) => {
            if (e.animationName !== 'landscape-prompt-flash') return;
            const prompt = document.getElementById('landscape-prompt');
            prompt.classList.add('hidden');
            prompt.classList.remove('landscape-prompt-active');
        });

        // Rotate selected photos on review screen
        document.getElementById('rotate-ccw-btn').addEventListener('click', () => {
            this.rotateSelectedPhotos('ccw');
        });
        document.getElementById('rotate-cw-btn').addEventListener('click', () => {
            this.rotateSelectedPhotos('cw');
        });

        // Rotate photo from preview modal
        document.getElementById('preview-rotate-ccw-btn').addEventListener('click', () => {
            this.rotatePreviewPhoto('ccw');
        });
        document.getElementById('preview-rotate-cw-btn').addEventListener('click', () => {
            this.rotatePreviewPhoto('cw');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (Screens.currentScreen === 'camera' && e.code === 'Space') {
                e.preventDefault();
                this.capturePhoto();
            }
        });
    },

    // Derive PBKDF2 hash from a plaintext password + hex salt
    async _hashPassword(password, saltHex, iterations) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
        );
        const saltBytes = new Uint8Array(saltHex.match(/../g).map(h => parseInt(h, 16)));
        const bits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
            keyMaterial, 256
        );
        return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // Escape HTML special characters before inserting user content into innerHTML
    _escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    // Handle login — async PBKDF2 comparison with rate limiting
    async handleLogin() {
        const errorEl = document.getElementById('login-error');

        // Rate limiting: block if locked out
        if (this._loginLockedUntil && Date.now() < this._loginLockedUntil) {
            const secs = Math.ceil((this._loginLockedUntil - Date.now()) / 1000);
            errorEl.textContent = `Too many attempts. Try again in ${secs}s.`;
            errorEl.classList.remove('hidden');
            return;
        }

        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        const derived = await this._hashPassword(password, this._auth.saltHex, this._auth.iterations);
        if (username === this._auth.username && derived === this._auth.hashHex) {
            this._loginFailures = 0;
            errorEl.classList.add('hidden');
            Screens.show('landing');
        } else {
            this._loginFailures++;
            if (this._loginFailures >= 5) {
                this._loginLockedUntil = Date.now() + 30_000;
                this._loginFailures = 0;
            }
            errorEl.textContent = 'Invalid username or password.';
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

        // Sync per-group AT arrays into SESSION (packout only)
        if (SESSION.mode === 'packout') this._syncPackoutAtArrays();

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

                Screens.updateLastPhotoThumb();
                Storage.saveSession(SESSION.toJSON());

                // If the restored index is past the end of the queue, go to review
                if (SESSION.currentPhotoIndex >= SESSION.photoQueue.length) {
                    Camera.stop();
                    Screens.show('review');
                    Screens.renderPhotosGrid();
                } else {
                    Screens.updateCameraUI();
                }
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

    // Per-group AT values (maintained by dynamic row renderers)
    _serverAtValues: [],        // [{ front: N, rear: N }, ...] — one per server group
    _switchAtValues: [],        // [{ front: N, rear: N }, ...] — one per switch stack
    _customComponentValues: [], // [{ name, units, frontATs, rearATs }, ...]

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

    // Rotate selected photos from review screen — dir: 'cw' or 'ccw'
    async rotateSelectedPhotos(dir) {
        const indices = Screens.getSelectedPhotos();
        if (indices.length === 0) { Screens.showError('Please select photos to rotate.'); return; }
        const rotateFn = dir === 'ccw' ? Export.rotateImage90CCW.bind(Export) : Export.rotateImage90CW.bind(Export);
        for (const i of indices) {
            const photo = SESSION.capturedPhotos[i];
            if (!photo) continue;
            const rotated = await rotateFn(photo.dataUrl);
            SESSION.capturedPhotos[i] = { ...photo, dataUrl: rotated };
            try {
                const all = await Storage.loadPhotos();
                const full = all.find(p => p.id === photo.id);
                if (full) {
                    const rotatedFull = await rotateFn(full.dataUrl);
                    Storage.savePhoto({ ...full, dataUrl: rotatedFull });
                }
            } catch (e) {}
        }
        Screens.renderPhotosGrid();
    },

    // Rotate the currently-previewed photo (called from preview modal rotate buttons)
    async rotatePreviewPhoto(dir) {
        const index = parseInt(document.getElementById('preview-retake-btn').dataset.index);
        const photo = SESSION.capturedPhotos[index];
        if (!photo) return;
        const rotateFn = dir === 'ccw' ? Export.rotateImage90CCW.bind(Export) : Export.rotateImage90CW.bind(Export);
        const rotated = await rotateFn(photo.dataUrl);
        SESSION.capturedPhotos[index] = { ...photo, dataUrl: rotated };
        // Update preview image immediately
        document.getElementById('preview-photo-img').src = rotated;
        // Update full-res in IndexedDB too
        try {
            const all = await Storage.loadPhotos();
            const full = all.find(p => p.id === photo.id);
            if (full) {
                const rotatedFull = await rotateFn(full.dataUrl);
                Storage.savePhoto({ ...full, dataUrl: rotatedFull });
            }
        } catch (e) {}
    },

    // Start new session - clear everything
    async startNewSession() {
        Camera.stop();           // release stream if still running
        this.releaseWakeLock();
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

    // ── Per-group AT row rendering ────────────────────────────────────────

    // Render per-server-group AT input rows; preserves existing values when count changes
    _renderServerAtRows() {
        const n = parseInt(document.getElementById('qty-pk-servers')?.value) || 0;
        const container = document.getElementById('pk-server-at-rows');
        if (!container) return;
        const existing = this._serverAtValues;
        this._serverAtValues = Array.from({ length: n }, (_, i) => existing[i] || { front: 0, rear: 0 });
        if (n === 0) { container.innerHTML = ''; return; }
        container.innerHTML = this._serverAtValues.map((v, i) => `
            <div class="flex items-center gap-2 p-2 bg-gray-700 rounded-lg text-xs">
                <span class="text-gray-300 font-semibold w-16 shrink-0">Group ${i + 1}</span>
                <label class="text-gray-400 shrink-0">Front ATs</label>
                <input type="number" min="0" max="20" value="${v.front}"
                    class="w-12 px-1 py-1 rounded bg-gray-600 border border-gray-500 text-white text-center focus:outline-none focus:border-oracle-accent"
                    data-group="${i}" data-side="front">
                <label class="text-gray-400 shrink-0">Rear ATs</label>
                <input type="number" min="0" max="20" value="${v.rear}"
                    class="w-12 px-1 py-1 rounded bg-gray-600 border border-gray-500 text-white text-center focus:outline-none focus:border-oracle-accent"
                    data-group="${i}" data-side="rear">
            </div>`).join('');
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                const g = parseInt(input.dataset.group);
                this._serverAtValues[g][input.dataset.side] = parseInt(input.value) || 0;
                this._syncPackoutAtArrays();
                document.getElementById('total-photo-count').textContent = SESSION.calculateTotalPhotos();
            });
        });
    },

    // Render per-switch-stack AT input rows; preserves existing values when count changes
    _renderSwitchAtRows() {
        const n = parseInt(document.getElementById('qty-pk-switches')?.value) || 0;
        const container = document.getElementById('pk-switch-at-rows');
        if (!container) return;
        const existing = this._switchAtValues;
        this._switchAtValues = Array.from({ length: n }, (_, i) => existing[i] || { front: 0, rear: 0 });
        if (n === 0) { container.innerHTML = ''; return; }
        container.innerHTML = this._switchAtValues.map((v, i) => `
            <div class="flex items-center gap-2 p-2 bg-gray-700 rounded-lg text-xs">
                <span class="text-gray-300 font-semibold w-16 shrink-0">Stack ${i + 1}</span>
                <label class="text-gray-400 shrink-0">Front ATs</label>
                <input type="number" min="0" max="20" value="${v.front}"
                    class="w-12 px-1 py-1 rounded bg-gray-600 border border-gray-500 text-white text-center focus:outline-none focus:border-oracle-accent"
                    data-stack="${i}" data-side="front">
                <label class="text-gray-400 shrink-0">Rear ATs</label>
                <input type="number" min="0" max="20" value="${v.rear}"
                    class="w-12 px-1 py-1 rounded bg-gray-600 border border-gray-500 text-white text-center focus:outline-none focus:border-oracle-accent"
                    data-stack="${i}" data-side="rear">
            </div>`).join('');
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                const st = parseInt(input.dataset.stack);
                this._switchAtValues[st][input.dataset.side] = parseInt(input.value) || 0;
                this._syncPackoutAtArrays();
                document.getElementById('total-photo-count').textContent = SESSION.calculateTotalPhotos();
            });
        });
    },

    // Render custom component rows
    _renderCustomComponentRows() {
        const container = document.getElementById('pk-custom-component-rows');
        if (!container) return;
        if (this._customComponentValues.length === 0) { container.innerHTML = ''; return; }
        container.innerHTML = this._customComponentValues.map((comp, c) => `
            <div class="p-2 bg-gray-700 rounded-lg space-y-2 border border-gray-600">
                <div class="flex items-center gap-2">
                    <input type="text" placeholder="Component name (e.g. Storage Array)" value="${this._escapeHtml(comp.name)}"
                        class="flex-1 min-w-0 px-2 py-1 rounded bg-gray-600 border border-gray-500 text-white text-xs focus:outline-none focus:border-oracle-accent"
                        data-custom="${c}" data-field="name">
                    <button class="remove-custom-btn text-red-400 hover:text-red-300 text-sm font-bold px-1 shrink-0" data-custom="${c}">✕</button>
                </div>
                <div class="flex items-center gap-2 text-xs flex-wrap">
                    <label class="text-gray-400 shrink-0">Units</label>
                    <input type="number" min="1" max="20" value="${comp.units}"
                        class="w-12 px-1 py-1 rounded bg-gray-600 border border-gray-500 text-white text-center focus:outline-none focus:border-oracle-accent"
                        data-custom="${c}" data-field="units">
                    <label class="text-gray-400 shrink-0">Front ATs</label>
                    <input type="number" min="0" max="20" value="${comp.frontATs}"
                        class="w-12 px-1 py-1 rounded bg-gray-600 border border-gray-500 text-white text-center focus:outline-none focus:border-oracle-accent"
                        data-custom="${c}" data-field="frontATs">
                    <label class="text-gray-400 shrink-0">Rear ATs</label>
                    <input type="number" min="0" max="20" value="${comp.rearATs}"
                        class="w-12 px-1 py-1 rounded bg-gray-600 border border-gray-500 text-white text-center focus:outline-none focus:border-oracle-accent"
                        data-custom="${c}" data-field="rearATs">
                </div>
            </div>`).join('');
        container.querySelectorAll('input[data-field="name"]').forEach(input => {
            input.addEventListener('input', () => {
                this._customComponentValues[parseInt(input.dataset.custom)].name = input.value.replace(/[^A-Za-z0-9 ._\-]/g, '').slice(0, 50);
            });
        });
        container.querySelectorAll('input[data-field="units"], input[data-field="frontATs"], input[data-field="rearATs"]').forEach(input => {
            input.addEventListener('input', () => {
                this._customComponentValues[parseInt(input.dataset.custom)][input.dataset.field] = parseInt(input.value) || 0;
                this._syncPackoutAtArrays();
                document.getElementById('total-photo-count').textContent = SESSION.calculateTotalPhotos();
            });
        });
        container.querySelectorAll('.remove-custom-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._customComponentValues.splice(parseInt(btn.dataset.custom), 1);
                this._renderCustomComponentRows();
                this._syncPackoutAtArrays();
                document.getElementById('total-photo-count').textContent = SESSION.calculateTotalPhotos();
            });
        });
    },

    // Push current AT arrays into SESSION.components (called before calculateTotalPhotos or initPhotoQueue)
    _syncPackoutAtArrays() {
        SESSION.components.pkServerGroupATs  = this._serverAtValues.slice(0, SESSION.components.pkServers  || 0);
        SESSION.components.pkSwitchStackATs  = this._switchAtValues.slice(0, SESSION.components.pkSwitches || 0);
        SESSION.components.pkCustomComponents = [...this._customComponentValues];
    },

    // Clear all per-group AT values and their DOM containers (called on info screen reset)
    _resetPackoutAtValues() {
        this._serverAtValues        = [];
        this._switchAtValues        = [];
        this._customComponentValues = [];
        const sr = document.getElementById('pk-server-at-rows');        if (sr) sr.innerHTML = '';
        const sw = document.getElementById('pk-switch-at-rows');        if (sw) sw.innerHTML = '';
        const cx = document.getElementById('pk-custom-component-rows'); if (cx) cx.innerHTML = '';
    },

    // Save Now — download a partial ZIP of all photos captured so far
    async saveNow() {
        if (SESSION.capturedPhotos.length === 0) return;
        const btn = document.getElementById('save-now-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
        try {
            await Export.downloadZip();
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
        }
    },

    // Show a transient toast message (used for storage errors, etc.)
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-24 left-4 right-4 z-[100] py-2 px-4 rounded-lg text-sm font-semibold text-white text-center shadow-lg ${
            type === 'error' ? 'bg-red-700' : 'bg-gray-700'
        }`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    },

    // ── Barcode Scanner ──────────────────────────────────────────
    _scannerReader: null,
    _scannerStream: null,
    _scannerAnimFrame: null,
    _quaggaActive: false,
    _torchOn: false,

    // Open scanner modal and start decoding for the given field
    async startScan(targetFieldId, fieldLabel) {
        document.getElementById('scanner-title').textContent = `Scan ${fieldLabel}`;
        document.getElementById('scanner-modal').classList.remove('hidden');
        this._torchOn = false;

        if ('BarcodeDetector' in window) {
            // Native path: manage stream manually, feed to #scanner-video
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
                });
            } catch {
                Screens.showError('Could not access camera for scanning. Check camera permissions.');
                this.stopScan();
                return;
            }
            this._scannerStream = stream;
            const videoEl = document.getElementById('scanner-video');
            videoEl.srcObject = stream;
            await videoEl.play();
            document.getElementById('scanner-status').textContent = 'Scanning…';
            const track = stream.getVideoTracks()[0];
            const capabilities = track?.getCapabilities?.() ?? {};
            const torchBtn = document.getElementById('scanner-torch-btn');
            torchBtn.classList.toggle('hidden', !capabilities.torch);
            this._startNativeScan(targetFieldId, videoEl);

        } else if (typeof Quagga !== 'undefined') {
            // Quagga2 path: let Quagga manage its own stream entirely
            document.getElementById('scanner-status').textContent = 'Scanning…';
            this._startQuaggaScan(targetFieldId);

        } else {
            Screens.showError('Barcode scanner failed to load. Please check your internet connection.');
            this.stopScan();
        }
    },

    // Native BarcodeDetector API (Chrome on Android — near-instant)
    _startNativeScan(targetFieldId, videoEl) {
        const detector = new BarcodeDetector({ formats: ['code_128'] });

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

    // Quagga2 fallback — actively maintained, confirmed iOS Safari support
    _startQuaggaScan(targetFieldId) {
        Quagga.init({
            inputStream: {
                type: 'LiveStream',
                target: document.getElementById('scanner-container'),
                constraints: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            },
            decoder: {
                readers: ['code_128_reader']
            },
            locate: true
        }, (err) => {
            if (err) {
                Screens.showError('Barcode scanner failed to start.');
                this.stopScan();
                return;
            }
            Quagga.start();
            this._quaggaActive = true;

            // Show torch button if the Quagga-managed track supports it
            const track = Quagga.CameraAccess?.getActiveTrack?.();
            const capabilities = track?.getCapabilities?.() ?? {};
            const torchBtn = document.getElementById('scanner-torch-btn');
            if (capabilities.torch) {
                torchBtn.classList.remove('hidden');
            }
        });

        Quagga.onDetected((result) => {
            const code = result?.codeResult?.code;
            if (code) {
                document.getElementById(targetFieldId).value = code;
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
        // Stop Quagga2
        if (this._quaggaActive) {
            try { Quagga.offDetected(); } catch (e) {}
            try { Quagga.stop(); } catch (e) {}
            try { Quagga.deInit(); } catch (e) {}
            this._quaggaActive = false;
            // Remove any canvases Quagga injected (imgBuffer, drawingBuffer, overlay)
            document.getElementById('scanner-container').querySelectorAll('canvas').forEach(el => el.remove());
        }
        // Turn off torch if active (BarcodeDetector path stream)
        if (this._torchOn && this._scannerStream) {
            const track = this._scannerStream.getVideoTracks()[0];
            if (track) track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
            this._torchOn = false;
        }
        // Release camera stream (BarcodeDetector path)
        if (this._scannerStream) {
            this._scannerStream.getTracks().forEach(t => t.stop());
            this._scannerStream = null;
        }
        const video = document.getElementById('scanner-video');
        if (video) video.srcObject = null;
        // Reset scanner UI
        document.getElementById('scanner-status').textContent = 'Align barcode to scan…';
        document.getElementById('scanner-torch-btn').classList.add('hidden');
        document.getElementById('scanner-modal').classList.add('hidden');
    },

    // Toggle torch/flashlight on the scanner stream
    _toggleTorch() {
        const track = this._quaggaActive
            ? Quagga.CameraAccess?.getActiveTrack?.()
            : this._scannerStream?.getVideoTracks()[0];
        if (!track) return;
        this._torchOn = !this._torchOn;
        track.applyConstraints({ advanced: [{ torch: this._torchOn }] }).catch(() => {});
        const btn = document.getElementById('scanner-torch-btn');
        btn.classList.toggle('bg-oracle-accent', this._torchOn);
        btn.classList.toggle('bg-gray-700', !this._torchOn);
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

    // ── Packout Pre-start Checklist ───────────────────────────────────────

    _showPackoutChecklist() {
        // Skip checklist when resuming from a mid-session section
        if (SESSION.startSection) {
            this.startCameraSession();
            return;
        }
        ['chk-ppa', 'chk-snap1', 'chk-panels', 'chk-backdrop'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.checked = false;
        });
        this._updateChecklistBtn();
        document.getElementById('packout-checklist-modal').classList.remove('hidden');
    },

    _updateChecklistBtn() {
        const allChecked = ['chk-ppa', 'chk-snap1', 'chk-panels', 'chk-backdrop']
            .every(id => document.getElementById(id)?.checked);
        const btn = document.getElementById('checklist-confirm-btn');
        if (!btn) return;
        btn.disabled = !allChecked;
        btn.classList.toggle('opacity-50',       !allChecked);
        btn.classList.toggle('cursor-not-allowed', !allChecked);
        btn.classList.toggle('hover:bg-oracle-accent', allChecked);
    },

    // ── Packout Mid-session Snapshot Gates ───────────────────────────────

    checkSessionGates() {
        if (SESSION.mode !== 'packout') return;
        const photo = SESSION.getCurrentPhoto();
        if (!photo) return;

        if (photo.section === 'bagged_rack' && !SESSION.checkpointBagging) {
            document.getElementById('snapshot-gate-title').textContent = 'Snapshot Video 2';
            document.getElementById('snapshot-gate-body').textContent =
                'Confirm Snapshot Video 2 is finished and logged before continuing to plastic wrap photos.';
            document.getElementById('snapshot-gate-modal').classList.remove('hidden');
            return;
        }
        if (photo.section === 'rack_in_carton' && !SESSION.checkpointCarton) {
            document.getElementById('snapshot-gate-title').textContent = 'Snapshot Video 3';
            document.getElementById('snapshot-gate-body').textContent =
                'Confirm Snapshot Video 3 is finished and logged before continuing to carton photos.';
            document.getElementById('snapshot-gate-modal').classList.remove('hidden');
            return;
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
        Camera.resume();
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
