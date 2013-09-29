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

ECGame.EngineLib.World2D = ECGame.EngineLib.Class.create(
{
	Constructor : function World2D()
	{
		this.GameObject();
	},
	
	Parents : [ECGame.EngineLib.GameObject],
	
	flags : { netDynamic : true },
	
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
			this._mouseLoc = ECGame.EngineLib.Point2.create();
			
			this._mapsize = inMapSizeInTiles * inTileSize;
			this._sceneGraph = new ECGame.EngineLib.Game2DSceneGraph();
			this._sceneGraph.init(this._mapsize, inTileSize);
			
			this._physics = ECGame.EngineLib.Physics2D.create();
			this._physics.init(this._mapsize, inMinPhysicsPartitionSize);
			ECGame.instance.getUpdater("PhysicsUpdater").addUpdate(this._physics);//TODO move this to physics system itself?
			
			//setup default tileset consisting of nothing but the placeholder
			var tileset = ECGame.EngineLib.TileSet2D.create();
			tileset.init(
				[
					{
						fileName : 'engine/images/placeholder.png'//TODO have this listed in systemvars
						,anchor : ECGame.EngineLib.Point2.create()
						,_myLayer : 0
					}
					//,{}
				]
			);
			
			this._map = ECGame.EngineLib.TileMap2D.create();
			this._map.init(this, tileset, inMapSizeInTiles, inTileSize);
			
			this._entityMap = {};
			
			this._defaultCamera = ECGame.EngineLib.Camera2.create();
			this._camera = null;
			
			//for listening to cursor position.
			//TODO Only needed to debug draw cursor which should likely be elsewhere?
			if(!ECGame.Settings.Network.isServer)
			{
				ECGame.instance.getInput().registerListener('Input', this);
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

		//if(!ECGame.Settings.Network.isServer)//TODO axe if?
		render : function render(inGraphics)
		{
			var target
				,camera
				;
			
			camera = this.getCurrentCamera();
			inGraphics.setCamera2D(camera);
			
			//debug draw the map		
			if(ECGame.Settings.isDebugDraw_Map())
			{
				this._map.debugDraw(inGraphics);
			}
			
			//render scene graph (note: it will ommit map tiles if map is debug drawn)
			this._sceneGraph.render(inGraphics);
			
			//debug draw scenegraph
			if(ECGame.Settings.isDebugDraw_SceneGraph())
			{
				this._sceneGraph.debugDraw(inGraphics);
			}
			
			//debug draw physics
			if(ECGame.Settings.isDebugDraw_Physics())
			{
				this._physics.debugDraw(inGraphics);
			}
			
			//debug draw camera target point
			if(ECGame.Settings.isDebugDraw_CameraTarget())
			{
				target = ECGame.EngineLib.AABB2.create(
					0,
					0,
					ECGame.Settings.Debug.CameraTarget_Size,
					ECGame.Settings.Debug.CameraTarget_Size
				);
				
				target.setLeftTop(
					//center target rect on camera target by subtracting half its width/height
					camera.getTargetPosition().subtract(
						target.getWidthHeight().scale(0.5)
					)
				);
							
				//setup the color
				inGraphics.setFillStyle(ECGame.Settings.Debug.CameraTarget_DrawColor);
				//draw the target
				inGraphics.fillRect(target);
			}
			
			//debugdraw cursor //TODO move the code into inputsystem.debugdraw/render and call it from here!
			if(ECGame.Settings.isDebugDraw_MouseCursor())//TODO need to draw a real cursor, and NOT here!!
			{
				target = ECGame.EngineLib.AABB2.create(
					0,
					0,
					ECGame.Settings.Debug.Input_MouseCursor_Size,
					ECGame.Settings.Debug.Input_MouseCursor_Size
				);
				
				//center on mouse position by subtracting half the cursor size
				target.setLeftTop(
					this._mouseLoc.subtract(
						target.getWidthHeight().scale(0.5)
					)
					.add(//add the camera offset because the fill rect below will subtract it off again
						this.getCurrentCamera().getRect().getLeftTop()
					)
				);
				
				//setup the color
				inGraphics.setFillStyle(ECGame.Settings.Debug.Input_MouseCursor_DrawColor);
				//debug draw it
				inGraphics.fillRect(target);
			}
			
			if(ECGame.Settings.isDebugDraw_Sound())
			{
				ECGame.instance.getSoundSystem().debugDraw(inGraphics, this);
			}
		},

		getBoundingBox : function getBoundingBox()
		{
			return ECGame.EngineLib.AABB2.create(0, 0, this._mapsize, this._mapsize);
		},

		cleanup : function cleanup(){return;},//TODO
		
		//set<classname>NetDirty
		clearNetDirty : function clearNetDirty(){return;},
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
				ECGame.log.assert(entityObject, "Missing entity during serialization!");
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
				ECGame.log.assert(entityObject, "Missing entity during serialization!");
				entityPath = entityRef.getPath();
				
				if(!newEntityMap[entityPath])
				{
					this.removeEntity(entityObject);
				}
			}
		},
		
		copyFrom : function copyFrom(/*inOther*/){return;},//TODO
		
		//TODO should cursor drawing be here? probably not, maybe move to GameFrameWork (instance)
		//if(!ECGame.Settings.Network.isServer)//TODO axe if?
		onInput : function onInput(inInputEvent)
		{
			this._mouseLoc = inInputEvent.mouseLoc;
		}
	}
});