/**
 * @license copyright (c) 2012 cho45 ( www.lowreal.net ) 
 */
function TASS (c) {
	var mixins = {};
	c = c.replace(/^@mixin\s+([\w\-]+)\s*(\([^\)]+\))?\s*\{([\s\S]*?)^\}/gm, function (_, name, args, content) {
		if (args) args = args.slice(1, -1).split(/\s*,\s*/);
		mixins[name] = {
			args : args,
			content : content
		};
		return '';
	});

	c = c.replace(/@include \s*([\w\-]+)(\(.*?\))?\s*;/g, function (_, name, args) {
		var mixin = mixins[name];
		if (!mixin) return '/* unknown mixin: ' + name + '*/';
		var content = mixin.content;
		if (args) {
			args = args.slice(1, -1).split(/\s*,\s*/);
			for (var i = 0, len = args.length, inp = false; i < len; i++) {
				if (~args[i].indexOf('(')) {
					inp = true;
				} else
				if (inp) {
					if (~args[i].indexOf(')')) inp = false;
					args[ i - 1 ] += ', ' + args.splice(i--, 1)[0];
					len--;
				}
			}
			for (var i = 0, len = mixin.args.length; i < len; i++) {
				// prepend variable expression
				content = mixin.args[i] + " : " + args[i] + ";\n" + content;
			}
		}
		return content;
	});

	var nesting  = [ [] ];
	var level    = [];
	var variables = {};
	c = c.replace(/(^[^\{\};]+\{)|(\})|^\s*(\$[\w\-]+\s*:.+);|(\$[\w\-]+)/gm, function (_, open, close, vardef, varget) {
		if (open) {
			var scope = function (parent) { this.parent = parent };
			scope.prototype = variables;
			variables = new scope(variables);

			var selectors = open.replace(/^\s*|\s*\{\s*$/g, '').split(/\s*,\s*/);
			var nextnesting = [];
			for (var i = 0, len = nesting.length; i < len; i++)
				for (var j = 0, lenj = selectors.length; j < lenj; j++)
					nextnesting.push( nesting[i].concat(selectors[j]) );
			nesting = nextnesting;
			level.push(selectors);

			var expanded = [];
			for (var i = 0, len = nesting.length; i < len; i++) expanded.push(nesting[i].join(" "));

			return (nesting[0].length - 1 ? "}\n" : "") + expanded.join(",\n") + " {";
		} else
		if (close) {
			variables = variables.parent;

			nesting.length = nesting.length / level.pop().length;
			for (var i = 0, len = nesting.length; i < len; i++) nesting[i].pop();
			return (nesting[0].length ? "" : "}");
		} else
		if (vardef) {
			vardef = vardef.split(/\s*:\s*/);
			variables[vardef[0]] = vardef[1];
			return '';
		} else
		if (varget) {
			return variables[varget];
		}
	});

	c = c.replace(/ &/g, '').replace(/^\s+/gm, '');

	return c;
}

this.TASS = TASS;
this.TASS.version = '0.1.0';

if (typeof document != 'undefined') {
	var links = document.getElementsByTagName('link');
	for (var i = 0, it; (it = links[i]); i++) {
		if (it.rel != 'stylesheet/tass' || !it.href) continue;
		var req;
		try {
			req = new XMLHttpRequest();
		} catch (e) {
			try {
				req = new ActiveXObject('MSXML2.XMLHTTP.6.0');
			} catch (e) {
				try {
					req = new ActiveXObject('MSXML2.XMLHTTP.3.0');
				} catch (e) {
					console.log('[TASS] Error: Cannot create XMLHttpRequest object');
				}
			}
		}

		req.open('GET', it.href, true);
		req.onreadystatechange = function (e) {
			if (req.readyState != 4) return;
			if (req.status == 200) {
				var css = TASS(req.responseText);
				var style = document.createElement('style');
				style.type = 'text/css';
				style.appendChild(document.createTextNode(css));
				document.getElementsByTagName('head')[0].appendChild(style);
			} else {
				console.log('[TASS] Error:' + req.status + ' ' + req.responseText);
			}
		};
		req.send(null);
	}
}
