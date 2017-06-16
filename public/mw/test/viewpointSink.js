// This is just kind of a nothing dummy world which uses the built in
// subscribe policy to subscribe to the subscription made by
// viewpointSource.js.  So the action of subscribing to the subscription
// created by the client loading viewpointSource.js just happens
// automatically from the mw_init.js.

(function() {

    var opts = mw_getScriptOptions();

    // Our dumb world:
    mw_addActor(opts.prefix+'plane.x3d');
    mw_addActor(opts.prefix+'../avatars/red_teapot.x3d');

    // This way be the default already.
    opts.mw.subscribeAll = true;

    console.log('Loaded ' + opts.src);
})();
