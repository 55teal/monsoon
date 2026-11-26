#!/bin/sh
# Adds MONSOON as an extra login session. Does not touch Hyprland or any existing config.
set -e
cd "$(dirname "$0")"
for c in electron cage; do command -v $c >/dev/null || { echo "Missing '$c'. Run: sudo pacman -S --needed electron cage"; exit 1; }; done
[ "$(id -u)" = 0 ] || { echo "Run with: sudo ./install.sh"; exit 1; }
rm -rf /opt/monsoon; mkdir -p /opt/monsoon
cp -r index.html main.js preload.js package.json css js assets /opt/monsoon/
install -m755 session/monsoon-session /usr/local/bin/monsoon-session
install -m644 session/monsoon.desktop /usr/share/wayland-sessions/monsoon.desktop
echo "Installed. Choose the MONSOON session at login, or run 'monsoon-session' from a TTY."
