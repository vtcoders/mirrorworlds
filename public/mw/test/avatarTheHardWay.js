// This 

(function() {

    var opts = mw_getScriptOptions();
    var mw = opts.mw;

    // Our very simple test world:
    mw_addActor(opts.prefix+'plane.x3d');
    mw_addActor(opts.prefix+'gnome.x3d');

    // list of avatars gets updated in mw.recvPayload('addAvator', ...)
    // for different avatars.
    var avatars = { };

    // trans saves the position and rotation if we get them before the
    // avatar is loaded via HTTP with X3D <inline> on a tranform node
    // using addActor().
    var trans = { };

    function avatarSetPosRot(node, pos, rot) {

        node.setAttribute('translation',
                pos.x + ' ' + pos.y + ' ' + pos.z);
        node.setAttribute('rotation',
                rot[0].x + ' ' + rot[0].y + ' ' + rot[0].z + ' ' + rot[1]);
    }


    // The callback to add another users Avatar The function get called
    // with the arguments that are sent in sendPayload(avatarId,
    // avatarUrl) on another client below.
    mw.recvPayload('addAvator',

        // function - What to do with the payload:
        // Add an avatar.  avatarId is the server service subscription ID.
        function(avatarId, avatarUrl) {

            mw_addActor(avatarUrl, function(transformNode) {

                avatars[avatarId] = transformNode;

                if(trans[avatarId]) {
                    // In this case we got the pos/rot before we got the
                    // avatar loaded, so now we set the pos/rot now
                    // here:
                    avatarSetPosRot(avatars[avatarId],
                            trans[avatarId].pos, trans[avatarId].rot);
                    // We do not need this any more.
                    delete trans[avatarId];
                }

            }, {
                containerNodeType: 'Transform'
            });
        },

        // The cleanup function
        function(avatarId) {

            // In case we get a cleanup before the avatar model loaded
            // we check that the avatar exists.  Yes it happens, because
            // loading avatar via HTTP request can be slow.
            if(avatars[avatarId] !== undefined) {
                avatars[avatarId].parentNode.removeChild(
                        avatars[avatarId]);
                delete avatars[avatarId];
                // avatars[avatarId] should be undefined now.
            }
            if(trans[avatarId] !== undefined) {

                delete trans[avatarId];
            }
        }
    );


    // Called to receive from sendPayload(avatarMoveId, avatarMoveId,
    //   avatarId, e.position, e.orientation); from another client calling
    // far below here in this file.  'moveAvator' is a subscription
    // descriptor for a class or subscriptions.  You may not use numbers
    // as a descriptor (not like '21').  Numbers can only be used for
    // particular subscriptions (IDs) after the server sets them up.
    mw.recvPayload('moveViewpointAvator', 

        // function - What to do with the payload: Move the avatar.
        // avatarMoveId is the server service subscription ID.
        function(avatarMoveId, avatarId, pos, rot) {

            if(avatars[avatarId] !== undefined)
                avatarSetPosRot(avatars[avatarId], pos, rot);
            else
                // Save it for when the avatar is first loaded
                trans[avatarId] = { pos: pos, rot: rot };
    });



    // We tell the server that we want an Avatar file to represent us on
    // the other clients
    mw.createSource('Add Avatar',/*shortName*/
        'user viewpoint avatar'/*description*/,
        // 'addAvator' is association to the sink call to
        // mw.recvPayload('addAvator', ...) above.
        // This is the magic that connects sendPayload() to its
        // corresponding recvPayload().
        'addAvator'/* the recvPayload function name or url to javaScript
                    * file receiver code (not url in this case) */,
        function(avatarId, shortName) {

            var avatars = [
                opts.prefix + '../avatars/red_teapot.x3d',
                opts.prefix + '../avatars/green_teapot.x3d',
                opts.prefix + '../avatars/blue_teapot.x3d'
            ];

            // This is the avatar source function.

            // avatarId is the unique server service subscription Id that
            // the server assigned to us.  shortName is assigned too, but
            // based on our shortName that is requested in
            // mw.createSource() just above.

            // TODO: add user avatar selection.
            // We could do it here based on avatarId.
            // The arguments to this function get called with
            // mw.addAvator() on the receiving client end.
            mw.sendPayload(/*where to send =*/avatarId,
                        /*what to send =*/avatarId,
                        avatars[(parseInt(avatarId)%(avatars.length))]);

            // We move "our" avatar on the other clients by sending our
            // viewpoint The positioning of the Avatar depends on the
            // Avatar being loaded, therefore this is nested under the
            // Avatar setup callback.
            mw.createSource('Move Viewpoint Avator',/*shortName*/
                'avator viewpoint position as 3 pos and 4 rot'/*description*/,
                'moveViewpointAvator'/*function name (or url of javaScript)*/,
                function(avatarMoveId, shortName) {

                    // Wrapper utility function with sends the payload
                    // called twice below.
                    function sendPayload(pos, rot) {
                        mw.sendPayload(/*where to send =*/avatarMoveId,
                            /*what to send =*/avatarMoveId, // and
                            avatarId, pos, rot);
                    }

                    // This is the "move avatar" source function.
                    // We have approval from the server now we setup a
                    // handler.

                    // Send initial state the subscribers.
                    sendPayload(mw_getCurrentViewpoint().position,
                            mw_getCurrentViewpoint().orientation);

                    // Send this each time we change the viewpoint.
                    // TODO: throttle this.  It may be writing too much.
                    mw_getCurrentViewpoint().addEventListener(
                            'viewpointChanged',
                        function(e) {

                            sendPayload(e.position, e.orientation);
                        }
                    );
                }
            );
        }
    );

})();
