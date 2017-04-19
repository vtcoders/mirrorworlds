/**
* Executed when the page has finished loading.
*/
window.onload = function () {
    // Create a reference for the required DOM elements.
    var nameView = document.getElementById("name-view");
    var textView = document.getElementById("text-view");
    var buttonSend = document.getElementById("send-button");
    var buttonStop = document.getElementById("stop-button");
    var label = document.getElementById("status-label");
    //var chatArea = document.getElementById("chat-area");
    var buttonVideo = document.getElementById("video-button");
    var video = document.getElementById("video");
    //Changed by Bruce
    var bodylabel = document.getElementById("body-label");
    var buttonBody = document.getElementById("body-button");
    var bodies = document.getElementById("bodies");
    //var context = bodies.getContext("2d");  

    var buttonColor = document.getElementById("color-button");
    var camera = new Image();
    //camera.onload = function () {
    //    context.drawImage(camera, 0, 0);
    //}
    
    // Connect to the WebSocket server!
    var socket = new WebSocket("ws://localhost:8181");

    /**
    * WebSocket onopen event.
    */
    socket.onopen = function (event) {
        label.innerHTML = "Connection open";
    }
 
    /**
    * WebSocket onmessage event.
    */
    socket.onmessage = function (event) {
        if (typeof event.data === "string") {
        
            // Create a JSON object.
            var jsonObject = JSON.parse(event.data);

            console.log("Json Arrived");
            //context.fillStyle="#FFFFFF"; //Set white at an example
            //context.beginPath();
            //context.fillRect(0,0,640,480);
            //context.closePath();
            //context.fill();
                
             //Display the skeleton joints.
            for (var i = 0; i < jsonObject.skeletons.length; i++) { 
                // bones = populateBones(jsonObject.skeletons[i]);
                // boneCount = bones.length;
				var bonesX = [48];
				var bonesY = [48];
				var bonesZ = [48];
				var count = 0;
                for (var j = 0; j < jsonObject.skeletons[i].joints.length; j++) {
                    var joint = jsonObject.skeletons[i].joints[j];

                     //X3DOM stuff here
                        // Draw!!!                      
                        //context.translate(320,240);
                        //context.arc(joint.x * 400 +320, (-joint.y) * 400 +240, 5, 0, Math.PI * 2, true);
                        var x = joint.x;
                        var y = joint.y;
                        var z = joint.z;
						
						
						//  go through the json get each joint name .... get each element by its DEF (joint) name
			// change its translation atttribute to the x y z coords
    
					document.getElementById(joint.name).setAttribute("translation", x + " " + y + " " + z);
					
					// add point array here
					bonesX[count] = x;
					bonesY[count] = y;
					bonesZ[count] = z;
					count++;
					
				}
					document.getElementById('jointConnect').setAttribute("point", bonesX[3] + " " + bonesY[3] + " " + bonesZ[3] + " " + bonesX[2] + " " + bonesY[2] + " " + bonesZ[2] + " " + bonesX[2] + " " + bonesY[2] + " " + bonesZ[2] + " " + bonesX[20] + " " + bonesY[20] + " " + bonesZ[20] + " " + bonesX[20] + " " + bonesY[20] + " " + bonesZ[20] + " " + bonesX[8] + " " + bonesY[8] + " " + bonesZ[8] + " " + bonesX[8] + " " + bonesY[8] + " " + bonesZ[8] + " " + bonesX[9] + " " + bonesY[9] + " " + bonesZ[9] + " " + bonesX[9] + " " + bonesY[9] + " " + bonesZ[9] + " " + bonesX[10] + " " + bonesY[10] + " " + bonesZ[10] + " " + bonesX[10] + " " + bonesY[10] + " " + bonesZ[10] + " " + bonesX[11] + " " + bonesY[11] + " " + bonesZ[11] + " " + bonesX[11] + " " + bonesY[11] + " " + bonesZ[11] + " " + bonesX[23] + " " + bonesY[23] + " " + bonesZ[23] + " " + bonesX[11] + " " + bonesY[11] + " " + bonesZ[11] + " " + bonesX[24] + " " + bonesY[24] + " " + bonesZ[24] + " " + bonesX[20] + " " + bonesY[20] + " " + bonesZ[20] + " " + bonesX[4] + " " + bonesY[4] + " " + bonesZ[4] + " " + bonesX[4] + " " + bonesY[4] + " " + bonesZ[4] + " " + bonesX[5] + " " + bonesY[5] + " " + bonesZ[5] + " " + bonesX[5] + " " + bonesY[5] + " " + bonesZ[5] + " " + bonesX[6] + " " + bonesY[6] + " " + bonesZ[6] + " " + bonesX[6] + " " + bonesY[6] + " " + bonesZ[6] + " " + bonesX[7] + " " + bonesY[7] + " " + bonesZ[7] + " " + bonesX[7] + " " + bonesY[7] + " " + bonesZ[7] + " " + bonesX[21] + " " + bonesY[21] + " " + bonesZ[21] + " " + bonesX[7] + " " + bonesY[7] + " " + bonesZ[7] + " " + bonesX[22] + " " + bonesY[22] + " " + bonesZ[22] + " " + bonesX[20] + " " + bonesY[20] + " " + bonesZ[20] + " " + bonesX[1] + " " + bonesY[1] + " " + bonesZ[1] + " " + bonesX[1] + " " + bonesY[1] + " " + bonesZ[1] + " " + bonesX[0] + " " + bonesY[0] + " " + bonesZ[0] + " " + bonesX[0] + " " + bonesY[0] + " " + bonesZ[0] + " " + bonesX[12] + " " + bonesY[12] + " " + bonesZ[12] + " " + bonesX[12] + " " + bonesY[12] + " " + bonesZ[12] + " " + bonesX[13] + " " + bonesY[13] + " " + bonesZ[13] + " " + bonesX[13] + " " + bonesY[13] + " " + bonesZ[13] + " " + bonesX[14] + " " + bonesY[14] + " " + bonesZ[14] + " " + bonesX[14] + " " + bonesY[14] + " " + bonesZ[14] + " " + bonesX[15] + " " + bonesY[15] + " " + bonesZ[15] + " " + bonesX[0] + " " + bonesY[0] + " " + bonesZ[0] + " " + bonesX[16] + " " + bonesY[16] + " " + bonesZ[16] + " " + bonesX[16] + " " + bonesY[16] + " " + bonesZ[16] + " " + bonesX[17] + " " + bonesY[17] + " " + bonesZ[17] + " " + bonesX[17] + " " + bonesY[17] + " " + bonesZ[17] + " " + bonesX[18] + " " + bonesY[18] + " " + bonesZ[18] + " " + bonesX[18] + " " + bonesY[18] + " " + bonesZ[18] + " " + bonesX[19] + " " + bonesY[19] + " " + bonesZ[19]);
				
			}
    
            // // Extract the values for each key.
            // var userName = jsonObject.name;
           // var userMessage = jsonObject.message;

            // // Display message.
           // chatArea.innerHTML = chatArea.innerHTML + "<p>" + userName + " says: <strong>" + userMessage + "</strong>" + "</p>";

            // // Scroll to bottom.
           // chatArea.scrollTop = chatArea.scrollHeight;
            
        }
        else if (event.data instanceof Blob) {
        
                    // RGB FRAME DATA
            // 1. Get the raw data.
            var blob = event.data;

            // 2. Create a new URL for the blob object.
            window.URL = window.URL || window.webkitURL;

            var source = window.URL.createObjectURL(blob);

            // 3. Update the image source.
            camera.src = source;

            // 4. Release the allocated memory.
            window.URL.revokeObjectURL(source);
            
            // document.write("Got the bodies data as Blob");
            // // 1. Get the raw data.
            // var blob = event.data;
            
            // // 2. Create a new URL for the blob object.
            // window.URL = window.URL || window.webkitURL;

            // var source = window.URL.createObjectURL(blob);

            // // 3. Update the image source.
            // video.src = source;
            
            // // 4. Release the allocated memory.
            // window.URL.revokeObjectURL(source);
        }
    }

    /**
    * WebSocket onclose event.
    */
    socket.onclose = function (event) {
        var code = event.code;
        var reason = event.reason;
        var wasClean = event.wasClean;

        if (wasClean) {
            label.innerHTML = "Connection closed normally.";
        }
        else {
            label.innerHTML = "Connection closed with message: " + reason + " (Code: " + code + ")";
        }
    }

    /**
    * WebSocket onerror event.
    */
    socket.onerror = function (event) {
        label.innerHTML = "Error: " + event;
    }

    buttonVideo.onclick = function (event) {
        if (socket.readyState == WebSocket.OPEN) {
            socket.send("get-video");
        }
    }
    
    buttonBody.onclick = function(event){
        if (socket.readyState == WebSocket.OPEN) {
                socket.send("get-bodies");
            }
    }
    
    buttonColor.onclick = function(event){
        if (socket.readyState == WebSocket.OPEN) {
                socket.send("get-color");
            }
    }
    /**
    * Disconnect and close the connection.
    */
    buttonStop.onclick = function (event) {
        if (socket.readyState == WebSocket.OPEN) {
            socket.close();
        }
    }

    /**
    * Send the message and empty the text field.
    */
    buttonSend.onclick = function (event) {
        sendText();
    }

    /**
    * Send the message and empty the text field.
    */
    textView.onkeypress = function (event) {
        if (event.keyCode == 13) {
            sendText();
        }
    }

    /**
    * Send a text message using WebSocket.
    */
    function sendText() {
        if (socket.readyState == WebSocket.OPEN) {
            var json = '{ "name" : "' + nameView.value + '", "message" : "' + textView.value + '" }';
            socket.send(json);

            textView.value = "";
        }
    }
    
    
}
