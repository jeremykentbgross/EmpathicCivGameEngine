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
		this.GameEventSystem();//
		
		this._world = null;
		this._componentMap = {};//TODO listen to name changes from GameObject!!
	},
	
	Parents : [
		ECGame.EngineLib.GameObject,
		ECGame.EngineLib.GameEventSystem
	],
	
	flags : {},
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		addComponent : function addComponent(inComponent)
		{
			this._componentMap[inComponent.getTxtPath()] = inComponent;
			inComponent.onAddedToEntity(new ECGame.EngineLib.Events.AddedToEntity(this));
			
			if(this._world)
			{
				inComponent.onAddedToWorld(new ECGame.EngineLib.Events.AddedToWorld(this._world));
			}
		},
		removeComponent : function removeComponent(inComponent)
		{
			var component,
				path;
			
			path = inComponent.getTxtPath();
			
			component = this._componentMap[path];
			delete this._componentMap[path];
			
			if(component)
			{
				ECGame.log.assert(component === inComponent, "WTF!!!");
				if(this._world)
				{
					inComponent.onRemovedFromWorld(new ECGame.EngineLib.Events.RemovedFromWorld(this._world));
				}
				inComponent.onRemovedFromEntity(new ECGame.EngineLib.Events.RemovedFromEntity(this));
			}
		},
		getComponentByType : function getComponentByType(inType, inoutReturnValues)
		{
			var componentName,
				component;
			
			inoutReturnValues = inoutReturnValues || [];
			
			for(componentName in this._componentMap)
			{
				component = this._componentMap[componentName];
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
			if(this._world)
			{
				this.removedFromWorld(this._world);//TODO should actually call the world object remove!!
			}
			this._world = inWorld;
			this.onEvent(new ECGame.EngineLib.Events.AddedToWorld(this._world));
		},
		removedFromWorld : function removedFromWorld(inWorld)//TODO rename onRemovedFromWorld
		{
			if(inWorld === this._world)
			{
				this.onEvent(new ECGame.EngineLib.Events.RemovedFromWorld(this._world));
				this._world = null;
			}
		},
		
		getWorld : function getWorld()
		{
			return this._world;
		},
		
		destroy : function destroy()
		{
			var componentName,
				component;
				
			if(this._world)
			{
				this.removedFromWorld();//TODO actually remove it from the world!!
			}

			for(componentName in this._componentMap)
			{
				component = this._componentMap[componentName];
				//TODO remove from world also; instead make array of them and then removeComponent for each and then destroy them
				component.onRemovedFromEntity(new ECGame.EngineLib.Events.RemovedFromEntity(this));
				component.destroy();
			}
			this._componentMap = null;
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
					maxArrayLength : 32	//TODO global setting: maxPlayersPerWorld
				}
			];
			
			for(component in this._componentMap)
			{
				ref = this._componentMap[component].getRef();
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
				
				if(!this._componentMap[componentPath])
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
			
			for(componentName in inOther._componentMap)
			{
				component = inOther._componentMap[componentName];
				this.addComponent(component.clone());
			}
		}
	}
});