// I used code from the Apps Menu apps-menu@gnome-shell-extensions.gcampax.github.com for this file
// it implements my compact mode. I have modified it but the legacy is there.
// SPDX-FileCopyrightText: 2011 Vamsi Krishna Brahmajosyula <vamsikrishna.brahmajosyula@gmail.com>
// SPDX-FileCopyrightText: 2011 Giovanni Campagna <gcampagna@src.gnome.org>
// SPDX-FileCopyrightText: 2013 Debarshi Ray <debarshir@gnome.org>
// SPDX-FileCopyrightText: 2013 Florian Müllner <fmuellner@gnome.org>
// SPDX-FileCopyrightText: 2024 Francis Grizzly Smit <grizzly@smit.id.au>
//
// SPDX-License-Identifier: GPL-2.0-or-later

/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
/* global global:writable */

import Atk from 'gi://Atk';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';
import {EventEmitter} from 'resource:///org/gnome/shell/misc/signals.js';
import * as Gzz from './gzzDialog.js';

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

import * as DND from 'resource:///org/gnome/shell/ui/dnd.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as LogMessage from './log_message.js';


const APPLICATION_ICON_SIZE = 32;
const HORIZ_FACTOR = 5;
const MENU_HEIGHT_OFFSET = 132;
const NAVIGATION_REGION_OVERSHOOT = 50;

Gio._promisify(Gio._LocalFilePrototype, 'query_info_async', 'query_info_finish');
Gio._promisify(Gio._LocalFilePrototype, 'set_attributes_async', 'set_attributes_finish');

class ApplicationMenuItem extends PopupMenu.PopupBaseMenuItem {
    static {
        GObject.registerClass(this);
    }

