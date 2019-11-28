const Desklet = imports.ui.desklet;
const St = imports.gi.St;
const Settings = imports.ui.settings;
const Gio = imports.gi.Gio;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const GLib = imports.gi.GLib;

function HelloDesklet(metadata, desklet_id) {
    this._init(metadata, desklet_id);
}

HelloDesklet.prototype = {
    __proto__: Desklet.Desklet.prototype,

    _init: function (metadata, desklet_id) {
        Desklet.Desklet.prototype._init.call(this, metadata);

        this.settings = new Settings.DeskletSettings(this, "simpleDesktopNotes@piotrek-k", desklet_id);
        this.settings.bindProperty(Settings.BindingDirection.IN, "file", "file", this.on_setting_changed);
        this.settings.bindProperty(Settings.BindingDirection.IN, "transparency", "transparency", this.on_setting_changed);
        this.settings.bindProperty(Settings.BindingDirection.IN, "cornerradius", "cornerRadius", this.on_setting_changed);
        this.settings.bindProperty(Settings.BindingDirection.IN, "bgcolor", "bgColor", this.on_setting_changed);
        this.settings.bindProperty(Settings.BindingDirection.IN, "textcolor", "textColor", this.on_setting_changed);
        this.settings.bindProperty(Settings.BindingDirection.IN, "maxwidth", "maxWidth", this.on_setting_changed);

        this.setupUI();
    },

    setupUI: function () {
        this.notecontent = "";

        // main container for the desklet
        this.window = new St.BoxLayout({
            vertical: true,
            style_class: "desklet"
        });
        this.refreshUI();
        this.reloadComponentText();
        this.setContent(this.window);
    },

    refreshUI: function () {
        this.window.style =
            "max-width: " + this.maxWidth + "px; " +
            "padding: 10px; " +
            "border-radius: " + this.cornerRadius + "px;" +
            "background-color: " + (this.bgColor.replace(")", "," + (1.0 - this.transparency) + ")")).replace("rgb", "rgba") + ";" +
            "color: " + this.textColor;
    },


    reloadComponentText: function () {
        // get notes text file path
        this.finalPath = decodeURIComponent(this.file.replace("file://", ""));
        if (this.finalPath == "") this.finalPath = "note.txt"; // in home dir

        this.notecontent = "Loading...";

        // read file async
        let file = Gio.file_new_for_path(this.finalPath);
        file.load_contents_async(null, (file, response) => {
            try {
                let [success, contents, tag] = file.load_contents_finish(response);
                if (success) {
                    this.notecontent = contents.toString();
                } else {
                    // error reading file - maybe the file does not exist
                    this.notecontent = _("Can't load file. Right click and go to desklet settings to verify file path.");
                }
                GLib.free(contents);
            } catch (err) {
                this.notecontent = err.message;
            }

            this.generateLabelsFromText();
        });
    },

    generateLabelsFromText: function () {
        this.window.remove_all_children();

        var lines = this.notecontent.split("\n");
        for (var j = 0; j < lines.length; j++) {
            if(lines[j].startsWith("#")){
                var newString = lines[j].replace(/^#/gm,"").trim();
                this.createLabel(newString, true);
            }
            else {
                this.createLabel(lines[j], false);
            }
        }
    },

    on_setting_changed: function () {
        this.reloadComponentText();
        this.refreshUI();
    },

    on_desklet_clicked: function () {
        this.reloadComponentText();
    },

    createLabel: function (text, boldText=false) {
        let label = new St.Label();
        label.style = "";
        if(boldText === true){
            label.style += "font-weight: bold;";
        }
        label.text = text;
        this.window.add_actor(label);
    }
}

function main(metadata, desklet_id) {
    return new HelloDesklet(metadata, desklet_id);
}