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

//TODO consider the following!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//	Safe Sandbox this in iframe:
//	http://www.html5rocks.com/en/tutorials/security/sandboxed-iframes/

//TODO fade chat container in/out on activity or inactivity
//http://dojotoolkit.org/documentation/tutorials/1.7/animation/
//http://dojotoolkit.org/documentation/tutorials/1.7/effects/
ECGame.EngineLib.ChatSystem = ECGame.EngineLib.Class.create({
	Constructor : function ChatSystem()
	{
		this._domChatContainer = null;
		this._domNetworkStatus = null;
		this._domChatForm = null;
		this._domChatInput = null;
		this._domChatLog = null;
		
		this._activeInput = false;
		
		this._specialChars = {
			'<' : '&lt;',
			'>' : '&gt;',
			'&' : '&amp;'//TODO change these to be in some shared code
		};
		
		this.init();
	},
	
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		init : function init()
		{
			var aThis;
			
			aThis = this;
			
			//get the chat container from the dom:
			this._domChatContainer = document.getElementById('chatContainer');
			
			//set dynamic style to not accept mouse events:
			this._domChatContainer.style['pointer-events'] = 'none';
			
			
			
			/////////////////////////////////////////////////////////
			//Create the dom chat objects
			
			//create a paragraph to contain the connection status
			this._domNetworkStatus = document.createElement('p');
			this._domNetworkStatus.id = 'chatNetworkStatus';
			this._domNetworkStatus.class = 'netDisconnected';
			this._domNetworkStatus.innerHTML = "Not connected";
			this._domChatContainer.appendChild(this._domNetworkStatus);
			
			//create a chat log to contain the output!
			this._domChatLog = document.createElement('div');
			this._domChatLog.id = 'chatLog';
			this._domChatContainer.appendChild(this._domChatLog);
			
			//create a form in the chat container
			this._domChatForm = document.createElement('form');
			this._domChatForm.id = 'chatForm';
			this._domChatForm.innerHTML = "Chat: ";
			this._domChatContainer.appendChild(this._domChatForm);
			
			//http://stackoverflow.com/questions/773517/style-input-element-to-fill-remaining-width-of-its-container
			
			//create an unput object in the chat form
			this._domChatInput = document.createElement('input');
			this._domChatInput.id = 'chatInput';
			this._domChatInput.type = 'text';
			this._domChatInput.placeholder = "type and press enter to chat";
			this._domChatInput.maxLength =
				//maxlength doesn't seem to work, even tho w3 says maxlength for input elements and maxLength for Text elements
				//this._domChatInput.maxlength =
				140;//TODO enforce this on the server side! also make system variable!!
			this._domChatForm.appendChild(this._domChatInput);
			
			//Create the dom chat objects
			/////////////////////////////////////////////////////////
			
			
			
			/////////////////////////////////////////////////////////
			//handle all the input stuff
			
			//Capture form submits (is the user sending chat info)
			this._domChatForm.addEventListener(
				'submit'
				,function onChatSubmit(inEvent)
				{
aThis._sendChatToChatLog("**CHAT IS BROKEN ATM**: " + aThis._domChatInput.value);//TODO remove hack send to log which doesnt go here
					aThis._onChatSubmit();
					inEvent.preventDefault();
				}
				,false//TODO should this be false??
			);
			
			//disable tab key for the window
			window.onkeydown = function disableTab(inEvent)
			{
				if(inEvent.keyCode === ECGame.EngineLib.Input.KEYBOARD.KEY_TAB)
				{
					inEvent.preventDefault();
				}
			};
			
			//if the chat lost focus, toggle off the input
			this._domChatInput.addEventListener(
				'blur'
				,function onBlur(/*inEvent*/)
				{
					if(aThis._activeInput)
					{
						aThis.toggleActiveInput();
					}
				}
			);
			
			//handle input for starting or finishing chat
			document.addEventListener(
				'keyup'
				,function onInput(inEvent)
				{
					if(inEvent.keyCode === ECGame.EngineLib.Input.KEYBOARD.KEY_RETURN)
					{
						aThis.toggleActiveInput();
					}
					if(aThis._activeInput && inEvent.keyCode === ECGame.EngineLib.Input.KEYBOARD.KEY_TAB)
					{
						aThis.toggleActiveInput();
						inEvent.preventDefault();
						inEvent.stopPropagation();
					}
				}
				,true
			);
			
			//handle all the input stuff
			/////////////////////////////////////////////////////////
			
			
			
			/////////////////////////////////////////////////////////
			//Register to listen to messages from the server
			ECGame.instance.getNetwork().registerListener(
				'ConnectedToServer',
				this
			);
			ECGame.instance.getNetwork().registerListener(
				'DisconnectedFromServer',
				this
			);
			ECGame.instance.getNetwork().registerListener(
				'Msg',
				this
			);
			//Register to listen to messages from the server
			/////////////////////////////////////////////////////////

		},//End init
		
		
		
		/////////////////////////////////////////////////////////
		//network event listeners
		onConnectedToServer : function onConnectedToServer(/*inEvent*/)
		{
			this._domNetworkStatus.className = 'netConnected';
			this._domNetworkStatus.innerHTML = "Connected to Server";
		},
		
		onDisconnectedFromServer : function onDisconnectedFromServer(/*inEvent*/)
		{
			this._domNetworkStatus.className = 'netDisconnected';
			this._domNetworkStatus.innerHTML = "Not connected to Server";
		},
		
		onMsg : function onMsg(inEvent)
		{
			this._sendChatToChatLog(inEvent.msg);
		},
		
		onSentMessage : function onSentMessage(inMsg)//TODO proper event instead!!
		{
			this._sendChatToChatLog(inMsg);
		},
		//network event listeners
		/////////////////////////////////////////////////////////
		
		
		
		/////////////////////////////////////////////////////////
		//internal chat events
		
		toggleActiveInput : function toggleActiveInput()
		{
			this._activeInput = !this._activeInput;
			if(this._activeInput)
			{
				this._domChatContainer.style['pointer-events'] = '';
				this._domChatContainer.style['border-color'] = '#00ff00';
				this._domChatInput.focus();
				//TODO for all inputs
				ECGame.instance.getInput().setSupressKeyboardEvents(true);
			}
			else
			{
				this._domChatContainer.style['pointer-events'] = 'none';
				this._domChatContainer.style['border-color'] = '#0000ff';
				this._domChatInput.blur();
				//TODO for all inputs
				ECGame.instance.getInput().setSupressKeyboardEvents(false);
			}
		},
		
		//dom form submit:
		_onChatSubmit : function _onChatSubmit()
		{
			ECGame.instance.getNetwork().sendMessage(
				this._domChatInput.value,
				this//sentListener
			);
			this._domChatInput.value = '';
		},
		
		//append to chat log
		_sendChatToChatLog : function _sendChatToChatLog(inMessage)
		{
			var aThis, msg;
			aThis = this;

			msg = document.createElement('p');
			msg.innerHTML = inMessage.replace(
				/[<>&]/g,
				function replaceCallback(inIndex)
				{
					return aThis._specialChars[inIndex];
				}
			);
			//TODO css class (team, enemy, general, etc..)
			this._domChatLog.appendChild(msg);
			msg.scrollIntoView();
		}
		//internal chat events
		/////////////////////////////////////////////////////////
		
		
	}//End body
});



