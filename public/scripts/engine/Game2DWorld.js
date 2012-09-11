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


//TODO depricated
GameEngineLib.createGame2DWorld = function(instance, private)
{
	var temp = new GameEngineLib.Game2DWorld();
	instance = instance || {};
	
	for(property in temp)
	{
		instance[property] = temp[property]
	}
	for(property in temp.prototype)
	{
		instance[property] = temp.prototype[property];
	}
	
	return instance;
}


GameEngineLib.Game2DWorld = function Game2DWorld(){}//TODO init here?
GameEngineLib.Game2DWorld.prototype.constructor = GameEngineLib.Game2DWorld;



GameEngineLib.Game2DWorld.prototype.getPhysics = function getPhysics()
{
	return this._physics;
}



GameEngineLib.Game2DWorld.prototype.getMap = function getMap()
{
	return this._map;
}



GameEngineLib.Game2DWorld.prototype.getSceneGraph = function getSceneGraph()
{
	return this._sceneGraph;
}



GameEngineLib.Game2DWorld.prototype.init = function init(inMapSizeInTiles, inTileSize, inMinPhysicsPartitionSize)
{
	this._mapsize = inMapSizeInTiles * inTileSize;
	this._sceneGraph = GameEngineLib.createGame2DSceneGraph();
	this._sceneGraph.init(this._mapsize, inTileSize);
	
	this._physics = GameEngineLib.createGame2DPhysics();
	this._physics.init(this._mapsize, inMinPhysicsPartitionSize);
	GameInstance.UpdateOrder.push(this._physics);//TODO make it join a physics updater, not this
	
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
	this._map = GameInstance.GameObjectClasses.findByName("Game2DMap").create();
	this._map.deref().init(inMapSizeInTiles, inTileSize, tileset);
	this._map.deref().addedToWorld(this);
	
	this._entityMap = {};
	
	this._defaultCamera = GameEngineLib.createGame2DCamera();
	this._camera = null;
	
	//for listening to cursor position.
	//TODO Only needed to debug draw cursor which should likely be elsewhere?
	if(!GameSystemVars.Network.isServer)
		GameInstance.Input.registerListener("Input", this);
}



GameEngineLib.Game2DWorld.prototype.addEntity = function addEntity(inEntity)
{
	//TODO beware bug created by adding an entity by a name which could change, add this to namechange listener
	this._entityMap[inEntity.getPath()] = inEntity;
	inEntity.deref().addedToWorld(this);
}

//TODO remove entity



GameEngineLib.Game2DWorld.prototype.setCamera = function setCamera(in2DCamera)
{
	this._camera = in2DCamera;
}

//TODO get camera?



GameEngineLib.Game2DWorld.prototype.getCurrentCamera = function getCurrentCamera()//TODO maybe should be public?
{
	return (this._camera ? this._camera.deref() : this._defaultCamera);
}



if(!GameSystemVars.Network.isServer)//TODO axe if?
GameEngineLib.Game2DWorld.prototype.render = function render(inCanvas2DContext)
{
	var camera = this.getCurrentCamera();
	
	//debug draw the map		
	if(GameSystemVars.DEBUG && GameSystemVars.Debug.Map_Draw)
	{
		this._map.deref().debugDraw(inCanvas2DContext, camera.getRect());
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
			this._mouseLoc.subtract(
				target.getWidthHeight().multiply(0.5)
			)
		);
		
		//setup the color
		inCanvas2DContext.fillStyle = GameSystemVars.Debug.GameWorld_MouseCursor_DrawColor;
		//debug draw it
		inCanvas2DContext.fillRect(target.myX, target.myY, target.myWidth, target.myHeight);
	}
}



GameEngineLib.Game2DWorld.prototype.getBoundingBox = function getBoundingBox()
{
	return GameEngineLib.createGame2DAABB(0, 0, this._mapsize, this._mapsize);
}



GameEngineLib.Game2DWorld.prototype.destroy = function destroy(){}//TODO



GameEngineLib.Game2DWorld.prototype.serialize = function serialize(){}//TODO


//TODO should cursor drawing be here? probably not, maybe move to GameFrameWork (instance)
if(!GameSystemVars.Network.isServer)//TODO axe if?
GameEngineLib.Game2DWorld.prototype.onInput = function onInput(inInputEvent)
{
	this._mouseLoc = inInputEvent.mouseLoc;
}