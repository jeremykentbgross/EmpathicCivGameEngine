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
GameEngineLib.User = function User(inName)
{
	this.name = inName || "guest";
	//TODO server assigns id (server name) and THAT is what is sent from clients in header?
}
GameEngineLib.User.prototype.constructor = GameEngineLib.User;
GameEngineLib.User.create = function create(inName)
{
	return new GameEngineLib.User(inName);
}



GameEngineLib.GameNetwork = function GameNetwork()
{
	GameEngineLib.createEventSystem(this);//TODO inherit
}

GameEngineLib.GameNetwork.prototype.constructor = GameEngineLib.GameNetwork;

GameEngineLib.GameNetwork.create = function create()
{
	return new GameEngineLib.GameNetwork();
}


		
GameEngineLib.GameNetwork.prototype.init = function init()
{
	this._maxItemsPerMessage = 255;
	this._objectHeaderFormat =
	[
		{
			name : "classID",
			scope : "public",
			type : "int",
			net : true,
			min : 0,
			max : GameInstance.GameObjectClasses.getMaxID()
		},
		{
			name : "instanceID",
			scope : "public",
			type : "int",
			net : true,
			min : 0,
			max : 4096	//note: this assumes a max of 4096 objects of any given type.  may want max items per type in the future
		}
	];
	this._messageHeaderFormat =
	[
		{
			name : "userName",
			scope : "public",
			type : "string",
			net : true
		},
		{
			name : "numObjects",
			scope : "public",
			type : "int",
			net : true,
			min : 1,
			max : this._maxItemsPerMessage
		}
	];
	
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
		
		//chat channel
		this._socket.on("msg", this._onMsgRecv);
		//data channel
		this._socket.on("data", this._onDataRecv);
	}
}



GameEngineLib.GameNetwork.prototype._onClientConnected = function _onClientConnected(inConnectedSocket)
{
	var _this_ = GameInstance.Network;
	
	inConnectedSocket.gameUser = GameEngineLib.User.create();
	
	//TODO event
	inConnectedSocket.on("id", _this_._onIdRecv);
	inConnectedSocket.on("msg", _this_._onMsgRecv);
	inConnectedSocket.on("data", _this_._onDataRecv);
	inConnectedSocket.on("disconnect", _this_._onClientDisconnected);
	
	//tell everone they have connected:
	inConnectedSocket.broadcast.emit("msg", "User Connected: " + inConnectedSocket.gameUser.name);
}



GameEngineLib.GameNetwork.prototype._onClientDisconnected = function _onClientDisconnected()
{
	//this == socket disconnecting!
	var _this_ = GameInstance.Network;
	
	_this_._listenSocket.sockets.emit("msg", "User Disconnected: " + this.gameUser.name);
	
	//on disconnect tell everyone that they are gone
}



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
			inSentListener.onSent(inMsg);
	}
	else
	{
		//TODO queue this for resend when we are connected again?
		
		if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
		{
			GameEngineLib.logger.info("Can't send message when disconnected.");
		}
	}
}



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
}



GameEngineLib.GameNetwork.prototype._onConnectedToServer = function _onConnectedToServer()
{
	var _this_ = GameInstance.Network;
	var event = new GameEngineLib.GameEvent("ConnectedToServer");
	
	if(GameSystemVars.DEBUG /*&& GameSystemVars.Debug.NetworkMessages_Print*/)
	{
		GameEngineLib.logger.info("Connected to Server!");
	}
	_this_._socket.gameUser = GameEngineLib.User.create("server");
	_this_._socket.emit("id", GameInstance.localUser.name);
	
	//TODO change this to be some kind of hand shake or login or **user verification**?
	
	_this_.onEvent(event);
}



GameEngineLib.GameNetwork.prototype._onDisconnectedFromServer = function _onDisconnectedFromServer()
{
	var _this_ = GameInstance.Network;
	var event = new GameEngineLib.GameEvent("DisconnectedFromServer");
	
	if(GameSystemVars.DEBUG /*&& GameSystemVars.Debug.NetworkMessages_Print*/)
	{
		GameEngineLib.logger.info("Lost Server!");
	}
	
	_this_.onEvent(event);
}



