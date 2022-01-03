#!/bin/bash

sh compile.sh
mkdir -p ~/.local/share/gnome-shell/extensions/hplip-menu@grizzlysmit.smit.id.au
cp -R * -t ~/.local/share/gnome-shell/extensions/hplip-menu@grizzlysmit.smit.id.au/
