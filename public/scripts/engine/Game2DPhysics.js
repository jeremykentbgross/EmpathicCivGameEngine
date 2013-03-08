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

ECGame.EngineLib.createGame2DPhysics = function()
{
	/////////////////////////////////////////////////////
	//return value///////////////////////////////////////
	var outGame2DPhysics;
	//return value///////////////////////////////////////
	/////////////////////////////////////////////////////
	
	
	
	/////////////////////////////////////////////////////
	//PRIVATE by closure/////////////////////////////////
	var PRIVATE = {};//TODO put everything else in here
	
	var myDetectionTree;
	var myWorldSize;
	var myMinSize;
	
	var myPhysicsObjects;
	var myActivePhysicsObjects;
	var myCollisions;	//todo make collisions a linked list too??
	var myCollisionsRenderList;
	
	var myNextPhysicsID = 0;
	
	//Physics Object Status constants:
	var STATUS__STATIC = 0;
	var STATUS__SLEEPING = 1;
	var STATUS__ACTIVE = 2;
	var STATUS__ALWAYS_ACTIVE = 3;
	//PRIVATE by closure/////////////////////////////////
	/////////////////////////////////////////////////////
	
	
	
	outGame2DPhysics = {};
	
	
	
	outGame2DPhysics.init = function(inWorldSize, inMinSize)
	{
		myWorldSize = inWorldSize;
		myMinSize = inMinSize;
		
		myDetectionTree = ECGame.EngineLib.GameQuadTree.create();
		myDetectionTree.init(
			ECGame.EngineLib.createGame2DAABB(0, 0, inWorldSize, inWorldSize),
			inMinSize
		);
		
		myPhysicsObjects = {};//todo is this needed? should be linked list instead!!
		
		myActivePhysicsObjects = ECGame.EngineLib.createGameCircularDoublyLinkedListNode();
		
		myCollisions = [];
		myCollisionsRenderList = [];
		
		PRIVATE.accumulatedTime = 0;
		PRIVATE.timestep = 1;
	};
	
	//todo cleanup()
		
	var insertPhysicsObjectToTree = function(physicsObject)
	{
		myDetectionTree.walk(
			function(item)
			{
				if(ECGame.Settings.DEBUG && physicsObject === item)////////////////////TODO TEMP DEBUG CHECK?? or keep?
				{
					ECGame.log.error("Object collided with itself??");
					return;
				}
			
				var rect = physicsObject.AABB.getIntersection(item.AABB);
				if(rect.getArea() > 0)
				{
					myCollisions[myCollisions.length] =
					{
						myObj1:physicsObject,
						myObj2:item,
						AABB:rect
					};
				}
			},
			physicsObject.AABB
		);
		
		myDetectionTree.insertToAllBestFitting(physicsObject, physicsObject.myOwningNodes);
	};
	var removePhysicsObjectFromTree = function(physicsObject)
	{
		var nodeIndex;
		var nodeArray = physicsObject.myOwningNodes;

		for(nodeIndex in nodeArray)
		{
			nodeArray[nodeIndex].deleteItem(physicsObject);//todo optimize this to deleteItemFromNode
		}
		/*	
		myDetectionTree.walk(////////////////////TODO TEMP DEBUG CHECK?? or keep?
			function(item)
			{
				if(physicsObject === item)
				{
					ECGame.log.error("Object collided with itself??");
					
					for(nodeIndex in nodeArray)///////////////////////////////////
						nodeArray[nodeIndex].deleteItem(physicsObject);
					
					return;
				}
			}
			//,physicsObject.AABB
		);////////////////////TODO TEMP DEBUG CHECK?? or keep?
		*/
			
		physicsObject.myOwningNodes = [];
	};
	
	
	
	outGame2DPhysics.createNewPhysicsObject = function()
	{
		var physicsObject;
		var phyObjHandle;
		
		phyObjHandle = {};
		
		physicsObject = 
		{
			myStatus : STATUS__STATIC,
			myDensity : 1,
			myVelocity : ECGame.EngineLib.createGame2DPoint(),//todo requested/actual velocity?
			//myFriction:,??
			AABB : ECGame.EngineLib.createGame2DAABB(),//todo have lots of gamerects relative to a center??
			getAABB : function getAABB(){return this.AABB;},//TODO inherit ECGame.EngineLib.GameQuadTreeItem
			myOwningNodes : [],
			myID : 'PhysID' + (++myNextPhysicsID).toString(),//todo become just a number for serialization? (probably not serialized?)
			myHandle : phyObjHandle,
			myRegisteredActiveNode : ECGame.EngineLib.createGameCircularDoublyLinkedListNode(),
			getMass :
						function()
						{
							return this.myDensity * this.AABB.getArea();
						},
			myOwner : null
		};
		physicsObject.myRegisteredActiveNode.item = physicsObject;
		
		//TODO why keep this? to remove all objects later
		myPhysicsObjects[physicsObject.myID] = physicsObject;
		
		phyObjHandle.release = function()
		{
			this.setStatic();//removes from active list
			removePhysicsObjectFromTree(physicsObject);
			delete myPhysicsObjects[physicsObject.myID];
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
			myActivePhysicsObjects.insert(physicsObject.myRegisteredActiveNode);
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
				myActivePhysicsObjects.insert(physicsObject.myRegisteredActiveNode);
			}
			physicsObject.myStatus = STATUS__ALWAYS_ACTIVE;
		};
		
		//todo set inactive disabled (ie not in the tree at all)
		
		//todo setDensity/Mass
		
		//todo release
		
		phyObjHandle.setGame2DAABB = function(inGame2DAABB)
		{
			removePhysicsObjectFromTree(physicsObject);
			physicsObject.AABB.copyFrom(inGame2DAABB);
			insertPhysicsObjectToTree(physicsObject);
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
	};
	
	outGame2DPhysics.isUpdating = function()
	{
		return true;
	};
	
	//todo take inDeltaTime
	outGame2DPhysics.update = function(deltaTime)
	{
		var physicsObject;
		var node;
		var owner;
		
		var i;
		var loops;
		var collision;
		
		var rect;
		var timeStepDeltaTime;
		var movedThisFrame = {};
		
		PRIVATE.frameUpdateCount = 0;
		
		deltaTime = deltaTime || 1;
		
		PRIVATE.accumulatedTime += deltaTime;
		timeStepDeltaTime = PRIVATE.timestep / 1000;//TODO either proc the decimal part here or make it class var
		
		while(PRIVATE.accumulatedTime > 1)
		{
			PRIVATE.accumulatedTime -= PRIVATE.timestep;
			++PRIVATE.frameUpdateCount;
			
			//remove all the active nodes from the tree:
			node = myActivePhysicsObjects.myNext;
			while(node !== myActivePhysicsObjects)
			{
				physicsObject = node.item;
				removePhysicsObjectFromTree(physicsObject);			
				
				if(!movedThisFrame[physicsObject.myID])
				{
					movedThisFrame[physicsObject.myID] = physicsObject.AABB.getLeftTop();
				}
				
				node = node.myNext;
			}
			
			node = myActivePhysicsObjects.myNext;
			while(node !== myActivePhysicsObjects)
			{
				physicsObject = node.item;
				
				//move:
				rect = physicsObject.AABB;
				rect.setLeftTop(
					rect.getLeftTop().add(physicsObject.myVelocity.multiply(timeStepDeltaTime))
				);
				
				//apply friction:
				//physicsObject.myVelocity = physicsObject.myVelocity.multiply(0.75);//todo use a real friction value
				
				//detect collision
				insertPhysicsObjectToTree(physicsObject);
				
				node = node.myNext;
			}
			
			//resolveCollisions and activate any non static interacting objects
			loops = myCollisions.length;
			for(i = 0; i < loops; ++i)
			{
				collision = myCollisions[i];
				
				//wake it up:
				if(collision.myObj1.myStatus === STATUS__SLEEPING)
				{
					collision.myObj1.myHandle.setActive();
				}
				if(collision.myObj2.myStatus === STATUS__SLEEPING)
				{
					collision.myObj2.myHandle.setActive();
				}
				
				var obj1, obj2, objCenter, colCenter, direction, force, acceleration;
				obj1 = collision.myObj1;
				obj2 = collision.myObj2;
				colCenter = collision.AABB.getCenter();
				//TODO proper force PER direction??
				force = collision.AABB.getArea() / timeStepDeltaTime;//f = -kx
				
				if(obj1.myStatus !== STATUS__STATIC)
				{
					objCenter = obj1.AABB.getCenter();
					direction = objCenter.subtract(colCenter).unit();					
					acceleration = force / obj1.getMass();	//f=ma => a = f/m
					
					obj1.myVelocity = obj1.myVelocity.add(direction.multiply(acceleration));
				}
				if(obj2.myStatus !== STATUS__STATIC)
				{
					objCenter = obj2.AABB.getCenter();
					direction = objCenter.subtract(colCenter).unit();					
					acceleration = force / obj2.getMass();	//f=ma => a = f/m
					
					obj2.myVelocity = obj2.myVelocity.add(direction.multiply(acceleration));
				}
			}
			
			//remember collisions for rendering:
			myCollisionsRenderList = myCollisions;
			
			//clear collisions:
			myCollisions = [];
						
			//sleep if not moving
			node = myActivePhysicsObjects.myNext;
			while(node !== myActivePhysicsObjects)
			{
				physicsObject = node.item;
				node = node.myNext;

				if(physicsObject.myStatus === STATUS__ACTIVE 
					&& Math.abs(physicsObject.myVelocity.myX) < 0.1 
					&& Math.abs(physicsObject.myVelocity.myY) < 0.1)
				{
					//set sleeping:
					physicsObject.myVelocity = ECGame.EngineLib.createGame2DPoint();					
					physicsObject.myStatus = STATUS__SLEEPING;
					physicsObject.myRegisteredActiveNode.remove();
				}
			}
		}
		
		for(i in movedThisFrame)
		{
			//TODO if !hasownedproperty, etc continue
			physicsObject = myPhysicsObjects[i];
			physicsObject.myVelocity =	//TODO isnt this one proper??
				physicsObject.AABB.getLeftTop().subtract(movedThisFrame[i]).multiply(1000 / deltaTime);
			owner = physicsObject.myOwner;
			if(owner && owner.onPhysObjectUpdate)
			{
				owner.onPhysObjectUpdate(
					{
						position : physicsObject.AABB.getCenter(),
						velocity : physicsObject.myVelocity,//TODO send clones? these maybe messed up by users
						boundingRect : physicsObject.AABB//TODO send clones? these maybe messed up by users
					}
				);
			}
		}
		
		//todo only sometimes?? or remove need for it with parent pointers <==
		myDetectionTree.cleanTree();
	};
	
	
	
	//todo debug draw tree
	outGame2DPhysics.debugDraw = function(inCanvas2DContext, inCameraRect)
	{
		var i;
		var collisionRect;
		var loops;
		var physicsObject;
		var node;
		
		ECGame.instance.graphics.drawDebugText("Debug Drawing Physics");
		ECGame.instance.graphics.drawDebugText("Frame Update Count:" + PRIVATE.frameUpdateCount);
		//todo print (and notify) collisions this frame
		
		//walk:
		//	static - black
		//	sleeping - blue
		//	active - bluegreen
		//	alwaysActive - green
		//	collisions - red
		
		myDetectionTree.walk(
			function(item)
			{
				switch(item.myStatus)
				{
					case STATUS__STATIC ://black
						inCanvas2DContext.fillStyle = 'rgba(0, 0, 0, 1)';
						break;
					case STATUS__SLEEPING://blue
						inCanvas2DContext.fillStyle = 'rgba(0, 0, 255, 1)';
						break;
					case STATUS__ACTIVE://blue green
						inCanvas2DContext.fillStyle = 'rgba(0, 180, 180, 1)';
						break;
					case STATUS__ALWAYS_ACTIVE://green
						inCanvas2DContext.fillStyle = 'rgba(0, 128, 0, 1)';
						break;
					default://WTF?
						inCanvas2DContext.fillStyle = 'rgba(255, 0, 255, 1)';
						break;
				}
				inCanvas2DContext.fillRect(
					item.AABB.myX - inCameraRect.myX,
					item.AABB.myY - inCameraRect.myY,
					item.AABB.myWidth,
					item.AABB.myHeight
				);
			},
			inCameraRect
		);
		
		myDetectionTree.debugDraw(inCanvas2DContext, inCameraRect);//todo 3 colors here from settings
		
		//draw collisions
		inCanvas2DContext.fillStyle = 'rgba(255, 0, 0, 1)';
		for(i in myCollisionsRenderList)
		{
			collisionRect = myCollisionsRenderList[i].AABB;
			if(collisionRect.intersectsRect(inCameraRect))
			{
				inCanvas2DContext.fillRect(
					collisionRect.myX - inCameraRect.myX,
					collisionRect.myY - inCameraRect.myY,
					collisionRect.myWidth,
					collisionRect.myHeight
				);
			}
		}
		
		//mark the active ones
		inCanvas2DContext.strokeStyle = 'rgba(0, 255, 0, 1)';
		node = myActivePhysicsObjects.myNext;
		while(node !== myActivePhysicsObjects)
		{
			physicsObject = node.item;
			inCanvas2DContext.strokeRect(
				physicsObject.AABB.myX - inCameraRect.myX,
				physicsObject.AABB.myY - inCameraRect.myY,
				physicsObject.AABB.myWidth,
				physicsObject.AABB.myHeight
			);
			node = node.myNext;
		}
	};
	
		
	
	return outGame2DPhysics;
};