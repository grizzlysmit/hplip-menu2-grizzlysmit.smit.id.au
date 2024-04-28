// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

import Atk from 'gi://Atk';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Graphene from 'gi://Graphene';
import Shell from 'gi://Shell';
import St from 'gi://St';
import * as Signals from '../misc/signals.js';

import * as BoxPointer from './boxpointer.js';
import * as Main from './main.js';
import * as Params from '../misc/params.js';
import Gtk from 'gi://Gtk';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from './popupMenu.js';

export const PopoverMenuItem = GObject.registerClass(
class PopoverMenuItem extends PopupMenu.PopupBaseMenuItem {
    _init(text, params) {
        super._init(params);

        this.label = new St.Label({
            text,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(this.label);
        this.label_actor = this.label;
    }
});

export class PopoverMenu extends PopupMenu.PopupMenuBase {
    constructor(sourceActor, arrowAlignment, arrowSide) {
        super(sourceActor, 'popover-menu-content');

        this._arrowAlignment = arrowAlignment;
        this._arrowSide = arrowSide;

        this._boxPointer = new BoxPointer.BoxPointer(arrowSide);
        this.actor = this._boxPointer;
        this.actor._delegate = this;
        this.actor.style_class = 'popover-menu-boxpointer';

        this._boxPointer.bin.set_child(this.box);
        this.actor.add_style_class_name('popover-menu');

        global.focus_manager.add_group(this.actor);
        this.actor.reactive = true;

        if (this.sourceActor) {
            this.sourceActor.connectObject(
                'key-press-event', this._onKeyPress.bind(this),
                'notify::mapped', () => {
                    if (!this.sourceActor.mapped)
                        this.close();
                }, this);
        }

        this._systemModalOpenedId = 0;
        this._openedSubMenu = null;
    }

    _setOpenedSubMenu(submenu) {
        if (this._openedSubMenu)
            this._openedSubMenu.close(true);

        this._openedSubMenu = submenu;
    }

    _onKeyPress(actor, event) {
        // Disable toggling the menu by keyboard
        // when it cannot be toggled by pointer
        if (!actor.reactive)
            return Clutter.EVENT_PROPAGATE;

        let navKey;
        switch (this._boxPointer.arrowSide) {
        case St.Side.TOP:
            navKey = Clutter.KEY_Down;
            break;
        case St.Side.BOTTOM:
            navKey = Clutter.KEY_Up;
            break;
        case St.Side.LEFT:
            navKey = Clutter.KEY_Right;
            break;
        case St.Side.RIGHT:
            navKey = Clutter.KEY_Left;
            break;
        }

        let state = event.get_state();

        // if user has a modifier down (except capslock and numlock)
        // then don't handle the key press here
        state &= ~Clutter.ModifierType.LOCK_MASK;
        state &= ~Clutter.ModifierType.MOD2_MASK;
        state &= Clutter.ModifierType.MODIFIER_MASK;

        if (state)
            return Clutter.EVENT_PROPAGATE;

        let symbol = event.get_key_symbol();

        if (symbol === Clutter.KEY_space || symbol === Clutter.KEY_Return) {
            this.toggle();
            return Clutter.EVENT_STOP;
        } else if (symbol === navKey) {
            if (!this.isOpen)
                this.toggle();
            this.actor.navigate_focus(null, St.DirectionType.TAB_FORWARD, false);
            return Clutter.EVENT_STOP;
        } else {
            return Clutter.EVENT_PROPAGATE;
        }
    }

    setArrowOrigin(origin) {
        this._boxPointer.setArrowOrigin(origin);
    }

    setSourceAlignment(alignment) {
        this._boxPointer.setSourceAlignment(alignment);
    }

    open(animate) {
        if (this.isOpen)
            return;

        if (this.isEmpty())
            return;

        if (!this._systemModalOpenedId) {
            this._systemModalOpenedId =
                Main.layoutManager.connect('system-modal-opened', () => this.close());
        }

        this.isOpen = true;

        this._boxPointer.setPosition(this.sourceActor, this._arrowAlignment);
        this._boxPointer.open(animate);

        this.actor.get_parent().set_child_above_sibling(this.actor, null);

        this.emit('open-state-changed', true);
    }

    close(animate) {
        if (this._activeMenuItem)
            this._activeMenuItem.active = false;

        if (this._boxPointer.visible) {
            this._boxPointer.close(animate, () => {
                this.emit('menu-closed');
            });
        }

        if (!this.isOpen)
            return;

        this.isOpen = false;
        this.emit('open-state-changed', false);
    }

    destroy() {
        this.sourceActor?.disconnectObject(this);

        if (this._systemModalOpenedId)
            Main.layoutManager.disconnect(this._systemModalOpenedId);
        this._systemModalOpenedId = 0;

        super.destroy();
    }
}

export class PopoverSubMenu extends PopupMenu.PopupMenuBase {
    constructor(sourceActor, sourceArrow) {
        super(sourceActor);

        this._arrow = sourceArrow;

        // Since a function of a submenu might be to provide a "More.." expander
        // with long content, we make it scrollable - the scrollbar will only take
        // effect if a CSS max-height is set on the top menu.
        this.actor = new St.ScrollView({
            style_class: 'popover-sub-menu',
            vscrollbar_policy: St.PolicyType.NEVER,
            child: this.box,
        });

        this.actor._delegate = this;
        this.actor.clip_to_allocation = true;
        this.actor.connect('key-press-event', this._onKeyPressEvent.bind(this));
        this.actor.hide();
    }

    _needsScrollbar() {
        let topMenu = this._getTopMenu();
        let [, topNaturalHeight] = topMenu.actor.get_preferred_height(-1);
        let topThemeNode = topMenu.actor.get_theme_node();

        let topMaxHeight = topThemeNode.get_max_height();
        return topMaxHeight >= 0 && topNaturalHeight >= topMaxHeight;
    }

    getSensitive() {
        return this._sensitive && this.sourceActor.sensitive;
    }

    get sensitive() {
        return this.getSensitive();
    }

    open(animate) {
        if (this.isOpen)
            return;

        if (this.isEmpty())
            return;

        this.isOpen = true;
        this.emit('open-state-changed', true);

        this.actor.show();

        let needsScrollbar = this._needsScrollbar();

        // St.ScrollView always requests space horizontally for a possible vertical
        // scrollbar if in AUTOMATIC mode. Doing better would require implementation
        // of width-for-height in St.BoxLayout and St.ScrollView. This looks bad
        // when we *don't* need it, so turn off the scrollbar when that's true.
        // Dynamic changes in whether we need it aren't handled properly.
        this.actor.vscrollbar_policy =
            needsScrollbar ? St.PolicyType.AUTOMATIC : St.PolicyType.NEVER;

        if (needsScrollbar)
            this.actor.add_style_pseudo_class('scrolled');
        else
            this.actor.remove_style_pseudo_class('scrolled');

        // It looks funny if we animate with a scrollbar (at what point is
        // the scrollbar added?) so just skip that case
        if (animate && needsScrollbar)
            animate = false;

        let targetAngle = this.actor.text_direction === Clutter.TextDirection.RTL ? -90 : 90;

        const duration = animate ? 250 : 0;
        let [, naturalHeight] = this.actor.get_preferred_height(-1);
        this.actor.height = 0;
        this.actor.ease({
            height: naturalHeight,
            duration,
            mode: Clutter.AnimationMode.EASE_OUT_EXPO,
            onComplete: () => this.actor.set_height(-1),
        });
        this._arrow.ease({
            rotation_angle_z: targetAngle,
            duration,
            mode: Clutter.AnimationMode.EASE_OUT_EXPO,
        });
    }

    close(animate) {
        if (!this.isOpen)
            return;

        this.isOpen = false;
        this.emit('open-state-changed', false);

        if (this._activeMenuItem)
            this._activeMenuItem.active = false;

        if (animate && this._needsScrollbar())
            animate = false;

        const duration = animate ? 250 : 0;
        this.actor.ease({
            height: 0,
            duration,
            mode: Clutter.AnimationMode.EASE_OUT_EXPO,
            onComplete: () => {
                this.actor.hide();
                this.actor.set_height(-1);
            },
        });
        this._arrow.ease({
            rotation_angle_z: 0,
            duration,
            mode: Clutter.AnimationMode.EASE_OUT_EXPO,
        });
    }

    _onKeyPressEvent(actor, event) {
        // Move focus back to parent menu if the user types Left.

        if (this.isOpen && event.get_key_symbol() === Clutter.KEY_Left) {
            this.close(BoxPointer.PopupAnimation.FULL);
            this.sourceActor._delegate.active = true;
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }
}

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

