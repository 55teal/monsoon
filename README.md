# MONSOON — console UI prototype 0.1

Plain HTML/CSS/JS. No build step, no backend, no dependencies, nothing installed on your system.

## Run it

```bash
cd monsoon
chromium --ozone-platform=wayland --app=file://$PWD/index.html   # or just open index.html in any browser
```
Optional kiosk look under Hyprland (add to `hyprland.conf`; match the window class your browser reports):
```
windowrulev2 = fullscreen, class:^(chromium)$
```
If a browser blocks `file://`, use `python -m http.server 8080` and open `http://localhost:8080`.

## Controls
| Action | Keyboard | Gamepad |
|---|---|---|
| Move | Arrows / WASD | D-pad / left stick |
| Select | Enter / Space | A |
| Back | Esc / Backspace | B |

Left/right changes category; inside a submenu, left = back. On sliders and selectors, Select enters adjust mode (◀ ▶ change the value), Select or Back confirms.

## Project layout
```
index.html       shell
css/monsoon.css  all styling (rem-based, scales with screen height and UI scale)
js/system.js     System adapter — the ONLY place that will talk to Linux (currently mock)
js/data.js       mock games, friends, downloads, media
js/ui.js         XMB engine: categories, submenus, controls, modals, sounds, background
js/menus.js      the menu tree for every section
js/input.js      keyboard + Gamepad API
```

## What really works
- Full keyboard and gamepad navigation, submenus, focus/edit states, confirmation dialogs, toasts
- Settings persistence (localStorage): UI scale, interface sounds + volume, wave speed/brightness, reduce motion, 24-hour clock, button prompt style (auto-switches keyboard/pad)
- Favourites and "recently played" (updated when you press Launch) persist
- Reset settings, message read state, simulated download queue (pause/resume/cancel)

## What is mock (items are tagged MOCK where it matters)
- All games, friends, messages, achievements, media, storage and network data
- Launching, power actions, playback, video/image viewing: the UI shows the command a real build would run and does nothing else
- Display, system volume, controller, network, bandwidth settings are saved but not applied
- Download progress is simulated and sped up

## Adding real Linux integration
Keep the UI and replace the bodies in `js/system.js`. A browser can't run commands, so add a small helper (Python/Rust) on `127.0.0.1` exposing a WebSocket, and have `System` call it. Suggested commands: `steam steam://rungameid/ID`, `systemctl suspend|reboot|poweroff`, `hyprctl dispatch exit`, `wpctl` (volume), `hyprctl keyword monitor` (resolution), `nmcli` (network), `df` (storage), MPD or `mpv` (media). Later you can wrap the same files in Tauri/Electron if you want one binary.

## Performance
Background is a 1/3-resolution canvas capped at ~30 fps; UI motion uses only transform/opacity, with no blur or shadows on large areas. Reduce motion in Personalisation if needed.

## Not built yet
Messaging composer, real search, on-screen keyboard, per-user profiles, game artwork, a Home-button overlay while a game is running.

## Users (js/users.js)
Boot shows **Select user**; **Add user** runs sign-up (custom username 3–16 chars of letters, digits `_ . -`, unique; optional 4-digit PIN). Type on a physical keyboard or use the on-screen keyboard/keypad with D-pad + A/B. Each user has their own settings, favourites and play history. Account menu: Settings → Account (rename, set/remove PIN, sign out, delete); also Power → Sign out.

**This is not real security.** Profiles and salted-SHA-256 PIN hashes live in browser storage (`monsoon.users`, `monsoon.u.<id>`); anyone with browser access can read or delete them. They are not Linux accounts. For real login, implement the `System` auth stubs with PAM/greetd through the local helper.

## Customisation & your own images
Settings → Personalisation: theme (Monochrome default, Midnight, Ember, Forest, Violet), background (Silk ribbons, Monsoon rain, Aurora, Wallpaper), wave speed/brightness, glow, icon style, art panel on/off, start screen, reduce motion, 24-hour clock. Saved per user.

Drop your own images in `assets/` (missing files fall back automatically):
- `assets/icons/<gameId>.png` — game icon/cover (ids are 101–108 in `js/data.js`); fallback is `assets/default-icon.svg`
- `assets/avatars/<exact username>.png` — user avatar; fallback is `assets/default-avatar.svg`
- `assets/wallpaper.jpg` — used by the Wallpaper background
Use square PNGs (256–512 px) for icons. Only use images you have the right to use.

