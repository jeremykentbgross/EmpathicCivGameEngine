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

GameEngineLib.GameEvent = function GameEvent(inEventName)
{
	this._eventName = inEventName;
};
GameEngineLib.GameEvent.prototype.constructor = GameEngineLib.GameEvent;



GameEngineLib.GameEvent.prototype.getName = function getName()
{
	return this._eventName;
};





GameEngineLib.GameEvent_AddedToEntity = GameEngineLib.Class({
	Constructor : function AddedToEntity(inEntity)
	{
		this.GameEvent("AddedToEntity");//TOD parent getEventFunctionName
		this.entity = inEntity;
	},
	Parents : [GameEngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});



//TODO move to own file
GameEngineLib.GameEvent_RemovedFromEntity = GameEngineLib.Class({
	Constructor : function RemovedFromEntity(inEntity)
	{
		this.GameEvent("RemovedFromEntity");
		this.entity = inEntity;
	},
	Parents : [GameEngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});



//TODO move to own file
GameEngineLib.GameEvent_AddedToWorld = GameEngineLib.Class({
	Constructor : function AddedToWorld(inWorld)
	{
		this.GameEvent("AddedToWorld");
		this.world = inWorld;
	},
	Parents : [GameEngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});



GameEngineLib.GameEvent_RemovedFromWorld = GameEngineLib.Class({
	Constructor : function RemovedFromWorld(inWorld)
	{
		this.GameEvent("RemovedFromWorld");
		this.world = inWorld;
	},
	Parents : [GameEngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});