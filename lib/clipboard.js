import { ClipboardEntry } from '../registry.js';
import { CACHE_IMAGES } from './settings.js';
import St from 'gi://St';


const CLIPBOARD_TYPE = St.ClipboardType.CLIPBOARD;

export class ClipboardManager {
    constructor(clipboard, registry) {
        this.clipboard = clipboard;
        this.registry = registry;
    }

    clearClipboard() {
        this.clipboard.set_text(CLIPBOARD_TYPE, "");
    }

    updateClipboard(entry) {
        this.clipboard.set_content(CLIPBOARD_TYPE, entry.mimetype(), entry.asBytes());
    }

    async getClipboardContent() {
        const mimetypes = [
            "text/plain;charset=utf-8",
            "UTF8_STRING",
            "text/plain",
            "STRING",
            'image/gif',
            'image/png',
            'image/jpg',
            'image/jpeg',
            'image/webp',
            'image/svg+xml',
            'text/html',
        ];

        for (let type of mimetypes) {
            let result = await new Promise(resolve => this.clipboard.get_content(CLIPBOARD_TYPE, type, (clipBoard, bytes) => {
                if (bytes === null || bytes.get_size() === 0) {
                    resolve(null);
                    return;
                }

                // HACK: workaround for GNOME 2nd+ copy mangling mimetypes
                if (type === "UTF8_STRING") {
                    type = "text/plain;charset=utf-8";
                }
                
                const entry = new ClipboardEntry(type, bytes.get_data(), false);
                if (CACHE_IMAGES && entry.isImage()) {
                    this.registry.writeEntryFile(entry);
                }
                resolve(entry);
            }));

            if (result) {
                if (!CACHE_IMAGES && result.isImage()) {
                    return null;
                }
                else {
                    return result;
                }
            }
        }

        return null;
    }
}