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

ECGame.EngineLib.EntityComponent_Sprite = ECGame.EngineLib.Class.create(
{
	Constructor : function EntityComponent_Sprite()
	{
		var anAssetManager
			,anAngle
			;
		
		//call parent constructor
		this.EntityComponent();
		
		//create animation instance
		this._myAnimationInstance = new ECGame.EngineLib.Animation2DInstance();
		
		//load all the animations:
		anAssetManager = ECGame.instance.getAssetManager();
		this._myAnimations =
		[
			anAssetManager.loadAnimation("Run_Right")
			,anAssetManager.loadAnimation("Run_RightDown")
			,anAssetManager.loadAnimation("Run_Down")
			,anAssetManager.loadAnimation("Run_LeftDown")
			,anAssetManager.loadAnimation("Run_Left")
			,anAssetManager.loadAnimation("Run_LeftUp")
			,anAssetManager.loadAnimation("Run_Up")
			,anAssetManager.loadAnimation("Run_UpRight")
			,anAssetManager.loadAnimation("Facing_Right")
			,anAssetManager.loadAnimation("Facing_RightDown")
			,anAssetManager.loadAnimation("Facing_Down")
			,anAssetManager.loadAnimation("Facing_LeftDown")
			,anAssetManager.loadAnimation("Facing_Left")
			,anAssetManager.loadAnimation("Facing_LeftUp")
			,anAssetManager.loadAnimation("Facing_Up")
			,anAssetManager.loadAnimation("Facing_UpRight")
		];
		
		//set the starting animation to idle facing right
		this._myCurrentAnimation = 8;
		this._myAnimationInstance.setAnimation(this._myAnimations[this._myCurrentAnimation]);
		
		//compute possible directions
		anAngle = 0;
		this._myDirections =
		[
			new ECGame.EngineLib.Point2D(Math.cos(anAngle), Math.sin(anAngle)),
			new ECGame.EngineLib.Point2D(Math.cos(anAngle+=2*Math.PI/8), Math.sin(anAngle)),
			new ECGame.EngineLib.Point2D(Math.cos(anAngle+=2*Math.PI/8), Math.sin(anAngle)),
			new ECGame.EngineLib.Point2D(Math.cos(anAngle+=2*Math.PI/8), Math.sin(anAngle)),
			new ECGame.EngineLib.Point2D(Math.cos(anAngle+=2*Math.PI/8), Math.sin(anAngle)),
			new ECGame.EngineLib.Point2D(Math.cos(anAngle+=2*Math.PI/8), Math.sin(anAngle)),
			new ECGame.EngineLib.Point2D(Math.cos(anAngle+=2*Math.PI/8), Math.sin(anAngle)),
			new ECGame.EngineLib.Point2D(Math.cos(anAngle+=2*Math.PI/8), Math.sin(anAngle))
		];

		this._myAnimationInstance._myDepth = 1;		//HACK ALSO??
	},
	
	Parents : [ECGame.EngineLib.EntityComponent],
	
	flags : {},
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		update : function update(inUpdateData)
		{
			var aFrameEvents, i;
			
			aFrameEvents = this._myAnimationInstance.update(inUpdateData);
			if(aFrameEvents)
			{
				for(i = 0; i < aFrameEvents.length; ++i)
				{
					this._myOwningEntity.onEvent(aFrameEvents[i]);
				}
			}
		},

		onAddedToEntity : function onAddedToEntity(/*inEvent*/)
		{
			var owner = this._myOwningEntity;//inEvent.entity;
			
			//register for events
			owner.registerListener('UpdatedPhysicsStatus', this);
			owner.registerListener('EntityAddedToWorld', this);
			owner.registerListener('EntityRemovedFromWorld', this);
			//TODO owner.event(getposition, myPos);??
		},

		onRemovedFromEntity : function()
		{
			var owner = this._myOwningEntity;//inEvent.entity;
			
			//unregister for events
			owner.deregisterListener('UpdatedPhysicsStatus', this);
			owner.deregisterListener('EntityAddedToWorld', this);
			owner.deregisterListener('EntityRemovedFromWorld', this);
		},

		onUpdatedPhysicsStatus : function onUpdatedPhysicsStatus(inEvent)
		{
			var i
				,anAnimProbibility
				,aBestAnimProb
				,aDirection
				;
				
			if(this._myWorld)
			{
				this._myWorld.getSceneGraph().removeItem(this._myAnimationInstance);
			}
			
			this._myAnimationInstance._myAnchorPosition = inEvent.boundingRect.getLeftTop();//inEvent.position;
			
			if(inEvent.velocity.length() < 0.9)
			{
				if(this._myCurrentAnimation < 8)
				{
					this._myCurrentAnimation += 8;
				}
			}
			else
			{
				aDirection = inEvent.velocity.unit();
				anAnimProbibility = 0;
				aBestAnimProb = 0;
				for(i = 0; i < 8; ++i)
				{
					anAnimProbibility = this._myDirections[i].dot(aDirection);
					if(anAnimProbibility > aBestAnimProb)
					{
						aBestAnimProb = anAnimProbibility;
						this._myCurrentAnimation = i;
					}
				}
			}
			this._myAnimationInstance.setAnimation(this._myAnimations[this._myCurrentAnimation]);
			
			if(this._myWorld)
			{
				this._myWorld.getSceneGraph().insertItem(this._myAnimationInstance);
			}
		},

		onEntityAddedToWorld : function onEntityAddedToWorld(inEvent)
		{
			this._myWorld = inEvent.world;
			this._myWorld.getSceneGraph().insertItem(this._myAnimationInstance);
			ECGame.instance.getUpdater("SpritesUpdater").addUpdate(this);
		},

		onEntityRemovedFromWorld : function onEntityRemovedFromWorld(/*inEvent*/)
		{
			this._myWorld.getSceneGraph().removeItem(this._myAnimationInstance);
			this._myWorld = null;
			ECGame.instance.getUpdater("SpritesUpdater").removeUpdate(this);
		},
		
		//set<classname>NetDirty
		clearNetDirty : function clearNetDirty(){return;},
		postSerialize : function postSerialize(){return;},
		
		cleanup : function cleanup(){return;},
		serialize : function serialize(){return;},
		
		copyFrom : function copyFrom(inOther)
		{
			this._myAnimations = inOther._myAnimations;
			this._myCurrentAnimation = inOther._myCurrentAnimation;
			
			this._myAnimationInstance = new ECGame.EngineLib.Animation2DInstance();
			this._myAnimationInstance.setAnimation(this._myAnimations[0]);
			this._myAnimationInstance._myDepth = inOther._myAnimationInstance._myDepth;
		}
	}
});