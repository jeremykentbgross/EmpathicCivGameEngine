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
inParams:{
	Constructor,
	Parents : [],
	ChainUp : ["..",..],
	ChainDown : ["..",..],
	Definition,
}
*/

GameEngineLib.Class = function Class(inParams)
{
	var inConstructor = inParams.Constructor;
	var inParents = inParams.Parents;
	var inDefinition = inParams.Definition;
	
	var chainUpMethods = {};//these are maps to prevent them being duplicated
	var chainDownMethods = {};
	var constructorSrc = inConstructor.toString();
	
	for(var parentIndex in inParents)
	{
		var parent = inParents[parentIndex];
		
		if(GameSystemVars.DEBUG)
		{
			if(constructorSrc.indexOf("this."+parent.name) === -1)
				GameEngineLib.logger.warn(
					inConstructor.name + " does not call parent constructor " + parent.name
				);
		}
		
		//copy static properties
		for(var property in parent)
		{
			if(parent[property].chainup === true)
			{
				chainUpMethods[property] = property;
			}
			else if(parent[property].chaindown === true)
			{
				chainDownMethods[property] = property;
			}
			else
			{
				inConstructor[property] = parent[property];
			}
		}
		
		//copy prototypes
		for(var property in parent.prototype)
		{
			if(parent.prototype[property].chainup === true)//TODO these might not be needed after all is switched over
			{
				chainUpMethods[property] = property;
			}
			else if(parent.prototype[property].chaindown === true)//TODO these might not be needed after all is switched over
			{
				chainDownMethods[property] = property;
			}
			else
			{
				inConstructor.prototype[property] = parent.prototype[property];
			}
		}
		
		inConstructor.prototype[parent.name] = parent;
	}
	
	if(inParents)
	{
		inConstructor._parent = inParents[0];
		inConstructor._parents = inParents;
	}
	
	//remember chain up and down functions
	for(var index in inParams.ChainUp)
	{
		chainUpMethods[inParams.ChainUp[index]] = inParams.ChainUp[index];
	}
	for(var methodName in inParams.ChainDown)
	{
		chainDownMethods[inParams.ChainDown[index]] = inParams.ChainDown[index];
	}
	
	for(property in inDefinition)
	{
		//copy functions in the definition
		if(typeof inDefinition[property] === "function")
		{
			if(chainUpMethods[property])
				inDefinition[property].chainup = true;
			if(chainDownMethods[property])
				inDefinition[property].chaindown = true;
				
			inConstructor.prototype[property] = inDefinition[property];
		}
		
		//make functions static so they can be called by children from parent namespace
		//	and copy static stuff into the class too
		inConstructor[property] = inDefinition[property];
	}
	

	//build a parent chain for the chain up and down calls
	//and figure if this is a managed object (derived from GameObject)
	var managed = false;
	var parentChain = [];
	var current = inConstructor;
	while(current)
	{
		parentChain.push(current);
		if(current.name === "GameObject")
		{
			managed = true;
			break;
		}
		current = current._parent;
	}
	
	if(!managed)
	{
		inConstructor.create = function create()
		{
			var instance = new inConstructor();
			return instance;
		}
	}
	else
	{
		inConstructor.registerClass = function registerClass()
		{
			var classRegistry = GameEngineLib.Class.getInstanceRegistry();
			if(classRegistry.findByName(inConstructor.name) === inConstructor)
				return;
			inConstructor._classID = classRegistry.getUnusedID();
			classRegistry.register(inConstructor);
		}
		
		inConstructor.create = function create()
		{
			var instance = new inConstructor();
			var registry = inConstructor.getInstanceRegistry()
			var instanceID = registry.getUnusedID();
			instance.setID(instanceID);
			instance.setName("Instance_" + instanceID);
			registry.register(instance);
			//TODO return GameObjectRef!
			return instance;
		}
				
		inConstructor.getInstanceRegistry = function getInstanceRegistry()
		{
			if(!GameClassRegistryMap[inConstructor])
			{
				GameClassRegistryMap[inConstructor] = new GameEngineLib.GameRegistry();
			}
			return GameClassRegistryMap[inConstructor];
		}
		//TODO put this back
		/*inConstructor.getClass = inConstructor.prototype.getClass = function getClass()
		{
			return inConstructor;
		}*/
		
		inConstructor.getName = function getName()
		{
			return inConstructor.name;
		}
		
		inConstructor.getID = function getID()
		{
			return inConstructor._classID;
		}
		
		//TODO could be in Object with getClass()?
		inConstructor.isA = inConstructor.prototype.isA = function isA(inClass)
		{
			var current = inConstructor;
			while(current)
			{
				if(current === inClass)
				{
					return true;
				}
				current = current._parent;
			}
			return false;
		}
	}
	
	parentChain.reverse();
	for(var i in chainDownMethods)
	{
		var funcName = chainDownMethods[i];
		inConstructor.prototype[funcName] = GameEngineLib.Class.createChainDownCall(parentChain, funcName);
	}
	for(var i in chainUpMethods)
	{
		var funcName = chainUpMethods[i];
		inConstructor.prototype[funcName] = GameEngineLib.Class.createChainUpCall(parentChain, funcName);
	}
	
	return inConstructor;
}



GameEngineLib.Class.getInstanceRegistry = function getInstanceRegistry()
{
	if(!GameClassRegistryMap.Class)
	{
		GameClassRegistryMap.Class = new GameEngineLib.GameRegistry();
	}
	return GameClassRegistryMap.Class;
}



GameEngineLib.Class.createChainDownCall = function createChainDownCall(parentChain, funcName)
{
	var warn = false;
	var funcPtr;
	var funcArray = [];
	
	for(var i in parentChain)
	{
		funcPtr = parentChain[i][funcName];
		if(!funcPtr && warn)
		{
			if(GameSystemVars.DEBUG)
				GameEngineLib.logger.warn(parentChain[i].getName() + " does not implement " + funcName);
		}
		else if(funcPtr)
		{
			warn = true;
			funcArray.push(funcPtr);
		}
	}
	
	var func = function()
	{
		for(var funcIndex in funcArray)
		{
			funcArray[funcIndex].apply(this, arguments);
		}
	};
	func.chaindown = true;
	return func;
}



GameEngineLib.Class.createChainUpCall = function createChainUpCall(parentChain, funcName)
{
	var warn = false;
	var funcPtr;
	var funcArray = [];
	
	for(var i in parentChain)
	{
		funcPtr = parentChain[i][funcName];
		if(!funcPtr && warn)
		{
			if(GameSystemVars.DEBUG)
				GameEngineLib.logger.warn(parentChain[i].getName() + " does not implement " + funcName);
		}
		else if(funcPtr)
		{
			warn = true;
			funcArray.push(funcPtr);
		}
	}
	funcArray.reverse();
	
	var func = function()
	{
		for(var funcIndex in funcArray)
		{
			funcArray[funcIndex].apply(this, arguments);
		}
	};
	func.chainup = true;
	return func;
}