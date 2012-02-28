/**
 * @license MIT copyright (c) 2012 cho45 ( www.lowreal.net )
 * https://github.com/cho45/tasscss/blob/master/LICENSE
 */
function TASS (c) {
	var mixins = TASS.mixins;

	function processInclude (c) {
		return c.replace(/@include \s*([\w\-]+)(\(.*?\))?\s*;/g, function (_, name, args) {
			var mixin = mixins[name];
			if (!mixin) return '/* unknown mixin: ' + name + ' */';
			var content = mixin.content;
			if (args) {
				var scan = args.slice(1, -1);
				var r = /\s*((?:'(?:[^']|\\')*'|"(?:[^"]|\\")*"|\([^\)]*\)|[^,()])+)|,|./g;
				var a = [], m; while ((m = r.exec(scan))) if (m[1]) a.push(m[1]);
				for (var i = 0, len = mixin.args.length; i < len; i++) content = mixin.args[i] + " : " + a[i] + ";\n" + content;
			}
			return content;
		});
	}

	c = c.replace(/^@mixin\s+([\w\-]+)\s*(\([^\)]+\))?\s*\{([\s\S]*?)^\}/gm, function (_, name, args, content) {
		if (args) args = args.slice(1, -1).split(/\s*,\s*/);
		mixins[name] = {
			args : args,
			content : processInclude(content)
		};
		return '';
	});

	var nesting  = [ [] ];
	var level    = [];
	var variables = TASS.variables;
	c = processInclude(c).replace(/(^[^\{\};]+\{)|(\})|^\s*(\$[\w\-]+\s*:.+);|(\$[\w\-]+)/gm, function (_, open, close, vardef, varget) {
		if (open) {
			var scope = function (_parent) { this._parent = _parent };
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
			variables = variables._parent;

			nesting.length = nesting.length / level.pop().length;
			for (var i = 0, len = nesting.length; i < len; i++) nesting[i].pop();
			return (nesting[0].length ? "" : "}");
		} else
		if (vardef) {
			vardef = vardef.match(/^(\$[\w\-]+)?\s*:\s*(.*)$/);
			variables[vardef[1]] = vardef[2];
			return '';
		} else
		if (varget) {
			return typeof variables[varget] === 'undefined' ?  '/* unknown variable: ' + verget + ' */': variables[varget];
		}
	});

	c = c.replace(/ &/g, '').replace(/^\s+/gm, '');

	return c;
}
TASS.version = '0.1.1';
TASS.init = function () {
	TASS.mixins = {};
	TASS.variables = {};
};
TASS.init();

this.TASS = TASS;

if (typeof document != 'undefined') (function () {
	var links = document.getElementsByTagName('link');
	for (var i = 0, it; (it = links[i]); i++) (function (link) {
		if (link.rel != 'stylesheet/tass' || !link.href) return;
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

		req.open('GET', link.href, true);
		req.onreadystatechange = function (e) {
			if (req.readyState != 4) return;
			if (req.status == 200) {
				var css = TASS(req.responseText);
				var style = document.createElement('style');
				style.type = 'text/css';
				style.appendChild(document.createTextNode(css));
				link.parentNode.insertBefore(style, link);
			} else {
				console.log('[TASS] Error:' + req.status + ' ' + req.responseText);
			}
		};
		req.send(null);
	})(it);
})();
