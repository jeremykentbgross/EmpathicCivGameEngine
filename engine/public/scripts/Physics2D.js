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

/*jslint plusplus: true */


//TODO
//separate broad/narrow/resolution
//rays
//fix update (events)


//TODO extract colidable parent class
ECGame.EngineLib.PhysicsObject2D = ECGame.EngineLib.Class.create({
	Constructor : function PhysicsObject2D()
	{
		this.QuadTreeItem(ECGame.EngineLib.AABB2D.create());

		this._myPhysicsSystemRef = null;
		this._myStatus = null;
		this._myDensity = null;
		this._myVelocity = null;
		this._myOwningNodes = null;
		this._myActiveLinkedListNode = null;
		this._myOwner = null;
		this._myID = null;
	},
	Parents : [ECGame.EngineLib.QuadTreeItem],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		//Physics Object Status constants:
		STATUS__STATIC : 0,
		STATUS__SLEEPING : 1,
		STATUS__ACTIVE : 2,
		STATUS__ALWAYS_ACTIVE : 3,

		init : function init(inPhysicsSystem)
		{
			this._myPhysicsSystemRef = inPhysicsSystem;
			this._myStatus = this.PhysicsObject2D.STATUS__STATIC;
			this._myDensity = 1;
			this._myVelocity = ECGame.EngineLib.Point2.create();
			this._myOwningNodes = [];
			this._myActiveLinkedListNode = ECGame.EngineLib.createGameCircularDoublyLinkedListNode(this);			
			this._myOwner = null;
			this._myID = ++inPhysicsSystem._myNextPhysicsID;
			inPhysicsSystem._myObjectsMap[this._myID] = this;
		},
		
		getID : function getID()
		{
			return this._myID;
		},
		
		getMass : function getMass()
		{
			return this._myDensity * this._myAABB.getArea();
		},
		
		release : function release()	//TODO names: create/destroy init/clean ??/release
		{
			this.setStatic();//removes from active list
			this._myPhysicsSystemRef._removePhysicsObjectFromTree(this);
			delete this._myPhysicsSystemRef._myObjectsMap[this._myID];
		},
				
		setStatic : function setStatic()
		{
			if(this._myStatus === this.PhysicsObject2D.STATUS__ACTIVE || this._myStatus === this.PhysicsObject2D.STATUS__ALWAYS_ACTIVE)
			{
				this._myActiveLinkedListNode.remove();
			}
			this._myStatus = this.PhysicsObject2D.STATUS__STATIC;
		},
		isStatic : function isStatic()
		{
			return this._myStatus === this.PhysicsObject2D.STATUS__STATIC;
		},
		
		_setSleeping : function _setSleeping()
		{
			if(this._myStatus === this.PhysicsObject2D.STATUS__ACTIVE 
				//&& Math.abs(this._myVelocity.myX) < 1.0 
				//&& Math.abs(this._myVelocity.myY) < 1.0
				)
			{
				//set sleeping:
				this._myStatus = this.PhysicsObject2D.STATUS__SLEEPING;
				this._myVelocity = ECGame.EngineLib.Point2.create();					
				this._myActiveLinkedListNode.remove();
			}
		},
		isSleeping : function isSleeping()
		{
			return this._myStatus === this.PhysicsObject2D.STATUS__SLEEPING;
		},
		
		setActive : function setActive()
		{
			if(this._myStatus === this.PhysicsObject2D.STATUS__ACTIVE || this._myStatus === this.PhysicsObject2D.STATUS__ALWAYS_ACTIVE)
			{
				return;
			}
			this._myPhysicsSystemRef._myActiveObjectsList.insert(this._myActiveLinkedListNode);
			this._myStatus = this.PhysicsObject2D.STATUS__ACTIVE;
		},
		isActive : function isActive()
		{
			return this._myStatus === this.PhysicsObject2D.STATUS__ACTIVE;
		},
		
		setAlwaysActive : function setAlwaysActive()
		{
			if(this._myStatus === this.PhysicsObject2D.STATUS__ALWAYS_ACTIVE)
			{
				return;
			}
			if(this._myStatus !== this.PhysicsObject2D.STATUS__ACTIVE)
			{
				this._myPhysicsSystemRef._myActiveObjectsList.insert(this._myActiveLinkedListNode);
			}
			this._myStatus = this.PhysicsObject2D.STATUS__ALWAYS_ACTIVE;
		},
		isAlwaysActive : function isAlwaysActive()
		{
			return this._myStatus === this.PhysicsObject2D.STATUS__ALWAYS_ACTIVE;
		},
				
		setAABB : function setAABB(inAABB)
		{
			this._myPhysicsSystemRef._removePhysicsObjectFromTree(this);
			this._myAABB.copyFrom(inAABB);
			this._myPhysicsSystemRef._insertPhysicsObjectToTree(this);
		},
		
		requestVelocity : function requestVelocity(inVelocity)
		{
			this._myVelocity.copyFrom(inVelocity);
			if(this._myVelocity.lenSq() > 0.01)
			{
				this.setActive();
			}
		},
		
		setOwner : function setOwner(inOwner)
		{
			this._myOwner = inOwner;
		},
		
		debugDraw : function debugDraw(inGraphics)
		{
			//Defaults are:
			//	static - black
			//	sleeping - blue
			//	active - bluegreen
			//	alwaysActive - green
			//	collisions - red
			switch(this._myStatus)
			{
				case this.PhysicsObject2D.STATUS__STATIC:
					inGraphics.setFillStyle(ECGame.Settings.Debug.Physics_StaticObject_DrawColor);
					break;
				case this.PhysicsObject2D.STATUS__SLEEPING:
					inGraphics.setFillStyle(ECGame.Settings.Debug.Physics_SleepingObject_DrawColor);
					break;
				case this.PhysicsObject2D.STATUS__ACTIVE:
					inGraphics.setFillStyle(ECGame.Settings.Debug.Physics_ActiveObject_DrawColor);
					break;
				case this.PhysicsObject2D.STATUS__ALWAYS_ACTIVE:
					inGraphics.setFillStyle(ECGame.Settings.Debug.Physics_AlwaysActiveObject_DrawColor);
					break;
				default://WTF?
					ECGame.log.assert(false, "Unknown Physics object status!");
					inGraphics.setFillStyle('rgba(255, 0, 255, 1)');//TODO needed??
					break;
			}
			inGraphics.fillRect(this._myAABB);
		}
	}
});