    constructor(button, item) {
        super();
        this._menuitem = this;
        this._item = item;
        this._button = button;

        this.pages = {
            settings:     0, 
            about:        1, 
            creditsThis:  2, 
            creditsOther: 3, 
        };

        let action = null;
        switch (this._item.type) {
            case "command":
            case "desktop":
                action       = this._item?.action;
                if(action instanceof Array)
                    action = action[0];
                break;
        } // switch (this.item.type) //
        if(action) this._app = this._button.appSys.lookup_app(action);

        this._iconBin = new St.Bin();
        this.add_child(this._iconBin);

        let menuitemLabel = new St.Label({
            text: this._item?.text ?? '<Error bad value for this_item.text>',
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(menuitemLabel);
        this.label_actor = menuitemLabel;

        let textureCache = St.TextureCache.get_default();
        textureCache.connectObject('icon-theme-changed',
            () => this._updateIcon(), this);
        this._updateIcon();

        this._delegate = this;
        let draggable = DND.makeDraggable(this);

        let maybeStartDrag = draggable._maybeStartDrag;
        draggable._maybeStartDrag = event => {
            if (this._dragEnabled)
                return maybeStartDrag.call(draggable, event);
            return false;
        };
        switch (this._item.type) {
            case "command":
            case "desktop":
            case "settings":
                this._button.applicationsBox.add_child(this);
                break;
        } // switch (this.item.type) //
    } // constructor(button, item) //

    launch(action, alt){
        if(typeof action === 'string' || action instanceof String){
            let path = GLib.find_program_in_path(action.toString());
            if(path === null){
                if(alt === null){
                    return false;
                }
                return this.launch(alt, null);
            }else{
                const [ok, _out, _err, _status, ] = GLib.spawn_command_line_sync(path);
                return ok;
            }
        }else if(Array.isArray(action) && action.every( (elt) => { return elt instanceof String || typeof elt === 'string'})){
            action = action.map( (elt) => elt.toString() );
            let path = GLib.find_program_in_path(action[0]);
            if(path === null){
                if(alt === null){
                    return false;
                }
                return this.launch(alt,  null);
            }
            //return GLib.spawn_async(null, action, null, GLib.SpawnFlags.SEARCH_PATH, function(_userData){});
            return !!Shell.util_spawn_async(null, action, null, GLib.SpawnFlags.SEARCH_PATH);
        }else{
            return false;
        }
    }

    callback_command(item, action, _alt, errorMessage){
        let currentAction = action;
        let alt           = _alt;
        if((currentAction === undefined || currentAction === null || currentAction.length === 0)
                                        && (alt === undefined || alt === null || alt.length === 0)){
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
        let app = this._button.appSys.lookup_app(currentAction);
        if(app){
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
                    let title = this._button._caller.get_title(name);
                    let text  = this._button._caller.get_text(name);
                    dialog    = new Gzz.GzzMessageDialog(title, text);
                }else{
                    dialog    = new Gzz.GzzMessageDialog(errorMessage.title, errorMessage.text);
                }
                dialog.open();
                return false;
            }
        }
    }

    activate(event) {
        if(this._app){
            this._app.open_new_window(-1);
        }else{
            let action       = null;
            let alt          = null;
            let errorMessage = null;
            switch (this._item.type) {
                case "command":
                    action       = this._item.action;
                    alt          = this._item.alt;
                    errorMessage = this._item.errorMessage;
                    this.callback_command(this._button, this, action, alt, errorMessage);
                    break;
                case "desktop":
                    action       = this._item.action;
                    alt          = this._item.alt;
                    errorMessage = this._item.errorMessage;

                    this.callback_desktop(this._button, this, action, alt, errorMessage);
                    break;
                case "settings":
                    this._button._caller.settings.set_boolean('goto-page', true);
                    this._button._caller.settings.set_enum('page', this.pages[this._item.subtype]);
                    this._button._caller._extension.openPreferences();
                    break;
            } // switch (this._item.type) //
        }
        this._button.selectCategory(null);
        this._button.menu.toggle();
        super.activate(event);

        Main.overview.hide();
    }

    setActive(active, params) {
        if (active)
            this._button.scrollToButton(this);
        super.setActive(active, params);
    }

    setDragEnabled(enabled) {
        this._dragEnabled = enabled;
    }

    getDragActor() {
        let action       = null;
        let alt          = null;
        let app          = null;
        let gicon        = null;
        let icon         = null;
        switch (this._item.type) {
            case "command":
                action       = this._item?.action;
                alt          = this._item?.alt;

                if(action instanceof Array)
                    action = action[0];
                app = this._button.appSys.lookup_app(action);
                if(!app){
                    if(alt instanceof Array)
                        alt = alt[0];
                    app = this._button.appSys.lookup_app(alt);
                }
                break;
            case "desktop":
                action       = this._item?.action;
                alt          = this._item?.alt;

                if(action instanceof Array)
                    action = action[0];
                app = this._button.appSys.lookup_app(action);
                if(!app){
                    if(alt instanceof Array)
                        alt = alt[0];
                    app = this._button.appSys.lookup_app(alt);
                }
                break;
            case "settings":
                switch(this._item.subtype){
                    case 'settings':
                        icon = new St.Icon({
                            style_class: 'icon-dropshadow',
                        });
                        gicon = Gio.icon_new_for_string('preferences-system');
                        icon.gicon = gicon;
                        icon.icon_size = 17;
                        return icon;
                    case 'about':
                        icon = new St.Icon({
                            style_class: 'icon-dropshadow',
                        });
                        gicon = Gio.icon_new_for_string('help-about');
                        icon.gicon = gicon;
                        icon.icon_size = 17;
                        return icon;
                    case 'credits->this':
                        icon = new St.Icon({
                            style_class: 'icon-dropshadow',
                        });
                        gicon = Gio.icon_new_for_string('copyright');
                        icon.gicon = gicon;
                        icon.icon_size = 17;
                        return icon;
                    case 'credits->other':
                        icon = new St.Icon({
                            style_class: 'icon-dropshadow',
                        });
                        gicon = Gio.icon_new_for_string('copyright');
                        icon.gicon = gicon;
                        icon.icon_size = 17;
                        return icon;
                    default:
                        app = this._button.appSys.lookup_app('org.gnome.Settings');
                } // switch(this._item.subtype) //
                break;
        } // switch (this.item.type) //
        if(!app){
            let icon = new St.Icon({
                style_class: 'icon-dropshadow',
            });
            let gicon/*, icon*/;
            let icon_name = "printer";
            gicon = Gio.icon_new_for_string(icon_name);
            icon.gicon = gicon;
            icon.icon_size = 17;
            return icon;
        }
        return app.create_icon_texture(APPLICATION_ICON_SIZE);
    }

    getDragActorSource() {
        return this._iconBin;
    }

    _updateIcon() {
        let icon = this.getDragActor();
        if(icon){
            icon.style_class = 'icon-dropshadow';
            this._iconBin.set_child(icon);
        }
    }
} // class ApplicationMenuItem extends PopupMenu.PopupBaseMenuItem //

class CategoryMenuItem extends PopupMenu.PopupBaseMenuItem {
    static {
        GObject.registerClass(this);
    }

