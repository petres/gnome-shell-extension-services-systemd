const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Util = imports.misc.util;
const PopupServiceItem = Me.imports.popupServiceItem.PopupServiceItem;

const ServicesManager = new Lang.Class({
    Name: 'ServicesManager',
    Extends: PanelMenu.Button,

    _entries: [],

	_init: function() {
		PanelMenu.Button.prototype._init.call(this, 0.0);
		
	    this._settings = Convenience.getSettings();
	    this._settings.connect('changed', Lang.bind(this, this._loadConfig));

	    this._loadConfig();

		let hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
		let icon = new St.Icon({icon_name: 'system-run-symbolic', style_class: 'system-status-icon'});
		hbox.add_child(icon);

		this.actor.add_actor(hbox);
		this.actor.add_style_class_name('panel-status-button');

		this.actor.connect('button-press-event', Lang.bind(this, function() {
			this._refresh();
		}));

		Main.panel.addToStatusArea('servicesManager', this);
		
		this._refresh();
	},
	_getCommand: function(service, action, type) {
		let command = "systemctl"

		command += " " + action
		command += " " + service
		command += " --" + type
		if (type == "system" && action != 'is-active')
			command = "pkexec --user root " + command

		return 'sh -c "' + command + '; exit;"'
	},
	_refresh: function() {
		this.menu.removeAll();
		this._entries.forEach(Lang.bind(this, function(service) {
			let active = false;
			let [_, out, err, stat] = GLib.spawn_command_line_sync(
				this._getCommand(service['service'], 'is-active', service["type"]));
			
			let active = (stat == 0);

			let serviceItem = new PopupServiceItem(service['name'], active);
            this.menu.addMenuItem(serviceItem);

			serviceItem.connect('toggled', Lang.bind(this, function() {
				GLib.spawn_command_line_async(
					this._getCommand(service['service'], (active ? 'stop' : 'start'), service["type"]));
			}));

			serviceItem.refreshButton.connect('clicked', Lang.bind(this, function() {
				GLib.spawn_command_line_async(
					this._getCommand(service['service'], 'restart', service["type"]));
				this.menu.close();
			}));
		}));

		if(this._settings.get_boolean('show-add')) {
			if(this._entries.length > 0)
		        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
	        
	        let item = new PopupMenu.PopupMenuItem(_("Add systemd services ..."));
	        item.connect('activate', Lang.bind(this, function() {
		        Util.spawn(["gnome-shell-extension-prefs", "services-systemd@abteil.org"]);
		        this.menu.close();
		    }));
	        this.menu.addMenuItem(item);
        }
        return true;
	},
    _loadConfig: function() {
        let entries = this._settings.get_strv("systemd");
        this._entries = []
        for (let i = 0; i < entries.length; i++) {
	        let entry = JSON.parse(entries[i]);
	        if (!("type" in entry))
	        	entry["type"] = "system"
	        this._entries.push(entry);
	    }
    }
});

let serviceManager;

function enable() {
	serviceManager = new ServicesManager();
}

function disable() {
	serviceManager.destroy();
}