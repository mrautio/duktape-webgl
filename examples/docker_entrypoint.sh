#!/bin/sh

set -e

/sbin/start-stop-daemon --start --quiet --pidfile /tmp/xvfb.pid --make-pidfile --background --exec /usr/bin/Xvfb -- :99 -ac -pn -noreset -screen 0 640x480x24
export DISPLAY=:99

# need to wait that Xvfb has started properly
sleep 5s

# test executing multiple files
00_bootstrap/bootstrap.exe 00_bootstrap/exit_success.js
00_bootstrap/bootstrap.exe 00_bootstrap/exit_success.js
00_bootstrap/bootstrap.exe 00_bootstrap/exit_success.js
00_bootstrap/bootstrap.exe 00_bootstrap/exit_success.js
00_bootstrap/bootstrap.exe 00_bootstrap/exit_success.js
