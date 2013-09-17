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
		
		initClient : function initClient(inCanvas)
		{
			var aThis = this;
			
			if(ECGame.Settings.Network.isServer)
			{
				return;
			}
				
			require(
				['dojo/on'],
				function importDojoCallback(inOn)
				{
					//keys:
					inOn(document, 'keydown', aThis._onInput);
					inOn(document, 'keyup', aThis._onInput);
					inOn(document, 'keypress', aThis._onInput);
									
					//mouse:
					inOn(inCanvas, 'mousedown', aThis._onInput);
					inOn(inCanvas, 'mouseup', aThis._onInput);
					inOn(inCanvas, 'mousemove', aThis._onInput);
					//inOn(inCanvas, 'mousewheel', aThis._onInput);
					inOn(inCanvas, 'click', aThis._onInput);
					//inOn(inCanvas, 'dblclick', aThis._onInput);
					inOn(inCanvas, 'mouseout', aThis._onInput);
					inOn(inCanvas, 'mouseover', aThis._onInput);
									
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
		
		_onInput : function _onInput(inEvent)
		{
			ECGame.instance.getInput()._handleInput(inEvent);
		},
		
		_handleInput : function _handleInput(inEvent)
		{		
			var eventType = inEvent.type;
			var key;
					
			switch(eventType)
			{
				case 'keydown':
				case 'keyup':
					key = String.fromCharCode(inEvent.keyCode);
					this._keys[key] = (eventType === 'keydown');
					this._keys[inEvent.keyCode] = (eventType === 'keydown');
					break;
					
				case 'keypress':
					key = String.fromCharCode(inEvent.keyCode);
					this._keysPressed[key] = true;
					this._keysPressed[inEvent.keyCode] = true;
					break;
					
				case 'mousedown':
				case 'mouseup':
					this._buttons[inEvent.button] = (eventType === 'mousedown');
					this._clicked[inEvent.button] = (eventType === 'mouseup');//Needed because right mouse doesn't get click event
					this._mouseLoc.myX = inEvent.offsetX;
					this._mouseLoc.myY = inEvent.offsetY;
					break;
					
				case 'mousemove':
					//TODO firefox doesn't like offset, but it is needed.  jquery can fix this.  Need to go back to it from jodo i think.
					this._mouseLoc.myX = inEvent.offsetX /*|| inEvent.layerX*/;// Firefox hack:  || inEvent.layer
					this._mouseLoc.myY = inEvent.offsetY /*|| inEvent.layerY*/;// Firefox hack:  || inEvent.layer
					break;
				/*
				case 'mousewheel':
					//TODO?
					break;
				*/
				case 'click':
					this._clicked[inEvent.button] = true;
					this._mouseLoc.myX = inEvent.offsetX;
					this._mouseLoc.myY = inEvent.offsetY;
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
				
		update : function update()
		{
			var i;
			var inputString;
			var inputEvent;
			
			if(ECGame.Settings.DEBUG && !ECGame.Settings.Network.isServer)
			{
				inputString = "Input: " +
					(this._active ? "Active" : "Inactive" ) + 
					' X:' + this._mouseLoc.myX + ' Y:' + this._mouseLoc.myY + ' ';
				for(i in this._buttons)
				{
					if(this._buttons[i])
					{
						inputString += 'MB' + i + ' ';
					}
				}
				for(i in this._keys)
				{
					if(this._keys[i])
					{
						inputString += '\'' + i + '\' (' + i.charCodeAt(0) + ') ';
					}
				}
				for(i in this._keysPressed)
				{
					if(this._keysPressed[i])
					{
						inputString += '\'' + i + '\' (' + i.charCodeAt(0) + ') ';
					}
				}
				//todo clicks and wheel
				
				if(ECGame.Settings.isDebugPrint_Input())
				{
					console.log(inputString + '\n');
				}
				if(ECGame.Settings.isDebugDraw_Input())
				{
					ECGame.instance.getGraphics().drawDebugText(
						inputString,
						(this._active ?
							ECGame.Settings.Debug.Input_Active_DrawColor :
							ECGame.Settings.Debug.Input_Inactive_DrawColor
						)
					);
				}
			}
					
			inputEvent = new ECGame.EngineLib.Events.Input(this._mouseLoc.clone());
			
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
