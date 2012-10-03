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

//TODO rename CharacterInput??
GameEngineLib.EntityComponent_Input = GameEngineLib.Class(
{
	Constructor : function EntityComponent_Input()
	{
		this.GameEntityComponent();
		//this._keysEventMapper = [];//TODO make keys changable??
		
		//TODO put this elsewhere??
		this._speed = 128;
		
		this._up		= GameEngineLib.createGame2DPoint( 0,-1);
		this._down	= GameEngineLib.createGame2DPoint( 0, 1);
		this._left	= GameEngineLib.createGame2DPoint(-1, 0);
		this._right	= GameEngineLib.createGame2DPoint( 1, 0);
	},
	
	Parents : [GameEngineLib.GameEntityComponent],
	
	flags : {},
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		onInput : function onInput(inInputEvent)
		{
			this._direction = GameEngineLib.createGame2DPoint(0, 0);
			
			if(inInputEvent.keys["W"])
			{
				this._direction = this._direction.add(this._up);
			}
			if(inInputEvent.keys["S"])
			{
				this._direction = this._direction.add(this._down);
			}
			if(inInputEvent.keys["A"])
			{
				this._direction = this._direction.add(this._left);
			}
			if(inInputEvent.keys["D"])
			{
				this._direction = this._direction.add(this._right);
			}
			
			//unitize it, then multiply by speed
			this._direction = this._direction.unit().multiply(this._speed);
			
			if(this._owner)
			{
				this._owner.onEvent(
					{
						getName : function(){return "RequestVelocity";},
						direction : this._direction
					}
				);
			}
			else
			{
				GameEngineLib.logger.warn("Should not be getting input updates right now.");
			}
		},
		
		onAddedToEntity : function onAddedToEntity(inEntity)//TODO chain me
		{
			GameInstance.Input.registerListener("Input", this);
			//todo register for events
		},

		onRemovedFromEntity : function onRemovedFromEntity()//TODO chain me
		{
			GameInstance.Input.deregisterListener("Input", this);
			//todo unregister for events
		},
		
		destroy : function destroy()
		{
			this.onRemovedFromEntity();
		},

		serialize : function serialize(){}//TODO
	}
});