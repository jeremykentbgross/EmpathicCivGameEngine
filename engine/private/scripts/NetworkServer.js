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



//See: //https://github.com/einaros/ws/blob/master/doc/ws.md
/*
WTF are these:
websocket.ping([data], [options], [dontFailWhenClosed])	//Sends a ping. data is sent, options is an object with members mask and binary. dontFailWhenClosed indicates whether or not to throw if the connection isnt open.
websocket.pong([data], [options], [dontFailWhenClosed])	//Sends a pong. data is sent, options is an object with members mask and binary. dontFailWhenClosed indicates whether or not to throw if the connection isnt open.
websocket.on('ping', function(){console.info(arguments)});
websocket.on('pong', function(){console.info(arguments)});

websocket.pause()	//Pause the client stream
websocket.resume()	//Resume the client stream

websocket.terminate()	//Immediately shuts down the connection
*/



ECGame.EngineLib.ServerSideWebSocket = ECGame.EngineLib.Class.create({
	Constructor : function ServerSideWebSocket()//_onClientConnected..
	{
		this._myNetwork = null;
		this._myWebsocket = null;
		this._myNetUser = null;
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init(inWebSocket, inNetwork)
		{
			var aUserName;

			this._myNetwork = inNetwork;
			this._myWebsocket = inWebSocket;
			this._myWebsocket.myECGameSocket = this;

			if(ECGame.Settings.Server.requireSessionLogins)
			{
				aUserName = inWebSocket.upgradeReq.user.userName;
				aUserName = aUserName.substr(0, aUserName.indexOf('@'));

				//if this is a reconnect:
				if(this._myNetwork._myIdentifiedUsers[aUserName])
				{
					this._myNetUser = this._myNetwork._myIdentifiedUsers[aUserName];
				}
				else
				{
					this._myNetUser = new ECGame.EngineLib.NetUser(
						aUserName
						,++ECGame.EngineLib.NetUser.USER_IDS.CURRENT_MAX
					);
				}
			}
			else
			{
				this._myNetUser = new ECGame.EngineLib.NetUser(
					"Player:" + (++ECGame.EngineLib.NetUser.USER_IDS.CURRENT_MAX)
					,ECGame.EngineLib.NetUser.USER_IDS.CURRENT_MAX
				);
			}

			this._myNetUser.mySocket = this;
			this._myNetwork._myIdentifiedUsers[this._myNetUser.userName] = this._myNetUser;

			this.send(
				JSON.stringify(
					{
						userName: this._myNetUser.userName
						,userID: this._myNetUser.userID
					}
				)
			);
			this._myNetwork.onEvent(new ECGame.EngineLib.Events.ClientConnected(this._myNetUser));
			
			inWebSocket.on('open', this._onOpen);	//not ever recieved, I think because we are connected to, not connecting
			inWebSocket.on('error', this._onError);
			inWebSocket.on('close', this._onClose);
			inWebSocket.on('message', this._onMessage);

			//some socket errors can cause problems without the websocket erroring:
			inWebSocket._socket.on('error', this._onError);
		},
		
		_onOpen : function _onOpen() //never called, I think because this is for outgoing calls only
		{
			if(ECGame.Settings.isDebugPrint_NetworkMessagesConnectionChanges())
			{
				console.trace(arguments);
			}
		},

		_onClose : function _onClose(inCode, inMessage)//_onClientDisconnected
		{
			var aThis;
			
			aThis = this.myECGameSocket;
			
			if(ECGame.Settings.isDebugPrint_NetworkMessagesConnectionChanges())
			{
				console./*info*/warn(//TODO change from warn back to info once we solve the close 2x or none bug
					"User Disconnected: " + aThis._myNetUser.getDebugName()
					,inCode
					,inMessage
				);
			}
			
			aThis._myNetUser.mySocket = null;
			
			//Note: use to have only one netgroup that was joined by all by default.
			//	removed it because it causes unneeded network sends at this time.  May want it back later.
			//ECGame.instance.getNetwork().getNetGroup('master_netgroup').removeUser(aThis._myNetUser);

			aThis._myNetwork.onEvent(new ECGame.EngineLib.Events.ClientDisconnected(aThis._myNetUser));//TODO get rid of new!!!
aThis._myNetUser.setupConnectionData();
			
			aThis._myNetwork._removeSocket(aThis);
			
			//TODO broadcast chat command
			//aThis._listenSocket.sockets.emit('msg', "User Disconnected: " + this.gameUser.userName);
		},
		
		_onMessage : function _onMessage(inMessage/*, inFlags.binary*/)
		{
			var aThis
				;
			
			aThis = this.myECGameSocket;
			
			if(ECGame.Settings.isDebugPrint_NetworkMessagesPackets())
			{
				if(typeof inMessage === 'string')
				{
					console.info("Net Message Recv (text length " + inMessage.length + ") from " + aThis._myNetUser.getDebugName() + ":" + inMessage);
				}
				else
				{
					console.info("Net Message Recv (binary length " + inMessage.length + ") from " + aThis._myNetUser.getDebugName() + ":" + JSON.stringify(new Uint8Array(inMessage)));
				}
			}

			if(typeof inMessage !== 'string')
			{
				if(!ECGame.Settings.getDebugSimulatedLagTime())
				{
					aThis._myNetwork.serializeIn(aThis._myNetUser, new Uint8Array(inMessage));
				}
				else
				{
					ECGame.instance.getTimer().setTimerCallback(
						ECGame.Settings.getDebugSimulatedLagTime(),
						function delayNetworkMessage()
						{
							aThis._myNetwork.serializeIn(aThis._myNetUser, new Uint8Array(inMessage));
							return false;
						}
					);
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
			if(ECGame.Settings.isDebugPrint_NetworkMessagesPackets())
			{
				if(typeof inData === 'string')
				{
					console.info("Net Send (text length " + inData.length + ") to " + this._myNetUser.getDebugName() + ':' + inData);
				}
				else
				{
					console.info("Net Send (binary length " + inData.length + ") to " + this._myNetUser.getDebugName() + ':' + JSON.stringify(inData));
				}
			}
			
			//TODO if not connected, queue send data to user object to resend later?? => in netuser?
			
			if(this._myWebsocket.readyState !== 1/*ie WebSocket.OPEN*/)
			{
				if(ECGame.Settings.isDebugPrint_NetworkMessagesConnectionChanges())
				{
					console.info("Socket closed, unable to send data to " + this._myNetUser.getDebugName());
				}
				return;
			}
			
			this._myWebsocket.send(
				new Buffer(inData)//.buffer
				,{
					binary : (typeof inData !== 'string')
					//,mask: true
					,compress : true
				},
				this._onError
			);
		},
		
		close : function close(inCode, inReason)
		{
			if(ECGame.Settings.isDebugPrint_NetworkMessagesConnectionChanges())
			{
				console.info("Closing socket on user:", this._myNetUser.getDebugName(), inCode, inReason);
			}
			this._myWebsocket.close(inCode, inReason);//TODO does this get the close event?? maybe not. debug ping timeout
			//HACK because not called by ^^^^; BUT also BUG: called 2x when called manually wtf??:
			this._onClose.apply(this._myWebsocket, [null, 'Closed Manualy']);
		}
	}
});



ECGame.EngineLib.Network = ECGame.EngineLib.Class.create({
	Constructor : function NetworkServer()
	{
		this.NetworkBase();
		
		this._myIdentifiedUsers = {};
		this._mySockets = [];
		
		//TODO move these out!! (to where?: maybe this.vars instead of global namespace!!)
		ECGame.WebServerTools.wsLib = require('ws');
		ECGame.WebServerTools.WebSocketServer = ECGame.WebServerTools.wsLib.Server;
		ECGame.WebServerTools.WebSocket = ECGame.WebServerTools.wsLib.WebSocket;

		this._myWebSocketServer = new ECGame.WebServerTools.WebSocketServer(
			//options:
			{
				server : (ECGame.Settings.Server.useHttps
					? ECGame.webServer.myHttpsServer
					: ECGame.webServer.myHttpServer),
				verifyClient : this._verifyClient
			}
		);

		this._myWebSocketServer.on('error', this._onError);
		this._myWebSocketServer.on('connection', this._onConnection);
		
		console.log("Websocket Server running.");
	},
	Parents : [ECGame.EngineLib.NetworkBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init()
		{
			console.log("Network Game Server Started");
		},
		
		getName : function getName()
		{
			return 'NetworkServer';
		},
		
		//note: inClientVerifiedCallback(inResult, inHttpErrorCode, inHttpReason)
		_verifyClient : function _verifyClient(inInfo, inClientVerifiedCallback)
		{
			var aRequest
				,aUserName
				,aThis
				;
			
			aThis = ECGame.instance.getNetwork();

			aRequest = inInfo.req;

			//if we require sessions, see if this is a valid user!
			if(ECGame.Settings.Server.requireSessionLogins)
			{
				ECGame.webServer.mySession(
					aRequest, {}
					,function parsedSession()
					{
						if(!aRequest.session)
						{
							console.error("Couldn't get session during websocket client verify");
							inClientVerifiedCallback(false);
							return;
						}
						if(ECGame.Settings.isDebugPrint_NetworkMessagesConnectionChanges())
						{
							console.info(
								"Websocket verify session:\n"
								+ JSON.stringify(aRequest.session, null, '\t')
							);
						}
						ECGame.webServer.myPassportInit(
							aRequest, {}
							,function parsePassport()
							{
								//??can fail here??

								ECGame.webServer.myPassportSession(
									aRequest, {}
									,function setupPassportSession()
									{
										if(!aRequest.isAuthenticated())
										{
											console.warn("User not authenticated");//??warn? hacker??
											inClientVerifiedCallback(false);
											return;
										}

										aUserName = aRequest.user.userName;
										aUserName = aUserName.substr(0, aUserName.indexOf('@'));
										//if user already connected return false, NO => disconnect the old and approve the new
										if(aThis._myIdentifiedUsers[aUserName]
											&& aThis._myIdentifiedUsers[aUserName].mySocket)
										{
											console.warn("User double connect");//??warn? hacker??
											inClientVerifiedCallback(false);
											return;
										}

										if(ECGame.Settings.isDebugPrint_NetworkMessagesConnectionChanges())
										{
											console.info(
												"Websocket approving user:\n"
												+ JSON.stringify(aRequest.user, null, '\t')
											);
										}
										inClientVerifiedCallback(true);
									}
								);
							}
						);
					}
				);
			}
			else
			{
				inClientVerifiedCallback(true);
			}
		},
		
		
		close : function close(/*inCode, inReason*/)	//TODO take no params
		{
			console.trace("Is this in use??");
			//TODO msg about this??
			//closes server and all client sockets
			this._myWebSocketServer.close();
		},
		
		_onError : function _onError(inError)
		{
			if(inError)
			{
				console.error(inError);
			}
		},
		
		_onConnection : function _onConnection(inWebSocket)//_onClientConnected
		{
			var aThis,
				aSocket;
			
			aThis = ECGame.instance.getNetwork();
			
			//create server side socket
			aSocket = ECGame.EngineLib.ServerSideWebSocket.create(inWebSocket, aThis);
			aThis._mySockets.push(aSocket);

			//TODO event??

			if(ECGame.Settings.isDebugPrint_NetworkMessagesConnectionChanges())
			{
				console.info("User Connected:" + aSocket._myNetUser.getDebugName());
			}
			
			//TODO tell everone they have connected with a chat message CommandObject:
			//inConnectedSocket.broadcast.emit('msg', "User Connected: " + inConnectedSocket.gameUser.userName);

			//TODO keep alive msgs??
			//=>	Ping!! (?setInterval) should be at socket level, not manual packets in base
		},
		
		_removeSocket : function _removeSocket(inSocket)//TODO consider using ws built in clientTracking instead (which will close all of them automatically when the server closes
		{
			this._mySockets.swapBackPop(this._mySockets.indexOf(inSocket));//TODO swapBackPopItem
		}
	}
});

