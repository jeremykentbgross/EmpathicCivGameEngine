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


GameEngineLib.createInput = function(instance, PRIVATE)
{
	instance = instance || {};
	PRIVATE = PRIVATE || {};
	
	GameEngineLib.createEventSystem(instance);
	
	if(GameSystemVars.DEBUG)
	{
		GameEngineLib.addDebugInfo("GameInput", instance, PRIVATE);
	}
	
	PRIVATE.mouseLoc = GameEngineLib.createGame2DPoint(0, 0);
	PRIVATE.keys = {};
	PRIVATE.keysPressed = {};
	PRIVATE.buttons = {};
	PRIVATE.active = false;
	
	PRIVATE.input = function(inEvent)
	{		
		var eventType = inEvent.type;
				
		switch(eventType)
		{
			case 'keydown':
			case 'keyup':
				var key = String.fromCharCode(inEvent.keyCode);
				PRIVATE.keys[key] = (eventType === 'keydown');
				break;
				
			case 'keypress':
				var key = String.fromCharCode(inEvent.keyCode);
				PRIVATE.keysPressed[key] = true;
				break;
				
			case 'mousedown':
			case 'mouseup':
				PRIVATE.buttons[inEvent.button] = (eventType === 'mousedown');
				//dont break so it falls thru
			case 'mousemove':
				PRIVATE.mouseLoc.myX = inEvent.offsetX;
				PRIVATE.mouseLoc.myY = inEvent.offsetY;
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
				PRIVATE.active = false;
				break;
				
			case 'mouseover':
				PRIVATE.active = true;
				break;
			
			default:
				break;
		}
		
		if(PRIVATE.active === false)
		{
			PRIVATE.keys = {};
			PRIVATE.keysPressed = {};
			PRIVATE.buttons = {};
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
				on(document, "keydown", PRIVATE.input);
				on(document, "keyup", PRIVATE.input);
				on(document, "keypress", PRIVATE.input);
								
				//mouse:
				on(inCanvas, "mousedown", PRIVATE.input);
				on(inCanvas, "mouseup", PRIVATE.input);
				on(inCanvas, "mousemove", PRIVATE.input);
				
				/*
				//currently unused:
				on(inCanvas, "mousewheel", PRIVATE.input);
				on(inCanvas, "click", PRIVATE.input);
				on(inCanvas, "dblclick", PRIVATE.input);*/
				
				on(inCanvas, "mouseout", PRIVATE.input);
				on(inCanvas, "mouseover", PRIVATE.input);
								
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
				(PRIVATE.active ? "Active" : "Inactive" ) + 
				" X:" + PRIVATE.mouseLoc.myX + " Y:" + PRIVATE.mouseLoc.myY + " ";
			for(i in PRIVATE.buttons)
			{
				if(PRIVATE.buttons[i])
					inputString += "MB" + i + " ";
			}
			for(i in PRIVATE.keys)
			{
				if(PRIVATE.keys[i])
					inputString += "'" + i + "' (" + i.charCodeAt(0) + ") ";
			}
			for(i in PRIVATE.keysPressed)
			{
				if(PRIVATE.keysPressed[i])
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
					(PRIVATE.active ?
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
			mouseLoc : GameEngineLib.createGame2DPoint(PRIVATE.mouseLoc.myX, PRIVATE.mouseLoc.myY)
		}
		
		//copy the values from PRIVATE individually so my internal data cannot be changed by users
		for(i in PRIVATE.keys)
		{
			event.keys[i] = PRIVATE.keys[i];
		}
		for(i in PRIVATE.keysPressed)
		{
			event.keysPressed[i] = PRIVATE.keysPressed[i];
		}
		for(i in PRIVATE.buttons)
		{
			event.buttons[i] = PRIVATE.buttons[i];
		}
		
		//send messages for all the listeners for input
		this.onEvent(event);
		
		PRIVATE.keysPressed = {};
	}
	
	return instance;
}