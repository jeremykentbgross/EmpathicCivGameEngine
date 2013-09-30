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


ECGame.Lib.GameRules = ECGame.EngineLib.Class.create({
	Constructor : function GameRules()
	{
		this.GameRulesBase();
		
		ECGame.Settings.Graphics.mode = ECGame.Settings.Graphics.MODES.SPLIT_HORIZONTAL;
		
		//constants:
		this._mapSizeInTiles = 64;
		this._tileSize = 64;
		this._minPhysicsPartitionSize = 8;
		
		//game world
		this._gameWorld = null;
		this._map = null;
		this._tileset = null;
		
		//entity stuff:
		this._animations = [];
		this._referenceEntity = null;
		this._referenceEntityInputComponent = null;
		this._referenceEntitySpriteComponent = null;
		this._referenceEntityPhysicsComponent = null;
		this._referenceEntityCameraComponent = null;
		
		this._entities = [];
		
		//editor stuff:
		this._drawTile = 0;
		
		//sound test stuff
		this._lastSoundPlayed = null;
		this._lastMouseWorldPosition = null;
		
		//testing rays:
		this._isRayTestMode = true;
		this._rayStart = ECGame.EngineLib.Point2.create();
		this._rayEnd = ECGame.EngineLib.Point2.create();
	},
	
	Parents : [ECGame.EngineLib.GameRulesBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init()
		{
			var
				animation
				,frames
				,i
				,j
			;
			
			/////////////////////////////////////////////////////////
			//todo register ECGame.Lib GameObject classes
			
			//todo setup updaters
			
			//todo create default objects
			/////////////////////////////////////////////////////////
			
			
			
			/////////////////////////////////////////////////////////
			//setup event listeners
			if(!ECGame.Settings.Network.isServer)
			{
				ECGame.instance.getInput().registerListener('Input', this);
			}
			if(ECGame.Settings.Network.isMultiplayer)
			{
				ECGame.instance.getNetwork().registerListener(
					'IdentifiedUser',//TODO use actual event class to de/register listener(s)
					this
				);
				ECGame.instance.getNetwork().registerListener(
					'ClientDisconnected',//TODO use actual event class to de/register listener(s)
					this
				);
				this._myMasterNetGroup = ECGame.instance.getNetwork().getNetGroup('master_netgroup');
			}
			//setup event listeners
			/////////////////////////////////////////////////////////
			
			
			
			/////////////////////////////////////////////////////////
			//create and initialize a game world
			this._gameWorld = ECGame.EngineLib.World2D.create(
				this._mapSizeInTiles
				,this._tileSize
				,this._minPhysicsPartitionSize
			);
			this._tileset = ECGame.EngineLib.TileSet2D.create(
				[
					{
						fileName : 'game/images/grass.png'
						,anchor : ECGame.EngineLib.Point2.create()
						,_myLayer : 0
						,size : ECGame.EngineLib.Point2.create(64,64)
					},
					{
						fileName : 'game/images/test/waterSub.png' //'images/water.png'
						,anchor : ECGame.EngineLib.Point2.create()
						,_myLayer : 0
						,size : ECGame.EngineLib.Point2.create(/*64,64*/96,96)
						,physics : ECGame.EngineLib.AABB2.create(0, 0, 64, 64)
					},
					{
						fileName : 'game/images/ground_256.png'//'game/images/ground_level01_01.png' //'images/test/groundSub5.png' // 'images/dirt.png',
						,anchor : ECGame.EngineLib.Point2.create()
						,_myLayer : 0
						,size : ECGame.EngineLib.Point2.create(96,96)//64,64)
					},
					{
						fileName : 'game/images/dirt.png2'//HACK 'images/wall_level01_01__.png'
						,anchor : ECGame.EngineLib.Point2.create()
						,_myLayer : 0
						,size : ECGame.EngineLib.Point2.create(64,64)
					},
					{
						fileName : 'game/images/wall_256.png'//'game/images/wall_level01_01.png'//'images/test/wall.png' //
						,anchor : ECGame.EngineLib.Point2.create(32, 32)
						,_myLayer : 1
						,physics : ECGame.EngineLib.AABB2.create(0, 0, 64, 64)
						,size : ECGame.EngineLib.Point2.create(96,96)
					}
					//,
				]
			);
			this._map = this._gameWorld.getMap();
			this._map.setTileSet(this._tileset);
			if(ECGame.Settings.Network.isMultiplayer)
			{
				this._myMasterNetGroup.addObject(this._gameWorld);
			}
			
			/////////////////////////////////////////////
			//HACK put something in the map to start with
			if(ECGame.Settings.Network.isServer)
			{
				for(i = 0; i < this._mapSizeInTiles; ++i)
				{
					for(j = 0; j < this._mapSizeInTiles; ++j)
					{
						if(i === 0 || j === 0 || i === this._mapSizeInTiles - 1 || j === this._mapSizeInTiles - 1)
						{
							this._map.setTile(
								new ECGame.EngineLib.Point2(i, j), 
								4//(i+j)%5
							);
						}
						else
						{
							this._map.setTile(
								new ECGame.EngineLib.Point2(i, j),
								2//(i+j)%5
							);
						}
					}
				}
				this._myMasterNetGroup.addObject(this._map);
			}
			/*for(i = 0; i < 64; ++i)
			{
				this._map.setTile(new ECGame.EngineLib.Point2(i, Math.floor(Math.random()*this._mapSizeInTiles)), 4);
			}*/
			if(ECGame.Settings.Network.isServer)
			{
				var aMap = this._map;
				var aIndex = 0;
				//console.log("SETTING TIMER TO TRY TO SET MAP TILE");
				ECGame.instance.getTimer().setTimerCallback(
					2000,
					function()
					{
						//console.log("TRYING TO SET MAP TILE");
						aMap.setTile(
							new ECGame.EngineLib.Point2(6, ++aIndex), 
							4
						);
						//console.log("SHOULD HAVE SET MAP TILE");
						return aIndex < 32;
					}
				);
			}
			//HACK put something in the map to start with
			/////////////////////////////////////////////
			
			//create and initialize a game world
			/////////////////////////////////////////////////////////
			
			
			
			/////////////////////////////////////////////////////////
			//create audio assets
			if(ECGame.Settings.Caps.Audio)
			{
				ECGame.instance.getSoundSystem().loadSoundAssets(
					[
						new ECGame.EngineLib.SoundAsset(ECGame.instance.getSoundSystem().generateNextAssetID()
							,'game/sounds/Step1_Gravel.wav')
						,new ECGame.EngineLib.SoundAsset(ECGame.instance.getSoundSystem().generateNextAssetID()
							,'game/sounds/Step2_Gravel.wav')
						,new ECGame.EngineLib.SoundAsset(ECGame.instance.getSoundSystem().generateNextAssetID()
							,'game/sounds/Step2b_Gravel.wav')
					]
				);
				ECGame.instance.getSoundSystem().setSoundSamples(
					[
						new ECGame.EngineLib.SoundSample(
							ECGame.instance.getSoundSystem().generateNextSampleID()	//inID
							,1		//inAssetID
							,0.4	//inProbability
							,1		//inVolume			//base volume %
							,0.3	//inVolumeVariation		//optional +/- random range (%)
							,2		//inPitchShift	//optional +/- random range (in semitones)
						)
						,new ECGame.EngineLib.SoundSample(
							ECGame.instance.getSoundSystem().generateNextSampleID()		//inID
							,2		//inAssetID
							,0.3	//inProbability
							,1		//inVolume			//base volume %
							,0.3	//inVolumeVariation		//optional +/- random range (%)
							,2		//inPitchShift	//optional +/- random range (in semitones)
						)
						,new ECGame.EngineLib.SoundSample(
							ECGame.instance.getSoundSystem().generateNextSampleID()		//inID
							,3		//inAssetID
							,0.3	//inProbability
							,1		//inVolume			//base volume %
							,0.3	//inVolumeVariation		//optional +/- random range (%)
							,2		//inPitchShift	//optional +/- random range (in semitones)
						)
					]
				);
				ECGame.instance.getSoundSystem().setSoundDescriptions(
					[
						new ECGame.EngineLib.SoundDescription(
							ECGame.instance.getSoundSystem().generateNextSoundDescriptionID()	//inID
							,[0, 1, 2]	//inSoundSampleIDs
					//		,inRepeat		//[0,?) || -1 for infinite
					//		,inRepeatDelay	//time between repeats
					//		,inRepeatDelayVariation
						)
					]
				);
				
				/*
				ECGame.instance.getTimer().clearTimerCallback(
				ECGame.instance.getTimer().setTimerCallback(
					2000,
					function(){	ECGame.instance.getSoundSystem().playSoundEffect(0);	return true;}
				)
				);
				ECGame.instance.getTimer().setTimerCallback(
					1500,
					function(){	ECGame.instance.getSoundSystem().playSoundEffect(0);	return false;}
				);*/
			}
			//create audio assets
			/////////////////////////////////////////////////////////
			
			
			
			/////////////////////////////////////////////////////////
			//create reference entity
			
			//////////////////////////////////
			//create and initialize animations
			frames = [];
			for(j = 0; j < 8; ++j)
			{
				frames = [];
				for(i = 0; i < 8; ++i)
				{
					frames.push(
						ECGame.EngineLib.Animation2DFrame.create().init(
							new ECGame.EngineLib.AABB2(96 * (i + 1), 96 * j, 96, 96),
							new ECGame.EngineLib.Point2(32, 32),
							((i === 3 || i === 7) ? [new ECGame.EngineLib.Events.PlaySound(0, true, false/*, inRadius*/)] : null)
						)
					);
				}
				animation = new ECGame.EngineLib.Animation2D();
				animation.init('game/images/test_anims_run/jogSheet.png', 10, frames);
				this._animations.push(animation);
			}
			for(j = 0; j < 8; ++j)
			{
				frames = [];
				frames.push(
					ECGame.EngineLib.Animation2DFrame.create().init(
						new ECGame.EngineLib.AABB2(0, 96 * j, 96, 96),
						new ECGame.EngineLib.Point2(32, 32)
					)
				);
				animation = new ECGame.EngineLib.Animation2D();
				animation.init('game/images/test_anims_run/jogSheet.png', 10, frames);
				this._animations.push(animation);
			}
			//create and initialize animations
			//////////////////////////////////
			
			this._referenceEntity = ECGame.EngineLib.GameEntity.create();
			
			this._referenceEntityInputComponent = ECGame.EngineLib.EntityComponent_Input.create();
			this._referenceEntity.addComponent(this._referenceEntityInputComponent);
			
			this._referenceEntitySpriteComponent = ECGame.EngineLib.EntityComponent_Sprite.create(this._animations);
			this._referenceEntity.addComponent(this._referenceEntitySpriteComponent);
			
			this._referenceEntityPhysicsComponent = ECGame.EngineLib.EntityComponent_2DPhysics.create();
			this._referenceEntity.addComponent(this._referenceEntityPhysicsComponent);
			
			//TODO this vv should have params if it is going to call init.  Where does it get init'ed from atm?
			this._referenceEntityCameraComponent = ECGame.EngineLib.EntityComponent_2DCamera.create(/*TODO params??*/);
			this._referenceEntity.addComponent(this._referenceEntityCameraComponent);//TODO have locally owned camera become the one for the world?
			
			this._referenceEntitySoundPlayerComponent = ECGame.EngineLib.EntityComponent_SoundPlayer.create();
			this._referenceEntity.addComponent(this._referenceEntitySoundPlayerComponent);
			
			if(!ECGame.Settings.Network.isMultiplayer)
			{
				this._entities.push(this._referenceEntity.clone());
				this._gameWorld.addEntity(this._entities[0]/*this._referenceEntity*/);
				//TODO comment out and fix default camera vv
				this._gameWorld.setCamera(/*this._referenceEntityCameraComponent*/this._entities[0].getComponentByType(ECGame.EngineLib.EntityComponent_2DCamera)[0]);
			}
			//create reference entity
			/////////////////////////////////////////////////////////
			
			//HACK TODO subscribe to timer updates!!!
	//		ECGame.instance.getUpdater("MiscUpdater").addUpdate(this);

			
			return true;
		},
		
		//TODO subscribe to timer updates!!!
		update : function update()//TODO timer should send data and many things in param object
		{
			var serverRebootTime = 60;//TODO make this some special settings variable
			if(ECGame.Settings.Network.isMultiplayer)
			{
				var currentDateTime = new Date();
				var minute = currentDateTime.getMinutes();
				var second = currentDateTime.getSeconds();
				if(minute % serverRebootTime === 0)
				{
					ECGame.instance.exit();
				}
				
				if(serverRebootTime - minute === 1 && second !== this._lastUpdateSec)
				{
					if(ECGame.Settings.Network.isServer)
					{
						ECGame.instance.getNetwork().sendMessage(
							"Server Reboot in " + (60 - second) + " seconds."
							//,this//sentListener
						);
					}
				}
				else if(minute !== this._lastUpdateMin)
				{
					if(ECGame.Settings.Network.isServer)
					{
						ECGame.instance.getNetwork().sendMessage(
							"Server Reboot in " + (serverRebootTime - minute) + " minutes."
							//,this//sentListener
						);
					}
				}
				this._lastUpdateMin = minute;//TODO get rid of HACK!!!
				this._lastUpdateSec = second;//TODO get rid of HACK!!!
			}
		},
		
		//TODO fix bug: sometimes spawns 2 characters instead of one, why?
		//TODO should rename this onIdentified>Net<User
		onIdentifiedUser : function onIdentifiedUser(inEvent)
		{
			var anEntity;
			
			//this._myMasterNetGroup.addUser(inEvent.user);
			
			if(this._entities[inEvent.user.userID])
			{
				anEntity = this._entities[inEvent.user.userID];
			}
			else
			{
				anEntity = this._referenceEntity.clone();
				this._entities[inEvent.user.userID] = anEntity;
				ECGame.log.info("Setting owner for physics and input component(s) => Name: " + inEvent.user.userName + " ID: " + inEvent.user.userID);
				anEntity.getComponentByType(ECGame.EngineLib.EntityComponent_2DPhysics)[0].setNetOwner(inEvent.user.userID);
				anEntity.getComponentByType(ECGame.EngineLib.EntityComponent_Input)[0].setNetOwner(inEvent.user.userID);
				//TODO camera component to control local camera??
				//How? vvv??
				anEntity.getComponentByType(ECGame.EngineLib.EntityComponent_2DCamera)[0].setNetOwner(inEvent.user.userID);
			}
			this._gameWorld.addEntity(anEntity);
			anEntity.addToNetGroup(this._myMasterNetGroup);
			this._myMasterNetGroup.addUser(inEvent.user);
		},
		
		onClientDisconnected : function onClientDisconnected(inEvent)
		{
			var anEntity;
			
			anEntity = this._entities[inEvent.user.userID];
			this._gameWorld.removeEntity(anEntity);
			
			//anEntity.removeFromNetGroup(this._myMasterNetGroup);
			anEntity.destroy();	//TODO remove from group ^^^ and then set destory on timer if they dont reconnect
		},
		
		
		render : function render(inGraphics)
		{
			if(ECGame.instance.isRunning())
			{
				this._gameWorld.render(inGraphics);
				
				if(this._isRayTestMode)
				{
					var rayTrace = new ECGame.EngineLib.RayTracer2D.create();
					rayTrace.fireRay(
						this._gameWorld.getPhysics()._myDetectionTree
						,this._rayStart.clone()
						,this._rayEnd.clone()
					);
					rayTrace.debugDraw(inGraphics);
				}
			}
			else
			{
				////////////////////////////////////////////////////////////////////////////
				//TODO HACK this should probably be an alternate render in the base class!!!
				inGraphics.setCamera2D(null);
			
				inGraphics.setFillStyle('rgba(128, 128, 128, 1)');
				inGraphics.setStrokeStyle('rgba(64, 64, 64, 1)');
				inGraphics.fillRect(inGraphics.getBackBufferRect());
				inGraphics.strokeRect(inGraphics.getBackBufferRect());
				
				inGraphics.setFillStyle('rgba(64, 64, 64, 1)');
				inGraphics.setFont('30px Arial');
				inGraphics.fillCenteredText("Game Over! Server Restarting!!!");//TODO real message as to why game is over (may not be server restart)
				//TODO HACK this should probably be an alternate render in the base class!!!
				////////////////////////////////////////////////////////////////////////////
			}
		},
		
		
		onInput : function onInput(inInputEvent)
		{
			var cameraAABB, cameraLeftTop, mouseWorldPosition;
			
			cameraAABB = this._gameWorld.getCurrentCamera().getRect();//TODO rename getAABB
			cameraLeftTop = cameraAABB.getLeftTop();
			mouseWorldPosition = inInputEvent.mouseLoc.add(cameraLeftTop);
			
			//TODO should be in component (and/or world)
			ECGame.instance.getSoundSystem().setListenerPosition(cameraAABB.getCenter());
		
			/////////////////////////////////////////////////////////
			//Handle input:
			
			if(inInputEvent.keysPressed['\x67'])//g
			{
				this._lastSoundPlayed = ECGame.instance.getSoundSystem().playSoundEffect(0);
			}
			if(inInputEvent.keysPressed['\x68'])//h
			{
				this._lastSoundPlayed = ECGame.instance.getSoundSystem().playPositionalSoundEffect2D(
					0,
					new ECGame.EngineLib.Point2(
						mouseWorldPosition.myX,
						mouseWorldPosition.myY
					)
				);
			}
			if(inInputEvent.keysPressed['\x74'])//t
			{
				if(!this._lastSoundPlayed.isFinished())
				{
					this._lastSoundPlayed.stop();
				}
			}
			if(inInputEvent.keysPressed['\x6c'])//l
			{
				ECGame.instance.getSoundSystem().setMasterVolume(0.1);
			}
			if(inInputEvent.keysPressed['\x6b'])//k
			{
				ECGame.instance.getSoundSystem().setMasterVolume(0.5);
			}
			if(inInputEvent.keysPressed['\x6a'])//j
			{
				ECGame.instance.getSoundSystem().setMasterVolume(1.0);
			}
			if(this._lastSoundPlayed && this._lastSoundPlayed.setPosition)
			{
				if(this._lastSoundPlayed.isPlaying())
				{
					this._lastSoundPlayed.setPosition(mouseWorldPosition);
					this._lastSoundPlayed.setVelocity(
						mouseWorldPosition
							.subtract(this._lastMouseWorldPosition)
							.scale( 1 / ECGame.instance.getSoundSystem().getSoundHardwareTimeUpdateDelta() )
					);
				}
			}
			
			
			if(inInputEvent.keysPressed['\x6f'])//o
			{
				ECGame.Settings.Debug.Map_Draw = !ECGame.Settings.Debug.Map_Draw;
			}
			if(inInputEvent.keysPressed['\x70'])//p
			{
				ECGame.Settings.Debug.Physics_Draw = !ECGame.Settings.Debug.Physics_Draw;
			}
			if(inInputEvent.keysPressed['\x69'])//i
			{
				ECGame.Settings.Debug.SceneGraph_Draw = !ECGame.Settings.Debug.SceneGraph_Draw;
			}
			if(inInputEvent.keysPressed['\x75'])//u
			{
				ECGame.Settings.Debug.Input_Draw = !ECGame.Settings.Debug.Input_Draw;
			}
			if(inInputEvent.keysPressed['\x79'])//y
			{
				ECGame.Settings.Debug.Sound_Draw = !ECGame.Settings.Debug.Sound_Draw;
			}
			//TODO drawing debug sprite, debug audio
			
			if(inInputEvent.keys[27])//escape
			{
				ECGame.instance.exit();
			}
			
			if(inInputEvent.keysPressed['\x72'])//r
			{
				this._isRayTestMode = !this._isRayTestMode;
			}
			
			
			if(inInputEvent.keysPressed['0'])
			{
				this._drawTile = 0;
			}
			if(inInputEvent.keysPressed['1'])
			{
				this._drawTile = 1;
			}
			if(inInputEvent.keysPressed['2'])
			{
				this._drawTile = 2;
			}
			if(inInputEvent.keysPressed['3'])
			{
				this._drawTile = 3;
			}
			if(inInputEvent.keysPressed['4'])
			{
				this._drawTile = 4;
			}
			
			if(ECGame.Settings.Debug.Physics_Draw)
			{
				if(inInputEvent.clicked[0])
				{
					var temp = this._gameWorld.getPhysics().createNewPhysicsObject();
					temp.setAABB(
						ECGame.EngineLib.AABB2.create(
							mouseWorldPosition.myX
							,mouseWorldPosition.myY
							,Math.random() * 200
							,Math.random() * 200
						)
					);
				}
				if(inInputEvent.clicked[1])
				{
					var temp = this._gameWorld.getPhysics().createNewPhysicsObject();
					temp.setAABB(
						ECGame.EngineLib.AABB2.create(
							mouseWorldPosition.myX
							,mouseWorldPosition.myY
							,Math.random() * 200
							,Math.random() * 200
						)
					);
					temp.setActive();
				}
				if(inInputEvent.clicked[2])
				{
					var temp = this._gameWorld.getPhysics().createNewPhysicsObject();
					temp.setAABB(
						ECGame.EngineLib.AABB2.create(
							mouseWorldPosition.myX
							,mouseWorldPosition.myY
							,Math.random() * 200
							,Math.random() * 200
						)
					);
					temp.setAlwaysActive();
				}
			}
			else if(this._isRayTestMode)
			{
				if(inInputEvent.buttons[0])
				{
					this._rayStart.copyFrom(mouseWorldPosition);
				}
				if(inInputEvent.buttons[2])
				{
					this._rayEnd.copyFrom(mouseWorldPosition);
				}
			}
			else
			{
				if(inInputEvent.buttons[0])
				{
					this._map.setTile(this._map.toTileCoordinate(mouseWorldPosition), this._drawTile);
				}
				if(inInputEvent.buttons[2])
				{
					this._map.clearTile(this._map.toTileCoordinate(mouseWorldPosition));
				}
			}
			
			
			this._lastMouseWorldPosition = mouseWorldPosition;
			//Handle input:
			/////////////////////////////////////////////////////////
		}
	}
});
