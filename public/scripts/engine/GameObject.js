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

GameEngineLib.GameObject = GameEngineLib.Class.create({
	Constructor : function GameObject()
	{
		var registry = this.getClass().getInstanceRegistry();
		var instanceID = registry.getUnusedID();

		this._name = 'Instance_' + instanceID;
		this._ID = instanceID;//TODO rename _ID as _instanceID
		registry.register(this);
		
		this._netOwner = GameEngineLib.User.USER_IDS.SERVER;
		this._netDirty = false;
		this._objectBaseNetDirty = false;
		
		//TODO register for net create
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
				max : GameEngineLib.User.USER_IDS.MAX_EVER
				//TODO condition: renamed this._objectBaseNetDirty
			}
			//TODO name/id (NOT net)
		],
		
		registerClass : function registerClass()
		{
			var classRegistry,
				thisClass;

			thisClass = this.getClass();
			classRegistry = GameEngineLib.Class.getInstanceRegistry();
			if(classRegistry.findByName(thisClass.getName()) !== thisClass)
			{
				thisClass._classID = classRegistry.getUnusedID();
				classRegistry.register(thisClass);
			}
		},
		
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
			if(GameSystemVars.DEBUG && GameSystemVars.Debug.GameObject_Destroy_Print)
			{
				GameEngineLib.logger.info("Destroying GameObject " + GameEngineLib.createGameObjectRef(this).getTxtPath(), true);
			}
				
			//TODO notify all listeners
			//TODO register for net delete
			
			this.getClass().getInstanceRegistry().deregister(this);
		},
		
		netDirty : function netDirty()//TODO change to isNetDirty
		{
			if(this._netDirty)
			{
				this._netDirty = false;
				return true;
			}
			return false;
		},
		
		setNetDirty : function setNetDirty()
		{
			//only the owner can write to this
			if(this._netOwner === GameInstance.localUser.userID)
			{
				this._netDirty = true;
			}
		},
		
		setNetOwner : function setNetOwner(inOwner)
		{
			//only the owner or the server can change the ownership
			if(this._netOwner !== GameInstance.localUser.userID
				&& GameInstance.localUser.userID !== GameEngineLib.User.USER_IDS.SERVER)
			{
				return;
			}
			this._netOwner = inOwner;
			this._netDirty = true;//this.setNetDirty();
			this._objectBaseNetDirty = true;
		},

		getNetOwner : function getNetOwner()
		{
			return this._netOwner;
		},
		
		getRef : function getRef()
		{
			return new GameEngineLib.GameObjectRef(this);
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
			
			this._objectBaseNetDirty =
				serializer.serializeBool(this._objectBaseNetDirty);
			
			if(this._objectBaseNetDirty)
			{
				if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
				{
					GameEngineLib.logger.info(this.getTxtPath() + " start owner: " + this._netOwner);
				}
				
				serializer.serializeObject(this, this.GameObject._serializeFormat);
				
				if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
				{
					GameEngineLib.logger.info(this.getTxtPath() + " end owner: " + this._netOwner);
				}
			}
			
			this._objectBaseNetDirty = false;
		},
		
		clone : function clone()
		{
			var newInstance = this.getClass().create();
			newInstance.copyFrom(this);
			return newInstance;
		},
		
		copyFrom : function copyFrom(inOther)
		{
			this.setName('Copy_' + inOther.getName());
		}
		
	}
});