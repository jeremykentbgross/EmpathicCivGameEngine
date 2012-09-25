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

//TODO depricated:
GameEngineLib.createGameObject = function createGameObject(instance, private)
{
	var temp = new GameEngineLib.GameObject();
	instance = instance || {};
	
	for(property in temp)
	{
		instance[property] = temp[property]
	}
	for(property in temp.prototype)
	{
		instance[property] = temp.prototype[property];
	}
	
	return instance;
}




/*
GameEngineLib.GameObject = function GameObject()
{
	//TODO this should be static!
	this._format =
	[
		{
			name : "_netOwner",
			scope : "private",
			type : "int",
			net : true,
			min : 0,
			max : GameEngineLib.User.USER_IDS.MAX_EVER
		}
	];

	this._name = null;
	this._ID = null;
	this._class = null;
	this._netOwner = GameEngineLib.User.USER_IDS.SERVER;
	this._netDirty = false;//TODO maybe should start as true?
	this._objectBaseNetDirty = false;//TODO maybe should start as true?
}
GameEngineLib.GameObject.prototype.constructor = GameEngineLib.GameObject;



GameEngineLib.GameObject.prototype.getName = function getName()
{
	return this._name;
}



GameEngineLib.GameObject.prototype.getPath = function getPath()//?? todo is this right to exist?
{
	return this._name;//TODO make real path
}



GameEngineLib.GameObject.prototype.setName = function setName(inName)
{
	if(this._class)
		this._class.deregister(this);
		
	this._name = inName;
//	if(GameSystemVars.DEBUG)
//		this.debug_name = inName;
	
	if(this._class)
		this._class.register(this);
		
	//TODO event to all listeners: name changed!
}


	
GameEngineLib.GameObject.prototype.getID = function getID()
{
	return this._ID;
}



GameEngineLib.GameObject.prototype.setID = function setID(inID)
{
	if(this._class)
		this._class.deregister(this);
		
	this._ID = inID;
//	if(GameSystemVars.DEBUG)
//		this.debug_ID = inID;
	
	if(this._class)
		this._class.register(this);
		
	//TODO event to all listeners: ID changed!
}	



GameEngineLib.GameObject.prototype.getClass = function getClass()
{
	return this._class;
}



GameEngineLib.GameObject.prototype.setClass = function setClass(inClass)//TODO make private
{
	if(this._class)
		this._class.deregister(this);
	
	this._class = inClass;
//	if(GameSystemVars.DEBUG)
//	{
//		this.debug_className = inClass.getName();
//		this.debug_class = inClass;
//	}
	
	if(this._class)
		this._class.register(this);
}


//TODO revisit this whole concept
GameEngineLib.GameObject.prototype.destroy = function destroy()
{
	if(GameSystemVars.DEBUG && GameSystemVars.Debug.GameObject_Destroy_Print)
		GameEngineLib.logger.info("Destroying GameObject " + GameEngineLib.createGameObjectRef(this).getPath(), true);
		
	//TODO notify all listeners
	
	if(this._class)
		this._class.deregister(this);

	for(var i in this)
	{
		if(this.hasOwnProperty(i))
		{
			delete this[i];
		}
	}
}
GameEngineLib.GameObject.prototype.destroy.chainup = true;



GameEngineLib.GameObject.prototype.netDirty = function netDirty()//TODO change to isNetDirty
{
	if(this._netDirty)
	{
		this._netDirty = false;
		return true;
	}
	return false;
}



GameEngineLib.GameObject.prototype.setNetDirty = function setNetDirty()
{
	//only the owner can write to this
	if(this._netOwner === GameInstance.localUser.userID)
		this._netDirty = true;
}



GameEngineLib.GameObject.prototype.setNetOwner = function setNetOwner(inOwner)
{
	//only the owner or the server can change the ownership
	if(this._netOwner !== GameInstance.localUser.userID
		&& GameInstance.localUser.userID !== GameEngineLib.User.USER_IDS.SERVER)
		return;
	this._netOwner = inOwner;
	this._netDirty = true;//this.setNetDirty();
	this._objectBaseNetDirty = true;
}



GameEngineLib.GameObject.prototype.getNetOwner = function getNetOwner()
{
	return this._netOwner;
}



GameEngineLib.GameObject.prototype.serialize = function serialize(serializer)
{
	if(!serializer)
		return;
	
	this._objectBaseNetDirty =
		serializer.serializeBool(this._objectBaseNetDirty);
	
	if(this._objectBaseNetDirty)
	{
		if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
		{
			GameEngineLib.logger.info(this.getPath() + " start owner: " + this._netOwner);
		}
		
		serializer.serializeObject(
			{ public : this, private : this },//TODO should be just 'this' soon
			this._format
		);
		
		if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
		{
			GameEngineLib.logger.info(this.getPath() + " end owner: " + this._netOwner);
		}
	}
	
	this._objectBaseNetDirty = false;
}
GameEngineLib.GameObject.prototype.serialize.chaindown = true;

*/