    constructor(button, category) {
        super();
        this._category = category;
        this._button = button;

        this._oldX = -1;
        this._oldY = -1;

        let name;
        if (this._category)
            name = this._category?.text ?? '<Error no valuefound this._category.text>';
        else
            name = _('Miscellaneous');

        this.add_child(new St.Label({text: name}));
        this.connect('motion-event', this._onMotionEvent.bind(this));
        this.connect('notify::active', this._onActiveChanged.bind(this));
    } // constructor(button, category) //

    activate(event) {
        this._button.selectCategory(this?._category ?? null);
        this._button.scrollToCatButton(this);
        super.activate(event);
    }

    _isNavigatingSubmenu([x, y]) {
        let [posX, posY] = this.get_transformed_position();

        if (this._oldX === -1) {
            this._oldX = x;
            this._oldY = y;
            return true;
        }

        let deltaX = Math.abs(x - this._oldX);
        let deltaY = Math.abs(y - this._oldY);

        this._oldX = x;
        this._oldY = y;

        // If it lies outside the x-coordinates then it is definitely outside.
        if (posX > x || posX + this.width < x)
            return false;

        // If it lies inside the menu item then it is definitely inside.
        if (posY <= y && posY + this.height >= y)
            return true;

        // We want the keep-up triangle only if the movement is more
        // horizontal than vertical.
        if (deltaX * HORIZ_FACTOR < deltaY)
            return false;

        // Check whether the point lies inside triangle ABC, and a similar
        // triangle on the other side of the menu item.
        //
        //   +---------------------+
        //   | menu item           |
        // A +---------------------+ C
        //              P          |
        //                         B

        // Ensure that the point P always lies below line AC so that we can
        // only check for triangle ABC.
        if (posY > y) {
            let offset = posY - y;
            y = posY + this.height + offset;
        }

        // Ensure that A is (0, 0).
        x -= posX;
        y -= posY + this.height;

        // Check which side of line AB the point P lies on by taking the
        // cross-product of AB and AP. See:
        // http://stackoverflow.com/questions/3461453/determine-which-side-of-a-line-a-point-lies
        if (this.width * y - NAVIGATION_REGION_OVERSHOOT * x <= 0)
            return true;

        return false;
    }

    _onMotionEvent(actor, event) {
        if (!this._grab) {
            this._oldX = -1;
            this._oldY = -1;
            const grab = global.stage.grab(this);
            if (grab.get_seat_state() !== Clutter.GrabState.NONE)
                this._grab = grab;
            else
                grab.dismiss();
        }
        this.hover = true;

        if (this._isNavigatingSubmenu(event.get_coords()))
            return true;

        this._oldX = -1;
        this._oldY = -1;
        this.hover = false;
        this._grab?.dismiss();
        delete this._grab;

        const targetActor = global.stage.get_event_actor(event);
        if (targetActor instanceof St.Widget)
            targetActor.sync_hover();

        return false;
    }

    _onActiveChanged() {
        if (!this.active)
            return;

        this._button.selectCategory(this?._category ?? null);
        this._button.scrollToCatButton(this);
    }
} // class CategoryMenuItem extends PopupMenu.PopupBaseMenuItem //

class ApplicationsMenu extends PopupMenu.PopupMenu {
    constructor(sourceActor, arrowAlignment, arrowSide, button) {
        super(sourceActor, arrowAlignment, arrowSide);
        this._button = button;
    }

    isEmpty() {
        return false;
    }

