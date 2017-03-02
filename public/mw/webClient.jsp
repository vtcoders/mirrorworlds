
var source = "web";
var socket;
var publicName;
var uniqueId;
var spawnPosition;
var spawnOrientation;
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

        publicName = prompt("Enter your name:");

        if(publicName === null || publicName.length < 1) {

            publicName = "";
        }

        socket = new io.connect('');

        socket.on('connect', function() {

            socket.on('disconnect', function() {				

                socket.disconnect();

                socket.removeAllListeners();

                socket = null;

                exit('server at ' + location.host + ' disconnected');
            });

			console.log("Emitting New Connection");

            socket.emit('newconnection', source, publicName, spawnPosition, spawnOrientation,
                    avatarType);

            socket.on('initiate', function(myId, userList) {

				console.log("Initiate");

				uniqueId = myId;

				if (publicName == "") {

					publicName = myId;
				}

                var avatarGroup = getElementById("avatarGroup");
                avatarGroup.innerHTML = "";
                var scene = document.getElementsByTagName("Scene")[0];
                
				var userConsole = getElementById("users");
				userConsole.innerHTML = "";

                for (var key in userList) {

                    var current = userList[key];

                    //Generate a Transform for key's avatar
                    var userAvatar = document.createElement('Transform');
                    userAvatar.setAttribute("translation", "0 0 5");
                    userAvatar.setAttribute("rotation", "0 0 0 0");
                    userAvatar.setAttribute("id", key + "Avatar");

                    //Generate x3d model of avatar
                    var characterOfAvatar = document.createElement('inline');
                    characterOfAvatar.setAttribute("id", key + "Inline");

                    //current[3] == user's choice of avatar
                    characterOfAvatar.setAttribute("url", current[4]);

                    //Add x3d model to the avatar Transform
                    userAvatar.appendChild(characterOfAvatar);

                    //if adding self, add to a bundle with camera
                    if(key == uniqueId) {
                        var userBundle = document.createElement('Transform');
                        userBundle.setAttribute("id", key + "Bundle");
                        userBundle.setAttribute("translation", current[2].x + " " +
                                current[2].y + " " + current[2].z);

                        userBundle.setAttribute("rotation", current[3][0].x + " " +
                                current[3][0].y + " " + current[3][0].z + " " +
                                current[3][1]);

                        var scene = document.getElementsByTagName("Scene")[0];

                        scene.appendChild(userBundle);
                        userBundle.appendChild(userAvatar);

                        //Add a message to the chat window that someone is joining
                        var welcomeMessage = "" + publicName + " is joining the scene.";
                        socket.emit('newnote', welcomeMessage);

                    } 

                    //if adding someone else, add them to the group of other avatars
                    else {

                        avatarGroup.appendChild(userAvatar)
                    }

					//Add user to user console
					var current = userList[key];
            		var userListEntry = document.createElement('span');
            		var newPLine = document.createElement('p');
           			userListEntry.setAttribute("id", key);
           			userListEntry.innerHTML = (userList[key][1] + " observing at: " + current[2].x +
                   		", " + current[2].y + ", " + current[2].z);
            		userConsole.appendChild(newPLine);					
            		userConsole.appendChild(userListEntry);

                }
            });

            socket.on('newuser', function(newestUser, userId) {	

                console.log("New User Fired");

                //Add Users Avatar
                var avatarGroup = getElementById("avatarGroup");

                var userAvatar = document.createElement('Transform');

                userAvatar.setAttribute("translation", newestUser[2].x + " " +
                        newestUser[2].y + " " + newestUser[2].z);
                userAvatar.setAttribute("rotation", newestUser[3][0].x + " " +
                        newestUser[3][0].y + " " + newestUser[3][0].z + " " +
                        newestUser[3][1]);

                userAvatar.setAttribute("id", userId + "Avatar");

                console.log("Created node: " + userAvatar.getAttribute("id"));

                var inlineElement = document.createElement('inline');
                inlineElement.setAttribute("id", userId + "Inline");
                inlineElement.setAttribute("url", newestUser[4]);

                userAvatar.appendChild(inlineElement);
                avatarGroup.appendChild(userAvatar);

                //Update HTML
                console.log("Adding User: ", userId);
        		var userList = getElementById("users");
       			var userListEntry = document.createElement('span');
       			var newPLine = document.createElement('p');
        		userListEntry.setAttribute("id", userId);
        		userListEntry.innerHTML = (newestUser[1] + " observing at: " +
                	newestUser[2].x + ", " + newestUser[2].y + ", " +
                	newestUser[2].z);
        		userList.appendChild(newPLine);
        		userList.appendChild(userListEntry);
            });

			/**
			 * Update X3D Scene based on source input
			 *
			 */

			socket.on('update', function(user, id) {

				//make updates based on source
				switch(user[0]) {

					case "web" :
						console.log("Update Fired");

              			var userTransform = document.getElementById(id + "Bundle");

                		if(userTransform == null) {

                    		userTransform = document.getElementById(id + "Avatar");

                   		 if(userTransform == null) {
                    		    return;
                   		 }
                		}

                		userTransform .setAttribute("translation", user[2].x +
                       		" " + user[2].y + " " + user[2].z);

                		userTransform .setAttribute("rotation", user[3][0].x +
                        	" " + user[3][0].y + " " + user[3][0].z +
                        	" " + user[3][1]);

                		//Update HTML
                		getElementById(id).innerHTML = (user[1] + " observing at: " 
							+ user[2].x + "," + user[2].y + ", " 
							+ user[2].z);

						break;

					default :

						console.log("Invalid source type.");
						break;
				}
			});

            socket.on('deleteuser', function(userId) {

                // Remove the avatar from the scene.
                var removeAvatar = document.getElementById(userId + "Avatar");

                if(removeAvatar != null) {

                    var avatars = getElementById("avatarGroup");
                    avatars.removeChild(removeAvatar);
                }

                //Remove User's HTML Content
                var users = getElementById("users");
        		var remove = getElementById(userId);
        		users.removeChild(remove);
            });

            //-------------------------------------------------------
            /*
             * Triggered when someone changes their avatar
             *
             */
            socket.on('changeAvatar', function(id, avatar) {

                var userAvatar = getElementById(id + "Inline");
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

                var avatar = getElementById(uniqueId + "Avatar");

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

		//Attach default camera if none exists
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

            socket.emit('newavatar', uniqueId, selectAvatar.value);
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

		if (uniqueId != null) {

			//Tell the server that this client has moved and send new location data
			socket.emit('updateposition', uniqueId, pos, rot);
		}
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
        socket.emit('chatmessage', uniqueId, message);
    }
}
