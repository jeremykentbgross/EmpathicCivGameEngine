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


GameEngineLib.ChatSystem = GameEngineLib.Class({
	Constructor : function ChatSystem(){this.init();},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init()
		{
			var that = this;
			
			require(['dojo/dom', 'dojo/dom-construct', 'dojo/on'],
				function(dom, domConstruct, on)
				{
					var chat_container, specialChars;
					
					//get the chat container from the dom:
					chat_container = dom.byId("chat_container");
					
					specialChars = {
						'<' : '&lt;',
						'>' : '&gt;',
						'&' : '&amp;'
					};

					//create a paragraph to contain the connection status
					that._state = domConstruct.create(
						'p',
						{
							id : 'status',
							//TODO css class
							innerHTML : "Not connected"
						},
						chat_container
					);

					//create a form in the chat container
					that._form = domConstruct.create(
						'form',
						{
							id : 'chat_form',
							//TODO css class
							innerHTML : "Chat"
						},
						chat_container
					);
					
					//create an unput object in the chat form
					//TODO limit it to a certain number of characters!!
					that._chat = domConstruct.create(
						'input',
						{
							id : 'chat',
							//TODO css class
							type : 'text',
							placeholder : "type and press enter to chat"
						},
						that._form
					);
					
					//create a chat log to contain the output!
					that._log = domConstruct.create(
						'ul',
						{
							id : 'log'
							//TODO css class
						},
						chat_container
					);
					
					//TODO move this function out of init!!
					that.onChatSubmit = function onChatSubmit(event)
					{
						event.preventDefault();
						
						GameInstance.Network.sendMessage(
							that._chat.value,
							//sentListener:
							{//TODO move this function out of init!! (AND SEND 'this')
								onSent : function(inData)
								{
									that.sendChatToChatLog(that._chat.value);
									that._chat.value = '';
								}
							}
						);
					};
					
					//TODO move this function out of init!!
					that.sendChatToChatLog = function sendChatToChatLog(inMessage)
					{
						//todo remove the the oldest one
						var msg = domConstruct.create(
							'li',
							{
								innerHTML : 
									inMessage.replace(
										/[<>&]/g,
										function(m){ return specialChars[m]; }
									)
								//TODO css class
							},
							that._log
							,'first'
						);
					};
					
					on(that._form, 'submit', that.onChatSubmit);
				}
			);//End Dom
			
			
			
			/////////////////////////////////////////////////////////
			//Register to listen to messages from the server
			GameInstance.Network.registerListener(
				'ConnectedToServer',
				this
			);
			GameInstance.Network.registerListener(
				'DisconnectedFromServer',
				this
			);
			GameInstance.Network.registerListener(
				'Msg',
				this
			);
			//Register to listen to messages from the server
			/////////////////////////////////////////////////////////
			
		},//End init
		
		onConnectedToServer : function onConnectedToServer(inEvent)
		{
			//TODO remove the UI stuff from this class?
			this._state.className = 'success';//TODO classname css!! (more in this file)
			this._state.innerHTML = 'Socket Open';
		},
		
		onDisconnectedFromServer : function onDisconnectedFromServer(inEvent)
		{
			//TODO remove the UI stuff from this class?
			this._state.className = 'fail';//TODO classname css!! (more in this file)
			this._state.innerHTML = 'Socket Closed';
		},
		
		onMsg : function onMsg(inEvent)
		{
			this.sendChatToChatLog(inEvent.msg);
		}
		
	}//End body
});




				
				
				