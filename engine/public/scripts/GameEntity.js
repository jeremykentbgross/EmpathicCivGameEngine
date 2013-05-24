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
		this._myComponentMap = {};//TODO listen to name changes from GameObject!!
	},
	
	Parents : [ECGame.EngineLib.GameObject],
	
	flags : {},
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		addComponent : function addComponent(inComponent)
		{
			this._myComponentMap[inComponent.getTxtPath()] = inComponent;
			inComponent.onAddedToEntity(new ECGame.EngineLib.Events.AddedToEntity(this));
			
			if(this._myWorld)
			{
				inComponent.onAddedToWorld(new ECGame.EngineLib.Events.AddedToWorld(this._myWorld));
			}
		},
		removeComponent : function removeComponent(inComponent)
		{
			var component,
				path;
			
			path = inComponent.getTxtPath();
			
			component = this._myComponentMap[path];
			delete this._myComponentMap[path];
			
			if(component)
			{
				ECGame.log.assert(component === inComponent, "WTF!!!");
				if(this._myWorld)
				{
					inComponent.onRemovedFromWorld(new ECGame.EngineLib.Events.RemovedFromWorld(this._myWorld));
				}
				inComponent.onRemovedFromEntity(new ECGame.EngineLib.Events.RemovedFromEntity(this));
			}
		},
		getComponentByType : function getComponentByType(inType, inoutReturnValues)
		{
			var componentName,
				component;
			
			inoutReturnValues = inoutReturnValues || [];
			
			for(componentName in this._myComponentMap)
			{
				component = this._myComponentMap[componentName];
				if(component && component.isA(inType))//TODO change forall to not pass nulls and get rid of gaurds all over the place
				{
					inoutReturnValues.push(component);
				}
			}
			
			return inoutReturnValues;
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
			var componentName,
				component;
				
			if(this._myWorld)
			{
				this.removedFromWorld();//TODO actually remove it from the world!!
			}

			for(componentName in this._myComponentMap)
			{
				component = this._myComponentMap[componentName];
				//TODO remove from world also; instead make array of them and then removeComponent for each and then destroy them
				component.onRemovedFromEntity(new ECGame.EngineLib.Events.RemovedFromEntity(this));
				component.destroy();
			}
			this._myComponentMap = null;
		},
		
		//TODO setGameEntityNetDirty / setEntityNetDirty
		//TODO note that this whole class doesn't serialize correctly, and cannot currently serialize dynamic changes on the net
		clearNetDirty : function clearNetDirty()
		{
		},
		
		/*
		TODO serialize and postserialize are exactly the same in Game2DWorld and GameEntity, abstract!
			TODO should be done as map I think (like the array)??
		*/
		serialize : function serialize(inSerializer)
		{
			var component, ref;
			
			//HACKS
			this.componentArray = [];
			this.componentArrayBefore = [];
				
			var format =	//TODO format should be static!
			[
				{
					name : 'componentArray',
					type : 'objRef',
					net : true,
					maxArrayLength : 32
				}
			];
			
			for(component in this._myComponentMap)
			{
				ref = this._myComponentMap[component].getRef();
				this.componentArray.push(ref);
				this.componentArrayBefore.push(ref);
			}
			
			inSerializer.serializeObject(this, format);
		},
		
		postSerialize : function postSerialize()
		{
			var i,
				componentRef,
				newComponentMap,
				componentPath,
				componentObject;
				
			newComponentMap = {};
			
			//if now && !before => add
			for(i = 0; i < this.componentArray.length; ++i)
			{
				componentRef = this.componentArray[i];
				
				componentObject = componentRef.deref();
				componentPath = componentRef.getPath();
				
				newComponentMap[componentPath] = componentObject;
				
				if(!this._myComponentMap[componentPath])
				{
					this.addComponent(componentObject);
				}
			}
			
			//if before && !now => remove
			for(i = 0; i < this.componentArrayBefore.length; ++i)
			{
				componentRef = this.componentArrayBefore[i];
				
				componentObject = componentRef.deref();
				componentPath = componentRef.getPath();
				
				if(!newComponentMap[componentPath])
				{
					this.removeComponent(componentObject);
				}
			}
		},
		
		copyFrom : function copyFrom(inOther)
		{
			var componentName,
				component;
			
			//TODO properly remove all existing components
			
			for(componentName in inOther._myComponentMap)
			{
				component = inOther._myComponentMap[componentName];
				this.addComponent(component.clone());
			}
		}
	}
});