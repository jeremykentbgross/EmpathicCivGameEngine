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

GameEngineLib.createGame2DWorld = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	//TODO debug info
	
	//TODO default camera to be camera entity?
	
	instance.getPhysics = function()
	{
		return private.physics;
	}
	instance.getMap = function()
	{
		return private.map;
	}
	instance.getSceneGraph = function()
	{
		return private.sceneGraph;
	}
	
	instance.init = function(inMapSizeInTiles, inTileSize, inMinPhysicsPartitionSize)
	{
		private.mapsize = inMapSizeInTiles * inTileSize;
		private.sceneGraph = GameEngineLib.createGame2DSceneGraph();
		private.sceneGraph.init(private.mapsize, inTileSize);
		
		private.physics = GameEngineLib.createGame2DPhysics();
		private.physics.init(private.mapsize, inMinPhysicsPartitionSize);
		GameInstance.UpdateOrder.push(private.physics);//TODO make it join a physics updater, not this
		
		//setup default tileset consisting of nothing but the placeholder
		var tileset = GameEngineLib.createGame2DTileSet();
		tileset.init(
			[
				{
					fileName : "images/placeholder.png"//TODO have this listed in systemvars
					,anchor : GameEngineLib.createGame2DPoint()
					,layer : 0
				},
			]
		);
		
		//TODO make a shorter call than this?
		private.map = GameInstance.GameObjectClasses.findByName("Game2DMap").create();
		private.map.deref().init(inMapSizeInTiles, inTileSize, tileset);
		private.map.deref().addedToWorld(this);
		
		private.entityMap = {};
		
		private.defaultCamera = GameEngineLib.createGame2DCamera();
		private.camera = null;
		
		//for listening to cursor position.
		//TODO Only needed to debug draw cursor which should likely be elsewhere?
		if(!GameSystemVars.Network.isServer)
			GameInstance.Input.registerListener("Input", private);
	}
	
	instance.addEntity = function(inEntity)
	{
		//TODO beware bug created by adding an entity by a name which could change, add this to namechange listener
		private.entityMap[inEntity.getPath()] = inEntity;
		inEntity.deref().addedToWorld(this);
	}
	//TODO remove entity
	
	instance.setCamera = function(in2DCamera)
	{
		private.camera = in2DCamera;
	}
	//TODO get camera?
	
	instance.getCurrentCamera = function()//TODO maybe should be public?
	{
		return (private.camera ? private.camera.deref() : private.defaultCamera);
	}
	
	if(!GameSystemVars.Network.isServer)
	instance.render = function(inCanvas2DContext)
	{
		var camera = this.getCurrentCamera();
		
		//debug draw the map		
		if(GameSystemVars.DEBUG && GameSystemVars.Debug.Map_Draw)
		{
			private.map.deref().debugDraw(inCanvas2DContext, camera.getRect());
		}
		
		//render scene graph (note it will ommit map if map is debug drawn)
		private.sceneGraph.render(inCanvas2DContext, camera.getRect());		
		
		//debug draw scenegraph
		if(GameSystemVars.DEBUG && GameSystemVars.Debug.SceneGraph_Draw)
		{
			private.sceneGraph.debugDraw(inCanvas2DContext, camera.getRect());
		}
		
		//debug draw physics
		if(GameSystemVars.DEBUG && GameSystemVars.Debug.Physics_Draw)
		{
			private.physics.debugDraw(inCanvas2DContext, camera.getRect());
		}
		
		//debug draw camera target point
		if(GameSystemVars.DEBUG && GameSystemVars.Debug.GameWorld_CameraTarget_Draw)
		{
			var target = GameEngineLib.createGame2DAABB(
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
			var target = GameEngineLib.createGame2DAABB(
				0,
				0,
				GameSystemVars.Debug.GameWorld_MouseCursor_Size,
				GameSystemVars.Debug.GameWorld_MouseCursor_Size
			);
			
			//center on mouse position by subtracting half the cursor size
			target.setLeftTop(
				private.mouseLoc.subtract(
					target.getWidthHeight().multiply(0.5)
				)
			);
			
			//setup the color
			inCanvas2DContext.fillStyle = GameSystemVars.Debug.GameWorld_MouseCursor_DrawColor;
			//debug draw it
			inCanvas2DContext.fillRect(target.myX, target.myY, target.myWidth, target.myHeight);
		}
	}
	
	instance.getBoundingBox = function()
	{
		return GameEngineLib.createGame2DAABB(0, 0, private.mapsize, private.mapsize);
	}
	
	instance.destroy = function(){}//TODO
	instance.serialize = function(){}//TODO
	
	
	//TODO should cursor drawing be here? probably not, maybe move to GameFrameWork (instance)
	if(!GameSystemVars.Network.isServer)
	private.onInput = function(inInputEvent)
	{
		private.mouseLoc = inInputEvent.mouseLoc;
	}
	
	
	return instance;
}