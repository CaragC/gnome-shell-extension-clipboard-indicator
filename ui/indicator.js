import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Shell from 'gi://Shell';
import Meta from 'gi://Meta';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

import { DialogManager } from '../confirmDialog.js';
import { Registry } from '../registry.js';
import { Keyboard } from '../keyboard.js';
import { MenuBuilder } from './menu.js';
import { NotificationManager } from './notifications.js';
import { ClipboardManager } from '../lib/clipboard.js';
import { SettingsManager } from '../lib/settings.js';
import { ShortcutsManager } from '../lib/shortcuts.js';
import { INDICATOR_ICON } from '../constants.js';

export const ClipboardIndicator = GObject.registerClass({
    GTypeName: 'ClipboardIndicator'
}, class ClipboardIndicator extends PanelMenu.Button {
    #refreshInProgress = false;
    #timeouts = [];

    _init(extension) {
        super._init(0.0, "ClipboardIndicator");
        this.extension = extension;
        this.registry = new Registry(extension);
        this.keyboard = new Keyboard();
        this.clipboardManager = new ClipboardManager(extension.clipboard, this.registry);
        this.settingsManager = new SettingsManager(extension.settings);
        this.notificationManager = new NotificationManager();
        this.shortcutsManager = new ShortcutsManager(extension.settings);
        this.menuBuilder = new MenuBuilder(this);
        
        this._selectionOwnerChangedId = null;
        this.clipItemsRadioGroup = [];
        this.preventIndicatorUpdate = false;

        this._buildUI();
        this._loadSettings();
        
        this.dialogManager = new DialogManager();
        
        this.menuBuilder.buildMenu().then(() => {
            this._updateTopbarLayout();
            this._setupSelectionListener();
        });
    }

    destroy() {
        this.settingsManager.disconnect();
        this.shortcutsManager.unbindAll();
        this._disconnectSelectionListener();
        this._clearTimeouts();
        this.dialogManager.destroy();
        this.keyboard.destroy();
        this.notificationManager.destroy();

        super.destroy();
    }

    _buildUI() {
        let hbox = new St.BoxLayout({
            style_class: 'panel-status-menu-box clipboard-indicator-hbox'
        });

        this.hbox = hbox;

        this.icon = new St.Icon({
            icon_name: INDICATOR_ICON,
            style_class: 'system-status-icon clipboard-indicator-icon'
        });

        this._buttonText = new St.Label({
            text: _('Text will be here'),
            y_align: Clutter.ActorAlign.CENTER
        });

        this._buttonImgPreview = new St.Bin({
            style_class: 'clipboard-indicator-topbar-preview'
        });

        hbox.add_child(this.icon);
        hbox.add_child(this._buttonText);
        hbox.add_child(this._buttonImgPreview);
        this._downArrow = PopupMenu.arrowIcon(St.Side.BOTTOM);
        hbox.add_child(this._downArrow);
        this.add_child(hbox);
    }

    _loadSettings() {
        this.settingsManager.loadSettings();
        this.settingsManager.connect(this._onSettingsChange.bind(this));
        
        if (this.settingsManager.ENABLE_KEYBINDING)
            this.shortcutsManager.bindAll(this);
    }

    _setupSelectionListener() {
        this._selectionOwnerChangedId = this.clipboardManager.connect('owner-change', 
            (clipboardManager, event) => this._onClipboardChanged(clipboardManager, event));
    }

    _disconnectSelectionListener() {
        if (this._selectionOwnerChangedId) {
            this.clipboardManager.disconnect(this._selectionOwnerChangedId);
            this._selectionOwnerChangedId = null;
        }
    }

    _clearTimeouts() {
        this.#timeouts.forEach(timeout => {
            if (timeout) clearTimeout(timeout);
        });
        this.#timeouts = [];
    }

    _updateTopbarLayout() {
        const showIcon = this.settingsManager.getBoolean('display-indicator-icon');
        const displayMode = this.settingsManager.getEnum('display-mode');
        
        // Show/hide icon
        this.icon.visible = showIcon;
        
        // Show/hide text and preview based on display mode
        this._buttonText.visible = displayMode === 1 || displayMode === 3;
        this._buttonImgPreview.visible = displayMode === 2 || displayMode === 3;
        
        this._refreshIndicator();
    }

    _refreshIndicator() {
        if (this.#refreshInProgress) return;
        this.#refreshInProgress = true;

        try {
            const currentClip = this.registry.getCurrentItem();
            if (!currentClip) {
                this._buttonText.set_text('');
                this._buttonImgPreview.set_child(null);
                return;
            }

            // Update text preview if needed
            if (this._buttonText.visible && currentClip.type === 'text') {
                const displayText = currentClip.text || '';
                const truncatedText = displayText.substring(0, 20) + (displayText.length > 20 ? '...' : '');
                this._buttonText.set_text(truncatedText);
            }

            // Update image preview if needed
            if (this._buttonImgPreview.visible && currentClip.type === 'image') {
                // Implementation for image preview
                const texture = St.TextureCache.get_default().load_from_pixbuf(currentClip.pixbuf);
                if (texture) {
                    this._buttonImgPreview.set_child(texture);
                } else {
                    this._buttonImgPreview.set_child(null);
                }
            }
        } finally {
            this.#refreshInProgress = false;
        }
    }

    _onClipboardChanged(clipboardManager, event) {
        if (this.preventIndicatorUpdate) return;
        
        const timeout = setTimeout(() => {
            this.clipboardManager.readClipboard();
            this._refreshIndicator();
            this.menuBuilder.refreshMenu();
        }, 500);
        
        this.#timeouts.push(timeout);
    }

    _onSettingsChange(key) {
        switch (key) {
            case 'display-indicator-icon':
            case 'display-mode':
                this._updateTopbarLayout();
                break;
            case 'history-size':
                this.registry.setMaxHistorySize(this.settingsManager.getInt('history-size'));
                break;
            // Add other settings cases as needed
        }
    }
});