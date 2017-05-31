// Nesting callbacks in callbacks in callbacks ... etc, tends to be a
// natural way to code in "callback dependency trees" in javaScript.

(function() {

    var prefix = mw_getScriptOptions().prefix;
    var mw = mw_getScriptOptions().mw;


    // TODO: I guess this could be done with a Promise object.
    // The callback to add another users Avatar: The function gets called
    // with the arguments that are sent in mw.sendPayload(avatarId, ...)
    // on another client far below here.
    mw.recvPayload('addAvator',

        // function - What to do with the payload:
        // Add an avatar.  avatarId is the server service subscription ID.
        function(avatarId, avatarUrl) {

            // Select avatar based on client ID mw.Id which is from
            // a counter on the server.
            var avators = [ ];

            mw_addActor(avatarUrl, function(transformNode) {

                // Set the cleanup function after we get the actor model
                // loaded, now:
                mw.setUnsubscribeCleanup(avatarId, function(sourceId) {

                    if(transformNode !== undefined) {
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
                // context. 

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
 
            }, {
                containerNodeType: 'Transform'
            });
        }
    );


    mw_addActor(prefix + '../mw_popupDialog.css', function() {

    mw.glob('/mw/avatars/*.x3d', function(er, avatars) {

        console.log('glob er=' + er + ' glob avatars=' + avatars);
        if(er) {
            console.log('MW failed to get avatar list:\n   ' +
            er);
            return;
        }

        var avatarIndex = mw.Id%(avatars.length);
        
        var button = document.getElementById('select_avatar');
        if(!button) {
            button = document.createElement('A');
            button.href = '#';
            button.appendChild(document.createTextNode('Select Avatar'));
            // TODO: could be prettier.
            document.body.appendChild(button);
            button.title = 'change avatar';
        }

        button.onclick = function(e) {

            var div = document.createElement('div');
            var innerHTML =
                '<h2>Select an Avatar</h2>\n' +
                '<select>\n';

            var i;
            
            for(i=0;i<avatars.length;++i) {
                innerHTML +=
                    '<option value="' + avatars[i] + '"';
                if(i === avatarIndex)
                    innerHTML += ' selected="selected"';
                innerHTML += '>' +
                    avatars[i].replace(/^.*\/|/g,'').
                        replace(/\.x3d$/, '').replace(/_/g, ' '); +
                '</option>\n';
            }

            innerHTML +='  </select>\n';

            div.innerHTML = innerHTML;

            mw_addPopupDialog(div, button);
        }



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

            // TODO: add user avatar selection.
            // We could do it here based on avatarId.
            // The arguments to this function get called with
            // mw.addAvator() on the receiving client end.
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


    }); // mw.glob('/mw/avatars/*.x3d',...)
    
    }); // mw_addActor(prefix + '../mw_popupDialog.css'


    // TODO: We need to use javaScript Promise

})();
