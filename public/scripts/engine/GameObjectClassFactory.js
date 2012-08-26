
//TODO rename as ClassClass
GameEngineLib.createGameObjectClassFactory = function()
{
	var outGameClassFactory;
	var classFactory_nextClassID = 0;
	outGameClassFactory = GameEngineLib.createGameRegistry(GameEngineLib.createGameObject());
	outGameClassFactory.setName("GameObjectClassFactory");
	
	outGameClassFactory.create = function(inClassName, inParentClass, inUserInit, inFlags)
	{
		var outClass;
		var private = {};
		var local = {};
		
		if(!inUserInit)
		{
			GameEngineLib.logger.error(inClassName + " has no valid constructor!");
			return;
		}
		
		//create the class object
		outClass = GameEngineLib.createGameRegistry(GameEngineLib.createGameObject());
		outClass.setName(inClassName);
		delete outClass.setName;
		outClass.setID(classFactory_nextClassID++);
		delete outClass.setID;
		outClass.setClass(outGameClassFactory);
		delete outClass.setClass;		
		delete outClass.clone;//TODO is this needed?
		
		outClass.flags = inFlags || {};
		
		private.generateIndex = 0;
		
		//determine parent class
		if(inClassName !== "GameObject" && !inParentClass)
		{
			inParentClass = "GameObject";
		}
		if(typeof inParentClass === "string")
		{
			inParentClass = this.findByName(inParentClass);
		}
		//set parent class
		private.parentClass = inParentClass;
		outClass.getParentClass = function()
		{
			return inParentClass;
		}
		
		//build parent chain
		private.parentChain = GameEngineLib.createGameCircularDoublyLinkedListNode(outClass);
		local.currentParent = inParentClass;
		while(local.currentParent)
		{
			private.parentChain.insertBack(
				GameEngineLib.createGameCircularDoublyLinkedListNode(
					local.currentParent
				)
			);
			local.currentParent = local.currentParent.getParentClass();
		}
		
		//todo register us with the parent?
		
		if(GameSystemVars.DEBUG)
		{
			GameEngineLib.addDebugInfo("Class", outClass, private);
			outClass.debug_myParentClassName = inParentClass ? inParentClass.getName() : null;
			outClass.debug_myParentClass = inParentClass;
		}
		
		
		private.createChainDownCall = function(objIns, funcName)
		{
			var warn = false;
			private.parentChain.forAllReverse(
				function(item)
				{
					funcPtr = objIns["super_" + item.getName()][funcName];
					if(!funcPtr && warn)
					{
						GameEngineLib.logger.warn(item.getName() + " does not implement " + funcName);
					}
					else if(funcPtr)
						warn = true;
				}
			);
			
			return function(params)
			{
				var funcPtr;
				var caller = this;
				
				private.parentChain.forAllReverse(
					function(item)
					{
						funcPtr = caller["super_" + item.getName()][funcName];
						if(funcPtr)
						{
							funcPtr.call(caller, params);//todo param
						}
					}
				);
			};
		}
		
		private.createChainUpCall = function(objIns, funcName)
		{
			var warn = false;
			private.parentChain.forAllReverse(
				function(item)
				{
					funcPtr = objIns["super_" + item.getName()][funcName];
					if(!funcPtr && warn)
					{
						GameEngineLib.logger.warn(item.getName() + " does not implement " + funcName);
					}
					else if(funcPtr)
						warn = true;
				}
			);
			
			return function(params)
			{
				var funcPtr;
				var caller = this;
				
				private.parentChain.forAll(
					function(item)
					{
						funcPtr = caller["super_" + item.getName()][funcName];
						if(funcPtr)
						{
							funcPtr.call(caller, params);//todo param
						}
					}
				);
			};
		}
		
		//todo should be private? cant be cause of called on parent
		outClass.createUnregistered = function()
		{
			var instance = {};
			var tempInstance = {};
			var superName = "super_" + inClassName;
			var property;
			var privateData = {};
			
			if(inParentClass)
			{
				instance = inParentClass.createUnregistered();
			}
			
			inUserInit(tempInstance, privateData);
			instance[superName] = {};
			
			if(GameSystemVars.DEBUG)
			{
				instance[superName].debug_private = privateData;
			}		
			
			for(property in tempInstance)
			{
				if(tempInstance.hasOwnProperty(property))
				{
					instance[property] = tempInstance[property];
					if(typeof tempInstance[property] === 'function')
					{
						instance[superName][property] = tempInstance[property];
						if(tempInstance[property].chainup === true)
						{
							//add to list to make sure is overridden
							instance.chainup = instance.chainup || []
							instance.chainup.push(property);
						}
						if(tempInstance[property].chaindown === true)
						{
							//add to list to make sure is overridden
							instance.chaindown = instance.chaindown || []
							instance.chaindown.push(property);
						}
					}
				}
			}
			delete tempInstance;
			
			return instance;
		}
		
		outClass.create = function(inName)
		{
			var instance;
			
			instance = this.createUnregistered();
			inName = inName || inClassName + "_Instance_" + (private.generateIndex).toString(10);
			instance.setName(inName);
			instance.setID(this.getUnusedID() || private.generateIndex);
			instance.setClass(this);
			++private.generateIndex;
						
			for(var i in instance.chainup)
			{
				var func = instance.chainup[i];
				instance[func] = private.createChainUpCall(instance, func);
			}
			delete instance.chainup;
			
			for(var i in instance.chaindown)
			{
				var func = instance.chaindown[i];
				instance[func] = private.createChainDownCall(instance, func);
			}
			delete instance.chaindown;
			
			delete instance.setClass;
			
			return GameEngineLib.createGameObjectRef(instance);
		}
		
		//todo add isa()
		
		delete local;
				
		return outClass;
	}
	
	delete outGameClassFactory.setName;
	delete outGameClassFactory.setClass;
	delete outGameClassFactory.clone;
		
	return outGameClassFactory;
}

