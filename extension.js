// SPDX-FileCopyrightText: 2023 and 2024 Francis Grizzly Smit <grizzly@smit.id.au>
//
// SPDX-License-Identifier: GPL-2.0-or-later

/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';

import * as Gzz from './gzzDialog.js';
import * as CompactMenu from './CompactMenu.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';


class ExtensionImpl extends PanelMenu.Button {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, _cmds){
        super(0.5, caller.name);
        this._caller = caller;
        this.cmds = _cmds;

        if (!this._caller.icon_name) {
            this._caller.icon_name = "printer";
        }
        this.icon = new St.Icon({
            style_class: 'menu-button',
        });
        let gicon/*, icon*/;
        let re = /^.*\.png$/;
        let re2 = /^\/.*\.png$/;
        if (!re.test(this._caller.icon_name) ){
            gicon = Gio.icon_new_for_string(this._caller.icon_name);
        } else if (re2.test(this._caller.icon_name)) {
            try {
                gicon = Gio.icon_new_for_string(this._caller.icon_name);
            } catch(err) {
                gicon = false;
            }
            if (!gicon) {
                this._caller.icon_name = "printer";
                gicon = Gio.icon_new_for_string(this._caller.icon_name);
            }
        } else {
            gicon = Gio.icon_new_for_string(this._caller.path + "/icons/" + this._caller.icon_name);
        }
        this.icon.gicon = gicon;
        this.icon.icon_size = 17;
        this.add_child(this.icon);

        Main.wm.addKeybinding(
            'hplip-menu-toggle-menu',
            this._caller.settings,
            Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            () => this.menu.toggle());

