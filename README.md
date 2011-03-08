This module contains a modified version of Brian LeRoux's Lawnchair.

<https://github.com/brianleroux/lawnchair>

The modifications herein allow for seamless usage of Lawnchair with the
Dojo Toolkit.  A LawnchairStore is also provided, wrapping Lawnchair in an
implementation of the `dojo.store` API
new in Dojo 1.6.

# Requirements

* Dojo Toolkit (1.6 recommended)
    * **v1.6+ required for kgf.lawnchair.LawnchairStore**
      (as it relies on the `dojo.store.util.*` modules)
    * **v1.4+ required for kgf.lawnchair.Lawnchair**
      (due to the implementation calling `dojo.ready`)
    * You'll need a source distribution if you want to run the DOH tests or
      roll a custom build.

It's possible to use `kgf.lawnchair.Lawnchair` on even older versions of Dojo
than 1.4, by simply aliasing `dojo.ready` (that's all it is to begin with):

    dojo.ready = dojo.addOnLoad;
    //now instantiate Lawnchair

However, the code itself unconditionally uses `dojo.ready` OOTB, hence
why 1.4 is cited as required.

The above alias is instituted in `tests/test_Lawnchair.html`; it has been
tested successfully against Dojo 1.3.

# Installation

The dojo modules included are namespaced under `kgf.lawnchair` by default.
Therefore, for simplest out-of-the-box usage, clone/unpack this repository
under a folder `kgf/lawnchair`, where `kgf` is a sibling of your `dojo` folder.

Alternatively, you can unpack it elsewhere and configure `modulePaths`, or
even massively replace the namespace with your own, e.g.:

    fgrep -r 'kgf.lawnchair.' * | xargs sed -i -e 's/kgf\.lawnchair\./other.interesting.namespace./g'

# Usage

## Lawnchair (kgf.lawnchair.Lawnchair)

Other than the addition of the usual Dojo rituals, you still instantiate
Lawnchair as you always would; it still accepts the same arguments
object, and it still expects a callback.

    dojo.require('kgf.lawnchair.Lawnchair');
    
    dojo.ready(function() {
        var lc = new kgf.lawnchair.Lawnchair({adaptor: 'dom'}, function() {
            // ... do stuff with lawnchair instance now that it's ready ...
        }));
    });

Notably, you no longer need to worry about manually including adaptors (and
`LawnchairAdaptorHelpers`) into the page yourself; this version of Lawnchair
will automatically load the chosen adaptor as necessary, and defer firing
the provided callback until the module is actually loaded.  (See also
**On-demand adaptor loading** under **Significant Changes** below.)

## LawnchairStore (kgf.lawnchair.LawnchairStore)

LawnchairStore is used just like any other `dojo.store`.  It returns promises
for `get`, `add`, `put`, `remove`, and `query`, which automatically hook to
the callback arguments of Lawnchair's methods.

LawnchairStore can be wrapped in `dojo.data.ObjectStore`
in order to interface with consumers of the `dojo.data` API
(e.g. `dijit` and `dojox` widgets).  You can see this in action in
`tests/test_LawnchairStoreExplorer.html`, which wraps a LawnchairStore in an
ObjectStore, then feeds it to a `dojox.data.StoreExplorer`
(which internally uses a `dojox.grid.DataGrid`).

LawnchairStore can also be instantiated declaratively, e.g.:

    <div data-dojo-id="store" data-dojo-type="kgf.lawnchair.LawnchairStore"
     data-dojo-props="adaptor: 'cookie'"></div>

