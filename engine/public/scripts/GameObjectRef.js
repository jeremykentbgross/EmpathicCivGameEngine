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

//todo type checking version so ref is of a type known to class?
ECGame.EngineLib.GameObjectRef = function GameObjectRef(inPathOrValue)
{
	this._path = null;
	this._value = null;
	
	this.classID = -1;//TODO private
	this.instanceID = -1;//TODO private
	
	if(inPathOrValue)
	{
		if(typeof inPathOrValue === 'string'/* || typeof inPathOrValue === 'number'*/)
		{
			this.setPath(inPathOrValue);
		}
		else
		{
			this.setValue(inPathOrValue);
		}
	}
};
ECGame.EngineLib.GameObjectRef.prototype.constructor = ECGame.EngineLib.GameObjectRef;
	


ECGame.EngineLib.GameObjectRef.prototype.deref = function deref()
{
	var objectClass;
	var pathTokens;
			
	if(this._value)
	{
		return this._value;
	}
	
	if(this._path !== null)
	{
		pathTokens = this._path.split('\\');
	
		//if !valid path
		if(pathTokens.length !== 2)
		{
			return null;
		}
		//todo error/warn otherwise
		
		objectClass = ECGame.EngineLib.Class.getInstanceRegistry().findByName(pathTokens[0]);
		if(objectClass)
		{
			this._value = objectClass.getInstanceRegistry().findByName(pathTokens[1]);
			this._path = null;
		}
	}
	
	if(this.classID !== -1 && this.instanceID !== -1)
	{
		objectClass = ECGame.EngineLib.Class.getInstanceRegistry().findByID(this.classID);
		if(objectClass)
		{
			this._value = objectClass.getInstanceRegistry().findByID(this.instanceID);
			this.classID = -1;
			this.instanceID = -1;
		}
	}
	
		
	return this._value;
};



ECGame.EngineLib.GameObjectRef.prototype.setValue = function setValue(inValue)
{
	this._path = null;
	this._value = inValue;
	this.classID = -1;
	this.instanceID = -1;
};



ECGame.EngineLib.GameObjectRef.prototype.setPath = function setPath(inPath)
{
	this._path = inPath;
	this._value = null;
	this.classID = -1;
	this.instanceID = -1;
};



ECGame.EngineLib.GameObjectRef.prototype.toBinary = function toBinary()
{
	if(this.classID === -1 && this.instanceID === -1)
	{
		if(!this._value)
		{
			this.deref();
		}
		
		if(this._value)
		{
			this.classID = this._value.getClass().getID();
			this.instanceID = this._value.getID();
			this._value = null;
		}
	}
};



ECGame.EngineLib.GameObjectRef.prototype.getPath = function getPath()//TODO txt path vs bin path
{
	if(!this._path)
	{
		this.deref();
		if(this._value)
		{
			this._path = this._value.getTxtPath();
		}
	}
	this._value = null;
	
	return this._path;
};

