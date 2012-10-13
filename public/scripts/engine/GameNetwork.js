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


//TODO make server id for smaller messages!!
GameEngineLib.User = function User(inName, inID)
{
	this.userName = inName || "Guest";
	this.userID = inID || GameEngineLib.User.USER_IDS.GUEST;
	//TODO use FB id or something in the future
};
GameEngineLib.User.prototype.constructor = GameEngineLib.User;

GameEngineLib.User.USER_IDS =
{
	UNUSED : 0
	,SERVER : 1
	,GUEST : 2
	,NEW_USER : 3
	
	,CURRENT_MAX : 3	//enum max!
	
	,MAX_EVER : 65535
};






GameEngineLib.GameNetwork = function GameNetwork()
{
	GameEngineLib.createEventSystem(this);//TODO inherit
};

GameEngineLib.GameNetwork.prototype.constructor = GameEngineLib.GameNetwork;

GameEngineLib.GameNetwork.create = function create()
{
	return new GameEngineLib.GameNetwork();
};


		
GameEngineLib.GameNetwork.prototype.init = function init()
{
	this._maxItemsPerMessage = 255;
	this._objectHeaderFormat =
	[
		{
			name : "classID",
			type : "int",
			net : true,
			min : 0,
			max : GameEngineLib.Class.getInstanceRegistry().getMaxID()
		},
		{
			name : "instanceID",
			type : "int",
			net : true,
			min : 0,
			max : 4096	//note: this assumes a max of 4096 objects of any given type.  may want max items per type in the future
		}
	];
	this._messageHeaderFormat =
	[
		{
			name : "userID",
			type : "int",
			net : true,
			min : 0,
			max : GameEngineLib.User.USER_IDS.MAX_EVER
		},
		{
			name : "numObjects",
			type : "int",
			net : true,
			min : 1,
			max : this._maxItemsPerMessage
		}
	];
	
	this._messageHeader = {};
	this._objectHeader = {};
	
	this._serializer = GameEngineLib.GameBinarySerializer.create();
	
	if(GameSystemVars.Network.isServer)
	{
		if(GameSystemVars.Network.GamePort !== null)
		{
			this._listenSocket = GameEngineServer.socketio.listen(GameSystemVars.Network.GamePort);
		}
		else
		{
			this._listenSocket = GameEngineServer.listenSocket;
		}
		
		this._listenSocket.sockets.on("connection", this._onClientConnected);
		
		console.log("TCP Server running.");
	}
	else
	{
		if(GameSystemVars.Network.GamePort !== null)
		{
			//Note may need to be sliced to last "/" in the future
			var address = document.URL.slice(0, -1) +  ":" + GameSystemVars.Network.GamePort;
			this._socket = io.connect(address);
		}
		else
		{
			this._socket = io.connect();
		}
		this._socket.on("connect", this._onConnectedToServer);
		this._socket.on("disconnect", this._onDisconnectedFromServer);
		
		//TODO many chat channels? Team, All, etc?
		
		//server id
		this._socket.on("id", this._onIdRecv);
		
		//chat channel
		this._socket.on("msg", this._onMsgRecv);
		//data channel
		this._socket.on("data", this._onDataRecv);
	}
};



GameEngineLib.GameNetwork.prototype._onClientConnected = function _onClientConnected(inConnectedSocket)
{
	var _this_ = GameInstance.Network;
	
	//TODO unique guest name?
	inConnectedSocket.gameUser = new GameEngineLib.User("Guest", GameEngineLib.User.USER_IDS.GUEST);
	
	//TODO event
	inConnectedSocket.on("id", _this_._onIdRecv);
	inConnectedSocket.on("msg", _this_._onMsgRecv);
	inConnectedSocket.on("data", _this_._onDataRecv);
	inConnectedSocket.on("disconnect", _this_._onClientDisconnected);
	
	//tell everone they have connected:
	inConnectedSocket.broadcast.emit("msg", "User Connected: " + inConnectedSocket.gameUser.name);
};



