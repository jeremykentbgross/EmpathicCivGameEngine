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



//TODO
//fix update (events)?? zero update time? etc..
//create + release/destroy/?? + de/register + systems objectmap
//file split including events



//TODO extract colidable parent class for trigger/solid/parent/etc
ECGame.EngineLib.PhysicsObject2D = ECGame.EngineLib.Class.create({
	Constructor : function PhysicsObject2D()
	{
		this.QuadTreeItem(ECGame.EngineLib.AABB2D.create());

		this._myPhysicsSystem = null;
		this._myOwner = null;

		//active, inactive, sleeping, static, etc
		this._myStatus = null;
		this._myActiveLinkedListNode = null;

		//TODO hold last position instead and derive?
		this._myVelocity = null;

		//solid only properties:
		this._myDensity = null;

		//TODO visible, opaque and other flags!

		this._myMode = null;//trigger or solid

		//trigger only properties:
		this._myHighResolutionTouchEvents = false;
		this._myPreviousIntersectingMap = null;
		this._myCurrentIntersectingMap = null;
		this._myPreviousContainingMap = null;
		this._myCurrentContainingMap = null;

		this.myFlags = {};
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
		STATUS__INACTIVE : 4,

		//Physics Object Mode constants:
		MODE__SOLID : 0,
		MODE__TRIGGER : 1,

		init : function init(inPhysicsSystem)
		{
			//note: don't need to call parent.init() in this case

			this._myPhysicsSystem = inPhysicsSystem;
			this._myOwner = null;

			this._myStatus = this.PhysicsObject2D.STATUS__STATIC;
			this._myActiveLinkedListNode = ECGame.EngineLib.LinkedListNode.create(this);

			this._myVelocity = ECGame.EngineLib.Point2D.create();

			this._myDensity = 1;

			//TODO don't access this private
			inPhysicsSystem._myObjectsMap[this.getID()] = this;

			this._myMode = this.PhysicsObject2D.MODE__SOLID;

			this._myPreviousIntersectingMap = [];
			this._myCurrentIntersectingMap = [];
			this._myPreviousContainingMap = [];
			this._myCurrentContainingMap = [];
		},

		setFlag : function setFlag(inName, inValue)
		{
			this.myFlags[inName] = inValue;
		},
		getFlag : function getFlag(inName)
		{
			return this.myFlags[inName];
		},

		//called by the physics system when the object is NOT in the tree
		//	Note: this directly manipulates the AABB because the setAABB function removes+adds to tree.
		_update : function _update(inTimeStepInSeconds)
		{
			this._myAABB.setLeftTop(
				this._myAABB.getLeftTop().add(this._myVelocity.scale(inTimeStepInSeconds))
			);

			//apply friction?? (don't think his is the right way anyway):
			//aPhysicsObject._myVelocity = aPhysicsObject._myVelocity.scale(0.75);//TODO use a real friction value
		},

		_finishFrameUpdate : function _finishFrameUpdate()
		{
			//generate frame physics events:

			if(this.isTrigger())
			{
				this._notifyTriggerIntersecting();
			}

			if(this._myOwner)
			{
				this._myOwner.onEvent(
					new ECGame.EngineLib.Events.PhysicsObjectUpdated(
						this._myAABB.getCenter(),
						this._myVelocity.clone(),
						this._myAABB.clone()
					)
				);
			}
		},

		setSolid : function setSolid()
		{
			this._myMode = this.PhysicsObject2D.MODE__SOLID;
		},
		isSolid : function isSolid()
		{
			return this._myMode === this.PhysicsObject2D.MODE__SOLID;
		},
		setTrigger : function setTrigger()
		{
			this._myMode = this.PhysicsObject2D.MODE__TRIGGER;
			this.setActive();
		},
		isTrigger : function isTrigger()
		{
			return this._myMode === this.PhysicsObject2D.MODE__TRIGGER;
		},
		
		getMass : function getMass()
		{
			return this._myDensity * this._myAABB.getArea();
		},
		
		release : function release()	//TODO names: create/destroy init/clean ??/release
		{
			this.setStatic();//removes from active list
			this._myPhysicsSystem._removePhysicsObjectFromTree(this);
			delete this._myPhysicsSystem._myObjectsMap[this.getID()];

			//trigger stop touching all and all exit trigger
			if(this.isTrigger())
			{
				this._resetCurrentTriggerIntersecting();
			}
		},
				
		setStatic : function setStatic()
		{
			if(this._myStatus === this.PhysicsObject2D.STATUS__INACTIVE)
			{
				this._myPhysicsSystem._insertPhysicsObjectToTree(this);
			}
			if(this._myStatus === this.PhysicsObject2D.STATUS__ACTIVE
				|| this._myStatus === this.PhysicsObject2D.STATUS__ALWAYS_ACTIVE)
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
			if(this._myStatus === this.PhysicsObject2D.STATUS__INACTIVE)
			{
				this._myPhysicsSystem._insertPhysicsObjectToTree(this);
			}
			if(this._myStatus === this.PhysicsObject2D.STATUS__ACTIVE)
			{
				//set sleeping:
				this._myStatus = this.PhysicsObject2D.STATUS__SLEEPING;
				this._myVelocity.set(0, 0);
				this._myActiveLinkedListNode.remove();
			}
		},
		isSleeping : function isSleeping()
		{
			return this._myStatus === this.PhysicsObject2D.STATUS__SLEEPING;
		},
		canSleep: function canSleep()
		{
			return (
				this.isActive()
				&& Math.abs(this._myVelocity.myX) < 1.0 
				&& Math.abs(this._myVelocity.myY) < 1.0
				&& !this._isTriggerIntersecting()
			);
		},
		
		setActive : function setActive()
		{
			if(this._myStatus === this.PhysicsObject2D.STATUS__INACTIVE)
			{
				this._myPhysicsSystem._insertPhysicsObjectToTree(this);
			}
			if(this._myStatus === this.PhysicsObject2D.STATUS__ACTIVE
				|| this._myStatus === this.PhysicsObject2D.STATUS__ALWAYS_ACTIVE)
			{
				return;
			}
			this._myPhysicsSystem._myActiveObjectsList.insertNode_ListFront(this._myActiveLinkedListNode);
			this._myStatus = this.PhysicsObject2D.STATUS__ACTIVE;
		},
		isActive : function isActive()
		{
			return this._myStatus === this.PhysicsObject2D.STATUS__ACTIVE;//TODO or always active??
		},
		
		setAlwaysActive : function setAlwaysActive()
		{
			if(this._myStatus === this.PhysicsObject2D.STATUS__INACTIVE)
			{
				this._myPhysicsSystem._insertPhysicsObjectToTree(this);
			}
			if(this._myStatus === this.PhysicsObject2D.STATUS__ALWAYS_ACTIVE)
			{
				return;
			}
			if(this._myStatus !== this.PhysicsObject2D.STATUS__ACTIVE)
			{
				this._myPhysicsSystem._myActiveObjectsList.insertNode_ListFront(this._myActiveLinkedListNode);
			}
			this._myStatus = this.PhysicsObject2D.STATUS__ALWAYS_ACTIVE;
		},
		isAlwaysActive : function isAlwaysActive()
		{
			return this._myStatus === this.PhysicsObject2D.STATUS__ALWAYS_ACTIVE;
		},

		setInactive: function setInactive()
		{
			if(this._myStatus !== this.PhysicsObject2D.STATUS__INACTIVE)
			{
				this._myPhysicsSystem._removePhysicsObjectFromTree(this);
			}
			if(this._myStatus === this.PhysicsObject2D.STATUS__ACTIVE
				|| this._myStatus === this.PhysicsObject2D.STATUS__ALWAYS_ACTIVE)
			{
				this._myActiveLinkedListNode.remove();
			}
			this._myStatus = this.PhysicsObject2D.STATUS__INACTIVE;
		},
		isInactive: function isInactive()
		{
			return this._myStatus === this.PhysicsObject2D.STATUS__INACTIVE;
		},
				
		setAABB : function setAABB(inAABB)
		{
			this._myPhysicsSystem._removePhysicsObjectFromTree(this);
			this._myAABB.copyFrom(inAABB);
			if(this._myStatus !== this.PhysicsObject2D.STATUS__INACTIVE)
			{
				this._myPhysicsSystem._insertPhysicsObjectToTree(this);
			}
		},
		
		requestVelocity : function requestVelocity(inVelocity)
		{
			this._myVelocity.copyFrom(inVelocity);
			if(this._myVelocity.getLengthSquared() > 0.01)
			{
				this.setActive();
			}
		},
		
		getOwner : function getOwner()
		{
			return this._myOwner;
		},
		setOwner : function setOwner(inOwner)
		{
			this._myOwner = inOwner;
		},

		_addTriggerIntersecting : function _addTriggerIntersecting(inOther, inCollision)
		{
			if(!this._myPreviousIntersectingMap[inOther.getID()])
			{
				if(ECGame.Settings.isDebugPrint_Physics())
				{
					console.log('Trigger start touching');
				}
				if(this._myOwner)
				{
					this._myOwner.onEvent(
						ECGame.EngineLib.Events.TriggerStartTouching.create(
							this,
							inOther,
							inCollision.myAABB.clone()
						)
					);
				}
			}
			
			this._myCurrentIntersectingMap[inOther.getID()] = inOther;

			if(this._myHighResolutionTouchEvents)
			{
				if(ECGame.Settings.isDebugPrint_Physics())
				{
					console.log('Trigger touching (hires!)');
				}
				if(this._myOwner)
				{
					this._myOwner.onEvent(
						ECGame.EngineLib.Events.TriggerTouching.create(
							this,
							inOther,
							inCollision.myAABB.clone()
						)
					);
				}
			}

			if(this.getAABB2D().containsAABB2D(inOther.getAABB2D()))
			{
				this._myCurrentContainingMap[inOther.getID()] = inOther;
				if(!this._myPreviousContainingMap[inOther.getID()])
				{
					if(ECGame.Settings.isDebugPrint_Physics())
					{
						console.log('Trigger entered');
					}
					if(this._myOwner)
					{
						this._myOwner.onEvent(
							ECGame.EngineLib.Events.TriggerEntered.create(
								this,
								inOther
							)
						);
					}
				}
			}
		},
		_isTriggerIntersecting : function _isTriggerIntersecting()
		{
			return Object.keys(this._myCurrentIntersectingMap).length !== 0;
		},
		_notifyTriggerIntersecting : function _notifyTriggerIntersecting()
		{
			var i
				;

			//don't generate events here for frame, they already happened
			if(this._myHighResolutionTouchEvents)
			{
				return;
			}

			//use 'previous' because they were already swapped to previous for this frame
			for(i in this._myPreviousIntersectingMap)
			{
				if(ECGame.Settings.isDebugPrint_Physics())
				{
					console.log('Trigger touching');
				}
				if(this._myOwner)
				{
					this._myOwner.onEvent(
						ECGame.EngineLib.Events.TriggerTouching.create(
							this,
							this._myPreviousIntersectingMap[i],
							this.getAABB2D()
								.getIntersection(
									this._myPreviousIntersectingMap[i].getAABB2D()
								)
						)
					);
				}
			}
		},
		_resetCurrentTriggerIntersecting : function _resetCurrentTriggerIntersecting()
		{
			var aPreviousIntersectingList
				,aPreviouslyContainedList
				,aPreviousKey
				,aCurrentIntersectingMap
				,aCurrentContainingMap
				,i
				;

			aPreviousIntersectingList = Object.keys(this._myPreviousIntersectingMap);
			aPreviouslyContainedList = Object.keys(this._myPreviousContainingMap);
			aCurrentIntersectingMap = this._myCurrentIntersectingMap;
			aCurrentContainingMap = this._myCurrentContainingMap;

			for(i = 0; i < aPreviouslyContainedList.length; ++i)
			{
				aPreviousKey = aPreviouslyContainedList[i];

				//if this was previously contained, and it is still intersecting,
				//	consider it still contained (because it hasn't left yet):
				if(aCurrentIntersectingMap[aPreviousKey])
				{
					aCurrentContainingMap[aPreviousKey]
						= aCurrentIntersectingMap[aPreviousKey];
				}
				//otherwise it left!
				else//if(!aCurrentContainingMap[aPreviousKey])
				{
					if(ECGame.Settings.isDebugPrint_Physics())
					{
						console.log('Trigger left');
					}
					if(this._myOwner)
					{
						this._myOwner.onEvent(
							ECGame.EngineLib.Events.TriggerLeft.create(
								this,
								this._myPreviousContainingMap[aPreviousKey]
							)
						);
					}
				}
			}

			for(i = 0; i < aPreviousIntersectingList.length; ++i)
			{
				aPreviousKey = aPreviousIntersectingList[i];
				if(!aCurrentIntersectingMap[aPreviousKey])
				{
					if(ECGame.Settings.isDebugPrint_Physics())
					{
						console.log('Trigger stopped touching');
					}
					if(this._myOwner)
					{
						this._myOwner.onEvent(
							ECGame.EngineLib.Events.TriggerStoppedTouching.create(
								this,
								this._myPreviousIntersectingMap[aPreviousKey]
							)
						);
					}
				}
			}

			this._myPreviousIntersectingMap = this._myCurrentIntersectingMap;
			this._myCurrentIntersectingMap = [];
			this._myPreviousContainingMap = this._myCurrentContainingMap;
			this._myCurrentContainingMap = [];
		},

		resolveCollisionWithObject : function resolveCollisionWithObject(inOtherObject, inCollision)
		{
			var aCenter
				,aDirection
				,anAcceleration
				;

			if(this.isStatic())
			{
				return;
			}
			if(this.isSleeping())
			{
				this.setActive();
			}
			if(inOtherObject.isSolid())
			{
				if(this.isSolid())
				{
					//note: this is not perfectly correct for impulse direction I think
					aCenter = this._myAABB.getCenter();
					aDirection = aCenter.subtract(inCollision.myCenter).unit();
					anAcceleration = inCollision.myForce / this.getMass();	//f=ma => a = f/m
					this._myVelocity = this._myVelocity.add(aDirection.scale(anAcceleration));
				}
				//note: may want to allow trigger vs statics with flag?
				if(this.isTrigger() && !inOtherObject.isStatic())
				{
					this._addTriggerIntersecting(inOtherObject, inCollision);
				}
			}
		},
		
		debugDraw : function debugDraw(inGraphics)
		{
			//Defaults are:
			//	static - black
			//	sleeping - blue
			//	active - bluegreen
			//	alwaysActive - green
			//	collisions - red
			//TODO diff for triggers
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
					console.assert(false, "Unknown Physics object status!");
					inGraphics.setFillStyle('rgba(255, 0, 255, 1)');//TODO needed??
					break;
			}
			inGraphics.fillRect(this._myAABB);
		}
	}
});



