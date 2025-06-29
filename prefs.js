// SPDX-FileCopyrightText: 2023 Francis Grizzly Smit <grizzly@smit.id.au>
//
// SPDX-License-Identifier: GPL-2.0-or-later

/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

/*eslint no-undef: "error"*/

import Adw from 'gi://Adw';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import Gtk from 'gi://Gtk';
//import Gio from 'gi://Gio';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gdk from 'gi://Gdk';

import * as Config from 'resource:///org/gnome/Shell/Extensions/js/misc/config.js';
import * as LogMessage from './log_message.js';

class AboutPage extends Adw.PreferencesPage {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, metadata){
        super({
            title: _('About'),
            icon_name: 'help-about-symbolic',
            name: 'AboutPage',
        });
        this._caller = caller;
        
        const PROJECT_TITLE = _('Alternate Menu for Hplip2');
        const PROJECT_DESCRIPTION = _('Some usefule menus, plus the original printer stuff, espcially the hp-toolbox entrypoint to hplip');

        // Project Logo, title, description-------------------------------------
        const projectHeaderGroup = new Adw.PreferencesGroup();
        const projectHeaderBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            hexpand: false,
            vexpand: false,
        });

        const projectTitleLabel = new Gtk.Label({
            label: _(PROJECT_TITLE),
            css_classes: ['title-1'],
            vexpand: true,
            valign: Gtk.Align.FILL,
        });

        const projectDescriptionLabel = new Gtk.Label({
            label: _(PROJECT_DESCRIPTION),
            hexpand: false,
            vexpand: false,
        });
        projectHeaderBox.append(projectTitleLabel);
        projectHeaderBox.append(projectDescriptionLabel);
        projectHeaderGroup.add(projectHeaderBox);

        this.add(projectHeaderGroup);
        // -----------------------------------------------------------------------

        // Extension/OS Info and Links Group------------------------------------------------
        const infoGroup = new Adw.PreferencesGroup();

        const projectVersionRow = new Adw.ActionRow({
            title: _('Hplip-menu2 Version'),
        });
        projectVersionRow.add_suffix(new Gtk.Label({
            label: metadata.version.toString(),
            css_classes: ['dim-label'],
        }));
        infoGroup.add(projectVersionRow);

        if (metadata.commit) {
            const commitRow = new Adw.ActionRow({
                title: _('Git Commit'),
            });
            commitRow.add_suffix(new Gtk.Label({
                label: metadata.commit.toString(),
                css_classes: ['dim-label'],
            }));
            infoGroup.add(commitRow);
        }

        const gnomeVersionRow = new Adw.ActionRow({
            title: _('GNOME Version'),
        });
        gnomeVersionRow.add_suffix(new Gtk.Label({
            label: Config.PACKAGE_VERSION.toString(),
            css_classes: ['dim-label'],
        }));
        infoGroup.add(gnomeVersionRow);

        const osRow = new Adw.ActionRow({
            title: _('OS Name'),
        });

        const name = GLib.get_os_info('NAME');
        const prettyName = GLib.get_os_info('PRETTY_NAME');

        osRow.add_suffix(new Gtk.Label({
            label: prettyName ? prettyName : name,
            css_classes: ['dim-label'],
        }));
        infoGroup.add(osRow);

        const sessionTypeRow = new Adw.ActionRow({
            title: _('Windowing System'),
        });
        sessionTypeRow.add_suffix(new Gtk.Label({
            label: GLib.getenv('XDG_SESSION_TYPE') === 'wayland' ? 'Wayland' : 'X11',
            css_classes: ['dim-label'],
        }));
        infoGroup.add(sessionTypeRow);

        const githubRow = this._createLinkRow(_('Hplip-menu2 Github'), metadata.url);
        infoGroup.add(githubRow);

        const closeRow = this._close_row();
        infoGroup.add(closeRow);

        this.add(infoGroup);
    }

    _createLinkRow(title, uri) {
        const image = new Gtk.Image({
            icon_name: 'adw-external-link-symbolic',
            valign: Gtk.Align.CENTER,
        });
        const linkRow = new Adw.ActionRow({
            title: _(title),
            activatable: true,
        });
        linkRow.connect('activated', () => {
            Gtk.show_uri(this.get_root(), uri, Gdk.CURRENT_TIME);
        });
        linkRow.add_suffix(image);

        return linkRow;
    }
    
    _close_row(){
        const title = "";
        const row = new Adw.ActionRow({ title });
        row.set_subtitle("");
        const close_button = new Gtk.Button({
                                                        label: _("Exit Settings"),
                                                         css_classes: ["suggested-action"],
                                                         valign: Gtk.Align.CENTER,
                                                    });
        row.add_suffix(close_button);
        row.activatable_widget = close_button;
        close_button.connect("clicked", () => { this._caller._close_request(this._caller._window); });

        return row;
    } // _close_row() //

} // class AboutPage extends Adw.PreferencesPage //

