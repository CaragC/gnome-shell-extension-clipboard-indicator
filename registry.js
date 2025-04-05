import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import { MAX_REGISTRY_LENGTH, CACHE_ONLY_FAVORITE } from './lib/settings.js';
import { REGISTRY_DIR } from './constants.js';

export const ClipboardEntry = GObject.registerClass({
    GTypeName: 'ClipboardIndicatorClipboardEntry'
}, class ClipboardEntry extends GObject.Object {
    _init(mimeType, bytes, favorite = false) {
        super._init();
        this._mimeType = mimeType;
        this._bytes = bytes;
        this._favorite = favorite;
        this._id = GLib.uuid_string_random();
    }

    mimetype() {
        return this._mimeType;
    }

    asBytes() {
        return this._bytes;
    }

    getText() {
        if (this.isText()) {
            let decoder = new TextDecoder('utf-8');
            return decoder.decode(this._bytes);
        }
        return "[Non-text data]";
    }

    setText(text) {
        let encoder = new TextEncoder();
        this._bytes = encoder.encode(text);
        this._mimeType = "text/plain;charset=utf-8";
    }

    isText() {
        return this._mimeType.startsWith('text/') || 
               this._mimeType === "UTF8_STRING" ||
               this._mimeType === "STRING";
    }

    isImage() {
        return this._mimeType.startsWith('image/');
    }

    isFavorite() {
        return this._favorite;
    }

    setFavorite(state) {
        this._favorite = state;
    }

    getId() {
        return this._id;
    }

    getTexture() {
        if (!this.isImage()) {
            return null;
        }

        try {
            // Create texture from bytes
            let gicon = Gio.BytesIcon.new(new GLib.Bytes(this._bytes));
            return new St.Icon({
                gicon: gicon,
                icon_size: 24
            });
        } catch (e) {
            console.error('Failed to create texture:', e);
            return null;
        }
    }
});

export class Registry {
    constructor(extension) {
        this.entries = [];
        this.pinnedItems = [];
        this.extension = extension;
        this._loadRegistry();
    }

    addEntry(entry) {
        // Check if entry already exists
        let existing = this.entries.find(e => 
            e.mimetype() === entry.mimetype() && 
            e.getText() === entry.getText()
        );

        if (existing) {
            // Move to top if needed
            this._moveEntryToTop(existing);
            return existing;
        }

        // Add new entry
        this.entries.unshift(entry);
        
        // Trim registry if needed
        if (this.entries.length > MAX_REGISTRY_LENGTH) {
            this.entries.pop();
        }
        
        this._saveRegistry();
        return entry;
    }

    deleteEntry(entry) {
        let index = this.entries.indexOf(entry);
        if (index !== -1) {
            this.entries.splice(index, 1);
            this._saveRegistry();
        }
    }

    clearHistory(keepSelected = false) {
        let selectedEntry = keepSelected ? this.entries[0] : null;
        
        this.entries = [];
        
        if (selectedEntry) {
            this.entries.push(selectedEntry);
        }
        
        this._saveRegistry();
    }

    pinEntry(entry) {
        entry.setFavorite(true);
        
        // Remove from regular entries if needed
        let index = this.entries.indexOf(entry);
        if (index !== -1) {
            this.entries.splice(index, 1);
        }
        
        // Add to pinned items
        this.pinnedItems.push(entry);
        this._saveRegistry();
    }

    unpinEntry(entry) {
        entry.setFavorite(false);
        
        // Remove from pinned items
        let index = this.pinnedItems.indexOf(entry);
        if (index !== -1) {
            this.pinnedItems.splice(index, 1);
        }
        
        // Add to regular entries
        this.entries.unshift(entry);
        this._saveRegistry();
    }

    _moveEntryToTop(entry) {
        let index = this.entries.indexOf(entry);
        if (index > 0) {
            this.entries.splice(index, 1);
            this.entries.unshift(entry);
            this._saveRegistry();
        }
    }

    _loadRegistry() {
        try {
            // Load from disk
            let dir = Gio.File.new_for_path(GLib.get_home_dir() + '/' + REGISTRY_DIR);
            if (!dir.query_exists(null)) {
                dir.make_directory_with_parents(null);
            }
            
            let file = dir.get_child('registry.json');
            if (!file.query_exists(null)) {
                return;
            }
            
            let [success, contents] = file.load_contents(null);
            if (!success) {
                return;
            }
            
            let decoder = new TextDecoder('utf-8');
            let data = JSON.parse(decoder.decode(contents));
            
            // Load entries
            this.entries = data.entries.map(item => {
                let bytes = new Uint8Array(item.bytes);
                return new ClipboardEntry(item.mimeType, bytes, item.favorite);
            });
            
            // Load pinned items
            this.pinnedItems = data.pinnedItems.map(item => {
                let bytes = new Uint8Array(item.bytes);
                return new ClipboardEntry(item.mimeType, bytes, true);
            });
            
        } catch (e) {
            console.error('Failed to load registry:', e);
        }
    }

    _saveRegistry() {
        if (CACHE_ONLY_FAVORITE) {
            // Only save favorite items
            this._saveRegistryData({
                entries: this.entries.filter(entry => entry.isFavorite()).map(this._serializeEntry),
                pinnedItems: this.pinnedItems.map(this._serializeEntry)
            });
        } else {
            // Save all items
            this._saveRegistryData({
                entries: this.entries.map(this._serializeEntry),
                pinnedItems: this.pinnedItems.map(this._serializeEntry)
            });
        }
    }

    _saveRegistryData(data) {
        try {
            let dir = Gio.File.new_for_path(GLib.get_home_dir() + '/' + REGISTRY_DIR);
            if (!dir.query_exists(null)) {
                dir.make_directory_with_parents(null);
            }
            
            let file = dir.get_child('registry.json');
            let encoder = new TextEncoder();
            let contents = encoder.encode(JSON.stringify(data));
            
            file.replace_contents(
                contents,
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null
            );
        } catch (e) {
            console.error('Failed to save registry:', e);
        }
    }

    _serializeEntry(entry) {
        return {
            id: entry.getId(),
            mimeType: entry.mimetype(),
            bytes: Array.from(entry.asBytes()),
            favorite: entry.isFavorite()
        };
    }

    writeEntryFile(entry) {
        if (!entry.isImage()) {
            return;
        }
        
        try {
            let dir = Gio.File.new_for_path(GLib.get_home_dir() + '/' + REGISTRY_DIR + '/images');
            if (!dir.query_exists(null)) {
                dir.make_directory_with_parents(null);
            }
            
            let file = dir.get_child(entry.getId() + '.' + entry.mimetype().split('/')[1]);
            file.replace_contents(
                entry.asBytes(),
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null
            );
        } catch (e) {
            console.error('Failed to write image file:', e);
        }
    }
}