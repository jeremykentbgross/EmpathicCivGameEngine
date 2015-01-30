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
		var aThis;
		
		aThis = this;
		
		this.GameObject();
		
		this._myMapSizeInTiles = 0;
		this._myTileSize = 0;
		this._myMinPhysicsPartitionSize = 0;
		this._myWorldSize = 0; // == _myMapSizeInTiles * _myTileSize
		
		this._myMap = null;
		this._myMapRef = null;	//for networking
		this._myPhysics = null;
		this._mySceneGraph = null;
		
		this._myEntityCollection = ECGame.EngineLib.GameObjectCollection.create(
			32, 32, 32
			,function addedEntity(inEntity)
			{
				aThis._addedEntity(inEntity);
			}
			,function removedEntity(inEntity)
			{
				aThis._removedEntity(inEntity);
			}
		);
		
		this._myEntitySpacialHashMap = null;
		this._myEntityHashByID = [];
		
		this._myDefaultCamera = ECGame.EngineLib.Camera2D.create();
		this._myCamera = null;
		
		this._myDebugRayList = [];//TODO should be in physics I think!!
	},
	
	Parents : [ECGame.EngineLib.GameObject],
	
	flags : { netDynamic : true },
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		init : function init(
			inMapSizeInTiles
			,inTileset
			,inTileSize
			,inMinPhysicsPartitionSize
			,inUsingNetViews
		)//TODO tilesize part of tileset?
		{
			this._initNonGameObjectMembers(
				inMapSizeInTiles
				,inTileSize
				,inMinPhysicsPartitionSize
			);
			
			this._myUsingNetViews = inUsingNetViews;
			this._myMap = ECGame.EngineLib.TileMap2D.create();
			this._myMap.init(this, inTileset, inMapSizeInTiles, inTileSize, inUsingNetViews);
			this._myMapRef = this._myMap.getRef();
		},
		
		_isNotUsingNetViews : function _isNotUsingNetViews()
		{
			return !this._myUsingNetViews;
		},
		
		_initNonGameObjectMembers : function _initNonGameObjectMembers(
			inMapSizeInTiles
			,inTileSize
			,inMinPhysicsPartitionSize
		)
		{
			this._myMapSizeInTiles = inMapSizeInTiles;
			this._myTileSize = inTileSize;
			this._myMinPhysicsPartitionSize = inMinPhysicsPartitionSize;
			this._myWorldSize = inMapSizeInTiles * inTileSize;
			
			this._mySceneGraph = new ECGame.EngineLib.SceneGraph2D();
			this._mySceneGraph.init(this._myWorldSize, inTileSize);
			
			this._myPhysics = ECGame.EngineLib.Physics2D.create();
			this._myPhysics.init(this._myWorldSize, inMinPhysicsPartitionSize);
			ECGame.instance.getUpdater("PhysicsUpdater").addUpdate(this._myPhysics);//TODO move this to physics system itself?
			
			this._myEntitySpacialHashMap = ECGame.EngineLib.QuadTree.create(
				ECGame.EngineLib.AABB2D.create(0, 0, this._myWorldSize, this._myWorldSize)
				,inMinPhysicsPartitionSize
				,null
			);
			this._myEntityHashByID = [];
			
			//this._myDefaultCamera = ECGame.EngineLib.Camera2D.create();
			this._myCamera = null;
		},
		
		copyFrom : function copyFrom(/*inOther*/){return;},//TODO
		
		render : function render(inGraphics)
		{
			var aCamera
				,i
				;
			
			aCamera = this.getCamera();
			inGraphics.setCamera2D(aCamera);
			
			//debug draw the map		
			if(ECGame.Settings.isDebugDraw_Map())
			{
				this._myMap.debugDraw(inGraphics);
			}
			
			//render scene graph (note: it will ommit map tiles if map is debug drawn)
			this._mySceneGraph.render(inGraphics);
						
			//debug draw physics
			if(ECGame.Settings.isDebugDraw_Physics())
			{
				this._myPhysics.debugDraw(inGraphics);
				//TODO move physics ray tracing stuff into physics
				for(i = 0; i < this._myDebugRayList.length; ++i)//TODO make ray trace separate debug draw??
				{
					this._myDebugRayList[i].debugDraw(inGraphics);
					++this._myDebugRayList[i]._myWorldDebugDrawCount;
					if(this._myDebugRayList[i]._myWorldDebugDrawCount > 10)//TODO HACK should be for a time instead of frames?
					{
						this._myDebugRayList.shift();
						--i;
					}
				}
				//this._myDebugRayList = [];
			}
			
			//debug draw camera target point
			if(ECGame.Settings.isDebugDraw_CameraTarget())
			{
				aCamera.debugDraw(inGraphics);
			}
			
			if(ECGame.Settings.isDebugDraw_Sound())//TODO world sound partitioning/occulsion
			{
				ECGame.instance.getSoundSystem().debugDraw(inGraphics, this);
			}
			
			if(ECGame.Settings.isDebugDraw_WorldSpacialHash())
			{
				this._myEntitySpacialHashMap.debugDraw(inGraphics);//TODO spacial hashmap should maybe be part of the trigger system??
			}
		},
		
		renderMiniMap : function renderMiniMap(inGraphics, inTargetSpaceRect)
		{
			var aCameraRect
				,aScale
				,anAABB
				,i
				;
			
			inTargetSpaceRect = inTargetSpaceRect || inGraphics.getBackBufferRect();
			this._myMap.render(inGraphics, inTargetSpaceRect);
			
			aScale = inTargetSpaceRect.myWidth / this._myWorldSize;
			//&? = inTargetSpaceRect.myHeight / this._myWorldSize
			
			//TODO extract the entity drawing into a function for override!
			inGraphics.setFillStyle('rgba(0, 255, 0, 1)');
			for(i in this._myEntityHashByID)
			{
				anAABB = this._myEntityHashByID[i].getAABB2D().clone();
				anAABB.myX *= aScale;
				anAABB.myY *= aScale;
				anAABB.myWidth *= aScale;
				anAABB.myHeight *= aScale;
				inGraphics.fillRect(anAABB);
			}
			
			aCameraRect = this.getCamera().getCaptureVolumeAABB2D();
			aCameraRect.setLeftTop(
				aCameraRect.getLeftTop().scale(aScale)
			);
			aCameraRect.setWidthHeight(
				aCameraRect.getWidthHeight().scale(aScale)
			);
			inGraphics.setStrokeStyle('rgba(255, 255, 255, 1)');
			inGraphics.strokeRect(aCameraRect);
		},
		
		firePhysicsRay : function firePhysicsRay(inStart, inEnd)
		{
			var aRayTracer
				;
				
			aRayTracer = new ECGame.EngineLib.RayTracer2D.create();
			if(ECGame.Settings.isDebugDraw_Physics())
			{
				this._myDebugRayList.push(aRayTracer);
				aRayTracer._myWorldDebugDrawCount = 0;//TODO hack: should be part of the actual class
			}
			return aRayTracer.fireRay(
				this._myPhysics._myDetectionTree
				,inStart//.clone()
				,inEnd//.clone()
			);
		},

		addEntity : function addEntity(
			inEntity
			,inPosition//optional
		)
		{
			if(inPosition)
			{
				inEntity.onEvent(ECGame.EngineLib.Events.SetPosition.create(inPosition));
			}
			
			if(this._myEntityCollection.add(inEntity, this.canUserModifyNet()))
			{
				this.setNetDirty();
			}
		}
		,_addedEntity : function _addedEntity(inEntity)
		{
			//Note: The first UpdatedPhysicsStatus event (when 'addedToWorld') should cause it to be added to the hash map
			inEntity.registerListener('UpdatedPhysicsStatus', this);

			//tell the entity it has been added //TODO this should be an event?
			inEntity.addedToWorld(this);
		}
		,removeEntity : function removeEntity(inEntity)
		{
			if(this._myEntityCollection.remove(inEntity, this.canUserModifyNet()))
			{
				this.setNetDirty();
			}
		}
		,_removedEntity : function _removedEntity(inEntity)
		{
			var aCurrentEntityHash
				;
				
			inEntity.deregisterListener('UpdatedPhysicsStatus', this);
			
			//unregisterfromhashmap
			aCurrentEntityHash = this._myEntityHashByID[inEntity.getID()];
			if(aCurrentEntityHash)
			{
				delete this._myEntityHashByID[inEntity.getID()];
				aCurrentEntityHash.removeFromQuadTree();
			}
			
			//tell the entity it has been removed //TODO this should be an event?
			inEntity.removedFromWorld(this);
		}
		
		,queryEntitiesInAABB : function queryEntitiesInAABB(inAABB2D)
		{
			var anEntityList
				;

			anEntityList = [];
			
			this._myEntitySpacialHashMap.walk(
				function queueItem(inEntityNode)
				{
					anEntityList.push(inEntityNode.myEntity);
				},
				inAABB2D
			);
			/*for(var i = 0; i < anEntityList.length; ++i)
			{
				console.log('seen in world:', anEntityList[i].getID(), inAABB2D);
			}*/
			return anEntityList;
		},
		
		//get info when entities in the world move and need to change their queriable spacial hash location
		onUpdatedPhysicsStatus : function onUpdatedPhysicsStatus(inEvent)
		{
			var aCurrentEntityHash
				;
			
			aCurrentEntityHash = this._myEntityHashByID[inEvent.myEntity.getID()];
			if(aCurrentEntityHash)
			{
				aCurrentEntityHash.removeFromQuadTree();
			}
			else
			{
				//create a new one
				aCurrentEntityHash = ECGame.EngineLib.QuadTreeItem.create(inEvent.boundingRect.clone());//TODO subclass of QuadTreeItem
				this._myEntityHashByID[inEvent.myEntity.getID()] = aCurrentEntityHash;
				aCurrentEntityHash.myEntity = inEvent.myEntity;
			}
			aCurrentEntityHash.setAABB2D(inEvent.boundingRect);
			this._myEntitySpacialHashMap.insertToAllBestFitting(aCurrentEntityHash);
		},
		
		getPhysics : function getPhysics()
		{
			return this._myPhysics;
		},
		getMap : function getMap()
		{
			return this._myMap;
		},
		getSceneGraph : function getSceneGraph()
		{
			return this._mySceneGraph;
		},

		setCamera : function setCamera(in2DCamera)
		{
			this._myCamera = in2DCamera;
		},
		getCamera : function getCamera()
		{
			return this._myCamera || this._myDefaultCamera;
		},
		
		getSize : function getSize()
		{
			return this._myWorldSize;
		},
		getAABB2D : function getAABB2D()
		{
			return ECGame.EngineLib.AABB2D.create(0, 0, this._myWorldSize, this._myWorldSize);
		},

		cleanup : function cleanup(){return;},//TODO
		
		//set<classname>NetDirty
		clearNetDirty : function clearNetDirty()
		{
			this._myEntityCollection.clearNetDirty();
		},
		
		
		SerializeFormat : 
		[
			{
				name : '_myMapSizeInTiles',////////////////TODO GET FROM MAP INSTEAD
				type : 'int',
				net : false,
				min : 0,
				max : 256	//TODO consider sending 2^(*power*) instead! (smaller)
			},
			{
				name : '_myTileSize',////////////////TODO GET FROM MAP INSTEAD
				type : 'int',
				net : false,
				min : 8,
				max : 256
			},
			{
				name : '_myMinPhysicsPartitionSize',
				type : 'int',
				net : false,
				min : 1,
				max : 64
			},
			{
				name : '_myMapRef',
				type : 'objRef',
				net : false
			},
			{
				name : '_myUsingNetViews',
				type : 'bool',
				net : false
			},
			{
				name : '_myEntityCollection'
				,type : 'GameObjectCollection'
				,net : true
				,condition : '_isNotUsingNetViews'
			}
		],
		
		serialize : function serialize(inSerializer)
		{
			inSerializer.serializeObject(this, ECGame.EngineLib.World2D.SerializeFormat);
		},
		
		postSerialize : function postSerialize()
		{
			if(!this._myMap)//if we are not initialized
			{
				this._initNonGameObjectMembers(this._myMapSizeInTiles, this._myTileSize, this._myMinPhysicsPartitionSize);
				this._myMap = this._myMapRef.deref();
			}
			
			this._myEntityCollection.postSerialize();
		}
	}
});