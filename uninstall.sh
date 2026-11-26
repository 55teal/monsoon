#!/bin/sh
[ "$(id -u)" = 0 ] || { echo "Run with: sudo ./uninstall.sh"; exit 1; }
rm -rf /opt/monsoon /usr/local/bin/monsoon-session /usr/share/wayland-sessions/monsoon.desktop
echo "MONSOON removed. (Per-user data stays in ~/.config/monsoon.)"
