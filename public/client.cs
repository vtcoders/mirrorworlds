body {
    margin: 0 auto;
	font: 13px Helvetica, Arial; 
}

p {
	margin-top:0;
	margin-bottom:0
}

#x3d {
    max-height: 80%;
    max-width: 90%;
    min-height: 400px;
    min-width: 700px;
    border: none;
}

#x3dContent {
    height: 100%;
    width: 100%;
}

#info {
    display: inline-block;
    max-height: height: 20%;
    min-height: 200px;
    margin-top: 10px;
    margin-left: 5px;
}

#sidebar {
    position: absolute;
    width: 300px;
    top: 0;
	right: 0;
    bottom: 0;
}

#maxButton {
    visibility: hidden;
    right: 0;
}

#minButton {
    visibility: visible;
}

.minmaxB {
	position: fixed;
    display: inline-block;
    height: 100%;
	padding-left: 10px;
	padding-right: 10px;
    background: #DDD;
    border: none;
}

#content {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    padding: 0;
    width: 273px;
    visibility: visible;
	background: #FFF;
}

#toolbar {
    height: 100px;
    padding: 20px;
}

#messageBlock {
	position: fixed;
    width: 100%;
    top: 200px;
    bottom: 0;
}

#messages {
	list-style-type: none; 
	margin: 0; 
	padding: 0;
    top: 0;
}

#messages li {
	padding: 5px 10px;
}

#messages li:nth-child(odd) { 
	background: #eee; 
}

#inputField {
	position: absolute;
	bottom: 10px;
	left: 10px;
	width: 190px;
	height: 25px;
}

#sendButton { 
	position: fixed;
	bottom: 10px;
    right: 10px;
    height: 30px;
	width: 50px;
	background: rgb(130, 224, 255);
	border: none;
}
