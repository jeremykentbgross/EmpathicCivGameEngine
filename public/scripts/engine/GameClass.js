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
Use case template:

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
	var
		//breaking up params:
		Constructor,
		inParents,
		inDefinition,
		//parsing helpers
		parentIndex,
		parent,
		propertyName,
		property,
		methodName,
		methods,
		methodIndex,
		current,
		managed,
		//source text for constuctor
		constructorSrc;
	
	//params:
	Constructor = inParams.Constructor,
	inParents = inParams.Parents,
	inDefinition = inParams.Definition,
		
	Constructor.prototype = Constructor;
	Constructor._chainUpMethods = {};
	Constructor._chainDownMethods = {};
	
	if(GameSystemVars.DEBUG)
	{
		constructorSrc =
			Constructor.toString()
			/*remove block comments:*/
			.replace(/\x2f\x2a[\S\s]*?\x2a\x2f/g, '')
			//remove line comments
			.replace(/\x2f\x2f[^\n]*\n/g, '\n');
	}
	
	for(parentIndex in inParents)
	{
		parent = inParents[parentIndex];
		
		if(GameSystemVars.DEBUG)
		{
			//make sure the contructor has call to this parent constructor that is not commented out
			if(constructorSrc.indexOf('this.' + parent.name) === -1)
			{
				GameEngineLib.logger.warn(
					Constructor.name + " does not call parent constructor " + parent.name
				);
			}
		}
		
		//copy prototypes
		for(propertyName in parent.prototype)
		{
			property = parent.prototype[propertyName];
			
			if(propertyName === '_chainUpMethods')
			{
				for(methodName in property)
				{
					if(Constructor._chainUpMethods[methodName])
					{
						GameEngineLib.logger.warn(Constructor.name + " trying to inherit chain function " + methodName + " from an additional parent: " + parent.name);
						continue;
					}
					
					Constructor._chainUpMethods[methodName] = [];
					methods = property[methodName];
					for(methodIndex = 0; methodIndex < methods.length; ++methodIndex)
					{
						Constructor._chainUpMethods[methodName].push(methods[methodIndex]);
					}
					
					if(!inDefinition[methodName])
					{
						GameEngineLib.logger.warn(Constructor.name + " does not implement chain function " + methodName);
					}
					else
					{
						Constructor._chainUpMethods[methodName].unshift(inDefinition[methodName]);
					}
				}
			}
			else if(propertyName === '_chainDownMethods')
			{
				for(methodName in property)
				{
					if(Constructor._chainDownMethods[methodName])
					{
						GameEngineLib.logger.warn(Constructor.name + " trying to inherit chain function " + methodName + " from an additional parent: " + parent.name);
						continue;
					}
					
					Constructor._chainDownMethods[methodName] = [];
					methods = property[methodName];
					for(methodIndex = 0; methodIndex < methods.length; ++methodIndex)
					{
						Constructor._chainDownMethods[methodName].push(methods[methodIndex]);
					}
					
					if(!inDefinition[methodName])
					{
						GameEngineLib.logger.warn(Constructor.name + " does not implement chain function " + methodName);
					}
					else
					{
						Constructor._chainDownMethods[methodName].push(inDefinition[methodName]);
					}
				}
			}
			else if(Constructor[propertyName])
			{
				GameEngineLib.logger.warn(Constructor.name + " trying to inherit function " + methodName + " from an additional parent: " + parent.name);
			}
			else
			{
				Constructor[propertyName] = property;
			}
		}
		
		Constructor[parent.name] = parent;
		if(parent._childClasses)
		{
			parent._childClasses.push(Constructor);
		}
	}
	
	Constructor[Constructor.name] = Constructor;
	Constructor._childClasses = [];
	
	if(inParents)
	{
		Constructor._parent = inParents[0];//TODO is this needed? or just parents?
		Constructor._parents = inParents;
	}
	
	for(propertyName in inDefinition)
	{
		//don't copy over chain functions directly
		if(Constructor._chainUpMethods[propertyName] || Constructor._chainDownMethods[propertyName])
		{
			continue;
		}
				
		//make functions static so they can be called by children from parent namespace
		//	and copy static stuff into the class too
		Constructor[propertyName] = inDefinition[propertyName];
	}
	
	for(methodIndex in inParams.ChainUp)
	{
		methodName = inParams.ChainUp[methodIndex];
		if(Constructor._chainUpMethods[methodName])
		{
			GameEngineLib.logger.warn(Constructor.name + " redeclares " + methodName + " as a chain function.");
			continue;
		}
		Constructor._chainUpMethods[methodName] = [];
		Constructor._chainUpMethods[methodName].unshift(Constructor[methodName]);
		
		Constructor[methodName] = GameEngineLib.Class.createChainUpFunction(methodName);
	}
	for(methodIndex in inParams.ChainDown)
	{
		methodName = inParams.ChainDown[methodIndex];
		if(Constructor._chainDownMethods[methodName])
		{
			GameEngineLib.logger.warn(Constructor.name + " redeclares " + methodName + " as a chain function.");
			continue;
		}
		Constructor._chainDownMethods[methodName] = [];
		Constructor._chainDownMethods[methodName].push(Constructor[methodName]);
		
		Constructor[methodName] = GameEngineLib.Class.createChainDownFunction(methodName);
	}
	
	//TODO should do this better.  Like maybe inherit parent flags? should also be private!
	Constructor.flags = inParams.flags;

	Constructor.create = function create()
	{
		var newItem = new Constructor();
		if(Constructor.init && arguments.length)
		{
			Constructor.init.apply(newItem, arguments);
		}
		return newItem;
	};
	
	Constructor.getClass = function getClass()
	{
		return Constructor;
	};
	
	Constructor.getName = function getName()//TODO change to getClassName
	{
		return Constructor.name;
	};
	
	Constructor.getID = function getID()//TODO change to getClassID
	{
		return Constructor._classID;
	};

	//figure if this is a managed object (derived from GameObject)
	managed = false;
	current = Constructor;
	while(current)
	{
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
		
		
		
		//TODO could be in Object with getClass()?
		Constructor.isA = function isA(inClass)
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



GameEngineLib.Class.createChainUpFunction = function createChainUpFunction(inMethodName)
{
	return function()
	{
		var funcIndex,
			funcArray;
		funcArray = this._chainUpMethods[inMethodName];
		for(funcIndex in funcArray)
		{
			funcArray[funcIndex].apply(this, arguments);
		}
	};
};



GameEngineLib.Class.createChainDownFunction = function createChainDownFunction(inMethodName)
{
	return function()
	{
		var funcIndex,
			funcArray;
		funcArray = this._chainDownMethods[inMethodName];
		for(funcIndex in funcArray)
		{
			funcArray[funcIndex].apply(this, arguments);
		}
	};
};