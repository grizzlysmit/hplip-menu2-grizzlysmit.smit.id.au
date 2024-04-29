// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

//import Atk from 'gi://Atk';
import Clutter from 'gi://Clutter';
//import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
//import Graphene from 'gi://Graphene';
//import Shell from 'gi://Shell';
import St from 'gi://St';
//import * as Signals from '../misc/signals.js';

//import * as BoxPointer from './boxpointer.js';
//import * as Main from './main.js';
//import * as Main from 'resource:///org/gnome/shell/ui/main.js';
//import * as Params from '../misc/params.js';
import Gtk from 'gi://Gtk';

//import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

/**
 * arrowIcon
 *
 * @param {St.Side} side - Side to which the arrow points.
 * @returns {St.Icon} a new arrow icon
 */
/*
export function arrowIcon(side) {
    let iconName;
    switch (side) {
        case St.Side.TOP:
            iconName = 'pan-up-symbolic';
            break;
        case St.Side.RIGHT:
            iconName = 'pan-end-symbolic';
            break;
        case St.Side.BOTTOM:
            iconName = 'pan-down-symbolic';
            break;
        case St.Side.LEFT:
            iconName = 'pan-start-symbolic';
            break;
    }

    const arrow = new St.Icon({
        style_class: 'popup-menu-arrow',
        icon_name: iconName,
        accessible_role: Atk.Role.ARROW,
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
    });

    return arrow;
} // export function arrowIcon(side) //
// */

export const OverMenu = GObject.registerClass(
    class OverMenu extends Gtk.Popover {
        contrutor() {
            this.vbox = Gtk.Box({ spacing: 1, orientation: Gtk.Orientation.VERTICAL });
            this.vbox.set_border_width(5);
        }
        
        addMenuItem(menu_item) {
            this.vbox.pack_start(menu_item, true, true, 5);
        }
    }
);

export const OverButton = GObject.registerClass(
    class OverButton extends Gtk.MenuButton {
        contrutor(title) {
            this.set_label(title);
            this.menu = new OverMenu();
            this.set_popover(this.menu);
        }
    }
);

export const PopupOverMenuButtonItem = GObject.registerClass(
class PopupOverMenuButtonItem extends PopupMenu.PopupBaseMenuItem {
    _init(text, params) {
        super._init(params);

        this.label = new St.Label({
            text,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.button = new OverButton(text);
        this.button.set_child(this.label);
        this.add_child(this.button);
        this.label_actor = this.button;
    }
});

export const PopupOverMenuItem = GObject.registerClass(
class PopupOverMenuItem extends Gtk.Button {
    constructor(text, icon_name) {
        super();

        this.set_label(text ?? '');
        if(icon_name !== null) this.set_icon_name(icon_name);
    }
});

/*
export const PopupOverSubMenuItem = GObject.registerClass(
class PopupOverSubMenuItem extends Gtk.Button {
    constructor(text, wantIcon) {
        super();

        this.set_label(text ?? '');
        this.set_icon_name("");
        this.button_top = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            vexpand: true,
            hexpand: true,
        });
        this.add_style_class_name('popup-over-submenu-menu-item');

        if (wantIcon) {
            this.icon = new St.Icon({style_class: 'popup-menu-icon'});
            this.button_top.prepend(this.icon);
        }

        this.label = new St.Label({
            text,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.button_top.append(this.label);
        this.label_actor = this.label;

        let expander = new St.Bin({
            style_class: 'popup-menu-item-expander',
            x_expand: true,
        });
        this.button_top.append(expander);
        this._triangle = arrowIcon(St.Side.RIGHT);

        this._triangle.pivot_point = new Graphene.Point({x: 0.5, y: 0.6});

        this._triangleBin = new St.Widget({
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._triangleBin.add_child(this._triangle);

        this.button_top.append(this._triangleBin);
        this.set_child(this.button_top);
        this.add_accessible_state(Atk.StateType.EXPANDABLE);

        this.menu = new PopupSubMenu(this, this._triangle);
        this.connect("clicked", this.internal_callback.bind(this));
        this.menu.connect('open-state-changed', this._subMenuOpenStateChanged.bind(this));
        this.connect('destroy', () => this.menu.destroy());
    }

    internal_callback() {
    }

});
// */

export const PopupOverSeparatorMenuItem = GObject.registerClass(
class PopupOverSeparatorMenuItem extends Gtk.Box {
    constructor() {
        super({
            orientation: Gtk.Orientation.HORIZONTAL,
            vexpand: true,
            hexpand: true,
        });

        this._separator = new St.Widget({
            style_class: 'popup-separator-menu-item-separator',
            x_expand: true,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.prepend(this._separator);
    }

    _syncVisibility() {
        this.label.visible = this.label.text !== '';
    }
});
