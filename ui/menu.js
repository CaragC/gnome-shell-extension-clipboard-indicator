import St from 'gi://St';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

import { EntryItem } from './entryItem.js';
import { CONFIRM_ON_CLEAR, DELETE_ENABLED, PASTE_BUTTON } from '../lib/settings.js';
import { DialogManager } from '../confirmDialog.js';

export class MenuBuilder {
    constructor(indicator) {
        this.indicator = indicator;
        this.registry = indicator.registry;
        this.dialogManager = new DialogManager();
    }
    async buildMenu() {
        this.indicator.menu.removeAll();
        this._createMenuSections();
        await this._populateMenuWithEntries();
        this._addBottomMenu();
        return true;
    }

    _createMenuSections() {
        // Create history section
        this.historySection = new PopupMenu.PopupMenuSection();
        this.indicator.menu.addMenuItem(this.historySection);

        // Create separator
        let separator = new PopupMenu.PopupSeparatorMenuItem();
        this.indicator.menu.addMenuItem(separator);

        // Pin section (favorites)
        this.pinnedItemsSection = new PopupMenu.PopupMenuSection();
        this.indicator.menu.addMenuItem(this.pinnedItemsSection);

        // Another separator if pinned items exist
        if (this.registry.pinnedItems.length > 0) {
            this.pinSeparator = new PopupMenu.PopupSeparatorMenuItem();
            this.indicator.menu.addMenuItem(this.pinSeparator);
        }
    }

    async _populateMenuWithEntries() {
        if (this.registry.entries.length > 0) {
            // Add clipboard entries
            for (let i = 0; i < this.registry.entries.length; i++) {
                this._addEntryToMenu(this.registry.entries[i], i);
            }
        } else {
            // Show empty history message
            this._addEmptyHistoryMessage();
        }

        // Add pinned items
        if (this.registry.pinnedItems.length > 0) {
            for (let i = 0; i < this.registry.pinnedItems.length; i++) {
                this._addPinnedItemToMenu(this.registry.pinnedItems[i]);
            }
        }
    }

    _addEntryToMenu(entry, index) {
        let menuItem = new EntryItem(entry, {
            showPinButton: true,
            showDeleteButton: DELETE_ENABLED,
            showPasteButton: PASTE_BUTTON
        });

        menuItem.connect('activate', () => this._onEntryActivated(entry));
        menuItem.connect('pin', () => this._onEntryPinned(entry));
        menuItem.connect('delete', () => this._onEntryDeleted(entry, index));

        if (index === 0) {
            this.indicator.currentlySelectedEntry = entry;
            menuItem.setOrnament(PopupMenu.Ornament.DOT);
        }

        this.historySection.addMenuItem(menuItem);
        this.indicator.clipItemsRadioGroup.push(menuItem);
    }

    _addPinnedItemToMenu(entry) {
        let menuItem = new EntryItem(entry, {
            showPinButton: true,
            isPinned: true,
            showDeleteButton: DELETE_ENABLED,
            showPasteButton: PASTE_BUTTON
        });

        menuItem.connect('activate', () => this._onEntryActivated(entry));
        menuItem.connect('pin', () => this._onEntryUnpinned(entry));

        this.pinnedItemsSection.addMenuItem(menuItem);
    }

    _addEmptyHistoryMessage() {
        let emptyItem = new PopupMenu.PopupMenuItem(_("Empty Clipboard History"), {
            reactive: false,
            activate: false,
            hover: false,
            style_class: 'ci-empty-box'
        });
        this.historySection.addMenuItem(emptyItem);
    }

    _addBottomMenu() {
        // Action buttons
        let bottomMenu = new PopupMenu.PopupMenuSection();

        // Clear history
        this.clearMenuItem = new PopupMenu.PopupMenuItem(_('Clear History'));
        this.clearMenuItem.connect('activate', () => this._onClearHistory());
        bottomMenu.addMenuItem(this.clearMenuItem);

        // Private mode toggle
        this.privateModeMenuItem = new PopupMenu.PopupSwitchMenuItem(
            _('Private Mode'), this.indicator.privateModeState, { reactive: true }
        );
        this.privateModeMenuItem.connect('toggled', (_, state) => {
            this.indicator.privateModeState = state;
            this.indicator._onSettingsChange();
        });
        bottomMenu.addMenuItem(this.privateModeMenuItem);

        // Settings
        this.settingsMenuItem = new PopupMenu.PopupMenuItem(_('Settings'));
        this.settingsMenuItem.connect('activate', () => this.indicator.extension.openSettings());
        bottomMenu.addMenuItem(this.settingsMenuItem);

        this.indicator.menu.addMenuItem(bottomMenu);
    }

    _onEntryActivated(entry) {
        this.indicator.selectEntry(entry);
    }

    _onEntryPinned(entry) {
        this.registry.pinEntry(entry);
        this.buildMenu();
    }

    _onEntryUnpinned(entry) {
        this.registry.unpinEntry(entry);
        this.buildMenu();
    }

    _onEntryDeleted(entry, _) {
        this.registry.deleteEntry(entry);
        this.buildMenu();
    }
    _onClearHistory() {
        if (CONFIRM_ON_CLEAR) {
            this.dialogManager.open(
                _("Confirmation"), 
                _("Clear all clipboard items?"),
                "",
                _("Confirm"),
                _("Cancel"),
                () => {
                    this.registry.clearHistory(this.indicator.KEEP_SELECTED_ON_CLEAR);
                    this.buildMenu();
                }
            );
        } else {
            this.registry.clearHistory(this.indicator.KEEP_SELECTED_ON_CLEAR);
            this.buildMenu();
        }
    }
}