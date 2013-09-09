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
Network TODO notes
-ping/simulate high
-interpret user serialize instead of not obfuscating it
-seek and destroy other TODO's in network code
-reconnects
-hook up chat again thru netgroups

-seperate files for netgroup etcs

-obj delete properties
-reexamine netdirtys

-map serialize delta !compute delta

-socketio blocks 80? / remove socketio
-TEMP_HACK_NEW_NETWORK

-netdraw (remove them)
-net log levels //less verbose net printing option

-dont dirty new objs in netgroup
-send crap to svr test (login/post login)
	try sending all kinds of garbage to the server to see how it handles.  lots of places it will fail atm I think!
-steal ownership/dummy read test
-class/inst id sizes
-close Sockets Properly at gameover!!!

-check naming convention!!

-netgroup obj sleep?

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
TODO

Command : Object
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




/*//all user objects should be added to netgroups as objects
User : Object
	-name
	-id
	-ping
	-connected (bool)
	-socket (server only??)
	-fb/pic/etc?
	-serialize if locally owned?, make local User
	-netgroup (there can only be one)
	-onDisconnectedToLongTimer
*/
//TODO make server id for smaller messages!!
//Note: watch out when adding new values to this structure as it is serialized
ECGame.EngineLib.User = function User(inName, inID)
{
	this.userName = inName || "Guest";	//TODO give random name here??
	this.userID = inID || ECGame.EngineLib.User.USER_IDS.NEW_USER;
	this.reconnectKey = Math.random();
	//this.mySocket = null;	//this is added later..
};
ECGame.EngineLib.User.prototype.constructor = ECGame.EngineLib.User;
ECGame.EngineLib.User.USER_IDS =
{
	UNUSED : 0
	,SERVER : 1
	,NEW_USER : 2
	
	,CURRENT_MAX : 2	//enum max!	TODO make static, and this one is not const!
	
	,MAX_EVER : 65535
};







