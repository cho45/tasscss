#!/usr/bin/env node

TAP();

var fs = require('fs');
var TASS = require('../lib/tass.js').TASS;
TASS.read = function (path, callback) {
	fs.readFile('test/data/' + path, 'utf-8', function (error, data) {
		if (error) callback('/* ' + error + ' */');
		callback(data);
	});
};

var tests = fs.readFileSync('test/data/base.data', 'utf-8').split(/^===/mg).map(function (test, name) {
	test = test.replace(/^(.+)/, '');
	name = RegExp.$1;
	test = test.split(/\s*--->\s*/).map(function (s) {
		return s.replace(/^\s*|\s*$/g, '');
	});

	return {
		name : name,
		input : test[0],
		expected : test[1]
	};
});
tests.shift();

tests.forEach(function (test) {
	TASS(test.input, function (output) {
		output = output.replace(/^\s*|\s*$/g, '');
		if (output === test.expected) {
			ok(true, test.name);
		} else {
			ok(false, test.name);
			console.log("# expected:\n" + test.expected.replace(/^/gm, "#   "));
			console.log("# got:\n" + output.replace(/^/gm, "#   "));
		}
	});
});

done_testing();


function TAP () {
	var util = require('util');
	var status = 0;
	this.ok = function (bool, name) {
		done_testing.n++;
		var r = bool ? 'ok' : 'not ok';
		if (!bool) status++;
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
			console.log("# got:\n" + got.replace(/^/gm, "# "));
			console.log("# expected:\n" + expected.replace(/^/m, "# "));
		}
	};
	this.done_testing = function () {
		var a;
		process.on('exit', function () {
			if (a) {
				var n = done_testing.n;
				console.log('1..' + n);
			} else {
				a = true;
				process.exit(status);
			} 
		});
	};
	this.done_testing.n = 0;
}
