/**
 * Oracle FAI Photos - Storage Module
 * Persists photos to IndexedDB (as blobs) and session metadata to localStorage.
 * Photos are saved immediately after capture so they survive crashes/reloads.
 */

const Storage = {
    DB_NAME: 'oracle-fai-photos',
    DB_VERSION: 1,
    STORE_NAME: 'photos',
    SESSION_KEY: 'oracle-fai-session',
    db: null,

    // Open (or create) the IndexedDB database
    async init() {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    // Store photos keyed by their photo ID
                    db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };

            request.onerror = (e) => {
                console.error('IndexedDB open error:', e.target.error);
                reject(e.target.error);
            };
        });
    },

    // Save a single photo blob to IndexedDB (fire-and-forget)
    // capturedPhoto: { id, filename, dataUrl, timestamp, ... }
    savePhoto(capturedPhoto) {
        if (!this.db) {
            console.warn('Storage not initialized, skipping photo save');
            return;
        }

        try {
            // Convert dataUrl to Blob to save ~33% space vs base64
            const blob = this._dataUrlToBlob(capturedPhoto.dataUrl);

            const record = {
                id: capturedPhoto.id,
                filename: capturedPhoto.filename,
                name: capturedPhoto.name,
                orientation: capturedPhoto.orientation,
                location: capturedPhoto.location,
                section: capturedPhoto.section,
                template: capturedPhoto.template || null,
                componentType: capturedPhoto.componentType || null,
                unitNumber: capturedPhoto.unitNumber || null,
                timestamp: capturedPhoto.timestamp,
                blob: blob
            };

            const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
            tx.objectStore(this.STORE_NAME).put(record);
            // Fire-and-forget: don't await the transaction
        } catch (err) {
            console.error('Storage.savePhoto error:', err);
        }
    },

    // Load all photos from IndexedDB, returning them as capturedPhoto objects with dataUrls
    async loadPhotos() {
        if (!this.db) {
            console.warn('Storage not initialized');
            return [];
        }

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.STORE_NAME, 'readonly');
            const request = tx.objectStore(this.STORE_NAME).getAll();

            request.onsuccess = (e) => {
                const records = e.target.result || [];
                const photos = records.map(record => {
                    // Convert blob back to dataUrl for in-memory use
                    return this._blobToDataUrl(record.blob).then(dataUrl => ({
                        id: record.id,
                        filename: record.filename,
                        name: record.name,
                        orientation: record.orientation,
                        location: record.location,
                        section: record.section,
                        template: record.template,
                        componentType: record.componentType,
                        unitNumber: record.unitNumber,
                        timestamp: record.timestamp,
                        dataUrl: dataUrl
                    }));
                });
                Promise.all(photos).then(resolve).catch(reject);
            };

            request.onerror = (e) => {
                console.error('Storage.loadPhotos error:', e.target.error);
                reject(e.target.error);
            };
        });
    },

    // Save session metadata to localStorage
    saveSession(sessionData) {
        try {
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
        } catch (err) {
            console.error('Storage.saveSession error:', err);
        }
    },

    // Load session metadata from localStorage (returns null if none)
    loadSession() {
        try {
            const data = localStorage.getItem(this.SESSION_KEY);
            return data ? JSON.parse(data) : null;
        } catch (err) {
            console.error('Storage.loadSession error:', err);
            return null;
        }
    },

    // Clear all persisted data (photos + session)
    async clearAll() {
        // Clear IndexedDB photos
        if (this.db) {
            await new Promise((resolve, reject) => {
                const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
                const request = tx.objectStore(this.STORE_NAME).clear();
                request.onsuccess = () => resolve();
                request.onerror = (e) => reject(e.target.error);
            });
        }

        // Clear localStorage session
        localStorage.removeItem(this.SESSION_KEY);
    },

    // Delete a single photo from IndexedDB by id
    deletePhoto(photoId) {
        if (!this.db) return;

        try {
            const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
            tx.objectStore(this.STORE_NAME).delete(photoId);
        } catch (err) {
            console.error('Storage.deletePhoto error:', err);
        }
    },

    // Get count of stored photos (without loading blobs)
    async getPhotoCount() {
        if (!this.db) return 0;

        return new Promise((resolve) => {
            const tx = this.db.transaction(this.STORE_NAME, 'readonly');
            const request = tx.objectStore(this.STORE_NAME).count();
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = () => resolve(0);
        });
    },

    // --- Internal helpers ---

    _dataUrlToBlob(dataUrl) {
        const parts = dataUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    },

    _blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
};
