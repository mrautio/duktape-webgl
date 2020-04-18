#!/bin/sh

set -e

# start virtual framebuffer
/sbin/start-stop-daemon --start --quiet --pidfile /tmp/xvfb.pid --make-pidfile --background --exec /usr/bin/Xvfb -- :99 -ac -pn -noreset -screen 0 640x480x24
export DISPLAY=:99

# need to wait that Xvfb has started properly before starting bootstrap program
sleep 5s

# run tests
npm --no-update-notifier start
