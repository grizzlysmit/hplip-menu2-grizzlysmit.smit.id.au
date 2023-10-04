// SPDX-FileCopyrightText: 2023 Francis Grizzly Smit <grizzly@smit.id.au>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

/*eslint no-undef: "error"*/

import Adw from 'gi://Adw';
//import Gio from 'gi://Gio';
//import GLib from 'gi://GLib';
//import GObject from 'gi://GObject';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
//import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
//const ExtensionUtils = imports.misc.extensionUtils;
//const GObject = imports.gi.GObject;
//const Gtk = imports.gi.Gtk;
import Gtk from 'gi://Gtk?version=4.0';
//import St from 'gi://St';

//const Gettext = imports.gettext.domain("gnome-shell-extensions");
//const _ = Gettext.gettext;



export default class HpExtensionPreferences extends ExtensionPreferences {

    _area_token_box(){
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, });
        let area_token_label = new Gtk.Label({label: _("Area"), xalign: 0 });
        this.area_token_input = new Gtk.ComboBoxText();
        let areas = [_("Left"), _("Center"), _("Right")];
        for (let i = 0; i < areas.length; i++)
            this.area_token_input.append_text(areas[i]);
        this.area_token_input.set_active(0);
        this.area_token_input.connect ("changed", this.area_dropdown_clicked.bind(this));
        hbox.prepend(area_token_label);
        hbox.append(this.area_token_input);
        hbox.set_spacing(15);
        this.area = "left";
        return hbox;
    }

    _icon_token_box(){
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, });
        let icon_token_label = new Gtk.Label({label: _("Icon"), xalign: 0 });
        this.icon_token_input = new Gtk.ComboBoxText();
        this.icon_token_input.set_active(0);
        let icons = ["printer", "/usr/share/hplip/data/images/16x16/hp_logo.png"];
        for (let i = 0; i < icons.length; i++)
            this.icon_token_input.append_text(icons[i]);
        this.icon_token_input.connect ("changed", this.icon_dropdown_clicked.bind(this));
        hbox.prepend(icon_token_label);
        hbox.append(this.icon_token_input);
        hbox.set_spacing(15);
        this.icon_name = "printer";
        return hbox;
    }

    save_clicked(){
        //console.log("got here\n");
        // get the settings
        this.settings_data = JSON.parse(this._window._settings.get_string("settings-json"));
        //console.log("settings_data === " + JSON.stringify(this.settings_data) + "\n");
        //console.log("this.area === " + this.area + "\n");
        //console.log("this.icon_name === " + this.icon_name + "\n");
        //console.log("this.position_input.get_value() === " + this.position_input.get_value() + "\n");

        // update the values
        this.settings_data.area = this.area;
        this.settings_data.icon_name = this.icon_name;
        if(0 <= this.position_input.get_value() && this.position_input.get_value() <= 25){
            this.settings_data.position = this.position_input.get_value();
        }

        this._window._settings.set_string("settings-json", JSON.stringify(this.settings_data));
        this._window._settings.apply();
        //console.log("this.settings_data === " + JSON.stringify(this.settings_data) + "\n");
    }

    area_dropdown_clicked(combo){
        let activeItem = combo.get_active();
        //console.log("area_dropdown_clicked: activeItem === " + activeItem + "\n");
        if(activeItem >= 0){
            if (activeItem === 0) this.area = "left";
            if (activeItem === 1) this.area = "center";
            if (activeItem === 2) this.area = "right";
        }
        //console.log("area_dropdown_clicked: this.area === " + this.area + "\n");
    }

    icon_dropdown_clicked(combo){
        let activeItem = combo.get_active();
        //console.log("icon_dropdown_clicked: activeItem === " + activeItem + "\n");
        if(activeItem >= 0){
            if (activeItem === 0) this.icon_name = "printer";
            if (activeItem === 1) this.icon_name = "/usr/share/hplip/data/images/16x16/hp_logo.png";
        }
        //console.log("icon_dropdown_clicked: this.icon_name === " + this.icon_name + "\n");
    }

    _position_box(){
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, });
        let position_label = new Gtk.Label({label: _("Position"), xalign: 0});
        this.position_input = new Gtk.Scale({ orientation: Gtk.Orientation.HORIZONTAL, vexpand: false, hexpand: true });
        this.position_input.set_range(0, 25);
        //this.position_input.set_max(25);
        //this.position_input.set_step(1);
        this.position_input.set_digits(2);
        this.position_input.set_draw_value(true);
        hbox.prepend(position_label);
        hbox.append(this.position_input);
        hbox.set_spacing(15);
        this.position_input.set_value_pos(0);
        return hbox;
    }

    _save_settings_box(){
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, });
        let save_settings_spacer = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });
        this.save_settings_button = new Gtk.Button({label: _("Save Settings") });
        let save_settings_spacer_end = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });
        hbox.prepend(save_settings_spacer);
        hbox.append(this.save_settings_button);
        hbox.append(save_settings_spacer_end);
        hbox.set_spacing(15);

        return hbox;
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

        window._settings = this.getSettings();

        const page1 = Adw.PreferencesPage.new();
        page1.set_title(_("Alternate Menu for Hplip2 Settings"));
        page1.set_name("hplips_menu2_page1");
        page1.set_icon_name("preferences-system");

        // group1
        const group1 = Adw.PreferencesGroup.new();
        group1.set_title(_("Hplip menu2 settings"));
        group1.set_name("HpLip_menu2_global");
        page1.add(group1);
        //*
        let vbox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
            margin_top: 10,
        });
        // */
        //let vbox = new St.BoxLayout( { vertical: true } );
        this.area_token_box = this._area_token_box();
        // set the saved area token value
        this.settings_data = JSON.parse(window._settings.get_string("settings-json"));
        if (this.settings_data.area === "left") this.area_token_input.set_active(0);
        if (this.settings_data.area === "center") this.area_token_input.set_active(1);
        if (this.settings_data.area === "right") this.area_token_input.set_active(2);
        vbox.prepend(this.area_token_box);

        this.icon_token_box = this._icon_token_box();
        // set the saved icon token value
        if (this.settings_data.icon_name === "printer") this.icon_token_input.set_active(0);
        if (this.settings_data.icon_name === "/usr/share/hplip/data/images/16x16/hp_logo.png") this.icon_token_input.set_active(1);
        vbox.append(this.icon_token_box);
        this.position_box = this._position_box();
        //console.log("this.settings_data.position === " + this.settings_data.position + "\n");
        if(0 <= this.settings_data.position && this.settings_data.position <= 25){
            //this.position_input.set_value_pos(0);
            //this.position_input.set_value_pos(3*(this.settings_data.position/25));
            this.position_input.set_value(this.settings_data.position);
        }else{
            this.position_input.set_value_pos(0);
            this.settings_data.position = 0;
        }
        vbox.append(this.position_box);
        let save_settings_box = this._save_settings_box();
        this.save_settings_button.connect("clicked", this.save_clicked.bind(this));
        vbox.append(save_settings_box);
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, vexpand: true, hexpand: true, });
        let bottom_spacer = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });
        hbox.prepend(bottom_spacer);
        vbox.append(hbox);
        group1.add(vbox);

                //page2
        const page2 = Adw.PreferencesPage.new();
        page2.set_title(_("Credits"));
        page2.set_name("hplip_menu2_page2");
        page2.set_icon_name("help-about");

        // group2
        const group2 = Adw.PreferencesGroup.new();
        group2.set_title(_("About"));
        group2.set_name("Hplip_menu2_About");
        let vbox_about = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
            margin_top: 10,
        });
        let credits_Grid = new Gtk.Grid();
        credits_Grid.set_column_homogeneous(false);
        credits_Grid.attach(new Gtk.Label({label: _("Copyright") + ": ©2022 Francis Grizzly Smit", xalign: 0 }), 0, 0, 2, 1);
        let licence = new Gtk.LinkButton({uri: "https://www.gnu.org/licenses/gpl-2.0.en.html", label: "Licence GPL v2+" });
        licence.set_use_underline(true);
        licence.set_halign(Gtk.Align.START);
        credits_Grid.attach(licence, 2, 0, 1, 1);
        credits_Grid.attach(new Gtk.Label({label: "url:", xalign: 0 }), 0, 1, 1, 1);
        let link0 = new Gtk.LinkButton({uri: "https://github.com/grizzlysmit/hplip-menu2-grizzlysmit.smit.id.au#readme", label: "https://github.com/grizzlysmit/hplip-menu2-grizzlysmit.smit.id.au#readme" });
        link0.set_use_underline(true);
        link0.set_halign(Gtk.Align.START);
        credits_Grid.attach(link0, 1, 1, 2, 1);
        credits_Grid.attach(new Gtk.Label({label: "", xalign: 0 }), 0, 3, 1, 1);
        credits_Grid.attach(new Gtk.Label({label: "", xalign: 0 }), 1, 3, 1, 1);
        credits_Grid.attach(new Gtk.Label({label: _("Author") + ": Francis Grizzly Smit©", xalign: 0 }), 0, 4, 2, 1);
        let link1 = new Gtk.LinkButton({uri: "https://github.com/grizzlysmit", label: "https://github.com/grizzlysmit" });
        link1.set_use_underline(true);
        link1.set_halign(Gtk.Align.START);
        credits_Grid.attach(link1, 2, 4, 1, 1);
        credits_Grid.attach(new Gtk.Label({label: _("Dutch localisation") + ": Vistaus (Heimen Stoffels)", xalign: 0 }), 0, 5, 2, 1);
        let link2 = new Gtk.LinkButton({uri: "https://github.com/Vistaus", label: "https://github.com/Vistaus" });
        link2.set_use_underline(true);
        link2.set_halign(Gtk.Align.START);
        credits_Grid.attach(link2, 2, 5, 1, 1);
        vbox_about.append(credits_Grid);
        group2.add(vbox_about);
        page2.add(group2);
        window.set_default_size(675, 655);
        window.add(page1);
        window.add(page2);
    }
}

