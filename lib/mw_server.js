/* We have 3 run cases: 
 *
 *   1. running mw_server from some where else where it's installed:
 *
 *     - mw_server can be in your PATH, and can run many instances
 *
 *   2. running mw_server from the source directory:
 *
 *     - Easier for development
 *
 *   3. you can run 'node lib/mw_server.js'
 *
 *     - This works but does not have the builders configuration changes
 *       to the default parameters from running ./configure
 *
 * Both these two cases need to be tested to make a release.
 *
 * We also keep it so that if a user wishes to they may move the whole
 * installed directory tree to a different directory and still be able to
 * use it without any changes to any file.  They just need to keep the
 * installed files with all their relative paths the same.  To make this
 * so, we require that all these projects files must not depend on the
 * absolute path, at least at startup time, and the path to other
 * installed project files must be computed from __dirname in this file,
 * or be a relative path (not full path).
 *
 * Hence the structure of the source files is the same as the installed
 * files.
 *
 * In nodeJS __dirname resolves symlinks to the real full path.  That's
 * just what it does, so we work with it.
 */


/* config is defined above then this program spliced together via 'make'. */

if(config == null)
    var config = {};

/* Command line and environment optional configuration override some
 * config values via this local 'options' module. */
require("./options").parse(config);



var path = require('path')
  , http = require('http').createServer(http_handler)
  , io = require('socket.io').listen(http)
  , fs = require('fs')
  , url = require('url')
  , querystring = require('querystring');


// Adds a Date/Time prefix to every console.log() and console.error()
// call.  Comment this out to remove the spew prefix
//require('./console'); // It does not work well.


var doc_root = config.doc_root;

var uniCount = 0;

var users = {}; //List of Connected Users

var Lamp = require('./enviro-object');
var lamp1 = true;

http.listen(parseInt(config.http_port));


/*
 * Handle Path Names for the server connection
 *
 * @param req - Data included in request (IP Address, HTTP headers, url, etc.)
 * @param res - Data sent back to browser from server
 */
function http_handler(req, res) 
{
    var urL = url.parse(req.url);
    var pathname = urL.pathname;

    //console.log("stuff=" + pathname + "    c=" + config.mw_dir_str);

    if(config.mw_dir_str !== pathname.substr(0, config.mw_dir_str_length) ) {
        // regular file not beginning with '/mw/'
        send(req, res, pathname, doc_root + pathname);
        return;
    }


    // It is an internal mirror worlds pathname beginning with '/mw/'

    send(req, res, pathname, path.join(config.mw_prefix, pathname));
}


// TODO: This function is no good for sending large files, because it
// reads the whole file into one buffer.
/*
 * Send to http(s) server connection
 *
 * @param req - Data included in request (IP Address, HTTP headers, url, etc.)
 * @param res - Data sent back to browser from server
 * @param pathname - URL pathname
 * @param fullpath - full path to file
 */
function send(req, res, pathname, fullpath)
{
    fs.readFile(fullpath, function(err, data) {
        if (err) {
            res.writeHead(500);
            res.end('Error getting ' + pathname);
            console.error(err);
            return;
        }

        res.writeHead(200);
        res.end(data);
        console.log('sent: ' + pathname + ' to: ' +
                req.connection.remoteAddress);
    });
}


/*
 * Socket Connection and defined socket events
 *
 * @param socket - the connected socket
 */
io.on('connection', function (socket)
{ 

 /*
  * Received when a new client opens a WebSocket connection successfully
  */
  socket.on('newconnection', function(source, name, pos, rot, avatar)
  {
	// Add the new client to the list of all clients
	console.log("New user'" + name + "'is connecting.");

	var id = "user" + genId();

    socket.username = id;

	var publicName;

	//If Client did not enter a name, name defaults to id
	if (name == '') {

		console.log("NO NAME ENTERED");
		publicName = id;
	}
	else {

		publicName = name;
	}
    
	switch (source) {

		case "web" :

			users[id] = [source, publicName, pos, rot, avatar];
			
			break;

		default :
		
			console.log("Invalid source type.");

			break;
	}

	socket.emit('initiate', id, users);

	socket.broadcast.emit('newuser', users[id], id);

  });

	/*
	* Received when the client has changed the position
	* of their avatar
	*
	*/
	socket.on('updateposition', function(id, pos, rot)
	{
		if (users[id] != undefined) {

			// Update the master list with the client's new location.
			users[id][2] = pos;
			users[id][3] = rot;

     		// Inform all clients to update their scenes
      		try {

				io.emit('update', users[id], id);
			
			} catch (e) {

				console.log(e);
			}
		}
		else {

			console.log("User does not exist");
		} 
  });

 /*
  * Received when a client sends a chat message
  */
  socket.on('chatmessage', function(id, message)
  {
	  io.emit('newmessage', users[id][1], message);
	  
  });
  
 /*
  * Received when a client sends out a notification 
  */
  socket.on('newnote', function(message)
  {
	  io.emit('notification', message);
	  
  });
    
 /*
  * Received when a client changes their avatar
  */
  socket.on('newavatar', function(id, avatar) {	

	  console.log(users[id][1] + "has changed their avatar.");
      
      //Save avatar selection
      users[id][4] = avatar;
      
      //Tell clients about the avatar change
      io.emit('changeAvatar', id, avatar);
  });

  /*
  * Received when a client toggles the lamp
  */ 
  socket.on('environmentChange', function() {
            
      lamp1 = !lamp1;
      
      io.emit('updateEnvironment', lamp1);
  });  

 /*
  * Received when a client disconnects (closes their browser window/tab).
  */
  socket.on('disconnect', function()
  {
    if (users[socket.username] != null) {
      
          var goodbyeNote = "" + users[socket.username][1] +
            " is leaving the scene.";
          io.emit('notification', goodbyeNote, users);

          // Inform all clients to update and account for the removed user.
          io.emit('deleteuser', socket.username);

          // Remove the client from the master list
          delete users[socket.username];

		console.log(users);
      }
  });
});


http.listen(() => {
    var address =  http.address();

    // If there is no binding (or so called ANY) address than we will be
    // listening on all Internet interfaces, including localhost
    // (127.0.0.1) if it's setup and usable.  It should be called "all
    // addresses".
    //
    // nodejs http server has address='::' for the ANY address interface,
    // or so it appears.
    //
    // Since the native nodejs does not provide an interface to get all
    // known IP interfaces, we just punt and use 'localhost' and
    // 'hostname', where hostname may not even have a working DNS
    // lookup.

    if(address.address.toString() === '::')
        console.error('Server listening on All Addresses on port ' +
                address.port + "\n" +
                'So you may be able to connect via:\n\n' +
                '           http://localhost:' + address.port + '/mw/index.html\n' +
                '      or:  http://' + require('os').hostname() +
                ':' + address.port + '/mw/index.html\n');
    else
        console.error('server listening at: http://' + address.address + ':' + address.port);
});

function genId() {

	//TODO make counter wrap
	return uniCount++;
}
