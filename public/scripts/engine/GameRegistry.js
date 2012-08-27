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

//todo register with (object,name,id)
GameEngineLib.createGameRegistry = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	private.itemCount = 0;
	
	if(GameSystemVars.DEBUG)
	{
		GameEngineLib.addDebugInfo("GameRegistry", instance, private);
	}
	
	private.myInstancesByName = {};
	private.myInstancesByID = [];
	private.unusedInstanceIDs = [];	//TODO magic/check number for handles
	private.maxID = 0;
	
	instance.getMaxID = function()
	{
		return private.maxID;
	}
	
	//todo take name parameter as well so it is not always assuming the object is named?
	instance.register = function(inObject)
	{
		var id = inObject.getID();//TODO maybe this class should set the id istead of setting it??  And gen magic numbers too!
		private.maxID = Math.max(private.maxID, id);
		private.myInstancesByName[inObject.getName()] = inObject;
		private.myInstancesByID[id] = inObject;	
		delete private.unusedInstanceIDs[id];
		++private.itemCount;
	}
	
	//todo take name parameter as well so it is not always assuming the object is named?
	instance.deregister = function(inObject)
	{
		var id = inObject.getID();
		delete private.myInstancesByName[inObject.getName()];
		delete private.myInstancesByID[id];
		private.unusedInstanceIDs[id] = id;
		--private.itemCount;
	}
	
	//todo change this to just find() and check they type (index vs name)
	instance.findByName = function(inName)
	{
		return private.myInstancesByName[inName];
	}
	
	instance.findByID = function(inID)
	{
		return private.myInstancesByID[inID];
	}
	
	instance.forAll = function(inFunction)
	{
		for(var i in private.myInstancesByName)
		{
			if(private.myInstancesByName.hasOwnProperty(i))//todo check if object?
			{
				inFunction(private.myInstancesByName[i]);
			}
		}
	}
	
	instance.numItems = function()
	{
		return private.itemCount;
	}
	
	instance.getUnusedID = function()
	{
		for(var i in private.unusedInstanceIDs)
			return i;
		return undefined;
	}

	return instance;
}
