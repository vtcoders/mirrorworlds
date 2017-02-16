
var socket;
var name;
var spawnPosition = {"x": 2, "y": 1.5, "z": 5};
var spawnOrientation = [{"x": 0, "y": 0, "z": 0}, 0];
var avatarType = "avatars/teapot.x3d";
var model;
var exit;


//-------------------------------------------------------
/* Failure Exit */
function exit() {

    var text = "Something has gone wrong";
    for(var i=0; i < arguments.length; ++i)
        text += "\n" + arguments[i];
    console.log(text);
    alert(text);
    window.stop();
}


//-------------------------------------------------------
/*
 * A wrapper of document.getElementById(id)
 */
function getElementById(id) {

    var element = document.getElementById(id);

    if(element == null)
        exit("document.getElementById(" + id + ") failed");
    return element;
}


function init() {

    var model = getElementById('mw_model');

    // default model
    // TODO: make this url path more relative so it works with URL=file://

    if(location.search.match(/.*(\?|\&)file=.*/) != -1)
        var url = location.search.replace(/.*(\?|\&)file=/,'').replace(/\&.*$/g, '');

    if(typeof url == undefined || url.length < 1) {

        // The default mode
        // This is the only place that we declare this.
        var url = '/mw/example.x3d';
    }

    model.url = url;


    model.onload = function() {

        name = prompt("Enter your name:");

        if(name === null || name.length < 1) {

            // TODO: do more for this case?
            return;
        }

        socket = new io.connect('');

        socket.on('connect', function() {

            socket.on('disconnect', function() {				

                socket.disconnect();

                socket.removeAllListeners();

                socket = null;

                exit('server at ' + location.host + ' disconnected');
            });

            socket.emit('newconnection', name, spawnPosition, spawnOrientation,
                    avatarType);

            socket.on('initiate', function(fullListOfUsers) {

                //Adds Avatar to X3D scene for new user
                var avatarGroup = getElementById("avatarGroup");
                avatarGroup.innerHTML = "";
                var scene = document.getElementsByTagName("Scene")[0];

                for (var key in fullListOfUsers) {

                    var current = fullListOfUsers[key];

                    //Generate a Transform for key's avatar
                    var userAvatar = document.createElement('Transform');
                    userAvatar.setAttribute("translation", "0 0 5");
                    userAvatar.setAttribute("rotation", "0 0 0 0");
                    userAvatar.setAttribute("id", key + "Avatar"); 

                    //Generate x3d model of avatar
                    var characterOfAvatar = document.createElement('inline');
                    characterOfAvatar.setAttribute("id", key + "Inline");

                    //current[3] == user's choice of avatar
                    characterOfAvatar.setAttribute("url", current[3]);

                    //Add x3d model to the avatar Transform
                    userAvatar.appendChild(characterOfAvatar);

                    //if adding self, add to a bundle with camera
                    if(current[0] == name) {
                        var userBundle = document.createElement('Transform');
                        userBundle.setAttribute("id", key + "Bundle");
                        userBundle.setAttribute("translation", current[1].x + " " +
                                current[1].y + " " + current[1].z);

                        userBundle.setAttribute("rotation", current[2][0].x + " " +
                                current[2][0].y + " " + current[2][0].z + " " +
                                current[2][1]);

                        var scene = document.getElementsByTagName("Scene")[0];

                        scene.appendChild(userBundle);
                        userBundle.appendChild(userAvatar);

                        //Add a message to the chat window that someone is joining
                        var welcomeMessage = "" + name + " is joining the scene.";
                        socket.emit('newnote', welcomeMessage);

                    } 

                    //if adding someone else, add them to the group of other avatars
                    else {

                        avatarGroup.appendChild(userAvatar)
                    }
                }

                //Build the list of connected users
                buildList(fullListOfUsers);

            });

            socket.on('newuser', function(newestUser) {	

                console.log("New User Fired");

                var duplicateNames = document.getElementById(newestUser[0]);

                if(newestUser[0] != null && name != newestUser[0] &&
                        duplicateNames == null) {	

                    //Add Users Avatar
                    var avatarGroup = getElementById("avatarGroup");

                    var userAvatar = document.createElement('Transform');

                    userAvatar.setAttribute("translation", newestUser[1].x + " " +
                            newestUser[1].y + " " + newestUser[1].z);
                    userAvatar.setAttribute("rotation", newestUser[2][0].x + " " +
                            newestUser[2][0].y + " " + newestUser[2][0].z + " " +
                            newestUser[2][1]);

                    userAvatar.setAttribute("id", newestUser[0] + "Avatar");

                    console.log("Created node: " + userAvatar.getAttribute("id"));

                    var inlineElement = document.createElement('inline');
                    inlineElement.setAttribute("id", newestUser[0] + "Inline");
                    inlineElement.setAttribute("url", newestUser[3]);

                    userAvatar.appendChild(inlineElement);
                    avatarGroup.appendChild(userAvatar);

                    //Update HTML
                    addUser(newestUser);
                }
            });

            socket.on('update', function(updatedUser) {

                console.log("Update Fired");

                var userTransform = document.getElementById(updatedUser[0] + "Bundle");

                if(userTransform == null) {

                    userTransform = document.getElementById(updatedUser[0] +
                            "Avatar");

                    if(userTransform == null) {
                        return;
                    }
                }

                userTransform .setAttribute("translation", updatedUser[1].x +
                        " " + updatedUser[1].y + " " + updatedUser[1].z);

                userTransform .setAttribute("rotation", updatedUser[2][0].x +
                        " " + updatedUser[2][0].y + " " + updatedUser[2][0].z +
                        " " + updatedUser[2][1]);

                //Update HTML
                updateList(updatedUser);

            });

            socket.on('deleteuser', function(removableUser) {

                console.log("Delete Fired");

                // Remove the avatar from the scene.
                var removeAvatar = document.getElementById(removableUser[0] + "Avatar");

                if(removeAvatar != null) {

                    var avatars = getElementById("avatarGroup");
                    avatars.removeChild(removeAvatar);
                }

                //Remove User's HTML Content
                removeUser(removableUser);
            });

            //-------------------------------------------------------
            /*
             * Triggered when someone changes their avatar
             *
             */
            socket.on('changeAvatar', function(userName, avatar) {

                var userAvatar = getElementById(userName + "Inline");
                userAvatar.setAttribute("url", avatar);    
            });

            //-------------------------------------------------------
            /*
             * Triggered when a message has been posted to the chatroom
             *
             */
            socket.on('newmessage', function(userName, message) {

                var newMessage = document.createElement('li');

                var nameTag = document.createElement('span');
                nameTag.innerHTML = "<em>" + userName + "</em>";

                newMessage.appendChild(nameTag);
                newMessage.appendChild(document.createElement("br"));
                newMessage.appendChild(document.createTextNode(message));

                getElementById("messages").appendChild(newMessage);
            });

            //-------------------------------------------------------
            /*
             * Triggered when a notification has been posted to the chatroom
             */
            socket.on('notification', function(message) {

                var note = document.createElement('li');

                var noteText = document.createElement('span');
                noteText.innerHTML = "<em>" + message + "</em>";

                note.appendChild(noteText);

                getElementById("messages").appendChild(note);
            });

            //-------------------------------------------------------
            /*
             * Triggered when someone toggles the lamp in the scene
             */
            socket.on('updateEnvironment', function(state) {

                var lightBulb = getElementById("mw__lamp1");

                var mat = lightBulb.getElementsByTagName("Material");

                var status = mat[0].getAttribute("diffuseColor");

                if (status == ".95, .9, .25") {
                    mat[0].setAttribute("diffuseColor", ".64 .69 .72");
                } else {
                    mat[0].setAttribute("diffuseColor", ".95, .9, .25");
                }
            });

            //-------------------------------------------------------
            /*
             * Toggle Camera View 
             */
            window.addEventListener('keypress', function(e) {

                var avatar = getElementById(name + "Avatar");

                //Switch to first person view by pressing 1
                if(e.keyCode === 49) {

                    console.log("Change to First Person View");
                    avatar.setAttribute("translation", "0 0 5");
                }

                //Switch to third person view by pressing 3
                else if(e.keyCode === 51) {

                    console.log("Change to Third Person View");
                    avatar.setAttribute("translation", "0 0 -5");
                }
            });

        });

        configureScene();
        configurePage();

    }

    //-------------------------------------------------------
    /*
     * Sets up the X3D scene
     */
    function configureScene()
    {
        //Set up camera to provide location data
        var x3d = document.getElementsByTagName("X3D")[0];
        var camera = x3d.runtime.getActiveBindable("Viewpoint");

		if (camera == undefined) {

			camera = document.createElement("viewpoint");
			var scene = x3d.getElementsByTagName("Scene");

			scene[0].appendChild(camera);

			spawnPosition = {"x": 2, "y": 1.5, "z": 5};
			spawnOrientation = [{"x": 0, "y": 0, "z": 0}, 0];

        	camera.setAttribute("position", "2 1.5 5");
			camera.setAttribute("orientation", "0 0 0 0");
		} 
		else {

			spawnPosition = camera.getAttribute("position");
			spawnOrientation = camera.getAttribute("orientation");
		}

        //Add listener to camera to update server with location data
        camera.addEventListener('viewpointChanged', positionUpdated);

        //Add listener to lamp button
        var lampToggle = document.getElementById("mw__lampToggle");

        if(lampToggle) {
            console.log("Adding Event Listener");
            
            lampToggle.addEventListener('click', function(e) {
                console.log("You toggled the lamp!");
                socket.emit('environmentChange');
            });
        }
    }

    //-------------------------------------------------------
    /*
     * Sets up chat window and user toolbar
     */
    function configurePage() 
    {
        //Add listener to update server with avatar selection
        var selectAvatar = getElementById("selectAvatar");

        selectAvatar.addEventListener('change', function() {

            socket.emit('newavatar', name, selectAvatar.value);
        });

        //Initialize buttons and listeners for chat function
        var sendButton = getElementById("sendButton");
        sendButton.addEventListener('click', sendMessage);

        var formDiv = getElementById("inputField");
        formDiv.addEventListener('keypress', function(e) {

            if(e.keyCode == 13) {

                sendMessage();
            }
        });

        //Minimize and Maximize functionality for sidebar
        var minButton = getElementById("minButton");
        var maxButton = getElementById("maxButton");
        var sidebarContent = getElementById("sideBar");

        minButton.addEventListener('click', function(e) {

            sidebarContent.className = "inactive";
            minButton.className = "minmaxB inactive";
            maxButton.className = "minmaxB active";
        });

        maxButton.addEventListener('click', function(e) {

            sidebarContent.className = "active";
            minButton.className = "minmaxB active";
            maxButton.className = "minmaxB inactive";
        });
    }



    //-------------------------------------------------------
    /*
     * Sends position data to server
     */
    function positionUpdated(e)
    {	
        var pos = e.position;
        var rot = e.orientation;

        //Tell the server that this client has moved and send new location data
        socket.emit('updateposition', name, pos, rot, avatarType);
    }

    //-------------------------------------------------------
    /*
     * Sends the specified message to all connected users in the chatroom
     */
    function sendMessage(memo) {

        var message = memo;

        if(message == null) {

            var field = getElementById('inputField');
            message = field.value;
            field.value = "";

        }

        console.log("Sending a Message!");
        socket.emit('chatmessage', name, message);
    }

    //-----------------------------
    // HTML Manipulators
    //-----------------------------

    /*
     * Builds HTML list of connected users
     *
     * @param fullListOfUsers - the list of connected users
     */
    function buildList(fullListOfUsers)
    {
        var userList = getElementById("users");
        userList.innerHTML = "";

        //Add each user to the HTML list
        for (var key in fullListOfUsers)
        {
            var current = fullListOfUsers[key];
            var userListEntry = document.createElement('span');
            var newPLine = document.createElement('p');
            userListEntry.setAttribute("id", key);
            userListEntry.innerHTML = (key + " observing at: " + current[1].x +
                    ", " + current[1].y + ", " + current[1].z);
            userList.appendChild(newPLine);					
            userList.appendChild(userListEntry);
        }
    }

    /*
     * Adds a new user to the HTML list of users
     *
     * @param newestUser - user to be added to the list
     */
    function addUser(newestUser)
    {
        console.log("Adding User: ", newestUser[0]);
        var userList = getElementById("users");
        var userListEntry = document.createElement('span');
        var newPLine = document.createElement('p');
        userListEntry.setAttribute("id", newestUser[0]);
        userListEntry.innerHTML = (newestUser[0] + " observing at: " +
                newestUser[1].x + ", " + newestUser[1].y + ", " +
                newestUser[1].z);
        userList.appendChild(newPLine);
        userList.appendChild(userListEntry);
    }

    /*
     * Removes a user from the HTML list of users
     *
     * @param goodbyeUser - user to be deleted
     */
    function removeUser(goodbyeUser)
    {
        var users = getElementById("users");
        var remove = getElementById(goodbyeUser[0]);
        users.removeChild(remove);
    }

    /*
     * Updates the HTML list with new position data
     *
     * @param updateUser - the updated user
     */
    function updateList(updateUser)
    {
        getElementById(updateUser[0]).innerHTML = 
            (updateUser[0] + " observing at: " +
             updateUser[1].x + ", " + updateUser[1].y + 
             ", " + updateUser[1].z);
    }

}
