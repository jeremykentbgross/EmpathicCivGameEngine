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

GameEngineLib.EntityComponent_2DCamera = GameEngineLib.Class.create({
	Constructor : function EntityComponent_2DCamera()
	{
		this.GameEntityComponent();
		this.Game2DCamera();
	},
	Parents : [GameEngineLib.GameEntityComponent, GameEngineLib.Game2DCamera],
	flags : { net : true },
	ChainUp : null,
	ChainDown : null,
	Definition :
	{
		onAddedToEntity : function onAddedToEntity(inEvent)
		{
			var owner = this._owner;//inEvent.entity;
			
			//register for events
			owner.registerListener('UpdatePosition', this);
			owner.registerListener('AddedToWorld', this);
			owner.registerListener('RemovedFromWorld', this);
			
			//TODO owner.event(getposition, myPos);??
		},
		onRemovedFromEntity : function onRemovedFromEntity(inEvent)
		{
			var owner = this._owner;//inEvent.entity;
			
			//unregister for events
			owner.deregisterListener('UpdatePosition', this);
			owner.deregisterListener('AddedToWorld', this);
			owner.deregisterListener('RemovedFromWorld', this);
		},
		
		destroy : function destroy(){},
		serialize : function serialize(){},
		
		onAddedToWorld : function onAddedToWorld(inEvent)
		{
			this._myMap = inEvent.world.getMap();
			//TODO register as a camera entity with the world
			
			if(this.getNetOwner() === GameInstance.localUser.userID)//TODO maybe make search from game rules to find cams that are local owned?
			{
				inEvent.world.setCamera(this);
			}
		},
		
		onRemovedFromWorld : function onRemovedFromWorld(inEvent)
		{
			//TODO unregister as a camera entity with the world
			this._myMap = null;
		},
		
		getTargetPosition : function getTargetPosition()
		{
			return this._position;
		},
		
		onUpdatePosition : function onUpdatePosition(inEvent)
		{
			//TODO look into bug why camera lags behind entity (maybe due to event listener order?)
			this._position = inEvent.position;
			this.centerOn(this._position, this._myMap);
		},
		
		copyFrom : function copyFrom(inOther)
		{
			//TODO copy parent classes rect?
		}
	}
});