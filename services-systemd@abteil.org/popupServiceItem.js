const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Util = imports.misc.util;
const Gtk = imports.gi.Gtk;

const ExtensionSystem = imports.ui.extensionSystem;
const ExtensionUtils = imports.misc.extensionUtils;

const PopupServiceItem = new Lang.Class({
    Name: 'PopupServiceItem',
    Extends: PopupMenu.PopupSwitchMenuItem,

    _init: function(text, active, params) {
        this.parent(text, active, params);

        this.refreshButton = new St.Button({ x_align: 1,
                                             reactive: true,
                                             can_focus: true,
                                             track_hover: true,
                                             accessible_name: 'restart',
                                             style_class: 'system-menu-action services-systemd-button-reload' });

        this.refreshButton.child = new St.Icon({ icon_name: 'view-refresh-symbolic' });
        this.actor.add(this.refreshButton, { expand: false, x_align: St.Align.END });
    }
});