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

//TODO depricated!
GameEngineLib.createEntity = function(instance, private)//constructor
{
	var temp = new GameEngineLib.GameEntity();
	instance = instance || {};
	
	for(property in temp)
	{
		instance[property] = temp[property]
	}
	for(property in temp.prototype)
	{
		instance[property] = temp.prototype[property];
	}
	
	return instance;
}



GameEngineLib.GameEntity = function GameEntity()
{
	//TODO should this be 'map' (this object) instead?  Very likely it seems
	//this._myComponents = {}	<=!
	this._myComponents = GameEngineLib.createGameCircularDoublyLinkedListNode();
	
	//TODO change Entity to inherit this instead!
	this._myComponentEventSystem = GameInstance.GameObjectClasses.findByName("EventSystem").create().deref();//HACK!!
}
GameEngineLib.GameEntity.prototype.constructor = GameEngineLib.GameEntity;



GameEngineLib.GameEntity.prototype.addComponent = function addComponent(inComponent)
{
	var node = GameEngineLib.createGameCircularDoublyLinkedListNode();
	node.item = inComponent;
	this._myComponents.myPrev.insert(node);
	inComponent.deref().onAddedToEntity(this);//TODO make onAddedToEntity a proper event for the Components?
	//TODO if world onAddedToWorld
}



GameEngineLib.GameEntity.prototype.removeComponent = function removeComponent(inComponent)
{
	var head = this._myComponents;
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
GameEngineLib.GameEntity.prototype.addedToWorld = function addedToWorld(inWorld)
{
	if(this._myWorld)
	{
		this.removedFromWorld();
	}
	this._myWorld = inWorld;
	this.onEvent(
		{
			getName : function(){return "AddedToWorld";},
			world : inWorld
		}
	);
}
GameEngineLib.GameEntity.prototype.removedFromWorld = function removedFromWorld()
{
	this._myWorld = null;
	this.onEvent(
		{
			getName : function(){return "RemovedFromWorld";},
			world : inWorld
		}
	);
}
GameEngineLib.GameEntity.prototype.getWorld = function getWorld()
{
	return this._myWorld;
}



GameEngineLib.GameEntity.prototype.onEvent = function onEvent(inEvent)
{
	this._myComponentEventSystem.onEvent(inEvent);
}


//TODO remove these via inheritance!
GameEngineLib.GameEntity.prototype.registerListener = function registerListener(inEventName, inListener)
{
	this._myComponentEventSystem.registerListener(inEventName, inListener);
}
GameEngineLib.GameEntity.prototype.deregisterListener = function deregisterListener(inEventName, inListener)
{
	this._myComponentEventSystem.deregisterListener(inEventName, inListener);
}



GameEngineLib.GameEntity.prototype.serialize = function serialize(serializer)
{		
	if(GameSystemVars.DEBUG)
		GameEngineLib.logger.info("Serializing Entity " + GameEngineLib.GameObjectRef(this).getPath());
	
	//TODO serialize component references, and likely the world as well!
	
	/*if(serializer.isReading())
	{
		this.bIsEntity = serializer.read("bIsEntity");
	}
	else if(serializer.isWriting())
	{
		serializer.write("bIsEntity", this.bIsEntity);
	}*/
}

//TODO should auto gen wrapper for these that deregister it
GameEngineLib.GameEntity.prototype.destroy = function destroy(serializer)
{		
	if(GameSystemVars.DEBUG)
		GameEngineLib.logger.info("Destroying Entity " + GameEngineLib.GameObjectRef(this).getPath());
}

