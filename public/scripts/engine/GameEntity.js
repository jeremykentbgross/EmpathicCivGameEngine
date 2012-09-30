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

GameEngineLib.GameEntity = GameEngineLib.Class({
	Constructor : function GameEntity()
	{
		this.GameObject();
		//TODO should this be 'map' (this object) instead?  Very likely it seems
		//this._myComponents = {}	<=!
		this._myComponents = GameEngineLib.createGameCircularDoublyLinkedListNode();
		
		//TODO change Entity to inherit this instead!
		this._myComponentEventSystem = GameEngineLib.GameEventSystem.create();//HACK!!
	},
	
	Parents : [GameEngineLib.GameObject],
	
	flags : {},
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		addComponent : function addComponent(inComponent)
		{
			var node = GameEngineLib.createGameCircularDoublyLinkedListNode();
			node.item = inComponent;
			this._myComponents.myPrev.insert(node);
			inComponent.deref().onAddedToEntity(this);//TODO make onAddedToEntity a proper event for the Components?
			//TODO if world onAddedToWorld
		},
		removeComponent : function removeComponent(inComponent)
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
		},
		
		//TODO make onAddedTo/onRemovedFromWorld events so entity can set the world along with its components???
		addedToWorld : function addedToWorld(inWorld)//TODO rename onAddedToWorld
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
		},
		removedFromWorld : function removedFromWorld()//TODO rename onRemovedFromWorld
		{
			this._myWorld = null;
			this.onEvent(
				{
					getName : function(){return "RemovedFromWorld";},
					world : inWorld
				}
			);
		},
		getWorld : function getWorld()
		{
			return this._myWorld;
		},
		
		///////////////////////////////////////////////////
		//TODO remove these via inheritance!///////////////
		onEvent : function onEvent(inEvent)
		{
			this._myComponentEventSystem.onEvent(inEvent);
		},
		registerListener : function registerListener(inEventName, inListener)
		{
			this._myComponentEventSystem.registerListener(inEventName, inListener);
		},
		deregisterListener : function deregisterListener(inEventName, inListener)
		{
			this._myComponentEventSystem.deregisterListener(inEventName, inListener);
		},
		//TODO remove these via inheritance!///////////////
		///////////////////////////////////////////////////
		
		destroy : function destroy()
		{		
			/*if(GameSystemVars.DEBUG)//TODO debug entitys
			{
				GameEngineLib.logger.info("Destroying Entity " + GameEngineLib.GameObjectRef(this).getPath());
			}*/
		},
		
		serialize : function serialize(inSerializer){},
	}
});