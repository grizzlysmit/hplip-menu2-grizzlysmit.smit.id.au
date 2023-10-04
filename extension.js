// SPDX-FileCopyrightText: 2023 Francis Grizzly Smit <grizzly@smit.id.au>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
//import Adw from 'gi://Adw';

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
        //this.button = new St.Button({ label:"Hplip-menu2", icon: 'printer' });
        //console.log("this._caller.get_settings_data().icon_name === " + this._caller.get_settings_data().icon_name + "\n");
        if (this._caller.get_settings_data().icon_name) {
            this.icon_name = this._caller.get_settings_data().icon_name;
        } else {
            this.icon_name = "printer";
        }
        this.icon = new St.Icon({
            style_class: 'menu-button',
        });
        // */
        let gicon/*, icon*/;
        let re = /^.*\.png$/;
        let re2 = /^\/.*\.png$/;
        if (!re.test(this.icon_name) ){
            //icon = new St.Icon({ icon_name: this.icon_name, style_class: "system-status-icon" });
            gicon = Gio.icon_new_for_string(this.icon_name);
        } else if (re2.test(this.icon_name)) {
            try {
                gicon = Gio.icon_new_for_string(this.icon_name);
            } catch(err) {
                gicon = false;
            }
            if (gicon) {
                //icon = new St.Icon({ gicon: gicon, style_class: "system-status-icon"  });
            } else {
                this.icon_name = "printer";
                //icon = new St.Icon({ icon_name: this.icon_name, style_class: "system-status-icon" });
                gicon = Gio.icon_new_for_string(this.icon_name);
            }
        } else {
            gicon = Gio.icon_new_for_string(this._caller.path + "/icons/" + this.icon_name);
            //icon = new St.Icon({ gicon: gicon });
        }
        //let label = new St.Label({ text: "Hplip_menu2" });
        this.icon.gicon = gicon;
        //super.actor.add_actor(icon);
        //this.add_actor(this.icon);
        //this.hide();
        //let cont = new Adw.ButtonContent({ "icon-name": this.icon_name} )
        //this.add_actor(label);
        this.icon.size = 25;
        this.add_child(this.icon);
        //this.button.icon = this.icon;
        //this.show();

        let item = null;
        for(let x = 0; x < this.cmds.length; x++){

            if (this.cmds[x].type === "command") {
                item = new PopupMenu.PopupMenuItem(this.cmds[x].text);
                //let action = this.cmds[x].action;
                //console.log("x === " + x + "\n");
                //console.log("action === " + action + "\n");
                item.connect("activate", this.callback_command.bind(this, item, this.cmds, x));
                this.menu.addMenuItem(item);
            }

            if (this.cmds[x].type === "desktop") {
                let action = this.cmds[x].action;

                item = new PopupMenu.PopupMenuItem(this.cmds[x].text);
                item.connect("activate", this.callback_desktop.bind(this, item, action, x));
                this.menu.addMenuItem(item);
            }

            if (this.cmds[x].type === "separator") {
                this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            }

            if (this.cmds[x].type === "submenu"){
                let text = this.cmds[x].text;
                let submenu = new PopupMenu.PopupSubMenuMenuItem(text, true, this, 0);
                //let submenu = new PopupMenu.PopupSubMenuMenuItem(text, true);
                this.build_menu(submenu, this.cmds[x].actions);
                this.menu.addMenuItem(submenu);
            }

        }
    } // constructor(caller, _cmds) //

    build_menu(thesubmenu, actions/*, depth*/){
        let item = null;
        //depth++;
        for(let x = 0; x < actions.length; x++){

            if (actions[x].type === "command") {
                item = new PopupMenu.PopupMenuItem(actions[x].text);
                //let action = actions[x].action;
                //console.log("x === " + x + "\n");
                //console.log("action === " + action + "\n");
                item.connect("activate", this.callback_command.bind(this, item, actions, x));
                thesubmenu.menu.addMenuItem(item);
            }

            if (actions[x].type === "desktop") {
                let action = actions[x].action;

                item = new PopupMenu.PopupMenuItem(actions[x].text);
                item.connect("activate", this.callback_desktop.bind(this, item, action, x));
                thesubmenu.menu.addMenuItem(item);
            }

            if (actions[x].type === "separator") {
                thesubmenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            }

            if (actions[x].type === "submenu"){
                //let text = actions[x].text;
                //let submenu = new PopupMenu.PopupSubMenuMenuItem(text, true, thesubmenu, depth);
                //let submenu = new PopupMenu.PopupSubMenuMenuItem(text, true);
                this.build_menu(thesubmenu, actions[x].actions);
                //thesubmenu.menu.addMenuItem(submenu);
            }

            
        }
    }

    check_sudo_1(cmd_arr, loc) {
        switch(cmd_arr[loc]){
            case "-C":
            case "-D":
            case "-g":
            case "-h":
            case "-p":
            case "-R":
            case "-r":
            case "-t":
            case "-T":
            case "-U":
            case "-u":
                return true;
        }
        return false;
    } // check_sudo_1(cmd_arr, loc) //

    check_sudo_2(cmd_arr, loc) {
        switch(cmd_arr[loc]){
            case "--close-from":
            case "--chdir":
            case "--preserve-env":
            case "--group":
            case "--host":
            case "--prompt":
            case "--chroot":
            case "--role":
            case "--type":
            case "--command-timeout":
            case "--other-user":
            case "--user":
                return true;
        }
        return false;
    } // check_sudo_2(cmd_arr, loc) //

    check_sudo(cmd_arr) {
        for(let loc = 1; loc < cmd_arr.length; loc++){
            if(cmd_arr[loc].substr(0, 2) === "--"){
                if(this.check_sudo_2(cmd_arr, loc)){
                    loc++;
                    continue;
                }else{
                    return false;
                }
            }else if(cmd_arr[loc].substr(0, 1) === "-"){
                if(this.check_sudo_1(cmd_arr, loc)){
                    loc++;
                    continue;
                }else{
                    return false;
                }
            }else if(cmd_arr[loc].substr(0, 1) !== "-"){
                let which = GLib.find_program_in_path(cmd_arr[loc]);
                //which = GLib.spawn_command_line_sync("which " + cmd[loc])[1].toString();
                return (which !== null);
            }
        }
        return false;
    } // sub_sudo(cmd_arr) //

    check_nohup(cmd_arr) {
        for(let loc = 1; loc < cmd_arr.length; loc++){
            if(cmd_arr[loc].substr(0, 1) !== "-"){
                let which = GLib.find_program_in_path(cmd_arr[loc]);
                //which = GLib.spawn_command_line_sync("which " + cmd[loc])[1].toString();
                return (which !== null);
            }
        }
        return false;
    } // check_nohup(cmd_arr) //

    check_raku(cmd_arr, loc){
        switch(cmd_arr[loc]){
            case "-I":
            case "-M":
            case "--target":
            case "--optimize":
            case "--rakudo-home":
            case "--doc":
            case "--repl-mode":
            case "--profile-filename":
            case "--profile-stage":
            case "--debug-port":
                return true;
        }
        return false;
    } // check_raku(cmd_arr, loc)  //

    check_python(cmd_arr, loc){
        switch(cmd_arr[loc]){
            case "-m":
            case "-W":
            case "-X":
            case "--check-hash-based-pycs":
                return true;
        }
        return false;
    } // check_python(cmd_arr, loc) //

    check_command_(cmd){
        //console.log('[EXTENSION_LOG]', "cmd === " + cmd + "\n");
        let which, python;
        if(cmd === null || cmd.length === 0){
            return false;
        }
        let cmd_arr;
        if(typeof cmd === 'string'){
            cmd_arr = cmd.split(' ');
        }else if(typeof cmd === 'object'){
            cmd_arr = cmd;
        }else{
            return false;
        }
        switch(cmd_arr[0]){
            case "sudo":
            case "/usr/bin/sudo":
                return this.check_sudo(cmd_arr);
            case "nohup":
            case "/usr/bin/nohup":
                return this.check_nohup(cmd_arr);
            case "perl":
                which = GLib.find_program_in_path(cmd_arr[1]);
                return (which !== null);
            case "raku":
                for(let loc = 1; loc < cmd_arr.length; loc++){
                    if(cmd_arr[loc].substr(0, 1) === "-"){
                        if(this.check_raku(cmd_arr, loc)){
                            loc++;
                            continue;
                        }else{
                            return false;
                        }
                    }else if(cmd_arr[loc].substr(0, 1) !== "-"){
                        which = GLib.find_program_in_path(cmd_arr[loc]);
                        //which = GLib.spawn_command_line_sync("which " + cmd[loc])[1].toString();
                        return (which !== null);
                    }
                }
                return false;
            default:
                python = /^python(:?\d+(?:\.\d+))?/i;
                if(python.test(cmd_arr[0])){
                    for(let loc = 1; loc < cmd_arr.length; loc++){
                        if(cmd_arr[loc].substr(0, 1) === "-"){
                            if(this.check_python(cmd_arr, loc)){
                                loc++;
                                continue;
                            }else{
                                return false;
                            }
                        }else if(cmd_arr[loc].substr(0, 1) !== "-"){
                            which = GLib.find_program_in_path(cmd[loc]);
                            //which = GLib.spawn_command_line_sync("which " + cmd[loc])[1].toString();
                            return (which !== null);
                        }
                    }
                    return false;
                }
                which = GLib.find_program_in_path(cmd_arr[0]);
                //which = GLib.spawn_command_line_sync("which " + cmd[0])[1].toString();
                //console.log('[EXTENSION_LOG]', "check_command_[258]: which === " + which + "\n");
                return (which !== null);
        } // switch(cmd[0]) //
    } // check_command_(cmd) //

    callback_command(item, sub, ind){
        //console.log('[EXTENSION_LOG]', "_obj === " + _obj + "\n");
        //console.log('[EXTENSION_LOG]', "ind === " + ind + "\n");
        //console.log('[EXTENSION_LOG]', "sub === " + sub + "\n");
        let currentAction = sub[ind].action;
        //console.log('[EXTENSION_LOG]', "currentAction === " + currentAction + "\n");
        if(currentAction === undefined || currentAction === null || currentAction.length === 0){
            //console.log('[EXTENSION_LOG]', "this.cmds[" + ind + "] === " + sub[ind] + "\n");
            return false;
        }
        /* Save context variable for binding */
        //return GLib.spawn(currentAction);
        //* temporarily disable
        if(this.check_command_(currentAction)){
            //console.log('[EXTENSION_LOG]', "currentAction === " + currentAction + "\n");
            if(typeof currentAction === 'string'){
                return GLib.spawn(currentAction);
            }else{
                return GLib.spawn_async(null, currentAction, null, GLib.SpawnFlags.SEARCH_PATH, function(_userData){});
            }
        }else{
            currentAction = this.cmds[ind].alt;
            //console.log('[EXTENSION_LOG]', "currentAction === " + currentAction + "\n");
            if(typeof currentAction === 'string'){
                return GLib.spawn(currentAction);
            }else{
                return GLib.spawn_async(null, currentAction, null, GLib.SpawnFlags.SEARCH_PATH, function(_userData){});
            }
        }
        // */
    }

    callback_desktop(item, action, ind){
        //console.log('[EXTENSION_LOG]', "action === " + action + "\n");
        //console.log('[EXTENSION_LOG]', "ind === " + ind + "\n");
        //console.log('[EXTENSION_LOG]', "obj === " + _obj + "\n");
        let currentAction = action;
        // Save context variable for binding //
        let def = Shell.AppSystem.get_default();
        let app = def.lookup_app(currentAction);
        if(app !== null){
            app.activate();
        }else{
            let alt = this._caller.get_cmds()[ind].alt;
            if(typeof alt === 'string'){
                GLib.spawn(alt);
            }else{
                GLib.spawn_async(null, alt, null, GLib.SpawnFlags.SEARCH_PATH, function(_userData){});
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
                { type: "command", text: _("Additional Printer Settings..."), action: ["/usr/share/system-config-printer/system-config-printer.py"],       alt: ["zenity", "--error", "--text='could not run print dialog'", "--title='error running dialog'"]  },
                { type: "separator" },
                { type: "desktop", text: _("Hp Device Manager..."),           action: "hplip.desktop",                                                     alt: ["x-terminal-emulator", "-e", "hp-toolbox"]  },
            ] }, 
            { type: "separator" },
            { type: "desktop", text: _("Gnome Tweaks..."),                action: "org.gnome.tweaks.desktop",                                              alt: ["gnome-tweaks"]  },
            { type: "desktop", text: _("Gnome Settings..."),              action: "gnome-control-center.desktop",                                          alt: ["gnome-control-center"]  },
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
            { type: "desktop", text: _("Software Update..."),             action: "update-manager.desktop",                                                alt: ["gnome-software",  "--mode=updates"]  },
            { type: "desktop", text: _("Gnome Software..."),              action: "org.gnome.Software.desktop",                                            alt: ["gnome-software", "--mode=overview"] },
            { type: "separator" },
            { type: "command", text: _("Settings..."),                    action: ["gnome-extensions", "prefs", "hplip-menu2@grizzlysmit.smit.id.au"] ,    alt: ["x-terminal-emulator", "-e", "echo", "error"] }
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
        console.log("[Hplip_menu2_Extension] id.substring(0, indx) == `" + id.substring(0, indx) +"'");
        //Main.panel.addToStatusArea(id.substring(0, indx), this._ext, this.settings_data.position, this.settings_data.area);
        Main.panel.addToStatusArea('hplip-menu2', this._ext, this.settings_data.position, this.settings_data.area);
        this.settingsID = this.settings.connect("changed::settings-json", this.onSettingsChanged); 
        //this._ext.enable();
    }

    disable() {
        this._ext?.destroy();
        this.settings.disconnect(this.settingsID);
        delete this.settings;
        delete this.settings_data;
        delete this._ext;
    }

    onSettingsChanged(){
        this.disable();
        this.enable();
        /*
        //console.log("obj === " + obj + "\n");
        this._ext?.destroy();
        this._ext = null;
        this.settings_data = JSON.parse(this.settings.get_string("settings-json"));
        //console.log("this.settings_data.icon_name === " + this.settings_data.icon_name + "\n");
        //console.log("this.settings_data.area === " + this.settings_data.area + "\n");
        //console.log("this.settings_data.position === " + this.settings_data.position + "\n");
        this._ext = new ExtensionImpl(this, this.cmds);
        //Main.panel.addToStatusArea(this.settings.get_string('uuid'), this._ext, this.settings_data.position, this.settings_data.area);
        //settingsID = this.settings.connect("changed::settings-json", this.onSettingsChanged.bind(this)); 
        this._ext.enable();
        // */
    }
}

