dojo.provide('kgf.lawnchair.LawnchairStore');

dojo.require('dojo.store.util.SimpleQueryEngine');
dojo.require('dojo.store.util.QueryResults');
dojo.require('kgf.lawnchair.Lawnchair');

dojo.declare('kgf.lawnchair.LawnchairStore', null, {
	// summary:
	//		A dojo.store wrapper around the Lawnchair document store.
	
	// adaptor: String
	//		Name of adaptor to use. (Not referenced directly; it is
	//		exposed solely to support legacy declarative syntax.)
	adaptor: '',
	
	_idProperty: 'key',
	
	constructor: function(args) {
		var dfd = new dojo.Deferred();
		this._ready = dfd.promise;
		this._lc = new kgf.lawnchair.Lawnchair(args, dojo.hitch(this, function() {
			//replace flag with a simple value for instant dojo.when resolution
			this._ready = true;
			//resolve the deferred in case anything is waiting to execute
			dfd.resolve();
		}));
	},
	
	_callLawnchair: function(funcname, arg) {
		// summary:
		//		Prepares to call a particular function on the Lawnchair instance.
		// description:
		//		First ensures that Lawnchair instance is fully started
		//		(constructor callback has been fired), then calls _makePromise.
		// funcname: String
		//		name of Lawnchair function to invoke.
		// arg: Anything?
		//		Argument to be passed to Lawnchair function, if any.
		// returns:
		//		A promise (either _ready itself, or from _makePromise)
		
		return dojo.when(this._ready,
			dojo.hitch(this, '_makePromise', funcname, arg));
	},
	
	_makePromise: function(funcname, arg) {
		// summary:
		//		Hooks up a promise to a particular invocation of an
		//		async function on the Lawnchair instance.
		//		Arguments are same as for _callLawnchair.
		
		var dfd = new dojo.Deferred();
		var args = [];
		if (arg) { args.push(arg); }
		//add callback argument
		args.push(function(value) { dfd.resolve(value); });
		
		this._lc[funcname].apply(this._lc, args);
		return dfd.promise; // Promise
	},
	
	get: function(id) {
		return this._callLawnchair('get', id);
	},
	
	getIdentity: function(object) {
		return object[this._idProperty];
	},
	
	queryEngine: dojo.store.util.SimpleQueryEngine,
	
	query: function(query, options) {
		// description:
		//		This directly uses Lawnchair's all method, then
		//		passes all the data to the queryEngine.
		//		This makes it possible to take advantage of
		//		dojo.store.util.SimpleQueryEngine, or perhaps others.
		
		return this._callLawnchair('all').then(
			dojo.hitch(this, function(items) {
				//run the aggregated items through the queryEngine, allowing it to
				//apply standard options, then properly wrap the resultset.
				return dojo.store.util.QueryResults(
					this.queryEngine(query, options)(items)
				);
			})
		);
	},
	
	put: function(object, options) {
		var id = options && options.id;
		if (id) { object[this._idProperty] = id; }
		return this._callLawnchair('save', object);
	},
	
	add: function(object, options) {
		var id = this.getIdentity(object) || (options && options.id);
		
		if (!id) { return this._callLawnchair('save', object); }
		
		//if key is present in item, watch out for clobbering
		return this._callLawnchair('get', id).then(
			dojo.hitch(this, function(o) {
				if (o !== null) {
					throw new Error('Tried to add with an already-existing key!');
				} else {
					return this._callLawnchair('save', object);
				}
			})
		);
	},
	
	remove: function(id) {
		return this._callLawnchair('remove', id);
	},
	
	nuke: function() {
		// summary:
		//		Not part of the dojo.store API, but this maps directly to the
		//		nuke method of Lawnchair.
		return this._callLawnchair('nuke');
	}
});