    toggle() {
        if (this.isOpen)
            this._button.selectCategory(null);
        super.toggle();
    }
} // class ApplicationsMenu extends PopupMenu.PopupMenu //

class DesktopTarget extends EventEmitter {
    constructor() {
        super();

        this._desktop = null;
        this._desktopDestroyedId = 0;

        this._windowAddedId =
            global.window_group.connect('child-added',
                this._onWindowAdded.bind(this));

        global.get_window_actors().forEach(a => {
            this._onWindowAdded(a.get_parent(), a);
        });
    }

    get hasDesktop() {
        return this._desktop !== null;
    }

    _onWindowAdded(group, actor) {
        if (!(actor instanceof Meta.WindowActor))
            return;

        if (actor.meta_window.get_window_type() === Meta.WindowType.DESKTOP)
            this._setDesktop(actor);
    }

    _setDesktop(desktop) {
        if (this._desktop) {
            this._desktop.disconnectObject(this);
            delete this._desktop._delegate;
        }

        this._desktop = desktop;
        this.emit('desktop-changed');

        if (this._desktop) {
            this._desktop.connectObject('destroy', () => {
                this._setDesktop(null);
            }, this);
            this._desktop._delegate = this;
        }
    }

    _getSourceAppInfo(source) {
        if (!(source instanceof ApplicationMenuItem))
            return null;
        return source._app?.app_info ?? null;
    }

    async _markTrusted(file) {
        let modeAttr = Gio.FILE_ATTRIBUTE_UNIX_MODE;
        let trustedAttr = 'metadata::trusted';
        let queryFlags = Gio.FileQueryInfoFlags.NONE;
        let ioPriority = GLib.PRIORITY_DEFAULT;

        try {
            let info = await file.query_info_async(modeAttr, queryFlags, ioPriority, null);

            let mode = info.get_attribute_uint32(modeAttr) | 0o100;
            info.set_attribute_uint32(modeAttr, mode);
            info.set_attribute_string(trustedAttr, 'yes');
            await file.set_attributes_async(info, queryFlags, ioPriority, null);

            // Hack: force nautilus to reload file info
            info = new Gio.FileInfo();
            info.set_attribute_uint64(
                Gio.FILE_ATTRIBUTE_TIME_ACCESS, GLib.get_real_time());
            try {
                await file.set_attributes_async(info, queryFlags, ioPriority, null);
            } catch (e) {
                LogMessage.log_message(
                    LogMessage.get_prog_id(), `DesktopTarget::_markTrusted: Failed to update access time: ‷${e}‴`, e
                );
            }
        } catch (e) {
            LogMessage.log_message(
                LogMessage.get_prog_id(), `DesktopTarget::_markTrusted: Failed to mark file as trusted: ‷${e}‴`, e
            );
        }
    }

    destroy() {
        global.window_group.disconnectObject(this);
        this._setDesktop(null);
    }

    handleDragOver(source, _actor, _x, _y, _time) {
        let appInfo = this._getSourceAppInfo(source);
        if (!appInfo)
            return DND.DragMotionResult.CONTINUE;

        return DND.DragMotionResult.COPY_DROP;
    }

    acceptDrop(source, _actor, _x, _y, _time) {
        let appInfo = this._getSourceAppInfo(source);
        if (!appInfo)
            return false;

        this.emit('app-dropped');

        let desktop = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DESKTOP);

        let src = Gio.File.new_for_path(appInfo.get_filename());
        let dst = Gio.File.new_for_path(GLib.build_filenamev([desktop, src.get_basename()]));

        try {
            // copy_async() isn't introspectable :-(
            src.copy(dst, Gio.FileCopyFlags.OVERWRITE, null, null);
            this._markTrusted(dst);
        } catch (e) {
            LogMessage.log_message(
                LogMessage.get_prog_id(), `DesktopTarget::acceptDrop: Failed to copy to desktop: ‷${e}‴`, e
            );
        }

        return true;
    }
} // class DesktopTarget extends EventEmitter //

class MainLayout extends Clutter.BoxLayout {
    static {
        GObject.registerClass(this);
    }

    vfunc_get_preferred_height(container, forWidth) {
        const [mainChild] = container;
        const [minHeight, natHeight] =
            mainChild.get_preferred_height(forWidth);

        return [minHeight, natHeight + MENU_HEIGHT_OFFSET];
    }
} // class MainLayout extends Clutter.BoxLayout //

