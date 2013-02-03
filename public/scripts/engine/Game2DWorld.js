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

GameEngineLib.Game2DWorld = GameEngineLib.Class.create(
{
	Constructor : function Game2DWorld()
	{
		this.GameObject();
	},
	
	Parents : [GameEngineLib.GameObject],
	
	flags : {net:true},
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		getPhysics : function getPhysics()
		{
			return this._physics;
		},

		getMap : function getMap()
		{
			return this._map;
		},

		getSceneGraph : function getSceneGraph()
		{
			return this._sceneGraph;
		},

		init : function init(inMapSizeInTiles, inTileSize, inMinPhysicsPartitionSize)
		{
			//TODO if??
			this._mouseLoc = GameEngineLib.createGame2DPoint();
			
			this._mapsize = inMapSizeInTiles * inTileSize;
			this._sceneGraph = new GameEngineLib.Game2DSceneGraph();
			this._sceneGraph.init(this._mapsize, inTileSize);
			
			this._physics = GameEngineLib.createGame2DPhysics();
			this._physics.init(this._mapsize, inMinPhysicsPartitionSize);
			GameInstance.UpdateOrder.push(this._physics);//TODO make it join a physics updater, not this
			
			//setup default tileset consisting of nothing but the placeholder
			var tileset = GameEngineLib.Game2DTileSet.create();
			tileset.init(
				[
					{
						fileName : 'images/placeholder.png'//TODO have this listed in systemvars
						,anchor : GameEngineLib.createGame2DPoint()
						,layer : 0
					}
					//,{}
				]
			);
			
			this._map = GameEngineLib.Game2DMap.create();
			this._map.init(inMapSizeInTiles, inTileSize, tileset);
			this._map.addedToWorld(this);
			
			this._entityMap = {};
			
			this._defaultCamera = GameEngineLib.createGame2DCamera();
			this._camera = null;
			
			//for listening to cursor position.
			//TODO Only needed to debug draw cursor which should likely be elsewhere?
			if(!GameSystemVars.Network.isServer)
			{
				GameInstance.Input.registerListener('Input', this);
			}
		},

		addEntity : function addEntity(inEntity)
		{
			//TODO beware bug created by adding an entity by a name which could change, add this to namechange listener
			this._entityMap[inEntity.getTxtPath()] = inEntity;
			inEntity.addedToWorld(this);
			this.setNetDirty();
		},
		removeEntity : function removeEntity(inEntity)
		{
			delete this._entityMap[inEntity.getTxtPath()];
			inEntity.removedFromWorld(this);
			this.setNetDirty();
		},

		setCamera : function setCamera(in2DCamera)
		{
			this._camera = in2DCamera;
		},
		//TODO get camera?

		getCurrentCamera : function getCurrentCamera()//TODO maybe should be public?
		{
			return this._camera || this._defaultCamera;
		},

		//if(!GameSystemVars.Network.isServer)//TODO axe if?
		render : function render(inCanvas2DContext)
		{
			var camera = this.getCurrentCamera();
			var target;
			
			//debug draw the map		
			if(GameSystemVars.DEBUG && GameSystemVars.Debug.Map_Draw)
			{
				this._map.debugDraw(inCanvas2DContext, camera.getRect());
			}
			
			//render scene graph (note it will ommit map if map is debug drawn)
			//TODO maybe should do that ^^^ here with an iff instead of inside for clarity / consistency? (why didnt I before? seperate sprites etc?)
			this._sceneGraph.render(inCanvas2DContext, camera.getRect());		
			
			//debug draw scenegraph
			if(GameSystemVars.DEBUG && GameSystemVars.Debug.SceneGraph_Draw)
			{
				this._sceneGraph.debugDraw(inCanvas2DContext, camera.getRect());
			}
			
			//debug draw physics
			if(GameSystemVars.DEBUG && GameSystemVars.Debug.Physics_Draw)
			{
				this._physics.debugDraw(inCanvas2DContext, camera.getRect());
			}
			
			//debug draw camera target point
			if(GameSystemVars.DEBUG && GameSystemVars.Debug.GameWorld_CameraTarget_Draw)
			{
				target = GameEngineLib.createGame2DAABB(
					0,
					0,
					GameSystemVars.Debug.GameWorld_CameraTarget_Size,
					GameSystemVars.Debug.GameWorld_CameraTarget_Size
				);
				
				target.setLeftTop(
					//center target rect on camera target by subtracting half its width/height
					camera.getTargetPosition().subtract(
						target.getWidthHeight().multiply(0.5)
					).
					//now account for the cameras actual world location
					subtract(
						camera.getRect().getLeftTop()
					)
				);
							
				//setup the color
				inCanvas2DContext.fillStyle = GameSystemVars.Debug.GameWorld_CameraTarget_DrawColor;
				//draw the target
				inCanvas2DContext.fillRect(target.myX, target.myY, target.myWidth, target.myHeight);
			}
			
			//debugdraw cursor
			if(GameSystemVars.DEBUG && GameSystemVars.Debug.GameWorld_MouseCursor_Draw)
			{
				target = GameEngineLib.createGame2DAABB(
					0,
					0,
					GameSystemVars.Debug.GameWorld_MouseCursor_Size,
					GameSystemVars.Debug.GameWorld_MouseCursor_Size
				);
				
				//center on mouse position by subtracting half the cursor size
				target.setLeftTop(
					this._mouseLoc.subtract(
						target.getWidthHeight().multiply(0.5)
					)
				);
				
				//setup the color
				inCanvas2DContext.fillStyle = GameSystemVars.Debug.GameWorld_MouseCursor_DrawColor;
				//debug draw it
				inCanvas2DContext.fillRect(target.myX, target.myY, target.myWidth, target.myHeight);
			}
			
			if(GameSystemVars.Debug.Sound_Area_Draw)
			{
				GameInstance.soundSystem.debugDraw(inCanvas2DContext, camera.getRect(), this);
			}
		},

		getBoundingBox : function getBoundingBox()
		{
			return GameEngineLib.createGame2DAABB(0, 0, this._mapsize, this._mapsize);
		},

		destroy : function destroy(){},//TODO
		
		serialize : function serialize(inSerializer)//TODO serialize maps somehow GameEntity has identical post/serialize for components!
		{
			var entity, ref;
			
			//HACKS
			this.entityArray = [];
			this.entityArrayBefore = [];
				
			var format =	//TODO format should be static!
			[
				{
					name : 'entityArray',
					type : 'objRef',
					net : true,
					maxArrayLength : 32	//TODO global setting: maxPlayersPerWorld
				}
			];
			
			for(entity in this._entityMap)
			{
				ref = this._entityMap[entity].getRef();
				this.entityArray.push(ref);
				this.entityArrayBefore.push(ref);
			}
			
			inSerializer.serializeObject(this, format);
		},
		
		/*
		TODO postSerialize chain from GameObject!
		*/
		postSerialize : function postSerialize()
		{
			var i,
				entityRef,
				newEntityMap,
				entityPath,
				entityObject;
				
			newEntityMap = {};
			
			//if now && !before => add
			for(i = 0; i < this.entityArray.length; ++i)
			{
				entityRef = this.entityArray[i];
				
				entityObject = entityRef.deref();
				entityPath = entityRef.getPath();
				
				newEntityMap[entityPath] = entityObject;
				
				if(!this._entityMap[entityPath])
				{
					this.addEntity(entityObject);
				}
			}
			
			//if before && !now => remove
			for(i = 0; i < this.entityArrayBefore.length; ++i)
			{
				entityRef = this.entityArrayBefore[i];
				
				entityObject = entityRef.deref();
				entityPath = entityRef.getPath();
				
				if(!newEntityMap[entityPath])
				{
					this.removeEntity(entityObject);
				}
			}
		},
		
		copyFrom : function copyFrom(inOther){},//TODO
		
		//TODO should cursor drawing be here? probably not, maybe move to GameFrameWork (instance)
		//if(!GameSystemVars.Network.isServer)//TODO axe if?
		onInput : function onInput(inInputEvent)
		{
			this._mouseLoc = inInputEvent.mouseLoc;
		}
	}
});