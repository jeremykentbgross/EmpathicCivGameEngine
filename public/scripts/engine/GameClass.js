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

GameEngineLib.Class.create({
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


GameEngineLib.Class = function Class(inConstructor, inParents)
{
	this._constructor = inConstructor;
	
	if(inParents)
	{
		this._parent = inParents[0];//TODO is this needed? or just parents?
		this._parents = inParents;
	}
	
	this._childClasses = [];//TODO flag for not track a child class
	
	this._flags = {};
	
	this._classID = -1;
	
	this._instanceRegistry = null;
	
	/*
	TODOs:
	newInstances,
	netDirtyInstances,
	*/
};
GameEngineLib.Class.prototype = GameEngineLib.Class;



GameEngineLib.Class.create = function create(inParams)
{
	var theClass,
		//breaking up params:
		Constructor,
		inParents,
		inDefinition,
		inFlags,
		//parsing helpers
		parentIndex,
		parent,
		parentClass,
		propertyName,
		property,
		methodName,
		methods,
		methodIndex,
		flagIndex,
		managed,
		//source text for constuctor
		constructorSrc;
	
	//params:
	Constructor = inParams.Constructor;
	inParents = inParams.Parents;
	inDefinition = inParams.Definition;
	inFlags = inParams.flags;
		
	Constructor.prototype = Constructor;
	Constructor._chainUpMethods = {};
	Constructor._chainDownMethods = {};
	
	theClass = new GameEngineLib.Class(Constructor, inParents);
	
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
		if(parent.getClass && parent.getClass())
		{
			parentClass = parent.getClass();
			parentClass._childClasses.push(Constructor);
			for(flagIndex in parentClass._flags)
			{
				theClass._flags[flagIndex] = parentClass._flags[flagIndex];
			}
		}
	}
	
	Constructor[Constructor.name] = Constructor;
	for(flagIndex in inFlags)
	{
		theClass._flags[flagIndex] = inFlags[flagIndex];
	}
		
	for(propertyName in inDefinition)
	{
		//don't copy over chain functions directly
		if(Constructor._chainUpMethods[propertyName] || Constructor._chainDownMethods[propertyName])
		{
			continue;
		}
		
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
		
		Constructor[methodName] = GameEngineLib.Class._createChainUpFunction(methodName);
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
		
		Constructor[methodName] = GameEngineLib.Class._createChainDownFunction(methodName);
	}
	
	theClass.create = Constructor.create = function create()
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
		return theClass;
	};
	
	managed = Constructor.isA && Constructor.isA('GameObject');
	if(managed)
	{
		theClass.createInstanceRegistry();
	}
	else
	{
		delete Constructor['getClass'];
	}
	
	return Constructor;
};



GameEngineLib.Class.getName = function getName()
{
	return this._constructor.name;
};



GameEngineLib.Class.getID = function getID()
{
	return this._classID;
};



GameEngineLib.Class.createInstanceRegistry = function createInstanceRegistry()//TODO rename reset?
{
	this._instanceRegistry = new GameEngineLib.GameRegistry();
};



GameEngineLib.Class.getInstanceRegistry = function getInstanceRegistry()
{
	return this._instanceRegistry;
};



GameEngineLib.Class._createChainUpFunction = function _createChainUpFunction(inMethodName)
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



GameEngineLib.Class._createChainDownFunction = function _createChainDownFunction(inMethodName)
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