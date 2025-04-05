import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

import { MAX_ENTRY_LENGTH, STRIP_TEXT } from '../lib/settings.js';
import { formatText } from '../lib/utils.js';

export const EntryItem = GObject.registerClass({
    GTypeName: 'ClipboardIndicatorEntryItem',
    Signals: {
        'pin': {},
        'delete': {},
        'paste': {}
    }
}, class EntryItem extends PopupMenu.PopupMenuItem {
    _init(entry, options = {}) {
        super._init('', {});
        this.entry = entry;
        this.options = {
            showPinButton: true,
            showDeleteButton: true,
            showPasteButton: true,
            isPinned: false,
            ...options
        };

        this._buildItem();
    }

    _buildItem() {
        // Create layout
        let layout = new St.BoxLayout({
            vertical: false,
            style_class: 'ci-entry-container'
        });

        // Content (text or image)
        if (this.entry.isImage()) {
            this._buildImagePreview();
        } else {
            this._buildTextPreview();
        }

        // Buttons box (right side)
        let buttonsBox = new St.BoxLayout({
            vertical: false,
            x_align: Clutter.ActorAlign.END,
            x_expand: true,
            style_class: 'ci-entry-buttons'
        });

        // Add pin button
        if (this.options.showPinButton) {
            let pinIcon = this.options.isPinned ? 'starred-symbolic' : 'non-starred-symbolic';
            let pinButton = this._createButton(pinIcon, this._onPinClicked.bind(this));
            buttonsBox.add_child(pinButton);
        }

        // Add paste button
        if (this.options.showPasteButton) {
            let pasteButton = this._createButton('edit-paste-symbolic', this._onPasteClicked.bind(this));
            buttonsBox.add_child(pasteButton);
        }

        // Add delete button
        if (this.options.showDeleteButton) {
            let deleteButton = this._createButton('edit-delete-symbolic', this._onDeleteClicked.bind(this));
            buttonsBox.add_child(deleteButton);
        }

        // Add content and buttons to layout
        layout.add_child(this.contentBin);
        layout.add_child(buttonsBox);

        // Add layout to menu item
        this.add_child(layout);
    }

    _buildTextPreview() {
        let text = this.entry.getText();
        
        if (STRIP_TEXT) {
            text = formatText(text);
        }
        
        let displayText = text.length > MAX_ENTRY_LENGTH 
            ? text.substring(0, MAX_ENTRY_LENGTH) + '...' 
            : text;

        this.contentBin = new St.Label({
            text: displayText,
            y_align: Clutter.ActorAlign.CENTER
        });
    }

    _buildImagePreview() {
        this.contentBin = new St.Bin({
            style_class: 'ci-image-preview',
            x_align: Clutter.ActorAlign.START
        });
        
        let texture = this.entry.getTexture();
        if (texture) {
            this.contentBin.set_child(texture);
        } else {
            let fallbackLabel = new St.Label({ text: _("[Image Data]") });
            this.contentBin.set_child(fallbackLabel);
        }
    }

    _createButton(iconName, callback) {
        let button = new St.Button({
            style_class: 'ci-action-button',
            x_expand: false,
            y_expand: false
        });
        
        let icon = new St.Icon({
            icon_name: iconName,
            style_class: 'popup-menu-icon'
        });
        
        button.set_child(icon);
        button.connect('clicked', callback);
        
        return button;
    }

    _onPinClicked() {
        this.emit('pin');
        return Clutter.EVENT_STOP;
    }

    _onDeleteClicked() {
        this.emit('delete');
        return Clutter.EVENT_STOP;
    }

    _onPasteClicked() {
        this.activate(Clutter.get_current_event());
        this.emit('paste');
        return Clutter.EVENT_STOP;
    }
});