// SPDX-FileCopyrightText: 2023 Francis Grizzly Smit <grizzly@smit.id.au>
//
// SPDX-License-Identifier: GPL-2.0-or-later

/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

/*eslint no-undef: "error"*/

import Adw from 'gi://Adw';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';

export default class HpExtensionPreferences extends ExtensionPreferences {

    async _close_request(win){
        if(this._window?._dirty){
            const dlg = new Gtk.AlertDialog();
            dlg.set_modal(true);
            dlg.set_buttons(["Cancel", "Exit Without Saving", "Save"]);
            dlg.set_cancel_button(0);
            dlg.set_default_button(2);
            dlg.set_message("Save Changes?");
            dlg.set_detail("You have unsaved changes");
            await dlg.choose(win, null, (_sourceObject, result) => {
                try {
                    const choice = dlg.choose_finish(result);
                    switch (choice) {
                        case 0: // "cancel" button //
                            break;
                        case 1: // "Exit Without Saving" button //
                            this._window.close();
                            break;
                        case 2: // "Save" button //
                            this.save_clicked();
                            this._window.close();
                            break;
                    } //switch (choice) //
                } catch (e) {
                    console.error(e);
                }
            });
            return true;
        }else{ // if(this._window?._dirty) //
            //this.force_close();
            this._window.close();
            return false;
        }
    } // async _close_request(win) //

    _area_token_box(){
        const title = _("Area in the panel");
        const panelPositions = new Gtk.StringList();
        this.area = this._window._settings.get_string("area");
        let _areas = ["left", "center", "right"];
        let areas = [_("Left"), _("Center"), _("Right")];
        let cur = 0;
        for (let i = 0; i < areas.length; i++){
            let a = _areas[i];
            if(this.area === a) cur = i;
            panelPositions.append(areas[i]);
        }
        const row = new Adw.ComboRow({
            title,
            model: panelPositions,
            selected: cur,
            use_subtitle: true, 
        });
        row.connect('notify::selected', this.area_dropdown_clicked.bind(this));
        return row;
    } // _area_token_box() //

    _icon_token_box(){
        const panelicons = new Gtk.StringList();
        const title = _("Icon Name");
        let icons = ["printer", "/usr/share/hplip/data/images/16x16/hp_logo.png"];
        this.icon_name = this._window._settings.get_string("icon-name");
        let cur = 0;
        for (let i = 0; i < icons.length; i++){
            if(this.icon_name === icons[i]) cur = i;
            panelicons.append(icons[i]);
        }
        const row = new Adw.ComboRow({
            title,
            model: panelicons,
            selected: cur,
            use_subtitle: true,
        });
        row.connect('notify::selected', this.icon_dropdown_clicked.bind(this));
        return row;
    } // _icon_token_box() //

    save_clicked(){
        if(this._window?._dirty){
            // update the values
            if(this.area !== this._window._settings.get_string("area"))
                this._window._settings.set_string("area", this.area);
            if(this.icon_name !== this._window._settings.get_string("icon-name"))
                this._window._settings.set_string("icon-name", this.icon_name);
            if(0 <= this.position_input.get_value() && this.position_input.get_value() <= 25){
                if(this.position_input.get_value() !== this._window._settings.get_int("position"))
                    this._window._settings.set_int("position", this.position_input.get_value());
            }
            if(this.compact_switch.get_state() !== this._window._settings.get_boolean("compact"))
                this._window._settings.set_boolean("compact", this.compact_switch.get_state());

            this._window._dirty = false;
            //this._window._settings.apply(); // save the settings //
        }
    } // save_clicked() //

    area_dropdown_clicked(combo){
        switch(combo.selected){
            case 0:
                this.area = "left";
                break;
            case 1:
                this.area = "center";
                break;
            case 2:
                this.area = "right";
                break;
        }
        this._window._dirty = true;
    } // area_dropdown_clicked(combo) //

    icon_dropdown_clicked(combo){
        switch(combo.selected){
            case 0:
                this.icon_name = "printer";
                break;
            case 1:
                this.icon_name = "/usr/share/hplip/data/images/16x16/hp_logo.png";
                break;
        }
        this._window._dirty = true;
    } // icon_dropdown_clicked(combo) //

