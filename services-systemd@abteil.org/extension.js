const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const ExtensionUtils = imports.misc.extensionUtils;

const Util = imports.misc.util;

const Me = ExtensionUtils.getCurrentExtension();
//const ScrollablePopupMenu = Me.imports.scrollablePopupMenu.ScrollablePopupMenu;
var PopupServiceItem = Me.imports.popupServiceItem.PopupServiceItem;

const ServicesManager = new Lang.Class({
    Name: 'ServicesManager',
    _entries: [],
    _containerType: -1,

    _init: function() {
        this._settings = ExtensionUtils.getSettings();
        this._settings.connect('changed', Lang.bind(this, this._loadConfig));

        this._createContainer();
        this._loadConfig();
        this._refresh();
    },
    _createContainer: function() {
        this._containerType = this._settings.get_enum('position');

        if (this._containerType == 0) {
            this.container = new PanelMenu.Button(0.0);

            let hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
            let icon = new St.Icon({icon_name: 'system-run-symbolic', style_class: 'system-status-icon'});
            hbox.add_child(icon);

            this.container.add_actor(hbox);
            this.container.add_style_class_name('panel-status-button');

            this.container.connect('button-press-event', Lang.bind(this, function() {
                this._refresh();
            }));
            Main.panel.addToStatusArea('servicesManager', this.container);
        } else {
            this.container = new PopupMenu.PopupSubMenuMenuItem("Systemd Services", true);
            //this.container.icon.style_class = 'system-extensions-submenu-icon';
            this.container.icon.icon_name = 'system-run-symbolic';

            Main.panel.statusArea.aggregateMenu.menu.addMenuItem(this.container, 8);
        }

        this.container.connect('button-press-event', Lang.bind(this, function() {
            this._refresh();
        }));
    },
    _getCommand: function(service, action, type) {
        let command = "systemctl"

        command += " " + action
        command += " " + service
        command += " --" + type
        if (type == "system" && action != 'is-active')
          if (this._settings.get_enum("command-method") == 0 )
            command = "pkexec --user root " + command

        return 'sh -c "' + command + '; exit;"'
    },
    _refresh: function() {
        this.container.menu.removeAll();
        this._entries.forEach(Lang.bind(this, function(service) {
            let active = false;
            let [_, out, err, stat] = GLib.spawn_command_line_sync(
                this._getCommand(service['service'], 'is-active', service["type"]));

            active = (stat == 0);

            let restartButton = this._settings.get_boolean('show-restart')

            let serviceItem = new PopupServiceItem(service['name'], active, {'restartButton': restartButton});
            this.container.menu.addMenuItem(serviceItem);

            serviceItem.connect('toggled', Lang.bind(this, function() {
                GLib.spawn_command_line_async(
                    this._getCommand(service['service'], (active ? 'stop' : 'start'), service["type"]));
            }));

            if (serviceItem.restartButton)
                serviceItem.restartButton.connect('clicked', Lang.bind(this, function() {
                    GLib.spawn_command_line_async(
                        this._getCommand(service['service'], 'restart', service["type"]));
                    this.container.menu.close();
                }));
        }));
        if(this._containerType == 0 && this._settings.get_boolean('show-add')) {
            if(this._entries.length > 0)
                this.container.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            let item = new PopupMenu.PopupMenuItem(_("Add systemd services ..."));
            item.connect('activate', Lang.bind(this, function() {
                Util.spawn(["gnome-shell-extension-prefs", "services-systemd@abteil.org"]);
                this.container.menu.close();
            }));
            this.container.menu.addMenuItem(item);
        }
        return true;
    },
    _loadConfig: function() {
        if (this._containerType != this._settings.get_enum('position')) {
            this.container.destroy();
            this._createContainer();
        }

        let entries = this._settings.get_strv("systemd");
        this._entries = []
        for (let i = 0; i < entries.length; i++) {
            let entry = JSON.parse(entries[i]);
            if (!("type" in entry))
                entry["type"] = "system"
            this._entries.push(entry);
        }
    },
    destroy: function() {
        this.container.destroy();
    }
});

let serviceManager;

function enable() {
    serviceManager = new ServicesManager();
}

function disable() {
    serviceManager.destroy();
}
