GameEngineLib.createEventSystem = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	if(GameSystemVars.DEBUG)
	{
		GameEngineLib.addDebugInfo("GameEventSystem", instance, private);
	}
	
	private.myEventListeners = {};
	
	//TODO add listener sorting!
	instance.registerListener = function(inEventName, inListener)
	{
		var listenerNode = GameEngineLib.createGameCircularDoublyLinkedListNode();
		listenerNode.item = inListener;
		
		private.myEventListeners[inEventName] = 
			private.myEventListeners[inEventName] ||
			GameEngineLib.createGameCircularDoublyLinkedListNode();
			
		private.myEventListeners[inEventName].myPrev.insert(listenerNode);
	}
	
	instance.deregisterListener = function(inEventName, inListener)
	{
		var head;
		var current;
		
		head = private.myEventListeners[inEventName];
		if(!head)
			return;
		current = head.myNext;
		
		while(current !== head)
		{
			if(current.item === inListener)
			{
				current.remove();
				return;
			}
			
			current = current.myNext;
		}
	}
	
	instance.onEvent = function(inEvent)
	{
		var head;
		var current;
		var eventName;
		var callbackName;
		
		eventName = inEvent.getName();
		callbackName = "on" + eventName;
		
		head = private.myEventListeners[eventName];
		if(!head)
			return;
		current = head.myNext;
		
		while(current !== head)
		{
			try
			{
				current.item[callbackName](inEvent);
			}
			catch(error)
			{
				console.log(error.stack);
			}
			
			current = current.myNext;
		}
	}
			
	instance.serialize = function(serializer)
	{		
		if(GameSystemVars.DEBUG)
			GameEngineLib.logger.info("Serializing EventSystem " + GameEngineLib.GameObjectRef(this).getPath());
			
		/*if(serializer.isReading())
		{
		}
		else if(serializer.isWriting())
		{
		}*/
	}
	/*
	instance.clone = function(cloneInstance, clonePrivate)
	{
		cloneInstance.bIsEntity = this.bIsEntity;
	}
	*/
	instance.destroy = function(serializer)
	{		
		if(GameSystemVars.DEBUG)
			GameEngineLib.logger.info("Destroying EventSystem " + GameEngineLib.GameObjectRef(this).getPath());
	}
	
	//add stuff
	return instance;
}