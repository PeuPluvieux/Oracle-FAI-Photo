/**
 * Oracle FAI Photos - Service Worker
 * Caches all app assets for offline use.
 * Strategy: cache-first for static assets, network-first for CDN with cache fallback.
 */

const CACHE_VERSION = 'v32';
const CACHE_NAME = `oracle-fai-${CACHE_VERSION}`;

// All local static assets
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon.svg',
    './css/styles.css',
    './js/config.js',
    './js/storage.js',
    './js/camera.js',
    './js/capture.js',
    './js/export.js',
    './js/screens.js',
    './js/app.js'
];

// Template PNG files (spaces encoded for URL matching)
const TEMPLATE_BASE = './Test%20Sample%20PRETEST%20v2/Template/';
const TEMPLATE_FILES = [
    'BSV%20F.png', 'BSV%20L.png', 'BSV%20R.png',
    'BSW%20F.png', 'BSW%20L.png', 'BSW%20R.png',
    'CB.png', 'CE%20C.png', 'CE%20O.png', 'CL.png',
    'FR1.png', 'FR2.png', 'FR3.png', 'FR4.png', 'FR5.png',
    'FR6.png', 'FR7.png', 'FR8.png', 'FR9.png',
    'LB1.png', 'LB2.png', 'LB3.png', 'LB4.png',
    'LS1.png', 'LS2.png', 'LS3.png',
    'PDUL.png', 'PDUR.png',
    'RR1.png', 'RR2.png', 'RR3.png', 'RR4.png', 'RR5.png',
    'RR6.png', 'RR7.png', 'RR8.png', 'RR9.png',
    'RS1.png', 'RS2.png', 'RS3.png',
    'SV%20B.png', 'SV%20F.png', 'SV%20L.png', 'SV%20R.png',
    'SW%20B.png', 'SW%20T.png'
].map(f => TEMPLATE_BASE + f);

// CDN resources - try to cache on first fetch
const CDN_URLS = [
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    'https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js'
];

// Packout template PNG files
const PACKOUT_TEMPLATE_BASE = './Test%20Sample%20Packout/Packout/Photo%20Template/';
const PACKOUT_TEMPLATE_FILES = [
    'AFR1.png', 'AFR2.png', 'AFR3.png',
    'AK.png',
    'AKB1.png', 'AKB2.png', 'AKB3.png',
    'ARR1.png', 'ARR2.png', 'ARR3.png',
    'BFR1.png', 'BFR3.png', 'BFRT.png', 'BRR2.png',
    'BSV%20AT.png', 'BSV%20F.png',
    'BSW%20AT.png',
    'CCI.png', 'CFR1.png', 'CFR2.png', 'CFRTT.png',
    'CLS1.png',
    'CRR1.png', 'CRR2.png', 'CRR3.png',
    'CRS1.png', 'CRS3.png', 'CRSTT.png',
    'CSN.png', 'FRAT.png',
    'LB1.png', 'LB2.png', 'LB3.png', 'LB4.png',
    'PDU1.png', 'PDU2.png', 'PDU3.png', 'PDU4.png', 'PDU5.png', 'PDU6.png',
    'PDUAT1.png', 'PDUAT2.png',
    'SV%20AT.png', 'SV.png',
    'SW%20AT.png', 'SW.png'
].map(f => PACKOUT_TEMPLATE_BASE + f);

const ALL_ASSETS = [...STATIC_ASSETS, ...TEMPLATE_FILES, ...PACKOUT_TEMPLATE_FILES];

// ── Install: cache all local assets ────────────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // Cache local assets (fail fast if any missing)
                return cache.addAll(ALL_ASSETS);
            })
            .then(() => self.skipWaiting())
            .catch(err => {
                console.warn('[SW] Install cache error:', err);
                // Still skip waiting so the SW activates
                return self.skipWaiting();
            })
    );
});

// ── Activate: delete old caches ────────────────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// ── Fetch: serve from cache, update in background ──────────────────────────
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    const url = event.request.url;
    const isCDN = CDN_URLS.some(cdn => url.startsWith(cdn));

    if (isCDN) {
        // Network-first for CDN: fresh if online, cached fallback if offline
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        // Cache-first for local assets: serve cache, refresh in background
        event.respondWith(
            caches.match(event.request).then(cached => {
                const networkFetch = fetch(event.request).then(response => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                    }
                    return response;
                }).catch(() => null);

                return cached || networkFetch.then(r => r || caches.match('./index.html'));
            })
        );
    }
});
