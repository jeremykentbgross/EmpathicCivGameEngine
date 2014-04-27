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
Generally good references:
http://www.w3.org/TR/websockets/#the-websocket-interface
http://www.iana.org/assignments/websocket/websocket.xml#subprotocol-name
https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking
*/


/*
Network TODOs:

-seek and destroy other TODO's in network code

-ping
-Use Object Serialization on User (as in User object) instead of not obfuscating its members
-reconnects
-hook up chat again thru netgroups
-reexamine netdirtys

-update network at only 20-30hz?

-dont dirty new objs in netgroup?

-Tests:
	-send crap to svr test (login/post login)
		try sending all kinds of garbage to the server to see how it handles.  lots of places it will fail atm I think!
	-steal ownership/dummy read test
	
-map serialize delta !compute delta (world entities and entity components)
-class/inst id sizes
-close Sockets Properly at gameover!!!

**bkup other code!!!
*/


/*
TODO:
	Events.IdentifiedUser			//GameRules spawn
	Events.ClientDisconnected		//GameRules unspawn
	Events.ConnectedToServer		//chat
	Events.DisconnectedFromServer	//chat
	Events.Msg						//chat
	Events.Data						//Not used!
	Events.NetObjects				//Not used!
*/


/*
TODO:

Command : Object	//or RPC?
	Command()
		queue up command to execute
	-run()
	{
		execute();
		this.destroy();
	}
	-execute();//pure virtual

?? or use the old one?
Chat : Command
	//client can create

ReportID : command
	//client can create
SetUserID : Command
	//client CANNOT create

...

*/






