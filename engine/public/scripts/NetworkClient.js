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
/*global WebSocket */

//http://www.w3.org/TR/websockets/#the-websocket-interface
ECGame.EngineLib.ClientSideWebSocket = ECGame.EngineLib.Class.create({
	Constructor : function ClientSideWebSocket()
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
		init : function init(inNetwork)
		{
			this._myNetwork = inNetwork;
			if(ECGame.Settings.Network.GamePort !== null)
			{
				this._myWebsocket = new WebSocket('ws:\/\/' + location.hostname + ':' + ECGame.Settings.Network.GamePort);
			}
			else
			{
				this._myWebsocket = new WebSocket('ws:\/\/' + location.hostname);
			}
			this._myWebsocket.binaryType = 'arraybuffer';
			
			this._myWebsocket.onopen = this._onOpen;
			this._myWebsocket.onclose = this._onClose;
			this._myWebsocket.onmessage = this._onMessage;
			this._myWebsocket.onerror = this._onError;
			this._myWebsocket.myECGameSocket = this;
			
			//Other side of the connection is the server.
			this._myUser = new ECGame.EngineLib.User("Server", ECGame.EngineLib.User.USER_IDS.SERVER);
		},
		
		getUser : function getUser()
		{
			return this._myUser;
		},
		
		_onOpen : function _onOpen(/*inEvent*/)//_onConnectedToServer
		{
			var aThis
				,aLocalUser
				;
			
			aThis = this.myECGameSocket;
			
			if(ECGame.Settings.isDebugPrint_NetworkMessages())
			{
				console.info("Connected to Server, awaiting ID validation...");
			}
			
			aThis._myUser.mySocket = aThis;
			//ECGame.instance.getNetwork().getNetGroup('master_netgroup').addUser(aThis._myUser);//<=done when server acks

			//Send my ID to server
			aLocalUser = ECGame.instance.getLocalUser();
			aThis.send(JSON.stringify(
				{
					userName : aLocalUser.userName,
					userID : aLocalUser.userID,
					reconnectKey : aLocalUser.reconnectKey
				}
			));
		},
		
		_onClose : function _onClose(/*inEvent*/)//_onDisconnectedFromServer
		{
			//https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
			//http://www.iana.org/assignments/websocket/websocket.xml#subprotocol-name
			var aThis;
			
			aThis = this.myECGameSocket;
			
			if(ECGame.Settings.isDebugPrint_NetworkMessages())
			{
				console.info("Disconnected from Server.", arguments);
				/*console.trace();
				console.log(inEvent);
				console.log(arguments);
				//console.log(this._myWebsocket);*/
			}
			//HACK:
			if(ECGame.Settings.DEBUG
			//	&& ECGame.Settings.Debug.NetworkMessages_Print
			)
			{
				console.info("Lost Server!", arguments);
			}
			
			//aThis._myUser.mySocket = null;//set socket to null!? (like server), TODO try to reconnect!?!?
			ECGame.instance.getNetwork().getNetGroup('master_netgroup').removeUser(aThis._myUser);
			aThis._myNetwork.onEvent(new ECGame.EngineLib.Events.DisconnectedFromServer());//TODO get rid of new
			
			//TODO if not clean close try to reopen new socket!!!!!!!!!!
		},
		
		_onMessage : function _onMessage(inEvent)
		{
			var aThis
				,inMessage
				,aRecievedObj
				,aLocalUser
				;
			
			//console.trace();
			//console.log(inEvent);
			//console.log(typeof inEvent.data);
			
			aThis = this.myECGameSocket;
			inMessage = inEvent.data;
			aLocalUser = ECGame.instance.getLocalUser();
			
			if(ECGame.Settings.isDebugPrint_NetworkMessages())
			{
				if(typeof inMessage === 'string')
				{
					console.info("Net Message Recv (text):" + inMessage);
				}
				else
				{
					console.info("Net Message Recv (binary):" + JSON.stringify(new Uint8Array(inMessage)));
				}
			}
			
			if(aLocalUser.userID !== ECGame.EngineLib.User.USER_IDS.NEW_USER)
			{
				if(typeof inMessage !== 'string')
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
					//console.log(new Float32Array(inMessage));
				}
				/*else
				{
					//TODO inNetwork.event Msg
					//aThis._myNetwork.serializeIn(aThis._myUser, inMessage);
					//console.log(inMessage);
				}*/
			}
			//if we are unidentified we should expect the server to id us before getting any other messages
			else
			{
				if(typeof inMessage === 'string')
				{
					aRecievedObj = JSON.parse(inMessage);
					if(ECGame.Settings.isDebugPrint_NetworkMessages())
					{
						console.info("User ID Message:" + inMessage);
					}
					//verify the object is valid
					if(typeof aRecievedObj.userName !== 'string'
						|| typeof aRecievedObj.userID !== 'number'
						|| typeof aRecievedObj.reconnectKey !== 'number'
					)
					{
						console.warn("Ill formed User Identification!");
						return;
					}
					
					aLocalUser.userName = aRecievedObj.userName;
					aLocalUser.userID = aRecievedObj.userID;
					aLocalUser.reconnectKey = aRecievedObj.reconnectKey;
					
					if(ECGame.Settings.isDebugPrint_NetworkMessages())
					{
						console.info("Connected to Server, ID validated!");
					}
					
					ECGame.instance.getNetwork().getNetGroup('master_netgroup').addUser(aThis._myUser);
					aThis._myNetwork.onEvent(new ECGame.EngineLib.Events.ConnectedToServer());//TODO get rid of new
				}
				else
				{
					console.warn("Recieved bad id data from server.");
				}
			}
		},
		
		_onError : function _onError(inEvent)
		{
			console.error(inEvent);
		},
		
		send : function send(inData)
		{
			if(ECGame.Settings.isDebugPrint_NetworkMessages())
			{
				if(typeof inData === 'string')
				{
					console.info("Net Send (text) to " + this._myUser.userName + ':' + inData);
				}
				else
				{
					console.info("Net Send (binary) to " + this._myUser.userName + ':' + JSON.stringify(inData));
				}
			}
			
			if(this._myWebsocket.readyState !== WebSocket.OPEN)
			{
				console.log("Socket Closed, not sending data.");//TODO only print on debug?
				return;
			}
			
			if(typeof inData === 'string')
			{
				this._myWebsocket.send(inData);
			}
			else
			{
				this._myWebsocket.send(inData.buffer);
			}
		},
		
		close : function close(inCode, inReason)
		{
			//NOTE: In Chrome at least, we don't get the onclose event until the server acks the close.  Strange.
			if(ECGame.Settings.isDebugPrint_NetworkMessages())
			{
				console.info("Starting Disconnect:", arguments);
			}
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
ECGame.EngineLib.Network = ECGame.EngineLib.Class.create({
	Constructor : function NetworkClient()
	{
		this.NetworkBase();
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
		init : function init()
		{
			console.info("Network Game Client Started");
			this.createNetGroup('master_netgroup');
		},
		
		getName : function getName()
		{
			return 'NetworkClient';
		}
		
		,debugDraw : function debugDraw(inGraphics)
		{
			this._mySocket.getUser().debugDraw(inGraphics);
		}
	}
});

