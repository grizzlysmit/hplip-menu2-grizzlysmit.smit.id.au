/* extension.js
 *
 * Alternate Menu for Hplip2
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
"use strict";
/*global imports*/
/*eslint no-undef: "error"*/


const GObject = imports.gi.GObject;
//const Clutter = imports.gi.Clutter;
//const BoxPointer = imports.ui.boxpointer;
//const GrabHelper = imports.ui.grabHelper;

//const Gdk = imports.gi.Gdk;
//
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Main = imports.ui.main;
const Util = imports.misc.util;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
//const Panel = imports.ui.panel;
//const MessageTray = imports.ui.messageTray;

const Gettext = imports.gettext.domain("gnome-shell-extensions");
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
//const HPopupMenu = Me.imports.hPopupMenu;
//const HPanelMenu = Me.imports.hPanelMenu;

const guuid      = "hplip-menu2";
let _ext         = null;
let settings     = null;
let settings_data = null;
let settingsID    = null;

const cmds = [
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
    { type: "command", text: _("Settings..."),                    action: ["gnome-extensions", "prefs", "hplip-menu2@grizzlysmit.smit.id.au"] ,    alt: ["x-terminal-emulator", "-e", "echo", "error"] },
    {}
];

function check_command(cmd){
    if(cmd.length == 0){
        return false;
    }
    var which = null;
    switch(cmd[0]){
        case "sudo":
        case "/usr/bin/sudo":
            for(let loc = 1; loc < cmd.length; loc++){
                if(cmd[loc].substr(0, 1) == "-"){
                    switch(cmd[loc]){
                        case "-C":
                        case "--close-from":
                        case "-D":
                        case "--chdir":
                        case "--preserve-env":
                        case "-g":
                        case "--group":
                        case "-h":
                        case "--host":
                        case "-p":
                        case "--prompt":
                        case "-R":
                        case "--chroot":
                        case "-r":
                        case "--role":
                        case "-t":
                        case "--type":
                        case "-T":
                        case "--command-timeout":
                        case "-U":
                        case "--other-user":
                        case "-u":
                        case "--user":
                            loc++;
                            continue;
                        default:
                            continue;
                    }
                }else if(cmd[loc].substr(0, 1) != "-"){
                    which = GLib.find_program_in_path(cmd[loc]);
                    //which = GLib.spawn_command_line_sync("which " + cmd[loc])[1].toString();
                    return (which != null);
                }
            }
            return false;
        case "nohup":
        case "/usr/bin/nohup":
            for(let loc = 1; loc < cmd.length; loc++){
                if(cmd[loc].substr(0, 1) != "-"){
                    which = GLib.find_program_in_path(cmd[loc]);
                    //which = GLib.spawn_command_line_sync("which " + cmd[loc])[1].toString();
                    return (which != null);
                }
            }
            return false;
        case "perl":
            for(let loc = 1; loc < cmd.length; loc++){
                if(cmd[loc].substr(0, 1) == "-"){
                    switch(cmd[loc]){
                        case "-e":
                        case "-E":
                            which = GLib.find_program_in_path("perl");
                            return (which != null);
                        default:
                            continue;
                    }
                }else if(cmd[loc].substr(0, 1) != "-"){
                    which = GLib.find_program_in_path(cmd[loc]);
                    //which = GLib.spawn_command_line_sync("which " + cmd[loc])[1].toString();
                    return (which != null);
                }
            }
            return false;
        case "raku":
            for(let loc = 1; loc < cmd.length; loc++){
                if(cmd[loc].substr(0, 1) == "-"){
                    switch(cmd[loc]){
                        case "-e":
                            which = GLib.find_program_in_path("raku");
                            return (which != null);
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
                            loc++;
                            continue;
                        default:
                            continue;
                    }
                }else if(cmd[loc].substr(0, 1) != "-"){
                    which = GLib.find_program_in_path(cmd[loc]);
                    //which = GLib.spawn_command_line_sync("which " + cmd[loc])[1].toString();
                    return (which != null);
                }
            }
            return false;
        default:
            var python = /^python(:?\d+(?:\.\d+))?/i;
            if(python.test(cmd[0])){
                for(let loc = 1; loc < cmd.length; loc++){
                    if(cmd[loc].substr(0, 1) == "-"){
                        switch(cmd[loc]){
                            case "-m":
                            case "-W":
                            case "-X":
                            case "--check-hash-based-pycs":
                                loc++;
                                continue;
                            default:
                                continue;
                        }
                    }else if(cmd[loc].substr(0, 1) != "-"){
                        which = GLib.find_program_in_path(cmd[loc]);
                        //which = GLib.spawn_command_line_sync("which " + cmd[loc])[1].toString();
                        return (which != null);
                    }
                }
                return false;
            }
            which = GLib.find_program_in_path(cmd[0]);
            //which = GLib.spawn_command_line_sync("which " + cmd[0])[1].toString();
            return (which != null);
    }
}