/*
Network
	
//SHARED
	-maxItemsPerMessage
	-objectHeaderFormat
	-messageHeaderFormat
	-objectHeader
	-messageHeader
	-serializer
	
	//Old code to pillage from:
	_onIdRecv()
		//if server
		//	security checks
		//	if new user send them new id
		//	else reuse old one (todo security)
		//	event user id'ed
		//else overwrite user id with one from server
	_onMsgRecv()
		//event message
		//if server pass it on
	_onDataRecv()***
		//read objects as net objects
		//event data
		//if server and no errors, pass it on
	_onObjectsRecv()***
		//read objects as NOT net objects
		//event objects
		//if server and no errors, pass it on
	sendMessage()//note this is just text
		//if server send to all
		//else send to socket and tell listener it was sent
	_sendData()** //maybe message header defines these
		//if server send data to all or specific socket
		//else send
	_sendObj()**
		//if server send data to all or specific socket
		//else send
	_serializeObjectsIn()
		//read in objects, create when needed
	_serializeObjectsOut()
		//send it with headers and all
*/
ECGame.EngineLib.NetworkBase = ECGame.EngineLib.Class.create({
	Constructor : function NetworkBase()
	{
		this.EventSystem();
				
		this._mySerializer = ECGame.EngineLib.BinarySerializer.create();
		this._myNetGroups = {};
		this._mySerializedObjects = {};	//[class][instance id]
		
		//TODO rename these (and _objectHeaderFormat)
		this._ourMaxItemsPerMessage = 255;
		this._ourMessageHeaderFormat =
		[
			//local clock? etc etc //TODO ping/clock/pulse, last recieved clock tick
			{
				name : 'userID',
				type : 'int',
				net : true,
				min : 0,
				max : ECGame.EngineLib.User.USER_IDS.MAX_EVER
			},
			{
				name : 'newObjects',
				type : 'int',
				net : true,
				min : 0,
				max : this._ourMaxItemsPerMessage
			},
			{
				name : 'dirtyObjects',
				type : 'int',
				net : true,
				min : 0,
				max : this._ourMaxItemsPerMessage
			},
			{
				name : 'destroyObjects',
				type : 'int',
				net : true,
				min : 0,
				max : this._ourMaxItemsPerMessage
			}
		];
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
		
		
		
	},
	Parents : [ECGame.EngineLib.EventSystem],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init()
		{
			this.createNetGroup('master_netgroup');
			ECGame.instance.getUpdater("MasterUpdater").addUpdate(this);
		},
		
		//TODO send chat command to all
		sendMessage : function sendMessage()
		{
			console.warn("Chat is Broken atm!!!");
		},
		
		getUpdatePriority : function getUpdatePriority()
		{
			return ECGame.Settings.UpdateOrder.NETWORK;
		},
		
		update : function update(inUpdateData)
		{
			var aNetGroupIndex,
				aNetGroup,
				aClassName,
				anInstanceMap,
				anInstanceID;
			
			for(aNetGroupIndex in this._myNetGroups)
			{
				aNetGroup = this._myNetGroups[aNetGroupIndex];
				aNetGroup.update(inUpdateData);
			}
			
			for(aClassName in this._mySerializedObjects)
			{
				anInstanceMap = this._mySerializedObjects[aClassName];
				for(anInstanceID in anInstanceMap)
				{
					if(ECGame.Settings.isDebugPrint_NetworkMessages())
					{
						console.info("Clear Net Dirty on:" + anInstanceMap[anInstanceID].getName());
					}
					anInstanceMap[anInstanceID].clearNetDirty();
				}
			}
			this._mySerializedObjects = {};
		},
		
		createNetGroup : function createNetGroup(inName)
		{
			if(!this._myNetGroups[inName])
			{
				this._myNetGroups[inName] = ECGame.EngineLib.NetGroup.create(this);
			}
			return this._myNetGroups[inName];
		},
		getNetGroup : function getNetGroup(inName)
		{
			return this._myNetGroups[inName];
		},
		/*
		broadcast : function broadcast(inMsg)
		{
			var aNetGroupName;
			for(aNetGroupName in this._myNetGroups)
			{
				this._myNetGroups[aNetGroupName].addOneTimeObject(inMsg);???
			}
		},
		*/
		serializeOut : function serializeOut(
			inUser,
			inNewInstanceList,
			inDirtyInstanceList,
			inDestroyInstanceList
		)
		{
			var anObject,
				aMessageHeader,
				anObjectHeader,
				aClassName,
				i;
				
			inNewInstanceList = inNewInstanceList || [];
			inDirtyInstanceList = inDirtyInstanceList || [];
			inDestroyInstanceList = inDestroyInstanceList || [];

			anObjectHeader = {};
			aMessageHeader = {};
			
			//TODO I think there will be other bugs with postload if not all are present, so forget looping for multiple sends atm!
			console.assert(inNewInstanceList.length < this._ourMaxItemsPerMessage, "Cannot currently serialize so many objects!");
			console.assert(inDirtyInstanceList.length < this._ourMaxItemsPerMessage, "Cannot currently serialize so many objects!");
			console.assert(inDestroyInstanceList.length < this._ourMaxItemsPerMessage, "Cannot currently serialize so many objects!");
			
			//TODO log what we are sending!
			
			this._mySerializer.init({BINARY_MODE : true, NET_MODE : false});
			
			aMessageHeader.userID = ECGame.instance.getLocalUser().userID;
			aMessageHeader.newObjects = Math.min(this._ourMaxItemsPerMessage, inNewInstanceList.length);
			aMessageHeader.dirtyObjects = Math.min(this._ourMaxItemsPerMessage, inDirtyInstanceList.length);
			aMessageHeader.destroyObjects = Math.min(this._ourMaxItemsPerMessage, inDestroyInstanceList.length);
			this._mySerializer.serializeObject(aMessageHeader, this._ourMessageHeaderFormat);
			
			this._mySerializer.setNetMode(false);
			for(i = 0; i < aMessageHeader.newObjects; ++i)
			{
				anObject = inNewInstanceList[i];
				anObjectHeader.classID = anObject.getClass().getID();
				anObjectHeader.instanceID = anObject.getID();
				this._mySerializer.serializeObject(anObjectHeader, this._objectHeaderFormat);
				anObject.serialize(this._mySerializer);
				
				if(ECGame.Settings.isDebugPrint_NetworkMessages())
				{
					console.info("Net create remote on " + inUser.userName + ':' + JSON.stringify(anObjectHeader)
						+ '=>(' + anObject.getClass().getName() + ':' + anObjectHeader.instanceID + ')'
					);
				}
				
				aClassName = anObject.getClass().getName();
				this._mySerializedObjects[aClassName] = this._mySerializedObjects[aClassName] || {};
				this._mySerializedObjects[aClassName][anObject.getID()] = anObject;
			}
			
			this._mySerializer.setNetMode(true);
			for(i = 0; i < aMessageHeader.dirtyObjects; ++i)
			{
				anObject = inDirtyInstanceList[i];
				anObjectHeader.classID = anObject.getClass().getID();
				anObjectHeader.instanceID = anObject.getID();
				this._mySerializer.serializeObject(anObjectHeader, this._objectHeaderFormat);
				anObject.serialize(this._mySerializer);
				
				if(ECGame.Settings.isDebugPrint_NetworkMessages())
				{
					console.info("Net write to " + inUser.userName + ':' + JSON.stringify(anObjectHeader));
				}
				
				aClassName = anObject.getClass().getName();
				this._mySerializedObjects[aClassName] = this._mySerializedObjects[aClassName] || {};
				this._mySerializedObjects[aClassName][anObject.getID()] = anObject;
			}
			
			for(i = 0; i < aMessageHeader.destroyObjects; ++i)
			{
				anObject = inDestroyInstanceList[i];
				anObjectHeader.classID = anObject.getClass().getID();
				anObjectHeader.instanceID = anObject.getID();
				this._mySerializer.serializeObject(anObjectHeader, this._objectHeaderFormat);
				
				if(ECGame.Settings.isDebugPrint_NetworkMessages())
				{
					console.info("Net Destroy on " + inUser.userName + ':' + JSON.stringify(anObjectHeader));
				}
			}
			
			return this._mySerializer.getTypedArray();
		},
		
		serializeIn : function serializeIn(inUser, inBuffer)
		{
			var aMessageHeader,
				anObjectHeader,
				aReadObjectsList,
				anObjectClass,
				anObject,
				i;
			
			anObjectHeader = {};
			aMessageHeader = {};
			aReadObjectsList = [];

			
			//serializer without netflag at start to get full versions of objects
			this._mySerializer.init({BINARY_MODE : true}, inBuffer);
			
			try
			{
				this._mySerializer.serializeObject(aMessageHeader, this._ourMessageHeaderFormat);
				
				//check that the username matches the socket user
				console.assert(
					(aMessageHeader.userID === inUser.userID
					//|| inUser.userID === ECGame.EngineLib.User.USER_IDS.SERVER
					)
					,"Net user not identifying self correctly: " + (aMessageHeader.userID + ' != ' + inUser.userID)
				);//TODO should this assert or return?  Where is it caught? can we disrupt lots of the server function by asserting here
				
				//for all the new objects:
				for(i = 0; i < aMessageHeader.newObjects; ++i)
				{
					//read the header
					this._mySerializer.serializeObject(anObjectHeader, this._objectHeaderFormat);
					
					if(ECGame.Settings.isDebugPrint_NetworkMessages())
					{
						console.info("Net create remotely command from " + inUser.userName + ':' + JSON.stringify(anObjectHeader));
					}
					
					//find the class
					anObjectClass = ECGame.EngineLib.Class.getInstanceRegistry().findByID(anObjectHeader.classID);
					if(!anObjectClass)
					{
						if(ECGame.Settings.isDebugPrint_NetworkMessages())
						{
							//TODO needs to be more than a warning here
							console.warn("Unknown classID " + anObjectHeader.classID);
						}
					}
					
					console.assert(
						!ECGame.Settings.Network.isServer //TODO!!!: || client can create this type
						,"Looks like we have a hacker!" + JSON.stringify(inUser.userID)
					);

					//find the instance
					anObject = anObjectClass.getInstanceRegistry().findByID(anObjectHeader.instanceID);
//TODO: console.assert(!anObject ,"New Network Object already exists!:" + anObject.getTxtPath());
					
					//if not found, and not server, create it
					if(!anObject)
					{
						if(ECGame.Settings.isDebugPrint_NetworkMessages())
						{
							console.info("Network Creating: " + anObjectClass.getName() + ':' + anObjectHeader.instanceID);
						}
						anObject = anObjectClass.create();
						anObject.setID(anObjectHeader.instanceID);
						//add network created objects to the master netgroup //TODO maybe it should go in the users netgroup also/instead..
						this.getNetGroup('master_netgroup').addObject(anObject);
					}
					else// if(ECGame.Settings.isDebugPrint_NetworkMessages())	//TODO this branch should not be possible in the future!
					{
						console.warn("Network Changing (instead of creating): " + anObjectClass.getName() + ':' + anObjectHeader.instanceID);
					}
					
					anObject.serialize(this._mySerializer);
					aReadObjectsList.push(anObject);
				}
				
				this._mySerializer.setNetMode(true);
				//for all the dirty objects:
				for(i = 0; i < aMessageHeader.dirtyObjects; ++i)
				{
					//read the header
					this._mySerializer.serializeObject(anObjectHeader, this._objectHeaderFormat);
					
					if(ECGame.Settings.isDebugPrint_NetworkMessages())
					{
						console.info("Net reading from " + inUser.userName + ':' + JSON.stringify(anObjectHeader));
					}
					
					//find the class
					anObjectClass = ECGame.EngineLib.Class.getInstanceRegistry().findByID(anObjectHeader.classID);
					if(!anObjectClass)
					{
						if(ECGame.Settings.isDebugPrint_NetworkMessages())
						{
							console.warn("Unknown classID " + anObjectHeader.classID);
						}
					}
					
					//find the instance
					anObject = anObjectClass.getInstanceRegistry().findByID(anObjectHeader.instanceID);
					console.assert(
						anObject,
						//TODO use proper object path style
						"Dirty Network Object doesn't exists!:" + anObjectClass.getName() + ':' + anObjectHeader.instanceID
					);
					
					if(ECGame.Settings.isDebugPrint_NetworkMessages())
					{
						console.info("Network Changing: " + anObjectClass.getName() + ':' + anObjectHeader.instanceID);
					}
					
					//if from server or from owner serialize
					if(anObject.getNetOwnerID() === aMessageHeader.userID
						|| aMessageHeader.userID === ECGame.EngineLib.User.USER_IDS.SERVER)
					{
						anObject.serialize(this._mySerializer);
						//if this is the server, dirty it for all other users so they can be updated to the changes
						if(ECGame.Settings.Network.isServer)
						{
							anObject.setNetDirty(aMessageHeader.userID);
						}
					}
					else //dummy serialize
					{
						//Note: could also maybe throw owner if !server && !owner && !recentOwnerQueue
						console.warn("Not the owner, skipping changes!: " + aMessageHeader.userID + ' != ' + anObject.getNetOwnerID());
						this._mySerializer.setDummyMode(true);
						anObject.serialize(this._mySerializer);
						this._mySerializer.setDummyMode(false);
					}
					
					aReadObjectsList.push(anObject);
				}
				
				aReadObjectsList.sort(
					function sortReadObjects(inLHS, inRHS)
					{
						var aLeftIndex
							,aRightIndex
							;
						
						//sort by class index
						aLeftIndex = inLHS.getClass().getID();
						aRightIndex = inRHS.getClass().getID();
						if(aLeftIndex !== aRightIndex)
						{
							return aLeftIndex - aRightIndex;
						}
						
						//sort by instance index
						aLeftIndex = inLHS.getID();
						aRightIndex = inRHS.getID();
						return aLeftIndex - aRightIndex;
					}
				);
				for(i = 0; i < aReadObjectsList.length; ++i)
				{
					aReadObjectsList[i].postSerialize();
				}
				
				console.assert(
					!aMessageHeader.destroyObjects || !ECGame.Settings.Network.isServer
					,"Looks like we have a hacker!" + JSON.stringify(inUser.userID)
				);
				//for all the new objects:
				for(i = 0; i < aMessageHeader.destroyObjects; ++i)
				{
					//read the header
					this._mySerializer.serializeObject(anObjectHeader, this._objectHeaderFormat);
					
					if(ECGame.Settings.isDebugPrint_NetworkMessages())
					{
						console.info("Net destroy remotely order from " + inUser.userName + ':' + JSON.stringify(anObjectHeader));
					}
					
					//find the class
					anObjectClass = ECGame.EngineLib.Class.getInstanceRegistry().findByID(anObjectHeader.classID);
					if(!anObjectClass)
					{
						if(ECGame.Settings.isDebugPrint_NetworkMessages())
						{
							console.warn("Unknown classID " + anObjectHeader.classID);
						}
					}
					//find the instance
					anObject = anObjectClass.getInstanceRegistry().findByID(anObjectHeader.instanceID);
					
					if(!anObject)
					{
						if(ECGame.Settings.isDebugPrint_NetworkMessages())
						{
							console.info(
								"Network object to destroy doesn't exists!:" + anObjectClass.getName() + ':' + anObjectHeader.instanceID
							);
						}
						continue;
					}
					
					if(ECGame.Settings.isDebugPrint_NetworkMessages())
					{
						console.info("Network Destroying: " + anObjectClass.getName() + ':' + anObjectHeader.instanceID);
					}

					anObject.destroy();
				}
			}
			catch(error)
			{
				console.log(error.stack);
				//TODO disconnect? increment damaged packets for this user?
			}
		}
	}
});
