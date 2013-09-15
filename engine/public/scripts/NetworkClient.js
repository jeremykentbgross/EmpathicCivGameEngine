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
				this._myWebsocket = new WebSocket('ws:\x2f\x2f' + location.hostname + ':' + ECGame.Settings.Network.GamePort);
			}
			else
			{
				this._myWebsocket = new WebSocket('ws:\x2f\x2f' + location.hostname);
			}
			this._myWebsocket.binaryType = 'arraybuffer';
			
			this._myWebsocket.onopen = this._onOpen;
			this._myWebsocket.onclose = this._onClose;
			this._myWebsocket.onmessage = this._onMessage;
			this._myWebsocket.onerror = this._onError;
			this._myWebsocket.myECGameSocket = this;
		},
		
		_onOpen : function _onOpen(inEvent)//_onConnectedToServer
		{
			var aThis;	//var i, binary;//HACK
			
			aThis = this.myECGameSocket;
			
			if(ECGame.Settings.isDebugPrint_NetworkMessages())
			{
				ECGame.log.info("Connected to Server, awaiting ID validation...");
			}
			
			//Other side of the connection is the server.
			aThis._myUser = new ECGame.EngineLib.User("Server", ECGame.EngineLib.User.USER_IDS.SERVER);
			aThis._myUser.mySocket = aThis;
			
			//TODO handle removing this user on disconnect!
			ECGame.instance.network.getNetGroup('master_netgroup').addUser(aThis._myUser);
			
			//Send my ID to server
			aThis.send(JSON.stringify(ECGame.instance.localUser));
			
			////////
			
			//HACK!!!!
			//console.trace();
			//console.log(inEvent);
		/*	aThis.send("Hello!");
			
			binary = new Uint8Array(20);
			for(i = 0; i < binary.length; ++i) {
				binary[i] = Math.floor((Math.random() * 256));
			}
			//this._myWebsocket.send(binary.buffer);
			aThis.send(binary);*/
		},
		
		_onClose : function _onClose(inEvent)//_onDisconnectedFromServer
		{
			//https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
			//http://www.iana.org/assignments/websocket/websocket.xml#subprotocol-name
			var aThis;
			
			/*console.trace();
			console.log(inEvent);
			console.log(arguments);
			//console.log(this._myWebsocket);*/
			
			aThis = this.myECGameSocket;
			
			if(ECGame.Settings.DEBUG
			//	&& ECGame.Settings.Debug.NetworkMessages_Print
			)
			{
				ECGame.log.info("Lost Server!");
			}
			aThis._myNetwork.onEvent(new ECGame.EngineLib.Events.DisconnectedFromServer());//TODO get rid of new
			
			//TODO if not clean close try to reopen new socket!!!!!!!!!!
		},
		
		_onMessage : function _onMessage(inEvent)
		{
			var aThis
				,inMessage
				,aRecievedObj
				;
			
			//console.trace();
			//console.log(inEvent);
			//console.log(typeof inEvent.data);
			
			aThis = this.myECGameSocket;
			inMessage = inEvent.data;
			
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
			
			if(ECGame.instance.localUser.userID !== ECGame.EngineLib.User.USER_IDS.NEW_USER)
			{
				if(typeof inMessage === 'string')
				{
					//TODO inNetwork.event Msg
					//aThis._myNetwork.serializeIn(aThis._myUser, inMessage);
					//console.log(inMessage);
				}
				else
				{
					if(!ECGame.Settings.getDebugSimulatedLagTime())
					{
						aThis._myNetwork.serializeIn(aThis._myUser, new Uint8Array(inMessage));
					}
					else
					{
						ECGame.instance.timer.setTimerCallback(
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
			}
			//if we are unidentified we should expect the server to id us before getting any other messages
			else
			{
				if(typeof inMessage === 'string')
				{
					aRecievedObj = JSON.parse(inMessage);
					if(ECGame.Settings.isDebugPrint_NetworkMessages())
					{
						ECGame.log.info("User ID Message:" + inMessage);
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
					
					ECGame.instance.localUser.userName = aRecievedObj.userName;
					ECGame.instance.localUser.userID = aRecievedObj.userID;
					ECGame.instance.localUser.reconnectKey = aRecievedObj.reconnectKey;
					
					if(ECGame.Settings.isDebugPrint_NetworkMessages())
					{
						ECGame.log.info("Connected to Server, ID validated!");
					}
					
					aThis._myNetwork.onEvent(new ECGame.EngineLib.Events.ConnectedToServer());//TODO get rid of new
				}
				else
				{
					ECGame.log.warn("Recieved bad id data from server.");
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
					ECGame.log.info("Net Send (text) to " + this._myUser.userName + ':' + inData);
				}
				else
				{
					ECGame.log.info("Net Send (binary) to " + this._myUser.userName + ':' + JSON.stringify(inData));
				}
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
		getName : function getName()
		{
			return 'NetworkClient';
		}
	}
});

