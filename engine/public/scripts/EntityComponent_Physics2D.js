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
		this.EntityComponent();

		this._myPosition = ECGame.EngineLib.Point2D.create(256, 256);
		this._myVelocity = ECGame.EngineLib.Point2D.create();
		
		this._myAABB = ECGame.EngineLib.AABB2D.create(0, 0, 64, 64);
		this._myAABB.setCenter(this._myPosition);
		
		this._myPhysicsObject = null;
	},
	
	Parents : [ECGame.EngineLib.EntityComponent],
	
	flags : { netDynamic : true },
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		SerializeFormat :
		[
			{
				//TODO?? Target Position instead: can set velocity towards this instead of the position
				//TODO?? somehow should do delta position instead??
				name : '_myPosition',
				net : true,
				type : 'position',
				min : ECGame.EngineLib.Point2D.create(0, 0),
				max : ECGame.EngineLib.Point2D.create(65535, 65535)
			},
			{
				//TODO not used atm???? (yes, it allows proper animation to play)
				name : '_myVelocity',
				net : true,
				type : 'position',
				min : ECGame.EngineLib.Point2D.create(-512,-512),
				max : ECGame.EngineLib.Point2D.create(512,512)
			}
			//TODO AABB2D NOT net!
		],
		
		onAddedToEntity : function onAddedToEntity(/*inEvent*/)
		{
			var anOwner = this._myOwningEntity;//inEntity.entity;
		
			//register for events		
			anOwner.registerListener('RequestVelocity', this);
			anOwner.registerListener('EntityAddedToWorld', this);
			anOwner.registerListener('EntityRemovedFromWorld', this);
			anOwner.registerListener('SetPosition', this);
			
			this._myOwningEntity.onEvent(
				new ECGame.EngineLib.Events.UpdatedPhysicsStatus(
					this._myOwningEntity,
					this._myPosition,
					this._myVelocity,
					this._myAABB
				)
			);
		},
		
		onRemovedFromEntity : function onRemovedFromEntity(/*inEvent*/)
		{
			var anOwner = this._myOwningEntity;//inEntity.entity;
			
			//unregister for events
			anOwner.deregisterListener('RequestVelocity', this);
			anOwner.deregisterListener('EntityAddedToWorld', this);
			anOwner.deregisterListener('EntityRemovedFromWorld', this);
			anOwner.deregisterListener('SetPosition', this);
		},
		
		cleanup : function cleanup(){return;},
		
		//set<classname>NetDirty
		clearNetDirty : function clearNetDirty(){return;},
		postSerialize : function postSerialize(){return;},
		
		serialize : function serialize(inSerializer)
		{
			//serialize
			inSerializer.serializeObject(this, this.EntityComponent_Physics2D.SerializeFormat);
			
			//TODO serialize delta position 99% of time, and full position every so often
			//TODO server side: make sure full position is within some reasonable range
			//TODO bool to serialize dynamic position range (just like obj owner) so it can change to ideal size for its containing map
			//TODO examine client server feedback!!
			
			if(inSerializer.isReading())
			{
				this._myAABB.setCenter(this._myPosition);
				if(this._myPhysicsObject)
				{
					this._myPhysicsObject.setAABB(this._myAABB);
					//this._myPhysicsObject.requestVelocity(this._myVelocity);//TODO send input, physics master control, etc..
				}
				
				//let everyone else know about new state
				if(this._myOwningEntity)
				{
					this._myOwningEntity.onEvent(
						new ECGame.EngineLib.Events.UpdatedPhysicsStatus(
							this._myOwningEntity,
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
			
			this._myOwningEntity.onEvent(
				new ECGame.EngineLib.Events.UpdatedPhysicsStatus(
					this._myOwningEntity,
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
			this._myOwningEntity.onEvent(//TODO not have seperate event?
				new ECGame.EngineLib.Events.UpdatedPhysicsStatus(
					this._myOwningEntity,
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
		}
	}
});