//TODO extract out ColisionDetection parent class
ECGame.EngineLib.Physics2D = ECGame.EngineLib.Class.create({
	Constructor : function Physics2D()
	{
		this._myDetectionTree = null;
		this._myObjectsMap = null;	//TODO cleanup, needed?	
		this._myActiveObjectsList = null;
		this._myCollisions = null;
		this._myCollisionsRenderList = null;
		
		this._myNextPhysicsID = 0;//TODO make this static member of physics object/collidable?
		
		this._myFrameUpdateCount = 0;
		this._myAccumulatedTime = 0;
		
		//constants:
		this._myTimeStepInMilliSeconds = 1;
		this._myTimeStepInSeconds = this._myTimeStepInMilliSeconds / 1000;
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init(inWorldSize, inMinSize)
		{
			this._myDetectionTree = ECGame.EngineLib.QuadTree.create();
			this._myDetectionTree.init(
				ECGame.EngineLib.AABB2D.create(0, 0, inWorldSize, inWorldSize),
				inMinSize
			);
			
			this._myObjectsMap = {};
			
			this._myActiveObjectsList = ECGame.EngineLib.createGameCircularDoublyLinkedListNode();
			
			this._myCollisions = [];
			this._myCollisionsRenderList = [];
			
			this._myNextPhysicsID = 0;
		
			this._myFrameUpdateCount = 0;
			this._myAccumulatedTime = 0;
		},
		
		_insertPhysicsObjectToTree : function _insertPhysicsObjectToTree(inPhysicsObject)
		{
			var aThis;
			
			aThis = this;
			
			this._myDetectionTree.walk(
				function checkBroadCollision(inItem)
				{
					var anAABB;
					
					ECGame.log.assert(inPhysicsObject !== inItem, "Object collided with itself??");

					anAABB = inPhysicsObject._myAABB.getIntersection(inItem._myAABB);
					if(anAABB.getArea() > 0)
					{
						aThis._myCollisions[aThis._myCollisions.length] =//TODO create a collision object type
						{
							myObj1 : inPhysicsObject,
							myObj2 : inItem,
							myAABB : anAABB
						};
					}
				},
				inPhysicsObject._myAABB
			);
			
			this._myDetectionTree.insertToAllBestFitting(inPhysicsObject, inPhysicsObject._myOwningNodes);
		},
		
		_removePhysicsObjectFromTree : function _removePhysicsObjectFromTree(inPhysicsObject)
		{
			var nodeIndex,
				nodeArray;
			
			nodeArray = inPhysicsObject._myOwningNodes;

			for(nodeIndex in nodeArray)
			{
				nodeArray[nodeIndex].deleteItem(inPhysicsObject);
			}
			/*	
			this._myDetectionTree.walk(////////////////////TODO TEMP DEBUG CHECK?? or keep?
				function ?funcname?(item)
				{
					if(inPhysicsObject === item)
					{
						ECGame.log.error("Object collided with itself??");
						
						for(nodeIndex in nodeArray)///////////////////////////////////
							nodeArray[nodeIndex].deleteItem(inPhysicsObject);
						
						return;
					}
				}
				//,inPhysicsObject._myAABB
			);////////////////////TODO TEMP DEBUG CHECK?? or keep?
			*/
				
			inPhysicsObject._myOwningNodes = [];
		},
		
		createNewPhysicsObject : function createNewPhysicsObject()//TODO remove this?? or rename!
		{
			return ECGame.EngineLib.PhysicsObject2D.create(this);
		},

		update : function update(deltaTime)//TODO proper parameters for everyone here...
		{
			var aPhysicsObject,
				aCurrentNode,
				anOwner,
				i,
				aCurrentCollision,
				anAABB,
				aMovedObjectsThisFrame,
				obj1, obj2,
				objCenter,
				colCenter,
				direction,
				force,
				acceleration;
				
			aMovedObjectsThisFrame = {};
			
			this._myFrameUpdateCount = 0;
			
			deltaTime = deltaTime || 1;//TODO needed??
			
			this._myAccumulatedTime += deltaTime;
			
			while(this._myAccumulatedTime > 1)
			{
				this._myAccumulatedTime -= this._myTimeStepInMilliSeconds;
				++this._myFrameUpdateCount;
				
				//remove all the active nodes from the tree:
				aCurrentNode = this._myActiveObjectsList.myNext;
				while(aCurrentNode !== this._myActiveObjectsList)
				{
					aPhysicsObject = aCurrentNode.item;
					this._removePhysicsObjectFromTree(aPhysicsObject);			
					
					//remember the first location from which this object was active for this frame
					if(!aMovedObjectsThisFrame[aPhysicsObject._myID])
					{
						aMovedObjectsThisFrame[aPhysicsObject._myID] = aPhysicsObject._myAABB.getLeftTop();
					}
					
					aCurrentNode = aCurrentNode.myNext;
				}
				
				//move all the active objects and see where they collide
				aCurrentNode = this._myActiveObjectsList.myNext;
				while(aCurrentNode !== this._myActiveObjectsList)
				{
					aPhysicsObject = aCurrentNode.item;
					
					//move:
					anAABB = aPhysicsObject._myAABB;
					anAABB.setLeftTop(
						anAABB.getLeftTop().add(aPhysicsObject._myVelocity.scale(this._myTimeStepInSeconds))
					);
					
					//apply friction:
					//aPhysicsObject._myVelocity = aPhysicsObject._myVelocity.scale(0.75);//TODO use a real friction value
					
					//detect collision
					this._insertPhysicsObjectToTree(aPhysicsObject);
					
					aCurrentNode = aCurrentNode.myNext;
				}
				
				//resolveCollisions and activate any non static interacting objects
				for(i = 0; i < this._myCollisions.length; ++i)
				{
					aCurrentCollision = this._myCollisions[i];
					
					//wake it up:
					if(aCurrentCollision.myObj1.isSleeping())
					{
						aCurrentCollision.myObj1.setActive();
					}
					if(aCurrentCollision.myObj2.isSleeping())
					{
						aCurrentCollision.myObj2.setActive();
					}
					
					obj1 = aCurrentCollision.myObj1;
					obj2 = aCurrentCollision.myObj2;
					colCenter = aCurrentCollision.myAABB.getCenter();
					//TODO proper force PER direction??
					force = aCurrentCollision.myAABB.getArea() / this._myTimeStepInSeconds;//f = -kx
					
					if(!obj1.isStatic())
					{
						objCenter = obj1._myAABB.getCenter();
						direction = objCenter.subtract(colCenter).unit();
						//TODO not correct for impulse I think
						acceleration = force / obj1.getMass();	//f=ma => a = f/m
						obj1._myVelocity = obj1._myVelocity.add(direction.scale(acceleration));
					}
					if(!obj2.isStatic())
					{
						objCenter = obj2._myAABB.getCenter();
						direction = objCenter.subtract(colCenter).unit();
						//TODO not correct for impulse I think
						acceleration = force / obj2.getMass();	//f=ma => a = f/m
						obj2._myVelocity = obj2._myVelocity.add(direction.scale(acceleration));
					}
				}
				
				//remember collisions for rendering:
				this._myCollisionsRenderList = this._myCollisions;
				
				//clear collisions:
				this._myCollisions = [];
							
				//sleep if not moving
				aCurrentNode = this._myActiveObjectsList.myNext;
				while(aCurrentNode !== this._myActiveObjectsList)
				{
					aPhysicsObject = aCurrentNode.item;
					aCurrentNode = aCurrentNode.myNext;

					if(aPhysicsObject.isActive()
						&& Math.abs(aPhysicsObject._myVelocity.myX) < 1.0 
						&& Math.abs(aPhysicsObject._myVelocity.myY) < 1.0)
					{
						aPhysicsObject._setSleeping();
					}
				}
			}
			
			for(i in aMovedObjectsThisFrame)
			{
				aPhysicsObject = this._myObjectsMap[i];
				aPhysicsObject._myVelocity =	//TODO isnt this one proper??
					aPhysicsObject._myAABB.getLeftTop().subtract(aMovedObjectsThisFrame[i]).scale(1000 / deltaTime);
				anOwner = aPhysicsObject._myOwner;
				if(anOwner && anOwner.onPhysObjectUpdate)
				{
					anOwner.onPhysObjectUpdate(
						new ECGame.EngineLib.Events.PhysObjectUpdate(
							aPhysicsObject._myAABB.getCenter(),
							aPhysicsObject._myVelocity.clone(),
							aPhysicsObject._myAABB.clone()
						)
					);
				}
			}
		},
		
		debugDraw : function debugDraw(inGraphics)
		{
			var i,
				aCollisionRect,
				aPhysicsObject,
				aCurrentNode,
				aListToDraw,
				aCameraRect;
			
			inGraphics.drawDebugText("Debug Drawing Physics");
			inGraphics.drawDebugText("Frame Update Count:" + this._myFrameUpdateCount);
			//TODO print (and notify) collisions this frame

			aCameraRect = inGraphics.getCamera2D().getRect();
			
			//make a map of them and draw them.
			//	Note: The map will automatically filter the object from being drawn more than once if it is in more than one node
			aListToDraw = {};
			this._myDetectionTree.walk(
				function addToRenderMap(item)
				{
					aListToDraw[item._myID] = item;
				},
				aCameraRect
			);
			for(i in aListToDraw)
			{
				aListToDraw[i].debugDraw(inGraphics);
			}
			
			this._myDetectionTree.debugDraw(inGraphics);//TODO 3 colors here from settings
			
			//draw collisions
			inGraphics.setFillStyle(ECGame.Settings.Debug.Physics_ObjectCollision_DrawColor);
			for(i in this._myCollisionsRenderList)
			{
				aCollisionRect = this._myCollisionsRenderList[i].myAABB;
				if(aCollisionRect.intersectsAABB2D(aCameraRect))
				{
					inGraphics.fillRect(aCollisionRect);
				}
			}
			
			//mark the active ones
			inGraphics.setStrokeStyle(ECGame.Settings.Debug.Physics_ActiveObjectBorder_DrawColor);
			aCurrentNode = this._myActiveObjectsList.myNext;
			while(aCurrentNode !== this._myActiveObjectsList)
			{
				aPhysicsObject = aCurrentNode.item;
				inGraphics.strokeRect(aPhysicsObject._myAABB);
				aCurrentNode = aCurrentNode.myNext;
			}
		}
		
	}
});