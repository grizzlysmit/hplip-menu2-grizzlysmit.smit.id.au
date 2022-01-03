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

const GObject = imports.gi.GObject;

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
const Convenience = Me.imports.convenience;
const Local = imports.misc.extensionUtils.getCurrentExtension();
const Settings = Local.imports.settings;

const guuid      = "hplip-menu2";
let _ext         = null;
let settings     = null;
let settings_data = null;
let settingsID    = null;

const cmds = [
    { type: "command", text: _("About This Computer"), action: ["gnome-control-center","info-overview"], alt: ["x-terminal-emulator", "-e", "echo", "error"]  },
    { type: "command", text: _("User Accounts"), action: ["gnome-control-center", "user-accounts"], alt: ["x-terminal-emulator", "-e", "echo", "error"]  },
    { type: "separator" },
    { type: "command", text: _("System Printers..."), action: ["gnome-control-center", "printers"] , alt: ["x-terminal-emulator", "-e", "echo", "error"] },
    { type: "command", text: _("Additional Printer Settings..."), action: ["/usr/bin/python3", "/usr/share/system-config-printer/system-config-printer.py"], alt: ["x-terminal-emulator", "-e", "echo", "error"]  },
    { type: "separator" },
    { type: "desktop", text: _("Hp Device Manager..."), action: "hplip.desktop", alt: ["x-terminal-emulator", "-e", "hp-toolbox"]  },
    { type: "separator" },
    { type: "command", text: _("Gnome Tweaks..."), action: ["gnome-tweaks"], alt: ["x-terminal-emulator", "-e", "echo", "error"]  },
    { type: "command", text: _("Gnome Settings..."), action: ["gnome-control-center"], alt: ["x-terminal-emulator", "-e", "echo", "error"]  },
    { type: "separator" },
    { type: "separator" },
    { type: "desktop", text: _("Software Update..."), action: "update-manager.desktop", alt: ["gnome-software",  "--mode=updates"]  },
    { type: "desktop", text: _("Gnome Software..."), action: "org.gnome.Software.desktop", alt: ["gnome-software", "--mode=overview"] },
    { type: "separator" },
    { type: "command", text: _("Settings..."), action: ["gnome-extensions", "prefs", "hplip-menu2@grizzlysmit.smit.id.au"] , alt: ["x-terminal-emulator", "-e", "echo", "error"] },
    {}
];

function check_command(cmd){
    if(cmd.length == 0){
        return false;
    }
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
                    var which = GLib.find_program_in_path(cmd[loc]);
                    //var which = GLib.spawn_command_line_sync("which " + cmd[loc])[1].toString();
                    return (which != null);
                }
            }
            return false;
        case "nohup":
        case "/usr/bin/nohup":
            for(let loc = 1; loc < cmd.length; loc++){
                if(cmd[loc].substr(0, 1) != "-"){
                    var which = GLib.find_program_in_path(cmd[loc]);
                    //var which = GLib.spawn_command_line_sync("which " + cmd[loc])[1].toString();
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
                            var which = GLib.find_program_in_path("perl");
                            return (which != null);
                        default:
                            continue;
                    }
                }else if(cmd[loc].substr(0, 1) != "-"){
                    var which = GLib.find_program_in_path(cmd[loc]);
                    //var which = GLib.spawn_command_line_sync("which " + cmd[loc])[1].toString();
                    return (which != null);
                }
            }
            return false;
        case "raku":
            for(let loc = 1; loc < cmd.length; loc++){
                if(cmd[loc].substr(0, 1) == "-"){
                    switch(cmd[loc]){
                        case "-e":
                            var which = GLib.find_program_in_path("raku");
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
                    var which = GLib.find_program_in_path(cmd[loc]);
                    //var which = GLib.spawn_command_line_sync("which " + cmd[loc])[1].toString();
                    return (which != null);
                }
            }
            return false;
        default:
            let python = /^python(:?\d+(?:\.\d+))?/i;
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
                        var which = GLib.find_program_in_path(cmd[loc]);
                        //var which = GLib.spawn_command_line_sync("which " + cmd[loc])[1].toString();
                        return (which != null);
                    }
                }
                return false;
            }
            var which = GLib.find_program_in_path(cmd[0]);
            //var which = GLib.spawn_command_line_sync("which " + cmd[0])[1].toString();
            return (which != null);
    }
    return false;
}

const ExtensionImpl = GObject.registerClass(
    { GTypeName: 'hplip-menu2' },    
    class ExtensionImplInt extends PanelMenu.Button {

        _init(){
            //super._init(0);
            if(settings == null){
                Convenience.initTranslations(guuid);
                settings = Convenience.getSettings();
                //settings_data = Settings.getSettings(settings);
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

                
            }
        }

        callback_command(ind, obj){
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

        callback_desktop(action, ind, obj){
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
        if(settings == null){
            Convenience.initTranslations(guuid);
            settings = Convenience.getSettings();
            //settings_data = Settings.getSettings(settings);
            settings_data = JSON.parse(settings.get_string("settings-json"));
        }
    }

    enable() {
        _ext = new ExtensionImpl();
        settingsID = settings.connect("changed::settings-json", this.onSettingsChanged.bind(this)); 
        _ext.enable();
    }

    disable() {
        _ext.destroy();
        settings.disconnect(settingsID);
        _ext = null;
    }

    onSettingsChanged(obj){
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
    Convenience.initTranslations(guuid);
    settings = Convenience.getSettings();
    settings_data = Settings.getSettings(settings);
    if(settings_data.position < 0 || settings_data.position > 25) settings_data.position = 0;
    return new Extension();
}

