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




//TODO check naming convention!!

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


//TODO simulate latency!!!


/*//all user objects should be added to netgroups as objects
User : Object
	-name
	-id
	-ping
	-connected (bool)
	-socket (server only??)
	-fb/pic/etc?
	-serialize if locally owned?, make local User
	-netgroup (there can only be one)
	-onDisconnectedToLongTimer
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
	,GUEST : 2		//TODO guests and new users going to be depricated
	,NEW_USER : 3
	
	,CURRENT_MAX : 3	//enum max!	TODO make static, and this one is not const!
	
	,MAX_EVER : 65535
};
*/


/*
TODO

Command : Object
	-run()
	{
		execute();
		this.destroy();
	}
	-execute();//pure virtual

Chat : Command
	//client can create
	
SetUserID : Command
	//client CANNOT create

...

*/



/*
NetGroup	//1 netgroup per user, 0-many netgroups per object
	-users
		-socket	//need to keep alive, AND reconnect
	//TODO suspend object somehow?
*/
ECGame.EngineLib.NetGroup = ECGame.EngineLib.Class.create({
	Constructor : function NetGroup(inNetwork)
	{
		this._myNetwork = inNetwork;
		this._myUsers = [];
		this._myTrackedInstances = {};
		this._myNewInstances = {};
		this._myNetDirtyInstances = {};	//TODO merge with _myForwardDirtyObjects??
		this._myDestroyInstances = {};
		
		this._myForwardDirtyObjects = {};//[class][origin userid][]
		
		//TODO listen for creation of new users, and add all the current ones to objects
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		update : function update()//TODO probably onUpdate
		{
			var
				//user
				aCurrentUserIndex,
				aCurrentUser,
				aUserMap,
				aSourceUserIndex,
				//class
				aClassName,
				anInstanceList,
				//lists
				aNewInstanceList,
				aDirtyInstanceList,
				aDestroyInstanceList,
				//binary buffer
				aBinaryBuffer;
				
			//send all new, dirty, and destroyed instances to all users
			for(aCurrentUserIndex in this._myUsers)
			{
				aCurrentUser = this._myUsers[aCurrentUserIndex];
				
				aNewInstanceList = [];
				aDirtyInstanceList = [];
				aDestroyInstanceList = [];
				
				//queue up new instances
				for(aClassName in this._myNewInstances)
				{
					anInstanceList = this._myNewInstances[aClassName];
					aNewInstanceList.concat(anInstanceList);
				}
				
				//queue up dirty instances
				for(aClassName in this._myNetDirtyInstances)
				{
					anInstanceList = this._myNetDirtyInstances[aClassName];
					aDirtyInstanceList.concat(anInstanceList);
				}
				
				//queue up dirty instances from other clients
				for(aClassName in this._myForwardDirtyObjects)
				{
					aUserMap = this._myForwardDirtyObjects[aClassName];
					for(aSourceUserIndex in aUserMap)
					{
						if(aCurrentUserIndex === aSourceUserIndex)
						{
							continue;
						}
						anInstanceList = aUserMap[aSourceUserIndex];
						aDirtyInstanceList.concat(anInstanceList);
					}
				}
				
				//queue up the destroy objects
				for(aClassName in this._myDestroyInstances)
				{
					anInstanceList = this._myDestroyInstances[aClassName];
					aDestroyInstanceList.concat(anInstanceList);
				}
				
				aBinaryBuffer = this._myNetwork.serializeOut(
					aCurrentUser,
					aNewInstanceList,
					aDirtyInstanceList,
					aDestroyInstanceList
				);
				aCurrentUser.mySocket.send(aBinaryBuffer);
			}
		},
		
		addUser : function addUser(inUser)
		{
			var
				aClassName,
				anInstanceList,
				aNewInstanceList;
			
			//if the user is already here, bail
			if(this._myUsers.indexOf(inUser) !== -1)
			{
				return;
			}
			
			//add the user
			this._myUsers.push(inUser);
			
			//serialize all this._myTrackedInstances to user as new instances
			aNewInstanceList = [];
			for(aClassName in this._myTrackedInstances)
			{
				anInstanceList = this._myTrackedInstances[aClassName];
				aNewInstanceList.concat(anInstanceList);
			}
			aBinaryBuffer = this._myNetwork.serializeOut(
				inUser,
				aNewInstanceList,
				null,
				null
			);
			inUser.mySocket.send(aBinaryBuffer);
		},
		removeUser : function removeUser(inUser)
		{
			var anIndex, aLength;
			
			anIndex = this._myUsers.indexOf(inUser);
			if(anIndex !== -1)
			{
				aLength = this._myUsers.length;
				this._myUsers[anIndex] = this._myUsers[aLength - 1];
				this._myUsers.pop();
			}
			//TODO consider sending all _myTrackedInstances for destruction (like maybe a team switch?)
		},
		
		addOneTimeObject : function addOneTimeObject(inObject)
		{
			var aClassName;
			
			aClassName = inObject.getClass().getName();
			
			//add to new
			this._myNewInstances[aClassName] = this._myNewInstances[aClassName] || [];
			this._myNewInstances[aClassName].push(inObject);
		},
		
		addObject : function addObject(inObject)
		{
			var aClassName, anIndex, aLength;
			
			aClassName = inObject.getClass().getName();
			
			//if the object is already tracked, return
			if(this._myTrackedInstances[aClassName].indexOf(inObject) !== -1)
			{
				return;
			}
			
			//add to tracked
			this._myTrackedInstances[aClassName] = this._myTrackedInstances[aClassName] || [];
			this._myTrackedInstances[aClassName].push(inObject);

			//TODO listen to object messages: onNetDirty / onDestroy
			
			//if the object is set to be destroyed, remove that
			anIndex = this._myDestroyInstances[aClassName].indexOf(inObject);
			if(anIndex !== -1)
			{
				aLength = this._myDestroyInstances[aClassName].length;
				this._myDestroyInstances[aClassName][anIndex] = this._myDestroyInstances[aClassName][aLength - 1];
				this._myDestroyInstances[aClassName].pop();
			}
			
			//add to new
			this._myNewInstances[aClassName] = this._myNewInstances[aClassName] || [];
			this._myNewInstances[aClassName].push(inObject);
		},
		removeObject : function removeObject(inObject)
		{
			var aClassName, anIndex, aLength;
			
			aClassName = inObject.getClass().getName();
			
			//remove from tracked instances
			anIndex = this._myTrackedInstances[aClassName].indexOf(inObject);
			if(anIndex !== -1)
			{
				aLength = this._myTrackedInstances[aClassName].length;
				this._myTrackedInstances[aClassName][anIndex] = this._myTrackedInstances[aClassName][aLength - 1];
				this._myTrackedInstances[aClassName].pop();
			}
			else //the object isn't tracked, don't bother with the rest!!
			{
				return;
			}
			
			//if the object is already set to be destroyed, return
			anIndex = this._myDestroyInstances[aClassName].indexOf(inObject);
			if(anIndex !== -1)
			{
				return;
			}
			
			//add to the destroy list
			this._myDestroyInstances[aClassName] = this._myDestroyInstances[aClassName] || [];
			this._myDestroyInstances[aClassName].push(inObject);
			
			//TODO stop listening to object messages: onNetDirty / onDestroy
			
			//remove from new instances
			anIndex = this._myNewInstances[aClassName].indexOf(inObject);
			if(anIndex !== -1)
			{
				aLength = this._myNewInstances[aClassName].length;
				this._myNewInstances[aClassName][anIndex] = this._myNewInstances[aClassName][aLength - 1];
				this._myNewInstances[aClassName].pop();
			}
			
			//remove from the dirty list
			anIndex = this._myNetDirtyInstances[aClassName].indexOf(inObject);
			if(anIndex !== -1)
			{
				aLength = this._myNetDirtyInstances[aClassName].length;
				this._myNetDirtyInstances[aClassName][anIndex] = this._myNetDirtyInstances[aClassName][aLength - 1];
				this._myNetDirtyInstances[aClassName].pop();
			}
		},
		
		onNetDirty : function onNetDirty(inEvent)
		{
			var aClassName, anObject, anIndex, aUserID;
			
			anObject = inEvent.myObject;
			aClassName = anObject.getClass().getName();
			aUserID = inEvent.myUserID;
			
			//TODO check if this can be written to by local user
			
			if(!aUserID)
			{
				//make sure entry exists for this class
				this._myNetDirtyInstances[aClassName] = this._myNetDirtyInstances[aClassName] || [];
				
				//if it is already dirty, forget it
				anIndex = this._myNetDirtyInstances[aClassName].indexOf(anObject);
				if(anIndex !== -1)
				{
					return;
				}
				
				//it is dirty
				this._myNetDirtyInstances[aClassName].push(anObject);
			}
			else
			{
				//make sure there is a list for this class
				this._myForwardDirtyObjects[aClassName] = this._myForwardDirtyObjects[aClassName] || {};
				
				//make sure there is 'from user'
				this._myForwardDirtyObjects[aClassName][aUserID] = this._myForwardDirtyObjects[aClassName][aUserID] || [];
				
				//if its already there, skip this
				anIndex = this._myForwardDirtyObjects[aClassName][aUserID].indexOf(anObject);
				if(anIndex !== -1)
				{
					return;
				}
				
				//queue this object
				this._myForwardDirtyObjects[aClassName][aUserID].push(anObject);
			}
		},
		
		onObjectDestroyed : function onObjectDestroyed(inEvent)
		{
			this.removeObject(inEvent.myObject);
		}
		
		//TODO chat messages?
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
		//this._myUser = inWebSocket.??.myECGameUser;	//TODO get user from socket
		this._myWebsocket.myECGameSocket = this;
		
		inWebSocket.on('open', this._onOpen);	//not ever recieved, I think because we are connected to, not connecting
		inWebSocket.on('error', this._onError);
		inWebSocket.on('close', this._onClose);
		inWebSocket.on('message', this._onMessage);
		
		//TODO inNetwork.event IdentifiedUser TODO rename ClientConnected
		this._myNetwork.onEvent(new ECGame.EngineLib.Events.IdentifiedUser(this._myUser));
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		_onOpen : function _onOpen()
		{
			var aThis;
			
			aThis = this.myECGameSocket;
			
			console.trace();
			console.log(arguments);
		},

		_onClose : function _onClose(inCode, inMessage)//_onClientDisconnected
		{
			var aThis;
			
			aThis = this.myECGameSocket;
			
			console.trace();
			console.log(arguments);
			
			//TODO broadcast chat command
			//aThis._listenSocket.sockets.emit('msg', "User Disconnected: " + this.gameUser.userName);
			
			aThis._myNetwork.onEvent(new ECGame.EngineLib.Events.ClientDisconnected(aThis._myUser));
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
			if(ECGame.Settings.DEBUG && ECGame.Settings.Debug.NetworkMessages_Print)
			{
				ECGame.log.info("Net Send Obj: " + inData);
			}
			
			//TODO if not connected, queue send data to user object to resend later??
			
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
		this._myWebsocket.myECGameSocket = this;
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		_onOpen : function _onOpen(inEvent)//_onConnectedToServer
		{
			var aThis;
			
			aThis = this.myECGameSocket;
			
			if(ECGame.Settings.DEBUG
			//	&& ECGame.Settings.Debug.NetworkMessages_Print
			)
			{
				ECGame.log.info("Connected to Server!");
			}
			
			//TODO assign server user to this!
			//aThis._socket.gameUser = new ECGame.EngineLib.User("Server", ECGame.EngineLib.User.USER_IDS.SERVER);
			
			//TODO consider old way of reusing id on reconnect!
			
			aThis._myNetwork.onEvent(new ECGame.EngineLib.Events.ConnectedToServer());
			
			
			
			
			/*console.trace();
			console.log(inEvent);
			this.send("Hello!");
			
			var binary = new Uint8Array(20);
			for (var i = 0; i < binary.length; i++) {
				binary[i] = Math.floor((Math.random() * 256));
			}
			websocket.send(binary.buffer);*/
		},
		
		_onClose : function _onClose(inEvent)//_onDisconnectedFromServer
		{
			//https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
			var aThis;
			
			aThis = this.myECGameSocket;
			
			if(ECGame.Settings.DEBUG
			//	&& ECGame.Settings.Debug.NetworkMessages_Print
			)
			{
				ECGame.log.info("Lost Server!");
			}
			aThis._myNetwork.onEvent(new ECGame.EngineLib.Events.DisconnectedFromServer());
			
			//TODO if not clean close try to reopen new socket!
			
			
			
			/*console.trace();
			console.log(inEvent);
			console.log(arguments);
			//console.log(this._myWebsocket);*/
		},
		
		_onMessage : function _onMessage(inEvent)
		{
			var aThis;
			
			aThis = this.myECGameSocket;
			
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
	
//SHARED
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
		
		this._messageHeader = {};
		this._objectHeader = {};
		
		this._serializer = ECGame.EngineLib.GameBinarySerializer.create();
		
		this._myNetGroups = {};
	},
	Parents : [ECGame.EngineLib.GameEventSystem],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		createNetGroup : function createNetGroup(inName)
		{
			return (this._myNetGroups[inName] = ECGame.EngineLib.NetGroup.create());
			//would the following work safely and correctly, or always create the netgroup?
			//return (this._myNetGroups[inName] = this._myNetGroups[inName] || ECGame.EngineLib.NetGroup.create());
		},
		getNetGroup : getNetGroup(inName)
		{
			return this._myNetGroups[inName];
		},
		
		broadcast : function broadcast(inMsg)
		{
			var netGroupName;
			for(netGroupName in this._myNetGroups)
			{
				this._myNetGroups[netGroupName].addOneTimeObject(inMsg);
			}
		},
		
		serializeOut : function serializeOut(
			inCurrentUser,
			inNewInstanceList,
			inDirtyInstanceList,
			inDestroyInstanceList
		)
		{
			//TODO return binary buffer!!
		},
		
		serializeIn : function serializeIn()
		{
			//TODO...
		},
		
		/*
		TODO serializeObjects(inObjectArrays...)
			return binary array
		*/
		
		//TODO use '_my'/'_our'
		_maxItemsPerMessage : 255,
		_messageHeaderFormat :
		[
			//local clock? etc etc //TODO ping/clock/pulse
			{
				name : 'userID',
				type : 'int',
				net : true,
				min : 0,
				max : ECGame.EngineLib.User.USER_IDS.MAX_EVER
			},
			{
				name : 'newObjects',
				type : 'int',
				net : true,
				min : 0,
				max : this._maxItemsPerMessage
			},
			{
				name : 'dirtyObjects',
				type : 'int',
				net : true,
				min : 0,
				max : this._maxItemsPerMessage
			},
			{
				name : 'destroyObjects',
				type : 'int',
				net : true,
				min : 0,
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
		
		console.log("TCP Server running.");
	},
	Parents : [ECGame.EngineLib.NetworkBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		_verifyClient : function _verifyClient(inInfo, inClientVerifiedFunction)
		{
			var aUserID;
			
			console.trace();
			console.log(arguments);
			
			//TODO find user if they exist, otherwise create a new one or boot them.
			
			//TODO temp:
			aUserID = ++(ECGame.EngineLib.User.USER_IDS.CURRENT_MAX);
			inInfo.myECGameUser = new ECGame.EngineLib.User("User" + aUserID, aUserID);
			
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
			var aThis;
			
			aThis = ECGame.instance.network;
			
			//create server side socket
			var aSocket = new ECGame.EngineLib.ServerSideWebSocket(inWebSocket, aThis);
			
			//TODO create CommandObject to set local UserId! (send this object to the socket!)
						
			//TODO tell everone they have connected with a chat message CommandObject:
			//inConnectedSocket.broadcast.emit('msg', "User Connected: " + inConnectedSocket.gameUser.userName);

			
			
			
			/*console.trace();
			console.log(inWebSocket);
			
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
		//TODO create user/socket??
		//TODO should be creating server user and server user group that is subscribed to all?
		this._mySocket = ECGame.EngineLib.ClientSideWebSocket.create(this);
	},
	Parents : [ECGame.EngineLib.NetworkBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		
	}
});
















/*
		TODO in called from here:
		unpack()
			throw	//from logerror!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		
		_serializeObjectsIn : function _serializeObjectsIn(inEvent, inSocket, inSerializerFlags)
		{
			var i, readObjects;
			
			this._serializer.initRead(inSerializerFlags, inEvent.data);
			
			if(!ECGame.Settings.Network.isServer
				&& ECGame.Settings.DEBUG
				&& ECGame.Settings.Debug.NetworkMessages_Draw)
			{
				ECGame.instance.graphics.drawDebugText(
					"Network in:",
					ECGame.Settings.Debug.NetworkMessages_DrawColor
				);
			}
			
			try
			{
				this._serializer.serializeObject(this._messageHeader, this._messageHeaderFormat);
				
				//check that the username matches the socket user
				ECGame.log.assert(
					(this._messageHeader.userID === inSocket.gameUser.userID
					|| inSocket.gameUser.userID === ECGame.EngineLib.User.USER_IDS.SERVER)
					,"Net user not identifying self correctly: " + (this._messageHeader.userID + ' != ' + inSocket.gameUser.userID)
				);
				
				readObjects = [];
				
				for(i = 0; i < this._messageHeader.numObjects; ++i)
				{
					this._serializer.serializeObject(this._objectHeader, this._objectHeaderFormat);
					var objectClass = ECGame.EngineLib.Class.getInstanceRegistry().findByID(this._objectHeader.classID);
					if(ECGame.Settings.DEBUG && ECGame.Settings.Debug.NetworkMessages_Print)
					{
						if(!objectClass)
						{
							ECGame.log.warn("Unknown classID " + this._objectHeader.classID);
						}
					}
					var object = objectClass.getInstanceRegistry().findByID(this._objectHeader.instanceID);
					
					//if not found, and not server, create it
					if(!object)//TODO if user can create this object && not net?
					{
						if(ECGame.Settings.DEBUG && ECGame.Settings.Debug.NetworkMessages_Print)
						{
							ECGame.log.info("Network Creating: " + objectClass.getName() + ' : ' + this._objectHeader.instanceID);
						}
						object = objectClass.create();
						object.setID(this._objectHeader.instanceID);
					}
					else if(ECGame.Settings.DEBUG && ECGame.Settings.Debug.NetworkMessages_Print)
					{
						ECGame.log.info("Network Changing: " + objectClass.getName() + ' : ' + this._objectHeader.instanceID);
					}
					
					//if not from server && not from owner dummy serialize
					if(object.getNetOwnerID() !== this._messageHeader.userID
						&& this._messageHeader.userID !== ECGame.EngineLib.User.USER_IDS.SERVER)
					{
						//Note: could also maybe throw owner if !server && !owner && !recentOwnerQueue
						//TODO info/warn?
						console.log("Not the owner!: " + this._messageHeader.userID + ' != ' + object.getNetOwnerID());
						this._serializer.setDummyMode(true);
						object.serialize(this._serializer);
						this._serializer.setDummyMode(false);
					}
					else
					{
						object.serialize(this._serializer);
					}
					
					readObjects.push(object);
					
					if(!ECGame.Settings.Network.isServer
						&& ECGame.Settings.DEBUG
						&& ECGame.Settings.Debug.NetworkMessages_Draw)
					{
						//TODO not show same class name more than once, just instance (ie make print list for the end!)
						ECGame.instance.graphics.drawDebugText(
							'    ' + objectClass.getName(),
							ECGame.Settings.Debug.NetworkMessages_DrawColor
						);
						ECGame.instance.graphics.drawDebugText(
							'        -' + object.getName()
							,ECGame.Settings.Debug.NetworkMessages_DrawColor
						);
					}
				}
				
				for(i = 0; i < readObjects.length; ++i)
				{
					if(readObjects[i].postSerialize)//TODO make this chain function so we don't have to check for it???
					{
						readObjects[i].postSerialize();
					}
				}
			}
			catch(error)
			{
				console.log(error.stack);
				//TODO disconnect? increment damaged packets for this user?
				return false;
			}
			
			return true;
		},






		addNetDirtyObject : function addNetDirtyObject(inObject)
		{
			var className = inObject.getClass().getName();
			this._myNetDirtyInstances[className] = this._myNetDirtyInstances[className] || [];
			this._myNetDirtyInstances[className].push(inObject);
		},
		addNewObject : function addNewObject(inObject)
		{
			var className = inObject.getClass().getName();
			this._myNewInstances[className] = this._myNewInstances[className] || [];
			this._myNewInstances[className].push(inObject);
		},
		//TODO removeObject??




		update : function update(inDt)
		{
			var className,
				classInstanceList,
				instanceObject,
				i,
				allRelevantObjects,
				drawNetObjects;
			
			drawNetObjects = !ECGame.Settings.Network.isServer
				&& ECGame.Settings.DEBUG
				&& ECGame.Settings.Debug.NetworkMessages_Draw;
				
			if(drawNetObjects)
			{
				ECGame.instance.graphics.drawDebugText(
					"Network out:",
					ECGame.Settings.Debug.NetworkMessages_DrawColor
				);
			}
			
			allRelevantObjects = [];
			//sending the new objects
			for(className in this._myNewInstances)
			{
				classInstanceList = this._myNewInstances[className];
				if(drawNetObjects)
				{
					ECGame.instance.graphics.drawDebugText(
						'    ' + className,
						ECGame.Settings.Debug.NetworkMessages_DrawColor
					);
				}
				
				//TODO continue of this user cannot create the object!
				
				for(i = 0; i < classInstanceList.length; ++i)
				{
					instanceObject = classInstanceList[i];
					allRelevantObjects.push(instanceObject);
					//instanceObject.clearNetDirty();//TODO should these be net dirty at all?
					
					if(ECGame.Settings.DEBUG && ECGame.Settings.Debug.NetworkMessages_Print)
					{
						ECGame.log.info("Queueing Distributed Network Create: " + className + ' : ' + instanceObject.getID());
					}
					if(drawNetObjects)
					{
						ECGame.instance.graphics.drawDebugText(
							'        -' + instanceObject.getName()
							,ECGame.Settings.Debug.NetworkMessages_DrawColor
						);
					}
				}
			}
			this._myNewInstances = {};
			this._serializeObjectsOut(allRelevantObjects, {NET : false});//TODO flag FULL instead??
			
			allRelevantObjects = [];
			//sending the dirty objects
			for(className in this._myNetDirtyInstances)
			{
				classInstanceList = this._myNetDirtyInstances[className];
				if(drawNetObjects)
				{
					ECGame.instance.graphics.drawDebugText(
						'    ' + className,
						ECGame.Settings.Debug.NetworkMessages_DrawColor
					);
				}
				
				for(i = 0; i < classInstanceList.length; ++i)
				{
					instanceObject = classInstanceList[i];
					allRelevantObjects.push(instanceObject);
					//instanceObject.clearNetDirty();
					//instanceObject._myNetDirty = false;//HACK!!
					
					if(ECGame.Settings.DEBUG && ECGame.Settings.Debug.NetworkMessages_Print)
					{
						ECGame.log.info("Queueing Distributed Object Changes: " + className + ' : ' + instanceObject.getID());
					}
					if(drawNetObjects)
					{
						ECGame.instance.graphics.drawDebugText(
							'        -' + instanceObject.getName()
							,ECGame.Settings.Debug.NetworkMessages_DrawColor
						);
					}
				}
			}
			this._myNetDirtyInstances = {};
			this._serializeObjectsOut(allRelevantObjects, {NET : true});
		},



		_serializeObjectsOut : function _serializeObjectsOut(inList, inSerializerFlags, inSocket)
		{
			var sendData,
				i;
			
			ECGame.log.assert(inList.length < this._maxItemsPerMessage, "Cannot currently serialize so many objects!");
			
			while(inList.length !== 0)//TODO limit these? I think there will be other bugs with postload if not all are present!
			{
				this._serializer.initWrite(inSerializerFlags);
				
				this._messageHeader.numObjects = Math.min(this._maxItemsPerMessage, inList.length);
				this._messageHeader.userID = ECGame.instance.localUser.userID;
				this._serializer.serializeObject(this._messageHeader, this._messageHeaderFormat);
				
				for(i = 0; i < this._messageHeader.numObjects; ++i)
				{
					var object = inList[i];
					this._objectHeader.classID = object.getClass().getID();
					this._objectHeader.instanceID = object.getID();
					this._serializer.serializeObject(this._objectHeader, this._objectHeaderFormat);
					object.serialize(this._serializer);
					object.clearNetDirty();
				}
				
				sendData = this._serializer.getString();
				
				if(inSerializerFlags.NET)//TODO should be !FULL or something?
				{
					this._sendData(sendData, inSocket);
				}
				else
				{
					this._sendObj(sendData, inSocket);
				}
				
				inList = inList.slice(this._messageHeader.numObjects);
			}
		}
	}
	
*/