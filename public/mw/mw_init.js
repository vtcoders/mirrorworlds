// This file is sourced from world.html
// This is the first Mirror Worlds javaScript
// file that is loaded by the browser client.


// one stinking global
var _mw = {

    connectionCount: 0, // number of times we make a webSocket connection
    client_userInitFunc: null,
    mw: {} // list of WebSocket client connections from mw_client()
};


function mw_fail() {

    // TODO: add stack trace or is browser debugger enough?
    var text = "Something has gone wrong";
    for(var i=0; i < arguments.length; ++i)
        text += "\n" + arguments[i];
    console.log(text);
    alert(text);
    window.stop();
    throw text;
}


function mw_assert(val, msg) {

    if(!val) {
        if(msg)
            mw_fail(msg);
        else
            mw_fail("JavaScript failed");
    }
}


// This starts the popup with widget showing.
function mw_addPopupDialog(widget, button, func = null,
        ok = null) {

    if(button.onclick)
        document.body.appendChild(widget);

    // stop keying <enter> from clicking the button
    // by removing the onclick callback
    button.onclick = null;
    
    widget.className = 'widget_box';

    var bottom = document.createElement('div');
    bottom.className = 'widget_bottom';

    var b = document.createElement('button');
    b.appendChild(document.createTextNode('cancel'));
    b.onclick = function() {
    };
    b.className = 'widget_button';
    bottom.appendChild(b);

    if(ok) {
        b = document.createElement('button');
        b.appendChild(document.createTextNode(' ok '));
        b.onclick = function() {
        };
        b.className = 'widget_button';
        bottom.appendChild(b);
    }

    widget.appendChild(bottom);
    
    // Start by showing the Popup Dialog.
    widget.style.visibility = 'visible';
    var background = document.createElement('div');
    background.className = 'background_dimmer';
    document.body.appendChild(background);
    background.onclick = function() {
    
        document.body.removeChild(background);
        widget.style.visibility = 'hidden';
        widget.removeChild(bottom);

        // reset the button
        button.onclick = function() {

            // restart Popup Dialog
            mw_addPopupDialog(widget, button);
        }
        return false;
    }
    console.log('MW added popup widget:\n   ' +
            widget.innerHTML);
}


function _mw_getElementById(id) {

    var element = document.getElementById(id);
    if(!element) mw_fail("document.getElementById(" + id + ") failed");
    return element;
}


// Searches node and all its' children and
// returns an array of returnFunc() things that testFunc() was true for.
// There are default testFunc and returnFunc functions.
function _mw_findNodes(node, param,
        returnFunc = function(node, param) {
            return node.getAttribute(param);
        },
        testFunc = function(node, param) { 
            return node.hasAttribute && node.hasAttribute(param);
        }) {

    if(node === undefined || !node) return [];

    var ret = [];

    if(testFunc(node, param))
        ret = [returnFunc(node, param)];

    for(node = node.firstChild; node !== undefined && node ;
            node = node.nextSibling) {
        var r = _mw_findNodes(node, param, returnFunc, testFunc);
        if(r.length > 0) ret = ret.concat(r);
    }

    return ret;
}


// Searches node and all its' children and
// returns an array of all nodes with attribute from node and all
// its' children.
function _mw_findAttributes(node, attribute) {

    return _mw_findNodes(node, attribute);
}


// actorCalls is an array of strings.
function _mw_runFunctions(actorCalls)
{
    actorCalls.forEach(
        function(call) {
            console.log('MW Calling: ' + call.call + '(' +
                    call.node + ')');
            window[call.call](call.node);
        }
    );
}


