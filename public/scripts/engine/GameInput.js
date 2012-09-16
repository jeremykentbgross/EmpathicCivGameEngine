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


GameEngineLib.createInput = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	GameEngineLib.createEventSystem(instance);
	
	if(GameSystemVars.DEBUG)
	{
		GameEngineLib.addDebugInfo("GameInput", instance, private);
	}
	
	private.mouseLoc = GameEngineLib.createGame2DPoint(0, 0);
	private.keys = {};
	private.keysPressed = {};
	private.buttons = {};
	private.active = false;
	
	private.input = function(inEvent)
	{		
		var eventType = inEvent.type;
				
		switch(eventType)
		{
			case 'keydown':
			case 'keyup':
				var key = String.fromCharCode(inEvent.keyCode);
				private.keys[key] = (eventType === 'keydown');
				break;
				
			case 'keypress':
				var key = String.fromCharCode(inEvent.keyCode);
				private.keysPressed[key] = true;
				break;
				
			case 'mousedown':
			case 'mouseup':
				private.buttons[inEvent.button] = (eventType === 'mousedown');
				//dont break so it falls thru
			case 'mousemove':
				private.mouseLoc.myX = inEvent.offsetX;
				private.mouseLoc.myY = inEvent.offsetY;
				break;
			/*
			case 'mousewheel':
				//TODO?
				break;
			
			case 'click':
				//TODO
				break;
				
			case 'dblclick':
				//TODO
				break;
			*/	
			case 'mouseout':
				private.active = false;
				break;
				
			case 'mouseover':
				private.active = true;
				break;
			
			default:
				break;
		}
		
		if(private.active === false)
		{
			private.keys = {};
			private.keysPressed = {};
			private.buttons = {};
		}
	}
	
	instance.initClient = function initClient(inCanvas)
	{
		if(GameSystemVars.Network.isServer)
			return;
			
		require(
			["dojo/on"],
			function(on)
			{
				//keys:
				on(document, "keydown", private.input);
				on(document, "keyup", private.input);
				on(document, "keypress", private.input);
								
				//mouse:
				on(inCanvas, "mousedown", private.input);
				on(inCanvas, "mouseup", private.input);
				on(inCanvas, "mousemove", private.input);
				
				/*
				//currently unused:
				on(inCanvas, "mousewheel", private.input);
				on(inCanvas, "click", private.input);
				on(inCanvas, "dblclick", private.input);*/
				
				on(inCanvas, "mouseout", private.input);
				on(inCanvas, "mouseover", private.input);
								
				//prevent right click menu on the render area
				on(inCanvas, "contextmenu", function(event){ event.preventDefault(); } );
				
				//TODO can i turn off middle mouse button native effect
			}
		);
	}
	
	//TODO make update an event so this is not needed
	instance.isUpdating = function()
	{
		return true;
	}
	
	instance.update = function()
	{
		var i;
		var inputString;
		var event;
		
		if(GameSystemVars.DEBUG)
		{
			inputString = "Input: " +
				(private.active ? "Active" : "Inactive" ) + 
				" X:" + private.mouseLoc.myX + " Y:" + private.mouseLoc.myY + " ";
			for(i in private.buttons)
			{
				if(private.buttons[i])
					inputString += "MB" + i + " ";
			}
			for(i in private.keys)
			{
				if(private.keys[i])
					inputString += "'" + i + "' (" + i.charCodeAt(0) + ") ";
			}
			for(i in private.keysPressed)
			{
				if(private.keysPressed[i])
					inputString += "'" + i + "' (" + i.charCodeAt(0) + ") ";
			}
			//todo clicks and wheel
			
			if(GameSystemVars.Debug.Input_Print)
			{
				console.log(inputString + "\n");
			}
			if(GameSystemVars.Debug.Input_Draw)
			{
				GameInstance.Graphics.drawDebugText(
					inputString,
					(private.active ?
						GameSystemVars.Debug.Input_Active_DrawColor :
						GameSystemVars.Debug.Input_Inactive_DrawColor
					)
				);
			}
		}
				
		event =
		{
			getName : function(){return "Input";},
			keys : {},
			keysPressed : {},
			buttons : {},
			mouseLoc : GameEngineLib.createGame2DPoint(private.mouseLoc.myX, private.mouseLoc.myY)
		}
		
		//copy the values from private individually so my internal data cannot be changed by users
		for(i in private.keys)
		{
			event.keys[i] = private.keys[i];
		}
		for(i in private.keysPressed)
		{
			event.keysPressed[i] = private.keysPressed[i];
		}
		for(i in private.buttons)
		{
			event.buttons[i] = private.buttons[i];
		}
		
		//send messages for all the listeners for input
		this.onEvent(event);
		
		private.keysPressed = {};
	}
	
	return instance;
}