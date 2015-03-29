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
		this._myNetUser = null;
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
			this._myWebsocket = new WebSocket(
				(ECGame.Settings.Server.useHttps ? 'wss:\/\/' : 'ws:\/\/')
				+ location.hostname
			);
			this._myWebsocket.binaryType = 'arraybuffer';
			
			this._myWebsocket.onopen = this._onOpen;
			this._myWebsocket.onclose = this._onClose;
			this._myWebsocket.onmessage = this._onMessage;
			this._myWebsocket.onerror = this._onError;
			this._myWebsocket.myECGameSocket = this;
			
			//Other side of the connection is the server.
			this._myNetUser = new ECGame.EngineLib.NetUser("Server", ECGame.EngineLib.NetUser.USER_IDS.SERVER);
		},
		
		getUser : function getUser()
		{
			return this._myNetUser;
		},
		
		_onOpen : function _onOpen(/*inEvent*/)//_onConnectedToServer
		{
			var aThis
				;
			
			aThis = this.myECGameSocket;
			
			if(ECGame.Settings.isDebugPrint_NetworkMessagesConnectionChanges())
			{
				console.info("Connected to Server, awaiting ID validation...");
			}
			
			aThis._myNetUser.mySocket = aThis;
			//ECGame.instance.getNetwork().getNetGroup('master_netgroup').addUser(aThis._myNetUser);//<=done when server acks
		},
		
		_onClose : function _onClose(/*inEvent*/)//_onDisconnectedFromServer
		{
			//https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
			//http://www.iana.org/assignments/websocket/websocket.xml#subprotocol-name
			var aThis;
			
			aThis = this.myECGameSocket;
			
			if(ECGame.Settings.isDebugPrint_NetworkMessagesConnectionChanges())
			{
				console.info("Disconnected from Server.", arguments);
			}
			
			//aThis._myNetUser.mySocket = null;//set socket to null!? (like server), TODO try to reconnect!?!?
			ECGame.instance.getNetwork().getNetGroup('master_netgroup').removeUser(aThis._myNetUser);
			aThis._myNetwork.onEvent(new ECGame.EngineLib.Events.DisconnectedFromServer());//TODO get rid of new
		},
		
		_onMessage : function _onMessage(inEvent)
		{
			var aThis
				,inMessage
				,aRecievedObj
				,aLocalUser
				;

			aThis = this.myECGameSocket;
			inMessage = inEvent.data;
			aLocalUser = ECGame.instance.getLocalUser();
			
			if(ECGame.Settings.isDebugPrint_NetworkMessagesPackets())
			{
				if(typeof inMessage === 'string')
				{
					console.info("Net Message Recv (text length " + inMessage.length + ") from " + aThis._myNetUser.getDebugName() + ":" + inMessage);
				}
				else
				{
					console.info("Net Message Recv (binary length " + new Uint8Array(inMessage).length + ") from " + aThis._myNetUser.getDebugName() + ":" + JSON.stringify(new Uint8Array(inMessage)));
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
			else
			{
				if(ECGame.Settings.isDebugPrint_NetworkMessagesConnectionChanges())
				{
					console.info("User ID Message:" + inMessage);
				}

				aRecievedObj = JSON.parse(inMessage);

				//verify the object is valid
				if(typeof aRecievedObj.userName !== 'string'
					|| typeof aRecievedObj.userID !== 'number'
				)
				{
					console.warn("Ill formed User Identification!");
					return;
				}

				aLocalUser.userName = aRecievedObj.userName;
				aLocalUser.userID = aRecievedObj.userID;
				
				if(ECGame.Settings.isDebugPrint_NetworkMessagesConnectionChanges())
				{
					console.info("Connected to Server, ID updated!");
				}
				
				ECGame.instance.getNetwork().getNetGroup('master_netgroup').addUser(aThis._myNetUser);
				aThis._myNetwork.onEvent(new ECGame.EngineLib.Events.ConnectedToServer());//TODO get rid of new
			}
		},
		
		_onError : function _onError(inEvent)
		{
			console.error(inEvent);
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
			
			if(this._myWebsocket.readyState !== WebSocket.OPEN)
			{
				if(ECGame.Settings.isDebugPrint_NetworkMessagesConnectionChanges())
				{
					console.info("Socket closed, unable to send data.");
				}
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
			if(ECGame.Settings.isDebugPrint_NetworkMessagesConnectionChanges())
			{
				console.info("Starting Disconnect:", arguments);
			}
			this._myWebsocket.close(inCode, inReason);
		}
	}
});



ECGame.EngineLib.Network = ECGame.EngineLib.Class.create({
	Constructor : function NetworkClient()
	{
		this.NetworkBase();
		this._mySocket = ECGame.EngineLib.ClientSideWebSocket.create(this);
		this.createNetGroup('master_netgroup');
	},
	Parents : [ECGame.EngineLib.NetworkBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init()
		{
			console.log("Network Game Client Started");
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

