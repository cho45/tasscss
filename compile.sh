#!/bin/sh

input=./lib/tass.js
output=./tass.min.js

curl -s \
	-d compilation_level=SIMPLE_OPTIMIZATIONS \
	-d output_format=text \
	-d output_info=compiled_code \
	--data-urlencode "js_code@${input}" \
	http://closure-compiler.appspot.com/compile \
	> $output
