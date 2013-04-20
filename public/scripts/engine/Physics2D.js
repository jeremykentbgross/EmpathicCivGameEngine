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


//TODO NOT OUT HERE!!!!
//Physics Object Status constants:
var STATUS__STATIC = 0;
var STATUS__SLEEPING = 1;
var STATUS__ACTIVE = 2;
var STATUS__ALWAYS_ACTIVE = 3;

//TODO extract physics object
//separate broad/narrow/resolution
//rays
//fix update (events)
//rename the file


ECGame.EngineLib.Physics2D = ECGame.EngineLib.Class.create({
	Constructor : function Physics2D()
	{
		this._myDetectionTree = null;//TODO name?
		this._myObjectsMap = null;	//TODO needed?
		this._myActiveObjectsList = null;
		this._myCollisions = null;	//TODO name?? TODO make collisions a linked list too?? 
		this._myCollisionsRenderList = null;//TODO name??
		
		this._myNextPhysicsID = 0;
		
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
				ECGame.EngineLib.AABB2.create(0, 0, inWorldSize, inWorldSize),
				inMinSize
			);
			
			this._myObjectsMap = {};//todo is this needed? should be linked list instead!!
			
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
				function(inItem)
				{
					var anAABB;
					
					ECGame.log.assert(inPhysicsObject !== inItem, "Object collided with itself??");

					anAABB = inPhysicsObject.AABB.getIntersection(inItem.AABB);
					if(anAABB.getArea() > 0)
					{
						aThis._myCollisions[aThis._myCollisions.length] =//TODO create a collision object type
						{
							myObj1 : inPhysicsObject,
							myObj2 : inItem,
							AABB : anAABB
						};
					}
				},
				inPhysicsObject.AABB
			);
			
			this._myDetectionTree.insertToAllBestFitting(inPhysicsObject, inPhysicsObject.myOwningNodes);
		},
		
		_removePhysicsObjectFromTree : function _removePhysicsObjectFromTree(inPhysicsObject)
		{
			var nodeIndex,
				nodeArray;
			
			nodeArray = inPhysicsObject.myOwningNodes;

			for(nodeIndex in nodeArray)
			{
				nodeArray[nodeIndex].deleteItem(inPhysicsObject);
			}
			/*	
			this._myDetectionTree.walk(////////////////////TODO TEMP DEBUG CHECK?? or keep?
				function(item)
				{
					if(inPhysicsObject === item)
					{
						ECGame.log.error("Object collided with itself??");
						
						for(nodeIndex in nodeArray)///////////////////////////////////
							nodeArray[nodeIndex].deleteItem(inPhysicsObject);
						
						return;
					}
				}
				//,inPhysicsObject.AABB
			);////////////////////TODO TEMP DEBUG CHECK?? or keep?
			*/
				
			inPhysicsObject.myOwningNodes = [];
		},
		
		createNewPhysicsObject : function createNewPhysicsObject()
		{
			var physicsObject;
			var phyObjHandle;
			var aThis;
			
			aThis = this;
			
			phyObjHandle = {};
			
			physicsObject = 
			{
				myStatus : STATUS__STATIC,
				myDensity : 1,
				myVelocity : ECGame.EngineLib.Point2.create(),//todo requested/actual velocity?
				//myFriction:,??
				AABB : ECGame.EngineLib.AABB2.create(),//todo have lots of gamerects relative to a center??
				getAABB : function getAABB(){return this.AABB;},//TODO inherit ECGame.EngineLib.QuadTreeItem
				myOwningNodes : [],
				myID : 'PhysID' + (++this._myNextPhysicsID).toString(),//todo become just a number for serialization? (probably not serialized?)
				myHandle : phyObjHandle,
				myRegisteredActiveNode : ECGame.EngineLib.createGameCircularDoublyLinkedListNode(),
				getMass :
							function()
							{
								return this.myDensity * this.AABB.getArea();
							},
				myOwner : null	//TODO should be listener(s)??
			};
			physicsObject.myRegisteredActiveNode.item = physicsObject;
			
			//TODO why keep this? to remove all objects later
			aThis._myObjectsMap[physicsObject.myID] = physicsObject;
			
			phyObjHandle.release = function()
			{
				this.setStatic();//removes from active list
				aThis._removePhysicsObjectFromTree(physicsObject);
				delete aThis._myObjectsMap[physicsObject.myID];
			};
					
			phyObjHandle.setStatic = function()
			{
				if(physicsObject.myStatus === STATUS__ACTIVE || physicsObject.myStatus === STATUS__ALWAYS_ACTIVE)
				{
					physicsObject.myRegisteredActiveNode.remove();
				}
				physicsObject.myStatus = STATUS__STATIC;
				//todo remove mass and velocity??
			};
			
			phyObjHandle.setActive = function()
			{
				if(physicsObject.myStatus === STATUS__ACTIVE || physicsObject.myStatus === STATUS__ALWAYS_ACTIVE)
				{
					return;
				}
				aThis._myActiveObjectsList.insert(physicsObject.myRegisteredActiveNode);
				physicsObject.myStatus = STATUS__ACTIVE;
			};
			
			phyObjHandle.setAlwaysActive = function()
			{
				if(physicsObject.myStatus === STATUS__ALWAYS_ACTIVE)
				{
					return;
				}
				if(physicsObject.myStatus !== STATUS__ACTIVE)
				{
					aThis._myActiveObjectsList.insert(physicsObject.myRegisteredActiveNode);
				}
				physicsObject.myStatus = STATUS__ALWAYS_ACTIVE;
			};
			
			//todo set inactive disabled (ie not in the tree at all)
			
			//todo setDensity/Mass
			
			//todo release
			
			phyObjHandle.setGame2DAABB = function(inGame2DAABB)
			{
				aThis._removePhysicsObjectFromTree(physicsObject);
				physicsObject.AABB.copyFrom(inGame2DAABB);
				aThis._insertPhysicsObjectToTree(physicsObject);
			};
			
			phyObjHandle.requestVelocity = function(inVelocity)
			{
				physicsObject.myVelocity = inVelocity;
				if(physicsObject.myVelocity.lenSq() > 0.01)
				{
					this.setActive();
				}
			};
			
			phyObjHandle.setOwner = function(inOwner)
			{
				physicsObject.myOwner = inOwner;
			};
			
			return phyObjHandle;
		},

		update : function update(deltaTime)//TODO proper parameters for everyone here...
		{
			var aPhysicsObject,
				aCurrentNode,
				anOwner,//TODO rename listener?
				i,
				aCurrentCollision,
				anAABB,
				aMovedObjectsThisFrame;
				
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
					if(!aMovedObjectsThisFrame[aPhysicsObject.myID])
					{
						aMovedObjectsThisFrame[aPhysicsObject.myID] = aPhysicsObject.AABB.getLeftTop();
					}
					
					aCurrentNode = aCurrentNode.myNext;
				}
				
				//move all the active objects and see where they collide
				aCurrentNode = this._myActiveObjectsList.myNext;
				while(aCurrentNode !== this._myActiveObjectsList)
				{
					aPhysicsObject = aCurrentNode.item;
					
					//move:
					anAABB = aPhysicsObject.AABB;
					anAABB.setLeftTop(
						anAABB.getLeftTop().add(aPhysicsObject.myVelocity.scale(this._myTimeStepInSeconds))
					);
					
					//apply friction:
					//aPhysicsObject.myVelocity = aPhysicsObject.myVelocity.scale(0.75);//todo use a real friction value
					
					//detect collision
					this._insertPhysicsObjectToTree(aPhysicsObject);
					
					aCurrentNode = aCurrentNode.myNext;
				}
				
				//resolveCollisions and activate any non static interacting objects
				for(i = 0; i < this._myCollisions.length; ++i)
				{
					aCurrentCollision = this._myCollisions[i];
					
					//wake it up:
					if(aCurrentCollision.myObj1.myStatus === STATUS__SLEEPING)
					{
						aCurrentCollision.myObj1.myHandle.setActive();
					}
					if(aCurrentCollision.myObj2.myStatus === STATUS__SLEEPING)
					{
						aCurrentCollision.myObj2.myHandle.setActive();
					}
					//TODO these should not be var'ed here!!
					var obj1, obj2, objCenter, colCenter, direction, force, acceleration;
					obj1 = aCurrentCollision.myObj1;
					obj2 = aCurrentCollision.myObj2;
					colCenter = aCurrentCollision.AABB.getCenter();
					//TODO proper force PER direction??
					force = aCurrentCollision.AABB.getArea() / this._myTimeStepInSeconds;//f = -kx
					
					if(obj1.myStatus !== STATUS__STATIC)
					{
						objCenter = obj1.AABB.getCenter();
						direction = objCenter.subtract(colCenter).unit();					
						acceleration = force / obj1.getMass();	//f=ma => a = f/m
						
						obj1.myVelocity = obj1.myVelocity.add(direction.scale(acceleration));
					}
					if(obj2.myStatus !== STATUS__STATIC)
					{
						objCenter = obj2.AABB.getCenter();
						direction = objCenter.subtract(colCenter).unit();					
						acceleration = force / obj2.getMass();	//f=ma => a = f/m
						
						obj2.myVelocity = obj2.myVelocity.add(direction.scale(acceleration));
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

					if(aPhysicsObject.myStatus === STATUS__ACTIVE 
						&& Math.abs(aPhysicsObject.myVelocity.myX) < 1.0 
						&& Math.abs(aPhysicsObject.myVelocity.myY) < 1.0)
					{
						//set sleeping:
						aPhysicsObject.myVelocity = ECGame.EngineLib.Point2.create();					
						aPhysicsObject.myStatus = STATUS__SLEEPING;
						aPhysicsObject.myRegisteredActiveNode.remove();
					}
				}
			}
			
			for(i in aMovedObjectsThisFrame)
			{
				//TODO if !hasownedproperty, etc continue
				aPhysicsObject = this._myObjectsMap[i];
				aPhysicsObject.myVelocity =	//TODO isnt this one proper??
					aPhysicsObject.AABB.getLeftTop().subtract(aMovedObjectsThisFrame[i]).scale(1000 / deltaTime);
				anOwner = aPhysicsObject.myOwner;
				if(anOwner && anOwner.onPhysObjectUpdate)
				{
					anOwner.onPhysObjectUpdate(//TODO real event!!!
						{
							position : aPhysicsObject.AABB.getCenter(),
							velocity : aPhysicsObject.myVelocity,//TODO send clones? these maybe messed up by users
							boundingRect : aPhysicsObject.AABB//TODO send clones? these maybe messed up by users
						}
					);
				}
			}
		},
		
		//TODO Round for drawing!!!!!!!!!!!!!!!!!!!!!!! (EVERYWHERE!!!!!!)
		debugDraw : function debugDraw(inCanvas2DContext, inCameraRect)
		{
			var i,
				aCollisionRect,
				aPhysicsObject,
				aCurrentNode;
			
			ECGame.instance.graphics.drawDebugText("Debug Drawing Physics");
			ECGame.instance.graphics.drawDebugText("Frame Update Count:" + this._myFrameUpdateCount);
			//todo print (and notify) collisions this frame
			
			//walk:
			//	static - black
			//	sleeping - blue
			//	active - bluegreen
			//	alwaysActive - green
			//	collisions - red
			
			//HACK!!!!!!!!!!!
			var frameCount = ECGame.instance.timer.getFrameCount();
						
			this._myDetectionTree.walk(
				function(item)
				{
					if(frameCount === item.lastFrameDrawn)
					{
						return;
					}item.lastFrameDrawn=frameCount;
					switch(item.myStatus)
					{
						case STATUS__STATIC ://black
							inCanvas2DContext.fillStyle = ECGame.Settings.Debug.Physics_StaticObject_DrawColor;//'rgba(0, 0, 0, 1)';
							break;
						case STATUS__SLEEPING://blue
							inCanvas2DContext.fillStyle = ECGame.Settings.Debug.Physics_SleepingObject_DrawColor;//'rgba(0, 0, 255, 1)';
							break;
						case STATUS__ACTIVE://blue green
							inCanvas2DContext.fillStyle = ECGame.Settings.Debug.Physics_ActiveObject_DrawColor;//'rgba(0, 180, 180, 1)';
							break;
						case STATUS__ALWAYS_ACTIVE://green
							inCanvas2DContext.fillStyle = ECGame.Settings.Debug.Physics_AlwaysActiveObject_DrawColor;//'rgba(0, 128, 0, 1)';
							break;
						default://WTF?
							ECGame.log.assert(false, "Unknown Physics object status!");
							inCanvas2DContext.fillStyle = 'rgba(255, 0, 255, 1)';//TODO needed??
							break;
					}
				//	inCanvas2DContext.beginPath();//HACK
					inCanvas2DContext.fillRect(
						/*Math.round*/(item.AABB.myX - inCameraRect.myX),
						/*Math.round*/(item.AABB.myY - inCameraRect.myY),
						/*Math.round*/(item.AABB.myWidth),
						/*Math.round*/(item.AABB.myHeight)
					);
				//	inCanvas2DContext.fill();//HACK??
				},
				inCameraRect
			);
			
			this._myDetectionTree.debugDraw(inCanvas2DContext, inCameraRect);//todo 3 colors here from settings
			
			//draw collisions
			inCanvas2DContext.fillStyle = ECGame.Settings.Debug.Physics_ObjectCollision_DrawColor;//'rgba(255, 0, 0, 1)';
			for(i in this._myCollisionsRenderList)
			{
				aCollisionRect = this._myCollisionsRenderList[i].AABB;
				if(aCollisionRect.intersectsRect(inCameraRect))
				{
					inCanvas2DContext.fillRect(
						aCollisionRect.myX - inCameraRect.myX,
						aCollisionRect.myY - inCameraRect.myY,
						aCollisionRect.myWidth,
						aCollisionRect.myHeight
					);
				}
			}
			
			//mark the active ones
			inCanvas2DContext.strokeStyle = ECGame.Settings.Debug.Physics_ActiveObjectBorder_DrawColor;//'rgba(0, 255, 0, 1)';
			aCurrentNode = this._myActiveObjectsList.myNext;
			while(aCurrentNode !== this._myActiveObjectsList)
			{
				aPhysicsObject = aCurrentNode.item;
				inCanvas2DContext.strokeRect(
					aPhysicsObject.AABB.myX - inCameraRect.myX,
					aPhysicsObject.AABB.myY - inCameraRect.myY,
					aPhysicsObject.AABB.myWidth,
					aPhysicsObject.AABB.myHeight
				);
				aCurrentNode = aCurrentNode.myNext;
			}
		}
		
		
	}
});