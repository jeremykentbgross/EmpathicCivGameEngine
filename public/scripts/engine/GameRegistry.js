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