GameEngineLib.GameNetwork.prototype._onClientDisconnected = function _onClientDisconnected()
{
	//this == socket disconnecting!
	var _this_ = GameInstance.Network;
	
	//TODO store their gameUser for reconnect until later
	
	_this_._listenSocket.sockets.emit("msg", "User Disconnected: " + this.gameUser.name);
	
	//TODO event to remove them (tell everyone they are gone)
};



GameEngineLib.GameNetwork.prototype.sendMessage = function sendMessage(inMsg, inSentListener)
{
	if(GameSystemVars.Network.isServer)
	{
		this._listenSocket.sockets.emit("msg", inMsg);
	}
	else if(this._socket.socket.connected === true)
	{
		this._socket.emit("msg", inMsg);
		if(inSentListener && inSentListener.onSent)
		{
			inSentListener.onSent(inMsg);
		}
	}
	else
	{
		//TODO queue this for resend when we are connected again?
		
		if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
		{
			GameEngineLib.logger.info("Can't send message when disconnected.");
		}
	}
};



GameEngineLib.GameNetwork.prototype._sendData = function _sendData(inData/*, inSentListener*/)
{
	if(GameSystemVars.Network.isServer)
	{
		this._listenSocket.sockets.emit("data", inData);
	}
	else if(this._socket.socket.connected === true)
	{
		this._socket.emit("data", inData);
		/*if(inSentListener && inSentListener.onSent)
			inSentListener.onSent(inData);*/
	}
	else
	{
		//TODO queue this for resend when we are connected again
		
		if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
		{
			GameEngineLib.logger.info("Can't send data when disconnected.");
		}
	}
};



GameEngineLib.GameNetwork.prototype._onConnectedToServer = function _onConnectedToServer()
{
	var _this_ = GameInstance.Network;
	var event = new GameEngineLib.GameEvent("ConnectedToServer");
	
	if(GameSystemVars.DEBUG /*&& GameSystemVars.Debug.NetworkMessages_Print*/)
	{
		GameEngineLib.logger.info("Connected to Server!");
	}
	_this_._socket.gameUser = new GameEngineLib.User("Server", GameEngineLib.User.USER_IDS.SERVER);
	_this_._socket.emit("id", GameInstance.localUser);
	
	//TODO change this to be some kind of hand shake or login or **user verification**?
	
	_this_.onEvent(event);
};



GameEngineLib.GameNetwork.prototype._onDisconnectedFromServer = function _onDisconnectedFromServer()
{
	var _this_ = GameInstance.Network;
	var event = new GameEngineLib.GameEvent("DisconnectedFromServer");
	
	if(GameSystemVars.DEBUG /*&& GameSystemVars.Debug.NetworkMessages_Print*/)
	{
		GameEngineLib.logger.info("Lost Server!");
	}
	
	_this_.onEvent(event);
};



GameEngineLib.GameNetwork.prototype._onIdRecv = function _onIdRecv(inID)
{
	var _this_ = GameInstance.Network;
	
	if(GameSystemVars.Network.isServer)
	{
		if(
			//user is already renamed from guest
			this.gameUser.userID !== GameEngineLib.User.USER_IDS.GUEST	//TODO handle reconnects!
			//they claim to be the server
			|| inID.userID === GameEngineLib.User.USER_IDS.SERVER
			//|| //that user is already connected 
			//|| //this user not expected
		)
		{
			GameEngineLib.logger.info("Hacker ID ignored: " + inID.userName);
			//TODO HACKER DISCONNECT THEM!
			return;
		}
		
		if(GameSystemVars.DEBUG /*&& GameSystemVars.Debug.NetworkMessages_Print*/)
		{
			GameEngineLib.logger.info("Identified User: " + inID.userName);
		}
		this.broadcast.emit("msg", this.gameUser.userName + " identified as " + inID.userName);
		
		this.gameUser.userName = inID.userName;
		if(inID.userID === GameEngineLib.User.USER_IDS.NEW_USER)
		{
			//TODO MAX_EVER! Reuse some of these with 'secret keys'
			this.gameUser.userID = inID.userID = ++(GameEngineLib.User.USER_IDS.CURRENT_MAX);
			this.emit("id", this.gameUser);
			
			GameEngineLib.logger.info("New UserID FOR: " + inID.userName + " : " + this.gameUser.userID);
		}
		else
		{
			//TODO see if this user was really here before!
			this.gameUser.userID = inID.userID;
			GameEngineLib.logger.info("New userid FROM: " + inID.userName + " : " + this.gameUser.userID);
		}
		
		var event = new GameEngineLib.GameEvent("IdentifiedUser");
		event.user = inID;
		_this_.onEvent(event);
	}
	else
	{
		GameInstance.localUser.userName = inID.userName;
		GameInstance.localUser.userID = inID.userID;
		if(GameSystemVars.DEBUG /*&& GameSystemVars.Debug.NetworkMessages_Print*/)
		{
			GameEngineLib.logger.info("Server Re-ID's me as: " + inID.userName + " : " + inID.userID);
		}
	}
};



