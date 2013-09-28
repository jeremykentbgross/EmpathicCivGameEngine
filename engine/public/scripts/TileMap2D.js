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

/*
TODOs

TODOs thru this file

tiles.length + 1 === empty
animated tiles
multi image tiles
map wrapping
event: mapchange

see notebook for refactor on tile and tileset related stuff
	note: shared stuff between tiles still probably wanted (ex animation from)
	-Tile2DRenderable render/debugdraw (moved from map + tileset)
	-Tile2DInstance cleanup (moved from map)
	-TileDescription class?
	-Tileset functionality redistribution
	
Renderable init chain down (first params go first)?

net
	world views
	server privately creates
	serialize flag: full (ie not net)

Graphics related:
	rendering float error
	split screen / multi buffers?
	
other todos
	obfuscator: functions are not member vars
	_... should only be accessed: this._...
	class function callParentMethod()
	{
		call/apply(this, this.getClass().parent.prototype[functionName], arguments );
	}
	events: ownerAddedToNetGroup, ownerChangedNetOwner //for components
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
		
		this._myTileIndexArray = null;
		this._myChangedTiles = [];
		
		//TODO optimization: if debug, use array instead!
		this._myTileInstanceTree = null;
	},
	Parents : [ECGame.EngineLib.GameObject],
	flags : { netDynamic : true },
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		_serializeFormat :
		[
			{
				name : '_myMapSizeInTiles',
				type : 'int',
				net : false,
				min : 0,
				max : 1024,	//TODO should have a constant somewhere to check against!!
			}
			//TODO world, tileset, etc
		],

		init : function init(inWorld, inTileSet, inMapSizeInTiles, inTileSize)
		{
			var aMapSize;
			
			this._myWorld = inWorld;
			this._myTileSet = inTileSet;
			
			this._myMapSizeInTiles = inMapSizeInTiles;	//TODO round up to power of 2?
			this._myTileSize = inTileSize;
			
			aMapSize = this._myMapSizeInTiles * this._myTileSize;
			this._myAABB = new ECGame.EngineLib.AABB2(0, 0, aMapSize, aMapSize);
			
			ECGame.log.assert(inTileSet.getNumberOfTiles() < 256, "Currently unsupported number of tiles");
			if(inTileSet.getNumberOfTiles() < 256)
			{
				this._myTileIndexArray = new Uint8Array(inMapSizeInTiles * inMapSizeInTiles);
			}
			else
			{
				//this._myTileIndexArray = new Uint16Array(inMapSizeInTiles * inMapSizeInTiles);
			}
			
			this._myTileInstanceTree = ECGame.EngineLib.QuadTree.create();
			this._myTileInstanceTree.init(this._myAABB, this._myTileSize);
		},

		setTileSet : function setTileSet(inTileSet)
		{
			ECGame.log.assert(inTileSet.getNumberOfTiles() < 256, "Currently unsupported number of tiles");
			
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
				,aTileRenderable
				,aPhysicsObject
				,anIndex
				;
			
			if(inTilePosition.myX < 0 || this._myMapSizeInTiles <= inTilePosition.myX
				|| inTilePosition.myY < 0 || this._myMapSizeInTiles <= inTilePosition.myY
				|| inTileValue < 0 || this._myTileSet.getNumberOfTiles() <= inTileValue
				)
			{
				//if the location or tile is invalid return
				return;
			}
			
			//bounding box containing this tile instance in the map
			aTileInstanceAABB = new ECGame.EngineLib.AABB2(
				inTilePosition.myX * this._myTileSize,
				inTilePosition.myY * this._myTileSize,
				this._myTileSize,
				this._myTileSize
			);
			
			anIndex = inTilePosition.myY * this._myMapSizeInTiles + inTilePosition.myX;
			//see if the tile is the same as what is there, if so, don't delete the current instance, just return
			if(this._myTileIndexArray[anIndex] === inTileValue)
			{
				return;
			}
			//set the value in the index array
			this._myTileIndexArray[anIndex] = inTileValue;
						
			//insert exclusively! So delete the old tile first
			this._clearTileInRect(aTileInstanceAABB);
			
			//the world position of the tile instance:
			aTileWorldPosition = aTileInstanceAABB.getLeftTop();
			
			//get the physics object of the tile (if any)
			aTilePhysicsRect = this._myTileSet.getPhysicsRect(inTileValue, aTileWorldPosition);
			if(aTilePhysicsRect)
			{
				//note if need be, could use a tree to merge physics objects to nearest squares for optimization
				aPhysicsObject = this._myWorld.getPhysics().createNewPhysicsObject();
				aPhysicsObject.setAABB(aTilePhysicsRect);
				//TODO may also have other physics properties later (ie not solid but slippery or something)
			}
			else
			{
				aPhysicsObject = null;
			}
			
			//setup renderable for scenegraph
			aTileRenderable = ECGame.EngineLib.Tile2DRenderable.create(
				this._myTileSet.getTileRenderRect(inTileValue, aTileWorldPosition)
				,this._myTileSet.getTileLayer(inTileValue)
				,aTileWorldPosition
				,inTileValue
				,this
			);
			
			//create tile instance
			aTileInstance = ECGame.EngineLib.Tile2DInstance.create(
				aTileInstanceAABB
				,inTileValue
				,aTileRenderable
				,aPhysicsObject
			);
			
			//insert to scenegraph
			this._myWorld.getSceneGraph().insertItem(aTileInstance._mySceneGraphRenderable);

			//insert to tilemap
			this._myTileInstanceTree.insertToSmallestContaining(aTileInstance);

			//if we can modify the map for the net, then remember this change.
			if(this.canUserModifyNet())
			{
				this._myChangedTiles.push(
					{
						X : inTilePosition.myX,
						Y : inTilePosition.myY,
						Value : inTileValue
					}
				);
				this.setNetDirty();
			}
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
		
		//used to remove a specific tile
		_clearTileInRect : function _clearTileInRect(inRect)//TODO could take a param to skip error if we really want to delete many
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
				this._myWorld.getSceneGraph().removeItem(aDeletedTilesArray[i]._mySceneGraphRenderable);
				
				//remove from physics
				if(aDeletedTilesArray[i]._myPhysicsObject)
				{
					aDeletedTilesArray[i]._myPhysicsObject.release();
				}
			}
		},
		
		
		getMapLowerRight : function getMapLowerRight()
		{
			return this._myAABB.getRightBottom();
		},

		
		
		toTileCoordinate : function toTileCoordinate(inWorldCoordinate)//TODO rename worldPositionToTileCoord..
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
		clearNetDirty : function clearNetDirty()
		{
			this._myChangedTiles = [];
		},
		
		cleanup : function cleanup(){},//TODO
		
		serialize : function serialize(inSerializer)
		{
			var anIndex
				,aTileValue
				,aNumChangedTiles
				,i, j
				;
			
			if(inSerializer.isNetMode())//TODO AND this._myChangedTiles.length < 1/3 the size of the map???
			{
				aNumChangedTiles = inSerializer.serializeInt(
					this._myChangedTiles.length,
					1,
					100	//TODO should not have a magic number here
				);
				
				if(inSerializer.isReading())
				{
					for(anIndex = 0; anIndex < aNumChangedTiles; ++anIndex)
					{
						i = inSerializer.serializeInt(
							i,
							0,
							this._myMapSizeInTiles
						);
						j = inSerializer.serializeInt(
							j,
							0,
							this._myMapSizeInTiles
						);
						aTileValue = inSerializer.serializeInt(
							aTileValue,
							0,
							this._myTileSet.getNumberOfTiles()
						);
						this.setTile(
							ECGame.EngineLib.Point2.create(i, j),
							aTileValue
						);
					}
				}
				else
				{
					for(anIndex = 0; anIndex < aNumChangedTiles; ++anIndex)
					{
						inSerializer.serializeInt(
							this._myChangedTiles[anIndex].X,
							0,
							this._myMapSizeInTiles
						);
						inSerializer.serializeInt(
							this._myChangedTiles[anIndex].Y,
							0,
							this._myMapSizeInTiles
						);
						inSerializer.serializeInt(
							this._myChangedTiles[anIndex].Value,
							0,
							this._myTileSet.getNumberOfTiles()
						);
					}
				}
			}
			else
			{
				inSerializer.serializeObject(this, this.TileMap2D._serializeFormat);
				//TODO if(reading){this.cleanup(); this.init(...);}
				
				for(j = 0; j < this._myMapSizeInTiles; ++j)
				{
					for(i = 0; i < this._myMapSizeInTiles; ++i)
					{
						anIndex = j * this._myMapSizeInTiles + i;
						aTileValue = inSerializer.serializeInt(
							this._myTileIndexArray[anIndex],
							0,
							this._myTileSet.getNumberOfTiles()//TODO serialize this in a temp var or something
						);
						if(inSerializer.isReading())
						{
							this.setTile(
								ECGame.EngineLib.Point2.create(i, j),
								aTileValue
							);
						}
					}
				}
			}
		},
		
		copyFrom : function copyFrom(inOther){},//TODO
		
		debugDraw : function debugDraw(inCanvas2DContext, inCameraRect)
		{
			var aThis = this;
			ECGame.instance.getGraphics().drawDebugText("Debug Drawing Tile Map");
			
			this._myTileInstanceTree.walk(
				function walkCallback(item)
				{
					var itemRect = item.getAABB();
					aThis._myTileSet.renderTileInRect(//TODO should be debug draw for tile
						inCanvas2DContext,
						item._myTileValue,
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