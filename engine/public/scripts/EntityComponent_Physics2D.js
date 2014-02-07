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

ECGame.EngineLib.EntityComponent_Physics2D = ECGame.EngineLib.Class.create({
	Constructor : function EntityComponent_Physics2D()
	{
		this.GameEntityComponent();

		this._myPosition = ECGame.EngineLib.Point2D.create(256, 256);
		this._myVelocity = ECGame.EngineLib.Point2D.create();
		
		//TODO separate position from AABB in PhysicsSim2D
		this._myAABB = ECGame.EngineLib.AABB2D.create(0, 0, 64, 64);
		this._myAABB.setCenter(this._myPosition);
		
		//TODO make static? ser on !net?? how to set when added to world? get rid of it?
		this._myRange = ECGame.EngineLib.AABB2D.create(0, 0, 65535, 65535);
		
		this._myPhysicsObject = null;
	},
	
	Parents : [ECGame.EngineLib.GameEntityComponent],
	
	flags : { netDynamic : true },
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		_mySerializeFormat :	//TODO part of Class def?
		[
			{
				name : '_myPosition',//??TODO Target Position, can set velocity towards this instead of the position
				net : true,
				type : 'position',
				min : null,	//this._myRange.getLeftTop(),
				max : null	//this._myRange.getRightBottom(),
			},
			{
				name : '_myVelocity',	//TODO not used atm???? (yes, it allows proper animation to play)
				net : true,
				type : 'position',//TODO type should be vector2 instead
				min : ECGame.EngineLib.Point2D.create(-512,-512),	//TODO replace hack numbers
				max : ECGame.EngineLib.Point2D.create(512,512)	//TODO replace hack numbers
			}
			//TODO rect NOT net!
		],
		
		init : function init(){	return;	},//TODO needed?
		
		onAddedToEntity : function onAddedToEntity(/*inEvent*/)
		{
			var anOwner = this._myOwner;//inEntity.entity;
		
			//register for events		
			anOwner.registerListener('RequestVelocity', this);
			anOwner.registerListener('EntityAddedToWorld', this);
			anOwner.registerListener('EntityRemovedFromWorld', this);
			
			anOwner.registerListener('SetPosition', this);
			//TODO anOwner.event(getposition, myPos);??
			
			this._myOwner.onEvent(
				new ECGame.EngineLib.Events.UpdatedPhysicsStatus(
					this._myOwner,
					this._myPosition,
					this._myVelocity,
					this._myAABB
				)
			);
		},
		
		onRemovedFromEntity : function onRemovedFromEntity(/*inEvent*/)
		{
			var anOwner = this._myOwner;//inEntity.entity;
			
			//unregister for events
			anOwner.deregisterListener('RequestVelocity', this);
			anOwner.deregisterListener('EntityAddedToWorld', this);
			anOwner.deregisterListener('EntityRemovedFromWorld', this);
			
			anOwner.deregisterListener('SetPosition', this);
			
			//this._myOwner = null;
		},
		
		cleanup : function cleanup(){return;},
		
		//set<classname>NetDirty
		clearNetDirty : function clearNetDirty(){return;},
		postSerialize : function postSerialize(){return;},
		
		serialize : function serialize(inSerializer)
		{
			var aFormat;
			
			//serialize
			aFormat = this.EntityComponent_Physics2D._mySerializeFormat;
			aFormat[0].min = this._myRange.getLeftTop();
			aFormat[0].max = this._myRange.getRightBottom();
			inSerializer.serializeObject(this, aFormat);
			
			//TODO serialize delta position 99% of time, and full position every so often
			//TODO server side: make sure full position is within some reasonable range
			
			//TODO bool to serialize range (just like obj owner) so it can change to ideal size for its containing map
			//TODO examine client server feedback!!
			if(inSerializer.isReading())
			{
				this._myAABB.setCenter(this._myPosition);
				if(this._myPhysicsObject)
				{
					this._myPhysicsObject.setAABB(this._myAABB);
					//this._myPhysicsObject.requestVelocity(this._myVelocity);	//TODO sending input, physics master control, etc..
				}
				
				//set position and let everyone else know
				if(this._myOwner)
				{
					this._myOwner.onEvent(
						new ECGame.EngineLib.Events.UpdatedPhysicsStatus(
							this._myOwner,
							this._myPosition.clone(),
							this._myVelocity.clone(),
							this._myAABB.clone()
						)
					);
				}
			}
		},
		
		onRequestVelocity : function onRequestVelocity(inEvent)
		{
			this._myPhysicsObject.requestVelocity(inEvent.direction);
		},
		
		onEntityAddedToWorld : function onEntityAddedToWorld(inEvent)
		{
			this._myPhysicsObject = inEvent.world.getPhysics().createNewPhysicsObject();
			
			this._myPhysicsObject.setAABB(this._myAABB);
			this._myPhysicsObject.setActive();
			this._myPhysicsObject.setOwner(this);
			//TODO set the owner in the PhysObj for callbacks, triggers, etc?
			
			this._myOwner.onEvent(
				new ECGame.EngineLib.Events.UpdatedPhysicsStatus(
					this._myOwner,
					this._myPosition,
					this._myVelocity,
					this._myAABB
				)
			);
		},
		
		onEntityRemovedFromWorld : function onEntityRemovedFromWorld(/*inEvent*/)
		{
			this._myPhysicsObject.release();
		},
		
		//should not be used often
		onSetPosition : function onSetPosition(inEvent)
		{
			this._myPosition = inEvent.myPosition;
			this._myAABB.setCenter(this._myPosition);
			if(this._myPhysicsObject)
			{
				this._myPhysicsObject.setAABB(this._myAABB);
			}
			
			this.setNetDirty();
		},
		
		onPhysicsObjectUpdated : function onPhysicsObjectUpdated(inEvent)
		{
			this._myOwner.onEvent(//TODO not have seperate event?
				new ECGame.EngineLib.Events.UpdatedPhysicsStatus(
					this._myOwner,
					inEvent.position,
					inEvent.velocity,
					inEvent.boundingRect
				)
			);
			
			this._myPosition.copyFrom(inEvent.position);
			this._myVelocity.copyFrom(inEvent.velocity);
			this._myAABB.copyFrom(inEvent.boundingRect);
			
			this.setNetDirty();
		},
		
		copyFrom : function copyFrom(inOther)
		{
			this._myPosition.copyFrom(inOther._myPosition);
			this._myVelocity.copyFrom(inOther._myVelocity);
			this._myAABB.copyFrom(inOther._myAABB);
			//this._myRange.copyFrom(inOther._myRange);//TODO used? Set when added to world?
		}
	}
});