GameEngineLib.GameNetwork.prototype._onMsgRecv = function _onMsgRecv(inMsg)
{
	var _this_ = GameInstance.Network;
	
	var event = new GameEngineLib.GameEvent("Msg");
	event.msg = inMsg;
	
	if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
	{
		GameEngineLib.logger.info("NetRecv: " + inMsg);
	}
	
	_this_.onEvent(event);
	if(GameSystemVars.Network.isServer)
	{
		//TODO cap size?
		this.broadcast.emit("msg", this.gameUser.name + ": " + inMsg);
	}
};



GameEngineLib.GameNetwork.prototype._onDataRecv = function _onDataRecv(inData)
{
	var _this_ = GameInstance.Network;
	
	var event = new GameEngineLib.GameEvent("Data");
	event.data = inData;
	
	if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
	{
		GameEngineLib.logger.info("NetRecv: " + inData);
	}

	if(_this_._onData(event, this))//TODO if this errors, don't do the rest, ESP not resend!
	{
		_this_.onEvent(event);
		if(GameSystemVars.Network.isServer)//TODO move this into function in 'if'?
		{
			//Note: 'this' is the recieving socket here
			this.broadcast.emit("data", inData);
		}
	}
};



//TODO probably on BOTH sides
GameEngineLib.GameNetwork.prototype.isUpdating = function isUpdating()
{
	return true;//!GameSystemVars.Network.isServer;//true;//isMultiplayer?? isConnected?
};



GameEngineLib.GameNetwork.prototype.update = function update(inDt)
{
	var dirtyObjects = [];
	
	if(!GameSystemVars.Network.isServer
		&& GameSystemVars.DEBUG
		&& GameSystemVars.Debug.NetworkMessages_Draw)
	{
		GameInstance.Graphics.drawDebugText(
			"Network out:",
			GameSystemVars.Debug.NetworkMessages_DrawColor
		);
	}
	
	//TODO have a net dirty class list instead of iterating over everything!
	GameEngineLib.Class.getInstanceRegistry().forAll(
		function(inClass)
		{
			//TODO get rid of this when we have class dirty list instead of looping thru all classes.
			if(!inClass.flags.net)
			{
				return;
			}
				
			if(!GameSystemVars.Network.isServer
				&& GameSystemVars.DEBUG
				&& GameSystemVars.Debug.NetworkMessages_Draw)
			{
				GameInstance.Graphics.drawDebugText(
					"    " + inClass.getName(),
					GameSystemVars.Debug.NetworkMessages_DrawColor
				);
			}
			
			inClass.getInstanceRegistry().forAll(
				function(inObject)
				{
					//TODO skip objects we do not own (but queue owner changes in netserialize queue from object?)
					if(inClass.flags.net && inObject.netDirty() /*&& inObject.getNetOwner() === GameInstance.localUser.name*/)
					{
						if(!GameSystemVars.Network.isServer
							&& GameSystemVars.DEBUG
							&& GameSystemVars.Debug.NetworkMessages_Draw)
						{
							GameInstance.Graphics.drawDebugText(
								"        -" + inObject.getName()
								,GameSystemVars.Debug.NetworkMessages_DrawColor
							);
						}
						dirtyObjects.push(inObject);
					}
				}
			);
		}
	);
	
	while(dirtyObjects.length !== 0)
	{
		this._serializer.initWrite({NET : true});
		
		this._messageHeader.numObjects = Math.min(this._maxItemsPerMessage, dirtyObjects.length);
		this._messageHeader.userID = GameInstance.localUser.userID;
		this._serializer.serializeObject(this._messageHeader, this._messageHeaderFormat);
		
		var i;
		for(i = 0; i < this._messageHeader.numObjects; ++i)
		{
			var object = dirtyObjects[i];
			this._objectHeader.classID = object.getClass().getID();
			this._objectHeader.instanceID = object.getID();
			this._serializer.serializeObject(this._objectHeader, this._objectHeaderFormat);
			object.serialize(this._serializer);
		}
		
		var sendData = this._serializer.getString();
		if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
		{
			GameEngineLib.logger.info("NetSend: " + sendData);
		}
		
		this._sendData(sendData);
		
		dirtyObjects = dirtyObjects.slice(this._messageHeader.numObjects);
	}
};