        let item         = null;
        let action       = null;
        let alt          = null;
        let errorMessage = null;
        let text         = null;
        let submenu      = null;
        for(let x = 0; x < this.cmds.length; x++){

            switch (this.cmds[x].type) {
                case "command":
                    action       = this.cmds[x].action;
                    alt          = this.cmds[x].alt;
                    errorMessage = this.cmds[x].errorMessage;
                    item = new PopupMenu.PopupMenuItem(this.cmds[x].text);
                    item.connect("activate", this.callback_command.bind(this, item, action, alt, errorMessage));
                    this.menu.addMenuItem(item);
                    break;
                case "desktop":
                    action       = this.cmds[x].action;
                    alt          = this.cmds[x].alt;
                    errorMessage = this.cmds[x].errorMessage;

                    item         = new PopupMenu.PopupMenuItem(this.cmds[x].text);
                    item.connect("activate", this.callback_desktop.bind(this, item, action, alt, errorMessage));
                    this.menu.addMenuItem(item);
                    break;
                case "settings":
                    item = new PopupMenu.PopupMenuItem(this.cmds[x].text);
                    item.connect("activate", () => { this._caller.openPreferences(); });
                    this.menu.addMenuItem(item);
                    break;
                case "separator":
                    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                    break;
                case "submenu":
                    text = this.cmds[x].text;
                    submenu = new PopupMenu.PopupSubMenuMenuItem(text, true, this, 0);
                    this.build_menu(submenu, this.cmds[x].actions);
                    this.menu.addMenuItem(submenu);
                    break;
                case "optsubmenu":
                    this.build_opt_menu(this, this.cmds[x].actions);
                    break;
            } // switch (this.cmds[x].type) //

        } // for(let x = 0; x < this.cmds.length; x++) //
    } // constructor(caller, _cmds) //

    display_message(title, message) {
        let dialog = new Gzz.GzzMessageDialog(title, message);
        dialog.open();
    } // display_message(title, message) //

    change_icon(){
        if (!this._caller.icon_name) {
            this._caller.icon_name = "printer";
        }
        let gicon;
        let re = /^.*\.png$/;
        let re2 = /^\/.*\.png$/;
        if (!re.test(this._caller.icon_name) ){
            gicon = Gio.icon_new_for_string(this._caller.icon_name);
        } else if (re2.test(this._caller.icon_name)) {
            try {
                gicon = Gio.icon_new_for_string(this._caller.icon_name);
            } catch(err) {
                gicon = false;
            }
            if (!gicon) {
                this._caller.icon_name = "printer";
                gicon = Gio.icon_new_for_string(this._caller.icon_name);
            }
        } else {
            gicon = Gio.icon_new_for_string(this._caller.path + "/icons/" + this._caller.icon_name);
        }
        this.icon.gicon = gicon;
    } // change_icon() //
    
    menu_item_command(text, action, alt, errorMessage) {
        let item = null;
        item = new PopupMenu.PopupMenuItem(text);
        item.connect("activate", this.callback_command.bind(this, item, action, alt, errorMessage));
        return item;
    } // menu_item_command(text, action, alt, errorMessage)  //

    menu_item_desktop(text, action, alt, errorMessage) {
        let item = null;
        item = new PopupMenu.PopupMenuItem(text);
        item.connect("activate", this.callback_desktop.bind(this, item, action, alt, errorMessage));
        return item;
    } // menu_item_desktop(text, action, alt, errorMessage) //

    menu_item_settings(text) {
        let item = null;
        item = new PopupMenu.PopupMenuItem(text);
        item.connect("activate", () => { this._caller.openPreferences(); });
        return item;
    } // menu_item_settings(text) //

    build_opt_menu(thesubmenu, actions){
        //let item         = null;
        let action       = null;
        let alt          = null;
        let errorMessage = null;
        let text         = null;
        let submenu      = null;
        for(let x = 0; x < actions.length; x++){

            switch (actions[x].type) {
                case "command":
                    action       = actions[x].action;
                    alt          = actions[x].alt;
                    errorMessage = actions[x].errorMessage;
                    text = actions[x].text;

                    thesubmenu.menu.addMenuItem(this.menu_item_command(text, action, alt, errorMessage));
                    break;
                case "desktop":
                    action       = actions[x].action;
                    alt          = actions[x].alt;
                    errorMessage = actions[x].errorMessage;
                    text = actions[x].text;

                    thesubmenu.menu.addMenuItem(this.menu_item_desktop(text, action, alt, errorMessage));
                    break;
                case "settings":
                    text = actions[x].text;
                    thesubmenu.menu.addMenuItem(this.menu_item_settings(text));
                    break;
                case "separator":
                    thesubmenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                    break;
                case "submenu":
                    text = actions[x].text;
                    submenu = new PopupMenu.PopupSubMenuMenuItem(text, true, this, 0);
                    this.build_menu(submenu, actions[x].actions);
                    thesubmenu.menu.addMenuItem(submenu);
                    break;
            } // actions[x].type //

        } // for(let x = 0; x < actions.length; x++) //
    } // build_opt_menu(thesubmenu, actions) //

    build_menu(thesubmenu, actions){
        //let item         = null;
        let action       = null;
        let alt          = null;
        let errorMessage = null;
        let text         = null;
        for(let x = 0; x < actions.length; x++){

            switch (actions[x].type) {
                case "command":
                    action       = actions[x].action;
                    alt          = actions[x].alt;
                    errorMessage = actions[x].errorMessage;
                    text = actions[x].text;

                    thesubmenu.menu.addMenuItem(this.menu_item_command(text, action, alt, errorMessage));
                    break;
                case "desktop":
                    action       = actions[x].action;
                    alt          = actions[x].alt;
                    errorMessage = actions[x].errorMessage;
                    text = actions[x].text;

                    thesubmenu.menu.addMenuItem(this.menu_item_desktop(text, action, alt, errorMessage));
                    break;
                case "settings":
                    text = actions[x].text;
                    thesubmenu.menu.addMenuItem(this.menu_item_settings(text));
                    break;
                case "separator":
                    thesubmenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                    break;
            } // actions[x].type //

        } // for(let x = 0; x < actions.length; x++) //
    } // build_menu(thesubmenu, actions) //

    launch(action, alt){
        if(typeof action === 'string'){
            let path = GLib.find_program_in_path(action);
            if(path === null){
                if(alt === null){
                    return false;
                }
                return this.launch(alt, null);
            }else{
                return GLib.spawn(path);
            }
        }else{
            let path = GLib.find_program_in_path(action[0]);
            if(path === null){
                if(alt === null){
                    return false;
                }
                return this.launch(alt,  null);
            }
            return GLib.spawn_async(null, action, null, GLib.SpawnFlags.SEARCH_PATH, function(_userData){});
        }
    }

    callback_command(item, action, _alt, errorMessage){
        let currentAction = action;
        let alt           = _alt;
        if((currentAction === undefined || currentAction === null || currentAction.length === 0) && (alt === undefined || alt === null || alt.length === 0)){
            let name = "<no defined action>.";
            
            let dialog;
            if(errorMessage === undefined){
                let title = this._caller.get_title(name);
                let text  = this._caller.get_text(name);
                dialog    = new Gzz.GzzMessageDialog(title, text);
            }else{
                dialog    = new Gzz.GzzMessageDialog(errorMessage.title, errorMessage.text);
            }
            dialog.open();
                        
            return false;
        }
        if(this.launch(currentAction, alt)){
            return true;
        }else{
            let name = '<unknown>';
            if(currentAction === undefined || currentAction === null || currentAction.length === 0){
                if(typeof alt === 'string'){
                    name = alt;
                }else{
                    name = alt[0];
                }
            }else{
                if(typeof currentAction === 'string'){
                    name = currentAction;
                }else{
                    name = currentAction[0];
                }
            }
            let dialog;
            if(errorMessage === undefined){
                let title = this._caller.get_title(name);
                let text  = this._caller.get_text(name);
                dialog    = new Gzz.GzzMessageDialog(title, text);
            }else{
                dialog    = new Gzz.GzzMessageDialog(errorMessage.title, errorMessage.text);
            }
            dialog.open();
            return false;
        }
    }

    callback_desktop(item, action, alt, errorMessage){
        let currentAction = action;
        // Save context variable for binding //
        let app = this._caller.appSys.lookup_app(currentAction);
        if(app !== null){
            app.activate();
            return true;
        }else{ // could not launch by action so use alt //
            let name = '<unknown>';
            if(typeof alt === 'string'){
                name = alt;
            }else{
                name = alt[0];
            }
            if(this.launch(alt, null)){
                return true;
            }else{
                let dialog;
                if(errorMessage === undefined){
                    let title = this._caller.get_title(name);
                    let text  = this._caller.get_text(name);
                    dialog    = new Gzz.GzzMessageDialog(title, text);
                }else{
                    dialog    = new Gzz.GzzMessageDialog(errorMessage.title, errorMessage.text);
                }
                dialog.open();
                return false;
            }
        }
    }

    _onDestroy() {
        Main.panel.menuManager.removeMenu(this.menu);
        super._onDestroy();

        Main.wm.removeKeybinding('hplip-menu-toggle-menu');
    }
} // class ExtensionImpl extends PanelMenu.Button //



