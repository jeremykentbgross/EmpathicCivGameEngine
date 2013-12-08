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

ECGame.EngineLib.GameEntity = ECGame.EngineLib.Class.create({
	Constructor : function GameEntity()
	{
		this.GameObject();
		
		this._myWorld = null;
		
		/*
		TODO NOTE: the components added/removed are the same as the entities in the world
		It may be a good idea to somehow make a DeltaArrayObjectRef type or something...
		*/
		//components:
		this._myComponents = [];
		this._myAddedComponents = [];
		this._myRemovedComponents = [];
		//network versions
		this._myComponentsRefs = [];
		this._myAddedComponentsRefs = [];
		this._myRemovedComponentsRefs = [];
	},
	
	Parents : [ECGame.EngineLib.GameObject],
	
	flags : {},
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		addComponent : function addComponent(inComponent)
		{
			var anIndex;
			
			//if its already added, just return
			if(this._myComponents.indexOf(inComponent) !== -1)
			{
				return;
			}
			
			//add it
			this._myComponents.push(inComponent);
			inComponent.onAddedToEntity(new ECGame.EngineLib.Events.AddedToEntity(this));
			if(this._myWorld)
			{
				inComponent.onAddedToWorld(new ECGame.EngineLib.Events.AddedToWorld(this._myWorld));
			}
			
			if(this.canUserModifyNet())
			{
				//add it to the list of newly added for the network
				this._myAddedComponents.push(inComponent);
				
				//if it was previously removed, remove it from the removal list
				anIndex = this._myRemovedComponents.indexOf(inComponent);
				if(anIndex !== -1)
				{
					this._myRemovedComponents[anIndex] = this._myRemovedComponents[this._myRemovedComponents.length - 1];
					this._myRemovedComponents.pop();
				}
				
				this.setNetDirty();
			}
		},
		removeComponent : function removeComponent(inComponent)
		{
			var anIndex;
			
			//find the entity
			anIndex = this._myComponents.indexOf(inComponent);
			
			//if its not there, just return
			if(anIndex === -1)
			{
				return;
			}
			
			//remove it
			this._myComponents[anIndex] = this._myComponents[this._myComponents.length - 1];
			this._myComponents.pop();
			if(this._myWorld)
			{
				inComponent.onRemovedFromWorld(new ECGame.EngineLib.Events.RemovedFromWorld(this._myWorld));
			}
			inComponent.onRemovedFromEntity(new ECGame.EngineLib.Events.RemovedFromEntity(this));
			
			if(this.canUserModifyNet())
			{
				//add it to the list of newly removed entities for the network
				this._myRemovedComponents.push(inComponent);
				
				//if it was previously added, remove it from the add list
				anIndex = this._myAddedComponents.indexOf(inComponent);
				if(anIndex !== -1)
				{
					this._myAddedComponents[anIndex] = this._myAddedComponents[this._myAddedComponents.length - 1];
					this._myAddedComponents.pop();
				}
				
				this.setNetDirty();
			}
		},
		getComponentByType : function getComponentByType(inType, inoutReturnValues)
		{
			var aComponent
				,i
				;
			
			inoutReturnValues = inoutReturnValues || [];
			
			for(i = 0; i < this._myComponents.length; ++i)
			{
				aComponent = this._myComponents[i];
				if(aComponent.isA(inType))
				{
					inoutReturnValues.push(aComponent);
				}
			}
			
			return inoutReturnValues;
		},
		
		addToNetGroup : function addToNetGroup(inNetGroup)
		{
			var aComponent
				,i
				;
			
			inNetGroup.addObject(this);
			for(i = 0; i < this._myComponents.length; ++i)
			{
				aComponent = this._myComponents[i];
				//if(!aComponent.isServerOnly())//TODO check in netgroup, not here!!
				//{
					inNetGroup.addObject(aComponent);
				//}
			}
		},
		removeFromNetGroup : function removeFromNetGroup(inNetGroup)
		{
			var aComponent
				,i
				;
			
			inNetGroup.removeObject(this);
			for(i = 0; i < this._myComponents.length; ++i)
			{
				aComponent = this._myComponents[i];
				//if(!aComponent.isServerOnly())//TODO check in netgroup, not here!!
				//{
					inNetGroup.removeObject(aComponent);
				//}
			}
		},
		
		//TODO maybe make added/removed+Entity/World NOT events (to save 'new' events that may not be needed)?
		//TODO make onAddedTo/onRemovedFromWorld events so entity can set the world along with its components???
		addedToWorld : function addedToWorld(inWorld)//TODO rename onAddedToWorld
		{
			if(this._myWorld)
			{
				this.removedFromWorld(this._myWorld);//TODO should actually call the world object remove!!
			}
			this._myWorld = inWorld;
			this.onEvent(new ECGame.EngineLib.Events.AddedToWorld(this._myWorld));
		},
		removedFromWorld : function removedFromWorld(inWorld)//TODO rename onRemovedFromWorld
		{
			if(inWorld === this._myWorld)
			{
				this.onEvent(new ECGame.EngineLib.Events.RemovedFromWorld(this._myWorld));
				this._myWorld = null;
			}
		},
		
		getWorld : function getWorld()
		{
			return this._myWorld;
		},
		
		cleanup : function cleanup()
		{
			var aComponent
				,i
				;
				
			if(this._myWorld)
			{
				this._myWorld.removeEntity(this);
			}
			
			for(i = 0; i < this._myComponents.length; ++i)
			{
				aComponent = this._myComponents[i];
				aComponent.onRemovedFromEntity(new ECGame.EngineLib.Events.RemovedFromEntity(this));
				aComponent.destroy();
			}
			this._myComponents = null;
		},
		
		clearNetDirty : function clearNetDirty()
		{
			this._myAddedComponents = [];
			this._myRemovedComponents = [];
			
			this._myComponentsRefs = [];
			this._myAddedComponentsRefs = [];
			this._myRemovedComponentsRefs = [];
		},
		
		_mySerializeFormat : 
		[
			{
				name : '_myComponentsRefs',
				type : 'objRef',
				net : false,
				maxArrayLength : 32	//TODO
			},
			{
				name : '_myAddedComponentsRefs',
				type : 'objRef',
				net : true,
				netOnly : true,
				maxArrayLength : 32	//TODO
			},
			{
				name : '_myRemovedComponentsRefs',
				type : 'objRef',
				net : true,
				netOnly : true,
				maxArrayLength : 32	//TODO
			}
		],
		
		serialize : function serialize(inSerializer)
		{
			var aComponent
				,i
				;
			
			if(inSerializer.isNetMode())
			{
				this._myAddedComponentsRefs = [];
				this._myRemovedComponentsRefs = [];
				for(i = 0; i < this._myAddedComponents.length; ++i)
				{
					aComponent = this._myAddedComponents[i];
					//if(!aComponent.isServerOnly())
					//{
						this._myAddedComponentsRefs.push(aComponent.getRef());
					//}
				}
				for(i = 0; i < this._myRemovedComponents.length; ++i)
				{
					aComponent = this._myRemovedComponents[i];
					//if(!aComponent.isServerOnly())
					//{
						this._myRemovedComponentsRefs.push(aComponent.getRef());
					//}
				}
			}
			else
			{
				this._myComponentsRefs = [];
				for(i = 0; i < this._myComponents.length; ++i)
				{
					aComponent = this._myComponents[i];
					//if(!aComponent.isServerOnly())
					//{
						this._myComponentsRefs.push(aComponent.getRef());
					//}
				}
			}
			
			inSerializer.serializeObject(this, ECGame.EngineLib.GameEntity._mySerializeFormat);
		},
		
		postSerialize : function postSerialize()
		{
			var aComponent
				,i
				;
				
			for(i = 0; i < this._myComponentsRefs.length; ++i)
			{
				aComponent = this._myComponentsRefs[i].deref();
				ECGame.log.assert(aComponent, "Missing component during serialization!");
				this.addComponent(aComponent);
			}
			for(i = 0; i < this._myAddedComponentsRefs.length; ++i)
			{
				aComponent = this._myAddedComponentsRefs[i].deref();
				ECGame.log.assert(aComponent, "Missing component during serialization!");
				this.addComponent(aComponent);
				
			}
			for(i = 0; i < this._myRemovedComponentsRefs.length; ++i)
			{
				aComponent = this._myRemovedComponentsRefs[i].deref();
				//ECGame.log.assert(aComponent, "Missing component during serialization!");
				if(aComponent)
				{
					this.removeComponent(aComponent);
				}
			}
		},
		
		copyFrom : function copyFrom(inOther)
		{
			var aComponent
				,i
				;
			
			//TODO properly remove all existing components
			
			for(i = 0; i < inOther._myComponents.length; ++i)
			{
				aComponent = inOther._myComponents[i];
				this.addComponent(aComponent.clone());
			}
		}
	}
});