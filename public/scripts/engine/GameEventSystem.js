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

/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
GameEngineLib.GameEvent = function GameEvent(inEventName)
{
	this._eventName = inEventName;
}
GameEngineLib.GameEvent.prototype.constructor = GameEngineLib.GameEvent;



GameEngineLib.GameEvent.prototype.getName = function getName()
{
	return this._eventName;
}
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////



/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
//TODO depricated:
GameEngineLib.createEventSystem = function(instance, private)
{
	var temp = new GameEngineLib.GameEventSystem();
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





//TODO consider making GameObject inherit this as many things might want to listen to its state!
GameEngineLib.GameEventSystem = function GameEventSystem()
{
	this._eventListeners = {};
}
GameEngineLib.GameEventSystem.prototype.constructor = GameEngineLib.GameEventSystem;



//TODO add listener sorting (may need to be an array then and use custom sorting?)!
GameEngineLib.GameEventSystem.prototype.registerListener = function registerListener(inEventName, inListener)
{
	var listenerNode = GameEngineLib.createGameCircularDoublyLinkedListNode();
	listenerNode.item = inListener;
	
	this._eventListeners[inEventName] = 
		this._eventListeners[inEventName] ||
		GameEngineLib.createGameCircularDoublyLinkedListNode();
		
	this._eventListeners[inEventName].myPrev.insert(listenerNode);
}



GameEngineLib.GameEventSystem.prototype.deregisterListener = function deregisterListener(inEventName, inListener)
{
	var head;
	var current;
	
	head = this._eventListeners[inEventName];
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



GameEngineLib.GameEventSystem.prototype.onEvent = function onEvent(inEvent)
{
	var head;
	var current;
	var eventName;
	var callbackName;
	
	eventName = inEvent.getName();
	//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	callbackName = "on" + eventName;//TODO axe "on" here and have users add it!!!!!!!!!!!!!!!!!!!!
	//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	
	head = this._eventListeners[eventName];
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



GameEngineLib.GameEventSystem.prototype.serialize = function serialize(serializer)
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
GameEngineLib.GameEventSystem.prototype.clone = function(cloneInstance, clonePrivate)
{
	cloneInstance.bIsEntity = this.bIsEntity;
}
*/



GameEngineLib.GameEventSystem.prototype.destroy = function destroy(serializer)
{		
	if(GameSystemVars.DEBUG)
		GameEngineLib.logger.info("Destroying EventSystem " + GameEngineLib.GameObjectRef(this).getPath());
}
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////