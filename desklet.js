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


        //this._preferences = {};
        this.settings = new Settings.DeskletSettings(this, "markdownNotes@piotrek-k", desklet_id);
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
        this.rebuildUI();
        this.text = new St.Label();
        this.text.set_text("ddd!");

        this.loadText();

        this.window.add_actor(this.text);
        this.setContent(this.window);
    },

    reloadContent: function () {
        this.text.set_text(this.notecontent);
    },

    rebuildUI: function () {
        this.window.style = 
            "max-width: " + this.maxWidth + "px; " +
            "padding: 10px; "+
            "border-radius: " + this.cornerRadius + "px;" + 
            "background-color: " + (this.bgColor.replace(")", "," + (1.0 - this.transparency) + ")")).replace("rgb", "rgba") + ";" +
            "color: " + this.textColor;
    },


    loadText: function () {
        // get notes text file path
        this.finalPath = decodeURIComponent(this.file.replace("file://", ""));
        if (this.finalPath == "") this.finalPath = "note.txt"; // in home dir

        this.text.set_text(this.finalPath);

        // read file async
        let file = Gio.file_new_for_path(this.finalPath);
        file.load_contents_async(null, (file, response) => {
            try {
                let [success, contents, tag] = file.load_contents_finish(response);
                if (success) {
                    this.notecontent = contents.toString();
                } else {
                    // error reading file - maybe the file does not exist
                    this.notecontent = _("Can't read text file.\nSelect a file in settings.\n\nClick here to edit.");
                }
                GLib.free(contents);
            } catch (err) {
                this.notecontent = err.message;
                this.text.set_text(this.notecontent);
            }

            // refresh desklet content
            //this.refreshDesklet(reloadGraphics);
            this.reloadContent();
        });

        // refresh again in two seconds
        //this.timeout = Mainloop.timeout_add_seconds(2, Lang.bind(this, this.reloadContent));
    },

    on_setting_changed: function () {
        // update decoration settings
        this.loadText();
        this.reloadContent();
        this.rebuildUI();

        // settings changed; instant refresh
        //Mainloop.source_remove(this.timeout);
        //this.reloadContent();
    },
}

function main(metadata, desklet_id) {
    return new HelloDesklet(metadata, desklet_id);
}