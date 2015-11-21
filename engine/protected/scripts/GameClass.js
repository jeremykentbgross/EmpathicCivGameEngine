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
		//netDynamic: sends dynamic messages over the network
		//TODO clientOnly??(<-how), serverOnly, clientCreatable??
	ChainUp : [],
	ChainDown : [],
	//TODO? mustOverride //pure virtual
	//TODO: SerializeFormat:
	Definition :
	{
		
	}
});
*/


ECGame.EngineLib.Class = function Class(inConstructor, inParents)
{
	this._myConstructor = inConstructor;
	if(inParents)
	{
		this._myParent = inParents[0];//TODO is this needed? or just parents?
		this._myParents = inParents;//<=Not used atm!
	}
	this._myChildClasses = [];//<=also not used atm; TODO flag for not track a child class
	this._myFlags = {};
	this._myClassID = -1;
	this._myInstanceRegistry = null;
};
ECGame.EngineLib.Class.prototype.constructor = ECGame.EngineLib.Class;



ECGame.EngineLib.Class.create = function create(inParams)
{
	var aClass,
		//breaking up params:
		Constructor,
		aParentsList,
		aDefinition,
		aFlags,
		//parsing helpers
		aParentIndex,
		aParent,
		aParentClass,
		aPropertyName,
		aProperty,
		aMethodName,
		aMethods,
		aMethodIndex,
		aFlagIndex,
		aManaged,
		//source text for constuctor
		aConstructorSrc;
	
	//params:
	Constructor = inParams.Constructor;
	aParentsList = inParams.Parents;
	aDefinition = inParams.Definition;
	aFlags = inParams.flags;
	
	Constructor.prototype[Constructor.name] = Constructor;
	Constructor.prototype.constructor = Constructor;
	Constructor.prototype._chainUpMethods = {};
	Constructor.prototype._chainDownMethods = {};
	
	aClass = new ECGame.EngineLib.Class(Constructor, aParentsList);
	
	if(ECGame.Settings.DEBUG)
	{
		aConstructorSrc =
			Constructor.toString()
			/*remove block comments:*/
			.replace(/\x2f\x2a[\S\s]*?\x2a\x2f/g, '')
			//remove line comments
			.replace(/\x2f\x2f[^\n]*\n/g, '\n');
	}
	
	for(aParentIndex in aParentsList)//TODO should be for<length??
	{
		aParent = aParentsList[aParentIndex];
		
		if(ECGame.Settings.DEBUG)
		{
			//make sure the contructor has call to this parent constructor that is not commented out
			if(aConstructorSrc.indexOf('this.' + aParent.name) === -1)
			{
				console.warn(
					Constructor.name + " does not call parent constructor " + aParent.name
				);
			}
		}
		
		//copy prototypes
		for(aPropertyName in aParent.prototype)
		{
			aProperty = aParent.prototype[aPropertyName];
			
			if(aPropertyName === '_chainUpMethods')
			{
				for(aMethodName in aProperty)
				{
					if(Constructor.prototype._chainUpMethods[aMethodName])
					{
						console.warn(Constructor.name + " trying to inherit chain function " + aMethodName + " from an additional parent: " + aParent.name);
						continue;
					}
					
					Constructor.prototype._chainUpMethods[aMethodName] = [];
					aMethods = aProperty[aMethodName];
					for(aMethodIndex = 0; aMethodIndex < aMethods.length; ++aMethodIndex)
					{
						Constructor.prototype._chainUpMethods[aMethodName].push(aMethods[aMethodIndex]);
					}
					
					if(!aDefinition[aMethodName])
					{
						console.warn(Constructor.name + " does not implement chain function " + aMethodName);
					}
					else
					{
						Constructor.prototype._chainUpMethods[aMethodName].unshift(aDefinition[aMethodName]);
					}
				}
			}
			else if(aPropertyName === '_chainDownMethods')
			{
				for(aMethodName in aProperty)
				{
					if(Constructor.prototype._chainDownMethods[aMethodName])
					{
						console.warn(Constructor.name + " trying to inherit chain function " + aMethodName + " from an additional parent: " + aParent.name);
						continue;
					}
					
					Constructor.prototype._chainDownMethods[aMethodName] = [];
					aMethods = aProperty[aMethodName];
					for(aMethodIndex = 0; aMethodIndex < aMethods.length; ++aMethodIndex)
					{
						Constructor.prototype._chainDownMethods[aMethodName].push(aMethods[aMethodIndex]);
					}
					
					if(!aDefinition[aMethodName])
					{
						console.warn(Constructor.name + " does not implement chain function " + aMethodName);
					}
					else
					{
						Constructor.prototype._chainDownMethods[aMethodName].push(aDefinition[aMethodName]);
					}
				}
			}
			else if(Constructor.prototype[aPropertyName])
			{
				console.warn(Constructor.name + " trying to inherit function " + aMethodName + " from an additional parent: " + aParent.name);
			}
			else
			{
				Constructor.prototype[aPropertyName] = aProperty;
			}
		}
		
		for(aPropertyName in aParent)
		{
			Constructor[aPropertyName] = aProperty;
		}
		
		Constructor.prototype[aParent.name] = aParent;
		if(aParent.getClass && aParent.getClass())
		{
			aParentClass = aParent.getClass();
			//TODO IFF track this class
			aParentClass._myChildClasses.push(Constructor);
			for(aFlagIndex in aParentClass._myFlags)
			{
				aClass._myFlags[aFlagIndex] = aParentClass._myFlags[aFlagIndex];
			}
		}
	}
	
	Constructor.prototype[Constructor.name] = Constructor;
	for(aFlagIndex in aFlags)
	{
		aClass._myFlags[aFlagIndex] = aFlags[aFlagIndex];
	}
		
	for(aPropertyName in aDefinition)
	{
		//don't copy over chain functions directly
		if(Constructor.prototype._chainUpMethods[aPropertyName] || Constructor.prototype._chainDownMethods[aPropertyName])
		{
			continue;
		}
		
		if(typeof aDefinition[aPropertyName] === 'function')
		{
			Constructor.prototype[aPropertyName] = aDefinition[aPropertyName];
		}
		else
		{
			Constructor[aPropertyName] = aDefinition[aPropertyName];
		}
	}
	
	for(aMethodIndex in inParams.ChainUp)
	{
		aMethodName = inParams.ChainUp[aMethodIndex];
		if(Constructor.prototype._chainUpMethods[aMethodName])
		{
			console.warn(Constructor.name + " redeclares " + aMethodName + " as a chain function.");
			continue;
		}
		Constructor.prototype._chainUpMethods[aMethodName] = [];
		Constructor.prototype._chainUpMethods[aMethodName].unshift(Constructor.prototype[aMethodName]);
		
		Constructor.prototype[aMethodName] = ECGame.EngineLib.Class._createChainUpFunction(aMethodName);
	}
	for(aMethodIndex in inParams.ChainDown)
	{
		aMethodName = inParams.ChainDown[aMethodIndex];
		if(Constructor.prototype._chainDownMethods[aMethodName])
		{
			console.warn(Constructor.name + " redeclares " + aMethodName + " as a chain function.");
			continue;
		}
		Constructor.prototype._chainDownMethods[aMethodName] = [];
		Constructor.prototype._chainDownMethods[aMethodName].push(Constructor.prototype[aMethodName]);
		
		Constructor.prototype[aMethodName] = ECGame.EngineLib.Class._createChainDownFunction(aMethodName);
	}
	
	aClass.create = Constructor.create = function create()
	{
		var aNewItem = new Constructor();
		if(Constructor.prototype.init && arguments.length)
		{
			Constructor.prototype.init.apply(aNewItem, arguments);
		}
		return aNewItem;
	};
	
	Constructor.getClass = Constructor.prototype.getClass = function getClass()
	{
		return aClass;
	};
	
	aManaged = Constructor.prototype.isA && Constructor.prototype.isA('GameObject');
	if(aManaged)
	{
		aClass.createInstanceRegistry();
		
		Constructor.registerClass = function registerClass()
		{
			var aClassRegistry = ECGame.EngineLib.Class.getInstanceRegistry();
			if(aClassRegistry.findByName(aClass.getName()) !== aClass)
			{
				aClass._myClassID = aClassRegistry.getUnusedID();
				aClassRegistry.register(aClass);
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



ECGame.EngineLib.Class.prototype.getConstructor = function getConstructor()
{
	return this._myConstructor;
};



ECGame.EngineLib.Class.prototype.getParent = function getParent()
{
	return this._myParent;
};



ECGame.EngineLib.Class.prototype.getName = function getName()
{
	return this._myConstructor.name;
};



ECGame.EngineLib.Class.prototype.getFlags = function getFlags()
{
	return this._myFlags;
};



ECGame.EngineLib.Class.prototype.getID = function getID()
{
	return this._myClassID;
};



ECGame.EngineLib.Class.prototype.createInstanceRegistry = ECGame.EngineLib.Class.createInstanceRegistry = function createInstanceRegistry()//TODO rename reset?
{
	this._myInstanceRegistry = new ECGame.EngineLib.Registry();
};



ECGame.EngineLib.Class.prototype.getInstanceRegistry = ECGame.EngineLib.Class.getInstanceRegistry = function getInstanceRegistry()
{
	return this._myInstanceRegistry;
};



ECGame.EngineLib.Class._createChainUpFunction = function _createChainUpFunction(inMethodName)
{
	return function()
	{
		var aFunctionIndex,
			aFunctionArray;
		aFunctionArray = this._chainUpMethods[inMethodName];
		for(aFunctionIndex in aFunctionArray)
		{
			aFunctionArray[aFunctionIndex].apply(this, arguments);
		}
	};
};



ECGame.EngineLib.Class._createChainDownFunction = function _createChainDownFunction(inMethodName)
{
	return function()
	{
		var aFunctionIndex,
			aFunctionArray;
		aFunctionArray = this._chainDownMethods[inMethodName];
		for(aFunctionIndex in aFunctionArray)
		{
			aFunctionArray[aFunctionIndex].apply(this, arguments);
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
			max : ECGame.EngineLib.NetUser.USER_IDS.MAX_EVER
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
			function ?TODOFuncName?(inClass)
			{
				inClass.getInstanceRegistry().forAll(
					function ?name?(inObject)
					{
						dirtyObjects.push(inObject);
					}
				);
			}
		);
		
		console.assert(dirtyObjects.length < maxItemsPerMessage, "Cannot currently serialize so many objects!");
		
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
