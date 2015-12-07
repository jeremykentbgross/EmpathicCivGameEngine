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
TODO??
	-get/set property (as value or string)
	-toString method
Note: would probably have to use https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty at owner level
	At owner level defeats purpose
*/
//TODO type checking version so ref is of a type known to class?
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
	

/*
inSafe - fails silently, returning null
*/
ECGame.EngineLib.GameObjectRef.prototype.deref = function deref(inSafe)
{
	var objectClass, pathTokens;
			
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
			if(!inSafe)
			{
				console.error("Invalid path: " + this._path);
			}
			return null;
		}
		//todo error/warn otherwise
		
		objectClass = ECGame.EngineLib.Class.findInstanceByName(pathTokens[0]);
		if(objectClass)
		{
			this._value = objectClass.findInstanceByName(pathTokens[1]);
			if(this._value)
			{
				this._path = null;
			}
			else if(!inSafe)
			{
				console.error("No object " + pathTokens[1] + " in " + this._path);
			}
		}
		else if(!inSafe)
		{
			console.error("No Class named: " + pathTokens[0]);
		}
	}
	
	if(this.classID !== -1 && this.instanceID !== -1)
	{
		objectClass = ECGame.EngineLib.Class.findInstanceByID(this.classID);
		if(objectClass)
		{
			this._value = objectClass.findInstanceByID(this.instanceID);
			if(this._value)
			{
				this.classID = -1;
				this.instanceID = -1;
			}
			else if(!inSafe)
			{
				console.error("No Object: " + objectClass.getName() + " with ID " + this.instanceID);
			}
		}
		else if(!inSafe)
		{
			console.error("No classID: " + this.classID);
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