/*
NetGroup	//1 netgroup per user, 0-many netgroups per object
	-users
		-socket	//need to keep alive, AND reconnect
	//TODO suspend object somehow?
*/
ECGame.EngineLib.NetGroup = ECGame.EngineLib.Class.create({
	Constructor : function NetGroup()
	{
		this._myNetwork = null;
		this._myUsers = [];
		this._myTrackedInstances = {};
		this._myNewInstances = {};
		this._myNetDirtyInstances = {};
		this._myDestroyInstances = {};
		
		this._myForwardDirtyObjects = {};//[class][origin userid][objects..]
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
		},
		
		update : function update()//TODO onUpdate
		{
			var
				//user
				aCurrentUserIndex,
				aCurrentUser,
				aUserMap,
				aSourceUserIndex,
				//class
				aClassName,
				anInstanceList,
				//lists
				aNewInstanceList,
				aDirtyInstanceList,
				aDestroyInstanceList,
				//binary buffer
				aBinaryBuffer;
				
			//send all new, dirty, and destroyed instances to all users
			for(aCurrentUserIndex in this._myUsers)
			{
				aCurrentUser = this._myUsers[aCurrentUserIndex];
				
				if(!aCurrentUser.mySocket)
				{
					//TODO queue changes for reconnect?? if so, handle correctly in game too..
					continue;
				}
				
				aNewInstanceList = [];
				aDirtyInstanceList = [];
				aDestroyInstanceList = [];
				
				//queue up new instances
				for(aClassName in this._myNewInstances)
				{
					anInstanceList = this._myNewInstances[aClassName];
					aNewInstanceList = aNewInstanceList.concat(anInstanceList);
				}
				
				//queue up dirty instances
				for(aClassName in this._myNetDirtyInstances)
				{
					anInstanceList = this._myNetDirtyInstances[aClassName];
					aDirtyInstanceList = aDirtyInstanceList.concat(anInstanceList);
				}
				
				//queue up dirty instances from other clients
				for(aClassName in this._myForwardDirtyObjects)
				{
					aUserMap = this._myForwardDirtyObjects[aClassName];
					for(aSourceUserIndex in aUserMap)
					{
						if(aCurrentUser.userID !== parseInt(aSourceUserIndex, 10))
						{
							anInstanceList = aUserMap[aSourceUserIndex];
							aDirtyInstanceList = aDirtyInstanceList.concat(anInstanceList);
						}
					}
				}
				
				//only the server should order destroy's
				if(ECGame.Settings.Network.isServer)
				{
					//queue up the destroy objects
					for(aClassName in this._myDestroyInstances)
					{
						anInstanceList = this._myDestroyInstances[aClassName];
						aDestroyInstanceList = aDestroyInstanceList.concat(anInstanceList);
					}
				}
				
				if(aNewInstanceList.length !== 0
					|| aDirtyInstanceList.length !== 0
					|| aDestroyInstanceList.length !== 0
				)
				{
					aBinaryBuffer = this._myNetwork.serializeOut(
						aCurrentUser,
						aNewInstanceList,
						aDirtyInstanceList,
						aDestroyInstanceList
					);
					aCurrentUser.mySocket.send(aBinaryBuffer);
				}
			}
			
			//clear our lists for the next frame
			this._myNewInstances = {};
			this._myNetDirtyInstances = {};
			this._myDestroyInstances = {};
			this._myForwardDirtyObjects = {};
		},
				
		addUser : function addUser(inUser)
		{
			var
				aClassName,
				anInstanceList,
				aNewInstanceList,
				aBinaryBuffer;
				
			//TODO consider changing to avoid double serialization
			
			//if the user is already here, bail
			if(this._myUsers.indexOf(inUser) !== -1)
			{
				return;
			}
			
			//add the user
			this._myUsers.push(inUser);
			
			if(!ECGame.Settings.Network.isServer)
			{
				return;
			}
			
			//serialize all this._myTrackedInstances to user as new instances
			aNewInstanceList = [];
			for(aClassName in this._myTrackedInstances)
			{
				anInstanceList = this._myTrackedInstances[aClassName];
				aNewInstanceList = aNewInstanceList.concat(anInstanceList);
			}
			aBinaryBuffer = this._myNetwork.serializeOut(
				inUser,
				aNewInstanceList,
				null,
				null
			);
			inUser.mySocket.send(aBinaryBuffer);
		},
		removeUser : function removeUser(inUser)
		{
			var anIndex, aLength;
			
			anIndex = this._myUsers.indexOf(inUser);
			if(anIndex !== -1)
			{
				aLength = this._myUsers.length;
				this._myUsers[anIndex] = this._myUsers[aLength - 1];
				this._myUsers.pop();
			}
			//TODO consider sending all _myTrackedInstances for destruction (like maybe a team switch?)
		},
		
		/*addOneTimeObject : function addOneTimeObject(inObject)
		{
			var aClassName;
			
			aClassName = inObject.getClass().getName();
			
			//add to new
			this._myNewInstances[aClassName] = this._myNewInstances[aClassName] || [];
			this._myNewInstances[aClassName].push(inObject);
		},*/
		
		addObject : function addObject(inObject)
		{
			var aClassName,
				anIndex,
				aLength;

			aClassName = inObject.getClass().getName();
			
			//make sure there is a list for this class
			this._myTrackedInstances[aClassName] = this._myTrackedInstances[aClassName] || [];
			//if the object is already tracked, return
			if(this._myTrackedInstances[aClassName].indexOf(inObject) !== -1)
			{
				return;
			}
			//add to tracked
			this._myTrackedInstances[aClassName].push(inObject);

			//listen to object messages: onNetDirty / onDestroy
			inObject.registerListener('GameObjectNetDirty', this);
			inObject.registerListener('GameObjectDestroyed', this);
			
			//make sure there is a list for this class
			this._myDestroyInstances[aClassName] = this._myDestroyInstances[aClassName] || [];
			//if the object is set to be destroyed, remove that
			anIndex = this._myDestroyInstances[aClassName].indexOf(inObject);
			if(anIndex !== -1)
			{
				aLength = this._myDestroyInstances[aClassName].length;
				this._myDestroyInstances[aClassName][anIndex] = this._myDestroyInstances[aClassName][aLength - 1];
				this._myDestroyInstances[aClassName].pop();
			}
			
			if(!ECGame.Settings.Network.isServer)//TODO <= this is a temp hack.  In most cases clients should not create, so this is a hack for now
			{
				return;
			}
			
			//add to new
			this._myNewInstances[aClassName] = this._myNewInstances[aClassName] || [];
			this._myNewInstances[aClassName].push(inObject);
		},
		removeObject : function removeObject(inObject)
		{
			var aClassName,
				anIndex,
				aLength;
			
			aClassName = inObject.getClass().getName();
			
			//remove from tracked instances
			anIndex = this._myTrackedInstances[aClassName].indexOf(inObject);
			if(anIndex !== -1)
			{
				aLength = this._myTrackedInstances[aClassName].length;
				this._myTrackedInstances[aClassName][anIndex] = this._myTrackedInstances[aClassName][aLength - 1];
				this._myTrackedInstances[aClassName].pop();
			}
			else //the object isn't tracked, don't bother with the rest!!
			{
				return;
			}
			
			//be sure this list exists
			this._myDestroyInstances[aClassName] = this._myDestroyInstances[aClassName] || [];
			//if the object is already set to be destroyed, return
			anIndex = this._myDestroyInstances[aClassName].indexOf(inObject);
			if(anIndex !== -1)
			{
				return;
			}
			//add to the destroy list
			this._myDestroyInstances[aClassName].push(inObject);
			
			//stop listening to object messages: onNetDirty / onDestroy
			inObject.deregisterListener('GameObjectNetDirty', this);
			inObject.deregisterListener('GameObjectDestroyed', this);
			
			//be sure this list exists
			this._myNewInstances[aClassName] = this._myNewInstances[aClassName] || [];
			//remove from new instances
			anIndex = this._myNewInstances[aClassName].indexOf(inObject);
			if(anIndex !== -1)
			{
				aLength = this._myNewInstances[aClassName].length;
				this._myNewInstances[aClassName][anIndex] = this._myNewInstances[aClassName][aLength - 1];
				this._myNewInstances[aClassName].pop();
			}
			
			//be sure this list exists
			this._myNetDirtyInstances[aClassName] = this._myNetDirtyInstances[aClassName] || [];
			//remove from the dirty list
			anIndex = this._myNetDirtyInstances[aClassName].indexOf(inObject);
			if(anIndex !== -1)
			{
				aLength = this._myNetDirtyInstances[aClassName].length;
				this._myNetDirtyInstances[aClassName][anIndex] = this._myNetDirtyInstances[aClassName][aLength - 1];
				this._myNetDirtyInstances[aClassName].pop();
			}
			
			//TODO remove from myForwardObjects?
		},
		
		onGameObjectNetDirty : function onGameObjectNetDirty(inEvent)
		{
			var aClassName,
				anObject,
				anIndex,
				aUserID;
			
			anObject = inEvent.myObject;
			aClassName = anObject.getClass().getName();
			aUserID = inEvent.myUserID;
			
			//no needed check if this can be written to by local user (it is done in object instead)
			
			if(!aUserID) //if no user is specified:
			{
				//make sure entry exists for this class
				this._myNetDirtyInstances[aClassName] = this._myNetDirtyInstances[aClassName] || [];
				
				//if it is already dirty, forget it
				anIndex = this._myNetDirtyInstances[aClassName].indexOf(anObject);
				if(anIndex !== -1)
				{
					return;
				}
				
				//it is dirty
				this._myNetDirtyInstances[aClassName].push(anObject);
			}
			else //this is from a user, we are just forwarding it
			{
				//make sure there is a list for this class
				this._myForwardDirtyObjects[aClassName] = this._myForwardDirtyObjects[aClassName] || {};
				
				//make sure there is 'from user'
				this._myForwardDirtyObjects[aClassName][aUserID] = this._myForwardDirtyObjects[aClassName][aUserID] || [];
				
				//if its already there, skip this
				anIndex = this._myForwardDirtyObjects[aClassName][aUserID].indexOf(anObject);
				if(anIndex !== -1)
				{
					return;
				}
				
				//queue this object
				this._myForwardDirtyObjects[aClassName][aUserID].push(anObject);
			}
		},
		
		onGameObjectDestroyed : function onGameObjectDestroyed(inEvent)
		{
			this.removeObject(inEvent.myObject);
		}
		
		//TODO chat messages
	}
});







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
		this.GameEventSystem();
				
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
	Parents : [ECGame.EngineLib.GameEventSystem],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init()
		{
			this.createNetGroup('master_netgroup');
//			ECGame.log.warn("Depricated!!!");
		},
		//TODO add objects to appropriate netgroups
		addNewObject : function addNewObject()
		{
//			ECGame.log.warn("Depricated!!!");
		},
		//TODO remove, for backwards compat..
		addNetDirtyObject : function addNetDirtyObject()
		{
//			ECGame.log.warn("Depricated!!!");
		},
		
		//TODO send chat command to all
		sendMessage : function sendMessage()
		{
//			ECGame.log.warn("Depricated!!! ????");
		},
		
		update : function update()//TODO onUpdate?
		{
			var aNetGroupIndex,
				aNetGroup,
				aClassName,
				anInstanceMap,
				anInstanceID;
			
			for(aNetGroupIndex in this._myNetGroups)
			{
				aNetGroup = this._myNetGroups[aNetGroupIndex];
				aNetGroup.update();//TODO params??
			}
			
			for(aClassName in this._mySerializedObjects)
			{
				anInstanceMap = this._mySerializedObjects[aClassName];
				for(anInstanceID in anInstanceMap)
				{
					ECGame.log.info("Clear Net Dirty on:" + anInstanceMap[anInstanceID].getName());
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
			ECGame.log.assert(inNewInstanceList.length < this._ourMaxItemsPerMessage, "Cannot currently serialize so many objects!");
			ECGame.log.assert(inDirtyInstanceList.length < this._ourMaxItemsPerMessage, "Cannot currently serialize so many objects!");
			ECGame.log.assert(inDestroyInstanceList.length < this._ourMaxItemsPerMessage, "Cannot currently serialize so many objects!");
			
			//TODO log what we are sending!
			
			this._mySerializer.init({BINARY_MODE : true, NET_MODE : false});
			
			aMessageHeader.userID = ECGame.instance.localUser.userID;
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
					ECGame.log.info("Net create remote on " + inUser.userName + ':' + JSON.stringify(anObjectHeader));
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
					ECGame.log.info("Net write to " + inUser.userName + ':' + JSON.stringify(anObjectHeader));
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
					ECGame.log.info("Net Destroy on " + inUser.userName + ':' + JSON.stringify(anObjectHeader));
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
			
			if(ECGame.Settings.isDebugDraw_NetworkMessages())
			{
				ECGame.instance.graphics.drawDebugText(
					"Network in:",
					ECGame.Settings.Debug.NetworkMessages_DrawColor
				);
			}
			
			//serializer without netflag at start to get full versions of objects
			this._mySerializer.init({BINARY_MODE : true}, inBuffer);
			
			try
			{
				this._mySerializer.serializeObject(aMessageHeader, this._ourMessageHeaderFormat);
				
				//check that the username matches the socket user
				ECGame.log.assert(
					(aMessageHeader.userID === inUser.userID
					//|| inUser.userID === ECGame.EngineLib.User.USER_IDS.SERVER
					)
					,"Net user not identifying self correctly: " + (aMessageHeader.userID + ' != ' + inUser.userID)
				);//TODO should this assert or return?  Where is it caught? can we disrupt lots of the server function by asserting here
				
				if(ECGame.Settings.isDebugDraw_NetworkMessages())
				{
					ECGame.instance.graphics.drawDebugText(
						"    New:",
						ECGame.Settings.Debug.NetworkMessages_DrawColor
					);
				}
				//for all the new objects:
				for(i = 0; i < aMessageHeader.newObjects; ++i)
				{
					//read the header
					this._mySerializer.serializeObject(anObjectHeader, this._objectHeaderFormat);
					
					if(ECGame.Settings.isDebugPrint_NetworkMessages())
					{
						ECGame.log.info("Net create remotely command from " + inUser.userName + ':' + JSON.stringify(anObjectHeader));
					}
					
					//find the class
					anObjectClass = ECGame.EngineLib.Class.getInstanceRegistry().findByID(anObjectHeader.classID);
					if(!anObjectClass)
					{
						if(ECGame.Settings.isDebugPrint_NetworkMessages())
						{
							//TODO needs to be more than a warning here
							ECGame.log.warn("Unknown classID " + anObjectHeader.classID);
						}
					}
					
					ECGame.log.assert(
						!ECGame.Settings.Network.isServer //TODO!!!: || client can create this type
						,"Looks like we have a hacker!" + JSON.stringify(inUser.userID)
					);

					//find the instance
					anObject = anObjectClass.getInstanceRegistry().findByID(anObjectHeader.instanceID);
//TODO: ECGame.log.assert(!anObject ,"New Network Object already exists!:" + anObject.getTxtPath());
					
					//if not found, and not server, create it
					if(!anObject)
					{
						if(ECGame.Settings.isDebugPrint_NetworkMessages())
						{
							ECGame.log.info("Network Creating: " + anObjectClass.getName() + ':' + anObjectHeader.instanceID);
						}
						anObject = anObjectClass.create();
						anObject.setID(anObjectHeader.instanceID);
						//add network created objects to the master netgroup //TODO maybe it should go in the users netgroup also/instead..
						this.getNetGroup('master_netgroup').addObject(anObject);
					}
					else if(ECGame.Settings.isDebugPrint_NetworkMessages())	//TODO this branch should not be possible in the future!
					{
						ECGame.log.info("Network Changing (instead of creating): " + anObjectClass.getName() + ':' + anObjectHeader.instanceID);
					}
					
					anObject.serialize(this._mySerializer);
					aReadObjectsList.push(anObject);
					
					if(ECGame.Settings.isDebugDraw_NetworkMessages())
					{
						ECGame.instance.graphics.drawDebugText(
							'        -' + anObject.getTxtPath()
							,ECGame.Settings.Debug.NetworkMessages_DrawColor
						);
					}
				}
				
				this._mySerializer.setNetMode(true);
				if(ECGame.Settings.isDebugDraw_NetworkMessages())
				{
					ECGame.instance.graphics.drawDebugText(
						"    Dirty:",
						ECGame.Settings.Debug.NetworkMessages_DrawColor
					);
				}
				//for all the dirty objects:
				for(i = 0; i < aMessageHeader.dirtyObjects; ++i)
				{
					//read the header
					this._mySerializer.serializeObject(anObjectHeader, this._objectHeaderFormat);
					
					if(ECGame.Settings.isDebugPrint_NetworkMessages())
					{
						ECGame.log.info("Net reading from " + inUser.userName + ':' + JSON.stringify(anObjectHeader));
					}
					
					//find the class
					anObjectClass = ECGame.EngineLib.Class.getInstanceRegistry().findByID(anObjectHeader.classID);
					if(!anObjectClass)
					{
						if(ECGame.Settings.isDebugPrint_NetworkMessages())
						{
							ECGame.log.warn("Unknown classID " + anObjectHeader.classID);
						}
					}
					
					//find the instance
					anObject = anObjectClass.getInstanceRegistry().findByID(anObjectHeader.instanceID);
					ECGame.log.assert(
						anObject,
						//TODO use proper object path style
						"Dirty Network Object doesn't exists!:" + anObjectClass.getName() + ':' + anObjectHeader.instanceID
					);
					
					if(ECGame.Settings.isDebugPrint_NetworkMessages())
					{
						ECGame.log.info("Network Changing: " + anObjectClass.getName() + ' : ' + anObjectHeader.instanceID);
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
						ECGame.log.warn("Not the owner, skipping changes!: " + aMessageHeader.userID + ' != ' + anObject.getNetOwnerID());
						this._mySerializer.setDummyMode(true);
						anObject.serialize(this._mySerializer);
						this._mySerializer.setDummyMode(false);
					}
					
					aReadObjectsList.push(anObject);
					
					if(ECGame.Settings.isDebugDraw_NetworkMessages())
					{
						ECGame.instance.graphics.drawDebugText(
							'        -' + anObject.getTxtPath()
							,ECGame.Settings.Debug.NetworkMessages_DrawColor
						);
					}
				}
				
				for(i = 0; i < aReadObjectsList.length; ++i)
				{
					if(aReadObjectsList[i].postSerialize)//TODO make this chain function so we don't have to check for it???
					{
						aReadObjectsList[i].postSerialize();
					}
				}
				
				if(ECGame.Settings.isDebugDraw_NetworkMessages())
				{
					ECGame.instance.graphics.drawDebugText(
						"    Destroy:",
						ECGame.Settings.Debug.NetworkMessages_DrawColor
					);
				}
				
				ECGame.log.assert(
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
						ECGame.log.info("Net destroy remotely order from " + inUser.userName + ':' + JSON.stringify(anObjectHeader));
					}
					
					//find the class
					anObjectClass = ECGame.EngineLib.Class.getInstanceRegistry().findByID(anObjectHeader.classID);
					if(!anObjectClass)
					{
						if(ECGame.Settings.isDebugPrint_NetworkMessages())
						{
							ECGame.log.warn("Unknown classID " + anObjectHeader.classID);
						}
					}
					//find the instance
					anObject = anObjectClass.getInstanceRegistry().findByID(anObjectHeader.instanceID);
					
					if(!anObject)
					{
						ECGame.log.info(
							"Network object to destroy doesn't exists!:" + anObjectClass.getName() + ':' + anObjectHeader.instanceID
						);
						continue;
					}
					
					if(ECGame.Settings.isDebugDraw_NetworkMessages())
					{
						ECGame.instance.graphics.drawDebugText(
							'        -' + anObject.getTxtPath()
							,ECGame.Settings.Debug.NetworkMessages_DrawColor
						);
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
