/*
© Copyright 2012 Jeremy Gross
	jeremykentbgross@gmail.com
	Distributed under the terms of the GNU Lesser GPL (LGPL)
		
	This file is part of EmpathicCivGameEngine™.
	
	EmpathicCivGameEngine™ is free software: you can redistribute it and/or modify
	it under the terms of the GNU Lesser General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	
	EmpathicCivGameEngine™ is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Lesser General Public License for more details.
	
	You should have received a copy of the GNU Lesser General Public License
	along with EmpathicCivGameEngine™.  If not, see <http://www.gnu.org/licenses/>.
*/


/*
TODO:
	Events.IdentifiedUser			//GameRules spawn
	Events.ClientDisconnected		//GameRules unspawn
	Events.ConnectedToServer		//chat
	Events.DisconnectedFromServer	//chat
	Events.Msg						//chat
	Events.Data						//Not used!
	Events.NetObjects				//Not used!
*/


/*
User : Object
	-name
	-id
	-ping
	-connected
	-socket (server only??)
	-fb/pic/etc?
	-serialize if locally owned?, make local User
	-netgroup (there can only be one)
*/
/*
TODO put this back in:

//TODO make server id for smaller messages!!
ECGame.EngineLib.User = function User(inName, inID)
{
	this.userName = inName || "Guest";
	this.userID = inID || ECGame.EngineLib.User.USER_IDS.GUEST;
	//TODO use FB id or something in the future
};
ECGame.EngineLib.User.prototype.constructor = ECGame.EngineLib.User;

ECGame.EngineLib.User.USER_IDS =
{
	UNUSED : 0
	,SERVER : 1
	,GUEST : 2
	,NEW_USER : 3
	
	,CURRENT_MAX : 3	//enum max!
	
	,MAX_EVER : 65535
};
*/



/*
NetGroup	//1 netgroup per user, 0-many netgroups per object
	-users
		-socket	//need to keep alive, AND reconnect
	-objects{}
	-dirtylist[]
	-newlist[]
	-destroylist[]
	//-removelist[]???
	addObject(object)//all user objects should be added as objects
	{
		netcreate(object)
		object.listen(this)
	}
	removeObject()
	{
		object.unlisten(this)
		netDestroy()
	}
	addUser(inUser)
	{
		serialize all current objects to user
	}
	removeUser(inUser){???}
*/
ECGame.EngineLib.NetGroup = ECGame.EngineLib.Class.create({
	Constructor : function NetGroup()
	{
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		
	}
});




/*
FROM: //https://github.com/einaros/ws/blob/master/doc/ws.md

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
//Instantiating with an address creates a new WebSocket client object. If address is an Array (request, socket, rest), it is instantiated as a Server client (e.g. called from the ws.Server).

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
ECGame.EngineLib.ServerSideWebSocket = ECGame.EngineLib.Class.create({
	Constructor : function ServerSideWebSocket(inWebSocket, inNetwork)//_onClientConnected
	{
		this._myNetwork = inNetwork;
		this._myWebsocket = inWebSocket;
		inWebSocket.on('open', this._onOpen);	//not ever recieved, I think because we are connected to, not connecting
		inWebSocket.on('error', this._onError);
		inWebSocket.on('close', this._onClose);
		inWebSocket.on('message', this._onMessage);
		this._myWebsocket.ECGameSocket = this;
		//inNetwork.event IdentifiedUser TODO rename ClientConnected
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		_onOpen : function _onOpen()
		{
			console.trace();
			console.log(arguments);
		},

		_onClose : function _onClose(inCode, inMessage)//_onClientDisconnected
		{
			console.trace();
		//	console.log(inCode);
		//	console.log(inMessage);
			console.log(arguments);
			//inNetwork.event ClientDisconnected
		},
		
		_onMessage : function _onMessage(inMessage, inFlags)
		{
			//inNetwork.event Msg
			
		//	console.trace();
		//	console.log('Flags:', inFlags);
		//	console.log('TypeOf:', typeof inMessage);
			if(typeof inMessage === 'string')
			{
				console.log('Message:', inMessage);
			}
			else
			{
				console.log('binary:', new Uint8Array(inMessage));
			}
			
			/*var binary = new Float32Array(20);
			for (var i = 0; i < binary.length; i++) {
				binary[i] = Math.random();
				console.log("Creating: " + binary[i]);
			}
			this.send(
				binary//.buffer
				,{binary: true
				//, mask: true},
				onError
			);*/
		},
		
		_onError : function _onError(inError)
		{
			if(inError)
			{
				console.error(inError);
			}
		},
		
		send : function send(inData)
		{
			this._myWebsocket.send(
				inData//.buffer
				,{
					binary : (typeof inData !== 'string')
					//, mask: true
				},
				this._onError
			);
		},
		
		close : function close(inCode, inReason)
		{
			this._myWebsocket.close(inCode, inReason);
		}
		
		//TODO getStatus
		//websocket.readyState	//WebSocket.CONNECTING, WebSocket.OPEN, WebSocket.CLOSING, WebSocket.CLOSED.
	}
});


