// SPDX-FileCopyrightText: 2023 Francis Grizzly Smit <grizzly@smit.id.au>
//
// SPDX-License-Identifier: GPL-2.0-or-later

/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Gzz from './gzzDialog.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';


class ExtensionImpl extends PanelMenu.Button {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, _cmds){
        super(0.5, "Hplip-menu2");
        this._caller = caller;
        this.cmds = _cmds;

        if(this._caller.get_settings() === null){
            this._caller.set_settings(this._caller.getSettings());
            this._caller.set_settings_data(JSON.parse(this._caller.get_settings().get_string("settings-json")));
        }
        if (this._caller.get_settings_data().icon_name) {
            this.icon_name = this._caller.get_settings_data().icon_name;
        } else {
            this.icon_name = "printer";
        }
        this.icon = new St.Icon({
            style_class: 'menu-button',
        });
        let gicon/*, icon*/;
        let re = /^.*\.png$/;
        let re2 = /^\/.*\.png$/;
        if (!re.test(this.icon_name) ){
            gicon = Gio.icon_new_for_string(this.icon_name);
        } else if (re2.test(this.icon_name)) {
            try {
                gicon = Gio.icon_new_for_string(this.icon_name);
            } catch(err) {
                gicon = false;
            }
            if (!gicon) {
                this.icon_name = "printer";
                gicon = Gio.icon_new_for_string(this.icon_name);
            }
        } else {
            gicon = Gio.icon_new_for_string(this._caller.path + "/icons/" + this.icon_name);
        }
        this.icon.gicon = gicon;
        this.icon.icon_size = 17;
        this.add_child(this.icon);

        let item = null;
        for(let x = 0; x < this.cmds.length; x++){

            if (this.cmds[x].type === "command") {
                let action       = this.cmds[x].action;
                let alt          = this.cmds[x].alt;
                let errorMessage = this.cmds[x].errorMessage;
                item = new PopupMenu.PopupMenuItem(this.cmds[x].text);
                item.connect("activate", this.callback_command.bind(this, item, action, alt, errorMessage));
                this.menu.addMenuItem(item);
            }

            if (this.cmds[x].type === "desktop") {
                let action = this.cmds[x].action;
                let alt    = this.cmds[x].alt;
                let errorMessage = this.cmds[x].errorMessage;

                item = new PopupMenu.PopupMenuItem(this.cmds[x].text);
                item.connect("activate", this.callback_desktop.bind(this, item, action, alt, errorMessage));
                this.menu.addMenuItem(item);
            }

            if(this.cmds[x].type === "settings"){
                item = new PopupMenu.PopupMenuItem(this.cmds[x].text);
                item.connect("activate", () => { this._caller.openPreferences(); });
                this.menu.addMenuItem(item);
            }

            if (this.cmds[x].type === "separator") {
                this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            }

            if (this.cmds[x].type === "submenu"){
                let text = this.cmds[x].text;
                let submenu = new PopupMenu.PopupSubMenuMenuItem(text, true, this, 0);
                this.build_menu(submenu, this.cmds[x].actions);
                this.menu.addMenuItem(submenu);
            }

        }
    } // constructor(caller, _cmds) //

    build_menu(thesubmenu, actions){
        let item = null;
        for(let x = 0; x < actions.length; x++){

            if (actions[x].type === "command") {
                let action       = actions[x].action;
                let alt          = actions[x].alt;
                let errorMessage = actions[x].errorMessage;
                item = new PopupMenu.PopupMenuItem(actions[x].text);
                item.connect("activate", this.callback_command.bind(this, item, action, alt, errorMessage));
                thesubmenu.menu.addMenuItem(item);
            }

            if (actions[x].type === "desktop") {
                let action       = actions[x].action;
                let alt          = actions[x].alt;
                let errorMessage = actions[x].errorMessage;

                item = new PopupMenu.PopupMenuItem(actions[x].text);
                item.connect("activate", this.callback_desktop.bind(this, item, action, alt, errorMessage));
                thesubmenu.menu.addMenuItem(item);
            }

            if(actions[x].type === "settings"){
                item = new PopupMenu.PopupMenuItem(this.actions[x].text);
                item.connect("activate", () => { this._caller.openPreferences(); });
                thesubmenu.menu.addMenuItem(item);
            }

            if (actions[x].type === "separator") {
                thesubmenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            }

            
        }
    }

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
            let name = "no defined action.";
            
            let dialog;
            if(errorMessage === undefined){
                dialog = new Gzz.GzzMessageDialog(`could not run '${name}'`, `error running '${name}' it may not be installed you may need to install the packages containing '${name}'.`);
            }else{
                dialog = new Gzz.GzzMessageDialog(errorMessage.title, errorMessage.text);
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
                dialog = new Gzz.GzzMessageDialog(`could not run '${name}'`, `error running '${name}' it may not be installed you may need to install the packages containing '${name}'.`);
            }else{
                dialog = new Gzz.GzzMessageDialog(errorMessage.title, errorMessage.text);
            }
            dialog.open();
            return false;
        }
    }

    callback_desktop(item, action, alt, errorMessage){
        let currentAction = action;
        // Save context variable for binding //
        let def = Shell.AppSystem.get_default();
        let app = def.lookup_app(currentAction);
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
                    dialog = new Gzz.GzzMessageDialog(`could not run '${name}'`, `error running '${name}' it may not be installed you may need to install the packages containing '${name}'.`);
                }else{
                    dialog = new Gzz.GzzMessageDialog(errorMessage.title, errorMessage.text);
                }
                dialog.open();
                return false;
            }
        }
    }

    _onDestroy() {
        super.destroy();
    }
}



