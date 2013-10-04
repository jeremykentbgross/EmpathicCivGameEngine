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

ECGame.EngineLib.Input = ECGame.EngineLib.Class.create({
	Constructor : function Input()
	{
		this.GameEventSystem();
		this._mouseLoc = ECGame.EngineLib.Point2.create(0, 0);
		this._keys = {};
		this._keysPressed = {};
		this._buttons = {};
		this._clicked = {};
		this._active = false;
		
		this._myGraphics = null;
		this._myIndex = 0;
		
		ECGame.instance.getUpdater("MasterUpdater").addUpdate(this);
	},
	Parents : [ECGame.EngineLib.GameEventSystem],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		getName : function getName()
		{
			return 'Input';
		},
		getUpdatePriority : function getUpdatePriority()
		{
			return ECGame.Settings.UpdateOrder.INPUT;
		},
		
		serverInit : function serverInit(inIndex)
		{
			this._myIndex = inIndex;
		},
		
		init : function init(inGraphics, inCanvas)
		{
			var aThis,
				aOnInput;

			if(ECGame.Settings.Network.isServer)
			{
				return;
			}
			
			aThis = this;
			this._myGraphics = inGraphics;
			this._myIndex = inGraphics.getIndex();
			
			aOnInput = function onInput(inEvent)
			{
				aThis._myGraphics.getInput()._handleInput(inEvent);
			};
				
			require(
				['dojo/on'],
				function importDojoCallback(inOn)
				{
					//keys:
					inOn(document, 'keydown', aOnInput);
					inOn(document, 'keyup', aOnInput);
					inOn(document, 'keypress', aOnInput);
									
					//mouse:
					inOn(inCanvas, 'mousedown', aOnInput);
					inOn(inCanvas, 'mouseup', aOnInput);
					inOn(inCanvas, 'mousemove', aOnInput);
					//inOn(inCanvas, 'mousewheel', aOnInput);
					inOn(inCanvas, 'click', aOnInput);
					//inOn(inCanvas, 'dblclick', aOnInput);
					inOn(inCanvas, 'mouseout', aOnInput);
					inOn(inCanvas, 'mouseover', aOnInput);
									
					//prevent right click menu on the render area
					inOn(inCanvas, 'contextmenu', function blockContextMenu(event){ event.preventDefault(); } );
					
					//TODO can i turn off middle mouse button native effect
				}
			);
		},
		
		setSupressKeyboardEvents : function setSupressKeyboardEvents(inSupress)
		{
			this._supressKeyboardEvents = inSupress;
		},
		
		_handleInput : function _handleInput(inEvent)
		{
			var eventType, key, mouseRatio;
			
			eventType = inEvent.type;
			mouseRatio = this._myGraphics.getBackBufferToFrontBufferRatio();
					
			switch(eventType)
			{
				case 'keydown':
				case 'keyup':
					key = String.fromCharCode(inEvent.keyCode);
					this._keys[key] = (eventType === 'keydown');
					this._keys[inEvent.keyCode] = (eventType === 'keydown');//TODO this causes debugdraw errors, revisit
					break;
					
				case 'keypress':
					key = String.fromCharCode(inEvent.keyCode);
					this._keysPressed[key] = true;
					this._keysPressed[inEvent.keyCode] = true;//TODO this causes debugdraw errors, revisit
					break;
					
				case 'mousedown':
				case 'mouseup':
					this._buttons[inEvent.button] = (eventType === 'mousedown');
					this._clicked[inEvent.button] = (eventType === 'mouseup');//Needed because right mouse doesn't get click event
					this._mouseLoc.myX = Math.round(inEvent.offsetX * mouseRatio);
					this._mouseLoc.myY = Math.round(inEvent.offsetY * mouseRatio);
					break;
					
				case 'mousemove':
					//TODO firefox doesn't like offset, but it is needed.  jquery can fix this.  Need to go back to it from jodo i think.
					this._mouseLoc.myX = Math.round(inEvent.offsetX * mouseRatio) /*|| inEvent.layerX*/;// Firefox hack:  || inEvent.layer
					this._mouseLoc.myY = Math.round(inEvent.offsetY * mouseRatio) /*|| inEvent.layerY*/;// Firefox hack:  || inEvent.layer
					break;
				/*
				case 'mousewheel':
					//TODO?
					break;
				*/
				case 'click':
					this._clicked[inEvent.button] = true;
					this._mouseLoc.myX = Math.round(inEvent.offsetX * mouseRatio);
					this._mouseLoc.myY = Math.round(inEvent.offsetY * mouseRatio);
					break;
				/*
				case 'dblclick':
					//TODO
					break;
				*/	
				case 'mouseout':
					this._active = false;
					break;
					
				case 'mouseover':
					this._active = true;
					break;
				
				default:
					break;
			}
			
			if(this._active === false)
			{
				this._keys = {};
				this._keysPressed = {};
				this._buttons = {};
				this._clicked = {};
			}
		},
		
		render : function render(inGraphics)
		{
			var aCursorPosition;
			
			if(!this._active)
			{
				return;
			}
			
			aCursorPosition = ECGame.EngineLib.AABB2.create(
				0,
				0,
				ECGame.Settings.Debug.Input_MouseCursor_Size,
				ECGame.Settings.Debug.Input_MouseCursor_Size
			);
			
			//center on mouse position by subtracting half the cursor size
			aCursorPosition.setLeftTop(
				this._mouseLoc.subtract(
					aCursorPosition.getWidthHeight().scale(0.5)
				)
				.add(//add the camera offset because the fill rect below will subtract it off again
					(inGraphics.getCamera2D() ?
						inGraphics.getCamera2D().getRect().getLeftTop()
						: ECGame.EngineLib.Point2.create()
					)
				)
			);
			
			if(ECGame.Settings.isDebugDraw_MouseCursor())
			{
				//setup the color
				inGraphics.setFillStyle(ECGame.Settings.Debug.Input_MouseCursor_DrawColor);
				//debug draw it
				inGraphics.fillRect(aCursorPosition);
			}
			
			//TODO need to draw a real cursor
		},
				
		update : function update()
		{
			var i, inputString, inputEvent;
			
			if(ECGame.Settings.DEBUG && !ECGame.Settings.Network.isServer)
			{
				inputString = "Input: " +
					(this._active ? "Active" : "Inactive" ) + 
					" X:" + this._mouseLoc.myX + " Y:" + this._mouseLoc.myY + ' ';
				for(i in this._buttons)
				{
					if(this._buttons[i])
					{
						inputString += "Mouse:" + i + ' ';
					}
				}
				for(i in this._keys)
				{
					if(this._keys[i])
					{
						inputString += "Down:" + '\'' + i + '\' (' + i.charCodeAt(0) + ') ';
					}
				}
				for(i in this._keysPressed)
				{
					if(this._keysPressed[i])
					{
						inputString += "Pressed:" + '\'' + i + '\' (' + i.charCodeAt(0) + ') ';
					}
				}
				//todo clicks and wheel
				
				if(ECGame.Settings.isDebugPrint_Input())
				{
					console.log(inputString + '\n');
				}
				if(ECGame.Settings.isDebugDraw_Input())
				{
					this._myGraphics.drawDebugText(
						inputString,
						(this._active ?
							ECGame.Settings.Debug.Input_Active_DrawColor :
							ECGame.Settings.Debug.Input_Inactive_DrawColor
						)
					);
				}
			}
					
			inputEvent = new ECGame.EngineLib.Events.Input(this._myIndex, this._mouseLoc.clone());
			
			//copy the values from PRIVATE individually so my internal data cannot be changed by users
			for(i in this._buttons)
			{
				inputEvent.buttons[i] = this._buttons[i];
			}
			for(i in this._clicked)
			{
				inputEvent.clicked[i] = this._clicked[i];
			}
			
			if(!this._supressKeyboardEvents)
			{
				for(i in this._keys)
				{
					inputEvent.keys[i] = this._keys[i];
				}
				for(i in this._keysPressed)
				{
					inputEvent.keysPressed[i] = this._keysPressed[i];
				}
			}
			
			//send messages for all the listeners for input
			this.onEvent(inputEvent);
			
			this._keysPressed = {};
			this._clicked = {};
		}
	}
});
