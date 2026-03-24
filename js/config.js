/**
 * Oracle FAI Photos - Configuration
 * Central configuration for photo sequences, templates, and component types
 */

const APP_VERSION = 'V2.40.0';

const CONFIG = {
    // Photo settings - single portrait mode, no cropping
    // Full camera resolution is captured; no forced aspect ratio
    photo: {
        format:             'image/jpeg',
        quality:            0.92,    // capture quality — stored in IndexedDB
        exportQuality:      0.85,    // re-encode quality for ZIP
        maxExportDimension: 2400     // longest side cap — portrait → 1800×2400, landscape → 2400×1800
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
        { id: 'LB1', name: 'Front Label',                       template: 'LB1.png', orientation: 'landscape', location: 'labels', section: 'labels' },
        { id: 'LB2', name: 'Rear Left Side Label (Near PDU)',    template: 'LB2.png', orientation: 'landscape', location: 'labels', section: 'labels' },
        { id: 'LB3', name: 'Rear Rack Bottom Left (Below PDU)',  template: 'LB3.png', orientation: 'landscape', location: 'labels', section: 'labels' },
        { id: 'LB4', name: 'Rear Rack Bottom Middle',            template: 'LB4.png', orientation: 'landscape', location: 'labels', section: 'labels' }
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
        { id: 'AFR1',   name: 'Front Rack - Straight on',       template: 'AFR1.png',   orientation: 'portrait',   location: 'front',  section: 'before_bag' },
        { id: 'AFR2',   name: 'Front Rack - 45° Right',         template: 'AFR2.png',   orientation: 'portrait',   location: 'front',  section: 'before_bag' },
        { id: 'AFR3',   name: 'Front Rack - 45° Left',          template: 'AFR3.png',   orientation: 'portrait',   location: 'front',  section: 'before_bag' },
        // Open rack — rear (BEFORE)
        { id: 'ARR1',   name: 'Rear Rack - Straight on',        template: 'ARR1.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        { id: 'ARR2',   name: 'Rear Rack - 45° Right',          template: 'ARR2.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        { id: 'ARR3',   name: 'Rear Rack - 45° Left',           template: 'ARR3.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        // Rack assy tags (BEFORE)
        { id: 'FRAT',   name: 'Front Rack Assy Tag',            template: 'FRAT.png',   orientation: 'landscape',  location: 'labels', section: 'before_bag' },
        // PDUs (BEFORE)
        { id: 'PDU1',   name: 'PDU Left - Top',                 template: 'PDU1.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        { id: 'PDU2',   name: 'PDU Left - Middle',              template: 'PDU2.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        { id: 'PDU3',   name: 'PDU Left - Bottom',              template: 'PDU3.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        { id: 'PDU4',   name: 'PDU Right - Top',                template: 'PDU4.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        { id: 'PDU5',   name: 'PDU Right - Middle',             template: 'PDU5.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        { id: 'PDU6',   name: 'PDU Right - Bottom',             template: 'PDU6.png',   orientation: 'portrait',   location: 'rear',   section: 'before_bag' },
        // PDU assy tags (BEFORE)
        { id: 'PDUAT1', name: 'PDU Assy Tag 1',                template: 'PDUAT1.png', orientation: 'landscape',  location: 'rear',   section: 'before_bag' },
        { id: 'PDUAT2', name: 'PDU Assy Tag 2',                template: 'PDUAT2.png', orientation: 'landscape',  location: 'rear',   section: 'before_bag' },
        // Bagged rack — shrink-wrapped (AFTER)
        { id: 'BFRT',   name: 'Bagged Rack - Front Top',       template: 'BFRT.png',   orientation: 'portrait',   location: 'front',  section: 'bagged_rack' },
        { id: 'BFR1',   name: 'Bagged Rack - Straight on',      template: 'BFR1.png',   orientation: 'portrait',   location: 'front',  section: 'bagged_rack' },
        { id: 'BFR3',   name: 'Bagged Rack - 45° Right',        template: 'BFR3.png',   orientation: 'portrait',   location: 'front',  section: 'bagged_rack' },
        { id: 'BRR2',   name: 'Bagged Rack - 45° Right (Rear Side)', template: 'BRR2.png', orientation: 'portrait', location: 'rear',   section: 'bagged_rack' },
        // Crated rack — front (AFTER)
        { id: 'CFR1',   name: 'Crated Rack - Straight on (Front Side)', template: 'CFR1.png', orientation: 'portrait', location: 'front', section: 'rack_in_carton' },
        { id: 'CFR2',   name: 'Crated Rack - Front anti-tamper label',  template: 'CFR2.png', orientation: 'landscape', location: 'front', section: 'rack_in_carton' },
        { id: 'CFRTT',  name: "Crated Rack - Front Tip 'N Tell",        template: 'CFRTT.png', orientation: 'portrait', location: 'front', section: 'rack_in_carton' },
        // Crated rack — rear (AFTER)
        { id: 'CRR1',   name: 'Crated Rack - Straight on (Rear Side)',  template: 'CRR1.png',  orientation: 'portrait',  location: 'rear',   section: 'rack_in_carton' },
        { id: 'CRR2',   name: 'Crated Rack - Rear anti-tamper label',   template: 'CRR2.png',  orientation: 'landscape', location: 'rear',   section: 'rack_in_carton' },
        { id: 'CRR3',   name: 'Crated Rack - anti-tamper label (straps)', template: 'CRR3.png', orientation: 'landscape', location: 'rear',  section: 'rack_in_carton' },
        // Crated rack — sides (AFTER)
        { id: 'CRS1',   name: 'Crated Rack - Right Side',       template: 'CRS1.png',   orientation: 'portrait',   location: 'side_a', section: 'rack_in_carton' },
        { id: 'CRS3',   name: 'Crated Rack - anti-tamper label (straps)', template: 'CRS3.png', orientation: 'landscape', location: 'side_a', section: 'rack_in_carton' },
        { id: 'CRSTT',  name: "Crated Rack - Right side Tip 'N Tell",   template: 'CRSTT.png',  orientation: 'portrait',  location: 'side_a', section: 'rack_in_carton' },
        { id: 'CLS1',   name: 'Crated Rack - Left Side',        template: 'CLS1.png',   orientation: 'portrait',   location: 'side_b', section: 'rack_in_carton' },
        // Crate & package labels (LABELS)
        { id: 'CSN',    name: 'Customer info - Shipping label', template: 'CSN.png',    orientation: 'portrait',   location: 'labels', section: 'rack_in_carton' },
        { id: 'CCI',    name: 'Customer info - Shipping docs',  template: 'CCI.png',    orientation: 'landscape',  location: 'labels', section: 'rack_in_carton' },
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
        pkSwitches: 0,
        pkAkPns: 0,
        pkServerGroupATs: [],   // [{ front: N, rear: N }, ...] — one entry per server group
        pkSwitchStackATs: [],   // [{ front: N, rear: N }, ...] — one entry per switch stack
        pkCustomComponents: []  // [{ name: str, units: N, frontATs: N, rearATs: N }, ...]
    },

    // Packout options
    hasDoorBranding: false,

    // Packout start section (null = full session, or 'assy_tag'/'bagged_rack'/'rack_in_carton')
    startSection: null,

    // Packout mid-session confirmation gates
    checkpointBagging: false,   // true after user confirms Snapshot Video 2
    checkpointCarton:  false,   // true after user confirms Snapshot Video 3

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
        const po = id => CONFIG.packoutDefaultPhotos.find(p => p.id === id);

        // === 1. Accessory kits (AK BOX pill) ===
        for (let n = 1; n <= this.components.pkAkPns; n++)
            this._addPhoto({ id: `AK${n}`, name: `Accessory Kit PN ${n}`, orientation: 'landscape', section: 'accessory_kit', location: 'accessory_kit', template: 'AK.png' });
        for (const photo of CONFIG.packoutAkbPhotos) this._addPhoto(photo);

        // === 2. Open rack FRONT (RACK pill) ===
        ['AFR1', 'AFR2', 'AFR3'].forEach(id => this._addPhoto(po(id)));

        // === 3. Component FRONTS — servers (RACK pill) ===
        this.components.pkServerGroupATs.forEach(({ front }, i) => {
            const g = i + 1;
            this._addPhoto({ id: `SV${g}`, name: `Server Group ${g} - Full View`, orientation: 'landscape', section: 'before_bag', location: 'front', template: 'SV.png' });
            for (let s = 1; s <= front; s++)
                this._addPhoto({ id: `SV${g}AT${s}`, name: `Server Group ${g} - Assy Tag ${s} Front`, orientation: 'landscape', section: 'before_bag', location: 'front', template: 'SV AT.png' });
        });

        // === 3b. Component FRONTS — switches (RACK pill) ===
        this.components.pkSwitchStackATs.forEach(({ front }, i) => {
            const st = i + 1;
            this._addPhoto({ id: `SW${st}`, name: `Switch Stack ${st} - Full View`, orientation: 'landscape', section: 'before_bag', location: 'front', template: 'SW.png' });
            for (let sw = 1; sw <= front; sw++)
                this._addPhoto({ id: `SW${st}AT${sw}`, name: `Switch Stack ${st} - Assy Tag ${sw} Front`, orientation: 'landscape', section: 'before_bag', location: 'front', template: 'SW AT.png' });
        });

        // === 3c. Component FRONTS — custom components (RACK pill) ===
        this.components.pkCustomComponents.forEach(({ name, units, frontATs }, c) => {
            const cx = c + 1;
            for (let u = 1; u <= units; u++) {
                this._addPhoto({ id: `CC${cx}U${u}`, name: `${name} ${u} - Full View`, orientation: 'landscape', section: 'before_bag', location: 'front', template: 'SV.png' });
                for (let s = 1; s <= frontATs; s++)
                    this._addPhoto({ id: `CC${cx}U${u}AT${s}`, name: `${name} ${u} - Assy Tag ${s} Front`, orientation: 'landscape', section: 'before_bag', location: 'front', template: 'SV AT.png' });
            }
        });

        // === 4. Open rack REAR (RACK pill) ===
        ['ARR1', 'ARR2', 'ARR3'].forEach(id => this._addPhoto(po(id)));

        // === 5. Component REARS — servers (RACK pill) ===
        this.components.pkServerGroupATs.forEach(({ rear }, i) => {
            const g = i + 1;
            if (rear > 0)
                this._addPhoto({ id: `BSV${g}`, name: `Server Group ${g} - Full Rear View`, orientation: 'landscape', section: 'before_bag', location: 'rear', template: 'BSV F.png' });
            for (let s = 1; s <= rear; s++)
                this._addPhoto({ id: `BSV${g}AT${s}`, name: `Server Group ${g} - Assy Tag ${s} Rear`, orientation: 'landscape', section: 'before_bag', location: 'rear', template: 'BSV AT.png' });
        });

        // === 5b. Component REARS — switches (RACK pill) ===
        this.components.pkSwitchStackATs.forEach(({ rear }, i) => {
            const st = i + 1;
            if (rear > 0)
                this._addPhoto({ id: `BSW${st}`, name: `Switch Stack ${st} - Full Rear View`, orientation: 'landscape', section: 'before_bag', location: 'rear', template: 'BSW AT.png' });
            for (let sw = 1; sw <= rear; sw++)
                this._addPhoto({ id: `BSW${st}AT${sw}`, name: `Switch Stack ${st} - Assy Tag ${sw} Rear`, orientation: 'landscape', section: 'before_bag', location: 'rear', template: 'BSW AT.png' });
        });

        // === 5c. Component REARS — custom components (RACK pill) ===
        this.components.pkCustomComponents.forEach(({ name, units, rearATs }, c) => {
            const cx = c + 1;
            for (let u = 1; u <= units; u++) {
                if (rearATs > 0)
                    this._addPhoto({ id: `BCC${cx}U${u}`, name: `${name} ${u} - Full Rear View`, orientation: 'landscape', section: 'before_bag', location: 'rear', template: 'BSV F.png' });
                for (let s = 1; s <= rearATs; s++)
                    this._addPhoto({ id: `BCC${cx}U${u}AT${s}`, name: `${name} ${u} - Assy Tag ${s} Rear`, orientation: 'landscape', section: 'before_bag', location: 'rear', template: 'BSV AT.png' });
            }
        });

        // === 6. PDUs (RACK pill) ===
        ['PDU1', 'PDU2', 'PDU3', 'PDU4', 'PDU5', 'PDU6', 'PDUAT1', 'PDUAT2'].forEach(id => this._addPhoto(po(id)));

        // === 7. Pre-bag labels (RACK pill) ===
        ['FRAT', 'LB1', 'LB2', 'LB3', 'LB4'].forEach(id => this._addPhoto(po(id)));

        // === 8. Bagged rack (PLASTIC pill) ===
        ['BFRT', 'BFR1', 'BFR3', 'BRR2'].forEach(id => this._addPhoto(po(id)));

        // === 9. Crated rack (CARTON pill) ===
        ['CFR1', 'CFR2', 'CFRTT', 'CRR1', 'CRR2', 'CRR3', 'CRS1', 'CRS3', 'CRSTT', 'CLS1', 'CSN', 'CCI'].forEach(id => this._addPhoto(po(id)));

        if (this.hasDoorBranding)
            for (const photo of CONFIG.packoutDoorBranding) this._addPhoto(photo);

        // Trim queue to the chosen start section
        if (this.startSection) {
            const idx = this.photoQueue.findIndex(p => p.section === this.startSection);
            if (idx > 0) this.photoQueue = this.photoQueue.slice(idx);
            if (this.startSection === 'bagged_rack' || this.startSection === 'rack_in_carton') {
                this.checkpointBagging = true;
            }
            if (this.startSection === 'rack_in_carton') {
                this.checkpointCarton = true;
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
            if (this.hasDoorBranding) count += CONFIG.packoutDoorBranding.length;

            // Per server group: SV full view + front ATs + (BSV full view if rear > 0) + rear ATs
            for (const g of this.components.pkServerGroupATs) {
                count += 1 + g.front;
                if (g.rear > 0) count += 1;
                count += g.rear;
            }
            // Per switch stack: SW full view + front ATs + (BSW full view if rear > 0) + rear ATs
            for (const st of this.components.pkSwitchStackATs) {
                count += 1 + st.front;
                if (st.rear > 0) count += 1;
                count += st.rear;
            }
            // Custom components: (full view + front ATs) per unit + optional (full rear + rear ATs) per unit
            for (const cx of this.components.pkCustomComponents) {
                count += cx.units * (1 + cx.frontATs);
                if (cx.rearATs > 0) count += cx.units * (1 + cx.rearATs);
            }
            count += this.components.pkAkPns;
            count += CONFIG.packoutAkbPhotos.length; // AKB always 3

            // Subtract photos from sections that are being skipped
            if (this.startSection) {
                const bySection = {};
                for (const p of CONFIG.packoutDefaultPhotos) {
                    bySection[p.section] = (bySection[p.section] || 0) + 1;
                }
                // skip assy_tag + accessory_kit (AK BOX is now first)
                if (['before_bag', 'bagged_rack', 'rack_in_carton'].includes(this.startSection)) {
                    for (const g  of this.components.pkServerGroupATs)  { count -= 1 + g.front  + (g.rear  > 0 ? 1 + g.rear  : 0); }
                    for (const st of this.components.pkSwitchStackATs)  { count -= 1 + st.front + (st.rear > 0 ? 1 + st.rear : 0); }
                    for (const cx of this.components.pkCustomComponents) {
                        count -= cx.units * (1 + cx.frontATs);
                        if (cx.rearATs > 0) count -= cx.units * (1 + cx.rearATs);
                    }
                    count -= this.components.pkAkPns + CONFIG.packoutAkbPhotos.length;
                }
                // skip before_bag (RACK section)
                if (['bagged_rack', 'rack_in_carton'].includes(this.startSection)) {
                    count -= bySection['before_bag'] || 0;
                }
                // skip bagged_rack
                if (this.startSection === 'rack_in_carton') {
                    count -= bySection['bagged_rack'] || 0;
                }
            }
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
            startSection: this.startSection,
            checkpointBagging: this.checkpointBagging,
            checkpointCarton:  this.checkpointCarton,
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
        const incoming = data.components || {};
        this.components = {
            switches: 0, servers: 0, corningEdge: 0, cableLabels: 0, cableBend: 0,
            pkServers: 0, pkSwitches: 0, pkAkPns: 0,
            pkServerGroupATs: [], pkSwitchStackATs: [], pkCustomComponents: [],
            ...incoming
        };
        // Migrate legacy global-per-group AT keys (sessions saved before per-group UI)
        if (!incoming.pkServerGroupATs && incoming.pkServers > 0) {
            const f = incoming.pkServersPerGroupFront || 0;
            const r = incoming.pkServersPerGroupRear  || 0;
            this.components.pkServerGroupATs = Array.from({ length: incoming.pkServers }, () => ({ front: f, rear: r }));
        }
        if (!incoming.pkSwitchStackATs && incoming.pkSwitches > 0) {
            const f = incoming.pkSwitchesPerStackFront || 0;
            const r = incoming.pkSwitchesPerStackRear  || 0;
            this.components.pkSwitchStackATs = Array.from({ length: incoming.pkSwitches }, () => ({ front: f, rear: r }));
        }
        this.hasDoorBranding    = data.hasDoorBranding    || false;
        this.startSection       = data.startSection       || null;
        this.checkpointBagging  = data.checkpointBagging  || false;
        this.checkpointCarton   = data.checkpointCarton   || false;
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
            pkSwitches: 0,
            pkAkPns: 0,
            pkServerGroupATs: [],
            pkSwitchStackATs: [],
            pkCustomComponents: []
        };
        this.hasDoorBranding   = false;
        this.startSection      = null;
        this.checkpointBagging = false;
        this.checkpointCarton  = false;
        this.switchOrientations = {};
        this.photoQueue = [];
        this.currentPhotoIndex = 0;
        this.capturedPhotos = [];
    }
};
