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

//TODO fade chat container in/out on activity or inactivity
//http://dojotoolkit.org/documentation/tutorials/1.7/animation/
//http://dojotoolkit.org/documentation/tutorials/1.7/effects/
ECGame.EngineLib.ChatSystem = ECGame.EngineLib.Class.create({
	Constructor : function ChatSystem()
	{
		this._jojoDom = null;
		this._jojoDomConstruct = null;
		this._jojoOn = null;
		this._jojoStyle = null;
		
		this._domChatContainer = null;
		this._domNetworkStatus = null;
		this._domChatForm = null;
		this._domChatInput = null;
		this._domChatLog = null;
		
		this._activeInput = false;
		
		this._specialChars = {
			'<' : '&lt;',
			'>' : '&gt;',
			'&' : '&amp;'
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
			var that;
			
			/////////////////////////////////////////////////////////
			//Get dom manipulation objects from dojo
			
			that = this;
			require(['dojo/dom', 'dojo/dom-construct', 'dojo/on', 'dojo/dom-style'],
				function(inDom, inDomConstruct, inDojoOn, inDojoStyle)
				{
					that._jojoDom = inDom;
					that._jojoDomConstruct = inDomConstruct;
					that._jojoOn = inDojoOn;
					that._jojoStyle = inDojoStyle;
				}
			);
			
			//get the chat container from the dom:
			this._domChatContainer = this._jojoDom.byId('chatContainer');//TODO fix this tag!!
			this._jojoStyle.set(this._domChatContainer, 'pointer-events', 'none');
//			this._jojoStyle.set(this._domChatContainer, 'pointer-events', '');
			//Get dom manipulation objects from dojo
			/////////////////////////////////////////////////////////
			
			
						
			/////////////////////////////////////////////////////////
			//Create the dom chat objects
			
			//create a paragraph to contain the connection status
			this._domNetworkStatus = this._jojoDomConstruct.create(
				'p',
				{
					id : 'chatNetworkStatus',
					//TODO css class
					class : 'netDisconnected',
					innerHTML : "Not connected"
				},
				this._domChatContainer
			);
			
			//create a chat log to contain the output!
			this._domChatLog = this._jojoDomConstruct.create(
				'div',
				{
					id : 'chatLog'
				},
				this._domChatContainer
			);
			
			//create a form in the chat container
			this._domChatForm = this._jojoDomConstruct.create(
				'form',
				{
					id : 'chatForm',
					innerHTML : "Chat: "
				},
				this._domChatContainer
			);
			//create an unput object in the chat form
			this._domChatInput = this._jojoDomConstruct.create(
				'input',//TODO may need to ignore this in obfuscation when it isn't auto added from js native globals
				{
					id : 'chatInput',
					type : 'text',
					maxlength : 140,//TODO enforce this on the server side!
					placeholder : "type and press enter to chat"
				},
				that._domChatForm
			);
			
			//Create the dom chat objects
			/////////////////////////////////////////////////////////
			
			
			
			/////////////////////////////////////////////////////////
			//Capture form submits (is the user sending chat info)
			this._jojoOn(
				this._domChatForm
				,'submit'
				,function(inEvent)
				{
					that._onChatSubmit(inEvent);
				}
			);
			//Capture form submits (is the user sending chat info)
			/////////////////////////////////////////////////////////
			
			
			
			/////////////////////////////////////////////////////////
			//Register to listen to messages from the server
			ECGame.instance.Network.registerListener(
				'ConnectedToServer',
				this
			);
			ECGame.instance.Network.registerListener(
				'DisconnectedFromServer',
				this
			);
			ECGame.instance.Network.registerListener(
				'Msg',
				this
			);
			//Register to listen to messages from the server
			/////////////////////////////////////////////////////////
			
			
			
			/////////////////////////////////////////////////////////
			//Listen to main input
			ECGame.instance.Input.registerListener('Input', this);
			//Listen to main input
			/////////////////////////////////////////////////////////
			
		},//End init
		
		
		
		/////////////////////////////////////////////////////////
		//network event listeners
		onConnectedToServer : function onConnectedToServer(inEvent)
		{
			this._domNetworkStatus.className = 'netConnected';
			this._domNetworkStatus.innerHTML = "Connected to Server";
		},
		
		onDisconnectedFromServer : function onDisconnectedFromServer(inEvent)
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
		//Listen to main input
		onInput : function onInput(inInputEvent)
		{
			if(inInputEvent.keysPressed['\x0d'])//return
			{
				this.toggleActiveInput();
			}
			if(inInputEvent.clicked[0] && this._activeInput)
			{
				this.toggleActiveInput();
			}
		},
		//Listen to main input
		/////////////////////////////////////////////////////////
		
		
		
		/////////////////////////////////////////////////////////
		//internal chat events
		
		toggleActiveInput : function toggleActiveInput()
		{
			this._activeInput = !this._activeInput;
			if(this._activeInput)
			{
				this._jojoStyle.set(this._domChatContainer, 'pointer-events', '');
				this._jojoStyle.set(this._domChatContainer, 'border-color', '#00ff00');
				this._domChatInput.focus();
				ECGame.instance.Input.setSupressKeyboardEvents(true);
			}
			else
			{
				this._jojoStyle.set(this._domChatContainer, 'pointer-events', 'none');
				this._jojoStyle.set(this._domChatContainer, 'border-color', '#0000ff');
				this._domChatInput.blur();
				ECGame.instance.Input.setSupressKeyboardEvents(false);
			}
		},
		
		//dom form submit:
		_onChatSubmit : function _onChatSubmit(event)
		{
			event.preventDefault();
			ECGame.instance.Network.sendMessage(
				this._domChatInput.value,
				this//sentListener
			);
			this._domChatInput.value = '';
		},
		
		//append to chat log
		_sendChatToChatLog : function _sendChatToChatLog(inMessage)
		{
			var that, msg;
			that = this;
			msg = this._jojoDomConstruct.create(
				'p',
				{
					innerHTML : 
						inMessage.replace(
							/[<>&]/g,
							function(inIndex){ return that._specialChars[inIndex]; }//TODO debug this sometime to figure out how it works
						)
					//TODO css class (team, enemy, general, etc..)
				},
				this._domChatLog
				//,'first'
			);
			msg.scrollIntoView();
		}
		//internal chat events
		/////////////////////////////////////////////////////////
		
		
	}//End body
});



