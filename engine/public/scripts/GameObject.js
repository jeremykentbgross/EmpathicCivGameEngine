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

ECGame.EngineLib.GameObject = ECGame.EngineLib.Class.create({
	Constructor : function GameObject()
	{
		var aThisClass,
			aRegistry,
			anInstanceID;
		
		//call parent constructor
		this.GameEventSystem();
			
		aThisClass = this.getClass();
		aRegistry = aThisClass.getInstanceRegistry();
		anInstanceID = aRegistry.getUnusedID();

		this._myName = aThisClass.getName() + '_' + anInstanceID;
		this._myID = anInstanceID;
		aRegistry.register(this);
		
		if(ECGame.Settings.isDebugPrint_GameObject())
		{
			console.info("New GameObject: " + aThisClass.getName() + ':' + this._myName + ':' + this._myID, true);
		}
		
		this._myNetOwnerID = ECGame.EngineLib.User.USER_IDS.SERVER;
		this._myNetDirty = false;
		this._myGameObjectNetDirty = false;
	},
	
	Parents : [ECGame.EngineLib.GameEventSystem],
	
	flags : {},
	
	ChainUp : ['cleanup'],
	ChainDown : ['serialize', 'copyFrom', 'clearNetDirty', 'postSerialize'],
	
	Definition :
	{
		_serializeFormat :
		[
			{
				name : '_myGameObjectNetDirty',
				type : 'bool',
				net : true
			},
			{
				name : '_myNetOwnerID',
				type : 'int',
				net : true,
				min : 0,
				max : ECGame.EngineLib.User.USER_IDS.MAX_EVER,
				condition : 'isGameObjectNetDirty'
			}
			//TODO name/id (NOT net?)
		],
		
		isGameObjectNetDirty : function isGameObjectNetDirty()
		{
			return this._myGameObjectNetDirty;
		},
				
		getName : function getName()
		{
			return this._myName;
		},
		
		getTxtPath : function getTxtPath()
		{
			return this.getClass().getName() + '\\' + this.getName();//TODO \\ should be /
		},
		//TODO get binpath vs txtpath
		
		setName : function setName(inName)
		{
			this.getClass().getInstanceRegistry().deregister(this);
			this._myName = inName;			
			this.getClass().getInstanceRegistry().register(this);
				
			//TODO event to all listeners: name changed!
		},
		
		getID : function getID()
		{
			return this._myID;
		},
		
		setID : function setID(inID)
		{
			this.getClass().getInstanceRegistry().deregister(this);
			this._myID = inID;
			this.getClass().getInstanceRegistry().register(this);
				
			//TODO event to all listeners: ID changed!
		},
		
		cleanup : function cleanup(){return;},
		destroy : function destroy()
		{
			var aProperty;
			
			if(ECGame.Settings.isDebugPrint_GameObject())
			{
				console.info("Destroying GameObject: " + this.getClass().getName() + ':' + this._myName + ':' + this._myID, true);
			}
				
			//notify all listeners
			this.onEvent(new ECGame.EngineLib.Events.GameObjectDestroyed(this));
			
			//call chain destructor
			this.cleanup();
			
			//remove from the instance list
			this.getClass().getInstanceRegistry().deregister(this);
			
			//wipe all properties
			for(aProperty in this)
			{
				//leave the id as it is still needed by networking to identify the destroyed objects
				if(this.hasOwnProperty(aProperty) && aProperty !== '_myID')
				{
					delete this[aProperty];
				}
			}
			this.DELETED_OBJECT = true;//for debugging
		},
		
		canUserModifyNet : function canUserModifyNet()
		{
			var aLocalUser;
			
			if(!ECGame.Settings.Network.isMultiplayer || !this.getClass()._flags.netDynamic)
			{
				return false;
			}
			
			aLocalUser = ECGame.instance.getLocalUser();
			if(this._myNetOwnerID !== aLocalUser.userID
				&& aLocalUser.userID !== ECGame.EngineLib.User.USER_IDS.SERVER)
			{
				return false;
			}
			
			return true;
		},
		
		isNetDirty : function isNetDirty()
		{
			return this._myNetDirty;
		},
		
		setNetDirty : function setNetDirty(inUserID)
		{
			if(this.canUserModifyNet())
			{
				this._myNetDirty = true;
				this.onEvent(new ECGame.EngineLib.Events.GameObjectNetDirty(this, inUserID));
				
				return true;
			}
			return false;
		},
		
		/*setGameObjectNetDirty : function setGameObjectNetDirty()//Never called? wtf?
		{
			if(this.setNetDirty())
			{
				this._myGameObjectNetDirty = true;
			}
		},*/
		
		clearNetDirty : function clearNetDirty()
		{
			this._myNetDirty = false;
			this._myGameObjectNetDirty = false;
		},
		postSerialize : function postSerialize(){return;},
		
		setNetOwner : function setNetOwner(inOwner)
		{
			if(this.setNetDirty())	//only the owner or the server can change the ownership
			{
				this._myNetOwnerID = inOwner;
				this._myGameObjectNetDirty = true;
			}
		},

		getNetOwnerID : function getNetOwnerID()
		{
			return this._myNetOwnerID;
		},
		
		getRef : function getRef()
		{
			return new ECGame.EngineLib.GameObjectRef(this);
		},
		
		isA : function isA(inClass)//TODO note that this only checks first/primary parents!
		{
			var current = this.getClass()._constructor;
			while(current)
			{
				if(current === inClass || current.name === inClass)
				{
					return true;
				}
				if(!current.getClass)
				{
					return false;
				}
				current = current.getClass()._parent;
			}
			return false;
		},
		
		serialize : function serialize(serializer)
		{
			var aStartingOwner;
			
			if(!serializer)
			{
				return;
			}
			
			aStartingOwner = this._myNetOwnerID;
			
			//HACK TODO this should not be done like this!!
			//This is because if it isn't marked as net serialize it probably IS a net serialize but it needs a 'full' serialize
			//TODO probably need some way to do net and netfull
			this._myGameObjectNetDirty = this._myGameObjectNetDirty || !serializer.isNetMode();
			
			serializer.serializeObject(this, this.GameObject._serializeFormat);
			
			if(ECGame.Settings.isDebugPrint_NetworkMessages() || ECGame.Settings.isDebugPrint_GameObject())
			{
				if(aStartingOwner !== this._myNetOwnerID)
				{
					console.info(this.getTxtPath() + " start owner: " + aStartingOwner);
					console.info(this.getTxtPath() + " end owner: " + this._myNetOwnerID);
				}
			}
		},
		
		clone : function clone()
		{
			var newInstance = this.getClass().create();
			newInstance.copyFrom(this);
			return newInstance;
		},
		
		copyFrom : function copyFrom(inOther)
		{
			this.setName(this.getName() + '_(Copy_of_' + inOther.getName()+')');
		}
		
	}
});