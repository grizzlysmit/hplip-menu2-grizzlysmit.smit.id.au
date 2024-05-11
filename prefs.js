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

    _area_token_box(){
        const title = _("Area");
        const row = new Adw.ActionRow({ title });
        row.set_subtitle(_("Area in the panel"));
        this.area = this._window._settings.get_string("area");
        this.area_token_input = new Gtk.ComboBoxText();
        let areas = [_("Left"), _("Center"), _("Right")];
        let cur = 0;
        for (let i = 0; i < areas.length; i++){
            if(this.area === areas[i]) cur = i;
            this.area_token_input.append_text(areas[i]);
        }
        this.area_token_input.set_active(cur);
        this.area_token_input.connect("changed", this.area_dropdown_clicked.bind(this));
        row.add_suffix(this.area_token_input);
        row.activatable_widget = this.area_token_input;
        return row;
    }

    _icon_token_box(){
        const title = _("Icon Name");
        const row = new Adw.ActionRow({ title });
        row.set_subtitle(_("The name of the icon"));
        this.icon_token_input = new Gtk.ComboBoxText();
        let icons = ["printer", "/usr/share/hplip/data/images/16x16/hp_logo.png"];
        this.icon_name = this._window._settings.get_string("icon-name");
        let cur = 0;
        for (let i = 0; i < icons.length; i++){
            if(this.icon_name === icons[i]) cur = i;
            this.icon_token_input.append_text(icons[i]);
        }
        this.icon_token_input.set_active(cur);
        this.icon_token_input.connect ("changed", this.icon_dropdown_clicked.bind(this));
        row.add_suffix(this.icon_token_input);
        row.activatable_widget = this.icon_token_input;
        return row;
    }

    save_clicked(){
        if(this._window?._dirty){
            // update the values
            this._window._settings.set_string("area", this.area);
            this._window._settings.set_string("icon-name", this.icon_name);
            if(0 <= this.position_input.get_value() && this.position_input.get_value() <= 25){
                this._window._settings.set_int("position", this.position_input.get_value());
            }
            this._window._settings.set_boolean("compact", this.compact_switch.get_state());

            //this._window._settings.apply(); // save the settings //
            this._window._dirty = false;
        }
    }

    area_dropdown_clicked(combo){
        let activeItem = combo.get_active();
        switch(activeItem){
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
    }

    icon_dropdown_clicked(combo){
        let activeItem = combo.get_active();
        switch(activeItem){
            case 0:
                this.icon_name = "printer";
                break;
            case 1:
                this.icon_name = "/usr/share/hplip/data/images/16x16/hp_logo.png";
                break;
        }
        this._window._dirty = true;
    }

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
    }

    _compact_row(){
        const title = _("Compact");
        const row = new Adw.ActionRow({ title });
        row.set_subtitle(_("Compact Menu."));
        const compact_switch = new Gtk.Switch({
          active: this._window._settings.get_boolean("compact"),
          valign: Gtk.Align.CENTER,
        });
        row.add_suffix(compact_switch);
        row.activatable_widget = compact_switch;
        this.compact_switch = compact_switch;
        compact_switch.connect("state-set", (_sw, _state) => { this._window._dirty = true; });
        return row;
    }

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
    }

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
        this.close_button.connect("clicked", () => { this._window.close(); });

        return row;
    }

    fillPreferencesWindow(window) {
        this.area = "left";
        this.icon_name = "printer";
        this.area_token_box = null;
        this.icon_token_box = null;
        this.icon_token_input = null;
        this.position_input = null;
        this.save_settings_button = null;
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
        this.area      = this._window._settings.get_string("area");
        this.icon_name = this._window._settings.get_string("icon-name");
        this.position  = this._window._settings.get_int("position");
        this.compact   = this._window._settings.get_boolean("compact");

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
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, vexpand: true, hexpand: true, });
        let bottom_spacer = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });
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
        const vbox0    = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });

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
        const vbox1    = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });

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

        page2.add(group2);
        //window.set_can_close(false);
        window.connect("close-request", (_win) => {
            //*
            if(this._window?._dirty){
                let do_close = true;
                const dlg = new Gtk.AlertDialog();
                dlg.set_modal(true);
                dlg.set_buttons(["Cancel", "Exit Without Saving", "Save"]);
                dlg.set_cancel_button(0);
                dlg.set_default_button(2);
                dlg.set_message("Save Changes?");
                dlg.set_detail("You have unsaved changes");
                const can = new Gio.Cancellable();
                can.connect(() => { 

                    let result = new Gio.Task(win, null, (_source, _res, _data) => {});
                    let choice = dlg.choose_finish(result);
                    switch (choice) {
                        case 0: // "cancel" button //
                            do_close = true;
                            break;
                        case 1: // "Exit Without Saving" button //
                            break;
                        case 2: // "Save" button //
                            this.save_clicked();
                            break;
                    }
                });
                dlg.choose(this?._window, can);
                if(!do_close){
                    return true;
                }
            }
            // */
            this.area = null;
            this.icon_name = null;
            this.area_token_box = null;
            this.icon_token_box = null;
            this.icon_token_input = null;
            this.position_input = null;
            this.save_settings_button = null;
            this._window = null;
            this.area_token_input = null;
            this.settings_data = null;
            //this.force_close();
            return false;
        });
        /*
        this.close_id = window.connect("close-request", () => {
        });
        // */
        window.add(page1);
        window.add(page2);
        window.set_default_size(865, 575);
        /*
        this.settingsID_area = window._settings.connect("changed::area", this.onSettingsChanged.bind(this)); 
        this.settingsID_icon = window._settings.connect("changed::icon-name", this.onSettingsChanged.bind(this)); 
        this.settingsID_pos  = window._settings.connect("changed::position", this.onSettingsChanged.bind(this)); 
        this.settingsID_comp = window._settings.connect("changed::compact", this.onSettingsChanged.bind(this)); 
        // */
    } // fillPreferencesWindow(window) //
} // export default class HpExtensionPreferences extends ExtensionPreferences //

