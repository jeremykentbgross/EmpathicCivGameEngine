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

ECGame.EngineLib.TileMap2D = ECGame.EngineLib.Class.create(
{
	Constructor : function TileMap2D()
	{
		this.GameObject();
		
		this._myWorld = null;
		this._myTileSet = null;
		
		this._myMapSizeInTiles = null;	//should be rounded up to power of 2
		this._myTileSize = null;
		this._myAABB = null;
		
		this._myTileInstanceTree = null;
	},
	Parents : [ECGame.EngineLib.GameObject],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		//TODO TileDescription struct/class
		init : function init(inWorld, inTileSet, inMapSizeInTiles, inTileSize)
		{
			var aMapSize;
			
			this._myWorld = inWorld;
			this._myTileSet = inTileSet;
			
			this._myMapSizeInTiles = inMapSizeInTiles;	//TODO round up to power of 2?
			this._myTileSize = inTileSize;
			
			aMapSize = this._myMapSizeInTiles * this._myTileSize;
			this._myAABB = new ECGame.EngineLib.AABB2(0, 0, aMapSize, aMapSize);
			
			this._myTileInstanceTree = ECGame.EngineLib.QuadTree.create();
			this._myTileInstanceTree.init(this._myAABB, this._myTileSize);
		},

		setTileSet : function setTileSet(inTileSet)
		{
			//TODO clean current tilesets physics and scenegraph info
			
			this._myTileSet = inTileSet;
			
			//TODO walk new tiles tiles and reinsert to physics and scenegraph
		},
		
		
		setTile : function setTile(inTilePosition, inTileValue)
		{
			var aTileInstance
				,aTileInstanceAABB
				,aTileWorldPosition
				,aTilePhysicsRect
				,aTileAlreadySet = false
				;
			
			
			if(inTilePosition.myX < 0 || this._myMapSizeInTiles <= inTilePosition.myX
				|| inTilePosition.myY < 0 || this._myMapSizeInTiles <= inTilePosition.myY
				//TODO inTileValue is in not in range of valid tiles
				)
			{
				//if the location or tile is invalid return
				return;
			}
			
			//bounding box containing this tile instance
			aTileInstanceAABB = new ECGame.EngineLib.AABB2(
				inTilePosition.myX * this._myTileSize,
				inTilePosition.myY * this._myTileSize,
				this._myTileSize,
				this._myTileSize
			);
			

			//TODO this is an easier check using the TypeArray...
			//see if the tile is the same as what is there, don't delete it and return
			this._myTileInstanceTree.walk(
				function walkCallback(item)
				{
					if(item.tileValue === inTileValue)
					{
						aTileAlreadySet = true;
					}
				},
				aTileInstanceAABB
			);
			if(aTileAlreadySet)
			{
				return;
			}
			
			//insert exclusively! So delete the old tile first
			this._clearTileInRect(aTileInstanceAABB);
			
			//the world position of the tile instance:
			aTileWorldPosition = aTileInstanceAABB.getLeftTop();
			
			//TODO may also have other physics properties later (ie not solid but slippery or something)
			//the physics rect of the tile (if any)
			aTilePhysicsRect = this._myTileSet.getPhysicsRect(inTileValue, aTileWorldPosition);
			
			//create a map time
			aTileInstance = new ECGame.EngineLib.QuadTreeItem(aTileInstanceAABB);
			aTileInstance.tileValue = inTileValue;
			if(aTilePhysicsRect)
			{
				//note if need be, could use a tree to merge physics objects to nearest squares for optimization
				aTileInstance.physicsObject = this._myWorld.getPhysics().createNewPhysicsObject();
				aTileInstance.physicsObject.setAABB(aTilePhysicsRect);
			}	
			
			//setup for scenegraph
			aTileInstance.sceneGraphRenderable = new ECGame.EngineLib.RenderableTile2D();
			aTileInstance.sceneGraphRenderable.layer = this._myTileSet.getTileLayer(inTileValue);
			aTileInstance.sceneGraphRenderable.anchorPosition = aTileWorldPosition;
			aTileInstance.sceneGraphRenderable._myAABB = this._myTileSet.getTileRect(inTileValue, aTileWorldPosition);
			aTileInstance.sceneGraphRenderable.tileValue = inTileValue;
			aTileInstance.sceneGraphRenderable.ownerMap = this;
			//insert to scenegraph
			this._myWorld.getSceneGraph().insertItem(aTileInstance.sceneGraphRenderable);

			//insert to tilemap
			this._myTileInstanceTree.insertToSmallestContaining(aTileInstance);			
		},

		clearTile : function clearTile(inTilePosition)
		{
			if(inTilePosition.myX < 0 || this._myMapSizeInTiles <= inTilePosition.myX
				|| inTilePosition.myY < 0 || this._myMapSizeInTiles <= inTilePosition.myY)
			{
				return;
			}
			
			this._clearTileInRect(
				new ECGame.EngineLib.AABB2(
					inTilePosition.myX * this._myTileSize,
					inTilePosition.myY * this._myTileSize,
					this._myTileSize,
					this._myTileSize
				)
			);
		},
		
		
		
		
		
		_clearTileInRect : function _clearTileInRect(inRect)
		{
			var aDeletedTilesArray
				,i
				;
			
			aDeletedTilesArray = [];
			
			//delete from the tilemap tree
			this._myTileInstanceTree.deleteContained(inRect, aDeletedTilesArray);
			if(ECGame.Settings.DEBUG)
			{
				if(aDeletedTilesArray.length > 1)
				{
					ECGame.log.error("Deleted too many tiles " + aDeletedTilesArray.length);
				}
			}
			
			for(i in aDeletedTilesArray)
			{
				//remove from scenegraph
				this._myWorld.getSceneGraph().removeItem(aDeletedTilesArray[i].sceneGraphRenderable);
				
				//remove from physics
				if(aDeletedTilesArray[i].physicsObject)
				{
					aDeletedTilesArray[i].physicsObject.release();
				}
			}
		},

		
		
		
		
		
		
		getMapLowerRight : function getMapLowerRight()
		{
			return this._myAABB.getRightBottom();
		},

		
		
		toTileCoordinate : function toTileCoordinate(inWorldCoordinate)
		{
			return new ECGame.EngineLib.Point2(
				Math.floor(inWorldCoordinate.myX / this._myTileSize),
				Math.floor(inWorldCoordinate.myY / this._myTileSize)
			);
		},
		
		
		
		isWrappable : function isWrappable()
		{
			return false;//TODO this is a HACK; make this a value that can be set on init
			//set up scenegraph and physics for wrapping
		},
		
		//set<classname>NetDirty
		clearNetDirty : function clearNetDirty(){},
		cleanup : function cleanup(){},//TODO
		serialize : function serialize(){},//TODO
		copyFrom : function copyFrom(inOther){},//TODO
		
		
		debugDraw : function debugDraw(inCanvas2DContext, inCameraRect)
		{
			var aThis = this;
			ECGame.instance.getGraphics().drawDebugText("Debug Drawing Tile Map");
			
			this._myTileInstanceTree.walk(
				function walkCallback(item)
				{
					var itemRect = item.getAABB();
					aThis._myTileSet.renderTileInRect(
						inCanvas2DContext,
						item.tileValue,
						ECGame.EngineLib.AABB2.create(
							itemRect.myX - inCameraRect.myX,
							itemRect.myY - inCameraRect.myY,
							aThis._myTileSize,
							aThis._myTileSize
						)
					);
				},
				inCameraRect
			);
			
			this._myTileInstanceTree.debugDraw(inCanvas2DContext, inCameraRect);//TODO map colors?
		}

	}
});