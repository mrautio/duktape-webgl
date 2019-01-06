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

screenshot_diff ()
{
	ACTUAL="$1"
	EXPECTED="$2"

	# convert raw format and flip the image
	convert -size 640x480 -depth 8 +flip rgba:tmpscreenshot_000000.rgb $1

	# compare screenshots for differences
	compare -verbose -metric AE $ACTUAL $EXPECTED null: 2>&1 || assert_ret $? 0
}

# start virtual framebuffer
/sbin/start-stop-daemon --start --quiet --pidfile /tmp/xvfb.pid --make-pidfile --background --exec /usr/bin/Xvfb -- :99 -ac -pn -noreset -screen 0 640x480x24
export DISPLAY=:99

# need to wait that Xvfb has started properly before starting bootstrap program
sleep 5s

# run tests
00_bootstrap/bootstrap.exe 00_bootstrap/exit_success.js
00_bootstrap/bootstrap.exe 00_bootstrap/exit_failure.js || assert_ret $? 1 
00_bootstrap/bootstrap.exe 00_bootstrap/exit_failure_invalid_gl_call.js || assert_ret $? 1
00_bootstrap/bootstrap.exe 01_grey_screen/grey_screen.js && screenshot_diff screenshot_01_actual.png 01_grey_screen/screenshot_grey_screen.png
00_bootstrap/bootstrap.exe 02_hello_triangle/hello_triangle.js && screenshot_diff screenshot_02_actual.png 02_hello_triangle/screenshot_hello_triangle.png
00_bootstrap/bootstrap.exe 03_draw_image/draw_image.js && screenshot_diff screenshot_03_actual.png 03_draw_image/screenshot_draw_image.png
