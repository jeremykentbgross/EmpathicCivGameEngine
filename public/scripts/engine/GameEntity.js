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
		this.GameEventSystem();//
		
		this._components = GameEngineLib.createGameCircularDoublyLinkedListNode();
	},
	
	Parents : [
		GameEngineLib.GameObject,
		GameEngineLib.GameEventSystem//
	],
	
	flags : {},
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		addComponent : function addComponent(inComponent)
		{
			this._components.myPrev.insert(new GameEngineLib.GameCircularDoublyLinkedListNode(inComponent));
			
			inComponent.onAddedToEntity(new GameEngineLib.GameEvent_AddedToEntity(this));
			
			if(this._world)
			{
				inComponent.onAddedToWorld(new GameEngineLib.GameEvent_AddedToWorld(this._world));
			}
		},
		removeComponent : function removeComponent(inComponent)
		{
			var containingNode = this._components.findNodeContaining(inComponent);
			
			if(containingNode)
			{
				containingNode.remove();
				if(this._world)
				{
					inComponent.onRemovedFromWorld(new GameEngineLib.GameEvent_RemovedFromWorld(this._world));
				}
				inComponent.onRemovedFromEntity(new GameEngineLib.GameEvent_RemovedFromEntity(this));
			}
		},
		
		//TODO maybe make added/removed+Entity/World NOT events (to save 'new' events that may not be needed)?
		//TODO make onAddedTo/onRemovedFromWorld events so entity can set the world along with its components???
		addedToWorld : function addedToWorld(inWorld)//TODO rename onAddedToWorld
		{
			if(this._world)
			{
				this.removedFromWorld();
			}
			this._world = inWorld;
			this.onEvent(new GameEngineLib.GameEvent_AddedToWorld(this._world));
		},
		removedFromWorld : function removedFromWorld()//TODO rename onRemovedFromWorld
		{
			this.onEvent(new GameEngineLib.GameEvent_RemovedFromWorld(this._world));
			this._world = null;
		},
		
		getWorld : function getWorld()
		{
			return this._world;
		},
		
		destroy : function destroy()
		{
			if(this._world)
			{
				inComponent.onRemovedFromWorld(new GameEngineLib.GameEvent_RemovedFromWorld(this._world));
			}
			
			inComponent.onRemovedFromEntity(new GameEngineLib.GameEvent_RemovedFromEntity(this));
			
			this._components.forAll(
				function(inComponent)
				{
					inComponent.destroy();
				}
			);
			
			this._components = null;//Does this leak? Could do if loose circular references are not released
		},
		
		serialize : function serialize(inSerializer)
		{
			var componentMap = {};
			//TODO
		},
	}
});