    _position_box(){
        const title = _("Position");
        const row = new Adw.ActionRow({ title });
        row.set_subtitle(_("Position in the area of the panel."));
        const slider = new Gtk.Scale({
            digits: 2,
            adjustment: new Gtk.Adjustment({ lower: 0, upper: 25, stepIncrement: 1 }),
            value_pos: Gtk.PositionType.RIGHT,
            hexpand: true,
            halign: Gtk.Align.END
        });
        slider.set_draw_value(true);
        slider.set_value(this._window._settings.get_int("position"));
        slider.connect('value-changed', (_sw) => { this._window._dirty = true; });
        slider.set_size_request(400, 15);
        row.add_suffix(slider);
        row.activatable_widget = slider;
        this.position_input = slider;
        return row;
    } // _position_box() //

    _compact_row(){
        const title = _("Compact");
        const row = new Adw.SwitchRow({
            title,
            active: this._window._settings.get_boolean("compact"),
        });
        row.set_subtitle(_("Compact Menu."));
        this.compact_switch = row.activatable_widget; // get the internal Gtk.Switch //
        this.compact_switch.connect("state-set", (_sw, _state) => { this._window._dirty = true; });
        return row;
    } // _compact_row() //

    _save_settings_box(){
        const title = "";
        const row = new Adw.ActionRow({ title });
        row.set_subtitle("");
        this.save_settings_button = new Gtk.Button({
                                                        label: _("Save Settings"),
                                                         css_classes: ["suggested-action"],
                                                         valign: Gtk.Align.CENTER,
                                                    });
        row.add_suffix(this.save_settings_button);
        row.activatable_widget = this.save_settings_button;

        return row;
    } // _save_settings_box() //

    _close_row(){
        const title = "";
        const row = new Adw.ActionRow({ title });
        row.set_subtitle("");
        this.close_button = new Gtk.Button({
                                                        label: _("Exit Settings"),
                                                         css_classes: ["suggested-action"],
                                                         valign: Gtk.Align.CENTER,
                                                    });
        row.add_suffix(this.close_button);
        row.activatable_widget = this.close_button;
        this.close_button.connect("clicked", () => { this._close_request(this._window); });

        return row;
    } // _close_row() //

