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
			
		thisClass = this.getClass();
		registry = thisClass.getInstanceRegistry();
		instanceID = registry.getUnusedID();

		this._name = 'Inst_' + instanceID;
		this._ID = instanceID;//TODO rename _ID as _instanceID
		registry.register(this);
		
		if(ECGame.Settings.DEBUG && ECGame.Settings.Debug.GameObject_Print)
		{
			ECGame.log.info("New Object: " + this.getClass().getName() + ' : ' + this._name + ' : ' + this._ID);
		}
		
		this._netOwner = ECGame.EngineLib.User.USER_IDS.SERVER;
		this._netDirty = false;
		this._objectBaseNetDirty = false;//TODO should be true?
		
		//TODO or add manually when netRep is added to instances? (including during clone)
		if(ECGame.Settings.Network.isMultiplayer
			&& ECGame.instance
			&& ECGame.instance.network
			&& ECGame.Settings.Network.isServer//TODO ((server || thisClass._flags.clientCreatable) && netReplicated??)
			)
		{
			ECGame.instance.network.addNewObject(this);
			this._netDirty = true;
		}
	},
	
	//Parents : [],//TODO eventsystem??
	
	flags : {},
	
	ChainUp : ['destroy'],
	ChainDown : ['serialize', 'copyFrom'],
	
	Definition :
	{
		_serializeFormat :
		[
			{
				name : '_netOwner',
				type : 'int',
				net : true,
				min : 0,
				max : ECGame.EngineLib.User.USER_IDS.MAX_EVER
				//TODO condition: renamed this._objectBaseNetDirty
			}
			//TODO name/id (NOT net)
		],
				
		getName : function getName()
		{
			return this._name;
		},
		
		getTxtPath : function getTxtPath()
		{
			return this.getClass().getName() + '\\' + this.getName();
		},
		//todo get binpath vs txtpath
		
		setName : function setName(inName)
		{
			this.getClass().getInstanceRegistry().deregister(this);
			this._name = inName;			
			this.getClass().getInstanceRegistry().register(this);
				
			//TODO event to all listeners: name changed!
		},
		
		getID : function getID()
		{
			return this._ID;
		},
		
		setID : function setID(inID)
		{
			this.getClass().getInstanceRegistry().deregister(this);
			this._ID = inID;
			this.getClass().getInstanceRegistry().register(this);
				
			//TODO event to all listeners: ID changed!
		},
		
		//TODO cleanup vs destroy!
		destroy : function destroy()
		{
			//TODO have this?
			if(ECGame.Settings.DEBUG && ECGame.Settings.Debug.GameObject_Print)
			{
				ECGame.log.info("Destroying GameObject " + ECGame.EngineLib.createGameObjectRef(this).getTxtPath(), true);
			}
				
			//TODO notify all listeners
			//TODO register for net delete
			
			this.getClass().getInstanceRegistry().deregister(this);
		},
		
		canUserModifyNet : function canUserModifyNet()
		{
			if(!ECGame.Settings.Network.isMultiplayer || !this.getClass()._flags.net)
			{
				return false;
			}
			if(this._netOwner !== ECGame.instance.localUser.userID
				&& ECGame.instance.localUser.userID !== ECGame.EngineLib.User.USER_IDS.SERVER)
			{
				return false;
			}
			return true;
		},
		
		isNetDirty : function isNetDirty()
		{
			return this._netDirty;
		},
		
		setNetDirty : function setNetDirty()
		{
			if(this.canUserModifyNet())
			{
				if(!this._netDirty)
				{
					ECGame.instance.network.addNetDirtyObject(this);
					this._netDirty = true;
				}
				
				return true;
			}
			return false;
		},
		
		clearNetDirty : function clearNetDirty()//TODO make chain down!!!
		{
			this._netDirty = false;
			this._objectBaseNetDirty = false;
		},
		
		setNetOwner : function setNetOwner(inOwner)
		{
			//only the owner or the server can change the ownership
			if(!this.setNetDirty())
			{
				return;
			}
			this._netOwner = inOwner;
			this._objectBaseNetDirty = true;
		},

		getNetOwner : function getNetOwner()//rename getNetOwnerID
		{
			return this._netOwner;//TODO rename _netOwnerID because it is really the id, not a whole object
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
			if(!serializer)//TODO needed still? Try to remove.
			{
				return;
			}
			
			//TODO if net!! (and else)
			
			//HACK TODO this should not be done like this!!
			this._objectBaseNetDirty = this._objectBaseNetDirty || !serializer.isNet();
			
			this._objectBaseNetDirty =
				serializer.serializeBool(this._objectBaseNetDirty);
			
			if(this._objectBaseNetDirty)
			{
				if(ECGame.Settings.DEBUG && ECGame.Settings.Debug.NetworkMessages_Print)
				{
					ECGame.log.info(this.getTxtPath() + " start owner: " + this._netOwner);
				}
				
				serializer.serializeObject(this, this.GameObject._serializeFormat);
				
				if(ECGame.Settings.DEBUG && ECGame.Settings.Debug.NetworkMessages_Print)
				{
					ECGame.log.info(this.getTxtPath() + " end owner: " + this._netOwner);
				}
			}
			
			/*if(serializer.isNet())//TODO maybe should be ALL flag or something (want to minimize transfers)
			{
				this._objectBaseNetDirty = false;
			}*/
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