Gio._promisify(Gtk.FileDialog.prototype, "open", "open_finish");
export default class HpExtensionPreferences extends ExtensionPreferences {

    log_message(id, text, e){
        LogMessage.log_message(id, text, e);
    }

    _show_logs_box(){
        // Show logs for debugging //
        const show_logs_switch_row = new Adw.SwitchRow({
            title: _("Show logs for debugging."),
            subtitle: _("Turn on the logging for this plugin if you don't know what this is the leave it off."),
            active: this._window._settings.get_boolean('show-logs'), 
        });
        this.show_logs_switch = show_logs_switch_row.activatable_widget;
        this.show_logs_switch.connect("state-set", (_sw, state) => {
            this._window._settings.set_boolean("show-logs", state);
            LogMessage.set_show_logs(this._window._settings.get_boolean('show-logs'));
        });
        this._show_logs_switch_row  = show_logs_switch_row;
        return show_logs_switch_row;
    } // _show_logs_box() //

    _close_request(_win){
        this._window.close();
        return false;
    } // _close_request(_win) //

    _area_token_box(){
        const title = _("Area in the panel");
        const panelPositions = new Gtk.StringList();
        this.area = this._window._settings.get_string("area");
        let _areas = ["left", "center", "right"];
        let areas = [_("Left"), _("Center"), _("Right")];
        let cur = 0;
        for (let i = 0; i < areas.length; i++){
            let a = _areas[i];
            if(this.area === a) cur = i;
            panelPositions.append(areas[i]);
        }
        const row = new Adw.ComboRow({
            title,
            model: panelPositions,
            selected: cur,
            use_subtitle: false, 
        });
        row.connect('notify::selected', this.area_dropdown_clicked.bind(this));
        return row;
    } // _area_token_box() //

    _icon_token_box(){
        const panelicons = new Gtk.StringList();
        const title = _("Icon Name");
        let icons = ["printer", "/usr/share/hplip/data/images/16x16/hp_logo.png"];
        this.icon_name = this._window._settings.get_string("icon-name");
        let cur = 0;
        for (let i = 0; i < icons.length; i++){
            if(this.icon_name === icons[i]) cur = i;
            panelicons.append(icons[i]);
        }
        const row = new Adw.ComboRow({
            title,
            model: panelicons,
            selected: cur,
            use_subtitle: false,
        });
        row.connect('notify::selected', this.icon_dropdown_clicked.bind(this));
        const useCustomIcon = this._window._settings.get_boolean('use-custom-icon');
        row.set_sensitive(!useCustomIcon);
        row.set_selectable(!useCustomIcon);
        this.log_message(
            LogMessage.get_prog_id(),
            `_icon_token_box::changed::use-custom-icon: !useCustomIcon == ${!useCustomIcon}`, new Error()
        );
        return row;
    } // _icon_token_box() //

