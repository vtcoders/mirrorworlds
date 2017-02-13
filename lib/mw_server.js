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

var users = {}; //List of Connected Users

var Lamp = require('./enviro-object');

//console.log('made a Lamp');

/*var environmentEvents = {};
environmentEvents.lamp1 = new Lamp("lamp1", true);
environmentEvents.lamp2 = new Lamp("lamp2", true);*/

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
  socket.on('newconnection', function(name, pos, rot, avatar)
  {
	// Add the new client to the list of all clients
	console.log("New user'" + name + "'is connecting.");
	console.log("Position: " + pos);
	console.log("Rotation: " + rot);
	console.log("Avatar: " + avatar);

    socket.username = name;
    
    users[name] = [name, pos, rot, avatar];

	socket.emit('initiate', users);

	socket.broadcast.emit('newuser', users[name]);

  });

 /*
  * Received when the client has changed the position
  * of their avatar
  *
  * @param name - client's username
  * @param pos - client's start position in the scene
  * @param rot - client's start rotation in the scene
  */
  socket.on('updateposition', function(name, pos, rot, avatar)
  {   
      // Update the master list with the client's new location.
      users[name] = [name, pos, rot, avatar];
      
      // Inform all clients to update their scenes
      try {
          io.emit('update', users[name]);
      } catch (e) {
          console.log(e);
      }
  });

 /*
  * Received when a client sends a chat message
  */
  socket.on('chatmessage', function(name, message)
  {
	  io.emit('newmessage', name, message);
	  
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
  socket.on('newavatar', function(name, avatar) {
      console.log(name + "has changed their avatar.");
      
      //Preserve location data
      var userPos = users[name][1];
      console.log("Position: ", userPos);
      var userRot = users[name][2];
      console.log("Rotation: ", userRot);
      
      //Save avatar selection
      users[name] = [name, userPos, userRot, avatar];
      
      //Tell clients about the avatar change
      io.emit('changeAvatar', name, avatar);
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
      
          var goodbyeNote = "" + users[socket.username][0] +
            " is leaving the scene.";
          io.emit('notification', goodbyeNote, users);

          // Inform all clients to update and account for the removed user.
          io.emit('deleteuser', users[socket.username]);

          // Remove the client from the master list
          delete users[socket.username];
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
