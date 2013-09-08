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
		var thisClass,
			registry,
			instanceID;
		
		//call parent constructor
		this.GameEventSystem();
			
		thisClass = this.getClass();
		registry = thisClass.getInstanceRegistry();
		instanceID = registry.getUnusedID();

		this._myName = this.getClass().getName() + '_' + instanceID;
		this._myID = instanceID;
		registry.register(this);
		
		if(ECGame.Settings.isDebugPrint_GameObject())
		{
			ECGame.log.info("New Object: " + this.getClass().getName() + ' : ' + this._myName + ' : ' + this._myID);
		}
		
		this._myNetOwnerID = ECGame.EngineLib.User.USER_IDS.SERVER;
		this._myNetDirty = false;
		this._myGameObjectNetDirty = false;
		
		//TODO or add manually when netRep is added to instances? (including during clone)
		if(ECGame.Settings.Network.isMultiplayer
			&& ECGame.instance
			&& ECGame.instance.network
			&& ECGame.Settings.Network.isServer//TODO ((server || thisClass._flags.clientCreatable) && netReplicated??)
			)
		{
			ECGame.instance.network.addNewObject(this);
			this._myNetDirty = true;
		}
	},
	
	Parents : [ECGame.EngineLib.GameEventSystem],
	
	flags : {},
	
	ChainUp : ['cleanup'],
	ChainDown : ['serialize', 'copyFrom', 'clearNetDirty'],
	
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
				condition : '_myGameObjectNetDirty'
			}
			//TODO name/id (NOT net?)
		],
				
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
		
		cleanup : function cleanup(){},
		destroy : function destroy()
		{
			if(ECGame.Settings.isDebugPrint_GameObject())
			{
				ECGame.log.info("Destroying GameObject " + ECGame.EngineLib.createGameObjectRef(this).getTxtPath(), true);
			}
				
			//notify all listeners
			this.onEvent(new ECGame.EngineLib.Events.GameObjectDestroyed(this));
			
			//call chain destructor
			this.cleanup();
			
			//remove from the instance list
			this.getClass().getInstanceRegistry().deregister(this);
			
			//TODO wipe all properties and change prototype (__proto__??)
		},
		
		canUserModifyNet : function canUserModifyNet()
		{
			if(!ECGame.Settings.Network.isMultiplayer || !this.getClass()._flags.net)//TODO get rid of this net flag I think
			{
				return false;
			}
			if(this._myNetOwnerID !== ECGame.instance.localUser.userID
				&& ECGame.instance.localUser.userID !== ECGame.EngineLib.User.USER_IDS.SERVER)
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
				if(!this._myNetDirty)
				{
					ECGame.instance.network.addNetDirtyObject(this);//TODO event instead
					this._myNetDirty = true;
				}
				this.onEvent(new ECGame.EngineLib.Events.GameObjectNetDirty(this, inUserID));
				
				return true;
			}
			return false;
		},
		
		setGameObjectNetDirty : function setGameObjectNetDirty()
		{
			if(setNetDirty())
			{
				this._myGameObjectNetDirty = true;
			}
		},
		
		clearNetDirty : function clearNetDirty()
		{
			this._myNetDirty = false;
			this._myGameObjectNetDirty = false;
		},
		
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
			this._myGameObjectNetDirty = this._myGameObjectNetDirty || !serializer.isNet();
			
			serializer.serializeObject(this, this.GameObject._serializeFormat);
			
			if(ECGame.Settings.isDebugPrint_NetworkMessages())
			{
				if(aStartingOwner != this._myNetOwnerID)
				{
					ECGame.log.info(this.getTxtPath() + " start owner: " + aStartingOwner);
					ECGame.log.info(this.getTxtPath() + " end owner: " + this._myNetOwnerID);
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