const ExtensionImpl = GObject.registerClass(
    { GTypeName: "hplip-menu2" },    
    class ExtensionImplInt extends PanelMenu.Button {

        _init(){
            //super._init(0);
            if(settings == null){
                ExtensionUtils.initTranslations(guuid);
                settings = ExtensionUtils.getSettings();
                settings_data = JSON.parse(settings.get_string("settings-json"));
            }
            //log("settings_data.icon_name == " + settings_data.icon_name + "\n");
            if (settings_data.icon_name) {
                this.icon_name = settings_data.icon_name;
            } else {
                this.icon_name = "printer";
            }
            // */
            let gicon, icon;
            let re = /^.*\.png$/;
            let re2 = /^\/.*\.png$/;
            if (!re.test(this.icon_name) ){
                icon = new St.Icon({ icon_name: this.icon_name, style_class: "system-status-icon" });
            } else if (re2.test(this.icon_name)) {
                try {
                    gicon = Gio.icon_new_for_string(this.icon_name);
                } catch(err) {
                    gicon = false;
                }
                if (gicon) {
                    icon = new St.Icon({ gicon: gicon, style_class: "system-status-icon"  });
                } else {
                    this.icon_name = "printer";
                    icon = new St.Icon({ icon_name: this.icon_name, style_class: "system-status-icon" });
                }
            } else {
                gicon = Gio.icon_new_for_string(Me.path + "/icons/" + this.icon_name);
                icon = new St.Icon({ gicon: gicon });
            }
            let label = new St.Label({ text: "" });
            super._init(0.0, label.text);
            //super.actor.add_actor(icon);
            super.add_child(icon);

            let item = null;
            for(let x = 0; x < cmds.length; x++){

                if (cmds[x].type == "command") {
                    item = new PopupMenu.PopupMenuItem(_(cmds[x].text));
                    //let action = cmds[x].action;
                    //log("x == " + x + "\n");
                    //log("action == " + action + "\n");
                    item.connect("activate", this.callback_command.bind(item, x));
                    this.menu.addMenuItem(item);
                }

                if (cmds[x].type == "desktop") {
                    var action = cmds[x].action;

                    item = new PopupMenu.PopupMenuItem(_(cmds[x].text));
                    item.connect("activate", this.callback_desktop.bind(item, action, x));
                    this.menu.addMenuItem(item);
                }

                if (cmds[x].type == "separator") {
                    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                }

                if (cmds[x].type == "submenu"){
                    let text = cmds[x].text;
                    let submenu = new PopupMenu.PopupSubMenuMenuItem( _(text), true, this, 0);
                    //let submenu = new PopupMenu.PopupSubMenuMenuItem( _(text), true);
                    this.build_menu(submenu, cmds[x].actions);
                    this.menu.addMenuItem(submenu);
                }

                
            }
        }

        build_menu(thesubmenu, actions, depth){
            let item = null;
            depth++;
            for(let x = 0; x < actions.length; x++){

                if (actions[x].type == "command") {
                    item = new PopupMenu.PopupMenuItem(_(actions[x].text));
                    //let action = actions[x].action;
                    //log("x == " + x + "\n");
                    //log("action == " + action + "\n");
                    item.connect("activate", this.callback_command.bind(item, x));
                    thesubmenu.menu.addMenuItem(item);
                }

                if (actions[x].type == "desktop") {
                    var action = actions[x].action;

                    item = new PopupMenu.PopupMenuItem(_(actions[x].text));
                    item.connect("activate", this.callback_desktop.bind(item, action, x));
                    thesubmenu.menu.addMenuItem(item);
                }

                if (actions[x].type == "separator") {
                    thesubmenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                }

                if (actions[x].type == "submenu"){
                    //let text = actions[x].text;
                    //let submenu = new PopupMenu.PopupSubMenuMenuItem( _(text), true, thesubmenu, depth);
                    //let submenu = new PopupMenu.PopupSubMenuMenuItem( _(text), true);
                    this.build_menu(thesubmenu, actions[x].actions);
                    //thesubmenu.menu.addMenuItem(submenu);
                }

                
            }
        }

        callback_command(ind, _obj){
            //log("obj == " + obj + "\n");
            //log("ind == " + ind + "\n");
            var currentAction = cmds[ind].action;
            //log("currentAction == " + currentAction + "\n");
            /* Save context variable for binding */
            //return Util.spawn(currentAction);
            //* temporarily disable
            if(check_command(currentAction)){
                return Util.spawn(currentAction);
            }else{
                currentAction = cmds[ind].alt;
                return Util.spawn(currentAction);
            }
            // */
        }

        callback_desktop(action, ind, _obj){
            //log("action == " + action + "\n");
            //log("ind == " + ind + "\n");
            //log("obj == " + obj + "\n");
            var currentAction = action;
            // Save context variable for binding //
            let def = Shell.AppSystem.get_default();
            let app = def.lookup_app(currentAction);
            if(app != null){
                app.activate();
            }else{
                var alt = cmds[ind].alt;
                return Util.spawn(alt);
            }
        }

        /*
        constructor() {
            _init();
        }
        // */

        enable() {
            //this.parent()
            this.icon_name = settings_data.icon;
            if(settings_data.position < 0 || settings_data.position > 25) settings_data.position = 0;
            Main.panel.addToStatusArea(this.guuid, this, settings_data.position, settings_data.area);
        }

        destroy() {
            //Main.panel.remove_child(this);
            super.destroy();
        }
    }
);