It also supports setting `adaptor` via the legacy (Dojo < 1.6) declarative
syntax (though again, LawnchairStore itself won't work on < 1.6).

A few implementation notes:

* The `query` method supports the same query formats as
  `dojo.store.Memory`, since they both utilize
  `dojo.store.util.SimpleQueryEngine` OOTB.
  However, it does not support the "terse" shorthand syntax available to
  Lawnchair's `find` method.
* The `remove` method supports removing by key (in accordance with the
  dojo.store API) and by object reference (as supported by Lawnchair itself).
* A `nuke` method is available, mapping to Lawnchair's `nuke` method.

# Significant Changes

## Dojo Modules

`Lawnchair.js` and each of the adaptors are wrapped as Dojo modules.  All
globals have been removed.

### On-demand adaptor loading

After 0.5, Lawnchair began expecting an additional callback argument
to be passed to its constructor, although the master branch still seems to
call it synchronously.

Since the argument was made compulsory, this implementation
takes advantage of it in order to allow for dynamic loading of adaptors
as needed (i.e. the callback supplied gets passed along to a
`dojo.ready` call).

### Consistent naming

Some of the adaptors' filenames in the original Lawnchair distribution were
inconsistent with the actual constructors themselves.  Any inconsistencies
have been resolved.  Notably, this has resulted in a few filenames changing
in order to match the modules they provide:

* `AIRSqliteAdaptor` --> `AIRSQLiteAdaptor`
* `AIRSqliteAsyncAdaptor` --> `AIRSQLiteAsyncAdaptor`
* `UserDataStorage` --> `UserDataAdaptor`

## Smarter constructor/init

Lawnchair's init function is assisted by a new helper `getDefaultAdaptor`
function, which is responsible for picking a suitable default adaptor
(if possible) if none is specified.

The provided default implementation progresses as follows:

1. test for Web Storage support (`window.Storage`)
1. test for Web SQL Database support (`window.openDatabase`)
1. If browser is IE 6 or 7, fall back to UserData (IE 8+ supports Web Storage)
1. If all else fails, settle on `DOMStorageAdaptor` for its non-persistent
   `window.name` fallback

This function can be easily overridden:

    kgf.lawnchair.Lawnchair.prototype.getDefaultAdaptor = function() {
        //perform some logic and return one of the adaptor constructors, e.g.:
        return 'kgf.lawnchair.adaptors.DOMStorageAdaptor';
    }

## Augmentable adaptor name map

In the original Lawnchair, the map associating adaptor "names" (e.g.
`dom`, `cookie`, `webkit`) is defined inside `init`, making it difficult
to extend.  This version exposes it directly as
`Lawnchair.prototype.adaptorNames`.  This means that if you want to add a new
adaptor without mucking with the source, it's as easy as...

    //let's say you created a new adaptor at my.adaptors.AwesomeAdaptor.
    //after you've loaded Lawnchair, do...
    kgf.lawnchair.Lawnchair.prototype.adaptorNames.awesome =
        'my.adaptors.AwesomeAdaptor';

Note that the map's values are now strings containing fully-qualified module
names, rather than references to the modules themselves.  This change is part
of what allows on-demand loading of adaptor modules.

## JSON global no longer required

Serialization is now performed using `dojo.toJson`.

## Tests

The original tests have been replaced by tests using DOH.
See **Tests** below for more details.

# Builds

It is possible to include these modules as part of a custom build using
Dojo's [build system](http://dojotoolkit.org/reference-guide/build/index.html).

For example, here's the makings of a build profile with a layer incorporating
Lawnchair and a few adaptors we might expect to use; this example specifies
the ones that the provided implementation of `getDefaultAdaptor` falls back to.

    dependencies = {
        /* ... other options here ... */
        layers: [
            /* ... other layers here ... */
            {
                name: "../kgf/lawnchair.js",
                resourceName: "kgf.lawnchair",
                dependencies: [
                    "kgf.lawnchair.Lawnchair",
                    "kgf.lawnchair.adaptors.DOMStorageAdaptor",
                    "kgf.lawnchair.adaptors.UserDataAdaptor",
                    "kgf.lawnchair.adaptors.WebkitSQLiteAdaptor",
                    "kgf.lawnchair.LawnchairStore"
                ]
            }
        ],
        
        prefixes: [
            /* ... other prefixes here ... */
            [ "kgf", "../kgf" ]
        ]
    }

(This example assumes that the module is in the `kgf.lawnchair` namespace as
provided OOTB, and that the `kgf` folder is a sibling of `dojo`, etc.)

# Tests

On any of the test pages (except `test_declarative.html`),
you can specify an adaptor to test via GET parameter, e.g.:
`test_Lawnchair.html?adaptor=cookie` (using the same string the
Lawnchair constructor would look for in `opts.adaptor`).

## Lawnchair (tests/test_Lawnchair.html)

The original tests for all but the air adaptors have been re-implemented
to rely on DOH instead of QUnit.

The mapping is not necessarily one-to-one, but the functionality tested is
the same.

## LawnchairStore (tests/test_LawnchairStore.html)

This contains a set of tests for LawnchairStore, comprised of adaptations
of the Lawnchair tests above, plus a few additional tests for store-specific
behavior.

## StoreExplorer (tests/test_LawnchairStoreExplorer.html)

This renders a LawnchairStore in a `dojox.data.StoreExplorer`
(by first running the store through the `dojo.data.ObjectStore`
adapter), to provide a simple playground.  (Please note the **Known Issues**
below.)

## declarative tests (tests/test_declarative.html)

This tests using declarative syntax to instantiate
`kgf.lawnchair.LawnchairStore` with a given adaptor.  It tests both the
legacy `dojoType` syntax as well as the new `data-dojo-type` syntax.

Note that declarative syntax cannot be supported for
`kgf.lawnchair.Lawnchair` itself, as it is impossible to pass the required
callback argument.

# Known Issues

## Tests

Note that not all tests seem to always pass for all adaptors.
This is true even of Lawnchair itself.  Generally though, anything that passes
the original spec tests in vanilla Lawnchair should also pass the tests here in
`test_Lawnchair.html` or `test_LawnchairStore.html`.

Of particular note, testing `CookieAdaptor` will fail if you have any other
cookie data on the domain, as it seems Lawnchair doesn't namespace at all for
CookieAdaptor and thus tosses its cookies all over yours.
(There's a hack in the explorer test page to avoid creating a cookie for the
tree, specifically to avoid this.)

### test_Lawnchair.html

* For some reason, these DOH tests infinitely loop in IE.  Not sure why yet.
  The tests on `test_LawnchairStore.html` run fine.

### test_LawnchairStoreExplorer.html

* Don't forget to click Save after making changes in order to persist them!
  (This isn't a bug, it's how StoreExplorer - and `dojo.data` - works.)
* If you start with an empty store, add a row, then save, it won't show
  up until you refresh the page (which means it'll never show up at all
  if the store is falling back to non-persistent `window.name` storage,
  unless you add columns manually).  This is because `dojox.data.StoreExplorer`
  does not recalculate columns to display when new items are added.
