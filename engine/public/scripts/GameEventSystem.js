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

ECGame.EngineLib.EventSystem = function EventSystem()
{
	this._myEventListeners = {};
};
ECGame.EngineLib.EventSystem.prototype.constructor = ECGame.EngineLib.EventSystem;

ECGame.EngineLib.EventSystem.create = function create()
{
	return new ECGame.EngineLib.EventSystem();
};


//TODO use actual event class to de/register listener(s)
ECGame.EngineLib.EventSystem.prototype.registerListener = function registerListener(inEventName, inListener)
{
	this._myEventListeners[inEventName] = 
		this._myEventListeners[inEventName] ||
		ECGame.EngineLib.LinkedListNode.create();
		
	this._myEventListeners[inEventName].insertItem_ListBack(
		inListener
		//TODO sort function
	);
};

ECGame.EngineLib.EventSystem.prototype.deregisterListener = function deregisterListener(inEventName, inListener)
{
	var aList
		;
	
	aList = this._myEventListeners[inEventName];
	
	if(aList)
	{
		aList.removeItem(inListener);
	}
};



ECGame.EngineLib.EventSystem.prototype.onEvent = function onEvent(inEvent)
{
	var anEventName
		,aCallBackName
		,aListeners
		,i
		;
	
	try
	{
		anEventName = inEvent.getName();
		aCallBackName = inEvent.getCallbackName();
	}
	catch(error)
	{
		console.log(error.stack);
		return;
	}
	
	if(!this._myEventListeners[anEventName])
	{
		return;
	}
	
	//accumulate in case event results in a listener being removed which would invalid the list iteration
	aListeners = [];
	this._myEventListeners[anEventName].forAll(
		function CollectListeners(inListener)
		{
			aListeners.push(inListener);
		}
	);
	
	for(i = 0; i < aListeners.length; ++i)
	{
		try
		{
			aListeners[i][aCallBackName](inEvent);
		}
		catch(error)
		{
			console.log(error.stack);
		}
	}
};
