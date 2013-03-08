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

ECGame.EngineLib.Class.create({
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


ECGame.EngineLib.Class = function Class(inConstructor, inParents)
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
	
//	this._newInstances = [];
//	this._netDirtyInstances = [];
	/*
	TODOs:
	newInstances,
	netDirtyInstances,
	destroyedInstances
	*/
};
ECGame.EngineLib.Class.prototype.constructor = ECGame.EngineLib.Class;



ECGame.EngineLib.Class.create = function create(inParams)
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
		
	Constructor.prototype.constructor = Constructor;
	Constructor.prototype._chainUpMethods = {};
	Constructor.prototype._chainDownMethods = {};
	
	theClass = new ECGame.EngineLib.Class(Constructor, inParents);
	
	if(ECGame.Settings.DEBUG)
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
		
		if(ECGame.Settings.DEBUG)
		{
			//make sure the contructor has call to this parent constructor that is not commented out
			if(constructorSrc.indexOf('this.' + parent.name) === -1)
			{
				ECGame.log.warn(
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
					if(Constructor.prototype._chainUpMethods[methodName])
					{
						ECGame.log.warn(Constructor.name + " trying to inherit chain function " + methodName + " from an additional parent: " + parent.name);
						continue;
					}
					
					Constructor.prototype._chainUpMethods[methodName] = [];
					methods = property[methodName];
					for(methodIndex = 0; methodIndex < methods.length; ++methodIndex)
					{
						Constructor.prototype._chainUpMethods[methodName].push(methods[methodIndex]);
					}
					
					if(!inDefinition[methodName])
					{
						ECGame.log.warn(Constructor.name + " does not implement chain function " + methodName);
					}
					else
					{
						Constructor.prototype._chainUpMethods[methodName].unshift(inDefinition[methodName]);
					}
				}
			}
			else if(propertyName === '_chainDownMethods')
			{
				for(methodName in property)
				{
					if(Constructor.prototype._chainDownMethods[methodName])
					{
						ECGame.log.warn(Constructor.name + " trying to inherit chain function " + methodName + " from an additional parent: " + parent.name);
						continue;
					}
					
					Constructor.prototype._chainDownMethods[methodName] = [];
					methods = property[methodName];
					for(methodIndex = 0; methodIndex < methods.length; ++methodIndex)
					{
						Constructor.prototype._chainDownMethods[methodName].push(methods[methodIndex]);
					}
					
					if(!inDefinition[methodName])
					{
						ECGame.log.warn(Constructor.name + " does not implement chain function " + methodName);
					}
					else
					{
						Constructor.prototype._chainDownMethods[methodName].push(inDefinition[methodName]);
					}
				}
			}
			else if(Constructor.prototype[propertyName])
			{
				ECGame.log.warn(Constructor.name + " trying to inherit function " + methodName + " from an additional parent: " + parent.name);
			}
			else
			{
				Constructor.prototype[propertyName] = property;
			}
		}
		
		for(propertyName in parent)
		{
			Constructor[propertyName] = property;
		}
		
		Constructor.prototype[parent.name] = parent;
		if(parent.getClass && parent.getClass())
		{
			parentClass = parent.getClass();
			//TODO IFF track this class
			parentClass._childClasses.push(Constructor);
			for(flagIndex in parentClass._flags)
			{
				theClass._flags[flagIndex] = parentClass._flags[flagIndex];
			}
		}
	}
	
	Constructor.prototype[Constructor.name] = Constructor;
	for(flagIndex in inFlags)
	{
		theClass._flags[flagIndex] = inFlags[flagIndex];
	}
		
	for(propertyName in inDefinition)
	{
		//don't copy over chain functions directly
		if(Constructor.prototype._chainUpMethods[propertyName] || Constructor.prototype._chainDownMethods[propertyName])
		{
			continue;
		}
		
		if(typeof inDefinition[propertyName] === 'function')
		{
			Constructor.prototype[propertyName] = inDefinition[propertyName];
		}
		else
		{
			Constructor[propertyName] = inDefinition[propertyName];
		}
	}
	
	for(methodIndex in inParams.ChainUp)
	{
		methodName = inParams.ChainUp[methodIndex];
		if(Constructor.prototype._chainUpMethods[methodName])
		{
			ECGame.log.warn(Constructor.name + " redeclares " + methodName + " as a chain function.");
			continue;
		}
		Constructor.prototype._chainUpMethods[methodName] = [];
		Constructor.prototype._chainUpMethods[methodName].unshift(Constructor.prototype[methodName]);
		
		Constructor.prototype[methodName] = ECGame.EngineLib.Class._createChainUpFunction(methodName);
	}
	for(methodIndex in inParams.ChainDown)
	{
		methodName = inParams.ChainDown[methodIndex];
		if(Constructor.prototype._chainDownMethods[methodName])
		{
			ECGame.log.warn(Constructor.name + " redeclares " + methodName + " as a chain function.");
			continue;
		}
		Constructor.prototype._chainDownMethods[methodName] = [];
		Constructor.prototype._chainDownMethods[methodName].push(Constructor.prototype[methodName]);
		
		Constructor.prototype[methodName] = ECGame.EngineLib.Class._createChainDownFunction(methodName);
	}
	
	theClass.create = Constructor.create = function create()
	{
		var newItem = new Constructor();
		if(Constructor.prototype.init && arguments.length)
		{
			Constructor.prototype.init.apply(newItem, arguments);
		}
		return newItem;
	};
	
	Constructor.getClass = Constructor.prototype.getClass = function getClass()
	{
		return theClass;
	};
	
	managed = Constructor.prototype.isA && Constructor.prototype.isA('GameObject');
	if(managed)
	{
		theClass.createInstanceRegistry();
		
		Constructor.registerClass = function registerClass()
		{
			var classRegistry = ECGame.EngineLib.Class.getInstanceRegistry();
			if(classRegistry.findByName(theClass.getName()) !== theClass)
			{
				theClass._classID = classRegistry.getUnusedID();
				classRegistry.register(theClass);
			}
		};
	}
	else
	{
		delete Constructor.getClass;
		delete Constructor.prototype.getClass;
	}
	
	return Constructor;
};



