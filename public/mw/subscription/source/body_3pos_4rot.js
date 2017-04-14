// source of a rigid body position
//
// using position (3) and orientation (4) [quaternion]
// granted the orientation has an extra degree of freedom.
//
// The body being the source is just required to have:
//
//    body.addEventListener(listener, function(e) {})
//    With   e.position  and  e.orientation
//
// Looks like in x3dom the quaternion is not normalized.
//
// The x3dom Viewpoint happens to be a 3 4 position thingy,
// so we can use this to share the viewport between clients.

(function() {

    var opts = mw_getScriptOptions();

    // Check that required options are present.
    mw_assert(opts.body !== undefined,
            'no body given to ' + opts.src);
    mw_assert(typeof opts.listener === 'string',
            'no listener given to ' + opts.src);

    opts.mw.createSource('body_pos_rot',
            'rigid body position'/*description*/,
            opts.prefix+'../sink/body_3pos_4rot.js'/*jsSinkSrc*/,
        function(serverSourceId, shortName) {
 
            // We have approval from the server now we setup a handler.
            opts.body.addEventListener(opts.listener,
                function(e) {

                    // Send this to the subscribers in this handler.
                    opts.mw.sendPayload(serverSourceId,
                            e.position, e.orientation);
                }
            );
        }
    );
})();