export default class Hplip_menu2_Extension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._ext          = null;
        this.settings      = null;
        this.settings_data = null;
        this.settingsID    = null;
        this.cmds          = null;
        const id = this.uuid;
        const indx = id.indexOf('@');
        this.name = id.substr(0, indx);
    } // constructor(metadata) //

    get_cmds(){
        return this.cmds;
    }

    get_settings(){
        return this.settings;
    }

    set_settings(s){
        this.settings = s;
    }

    get_settings_data(){
        return this.settings_data;
    }

    set_settings_data(sd){
        this.settings_data = sd;
    }

    get_title(name){
        let t0 = _("could not run");
        return `${t0} '${name}'`;
    }

    get_text(name){
        let t0 = _("error running");
        let t1 = _("it may not be installed you may need to install the packages containing");
        return `${t0} '${name}' ${t1} '${name}'.`;
    }

    enable() {

        this.cmds = [
            { type: "submenu", text: _("Printers..."),                  actions: [
                { type: "desktop", text: _("System Printers..."),             action: "gnome-printers-panel.desktop",                                      alt: ["gnome-control-center", "printers"] },
                { type: "desktop", text: _("Additional Printer Settings..."), action: "system-config-printer.desktop",       alt: "system-config-printer.py", errorMessage: {title: _("could not run the old printer settings"), 
                                                                                                                                                                                                           text:  _("error running '/usr/share/system-config-printer/system-config-printer.py'" 
                                                                                                                                                                                                                  + "check if the relevant package is installed")}  },
                { type: "separator" },
                { type: "desktop", text: _("Hp Device Manager..."),           action: "hplip.desktop",                                                     alt: ["hp-toolbox"], errorMessage: {title: _("could not run 'hp-toolbox'"), 
                                                                                                                                                                                               text: _("error running 'hp-toolbox' it may not be installed you may need to install the 'hplip' & 'hplip-gui' packages.")}  },
            ] }, 
            { type: "separator" },
            { type: "submenu", text: _("System Utils..."),                  actions: [
                { type: "desktop", text: _("Gnome Tweaks..."),               action: "org.gnome.tweaks.desktop",                                               alt: ["gnome-tweaks"], errorMessage: {title: _("gnome-tweaks missing"), text: _("install the gnome-tweaks package")}  },
                { type: "desktop", text: _("Gnome Settings..."),             action: "org.gnome.Settings.desktop",                                           alt: ["gnome-control-center"]  },
                { type: "desktop", text: _("Extensions..."),                 action: "org.gnome.Extensions.desktop",                                           alt: ["gnome-extensions-app"]  },
                { type: "desktop", text: _("Extension Mangager..."),         action: "com.mattjakeman.ExtensionManager.desktop",                               alt: ["extension-manager"], errorMessage: {title: _("extension-manager missing"), text: _("install the extension-manager package")}   },
            ] }, 
            { type: "separator" },
            { type: "optsubmenu", text: _("Gnone Settings..."),                     actions: [
                { type: "submenu", text: _("Hardware"),                     actions: [
                    { type: "separator" },
                    { type: "desktop", text: _("Power..."),                      action: "gnome-power-panel.desktop",                                          alt: ["gnome-control-center", "power"] },
                    { type: "separator" },
                    { type: "desktop", text: _("Display..."),                    action: "gnome-display-panel.desktop",                                        alt: ["gnome-control-center", "display"] },
                    { type: "desktop", text: _("Keyboard..."),                   action: "gnome-keyboard-panel.desktop",                                       alt: ["gnome-control-center", "keyboard"] },
                    { type: "desktop", text: _("Color..."),                      action: "gnome-color-panel.desktop",                                          alt: ["gnome-control-center", "color"] },
                    { type: "desktop", text: _("Sound..."),                      action: "gnome-sound-panel.desktop",                                          alt: ["gnome-control-center", "sound"] },
                    { type: "separator" },
                ] }, 
                { type: "submenu", text: _("Input"),                        actions: [
                    { type: "desktop", text: _("Mouse..."),                      action: "gnome-mouse-panel.desktop",                                          alt: ["gnome-control-center", "mouse"] },
                    { type: "desktop", text: _("Wacom..."),                      action: "gnome-wacom-panel.desktop",                                          alt: ["gnome-control-center", "wacom"] },
                ] }, 
                { type: "submenu", text: _("Private"),                        actions: [
                    { type: "desktop", text: _("Ubuntu Desktop..."),             action: "gnome-ubuntu-panel.desktop",                                   alt: ["gnome-control-center", "connectivity"] },
                    { type: "separator" },
                    { type: "desktop", text: _("Privacy..."),                    action: "gnome-privacy-panel.desktop",                                       alt: ["gnome-control-center", "location"] },
                    { type: "desktop", text: _("Online Accounts..."),            action: "gnome-online-accounts-panel.desktop",                                          alt: ["gnome-control-center", "usage"] },
                ] }, 
                { type: "separator" },
                { type: "submenu", text: _("Connections"),                  actions: [
                    { type: "separator" },
                    { type: "desktop", text: _("Wifi..."),                       action: "gnome-wifi-panel.desktop",                                           alt: ["gnome-control-center", "wifi"] },
                    { type: "desktop", text: _("Bluetooth..."),                  action: "gnome-bluetooth-panel.desktop",                                      alt: ["gnome-control-center", "bluetooth"] },
                    { type: "desktop", text: _("Network..."),                    action: "gnome-network-panel.desktop",                                        alt: ["gnome-control-center", "network"] },
                    { type: "desktop", text: _("Mobile Network..."),             action: "gnome-wwan-panel.desktop",                                           alt: ["gnome-control-center", "lock"] },
                ] }, 
                { type: "submenu", text: _("Misc"),                         actions: [
                    { type: "separator" },
                    { type: "desktop", text: _("Search..."),                     action: "gnome-search-panel.desktop",                                         alt: ["gnome-control-center", "search"] },
                    { type: "desktop", text: _("Acceessibility..."),             action: "gnome-universal-access-panel.desktop",                               alt: ["gnome-control-center", "universal-access"] },
                    { type: "desktop", text: _("Sharing..."),                    action: "gnome-sharing-panel.desktop",                                        alt: ["gnome-control-center", "sharing"] },
                    { type: "desktop", text: _("Multitasking..."),               action: "gnome-multitasking-panel.desktop",                                alt: ["gnome-control-center", "removable-media"] },
                ] }, 
                { type: "submenu", text: _("Asorted"),                      actions: [
                    { type: "desktop", text: _("Background..."),                 action: "gnome-background-panel.desktop",                                     alt: ["gnome-control-center", "background"] },
                    { type: "desktop", text: _("Apps..."),                  action: "gnome-applications-panel.desktop",                                   alt: ["gnome-control-center", "applications"] },
                ] }, 
                { type: "submenu", text: _("Locale"),                        actions: [
                    { type: "separator" },
                    { type: "desktop", text: _("Datetime..."),                   action: "gnome-datetime-panel.desktop",                                       alt: ["gnome-control-center", "datetime"] },
                    { type: "desktop", text: _("Language and Region..."),        action: "gnome-region-panel.desktop",                                         alt: ["gnome-control-center", "region"] },
                ] }, 
                { type: "submenu", text:_("System"),                        actions: [
                    { type: "separator" },
                    { type: "desktop", text: _("Notifications..."),              action: "gnome-notifications-panel.desktop",                    alt: ["gnome-control-center", "notifications"] },
                    { type: "desktop", text: _("User Accounts..."),              action: "gnome-users-panel.desktop",                    alt: ["gnome-control-center", "user-accounts"] },
                    { type: "separator" },
                    { type: "desktop", text: _("About This Computer..."),        action: "gnome-about-panel.desktop",                    alt: ["gnome-control-center", "info-overview"] },
                    { type: "desktop", text: _("System..."),                     action: "gnome-system-panel.desktop",                                   alt: ["gnome-control-center", "default-apps"] },
                ] }, 
            ] }, 
            { type: "separator" },
            { type: "submenu", text: _("Software..."),                  actions: [
                { type: "desktop", text: _("Software Update..."),             action: "update-manager.desktop",                                                alt: ["gnome-software",  "--mode=updates"], errorMessage: {title: _(" could not find 'update-manager'"),
                                                                                                                                                                                                                          text: _("perhaps you need to install 'update-manager' or"
                                                                                                                                                                                                                              + "'gnome-software' if your disrobution does not support 'update-manager'.")}  },
                { type: "desktop", text: _("Gnome Software..."),              action: "org.gnome.Software.desktop",                                            alt: ["gnome-software", "--mode=overview"], errorMessage: {title: _(" could not find 'gnome-software'"),
                                                                                                                                                                                                                          text: _("perhaps you need to install 'gnome-software'")} },
            ] }, 
            { type: "separator" },
            { type: "settings", text: _("Settings..."),                   action: [] ,                                                                     alt: [] }
        ];

        this.appSys = Shell.AppSystem.get_default();
        this.settings = this.getSettings();
        if(this.settings.get_boolean("first-time")){ // grab legacy settings //
            this.settings_data = JSON.parse(this.settings.get_string("settings-json"));
            this.settings.set_string("area", this.settings_data.area);
            this.settings.set_string("icon-name", this.settings_data.icon_name);
            this.settings.set_int("position", this.settings_data.position);
            this.settings.set_boolean("first-time", false); // old settings obtained //
            this.settings.set_boolean("compact", this.settings.get_boolean("compact")); // make sure it is saved to dconf db //
            this.settings.apply(); // save settings //
            this.area      = this.settings.get_string("area");
            this.icon_name = this.settings.get_string("icon-name");
            this.position  = this.settings.get_int("position");
            this.compact   = this.settings.get_boolean("compact");
        }else{
            this.area      = this.settings.get_string("area");
            this.icon_name = this.settings.get_string("icon-name");
            this.position  = this.settings.get_int("position");
            this.compact   = this.settings.get_boolean("compact");
        }
        if(this.settings.get_int("position") < 0 || this.settings.get_int("position") > 25) this.settings.set_int("position", 0);
        this.icon_name = this.settings.get_string("icon-name");
        this.area = this.settings.get_string("area");
        this.settings.apply();
        if(this.compact){
            this._ext = new CompactMenu.ApplicationsButton(this, this.cmds);
        } else {
            this._ext = new ExtensionImpl(this, this.cmds);
        }
        if(Main.panel.statusArea[this.name]){
            Main.panel.statusArea[this.name] = null;
        }
        Main.panel.addToStatusArea(this.name, this._ext, this.settings.get_int("position"), this.settings.get_string("area"));
        this.settingsID_area = this.settings.connect("changed::area", this.onPositionChanged.bind(this)); 
        this.settingsID_pos  = this.settings.connect("changed::position", this.onPositionChanged.bind(this)); 
        this.settingsID_icon = this.settings.connect("changed::icon-name", this.onIconChanged.bind(this)); 
        this.settingsID_comp = this.settings.connect("changed::compact", this.onCompactChanged.bind(this)); 
    } // enable() //

    disable() {
        this.cmds = null;
        //Main.panel.menuManager.removeMenu(this._ext.menu);
        this._ext?._onDestroy();
        this.settings.disconnect(this.settingsID_area);
        this.settings.disconnect(this.settingsID_pos);
        this.settings.disconnect(this.settingsID_icon);
        this.settings.disconnect(this.settingsID_comp);
        delete this.appSys;
        delete this.settings;
        delete this.settings_data;
        delete this._ext;
    }

    onIconChanged(){
        this.icon_name = this.settings.get_string("icon-name");
        this._ext.change_icon();
    }

    onPositionChanged(){
        Main.panel.menuManager.removeMenu(this._ext.menu);
        Main.panel.statusArea[this.name] = null;
        this.area      = this.settings.get_string("area");
        this.position  = this.settings.get_int("position");
        Main.panel.addToStatusArea(this.name, this._ext, this.position, this.area);
    }

    onCompactChanged(){
        this.settings.disconnect(this.settingsID_area);
        this.settings.disconnect(this.settingsID_pos);
        this.settings.disconnect(this.settingsID_icon);
        this.settings.disconnect(this.settingsID_comp);
        this.area      = this.settings.get_string("area");
        this.position  = this.settings.get_int("position");
        this.icon_name = this.settings.get_string("icon-name");
        this.compact   = this.settings.get_boolean("compact");
        try {
            this._ext?._onDestroy();
            Main.panel.statusArea[this.name] = null;
            delete this._ext;
        }
        catch(e){
            console.log(`Error: Hplip_menu2_Extension: ${e}`);
            return;
        }
        if(this.compact){
            try {
                if(Main.panel.statusArea[this.name]){
                    Main.panel.statusArea[this.name] = null;
                }
                this._ext = new CompactMenu.ApplicationsButton(this, this.cmds);
                Main.panel.addToStatusArea(this.name, this._ext, this.position, this.area);
            }
            catch(e){
                console.log(`Error: Hplip_menu2_Extension: ${e}`);
                if(Main.panel.statusArea[this.name]){
                    Main.panel.statusArea[this.name] = null;
                }
                this._ext = new ExtensionImpl(this, this.cmds);
                Main.panel.addToStatusArea(this.name, this._ext, this.position, this.area);
                return;
            }
        } else {
            if(Main.panel.statusArea[this.name]){
                Main.panel.statusArea[this.name] = null;
            }
            this._ext = new ExtensionImpl(this, this.cmds);
            Main.panel.addToStatusArea(this.name, this._ext, this.position, this.area);
        }
        this.settingsID_area = this.settings.connect("changed::area", this.onPositionChanged.bind(this)); 
        this.settingsID_pos  = this.settings.connect("changed::position", this.onPositionChanged.bind(this)); 
        this.settingsID_icon = this.settings.connect("changed::icon-name", this.onIconChanged.bind(this)); 
        this.settingsID_comp = this.settings.connect("changed::compact", this.onCompactChanged.bind(this)); 
        // */
    }
} // export default class Hplip_menu2_Extension extends Extension //

