const PopupMenu = imports.ui.popupMenu;
const { GObject, Gtk, St, Clutter} = imports.gi;

var PopupServiceItem = GObject.registerClass(
    class PopupServiceItem extends PopupMenu.PopupSwitchMenuItem {
        _init(text, active, params) {
            super._init(text, active);

            if (params.restartButton) {
                this.restartButton = new St.Button({
                    x_expand: false,
                    x_align: Gtk.Align.END,
                    reactive: true,
                    can_focus: true,
                    track_hover: true,
                    accessible_name: 'restart',
                    style_class: 'system-menu-action services-systemd-button-reload'
                });

                this.restartButton.add_actor(new St.Icon({
                    icon_name: 'view-refresh-symbolic',
                }));

                this.add_child(this.restartButton);
            }
        }
    }
);
