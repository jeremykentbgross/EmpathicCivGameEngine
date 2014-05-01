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
		this.EventSystem();
		this._mouseLoc = ECGame.EngineLib.Point2D.create(0, 0);
		this._keys = {};
		this._keysPressed = {};
		this._buttons = {};
		this._clicked = {};
		this._active = false;
		
		this._myGraphics = null;
		this._myIndex = 0;
		
		ECGame.instance.getUpdater("MasterUpdater").addUpdate(this);
	},
	Parents : [ECGame.EngineLib.EventSystem],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		KEYBOARD : {
			KEY_TAB : 9,
			KEY_RETURN : 13,
			KEY_ESC : 27,
			
			KEY_0 : 48,
			KEY_1 : 49,
			KEY_2 : 50,
			KEY_3 : 51,
			KEY_4 : 52,
			KEY_5 : 53,
			KEY_6 : 54,
			KEY_7 : 55,
			KEY_8 : 56,
			KEY_9 : 57,
			
			KEY_A : 65,
			KEY_B : 66,
			KEY_C : 67,
			KEY_D : 68,
			KEY_E : 69,
			KEY_F : 70,
			KEY_G : 71,
			KEY_H : 72,
			KEY_I : 73,
			KEY_J : 74,
			KEY_K : 75,
			KEY_L : 76,
			KEY_M : 77,
			KEY_N : 78,
			KEY_O : 79,
			KEY_P : 80,
			KEY_Q : 81,
			KEY_R : 82,
			KEY_S : 83,
			KEY_T : 84,
			KEY_U : 85,
			KEY_V : 86,
			KEY_W : 87,
			KEY_X : 88,
			KEY_Y : 89,
			KEY_Z : 90,
			
			//WARNING: all the lower case ones don't seem to be generated in firefox!!
			KEY_a : 97,
			KEY_b : 98,
			KEY_c : 99,
			KEY_d : 100,
			KEY_e : 101,
			KEY_f : 102,
			KEY_g : 103,
			KEY_h : 104,
			KEY_i : 105,
			KEY_j : 106,
			KEY_k : 107,
			KEY_l : 108,
			KEY_m : 109,
			KEY_n : 110,
			KEY_o : 111,
			KEY_p : 112,
			KEY_q : 113,
			KEY_r : 114,
			KEY_s : 115,
			KEY_t : 116,
			KEY_u : 117,
			KEY_v : 118,
			KEY_w : 119,
			KEY_x : 120,
			KEY_y : 121,
			KEY_z : 122
		},
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
				aThis._handleInput(inEvent);
			};
			
			//keys:
			document.addEventListener('keydown', aOnInput, false);
			document.addEventListener('keyup', aOnInput, false);
			document.addEventListener('keypress', aOnInput, false);
							
			//mouse:
			inCanvas.addEventListener('mousedown', aOnInput, false);
			inCanvas.addEventListener('mouseup', aOnInput, false);
			inCanvas.addEventListener('mousemove', aOnInput, false);
			//inOn(inCanvas, 'mousewheel', aOnInput);
			inCanvas.addEventListener('click', aOnInput, false);
			//inOn(inCanvas, 'dblclick', aOnInput);
			inCanvas.addEventListener('mouseout', aOnInput, false);
			inCanvas.addEventListener('mouseover', aOnInput, false);
							
			//prevent right click menu on the render area
			inCanvas.addEventListener(
				'contextmenu'
				,function blockContextMenu(inEvent){inEvent.preventDefault();}
				,false
			);
			
			//TODO can i turn off middle mouse button native effect
		},
		
		setSupressKeyboardEvents : function setSupressKeyboardEvents(inSupress)
		{
			this._supressKeyboardEvents = inSupress;
		},
		
		_handleInput : function _handleInput(inEvent)
		{
			var eventType
				,mouseRatio
				;
			
			eventType = inEvent.type;
			mouseRatio = this._myGraphics.getBackBufferToFrontBufferRatio();
			
			//calculate offset if it is not present (firefox limitation)
			inEvent.offsetX = inEvent.offsetX !== undefined ? inEvent.offsetX : inEvent.layerX - inEvent.target.offsetLeft;
			inEvent.offsetY = inEvent.offsetY !== undefined ? inEvent.offsetY : inEvent.layerY - inEvent.target.offsetTop;
			
			switch(eventType)
			{
				case 'keydown':
				case 'keyup':
					this._keys[inEvent.keyCode] = (eventType === 'keydown');
					this._keysPressed[inEvent.keyCode] = (eventType === 'keyup');
					break;
					
				case 'keypress':
					this._keysPressed[inEvent.keyCode] = true;
					break;
					
				case 'mousedown':
				case 'mouseup':
					this._buttons[inEvent.button] = (eventType === 'mousedown');
					this._clicked[inEvent.button] = (eventType === 'mouseup');//Needed because right mouse doesn't get click event
					this._mouseLoc.myX = Math.round(inEvent.offsetX * mouseRatio);
					this._mouseLoc.myY = Math.round(inEvent.offsetY * mouseRatio);
					break;
					
				case 'mousemove':
					this._mouseLoc.myX = Math.round(inEvent.offsetX * mouseRatio);
					this._mouseLoc.myY = Math.round(inEvent.offsetY * mouseRatio);
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
			
			aCursorPosition = ECGame.EngineLib.AABB2D.create(
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
						inGraphics.getCamera2D().getCaptureVolumeAABB2D().getLeftTop()
						: ECGame.EngineLib.Point2D.create()
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
				
		update : function update(/*inUpdateData*/)
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
						inputString += "Down:" + '\'' + String.fromCharCode(i) + '\' (' + i + ') ';
					}
				}
				for(i in this._keysPressed)
				{
					if(this._keysPressed[i])
					{
						inputString += "Pressed:" + '\'' + String.fromCharCode(i) + '\' (' + i + ') ';
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