    _custom_icon_row(){
        // Custom Icon //

        const customIconRow = new Adw.ExpanderRow({
            title: _('Use Custom Icon'),
            show_enable_switch: true,
            enable_expansion: this._window._settings.get_boolean('use-custom-icon'),
        });

        customIconRow.connect('notify::enable-expansion', () => {
            this._window._settings.set_boolean('use-custom-icon', customIconRow.enable_expansion);
            this.log_message(
                LogMessage.get_prog_id(),
                `_custom_icon_row::notify::enable-expansion: customIconRow.enable_expansion == ${customIconRow.enable_expansion}`,
                new Error()
            );
        });

        this._window._settings.connect('changed::use-custom-icon', () => {
            const useCustomIcon = this._window._settings.get_boolean('use-custom-icon');
            this.icon_token_box.set_sensitive(!useCustomIcon);
            this.icon_token_box.set_selectable(!useCustomIcon);
            if(!useCustomIcon){
                const ics = ['printer', '/usr/share/hplip/data/images/16x16/hp_logo.png', ];
                const pos = this.icon_token_box.get_selected();
                const icon_name = ((pos === Gtk.INVALID_LIST_POSITION) ? 'printer' : ics[pos]);
                this.log_message(
                    LogMessage.get_prog_id(),
                    `_custom_icon_row::changed::use-custom-icon: icon_name == ${icon_name}`, new Error()
                );
                if(this.customIconPreview){
                    this.customIconPreview.set_from_icon_name(icon_name);
                }
                this._window._settings.set_string("icon-name", icon_name);
            }
            customIconRow.set_enable_expansion(useCustomIcon)
            this.log_message(
                LogMessage.get_prog_id(),
                `_custom_icon_row::changed::use-custom-icon: useCustomIcon == ${useCustomIcon}`, new Error()
            );
        });

        const customIconSelectionRow = new Adw.ActionRow({
            title: _('Selected Icon'),
        });

        const customIconButton = new Gtk.Button({
            icon_name: 'document-open-symbolic',
            valign: Gtk.Align.CENTER,
        });

        this.log_message(
            LogMessage.get_prog_id(), `_custom_icon_row::constructor: customIconButton == ${customIconButton}`, new Error()
        );

        this.customIconPreview = new Gtk.Image({
            icon_name: "start-here-symbolic",
            icon_size: Gtk.IconSize.LARGE,
        });

        this.log_message(
            LogMessage.get_prog_id(),
            `_custom_icon_row::constructor: this.customIconPreview == ${this.customIconPreview}`, new Error()
        );

        if(this._window._settings.get_string('icon-name')){
            const path = this._window._settings.get_string('icon-name');
            const fileExists = GLib.file_test(path, GLib.FileTest.IS_REGULAR);
            if(fileExists){
                this.customIconPreview.set_from_file(path);
            }else{
                this.customIconPreview.set_from_icon_name(path);
            }

            this.log_message(LogMessage.get_prog_id(), `_custom_icon_row::constructor: path == ${path}`, new Error());
        }

        customIconButton.connect('clicked', async () => {
            try {
                const filter = new Gtk.FileFilter({
                    name: "Images",
                });
                this.log_message(
                    LogMessage.get_prog_id(), `_custom_icon_row::clicked: filter == ${filter}`, new Error()
                );

                filter.add_pixbuf_formats();
                this.log_message(
                    LogMessage.get_prog_id(), `_custom_icon_row::clicked: filter == ${filter}`, new Error()
                );

                const fileDialog = new Gtk.FileDialog({
                    title: _('Select a Custom Icon'),
                    modal: true,
                    default_filter: filter
                });
                this.log_message(
                    LogMessage.get_prog_id(), `_custom_icon_row::clicked: fileDialog == ${fileDialog}`, new Error());

                let file   = null;
                try {
                    file = await fileDialog.open(customIconButton.get_root(), null);
                } catch(e){
                    this.log_message(LogMessage.get_prog_id(), `silly promise error: ${e}`, e);
                }
                this.log_message(LogMessage.get_prog_id(), `_custom_icon_row::clicked: file == ${file}`, new Error());
                if (file) {
                    const filename = file.get_path();
                    this._window._settings.set_string("icon-name", filename);
                    this.customIconPreview.set_from_file(filename);
                    this.log_message(
                        LogMessage.get_prog_id(), `_custom_icon_row::clicked: filename == ${filename}`, new Error());
                }
            } catch (error) {
                this.log_message( LogMessage.get_prog_id(), `_custom_icon_row::clicked: file == ${error}`, error);
                console.error('hplip_menu2::Error selecting custom icon:', error.message);
            }
        });

        customIconSelectionRow.add_suffix(this.customIconPreview);
        customIconSelectionRow.add_suffix(customIconButton);
        customIconRow.add_row(customIconSelectionRow);

        this._customIconRow = customIconRow;

        return customIconRow;
    } // _custom_icon_row() //

