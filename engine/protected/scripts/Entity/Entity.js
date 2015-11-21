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

ECGame.EngineLib.Entity = ECGame.EngineLib.Class.create({
	Constructor : function Entity()
	{
		var aThis
			;
		
		this.GameObject();
		
		aThis = this;
		this._myWorld = null;
		
		this._myComponentCollection = ECGame.EngineLib.GameObjectCollection.create(
			32, 32, 32
			,function addedComponent(inComponent)
			{
				aThis._addedComponent(inComponent);
			}
			,function removedComponent(inComponent)
			{
				aThis._removedComponent(inComponent);
			}
		);

		this.registerListener('AddedToNetGroup', this);
		this.registerListener('RemovedFromNetGroup', this);
	},
	
	Parents : [ECGame.EngineLib.GameObject],
	
	flags : {},
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		addComponent : function addComponent(inComponent)
		{
			if(this._myComponentCollection.add(inComponent, this.canUserModifyNet()))
			{
				//TODO (if components dynamically updated) event: AddedNetChildObject
				this.setNetDirty();
			}
		},
		_addedComponent : function _addedComponent(inComponent)
		{
			inComponent.onAddedToEntity(//TODO call event, not function
				new ECGame.EngineLib.Events.AddedToEntity(this)
			);
			if(this._myWorld)
			{
				inComponent.onEntityAddedToWorld(//TODO call event, not function
					new ECGame.EngineLib.Events.EntityAddedToWorld(this._myWorld, this)
				);
			}
		},
		
		removeComponent : function removeComponent(inComponent)
		{
			if(this._myComponentCollection.remove(inComponent, this.canUserModifyNet()))
			{
				//TODO (if components dynamically updated) event: RemovedNetChildObject
				this.setNetDirty();
			}
		},
		_removedComponent : function _removedComponent(inComponent)
		{
			if(this._myWorld)
			{
				inComponent.onEntityRemovedFromWorld(//TODO call event, not function
					new ECGame.EngineLib.Events.EntityRemovedFromWorld(
						this._myWorld
						,this
					)
				);
			}
			inComponent.onRemovedFromEntity(//TODO call event, not function
				new ECGame.EngineLib.Events.RemovedFromEntity(this)
			);
		},
		
		getComponentByType : function getComponentByType(inType, inoutReturnValues)
		{
			inoutReturnValues = inoutReturnValues || [];
			
			this._myComponentCollection.forAll(
				function callback(inComponent)
				{
					if(inComponent.isA(inType))
					{
						inoutReturnValues.push(inComponent);
					}
					return true;
				}
			);
			
			return inoutReturnValues;
		},
		
		onAddedToNetGroup : function onAddedToNetGroup(inEvent)
		{
			//console.info(this.getName());
			this._myComponentCollection.forAll(
				function callback(inComponent)
				{
					inEvent.myNetGroup.addObject(inComponent);
					return true;
				}
			);
		},
		onRemovedFromNetGroup : function onRemovedFromNetGroup(inEvent)
		{
			//console.info(this.getName());
			this._myComponentCollection.forAll(
				function callback(inComponent)
				{
					inEvent.myNetGroup.removeObject(inComponent);
					return true;
				}
			);
		},
		
		//TODO make onAddedTo/onEntityRemovedFromWorld events so entity can set the world along with its components???
		addedToWorld : function addedToWorld(inWorld)//TODO rename onEntityAddedToWorld
		{
			if(this._myWorld)
			{
				this.removedFromWorld(this._myWorld);//TODO should actually call the world object remove!!
			}
			this._myWorld = inWorld;
			this.onEvent(new ECGame.EngineLib.Events.EntityAddedToWorld(this._myWorld, this));
		},
		removedFromWorld : function removedFromWorld(inWorld)//TODO rename onEntityRemovedFromWorld
		{
			if(inWorld === this._myWorld)
			{
				this.onEvent(new ECGame.EngineLib.Events.EntityRemovedFromWorld(this._myWorld, this));
				this._myWorld = null;
			}
		},

		addToWorld : function addToWorld(inWorld)//TODO is this redundant? should/does world tell entity to remove from existing?
		{
			this.removeFromWorld();
			inWorld.addEntity(this);
		},
		removeFromWorld : function removeFromWorld()//TODO liike addToWorld: is this redundant? (don't think so here..)
		{
			if(this._myWorld)
			{
				this._myWorld.removeEntity(this);
			}
		},
		
		getWorld : function getWorld()
		{
			return this._myWorld;
		},
		
		cleanup : function cleanup()
		{
			var aThis
				;
			
			aThis = this;
			
			if(this._myWorld)
			{
				this._myWorld.removeEntity(this);
			}
			
			this._myComponentCollection.forAll(
				function callback(inComponent)
				{
					inComponent.onRemovedFromEntity(
						new ECGame.EngineLib.Events.RemovedFromEntity(aThis)
					);
					inComponent.destroy();
					return true;
				}
			);
			this._myComponentCollection.cleanup();
		},
		
		clearNetDirty : function clearNetDirty()
		{
			this._myComponentCollection.clearNetDirty();
		},
		
		SerializeFormat : 
		[
			{
				name : '_myComponentCollection'
				,type : 'GameObjectCollection'
				,net : true
			}
		],
		
		serialize : function serialize(inSerializer)
		{
			inSerializer.serializeObject(this, ECGame.EngineLib.Entity.SerializeFormat);
		},
		
		postSerialize : function postSerialize()
		{
			this._myComponentCollection.postSerialize();
		},
		
		copyFrom : function copyFrom(inOther)
		{
			var aThis
				;
				
			aThis = this;
			
			//TODO properly remove all existing components
			
			inOther._myComponentCollection.forAll(
				function callback(inComponent)
				{
					aThis.addComponent(inComponent.clone());
					return true;
				}
			);
		}
	}
});
