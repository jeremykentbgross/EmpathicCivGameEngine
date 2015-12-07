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
		//	TODO clientOnly??(<-how), serverOnly, clientCreatable??
		//bastardClass: don't register as child with the parent (usually for unit test only GameObjects)
	ChainUp : [],
	ChainDown : [],
	//TODO? mustOverride //pure virtual
	//TODO: SerializeFormat:
	Definition :
	{
		
	}
});
*/


///////////////////////////////////////////////////////////////////////////
//Constructor of Class/////////////////////////////////////////////////////
ECGame.EngineLib.Class = function Class(inConstructor, inParents)
{
	this._myConstructor = inConstructor;
	if(inParents)
	{
		this._myParent = inParents[0];//TODO is this needed? or just parents?
		this._myParents = inParents;//<=Not used atm!
	}
	this._myChildClasses = [];
	this._myFlags = {};
	this._myClassID = -1;
	this._myInstanceRegistry = null;
	if(ECGame.Settings.Debug.UseServerMonitor && ECGame.Settings.Network.isServer)
	{
		this._myEventSystem = null;
	}
};
ECGame.EngineLib.Class.prototype.constructor = ECGame.EngineLib.Class;
//Constructor of Class/////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////
//Class Factory function://////////////////////////////////////////////////
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

			if(!aFlags.bastardClass)
			{
				aParentClass._myChildClasses.push(Constructor);
			}
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
			var aClassClass;

			aClassClass = ECGame.EngineLib.Class;
			if(aClassClass.findInstanceByName(aClass.getName()) !== aClass)
			{
				aClass._myClassID = aClassClass.getUnusedInstanceID();
				aClassClass.registerInstance(aClass);
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
//Class Factory function://////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////
//Basic get functions://///////////////////////////////////////////////////
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
ECGame.EngineLib.Class.getName = function getName()
{
	return 'Class';
};

ECGame.EngineLib.Class.prototype.getFlags = function getFlags()
{
	return this._myFlags;
};

ECGame.EngineLib.Class.prototype.getID = function getID()
{
	return this._myClassID;
};
//Basic get functions://///////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////
//Debug Draw helpers///////////////////////////////////////////////////////
ECGame.EngineLib.Class.getDebugString = function getDebugString()
{
	var aReturnString;

	//if we draw class hierarchy then start with GameObject:
	if(ECGame.Settings.Debug.Classes_DrawAsHierarchy)
	{
		aReturnString = ECGame.EngineLib.GameObject.getClass().getDebugString();
	}
	//else do it normally:
	else
	{
		aReturnString = '+' + this.getName();

		this._myInstanceRegistry.forAll(
			function eachClassInstances(inInstance)
			{
				aReturnString += '\n' + inInstance.getDebugString(true, 1);
			}
		);
	}

	return aReturnString;
};
ECGame.EngineLib.Class.debugDraw = function debugDraw(inManualString)
{
/*	
	//if we draw class hierarchy then start with GameObject and return:
	if(ECGame.Settings.Debug.Classes_DrawAsHierarchy)
	{
		ECGame.EngineLib.GameObject.getClass().debugDraw();
		return;
	}
	//else do it normally:

	ECGame.instance.getGraphics().drawDebugText(
		'+' + this.getName()
		,ECGame.Settings.Debug.Classes_DrawColor
	);

	this._myInstanceRegistry.forAll(
		function drawClassInstances(inInstance)
		{
			inInstance.debugDraw(true, 1);
		}
	);
*/
	var aStringArray
		,i
		;

	aStringArray = (inManualString || "+++Client Object Tree:+++\n" + this.getDebugString()).split(/\n/g);

	for(i = 0; i < aStringArray.length; ++i)
	{
		ECGame.instance.getGraphics().drawDebugText(
			aStringArray[i]
			//choose the color based on if its a class or object instance:
			//	Note: classes lead with a '+' after possible appropriate indentation
			,aStringArray[i].match(/^(\|\t)*\+/)
				? ECGame.Settings.Debug.Classes_DrawColor
				: ECGame.Settings.Debug.Classes_Instances_DrawColor
		);
	}
};
ECGame.EngineLib.Class.prototype.getDebugString = function getDebugString(inNoRecursive, inDepth)
{
	var i
		,aReturnString
		,aLeadString
		;

	inDepth = inDepth || 0;
	aLeadString = '';

	for(i = 0; i < inDepth; ++i)
	{
		aLeadString += '|\t';
	}

	aReturnString = aLeadString + '+' + this.getName() + ' (' + this.getID() + ')';

	this._myInstanceRegistry.forAll(
		function eachInstances(inInstance)
		{
			aReturnString += '\n' + aLeadString + '|\t(' + inInstance.getID() + ') ' + inInstance.getName();
		}
	);

	if(!inNoRecursive)
	{
		++inDepth;
		for(i = 0; i < this._myChildClasses.length; ++i)
		{
			aReturnString += '\n' + this._myChildClasses[i].getClass().getDebugString(inNoRecursive, inDepth);
		}
	}

	return aReturnString;
};
/*
ECGame.EngineLib.Class.prototype.debugDraw = function debugDraw(inNoRecursive, inDepth)
{
	//TODO use updater leading depth function!!
	var i, aString = '';
	for(i = 0; i < inDepth; ++i)
	{
		aString += '|\t';
	}

	inDepth = inDepth || 0;

	ECGame.instance.getGraphics().drawDebugText(
		aString + '+' + this.getName() + ' (' + this.getID() + ')'
		,ECGame.Settings.Debug.Classes_DrawColor
	);
	this._myInstanceRegistry.forAll(
		function drawClassInstances(inInstance)
		{
			ECGame.instance.getGraphics().drawDebugText(
				aString + '|\t(' + inInstance.getID() + ') ' + inInstance.getName()
				,ECGame.Settings.Debug.Classes_Instances_DrawColor
			);
		}
	);

	if(!inNoRecursive)
	{
		++inDepth;
		for(i = 0; i < this._myChildClasses.length; ++i)
		{
			this._myChildClasses[i].getClass().debugDraw(inNoRecursive, inDepth);
		}
	}
};
*/
//Debug Draw helpers///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////
//Instance Tracking:///////////////////////////////////////////////////////
ECGame.EngineLib.Class.prototype.createInstanceRegistry
	= ECGame.EngineLib.Class.createInstanceRegistry
	= function createInstanceRegistry()
{
	this._myInstanceRegistry = new ECGame.EngineLib.Registry();

	if(ECGame.Settings.Debug.UseServerMonitor && ECGame.Settings.Network.isServer)
	{
		this._myEventSystem = ECGame.EngineLib.EventSystem.create();
	}
};
//=>
//Create a master class registry
//	(note: atm this is for availablity in unit tests, and it will be recreated
//	in the Game.instance)
ECGame.EngineLib.Class.createInstanceRegistry();



ECGame.EngineLib.Class.prototype._getInstanceRegistry
	= ECGame.EngineLib.Class._getInstanceRegistry
	= function _getInstanceRegistry()
{
	return this._myInstanceRegistry;
};



/*ECGame.EngineLib.Class.prototype.getMaxInstanceID
	= */ECGame.EngineLib.Class.getMaxInstanceID
	= function getMaxInstanceID()
{
	return this._myInstanceRegistry.getMaxID();
};
ECGame.EngineLib.Class.prototype.getUnusedInstanceID
	= ECGame.EngineLib.Class.getUnusedInstanceID
	= function getUnusedInstanceID()
{
	return this._myInstanceRegistry.getUnusedID();
};



ECGame.EngineLib.Class.prototype.registerInstance =
	ECGame.EngineLib.Class.registerInstance =
	function registerInstance(inItem)
{
	this._myInstanceRegistry.register(inItem);
};
ECGame.EngineLib.Class.prototype.deregisterInstance =
	ECGame.EngineLib.Class.deregisterInstance =
	function deregisterInstance(inItem)
{
	this._myInstanceRegistry.deregister(inItem);
};
if(ECGame.Settings.Debug.UseServerMonitor && ECGame.Settings.Network.isServer)
{
	//TODO make this path override inside a server only file

	ECGame.EngineLib.Class.registerInstance = function registerInstance(inClass)
	{
		this._myInstanceRegistry.register(inClass);
		inClass.registerListener('GameObjectRegistered', this);
		inClass.registerListener('GameObjectDeregistered', this);
	};
	ECGame.EngineLib.Class.prototype.registerInstance = function registerInstance(inInstance)
	{
		this._myInstanceRegistry.register(inInstance);
		this._myEventSystem.onEvent(
			new ECGame.EngineLib.Events.GameObjectRegistered(inInstance)
		);
	};
	/*
	ECGame.EngineLib.Class.deregisterInstance = function deregisterInstance(inClass)
	{
		this._myInstanceRegistry.deregister(inClass);
		inClass.deregisterListener(..., this);//TODO GameObjectDeregistered
	};*/
	ECGame.EngineLib.Class.prototype.deregisterInstance = function deregisterInstance(inInstance)
	{
		this._myInstanceRegistry.deregister(inInstance);
		this._myEventSystem.onEvent(
			new ECGame.EngineLib.Events.GameObjectDeregistered(inInstance)
		);
	};

	ECGame.EngineLib.Class.prototype.registerListener =
		ECGame.EngineLib.Class.registerListener =
		function registerListener(inEvent, inListener)
	{
		this._myEventSystem.registerListener(inEvent, inListener);
	};
	ECGame.EngineLib.Class.prototype.deregisterListener =
		ECGame.EngineLib.Class.deregisterListener =
		function deregisterListener(inEvent, inListener)
	{
		this._myEventSystem.deregisterListener(inEvent, inListener);
	};
	ECGame.EngineLib.Class.onGameObjectRegistered = function onGameObjectRegistered(inEvent)
	{
		//refire it:
		this._myEventSystem.onEvent(inEvent);
	};
	ECGame.EngineLib.Class.onGameObjectDeregistered = function onGameObjectDeregistered(inEvent)
	{
		//refire it:
		this._myEventSystem.onEvent(inEvent);
	};
}



ECGame.EngineLib.Class.prototype.findInstanceByName
	= ECGame.EngineLib.Class.findInstanceByName
	= function findInstanceByName(inName)
{
	return this._myInstanceRegistry.findByName(inName);
};
ECGame.EngineLib.Class.prototype.findInstanceByID
	= ECGame.EngineLib.Class.findInstanceByID
	= function findInstanceByID(inID)
{
	return this._myInstanceRegistry.findByID(inID);
};



ECGame.EngineLib.Class.prototype.forAllInstances
	= ECGame.EngineLib.Class.forAllInstances
	= function forAllInstances(inCallback)
{
	return this._myInstanceRegistry.forAll(inCallback);
};
//Instance Tracking:///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////




///////////////////////////////////////////////////////////////////////////
//Private helper functions/////////////////////////////////////////////////
ECGame.EngineLib.Class._createChainUpFunction = function _createChainUpFunction(inMethodName)
{
	return function ChainUp()
	{
		var aFunctionIndex
			,aFunctionArray
			;

		aFunctionArray = this._chainUpMethods[inMethodName];
		for(aFunctionIndex in aFunctionArray)
		{
			aFunctionArray[aFunctionIndex].apply(this, arguments);
		}
	};
};
ECGame.EngineLib.Class._createChainDownFunction = function _createChainDownFunction(inMethodName)
{
	return function ChainDown()
	{
		var aFunctionIndex
			,aFunctionArray
			;

		aFunctionArray = this._chainDownMethods[inMethodName];
		for(aFunctionIndex in aFunctionArray)
		{
			aFunctionArray[aFunctionIndex].apply(this, arguments);
		}
	};
};
//Private helper functions/////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////







/*
Old scratch work, maybe useful for later:

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
			max : ECGame.EngineLib.Class.getInstance Registry().getMaxID()
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
		ECGame.EngineLib.Class.getInstance Registry().forAll(
			function ?TODOFuncName?(inClass)
			{
				inClass.getInstance Registry().forAll(
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
				objectClass = ECGame.EngineLib.Class.getInstance Registry().findByID(objectHeader.classID);
				object = objectClass.getInstance Registry().findByID(objectHeader.instanceID);
				
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
