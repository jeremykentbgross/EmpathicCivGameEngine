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
NetGroup	//1 netgroup per user, 0-many netgroups per object
	-users
		-socket	//need to keep alive, AND reconnect
	//TODO suspend object somehow?
*/
ECGame.EngineLib.NetGroup = ECGame.EngineLib.Class.create({
	Constructor : function NetGroup()
	{
		this._myNetwork = null;
		this._myNetUsers = [];
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
		
		update : function update(/*inUpdateData*/)
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
				aBinaryBuffer,
				i;
			
			//if we are not locally identified yet, don't update netgroup (TODO call from parent caller?)
			if(ECGame.instance.getLocalUser().userID === ECGame.EngineLib.NetUser.USER_IDS.NEW_USER)
			{
				return;
			}
				
			//send all new, dirty, and destroyed instances to all users
			for(aCurrentUserIndex in this._myNetUsers)
			{
				aCurrentUser = this._myNetUsers[aCurrentUserIndex];
				
				if(!aCurrentUser.mySocket)
				{
					//TODO queue changes for reconnect?? if so, handle correctly in game too..
					console.info("User is not connected:", aCurrentUser.getDebugName());
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
				
				/*
				TODO:
				//Send if:
				//	X - data
				//	0 - ack
				//	0 - time since last send
				if(
					aNewInstanceList.length !== 0
					|| aDirtyInstanceList.length !== 0
					|| aDestroyInstanceList.length !== 0
				)
				{*/
					aBinaryBuffer = this._myNetwork.serializeOut(
						aCurrentUser,
						aNewInstanceList,
						aDirtyInstanceList,
						aDestroyInstanceList
					);
					aCurrentUser.mySocket.send(aBinaryBuffer);
				/*}*/
			}
			
			/*
			TODO!!!!!!!!!!!!!!!!!!!!!!!!!
			The "for all user list" code above, and the 
				"make sure all were registered as serialized objects" code below
				should be merged into one, something like follows:
				
				newInstances = ... + register??
				sharedDirtyInstances = ... + register??
				destroyedInstances = ... + register??
				for all forward objects
					customDirtyInstances[user id] = forwardObjects + register??
				for all users
					send(
						newInstances
						sharedDirtyInstances.concat(customDirtyInstances[user id])
						destroyedInstances
					)
			*/
			
			///////////////////////////////////////////////////////////////////////////////////////////////////
			//in case there are no users in here at present, we still want to clear all the objects dirty flags
			
			aDirtyInstanceList = [];
			//queue up new instances
			for(aClassName in this._myNewInstances)
			{
				anInstanceList = this._myNewInstances[aClassName];
				aDirtyInstanceList = aDirtyInstanceList.concat(anInstanceList);
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
					anInstanceList = aUserMap[aSourceUserIndex];
					aDirtyInstanceList = aDirtyInstanceList.concat(anInstanceList);
				}
			}
			for(i = 0; i < aDirtyInstanceList.length; ++i)
			{
				//in case there are no users in here at present, we still want to clear all the objects dirty flags
				this._myNetwork.registerSerializedObject(aDirtyInstanceList[i]);
			}
			
			//in case there are no users in here at present, we still want to clear all the objects dirty flags
			///////////////////////////////////////////////////////////////////////////////////////////////////
			
			
			
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
			if(this._myNetUsers.indexOf(inUser) !== -1)
			{
				return;
			}
			
			//add the user
			this._myNetUsers.push(inUser);
			
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
			
			anIndex = this._myNetUsers.indexOf(inUser);
			if(anIndex !== -1)
			{
				aLength = this._myNetUsers.length;
				this._myNetUsers[anIndex] = this._myNetUsers[aLength - 1];
				this._myNetUsers.pop();
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
