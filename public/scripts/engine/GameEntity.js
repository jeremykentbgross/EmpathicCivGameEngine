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

GameEngineLib.createEntity = function(instance, private)//constructor
{
	instance = instance || {};
	private = private || {};

	private.myComponents = GameEngineLib.createGameCircularDoublyLinkedListNode();
	//TODO remove this from being a gameobject, make entity an event system with more stuff:
	private.myComponentEventSystem = GameInstance.GameObjectClasses.findByName("EventSystem").create().deref();//HACK!!
	
	instance.addComponent = function(inComponent)
	{
		var node = GameEngineLib.createGameCircularDoublyLinkedListNode();
		node.item = inComponent;
		private.myComponents.myPrev.insert(node);
		inComponent.deref().onAddedToEntity(this);//TODO make onAddedToEntity a proper event for the Components?
		//TODO if world onAddedToWorld
	}
	
	instance.removeComponent = function(inComponent)
	{
		var head = private.myComponents;
		var node = head;
		
		while(node !== head)
		{
			if(node.item === inComponent)
			{
				node.remove();
				break;
			}
			node = node.myNext;
		}
		
		//TODO if world onRemovedFromWorld
		inComponent.onRemovedFromEntity();
	}
	
	//TODO make onAddedTo/RemovedFromWorld events part of the entity and it can set the world along with its components?
	instance.addedToWorld = function(inWorld)
	{
		if(private.myWorld)
		{
			this.removedFromWorld();
		}
		private.myWorld = inWorld;
		this.onEvent(
			{
				getName : function(){return "AddedToWorld";},
				world : inWorld
			}
		);
	}
	instance.removedFromWorld = function()
	{
		private.myWorld = null;
		this.onEvent(
			{
				getName : function(){return "RemovedFromWorld";},
				world : inWorld
			}
		);
	}
	instance.getWorld = function()
	{
		return private.myWorld;
	}
	
	
	
	instance.onEvent = function(inEvent)
	{
		private.myComponentEventSystem.onEvent(inEvent);
	}
	
	instance.registerListener = function(inEventName, inListener)
	{
		private.myComponentEventSystem.registerListener(inEventName, inListener);
	}
	
	instance.deregisterListener = function(inEventName, inListener)
	{
		private.myComponentEventSystem.deregisterListener(inEventName, inListener);
	}
			
	instance.serialize = function(serializer)
	{		
		if(GameSystemVars.DEBUG)
			GameEngineLib.logger.info("Serializing Entity " + GameEngineLib.GameObjectRef(this).getPath());
			
		/*if(serializer.isReading())
		{
			this.bIsEntity = serializer.read("bIsEntity");
		}
		else if(serializer.isWriting())
		{
			serializer.write("bIsEntity", this.bIsEntity);
		}*/
	}
	
	instance.destroy = function(serializer)
	{		
		if(GameSystemVars.DEBUG)
			GameEngineLib.logger.info("Destroying Entity " + GameEngineLib.GameObjectRef(this).getPath());
	}
	
	return instance;
}


//TODO move this to its own file
GameEngineLib.createEntityComponent = function(instance, private)//constructor
{		
	instance = instance || {};
	private = private || {};
	
	instance.onAddedToEntity = function(inEntity)
	{
		if(private.myOwner)
		{
			this.onRemovedFromEntity();
		}
		
		//todo register for events
	}
	instance.onAddedToEntity.chaindown = true;
	
	instance.onRemovedFromEntity = function()
	{
		//todo unregister for events
	}
	instance.onRemovedFromEntity.chainup = true;
	
	instance.destroy = function(){}//TODO
	instance.serialize = function(){}//TODO


	return instance;
}








/*
GameInstance.GameObjectClasses.create(
	"Hero",
	"Entity",
	function(instance, private)//constructor
	{		
		private.myHealth = 100;
		instance.bIsHero = true;
		instance.doStuffForHero = function(){}
		
		instance.serialize = function(serializer)
		{		
			if(GameSystemVars.DEBUG)
				GameEngineLib.logger.info("Serializing Hero " + GameEngineLib.GameObjectRef(this).getPath());
				
			if(serializer.isReading())
			{
				private.myHealth = serializer.read("myHealth");
				this.bIsHero = serializer.read("bIsHero");
			}
			else if(serializer.isWriting())
			{
				serializer.write("myHealth", private.myHealth);
				serializer.write("bIsHero", this.bIsHero);
			}
		}
		
		//instance.clone = function(cloneInstance, clonePrivate)
		//{
			
		//}
		
		//add stuff
		return instance;
	}
);
*/


