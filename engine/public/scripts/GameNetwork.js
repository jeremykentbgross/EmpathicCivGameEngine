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
	,GUEST : 2
	,NEW_USER : 3
	
	,CURRENT_MAX : 3	//enum max!	TODO make static, and this one is not const!
	
	,MAX_EVER : 65535
};



ECGame.EngineLib.Network = ECGame.EngineLib.Class.create({
	Constructor : function Network()
	{
		this.GameEventSystem();
	},
	Parents : [ECGame.EngineLib.GameEventSystem],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init()
		{
			this._maxItemsPerMessage = 255;
			this._objectHeaderFormat =	//TODO put in shared place (like the GameObjectRef)
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
			];
			this._messageHeaderFormat =
			[
				{
					name : 'userID',
					type : 'int',
					net : true,
					min : 0,
					max : ECGame.EngineLib.User.USER_IDS.MAX_EVER
				},
				{
					name : 'numObjects',
					type : 'int',
					net : true,
					min : 1,
					max : this._maxItemsPerMessage
				}
			];
			
			this._newInstances = {};
			this._netDirtyInstances = {};
			
			this._messageHeader = {};
			this._objectHeader = {};
			
			this._serializer = ECGame.EngineLib.GameBinarySerializer.create();
			
			if(ECGame.Settings.Network.isServer)
			{
				if(ECGame.Settings.Network.GamePort !== null)
				{
					this._listenSocket = ECGame.webServer.socketio.listen(ECGame.Settings.Network.GamePort);
				}
				else
				{
					this._listenSocket = ECGame.webServer.listenSocket;
				}
				
				//TODO proper configure:
				this._listenSocket.set('log level', 0);
				
				this._listenSocket.sockets.on('connection', this._onClientConnected);
				
				console.log("TCP Server running.");
			}
			else
			{
				if(ECGame.Settings.Network.GamePort !== null)
				{
					//Note may need to be sliced to last '/' in the future
					var address = document.URL.slice(0, -1) +  ':' + ECGame.Settings.Network.GamePort;
					this._socket = io.connect(address);
				}
				else
				{
					this._socket = io.connect();
				}
				this._socket.on('connect', this._onConnectedToServer);
				this._socket.on('disconnect', this._onDisconnectedFromServer);
				
				//TODO many chat channels? Team, All, etc?
				
				//server id
				this._socket.on('id', this._onIdRecv);
				
				//chat channel
				this._socket.on('msg', this._onMsgRecv);
				//data channel
				this._socket.on('data', this._onDataRecv);
				//new objects channel
				this._socket.on('obj', this._onObjectsRecv);
			}
		},



		_onClientConnected : function _onClientConnected(inConnectedSocket)
		{
			var aThis = ECGame.instance.network;
			
			//TODO unique guest name?
			inConnectedSocket.gameUser = new ECGame.EngineLib.User("Guest", ECGame.EngineLib.User.USER_IDS.GUEST);
			
			//TODO event
			inConnectedSocket.on('id', aThis._onIdRecv);
			inConnectedSocket.on('msg', aThis._onMsgRecv);
			inConnectedSocket.on('data', aThis._onDataRecv);
			inConnectedSocket.on('obj', aThis._onObjectsRecv);
			inConnectedSocket.on('disconnect', aThis._onClientDisconnected);
			
			//tell everone they have connected:
			inConnectedSocket.broadcast.emit('msg', "User Connected: " + inConnectedSocket.gameUser.userName);
			
			
			
			//let new connection know about all the existing objects!!
			var allRelevantObjects;
			allRelevantObjects = [];
			ECGame.EngineLib.Class.getInstanceRegistry().forAll(
				function queueAllInstancesOfClass(inClass)
				{
					inClass.getInstanceRegistry().forAll(
						function queueObject(inObject)
						{
							if(ECGame.Settings.isDebugPrint_NetworkMessages())
							{
								ECGame.log.info("Queueing Network Create for New Connection: " + inClass.getName() + ' : ' + inObject.getID());
							}
							allRelevantObjects.push(inObject);
						}
					);
				}
			);
			
			aThis._serializeObjectsOut(allRelevantObjects, {NET : false}, inConnectedSocket);//TODO flag FULL instead??
		},



		_onClientDisconnected : function _onClientDisconnected()
		{
			//this == socket disconnecting!
			var aThis = ECGame.instance.network;
			
			//TODO store their gameUser for reconnect until later (if supported)
			
			aThis._listenSocket.sockets.emit('msg', "User Disconnected: " + this.gameUser.userName);
			
			//event to remove them (tell everyone they are gone) IFF it was an identified user.
			if(ECGame.EngineLib.User.USER_IDS.GUEST !== this.gameUser.userID)
			{
				aThis.onEvent(new ECGame.EngineLib.Events.ClientDisconnected(this.gameUser));
			}
		},



		sendMessage : function sendMessage(inMsg, inSentListener)
		{
			if(ECGame.Settings.isDebugPrint_NetworkMessages())
			{
				ECGame.log.info("Net Send Msg: " + inMsg);
			}
			//TODO make sure it is no more than max size. Also look out for embedded html hacker tags
			if(ECGame.Settings.Network.isServer)
			{
				this._listenSocket.sockets.emit('msg', inMsg);
			}
			else if(this._socket.socket.connected === true)
			{
				this._socket.emit('msg', inMsg);
				if(inSentListener && inSentListener.onSentMessage)
				{
					inSentListener.onSentMessage(ECGame.instance.localUser.userName + ': ' + inMsg);
				}
			}
			else
			{
				//TODO queue this for resend when we are connected again?
				
				if(ECGame.Settings.isDebugPrint_NetworkMessages())
				{
					ECGame.log.info("Can't send message when disconnected.");
				}
			}
		},



		_sendData : function _sendData(inData, inSocket/*, inSentListener*/)
		{
			if(ECGame.Settings.isDebugPrint_NetworkMessages())
			{
				ECGame.log.info("Net Send Data: " + inData);
			}

			if(ECGame.Settings.Network.isServer)
			{
				if(inSocket)
				{
					inSocket.emit('data', inData);
				}
				else
				{
					this._listenSocket.sockets.emit('data', inData);
				}
			}
			else if(this._socket.socket.connected === true)
			{
				this._socket.emit('data', inData);
				/*if(inSentListener && inSentListener.onSentData)
					inSentListener.onSentData(inData);*/
			}
			else
			{
				//TODO queue this for resend when we are connected again
				
				if(ECGame.Settings.isDebugPrint_NetworkMessages())
				{
					ECGame.log.info("Can't send data when disconnected.");
				}
			}
		},



		_sendObj : function _sendObj(inObjData, inSocket/*, inSentListener*/)
		{
			if(ECGame.Settings.isDebugPrint_NetworkMessages())
			{
				ECGame.log.info("Net Send Obj: " + inObjData);
			}

			if(ECGame.Settings.Network.isServer)
			{
				if(inSocket)
				{
					inSocket.emit('obj', inObjData);
				}
				else
				{
					this._listenSocket.sockets.emit('obj', inObjData);
				}
			}
			else if(this._socket.socket.connected === true)
			{
				this._socket.emit('obj', inObjData);
				/*if(inSentListener && inSentListener.onSentData)
					inSentListener.onSentData(inObjData);*/
			}
			else
			{
				//TODO queue this for resend when we are connected again
				
				if(ECGame.Settings.isDebugPrint_NetworkMessages())
				{
					ECGame.log.info("Can't send data when disconnected.");
				}
			}
		},



		_onConnectedToServer : function _onConnectedToServer()
		{
			var aThis = ECGame.instance.network;
			var event = new ECGame.EngineLib.Events.ConnectedToServer();
			
			if(ECGame.Settings.DEBUG /*&& ECGame.Settings.Debug.NetworkMessages_Print*/)
			{
				ECGame.log.info("Connected to Server!");
			}
			aThis._socket.gameUser = new ECGame.EngineLib.User("Server", ECGame.EngineLib.User.USER_IDS.SERVER);
			aThis._socket.emit('id', ECGame.instance.localUser);
			
			//TODO change this to be some kind of hand shake or login or **user verification**?
			
			aThis.onEvent(event);
		},



		_onDisconnectedFromServer : function _onDisconnectedFromServer()
		{
			var aThis = ECGame.instance.network;
			var event = new ECGame.EngineLib.Events.DisconnectedFromServer();
			
			if(ECGame.Settings.DEBUG /*&& ECGame.Settings.Debug.NetworkMessages_Print*/)
			{
				ECGame.log.info("Lost Server!");
			}
			
			aThis.onEvent(event);
		},



		_onIdRecv : function _onIdRecv(inUser)//TODO rename inUserID
		{
			var aThis = ECGame.instance.network;
			
			if(ECGame.Settings.Network.isServer)
			{
				if(
					//user is already renamed from guest
					this.gameUser.userID !== ECGame.EngineLib.User.USER_IDS.GUEST	//TODO handle reconnects!
					//they claim to be the server
					|| inUser.userID === ECGame.EngineLib.User.USER_IDS.SERVER
					//|| //that user is already connected 
					//|| //this user not expected
				)
				{
					ECGame.log.info("Hacker ID ignored: " + inUser.userName);
					//TODO HACKER DISCONNECT THEM!
					return;
				}
				
				if(ECGame.Settings.DEBUG /*&& ECGame.Settings.Debug.NetworkMessages_Print*/)
				{
					ECGame.log.info("Identified User: " + inUser.userName);
				}
				this.broadcast.emit('msg', this.gameUser.userName + " identified as " + inUser.userName);
				
				this.gameUser.userName = inUser.userName;
				if(inUser.userID === ECGame.EngineLib.User.USER_IDS.NEW_USER)
				{
					//TODO MAX_EVER! Reuse some of these with 'secret keys'
					this.gameUser.userID = inUser.userID = ++(ECGame.EngineLib.User.USER_IDS.CURRENT_MAX);
					this.emit('id', this.gameUser);
					
					ECGame.log.info("New UserID FOR: " + inUser.userName + ' : ' + this.gameUser.userID);
				}
				else
				{
					//TODO see if this user was really here before!
					this.gameUser.userID = inUser.userID;
					ECGame.log.info("New userid FROM: " + inUser.userName + ' : ' + this.gameUser.userID);
				}
				
				aThis.onEvent(new ECGame.EngineLib.Events.IdentifiedUser(inUser));
			}
			else
			{
				ECGame.instance.localUser.userName = inUser.userName;
				ECGame.instance.localUser.userID = inUser.userID;
				if(ECGame.Settings.DEBUG /*&& ECGame.Settings.Debug.NetworkMessages_Print*/)
				{
					ECGame.log.info("Server Re-ID's me as: " + inUser.userName + ' : ' + inUser.userID);
				}
			}
		},



		_onMsgRecv : function _onMsgRecv(inMsg)
		{
			var aThis = ECGame.instance.network;
			
			if(ECGame.Settings.isDebugPrint_NetworkMessages())
			{
				ECGame.log.info("Net Recv Msg: " + inMsg);
			}
			
			aThis.onEvent(new ECGame.EngineLib.Events.Msg(inMsg));
			
			if(ECGame.Settings.Network.isServer)
			{
				//TODO cap size?
				this.broadcast.emit('msg', this.gameUser.userName + ': ' + inMsg);
			}
		},



		_onDataRecv : function _onDataRecv(inData)
		{
			var aThis = ECGame.instance.network;
			
			var event = new ECGame.EngineLib.Events.Data(inData);
			
			if(ECGame.Settings.isDebugPrint_NetworkMessages())
			{
				ECGame.log.info("Net Recv Data: " + inData);
			}

			//if this errors, don't do the rest, ESP not resend!
			if(aThis._serializeObjectsIn(event, this, {NET : true}))
			{
				aThis.onEvent(event);
				if(ECGame.Settings.Network.isServer)
				{
					//Note: 'this' is the recieving socket here
					this.broadcast.emit('data', inData);
				}
			}
		},



		_onObjectsRecv : function _onObjectsRecv(inData)
		{
			var aThis = ECGame.instance.network;
			
			var event = new ECGame.EngineLib.Events.NetObjects(inData);
			
			if(ECGame.Settings.isDebugPrint_NetworkMessages())
			{
				ECGame.log.info("Net Recv Obj: " + inData);
			}

			//if this errors, don't do the rest, ESP not resend!
			if(aThis._serializeObjectsIn(event, this, {NET : false}))//TODO instead of !NET, maybe should be FULL or something
			{
				aThis.onEvent(event);
				if(ECGame.Settings.Network.isServer)
				{
					//Note: 'this' is the recieving socket here
					this.broadcast.emit('data', inData);
				}
			}
		},


		/*
		update : function update(inDt)
		{
			var dirtyObjects = [];
			
			if(ECGame.Settings.isDebugDraw_NetworkMessages())
			{
				ECGame.instance.graphics.drawDebugText(
					"Network out:",
					ECGame.Settings.Debug.NetworkMessages_DrawColor
				);
			}
			
			//TODO have a net dirty class list instead of iterating over everything!
			ECGame.EngineLib.Class.getInstanceRegistry().forAll(
				function ?name?(inClass)
				{
					//TODO get rid of this when we have class dirty list instead of looping thru all classes.
					if(!inClass._flags.net)
					{
						return;
					}
						
					if(ECGame.Settings.isDebugDraw_NetworkMessages())
					{
						ECGame.instance.graphics.drawDebugText(
							'    ' + inClass.getName(),
							ECGame.Settings.Debug.NetworkMessages_DrawColor
						);
					}
					
					inClass.getInstanceRegistry().forAll(
						function ?name?(inObject)
						{
							//TODO skip objects we do not own (but queue owner changes in netserialize queue from object?)
							if(inClass._flags.net && inObject.isNetDirty()
							//	&& inObject.getNetOwnerID() === ECGame.instance.localUser.userName
							)
							{
								if(ECGame.Settings.isDebugDraw_NetworkMessages())
								{
									ECGame.instance.graphics.drawDebugText(
										'        -' + inObject.getName()
										,ECGame.Settings.Debug.NetworkMessages_DrawColor
									);
								}
								dirtyObjects.push(inObject);
								inObject.clearNetDirty();
							}
						}
					);
				}
			);
			
			while(dirtyObjects.length !== 0)
			{
				this._serializer.initWrite({NET : true});
				
				this._messageHeader.numObjects = Math.min(this._maxItemsPerMessage, dirtyObjects.length);
				this._messageHeader.userID = ECGame.instance.localUser.userID;
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
				if(ECGame.Settings.isDebugPrint_NetworkMessages())
				{
					ECGame.log.info("NetSend: " + sendData);
				}
				
				this._sendData(sendData);
				
				dirtyObjects = dirtyObjects.slice(this._messageHeader.numObjects);
			}
		},*/



		/*
		TODO in called from here:
		unpack()
			throw	//from logerror!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		*/
		_serializeObjectsIn : function _serializeObjectsIn(inEvent, inSocket, inSerializerFlags)
		{
			var i, readObjects;
			
			this._serializer.initRead(inSerializerFlags, inEvent.data);
			
			if(ECGame.Settings.isDebugDraw_NetworkMessages())
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
					if(ECGame.Settings.isDebugPrint_NetworkMessages())
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
						if(ECGame.Settings.isDebugPrint_NetworkMessages())
						{
							ECGame.log.info("Network Creating: " + objectClass.getName() + ' : ' + this._objectHeader.instanceID);
						}
						object = objectClass.create();
						object.setID(this._objectHeader.instanceID);
					}
					else if(ECGame.Settings.isDebugPrint_NetworkMessages())
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
					
					if(ECGame.Settings.isDebugDraw_NetworkMessages())
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
			this._netDirtyInstances[className] = this._netDirtyInstances[className] || [];
			this._netDirtyInstances[className].push(inObject);
		},
		addNewObject : function addNewObject(inObject)
		{
			var className = inObject.getClass().getName();
			this._newInstances[className] = this._newInstances[className] || [];
			this._newInstances[className].push(inObject);
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
			
			drawNetObjects = ECGame.Settings.isDebugDraw_NetworkMessages();
				
			if(drawNetObjects)
			{
				ECGame.instance.graphics.drawDebugText(
					"Network out:",
					ECGame.Settings.Debug.NetworkMessages_DrawColor
				);
			}
			
			allRelevantObjects = [];
			//sending the new objects
			for(className in this._newInstances)
			{
				classInstanceList = this._newInstances[className];
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
					
					if(ECGame.Settings.isDebugPrint_NetworkMessages())
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
			this._newInstances = {};
			this._serializeObjectsOut(allRelevantObjects, {NET : false});//TODO flag FULL instead??
			
			allRelevantObjects = [];
			//sending the dirty objects
			for(className in this._netDirtyInstances)
			{
				classInstanceList = this._netDirtyInstances[className];
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
					
					if(ECGame.Settings.isDebugPrint_NetworkMessages())
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
			this._netDirtyInstances = {};
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
});

		
