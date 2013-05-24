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
	this._myEventListeners = {};
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
	
	this._myEventListeners[inEventName] = 
		this._myEventListeners[inEventName] ||
		ECGame.EngineLib.createGameCircularDoublyLinkedListNode();
		
	this._myEventListeners[inEventName].myPrev.insert(listenerNode);
};



ECGame.EngineLib.GameEventSystem.prototype.deregisterListener = function deregisterListener(inEventName, inListener)
{
	var head;
	var current;
	
	head = this._myEventListeners[inEventName];
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
	
	head = this._myEventListeners[eventName];
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
