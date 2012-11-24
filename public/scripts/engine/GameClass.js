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
	ChainUp : ['..',..],
	ChainDown : ['..',..],
	Definition,
}

GameEngineLib.Class({
	Constructor : ,
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		
	}
});

*/

GameEngineLib.Class = function Class(inParams)
{
	var Constructor = inParams.Constructor;
	var inParents = inParams.Parents;
	var inDefinition = inParams.Definition;
	
	var chainUpMethods = {};//these are maps to prevent them being duplicated
	var chainDownMethods = {};
	
	var parentIndex;
	var property;
	
	Constructor.prototype = Constructor;
	
	for(parentIndex in inParents)
	{
		var parent = inParents[parentIndex];
		
		if(GameSystemVars.DEBUG)
		{
			if(Constructor.toString().indexOf('this.'+parent.name) === -1)
			{
				GameEngineLib.logger.warn(
					Constructor.name + " does not call parent constructor " + parent.name
				);
			}
		}
		
		//copy static properties
		for(property in parent)
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
				Constructor[property] = parent[property];
			}
		}
		
		//copy prototypes
		for(property in parent.prototype)
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
				Constructor.prototype[property] = parent.prototype[property];
			}
		}
		
		Constructor.prototype[parent.name] = parent;
	}
	
	Constructor.prototype[Constructor.name] = Constructor;
	
	if(inParents)
	{
		Constructor._parent = inParents[0];
		Constructor._parents = inParents;
	}
	
	//remember chain up and down functions
	var index;
	for(index in inParams.ChainUp)
	{
		chainUpMethods[inParams.ChainUp[index]] = inParams.ChainUp[index];
	}
	var methodName;
	for(methodName in inParams.ChainDown)
	{
		chainDownMethods[inParams.ChainDown[index]] = inParams.ChainDown[index];
	}
	
	for(property in inDefinition)
	{
		//copy functions in the definition
		if(typeof inDefinition[property] === 'function')
		{
			if(chainUpMethods[property])
			{
				inDefinition[property].chainup = true;
			}
			if(chainDownMethods[property])
			{
				inDefinition[property].chaindown = true;
			}
				
			Constructor.prototype[property] = inDefinition[property];
		}
		
		//make functions static so they can be called by children from parent namespace
		//	and copy static stuff into the class too
		Constructor[property] = inDefinition[property];
	}
	
	//TODO should do this better.  Like maybe inherit parent flags?
	Constructor.flags = inParams.flags;

	Constructor.create = function create()
	{
		return new Constructor();
	};

	//build a parent chain for the chain up and down calls
	//and figure if this is a managed object (derived from GameObject)
	var managed = false;
	var parentChain = [];
	var current = Constructor;
	while(current)
	{
		parentChain.push(current);
		if(current.name === 'GameObject')
		{
			managed = true;
			break;
		}
		current = current._parent;
	}
	
	if(managed)
	{
		Constructor.registerClass = function registerClass()
		{
			var classRegistry = GameEngineLib.Class.getInstanceRegistry();
			if(classRegistry.findByName(Constructor.name) === Constructor)
			{
				return;
			}
			Constructor._classID = classRegistry.getUnusedID();
			classRegistry.register(Constructor);
		};
						
		Constructor.getInstanceRegistry = function getInstanceRegistry()
		{
			if(!GameClassRegistryMap[Constructor])
			{
				GameClassRegistryMap[Constructor] = new GameEngineLib.GameRegistry();
			}
			return GameClassRegistryMap[Constructor];
		};
		
		Constructor.getClass = Constructor.prototype.getClass = function getClass()
		{
			return Constructor;
		};
		
		Constructor.getName = function getName()
		{
			return Constructor.name;
		};
		
		Constructor.getID = function getID()
		{
			return Constructor._classID;
		};
		
		//TODO could be in Object with getClass()?
		Constructor.isA = Constructor.prototype.isA = function isA(inClass)
		{
			var current = Constructor;
			while(current)
			{
				if(current === inClass)
				{
					return true;
				}
				current = current._parent;
			}
			return false;
		};
	}
	
	var i;
	var funcName;
	parentChain.reverse();
	for(i in chainDownMethods)
	{
		funcName = chainDownMethods[i];
		Constructor.prototype[funcName] = GameEngineLib.Class.createChainDownCall(parentChain, funcName);
	}
	for(i in chainUpMethods)
	{
		funcName = chainUpMethods[i];
		Constructor.prototype[funcName] = GameEngineLib.Class.createChainUpCall(parentChain, funcName);
	}
	
	return Constructor;
};



GameEngineLib.Class.getInstanceRegistry = function getInstanceRegistry()
{
	if(!GameClassRegistryMap.Class)
	{
		GameClassRegistryMap.Class = new GameEngineLib.GameRegistry();
	}
	return GameClassRegistryMap.Class;
};

GameEngineLib.Class.createInstanceRegistry = function createInstanceRegistry()
{
	GameClassRegistryMap = {};
};



GameEngineLib.Class.createChainDownCall = function createChainDownCall(parentChain, funcName)
{
	var warn = false;
	var funcPtr;
	var funcArray = [];
	var i;
	
	for(i in parentChain)
	{
		funcPtr = parentChain[i][funcName];
		if(!funcPtr && warn)
		{
			if(GameSystemVars.DEBUG)
			{
				GameEngineLib.logger.warn(parentChain[i].getName() + " does not implement " + funcName);
			}
		}
		else if(funcPtr)
		{
			warn = true;
			funcArray.push(funcPtr);
		}
	}
	
	var func = function()
	{
		var funcIndex;
		for(funcIndex in funcArray)
		{
			funcArray[funcIndex].apply(this, arguments);
		}
	};
	func.chaindown = true;
	return func;
};



GameEngineLib.Class.createChainUpCall = function createChainUpCall(parentChain, funcName)
{
	var warn = false;
	var funcPtr;
	var funcArray = [];
	var i;
	
	for(i in parentChain)
	{
		funcPtr = parentChain[i][funcName];
		if(!funcPtr && warn)
		{
			if(GameSystemVars.DEBUG)
			{
				GameEngineLib.logger.warn(parentChain[i].getName() + " does not implement " + funcName);
			}
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
		var funcIndex;
		for(funcIndex in funcArray)
		{
			funcArray[funcIndex].apply(this, arguments);
		}
	};
	func.chainup = true;
	return func;
};