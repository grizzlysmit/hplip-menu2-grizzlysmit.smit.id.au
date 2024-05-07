// SPDX-FileCopyrightText: 2023 Francis Grizzly Smit <grizzly@smit.id.au>
//
// SPDX-License-Identifier: GPL-2.0-or-later

/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */


// a useful Dialog box for showing a modal Dialog //

import St from 'gi://St';
import * as Dialog from 'resource:///org/gnome/shell/ui/dialog.js';
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';
import GObject from 'gi://GObject';

export class GzzMessageDialog extends ModalDialog.ModalDialog {
    static {
        GObject.registerClass(this);
    }

    constructor(_title, _text) {
        super({ styleClass: 'extension-dialog' });

        let icon = new St.Icon({icon_name: 'dialog-information-symbolic'});
        this.contentLayout.add(icon);

        let messageLayout = new Dialog.MessageDialogContent({
            title: _title,
            description: _text,
        });
        this.contentLayout.add_child(messageLayout);
                
        this.addButton({
            label: 'OK',
            isDefault: true,
            action: () => {
                this.destroy();
            },
        });
    } // constructor(_title, _text) //

} // export class GzzMessageDialog extends ModalDialog.ModalDialog //
