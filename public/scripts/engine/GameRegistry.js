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

//TODO depricated
GameEngineLib.createGameRegistry = function(instance)
{
	var property;
	var temp = new GameEngineLib.GameRegistry();
	instance = instance || {};
	
	for(property in temp)
	{
		instance[property] = temp[property];
	}
	for(property in temp.prototype)
	{
		instance[property] = temp.prototype[property];
	}
	
	return instance;
};



GameEngineLib.GameRegistry = function GameRegistry()
{
	this._itemCount = 0;
	this._instancesByName = {};
	this._instancesByID = [];
	this._unusedInstanceIDs = [];	//TODO magic/check number for handles
	this._maxID = 0;
};
GameEngineLib.GameRegistry.prototype.constructor = GameEngineLib.GameRegistry;


	
GameEngineLib.GameRegistry.prototype.getMaxID = function getMaxID()
{
	return this._maxID;
};

//todo take name parameter as well so it is not always assuming the object is named?
GameEngineLib.GameRegistry.prototype.register = function register(inObject)
{
	var id = inObject.getID();
	var name = inObject.getName();
	
	this._maxID = Math.max(this._maxID, id);
	
	if(this._instancesByName[name])
	{
		GameEngineLib.logger.warn("Trying to reregister '" + name + "' : '" + id + "' but '" + name + "' is in use.");
	}
	if(this._instancesByID[id])
	{
		GameEngineLib.logger.warn("Trying to reregister '" + name + "' : '" + id + "' but '" + id + "' is in use.");
	}
	
	this._instancesByName[name] = inObject;
	this._instancesByID[id] = inObject;	
	
	delete this._unusedInstanceIDs[id];
	
	++this._itemCount;
};

//todo take name parameter as well so it is not always assuming the object is named?
GameEngineLib.GameRegistry.prototype.deregister = function deregister(inObject)
{
	var id = inObject.getID();
	var name = inObject.getName();
	
	delete this._instancesByName[name];
	delete this._instancesByID[id];
	
	this._unusedInstanceIDs[id] = id;
	
	--this._itemCount;
};

//todo change this to just find() and check they type (index vs name)
GameEngineLib.GameRegistry.prototype.findByName = function findByName(inName)
{
	return this._instancesByName[inName];
};

GameEngineLib.GameRegistry.prototype.findByID = function findByID(inID)
{
	return this._instancesByID[inID];
};

GameEngineLib.GameRegistry.prototype.forAll = function forAll(inFunction)
{
	var i;
	for(i in this._instancesByName)
	{
		if(this._instancesByName.hasOwnProperty(i))//todo check if object?
		{
			inFunction(this._instancesByName[i]);
		}
	}
};

GameEngineLib.GameRegistry.prototype.numItems = function numItems()
{
	return this._itemCount;
};

GameEngineLib.GameRegistry.prototype.getUnusedID = function getUnusedID()
{
	if(this._unusedInstanceIDs.length)
	{
		return this._unusedInstanceIDs[0];
	}
	return this._maxID + 1;
};