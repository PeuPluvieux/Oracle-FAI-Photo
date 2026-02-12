/**
 * Oracle FAI Photos - Screens Module
 * Handles screen transitions, UI state, and template overlays
 */

const Screens = {
    currentScreen: 'landing',

    // Component quantity input IDs mapped to SESSION.components keys
    componentInputs: {
        'qty-switches': 'switches',
        'qty-servers': 'servers',
        'qty-corning-edge': 'corningEdge',
        'qty-cable-labels': 'cableLabels',
        'qty-cable-bend': 'cableBend'
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

        // Reset packout checkbox
        const doorBranding = document.getElementById('door-branding');
        if (doorBranding) doorBranding.checked = false;

        // Show/hide options based on mode
        if (SESSION.mode === 'pretest') {
            pretestOptions.classList.remove('hidden');
            packoutOptions.classList.add('hidden');
        } else if (SESSION.mode === 'packout') {
            pretestOptions.classList.add('hidden');
            packoutOptions.classList.remove('hidden');
        }

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

        // Sync packout option
        const doorBranding = document.getElementById('door-branding');
        if (doorBranding) {
            SESSION.hasDoorBranding = doorBranding.checked;
        }

        const count = SESSION.calculateTotalPhotos();
        document.getElementById('total-photo-count').textContent = count;
        return count;
    },

    // Get form values from info screen
    getInfoFormValues() {
        const values = {
            partNumber: document.getElementById('part-number').value.trim(),
            serialNumber: document.getElementById('serial-number').value.trim(),
            components: {},
            hasDoorBranding: false
        };

        // Read component quantities
        for (const [inputId, key] of Object.entries(this.componentInputs)) {
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

    // Update camera screen UI
    updateCameraUI() {
        const currentPhoto = SESSION.getCurrentPhoto();
        const progress = SESSION.getProgress();

        // Update progress numbers
        document.getElementById('current-photo').textContent = progress.current;
        document.getElementById('total-photos').textContent = progress.total;
        document.getElementById('photos-remaining').textContent = progress.total - progress.current;

        // Update progress bar
        document.getElementById('progress-bar').style.width = `${progress.percentage}%`;

        // Update FAI mode badge
        const modeBadge = document.getElementById('fai-mode-badge');
        modeBadge.textContent = SESSION.mode === 'pretest' ? 'Pretest' : 'Packout';

        // Update current photo info
        if (currentPhoto) {
            document.getElementById('current-photo-name').textContent =
                `${currentPhoto.id} - ${currentPhoto.name}`;

            // Format location text
            let locationText = '';
            if (currentPhoto.location) {
                locationText = currentPhoto.location.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
            if (currentPhoto.section) {
                locationText += ' - ' + currentPhoto.section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
            document.getElementById('current-photo-location').textContent = locationText;

            // Update template overlay for current photo
            this.renderTemplateOverlay(currentPhoto);
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
        templateImg.src = `${CONFIG.templatePath}${photo.template}`;
        templateImg.className = 'w-full h-full object-contain';
        templateImg.style.opacity = '0.5';
        templateImg.alt = `Template: ${photo.id}`;

        // Rotate landscape templates 90deg so they display in the portrait viewport
        if (isLandscape) {
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

        // Render each captured photo
        SESSION.capturedPhotos.forEach((photo, index) => {
            const card = document.createElement('div');
            card.className = 'photo-card';
            card.dataset.index = index;
            card.innerHTML = `
                <img src="${photo.dataUrl}" alt="${photo.id}">
                <div class="photo-label">${photo.id}</div>
            `;

            // Toggle selection on click
            card.addEventListener('click', () => {
                card.classList.toggle('selected');
            });

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
