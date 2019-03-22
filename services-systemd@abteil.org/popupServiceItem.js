const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Util = imports.misc.util;
const Gtk = imports.gi.Gtk;

const ExtensionSystem = imports.ui.extensionSystem;
const ExtensionUtils = imports.misc.extensionUtils;

class PopupServiceItem extends PopupMenu.PopupSwitchMenuItem {
    constructor(text, active, params) {
        super(text, active);

        if (params.restartButton) {
            this.restartButton = new St.Button({
                x_align: 1,
                reactive: true,
                can_focus: true,
                track_hover: true,
                accessible_name: 'restart',
                style_class: 'system-menu-action services-systemd-button-reload'
            });

            this.restartButton.child = new St.Icon({ icon_name: 'view-refresh-symbolic' });
            this.actor.add(this.restartButton, { expand: false, x_align: St.Align.END });
        }
    }
}
