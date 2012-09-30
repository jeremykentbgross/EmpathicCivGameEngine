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
GameEngineLib.createGame2DMap = function(instance, private)
{
	var temp = new GameEngineLib.Game2DMap();
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



GameEngineLib.Game2DMap = GameEngineLib.Class({
	Constructor : function Game2DMap(){},//TODO make this the same as init?
	
	Parents : [GameEngineLib.GameObject],
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		init : function init(inMapSizeInTiles, inTileSize, inTileSet)
		{
			this._myMapSizeInTiles = inMapSizeInTiles;	//todo round up to power of 2
			this._myTileSize = inTileSize;
			this._myMapSize = this._myMapSizeInTiles * this._myTileSize;
			
			this._myTileMapTree = GameEngineLib.createGameQuadTree();
			this._myTileMapTree.init(
				GameEngineLib.createGame2DAABB(0, 0, this._myMapSize, this._myMapSize),
				this._myTileSize
			);
			
			this._myTileSet = inTileSet;
		},

		setTileSet : function setTileSet(inTileSet)
		{
			//TODO clean current tilesets physics and scenegraph info
			
			this._myTileSet = inTileSet;
			
			//TODO walk new tiles tiles and reinsert to physics and scenegraph
		},
		
		addedToWorld : function addedToWorld(inWorld)
		{
			this._myWorld = inWorld;
			//TODO add physics stuff and renderables
		},
		//TODO removed from world? and add remove physics stuff from world?

		getMapLowerRight : function getMapLowerRight()
		{
			return GameEngineLib.createGame2DPoint(this._myMapSize, this._myMapSize);
		},

		setTile : function setTile(inX, inY, inTileValue)
		{
			var _this_ = this;//TODO find/replace '_this_' and 'that' to 'thisClassName'?
			if(inX < 0 || this._myMapSizeInTiles <= inX
				|| inY < 0 || this._myMapSizeInTiles <= inY
				//TODO inTileValue is in range too
				)
				return;
			
			var position = GameEngineLib.createGame2DPoint(
				inX * this._myTileSize,
				inY * this._myTileSize
			);
			
			var tile = {};
			
			//setup for the tilemap tree
			//TODO rename tree rects as such
			tile.myGame2DAABB = GameEngineLib.createGame2DAABB(
				position.myX,
				position.myY,
				this._myTileSize,
				this._myTileSize
			);
			tile.myTileValue = inTileValue;
			
			//if the tile is the same as what is there, don't delete it and return
			var duplicate = false;
			this._myTileMapTree.walk(
				function(item)
				{
					if(item.myTileValue === inTileValue)
						duplicate = true;
				},
				tile.myGame2DAABB
			);
			if(duplicate)
			{
				return;
			}
			
			//insert exclusively! So delete the old one first
			this._eraseTile(tile);
			
			//setup for scenegraph
			tile.sceneGraphRenderable =
			{
				myLayer : 0 +  _this_._myTileSet.getTileLayer(inTileValue),
				myAnchorPosition : position,//TODO rename anchorPosition?
				myGame2DAABB : _this_._myTileSet.getTileRect(inTileValue, position),
				render : function(inCanvas2DContext, inCameraRect)
				{
					if(GameSystemVars.DEBUG && GameSystemVars.Debug.Map_Draw)
						return;
					_this_._myTileSet.renderTile(
						inCanvas2DContext,
						tile.myTileValue,
						GameEngineLib.createGame2DPoint(//TODO maybe subtraction?
							this.myAnchorPosition.myX - inCameraRect.myX,
							this.myAnchorPosition.myY - inCameraRect.myY
						)
					);
				}
			};
			
			//setup physics objects
			var physicsRect = this._myTileSet.getPhysicsRect(inTileValue, position);
			if(physicsRect)
			{
				//note if need be, could use a tree to merge physics objects to nearest squares for optimization
				tile.physicsObj = this._myWorld.getPhysics().createNewPhysicsObject();
				tile.physicsObj.setGame2DAABB(physicsRect);
			}		
			
			//insert to tilemap
			this._myTileMapTree.insertToSmallestContaining(tile);
			
			//insert to scenegraph
			this._myWorld.getSceneGraph().insertItem(tile.sceneGraphRenderable);
		},

		_eraseTile : function _eraseTile(tile)
		{
			var deletedTiles = [];
			
			//delete from the tilemap tree
			this._myTileMapTree.deleteContained(tile.myGame2DAABB, deletedTiles);
			if(GameSystemVars.DEBUG)
			{
				if(deletedTiles.length > 1)
					GameEngineLib.logger.error("Deleted too many tiles " + deletedTiles.length);
			}
			
			for(var i in deletedTiles)
			{
				//remove from scenegraph
				this._myWorld.getSceneGraph().removeItem(deletedTiles[i].sceneGraphRenderable);
				
				//remove from physics
				if(deletedTiles[i].physicsObj)
				{
					deletedTiles[i].physicsObj.release();
					//console.log("Deleting physics object");
				}
			}
		},

		clearTile : function clearTile(inX, inY)
		{
			if(inX < 0 || this._myMapSizeInTiles <= inX
				|| inY < 0 || this._myMapSizeInTiles <= inY)
				return;
				
			var tile = {};
			tile.myGame2DAABB = GameEngineLib.createGame2DAABB(
				inX * this._myTileSize,
				inY * this._myTileSize,
				this._myTileSize,
				this._myTileSize
			);
			
			this._eraseTile(tile);
		},

		toTileCoordinate : function toTileCoordinate(inWorldCoordinate)
		{
			return Math.floor(inWorldCoordinate / this._myTileSize);
		},

		debugDraw : function debugDraw(inCanvas2DContext, inCameraRect)
		{
			var _this_ = this;
			GameInstance.Graphics.drawDebugText("Debug Drawing Tile Map");
			
			this._myTileMapTree.walk(
				function(item)
				{
					var itemRect = item.myGame2DAABB;
					_this_._myTileSet.renderTileInRect(
						inCanvas2DContext,
						item.myTileValue,
						GameEngineLib.createGame2DAABB
						(
							itemRect.myX - inCameraRect.myX,
							itemRect.myY - inCameraRect.myY,
							_this_._myTileSize,
							_this_._myTileSize
						)
					)
				},
				inCameraRect
			);
			
			this._myTileMapTree.debugDraw(inCanvas2DContext, inCameraRect);//TODO map colors?
		},

		destroy : function destroy(){},//TODO
		serialize : function serialize(){},//TODO
		
		isWrappable : function isWrappable()
		{
			return false;//TODO this is a HACK; make this a value that can be set on init
			//set up scenegraph and physics for wrapping
		}
	}
});