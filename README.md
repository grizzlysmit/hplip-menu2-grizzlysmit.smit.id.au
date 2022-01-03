This is the "Alternate Menu for Hplip2" plugin for gnome
========================================================

## Introduction

This plugin supplies many useful menu's for gnome shell  
the most important being the Hplip stuff.

## The menu's

### The "Hp Device Manager..."

This attempts to start hp-toolbox but it must be installed so please do that, if the .desktop file cannot be found it will attempt to start it in the default shell this under fedora should make the system try to install it on ubuntu it will show you how to install it.


### The "Additional Printer Settings..." Menu


This menu does nothing on Fedora just now as `/usr/share/system-config-printer/system-config-printer.py` does not exist seems to be a Ubuntu/Debian thing.


### The "Software Update..." Menu


This works out of the box in Ubuntu, however in other distros the `update-manager.desktop` will probably be missing. If so to make it work I do something like this (this works on fedora but should work on any system with Gnome)

```
gnome-software --mode=updates
```

### The other menus

The remaining menus should work on any `gnome-shell` instalation.