GameEngineLib.GameObject = GameEngineLib.Class({
	Constructor : function GameObject()
	{
		//TODO this should be static!
		this._format =
		[
			{
				name : "_netOwner",
				scope : "private",
				type : "int",
				net : true,
				min : 0,
				max : GameEngineLib.User.USER_IDS.MAX_EVER
			}
		];
	
		this._name = null;
		this._ID = null;
		this._class = null;
		this._netOwner = GameEngineLib.User.USER_IDS.SERVER;
		this._netDirty = false;//TODO maybe should start as true?
		this._objectBaseNetDirty = false;//TODO maybe should start as true?
	},
	//Parents : [],//TODO eventsystem
	ChainUp : ["destroy"],
	ChainDown : ["serialize"],
	Definition :
	{
		getName : function getName()
		{
			return this._name;
		},
		
		getPath : function getPath()//?? todo is this right to exist?
		{
			return this._name;//TODO make real path
		},
		
		setName : function setName(inName)
		{
			if(this._class)
				this._class.deregister(this);
				
			this._name = inName;
		//	if(GameSystemVars.DEBUG)
		//		this.debug_name = inName;
			
			if(this._class)
				this._class.register(this);
				
			//TODO event to all listeners: name changed!
		},
		
		getID : function getID()
		{
			return this._ID;
		},
		
		setID : function setID(inID)
		{
			if(this._class)
				this._class.deregister(this);
				
			this._ID = inID;
		//	if(GameSystemVars.DEBUG)
		//		this.debug_ID = inID;
			
			if(this._class)
				this._class.register(this);
				
			//TODO event to all listeners: ID changed!
		},
		
		getClass : function getClass()
		{
			return this._class;
		},

		setClass : function setClass(inClass)//TODO make private
		{
			if(this._class)
				this._class.deregister(this);
			
			this._class = inClass;
		//	if(GameSystemVars.DEBUG)
		//	{
		//		this.debug_className = inClass.getName();
		//		this.debug_class = inClass;
		//	}
			
			if(this._class)
				this._class.register(this);
		},
		
		//TODO cleanup vs destroy!
		destroy : function destroy()
		{
			if(GameSystemVars.DEBUG && GameSystemVars.Debug.GameObject_Destroy_Print)
				GameEngineLib.logger.info("Destroying GameObject " + GameEngineLib.createGameObjectRef(this).getPath(), true);
				
			//TODO notify all listeners
			
			if(this._class)
				this._class.deregister(this);
			if(this.getClass().getInstanceRegistry)
				this.getClass().getInstanceRegistry().deregister(this);
			
		
			for(var i in this)
			{
				if(this.hasOwnProperty(i))
				{
					delete this[i];
				}
			}
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
				this._netDirty = true;
		},
		
		setNetOwner : function setNetOwner(inOwner)
		{
			//only the owner or the server can change the ownership
			if(this._netOwner !== GameInstance.localUser.userID
				&& GameInstance.localUser.userID !== GameEngineLib.User.USER_IDS.SERVER)
				return;
			this._netOwner = inOwner;
			this._netDirty = true;//this.setNetDirty();
			this._objectBaseNetDirty = true;
		},

		getNetOwner : function getNetOwner()
		{
			return this._netOwner;
		},
		
		serialize : function serialize(serializer)
		{
			if(!serializer)
				return;
			
			this._objectBaseNetDirty =
				serializer.serializeBool(this._objectBaseNetDirty);
			
			if(this._objectBaseNetDirty)
			{
				if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
				{
					GameEngineLib.logger.info(this.getPath() + " start owner: " + this._netOwner);
				}
				
				serializer.serializeObject(
					{ public : this, private : this },//TODO should be just 'this' soon
					this._format
				);
				
				if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
				{
					GameEngineLib.logger.info(this.getPath() + " end owner: " + this._netOwner);
				}
			}
			
			this._objectBaseNetDirty = false;
		}
		//TODO clone/copyfrom
		
	}
});