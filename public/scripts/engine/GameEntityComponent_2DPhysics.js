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

ECGame.EngineLib.EntityComponent_2DPhysics = ECGame.EngineLib.Class.create({
	Constructor : function EntityComponent_2DPhysics()
	{
		this.GameEntityComponent();

		this._position = ECGame.EngineLib.Game2DPoint.create(256, 256);//??needed? use mid instead?
		this._velocity = ECGame.EngineLib.Game2DPoint.create();
		this._boundingRect = ECGame.EngineLib.createGame2DAABB(this._position.myX, this._position.myY, 64, 64);//TODO separate position from AABB in PhysicsSim2D
		this._range = ECGame.EngineLib.createGame2DAABB(0, 0, 65535, 65535);//TODO used? Set when added to world?
	},
	
	Parents : [ECGame.EngineLib.GameEntityComponent],
	
	flags : { net : true },//TODO should I get rid of this class flag?  Is it really needed?
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		_serializeFormat :
		[
			{
				name : '_position',//??TODO Target Position, can set velocity towards this instead of the position
				net : true,
				type : 'position',
				min : null,	//this._range.getLeftTop(),
				max : null	//this._range.getRightBottom(),
			},
			{
				name : '_velocity',
				net : true,
				type : 'position',//TODO type should be vector2 instead
				min : ECGame.EngineLib.Game2DPoint.create(-512,-512),	//TODO replace hack numbers
				max : ECGame.EngineLib.Game2DPoint.create(512,512)	//TODO replace hack numbers
			}
			//TODO rect NOT net!
		],
		
		init : function init()//TODO needed?
		{
		},
		
		onAddedToEntity : function onAddedToEntity(inEvent)
		{
			var owner = this._owner;//inEntity.entity;
		
			//register for events		
			owner.registerListener('RequestVelocity', this);
			owner.registerListener('AddedToWorld', this);
			owner.registerListener('RemovedFromWorld', this);
			//TODO owner.event(getposition, myPos);??
			
			this._owner.onEvent(
				new ECGame.EngineLib.GameEvent_UpdatePosition(
					this._position.clone(),
					this._velocity.clone(),
					this._boundingRect.clone()
				)
			);
		},
		
		onRemovedFromEntity : function onRemovedFromEntity(inEvent)
		{
			var owner = this._owner;//inEntity.entity;
			
			//unregister for events
			owner.deregisterListener('RequestVelocity', this);
			owner.deregisterListener('AddedToWorld', this);
			owner.deregisterListener('RemovedFromWorld', this);
			
			//this._owner = null;
		},
		
		destroy : function destroy()
		{
			//TODO this.release??
		},
		
		serialize : function serialize(inSerializer)
		{
			var format = this.EntityComponent_2DPhysics._serializeFormat;
			format[0].min = this._range.getLeftTop();
			format[0].max = this._range.getRightBottom();
			inSerializer.serializeObject(this, format);
			
			//TODO bool to serialize range (just like obj owner) so it can change to ideal size for its containing map
			
			if(inSerializer.isReading())
			{
				this._boundingRect.myX = this._position.myX - this._boundingRect.myWidth / 2;
				this._boundingRect.myY = this._position.myY - this._boundingRect.myHeight / 2;
				//console.log(this._position.myX + ' ' + this._position.myY);
				
				if(this._physicsObject)
				{
					this._physicsObject.setGame2DAABB(this._boundingRect);
				}
				
				//set position and let everyone else know
				if(this._owner)
				{
					this._owner.onEvent(
						new ECGame.EngineLib.GameEvent_UpdatePosition(
							this._position.clone(),
							this._velocity.clone(),
							this._boundingRect.clone()
						)
					);
				}
			}
			//else console.log(this._position.myX + ' ' + this._position.myY);
			
			/*
			HACK!!!!! TODO find better solution!
			Note: this is here because we need to use the bounding box for compression,
				BUT when added to a world we need to keep the OLD range until the other
				client(s) know about the change of world.  Otherwise the compression min/max will be wrong
			*/
		/*	if(this._world)
			{
				this._range = this._world.getBoundingBox();
			}*/
		},
		
		onRequestVelocity : function onRequestVelocity(inEvent)
		{
			//ECGame.log.info(inEvent.direction.myX + ' ' + inEvent.direction.myY);
			this._physicsObject.requestVelocity(inEvent.direction);
		},
		
		onAddedToWorld : function onAddedToWorld(inEvent)
		{
			this._world = inEvent.world;//TODO I dont think this is used..
			this._physicsSystem = inEvent.world.getPhysics();
			this._physicsObject = this._physicsSystem.createNewPhysicsObject();
			this._physicsObject.setGame2DAABB(this._boundingRect);
			this._physicsObject.setActive();
			this._physicsObject.setOwner(this);
			//TODO set the owner in the PhysObj for callbacks, triggers, etc?
			//TODO somehow event the position when it changes
			
			//TODO should have a position as part of the event?
			//TODO can the range still be set by the world bounding box?? Atm it screws up compression and thus net serializes
//			this._range = inEvent.world.getBoundingBox();
		},
		
		onRemovedFromWorld : function onRemovedFromWorld(inEvent)
		{
			this._physicsObject.release();
			this._physicsSystem = null;
			//this._range = ECGame.EngineLib.createGame2DAABB(0, 0, 256, 256);//TODO clamp values in range (in serializer?)
			//TODO clear position?
		},
		
		onPhysObjectUpdate : function onPhysObjectUpdate(physicsUpdateInfo)//TODO maybe this should be the event!
		{
			//TODO use GameEvent! Make collection of known game events!
			this._owner.onEvent(
				new ECGame.EngineLib.GameEvent_UpdatePosition(
					physicsUpdateInfo.position.clone(),
					physicsUpdateInfo.velocity.clone(),
					physicsUpdateInfo.boundingRect.clone()
				)
			);
			this._position = physicsUpdateInfo.position;
			this._velocity = physicsUpdateInfo.velocity;
			this.setNetDirty();
			//TODO event velocity
			
			/*console.log(
				physicsUpdateInfo.position.myX + ' ' +
				physicsUpdateInfo.position.myY + ' ' +
				physicsUpdateInfo.velocity.myX + ' ' +
				physicsUpdateInfo.velocity.myY + ' '
			);*/
		},
		
		copyFrom : function copyFrom(inOther)
		{
			this._position.copyFrom(inOther._position);
			this._velocity.copyFrom(inOther._velocity);
			this._boundingRect.copyFrom(inOther._boundingRect);
			this._range.copyFrom(inOther._range);//TODO used? Set when added to world?
		}
	}
});