GameEngineLib.GameNetwork.prototype._onIdRecv = function _onIdRecv(inId)
{
	/*TODO:
	if(inId === "server" || user is already connected || user not expected)
		disconnect
		return
	assert user is not already renamed from guest
	*/
	if(GameSystemVars.DEBUG /*&& GameSystemVars.Debug.NetworkMessages_Print*/)
	{
		GameEngineLib.logger.info("Identified User: " + inId);
	}
	
	var _this_ = GameInstance.Network;
	var event = new GameEngineLib.GameEvent("IdentifiedUser");
	event.userName = inId;
	_this_.onEvent(event);
	
	this.broadcast.emit("msg", this.gameUser.name + " identified as " + inId);
	this.gameUser.name = inId;
}



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
}



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
}



//TODO probably on BOTH sides
GameEngineLib.GameNetwork.prototype.isUpdating = function isUpdating()
{
	return true;//!GameSystemVars.Network.isServer;//true;//isMultiplayer?? isConnected?
}



GameEngineLib.GameNetwork.prototype.update = function update(inDt)
{
	var messageHeader = { public : {} };	//TODO could make these class members as they used here and on recieve all the time.
	var objectHeader = { public : {} };
	var dirtyObjects = [];
	
	if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Draw)
	{
		GameInstance.Graphics.drawDebugText(
			"Network:",
			GameSystemVars.Debug.NetworkMessages_DrawColor
		);
	}
	
	//TODO have a net dirty class list instead of iterating over everything!
	GameInstance.GameObjectClasses.forAll(
		function(inClass)
		{
			//TODO get rid of this when we have class dirty list instead of looping thru all classes.
			if(!inClass.flags.net)
				return;
				
			if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Draw)
			{
				GameInstance.Graphics.drawDebugText(
					"    " + inClass.getName(),
					GameSystemVars.Debug.NetworkMessages_DrawColor
				);
			}
			
			inClass.forAll(
				function(inObject)
				{
					//TODO skip objects we do not own (but queue owner changes in netserialize queue from object?)
					if(inClass.flags.net && inObject.netDirty() /*&& inObject.getNetOwner() === GameInstance.localUser.name*/)
					{
						if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Draw)
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
		
		messageHeader.public.numObjects = Math.min(this._maxItemsPerMessage, dirtyObjects.length);
		messageHeader.public.userName = GameInstance.localUser.name;
		this._serializer.serializeObject(messageHeader, this._messageHeaderFormat);
		
		for(var i = 0; i < messageHeader.public.numObjects; ++i)
		{
			var object = dirtyObjects[i];
			objectHeader.public.classID = object.getClass().getID();
			objectHeader.public.instanceID = object.getID();
			this._serializer.serializeObject(objectHeader, this._objectHeaderFormat);
			object.serialize(this._serializer);
		}
		
		var sendData = this._serializer.getString();
		if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
		{
			GameEngineLib.logger.info("NetSend: " + sendData);
		}
		
		this._sendData(sendData);
		
		dirtyObjects = dirtyObjects.slice(messageHeader.public.numObjects);
	}
}



GameEngineLib.GameNetwork.prototype._onData = function _onData(inEvent, inSocket)
{
	/*
	TODO
	unpack
		throw	//from logerror!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	*/
	
	this._serializer.initRead({NET : true}, inEvent.data);
	
	var messageHeader = { public : {} };
	var objectHeader = { public : {} };
	
	try
	{
		this._serializer.serializeObject(messageHeader, this._messageHeaderFormat);
		
		//check that the username matches the socket user
		GameAssert(
			(messageHeader.public.userName === inSocket.gameUser.name || inSocket.gameUser.name === "server")
			,"Net user not identifying self correctly: " + (messageHeader.public.userName + " != " + inSocket.gameUser.name)
		);
		
		for(var i = 0; i < messageHeader.public.numObjects; ++i)
		{
			this._serializer.serializeObject(objectHeader, this._objectHeaderFormat);
			var objectClass = GameInstance.GameObjectClasses.findByID(objectHeader.public.classID);
			var object = objectClass.findByID(objectHeader.public.instanceID);
			//TODO if not found, and not server, create it
			//TODO if !server && !owner && !recentOwnerQueue throw error
			if(object.getNetOwner() !== messageHeader.public.userName && messageHeader.public.userName != "server")
			{
				//TODO info/warn?
				console.log("Not the owner!: " + messageHeader.public.userName + " != " + object.getNetOwner());
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
		GameEngineLib.logger.warn(error);
		//TODO disconnect? increment damaged packets for this user?
		return false;
	}
	
	return true;
}
