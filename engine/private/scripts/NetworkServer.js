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
			this._myUser = inWebSocket.upgradeReq.myECGameUser;
			this._myWebsocket.myECGameSocket = this;
			
			inWebSocket.on('open', this._onOpen);	//not ever recieved, I think because we are connected to, not connecting
			inWebSocket.on('error', this._onError);
			inWebSocket.on('close', this._onClose);
			inWebSocket.on('message', this._onMessage);
			
			//TODO inNetwork.event IdentifiedUser TODO rename ClientConnected
			this._myNetwork.onEvent(new ECGame.EngineLib.Events.IdentifiedUser(this._myUser));//TODO get rid of new!!
			
			//HACK
			this.send("Hello!  Whats up?");
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
			
			console.trace();
			console.log(arguments);
			
			//TODO broadcast chat command
			//aThis._listenSocket.sockets.emit('msg', "User Disconnected: " + this.gameUser.userName);
			
			aThis._myNetwork.onEvent(new ECGame.EngineLib.Events.ClientDisconnected(aThis._myUser));//TODO get rid of new!!!
		},
		
		_onMessage : function _onMessage(inMessage, inFlags)
		{
			//inNetwork.event Msg
			
			console.trace();
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
			if(ECGame.Settings.isDebugPrint_NetworkMessages())
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
		//TODO move these out!! (to where?)
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
		this._myWebSocketServer.on('error', function ?name?(inError){});
		this._myWebSocketServer.on('headers', function ?name?(inHeaders){});
		this._myWebSocketServer.on('connection', function ?name?(inSocket){});
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
		_verifyClient : function _verifyClient(inInfo, inClientVerifiedFunction)//???????????????
		{
			var aUserID;
			
			console.trace();
			console.log(arguments);
			
			//TODO find user if they exist, otherwise create a new one or boot them.
			
			//TODO temp:
			aUserID = ++(ECGame.EngineLib.User.USER_IDS.CURRENT_MAX);
			inInfo.req.myECGameUser = new ECGame.EngineLib.User("User" + aUserID, aUserID);
			
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
			
			aThis = ECGame.instance.network;
			
			//create server side socket
			aSocket = ECGame.EngineLib.ServerSideWebSocket.create(inWebSocket, aThis);
			
			//HACK where should this go??
			this._HACKSOCKETS = this._HACKSOCKETS || [];
			this._HACKSOCKETS.push(aSocket);
			
			//TODO log connection
			
			//TODO create CommandObject to set local UserId! (send this object to the socket!)
						
			//TODO tell everone they have connected with a chat message CommandObject:
			//inConnectedSocket.broadcast.emit('msg', "User Connected: " + inConnectedSocket.gameUser.userName);

			
			/*console.trace();
			console.log(inWebSocket);
			*/
			//TODO keep alive msgs	//Ping!!
			
			setInterval(
				function()
				{
					inWebSocket.send("don't close on me now", {}, this._onError);
				},
				1000
			);
			
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