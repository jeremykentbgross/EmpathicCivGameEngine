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

//TODO depricated:
ECGame.EngineLib.createEventSystem = function(instance)//TODO get rid of once I refactor network and input
{
	var property;
	var temp = new ECGame.EngineLib.GameEventSystem();
	instance = instance || {};
	
	for(property in temp)
	{
		instance[property] = temp[property];
	}
	for(property in temp.prototype)
	{
		instance[property] = temp.prototype[property];
	}
	
	return instance;
};



//TODO consider making GameObject inherit this as many things might want to listen to its state!
ECGame.EngineLib.GameEventSystem = function GameEventSystem()
{
	this._eventListeners = {};
};
ECGame.EngineLib.GameEventSystem.prototype.constructor = ECGame.EngineLib.GameEventSystem;
ECGame.EngineLib.GameEventSystem.create = function create()
{
	return new ECGame.EngineLib.GameEventSystem();
};



//TODO add listener sorting (may need to be an array then and use custom sorting?)!
ECGame.EngineLib.GameEventSystem.prototype.registerListener = function registerListener(inEventName, inListener)
{
	var listenerNode = ECGame.EngineLib.createGameCircularDoublyLinkedListNode();
	listenerNode.item = inListener;
	
	this._eventListeners[inEventName] = 
		this._eventListeners[inEventName] ||
		ECGame.EngineLib.createGameCircularDoublyLinkedListNode();
		
	this._eventListeners[inEventName].myPrev.insert(listenerNode);
};



ECGame.EngineLib.GameEventSystem.prototype.deregisterListener = function deregisterListener(inEventName, inListener)
{
	var head;
	var current;
	
	head = this._eventListeners[inEventName];
	if(!head)
	{
		return;
	}
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
};



ECGame.EngineLib.GameEventSystem.prototype.onEvent = function onEvent(inEvent)
{
	var head,
		current,
		eventName,
		callbackName;
	
	try
	{
		eventName = inEvent.getName();
		callbackName = inEvent.getCallbackName();
	}
	catch(error)
	{
		console.log(error.stack);
		return;
	}
	
	head = this._eventListeners[eventName];
	if(!head)
	{
		//TODO should I print something here?
		return;
	}
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
};




//TODO WTF???
//ECGame.EngineLib.GameEventSystem.prototype.serialize = function serialize(serializer)
//{		
//	if(ECGame.Settings.DEBUG)
//	{
//		ECGame.log.info("Serializing EventSystem " + ECGame.EngineLib.GameObjectRef(this).getPath());
//	}
////	if(serializer.isReading())
////	{
////	}
////	else if(serializer.isWriting())
////	{
////	}
//};
////ECGame.EngineLib.GameEventSystem.prototype.clone = function(cloneInstance, clonePrivate)
////{
////	cloneInstance.bIsEntity = this.bIsEntity;
////}
//ECGame.EngineLib.GameEventSystem.prototype.destroy = function destroy(serializer)//WTF??
//{		
//	if(ECGame.Settings.DEBUG)
//	{
//		ECGame.log.info("Destroying EventSystem " + ECGame.EngineLib.GameObjectRef(this).getPath());
//	}
//};
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////