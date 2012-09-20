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

//TODO depricated
GameEngineLib.createEntityComponent = function(instance, private)
{		
	var temp = new GameEngineLib.GameEntityComponent();
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






GameEngineLib.GameEntityComponent = function GameEntityComponent(){}
GameEngineLib.GameEntityComponent.prototype.constructor = GameEngineLib.GameEntityComponent;



GameEngineLib.GameEntityComponent.prototype.onAddedToEntity = function onAddedToEntity(inEntity)
{
	if(this._myOwner)
	{
		this.onRemovedFromEntity();
	}
	
	//todo register for events
}
GameEngineLib.GameEntityComponent.prototype.onAddedToEntity.chaindown = true;



GameEngineLib.GameEntityComponent.prototype.onRemovedFromEntity = function onRemovedFromEntity()
{
	//todo unregister for events
}
GameEngineLib.GameEntityComponent.prototype.onRemovedFromEntity.chainup = true;



GameEngineLib.GameEntityComponent.prototype.destroy = function destroy(){}//TODO



GameEngineLib.GameEntityComponent.prototype.serialize = function serialize(){}//TODO