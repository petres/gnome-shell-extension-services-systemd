# Services Systemd
## About
Services Systemd is a [Gnome](https://www.gnome.org/) Shell Extension which allows to start and stop systemd services via a menu in the status area in the main menu panel. As there exists all a lot of irrelevant systemd services - in the sense of beeing displayed in this menu - the user can preselect which services should be shown in the preference dialog of th extension. 

![Screenshot](https://raw.githubusercontent.com/petres/gnome-shell-extension-services-systemd/master/img/services-systemd.png)

## Install

### Gnome Shell Extensions Page
The easiest way to install this extension is via the official [Gnome Shell Extensions](https://extensions.gnome.org) resource page: https://extensions.gnome.org/extension/1034/services-systemd/

### Arch Linux
For Arch Linux the AUR package [gnome-shell-extension-services-systemd-git](https://aur4.archlinux.org/packages/gnome-shell-extension-services-systemd-git/) is provided. 

## Authorization
Done via a password prompt from the command `pkexec` of the polkit package. This command usually pops up a graphical password prompt.

### Without Password Prompt
In the recent versions of this extension the authorization is done by `pkexec` (before via `gksu`). Therefore if you would like to be able to start systemd services without getting prompted for a password, you will have to configure a polkit policy. The policy file [org.freedesktop.policykit.pkexec.systemctl.policy](https://github.com/petres/gnome-shell-extension-services-systemd/blob/master/org.freedesktop.policykit.pkexec.systemctl.policy) would allow the execution of `systemctl [start|stop]` without a password confirmation. Simple copy the file in your polkit policy folder (usually: `/usr/share/polkit-1/actions`).

## Future
**Planned additional functionality:**
* Separators/Groups
* Adjustable systemd folders
* Other services

## Credits
Some parts have been taken from the gnome extension [Services](https://github.com/hjr265/gnome-shell-extension-services).

## License
[GPLv3](http://www.gnu.org/licenses/gpl-3.0.en.html)
