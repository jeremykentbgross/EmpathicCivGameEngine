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
GameEngineLib.createEntityComponent_2DCamera = function(instance, private)
{
	var temp = new GameEngineLib.EntityComponent_2DCamera();
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




GameEngineLib.EntityComponent_2DCamera = function EntityComponent_2DCamera()
{
	GameEngineLib.createGame2DCamera(this, null);//TODO inherit!
}
GameEngineLib.EntityComponent_2DCamera.prototype.constructor = GameEngineLib.EntityComponent_2DCamera;



GameEngineLib.EntityComponent_2DCamera.prototype.onAddedToEntity = function onAddedToEntity(inEntity)
{
	this._myOwner = inEntity;//TODO this should be done in the parent (EntityComponent) and not be needed here!!
	
	//register for events
	this._myOwner.registerListener("UpdatePosition", this);
	this._myOwner.registerListener("AddedToWorld", this);
	this._myOwner.registerListener("RemovedFromWorld", this);
	
	//TODO owner.event(getposition, myPos);??
}



GameEngineLib.EntityComponent_2DCamera.prototype.onRemovedFromEntity = function onRemovedFromEntity()
{
	//unregister for events
	this._myOwner.unregisterListener("UpdatePosition", this);
	this._myOwner.unregisterListener("AddedToWorld", this);
	this._myOwner.unregisterListener("RemovedFromWorld", this);
	
	this._myOwner = null;
}



GameEngineLib.EntityComponent_2DCamera.prototype.destroy = function destroy(){}//TODO
GameEngineLib.EntityComponent_2DCamera.prototype.serialize = function serialize(){}//TODO



GameEngineLib.EntityComponent_2DCamera.prototype.onAddedToWorld = function onAddedToWorld(inEvent)
{
	this._myMap = inEvent.world.getMap();
	//todo register as a camera entity with the world
}



GameEngineLib.EntityComponent_2DCamera.prototype.onRemovedFromWorld = function onRemovedFromWorld(inEvent)
{
	//todo unregister as a camera entity with the world
	this._myMap = null;
}



GameEngineLib.EntityComponent_2DCamera.prototype.getTargetPosition = function getTargetPosition()
{
	return this._position;
}



GameEngineLib.EntityComponent_2DCamera.prototype.onUpdatePosition = function onUpdatePosition(inEvent)
{
	//TODO look into bug why camera lags behind entity (maybe due to event listener order?)
	this._position = inEvent.position;
	this.centerOn(this._position, this._myMap.deref());
}