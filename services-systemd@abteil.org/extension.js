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


function Services() {
    this._settings = Convenience.getSettings();
    this._settings.connect('changed', Lang.bind(this, this.loadConfig));
    this.loadConfig();

	this.button = new PanelMenu.Button(0.0);
	
	let hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
	let icon = new St.Icon({icon_name: 'system-run-symbolic', style_class: 'system-status-icon'});
	hbox.add_child(icon);

	this.button.actor.add_actor(hbox);
	this.button.actor.add_style_class_name('panel-status-button');

	this.button.actor.connect('button-press-event', Lang.bind(this, function() {
		this.refresh();
	}));
	//this.refresh();

	Main.panel.addToStatusArea('services', this.button);

	//this.button.menu.actor.show();
}

Services.prototype = {
	refresh: function() {
		this.button.menu.removeAll();
		this._entries.forEach(Lang.bind(this, function(service) {
			let active = false;
			let [_, out, err, stat] = GLib.spawn_command_line_sync('systemctl is-active ' + service['service']);
			let active = (stat == 0);
			let item = new PopupMenu.PopupSwitchMenuItem(service['name'], active);
			this.button.menu.addMenuItem(item);
			item.connect('toggled', function() {
				switch(service["type"]) {
					case 'systemd':
						//GLib.spawn_command_line_async('sh -c "pkexec --user root systemctl ' + (active ? 'stop' : 'start') + ' ' + service['service'] + '; exit;"');
						GLib.spawn_command_line_async('sudo systemctl ' + (active ? 'stop' : 'start') + ' ' + service['service']);
				}
			});
		}));
		if(this._entries.length > 0)
	        this.button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        let item = new PopupMenu.PopupMenuItem(_("Add systemd services ..."));
        item.connect('activate', Lang.bind(this, this.openSettings));
        this.button.menu.addMenuItem(item);
        //this.button.menu.actor.show();
	},

    openSettings: function() {
        this.button.menu.actor.hide();
        Util.spawn(["gnome-shell-extension-prefs", "services-systemd@abteil.org"]);
        return 0;
    },

    loadConfig: function() {
        let entries = this._settings.get_strv("systemd");
        this._entries = [ ]
        for (let i = 0; i < entries.length; i++) {
	        let entry = JSON.parse(entries[i]);
	        entry["type"] = "systemd"
	        this._entries.push(entry);
	    }
    },

	destroy: function() {
		this.button.destroy();
	}
};

function init() {
}

var services;

function enable() {
	services = new Services();
}

function disable() {
	services.destroy();
}