export default class Hplip_menu2_Extension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._ext          = null;
        this.settings      = null;
        this.settings_data = null;
        this.settingsID    = null;
        this.cmds          = null;
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

    enable() {

        this.cmds = [
            { type: "submenu", text: _("Printers..."),                  actions: [
                { type: "desktop", text: _("System Printers..."),             action: "gnome-printers-panel.desktop",                                      alt: ["gnome-control-center", "printers"] },
                { type: "command", text: _("Additional Printer Settings..."), action: ["/usr/share/system-config-printer/system-config-printer.py"],       alt: "system-config-printer.py", errorMessage: {title: "could not run the old printer settings", 
                                                                                                                                                                                                           text:  "error running '/usr/share/system-config-printer/system-config-printer.py'" 
                                                                                                                                                                                                                + "check if the relevant package is installed"}  },
                { type: "separator" },
                { type: "desktop", text: _("Hp Device Manager..."),           action: "hplip.desktop",                                                     alt: ["hp-toolbox"], errorMessage: {title: "could not run 'hp-toolbox'", 
                                                                                                                                                                                               text: "error running 'hp-toolbox' it may not be installed you may need to install the 'hplip' & 'hplip-gui' packages."}  },
            ] }, 
            { type: "separator" },
            { type: "desktop", text: _("Gnome Tweaks..."),               action: "org.gnome.tweaks.desktop",                                               alt: ["gnome-tweaks"], errorMessage: {title: "gnome-tweaks missing", text: "install the gnome-tweaks package"}  },
            { type: "desktop", text: _("Gnome Settings..."),             action: "gnome-control-center.desktop",                                           alt: ["gnome-control-center"]  },
            { type: "desktop", text: _("Extensions..."),                 action: "org.gnome.Extensions.desktop",                                           alt: ["gnome-extensions-app"]  },
            { type: "separator" },
            { type: "submenu", text: _("Hardware"),                     actions: [
                { type: "separator" },
                { type: "desktop", text: _("Power..."),                      action: "gnome-power-panel.desktop",                                          alt: ["gnome-control-center", "power"] },
                { type: "separator" },
                { type: "desktop", text: _("Display..."),                    action: "gnome-display-panel.desktop",                                        alt: ["gnome-control-center", "display"] },
                { type: "desktop", text: _("Keyboard..."),                   action: "gnome-keyboard-panel.desktop",                                       alt: ["gnome-control-center", "keyboard"] },
                { type: "desktop", text: _("Color..."),                      action: "gnome-color-panel.desktop",                                          alt: ["gnome-control-center", "color"] },
                { type: "desktop", text: _("Sound..."),                      action: "gnome-sound-panel.desktop",                                          alt: ["gnome-control-center", "sound"] },
                { type: "separator" },
                { type: "desktop", text: _("Removable Media..."),            action: "gnome-removable-media-panel.desktop",                                alt: ["gnome-control-center", "removable-media"] },
            ] }, 
            { type: "submenu", text: _("Input"),                        actions: [
                { type: "desktop", text: _("Mouse..."),                      action: "gnome-mouse-panel.desktop",                                          alt: ["gnome-control-center", "mouse"] },
                { type: "desktop", text: _("Wacom..."),                      action: "gnome-wacom-panel.desktop",                                          alt: ["gnome-control-center", "wacom"] },
            ] }, 
            { type: "submenu", text: _("Private"),                        actions: [
                { type: "desktop", text: _("Connectivity..."),               action: "gnome-connectivity-panel.desktop",                                   alt: ["gnome-control-center", "connectivity"] },
                { type: "separator" },
                { type: "desktop", text: _("Location Services..."),          action: "gnome-location-panel.desktop",                                       alt: ["gnome-control-center", "location"] },
                { type: "desktop", text: _("File History & Rubbish Bin..."), action: "gnome-usage-panel.desktop",                                          alt: ["gnome-control-center", "usage"] },
                { type: "desktop", text: _("Screen Lock..."),                action: "gnome-lock-panel.desktop",                                           alt: ["gnome-control-center", "lock"] },
            ] }, 
            { type: "separator" },
            { type: "submenu", text: _("Connections"),                  actions: [
                { type: "separator" },
                { type: "desktop", text: _("Wifi..."),                       action: "gnome-wifi-panel.desktop",                                           alt: ["gnome-control-center", "wifi"] },
                { type: "desktop", text: _("Bluetooth..."),                  action: "gnome-bluetooth-panel.desktop",                                      alt: ["gnome-control-center", "bluetooth"] },
                { type: "desktop", text: _("Network..."),                    action: "gnome-network-panel.desktop",                                        alt: ["gnome-control-center", "network"] },
            ] }, 
            { type: "submenu", text: _("Misc"),                         actions: [
                { type: "separator" },
                { type: "desktop", text: _("Search..."),                     action: "gnome-search-panel.desktop",                                         alt: ["gnome-control-center", "search"] },
                { type: "desktop", text: _("Acceessibility..."),             action: "gnome-universal-access-panel.desktop",                               alt: ["gnome-control-center", "universal-access"] },
                { type: "desktop", text: _("Sharing..."),                    action: "gnome-sharing-panel.desktop",                                        alt: ["gnome-control-center", "sharing"] },
                { type: "desktop", text: _("Default Apps..."),               action: "gnome-default-apps-panel.desktop",                                   alt: ["gnome-control-center", "default-apps"] },
            ] }, 
            { type: "submenu", text: _("Asorted"),                      actions: [
                { type: "desktop", text: _("Background..."),                 action: "gnome-background-panel.desktop",                                     alt: ["gnome-control-center", "background"] },
                { type: "desktop", text: _("Applications..."),               action: "gnome-applications-panel.desktop",                                   alt: ["gnome-control-center", "applications"] },
            ] }, 
            { type: "submenu", text: _("Locale"),                        actions: [
                { type: "separator" },
                { type: "desktop", text: _("Datetime..."),                   action: "gnome-datetime-panel.desktop",                                       alt: ["gnome-control-center", "datetime"] },
                { type: "desktop", text: _("Language and Region..."),        action: "gnome-region-panel.desktop",                                         alt: ["gnome-control-center", "region"] },
            ] }, 
            { type: "submenu", text:_("System"),                        actions: [
                { type: "separator" },
                { type: "desktop", text: _("Notifications..."),              action: "gnome-notifications-panel.desktop",                    alt: ["gnome-control-center", "notifications"] },
                { type: "desktop", text: _("User Accounts..."),              action: "gnome-user-accounts-panel.desktop",                    alt: ["gnome-control-center", "user-accounts"] },
                { type: "separator" },
                { type: "desktop", text: _("About This Computer..."),        action: "gnome-info-overview-panel.desktop",                    alt: ["gnome-control-center", "info-overview"] },
            ] }, 
            { type: "separator" },
            { type: "desktop", text: _("Software Update..."),             action: "update-manager.desktop",                                                alt: ["gnome-software",  "--mode=updates"], errorMessage: {title: " could not find 'update-manager'",
                                                                                                                                                                                                                      text: "perhaps you need to install 'update-manager' or"
                                                                                                                                                                                                                          + "'gnome-software' if your disrobution does not support 'update-manager'."}  },
            { type: "desktop", text: _("Gnome Software..."),              action: "org.gnome.Software.desktop",                                            alt: ["gnome-software", "--mode=overview"], errorMessage: {title: " could not find 'gnome-software'",
                                                                                                                                                                                                                      text: "perhaps you need to install 'gnome-software'"} },
            { type: "separator" },
            { type: "settings", text: _("Settings..."),                   action: [] ,                                                                     alt: [] }
        ];

        this.settings = this.getSettings();
        this.settings_data = JSON.parse(this.settings.get_string("settings-json"));
        if(this.settings_data.position < 0 || this.settings_data.position > 25) this.settings_data.position = 0;
        this.icon_name = this.settings_data.icon;
        this.settings.set_string("settings-json", JSON.stringify(this.settings_data));
        this.settings.apply();
        this._ext = new ExtensionImpl(this, this.cmds);
        let id = this.uuid;
        let indx = id.indexOf('@');
        Main.panel.addToStatusArea(id.substr(0, indx), this._ext, this.settings_data.position, this.settings_data.area);
        this.settingsID = this.settings.connect("changed::settings-json", this.onSettingsChanged.bind(this)); 
    }

    disable() {
        this.cmds = null;
        this._ext?.destroy();
        this.settings.disconnect(this.settingsID);
        delete this.settings;
        delete this.settings_data;
        delete this._ext;
    }

    onSettingsChanged(){
        this.disable();
        this.enable();
    }
}