export class ApplicationsButton extends PanelMenu.Button {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, _cmds) {
        super(1.0, null, false);
        this._caller = caller;
        this.cmds = _cmds;
        this.appSys = this._caller.appSys;


        this.setMenu(new ApplicationsMenu(this, 1.0, St.Side.TOP, this));
        if (Main.panel._menus === undefined)
          Main.panel.menuManager.addMenu(this.menu);
        else Main.panel._menus.addMenu(this.menu);

        // At this moment applications menu is not keyboard navigable at
        // all (so not accessible), so it doesn't make sense to set as
        // role ATK_ROLE_MENU like other elements of the panel.
        this.accessible_role = Atk.Role.LABEL;

        if (!this._caller.get_settings().get_string("icon-name")) {
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
            } catch(_err) {
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

        this.name = this._caller._name;
        this.icon_actor = this.icon;

        Main.overview.connectObject(
            'showing', () => this.add_accessible_state(Atk.StateType.CHECKED),
            'hiding', () => this.remove_accessible_state(Atk.StateType.CHECKED),
            this);

        Main.wm.addKeybinding(
            'hplip-menu-toggle-menu',
            this._caller.settings,
            Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            () => this.menu.toggle());

        this._desktopTarget = new DesktopTarget();
        this._desktopTarget.connect('app-dropped', () => {
            this.menu.close();
        });
        this._desktopTarget.connect('desktop-changed', () => {
            this._applicationsButtons.forEach(c => {
                c.setDragEnabled(this._desktopTarget.hasDesktop);
            });
        });


        this._applicationsButtons = new Map();
        this.reloadFlag = false;
        this._createLayout();
        this._display();
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
            } catch(_err) {
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
    } // change_icon //

    _onDestroy() {
        Main.panel.menuManager.removeMenu(this.menu);
        super._onDestroy();

        Main.wm.removeKeybinding('hplip-menu-toggle-menu');

        this._desktopTarget.destroy();
    }

    _onMenuKeyPress(actor, event) {
        let symbol = event.get_key_symbol();
        if (symbol === Clutter.KEY_Left || symbol === Clutter.KEY_Right) {
            let direction = symbol === Clutter.KEY_Left
                ? St.DirectionType.LEFT : St.DirectionType.RIGHT;
            if (this.menu.actor.navigate_focus(global.stage.key_focus, direction, false))
                return true;
        }
        return super._onMenuKeyPress(actor, event);
    }

    _onOpenStateChanged(menu, open) {
        if (open) {
            if (this.reloadFlag) {
                this._redisplay();
                this.reloadFlag = false;
            }
            this.mainBox.show();
        }
        super._onOpenStateChanged(menu, open);
    }

    _redisplay() {
        this.applicationsBox.destroy_all_children();
        this.categoriesBox.destroy_all_children();
        this._display();
    }

    _loadCategory(categoryId, thesubmenu, actions) {
        for(let x = 0; x < actions.length; x++){
            switch (actions[x].type) {
                case "command":
                case "desktop":
                case "settings":
                case "separator":
                    if(categoryId){
                        this.applicationsByCategory[categoryId].push(actions[x]);
                    }else{
                        this.applicationsByCategory['Miscellaneous'].push(actions[x]);
                    }
                    break;
            } // actions[x].type //
        }
    } // _loadCategory(categoryId, thesubmenu, actions) //

    scrollToButton(button) {
        let appsScrollBoxAdj = this.applicationsScrollBox.get_vadjustment();
        let appsScrollBoxAlloc = this.applicationsScrollBox.get_allocation_box();
        let currentScrollValue = appsScrollBoxAdj.get_value();
        let boxHeight = appsScrollBoxAlloc.y2 - appsScrollBoxAlloc.y1;
        let buttonAlloc = button.get_allocation_box();
        let newScrollValue = currentScrollValue;
        if (currentScrollValue > buttonAlloc.y1 - 10)
            newScrollValue = buttonAlloc.y1 - 10;
        if (boxHeight + currentScrollValue < buttonAlloc.y2 + 10)
            newScrollValue = buttonAlloc.y2 - boxHeight + 10;
        if (newScrollValue !== currentScrollValue)
            appsScrollBoxAdj.set_value(newScrollValue);
    }

