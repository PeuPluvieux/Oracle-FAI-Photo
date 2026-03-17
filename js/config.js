/**
 * Oracle FAI Photos - Configuration
 * Central configuration for photo sequences, templates, and component types
 */

const CONFIG = {
    // Photo settings - single portrait mode, no cropping
    // Full camera resolution is captured; no forced aspect ratio
    photo: {
        format:        'image/jpeg',
        quality:       0.92,   // capture quality — kept high, stored in IndexedDB
        exportQuality: 0.72    // re-encode quality for ZIP export (~400–600 KB/photo)
    },

    // Template base paths (relative to project root)
    templatePath: 'Test Sample PRETEST v2/Template/',
    packoutTemplatePath: 'Test Sample Packout/Packout/Photo Template/',

    // FAI Modes
    modes: {
        pretest: { id: 'pretest', name: 'Pretest FAI', description: 'First Article Inspection before testing' },
        packout: { id: 'packout', name: 'Packout FAI', description: 'First Article Inspection for packaging' }
    },

    // ===========================================
    // PRETEST FAI - Default Photos (Always taken)
    // ===========================================
    // Sequenced: FRONT → REAR → SIDES → LABELS
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

        // --- PDUs (rear) ---
        { id: 'PDU1', name: 'PDU Left - Photo 1', template: 'PDUL.png', orientation: 'portrait', location: 'rear', section: 'pdu' },
        { id: 'PDU2', name: 'PDU Left - Photo 2', template: 'PDUL.png', orientation: 'portrait', location: 'rear', section: 'pdu' },
        { id: 'PDU3', name: 'PDU Left - Photo 3', template: 'PDUL.png', orientation: 'portrait', location: 'rear', section: 'pdu' },
        { id: 'PDU4', name: 'PDU Right - Photo 1', template: 'PDUR.png', orientation: 'portrait', location: 'rear', section: 'pdu' },
        { id: 'PDU5', name: 'PDU Right - Photo 2', template: 'PDUR.png', orientation: 'portrait', location: 'rear', section: 'pdu' },
        { id: 'PDU6', name: 'PDU Right - Photo 3', template: 'PDUR.png', orientation: 'portrait', location: 'rear', section: 'pdu' },

        // --- LEFT SIDE ---
        { id: 'LS1', name: 'Left Side - Full', template: 'LS1.png', orientation: 'portrait', location: 'left_side', section: 'full' },
        { id: 'LS2', name: 'Left Side - Top Half', template: 'LS2.png', orientation: 'portrait', location: 'left_side', section: 'top_half' },
        { id: 'LS3', name: 'Left Side - Bottom Half', template: 'LS3.png', orientation: 'portrait', location: 'left_side', section: 'bottom_half' },

        // --- RIGHT SIDE ---
        { id: 'RS1', name: 'Right Side - Full', template: 'RS1.png', orientation: 'portrait', location: 'right_side', section: 'full' },
        { id: 'RS2', name: 'Right Side - Top Half', template: 'RS2.png', orientation: 'portrait', location: 'right_side', section: 'top_half' },
        { id: 'RS3', name: 'Right Side - Bottom Half', template: 'RS3.png', orientation: 'portrait', location: 'right_side', section: 'bottom_half' },

        // --- LABELS ---
        { id: 'LB1', name: 'Front Label',                       template: 'LB.png', orientation: 'landscape', location: 'labels', section: 'labels' },
        { id: 'LB2', name: 'Rear Left Side Label (Near PDU)',    template: 'LB.png', orientation: 'landscape', location: 'labels', section: 'labels' },
        { id: 'LB3', name: 'Rear Rack Bottom Left (Below PDU)',  template: 'LB.png', orientation: 'landscape', location: 'labels', section: 'labels' },
        { id: 'LB4', name: 'Rear Rack Bottom Middle',            template: 'LB.png', orientation: 'landscape', location: 'labels', section: 'labels' }
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
                    { suffix: 'T', name: 'Top', template: 'SW T.png', orientation: 'landscape' },
                    { suffix: 'B', name: 'Bottom', template: 'SW B.png', orientation: 'landscape' }
                ]
            },
            back: {
                prefix: 'BSW',
                location: 'rear',
                angles: [
                    { suffix: 'F', name: 'Front', template: 'BSW F.png', orientation: 'portrait' },
                    { suffix: 'L', name: 'Left',  template: 'BSW L.png', orientation: 'portrait' },
                    { suffix: 'R', name: 'Right', template: 'BSW R.png', orientation: 'portrait' }
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
                    { suffix: 'F', name: 'Front', template: 'SV F.png', orientation: 'landscape' },
                    { suffix: 'B', name: 'Bottom', template: 'SV B.png', orientation: 'landscape' },
                    { suffix: 'L', name: 'Left', template: 'SV L.png', orientation: 'landscape' },
                    { suffix: 'R', name: 'Right', template: 'SV R.png', orientation: 'landscape' }
                ]
            },
            back: {
                prefix: 'BSV',
                location: 'rear',
                angles: [
                    { suffix: 'F', name: 'Front', template: 'BSV F.png', orientation: 'landscape' },
                    { suffix: 'L', name: 'Left',  template: 'BSV L.png', orientation: 'landscape' },
                    { suffix: 'R', name: 'Right', template: 'BSV R.png', orientation: 'landscape' }
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
                    { suffix: 'C', name: 'Closed', template: 'CE C.png', orientation: 'landscape' },
                    { suffix: 'O', name: 'Open', template: 'CE O.png', orientation: 'landscape' }
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
    // NOTE: section assignments can be refined when final guidelines arrive.
    packoutDefaultPhotos: [
        // Open rack — front (BEFORE)
        { id: 'AFR1',   name: 'Open Rack - Front 1',           template: 'AFR1.png',   orientation: 'portrait',   location: 'front',  section: 'before_bag' },
        { id: 'AFR2',   name: 'Open Rack - Front 2',           template: 'AFR2.png',   orientation: 'portrait',   location: 'front',  section: 'before_bag' },
        { id: 'AFR3',   name: 'Open Rack - Front 3',           template: 'AFR3.png',   orientation: 'portrait',   location: 'front',  section: 'before_bag' },
        // Open rack — rear (BEFORE)
        { id: 'ARR1',   name: 'Open Rack - Rear 1',            template: 'ARR1.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        { id: 'ARR2',   name: 'Open Rack - Rear 2',            template: 'ARR2.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        { id: 'ARR3',   name: 'Open Rack - Rear 3',            template: 'ARR3.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        // Rack assy tags & SN (BEFORE)
        { id: 'SN',     name: 'Rack Serial Number',            template: 'FRAT.png',   orientation: 'landscape',  location: 'labels', section: 'before_bag' },
        { id: 'FRAT',   name: 'Front Rack Assy Tag',           template: 'FRAT.png',   orientation: 'landscape',  location: 'labels', section: 'before_bag' },
        // PDUs (BEFORE)
        { id: 'PDU1',   name: 'PDU Left - Photo 1',            template: 'PDU1.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        { id: 'PDU2',   name: 'PDU Left - Photo 2',            template: 'PDU2.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        { id: 'PDU3',   name: 'PDU Left - Photo 3',            template: 'PDU3.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        { id: 'PDU4',   name: 'PDU Right - Photo 1',           template: 'PDU4.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        { id: 'PDU5',   name: 'PDU Right - Photo 2',           template: 'PDU5.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        { id: 'PDU6',   name: 'PDU Right - Photo 3',           template: 'PDU6.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        // PDU assy tags (BEFORE)
        { id: 'PDUAT1', name: 'PDU Assy Tag 1',                template: 'PDUAT1.png', orientation: 'landscape',  location: 'rear',   section: 'before_bag' },
        { id: 'PDUAT2', name: 'PDU Assy Tag 2',                template: 'PDUAT2.png', orientation: 'landscape',  location: 'rear',   section: 'before_bag' },
        // Bagged rack — shrink-wrapped (AFTER)
        { id: 'BFRT',   name: 'Bagged Rack - Front Top',       template: 'BFRT.png',   orientation: 'portrait',   location: 'front',  section: 'bagged_rack' },
        { id: 'BFR1',   name: 'Bagged Rack - Front 1',         template: 'BFR1.png',   orientation: 'portrait',   location: 'front',  section: 'bagged_rack' },
        { id: 'BFR3',   name: 'Bagged Rack - Front 3',         template: 'BFR3.png',   orientation: 'portrait',   location: 'front',  section: 'bagged_rack' },
        { id: 'BRR2',   name: 'Bagged Rack - Rear 2',          template: 'BRR2.png',   orientation: 'portrait',   location: 'rear',   section: 'bagged_rack' },
        // Crated rack — front (AFTER)
        { id: 'CFR1',   name: 'Crated Rack - Front 1',         template: 'CFR1.png',   orientation: 'portrait',   location: 'front',  section: 'rack_in_carton' },
        { id: 'CFR2',   name: 'Crated Rack - Front 2',         template: 'CFR2.png',   orientation: 'landscape',  location: 'front',  section: 'rack_in_carton' },
        { id: 'CFRTT',  name: 'Crated Rack - Front Top',       template: 'CFRTT.png',  orientation: 'portrait',   location: 'front',  section: 'rack_in_carton' },
        // Crated rack — rear (AFTER)
        { id: 'CRR1',   name: 'Crated Rack - Rear 1',          template: 'CRR1.png',   orientation: 'portrait',   location: 'rear',   section: 'rack_in_carton' },
        { id: 'CRR2',   name: 'Crated Rack - Rear 2',          template: 'CRR2.png',   orientation: 'landscape',  location: 'rear',   section: 'rack_in_carton' },
        { id: 'CRR3',   name: 'Crated Rack - Rear 3',          template: 'CRR3.png',   orientation: 'landscape',  location: 'rear',   section: 'rack_in_carton' },
        // Crated rack — sides (AFTER)
        { id: 'CRS1',   name: 'Crated Rack - Right Side 1',    template: 'CRS1.png',   orientation: 'portrait',   location: 'side_a', section: 'rack_in_carton' },
        { id: 'CRS3',   name: 'Crated Rack - Right Side 3',    template: 'CRS3.png',   orientation: 'landscape',  location: 'side_a', section: 'rack_in_carton' },
        { id: 'CRSTT',  name: 'Crated Rack - Right Side Top',  template: 'CRSTT.png',  orientation: 'portrait',   location: 'side_a', section: 'rack_in_carton' },
        { id: 'CLS1',   name: 'Crated Rack - Left Side 1',     template: 'CLS1.png',   orientation: 'portrait',   location: 'side_b', section: 'rack_in_carton' },
        // Crate & package labels (LABELS)
        { id: 'CSN',    name: 'Crate - Customer Info Label',   template: 'CSN.png',    orientation: 'portrait',   location: 'labels', section: 'rack_in_carton' },
        { id: 'CCI',    name: 'Crate - Customer Info Doc',     template: 'CCI.png',    orientation: 'landscape',  location: 'labels', section: 'rack_in_carton' },
        { id: 'LB1',    name: 'Front Rack Bottom Label',            template: 'LB1.png',    orientation: 'landscape',  location: 'labels', section: 'before_bag' },
        { id: 'LB2',    name: 'Rear Rack Side Label (Near PDU)',   template: 'LB2.png',    orientation: 'landscape',  location: 'labels', section: 'before_bag' },
        { id: 'LB3',    name: 'Rear Rack Bottom Label (Under PDU)',template: 'LB3.png',    orientation: 'landscape',  location: 'labels', section: 'before_bag' },
        { id: 'LB4',    name: 'Rear Rack Bottom Label (Middle)',   template: 'LB4.png',    orientation: 'landscape',  location: 'labels', section: 'before_bag' }
    ],

    // PACKOUT FAI - Door Branding Add-on
    packoutDoorBranding: [
        { id: 'PK_DB1', name: 'Door Branding - Front', template: null, orientation: 'portrait', location: 'front', section: 'door_branding' },
        { id: 'PK_DB2', name: 'Door Branding - Rear', template: null, orientation: 'portrait', location: 'rear', section: 'door_branding' }
    ],

    // PACKOUT FAI - Accessory Kit Boxes (always taken, fixed set of 3)
    packoutAkbPhotos: [
        { id: 'AKB1', name: 'Accessory Kit Boxes - Photo 1', template: 'AKB1.png', orientation: 'portrait', location: 'accessory_kit', section: 'accessory_kit' },
        { id: 'AKB2', name: 'Accessory Kit Boxes - Photo 2', template: 'AKB2.png', orientation: 'portrait', location: 'accessory_kit', section: 'accessory_kit' },
        { id: 'AKB3', name: 'Accessory Kit Boxes - Photo 3', template: 'AKB3.png', orientation: 'portrait', location: 'accessory_kit', section: 'accessory_kit' }
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
        cableBend: 0,
        // Packout component quantities
        pkServers: 0,
        pkServersPerGroupFront: 0,
        pkServersPerGroupRear: 0,
        pkSwitches: 0,
        pkSwitchesPerStackFront: 0,
        pkSwitchesPerStackRear: 0,
        pkAkPns: 0
    },

    // Packout options
    hasDoorBranding: false,

    // Switch stack orientations (keyed by stack number, set live via modal)
    switchOrientations: {},

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
    // Order: FRONT → REAR → SIDES → LABELS
    _buildPretestQueue() {
        const defaults = CONFIG.pretestDefaultPhotos;
        const comps = this.components;

        // Generate component photos in explicit order
        // Front section: switches → servers → cableBend (after servers) → corningEdge
        // Labels section: cableLabels (last, with LB photos)
        const frontOrder  = ['switches', 'servers', 'cableBend', 'corningEdge'];
        const labelOrder  = ['cableLabels'];

        let frontComponents = [];
        let backComponents  = [];
        let labelComponents = [];

        for (const typeKey of frontOrder) {
            const qty = comps[typeKey] || 0;
            if (qty > 0) {
                const photos = CONFIG.generateComponentPhotos(typeKey, qty);
                frontComponents = frontComponents.concat(photos.front);
                backComponents  = backComponents.concat(photos.back);
            }
        }

        for (const typeKey of labelOrder) {
            const qty = comps[typeKey] || 0;
            if (qty > 0) {
                const photos = CONFIG.generateComponentPhotos(typeKey, qty);
                labelComponents = labelComponents.concat(photos.front);
            }
        }

        // === SEQUENCE ===
        // 1. FRONT: FR1-FR9
        this._addPhotos(defaults.filter(p => p.id.startsWith('FR')));
        // 2. FRONT COMPONENTS: SW → SV → CB → CE
        this._addPhotos(frontComponents);

        // 3. REAR: RR1-RR9
        this._addPhotos(defaults.filter(p => p.id.startsWith('RR')));
        // 4. REAR COMPONENTS: BSW → BSV
        this._addPhotos(backComponents);
        // 5. PDUs
        this._addPhotos(defaults.filter(p => p.id.startsWith('PDU')));

        // 6. SIDES: Left → Right
        this._addPhotos(defaults.filter(p => p.id.startsWith('LS')));
        this._addPhotos(defaults.filter(p => p.id.startsWith('RS')));

        // 7. LABELS: LB1-3 → CL cable labels
        this._addPhotos(defaults.filter(p => p.id.startsWith('LB')));
        this._addPhotos(labelComponents);
    },

    // Build Packout photo queue
    _buildPackoutQueue() {
        // === 1. RACK: open rack photos (before bagging) ===
        for (const photo of CONFIG.packoutDefaultPhotos.filter(p => p.section === 'before_bag')) {
            this._addPhoto(photo);
        }

        // === 2. AK BOX: server/switch assy tags + AK PNs + AKB boxes ===
        // Server group front views + front assy tags
        for (let g = 1; g <= this.components.pkServers; g++) {
            this._addPhoto({ id: `SV${g}`, name: `Server Group ${g} - Full View`, orientation: 'landscape', section: 'assy_tag', location: 'front', template: 'SV.png' });
            for (let s = 1; s <= this.components.pkServersPerGroupFront; s++) {
                this._addPhoto({ id: `SV${g}AT${s}`, name: `Server Group ${g} - Assy Tag ${s} Front`, orientation: 'landscape', section: 'assy_tag', location: 'front', template: 'SV AT.png' });
            }
        }
        // Switch stack full views + front assy tags
        for (let st = 1; st <= this.components.pkSwitches; st++) {
            this._addPhoto({ id: `SW${st}`, name: `Switch Stack ${st} - Full View`, orientation: 'landscape', section: 'assy_tag', location: 'front', template: 'SW.png' });
            for (let sw = 1; sw <= this.components.pkSwitchesPerStackFront; sw++) {
                this._addPhoto({ id: `SW${st}AT${sw}`, name: `Switch Stack ${st} - Assy Tag ${sw} Front`, orientation: 'landscape', section: 'assy_tag', location: 'front', template: 'SW AT.png' });
            }
        }
        // Server group rear views + rear assy tags
        for (let g = 1; g <= this.components.pkServers; g++) {
            this._addPhoto({ id: `BSV${g}F`, name: `Server Group ${g} - Full Rear View`, orientation: 'landscape', section: 'assy_tag', location: 'rear', template: 'BSV F.png' });
            for (let s = 1; s <= this.components.pkServersPerGroupRear; s++) {
                this._addPhoto({ id: `BSV${g}AT${s}`, name: `Server Group ${g} - Assy Tag ${s} Rear`, orientation: 'landscape', section: 'assy_tag', location: 'rear', template: 'BSV AT.png' });
            }
        }
        // Switch stack rear assy tags
        for (let st = 1; st <= this.components.pkSwitches; st++) {
            for (let sw = 1; sw <= this.components.pkSwitchesPerStackRear; sw++) {
                this._addPhoto({ id: `BSW${st}AT${sw}`, name: `Switch Stack ${st} - Assy Tag ${sw} Rear`, orientation: 'landscape', section: 'assy_tag', location: 'rear', template: 'BSW AT.png' });
            }
        }
        // AK PNs (bubble mailers)
        for (let n = 1; n <= this.components.pkAkPns; n++) {
            this._addPhoto({ id: `AK${n}`, name: `Accessory Kit PN ${n}`, orientation: 'landscape', section: 'accessory_kit', location: 'accessory_kit', template: 'AK.png' });
        }
        // AKB boxes (fixed set of 3, always taken)
        for (const photo of CONFIG.packoutAkbPhotos) {
            this._addPhoto(photo);
        }

        // === 3. PLASTIC: bagged rack (shrink-wrapped) ===
        for (const photo of CONFIG.packoutDefaultPhotos.filter(p => p.section === 'bagged_rack')) {
            this._addPhoto(photo);
        }

        // === 4. CARTON: crated rack + labels ===
        for (const photo of CONFIG.packoutDefaultPhotos.filter(p => p.section === 'rack_in_carton')) {
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

    // Generate filename: {ID}.jpg (PN/SN already appear in the ZIP filename)
    generateFilename(photo) {
        return `${photo.id}.jpg`;
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
            // Per server group: SV (1) + front AT + BSV F (1) + rear AT = 2 + front + rear
            count += this.components.pkServers * (2 + this.components.pkServersPerGroupFront + this.components.pkServersPerGroupRear);
            // Per switch stack: SW (1) + front AT + rear AT = 1 + front + rear
            count += this.components.pkSwitches * (1 + this.components.pkSwitchesPerStackFront + this.components.pkSwitchesPerStackRear);
            count += this.components.pkAkPns;
            count += CONFIG.packoutAkbPhotos.length; // AKB always 3
        }

        return count;
    },

    // Set orientation for all photos in a switch stack (called after modal confirmation)
    setStackOrientation(stackNum, orientation) {
        this.switchOrientations[stackNum] = orientation;
        for (const photo of this.photoQueue) {
            const m = photo.id.match(/^(BSW|SW)(\d+)/);
            if (m && parseInt(m[2]) === stackNum) {
                photo.orientation = orientation;
            }
        }
    },

    // Serialize session state for persistence (excludes photo blobs - those go to IndexedDB)
    toJSON() {
        return {
            mode: this.mode,
            partNumber: this.partNumber,
            serialNumber: this.serialNumber,
            components: { ...this.components },
            hasDoorBranding: this.hasDoorBranding,
            switchOrientations: { ...this.switchOrientations },
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
        this.components = {
            switches: 0, servers: 0, corningEdge: 0, cableLabels: 0, cableBend: 0,
            pkServers: 0, pkServersPerGroupFront: 0, pkServersPerGroupRear: 0,
            pkSwitches: 0, pkSwitchesPerStackFront: 0, pkSwitchesPerStackRear: 0, pkAkPns: 0,
            ...(data.components || {})
        };
        this.hasDoorBranding = data.hasDoorBranding || false;
        this.switchOrientations = data.switchOrientations || {};
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
            cableBend: 0,
            pkServers: 0,
            pkServersPerGroupFront: 0,
            pkServersPerGroupRear: 0,
            pkSwitches: 0,
            pkSwitchesPerStackFront: 0,
            pkSwitchesPerStackRear: 0,
            pkAkPns: 0
        };
        this.hasDoorBranding = false;
        this.switchOrientations = {};
        this.photoQueue = [];
        this.currentPhotoIndex = 0;
        this.capturedPhotos = [];
    }
};