function mw_getCurrentViewpoint()
{
    if(_mw.viewpoint !== undefined) return _mw.viewpoint;

    var x3d = document.getElementsByTagName("X3D");
    mw_assert(x3d && x3d.length > 0, 'first x3d tag not found');
    x3d = x3d[0];
    mw_assert(x3d, 'first x3d tag not found');
    // This call suggests that there is just one active viewpoint at any time
    // for a given x3d tag.  So there must be more x3d tags if you need
    // more views.
    var viewpoint = x3d.runtime.getActiveBindable("Viewpoint");

    // Attach default viewpoint if none exists
    // This must be  if(viewpoint == undefined)
    // not if(viewpoint === undefined) WTF?
    if(viewpoint == undefined) {

	viewpoint = document.createElement("viewpoint");
	var scene = x3d.getElementsByTagName("Scene");

	mw_getScene().appendChild(viewpoint);
        //viewpoint.setAttribute("position", "2 1.5 5");
	//viewpoint.setAttribute("orientation", "0 0 0 0");
    }
    _mw.viewpoint = viewpoint;
    return viewpoint;
}


function _mw_addScript(src, onload, opts) {

    console.log('MW Adding Script src= ' + src);
    var script = document.createElement('script');
    document.head.appendChild(script);
    script.onload = onload;
    // script._mw_opts = opts Is how to pass arbitrary data to a script
    // we have not loaded yet.

    script._mw_opts = opts;
    script.src = src;
    script.onerror = function() {
        mw_fail(script.src + ' failed to load');
    };
}


function _mw_addCss(href, onload) {

    console.log('MW Adding CSS href= ' + href);
    var link = document.createElement('link');
    document.head.appendChild(link);
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("type", "text/css");
    link.setAttribute("href", href)
    link.onload = onload;
    link.onerror = function() {
        mw_fail(href + ' failed to load');
    };
}


// actorScriptUrls and actorCalls are arrays of strings.
function _mw_addScripts(actorScriptUrls, actorCalls, opts) {

    if(actorCalls && actorCalls.length > 0) {
        
        var count = actorScriptUrls.length;
        var check = function() {
            --count;
            if(count === 0)
                // We call after all scripts are loaded:
                _mw_runFunctions(actorCalls);
        };

    } else
        var check = null;


    actorScriptUrls.forEach( function(src) {

        _mw_addScript(src, check, opts);
    });
}


function _mw_addX3d(url, onload = null,
        opts = null) {

    // x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG:
    //
    // This code a little convoluted to work around a x3dom bug.
    //
    // We are not able to load a inline without putting it in a group of
    // some kind.  If we do not, some of the attributes of the children of
    // the inline seem to just disappear.  It must be a x3dom BUG.  If you
    // wish to fix this by using the inline as the container group node,
    // please run tests to be sure all the possible cases work.  BUG:
    // TODO: fix x3dom inline so it does not lose children and
    // sub-children attributes when being loaded with javaScript.  Please
    // heed this warning, or pain will ensue.
    //
    // TODO: check x3dom web BUG tickets for this bug.
    //
    /// x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG:

    if(opts === null)
        var opts = { containerNodeType: 'group' };
    if(opts.containerNodeType === undefined || opts.containerNodeType === null)
        opts.containerNodeType = 'group';

    if(opts.parentNode ===  undefined || opts.parentNode === null)
        var group = document.createElement(opts.containerNodeType);
    else
        var group = opts.parentNode;

    mw_assert(group);

    var inline = document.createElement('inline');
    mw_assert(inline);
    inline.setAttribute("namespacename", url);

    inline.onerror = function() {
        mw_fail(url + ' failed to load');
    };

    group.appendChild(inline);

    mw_getScene().appendChild(group);

    inline.onload = function() {

        var dir = inline.url.replace(/[^\/]*$/, '');
        // This is where x3dom discards attributes if not for the
        // extra group node above the <inline>.
        var actorScripts = _mw_findNodes(inline, 'data-mw_script',
                function(node, attribute) {
                    var src = node.getAttribute(attribute);
                    if(src.substr(0,1) !== '/') {
                        return  dir + src;
                    }
                    else
                        return src;
                }
        );
        var actorCalls = _mw_findNodes(this, 'data-mw_call',
                function(node, attribute) {
                    return {
                        node: node ,
                        call: node.getAttribute(attribute)
                    };
                }
        );

        // if the xd3 file had data-mw_script and/or data-mw_call
        // attributes we load the scripts and run the "mw_call" functions.
        _mw_addScripts(actorScripts, actorCalls, opts);

        inline.onload = null;


        if(typeof(onload) === 'function') {
            console.log('MW loaded ' + url + ' calling load handler');
            onload(group);
        } else
            console.log('MW loaded ' + url + ' no load handler');
    };

    inline.setAttribute('url', url);
}