    fillPreferencesWindow(window) {
        this.area = "left";
        this.icon_name = "printer";
        this.area_token_box = null;
        this.icon_token_box = null;
        this.position_input = null;
        this.save_settings_button = null;
        this.compact_switch = null;
        this._window = window;
        this._window._dirty = false;

        window._settings = this.getSettings();
        if(window._settings.get_boolean("first-time")){ // grab legacy _settings //
            window.settings_data = JSON.parse(window._settings.get_string("_settings-json"));
            window._settings.set_string("area", window.settings_data.area);
            window._settings.set_string("icon-name", window.settings_data.icon_name);
            window._settings.set_int("position", window.settings_data.position);
            window._settings.set_boolean("first-time", false); // old _settings obtained //
            //window._settings.apply(); // save _settings //
        }
        this.area              = this._window._settings.get_string("area");
        this.icon_name         = this._window._settings.get_string("icon-name");
        this.position          = this._window._settings.get_int("position");
        this.properties_width  = this._window._settings.get_int("properties-width");
        this.properties_height = this._window._settings.get_int("properties-height");
        this.compact           = this._window._settings.get_boolean("compact");

        const page1 = Adw.PreferencesPage.new();
        page1.set_title(_("Settings"));
        page1.set_name("hplips_menu2_page1");
        page1.set_icon_name("preferences-system-symbolic");

        // group1
        const group1 = Adw.PreferencesGroup.new();
        group1.set_title(_("Hplip menu2 settings"));
        group1.set_name("HpLip_menu2_global");
        page1.add(group1);
        this.area_token_box = this._area_token_box();
        group1.add(this.area_token_box);

        this.icon_token_box = this._icon_token_box();
        group1.add(this.icon_token_box);
        this.position_box = this._position_box();
        group1.add(this.position_box);
        this.compact_row = this._compact_row();
        group1.add(this.compact_row);
        let save_settings_box = this._save_settings_box();
        this.save_settings_button.connect("clicked", this.save_clicked.bind(this));
        group1.add(save_settings_box);
        let close_row = this._close_row();
        group1.add(close_row);
        const hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, vexpand: true, hexpand: true, });
        const bottom_spacer = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });
        hbox.prepend(bottom_spacer);
        group1.add(hbox);

        /*****************************************
         *                                       *
         *                                       *
         *                                       *
         *           the credits page.           *
         *                                       *
         *                                       *
         *                                       *
         *                                       *
         ******************************************/
                //page2
        const page2 = Adw.PreferencesPage.new();
        page2.set_title(_("Credits"));
        page2.set_name("hplip_menu2_page2");
        page2.set_icon_name("help-about-symbolic");

        // group2
        const group2 = Adw.PreferencesGroup.new();
        group2.set_title(_("About"));
        group2.set_name("Hplip_menu2_About");

        // The inner set of tabbed pages (or Notebook) //
        this.notebook = new Gtk.Notebook();
        /**************************************
        *                                     *
        *  The credits for this plugin itself *
        *                                     *
        ***************************************/
        const vbox0    = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: false, hexpand: true });

        let title = null;
        title = _("Copyright") + ": ©2022, ©2023 &amp; ©2024 Francis Grizzly Smit:";
        const row0 = new Adw.ActionRow({ title });
        const licence = new Gtk.LinkButton({uri: "https://www.gnu.org/licenses/gpl-2.0.en.html", label: "Licence GPL v2+" });
        licence.set_use_underline(true);
        licence.set_halign(Gtk.Align.START);
        row0.add_suffix(licence);
        row0.activatable_widget = licence;
        vbox0.prepend(row0);

        title = "url:";
        const row1 = new Adw.ActionRow({ title });
        const uri0 = "https://github.com/grizzlysmit/hplip-menu2-grizzlysmit.smit.id.au#readme";
        const link0 = new Gtk.LinkButton({uri: uri0, label: "https://github.com/grizzlysmit/hplip-menu2-grizzlysmit.smit.id.au#readme" });
        link0.set_use_underline(true);
        link0.set_halign(Gtk.Align.START);
        row1.add_suffix(link0);
        row1.activatable_widget = link0;
        vbox0.append(row1);

        title = _("Author") + ": Francis Grizzly Smit©";
        const row2 = new Adw.ActionRow({ title });
        const link1 = new Gtk.LinkButton({uri: "https://github.com/grizzlysmit", label: "https://github.com/grizzlysmit" });
        link1.set_use_underline(true);
        link1.set_halign(Gtk.Align.START);
        row2.add_suffix(link1);
        row2.activatable_widget = link1;
        vbox0.append(row2);

        title = _("Dutch localisation") + ": Vistaus (Heimen Stoffels)";
        const row3 = new Adw.ActionRow({ title });
        const link2 = new Gtk.LinkButton({uri: "https://github.com/Vistaus", label: "https://github.com/Vistaus" });
        link2.set_use_underline(true);
        link2.set_halign(Gtk.Align.START);
        row3.add_suffix(link2);
        row3.activatable_widget = link2;
        vbox0.append(row3);
        let close_row_credits0 = this._close_row();
        vbox0.append(close_row_credits0);
        this.notebook.append_page(vbox0, new Gtk.Label({ label: _("This plugin"), }));

        /*********************************************************
         *                                                       *
         *                                                       *
         *      The compact mode credits as I took much code     *
         *      from "Apps Menu" by fmuellner and others.        *
         *                                                       *
         *                                                       *
         *********************************************************/
        const vbox1    = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: false, hexpand: true });

        title = _("Compact mode code taken from") + ": Apps Menu by fmuellner" + _("and others") + ":";
        const row4 = new Adw.ActionRow({ title });
        vbox1.prepend(row4);
        title = "";
        const row5 = new Adw.ActionRow({ title });
        const uri3 = "https://extensions.gnome.org/extension/6/applications-menu/";
        const link3 = new Gtk.LinkButton({uri: uri3, label: "https://extensions.gnome.org/extension/6/applications-menu/" });
        link3.set_use_underline(true);
        link3.set_halign(Gtk.Align.START);
        row5.add_suffix(link3);
        row5.activatable_widget = link3;
        vbox1.append(row5);

        title = "©2013 fmuellner";
        const row6 = new Adw.ActionRow({ title });
        const uri4 = "https://extensions.gnome.org/accounts/profile/fmuellner";
        const link4 = new Gtk.LinkButton({uri: uri4, label: "https://extensions.gnome.org/accounts/profile/fmuellner" });
        link4.set_use_underline(true);
        link4.set_halign(Gtk.Align.START);
        row6.add_suffix(link4);
        row6.activatable_widget = link4;
        vbox1.append(row6);

        title = "©2013 Debarshi Ray";
        const row7 = new Adw.ActionRow({ title });
        const link5 = new Gtk.LinkButton({uri: "https://wiki.gnome.org/DebarshiRay", label: "https://wiki.gnome.org/DebarshiRay" });
        link5.set_use_underline(true);
        link5.set_halign(Gtk.Align.START);
        row7.add_suffix(link5);
        row7.activatable_widget = link5;
        vbox1.append(row7);

        title = "©2011 Giovanni Campagna";
        const row8 = new Adw.ActionRow({ title });
        vbox1.append(row8);
        const uri6 = "https://wiki.gnome.org/GiovanniCampagna?highlight=%28%5CbCategoryHomepage%5Cb%29";
        const _link6 = new Gtk.LinkButton({uri: uri6, label: "→" });
        _link6.set_use_underline(false);
        _link6.set_halign(Gtk.Align.START);
        row8.add_suffix(_link6);
        row8.activatable_widget = _link6;
        title = "";
        const row9 = new Adw.ActionRow({ title });
        const link6 = new Gtk.LinkButton({uri: uri6, label: "https://wiki.gnome.org/GiovanniCampagna?highlight=%28%5CbCategoryHomepage%5Cb%29" });
        link6.set_use_underline(true);
        link6.set_halign(Gtk.Align.START);
        row9.add_suffix(link6);
        row9.activatable_widget = link6;
        vbox1.append(row9);

        title = "©Vamsi Krishna Brahmajosyula";
        const row10 = new Adw.ActionRow({ title });
        const uri7  = "https://github.com/vamsikrishna-brahmajosyula";
        const link7 = new Gtk.LinkButton({uri: uri7, label: "https://github.com/vamsikrishna-brahmajosyula" });
        link7.set_use_underline(true);
        link7.set_halign(Gtk.Align.START);
        row10.add_suffix(link7);
        row10.activatable_widget = link7;
        vbox1.append(row10);
        let close_row_credits1 = this._close_row();
        vbox1.append(close_row_credits1);
        this.notebook.append_page(vbox1, new Gtk.Label({ label: _("Code used from other plugins"), } ));
        group2.add(this.notebook);
        const hbox1 = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, vexpand: true, hexpand: true, });
        const bottom_spacer1 = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });
        hbox1.prepend(bottom_spacer1);
        group2.add(hbox1);

        page2.add(group2);
        window.set_deletable(false);
        /*
        // This doesn't work due to window being a Adw.Window not a straight Gtk.Window //
        // I will keep it here while I see if there is another way to do it.            //
        let preferences = new Gio.Settings({schema_id: 'org.gnome.desktop.wm.preferences'});
        let buttonLayout = preferences.get_string('button-layout');
        const headerbar = new Gtk.HeaderBar();
        const closebutton = new Gtk.Button({
                                                 //label: "",
                                                 css_classes: ["suggested-action"],
                                                 valign: Gtk.Align.CENTER,
                                                 icon_name: 'window-close-symbolic', 
                                            });
        closebutton.connect("clicked", () => { this._close_request(this._window); });
        if(buttonLayout.startsWith(':')){
            headerbar.pack_start(closebutton);
        }else{
            headerbar.pack_end(closebutton);
        }
        // this is the problem changing the titlebar is not supported in Adw.Window //
        window.set_titlebar(headerbar);
        // */
        // The differences between Gtk.Window andd Adw.Window may well explain why  //
        // returning true from "close-request" didn't stop the window closing too?? //
        // The question is is it a bug??? most likely!!!                            //
        window.connect("close-request", (_win) => {
            if(this.properties_width !== this._window._settings.get_int("properties-width")
                && this.properties_height !== this._window._settings.get_int("properties-height")){
                this._window._settings.set_int("properties-width", this.properties_width);
                this._window._settings.set_int("properties-height", this.properties_height);
            } /* if(this.properties_width !== this._window._settings.get_int("properties-width")
                     && this.properties_height !== this._window._settings.get_int("properties-height")) */
            this.area = null;
            this.icon_name = null;
            this.area_token_box = null;
            this.icon_token_box = null;
            this.position_input = null;
            this.compact_switch = null;
            this.save_settings_button = null;
            this._window = null;
            this.area_token_input = null;
            this.settings_data = null;
        });
        window.add(page1);
        window.add(page2);
        window.set_default_size(this.properties_width, this.properties_height);
    } // fillPreferencesWindow(window) //
} // export default class HpExtensionPreferences extends ExtensionPreferences //