## Running as a separate system (native shell + console session)
MONSOON is no longer just a web page: `main.js` wraps it in a fullscreen Electron shell with a **whitelisted** bridge to Linux (launch via Steam, sleep/restart/shutdown, system volume via `wpctl`, real OS/CPU/RAM/disk readouts). The UI cannot run arbitrary commands.

Honest scope: this is a console shell on top of Linux (like SteamOS or Batocera), not a new kernel. Your Arch install and Hyprland stay untouched; MONSOON is added as an extra session.

1. `sudo pacman -S --needed electron cage` (NVIDIA: make sure `nvidia-drm.modeset=1` is on the kernel command line)
2. Try it first inside Hyprland, safely (dry run: real actions only print what they would do; Ctrl+Q quits):
   `cd monsoon && npm start`  (or `MONSOON_WINDOWED=1 electron --ozone-platform=wayland .`)
3. Install the session: `sudo ./install.sh`. Pick **MONSOON** at your login screen, or run `monsoon-session` from a TTY. The session sets `MONSOON_REAL=1`, so power, volume and launching really work. Remove with `sudo ./uninstall.sh`.

Still mock: game library (ids 101–108 are fake, not Steam app IDs), friends/messages, downloads, network, display modes, and user accounts (profiles are local to MONSOON, not Linux logins).

Going further, not built here: boot straight into MONSOON with greetd autologin, or ship it as a bootable image with `archiso` / a second partition. Both still run Linux underneath; I can plan either.

## v0.3
Full-resolution background (Settings → Personalisation → Background quality: High / Balanced / Light). Login redesigned with round avatars and a circular PIN pad; mouse click, hover and wheel now work on every screen (the cursor appears only while moving).

## v0.4 overhaul
- Boot intro with chime (any key skips). XMB-style `MM/DD  HH:MM` clock; signed-in user moved to the footer (bottom right).
- Themes: **XMB Auto** (colour shifts with the month, as on the original console), Monochrome, Midnight, Ember, Forest, Violet, Custom hue + colour intensity.
- Backgrounds: Silk waves, Monsoon rain, Aurora, Bokeh, Wallpaper, with wave count/height/speed/brightness, particles, quality.
- Sign-in: scrolling avatar carousel, profile-picture picker. **Put your own default pictures in `assets/profiles/`** (png/jpg/webp/svg/gif). The native shell lists the folder automatically; in a plain browser also list file names in `assets/profiles.js`. 12 generated pictures are always available. Change later in Settings → Account → Profile picture.

### Profile pictures: not showing up?
The picker's first tile (**+**) opens a file chooser, so you can pick any image without touching folders (it is shrunk to 256 px and saved with the profile). Pictures in `assets/profiles/` appear automatically in the native shell (`npm start`), when served with `python -m http.server`, and after `sudo ./install.sh` (re-run it after adding files, since it copies to /opt/monsoon). If you open `index.html` straight from disk in a browser, list the file names in `assets/profiles.js` instead.

## MONSOON as a real OS (v0.5)
MONSOON is a console shell running on Linux (as SteamOS is). Two ways to run it as the whole machine, without touching your current install:
1. **Bootable ISO / USB:** on Arch, `sudo pacman -S archiso`, then `sudo ./os/build-iso.sh` → `out/monsoon-*.iso`. Write it to a USB stick (verify the device with `lsblk`; `dd` overwrites it) and boot from it. It auto-logs in and starts MONSOON. A live USB does not keep profiles/settings between boots, and it needs wired internet unless you add Wi-Fi setup.
2. **Permanent install on a spare drive:** install a minimal Arch (archinstall) to a *different* drive/partition, copy this folder there and run `sudo ./os/setup-os.sh --dedicated`. Reboot: it boots straight into MONSOON, and profiles persist.
Packages are listed in `os/packages.txt` (cage, electron, NVIDIA, PipeWire, Steam...). Both scripts are untested; try them on the USB first. Still mock: game library IDs, network/display settings, downloads, social data.

### NVIDIA GTX 1050 (Pascal) in the OS builders
Official `nvidia` packages dropped Pascal, so `os/aur.sh` builds the legacy 580xx driver (`nvidia-580xx-dkms`, `nvidia-580xx-utils`, `lib32-nvidia-580xx-utils`) from the AUR into a local repo that the ISO build and `setup-os.sh` use, with `linux-headers` and `dkms` from the official repos. Run `./os/build-iso.sh --check` first (no root, builds nothing); a full build writes `out/build.log`. Needs ~20 GB free and network.
