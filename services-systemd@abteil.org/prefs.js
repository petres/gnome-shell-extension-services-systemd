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
    Extends: Gtk.Notebook,

    _init : function(params) {
        /*** Open Settings ***********************************************************************/
        this._settings = Convenience.getSettings();
        this._settings.connect('changed', Lang.bind(this, this._refresh));

        this._changedPermitted = false;
        /*****************************************************************************************/



        /*** GUI: General ************************************************************************/
        this.parent(params);
        this.set_tab_pos(Gtk.PositionType.TOP);

        let servicesPage = new Gtk.Grid()
        servicesPage.set_orientation(Gtk.Orientation.VERTICAL);
        servicesPage.margin = 20;

        let otherPage = new Gtk.Grid()
        otherPage.set_orientation(Gtk.Orientation.VERTICAL);
        otherPage.margin = 20;
        otherPage.set_row_spacing(10);

        //this.insert_page(servicesPage, new Gtk.Label("test"), 0)
        this.append_page(servicesPage, new Gtk.Label({label: "Services" }))
        this.append_page(otherPage, new Gtk.Label({label: "Other" }))
        /*****************************************************************************************/



        /*** GUI: Other Settings *****************************************************************/
        let showAddLabel = new Gtk.Label({
                label:      "Show add services: ",
                xalign:     0,
                hexpand:    true
            });

        this._showAddCheckbox = new Gtk.Switch();
        this._showAddCheckbox.connect('notify::active',  Lang.bind(this, function(button) {
            this._changedPermitted = false;
            this._settings.set_boolean('show-add', button.active);
            this._changedPermitted = true;
        }));

        otherPage.attach(showAddLabel, 1, 1, 1, 1);
        otherPage.attach_next_to(this._showAddCheckbox, showAddLabel, 1, 1, 1);



        let showRestartLabel = new Gtk.Label({
                label:      "Show restart button: ",
                xalign:     0,
                hexpand:    true
            });

        this._showRestartCheckbox = new Gtk.Switch();
        this._showRestartCheckbox.connect('notify::active',  Lang.bind(this, function(button) {
            this._changedPermitted = false;
            this._settings.set_boolean('show-restart', button.active);
            this._changedPermitted = true;
        }));

        otherPage.attach(showRestartLabel, 1, 2, 1, 1);
        otherPage.attach_next_to(this._showRestartCheckbox, showRestartLabel, 1, 1, 1);
        /*****************************************************************************************/



        /*** GUI: Services Settings **************************************************************/
        // Label
        let treeViewLabel = new Gtk.Label({ label: '<b>' + "Listed systemd Services:" + '</b>',
                                 use_markup: true,
                                 halign: Gtk.Align.START })
        servicesPage.add(treeViewLabel);


        // TreeView
        this._store = new Gtk.ListStore();
        this._store.set_column_types([GObject.TYPE_STRING, GObject.TYPE_STRING, GObject.TYPE_STRING]);

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

        let appColumn = new Gtk.TreeViewColumn({ expand: true,
                                                 title: "Type" });
        
        let nameRenderer = new Gtk.CellRendererText;
        appColumn.pack_start(nameRenderer, true);
        appColumn.add_attribute(nameRenderer, "text", 2);
        this._treeView.append_column(appColumn);

        servicesPage.add(this._treeView);

        // Delete Toolbar
        let toolbar = new Gtk.Toolbar();
        toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR);
        toolbar.halign = 2;
        servicesPage.add(toolbar);

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

        this._availableSystemdServices = {
            'system': this._getSystemdServicesList("system"),
            'user': this._getSystemdServicesList("user"),
        }
        this._availableSystemdServices['all'] = this._availableSystemdServices['system'].concat(this._availableSystemdServices['user'])

        let sListStore = new Gtk.ListStore();
        sListStore.set_column_types([GObject.TYPE_STRING, GObject.TYPE_INT]);

        for (let i in this._availableSystemdServices['all'])
            sListStore.set (sListStore.append(), [0], [this._availableSystemdServices['all'][i]]);

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

        servicesPage.add(grid);

        let toolbar = new Gtk.Toolbar();
        toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR);
        toolbar.halign = 2;
        servicesPage.add(toolbar);

        let addButton = new Gtk.ToolButton({ stock_id: Gtk.STOCK_ADD,
                                             label: "Add",
                                             is_important: true });

        addButton.connect('clicked', Lang.bind(this, this._add));
        toolbar.add(addButton);
        /*****************************************************************************************/

        

        this._changedPermitted = true;
        this._refresh();
        this._onSelectionChanged();
    },
    _getSystemdServicesList: function(type) {
        let [_, out, err, stat] = GLib.spawn_command_line_sync('sh -c "systemctl --' + type + ' list-unit-files --type=service --no-legend | awk \'{print $1}\'"');
        let allFiltered = out.toString().split("\n");
        let [_, out2, err, stat] = GLib.spawn_command_line_sync('sh -c "systemctl --' + type + ' list-units --type=service --no-legend | awk \'{print $1}\'"');
        allFiltered = allFiltered.concat(out2.toString().split("\n"));
        return allFiltered.sort(
            function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            })
    },
    _getTypeOfService: function(service) {
        let type = "undefined"
        if (this._availableSystemdServices['system'].indexOf(service) != -1)
            type = "system"
        else if (this._availableSystemdServices['user'].indexOf(service) != -1)
            type = "user"
        return type
    },
    _getIdFromIter: function(iter) {
        let displayName = this._store.get_value(iter, 0);
        let serviceName = this._store.get_value(iter, 1);
        let type = this._store.get_value(iter, 2);
        return JSON.stringify({"name": displayName, "service": serviceName, "type": type});
    },
    _add: function() {
        let displayName = this._displayName.text
        let serviceName = this._systemName.text

        if (displayName.trim().length > 0 && serviceName.trim().length > 0 ) {
            let type = this._getTypeOfService(serviceName)
            if (type == "undefined") {
                this._messageDialog = new Gtk.MessageDialog ({
                    title: "Warning",
                    modal: true,
                    buttons: Gtk.ButtonsType.OK,
                    message_type: Gtk.MessageType.WARNING,
                    text: "Service does not exist." 
                });
                this._messageDialog.connect('response', Lang.bind(this, function() {
                    this._messageDialog.close();
                }));
                this._messageDialog.show();
            } else {
                let id = JSON.stringify({"name": displayName, "service": serviceName, "type": type})
                let currentItems = this._settings.get_strv("systemd");
                let index = currentItems.indexOf(id);
                if (index < 0) {
                    this._changedPermitted = false;
                    currentItems.push(id);
                    this._settings.set_strv("systemd", currentItems);
                    this._store.set(this._store.append(), [0, 1, 2], [displayName, serviceName, type]);
                    this._changedPermitted = true;
                }
                this._displayName.text = ""
                this._systemName.text = ""
            }
            
        } else {
            this._messageDialog = new Gtk.MessageDialog ({
                //parent: this.get_toplevel(), 
                title: "Warning",
                modal: true,
                buttons: Gtk.ButtonsType.OK,
                message_type: Gtk.MessageType.WARNING,
                text: "No label and/or service specified." 
            });

            this._messageDialog.connect ('response', Lang.bind(this, function() {
                this._messageDialog.close();
            }));
            this._messageDialog.show();
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
            let currentItems = this._settings.get_strv("systemd");
            let index = currentItems.indexOf(this._getIdFromIter(iter));

            if (index < 0)
                return;

            currentItems.splice(index, 1);
            this._settings.set_strv("systemd", currentItems);
            
            this._store.remove(iter);
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
        this._showAddCheckbox.set_active(this._settings.get_boolean('show-add'))
        this._showRestartCheckbox.set_active(this._settings.get_boolean('show-restart'))

        let currentItems = this._settings.get_strv("systemd");
        let validItems = [ ];

        for (let i = 0; i < currentItems.length; i++) {
            let entry = JSON.parse(currentItems[i]);
            // REMOVE NOT EXISTING ENTRIES
            if (this._availableSystemdServices["all"].indexOf(entry["service"]) < 0)
                continue;

            // COMPABILITY
            if(!("type" in entry))
                entry["type"] = this._getTypeOfService(entry["service"])

            validItems.push(JSON.stringify(entry));

            let iter = this._store.append();
            this._store.set(iter,
                            [0, 1, 2],
                            [entry["name"], entry["service"], entry["type"]]);
        }

        this._changedPermitted = false
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
