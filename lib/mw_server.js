
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


/* config is define above then this program spliced together via 'make'. */

/* command line and environment optional configuration override some
 * config values via this local 'options' module. */

if(config == null)
    var config = {};

// options.js parses the options from command line and environment
require("./options").parse(config);


/*******************************************************************
 * Implementation of multi-user X3DOM - server side.
 * author: Matthew Bock
 * This version focuses on minimizing data transfer, but it still
 * sends and receives updates as soon as they happen with no regard
 * to time since the last update.
 *
 * edited by: Karsten Dees, Nick Hu {11/14/2016}
 *******************************************************************/


// TODO: Maybe setting of the handler could be more readable?

/*
 * Handle Path Names for the server connection
 *
 * @param req - Data included in request (IP Address, HTTP headers, url, etc.)
 * @param res - Data sent back to browser from server
 */
var handler = (config.mw_prefix == null)?
    // handler could be this function if config.mw_prefix === null
    function(req, res) 
    {
        //console.log('Short handler');
        var pathname = url.parse(req.url).pathname;
        send(req, res, pathname, doc_root + pathname);
    } : 
    // or else this function:
    // and the doc_root is not where the directory mw/ is.
    // mw/ contains mirror worlds server internal files.
    function(req, res) 
    {
        //console.log('LONG handler');
        var pathname = url.parse(req.url).pathname;

        if(config.mw_dir_str !== pathname.substr(0, config.mw_dir_str_length) ) {
            // regular file not beginning with '/mw/'
            send(req, res, pathname, doc_root + pathname);
            return;
        }
        // It is an internal mirror worlds file beginning with '/mw/'
        // or the window equivalent file name.
        send(req, res, pathname, path.join(config.mw_prefix, pathname));
    };


//-----------------------------
// Data Fields
//-----------------------------

var path = require('path')
  , app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , url = require('url');

var doc_root = config.doc_root;


var users = {}; //List of Connected Users

var environmentEvents = {}; //List of Environmental Objects and their states

app.listen(parseInt(config.http_port));


/*
 * Send to http(s) server connection
 *
 * @param req - Data included in request (IP Address, HTTP headers, url, etc.)
 * @param res - Data sent back to browser from server
 * @param pathname - URL pathname
 * @param fullpath - full path to file
 */

/* send a URL pathname at file fullpath from a req to a res */
function send(req, res, pathname, fullpath)
{
    fs.readFile(fullpath,
    function(err, data) {
        if (err) {
            res.writeHead(500);
            res.end('Error getting ' + pathname);
            console.error('[' + err + ']');
            return;
        }

        res.writeHead(200);
        res.end(data);
        console.log('sent: ' + pathname + ' to: ' + req.connection.remoteAddress);
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
  socket.on('newconnection', function()
  {
	// Add the new client to the list of all clients
	console.log("New user is connecting...");
	try {
		io.emit('firstupdate', users);
    } catch (e) {
		console.log(e);
	}
  });
 
 /*
  * Received when a new client has successfully updated
  * for the first time
  *
  * @param name - client's username
  * @param pos - client's start position in the scene
  * @param rot - client's start rotation in the scene
  */
  socket.on('login', function(name, pos, rot, avatar)
  {
    console.log("New user '" + name + "' has connected.");
    
    socket.username = name;
    
    users[name] = [name, pos, rot, avatar];

    // Inform all clients to update and account for the new user.
	try {
		io.emit('newuser', users[name], users);
	} catch (e) {
		console.log(e);
	}
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
	  io.emit('notification', message, users);
	  
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
      
      io.emit('toggleLamp', users);
      
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
