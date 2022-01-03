/* prefs.js
 *
 * Alternate Menu for Hplip2 prefs
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/* exported init */
"use strict";
const ExtensionUtils = imports.misc.extensionUtils;
//const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Gettext = imports.gettext.domain("gnome-shell-extensions");
const _ = Gettext.gettext;

const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
//const Local = imports.misc.extensionUtils.getCurrentExtension();
//const Settings = Local.imports.settings;

let settings = null;
let frame    = null;
let area = "left";
let icon_name = "printer";
let area_token_box = null;
let area_token_input = null;
let icon_token_box = null;
let icon_token_input = null;
let position_box = null;
let position_input = null;
let guuid = "hplip-menu2";
let settings_data = null;
let save_settings_button = null;

function save_clicked(obj){
    //log("got here\n");
    // get the settings
    //settings = Convenience.getSettings();
    //settings_data = Settings.getSettings(settings);
    settings_data = JSON.parse(settings.get_string("settings-json"));
    //log("settings_data == " + JSON.stringify(settings_data) + "\n");
    //log("area == " + area + "\n");
    //log("icon_name == " + icon_name + "\n");
    //log("position_input.get_value() == " + position_input.get_value() + "\n");

    // update the values
    settings_data.area = area;
    settings_data.icon_name = icon_name;
    if(0 <= position_input.get_value() && position_input.get_value() <= 25){
        settings_data.position = position_input.get_value();
    }

    settings.set_string("settings-json", JSON.stringify(settings_data));
    //settings.apply()
    //log("settings_data == " + JSON.stringify(settings_data) + "\n");
}

function area_dropdown_clicked(combo, obj){
    let activeItem = combo.get_active();
    //log("area_dropdown_clicked: activeItem == " + activeItem + "\n");
    //log("area_dropdown_clicked: obj == " + obj + "\n");
    if(activeItem >= 0){
        if (activeItem==0) area = "left";
        if (activeItem==1) area = "center";
        if (activeItem==2) area = "right";
    }
    //log("area_dropdown_clicked: area == " + area + "\n");
}

function icon_dropdown_clicked(combo, obj){
    let activeItem = combo.get_active();
    //log("icon_dropdown_clicked: activeItem == " + activeItem + "\n");
    //log("icon_dropdown_clicked: obj == " + obj + "\n");
    if(activeItem >= 0){
        if (activeItem == 0) icon_name = "printer";
        if (activeItem == 1) icon_name = "/usr/share/hplip/data/images/16x16/hp_logo.png";
    }
    //log("icon_dropdown_clicked: icon_name == " + icon_name + "\n");
}

function _area_token_box(){
    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, });
    let area_token_label = new Gtk.Label({label: _("Area"), xalign: 0 });
    area_token_input = new Gtk.ComboBoxText();
    let areas = [_("Left"), _("Center"), _("Right")];
    for (let i = 0; i < areas.length; i++)
        area_token_input.append_text(areas[i]);
    area_token_input.set_active(0);
    area_token_input.connect ("changed", area_dropdown_clicked.bind(this));
    hbox.prepend(area_token_label);
    hbox.append(area_token_input);
    hbox.set_spacing(15);
    area = "left";
    return hbox;
}

function _icon_token_box(){
    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, });
    let icon_token_label = new Gtk.Label({label: _("Icon"), xalign: 0 });
    icon_token_input = new Gtk.ComboBoxText();
    icon_token_input.set_active(0);
    let icons = ["printer", "/usr/share/hplip/data/images/16x16/hp_logo.png"];
    for (let i = 0; i < icons.length; i++)
        icon_token_input.append_text(icons[i]);
    icon_token_input.connect ("changed", icon_dropdown_clicked.bind(this));
    hbox.prepend(icon_token_label);
    hbox.append(icon_token_input);
    hbox.set_spacing(15);
    icon_name = "printer";
    return hbox;
}

function _position_box(){
    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, });
    let position_label = new Gtk.Label({label: _("Position"), xalign: 0});
    position_input = new Gtk.Scale({ orientation: Gtk.Orientation.HORIZONTAL, vexpand: false, hexpand: true });
    position_input.set_range(0, 25);
    //position_input.set_max(25);
    //position_input.set_step(1);
    position_input.set_digits(2);
    position_input.set_draw_value(true);
    hbox.prepend(position_label);
    hbox.append(position_input);
    hbox.set_spacing(15);
    position_input.set_value_pos(0);
    return hbox;
}

function _save_settings_box(){
    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, });
    let save_settings_spacer = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });
    save_settings_button = new Gtk.Button({label: _("Save Settings") });
    let save_settings_spacer_end = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });
    hbox.prepend(save_settings_spacer);
    hbox.append(save_settings_button);
    hbox.append(save_settings_spacer_end);
    hbox.set_spacing(15);

    return hbox;
}


function init() {
    settings = Convenience.getSettings();
    //settings_data = Settings.getSettings(settings);
    settings_data = JSON.parse(settings.get_string("settings-json"));
    Convenience.initTranslations(guuid);
}

function buildPrefsWidget() {
    frame = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 12,
    });
    let vbox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 12,
        margin_top: 10,
    });
    area_token_box = _area_token_box();
    // set the saved area token value
    if (settings_data.area == "left") area_token_input.set_active(0);
    if (settings_data.area == "center") area_token_input.set_active(1);
    if (settings_data.area == "right") area_token_input.set_active(2);
    vbox.prepend(area_token_box);

    icon_token_box = _icon_token_box();
    // set the saved icon token value
    if (settings_data.icon_name == "printer") icon_token_input.set_active(0);
    if (settings_data.icon_name == "/usr/share/hplip/data/images/16x16/hp_logo.png") icon_token_input.set_active(1);
    vbox.append(icon_token_box);
    position_box = _position_box();
    //log("settings_data.position == " + settings_data.position + "\n");
    if(0 <= settings_data.position && settings_data.position <= 25){
        //position_input.set_value_pos(0);
        //position_input.set_value_pos(3*(settings_data.position/25));
        position_input.set_value(settings_data.position);
    }else{
        position_input.set_value_pos(0);
        settings_data.position = 0;
    }
    vbox.append(position_box);
    let save_settings_box = _save_settings_box();
    save_settings_button.connect("clicked", save_clicked.bind(this));
    vbox.append(save_settings_box);
    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, vexpand: true, hexpand: true, });
    let bottom_spacer = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });
    hbox.prepend(bottom_spacer);
    vbox.append(hbox);
    frame.append(vbox);
    return frame;
}
