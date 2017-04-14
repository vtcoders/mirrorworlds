(function() {

    var opts = mw_getScriptOptions();

    // Our dumb world:
    mw_addActor(opts.prefix+'plane.x3d');
    mw_addActor(opts.prefix+'../avatars/red_teapot.x3d');

    //opts.mw.subscribeAll = true;

    console.log('Loaded ' + opts.src);
})();