GameEngineLib.GameNetwork.prototype._onData = function _onData(inEvent, inSocket)
{
	/*
	TODO
	unpack
		throw	//from logerror!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	*/
	
	this._serializer.initRead({NET : true}, inEvent.data);
	
	if(!GameSystemVars.Network.isServer
		&& GameSystemVars.DEBUG
		&& GameSystemVars.Debug.NetworkMessages_Draw)
	{
		GameInstance.Graphics.drawDebugText(
			"Network in:",
			GameSystemVars.Debug.NetworkMessages_DrawColor
		);
	}
	
	try
	{
		this._serializer.serializeObject(this._messageHeader, this._messageHeaderFormat);
		
		//check that the username matches the socket user
		gameAssert(
			(this._messageHeader.userID === inSocket.gameUser.userID
			|| inSocket.gameUser.userID === GameEngineLib.User.USER_IDS.SERVER)
			,"Net user not identifying self correctly: " + (this._messageHeader.userID + " != " + inSocket.gameUser.userID)
		);
		
		var i;
		for(i = 0; i < this._messageHeader.numObjects; ++i)
		{
			this._serializer.serializeObject(this._objectHeader, this._objectHeaderFormat);
			var objectClass = GameEngineLib.Class.getInstanceRegistry().findByID(this._objectHeader.classID);
			var object = objectClass.getInstanceRegistry().findByID(this._objectHeader.instanceID);
			
			if(!GameSystemVars.Network.isServer
				&& GameSystemVars.DEBUG
				&& GameSystemVars.Debug.NetworkMessages_Draw)
			{
				//TODO not show same class name more than once, just instance (ie make print list for the end!)
				GameInstance.Graphics.drawDebugText(
					"    " + objectClass.getName(),
					GameSystemVars.Debug.NetworkMessages_DrawColor
				);
				GameInstance.Graphics.drawDebugText(
					"        -" + object.getName()
					,GameSystemVars.Debug.NetworkMessages_DrawColor
				);
			}
			//TODO if not found, and not server, create it
			//TODO if !server && !owner && !recentOwnerQueue throw error
			if(object.getNetOwner() !== this._messageHeader.userID
				&& this._messageHeader.userID !== GameEngineLib.User.USER_IDS.SERVER)
			{
				//TODO info/warn?
				console.log("Not the owner!: " + this._messageHeader.userID + " != " + object.getNetOwner());
				this._serializer.setDummyMode(true);
			}
			//TODO if !server && !owner && lenient serializer.dummyRead
			//else
			object.serialize(this._serializer);
			
			//TODO if server, dirty object (so it will send down to other clients)? or just resend if packet contains no detected problems
			
			//clear dummy mode in case we didn't read this object
			this._serializer.setDummyMode(false);
		}
	}
	catch(error)
	{
		console.log(error.stack);
		//TODO disconnect? increment damaged packets for this user?
		return false;
	}
	
	return true;
};
