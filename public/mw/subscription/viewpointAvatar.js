// Nesting callbacks in callbacks in callbacks ... etc, tends to be a
// natural way to code in "callback dependency trees" in javaScript,
// though it can get a little messy with the deep tabs.

(function() {

    var prefix = mw_getScriptOptions().prefix;
    var mw = mw_getScriptOptions().mw;


    // The callback to add another users Avatar: The function gets called
    // with the arguments that are sent in mw.sendPayload(avatarId, ...)
    // on another client far below here.
    mw.recvPayload('addAvator',

        // function - What to do with the payload:
        // Add an avatar.  avatarId is the server service subscription ID.
        function(avatarId, avatarUrl) {

            mw_addActor(avatarUrl, function(transformNode) {

                // Set the cleanup function after we get the actor model
                // loaded, now:
                mw.setUnsubscribeCleanup(avatarId, function(sourceId) {

                    if(transformNode !== undefined) {
                        // Remove the avatar model from the scene graph.
                        transformNode.parentNode.removeChild(transformNode);
                        delete transformNode;
                    }
                });

                // Called to receive data from a corresponding
                // sendPayload() call below.  from another client calling
                // far below here in this file.  'moveViewpointAvator_*'
                // is a subscription descriptor for a class of
                // subscriptions.  You may not use numbers as a descriptor
                // (not like '21').  Numbers can only be used for
                // particular subscriptions (IDs) after the server sets
                // them up.
                //
                // The first argument MUST be a unique to this execution
                // context, hence we use the avatarId in making it.
                // It maps the (pos, rot) args to a particular avatar
                // that we created in the current function context.

                mw.recvPayload('moveViewpointAvator_' + avatarId,

                    // function - What to do with the payload: Move the
                    // avatar.  avatarMoveId is the server service
                    // subscription ID.
                    function(pos, rot) {

                        if(transformNode !== undefined) {

                            transformNode.setAttribute('translation',
                                    pos.x + ' ' + pos.y + ' ' + pos.z);
                            transformNode.setAttribute('rotation',
                                    rot[0].x + ' ' + rot[0].y + ' ' +
                                    rot[0].z + ' ' + rot[1]);
                            }
                        });

            },
            // Options that are passed to the mw_addActor()
            {
                containerNodeType: 'Transform'
            });
        }
    );


    // We tried using promises but promises lose the context from
    // dependent promises, which make it so we must save data that was
    // easily saved in the function context which provides a very natural
    // and easier way to save state between dependent callbacks.
    //


    // avatars is an array of avatar urls that are x3d files
    // that we get below this function.  We need to get the avatar list
    // before we can call this.
    function addAvatar(avatars) {

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

                // This is the avatar source function.

                // avatarId is the unique server service subscription Id that
                // the server assigned to us.  shortName is assigned too, but
                // based on our shortName that is requested in
                // mw.createSource() just above.

                // TODO: add user avatar selection, so we can change this
                // avatar x3d file that represents us.  We could do it
                // here based on avatarId.  The arguments to this function
                // get called with mw.addAvator() on the receiving client
                // end.
                mw.sendPayload(/*where to send =*/avatarId,
                    /*what to send =*/avatarId,
                    avatars[(parseInt(avatarId)%(avatars.length))]);


                // We move "our" avatar on the other clients by sending our
                // viewpoint. The positioning of the Avatar depends on the
                // Avatar being loaded, therefore this is nested under the
                // Avatar model loading callback.

                mw.createSource('Move Viewpoint Avator',/*shortName*/
                    'avator viewpoint position as 3 pos and 4 rot'/*description*/,
                    'moveViewpointAvator_' +
                    avatarId/*recvPayload() function name (or url of javaScript)*/,
                    function(avatarMoveId, shortName) {

                        // Wrapper utility function which sends the payload
                        // called twice below.
                        function sendPayload(pos, rot) {
                            mw.sendPayload(/*where to send =*/avatarMoveId,
                                /*what to send =*/pos, rot);
                            }

                            // This is the "move avatar" source function.
                            // We have approval from the server now we setup a
                            // handler.

                            // Send initial state the subscribers.
                            // TODO: consider transforming to other
                            // coordinates that are good in other
                            // viewers and worlds.
                            sendPayload(mw_getCurrentViewpoint().position,
                                mw_getCurrentViewpoint().orientation);

                            // Send this each time we change the viewpoint.
                            // TODO: throttle this.  It may be writing too much.
                            mw_getCurrentViewpoint().addEventListener(
                                'viewpointChanged',
                                function(e) {
                                    // send to server and in turn it's
                                    // sent to other clients as our
                                    // avatar's current 6D position.
                                    sendPayload(e.position, e.orientation);
                                }
                            );
                    }
                );
            }
        );
    }

    // addAvatars is called by mw.getAvatars() after getting the avatars
    // array from the server.
    mw.getAvatars(addAvatar);

})();

