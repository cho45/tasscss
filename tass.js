#!node

function TASS (c) {
	var variables = {};
	c = c.replace(/^\$([\w\-]+)\s*:\s*(.+);/gm, function (_, name, value) {
		variables[name] = value;
		return '';
	});
	c = c.replace(/\$([\w\-]+)/g, function (_, name) {
		return variables[name];
	});

	var mixins = {};
	c = c.replace(/^@mixin\s+([\w\-]+)\s*\{([\s\S]*?)^\}/gm, function (_, name, content) {
		mixins[name] = content;
		return '';
	});

	c = c.replace(/@include \s*([\w\-]+)\s*;/g, function (_, name) {
		return mixins[name];
	});

	var nesting  = [ [] ];
	var level    = [];
	c = c.replace(/(^.+\{)|(\})/gm, function (_, open, close) {
		if (open) {
			var selectors = open.replace(/^\s*|\s*\{\s*$/g, '').split(/\s*,\s*/);
			var nextnesting = [];
			for (var i = 0, len = nesting.length; i < len; i++)
				for (var j = 0, lenj = selectors.length; j < lenj; j++)
					nextnesting.push( nesting[i].concat(selectors[j]) );
			nesting = nextnesting;
			level.push(selectors);
			return (nesting[0].length - 1 ? "}\n" : "") + nesting.map(function (_) { return _.join(" ") }).join(",\n") + " {";
		} else
		if (close) {
			var poped = level.pop();
			nesting.length = nesting.length / poped.length;
			if (!nesting.length) nesting = [ [] ];
			for (var i = 0, len = nesting.length; i < len; i++) nesting[i].pop();
			return (nesting[0].length ? "" : "}");
		}
	});

	c = c.replace(/ &/g, '').replace(/^\s+/gm, '');

	return c;
}


var fs = require('fs');
console.log(TASS(fs.readFileSync('test.tass', 'utf-8')));