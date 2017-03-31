
var socket;
var source = "web";
var publicName;
var uniqueId;
var spawnPosition = {"x": 2, "y": 1.5, "z": 5};
var spawnOrientation = [{"x": 0, "y": 0, "z": 0}, 0];
var pos = {};
var rot = {};
var avatarType = "avatars/FemaleTeen_aopted.x3d";
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

//-------------------------------------------------------
/*
 * Initialized on document load and establishes 
 * socket callbacks
 */
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

			pos = spawnPosition;
			rot = spawnOrientation;

			var startPacket = [source, publicName, pos, rot, avatarType];

            socket.emit('newconnection', startPacket);

           //-------------------------------------------------------
		   /*
			* Triggered when client connects for the first time
			*/
            socket.on('initiate', function(myId, userList) {

				console.log("Initiate");

				// Save unique id provided by server

				uniqueId = myId;

				// If no public name was entered in the prompt,
				// name defaults to unique id

				if (publicName == "") {

					publicName = myId;
				}

                var avatarGroup = getElementById("avatarGroup");
                avatarGroup.innerHTML = "";
                var scene = document.getElementsByTagName("Scene")[0];
                
				var userConsole = getElementById("users");
				userConsole.innerHTML = "";

				//Add content for each of the users

                for (var key in userList) {

					//current = [source, publicName, pos, rot, avatarType, ...];

                    var current = userList[key];
					var currentSource = current[0];

					console.log(currentSource);

					switch (currentSource) {

						case "web" :

		                    //Generate a Transform for key's avatar

        		            var userAvatar = document.createElement('Transform');
                		    userAvatar.setAttribute("translation", "0 -.5 .5");
                    		userAvatar.setAttribute("rotation", "0 0 0 0");
                    		userAvatar.setAttribute("id", key + "Avatar");

                    		//Generate x3d model of avatar

                    		var characterOfAvatar = document.createElement('inline');
                    		characterOfAvatar.setAttribute("id", key + "Inline");

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
                        		socket.emit('chatMessage', "", welcomeMessage);
                    		} 

                    		//if adding someone else, add them to the group of other avatars
                    		else {

                        		avatarGroup.appendChild(userAvatar)
                    		}

							//Add user to HTML console
							var current = userList[key];
    		        		var userListEntry = document.createElement('span');
        		    		var newPLine = document.createElement('p');
           					userListEntry.setAttribute("id", key);
           					userListEntry.innerHTML = (userList[key][1] + " observing at: " + current[2].x +
                   				", " + current[2].y + ", " + current[2].z);
            				userConsole.appendChild(newPLine);					
            				userConsole.appendChild(userListEntry);
						
							break;

						case "kinect" :

							break;

						default :

							break;
					}
                }
            });

           //-------------------------------------------------------
		   /*
			* Triggered when a new user connects
			*/
            socket.on('addUser', function(newestUser, userId) {	

                console.log("New User Fired");

				var userSource = newestUser[0];

				switch (userSource) {

					case "web" :

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

                		//Update HTML Console

                		console.log("Adding User: ", userId);
        				var userList = getElementById("users");
       					var userListEntry = document.createElement('span');;
       					var newPLine = document.createElement('p');
        				userListEntry.setAttribute("id", userId);
        				userListEntry.innerHTML = (newestUser[1] + " observing at: " +
                			newestUser[2].x + ", " + newestUser[2].y + ", " +
                			newestUser[2].z);
        				userList.appendChild(newPLine);
        				userList.appendChild(userListEntry);

						break;

					case "kinect" :

						break;

					default :

						break;
				}
            });

           //-------------------------------------------------------
		   /*
			* Hit when another client is leaving the scene
			*/
			socket.on('deleteUser', function(user, id) {

				var userSource = user[0];

				switch (userSource) {

					case "web" :

						// Remove the avatar from the scene.
                		var removeAvatar = document.getElementById(id + "Avatar");

                		if(removeAvatar != null) {

                    		var avatars = getElementById("avatarGroup");
                    		avatars.removeChild(removeAvatar);
                		}

                		//Remove User's HTML Content
                		var users = getElementById("users");
        				var remove = getElementById(id);
        				users.removeChild(remove);

						break;

					case "kinect" :

						break;

					default :

						break;
				}
			});

           //-------------------------------------------------------
		   /*
			* Hit when a client changes their position
			*/
			socket.on('clientUpdate', function(user, id) {

				console.log("Update Fired");

				//user = [source, publicName, pos, rot, avatarType, ...];

				var userSource = user[0];

				var userTransform = document.getElementById(id + "Bundle");

               	if (userTransform == null) {

               		userTransform = document.getElementById(id + "Avatar");

                    if (userTransform == null) {
					
						return;
                    }
                }	
				
				switch (userSource) {

					case "web" :

						if (user[4] != avatarType) {
							avatarType = user[4];
                			var userAvatar = getElementById(id + "Inline");
               				userAvatar.setAttribute("url", user[4]);  
						}

						userTransform.setAttribute("translation", user[2].x + " " + 
						user[2].y + " " + user[2].z);

						userTransform.setAttribute("rotation", user[3][0].x + " " + 
							user[3][0].y + " " + user[3][0].z + " " +
							user[3][1]);
                
						//Update HTML Console

                		getElementById(id).innerHTML = (user[1] + " observing at: " 
							+ user[2].x + "," + user[2].y + ", " + user[2].z);
	
						break;

					case "kinect" :

						break;

					default :

						break;
				}
			});
            
		   //-------------------------------------------------------
		   /*
			* Triggered when a message has been posted to the chatroom
			*/
			socket.on('chatUpdate', function(userName, message) {

				var newMessage = document.createElement('li');

				if (userName != "") {

					var nameTag = document.createElement('span');
					nameTag.innerHTML = "<em>" + userName + "</em>";

					newMessage.appendChild(nameTag);
                	newMessage.appendChild(document.createElement("br"));
	                newMessage.appendChild(document.createTextNode(message));

				} else {

					var note = document.createElement('span');
					note.innerHTML = "<em>" + message + "</em>";
					newMessage.appendChild(note);
				}

                getElementById("messages").appendChild(newMessage);
			});

		   //-------------------------------------------------------
		   /*
			* Triggered when a message has been posted to the chatroom
			*/
			socket.on('sceneUpdate', function(id, state) {

                var lightBulb = getElementById("mw__" + id);

                var mat = lightBulb.getElementsByTagName("Material");

                if (!state) {

                    mat[0].setAttribute("diffuseColor", ".64 .69 .72");
                } 
				else {
                    
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
                    avatar.setAttribute("translation", "0 -.5 .5");
                }

                //Switch to third person view by pressing 3
                else if(e.keyCode === 51) {

                    console.log("Change to Third Person View");
                    avatar.setAttribute("translation", "0 -.5 -.5");
                }
            });
        });

		configureScene();
     	configurePage();

        //Add listener to lamp button
        var lampToggle2 = document.getElementById("mw__lampButton2");

        if(lampToggle2) {
            
			lampToggle2.addEventListener("click", function() {

				socket.emit('environmentChange', "lamp2");
			});
		}

        //Add listener to lamp button
        var lampToggle1 = document.getElementById("mw__lampButton1");

        if(lampToggle1) {
            
			lampToggle1.addEventListener("click", function() {

				socket.emit('environmentChange', "lamp1");
			});
		}
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
        camera.addEventListener('viewpointChanged', sendUpdate);
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

			console.log("Avatar change");

			var packet = [source, publicName, pos, rot, selectAvatar.value];

			socket.emit('serverUpdate', uniqueId, packet);
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
	* Send position data to server if change is great than 1cm
	*/
	function sendUpdate(e) {

		if (uniqueId != null) {

			if (Math.abs(pos.x - e.position.x) >= .001 ||
				Math.abs(pos.y - e.position.y) >= .001 ||
				Math.abs(pos.z - e.position.z) >= .001) {	
						
				pos = e.position;
				rot = e.orientation;

				var packet = [source, publicName, pos, rot, avatarType];

				socket.emit('serverUpdate', uniqueId, packet);
			}
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
        socket.emit('chatMessage', publicName, message);
    }
}
