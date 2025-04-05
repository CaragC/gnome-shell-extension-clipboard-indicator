import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { PrefsFields } from '../constants.js';

export class ShortcutsManager {
    constructor(settings) {
        this.settings = settings;
        this.keyBindingIds = [];
    }

    bindAll(indicator) {
        this.indicator = indicator;
        
        // Bind all shortcut keys
        this._bindShortcut('toggle-menu', this._onToggleMenu.bind(this));
        this._bindShortcut('clear-history', this._onClearHistory.bind(this));
        this._bindShortcut('prev-entry', this._onPreviousEntry.bind(this));
        this._bindShortcut('next-entry', this._onNextEntry.bind(this));
    }

    unbindAll() {
        // Unbind all shortcuts
        let metaDisplay = global.display;
        
        this.keyBindingIds.forEach(keyBindingId => {
            metaDisplay.ungrab_accelerator(keyBindingId);
            Main.wm.removeKeybinding(keyBindingId);
        });
        
        this.keyBindingIds = [];
    }

    _bindShortcut(name, callback) {
        let metaDisplay = global.display;
        let prefsField = PrefsFields[`${name.toUpperCase().replace(/-/g, '_')}_KEY`];
        
        // Bind the keyboard shortcut
        Main.wm.addKeybinding(
            prefsField,
            this.settings,
            Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
            Shell.ActionMode.ALL,
            callback
        );
    }

    _onToggleMenu() {
        this.indicator.menu.toggle();
    }

    _onClearHistory() {
        this.indicator.clearHistory();
    }

    _onPreviousEntry() {
        this.indicator.selectPreviousEntry();
    }

    _onNextEntry() {
        this.indicator.selectNextEntry();
    }
}