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

//TODO depricated!
GameEngineLib.createEntityComponent_2DPhysics = function(instance, private)
{
	var temp = new GameEngineLib.EntityComponent_2DPhysics();
	instance = instance || {};
	
	for(property in temp)
	{
		instance[property] = temp[property]
	}
	for(property in temp.prototype)
	{
		instance[property] = temp.prototype[property];
	}
	
	return instance;
}





GameEngineLib.EntityComponent_2DPhysics = function EntityComponent_2DPhysics()
{
	this._position = GameEngineLib.createGame2DPoint(32, 32);//??needed? use mid instead?
	this._boundingRect = GameEngineLib.createGame2DAABB(0, 0, 64, 64);
	this._range = GameEngineLib.createGame2DAABB(0, 0, 256, 256);//TODO used? Set when added to world?
}
GameEngineLib.EntityComponent_2DPhysics.prototype.constructor = GameEngineLib.EntityComponent_2DPhysics;



GameEngineLib.EntityComponent_2DPhysics.prototype.init = function init()//TODO needed?
{
}

//todo update?		

GameEngineLib.EntityComponent_2DPhysics.prototype.onAddedToEntity = function onAddedToEntity(inEntity)
{
	this._myOwner = inEntity;

	//register for events		
	this._myOwner.registerListener("RequestVelocity", this);
	this._myOwner.registerListener("AddedToWorld", this);
	this._myOwner.registerListener("RemovedFromWorld", this);
	
	//TODO owner.event(getposition, myPos);??
}



GameEngineLib.EntityComponent_2DPhysics.prototype.onRemovedFromEntity = function onRemovedFromEntity()
{
	//unregister for events
	this._myOwner.unregisterListener("RequestVelocity", this);
	this._myOwner.unregisterListener("AddedToWorld", this);
	this._myOwner.unregisterListener("RemovedFromWorld", this);
	
	this._myOwner = null;
}



GameEngineLib.EntityComponent_2DPhysics.prototype.destroy = function destroy(){}//TODO



GameEngineLib.EntityComponent_2DPhysics.prototype.serialize = function serialize(inSerializer)
{
	var _this_ = this;
	inSerializer.serializeObject(
		{
			public : _this_,
			private : _this_
		},
		//TODO put this in class
		[
			{
				name : "_position",//??TODO Target Position, can set velocity towards this instead of the position
				scope : "private",
				net : true,
				type : "position",
				min : _this_._range.getLeftTop(),
				max : _this_._range.getRightBottom(),
			}
			//TODO rect NOT net!
		]
	);
	
	if(inSerializer.isReading())
	{
		this._boundingRect.myX = this._position.myX - this._boundingRect.myWidth / 2;
		this._boundingRect.myY = this._position.myY - this._boundingRect.myHeight / 2;
		//console.log(this._position.myX + " " + this._position.myY);
		
		this._physicsObject.setGame2DAABB(this._boundingRect);
		
		//set position and let everyone else know
		this._myOwner.onEvent(
			{
				getName : function(){return "UpdatePosition";},
				position : _this_._position,//TODO clone
				boundingRect : _this_._boundingRect//TODO need to serialize this!, TODO clone
			}
		);
	}
	//else console.log(this._position.myX + " " + this._position.myY);
}



GameEngineLib.EntityComponent_2DPhysics.prototype.onRequestVelocity = function onRequestVelocity(inEvent)
{
	//GameEngineLib.logger.info(inEvent.direction.myX + " " + inEvent.direction.myY);
	this._physicsObject.requestVelocity(inEvent.direction);
}



GameEngineLib.EntityComponent_2DPhysics.prototype.onAddedToWorld = function onAddedToWorld(inEvent)
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
}



GameEngineLib.EntityComponent_2DPhysics.prototype.onRemovedFromWorld = function onRemovedFromWorld(inEvent)
{
	//TODO remove physics objects
	this._physicsSystem = null;
	this._range = GameEngineLib.createGame2DAABB(0, 0, 256, 256);//TODO clamp values in range (in serializer?)
	//TODO clear position?
}



GameEngineLib.EntityComponent_2DPhysics.prototype.onPhysObjectUpdate = function onPhysObjectUpdate(physicsUpdateInfo)
{
	//TODO use GameEvent! Make collection of known game events!
	this._myOwner.onEvent(
		{
			getName : function(){return "UpdatePosition";},
			position : physicsUpdateInfo.position,
			boundingRect : physicsUpdateInfo.boundingRect
		}
	);
	this._position = physicsUpdateInfo.position;
	this.setNetDirty();
	//TODO event velocity
	
	/*console.log(
		physicsUpdateInfo.position.myX + " " +
		physicsUpdateInfo.position.myY + " " +
		physicsUpdateInfo.velocity.myX + " " +
		physicsUpdateInfo.velocity.myY + " "
	);*/
}