/**
 * Oracle FAI Photos - Configuration
 * Central configuration for photo sequences, templates, and component types
 */

const CONFIG = {
    // Photo settings - single portrait mode, no cropping
    // Full camera resolution is captured; no forced aspect ratio
    photo: {
        format: 'image/jpeg',
        quality: 0.92
    },

    // Template base path (relative to project root)
    templatePath: 'Test Sample PRETEST v2/Template/',

    // FAI Modes
    modes: {
        pretest: { id: 'pretest', name: 'Pretest FAI', description: 'First Article Inspection before testing' },
        packout: { id: 'packout', name: 'Packout FAI', description: 'First Article Inspection for packaging' }
    },

    // ===========================================
    // PRETEST FAI - Default Photos (Always taken)
    // ===========================================
    // Sequenced: FRONT full→top→bottom, SIDES, REAR full→top→bottom, then LABELS/MISC
    pretestDefaultPhotos: [
        // --- FRONT OF RACK ---
        // Full Rack
        { id: 'FR1', name: 'Front Rack - Full Straight On', template: 'FR1.png', orientation: 'portrait', location: 'front', section: 'full_rack' },
        { id: 'FR2', name: 'Front Rack - Full 45 Right', template: 'FR2.png', orientation: 'portrait', location: 'front', section: 'full_rack' },
        { id: 'FR3', name: 'Front Rack - Full 45 Left', template: 'FR3.png', orientation: 'portrait', location: 'front', section: 'full_rack' },
        // Top Half
        { id: 'FR4', name: 'Front Rack - Top Half Straight On', template: 'FR4.png', orientation: 'portrait', location: 'front', section: 'top_half' },
        { id: 'FR5', name: 'Front Rack - Top Half 45 Right', template: 'FR5.png', orientation: 'portrait', location: 'front', section: 'top_half' },
        { id: 'FR6', name: 'Front Rack - Top Half 45 Left', template: 'FR6.png', orientation: 'portrait', location: 'front', section: 'top_half' },
        // Bottom Half
        { id: 'FR7', name: 'Front Rack - Bottom Half Straight On', template: 'FR7.png', orientation: 'portrait', location: 'front', section: 'bottom_half' },
        { id: 'FR8', name: 'Front Rack - Bottom Half 45 Right', template: 'FR8.png', orientation: 'portrait', location: 'front', section: 'bottom_half' },
        { id: 'FR9', name: 'Front Rack - Bottom Half 45 Left', template: 'FR9.png', orientation: 'portrait', location: 'front', section: 'bottom_half' },

        // --- LEFT SIDE ---
        { id: 'LS1', name: 'Left Side - Full', template: 'LS1.png', orientation: 'portrait', location: 'left_side', section: 'full' },
        { id: 'LS2', name: 'Left Side - Top Half', template: 'LS2.png', orientation: 'portrait', location: 'left_side', section: 'top_half' },
        { id: 'LS3', name: 'Left Side - Bottom Half', template: 'LS3.png', orientation: 'portrait', location: 'left_side', section: 'bottom_half' },

        // --- RIGHT SIDE ---
        { id: 'RS1', name: 'Right Side - Full', template: 'RS1.png', orientation: 'portrait', location: 'right_side', section: 'full' },
        { id: 'RS2', name: 'Right Side - Top Half', template: 'RS2.png', orientation: 'portrait', location: 'right_side', section: 'top_half' },
        { id: 'RS3', name: 'Right Side - Bottom Half', template: 'RS3.png', orientation: 'portrait', location: 'right_side', section: 'bottom_half' },

        // --- REAR OF RACK ---
        // Full Rack
        { id: 'RR1', name: 'Rear Rack - Full Straight On', template: 'RR1.png', orientation: 'portrait', location: 'rear', section: 'full_rack' },
        { id: 'RR2', name: 'Rear Rack - Full 45 Right', template: 'RR2.png', orientation: 'portrait', location: 'rear', section: 'full_rack' },
        { id: 'RR3', name: 'Rear Rack - Full 45 Left', template: 'RR3.png', orientation: 'portrait', location: 'rear', section: 'full_rack' },
        // Top Half
        { id: 'RR4', name: 'Rear Rack - Top Half Straight On', template: 'RR4.png', orientation: 'portrait', location: 'rear', section: 'top_half' },
        { id: 'RR5', name: 'Rear Rack - Top Half 45 Right', template: 'RR5.png', orientation: 'portrait', location: 'rear', section: 'top_half' },
        { id: 'RR6', name: 'Rear Rack - Top Half 45 Left', template: 'RR6.png', orientation: 'portrait', location: 'rear', section: 'top_half' },
        // Bottom Half
        { id: 'RR7', name: 'Rear Rack - Bottom Half Straight On', template: 'RR7.png', orientation: 'portrait', location: 'rear', section: 'bottom_half' },
        { id: 'RR8', name: 'Rear Rack - Bottom Half 45 Right', template: 'RR8.png', orientation: 'portrait', location: 'rear', section: 'bottom_half' },
        { id: 'RR9', name: 'Rear Rack - Bottom Half 45 Left', template: 'RR9.png', orientation: 'portrait', location: 'rear', section: 'bottom_half' },

        // --- LABELS & MISC (default) ---
        { id: 'SN', name: 'Serial Number Label', template: null, orientation: 'landscape', location: 'labels', section: 'serial' },
        { id: 'LB1', name: 'Label 1', template: null, orientation: 'landscape', location: 'labels', section: 'labels' },
        { id: 'LB2', name: 'Label 2', template: null, orientation: 'landscape', location: 'labels', section: 'labels' },
        { id: 'LB3', name: 'Label 3', template: null, orientation: 'landscape', location: 'labels', section: 'labels' },
        { id: 'PDU1', name: 'PDU Photo 1', template: null, orientation: 'portrait', location: 'rear', section: 'pdu' },
        { id: 'PDU2', name: 'PDU Photo 2', template: null, orientation: 'portrait', location: 'rear', section: 'pdu' },
        { id: 'PDU3', name: 'PDU Photo 3', template: null, orientation: 'portrait', location: 'rear', section: 'pdu' },
        { id: 'PDU4', name: 'PDU Photo 4', template: null, orientation: 'portrait', location: 'rear', section: 'pdu' },
        { id: 'PDU5', name: 'PDU Photo 5', template: null, orientation: 'portrait', location: 'rear', section: 'pdu' },
        { id: 'PDU6', name: 'PDU Photo 6', template: null, orientation: 'portrait', location: 'rear', section: 'pdu' }
    ],

    // ===========================================
    // PRETEST - Component Types (user selects qty)
    // ===========================================
    // Each component type defines front/back angles and template mappings.
    // When user enters qty, photos are auto-generated for each unit.
    componentTypes: {
        switches: {
            label: 'Switch Stack',
            askLabel: 'How many switch stacks?',
            front: {
                prefix: 'SW',
                location: 'front',
                angles: [
                    { suffix: 'T', name: 'Top', template: 'Sw-T.png', orientation: 'landscape' },
                    { suffix: 'B', name: 'Bottom', template: 'SW-B.png', orientation: 'landscape' }
                ]
            },
            back: {
                prefix: 'BSW',
                location: 'rear',
                angles: [
                    { suffix: 'F', name: 'Front', template: null, orientation: 'landscape' },
                    { suffix: 'L', name: 'Left', template: null, orientation: 'landscape' },
                    { suffix: 'R', name: 'Right', template: null, orientation: 'landscape' }
                ]
            }
        },
        servers: {
            label: 'Server Group',
            askLabel: 'How many server groups?',
            front: {
                prefix: 'SV',
                location: 'front',
                angles: [
                    { suffix: 'F', name: 'Front', template: 'SV-F.png', orientation: 'landscape' },
                    { suffix: 'B', name: 'Bottom', template: 'SV-B.png', orientation: 'landscape' },
                    { suffix: 'L', name: 'Left', template: 'SV-L.png', orientation: 'landscape' },
                    { suffix: 'R', name: 'Right', template: 'SV-R.png', orientation: 'landscape' }
                ]
            },
            back: {
                prefix: 'BSV',
                location: 'rear',
                angles: [
                    { suffix: 'F', name: 'Front', template: 'BSV-F.png', orientation: 'landscape' },
                    { suffix: 'L', name: 'Left', template: 'BSV-L.png', orientation: 'landscape' },
                    { suffix: 'R', name: 'Right', template: 'BSV-R.png', orientation: 'landscape' }
                ]
            }
        },
        corningEdge: {
            label: 'Corning Edge',
            askLabel: 'How many Corning Edge units?',
            front: {
                prefix: 'CE',
                location: 'front',
                angles: [
                    { suffix: 'C', name: 'Closed', template: 'CE-C.png', orientation: 'landscape' },
                    { suffix: 'O', name: 'Open', template: 'CE-O.png', orientation: 'landscape' }
                ]
            },
            back: null
        },
        cableLabels: {
            label: 'Cable Type',
            askLabel: 'How many cable types?',
            front: {
                prefix: 'CL',
                location: 'labels',
                angles: [
                    { suffix: 'A', name: 'End A', template: 'CL.png', orientation: 'landscape' },
                    { suffix: 'B', name: 'End B', template: 'CL.png', orientation: 'landscape' }
                ]
            },
            back: null
        },
        cableBend: {
            label: 'Cable Bend Test',
            askLabel: 'How many cable bend tests?',
            front: {
                prefix: 'CB',
                location: 'labels',
                angles: [
                    { suffix: '', name: '', template: 'CB.png', orientation: 'landscape' }
                ]
            },
            back: null
        }
    },

    // ===========================================
    // PACKOUT FAI - Default Photos (Always taken)
    // ===========================================
    packoutDefaultPhotos: [
        { id: 'PK_FR1', name: 'Packout Front - Before Shipping Bag', template: null, orientation: 'portrait', location: 'front', section: 'before_bag' },
        { id: 'PK_RR1', name: 'Packout Rear - Before Shipping Bag', template: null, orientation: 'portrait', location: 'rear', section: 'before_bag' },
        { id: 'PK_SA1', name: 'Packout Side A - Before Shipping Bag', template: null, orientation: 'portrait', location: 'side_a', section: 'before_bag' },
        { id: 'PK_SB1', name: 'Packout Side B - Before Shipping Bag', template: null, orientation: 'portrait', location: 'side_b', section: 'before_bag' },
        { id: 'PK_FR2', name: 'Packout Front - Fully Packaged', template: null, orientation: 'portrait', location: 'front', section: 'fully_packaged' },
        { id: 'PK_RR2', name: 'Packout Rear - Fully Packaged', template: null, orientation: 'portrait', location: 'rear', section: 'fully_packaged' },
        { id: 'PK_SA2', name: 'Packout Side A - Fully Packaged', template: null, orientation: 'portrait', location: 'side_a', section: 'fully_packaged' },
        { id: 'PK_SB2', name: 'Packout Side B - Fully Packaged', template: null, orientation: 'portrait', location: 'side_b', section: 'fully_packaged' },
        { id: 'PK_RA1', name: 'Ride Along Items - Overview', template: null, orientation: 'landscape', location: 'ride_along', section: 'items' },
        { id: 'PK_LB1', name: 'Package Labels - Close Up', template: null, orientation: 'landscape', location: 'labels', section: 'package_labels' },
        { id: 'PK_LB2', name: 'Paperwork - Close Up', template: null, orientation: 'landscape', location: 'labels', section: 'paperwork' }
    ],

    // PACKOUT FAI - Door Branding Add-on
    packoutDoorBranding: [
        { id: 'PK_DB1', name: 'Door Branding - Front', template: null, orientation: 'portrait', location: 'front', section: 'door_branding' },
        { id: 'PK_DB2', name: 'Door Branding - Rear', template: null, orientation: 'portrait', location: 'rear', section: 'door_branding' }
    ],

    // Generate component photos for a given type and quantity
    generateComponentPhotos(typeKey, quantity) {
        const type = this.componentTypes[typeKey];
        if (!type || quantity <= 0) return { front: [], back: [] };

        const frontPhotos = [];
        const backPhotos = [];

        for (let i = 1; i <= quantity; i++) {
            // Front angles
            if (type.front) {
                for (const angle of type.front.angles) {
                    const suffix = angle.suffix ? `-${angle.suffix}` : '';
                    const angleName = angle.name ? ` - ${angle.name}` : '';
                    frontPhotos.push({
                        id: `${type.front.prefix}${i}${suffix}`,
                        name: `${type.label} ${i}${angleName}`,
                        template: angle.template,
                        orientation: angle.orientation,
                        location: type.front.location,
                        section: typeKey,
                        componentType: typeKey,
                        unitNumber: i
                    });
                }
            }

            // Back angles
            if (type.back) {
                for (const angle of type.back.angles) {
                    const suffix = angle.suffix ? `-${angle.suffix}` : '';
                    const angleName = angle.name ? ` - ${angle.name}` : '';
                    backPhotos.push({
                        id: `${type.back.prefix}${i}${suffix}`,
                        name: `Back ${type.label} ${i}${angleName}`,
                        template: angle.template,
                        orientation: angle.orientation,
                        location: type.back.location,
                        section: typeKey,
                        componentType: typeKey,
                        unitNumber: i
                    });
                }
            }
        }

        return { front: frontPhotos, back: backPhotos };
    }
};