ECGame.EngineLib.Physics2DCollision = ECGame.EngineLib.Class.create({
	Constructor : function Physics2DCollision()
	{
		//the objects in this collision:
		this.myObject1 = null;
		this.myObject2 = null;

		//the broad intersection of these objects
		this.myAABB = null;

		this.myCenter = null;
		this.myForce = null;
	},
	Parents : [],
	flags : {},

	ChainUp : [],
	ChainDown : [],

	Definition :
	{
		init : function init(inObject1, inObject2)
		{
			this.myObject1 = inObject1;
			this.myObject2 = inObject2;
		}

		,resolveCollision : function resolveCollision(inTimeStepInSeconds)
		{
			this.myAABB = this.myObject1.getAABB2D().getIntersection(this.myObject2.getAABB2D());
			this.myCenter = this.myAABB.getCenter();

			//TODO proper force PER direction??
			this.myForce = this.myAABB.getArea() / inTimeStepInSeconds;	//f = -kx

			this.myObject1.resolveCollisionWithObject(this.myObject2, this);
			this.myObject2.resolveCollisionWithObject(this.myObject1, this);
		}

		/*,debugDraw : function debugDraw(inGraphics)
		{
		}*/
	}
});



//TODO extract out ColisionDetection parent class
ECGame.EngineLib.Physics2D = ECGame.EngineLib.Class.create({
	Constructor : function Physics2D()
	{
		this._myDetectionTree = null;
		this._myObjectsMap = null;	//TODO cleanup, needed?	

		this._myActiveObjectsList = null;

		this._myCollisionsMap = null;
		this._myCollisionsList = null;
		this._myCollisionsRenderList = null;
		
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
			
			this._myObjectsMap = [];
			
			this._myActiveObjectsList = ECGame.EngineLib.LinkedListNode.create();

			this._myCollisionsMap = [];
			this._myCollisionsList = [];
			this._myCollisionsRenderList = [];
			
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
					var anAABB
						,aCollision
						;
					
					console.assert(inPhysicsObject !== inItem, "Object collided with itself??");

					anAABB = inPhysicsObject._myAABB.getIntersection(inItem._myAABB);
					if(anAABB.getArea() > 0)
					{
						//we want to ignore collision repeats from tree walk and keep only latest one:
						aThis._myCollisionsMap[inPhysicsObject.getID()]
							= aThis._myCollisionsMap[inPhysicsObject.getID()] || [];
						aThis._myCollisionsMap[inItem.getID()]
							= aThis._myCollisionsMap[inItem.getID()] || [];

						aCollision = aThis._myCollisionsMap[inPhysicsObject.getID()][inItem.getID()];
						if(aCollision)
						{
							return;
						}

						//note: maybe good to create a collision object type later
						aCollision = ECGame.EngineLib.Physics2DCollision.create(inPhysicsObject, inItem);
						aThis._myCollisionsList.push(aCollision);

						aThis._myCollisionsMap[inPhysicsObject.getID()][inItem.getID()] = aCollision;
						aThis._myCollisionsMap[inItem.getID()][inPhysicsObject.getID()] = aCollision;
					}
				},
				inPhysicsObject._myAABB
			);
			
			this._myDetectionTree.insertToAllBestFitting(inPhysicsObject);
		},
		
		_removePhysicsObjectFromTree : function _removePhysicsObjectFromTree(inPhysicsObject)
		{
			inPhysicsObject.removeFromQuadTree();
		},
		
		createNewPhysicsObject : function createNewPhysicsObject()//TODO remove this?? or rename!
		{
			return ECGame.EngineLib.PhysicsObject2D.create(this);
		},

		update : function update(inUpdateData)
		{
			var aPhysicsObject
				,aCurrentNode
				,aMovedObjectsStartingTopLeft	//note: this may need to be center if the AABB changes size
				,aDeltaTime
				,i
				;
				
			aMovedObjectsStartingTopLeft = {};
			
			this._myFrameUpdateCount = 0;
			
			aDeltaTime = inUpdateData.myAverageDeltaTime || 1;//TODO needed??
			
			this._myAccumulatedTime += aDeltaTime;
			
			this._myCollisionsRenderList = [];
			
			while(this._myAccumulatedTime > 1)
			{
				//update accumulation:
				this._myAccumulatedTime -= this._myTimeStepInMilliSeconds;
				++this._myFrameUpdateCount;
				
				//remove all the active nodes from the tree:
				aCurrentNode = this._myActiveObjectsList.myNext;
				while(aCurrentNode !== this._myActiveObjectsList)
				{
					aPhysicsObject = aCurrentNode.myItem;
					this._removePhysicsObjectFromTree(aPhysicsObject);			
					
					//remember the first location from which this object was active for this frame
					if(!aMovedObjectsStartingTopLeft[aPhysicsObject.getID()])
					{
						aMovedObjectsStartingTopLeft[aPhysicsObject.getID()] = aPhysicsObject._myAABB.getLeftTop();
					}
					
					aCurrentNode = aCurrentNode.myNext;
				}
				
				//move all the active objects and see where they collide
				aCurrentNode = this._myActiveObjectsList.myNext;
				while(aCurrentNode !== this._myActiveObjectsList)
				{
					aPhysicsObject = aCurrentNode.myItem;
					
					//move:
					aPhysicsObject._update(this._myTimeStepInSeconds);
					
					//detect collision
					this._insertPhysicsObjectToTree(aPhysicsObject);
					
					aCurrentNode = aCurrentNode.myNext;
				}

				//reset collision map which prevents multiple collisions per pair,
				//	such as in certain cases of tree walking, or multiple network packets in one frame
				this._myCollisionsMap = [];
				
				//resolveCollisions
				for(i = 0; i < this._myCollisionsList.length; ++i)
				{
					this._myCollisionsList[i].resolveCollision(this._myTimeStepInSeconds);
				}
				
				//remember collisions for rendering:
				if(ECGame.Settings.isDebugDraw_Physics())
				{
					//note: only draws latest ones, all 4 frame would be confusing to see but done with
					//	this._myCollisionsRenderList.concat(this._myCollisionsList);
					this._myCollisionsRenderList = this._myCollisionsList;
				}
				
				//clear collisions list:
				this._myCollisionsList = [];
							
				//sleep all that can, and cleanup intersecting.................: (something wrong here?)
				aCurrentNode = this._myActiveObjectsList.myNext;
				while(aCurrentNode !== this._myActiveObjectsList)
				{
					aPhysicsObject = aCurrentNode.myItem;
					aCurrentNode = aCurrentNode.myNext;

					if(aPhysicsObject.canSleep())
					{
						aPhysicsObject._setSleeping();
					}
					aPhysicsObject._resetCurrentTriggerIntersecting();//..... (something wrong here?)
				}
			}

			//handle post integration update stuff
			for(i in aMovedObjectsStartingTopLeft)
			{
				aPhysicsObject = this._myObjectsMap[i];

				//update velocity to reflect frame movement:
				aPhysicsObject._myVelocity = aPhysicsObject._myAABB.getLeftTop()
					.subtract(aMovedObjectsStartingTopLeft[i]).scale(1000 / aDeltaTime);

				aPhysicsObject._finishFrameUpdate();
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

			aCameraRect = inGraphics.getCamera2D().getCaptureVolumeAABB2D();
			
			//make a map of them and draw them.
			//	Note: The map will automatically filter the object from being drawn
			//	more than once if it is in more than one node
			aListToDraw = {};
			this._myDetectionTree.walk(
				function addToRenderMap(inItem)
				{
					aListToDraw[inItem.getID()] = inItem;
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
			//	note: this should not be the whole active list should it???
			inGraphics.setStrokeStyle(ECGame.Settings.Debug.Physics_ActiveObjectBorder_DrawColor);
			aCurrentNode = this._myActiveObjectsList.myNext;
			while(aCurrentNode !== this._myActiveObjectsList)
			{
				aPhysicsObject = aCurrentNode.myItem;
				inGraphics.strokeRect(aPhysicsObject._myAABB);
				aCurrentNode = aCurrentNode.myNext;
			}
		}
		
	}
});
