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





GameEngineLib.GameObject = function GameObject()
{
	//TODO this should be static!
	this._format =
	[
		{
			name : "_netOwner",
			scope : "private",
			type : "string",
			net : true
		}
	];

	this._myName = null;
	this._myID = null;
	this._myClass = null;
	this._netOwner = "server";
	this._netDirty = false;//TODO maybe should start as true?
	this._objectBaseNetDirty = false;//TODO maybe should start as true?
}
GameEngineLib.GameObject.prototype.constructor = GameEngineLib.GameObject;



GameEngineLib.GameObject.prototype.getName = function getName()
{
	return this._myName;
}



GameEngineLib.GameObject.prototype.getPath = function getPath()//?? todo is this right to exist?
{
	return this._myName;//TODO make real path
}



GameEngineLib.GameObject.prototype.setName = function setName(inName)
{
	if(this._myClass)
		this._myClass.deregister(this);
		
	this._myName = inName;
	if(GameSystemVars.DEBUG)
		this.debug_myName = inName;
	
	if(this._myClass)
		this._myClass.register(this);
		
	//TODO event to all listeners: name changed!
}


	
GameEngineLib.GameObject.prototype.getID = function getID()
{
	return this._myID;
}



GameEngineLib.GameObject.prototype.setID = function setID(inID)
{
	if(this._myClass)
		this._myClass.deregister(this);
		
	this._myID = inID;
	if(GameSystemVars.DEBUG)
		this.debug_myID = inID;
	
	if(this._myClass)
		this._myClass.register(this);
		
	//TODO event to all listeners: ID changed!
}	



GameEngineLib.GameObject.prototype.getClass = function getClass()
{
	return this._myClass;
}



GameEngineLib.GameObject.prototype.setClass = function setClass(inClass)//TODO make private
{
	if(this._myClass)
		this._myClass.deregister(this);
	
	this._myClass = inClass;
	if(GameSystemVars.DEBUG)
	{
		this.debug_myClassName = inClass.getName();
		this.debug_myClass = inClass;
	}
	
	if(this._myClass)
		this._myClass.register(this);
}


//TODO revisit this whole concept
GameEngineLib.GameObject.prototype.destroy = function destroy()
{
	if(GameSystemVars.DEBUG && GameSystemVars.Debug.GameObject_Destroy_Print)
		GameEngineLib.logger.info("Destroying GameObject " + GameEngineLib.createGameObjectRef(this).getPath(), true);
		
	//TODO notify all listeners
	
	this._myClass.deregister(this);

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
	if(this._netOwner === GameInstance.localUser.name)
		this._netDirty = true;
}



GameEngineLib.GameObject.prototype.setNetOwner = function setNetOwner(inOwner)
{
	//only the owner or the server can change the ownership
	if(this._netOwner !== GameInstance.localUser.name && GameInstance.localUser.name !== "server")
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

//todo work out how to do this right
/*instance.clone = function(cloneInstance, clonePrivate)
{
	cloneInstance.setName("copy of " + this.getName());
}*/

/*
//todo maybe should go in object.prototype??
//todo test and test and freaking test this
instance.clone = function()
{
	var copy = private.myClass.create();
	
	for(var i in this)
	{
		if(this.hasOwnProperty(i))//should this be?
		{
			//todo if object / object ref: clone it too
			copy[i] = this[i];
		}
	}
}*/
