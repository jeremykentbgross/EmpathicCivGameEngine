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
		
		this._myMapSizeInTiles = 0;
		this._myTileSize = 0;
		this._myMinPhysicsPartitionSize = 0;
		this._myWorldSize = 0; // == _myMapSizeInTiles * _myTileSize
		
		this._myMap = null;
		this._myMapRef = null;	//for networking
		this._myPhysics = null;
		this._mySceneGraph = null;
		
		/*
		TODO NOTE: the entities added/removed are the same as the components in the entity
		It may be a good idea to somehow make a DeltaArrayObjectRef type or something...
		NOTE: entity has more updated version
		*/
		//entities:
		this._myEntities = [];
		this._myAddedEntities = [];
		this._myRemovedEntities = [];
		//network versions
		this._myEntityRefs = [];
		this._myAddedEntityRefs = [];
		this._myRemovedEntityRefs = [];
		
		this._myEntitySpacialHashMap = null;
		this._myEntityHashByID = [];
		
		this._myDefaultCamera = ECGame.EngineLib.Camera2.create();
		this._myCamera = null;
	},
	
	Parents : [ECGame.EngineLib.GameObject],
	
	flags : { netDynamic : true },
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		init : function init(inMapSizeInTiles, inTileset, inTileSize, inMinPhysicsPartitionSize, inUsingNetViews)//TODO tilesize part of tileset?
		{
			this._initNonGameObjectMembers(inMapSizeInTiles, inTileSize, inMinPhysicsPartitionSize);
			
			this._myUsingNetViews = inUsingNetViews;
			this._myMap = ECGame.EngineLib.TileMap2D.create();
			this._myMap.init(this, inTileset, inMapSizeInTiles, inTileSize, inUsingNetViews);
			this._myMapRef = this._myMap.getRef();
		},
		
		_isNotUsingNetViews : function _isNotUsingNetViews()
		{
			return !this._myUsingNetViews;
		},
		
		_initNonGameObjectMembers : function _initNonGameObjectMembers(inMapSizeInTiles, inTileSize, inMinPhysicsPartitionSize)
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
			
			this._myEntities = [];
			this._myAddedEntities = [];
			this._myRemovedEntities = [];
			
			this._myEntitySpacialHashMap = ECGame.EngineLib.QuadTree.create(
				ECGame.EngineLib.AABB2D.create(0, 0, this._myWorldSize, this._myWorldSize)
				,inMinPhysicsPartitionSize
				,null
			);
			this._myEntityHashByID = [];
			
			this._myDefaultCamera = ECGame.EngineLib.Camera2.create();
			this._myCamera = null;
		},
		
		copyFrom : function copyFrom(/*inOther*/){return;},//TODO
		
		render : function render(inGraphics)
		{
			var aCamera
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
			
			aCameraRect = this.getCamera().getRect();
			aCameraRect.setLeftTop(
				aCameraRect.getLeftTop().scale(aScale)
			);
			aCameraRect.setWidthHeight(
				aCameraRect.getWidthHeight().scale(aScale)
			);
			inGraphics.setStrokeStyle('rgba(255, 255, 255, 1)');
			inGraphics.strokeRect(aCameraRect);
		},

		addEntity : function addEntity(inEntity, inPosition/*optional*/)
		{
			var anIndex
				;
			
			//if its already added, just return
			if(this._myEntities.indexOf(inEntity) !== -1)
			{
				return;
			}
			
			if(inPosition)
			{
				inEntity.onEvent(ECGame.EngineLib.Events.SetPosition.create(inPosition));
			}

			//Note: The first UpdatedPhysicsStatus event (when 'addedToWorld') should cause it to be added to the hash map
			inEntity.registerListener('UpdatedPhysicsStatus', this);
			
			//add it
			this._myEntities.push(inEntity);
			//tell the entity it has been added //TODO this should be an event?
			inEntity.addedToWorld(this);
			
			if(this.canUserModifyNet())
			{
				//add it to the list of newly added entities for the network
				this._myAddedEntities.push(inEntity);
				
				//if it was previously removed, remove it from the removal list
				anIndex = this._myRemovedEntities.indexOf(inEntity);
				if(anIndex !== -1)
				{
					this._myRemovedEntities[anIndex] = this._myRemovedEntities[this._myRemovedEntities.length - 1];
					this._myRemovedEntities.pop();
				}
				
				this.setNetDirty();
			}
		},
		removeEntity : function removeEntity(inEntity)
		{
			var anIndex
				,aCurrentEntityHash
				,aNodeArray
				,aNodeIndex
				;
			
			//find the entity
			anIndex = this._myEntities.indexOf(inEntity);
			
			//if its not there, just return
			if(anIndex === -1)
			{
				return;
			}
			
			inEntity.deregisterListener('UpdatedPhysicsStatus', this);
			
			//unregisterfromhashmap
			aCurrentEntityHash = this._myEntityHashByID[inEntity.getID()];
			delete this._myEntityHashByID[inEntity.getID()];
			if(aCurrentEntityHash)
			{
				//remove it
				aNodeArray = aCurrentEntityHash.myContainingNodes;
				for(aNodeIndex in aNodeArray)
				{
					aNodeArray[aNodeIndex].deleteItem(aCurrentEntityHash);
				}
				aCurrentEntityHash.myContainingNodes = [];
			}
			
			//remove it
			this._myEntities[anIndex] = this._myEntities[this._myEntities.length - 1];
			this._myEntities.pop();
			
			//tell the entity it has been removed //TODO this should be an event?
			inEntity.removedFromWorld(this);
			
			if(this.canUserModifyNet())
			{
				//add it to the list of newly removed entities for the network
				this._myRemovedEntities.push(inEntity);
				
				//if it was previously added, remove it from the add list
				anIndex = this._myAddedEntities.indexOf(inEntity);
				if(anIndex !== -1)
				{
					this._myAddedEntities[anIndex] = this._myAddedEntities[this._myAddedEntities.length - 1];
					this._myAddedEntities.pop();
				}
				
				this.setNetDirty();
			}
		},
		queryEntitiesInAABB : function queryEntitiesInAABB(inAABB2D)
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
				,aNodeIndex
				,aNodeArray
				;
			
			aCurrentEntityHash = this._myEntityHashByID[inEvent.myEntity.getID()];
			if(aCurrentEntityHash)
			{
				//remove it
				aNodeArray = aCurrentEntityHash.myContainingNodes;
				for(aNodeIndex in aNodeArray)
				{
					aNodeArray[aNodeIndex].deleteItem(aCurrentEntityHash);
				}
				aCurrentEntityHash.myContainingNodes = [];
			}
			else
			{
				//create a new one
				aCurrentEntityHash = ECGame.EngineLib.QuadTreeItem.create(inEvent.boundingRect.clone());//TODO subclass of QuadTreeItem
				this._myEntityHashByID[inEvent.myEntity.getID()] = aCurrentEntityHash;
				aCurrentEntityHash.myEntity = inEvent.myEntity;
				aCurrentEntityHash.myContainingNodes = [];
			}
			aCurrentEntityHash.setAABB2D(inEvent.boundingRect);
			this._myEntitySpacialHashMap.insertToAllBestFitting(
				aCurrentEntityHash
				,aCurrentEntityHash.myContainingNodes
			);
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
			this._myAddedEntities = [];
			this._myRemovedEntities = [];

			this._myEntityRefs = [];
			this._myAddedEntityRefs = [];
			this._myRemovedEntityRefs = [];
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
				name : '_myEntityRefs',
				type : 'objRef',
				net : false,
				maxArrayLength : 32	//TODO
				,condition : '_isNotUsingNetViews'
			},
			{
				name : '_myAddedEntityRefs',
				type : 'objRef',
				net : true,
				netOnly : true,
				maxArrayLength : 32	//TODO
				,condition : '_isNotUsingNetViews'
			},
			{
				name : '_myRemovedEntityRefs',
				type : 'objRef',
				net : true,
				netOnly : true,
				maxArrayLength : 32	//TODO
				,condition : '_isNotUsingNetViews'
			}
		],
		
		serialize : function serialize(inSerializer)//TODO serialize maps somehow GameEntity has identical post/serialize for components!
		{
			var i
				;
			
			if(inSerializer.isNetMode())
			{
				this._myAddedEntityRefs = [];
				this._myRemovedEntityRefs = [];
				for(i = 0; i < this._myAddedEntities.length; ++i)
				{
					this._myAddedEntityRefs.push(this._myAddedEntities[i].getRef());
				}
				for(i = 0; i < this._myRemovedEntities.length; ++i)
				{
					this._myRemovedEntityRefs.push(this._myRemovedEntities[i].getRef());
				}
			}
			else
			{
				this._myEntityRefs = [];
				for(i = 0; i < this._myEntities.length; ++i)
				{
					this._myEntityRefs.push(this._myEntities[i].getRef());
				}
			}
			
			inSerializer.serializeObject(this, ECGame.EngineLib.World2D.SerializeFormat);
		},
		
		postSerialize : function postSerialize()
		{
			var anEntity
				,i
				;
			
			if(!this._myMap)//if we are not initialized
			{
				this._initNonGameObjectMembers(this._myMapSizeInTiles, this._myTileSize, this._myMinPhysicsPartitionSize);
				this._myMap = this._myMapRef.deref();
			}
			
			for(i = 0; i < this._myEntityRefs.length; ++i)
			{
				anEntity = this._myEntityRefs[i].deref();
				console.assert(anEntity, "Missing entity during serialization!");
				this.addEntity(anEntity);
			}
			for(i = 0; i < this._myAddedEntityRefs.length; ++i)
			{
				anEntity = this._myAddedEntityRefs[i].deref();
				console.assert(anEntity, "Missing entity during serialization!");
				this.addEntity(anEntity);
			}
			for(i = 0; i < this._myRemovedEntityRefs.length; ++i)
			{
				anEntity = this._myRemovedEntityRefs[i].deref();
				//console.assert(anEntity, "Missing entity during serialization!");
				if(anEntity)
				{
					this.removeEntity(anEntity);
				}
			}
			
			this._myEntityRefs = [];
			this._myAddedEntityRefs = [];
			this._myRemovedEntityRefs = [];
		}
	}
});