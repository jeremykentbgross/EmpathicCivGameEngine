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

//TODO rename CharacterInput
GameEngineLib.createEntityComponent_Input = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	//private.keysEventMapper = [];//TODO make keys changable??
	
	//get update tick from input, even if server and no input device:
	GameInstance.Input.registerListener("Input", private);//todo add to init and turn on and off?
	
	//TODO put this elsewhere??
	private.speed = 128;
	
	private.up		= GameEngineLib.createGame2DPoint( 0,-1);
	private.down	= GameEngineLib.createGame2DPoint( 0, 1);
	private.left	= GameEngineLib.createGame2DPoint(-1, 0);
	private.right	= GameEngineLib.createGame2DPoint( 1, 0);
	
	private.onInput = function(inInputEvent)
	{
		private.direction = GameEngineLib.createGame2DPoint(0, 0);
		
		if(inInputEvent.keys["W"])
		{
			private.direction = private.direction.add(private.up);
		}
		if(inInputEvent.keys["S"])
		{
			private.direction = private.direction.add(private.down);
		}
		if(inInputEvent.keys["A"])
		{
			private.direction = private.direction.add(private.left);
		}
		if(inInputEvent.keys["D"])
		{
			private.direction = private.direction.add(private.right);
		}
		
		//unitize it, then multiply by speed
		private.direction = private.direction.unit().multiply(private.speed);
		
		/*if(inInputEvent.buttons[0])
		{
			mouseWorldPosition = inInputEvent.mouseLoc.add(camPoint);
			map.clearTile(
				map.toTileCoordinate(mouseWorldPosition.myX),
				map.toTileCoordinate(mouseWorldPosition.myY)
			);
		}*/
		
		private.myOwner.onEvent(
			{
				getName : function(){return "RequestVelocity";},
				direction : private.direction
			}
		);
	}
			
	
	instance.onAddedToEntity = function(inEntity)
	{
		private.myOwner = inEntity;

		//todo register for events
	}
	
	instance.onRemovedFromEntity = function()
	{		
		//todo unregister for events
		private.myOwner = null;
	}
	
	instance.destroy = function(){}//TODO
	instance.serialize = function(){}//TODO

	
	return instance;
}