    scrollToCatButton(button) {
        let catsScrollBoxAdj = this.categoriesScrollBox.get_vadjustment();
        let catsScrollBoxAlloc = this.categoriesScrollBox.get_allocation_box();
        let currentScrollValue = catsScrollBoxAdj.get_value();
        let boxHeight = catsScrollBoxAlloc.y2 - catsScrollBoxAlloc.y1;
        let buttonAlloc = button.get_allocation_box();
        let newScrollValue = currentScrollValue;
        if (currentScrollValue > buttonAlloc.y1 - 10)
            newScrollValue = buttonAlloc.y1 - 10;
        if (boxHeight + currentScrollValue < buttonAlloc.y2 + 10)
            newScrollValue = buttonAlloc.y2 - boxHeight + 10;
        if (newScrollValue !== currentScrollValue)
            catsScrollBoxAdj.set_value(newScrollValue);
    }

    _createLayout() {
        let section = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(section);
        this.mainBox = new St.BoxLayout({layoutManager: new MainLayout()});
        this.leftBox = new St.BoxLayout({vertical: true});
        this.applicationsScrollBox = new St.ScrollView({
            style_class: 'apps-menu vfade',
            x_expand: true,
        });
        this.applicationsScrollBox.set_policy(St.PolicyType.NEVER, St.PolicyType.AUTOMATIC);
        //let vscroll = this.applicationsScrollBox.get_vscroll_bar();
        /*
        this.applicationsScrollBox.connect('notify::scroll-start', () => {
            LogMessage.log_message(
                LogMessage.get_prog_id(),
                'ApplicationsButton::_createLayout: ‷applicationsScrollBox->notify::scroll-start‴', new Error()
            );
            this.menu.passEvents = true;
        });
        this.applicationsScrollBox.connect('notify::scroll-stop', () => {
            LogMessage.log_message(
                LogMessage.get_prog_id(),
                'ApplicationsButton::_createLayout: ‷applicationsScrollBox->notify::scroll-stop‴', new Error()
            );
            this.menu.passEvents = false;
        });
        // */
        this.categoriesScrollBox = new St.ScrollView({
            style_class: 'vfade',
        });
        this.categoriesScrollBox.set_policy(St.PolicyType.NEVER, St.PolicyType.AUTOMATIC);
        //vscroll = this.categoriesScrollBox.get_vscroll_bar();
        /*
        this.categoriesScrollBox.connect('notify::scroll-start', () => {
            LogMessage.log_message(
                LogMessage.get_prog_id(),
                'ApplicationsButton::_createLayout: ‷categoriesScrollBox->notify::scroll-start‴', new Error()
            );
            this.menu.passEvents = true
        });
        this.categoriesScrollBox.connect('notify::scroll-stop', () => {
            LogMessage.log_message(
                LogMessage.get_prog_id(),
                'ApplicationsButton::_createLayout: ‷categoriesScrollBox->notify::scroll-stop‴', new Error()
            );
            this.menu.passEvents = false
        });
        // */
        this.leftBox.add_child(this.categoriesScrollBox);

        this.applicationsBox = new St.BoxLayout({vertical: true});
        this.applicationsScrollBox.set_child(this.applicationsBox);
        this.categoriesBox = new St.BoxLayout({vertical: true});
        this.categoriesScrollBox.set_child(this.categoriesBox);

        this.mainBox.add_child(this.leftBox);
        this.mainBox.add_child(this.applicationsScrollBox);
        section.actor.add_child(this.mainBox);
    }

