#!/bin/sh

set -e

assert_ret ()
{
	RET="$1"
	EXPECTED="$2"

	if [ "$RET" -ne "$EXPECTED" ]
	then
		echo "Return code invalid! Expected '${EXPECTED}', actual:'${RET}'"
		exit 2
	fi
}

/sbin/start-stop-daemon --start --quiet --pidfile /tmp/xvfb.pid --make-pidfile --background --exec /usr/bin/Xvfb -- :99 -ac -pn -noreset -screen 0 640x480x24
export DISPLAY=:99

# need to wait that Xvfb has started properly
sleep 5s

# test executing multiple files
00_bootstrap/bootstrap.exe 00_bootstrap/exit_success.js
00_bootstrap/bootstrap.exe 00_bootstrap/exit_failure.js || assert_ret $? 1 
00_bootstrap/bootstrap.exe 00_bootstrap/exit_failure_invalid_gl_call.js || assert_ret $? 1
00_bootstrap/bootstrap.exe 01_grey_screen/grey_screen.js
00_bootstrap/bootstrap.exe 02_hello_triangle/hello_triangle.js
