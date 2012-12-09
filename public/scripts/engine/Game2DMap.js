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

GameEngineLib.Game2DMap = GameEngineLib.Class(
{
	Constructor : function Game2DMap()
	{
		this.GameObject();
	},
	Parents : [GameEngineLib.GameObject],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		//TODO should get owner world
		//TODO TileDescription struct/class
		init : function init(inMapSizeInTiles, inTileSize, inTileSet)
		{
			this._mapSizeInTiles = inMapSizeInTiles;	//TODO round up to power of 2?
			this._tileSize = inTileSize;
			this._mapSize = this._mapSizeInTiles * this._tileSize;
			
			this._mapAABB = new GameEngineLib.Game2DAABB(0, 0, this._mapSize, this._mapSize);
			
			this._tileMapTree = new GameEngineLib.GameQuadTree();
			this._tileMapTree.init(this._mapAABB, this._tileSize);
			
			this._myTileSet = inTileSet;
		},

		
		
		//////////TODO maybe depreicated
		setTileSet : function setTileSet(inTileSet)
		{
			//TODO clean current tilesets physics and scenegraph info
			this._myTileSet = inTileSet;
			//TODO walk new tiles tiles and reinsert to physics and scenegraph
		},
		//TODO this should be an event? Actually map should not exist without a world mostly i bet!
		addedToWorld : function addedToWorld(inWorld)
		{
			this._myWorld = inWorld;
			//TODO add physics stuff and renderables
		},
		//TODO removed from world? and add remove physics stuff from world?
		//////////TODO maybe depreicated
		
		

		
		setTile : function setTile(inTilePosition, inTileValue)
		{
			var tile, tileAABB, duplicate = false, physicsRect, position;
			
			if(inTilePosition.myX < 0 || this._mapSizeInTiles <= inTilePosition.myX
				|| inTilePosition.myY < 0 || this._mapSizeInTiles <= inTilePosition.myY
				//TODO inTileValue is in range too
				)
			{
				return;
			}
			
			tileAABB = new GameEngineLib.Game2DAABB(
				inTilePosition.myX * this._tileSize,
				inTilePosition.myY * this._tileSize,
				this._tileSize,
				this._tileSize
			);
			position = tileAABB.getLeftTop();

			//if the tile is the same as what is there, don't delete it and return
			this._tileMapTree.walk(
				function(item)
				{
					if(item.tileValue === inTileValue)
					{
						duplicate = true;
					}
				},
				tileAABB
			);
			if(duplicate)
			{
				return;
			}
			
			//insert exclusively! So delete the old one first
			this.clearTilesInRect(tileAABB);
			
			//the tiles physics rect (if any) //TODO may also have other physics properties later (ie not solid but slippery or something)
			physicsRect = this._myTileSet.getPhysicsRect(inTileValue, position);
			
			//create a map time
			tile = new GameEngineLib.GameQuadTreeItem(tileAABB);
			tile.tileValue = inTileValue;
			if(physicsRect)
			{
				//note if need be, could use a tree to merge physics objects to nearest squares for optimization
				tile.physicsObject = this._myWorld.getPhysics().createNewPhysicsObject();
				tile.physicsObject.setGame2DAABB(physicsRect);
			}	
			
			//setup for scenegraph
			tile.sceneGraphRenderable = new GameEngineLib.RenderableTile2D();
			tile.sceneGraphRenderable.layer = this._myTileSet.getTileLayer(inTileValue);
			tile.sceneGraphRenderable.anchorPosition = position;
			tile.sceneGraphRenderable._AABB = this._myTileSet.getTileRect(inTileValue, position);
			tile.sceneGraphRenderable.tileValue = inTileValue;
			tile.sceneGraphRenderable.ownerMap = this;
			//insert to scenegraph
			this._myWorld.getSceneGraph().insertItem(tile.sceneGraphRenderable);

			//insert to tilemap
			this._tileMapTree.insertToSmallestContaining(tile);			
		},

		
		
		clearTilesInRect : function clearTilesInRect(inRect)
		{
			var deletedTiles = [], i;
			
			//delete from the tilemap tree
			this._tileMapTree.deleteContained(inRect, deletedTiles);
			if(GameSystemVars.DEBUG)
			{
				if(deletedTiles.length > 1)
				{
					GameEngineLib.logger.error("Deleted too many tiles " + deletedTiles.length);
				}
			}
			
			for(i in deletedTiles)
			{
				//remove from scenegraph
				this._myWorld.getSceneGraph().removeItem(deletedTiles[i].sceneGraphRenderable);
				
				//remove from physics
				if(deletedTiles[i].physicsObject)
				{
					deletedTiles[i].physicsObject.release();
				}
			}
		},

		
		
		clearTile : function clearTile(inTilePosition)
		{
			if(inTilePosition.myX < 0 || this._mapSizeInTiles <= inTilePosition.myX
				|| inTilePosition.myY < 0 || this._mapSizeInTiles <= inTilePosition.myY)
			{
				return;
			}
			
			this.clearTilesInRect(
				new GameEngineLib.Game2DAABB(
					inTilePosition.myX * this._tileSize,
					inTilePosition.myY * this._tileSize,
					this._tileSize,
					this._tileSize
				)
			);
		},
		
		
		
		getMapLowerRight : function getMapLowerRight()
		{
			return this._mapAABB.getRightBottom();
		},

		
		
		toTileCoordinate : function toTileCoordinate(inWorldCoordinate)
		{
			return new GameEngineLib.Game2DPoint(
				Math.floor(inWorldCoordinate.myX / this._tileSize),
				Math.floor(inWorldCoordinate.myY / this._tileSize)
			);
		},
		
		
		
		isWrappable : function isWrappable()
		{
			return false;//TODO this is a HACK; make this a value that can be set on init
			//set up scenegraph and physics for wrapping
		},
		
		
		destroy : function destroy(){},//TODO
		serialize : function serialize(){},//TODO

		
		
		debugDraw : function debugDraw(inCanvas2DContext, inCameraRect)
		{
			var _this_ = this;
			GameInstance.Graphics.drawDebugText("Debug Drawing Tile Map");
			
			this._tileMapTree.walk(
				function(item)
				{
					var itemRect = item.getAABB();
					_this_._myTileSet.renderTileInRect(
						inCanvas2DContext,
						item.tileValue,
						GameEngineLib.createGame2DAABB(
							itemRect.myX - inCameraRect.myX,
							itemRect.myY - inCameraRect.myY,
							_this_._tileSize,
							_this_._tileSize
						)
					);
				},
				inCameraRect
			);
			
			this._tileMapTree.debugDraw(inCanvas2DContext, inCameraRect);//TODO map colors?
		}

	}
});