function _mw_addActor(url, onload = null, opts = null) {

    var suffix = url.replace(/^.*\./g, '').toLowerCase(); 

    switch (suffix) {
        case 'x3d':
            _mw_addX3d(url, onload, opts);
            return;
        case 'js':
            _mw_addScript(url, onload, opts);
            return;
        case 'css':
            _mw_addCss(url, onload);
            return;
        default:
            console.log('MW Unknown Actor type: ' + url);
    }
}


function mw_getScene() {

    if(_mw.scene === undefined) {
        var scenes = _mw_findNodes(
                document.getElementsByTagName("BODY")[0], 'SCENE',
            function (node, nodeName) {
                return node; // what to return in an array
            },
            function (node, nodeName) {
                // The test function
                return node.nodeName === nodeName;
            }
        );
        mw_assert(scenes.length === 1, 'scenes=' + scenes);
        _mw.scene = scenes[0];
    }
    return _mw.scene;
}


// Add a node from a served file:
//
//    <inline> for .x3d added to <scene>
//    <script> for .js
//    <link>   for .css
//
//  url is:
//
//    1. full path
//    2. relative to document.currentScript if not in handler
//    3. scriptNode.Dir/url if in a handler in a mw_addActor()
//       loaded script file
//
//  Works with url being an array.
//
function mw_addActor(url = null, onload = null, opts = null) {

    mw_assert(url !== null, 'mw_addActor(url = null,,)');
    // TODO: consider adding a query part to the URL

    //console.log('mw_addActor(' + url + ', ' + onload, opts);

    if(url.constructor === Array) {
        if(url.length > 1) {
            var len = url.length;
            while(url.length > 1)
                _mw_addActor(url.shift(), function(node) {
                    if(--len === 1)
                        // Do the last one last.
                        _mw_addActor(url.shift(), onload, opts);
                }, opts);
        } else if(url.length === 1)
            _mw_addActor(url[0], onload, opts);
    } else {
        _mw_addActor(url, onload, opts);
    }
}


