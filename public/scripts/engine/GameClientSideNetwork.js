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

GameEngineLib.GameNetwork = function GameNetwork()
{
	GameEngineLib.createEventSystem(this);//TODO inherit
	//this.registerListener("Data", this);
	//if instance exists, error?
	GameEngineLib.GameNetwork.instance = this;
}

GameEngineLib.GameNetwork.prototype.constructor = GameEngineLib.GameNetwork;

GameEngineLib.GameNetwork.create = function create()//TODO params
{
	return new GameEngineLib.GameNetwork();//TODO params
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
			name : "numObjects",
			scope : "public",
			type : "int",
			net : true,
			min : 1,
			max : this._maxItemsPerMessage
		}
	];
	
	this._serializer = GameEngineLib.GameSerializers.createGameBinarySerializer();
	
	
	
	
	
	if(GameSystemVars.Network.GamePort !== null)
	{
		//Note may need to be sliced to last '/' in the future
		var address = document.URL.slice(0, -1) +  ":" + GameSystemVars.Network.GamePort;
		this._socket = io.connect(address);
	}
	else
	{
		this._socket = io.connect();
	}
	this._socket.on('connect', this._onConnectedToServer);
	this._socket.on('disconnect', this._onDisconnectedFromServer);
	
	//TODO many chat channels? Team, All, etc?
	//chat channel
	this._socket.on('msg', this._onMsgRecv);
	//data channel
	this._socket.on('data', this._onDataRecv);
	
	
	
	
}



GameEngineLib.GameNetwork.prototype.sendMessage = function sendMessage(inMsg, inSentListener)
{
	if(this._socket.socket.connected === true)
	{
		this._socket.emit('msg', inMsg);
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
	if(this._socket.socket.connected === true)
	{
		this._socket.emit('data', inData);
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
	var _this_ = GameEngineLib.GameNetwork.instance;
	var event = new GameEngineLib.GameEvent("ConnectedToServer");
	
	if(GameSystemVars.DEBUG /*&& GameSystemVars.Debug.NetworkMessages_Print*/)
	{
		GameEngineLib.logger.info("Connected to Server!");
	}
	
	//TODO change this to be some kind of hand shake or login or **user verification**?
	
	GameEngineLib.GameNetwork.instance.onEvent(event);
}



GameEngineLib.GameNetwork.prototype._onDisconnectedFromServer = function _onDisconnectedFromServer()
{
	var _this_ = GameEngineLib.GameNetwork.instance;
	var event = new GameEngineLib.GameEvent("DisconnectedFromServer");
	
	if(GameSystemVars.DEBUG /*&& GameSystemVars.Debug.NetworkMessages_Print*/)
	{
		GameEngineLib.logger.info("Lost Server!");
	}
	
	GameEngineLib.GameNetwork.instance.onEvent(event);
}



GameEngineLib.GameNetwork.prototype._onMsgRecv = function _onMsgRecv(inMsg)
{
	var _this_ = GameEngineLib.GameNetwork.instance;
	
	var event = new GameEngineLib.GameEvent("Msg");
	event.msg = inMsg;
	
	if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
	{
		GameEngineLib.logger.info("NetRecv: " + inMsg);
	}
	
	_this_.onEvent(event);
}



GameEngineLib.GameNetwork.prototype._onDataRecv = function _onDataRecv(inData)
{
	var _this_ = GameEngineLib.GameNetwork.instance;
	
	var event = new GameEngineLib.GameEvent("Data");
	event.data = inData;
	
	if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
	{
		GameEngineLib.logger.info("NetRecv: " + inData);
	}

	_this_._onData(event);
	_this_.onEvent(event);
}



//TODO probably on BOTH sides
GameEngineLib.GameNetwork.prototype.isUpdating = function isUpdating()
{
	return true;//isMultiplayer?? isConnected?
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
					if(inClass.flags.net && inObject.netDirty())
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
		this._serializer.serializeObject(messageHeader, this._messageHeaderFormat);
		
		for(var i = 0; i < messageHeader.public.numObjects; ++i)
		{
			var object = dirtyObjects[i];
			objectHeader.public.classID = object.getClass().getID();
			objectHeader.public.instanceID = object.getID();
			this._serializer.serializeObject(objectHeader, this._objectHeaderFormat);
			object.serialize(this._serializer);
		}
		
		this._sendData(this._serializer.getString());
		
		dirtyObjects = dirtyObjects.slice(messageHeader.public.numObjects);
	}
}



GameEngineLib.GameNetwork.prototype._onData = function _onData(inEvent)
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
		for(var i = 0; i < messageHeader.public.numObjects; ++i)
		{
			this._serializer.serializeObject(objectHeader, this._objectHeaderFormat);
			var objectClass = GameInstance.GameObjectClasses.findByID(objectHeader.public.classID);
			var object = objectClass.findByID(objectHeader.public.instanceID);
			//TODO if not found, and not server, create it
			//TODO if !server && !owner && !recentOwnerQueue throw error
			//TODO if !server && !owner && lenient serializer.dummyRead
			//else
			object.serialize(this._serializer);
			
			//TODO if server, dirty object (so it will send down to other clients)? or just resend if packet contains no detected problems
		}
	}
	catch(error)
	{
		//TODO disconnect? increment damaged packets for this user?
	}
}