ECGame.EngineLib.Class.prototype.getName = function getName()
{
	return this._constructor.name;
};



ECGame.EngineLib.Class.prototype.getID = function getID()
{
	return this._classID;
};



ECGame.EngineLib.Class.prototype.createInstanceRegistry = ECGame.EngineLib.Class.createInstanceRegistry = function createInstanceRegistry()//TODO rename reset?
{
	this._instanceRegistry = new ECGame.EngineLib.GameRegistry();
};



ECGame.EngineLib.Class.prototype.getInstanceRegistry = ECGame.EngineLib.Class.getInstanceRegistry = function getInstanceRegistry()
{
	return this._instanceRegistry;
};



ECGame.EngineLib.Class._createChainUpFunction = function _createChainUpFunction(inMethodName)
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



ECGame.EngineLib.Class._createChainDownFunction = function _createChainDownFunction(inMethodName)
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


/*
ECGame.EngineLib.Class.serializeAll = function serializeAll(inSerializer)
{
	var dirtyObjects,
		maxItemsPerMessage,
		serializeHeaderFormat,
		objectHeaderFormat,
		serializeHeader,
		objectHeader,
		i,
		objectClass,
		object;
	
	dirtyObjects = [];
	maxItemsPerMessage = 65535;//TODO make this a constant elsewhere (globals)
	
	serializeHeaderFormat =
	[
		{
			name : 'userID',
			type : 'int',
			net : true,
			min : 0,
			max : ECGame.EngineLib.User.USER_IDS.MAX_EVER
		},
		{
			name : 'numObjects',
			type : 'int',
			net : true,
			min : 1,
			max : maxItemsPerMessage
		}
	];
	objectHeaderFormat =
	[
		{
			name : 'classID',
			type : 'int',
			net : true,
			min : 0,
			max : ECGame.EngineLib.Class.getInstanceRegistry().getMaxID()
		},
		{
			name : 'instanceID',
			type : 'int',
			net : true,
			min : 0,
			max : 4096	//note: this assumes a max of 4096 objects of any given type.  may want max items per type in the future
		}
	];
	
	serializeHeader = {};
	objectHeader = {};
	
	if()//writing
	{
		ECGame.EngineLib.Class.getInstanceRegistry().forAll(
			function(inClass)
			{
				inClass.getInstanceRegistry().forAll(
					function(inObject)
					{
						dirtyObjects.push(inObject);
					}
				);
			}
		);
		
		ECGame.log.assert(dirtyObjects.length < maxItemsPerMessage, "Cannot currently serialize so many objects!");
		
		serializeHeader.numObjects = Math.min(maxItemsPerMessage, dirtyObjects.length);
		inSerializer.serializeObject(serializeHeader, serializeHeaderFormat);
		
		for(i = 0; i < serializeHeader.numObjects; ++i)
		{
			var object = dirtyObjects[i];
			objectHeader.classID = object.getClass().getID();
			objectHeader.instanceID = object.getID();
			inSerializer.serializeObject(objectHeader, objectHeaderFormat);
			object.serialize(inSerializer);
		}
	}
	else
	{
		try
		{
			inSerializer.serializeObject(serializeHeader, serializeHeaderFormat);
			
			for(i = 0; i < serializeHeader.numObjects; ++i)
			{
				inSerializer.serializeObject(objectHeader, objectHeaderFormat);
				objectClass = ECGame.EngineLib.Class.getInstanceRegistry().findByID(objectHeader.classID);
				object = objectClass.getInstanceRegistry().findByID(objectHeader.instanceID);
				
				//if not found, and not server, create it
				if(!object)
				{
					//TODO and this user can create it! (HOW to tell??)
					{
						object = objectClass.create();
						object.setID(objectHeader.instanceID);
					}
					//TODO else throw error
				}

				object.serialize(inSerializer);
			}
		}
		catch(error)
		{
			console.log(error.stack);
		}
	}
};*/