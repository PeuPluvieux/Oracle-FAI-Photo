/**
 * Oracle FAI Photos - Screens Module
 * Handles screen transitions, UI state, and template overlays
 */

// Sanitize user text input: allow only safe characters, cap length
function sanitizeInput(str, maxLen = 50) {
    return String(str).replace(/[^A-Za-z0-9 ._\-]/g, '').slice(0, maxLen);
}

const Screens = {
    currentScreen: 'landing',

    // Component quantity input IDs mapped to SESSION.components keys (pretest)
    componentInputs: {
        'qty-switches': 'switches',
        'qty-servers': 'servers',
        'qty-corning-edge': 'corningEdge',
        'qty-cable-labels': 'cableLabels',
        'qty-cable-bend': 'cableBend'
    },

    // Packout component quantity input IDs mapped to SESSION.components keys
    // (per-group AT arrays are managed dynamically by App._serverAtValues / _switchAtValues)
    packoutComponentInputs: {
        'qty-pk-servers':  'pkServers',
        'qty-pk-switches': 'pkSwitches',
        'qty-ak-pns':      'pkAkPns'
    },

    // Show a specific screen
    show(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(`${screenId}-screen`);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }
    },

    // Initialize info screen based on selected mode
    initInfoScreen() {
        const pretestOptions = document.getElementById('pretest-options');
        const packoutOptions = document.getElementById('packout-options');

        // Reset component quantity inputs
        for (const inputId of Object.keys(this.componentInputs)) {
            const el = document.getElementById(inputId);
            if (el) el.value = 0;
        }

        // Reset packout simple count inputs
        for (const inputId of Object.keys(this.packoutComponentInputs)) {
            const el = document.getElementById(inputId);
            if (el) el.value = 0;
        }

        // Reset packout checkbox
        const doorBranding = document.getElementById('door-branding');
        if (doorBranding) doorBranding.checked = false;

        // Reset start-section selector to "Full Session"
        SESSION.startSection = null;
        document.querySelectorAll('.start-section-btn').forEach(btn => {
            const isDefault = !btn.dataset.startSection;
            btn.classList.toggle('active-section-btn', isDefault);
            btn.classList.toggle('bg-oracle-accent',     isDefault);
            btn.classList.toggle('border-oracle-accent', isDefault);
            btn.classList.toggle('text-white',           isDefault);
            btn.classList.toggle('bg-gray-700',          !isDefault);
            btn.classList.toggle('border-gray-600',      !isDefault);
            btn.classList.toggle('text-gray-300',        !isDefault);
        });

        // Hide AT sub-options until a group/stack count is selected
        document.getElementById('pk-server-at-options').classList.add('hidden');
        document.getElementById('pk-switch-at-options').classList.add('hidden');

        // Clear per-group AT rows and custom component rows
        if (typeof App !== 'undefined') App._resetPackoutAtValues();

        // Show/hide options based on mode
        if (SESSION.mode === 'pretest') {
            pretestOptions.classList.remove('hidden');
            packoutOptions.classList.add('hidden');
        } else if (SESSION.mode === 'packout') {
            pretestOptions.classList.add('hidden');
            packoutOptions.classList.remove('hidden');
        }

        // Set section pill labels for this mode
        this._initSectionPills();

        // Update photo count
        this.updatePhotoCount();
    },

    // Calculate and update photo count based on current options
    updatePhotoCount() {
        // Sync component quantities from inputs to SESSION
        for (const [inputId, key] of Object.entries(this.componentInputs)) {
            const el = document.getElementById(inputId);
            if (el) {
                SESSION.components[key] = parseInt(el.value) || 0;
            }
        }

        // Sync packout component quantities from inputs to SESSION
        for (const [inputId, key] of Object.entries(this.packoutComponentInputs)) {
            const el = document.getElementById(inputId);
            if (el) {
                SESSION.components[key] = parseInt(el.value) || 0;
            }
        }

        // Sync packout option
        const doorBranding = document.getElementById('door-branding');
        if (doorBranding) {
            SESSION.hasDoorBranding = doorBranding.checked;
        }

        // Show/hide server AT sub-options and refresh dynamic rows
        const serverAtDiv = document.getElementById('pk-server-at-options');
        if (serverAtDiv) {
            serverAtDiv.classList.toggle('hidden', SESSION.components.pkServers === 0);
            if (typeof App !== 'undefined') App._renderServerAtRows();
        }
        // Show/hide switch AT sub-options and refresh dynamic rows
        const switchAtDiv = document.getElementById('pk-switch-at-options');
        if (switchAtDiv) {
            switchAtDiv.classList.toggle('hidden', SESSION.components.pkSwitches === 0);
            if (typeof App !== 'undefined') App._renderSwitchAtRows();
        }

        // Push per-group AT arrays into SESSION so calculateTotalPhotos uses current values
        if (typeof App !== 'undefined') App._syncPackoutAtArrays();

        const count = SESSION.calculateTotalPhotos();
        document.getElementById('total-photo-count').textContent = count;
        return count;
    },

    // Get form values from info screen
    getInfoFormValues() {
        const values = {
            partNumber:   sanitizeInput(document.getElementById('part-number').value.trim()),
            serialNumber: sanitizeInput(document.getElementById('serial-number').value.trim()),
            components: {},
            hasDoorBranding: false
        };

        // Read component quantities (pretest)
        for (const [inputId, key] of Object.entries(this.componentInputs)) {
            const el = document.getElementById(inputId);
            values.components[key] = el ? (parseInt(el.value) || 0) : 0;
        }

        // Read packout simple counts
        for (const [inputId, key] of Object.entries(this.packoutComponentInputs)) {
            const el = document.getElementById(inputId);
            values.components[key] = el ? (parseInt(el.value) || 0) : 0;
        }

        // Read packout option
        const doorBranding = document.getElementById('door-branding');
        if (doorBranding) {
            values.hasDoorBranding = doorBranding.checked;
        }

        return values;
    },

    // Set pill labels and reset classes based on current mode
    _initSectionPills() {
        const pills = [
            document.getElementById('sect-front'),
            document.getElementById('sect-rear'),
            document.getElementById('sect-sides'),
            document.getElementById('sect-labels')
        ];
        const labels = SESSION.mode === 'packout'
            ? ['AK BOX', 'RACK', 'PLASTIC', 'CARTON']
            : ['FRONT', 'REAR', 'SIDES', 'LABELS'];
        pills.forEach((pill, i) => {
            if (pill) {
                pill.textContent = labels[i];
                pill.className = 'section-pill';
            }
        });
    },

    // Map photo → one of four section slot keys ('front'/'rear'/'sides'/'labels')
    // For packout, uses photo.section; for pretest, uses photo.location.
    _sectionForLocation(photo) {
        if (!photo) return null;
        if (SESSION.mode === 'packout') {
            const sec = photo.section;
            if (sec === 'assy_tag' || sec === 'accessory_kit') return 'front';  // AK BOX pill
            if (sec === 'before_bag')                          return 'rear';   // RACK pill
            if (sec === 'bagged_rack')                         return 'sides';   // PLASTIC pill
            if (sec === 'rack_in_carton')                      return 'labels';  // CARTON pill
            return null;
        }
        const location = photo.location;
        if (!location) return null;
        if (location === 'front')                                                          return 'front';
        if (location === 'rear')                                                           return 'rear';
        if (location === 'left_side' || location === 'right_side' ||
            location === 'side_a'    || location === 'side_b')                             return 'sides';
        if (location === 'labels')                                                         return 'labels';
        return null;
    },

    // Light up the section progress pills in the header
    _updateSectionPills(currentPhoto) {
        const order  = ['front', 'rear', 'sides', 'labels'];
        const elMap  = {
            front:  document.getElementById('sect-front'),
            rear:   document.getElementById('sect-rear'),
            sides:  document.getElementById('sect-sides'),
            labels: document.getElementById('sect-labels')
        };
        const curSec = currentPhoto ? this._sectionForLocation(currentPhoto) : null;
        const curIdx = order.indexOf(curSec);

        order.forEach((sec, idx) => {
            const el = elMap[sec];
            if (!el) return;
            el.className = 'section-pill';
            if (sec === curSec)    el.classList.add('active');
            else if (idx < curIdx) el.classList.add('done');
        });
    },

    // Update camera screen UI
    updateCameraUI() {
        const currentPhoto = SESSION.getCurrentPhoto();
        const progress = SESSION.getProgress();

        // Progress numbers
        document.getElementById('current-photo').textContent    = progress.current;
        document.getElementById('total-photos').textContent     = progress.total;
        document.getElementById('photos-remaining').textContent = progress.total - progress.current;

        // Progress bar
        document.getElementById('progress-bar').style.width = `${progress.percentage}%`;

        // Finish Early / Save Now — show after first capture; hide mode badge to free space
        const showFinish = SESSION.capturedPhotos.length > 0;
        document.getElementById('finish-early-btn').classList.toggle('hidden', !showFinish);
        document.getElementById('fai-mode-badge').classList.toggle('hidden', showFinish);
        const saveNowBtn = document.getElementById('save-now-btn');
        if (saveNowBtn) saveNowBtn.classList.toggle('hidden', !showFinish);

        // Gallery count badge
        const count   = SESSION.capturedPhotos.length;
        const countEl = document.getElementById('gallery-count');
        if (countEl) {
            countEl.textContent = count;
            countEl.classList.toggle('hidden', count === 0);
            countEl.classList.toggle('flex',   count > 0);
        }

        // Mode badge
        document.getElementById('fai-mode-badge').textContent = SESSION.mode === 'pretest' ? 'Pretest' : 'Packout';

        if (currentPhoto) {
            document.getElementById('current-photo-name').textContent = `${currentPhoto.id} - ${currentPhoto.name}`;

            let locationText = '';
            if (currentPhoto.location) locationText = currentPhoto.location.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (currentPhoto.section)  locationText += ' · ' + currentPhoto.section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            document.getElementById('current-photo-location').textContent = locationText;

            // Section pills
            this._updateSectionPills(currentPhoto);

            // Landscape rotation prompt — flash 2× then auto-dismiss via animationend
            const isLandscape = currentPhoto.orientation === 'landscape';
            const prompt = document.getElementById('landscape-prompt');
            if (prompt) {
                if (isLandscape) {
                    // Cancel any in-progress flash from a previous landscape photo.
                    // Must remove 'hidden' BEFORE the reflow so the element is in the
                    // layout tree — offsetWidth on display:none returns 0 and doesn't
                    // commit the class removal, so the animation won't restart.
                    prompt.classList.remove('landscape-prompt-active');
                    prompt.classList.remove('hidden');
                    void prompt.offsetWidth; // force reflow to restart animation
                    prompt.classList.add('landscape-prompt-active');
                } else {
                    prompt.classList.add('hidden');
                    prompt.classList.remove('landscape-prompt-active');
                }
            }

            this.renderTemplateOverlay(currentPhoto);
            // Re-apply current opacity setting after overlay re-render
            if (typeof App !== 'undefined') App._applyTemplateOpacity();
        }

        // Already-captured banner — show when the current photo was already taken
        const alreadyBanner = document.getElementById('already-captured-banner');
        if (alreadyBanner && currentPhoto) {
            const inRetakeMode = typeof App !== 'undefined' && App._retakeIndex !== null;
            const alreadyCaptured = !inRetakeMode && SESSION.capturedPhotos.some(p => p.id === currentPhoto.id);
            alreadyBanner.classList.toggle('hidden', !alreadyCaptured);
        }

        // Prompt for switch stack orientation when entering first AT photo of each stack
        if (SESSION.mode === 'packout' && typeof App !== 'undefined') {
            App.checkSwitchOrientation();
        }

        // Packout mid-session snapshot gates (Gate 2 and Gate 3)
        if (SESSION.mode === 'packout' && typeof App !== 'undefined') {
            App.checkSessionGates();
        }
    },

    // Render template overlay (PNG guide image on top of camera)
    // Landscape-oriented templates are rotated 90deg via CSS so they
    // display within the portrait viewport - user rotates phone to match.
    renderTemplateOverlay(photo) {
        const overlay = document.getElementById('template-overlay');
        overlay.innerHTML = '';

        const isLandscape = photo && photo.orientation === 'landscape';

        if (!photo || !photo.template) {
            // No template for this photo - show a simple frame guide
            const frameDiv = document.createElement('div');
            frameDiv.className = 'absolute inset-4 border-2 border-dashed border-white/30 rounded-lg';
            if (isLandscape) frameDiv.classList.add('template-rotated');
            overlay.appendChild(frameDiv);

            // Show photo ID in center
            const label = document.createElement('div');
            label.className = 'absolute inset-0 flex items-center justify-center';
            label.innerHTML = `<span class="text-white/20 text-4xl font-bold">${photo.id}</span>`;
            if (isLandscape) label.classList.add('template-rotated');
            overlay.appendChild(label);
            return;
        }

        // Load template PNG as overlay
        const templateImg = document.createElement('img');
        const tplPath = SESSION.mode === 'packout' ? CONFIG.packoutTemplatePath : CONFIG.templatePath;
        templateImg.src = `${tplPath}${photo.template}`;
        templateImg.className = 'w-full h-full object-contain';
        templateImg.alt = `Template: ${photo.id}`;
        // Opacity is managed on the parent #template-overlay div via App._applyTemplateOpacity()

        // Rotate landscape templates 90deg so they display in the portrait viewport
        if (isLandscape) {
            templateImg.classList.remove('w-full', 'h-full');  // CSS rule handles size
            templateImg.classList.add('template-rotated');
        }

        templateImg.onerror = () => {
            // Template file not found - show fallback
            console.warn(`Template not found: ${photo.template}`);
            overlay.innerHTML = '';
            const fallback = document.createElement('div');
            fallback.className = 'absolute inset-4 border-2 border-dashed border-yellow-500/40 rounded-lg';
            if (isLandscape) fallback.classList.add('template-rotated');
            overlay.appendChild(fallback);

            const label = document.createElement('div');
            label.className = 'absolute inset-0 flex items-center justify-center';
            label.innerHTML = `<span class="text-yellow-500/40 text-2xl font-bold">${photo.id}<br><span class="text-sm">Template missing</span></span>`;
            if (isLandscape) label.classList.add('template-rotated');
            overlay.appendChild(label);
        };

        overlay.appendChild(templateImg);
    },

    // Render photos grid in review screen
    renderPhotosGrid() {
        const container = document.getElementById('photos-grid');
        container.innerHTML = '';

        // Update review header
        document.getElementById('review-mode-text').textContent =
            SESSION.mode === 'pretest' ? 'Pretest FAI' : 'Packout FAI';

        let pnSn = '';
        if (SESSION.partNumber) pnSn += `PN: ${SESSION.partNumber}`;
        if (SESSION.serialNumber) {
            if (pnSn) pnSn += ' | ';
            pnSn += `SN: ${SESSION.serialNumber}`;
        }
        document.getElementById('review-pn-sn').textContent = pnSn || 'No PN/SN specified';

        const countEl = document.getElementById('review-photo-count');
        if (countEl) countEl.textContent = `${SESSION.capturedPhotos.length} photo${SESSION.capturedPhotos.length !== 1 ? 's' : ''} captured`;

        // Render each captured photo
        SESSION.capturedPhotos.forEach((photo, index) => {
            const card = document.createElement('div');
            card.className = 'photo-card';
            card.dataset.index = index;
            card.innerHTML = `
                <img src="${photo.dataUrl}" alt="${photo.id}" loading="lazy">
                <div class="photo-label">${photo.id}</div>
            `;
            card.addEventListener('click', () => card.classList.toggle('selected'));
            container.appendChild(card);
        });
    },

    // Get selected photo indices
    getSelectedPhotos() {
        const selected = [];
        document.querySelectorAll('.photo-card.selected').forEach(card => {
            selected.push(parseInt(card.dataset.index));
        });
        return selected;
    },

    // Update the last photo thumbnail on camera screen
    updateLastPhotoThumb() {
        const thumb = document.getElementById('last-photo-thumb');
        const icon = document.getElementById('gallery-icon');
        const photos = SESSION.capturedPhotos;

        if (photos.length > 0) {
            thumb.src = photos[photos.length - 1].dataUrl;
            thumb.classList.remove('hidden');
            icon.classList.add('hidden');
        } else {
            thumb.classList.add('hidden');
            icon.classList.remove('hidden');
        }
    },

    // Open gallery modal showing all captured photos
    openGallery() {
        const container = document.getElementById('gallery-photos');
        const emptyMsg = document.getElementById('gallery-empty');
        container.innerHTML = '';

        const photos = SESSION.capturedPhotos;

        if (photos.length === 0) {
            emptyMsg.classList.remove('hidden');
        } else {
            emptyMsg.classList.add('hidden');

            photos.forEach((photo, index) => {
                const card = document.createElement('div');
                card.className = 'relative rounded-lg overflow-hidden bg-gray-800';
                card.innerHTML = `
                    <img src="${photo.dataUrl}" alt="${photo.id}" class="w-full aspect-square object-cover cursor-pointer" data-index="${index}">
                    <div class="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-2">
                        <span class="text-white text-xs font-medium">${photo.id}</span>
                    </div>
                    <div class="p-2">
                        <button class="retake-gallery-btn w-full bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold py-2 px-3 rounded transition-all" data-index="${index}">
                            Retake
                        </button>
                    </div>
                `;
                // Tap photo to preview full size
                card.querySelector('img').addEventListener('click', () => {
                    this.openPhotoPreview(index);
                });
                // Retake button
                card.querySelector('.retake-gallery-btn').addEventListener('click', () => {
                    App.retakeSingleFromGallery(index);
                });
                container.appendChild(card);
            });
        }

        document.getElementById('gallery-modal').classList.remove('hidden');
    },

    // Close gallery modal
    closeGallery() {
        document.getElementById('gallery-modal').classList.add('hidden');
    },

    // Open single photo preview with retake option
    openPhotoPreview(index) {
        const photo = SESSION.capturedPhotos[index];
        if (!photo) return;

        document.getElementById('preview-photo-id').textContent = `${photo.id} - ${photo.name}`;
        document.getElementById('preview-photo-img').src = photo.dataUrl;
        document.getElementById('preview-retake-btn').dataset.index = index;
        document.getElementById('preview-modal').classList.remove('hidden');
    },

    // Close photo preview
    closePhotoPreview() {
        document.getElementById('preview-modal').classList.add('hidden');
    },

    // Show error modal
    showError(message) {
        document.getElementById('error-message').textContent = message;
        document.getElementById('error-modal').classList.remove('hidden');
    },

    // Hide error modal
    hideError() {
        document.getElementById('error-modal').classList.add('hidden');
    }
};