    area_dropdown_clicked(combo){
        switch(combo.selected){
            case 0:
                this.area = "left";
                break;
            case 1:
                this.area = "center";
                break;
            case 2:
                this.area = "right";
                break;
        }
        this._window._settings.set_string("area", this.area);
    } // area_dropdown_clicked(combo) //

    icon_dropdown_clicked(combo){
        switch(combo.selected){
            case 0:
                this.icon_name = "printer";
                break;
            case 1:
                this.icon_name = "/usr/share/hplip/data/images/16x16/hp_logo.png";
                break;
        }
        this._window._settings.set_string("icon-name", this.icon_name);
    } // icon_dropdown_clicked(combo) //

    _position_box(){
        const title = _("Position");
        const row = new Adw.ActionRow({ title });
        row.set_subtitle(_("Position in the area of the panel."));
        const slider = new Gtk.Scale({
            digits: 0,
            adjustment: new Gtk.Adjustment({ lower: 0, upper: 25, stepIncrement: 1 }),
            value_pos: Gtk.PositionType.RIGHT,
            hexpand: true,
            halign: Gtk.Align.END
        });
        slider.set_draw_value(true);
        slider.set_value(this._window._settings.get_int("position"));
        slider.connect('value-changed', (_sw) => { this._window._settings.set_int("position", slider.get_value()); });
        slider.set_size_request(400, 15);
        row.add_suffix(slider);
        row.activatable_widget = slider;
        this.position_input = slider;
        return row;
    } // _position_box() //

    _compact_row(){
        const title = _("Compact");
        const row = new Adw.SwitchRow({
            title,
            active: this._window._settings.get_boolean("compact"),
        });
        row.set_subtitle(_("Compact Menu."));
        this.compact_switch = row.activatable_widget; // get the internal Gtk.Switch //
        this.compact_switch.connect("state-set", (_sw, state) => {
            this._window._settings.set_boolean("compact", state);
        });
        return row;
    } // _compact_row() //

    _close_row(){
        const title = "";
        const row = new Adw.ActionRow({ title });
        row.set_subtitle("");
        this.close_button = new Gtk.Button({
                                                        label: _("Exit Settings"),
                                                         css_classes: ["suggested-action"],
                                                         valign: Gtk.Align.CENTER,
                                                    });
        row.add_suffix(this.close_button);
        row.activatable_widget = this.close_button;
        this.close_button.connect("clicked", () => { this._close_request(this._window); });

        return row;
    } // _close_row() //

