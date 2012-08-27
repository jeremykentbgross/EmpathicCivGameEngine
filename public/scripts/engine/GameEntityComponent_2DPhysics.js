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

//TODO static param?

GameEngineLib.createEntityComponent_2DPhysics = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	private.position = GameEngineLib.createGame2DPoint(32, 32);
	private.boundingRect = GameEngineLib.createGame2DAABB(0, 0, 64, 64);
	private.range = GameEngineLib.createGame2DAABB(0, 0, 256, 256);
	
	instance.init = function()
	{
	}
	
	//todo update?		
	
	instance.onAddedToEntity = function(inEntity)
	{
		private.myOwner = inEntity;

		//register for events		
		private.myOwner.registerListener("RequestVelocity", this);
		private.myOwner.registerListener("AddedToWorld", this);
		private.myOwner.registerListener("RemovedFromWorld", this);
		
		//TODO owner.event(getposition, myPos);??
	}
	
	instance.onRemovedFromEntity = function()
	{
		//unregister for events
		private.myOwner.unregisterListener("RequestVelocity", this);
		private.myOwner.unregisterListener("AddedToWorld", this);
		private.myOwner.unregisterListener("RemovedFromWorld", this);
		
		private.myOwner = null;
	}
	
	instance.destroy = function(){}//TODO
	
	instance.serialize = function(inSerializer)
	{
		inSerializer.serializeObject(
			{
				public : this,
				private : private
			},
			//TODO put this in class
			[
				{
					name : "position",//??TODO Target Position, can set velocity towards this instead of the position
					scope : "private",
					net : true,
					type : "position",
					min : private.range.getLeftTop(),
					max : private.range.getRightBottom(),
				}
			]
		);
		
		if(inSerializer.isReading())
		{
			private.boundingRect.myX = private.position.myX - private.boundingRect.myWidth / 2;
			private.boundingRect.myY = private.position.myY - private.boundingRect.myHeight / 2;
			//console.log(private.position.myX + " " + private.position.myY);
			
			private.physicsObject.setGame2DAABB(private.boundingRect);
			
			//set position and let everyone else know
			private.myOwner.onEvent(
				{
					getName : function(){return "UpdatePosition";},
					position : private.position,//TODO clone
					boundingRect : private.boundingRect//TODO need to serialize this!, TODO clone
				}
			);
		}
		//else console.log(private.position.myX + " " + private.position.myY);
	}

	
	instance.onRequestVelocity = function(inEvent)
	{
		//GameEngineLib.logger.info(inEvent.direction.myX + " " + inEvent.direction.myY);
		private.physicsObject.requestVelocity(inEvent.direction);
	}
	
	instance.onAddedToWorld = function(inEvent)
	{
		private.physicsSystem = inEvent.world.getPhysics();
		private.physicsObject = private.physicsSystem.createNewPhysicsObject();
		private.physicsObject.setGame2DAABB(private.boundingRect);
		private.physicsObject.setActive();
		private.physicsObject.setOwner(this);
		//TODO set the owner in the PhysObj for callbacks, triggers, etc?
		//TODO somehow event the position when it changes
		
		//TODO should have a position as part of the event?
		private.range = inEvent.world.getBoundingBox();
	}
	instance.onRemovedFromWorld = function(inEvent)
	{
		//TODO remove physics objects
		private.physicsSystem = null;
		private.range = GameEngineLib.createGame2DAABB(0, 0, 256, 256);
		//TODO clear position?
	}
	
	instance.onPhysObjectUpdate = function(physicsUpdateInfo)
	{
		private.myOwner.onEvent(
			{
				getName : function(){return "UpdatePosition";},
				position : physicsUpdateInfo.position,
				boundingRect : physicsUpdateInfo.boundingRect
			}
		);
		private.position = physicsUpdateInfo.position;
		private.netDirty = true;
		//TODO event velocity
		
		/*console.log(
			physicsUpdateInfo.position.myX + " " +
			physicsUpdateInfo.position.myY + " " +
			physicsUpdateInfo.velocity.myX + " " +
			physicsUpdateInfo.velocity.myY + " "
		);*/
	}
	
	instance.netDirty = function()
	{
		if(private.netDirty)
		{
			private.netDirty = false;
			return true;
		}
		return false;
	}
	
	return instance;
}