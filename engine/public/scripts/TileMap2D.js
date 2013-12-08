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



ECGame.EngineLib.TileIndexSerializationHelper = function TileIndexSerializationHelper(inTilePosition, inTileIndex)
{
	inTilePosition = inTilePosition || ECGame.EngineLib.Point2D.create();
	this.X = inTilePosition.myX;
	this.Y = inTilePosition.myY;
	this.Value = inTileIndex;	//TODO rename
};
ECGame.EngineLib.TileIndexSerializationHelper.create = function create(inTilePosition, inTileIndex)
{
	return new ECGame.EngineLib.TileIndexSerializationHelper(inTilePosition, inTileIndex);
};
ECGame.EngineLib.TileIndexSerializationHelper.prototype.serialize = function serialize(inSerializer, inMin, inMax)
{
	this.X = inSerializer.serializeInt(this.X, inMin.X, inMax.X);
	this.Y = inSerializer.serializeInt(this.Y, inMin.Y, inMax.Y);
	this.Value = inSerializer.serializeInt(this.Value, inMin.Value, inMax.Value);
};


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
		this._myWorldRef = null;//net serialization helper
		this._myTileSet = null;
		this._myTileSetRef = null;//net serialization helper
		
		this._myMapSizeInTiles = null;	//should be rounded up to power of 2
		this._myTileSize = null;
		this._myAABB = null;
		this._myNumberOfTiles = 0;//net serialization helper
		
		this._myTileIndexArray = null;
		this._myChangedTiles = [];
		
		//TODO optimization: if debug, use array instead!
		this._myTileInstanceTree = null;
		
		//minimap
		this._myMiniMapCanvas = null;
		this._myMiniMapCanvas2DContext = null;
		this._myMiniMapNativeTileResolution = 8;//< ?
		
		this._myUsingNetViews = false;
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
				name : '_myWorldRef',
				type : 'objRef',
				net : false
			},
			{
				name : '_myTileSetRef',
				type : 'objRef',
				net : false
			},
			{
				name : '_myMapSizeInTiles',
				type : 'int',
				net : false,
				min : 0,
				max : ECGame.Settings.World2D.MaxMapSizeInTiles//TODO consider sending 2^(*power*) instead! (smaller)
			},
			{
				name : '_myTileSize',
				type : 'int',
				net : false,
				min : ECGame.Settings.World2D.MinTileSize,
				max : ECGame.Settings.World2D.MaxTileSize
			},
			{
				name : '_myNumberOfTiles',
				type : 'int',
				net : false,
				min : 0,
				max : ECGame.Settings.World2D.MaxNumberOfTiles
			},
			
			{
				name : '_myUsingNetViews',
				type : 'bool',
				net : false
			},
			{
				name : '_myChangedTiles',
				type : 'custom',
				customType : ECGame.EngineLib.TileIndexSerializationHelper,
				min : ECGame.EngineLib.TileIndexSerializationHelper.create(
					ECGame.EngineLib.Point2D.create(0, 0),
					0
				),
				max : ECGame.EngineLib.TileIndexSerializationHelper.create(
					ECGame.EngineLib.Point2D.create(
						ECGame.Settings.World2D.MaxTileSize,
						ECGame.Settings.World2D.MaxTileSize
					),
					255	//HACK??
				),
				condition : '_isNotUsingNetViews',
				net : true,
				netOnly : true,
				maxArrayLength : 1000	//HACK??
			}
		],
		
		_isNotUsingNetViews : function _isNotUsingNetViews()
		{
			return !this._myUsingNetViews;
		},

		init : function init(inWorld, inTileSet, inMapSizeInTiles, inTileSize, inUsingNetViews)//TODO get tileSize from tileset!
		{
			var aMapSize
				,i
				;
				
			this._myUsingNetViews = inUsingNetViews || false;
			
			this._myWorld = inWorld;
			this._myWorldRef = inWorld.getRef();
			this._myTileSet = inTileSet;
			this._myTileSetRef = this._myTileSet.getRef();
			
			this._myMapSizeInTiles = inMapSizeInTiles;	//TODO round up to power of 2?
			this._myTileSize = inTileSize;
			
			aMapSize = this._myMapSizeInTiles * this._myTileSize;
			this._myAABB = ECGame.EngineLib.AABB2D.create(0, 0, aMapSize, aMapSize);
			
			this._myNumberOfTiles = inTileSet.getNumberOfTiles();
			ECGame.log.assert(this._myNumberOfTiles < 256, "Currently unsupported number of tiles");//TODO should be 255 since 256 is reserved
			if(this._myNumberOfTiles < 256)
			{
				this._myTileIndexArray = new Uint8Array(inMapSizeInTiles * inMapSizeInTiles);
				//TODO may should reserve zero for no tile instead?
				//fill with max value because we do not allow writing the same tile over itself for performance reasons and 0 will be valid
				for(i = 0; i < this._myTileIndexArray.length; ++i)
				{
					this._myTileIndexArray[i] = this._myNumberOfTiles;
				}
			}
			/*else
			{
				this._myTileIndexArray = new Uint16Array(inMapSizeInTiles * inMapSizeInTiles);
			}*/
			
			this._myTileInstanceTree = ECGame.EngineLib.QuadTree.create();
			this._myTileInstanceTree.init(this._myAABB, this._myTileSize);
			
			if(!ECGame.Settings.Network.isServer)
			{
				//HACK:
				this._myMiniMapNativeTileResolution = ECGame.Settings.Graphics.backBufferWidth / inMapSizeInTiles;

				//setup minimap
				this._myMiniMapCanvas = document.createElement('canvas');	//TODO create another way, with dojo maybe?
				this._myMiniMapCanvas.width = this._myMapSizeInTiles * this._myMiniMapNativeTileResolution;
				this._myMiniMapCanvas.height = this._myMapSizeInTiles * this._myMiniMapNativeTileResolution;
				this._myMiniMapCanvas2DContext = this._myMiniMapCanvas.getContext('2d');
			}
		},
		
		render : function render(inGraphics, inTargetSpaceRect)
		{
			inTargetSpaceRect = inTargetSpaceRect || inGraphics.getBackBufferRect();
			inGraphics.drawImageInRect(this._myMiniMapCanvas, inTargetSpaceRect);
		},

		setTileSet : function setTileSet(inTileSet)
		{
			ECGame.log.assert(inTileSet.getNumberOfTiles() < 256, "Currently unsupported number of tiles");
			
			//TODO clean current tilesets physics and scenegraph info
			
			this._myTileSet = inTileSet;
			this._myTileSetRef = this._myTileSet.getRef();	//TODO serialize tileset change
			this._myNumberOfTiles = inTileSet.getNumberOfTiles();
			
			//TODO walk new tiles tiles and reinsert to physics and scenegraph
		},
		getTileSet : function getTileSet()
		{
			return this._myTileSet;
		},
		
		//getTile : function getTile(inTilePosition) TODO get tile instance
		getTileDescription : function getTileDescription(inTilePosition)
		{
			var anIndex;
			
			anIndex = this.getTileIndex(inTilePosition);
			return this._myTileSet._myTiles[anIndex];/////////////////////HACK!
		},
		
		getTileIndex : function getTileIndex(inTilePosition)
		{
			if(inTilePosition.myX < 0 || this._myMapSizeInTiles <= inTilePosition.myX
				|| inTilePosition.myY < 0 || this._myMapSizeInTiles <= inTilePosition.myY
				)
			{
				//if the location or tile is invalid return
				return undefined;
			}
			
			return this._myTileIndexArray[inTilePosition.myY * this._myMapSizeInTiles + inTilePosition.myX];
		},
		setTileIndex : function setTileIndex(inTilePosition, inTileIndex)
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
				//|| inTileIndex < 0 || this._myNumberOfTiles <= inTileIndex
				)
			{
				//if the location or tile is invalid return
				return;
			}
			if(inTileIndex < 0 || this._myNumberOfTiles <= inTileIndex)
			{
				this.clearTile(inTilePosition);
				return;
			}
			
			//bounding box containing this tile instance in the map
			aTileInstanceAABB = ECGame.EngineLib.AABB2D.create(
				inTilePosition.myX * this._myTileSize,
				inTilePosition.myY * this._myTileSize,
				this._myTileSize,
				this._myTileSize
			);
			
			anIndex = inTilePosition.myY * this._myMapSizeInTiles + inTilePosition.myX;
			//see if the tile is the same as what is there, if so, don't delete the current instance, just return
			if(this._myTileIndexArray[anIndex] === inTileIndex)
			{
				return;
			}
			//set the value in the index array
			this._myTileIndexArray[anIndex] = inTileIndex;
						
			//insert exclusively! So delete the old tile first
			this._clearTileInRect(aTileInstanceAABB);
			
			//the world position of the tile instance:
			aTileWorldPosition = aTileInstanceAABB.getLeftTop();
			
			//get the physics object of the tile (if any)
			aTilePhysicsRect = this._myTileSet.getPhysicsRect(inTileIndex, aTileWorldPosition);
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
				this._myTileSet.getTileRenderRect(inTileIndex, aTileWorldPosition)
				,this._myTileSet.getTileLayer(inTileIndex)
				,aTileWorldPosition
				,inTileIndex
				,this
			);
			
			//create tile instance
			aTileInstance = ECGame.EngineLib.Tile2DInstance.create(
				aTileInstanceAABB
				,inTileIndex
				,aTileRenderable
				,aPhysicsObject
			);
			
			//insert to scenegraph
			this._myWorld.getSceneGraph().insertItem(aTileInstance._mySceneGraphRenderable);

			//insert to tilemap
			this._myTileInstanceTree.insertToSmallestContaining(aTileInstance);
			
			if(!ECGame.Settings.Network.isServer)
			{
				//write to minimap
				this._myMiniMapCanvas2DContext.fillStyle = this._myTileSet.getTileMiniMapColor(inTileIndex);
				this._myMiniMapCanvas2DContext.fillRect(
					inTilePosition.myX * this._myMiniMapNativeTileResolution,
					inTilePosition.myY * this._myMiniMapNativeTileResolution,
					this._myMiniMapNativeTileResolution,
					this._myMiniMapNativeTileResolution
				);//TODO clear rect on clearTile
			}

			//if we can modify the map for the net, then remember this change.
			if(this.canUserModifyNet() && !this._myUsingNetViews)
			{
				this._myChangedTiles.push(
					ECGame.EngineLib.TileIndexSerializationHelper.create(inTilePosition, inTileIndex)
				);
				this.setNetDirty();
			}
		},

		clearTile : function clearTile(inTilePosition)
		{
			var anIndex
				,aClearTileValue
				;
			
			if(inTilePosition.myX < 0 || this._myMapSizeInTiles <= inTilePosition.myX
				|| inTilePosition.myY < 0 || this._myMapSizeInTiles <= inTilePosition.myY)
			{
				return;
			}
			
			aClearTileValue = this._myNumberOfTiles;
			
			this._clearTileInRect(
				ECGame.EngineLib.AABB2D.create(
					inTilePosition.myX * this._myTileSize,
					inTilePosition.myY * this._myTileSize,
					this._myTileSize,
					this._myTileSize
				)
			);
			
			anIndex = inTilePosition.myY * this._myMapSizeInTiles + inTilePosition.myX;
			this._myTileIndexArray[anIndex] = aClearTileValue;
			
			if(!ECGame.Settings.Network.isServer)
			{
				//write to minimap
				this._myMiniMapCanvas2DContext.clearRect(
					inTilePosition.myX * this._myMiniMapNativeTileResolution,
					inTilePosition.myY * this._myMiniMapNativeTileResolution,
					this._myMiniMapNativeTileResolution,
					this._myMiniMapNativeTileResolution
				);
			}
			
			//if we can modify the map for the net, then remember this change.
			if(this.canUserModifyNet() && !this._myUsingNetViews)
			{
				this._myChangedTiles.push(
					ECGame.EngineLib.TileIndexSerializationHelper.create(inTilePosition, aClearTileValue)
				);
				this.setNetDirty();
			}
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
		
		getAABB2D : function getAABB2D()
		{
			return this._myAABB.clone();
		},
		
		getMapLowerRight : function getMapLowerRight()
		{
			return this._myAABB.getRightBottom();
		},
		
		getSizeInTiles : function getSizeInTiles()
		{
			return this._myMapSizeInTiles;
		},

		
		
		toTileCoordinate : function toTileCoordinate(inWorldCoordinate)//TODO rename worldPositionToTileCoord..
		{
			return new ECGame.EngineLib.Point2D(
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
		postSerialize : function postSerialize()
		{
			var aLength
				,anIndex
				,aChangedTile
				;
			
			if(!this._myWorld)//if this is not already initialized
			{
				this.init(
					this._myWorldRef.deref()
					,this._myTileSetRef.deref()
					,this._myMapSizeInTiles
					,this._myTileSize
				);
			}
			
			aLength = this._myChangedTiles.length;
			for(anIndex = 0; anIndex < aLength; ++anIndex)
			{
				aChangedTile = this._myChangedTiles[anIndex];
				this.setTileIndex(
					ECGame.EngineLib.Point2D.create(aChangedTile.X, aChangedTile.Y),
					aChangedTile.Value
				);
			}
			this._myChangedTiles = [];
		},
		
		cleanup : function cleanup(){return;},//TODO
		
		serialize : function serialize(inSerializer)
		{
			var anIndex
				,aTileValue
				,i, j
				;
				
			inSerializer.serializeObject(this, this.TileMap2D._serializeFormat);
			
			if(!inSerializer.isNetMode() && !this._myUsingNetViews)
			{
				if(inSerializer.isReading())
				{
					this._myChangedTiles = [];
				}

				for(j = 0; j < this._myMapSizeInTiles; ++j)
				{
					for(i = 0; i < this._myMapSizeInTiles; ++i)
					{
						anIndex = j * this._myMapSizeInTiles + i;
						if(!inSerializer.isReading())
						{
							aTileValue = this._myTileIndexArray[anIndex];
						}
						aTileValue = inSerializer.serializeInt(
							aTileValue,
							0,
							this._myNumberOfTiles
						);
						if(inSerializer.isReading())
						{
							this._myChangedTiles.push(
								ECGame.EngineLib.TileIndexSerializationHelper.create(ECGame.EngineLib.Point2D.create(i,j), aTileValue)
							);
						}
					}
				}
			}
		},
		
		copyFrom : function copyFrom(/*inOther*/){return;},//TODO
		
		debugDraw : function debugDraw(inGraphics)
		{
			var aThis = this;
			inGraphics.drawDebugText("Debug Drawing Tile Map");
			
			this._myTileInstanceTree.walk(
				function walkCallback(item)
				{
					aThis._myTileSet.renderTileInRect(//TODO should be debug draw for tile
						inGraphics,
						item._myTileValue,
						item.getAABB2D()
					);
				},
				inGraphics.getCamera2D().getRect()
			);
			
			this._myTileInstanceTree.debugDraw(inGraphics);//TODO map colors?
		}

	}
});