// ===========================================
// SESSION - Photo session state management
// ===========================================
const SESSION = {
    mode: null,              // 'pretest' or 'packout'
    partNumber: '',          // PN (optional)
    serialNumber: '',        // SN (optional)

    // Component quantities (Pretest)
    components: {
        switches: 0,
        servers: 0,
        corningEdge: 0,
        cableLabels: 0,
        cableBend: 0
    },

    // Packout options
    hasDoorBranding: false,

    // Photo management
    photoQueue: [],
    currentPhotoIndex: 0,
    capturedPhotos: [],

    // Build the photo queue based on mode and component quantities
    initPhotoQueue() {
        this.photoQueue = [];
        this.currentPhotoIndex = 0;
        this.capturedPhotos = [];

        if (this.mode === 'pretest') {
            this._buildPretestQueue();
        } else if (this.mode === 'packout') {
            this._buildPackoutQueue();
        }

        return this.photoQueue;
    },

    // Build Pretest photo queue with proper sequencing
    _buildPretestQueue() {
        const defaults = CONFIG.pretestDefaultPhotos;

        // Collect all component photos (front and back separately)
        let allFrontComponents = [];
        let allBackComponents = [];

        for (const [typeKey, qty] of Object.entries(this.components)) {
            if (qty > 0) {
                const photos = CONFIG.generateComponentPhotos(typeKey, qty);
                allFrontComponents = allFrontComponents.concat(photos.front);
                allBackComponents = allBackComponents.concat(photos.back);
            }
        }

        // === SEQUENCE ===
        // 1. FRONT: FR1-FR9 (full → top → bottom)
        this._addPhotos(defaults.filter(p => p.id.startsWith('FR')));

        // 2. FRONT COMPONENTS (switches → servers → corning edge, top to bottom)
        this._addPhotos(allFrontComponents);

        // 3. LEFT SIDE: LS1-LS3
        this._addPhotos(defaults.filter(p => p.id.startsWith('LS')));

        // 4. RIGHT SIDE: RS1-RS3
        this._addPhotos(defaults.filter(p => p.id.startsWith('RS')));

        // 5. REAR: RR1-RR9 (full → top → bottom)
        this._addPhotos(defaults.filter(p => p.id.startsWith('RR')));

        // 6. REAR COMPONENTS (back switches → back servers)
        this._addPhotos(allBackComponents);

        // 7. PDUs (at the rear)
        this._addPhotos(defaults.filter(p => p.id.startsWith('PDU')));

        // 8. LABELS & MISC: SN, LB1-LB3
        this._addPhotos(defaults.filter(p => p.id === 'SN'));
        this._addPhotos(defaults.filter(p => p.id.startsWith('LB')));

        // 9. CABLE LABELS & BEND TESTS (from components)
        // These are already included in allFrontComponents since CL/CB have no back
    },

    // Build Packout photo queue
    _buildPackoutQueue() {
        for (const photo of CONFIG.packoutDefaultPhotos) {
            this._addPhoto(photo);
        }

        if (this.hasDoorBranding) {
            for (const photo of CONFIG.packoutDoorBranding) {
                this._addPhoto(photo);
            }
        }
    },

    // Add array of photos to queue
    _addPhotos(photos) {
        for (const photo of photos) {
            this._addPhoto(photo);
        }
    },

    // Add single photo to queue with filename
    _addPhoto(photo) {
        this.photoQueue.push({
            ...photo,
            filename: this.generateFilename(photo)
        });
    },

    // Generate filename: {PN}_{SN}_{ID}.jpg or just {ID}.jpg
    generateFilename(photo) {
        const id = photo.id;
        let filename = '';

        if (this.partNumber && this.serialNumber) {
            filename = `${this.partNumber}_${this.serialNumber}_${id}.jpg`;
        } else if (this.partNumber) {
            filename = `${this.partNumber}_${id}.jpg`;
        } else if (this.serialNumber) {
            filename = `${this.serialNumber}_${id}.jpg`;
        } else {
            filename = `${id}.jpg`;
        }

        return filename;
    },

    // Get current photo info
    getCurrentPhoto() {
        return this.photoQueue[this.currentPhotoIndex] || null;
    },

    // Move to next photo
    nextPhoto() {
        if (this.currentPhotoIndex < this.photoQueue.length - 1) {
            this.currentPhotoIndex++;
            return true;
        }
        return false;
    },

    // Move to previous photo
    prevPhoto() {
        if (this.currentPhotoIndex > 0) {
            this.currentPhotoIndex--;
            return true;
        }
        return false;
    },

    // Get progress info
    getProgress() {
        return {
            current: this.currentPhotoIndex + 1,
            total: this.photoQueue.length,
            percentage: Math.round(((this.currentPhotoIndex + 1) / this.photoQueue.length) * 100)
        };
    },

    // Calculate total photo count for given component quantities
    calculateTotalPhotos() {
        let count = 0;

        if (this.mode === 'pretest') {
            // Default photos
            count = CONFIG.pretestDefaultPhotos.length;

            // Component photos
            for (const [typeKey, qty] of Object.entries(this.components)) {
                if (qty > 0) {
                    const type = CONFIG.componentTypes[typeKey];
                    let photosPerUnit = 0;
                    if (type.front) photosPerUnit += type.front.angles.length;
                    if (type.back) photosPerUnit += type.back.angles.length;
                    count += qty * photosPerUnit;
                }
            }
        } else if (this.mode === 'packout') {
            count = CONFIG.packoutDefaultPhotos.length;
            if (this.hasDoorBranding) {
                count += CONFIG.packoutDoorBranding.length;
            }
        }

        return count;
    },

    // Serialize session state for persistence (excludes photo blobs - those go to IndexedDB)
    toJSON() {
        return {
            mode: this.mode,
            partNumber: this.partNumber,
            serialNumber: this.serialNumber,
            components: { ...this.components },
            hasDoorBranding: this.hasDoorBranding,
            photoQueue: this.photoQueue,
            currentPhotoIndex: this.currentPhotoIndex
        };
    },

    // Restore session state from persisted data
    fromJSON(data) {
        if (!data) return false;
        this.mode = data.mode;
        this.partNumber = data.partNumber || '';
        this.serialNumber = data.serialNumber || '';
        this.components = data.components || {
            switches: 0, servers: 0, corningEdge: 0, cableLabels: 0, cableBend: 0
        };
        this.hasDoorBranding = data.hasDoorBranding || false;
        this.photoQueue = data.photoQueue || [];
        this.currentPhotoIndex = data.currentPhotoIndex || 0;
        this.capturedPhotos = []; // Photos loaded separately from IndexedDB
        return true;
    },

    // Reset session
    reset() {
        this.mode = null;
        this.partNumber = '';
        this.serialNumber = '';
        this.components = {
            switches: 0,
            servers: 0,
            corningEdge: 0,
            cableLabels: 0,
            cableBend: 0
        };
        this.hasDoorBranding = false;
        this.photoQueue = [];
        this.currentPhotoIndex = 0;
        this.capturedPhotos = [];
    }
};
