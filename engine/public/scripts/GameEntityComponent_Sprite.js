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
		this.GameEntityComponent();
		
		this._position = ECGame.EngineLib.Point2D.create();//TODO this isn't used, but shouldn't use topleft of aabb either
		
		this._animations = ECGame.instance._myGameRules._myAnimations;//HACK!!!!!//TODO 'null'/default object!! (object ref?)
		this._currentAnimation = 8;//TODO why 8?
		this._myAnimationInstance = new ECGame.EngineLib.Animation2DInstance();
/*TODO should be commented out?*/this._myAnimationInstance.setAnimation(this._animations[0]);//TODO should be a null/default object
		this._myAnimationInstance._myLayer = 1;		//HACK ALSO??
		
		//TODO frame knows filename, offset, collision rects, (sound?) events, etc //TODO move this note to the frame class?
		//TODO ^^^ same kind of thing for map tiles?
	},
	
	Parents : [ECGame.EngineLib.GameEntityComponent],
	
	flags : {},
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		init : function init(inAnimations)
		{
			this._animations = inAnimations;
			this._myAnimationInstance.setAnimation(this._animations[0]);
		},
		
		getUpdatePriority : function getUpdatePriority()//TODO move to GameObject?
		{
			return this.getID();
		},
		update : function update(inUpdateData)
		{
			var aFrameEvents, i;
			
			aFrameEvents = this._myAnimationInstance.update(inUpdateData);
			if(aFrameEvents)
			{
				for(i = 0; i < aFrameEvents.length; ++i)
				{
					this._myOwner.onEvent(aFrameEvents[i]);
				}
			}
		},

		onAddedToEntity : function onAddedToEntity(/*inEvent*/)
		{
			var owner = this._myOwner;//inEvent.entity;
			
			//register for events
			owner.registerListener('UpdatedPhysicsStatus', this);
			owner.registerListener('EntityAddedToWorld', this);
			owner.registerListener('EntityRemovedFromWorld', this);
			
			//TODO owner.event(getposition, myPos);
			//todo add to scene graph
		},

		onRemovedFromEntity : function()
		{
			var owner = this._myOwner;//inEvent.entity;
			
			//unregister for events
			owner.deregisterListener('UpdatedPhysicsStatus', this);
			owner.deregisterListener('EntityAddedToWorld', this);
			owner.deregisterListener('EntityRemovedFromWorld', this);
			
			//todo remove from scenegraph
			
			//this._myOwner = null;
		},

		onUpdatedPhysicsStatus : function onUpdatedPhysicsStatus(inEvent)
		{
			var i
				,anAnimProbibility
				,aBestAnimProb
				,aDirection
				,angle
				,aDirections
				;
				
			if(this._myWorld)
			{
				this._myWorld.getSceneGraph().removeItem(this._myAnimationInstance);
			}
			
			this._position = inEvent.position;
			this._myAnimationInstance._myAnchorPosition = inEvent.boundingRect.getLeftTop();//inEvent.position;
			
			if(inEvent.velocity.length() < 0.9)
			{
				if(this._currentAnimation < 8)
				{
					this._currentAnimation += 8;
				}
				this._myAnimationInstance.setAnimation(this._animations[this._currentAnimation]);
			}
			else
			{
				aDirection = inEvent.velocity.unit();
				angle = 0;
				aDirections =	//TODO these should be class constants
				[
					new ECGame.EngineLib.Point2D(Math.cos(angle), Math.sin(angle)),
					new ECGame.EngineLib.Point2D(Math.cos(angle+=2*Math.PI/8), Math.sin(angle)),
					new ECGame.EngineLib.Point2D(Math.cos(angle+=2*Math.PI/8), Math.sin(angle)),
					new ECGame.EngineLib.Point2D(Math.cos(angle+=2*Math.PI/8), Math.sin(angle)),
					new ECGame.EngineLib.Point2D(Math.cos(angle+=2*Math.PI/8), Math.sin(angle)),
					new ECGame.EngineLib.Point2D(Math.cos(angle+=2*Math.PI/8), Math.sin(angle)),
					new ECGame.EngineLib.Point2D(Math.cos(angle+=2*Math.PI/8), Math.sin(angle)),
					new ECGame.EngineLib.Point2D(Math.cos(angle+=2*Math.PI/8), Math.sin(angle))//,
				];
				anAnimProbibility = 0;
				aBestAnimProb = 0;
				for(i = 0; i < 8; ++i)
				{
					anAnimProbibility = aDirections[i].dot(aDirection);
					if(anAnimProbibility > aBestAnimProb)
					{
						aBestAnimProb = anAnimProbibility;
						this._currentAnimation = i;
					}
				}
				this._myAnimationInstance.setAnimation(this._animations[this._currentAnimation]);
			}
			
			//TODO change renderable position everywhere it should change
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
		
		cleanup : function cleanup(){return;},//TODO
		serialize : function serialize(){return;},//TODO
		
		copyFrom : function copyFrom(inOther)
		{
			this._animations = inOther._animations;
			this._currentAnimation = inOther._currentAnimation;
			
			this._myAnimationInstance = new ECGame.EngineLib.Animation2DInstance();
			this._myAnimationInstance.setAnimation(this._animations[0]);
			this._myAnimationInstance._myLayer = inOther._myAnimationInstance._myLayer;
		}
	}
});