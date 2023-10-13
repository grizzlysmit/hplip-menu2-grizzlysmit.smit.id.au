// SPDX-FileCopyrightText: 2023 Francis Grizzly Smit <grizzly@smit.id.au>
//
// SPDX-License-Identifier: GPL-2.0-or-later

/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

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
        // */
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
                item = new PopupMenu.PopupMenuItem(this.cmds[x].text);
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

            
        }
    }

    callback_command(item, sub, ind){
        let currentAction = sub[ind].action;
        if(currentAction === undefined || currentAction === null || currentAction.length === 0){
            return false;
        }
        /* Save context variable for binding */
        if(typeof currentAction === 'string'){
            if(GLib.spawn(currentAction)){
                return true;
            }else{
                currentAction = this.cmds[ind].alt;
                if(typeof currentAction === 'string'){
                    return GLib.spawn(currentAction);
                }else{
                    return GLib.spawn_async(null, currentAction, null, GLib.SpawnFlags.SEARCH_PATH, function(_userData){});
                }
            }
        }else{
            if(GLib.spawn_async(null, currentAction, null, GLib.SpawnFlags.SEARCH_PATH, function(_userData){})){
                return true;
            }else{
                currentAction = this.cmds[ind].alt;
                if(typeof currentAction === 'string'){
                    return GLib.spawn(currentAction);
                }else{
                    return GLib.spawn_async(null, currentAction, null, GLib.SpawnFlags.SEARCH_PATH, function(_userData){});
                }
            }
        }
    }

    callback_desktop(item, action, ind){
        let currentAction = action;
        // Save context variable for binding //
        let def = Shell.AppSystem.get_default();
        let app = def.lookup_app(currentAction);
        if(app !== null){
            app.activate();
            return true;
        }else{
            let alt = this._caller.get_cmds()[ind].alt;
            if(typeof alt === 'string'){
                return GLib.spawn(alt);
            }else{
                return GLib.spawn_async(null, alt, null, GLib.SpawnFlags.SEARCH_PATH, function(_userData){});
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
                { type: "command", text: _("Additional Printer Settings..."), action: ["/usr/share/system-config-printer/system-config-printer.py"],       alt: ["gnome-terminal", "--", "/usr/bin/zenity", "--error", "--title='could not run the old printer settings'", 
                                                                                                                                                                 "--text='error running /usr/share/system-config-printer/system-config-printer.py check if the relevant package is installed'"]  },
                { type: "separator" },
                { type: "desktop", text: _("Hp Device Manager..."),           action: "hplip.desktop",                                                     alt: ["gnome-terminal", "--", "/usr/bin/zenity", "--error", "--title='could not run hp-toolbox'", 
                                                                                                                                                                 "--text='error running hp-toolbox it may not be installed you may need to install the hplips packages.'"]  },
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
            { type: "command", text: _("Settings..."),                    action: ["gnome-extensions", "prefs", "hplip-menu2@grizzlysmit.smit.id.au"] ,    alt: ["gnome-terminal", "--", "/usr/bin/zenity", "--error", "--title='could not run gnome-extensions prefs'", 
                                                                                                                                                                 "--text='error running gnome-extensions prefs check if the relevant package is installed'"] }
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