//http://www.w3.org/TR/websockets/#the-websocket-interface
ECGame.EngineLib.ClientSideWebSocket = ECGame.EngineLib.Class.create({
	Constructor : function ClientSideWebSocket(inNetwork)
	{
		this._myNetwork = inNetwork;
		if(ECGame.Settings.Network.GamePort !== null)
		{
			this._myWebsocket = new WebSocket('ws://' + location.hostname + ':' + ECGame.Settings.Network.GamePort);
		}
		else
		{
			this._myWebsocket = new WebSocket('ws://' + location.hostname);
		}
		this._myWebsocket.binaryType = 'arraybuffer';
		
		this._myWebsocket.onopen = this._onOpen;
		this._myWebsocket.onclose = this._onClose;
		this._myWebsocket.onmessage = this._onMessage;
		this._myWebsocket.onerror = this._onError;
		this._myWebsocket.ECGameSocket = this;
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		_onOpen : function _onOpen(inEvent)//_onConnectedToServer
		{
			//inNetwork.event ConnectedToServer
			
			console.trace();
			console.log(inEvent);
			this.send("Hello!");
			
			var binary = new Uint8Array(20);
			for (var i = 0; i < binary.length; i++) {
				binary[i] = Math.floor((Math.random() * 256));
			}
			websocket.send(binary.buffer);
		},
		
		_onClose : function _onClose(inEvent)//_onDisconnectedFromServer
		{
			//inNetwork.event DisconnectedFromServer
			
			//https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
			console.trace();
			console.log(inEvent);
			console.log(arguments);
			//console.log(this._myWebsocket);
		},
		
		_onMessage : function _onMessage(inEvent)
		{
			//inNetwork.event Msg
			
		//	console.trace();	////////////////////////////////////TODO USE THIS INSTEAD OF THE CURRENT THING
		//	console.log(inEvent);
		//	console.log(typeof inEvent.data);
			if(typeof inEvent.data === 'string')
			{
				console.log(inEvent.data);
			}
			else
			{
				//console.log(inEvent.data);//to see what happens
				console.log(new Float32Array(inEvent.data));
			}
		},
		
		_onError : function _onError(inEvent)
		{
			console.error(inEvent);
		},
		
		send : function send(inData)
		{
			if(typeof inData === 'string')
			{
				this._myWebsocket.send(inData);
			}
			else
			{
				websocket.send(inData.buffer);
			}
		},
		
		close : function close(inCode, inReason)
		{
			this._myWebsocket.close(inCode, inReason);
		}
		
		//TODO getStatus
		/*
		const unsigned short CONNECTING = 0;
		const unsigned short OPEN = 1;
		const unsigned short CLOSING = 2;
		const unsigned short CLOSED = 3;
		readonly attribute unsigned short readyState;
		*/
	}
});




/*
Network
	-Netgroup
	-createNetGroup
	-<add/remove><User/Object>FromNetGroup<s>()
	-users{}/[]?
	
//SHARED
	-users	!!!!!!!!!
		-socket
	-netgroups	!!!!!!!
		-users	!!!!!!!
		-newInstances
		-dirtyInstances
		addNetDirtyObject()
		addNewObject()
		update()
			//for all new instances, send
			//for all dirty instances, send
			
	-maxItemsPerMessage
	-objectHeaderFormat
	-messageHeaderFormat
	-objectHeader
	-messageHeader
	
	-serializer
	_onIdRecv()
		//if server
		//	security checks
		//	if new user send them new id
		//	else reuse old one (todo security)
		//	event user id'ed
		//else overwrite user id with one from server
	_onMsgRecv()
		//event message
		//if server pass it on
	_onDataRecv()***
		//read objects as net objects
		//event data
		//if server and no errors, pass it on
	_onObjectsRecv()***
		//read objects as NOT net objects
		//event objects
		//if server and no errors, pass it on
	sendMessage()//note this is just text
		//if server send to all
		//else send to socket and tell listener it was sent
	_sendData()** //maybe message header defines these
		//if server send data to all or specific socket
		//else send
	_sendObj()**
		//if server send data to all or specific socket
		//else send
	_serializeObjectsIn()
		//read in objects, create when needed
	
	_serializeObjectsOut()
		//send it with headers and all
*/
ECGame.EngineLib.NetworkBase = ECGame.EngineLib.Class.create({
	Constructor : function NetworkBase()
	{
		this.GameEventSystem();
	},
	Parents : [ECGame.EngineLib.GameEventSystem],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		/*
		MessageHeader: (additions)
			id
			msg		//ser string as bytes?
			data
			obj
			//TODO ping/clock/pulse
		*/
/*		_maxItemsPerMessage : 255,
		_messageHeaderFormat :
		[
			{
				name : 'userID',
				type : 'int',
				net : true,
				min : 0,
				max : ECGame.EngineLib.User.USER_IDS.MAX_EVER
			},
			{
				name : 'numObjects',
				type : 'int',
				net : true,
				min : 1,
				max : this._maxItemsPerMessage
			}
		],
		_objectHeaderFormat :	//TODO put in shared place (like the GameObjectRef)
		[
			{
				name : 'classID',
				type : 'int',
				net : true,
				min : 0,
				max : ECGame.EngineLib.Class.getInstanceRegistry().getMaxID()
			},
			{
				name : 'instanceID',
				type : 'int',
				net : true,
				min : 0,
				max : 4096	//note: this assumes a max of 4096 objects of any given type.  may want max items per type in the future
			}
		],
		*/

	}
});


