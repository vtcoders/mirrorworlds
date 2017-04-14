// This is a test world in which our veiwpoint is a source of body
// position (pos) and orientation (rotation, rot).  It's just testing this
// as being a rigid body position source that is feed to the Mirror Worlds
// server.  Other clients may read the rigid body positions that we
// send.

(function() {

    var opts = mw_getScriptOptions();

    opts.mw.subscribeAll = false;

    // Our very simple test world:
    mw_addActor(opts.prefix+'plane.x3d');
    mw_addActor(opts.prefix+'../avatars/blue_teapot.x3d');

    // Add the viewpoint source thingy, so other clients
    // may follow us:
    mw_addActor(opts.prefix+'../subscription/source/body_3pos_4rot.js',

        function() {

            console.log(opts.src + ' finished setting up');
        },
        {
            // options for source body_3pos_4rot.js
            //
            body: mw_getCurrentViewpoint(), // get pos and rot from body
            listener: 'viewpointChanged'  // event to listen to
        }
    );
})();
