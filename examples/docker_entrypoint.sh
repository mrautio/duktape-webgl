#!/bin/bash

set -euxo pipefail

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

	if [ ! -f $EXPECTED ]
	then
		echo "Screenshot missing! '${EXPECTED}'"
		exit 3
	fi

	# convert raw format and flip the image
	convert -size 640x480 -depth 8 +flip rgba:tmpscreenshot_000000.rgb $1 || assert_ret $? 0

	if [ ! -f $ACTUAL ]
	then
		echo "Screenshot missing! '${ACTUAL}'"
		exit 3
	fi

	# compare screenshots for differences, allow small color differences with fuzzing
	compare -verbose -metric AE -fuzz 1% $ACTUAL $EXPECTED null: 2>&1 || assert_ret $? 0
}

# start virtual framebuffer
/sbin/start-stop-daemon --start --quiet --pidfile /tmp/xvfb.pid --make-pidfile --background --exec /usr/bin/Xvfb -- :99 -ac -pn -noreset -screen 0 640x480x24
export DISPLAY=:99

# need to wait that Xvfb has started properly before starting bootstrap program
sleep 5s

# run tests
bootstrap.exe 00_bootstrap/exit_success.js
bootstrap.exe 00_bootstrap/exit_failure.js || assert_ret $? 1 
bootstrap.exe 00_bootstrap/exit_failure_invalid_gl_call.js || assert_ret $? 1
bootstrap.exe 01_grey_screen/grey_screen.js || assert_ret $? 1 && screenshot_diff screenshot_01_actual.png 01_grey_screen/screenshot_grey_screen.png
bootstrap.exe 02_hello_triangle/hello_triangle.js || assert_ret $? 1 && screenshot_diff screenshot_02_actual.png 02_hello_triangle/screenshot_hello_triangle.png
bootstrap.exe 03_draw_image/draw_image.js || assert_ret $? 1 && screenshot_diff screenshot_03_actual.png 03_draw_image/screenshot_draw_image.png
bootstrap.exe 04_render_to_texture/render_to_texture.js || assert_ret $? 1 && screenshot_diff screenshot_04_actual.png 04_render_to_texture/screenshot_render_to_texture.png
