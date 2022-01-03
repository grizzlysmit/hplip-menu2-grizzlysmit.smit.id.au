#!/bin/bash - 
#===============================================================================
#
#          FILE: compileif.sh
# 
#         USAGE: ./compileif.sh 
# 
#   DESCRIPTION: 
# 
#       OPTIONS: ---
#  REQUIREMENTS: ---
#          BUGS: ---
#         NOTES: ---
#        AUTHOR: Francis Grizzly Smit (FGJS), grizzlysmit@smit.id.au
#  ORGANIZATION: Me
#       CREATED: 2017-12-04 21:04:19
#      REVISION:  ---
#===============================================================================

set -o nounset                              # Treat unset variables as an error
cd "$HOME/.local/share/gnome-shell/extensions/hplip-menu2@grizzlysmit.smit.id.au/"
if [ ! -e "schemas/gschemas.compiled" ]
then
    ./compile.sh
fi