/*
//SERVER
	-listenSocket
		-connection => _onClientConnected
	_onClientConnected()
		//connect functions to new socket
		-id => _onIdRecv
		-msg => _onMsgRecv
		-data => _onDataRecv
		-obj => _onObjectsRecv
		-disconnect => _onClientDisconnected
		//tell everyone new connection
		//serialize all to new connection
	_onClientDisconnected()
		//tell all about the disconect
		//emit disconnect event
*/
ECGame.EngineLib.NetworkServer = ECGame.EngineLib.Class.create({
	Constructor : function NetworkServer()
	{
		//TODO move these out!!
		ECGame.WebServerTools.wsLib = require('ws');
		ECGame.WebServerTools.WebSocketServer = ECGame.WebServerTools.wsLib.Server;
		ECGame.WebServerTools.WebSocket = ECGame.WebServerTools.wsLib.WebSocket;
		
		//http://www.iana.org/assignments/websocket/websocket.xml#subprotocol-name
		this._myWebSocketServer = new ECGame.WebServerTools.WebSocketServer(
			//options:
			{			
				//host String
				port : ECGame.Settings.Network.GamePort,	//Number	???if(ECGame.Settings.Network.GamePort !== null)
				server : ECGame.webServer.httpServer, //http.Server
				verifyClient : this._verifyClient	//Function
				//path String
				//noServer Boolean
				//disableHixie Boolean
				//clientTracking Boolean
			}
			//callback function(?)??
		);
		/*
		this._myWebSocketServer.close([code], [data]);//closes server and all client sockets
		this._myWebSocketServer.handleUpgrade(request, socket, upgradeHead, callback)??????????????????
		this._myWebSocketServer.on('error', function(inError){});
		this._myWebSocketServer.on('headers', function(inHeaders){});
		this._myWebSocketServer.on('connection', function(inSocket){});
		*/
		this._myWebSocketServer.on('error', this._onError);
		this._myWebSocketServer.on('headers', this._onHeaders);
		this._myWebSocketServer.on('connection', this._onConnection);
	},
	Parents : [ECGame.EngineLib.NetworkBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		_verifyClient : function _verifyClient(inInfo, inClientVerifiedFunction)
		{
			console.trace();
			console.log(arguments);
			
			//TODO find user if they exist, otherwise create a new one or boot them.
			
			inClientVerifiedFunction(true);
		},
		
		
		close : function close(inCode, inReason)
		{
			//closes server and all client sockets
			this._myWebSocketServer.close(inCode, inReason);
		},
		

		_onError : function _onError(inError)
		{
			if(inError)
			{
				console.error(inError);
			}
		},
		
		_onHeaders : function _onHeaders(inHeaders)
		{
			console.trace();
			console.log(inHeaders);
		},
		
		_onConnection : function _onConnection(inWebSocket)//_onClientConnected
		{
			//TODO create server side socket
			var SOCKET____ = new ECGame.EngineLib.ServerSideWebSocket(inWebSocket, this);
			
			/*console.trace();
			console.log(inWebSocket);
			
			inWebSocket.on('open', onOpen);	//not ever recieved, I think because we are connected to, not connecting
			inWebSocket.on('error', onError);
			inWebSocket.on('close', onClose);
			inWebSocket.on('message', onMessage);
			inWebSocket.send('something', {}, onError);*/
			
			//TODO keep alive msgs
			/*
			setInterval(
				function()
				{
					inWebSocket.send("don't close on me now", {}, onError);
				},
				1000
			);*/
			
			/*setInterval(
				function()
				{
					inWebSocket.close();
				},
				20000
			);*/
		}
	}
});



/*
//CLIENT
	-_socket
		-connect => _onConnectedToServer
		-disconnect => _onDisconnectedFromServer
		-id => _onIdRecv
		-msg => _onMsgRecv
		-data => _onDataRecv
		-obj => _onObjectsRecv
	_onConnectedToServer()
		//assign socket server user
		//send local userid
		//connected event
	_onDisconnectedFromServer()
		//disconnected event
*/
ECGame.EngineLib.NetworkClient = ECGame.EngineLib.Class.create({
	Constructor : function NetworkClient()
	{
	},
	Parents : [ECGame.EngineLib.NetworkBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		
	}
});