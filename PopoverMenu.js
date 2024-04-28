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
//import * as Params from '../misc/params.js';
//import Gtk from 'gi://Gtk';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export const PopupOverMenuItem = GObject.registerClass(
class PopupOverMenuItem extends PopupMenu.PopupBaseMenuItem {
    _init(text, params) {
        super._init(params);

        this.label = new St.Label({
            text,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.button = new PanelMenu.Button(this.label.length, text);
        this.button.add_child(this.label);
        this.add_child(this.button);
        this.label_actor = this.button;
    }
});