    _display() {
        this._applicationsButtons.clear();
        this.mainBox.hide();

        // Load categories
        this.applicationsByCategory = {};
        this.applicationsByCategory['Miscellaneous'] = [];
        const settingsAndStuffCategoryMenuItem = new CategoryMenuItem(this, null);
        let categoryMenuItem = null;
        let text             = null;
        let actions          = null;
        for(let x = 0; x < this.cmds.length; x++){
            switch (this.cmds[x].type) {
                case "command":
                case "desktop":
                case "settings":
                case "separator":
                    this._loadCategory('Miscellaneous', this, [ this.cmds[x] ]);
                    break;
                case "submenu":
                    text = this.cmds[x].text;
                    actions = this.cmds[x].actions;
                    this.applicationsByCategory[text] = [];
                    this._loadCategory(text, this, actions);
                    if (this.applicationsByCategory[text].length > 0) {
                        categoryMenuItem = new CategoryMenuItem(this, this.cmds[x]);
                        this.categoriesBox.add_child(categoryMenuItem);
                    }
                    break;
                case "optsubmenu":
                    text = this.cmds[x].text;
                    actions = this.cmds[x].actions;
                    this.applicationsByCategory[text] = [];
                    this._display_optsubmenu(text, actions)
                    if (this.applicationsByCategory[text].length > 0) {
                        categoryMenuItem = new CategoryMenuItem(this, this.cmds[x]);
                        this.categoriesBox.add_child(categoryMenuItem);
                    }
                    break;
            } // switch (this.cmds[x].type) //
        } // for(let x = 0; x < this.cmds.length; x++) //

        if(this.applicationsByCategory['Miscellaneous'].filter( (elt) => { return elt.type !== 'separator' } ).length > 0){
            this.categoriesBox.add_child(settingsAndStuffCategoryMenuItem);
        }

        // Load applications
        this._displayButtons(this._listApplications(null));
    } // _display() //

    _display_optsubmenu(name, theactions){
        let actions = null;
        for(let x = 0; x < theactions.length; x++){
            switch (theactions[x].type) {
                case "command":
                case "desktop":
                case "settings":
                case "separator":
                    this._loadCategory(name, this, [ theactions[x] ]);
                    break;
                case "submenu":
                    actions = theactions[x].actions;
                    this._loadCategory(name, this, actions);
                    break;
            } // switch (theactions[x].type) //
        }
    } // _display_optsubmenu(name, theactions) //

    selectCategory(cat) {
        // empty this.applicationsBox //
        this.applicationsBox.get_children().forEach(c => {
            if (c._delegate instanceof PopupMenu.PopupSeparatorMenuItem)
                c._delegate.destroy();
            else
                this.applicationsBox.remove_child(c);
        });

        if (cat)
            this._displayButtons(this._listApplications(cat.text));
        else
            this._displayButtons(this._listApplications(null));
    }

    _displayButtons(items) {
        let top_of_apps   = true;
        let last_menuitem = null;
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let menuitem = null;
            switch (item.type) {
                case "command":
                case "desktop":
                case "settings":
                    menuitem = this._applicationsButtons.get(item);
                    break;
                case "separator":
                    menuitem = new PopupMenu.PopupSeparatorMenuItem();
                    break;
            } // switch (item.type) //
            if (!menuitem) {
                try {
                    menuitem = new ApplicationMenuItem(this, item);
                    menuitem.setDragEnabled(this._desktopTarget.hasDesktop);
                    this._applicationsButtons.set(item, menuitem);
                }
                catch(e){
                    LogMessage.log_message(
                        LogMessage.get_prog_id(),
                        'ApplicationsButton::_displayButtons:'
                        + ` Error comstucting ApplicationMenuItem ${JSON.stringify(item)}: ‷${e}‴`,
                        e
                    );
                }
            }
            if(top_of_apps && menuitem instanceof PopupMenu.PopupSeparatorMenuItem){
                continue;
            }
            if(last_menuitem instanceof PopupMenu.PopupSeparatorMenuItem && menuitem instanceof PopupMenu.PopupSeparatorMenuItem){
                continue;
            }
            last_menuitem = menuitem;
            if (!menuitem.get_parent()){
                this.applicationsBox.add_child(menuitem);
                top_of_apps = false;
            }
        } // for (let i = 0; i < items.length; i++) //
    } // _displayButtons(items) //

    _listApplications(categoryMenuId) {
        let itemlist;

        if (categoryMenuId) {
            itemlist = this.applicationsByCategory[categoryMenuId];
        } else {
            itemlist = this.applicationsByCategory['Miscellaneous'];
        }

        return itemlist;
    }
} // export class ApplicationsButton extends PanelMenu.Button //
