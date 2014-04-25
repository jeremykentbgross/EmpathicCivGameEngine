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

ECGame.EngineLib.Registry = function Registry()
{
	this._myInstancesByName = {};
	this._myInstancesByID = [];
	this._myMaxID = 0;
};
ECGame.EngineLib.Registry.prototype.constructor = ECGame.EngineLib.Registry;


	
ECGame.EngineLib.Registry.prototype.getMaxID = function getMaxID()
{
	return this._myMaxID;
};

ECGame.EngineLib.Registry.prototype.getUnusedID = function getUnusedID()
{
	return this._myMaxID + 1;
};



ECGame.EngineLib.Registry.prototype.register = function register(inObject)
{
	var anID
		,aName
		;
	
	anID = inObject.getID();
	aName = inObject.getName();
	
	this._myMaxID = Math.max(this._myMaxID, anID);
	
	if(this._myInstancesByName[aName])
	{
		console.warn("Trying to reregister '" + aName + "' : '" + anID + "' but '" + aName + "' is in use.");
	}
	if(this._myInstancesByID[anID])
	{
		console.warn("Trying to reregister '" + aName + "' : '" + anID + "' but '" + anID + "' is in use.");
	}
	
	this._myInstancesByName[aName] = inObject;
	this._myInstancesByID[anID] = inObject;
};

ECGame.EngineLib.Registry.prototype.deregister = function deregister(inObject)
{
	var anID
		,aName
		;
	
	anID = inObject.getID();
	aName = inObject.getName();
	
	delete this._myInstancesByName[aName];
	delete this._myInstancesByID[anID];
};



ECGame.EngineLib.Registry.prototype.findByName = function findByName(inName)
{
	return this._myInstancesByName[inName];
};

ECGame.EngineLib.Registry.prototype.findByID = function findByID(inID)
{
	return this._myInstancesByID[inID];
};



ECGame.EngineLib.Registry.prototype.forAll = function forAll(inFunction)
{
	var i;
	for(i in this._myInstancesByName)
	{
		inFunction(this._myInstancesByName[i]);
	}
};
