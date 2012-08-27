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

//todo make this a GameObject also!!
//todo rename game rules
GameLib.createGameRules = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	//todo add debug info
		
	instance.init = function()
	{
		GameEngineLib.logger.info("Setting up Game Rules");
		
		//todo register GameLib GameObject classes
		
		//todo setup updaters
		
		//todo create default objects
		var mapSizeInTiles = 16;
		var tileSize = 64;
		var minPhysicsPartitionSize = 8;
		private.GameWorld = GameInstance.GameObjectClasses.findByName("Game2DWorld").create();
		private.GameWorld.deref().init(
			mapSizeInTiles
			,tileSize
			,minPhysicsPartitionSize
		);
		
		//todo should be created with factory?
		var tileset = GameEngineLib.createGame2DTileSet();
		tileset.init(
			[
				{
					fileName : "images/grass.png"
					,anchor : GameEngineLib.createGame2DPoint()
					,layer : 0
					,size : GameEngineLib.createGame2DPoint(64,64)
				},
				{
					fileName : "images/water.png"
					,anchor : GameEngineLib.createGame2DPoint()
					,layer : 0
					,size : GameEngineLib.createGame2DPoint(64,64)
				},
				{
					fileName : "images/ground_level01_01.png" //"images/dirt.png",
					,anchor : GameEngineLib.createGame2DPoint()
					,layer : 0
					,size : GameEngineLib.createGame2DPoint(64,64)
				},
				{
					fileName : "images/dirt.png2"//HACK "images/wall_level01_01__.png"
					,anchor : GameEngineLib.createGame2DPoint()
					,layer : 0
					,size : GameEngineLib.createGame2DPoint(64,64)
				},
				{
					fileName : "images/wall_level01_01.png"
					,anchor : GameEngineLib.createGame2DPoint(32, 32)
					,layer : 1
					,physics : GameEngineLib.createGame2DAABB(0, 0, 64, 64)
					,size : GameEngineLib.createGame2DPoint(96,96)
				},
			]
		);
		//TODO wait until it is loaded to set somehow? or make streaming work properly with scene graph
		
		var map = private.GameWorld.deref().getMap().deref();
		map.setTileSet(tileset);
		
		//hack put something in the map to start with
		for(var i = 0; i < mapSizeInTiles; ++i)
			for(var j = 0; j < mapSizeInTiles; ++j)
				map.setTile(i, j, (i+j)%5);
		
		//todo add entities to world
		
		//TODO test removing components on button preass??
		//TODO test adding components and world in different orders
		private.entity1 = GameInstance.GameObjectClasses.findByName("Entity").create();
		private.entity1Sprite = GameInstance.GameObjectClasses.findByName("EntityComponent_Sprite").create();
		private.entity1.deref().addComponent(private.entity1Sprite);
		private.entity1Input = GameInstance.GameObjectClasses.findByName("EntityComponent_Input").create();
		private.entity1.deref().addComponent(private.entity1Input);
		private.entity1Physics = GameInstance.GameObjectClasses.findByName("EntityComponent_2DPhysics").create();
		private.entity1.deref().addComponent(private.entity1Physics);
		private.entity1Camera = GameInstance.GameObjectClasses.findByName("EntityComponent_2DCamera").create();
		private.entity1Camera.deref().init(
			//GameInstance.Graphics.getWidth(),
			//GameInstance.Graphics.getHeight()
		);//TODO get the size from somewhere and not hardcode it
		private.entity1.deref().addComponent(private.entity1Camera);
		
		private.GameWorld.deref().addEntity(private.entity1);
		private.GameWorld.deref().setCamera(private.entity1Camera);//TODO comment out and fix default camera
		
		if(!GameSystemVars.Network.isServer)
			GameInstance.Input.registerListener("Input", private);
		
			
		
		
		//TODO creating chat UI should NOT be here
		if(!GameSystemVars.Network.isServer && GameSystemVars.Network.isMultiplayer)
		{
			require(["dojo/dom", "dojo/dom-construct", "dojo/on"],
				function(dom, domConstruct, on)
				{
					var chat_container = dom.byId("chat_container");
					var specialChars = {
						'<' : '&lt;',
						'>' : '&gt;',
						'&' : '&amp;'
					};
					
					private.state = domConstruct.create(
	    				"p",
	    				{
	    					id : "status",
	    					//TODO css class
							innerHTML : "Not connected"
						},
						chat_container
					);
					
					private.form = domConstruct.create(
	    				"form",
	    				{
	    					id : "chat_form",
	    					//TODO css class
	    					innerHTML : "Chat"
						},
						chat_container
					);
					
					private.chat = domConstruct.create(
	    				"input",
	    				{
	    					id : "chat",
	    					//TODO css class
	    					type : "text",
	    					placeholder : "type and press enter to chat"
						},
						private.form
					);
					
					private.log = domConstruct.create(
	    				"ul",
	    				{
	    					id : "log"
	    					//TODO css class
						},
						chat_container
					);
					
					private.onChatSubmit = function(event)
					{
						event.preventDefault();
						
						GameInstance.Network.sendData(
							private.chat.value,
							//sentListener:
							{
								onSent : function(inData)
								{
									private.sendChatToChatLog(private.chat.value);
									private.chat.value = '';
								}
							}
						);
					}
					
					private.sendChatToChatLog = function(inMessage)
					{
						//todo remove the the oldest one
						var msg = domConstruct.create(
							"li",
							{
								innerHTML : 
									inMessage.replace(
										/[<>&]/g,
										function(m){ return specialChars[m]; }
									)
								//TODO css class
							},
							private.log
							,"first"
						);
					}
					
					on(private.form, 'submit', private.onChatSubmit);
				}
			);
			private.onConnectedToServer = function(inEvent)
			{
				//TODO remove the UI stuff from this class?
				private.state.className = 'success';//TODO classname css!! (more in this file)
				private.state.innerHTML = 'Socket Open';
			}
			GameInstance.Network.registerListener(
				"ConnectedToServer",
				private
			);
			private.onDisconnectedFromServer = function(inEvent)
			{
				//TODO remove the UI stuff from this class?
				private.state.className = 'fail';//TODO classname css!! (more in this file)
				private.state.innerHTML = 'Socket Closed';
			}
			GameInstance.Network.registerListener(
				"DisconnectedFromServer",
				private
			);
			private.onMsg = function(inEvent)
			{
				private.sendChatToChatLog(inEvent.msg);
			}
			GameInstance.Network.registerListener(
				"Msg",
				private
			);
		}
		
		
		
		
		
		
		return true;
	}
	
	
	instance.render = function(inCanvas2DContext)
	{
		//choose items to render
		private.GameWorld.deref().render(inCanvas2DContext)
	};
	
	
	
	//TODO maybe this should be in an editor or something
	private.onInput = function(inInputEvent)
	{				
		var map = private.GameWorld.deref().getMap().deref();
		var camPoint = private.GameWorld.deref().getCurrentCamera().getRect().getLeftTop();
		var mouseWorldPosition;
				
		if(private.drawTile === undefined)
			private.drawTile = 0;
		
		if(inInputEvent.keysPressed["o"])
		{
			GameSystemVars.Debug.Map_Draw = !GameSystemVars.Debug.Map_Draw;
		}
		if(inInputEvent.keysPressed["p"])
		{
			GameSystemVars.Debug.Physics_Draw= !GameSystemVars.Debug.Physics_Draw;
		}
		if(inInputEvent.keysPressed["i"])
		{
			GameSystemVars.Debug.SceneGraph_Draw= !GameSystemVars.Debug.SceneGraph_Draw;
		}
		if(inInputEvent.keysPressed["0"])
		{
			private.drawTile = 0;
		}
		if(inInputEvent.keysPressed["1"])
		{
			private.drawTile = 1;
		}
		if(inInputEvent.keysPressed["2"])
		{
			private.drawTile = 2;
		}
		if(inInputEvent.keysPressed["3"])
		{
			private.drawTile = 3;
		}
		if(inInputEvent.keysPressed["4"])
		{
			private.drawTile = 4;
		}
		
		if(inInputEvent.buttons[2])
		{
			mouseWorldPosition = inInputEvent.mouseLoc.add(camPoint);
			map.clearTile(
				map.toTileCoordinate(mouseWorldPosition.myX),
				map.toTileCoordinate(mouseWorldPosition.myY)
			);
		}
		if(inInputEvent.buttons[0])
		{
			mouseWorldPosition = inInputEvent.mouseLoc.add(camPoint);
			map.setTile(
				map.toTileCoordinate(mouseWorldPosition.myX),
				map.toTileCoordinate(mouseWorldPosition.myY),
				private.drawTile
			);
		}
		
		//GameInstance.Network.sendData(inInputEvent.mouseLoc.myX + ", " + inInputEvent.mouseLoc.myY);
	}
		
	
	return instance;
}