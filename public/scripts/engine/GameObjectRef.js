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

//TODO depricated =>GameEngineLib.GameObjectRef.create()??
GameEngineLib.createGameObjectRef = function(inPathOrValue)
{
	return new GameEngineLib.GameObjectRef(inPathOrValue);
}



//todo type checking version so ref is of a type known to class?
GameEngineLib.GameObjectRef = function GameObjectRef(inPathOrValue)
{
	this._path = null;
	this._value = null;
	//todo id {classid,instanceid}	//methodid/propertyid
	
	if(inPathOrValue)
	{
		if(typeof inPathOrValue === 'string')
		{
			this.setPath(inPathOrValue);
		}
		//TODO else if(typeof inPathOrValue === 'number') handle binary path
		else
		{
			this.setValue(inPathOrValue);
		}
	}
}
GameEngineLib.GameObjectRef.prototype.constructor = GameEngineLib.GameObjectRef;
	


GameEngineLib.GameObjectRef.prototype.deref = function deref()
{
	var objectClass;
	var pathTokens;
			
	if(this._value)
	{
		return this._value;
	}
	
	//TODO id
	
	if(this._path === null)
		return null;
	
	pathTokens = this._path.split('\\');
	//if valid path
	if(pathTokens.length !== 2)
		return null;
	//todo error/warn otherwise
	
	objectClass = GameInstance.GameObjectClasses.findByName(pathTokens[0]);
	if(objectClass)
	{
		this._value = objectClass.findByName(pathTokens[1]);
		this._path = null;
	}
		
	return this._value;
}



GameEngineLib.GameObjectRef.prototype.setValue = function setValue(inValue)
{
	this._path = null;
	this._value = inValue;
}



GameEngineLib.GameObjectRef.prototype.setPath = function setPath(inPath)
{
	this._path = inPath;
	this._value = null;
}



GameEngineLib.GameObjectRef.prototype.getPath = function getPath()
{
	if(this._path === null)
	{
		if(this._value !== null)
		{
			this._path = this._value.getClass().getName() + "\\" + this._value.getName();
		}
	}
	this._value = null;
	
	return this._path;
}

