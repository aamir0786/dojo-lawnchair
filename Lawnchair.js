dojo.provide('kgf.lawnchair.Lawnchair');

kgf.lawnchair.Lawnchair = (function() {

/**
 * Lawnchair
 * =========
 * A lightweight JSON document store.
 *
 */
var Lawnchair = function(opts, cb) {
	if (typeof cb != 'function') {
		throw new Error(
			'Please provide a callback as second parameter to Lawnchair constructor.');
	}
	this.init(opts, cb); //pass callback to init so it controls when it's called
}

Lawnchair.prototype = {
	
	//map of adaptors as expected via opts.adaptor,
	//moved out to the prototype to be far easier to extend.
	//Note that the map now maps to adaptor module names,
	//in order to allow for dynamic loading.
	adaptorNames: {
		'webkit': 'kgf.lawnchair.adaptors.WebkitSQLiteAdaptor',
		'gears': 'kgf.lawnchair.adaptors.GearsSQLiteAdaptor',
		'dom': 'kgf.lawnchair.adaptors.DOMStorageAdaptor',
		'cookie': 'kgf.lawnchair.adaptors.CookieAdaptor',
		'air': 'kgf.lawnchair.adaptors.AIRSQLiteAdaptor',
		'userdata': 'kgf.lawnchair.adaptors.UserDataAdaptor',
		'air-async': 'kgf.lawnchair.adaptors.AIRSQLiteAsyncAdaptor',
		'blackberry': 'kgf.lawnchair.adaptors.BlackBerryPersistentStorageAdaptor',
		'couch': 'kgf.lawnchair.adaptors.CouchAdaptor',
		'server': 'kgf.lawnchair.adaptors.ServerAdaptor'
	},
	
	//function to choose adaptor.
	//Returns one of the string values from adaptorNames, or throws.
	getAdaptor: function(opts) {
		var
			adaptorName = opts.adaptor,
			adaptor = this.adaptorNames[adaptorName];
		
		if (!adaptor && adaptorName) {
			//adaptor was specified, but we don't recognize it.
			throw new Error('Unrecognized adaptor name specified.');
		}
		
		adaptor = adaptor || this.getDefaultAdaptor();
		//ensure requested adaptor is loaded (will no-op if it is already)
		//(using array notation for dynamic dojo.require so builds don't trip)
		
		dojo['require'](adaptor);
		return adaptor;
	},
	
	//function to semi-intelligently choose a default adaptor
	//(also serves as a halfway-decent override point)
	//Returns one of the string values from adaptorNames.
	getDefaultAdaptor: function() {
		var adaptor;
		if (window.Storage) {
			adaptor = 'kgf.lawnchair.adaptors.DOMStorageAdaptor';
		} else if (window.openDatabase) {
			adaptor = 'kgf.lawnchair.adaptors.WebkitSQLiteAdaptor';
		} else if (dojo.isIE > 5) { //yes "ew", but what's a good FD test?
			adaptor = 'kgf.lawnchair.adaptors.UserDataAdaptor';
		} else {
			//fall on window.name fallback in DOMStorageAdaptor
			console.warn("WARNING: falling back to non-persistent storage");
			adaptor = 'kgf.lawnchair.adaptors.DOMStorageAdaptor';
		}
		return adaptor;
	},
	
	init:function(opts, cb) {
		opts = opts || {};
		//consult method(s) for mappings/fallbacks
		var ctorstr = this.getAdaptor(opts);
		//since lawnchair now requires a callback parameter, defer until dojo.ready
		//to make room for dynamic loading of adaptors on-demand.
		dojo.ready(dojo.hitch(this, function() {
			var ctor = dojo.getObject(ctorstr);
			this.adaptor = new ctor(opts);
			cb.call(this);
		}));
	},
	
	// Save an object to the store. If a key is present then update. Otherwise create a new record.
	save:function(obj, callback) {this.adaptor.save(obj, callback)},
	
	// Invokes a callback on an object with the matching key.
	get:function(key, callback) {this.adaptor.get(key, callback)},

	// Returns whether a key exists to a callback.
	exists:function(callback) {this.adaptor.exists(callback)},
	
	// Returns all rows to a callback.
	all:function(callback) {this.adaptor.all(callback)},
	
	// Removes a json object from the store.
	remove:function(keyOrObj, callback) {this.adaptor.remove(keyOrObj, callback)},
	
	// Removes all documents from a store and returns self.
	nuke:function(callback) {this.adaptor.nuke(callback);return this},
	
	// Returns a page of results based on offset provided by user and perPage option
	paged:function(page, callback) {this.adaptor.paged(page, callback)},
	
	/**
	 * Iterator that accepts two paramters (methods or eval strings):
	 *
	 * - conditional test for a record
	 * - callback to invoke on matches
	 *
	 */
	find:function(condition, callback) {
		var is = (typeof condition == 'string') ? function(r){return eval(condition)} : condition
		  , cb = this.adaptor.terseToVerboseCallback(callback);
	
		this.each(function(record, index) {
			if (is(record)) cb(record, index); // thats hot
		});
	},


	/**
	 * Classic iterator.
	 * - Passes the record and the index as the second parameter to the callback.
	 * - Accepts a string for eval or a method to be invoked for each document in the collection.
	 */
	each:function(callback) {
		var cb = this.adaptor.terseToVerboseCallback(callback);
		this.all(function(results) {
			var l = results.length;
			for (var i = 0; i < l; i++) {
				cb(results[i], i);
			}
		});
	}
// --
};

return Lawnchair;

})();
