import { PrefsFields } from '../constants.js';

// Settings variables with default values
export let DELAYED_SELECTION_TIMEOUT = 750;
export let MAX_REGISTRY_LENGTH = 15;
export let MAX_ENTRY_LENGTH = 50;
export let CACHE_ONLY_FAVORITE = false;
export let DELETE_ENABLED = true;
export let MOVE_ITEM_FIRST = false;
export let ENABLE_KEYBINDING = true;
export let PRIVATEMODE = false;
export let NOTIFY_ON_COPY = true;
export let NOTIFY_ON_CYCLE = true;
export let CONFIRM_ON_CLEAR = true;
export let MAX_TOPBAR_LENGTH = 15;
export let TOPBAR_DISPLAY_MODE = 1; //0 - only icon, 1 - only clipboard content, 2 - both, 3 - neither
export let CLEAR_ON_BOOT = false;
export let PASTE_ON_SELECT = false;
export let DISABLE_DOWN_ARROW = false;
export let STRIP_TEXT = false;
export let KEEP_SELECTED_ON_CLEAR = false;
export let PASTE_BUTTON = true;
export let PINNED_ON_BOTTOM = false;
export let CACHE_IMAGES = true;
export let EXCLUDED_APPS = [];

export class SettingsManager {
    constructor(settings) {
        this.settings = settings;
        this.settingsChangedId = null;
    }

    connect(callback) {
        this.settingsChangedId = this.settings.connect('changed', callback);
    }

    disconnect() {
        if (this.settingsChangedId) {
            this.settings.disconnect(this.settingsChangedId);
            this.settingsChangedId = null;
        }
    }

    loadSettings() {
        MAX_REGISTRY_LENGTH = this.settings.get_int(PrefsFields.HISTORY_SIZE);
        MAX_ENTRY_LENGTH = this.settings.get_int(PrefsFields.PREVIEW_SIZE);
        CACHE_ONLY_FAVORITE = this.settings.get_boolean(PrefsFields.CACHE_ONLY_FAVORITE);
        DELETE_ENABLED = this.settings.get_boolean(PrefsFields.DELETE);
        MOVE_ITEM_FIRST = this.settings.get_boolean(PrefsFields.MOVE_ITEM_FIRST);
        NOTIFY_ON_COPY = this.settings.get_boolean(PrefsFields.NOTIFY_ON_COPY);
        NOTIFY_ON_CYCLE = this.settings.get_boolean(PrefsFields.NOTIFY_ON_CYCLE);
        CONFIRM_ON_CLEAR = this.settings.get_boolean(PrefsFields.CONFIRM_ON_CLEAR);
        ENABLE_KEYBINDING = this.settings.get_boolean(PrefsFields.ENABLE_KEYBINDING);
        MAX_TOPBAR_LENGTH = this.settings.get_int(PrefsFields.TOPBAR_PREVIEW_SIZE);
        TOPBAR_DISPLAY_MODE = this.settings.get_int(PrefsFields.TOPBAR_DISPLAY_MODE_ID);
        CLEAR_ON_BOOT = this.settings.get_boolean(PrefsFields.CLEAR_ON_BOOT);
        PASTE_ON_SELECT = this.settings.get_boolean(PrefsFields.PASTE_ON_SELECT);
        DISABLE_DOWN_ARROW = this.settings.get_boolean(PrefsFields.DISABLE_DOWN_ARROW);
        STRIP_TEXT = this.settings.get_boolean(PrefsFields.STRIP_TEXT);
        KEEP_SELECTED_ON_CLEAR = this.settings.get_boolean(PrefsFields.KEEP_SELECTED_ON_CLEAR);
        PASTE_BUTTON = this.settings.get_boolean(PrefsFields.PASTE_BUTTON);
        PINNED_ON_BOTTOM = this.settings.get_boolean(PrefsFields.PINNED_ON_BOTTOM);
        CACHE_IMAGES = this.settings.get_boolean(PrefsFields.CACHE_IMAGES);
        EXCLUDED_APPS = this.settings.get_strv(PrefsFields.EXCLUDED_APPS);
    }
}