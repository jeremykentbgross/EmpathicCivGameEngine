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

GameEngineLib.EntityComponent_2DPhysics = GameEngineLib.Class({
	Constructor : function EntityComponent_2DPhysics()
	{
		this.GameEntityComponent();
		
		this._position = GameEngineLib.createGame2DPoint(256, 256);//??needed? use mid instead?
		this._velocity = GameEngineLib.createGame2DPoint();
		this._boundingRect = GameEngineLib.createGame2DAABB(0, 0, 64, 64);
		this._range = GameEngineLib.createGame2DAABB(0, 0, 256, 256);//TODO used? Set when added to world?
	},
	
	Parents : [GameEngineLib.GameEntityComponent],
	
	flags : { net : true },
	
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
				min : 512,	//TODO replace hack number
				max : 512	//TODO replace hack number
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
			inSerializer.serializeObject(this, this.EntityComponent_2DPhysics._serializeFormat);
			
			if(inSerializer.isReading())
			{
				this._boundingRect.myX = this._position.myX - this._boundingRect.myWidth / 2;
				this._boundingRect.myY = this._position.myY - this._boundingRect.myHeight / 2;
				//console.log(this._position.myX + ' ' + this._position.myY);
				
				this._physicsObject.setGame2DAABB(this._boundingRect);
				
				//set position and let everyone else know
				this._owner.onEvent(
					new GameEngineLib.GameEvent_UpdatePosition(
						this._position.clone(),
						this._velocity.clone(),
						this._boundingRect.clone()
					)
				);
			}
			//else console.log(this._position.myX + ' ' + this._position.myY);
		},
		
		onRequestVelocity : function onRequestVelocity(inEvent)
		{
			//GameEngineLib.logger.info(inEvent.direction.myX + ' ' + inEvent.direction.myY);
			this._physicsObject.requestVelocity(inEvent.direction);
		},
		
		onAddedToWorld : function onAddedToWorld(inEvent)
		{
			this._physicsSystem = inEvent.world.getPhysics();
			this._physicsObject = this._physicsSystem.createNewPhysicsObject();
			this._physicsObject.setGame2DAABB(this._boundingRect);
			this._physicsObject.setActive();
			this._physicsObject.setOwner(this);
			//TODO set the owner in the PhysObj for callbacks, triggers, etc?
			//TODO somehow event the position when it changes
			
			//TODO should have a position as part of the event?
			this._range = inEvent.world.getBoundingBox();
		},
		
		onRemovedFromWorld : function onRemovedFromWorld(inEvent)
		{
			//TODO remove physics objects
			this._physicsSystem = null;
			this._range = GameEngineLib.createGame2DAABB(0, 0, 256, 256);//TODO clamp values in range (in serializer?)
			//TODO clear position?
		},
		
		onPhysObjectUpdate : function onPhysObjectUpdate(physicsUpdateInfo)//TODO maybe this should be the event!
		{
			//TODO use GameEvent! Make collection of known game events!
			this._owner.onEvent(
				new GameEngineLib.GameEvent_UpdatePosition(
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
		}
	}
});