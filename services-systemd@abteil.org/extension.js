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

	_refresh: function() {
		this.menu.removeAll();
		this._entries.forEach(Lang.bind(this, function(service) {
			let active = false;
			let [_, out, err, stat] = GLib.spawn_command_line_sync('sh -c "systemctl --' + service['type'] + ' is-active ' + service['service'] + '"');
			let active = (stat == 0);
			let item = new PopupMenu.PopupSwitchMenuItem(service['name'], active);
			this.menu.addMenuItem(item);
			item.connect('toggled', function() {
				switch(service["type"]) {
					case 'system':
						GLib.spawn_command_line_async('sh -c "pkexec --user root systemctl ' + (active ? 'stop' : 'start') + ' ' + service['service'] + ' --system; exit;"');
					case 'user':
						GLib.spawn_command_line_async('sh -c "systemctl --user ' + (active ? 'stop' : 'start') + ' ' + service['service'] + '; exit;"');
				}
			});
		}));
		if(this._entries.length > 0)
	        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        let item = new PopupMenu.PopupMenuItem(_("Add systemd services ..."));
        item.connect('activate', Lang.bind(this, function() {
	        Util.spawn(["gnome-shell-extension-prefs", "services-systemd@abteil.org"]);
	        this.menu.close();
	    }));
        this.menu.addMenuItem(item);
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