function _mw_currentScriptAddress() {

    // document.currentScript is not defined in script handlers.
    mw_assert(document.currentScript,
            'you cannot get the current script in a handler');
    return document.currentScript.
                src.replace(/^.*:\/\//, '').replace(/\/.*$/, '');
}


// returns a string that is the URL without the filename
// and including the last '/'.
// This will not work in a callback function.
function _mw_getCurrentScriptPrefix() {

    mw_assert(document.currentScript,
            '_mw_getCurrentScriptPrefix(): you cannot get ' +
            'the current script in a handler');
    return document.currentScript.src.replace(/[^\/]*$/,'');
}


function mw_getScriptOptions() {

    mw_assert(document.currentScript,
            'mw_getScriptOptions(): you cannot get ' +
            'the current script in a handler');


    if(document.currentScript._mw_opts)
        var opts = document.currentScript._mw_opts;
    else
        var opts = {};

    
    if(opts.script === undefined) {
        opts.script = document.currentScript;
    }

    if(opts.src === undefined) {
        opts.src = document.currentScript.src;
    }

    if(opts.prefix === undefined) {
        opts.prefix = _mw_getCurrentScriptPrefix();
    }

    if(opts.mw === undefined) {
        var keys = Object.keys(_mw.mw);
        mw_assert(keys.length > 0, 'mw_getScriptOptions(): for ' +
                'src=' + opts.src + '\n    ' +
                'No WebSockets client conection found');
        opts.mw = _mw.mw[keys[0]];
    }

    return opts;
}


// This is the Mirror Worlds client factory function
//
// userInit(mw) called in connect callback.
// TODO: This makes an object that is not exposed outside this
// function scope.  Do we need to make this a client constructor function?
//
// opts { url: 'url' }
function mw_client(userInit = function(mw) {
            console.log('MW called default userInit('+mw+')');
        },
        opts = {}) {
   
    // We handle protocols: http: https: ws: wss:
    // The http(s) protocols are converted to ws: or wss:

    var defaultUrl = location.protocol.replace(/^http/, 'ws') +
        '//' + location.hostname + ':' + location.port + '/';

    if(opts.url === undefined)
        opts.url = defaultUrl;

    if(opts.url !== defaultUrl && _mw.remoteURL !== opts.url) {

        // This will connect to a remote server.

        // keep trying until _mw.client_userInitFunc is not set
        if(typeof(_mw.client_userInitFunc) === 'function') {

                        console.log('MW waiting to connect to: ' + opts.url);
            // Try again later.
            setTimeout(function() {
                // Interesting, this is recursion without adding to the
                // function call stack.  Or is it still called recursion?
                mw_client(userInit, {url: opts.url});
            }, 400/* x 1 seconds/1000*/);
            return null; // See this is returning (popping this call)
            // before we call mw_client() again.
        }

        // This _mw.client_userInitFunc is changed back to null in
        // /mw/mw_client.js

        _mw.client_userInitFunc = userInit;
        // It's not known when this script gets loaded
        mw_addActor(opts.url + '/mw/mw_client.js', userInit);
        return null; // We cannot return an object in this case.
    }


    console.log('MW WebSocket trying to connect to:' + opts.url);

    // the mw object inherits the WebSocket object
    // the mw object is the WebSocket object

    var mw = new WebSocket(opts.url);

    // Just to keep a list of these clients in a global
    mw.ConnectionNum = _mw.connectionCount;
    _mw.mw[mw.ConnectionNum.toString()] = mw;
    ++_mw.connectionCount;


    mw.url = opts.url;

    mw.onCalls = {};
    mw.recvCalls = {};
    mw.cleanupCalls = {};
    mw.Sources = {};
    mw.SourceCount = 0;
    mw.CreateSourceFuncs = {};
    mw.CleanupSourceFuncs = {};
    // TODO: this is a very dumb subscription policy:
    mw.subscribeAll = true; // all but the sources we provide.
    mw.subscriptions = {};
    mw.sendCount = 0; // a counter to label individual requests.
    mw.globFuncs = { };

    mw.on = function(name, func) {

        mw.onCalls[name] = func;
    };

    mw._emit = function(name, data) {

        var args = [].slice.call(arguments);
        var name = args.shift();
        mw.send(JSON.stringify({ name: name, args: args }));
    };

    // Sends through the server to clients 
    mw.sendPayload = function() {

        var args = [].slice.call(arguments);
        var id = args.shift();
        // 'P' is for payload, a magic constant
        mw.send('P' + id + '=' + JSON.stringify({ args: args }));
    };

    // TODO: cleanup the naming of thing private and public.


    // Do we subcribe? Return true or false
    // TODO: move policy stuff.
    mw._checkSubscriptionPolicy = function(sourceId) {

        // TODO: A simple policy for now, needs to be expanded.

        if(mw.Sources[sourceId] !== undefined ||
            // We are the source of this subscription.
            mw.subscribeAll === false
            // dumb policy flag.  TODO more code here
            )
            return false; // do not subscribe

        return true; // subscribe
    };


    // Subscribe if we can and should.
    mw._checkSubscribe = function(sourceId) {

        // tag is the server source ID (like '21').

        if(mw.subscriptions[sourceId] === undefined
            // We did not get the 'newSubscription' yet.
            || !mw._checkSubscriptionPolicy(sourceId)
            // Policy rejects this subscription.
            || mw.recvCalls[sourceId] !== undefined
            // We are subscribed already
                ) {
            // Subscription Debug spew
            mw.printSubscriptions();
            return;
        }


        if(mw.recvCalls[mw.subscriptions[sourceId].tagOrJavaScriptSrc]
                !== undefined) {

            // We have a subscription descriptor recvPayload() callback
            // setup.  Now setup the callbacks for this particular
            // server subscription ID.
            mw.recvCalls[sourceId] =
                mw.recvCalls[
                    mw.subscriptions[sourceId].tagOrJavaScriptSrc
                ];
            var cleanupCall = mw.cleanupCalls[
                    mw.subscriptions[sourceId].tagOrJavaScriptSrc
                ];
            if(cleanupCall !== undefined)
                mw.cleanupCalls[sourceId] = cleanupCall;
            
            // Tell the server to send this subscription to us.
            mw._emit('subscribe', sourceId);

            mw.printSubscriptions();
            return;
        }

        // else We have javaScript to that will mw.recvPayload()

        mw_addActor(mw.subscriptions[sourceId].tagOrJavaScriptSrc,
            function() {
                console.log('MW subscribed to ' +
                mw.subscriptions[sourceId].tagOrJavaScriptSrc);

                // Tell the server to send this subscription to us.
                mw._emit('subscribe', sourceId);

                mw.printSubscriptions();
            },  mw.subscriptions[sourceId]/*mw_addActor() options*/
        );
    };


    // This may get called with a tag (like '21'), an ID from the server
    // (counter) or with tag replaced by any descriptive string like
    // 'avatar' or 'moveAvatar'.  When the descriptive form is used the
    // callbacks are used with any subscriptions ('newSubscription') that
    // come in with a tagOrJavaScriptSrc value that is the same as the
    // descriptor (tag) string.
    mw.recvPayload = function(tag, recvFunc = null,
            cleanupFunc = null) {

        mw_assert(mw.recvCalls[tag] === undefined &&
                mw.cleanupCalls[tag] === undefined,
            'mw.recvPayload(tag="'+ tag +
            '") called with tag that was used before:\n   ' +
            '   mw.recvPayload(' + tag + ',' +
            '   ' + recvFunc + ',' +
            '\n   ' + cleanupFunc + ')');

        // Log the callbacks.
        mw.recvCalls[tag] = recvFunc;
        if(cleanupFunc !== null)
            mw.cleanupCalls[tag] = cleanupFunc;

        // Subscribe if things are setup for it.
        if(mw.subscriptions[tag] !== undefined) {
            // This tag is a sourceId
            mw._checkSubscribe(tag);
            return;
        } else
            mw_assert(isNaN(parseInt(tag, 10)),
                    'mw.recvPayload("' + tag +
                    '") bad subsciption descriptor "' +
                    tag + '"');

        // This tag is a descriptor string.  See if we have
        // a subscription that matches already.

        // TODO: this is a linear search OMG:
        Object.keys(mw.subscriptions).forEach(function(sourceId) {

            if(mw.subscriptions[sourceId].tagOrJavaScriptSrc === tag) {
                mw._checkSubscribe(sourceId);
                return;
            }
        });
    };

    // Sets the mw.cleanupCalls function after the mw.recvCalls function is
    // called.
    mw.setUnsubscribeCleanup = function(sourceId, removeFunc) {

        mw.cleanupCalls[sourceId] = removeFunc;
    };


    mw.onmessage = function(e) {

        //console.log('MW WebSocket message from '
        //        + mw.url + '\n   ' + e.data);

        var message = e.data;
        // Look for 'P' the magic constant.
        if(message.substr(0, 1) === 'P') {

            // The message should be of the form: 'P343=' + jsonString
            // where 343 is an example source ID.  An example of a mininum
            // message would be like 'P2={}'
            var idLen = 1;
            var stop = message.length - 3;
            // find a '=' so the ID is before it.
            while(idLen < stop && message.substr(idLen+1, 1) !== '=')
                ++idLen;
            
            if(idLen === stop) {
                console.log('MW Bad WebSocket "on" message from ' +
                    mw.url + '\n  ' + e.data);
                return;
            }

            // We strip off the source ID and send the Payload.
            var sourceId = message.substr(1, idLen);
            var obj = JSON.parse(message.substr(2+idLen));

            if(mw.recvCalls[sourceId] === undefined)
                mw_fail('MW WebSocket on payload sink callback "' + name +
                    '" not found for message from ' + mw.url + '=' +
                    '\n  ' + e.data);

            // There is an option to not have a callback to receive the
            // payload with mw.recvCalls === null.
            if(mw.recvCalls !== null)
                (mw.recvCalls[sourceId])(...obj.args);

            return;
        }

        var obj = JSON.parse(e.data);
        var name = obj.name;

        // We should have this form:
        // e.data = { name: eventName, args:  [ {}, {}, {}, ... ] }
        if(name === undefined || obj.args === undefined ||
                !(obj.args instanceof Array)) {
            mw_fail('MW Bad WebSocket "on" message from ' +
                    mw.url + '\n  ' + e.data);
        }

        if(mw.onCalls[name] === undefined)
            mw_fail('MW WebSocket on callback "' + name +
                    '" not found for message from ' + mw.url + ':' +
                    '\n  ' + e.data);

        console.log('MW WebSocket handled message from '
                + mw.url + '\n   ' + e.data);

        // Call the on callback function using array spread syntax.
        //https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Spread_operator
        (mw.onCalls[name])(...obj.args);
    };

    mw.onclose = function(e) {

        console.log('MW closed to ' + mw.url);

        // Remove this client from the connection list.
        _mw.mw[mw.ConnectionNum] = null;
        delete _mw.mw[mw.ConnectionNum];
    };

    mw.onopen = function(e) {

        console.log('MW connected to ' + mw.url);
    };

    // pretty good client webSocket tutorial.
    // http://cjihrig.com/blog/how-to-use-websockets/

    mw.on('initiate',/*received from the server*/ function(id) {

        mw.Id = id;

        console.log('MW initiate from ' + mw.url +
                '\n   My client ID=' + id);

        // set a default user name
        mw.Name = 'User' + id;
        userInit(mw);
    });


    mw.createSource = function(shortName, description,
            tagOrJavaScriptSrc, func, cleanupFunc = null) {

        var clientSourceId = (++mw.SourceCount).toString(); // client source ID
        mw.CreateSourceFuncs[clientSourceId] = func;
        // TODO: make this cleanupFunc do it's thing on a
        // 'removeSource' server request ???
        mw.CleanupSourceFuncs[clientSourceId] = cleanupFunc;

        // Ask the server to create a new source of data
        mw._emit('createSource', clientSourceId, shortName,
                description, tagOrJavaScriptSrc);
    };


    mw.on('glob', function(sendId, err, files) {

        mw_assert(mw.globFuncs[sendId] !== undefined,
                'bad glob received id=' + sendId);
        mw.globFuncs[sendId](err, files);
        delete mw.globFuncs[sendId];
    });


    mw.glob = function(expression, func) {
        mw._emit('glob', expression, (++mw.sendId).toString());
        mw.globFuncs[mw.sendId.toString()] = func;
    };


    mw.on('createSource', /*received from the server*/
        function(clientSourceId, serverSourceId, shortName) {

            var func = mw.CreateSourceFuncs[clientSourceId];
            // The shortName will be modified by the server and returned
            // in this callback to the javaScript that called
            // mw.createSource().
            func(serverSourceId, shortName);
            // We are done with this function.
            delete mw.CreateSourceFuncs[clientSourceId];

            // TODO: this in a 'removeSource'
            // server request or something like that.

            // Record that we are a source: If mw.Sources[serverSourceId]
            // is defined we are a source to the serverSourceId
            // subscription and while we are at it use the cleanup
            // function as the value.
            mw.Sources[serverSourceId] = mw.CleanupSourceFuncs[clientSourceId];

            // Now that we have things setup for this source we tell the
            // server to advertise the 'newSubscription'.  The server
            // can't send out the 'newSubscription' advertisement until we
            // tell it to, so that we have no race condition:  If we got
            // the 'newSubscription' before we received the sourceId we
            // could not tell if we are the client that is the source for
            // receiving the corresponding 'newSubscription' below... 
            mw._emit('advertise', serverSourceId);

            // TODO: add a client initiated removeSource interface
        }
    );

    // For Client code initiated unsubscribe.  The server sends
    // 'removeSubscription' events for when subscription become unavailable.
    mw.unsubscribe = function(sourceId) {
 
        // TODO: More code here.
        console.log('MW unsubscribing to ' +
                    mw.subscriptions[sourceId].shortName);

        // TODO: remove the <script> if there is one.

        if(mw.cleanupCalls[sourceId] !== undefined) {
            console.log('MW calling cleanupCall(sourceId=' +
                    sourceId + ')');
            // The user is not required to define a cleanup function.
            // Look how easy it is to pass the arguments.
            mw.cleanupCalls[sourceId].apply(mw, arguments);
        }

        delete mw.recvCalls[sourceId];
        if(mw.cleanupCalls[sourceId] !== undefined)
            delete mw.cleanupCalls[sourceId];
        delete mw.subscriptions[sourceId];

        mw.printSubscriptions();
    };


    mw._subscribeType = function(id) {

        // (unsubscribed), (reading), (writing), or (reading/writing)
        var type = '';
        if(mw.recvCalls[id] !== undefined)
            type = 'reading';
        if(mw.Sources[id] !== undefined) {
            if(type.length > 0) return 'reading/writing';
            else return 'writing';
        }
        if(type.length === 0)
            return 'not subscribed';
        return type;
    };


    // This long function just spews for debugging and does nothing
    // else.
    mw.printSubscriptions = function() {

        // First print this mw clients subscriptions sinks.
        var notGotOne = true;

        Object.keys(mw.subscriptions).forEach(function(id) {

            if(notGotOne) {
                console.log('Mw server ' + mw.url +
                        ' current subscriptions:');
                notGotOne = false;
            }
            // mw.recvCalls[sourceId] will be defined if and only if
            // we are subscribed.
            console.log('   "' + mw.subscriptions[id].shortName +
                    '" (' + mw._subscribeType(id) + ')');
        });

        if(notGotOne)
            console.log('Mw server ' + mw.url +
                    ' Has NO current subscriptions available');
     };


    // 'newSubscription' Sent to this client when a source becomes
    // available for this client for the first time, whither it be because
    // we just connected to the server or the source was just added to the
    // server by this or other client.
    mw.on('newSubscription', /*received from the server*/
        function(sourceId, shortName,
            description, tagOrJavaScriptSrc) {

            console.log('MW got newSubscription  advertisement ' +
                    shortName + '\n  mw.subscribeAll=' + mw.subscribeAll);

            // Add this to the list of things that we can subscribe to
            // whither we subscribe to it or not.
            mw.subscriptions[sourceId] = {
 
                mw: mw,
                sourceId: sourceId, // server source ID
                shortName: shortName,
                description: description,
                tagOrJavaScriptSrc: tagOrJavaScriptSrc
            };

            // Subscribe or not
            mw._checkSubscribe(sourceId);
        }
    );

    mw.on('removeSubscription', function(sourceId) {

        console.log('MW got removeSubscription ' + sourceId);
        mw.unsubscribe(sourceId);
    });


    mw.removeSource(sourceId, func = null) {

        mw_emit('removeSubscription', sourceId);
    }



    return mw;
}


// WebRTC
// https://www.html5rocks.com/en/tutorials/webrtc/basics/
// https://www.w3.org/TR/webrtc/
function _mw_init() {

    var url = null;

    // Parse the URL query:
    if(location.search.match(/.*(\?|\&)file=.*/) != -1)
        url = location.search.replace(/.*(\?|\&)file=/,'').
            replace(/\&.*$/g, '');

    if(url === null || url.length < 1) {
        // The default mode
        // This is the only place that we declare this.
        url = 'mw_default.js';
    }

    mw_client(/*on initiate*/function(mw) {

        // When this is executed all the stuff is loaded.
        mw_addActor(url,
                function() {mw._emit('initiate');}
                , { mw: mw }
        );
    });
}


// Called from body onload event.
function mw_init() {

    mw_addActor(
        [   'x3dom/x3dom.css',
            'x3dom/x3dom.js',
            'mw_default.css'
        ],
        // So _mw_init() is called after all these
        // files are loaded.
        function(node) { _mw_init(); }
    );
}