    fillPreferencesWindow(window) {
        this.area                   = "left";
        this.icon_name              = "printer";
        this.area_token_box         = null;
        this.icon_token_box         = null;
        this.position_input         = null;
        this.compact_switch         = null;
        this.compact_row            = null;
        this.show_logs_box          = null;
        this._show_logs_switch_row  = null;
        this._customIconRow         = null;
        this._custom_icon_row_      = null;
        this.customIconPreview      = null;
        this._window                = window;

        window._settings = this.getSettings();
        LogMessage.set_prog_id('hplip-menu2');
        LogMessage.set_show_logs(this._window._settings.get_boolean('show-logs'));
        /*
        if(window._settings.get_boolean("first-time")){ // grab legacy _settings //
            try {
                window.settings_data = JSON.parse(window._settings.get_string("_settings-json"));
                window._settings.set_string("area", window.settings_data.area);
                window._settings.set_string("icon-name", window.settings_data.icon_name);
                window._settings.set_int("position", window.settings_data.position);
            }catch(e){
                console.log(`possible error: ${e}`);
            }
            window._settings.set_boolean("first-time", false); // old _settings obtained or not we don't try again //
        }
        // */
        this.pages             = ['settings', 'about', 'creditsThis', 'creditsOther', ];
        this.area              = this._window._settings.get_string("area");
        this.icon_name         = this._window._settings.get_string("icon-name");
        this.position          = this._window._settings.get_int("position");
        this.properties_width  = this._window._settings.get_int("properties-width");
        this.properties_height = this._window._settings.get_int("properties-height");
        this.compact           = this._window._settings.get_boolean("compact");

        this.settingsPage = Adw.PreferencesPage.new();
        this.settingsPage.set_title(_("Settings"));
        this.settingsPage.set_name("hplips_menu2_page1");
        this.settingsPage.set_icon_name("preferences-system-symbolic");

        // group1
        const group1 = Adw.PreferencesGroup.new();
        group1.set_title(_("Hplip menu2 settings"));
        group1.set_name("HpLip_menu2_global");
        this.settingsPage.add(group1);
        this.area_token_box = this._area_token_box();
        group1.add(this.area_token_box);

        this.icon_token_box = this._icon_token_box();
        group1.add(this.icon_token_box);
        this._custom_icon_row_ = this._custom_icon_row();
        group1.add(this._custom_icon_row_);
        this.position_box = this._position_box();
        group1.add(this.position_box);
        this.compact_row = this._compact_row();
        group1.add(this.compact_row);
        this.show_logs_box = this._show_logs_box();
        group1.add(this.show_logs_box);
        const close_row = this._close_row();
        group1.add(close_row);
        const hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, vexpand: true, hexpand: true, });
        const bottom_spacer = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });
        hbox.prepend(bottom_spacer);
        group1.add(hbox);

        this.aboutPage = new AboutPage(this, this.metadata);

        /*****************************************
         *                                       *
         *                                       *
         *                                       *
         *           the credits page.           *
         *                                       *
         *                                       *
         *                                       *
         *                                       *
         ******************************************/
                // creditsPage
        this.creditsPage = Adw.PreferencesPage.new();
        this.creditsPage.set_title(_("Credits"));
        this.creditsPage.set_name("hplip_menu2_page2");
        this.creditsPage.set_icon_name("text-x-copying");

        // group2
        const group2 = Adw.PreferencesGroup.new();
        group2.set_title(_("Acknowledgements"));
        group2.set_name("Hplip_menu2_About");

        // The inner set of tabbed pages (or Notebook) //
        this.notebook = new Gtk.Notebook();
        /**************************************
        *                                     *
        *  The credits for this plugin itself *
        *                                     *
        ***************************************/
        this.vboxThisPlugin    = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: false, hexpand: true });

        let title = null;
        title = _("Copyright") + ": ©2022, ©2023, ©2024 &amp; ©2025 Francis Grizzly Smit:";
        const row0 = new Adw.ActionRow({ title });
        const licence = new Gtk.LinkButton({uri: "https://www.gnu.org/licenses/gpl-2.0.en.html", label: "Licence GPL v2+" });
        licence.set_use_underline(true);
        licence.set_halign(Gtk.Align.START);
        row0.add_suffix(licence);
        row0.activatable_widget = licence;
        this.vboxThisPlugin.prepend(row0);

        title = "url:";
        const row1 = new Adw.ActionRow({ title });
        const uri0 = "https://github.com/grizzlysmit/hplip-menu2-grizzlysmit.smit.id.au#readme";
        const link0 = new Gtk.LinkButton({uri: uri0, label: "https://github.com/grizzlysmit/hplip-menu2-grizzlysmit.smit.id.au#readme" });
        link0.set_use_underline(true);
        link0.set_halign(Gtk.Align.START);
        row1.add_suffix(link0);
        row1.activatable_widget = link0;
        this.vboxThisPlugin.append(row1);

        title = _("Author") + ": Francis Grizzly Smit©";
        const row2 = new Adw.ActionRow({ title });
        const link1 = new Gtk.LinkButton({uri: "https://github.com/grizzlysmit", label: "https://github.com/grizzlysmit" });
        link1.set_use_underline(true);
        link1.set_halign(Gtk.Align.START);
        row2.add_suffix(link1);
        row2.activatable_widget = link1;
        this.vboxThisPlugin.append(row2);

        title = _("Dutch localisation") + ": Vistaus (Heimen Stoffels)";
        const row3 = new Adw.ActionRow({ title });
        const link2 = new Gtk.LinkButton({uri: "https://github.com/Vistaus", label: "https://github.com/Vistaus" });
        link2.set_use_underline(true);
        link2.set_halign(Gtk.Align.START);
        row3.add_suffix(link2);
        row3.activatable_widget = link2;
        this.vboxThisPlugin.append(row3);
        let close_row_credits0 = this._close_row();
        this.vboxThisPlugin.append(close_row_credits0);
        this.notebook.append_page(this.vboxThisPlugin, new Gtk.Label({ label: _("This plugin"), }));

        /*********************************************************
         *                                                       *
         *                                                       *
         *      The compact mode credits as I took much code     *
         *      from "Apps Menu" by fmuellner and others.        *
         *                                                       *
         *                                                       *
         *********************************************************/
        this.vboxOther    = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: false, hexpand: true });

        title = _("Compact mode code taken from") + ": Apps Menu by fmuellner " + _("and others") + ":";
        const row4 = new Adw.ActionRow({ title });
        this.vboxOther.prepend(row4);
        title = "";
        const row5 = new Adw.ActionRow({ title });
        const uri3 = "https://extensions.gnome.org/extension/6/applications-menu/";
        const link3 = new Gtk.LinkButton({uri: uri3, label: "https://extensions.gnome.org/extension/6/applications-menu/" });
        link3.set_use_underline(true);
        link3.set_halign(Gtk.Align.START);
        row5.add_suffix(link3);
        row5.activatable_widget = link3;
        this.vboxOther.append(row5);

        title = "©2013 fmuellner";
        const row6 = new Adw.ActionRow({ title });
        const uri4 = "https://extensions.gnome.org/accounts/profile/fmuellner";
        const link4 = new Gtk.LinkButton({uri: uri4, label: "https://extensions.gnome.org/accounts/profile/fmuellner" });
        link4.set_use_underline(true);
        link4.set_halign(Gtk.Align.START);
        row6.add_suffix(link4);
        row6.activatable_widget = link4;
        this.vboxOther.append(row6);

        title = "©2013 Debarshi Ray";
        const row7 = new Adw.ActionRow({ title });
        const link5 = new Gtk.LinkButton({uri: "https://wiki.gnome.org/DebarshiRay", label: "https://wiki.gnome.org/DebarshiRay" });
        link5.set_use_underline(true);
        link5.set_halign(Gtk.Align.START);
        row7.add_suffix(link5);
        row7.activatable_widget = link5;
        this.vboxOther.append(row7);

        title = "©2011 Giovanni Campagna";
        const row8 = new Adw.ActionRow({ title });
        this.vboxOther.append(row8);
        const uri6 = "https://wiki.gnome.org/GiovanniCampagna?highlight=%28%5CbCategoryHomepage%5Cb%29";
        const _link6 = new Gtk.LinkButton({uri: uri6, label: "→" });
        _link6.set_use_underline(false);
        _link6.set_halign(Gtk.Align.START);
        row8.add_suffix(_link6);
        row8.activatable_widget = _link6;
        title = "";
        const row9 = new Adw.ActionRow({ title });
        const link6 = new Gtk.LinkButton({uri: uri6, label: "https://wiki.gnome.org/GiovanniCampagna?highlight=%28%5CbCategoryHomepage%5Cb%29" });
        link6.set_use_underline(true);
        link6.set_halign(Gtk.Align.START);
        row9.add_suffix(link6);
        row9.activatable_widget = link6;
        this.vboxOther.append(row9);

        title = "©Vamsi Krishna Brahmajosyula";
        const row10 = new Adw.ActionRow({ title });
        const uri7  = "https://github.com/vamsikrishna-brahmajosyula";
        const link7 = new Gtk.LinkButton({uri: uri7, label: "https://github.com/vamsikrishna-brahmajosyula" });
        link7.set_use_underline(true);
        link7.set_halign(Gtk.Align.START);
        row10.add_suffix(link7);
        row10.activatable_widget = link7;
        this.vboxOther.append(row10);
        let close_row_credits1 = this._close_row();
        this.vboxOther.append(close_row_credits1);
        this.notebook.append_page(this.vboxOther, new Gtk.Label({ label: _("Code used from other plugins"), } ));
        group2.add(this.notebook);
        const hbox1 = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, vexpand: true, hexpand: true, });
        const bottom_spacer1 = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });
        hbox1.prepend(bottom_spacer1);
        group2.add(hbox1);

        this.creditsPage.add(group2);
        window.connect("close-request", (_win) => {
            const width  = window.default_width;
            const height = window.default_height;
            if(width !== this.properties_width && height !== this.properties_height){
                this._window._settings.set_int("properties-width",  width);
                this._window._settings.set_int("properties-height", height);
            } // if(width !== this.properties_width && height !== this.properties_height) //
            this.area                   = null;
            this.icon_name              = null;
            this.area_token_box         = null;
            this.icon_token_box         = null;
            this.position_input         = null;
            this.compact_switch         = null;
            this.show_logs_box          = null;
            this._show_logs_switch_row  = null;
            this.compact_row            = null;
            this._customIconRow         = null;
            this._custom_icon_row_      = null;
            this.customIconPreview      = null;
            this._window                = null;
            this.area_token_input       = null;
            this.settings_data          = null;
            this.settingsPage           = null;
            this.aboutPage              = null;
            this.notebook               = null;
            this.creditsPage            = null;
            window.destroy();
        });
        window.add(this.settingsPage);
        window.add(this.aboutPage);
        window.add(this.creditsPage);
        this.settingsID_page       = this._window._settings.connect("changed::page", this.onPageChanged.bind(this));
        window.set_default_size(this.properties_width, this.properties_height);
        if(this._window._settings.get_boolean('goto-page')){
            this._window._settings.set_boolean('goto-page', false);
            const page_indx = this._window._settings.get_enum('page');
            const page_     = this.pages[page_indx];
            LogMessage.log_message(LogMessage.get_prog_id(),
                `HpExtensionPreferences::fillPreferencesWindow: page_indx == ${page_indx}\npage_ == ${page_}`, new Error()
            );
            switch(page_){
                case 'settings':
                    this.page = this.settingsPage;
                    this._window.set_visible_page(this.page);
                    break;
                case 'about':
                    this.page = this.aboutPage;
                    this._window.set_visible_page(this.page);
                    break;
                case 'creditsThis':
                    LogMessage.log_message(LogMessage.get_prog_id(),
                        'HpExtensionPreferences::fillPreferencesWindow: creditsThis', new Error()
                    );
                    this.page = this.creditsPage;
                    this._window.set_visible_page(this.page);
                    //this.vboxThisPlugin.set_visible(true);
                    this.notebook.set_current_page(0);
                    break;
                case 'creditsOther':
                    LogMessage.log_message(LogMessage.get_prog_id(),
                        'HpExtensionPreferences::fillPreferencesWindow: creditsOther', new Error()
                    );
                    this.page = this.creditsPage;
                    this._window.set_visible_page(this.page);
                    //this.vboxOther.set_visible(true);
                    this.notebook.set_current_page(1);
                    break;
            }
        } // if(this._window._settings.get_boolean('goto-page')) //
    } // fillPreferencesWindow(window) //

    onPageChanged(){
        if(this._window._settings.get_boolean('goto-page')){
            this._window._settings.set_boolean('goto-page', false);
            const page_indx = this._window._settings.get_enum('page');
            const page_     = this.pages[page_indx];
            LogMessage.log_message(LogMessage.get_prog_id(),
                `HpExtensionPreferences::fillPreferencesWindow: page_indx == ${page_indx}\npage_ == ${page_}`, new Error()
            );
            switch(page_){
                case 'settings':
                    this.page = this.settingsPage;
                    this._window.set_visible_page(this.page);
                    break;
                case 'about':
                    this.page = this.aboutPage;
                    this._window.set_visible_page(this.page);
                    break;
                case 'creditsThis':
                    LogMessage.log_message(LogMessage.get_prog_id(),
                        'HpExtensionPreferences::fillPreferencesWindow: creditsThis', new Error()
                    );
                    this.page = this.creditsPage;
                    this._window.set_visible_page(this.page);
                    this.notebook.set_current_page(0);
                    break;
                case 'creditsOther':
                    LogMessage.log_message(LogMessage.get_prog_id(),
                        'HpExtensionPreferences::fillPreferencesWindow: creditsOther', new Error()
                    );
                    this.page = this.creditsPage;
                    this._window.set_visible_page(this.page);
                    this.notebook.set_current_page(1);
                    break;
            }
        } // if(this._window._settings.get_boolean('goto-page')) //
    } // onPageChanged() //

} // export default class HpExtensionPreferences extends ExtensionPreferences //

