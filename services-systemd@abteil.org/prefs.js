const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;


const ServicesSystemdSettings = new GObject.Class({
    Name: 'Services-Systemd-Settings',
    Extends: Gtk.Grid,

    _init : function(params) {
        // Gtk Grid init
        this.parent(params);
        this.set_orientation(Gtk.Orientation.VERTICAL);

        // Open settings
        this._settings = Convenience.getSettings();
        this._settings.connect('changed', Lang.bind(this, this._refresh));

        this._changedPermitted = false;

        // Label
        let treeViewLabel = new Gtk.Label({ label: '<b>' + "Listed systemd Services:" + '</b>',
                                 use_markup: true,
                                 halign: Gtk.Align.START })
        this.add(treeViewLabel);


        // TreeView
        this._store = new Gtk.ListStore();
        this._store.set_column_types([GObject.TYPE_STRING, GObject.TYPE_STRING]);

        this._treeView = new Gtk.TreeView({ model: this._store,
                                            hexpand: true, vexpand: true });
        
        let selection = this._treeView.get_selection();
        selection.set_mode(Gtk.SelectionMode.SINGLE);
        selection.connect ('changed', Lang.bind (this, this._onSelectionChanged));


        let appColumn = new Gtk.TreeViewColumn({ expand: true,
                                                 title: "Label" });

        let nameRenderer = new Gtk.CellRendererText;
        appColumn.pack_start(nameRenderer, true);
        appColumn.add_attribute(nameRenderer, "text", 0);
        this._treeView.append_column(appColumn);

        let appColumn = new Gtk.TreeViewColumn({ expand: true,
                                                 title: "Service" });
        
        let nameRenderer = new Gtk.CellRendererText;
        appColumn.pack_start(nameRenderer, true);
        appColumn.add_attribute(nameRenderer, "text", 1);
        this._treeView.append_column(appColumn);

        this.add(this._treeView);

        // Delete Toolbar
        let toolbar = new Gtk.Toolbar();
        toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR);
        toolbar.halign = 2;
        this.add(toolbar);

        let upButton = new Gtk.ToolButton({ stock_id: Gtk.STOCK_GO_UP });
        upButton.connect('clicked', Lang.bind(this, this._up));
        toolbar.add(upButton);

        let downButton = new Gtk.ToolButton({ stock_id: Gtk.STOCK_GO_DOWN });
        downButton.connect('clicked', Lang.bind(this, this._down));
        toolbar.add(downButton);

        let delButton = new Gtk.ToolButton({ stock_id: Gtk.STOCK_DELETE });
        delButton.connect('clicked', Lang.bind(this, this._delete));
        toolbar.add(delButton);

        this._selDepButtons = [upButton, downButton, delButton]

        // Add Grid
        let grid = new Gtk.Grid();

        //// Label
        let labelName = new Gtk.Label({label: "Label: "});
        labelName.halign = 2;

        this._displayName = new Gtk.Entry({ hexpand: true,
                                    margin_top: 5 });
        this._displayName.set_placeholder_text("Name in menu");

        let labelService = new Gtk.Label({label: "Service: "});
        labelService.halign = 2;

        let [_, out1] = GLib.spawn_command_line_sync('ls /lib/systemd/system/');
        let [_, out2] = GLib.spawn_command_line_sync('ls /etc/systemd/system/');

        
        let options = out1.toString().split("\n").concat(out2.toString().split("\n")).sort(
            function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            })


        this._availableSystemdServices = []


        let sListStore = new Gtk.ListStore();
        sListStore.set_column_types([GObject.TYPE_STRING, GObject.TYPE_INT]);

        for (let i = 0; i < options.length; i++ ) {
            let option = options[i];
            let serviceName = ".service"
            if (option.substr(-serviceName.length) === serviceName) {
                let iter = sListStore.append();
                this._availableSystemdServices.push(option)
                sListStore.set (iter, [0], [option]);
            }
        }

        this._systemName = new Gtk.Entry()
        this._systemName.set_placeholder_text("Systemd service name");
        let completion =  new Gtk.EntryCompletion()
        this._systemName.set_completion(completion)
        completion.set_model(sListStore)

        completion.set_text_column(0)
        
        grid.attach(labelName, 1, 1, 1, 1);
        grid.attach_next_to(this._displayName, labelName, 1, 1, 1);

        grid.attach(labelService, 1, 2, 1, 1);
        grid.attach_next_to(this._systemName,labelService, 1, 1, 1);

        this.add(grid);


        let toolbar = new Gtk.Toolbar();
        toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR);
        toolbar.halign = 2;
        this.add(toolbar);

        let addButton = new Gtk.ToolButton({ stock_id: Gtk.STOCK_ADD,
                                             label: "Add",
                                             is_important: true });

        addButton.connect('clicked', Lang.bind(this, this._add));
        toolbar.add(addButton);

        this._changedPermitted = true;
        this._refresh();
        this._onSelectionChanged();
    },
    _add: function() {
        let displayName = this._displayName.text
        let serviceName = this._systemName.text

        if (this._availableSystemdServices.indexOf(serviceName) != -1 && displayName.trim().length > 0) {
            let id = JSON.stringify({"name": displayName, "service": serviceName})
            let currentItems = this._settings.get_strv("systemd");
            let index = currentItems.indexOf(id);
            if (index < 0) {
                this._changedPermitted = false;
                currentItems.push(id);
                this._settings.set_strv("systemd", currentItems);

                this._store.set(this._store.append(), [0, 1],
                                [displayName, serviceName]);
                this._changedPermitted = true;
            }
        }
    },
    _up: function() {
        let [any, model, iter] = this._treeView.get_selection().get_selected();

        if (any) {
            let index = this._settings.get_strv("systemd").indexOf(this._getIdFromIter(iter));
            this._move(index, index - 1)
        }
    },
    _down: function() {
        let [any, model, iter] = this._treeView.get_selection().get_selected();

        if (any) {
            let index = this._settings.get_strv("systemd").indexOf(this._getIdFromIter(iter));
            this._move(index, index + 1)
        }
    },
    _getIdFromIter: function(iter) {
        let displayName = this._store.get_value(iter, 0);
        let serviceName = this._store.get_value(iter, 1);
        return JSON.stringify({"name": displayName, "service": serviceName});
    },
    _move: function(oldIndex, newIndex) {
        let currentItems = this._settings.get_strv("systemd");

        if (oldIndex < 0 || oldIndex >= currentItems.length ||  
            newIndex < 0 || newIndex >= currentItems.length)
            return;

        currentItems.splice(newIndex, 0, currentItems.splice(oldIndex, 1)[0]);

        this._settings.set_strv("systemd", currentItems);

        this._treeView.get_selection().unselect_all();
        this._treeView.get_selection().select_path(Gtk.TreePath.new_from_string(String(newIndex))); 
    },
    _delete: function() {
        let [any, model, iter] = this._treeView.get_selection().get_selected();

        if (any) {
            let displayName = this._store.get_value(iter, 0);
            let serviceName = this._store.get_value(iter, 1);

            let id = JSON.stringify({"name": displayName, "service": serviceName})

            //this._changedPermitted = false;

            let currentItems = this._settings.get_strv("systemd");
            let index = currentItems.indexOf(id);

            if (index < 0)
                return;

            currentItems.splice(index, 1);
            this._settings.set_strv("systemd", currentItems);
            
            this._store.remove(iter);
            //this._changedPermitted = true;
        }
    },
    _onSelectionChanged: function() {
        let [any, model, iter] = this._treeView.get_selection().get_selected();
        if (any) {
            this._selDepButtons.forEach(function(value) {
                value.set_sensitive(true)
            });
        } else {
            this._selDepButtons.forEach(function(value) {
                value.set_sensitive(false)
            });
        } 
    },
    _refresh: function() {
        if (!this._changedPermitted)
            return;

        this._store.clear();

        let currentItems = this._settings.get_strv("systemd");
        let validItems = [ ];

        for (let i = 0; i < currentItems.length; i++) {
            let entry = JSON.parse(currentItems[i]);
            if (this._availableSystemdServices.indexOf(entry["service"]) < 0)
                continue;

            validItems.push(currentItems[i]);

            let iter = this._store.append();
            this._store.set(iter,
                            [0, 1],
                            [entry["name"], entry["service"]]);
        }

        this._changedPermitted = false
        if (validItems.length != currentItems.length)
            this._settings.set_strv("systemd", validItems);
        this._changedPermitted = true
    }
});

function init() {
	
}

function buildPrefsWidget() {
    let widget = new ServicesSystemdSettings();
    widget.show_all();

    return widget;
}