/* exported init */

class Extension {
    constructor() {
    }

    enable() {
        settings = ExtensionUtils.getSettings();
        settings_data = JSON.parse(settings.get_string("settings-json"));
        if(settings_data.position < 0 || settings_data.position > 25) settings_data.position = 0;
        _ext = new ExtensionImpl();
        settingsID = settings.connect("changed::settings-json", this.onSettingsChanged.bind(this)); 
        _ext.enable();
    }

    disable() {
        _ext.destroy();
        settings.disconnect(settingsID);
        settings = null;
        settings_data = null;
        _ext = null;
    }

    onSettingsChanged(_obj){
        //log("obj == " + obj + "\n");
        _ext.destroy();
        _ext = null;
        settings_data = JSON.parse(settings.get_string("settings-json"));
        //log("settings_data.icon_name == " + settings_data.icon_name + "\n");
        //log("settings_data.area == " + settings_data.area + "\n");
        //log("settings_data.position == " + settings_data.position + "\n");
        _ext = new ExtensionImpl();
        //Main.panel.addToStatusArea(_ext.guuid, _ext, settings_data.position, settings_data.area);
        //settingsID = settings.connect("changed::settings-json", this.onSettingsChanged.bind(this)); 
        _ext.enable();
    }
}

function init() {
    ExtensionUtils.initTranslations(guuid);
    return new Extension();
}

