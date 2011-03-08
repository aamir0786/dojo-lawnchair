dojo.provide('kgf.lawnchair.tests.testHelpers');

dojo.require('kgf.lawnchair.Lawnchair');

(function() {

var lcOpts; //caches result of getOptsFromQuery
var th = kgf.lawnchair.tests.testHelpers = {
	getOptsFromQuery: function() {
		// summary:
		//		Resolves Lawnchair opts from query parameters.
		
		var
			q = location.search,
			opts = {};
		
		if (lcOpts) { return lcOpts; }
		
		if (q) {
			q = dojo.queryToObject(q.substr(1));
		} else {
			q = {};
		}
		if (q.adaptor) { opts.adaptor = q.adaptor; }
		lcOpts = opts; //cache for future calls (query ain't gonna change...)
		return opts;
	},
	addInfo: function(name) {
		// summary:
		//		Places node containing info about what the test page is doing.
		// name: String
		//		Name of what's currently being tested (e.g. Lawnchair, LawnchairStore)
		dojo.place('<p>Testing ' + name + ' with adaptor: ' + th._getAdaptor() +
			'</p>', dojo.body(), 'first');
	},
	_getAdaptor: function() {
		//This is cheating, but it works.  Kids, don't try this at home.
		return kgf.lawnchair.Lawnchair.prototype.getAdaptor(th.getOptsFromQuery());
	}
};

})();