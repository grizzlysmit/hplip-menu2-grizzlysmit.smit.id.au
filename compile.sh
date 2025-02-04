#!/bin/bash

glib-compile-schemas schemas

DIR="po"
SUFFIX="po"

xgettext --from-code='utf-8' -k_ -kN_ -o $DIR/hplip-menu2.pot prefs.js extension.js gzzDialog.js CompactMenu.js

for file in "$DIR"/*.$SUFFIX
do 
	lingua=${file%.*}
	lingua=${lingua#*/}
	msgfmt $file
	mkdir locale/$lingua/LC_MESSAGES -p
	mv messages.mo locale/$lingua/LC_MESSAGES/hplip-menu2.mo
done
