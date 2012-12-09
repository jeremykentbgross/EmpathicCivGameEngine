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
GameLib.createGameRules = function(instance, PRIVATE)
{
	instance = instance || {};
	PRIVATE = PRIVATE || {};
	
	//todo add debug info
		
	instance.init = function()
	{
		//GameEngineLib.logger.info("Setting up Game Rules");
		
		//todo register GameLib GameObject classes
		
		//todo setup updaters
		
		//todo create default objects
		var mapSizeInTiles = 16;
		var tileSize = 64;
		var minPhysicsPartitionSize = 8;
		PRIVATE.GameWorld = GameEngineLib.Game2DWorld.create();
		PRIVATE.GameWorld.init(
			mapSizeInTiles
			,tileSize
			,minPhysicsPartitionSize
		);
		
		//todo should be created with factory?
		var tileset = GameEngineLib.Game2DTileSet.create();
		tileset.init(
			[
				{
					fileName : 'images/grass.png'
					,anchor : GameEngineLib.createGame2DPoint()
					,layer : 0
					,size : GameEngineLib.createGame2DPoint(64,64)
				},
				{
					fileName : 'images/water.png'
					,anchor : GameEngineLib.createGame2DPoint()
					,layer : 0
					,size : GameEngineLib.createGame2DPoint(64,64)
				},
				{
					fileName : 'images/ground_level01_01.png' //'images/dirt.png',
					,anchor : GameEngineLib.createGame2DPoint()
					,layer : 0
					,size : GameEngineLib.createGame2DPoint(64,64)
				},
				{
					fileName : 'images/dirt.png2'//HACK 'images/wall_level01_01__.png'
					,anchor : GameEngineLib.createGame2DPoint()
					,layer : 0
					,size : GameEngineLib.createGame2DPoint(64,64)
				},
				{
					fileName : 'images/wall_level01_01.png'
					,anchor : GameEngineLib.createGame2DPoint(32, 32)
					,layer : 1
					,physics : GameEngineLib.createGame2DAABB(0, 0, 64, 64)
					,size : GameEngineLib.createGame2DPoint(96,96)
				}
				//,
			]
		);
		//TODO wait until it is loaded to set somehow? or make streaming work properly with scene graph
		
		var map = PRIVATE.GameWorld.getMap();
		map.setTileSet(tileset);
		
		//hack put something in the map to start with
		var i;
		var j;
		for(i = 0; i < mapSizeInTiles; ++i)
		{
			for(j = 0; j < mapSizeInTiles; ++j)
			{
				map.setTile(new GameEngineLib.Game2DPoint(i, j), (i+j)%5);
			}
		}
		
		//todo add entities to world
		
		//TODO test removing components on button preass??
		//TODO test adding components and world in different orders
		PRIVATE.entity1 = GameEngineLib.GameEntity.create();
		PRIVATE.entity1Sprite = GameEngineLib.EntityComponent_Sprite.create();
		PRIVATE.entity1Sprite.init();
		PRIVATE.entity1.addComponent(PRIVATE.entity1Sprite);
		PRIVATE.entity1Input = GameEngineLib.EntityComponent_Input.create();
		PRIVATE.entity1.addComponent(PRIVATE.entity1Input);
		PRIVATE.entity1Physics = GameEngineLib.EntityComponent_2DPhysics.create();
		PRIVATE.entity1.addComponent(PRIVATE.entity1Physics);
		PRIVATE.entity1Camera = GameEngineLib.EntityComponent_2DCamera.create();
		PRIVATE.entity1Camera.init(
			//GameInstance.Graphics.getWidth(),
			//GameInstance.Graphics.getHeight()
		);//TODO get the size from somewhere and not hardcode it
		PRIVATE.entity1.addComponent(PRIVATE.entity1Camera);
		
		PRIVATE.GameWorld.addEntity(PRIVATE.entity1);
		PRIVATE.GameWorld.setCamera(PRIVATE.entity1Camera);//TODO comment out and fix default camera
		
		if(!GameSystemVars.Network.isServer)
		{
			GameInstance.Input.registerListener('Input', PRIVATE);
		}
		
		PRIVATE.onIdentifiedUser = function(inEvent)
		{
			GameEngineLib.logger.info("setting owner for physics component: " + inEvent.user.userName );
			PRIVATE.entity1Physics.setNetOwner(inEvent.user.userID);
		};
		
		if(GameSystemVars.Network.isMultiplayer)
		{
			GameInstance.Network.registerListener(
				'IdentifiedUser',
				PRIVATE
			);
		}
		
		
		//TODO creating chat UI should NOT be here
		if(!GameSystemVars.Network.isServer && GameSystemVars.Network.isMultiplayer)
		{
			require(['dojo/dom', 'dojo/dom-construct', 'dojo/on'],
				function(dom, domConstruct, on)
				{
					var chat_container = dom.byId("chat_container");
					var specialChars = {
						'<' : '&lt;',
						'>' : '&gt;',
						'&' : '&amp;'
					};

					PRIVATE.state = domConstruct.create(
						'p',
						{
							id : 'status',
							//TODO css class
							innerHTML : "Not connected"
						},
						chat_container
					);

					PRIVATE.form = domConstruct.create(
						'form',
						{
							id : 'chat_form',
							//TODO css class
							innerHTML : "Chat"
						},
						chat_container
					);
					
					PRIVATE.chat = domConstruct.create(
						'input',
						{
							id : 'chat',
							//TODO css class
							type : 'text',
							placeholder : "type and press enter to chat"
						},
						PRIVATE.form
					);
					
					PRIVATE.log = domConstruct.create(
						'ul',
						{
							id : 'log'
							//TODO css class
						},
						chat_container
					);
					
					PRIVATE.onChatSubmit = function(event)
					{
						event.preventDefault();
						
						GameInstance.Network.sendMessage(
							PRIVATE.chat.value,
							//sentListener:
							{
								onSent : function(inData)
								{
									PRIVATE.sendChatToChatLog(PRIVATE.chat.value);
									PRIVATE.chat.value = '';
								}
							}
						);
					};
					
					PRIVATE.sendChatToChatLog = function(inMessage)
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
							PRIVATE.log
							,'first'
						);
					};
					
					on(PRIVATE.form, 'submit', PRIVATE.onChatSubmit);
				}
			);
			PRIVATE.onConnectedToServer = function(inEvent)
			{
				//TODO remove the UI stuff from this class?
				PRIVATE.state.className = 'success';//TODO classname css!! (more in this file)
				PRIVATE.state.innerHTML = 'Socket Open';
			};
			GameInstance.Network.registerListener(
				'ConnectedToServer',
				PRIVATE
			);
			PRIVATE.onDisconnectedFromServer = function(inEvent)
			{
				//TODO remove the UI stuff from this class?
				PRIVATE.state.className = 'fail';//TODO classname css!! (more in this file)
				PRIVATE.state.innerHTML = 'Socket Closed';
			};
			GameInstance.Network.registerListener(
				'DisconnectedFromServer',
				PRIVATE
			);
			PRIVATE.onMsg = function(inEvent)
			{
				PRIVATE.sendChatToChatLog(inEvent.msg);
			};
			GameInstance.Network.registerListener(
				'Msg',
				PRIVATE
			);
		}
		
		
		//HACK!!!!!!!!!!!!!!!//HACK!!!!!!!!!!!!!!!//HACK!!!!!!!!!!!!!!!
		if(!GameSystemVars.Network.isServer)
		{
			//HACK!!!!!!!!!!!!!!!
			var i, frames = [];
			for(i = 0; i < 8; ++i)
			{
				frames.push(
					GameEngineLib.Animation2DFrame.create().init(
						new GameEngineLib.Game2DAABB(96 * (i + 1), 0, 96/* +(i*10)*/, 96/* +(i*10)*/),
						new GameEngineLib.Game2DPoint(64/* + (i % 4)*/, 64/* + (i % 4)*/)
					)
				);
			}
			instance.anim = new GameEngineLib.Animation2D();
			instance.anim.init('images/test_anims_run/jogSheet.png', 10, frames);
			instance.pos = new GameEngineLib.Game2DPoint(128,128);
			//instance.frame = 0;
			instance.animInst = new GameEngineLib.Animation2DInstance();
			instance.animInst.animation = instance.anim;
			GameInstance.UpdateOrder.push(instance.animInst);
		}//HACK!!!!!!!!!!!!!!!//HACK!!!!!!!!!!!!!!!//HACK!!!!!!!!!!!!!!!
		
		return true;
	};
	

	
	instance.render = function(inCanvas2DContext)
	{
		//choose items to render
		PRIVATE.GameWorld.render(inCanvas2DContext);
		
		//HACK		
		/*instance.anim*/instance.animInst.render(
			inCanvas2DContext,
			PRIVATE.GameWorld.getCurrentCamera().getRect(),
			instance.frame % instance.anim.getFrameCount(),
			instance.pos
		);
		/*instance.anim*/instance.animInst.debugDraw(
			inCanvas2DContext,
			PRIVATE.GameWorld.getCurrentCamera().getRect(),
			instance.frame % instance.anim.getFrameCount(),
			instance.pos
		);
		instance.animInst.anchorPosition = instance.pos;
		//instance.pos.myX += 1;
		//instance.pos.myY += 1;
		//instance.frame++;
	};
	
	
	
	//TODO maybe this should be in an editor or something
	PRIVATE.onInput = function(inInputEvent)
	{				
		var map = PRIVATE.GameWorld.getMap();
		var camRect = PRIVATE.GameWorld.getCurrentCamera().getRect();
		var camPoint = camRect.getLeftTop();		
		var mouseWorldPosition = inInputEvent.mouseLoc.add(camPoint);
		//var soundTime = GameInstance.soundSystem.getSoundHardwareTime();//TODO timer.getTime() should work too!
		
		//TODO should be in component (and world)
		GameInstance.soundSystem.setListenerPosition(camRect.getCenter());
		
		if(PRIVATE.drawTile === undefined)
		{
			PRIVATE.drawTile = 0;
		}
		
		if(inInputEvent.keysPressed['\x67'])//g
		{
			PRIVATE.lastSoundPlayed = GameInstance.soundSystem.playSoundEffect(0);
		}
		if(inInputEvent.keysPressed['\x68'])//h
		{
			PRIVATE.lastSoundPlayed = GameInstance.soundSystem.playPositionalSoundEffect2D(
				0,
				new GameEngineLib.Game2DPoint(
					mouseWorldPosition.myX,//2 * mouseWorldPosition.myX / camRect.myWidth - 1 + 10,
					mouseWorldPosition.myY//2 * mouseWorldPosition.myY / camRect.myHeight - 1
				)
				//camRect
			);
		}
		if(inInputEvent.keysPressed['\x74'])//t
		{
			if(!PRIVATE.lastSoundPlayed.isFinished())
			{
				PRIVATE.lastSoundPlayed.stop();
			}
		}
		if(inInputEvent.keysPressed['\x6c'])//l
		{
			GameInstance.soundSystem.setMasterVolume(0.1);
		}
		if(inInputEvent.keysPressed['\x6b'])//k
		{
			GameInstance.soundSystem.setMasterVolume(0.5);
		}
		if(inInputEvent.keysPressed['\x6a'])//j
		{
			GameInstance.soundSystem.setMasterVolume(1.0);
		}
		if(PRIVATE.lastSoundPlayed && PRIVATE.lastSoundPlayed.setPosition)
		{
			if(PRIVATE.lastSoundPlayed.isPlaying())
			{
				PRIVATE.lastSoundPlayed.setPosition(mouseWorldPosition);
				PRIVATE.lastSoundPlayed.setVelocity(
					mouseWorldPosition
						.sub(PRIVATE.lastMouseWorldPosition)
						//.multiply(/*0.001*/1/(soundTime-PRIVATE.lastSoundTime))
						.multiply(1/GameInstance.soundSystem.getSoundHardwareTimeUpdateDelta())
				);
			}
		}
		
		
		if(inInputEvent.keysPressed['\x6f'])//o
		{
			GameSystemVars.Debug.Map_Draw = !GameSystemVars.Debug.Map_Draw;
		}
		if(inInputEvent.keysPressed['\x70'])//p
		{
			GameSystemVars.Debug.Physics_Draw = !GameSystemVars.Debug.Physics_Draw;
		}
		if(inInputEvent.keysPressed['\x69'])//i
		{
			GameSystemVars.Debug.SceneGraph_Draw = !GameSystemVars.Debug.SceneGraph_Draw;
		}
		if(inInputEvent.keysPressed['\x75'])//u
		{
			GameSystemVars.Debug.Input_Draw = !GameSystemVars.Debug.Input_Draw;
		}
		
		
		if(inInputEvent.keysPressed['0'])
		{
			PRIVATE.drawTile = 0;
		}
		if(inInputEvent.keysPressed['1'])
		{
			PRIVATE.drawTile = 1;
		}
		if(inInputEvent.keysPressed['2'])
		{
			PRIVATE.drawTile = 2;
		}
		if(inInputEvent.keysPressed['3'])
		{
			PRIVATE.drawTile = 3;
		}
		if(inInputEvent.keysPressed['4'])
		{
			PRIVATE.drawTile = 4;
		}
		
		if(inInputEvent.buttons[2])
		{
			map.clearTile(map.toTileCoordinate(mouseWorldPosition));
		}
		if(inInputEvent.buttons[0])
		{
			map.setTile(map.toTileCoordinate(mouseWorldPosition), PRIVATE.drawTile);
		}
		
		PRIVATE.lastMouseWorldPosition = mouseWorldPosition;
		//PRIVATE.lastSoundTime = soundTime;
		
		//GameInstance.Network.sendMessage(inInputEvent.mouseLoc.myX + ', ' + inInputEvent.mouseLoc.myY);
	};
		
	
	return instance;
};