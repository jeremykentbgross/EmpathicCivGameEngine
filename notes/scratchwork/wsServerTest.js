var path = require("path");
var http = require("http");
var express = require("express");



//http file server
var expressApp = express.createServer();
//needed to open more sockets:
var httpServer = http.createServer(expressApp);


expressApp.get(
	'/'
	,function webGetHome(req, res)
	{
		//console.log(req, res);
		res.sendfile(
			path.join(path.dirname(__filename), 'wsServerTestClient.html')
		);
	}
);

httpServer.listen(
	80
	//,this.webHostAddress	//Note: if this is here it cannot be accessed elsewhere
);






//server function
function verifyClient(inInfo, inClientVerifiedFunction)
{
	console.trace();
	console.log(arguments);
	//console.log(inInfo, inClientVerifiedFunction);
	
	//TODO find user if they exist, otherwise create a new one or boot them.
	inClientVerifiedFunction(true);
}


//http://www.iana.org/assignments/websocket/websocket.xml#subprotocol-name
var wsLib = require('ws');
var WebSocketServer = wsLib.Server;
var WebSocket = wsLib.WebSocket;
var webSocketServer = new WebSocketServer(
	//options
	{			
		//host String
//		port : 5000,	//Number
		server : httpServer, //http.Server
		verifyClient : verifyClient	//Function
		//path String
		//noServer Boolean
		//disableHixie Boolean
		//clientTracking Boolean
	}
	//callback function(???)
);
/*
webSocketServer.close([code], [data]);//closes server and all client sockets
webSocketServer.handleUpgrade(request, socket, upgradeHead, callback)
webSocketServer.on('error', function(inError){});
webSocketServer.on('headers', function(inHeaders){});
webSocketServer.on('connection', function(inSocket){});
*/






/*
webSocket = new ws.WebSocket(
	address,//String|Array
	//options
	{
		protocol String
		protocolVersion Number|String
		-- the following only apply if address is a String
		host String
		origin String
		pfx String|Buffer
		key String|Buffer
		passphrase String
		cert String|Buffer
		ca Array
		ciphers String
		rejectUnauthorized Boolean
	}
);
Instantiating with an address creates a new WebSocket client object. If address is an Array (request, socket, rest), it is instantiated as a Server client (e.g. called from the ws.Server).

websocket.bytesReceived	//Received bytes count.
websocket.readyState	//WebSocket.CONNECTING, WebSocket.OPEN, WebSocket.CLOSING, WebSocket.CLOSED.
websocket.protocolVersion	//The WebSocket protocol version used for this connection, 8, 13 or hixie-76 (the latter only for server clients).
websocket.url	//The URL of the WebSocket server (only for clients)
websocket.supports	//Describes the feature of the used protocol version. E.g. supports.binary is a boolean that describes if the connection supports binary messages.
websocket.close([code], [data])	//Gracefully closes the connection, after sending a description message
websocket.pause()	//Pause the client stream
websocket.ping([data], [options], [dontFailWhenClosed])	//Sends a ping. data is sent, options is an object with members mask and binary. dontFailWhenClosed indicates whether or not to throw if the connection isnt open.
websocket.pong([data], [options], [dontFailWhenClosed])	//Sends a pong. data is sent, options is an object with members mask and binary. dontFailWhenClosed indicates whether or not to throw if the connection isnt open.
websocket.resume()	//Resume the client stream
websocket.send(data, [options], [callback])	//Sends data through the connection. options can be an object with members mask and binary. The optional callback is executed after the send completes.
websocket.stream([options], callback)	//Streams data through calls to a user supplied function. options can be an object with members mask and binary. callback is executed on successive ticks of which send is function (data, final).
websocket.terminate()	//Immediately shuts down the connection

websocket.onopen
websocket.onerror
websocket.onclose
websocket.onmessage	//Emulates the W3C Browser based WebSocket interface using function members.
websocket.addEventListener(method, listener)	//Emulates the W3C Browser based WebSocket interface using addEventListener.

Event: 'error'	function (error) { }	//If the client emits an error, this event is emitted (errors from the underlying net.Socket are forwarded here).
Event: 'close'	function (code, message) { }	//Is emitted when the connection is closed. code is defined in the WebSocket specification.
	//The close event is also emitted when then underlying net.Socket closes the connection (end or close).
Event: 'message'	function (data, flags) { }	//Is emitted when data is received. flags is an object with member binary.
Event: 'ping'	function (data, flags) { }	//Is emitted when a ping is received. flags is an object with member binary.
Event: 'pong'	function (data, flags) { }	//Is emitted when a pong is received. flags is an object with member binary.
Event: 'open'	function () { }	//Emitted when the connection is established.
*/





//socket function
function onOpen()
{
	console.trace();
	console.log(arguments);
}

//socket function
function onError(inError)
{
	if(inError)
	{
		console.error(inError);
	}
}

function onClose(inCode, inMessage)
{
	console.trace();
	console.log(inCode);
	console.log(inMessage);
	console.log(arguments);
}

//socket function
function onMessage(inMessage, inFlags)
{
	console.trace();
	console.log('Flags:', inFlags);
	console.log('TypeOf:', typeof inMessage);
	if(typeof inMessage === 'string')
	{
		console.log('Message:', inMessage);
	}
	else
	{
		console.log('binary:', new Uint8Array(inMessage));
	}
	
	var binary = new Float32Array(20);
	for (var i = 0; i < binary.length; i++) {
		binary[i] = Math.random();
		console.log("Creating: " + binary[i]);
	}
	this.send(
		binary/*.buffer*/,
		{binary: true/*, mask: true*/},
		onError
	);
}








/*
webSocketServer.close([code], [data]);//closes server and all client sockets
webSocketServer.handleUpgrade(request, socket, upgradeHead, callback)
*/

//server function
//webSocketServer.on('error', function(inError){});
/*function onError(inError)
{
	if(inError)
	{
		console.error(inError);
	}
}*/
webSocketServer.on('error', onError);


//server function
//webSocketServer.on('headers', function(inHeaders){});
function onHeaders(inHeaders)
{
	console.trace();
	console.log(inHeaders);
}
webSocketServer.on('headers', onHeaders);

//server function
//webSocketServer.on('connection', function(inSocket){});
function onClientConnected(inWebSocket)
{
	console.trace();
	console.log(inWebSocket);
	
	inWebSocket.on('open', onOpen);	//not ever recieved, I think because we are connected to, not connecting
	inWebSocket.on('error', onError);
	inWebSocket.on('close', onClose);
	inWebSocket.on('message', onMessage);
	
	inWebSocket.send('something', {}, onError);
	
	setInterval(
		function()
		{
			inWebSocket.send("don't close on me now", {}, onError);
		},
		1000
	);
	
	setInterval(
		function()
		{
			inWebSocket.close();
		},
		20000
	);
}
webSocketServer.on('connection', onClientConnected);








