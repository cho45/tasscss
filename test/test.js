#!/usr/bin/env node

TAP();

var fs = require('fs');
var TASS = require('../lib/tass.js').TASS;

Function.prototype.here = function () { return this.toString().split(/\n/).slice(1, -1).join("\n") };

is(TASS(''), '');

is(
TASS((function () {/*
a,
b {
	l1 : foo;

	c, d {
		l2 : foo;
		e, f {
			l3 : foo;
		}
	}
}
*/}).here()),
(function () {/*
a,
b {
l1 : foo;
}
a c,
a d,
b c,
b d {
l2 : foo;
}
a c e,
a c f,
a d e,
a d f,
b c e,
b c f,
b d e,
b d f {
l3 : foo;
}
*/}).here(),
'nesting'
);


is(
TASS((function () {/*
@mixin foo {
	foo : bar;
}

a {
	@include foo;
}

b {
	@include foo;
}
*/}).here()),
(function () {/*
a {
foo : bar;
}
b {
foo : bar;
}
*/}).here(),
'mixin'
);

is(
TASS((function () {/*
@mixin foo ($a, $b) {
	foo : $a $b;
}

a {
	@include foo(#000, #111);
	@include foo(#000, rgba(0, 0, 0, 0.5));
}
*/}).here()),
(function () {/*
a {
foo : #000 #111;
foo : #000 rgba(0, 0, 0, 0.5);
}
*/}).here(),
'mixin'
);

is(
TASS((function () {/*
$foo : foo;
$bar : bar;

foo : $foo;
bar : $bar;

scope1 {
	$foo : foo1;
	foo : $foo;
	bar : $bar;
	scope2 {
		$foo : foo2;
		$bar : bar2;
		foo : $foo;
		bar : $bar;
	}
}

foo : $foo;
bar : $bar;
*/}).here()),
(function () {/*
foo : foo;
bar : bar;
scope1 {
foo : foo1;
bar : bar;
}
scope1 scope2 {
foo : foo2;
bar : bar2;
}
foo : foo;
bar : bar;
*/}).here(),
'variable scope'
);

done_testing();


function TAP () {
	var util = require('util');
	this.ok = function (bool, name) {
		done_testing.n++;
		var r = bool ? 'ok' : 'not ok';
		r += " " + done_testing.n;
		console.log(name ? r + " # " + name : r);
	};
	this.is = function (got, expected, name) {
//		got = util.inspect(got, true, 2);
//		expected = util.inspect(expected, true, 2);
		if (got === expected) {
			ok(true, name);
		} else {
			ok(false, name);
			console.log("# got:\n" + got.replace(/^/m, "# "));
			console.log("# expected:\n" + expected.replace(/^/m, "# "));
		}
	};
	this.done_testing = function () {
		var n = done_testing.n;
		console.log('1..' + n);
	};
	this.done_testing.n = 0;
}
