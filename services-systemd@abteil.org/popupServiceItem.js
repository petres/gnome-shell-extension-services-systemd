const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const { GObject, Gtk, St, Clutter} = imports.gi;

const ExtensionSystem = imports.ui.extensionSystem;
const ExtensionUtils = imports.misc.extensionUtils;

var PopupServiceItem = GObject.registerClass(
class PopupServiceItem extends PopupMenu.PopupSwitchMenuItem {
    _init(text, active, params) {
        super._init(text, active);

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
            this.add(this.restartButton, { expand: false, x_align: St.Align.END });
        }
    }
});
