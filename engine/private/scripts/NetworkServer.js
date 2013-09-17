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
websocket.stream([options], callback)	//Streams data through calls to a user supplied function. options can be an object with members mask and binary. callback is executed on successive ticks of which send is function(data, final).
websocket.terminate()	//Immediately shuts down the connection

websocket.onopen
websocket.onerror
websocket.onclose
websocket.onmessage	//Emulates the W3C Browser based WebSocket interface using function members.
websocket.addEventListener(method, listener)	//Emulates the W3C Browser based WebSocket interface using addEventListener.

Event: 'error'	function(error) { }	//If the client emits an error, this event is emitted (errors from the underlying net.Socket are forwarded here).
Event: 'close'	function(code, message) { }	//Is emitted when the connection is closed. code is defined in the WebSocket specification.
	//The close event is also emitted when then underlying net.Socket closes the connection (end or close).
Event: 'message'	function(data, flags) { }	//Is emitted when data is received. flags is an object with member binary.
Event: 'ping'	function(data, flags) { }	//Is emitted when a ping is received. flags is an object with member binary.
Event: 'pong'	function(data, flags) { }	//Is emitted when a pong is received. flags is an object with member binary.
Event: 'open'	function () { }	//Emitted when the connection is established.
*/
ECGame.EngineLib.ServerSideWebSocket = ECGame.EngineLib.Class.create({
	Constructor : function ServerSideWebSocket()//_onClientConnected
	{
		this._myNetwork = null;
		this._myWebsocket = null;
		this._myUser = null;
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init(inWebSocket, inNetwork)
		{
			this._myNetwork = inNetwork;
			this._myWebsocket = inWebSocket;
			this._myWebsocket.myECGameSocket = this;
			
			//this._myUser = inWebSocket.upgradeReq.myECGameUser;	//TODO if we ever have FB identification or something..
			this._myUser = new ECGame.EngineLib.User();	//start with an unidentified user
			
			inWebSocket.on('open', this._onOpen);	//not ever recieved, I think because we are connected to, not connecting
			inWebSocket.on('error', this._onError);
			inWebSocket.on('close', this._onClose);
			inWebSocket.on('message', this._onMessage);
		},
		
		_onOpen : function _onOpen()
		{
			/*var aThis;
			aThis = this.myECGameSocket;*/
			
			console.trace();
			console.log(arguments);
		},

		_onClose : function _onClose(inCode, inMessage)//_onClientDisconnected
		{
			var aThis;
			
			aThis = this.myECGameSocket;
			
			//console.trace();
			//console.log(arguments);
			
			if(ECGame.Settings.isDebugPrint_NetworkMessages())
			{
				ECGame.log.info("Lost Client! " + aThis._myUser);
			}
			
			//TODO broadcast chat command
			//aThis._listenSocket.sockets.emit('msg', "User Disconnected: " + this.gameUser.userName);
			
			aThis._myUser.mySocket = null;
			
			//TODO see if this user is considered properly connected/id'ed first..
			aThis._myNetwork.onEvent(new ECGame.EngineLib.Events.ClientDisconnected(aThis._myUser));//TODO get rid of new!!!
			
			aThis._myNetwork._removeSocket(aThis);
		},
		
		_onMessage : function _onMessage(inMessage, inFlags)
		{
			var aThis
				,aRecievedObj
				,aUser
				;
			
			//console.trace();
			//console.log('Flags:', inFlags);
			//console.log('TypeOf:', typeof inMessage);
			
			aThis = this.myECGameSocket;
			
			if(ECGame.Settings.isDebugPrint_NetworkMessages())
			{
				if(typeof inMessage === 'string')
				{
					ECGame.log.info("Net Message Recv (text):" + inMessage);
				}
				else
				{
					ECGame.log.info("Net Message Recv (binary):" + JSON.stringify(new Uint8Array(inMessage)));
				}
			}
			
			if(aThis._myUser.userID !== ECGame.EngineLib.User.USER_IDS.NEW_USER)
			{
				if(typeof inMessage === 'string')
				{
					//TODO inNetwork.event Msg
					//aThis._myNetwork.serializeIn(aThis._myUser, inMessage);
					//ECGame.log.info('Message:', inMessage);
				}
				else
				{
					if(!ECGame.Settings.getDebugSimulatedLagTime())
					{
						aThis._myNetwork.serializeIn(aThis._myUser, new Uint8Array(inMessage));
					}
					else
					{
						ECGame.instance.getTimer().setTimerCallback(
							ECGame.Settings.getDebugSimulatedLagTime(),
							function delayNetworkMessage()
							{
								aThis._myNetwork.serializeIn(aThis._myUser, new Uint8Array(inMessage));
								return false;
							}
						);
					}
				}
			}
			//handle connection handshake / ID
			else
			{
				if(typeof inMessage === 'string')
				{
					aRecievedObj = JSON.parse(inMessage);
					if(ECGame.Settings.isDebugPrint_NetworkMessages())
					{
						ECGame.log.info('User ID Message:' + inMessage);
					}
					//verify the object is valid
					if(typeof aRecievedObj.userName !== 'string'
						|| typeof aRecievedObj.userID !== 'number'
						|| typeof aRecievedObj.reconnectKey !== 'number'
					)
					{
						ECGame.log.warn("Ill formed User Identification!");
						return;
					}
					
					//get existing user
					aUser = aThis._myNetwork._myIdentifiedUsers[aRecievedObj.userID];
					
					//if there is no user by this id, we assign them a new id!
					if(!aUser)
					{
						//set our user for this socket to be the client
						aThis._myUser.userName = aRecievedObj.userName;
						aThis._myUser.userID = aRecievedObj.userID = ++(ECGame.EngineLib.User.USER_IDS.CURRENT_MAX);
						aThis._myUser.reconnectKey = aRecievedObj.reconnectKey;
						//remember the user/client for reconnects:
						aThis._myNetwork._myIdentifiedUsers[aRecievedObj.userID] = aThis._myUser;
						//tell them who they are going to be from now on:
						aThis.send(JSON.stringify(aThis._myUser));
					}
					//make sure they are the same user as before:
					else if(aUser.reconnectKey === aRecievedObj.reconnectKey /*&& !aUser.connected ??*/)
					{
						aThis._myUser = aThis._myNetwork._myIdentifiedUsers[aRecievedObj.userID];
					}
					else
					{
						ECGame.log.warn("Recieved false reconectKey from unidentified user.");
						aThis.close();
						return;
					}
					
					aThis._myUser.mySocket = aThis;
					aThis._myNetwork.onEvent(new ECGame.EngineLib.Events.IdentifiedUser(aThis._myUser));
				}
				else
				{
					ECGame.log.warn("Recieved data from unidentified user.");
				}
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
			if(ECGame.Settings.isDebugPrint_NetworkMessages())
			{
				if(typeof inData === 'string')
				{
					ECGame.log.info("Net Send (text) to " + this._myUser.userName + ':' + inData);
				}
				else
				{
					ECGame.log.info("Net Send (binary) to " + this._myUser.userName + ':' + JSON.stringify(inData));
				}
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
ECGame.EngineLib.Network = ECGame.EngineLib.Class.create({
	Constructor : function NetworkServer()
	{
		this.NetworkBase();
		
		this._myIdentifiedUsers = [];
		this._mySockets = [];
		
		//TODO move these out!! (to where?)
		ECGame.WebServerTools.wsLib = require('ws');
		ECGame.WebServerTools.WebSocketServer = ECGame.WebServerTools.wsLib.Server;
		ECGame.WebServerTools.WebSocket = ECGame.WebServerTools.wsLib.WebSocket;
		
		//http://www.iana.org/assignments/websocket/websocket.xml#subprotocol-name
		this._myWebSocketServer = new ECGame.WebServerTools.WebSocketServer(
			//options:
			{			
				//host String
				port : ECGame.Settings.Network.GamePort,
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
		this._myWebSocketServer.on('error', function ?name?(inError){});
		this._myWebSocketServer.on('headers', function ?name?(inHeaders){});
		this._myWebSocketServer.on('connection', function ?name?(inSocket){});
		*/
		this._myWebSocketServer.on('error', this._onError);
		this._myWebSocketServer.on('headers', this._onHeaders);
		this._myWebSocketServer.on('connection', this._onConnection);
		
		ECGame.log.info("TCP Server running.");
	},
	Parents : [ECGame.EngineLib.NetworkBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		getName : function getName()
		{
			return 'NetworkServer';
		},
		
		_verifyClient : function _verifyClient(inInfo, inClientVerifiedFunction)//???????????????
		{
			var aUserID;
			
	//		console.trace();
	//		console.log(arguments);
			
			//TODO fb id? find user if they exist, otherwise create a new one or boot them.
//			aUserID = ++(ECGame.EngineLib.User.USER_IDS.CURRENT_MAX);
//			inInfo.req.myECGameUser = new ECGame.EngineLib.User("User" + aUserID, aUserID);
			
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
			//console.trace();
			//console.log(inHeaders);
		},
		
		_onConnection : function _onConnection(inWebSocket)//_onClientConnected
		{
			var aThis,
				aSocket;
			
//			console.trace();
//			console.log(inWebSocket);
			
			aThis = ECGame.instance.getNetwork();
			
			//create server side socket
			aSocket = ECGame.EngineLib.ServerSideWebSocket.create(inWebSocket, aThis);
			aThis._mySockets.push(aSocket);
			//TODO event??
			
			//TODO log connection
			
			//TODO tell everone they have connected with a chat message CommandObject:
			//inConnectedSocket.broadcast.emit('msg', "User Connected: " + inConnectedSocket.gameUser.userName);

			
			
			//TODO keep alive msgs??	//Ping!!
			/*setInterval(
				function()
				{
					inWebSocket.send("don't close on me now", {}, this._onError);
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
		},
		
		_removeSocket : function _removeSocket(inSocket)
		{
			var anIndex, aLength;
			
			anIndex = this._mySockets.indexOf(inSocket);
			if(anIndex !== -1)
			{
				aLength = this._mySockets.length;
				this._mySockets[anIndex] = this._mySockets[aLength - 1];
				this._mySockets.pop();
			}
		}
	}
});