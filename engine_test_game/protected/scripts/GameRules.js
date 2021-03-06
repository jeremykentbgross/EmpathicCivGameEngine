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
		this._myMapSizeInTiles = 128;//64;
		this._myTileSize = 64;
		this._myMinPhysicsPartitionSize = 8;
		
		//game world
		this._myGameWorld = null;	//ECGame.EngineLib.World2D.getClass().findInstanceByID(1)
		this._myTileset = null;		//TODO serialize this and do not create it here but only on server!!!!!!!
		
		//entity stuff:
		this._myAnimations = [];
		this._myReferenceEntity = null;
		
		this._myEntities = [];
		
		//editor stuff:
		this._myDrawTile = 0;
		
		//sound test stuff
		this._myLastSoundPlayed = null;
		this._myLastMouseWorldPosition = null;
		
		//testing rays:
		this._myIsRayTestMode = false;
		this._myRayStart = ECGame.EngineLib.Point2D.create();
		this._myRayEnd = ECGame.EngineLib.Point2D.create();
	},
	
	Parents : [ECGame.EngineLib.GameRulesBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		registerClasses : function registerClasses()
		{
			ECGame.Lib.EntityComponent_Physics2D.registerClass();
			ECGame.Lib.EntityComponent_Input.registerClass();
			ECGame.Lib.EntityComponent_Sprite.registerClass();
		},
		init : function init()
		{
			//TODO register ECGame.Lib GameObject classes
			
			//TODO setup updaters
			//ECGame.instance.getUpdater("MiscUpdater").addUpdate(this);	//for hourly resets which are not active without this
			
			//TODO create default objects
			this._initListeners();
			this._myTileset = ECGame.EngineLib.TileSet2D.create(//TODO serialize this and do not create it here but only on server!!!!!!!
				[
					ECGame.EngineLib.TileDescription2D.create(
						'../../game/images/grass.png'
						,ECGame.EngineLib.Point2D.create(64,64)//inSize
						,ECGame.EngineLib.Point2D.create()//inAnchorPoint
						,0//inDepth
						,'rgba(0, 255, 0, 1)'//inMiniMapColor
						,null//inPhysicsAABB
					),
					ECGame.EngineLib.TileDescription2D.create(
						'../../game/images/test/waterSub.png' //'images/water.png'
						,ECGame.EngineLib.Point2D.create(/*64,64*/96,96)//inSize
						,ECGame.EngineLib.Point2D.create()//inAnchorPoint
						,0//inDepth
						,'rgba(0, 0, 255, 1)'//inMiniMapColor
						,ECGame.EngineLib.AABB2D.create(0, 0, 64, 64)//inPhysicsAABB
					),
					ECGame.EngineLib.TileDescription2D.create(
						'../../game/images/ground_256.png'//'../../game/images/ground_level01_01.png' //'images/test/groundSub5.png' // 'images/dirt.png',
						,ECGame.EngineLib.Point2D.create(/*64,64*/96,96)//inSize
						,ECGame.EngineLib.Point2D.create()//inAnchorPoint
						,0//inDepth
						,'rgba(128, 64, 0, 1)'//inMiniMapColor
						,null//inPhysicsAABB
					),
					ECGame.EngineLib.TileDescription2D.create(
						'../../game/images/dirt.png2'//HACK 'images/wall_level01_01__.png'
						,ECGame.EngineLib.Point2D.create(64,64)//inSize
						,ECGame.EngineLib.Point2D.create()//inAnchorPoint
						,0//inDepth
						,'rgba(255, 0, 255, 1)'//inMiniMapColor
						,null//inPhysicsAABB
					),
					ECGame.EngineLib.TileDescription2D.create(
						'../../game/images/wall_256.png'//'../../game/images/wall_level01_01.png'//'images/test/wall.png' //
						,ECGame.EngineLib.Point2D.create(96,96)//inSize
						,ECGame.EngineLib.Point2D.create(32, 32)//inAnchorPoint
						,1//inDepth
						,'rgba(64, 32, 0, 1)'//inMiniMapColor
						,ECGame.EngineLib.AABB2D.create(0, 0, 64, 64)//inPhysicsAABB
					)
					//,
				]
			);
			if(ECGame.Settings.Network.isServer || !ECGame.Settings.Network.isMultiplayer)
			{
				this._initWorld();
			}

			this._initAudioAssets();
			this._initAnimations();
			if(ECGame.Settings.Network.isServer || !ECGame.Settings.Network.isMultiplayer)
			{
				this._initReferenceEntities();
			}
			
			return true;
		},
		
		_initListeners : function _initListeners()
		{
			var aNetwork
				;
				
			if(!ECGame.Settings.Network.isServer)
			{
				ECGame.instance.getInput(0).registerListener('Input', this);
				ECGame.instance.getInput(1).registerListener('Input', this);
			}
			if(ECGame.Settings.Network.isMultiplayer)
			{
				aNetwork = ECGame.instance.getNetwork();
				
				aNetwork.registerListener(
					'ClientConnected',
					this
				);
				aNetwork.registerListener(
					'ClientDisconnected',
					this
				);
				if(ECGame.Settings.Network.isServer)
				{
					/*Note: the server does not have any netgroups by default as it is up to the game
						to decide what netgroups there should be and what users/objects should be assigned
						to each.  A catch all is not recommended unless there is intended to be a 100% shared view
						of everything on all clients, as each netgroup will send data regularly.  A catch all
						on the server, or putting users in more than one netgroup, therefore causes a lot extra
						unneeded net traffic.
					*/
					this._myMasterNetGroup = aNetwork.createNetGroup('master_netgroup');
				}
				else
				{
					this._myMasterNetGroup = aNetwork.getNetGroup('master_netgroup');
				}
			}
		},
		_initWorld : function _initWorld()
		{
			var i, j
				,aMap
				,aIndex
				,aTileset
				;
			
			//TODO tile index constants! (in tileset?)
			aTileset = this._myTileset;
			this._myGameWorld = ECGame.EngineLib.World2D.create(
				this._myMapSizeInTiles
				,aTileset
				,this._myTileSize
				,this._myMinPhysicsPartitionSize
			);
			aMap = this._myGameWorld.getMap();
			
			/////////////////////////////////////////////
			//HACK put something in the map to start with
			if(ECGame.Settings.Network.isServer)
			{
				for(i = 0; i < this._myMapSizeInTiles; ++i)
				{
					for(j = 0; j < this._myMapSizeInTiles; ++j)
					{
						if(i === 0 || j === 0 || i === this._myMapSizeInTiles - 1 || j === this._myMapSizeInTiles - 1)
						{
							aMap.setTileIndex(
								new ECGame.EngineLib.Point2D(i, j), 
								4//(i+j)%5
							);
						}
						else
						{
							aMap.setTileIndex(
								new ECGame.EngineLib.Point2D(i, j),
								2//(i+j)%5
							);
						}
					}
				}
				this._myMasterNetGroup.addObject(aMap);/////////////////////////TODO: create event onAddedTo/RemovedFromNetGroup, then this line is in World (or entity, etc)
				this._myMasterNetGroup.addObject(this._myGameWorld);
			}
			//dynamically change the map from the server
			if(ECGame.Settings.Network.isServer)
			{
				aIndex = 0;
				
				ECGame.instance.getTimer().setTimerCallback(
					2000,
					function()
					{
						aMap.setTileIndex(
							new ECGame.EngineLib.Point2D(6, ++aIndex), 
							Math.floor(Math.random()*6)//4
						);
						return aIndex < 32;
					}
				);
			}
			//HACK put something in the map to start with
			/////////////////////////////////////////////
		},
		_initAudioAssets : function _initAudioAssets()
		{
			var aSoundSystem;
			
			if(ECGame.Settings.Caps.Audio)
			{
				aSoundSystem = ECGame.instance.getSoundSystem();
				
				//TODO global audio index constants!
				aSoundSystem.loadSoundAssets(
					[
						//note: 0 index is really the null sound or placeholder
						new ECGame.EngineLib.SoundAsset(aSoundSystem.generateNextAssetID()
							,'../../game/sounds/Step1_Gravel.wav')
						,new ECGame.EngineLib.SoundAsset(aSoundSystem.generateNextAssetID()
							,'../../game/sounds/Step2_Gravel.wav')
						,new ECGame.EngineLib.SoundAsset(aSoundSystem.generateNextAssetID()
							,'../../game/sounds/Step2b_Gravel.wav')
					]
				);
				aSoundSystem.setSoundSamples(
					[
						new ECGame.EngineLib.SoundSample(
							aSoundSystem.generateNextSampleID()	//inID
							,1		//inAssetID
							,0.4	//inProbability
							,1		//inVolume			//base volume %
							,0.3	//inVolumeVariation		//optional +/- random range (%)
							,2		//inPitchShift	//optional +/- random range (in semitones)
						)
						,new ECGame.EngineLib.SoundSample(
							aSoundSystem.generateNextSampleID()		//inID
							,2		//inAssetID
							,0.3	//inProbability
							,1		//inVolume			//base volume %
							,0.3	//inVolumeVariation		//optional +/- random range (%)
							,2		//inPitchShift	//optional +/- random range (in semitones)
						)
						,new ECGame.EngineLib.SoundSample(
							aSoundSystem.generateNextSampleID()		//inID
							,3		//inAssetID
							,0.3	//inProbability
							,1		//inVolume			//base volume %
							,0.3	//inVolumeVariation		//optional +/- random range (%)
							,2		//inPitchShift	//optional +/- random range (in semitones)
						)
						,new ECGame.EngineLib.SoundSample(//TODO have this sample build in??
							aSoundSystem.generateNextSampleID()		//inID
							,0		//inAssetID
							,1.0	//inProbability
							,1		//inVolume			//base volume %
							,0.0	//inVolumeVariation		//optional +/- random range (%)
							,0		//inPitchShift	//optional +/- random range (in semitones)
						)
					]
				);
				aSoundSystem.setSoundDescriptions(
					[
						new ECGame.EngineLib.SoundDescription(
							aSoundSystem.generateNextSoundDescriptionID()	//inID
							,[0, 1, 2]	//inSoundSampleIDs
					//		,inRepeat		//[0,?) || -1 for infinite
					//		,inRepeatDelay	//time between repeats
					//		,inRepeatDelayVariation
						)
						,new ECGame.EngineLib.SoundDescription(
							aSoundSystem.generateNextSoundDescriptionID()	//inID
							,[3]	//inSoundSampleIDs
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
					function(){	aSoundSystem.playSoundEffect(0);	return true;}
				)
				);
				ECGame.instance.getTimer().setTimerCallback(
					1500,
					function(){	aSoundSystem.playSoundEffect(0);	return false;}
				);*/
			}
		},
		_initAnimations : function _initAnimations()
		{
			var anAnimation
				,aFrameArray
				,i ,j
				,aNameList
				;
			
			aNameList =
			[
				"Run_Right"
				,"Run_RightDown"
				,"Run_Down"
				,"Run_LeftDown"
				,"Run_Left"
				,"Run_LeftUp"
				,"Run_Up"
				,"Run_UpRight"
			];
			aFrameArray = [];
			for(j = 0; j < 8; ++j)
			{
				aFrameArray = [];
				for(i = 0; i < 8; ++i)
				{
					aFrameArray.push(
						ECGame.EngineLib.Animation2DFrame.create().init(
							ECGame.EngineLib.AABB2D.create(96 * (i + 1), 96 * j, 96, 96),
							new ECGame.EngineLib.Point2D(32, 32),
							((i === 3 || i === 7) ? [new ECGame.EngineLib.Events.PlaySound(0, true, false/*, inRadius*/)] : null)
						)
					);
				}
				anAnimation = new ECGame.EngineLib.Animation2D();
				anAnimation.init('../../game/images/test_anims_run/jogSheet.png', 10, aFrameArray);
				ECGame.instance.getAssetManager().saveAnimation(aNameList[j], anAnimation);
			}
			aNameList =
			[
				"Facing_Right"
				,"Facing_RightDown"
				,"Facing_Down"
				,"Facing_LeftDown"
				,"Facing_Left"
				,"Facing_LeftUp"
				,"Facing_Up"
				,"Facing_UpRight"
			];
			for(j = 0; j < 8; ++j)
			{
				aFrameArray = [];
				aFrameArray.push(
					ECGame.EngineLib.Animation2DFrame.create().init(
						ECGame.EngineLib.AABB2D.create(0, 96 * j, 96, 96),
						new ECGame.EngineLib.Point2D(32, 32)
					)
				);
				anAnimation = new ECGame.EngineLib.Animation2D();
				anAnimation.init('../../game/images/test_anims_run/jogSheet.png', 10, aFrameArray);
				ECGame.instance.getAssetManager().saveAnimation(aNameList[j], anAnimation);
			}
		},
		_initReferenceEntities : function _initReferenceEntities()
		{
			var aComponent
				;
				
			this._myReferenceEntity = ECGame.EngineLib.Entity.create();
			this._myReferenceEntity.setName("ReferenceEntity");
			
			aComponent = ECGame.Lib.EntityComponent_Input.create();
			aComponent.setName("ReferenceEntityComponent_Input");
			this._myReferenceEntity.addComponent(aComponent);
			
			aComponent = ECGame.Lib.EntityComponent_Sprite.create(this._myAnimations);
			aComponent.setName("ReferenceEntityComponent_Sprite");
			this._myReferenceEntity.addComponent(aComponent);
			
			aComponent = ECGame.Lib.EntityComponent_Physics2D.create();
			aComponent.setName("ReferenceEntityComponent_Physics");
			this._myReferenceEntity.addComponent(aComponent);
			
			aComponent = ECGame.EngineLib.EntityComponent_Camera2D.create(/*TODO params??*/);
			aComponent.setName("ReferenceEntityComponent_Camera2D");
			this._myReferenceEntity.addComponent(aComponent);
			
			aComponent = ECGame.EngineLib.EntityComponent_SoundPlayer.create();
			aComponent.setName("ReferenceEntityComponent_SoundPlayer");
			this._myReferenceEntity.addComponent(aComponent);
			
			if(!ECGame.Settings.Network.isMultiplayer)
			{
				this._myEntities.push(this._myReferenceEntity.clone());
				this._myGameWorld.addEntity(this._myEntities[0]);
				this._myGameWorld.setCamera(this._myEntities[0].getComponentByType(ECGame.EngineLib.EntityComponent_Camera2D)[0]);
			}
		},
		

		update : function update()//TODO timer should send data and many things in param object
		{
			//HACK this whole function is a HACK
			
			var aServerRebootTime
				,aCurrentDateTime
				,aMinute
				,aSecond
				;
				
			aServerRebootTime = 60;//TODO make this some special settings variable
				
			if(ECGame.Settings.Network.isMultiplayer)
			{
				aCurrentDateTime = new Date();
				aMinute = aCurrentDateTime.getMinutes();
				aSecond = aCurrentDateTime.getSeconds();
				
				if(aMinute % aServerRebootTime === 0)
				{
					ECGame.instance.exit();
				}
				
				if(aServerRebootTime - aMinute === 1 && aSecond !== this._lastUpdateSec)
				{
					if(ECGame.Settings.Network.isServer)
					{
						ECGame.instance.getNetwork().sendMessage(
							"Server Reboot in " + (60 - aSecond) + " seconds."
							//,this//sentListener
						);
					}
				}
				else if(aMinute !== this._lastUpdateMin)
				{
					if(ECGame.Settings.Network.isServer)
					{
						ECGame.instance.getNetwork().sendMessage(
							"Server Reboot in " + (aServerRebootTime - aMinute) + " minutes."
							//,this//sentListener
						);
					}
				}
				this._lastUpdateMin = aMinute;//TODO get rid of HACK!!!
				this._lastUpdateSec = aSecond;//TODO get rid of HACK!!!
			}
		},
		
		//TODO fix bug: sometimes spawns 2 characters instead of one, why?
		onClientConnected : function onClientConnected(inEvent)
		{
			var anEntity;
			
			this._myMasterNetGroup.addUser(inEvent.user);
			
			if(this._myEntities[inEvent.user.userID])
			{
				anEntity = this._myEntities[inEvent.user.userID];
			}
			else
			{
				anEntity = this._myReferenceEntity.clone();
				this._myEntities[inEvent.user.userID] = anEntity;
				console.info("Setting owner for physics and input component(s) => " + inEvent.user.getDebugName());
				anEntity.getComponentByType(ECGame.Lib.EntityComponent_Physics2D)[0].setNetOwner(inEvent.user.userID);
				anEntity.getComponentByType(ECGame.Lib.EntityComponent_Input)[0].setNetOwner(inEvent.user.userID);
				anEntity.getComponentByType(ECGame.EngineLib.EntityComponent_Camera2D)[0].setNetOwner(inEvent.user.userID);
			}
			this._myGameWorld.addEntity(anEntity);
			this._myMasterNetGroup.addObject(anEntity);
		},
		
		onClientDisconnected : function onClientDisconnected(inEvent)
		{
			var anEntity;
			
			this._myMasterNetGroup.removeUser(inEvent.user);
			
			anEntity = this._myEntities[inEvent.user.userID];
			this._myGameWorld.removeEntity(anEntity);
			
			//TODO: iff reconnects (ie https/??)
/*TODO uncomment??*/	//this._myMasterNetGroup.removeObject(anEntity);
			anEntity.destroy();	//TODO remove from group ^^^ and then set destory on timer if they dont reconnect
		},
		
		render : function render(inGraphics)
		{
			var aWorld
				,aRayTracer
				;
			
			if(ECGame.instance.isRunning())
			{
				aWorld = ECGame.EngineLib.World2D.getClass().findInstanceByID(1);
				if(!aWorld)
				{
					return;
				}
				if(inGraphics.getIndex() === 0)
				{
					aWorld.render(inGraphics);
					
					if(this._myIsRayTestMode)
					{
						aRayTracer = new ECGame.EngineLib.RayTracer2D.create();
						aRayTracer.fireRay(
							aWorld.getPhysics()._myDetectionTree
							,this._myRayStart.clone()
							,this._myRayEnd.clone()
						);
						aRayTracer.debugDraw(inGraphics);
					}
				}
				if(inGraphics.getIndex() === 1)
				{
					aWorld.renderMiniMap(inGraphics);
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
			var aCameraAABB2D
				,aMouseWorldPosition
				,aSoundSystem
				,aPhysicsObject
				,aWorld
				,aMap
				;
			
			aWorld = ECGame.EngineLib.World2D.getClass().findInstanceByID(1);
			if(!aWorld)
			{
				return;
			}
			aMap = aWorld.getMap();

//HACK
			if(!this.myTestTrigger){
			//test triggers
			this.myTestTrigger = aWorld.getPhysics().createNewPhysicsObject();
			this.myTestTrigger.setAABB(
				ECGame.EngineLib.AABB2D.create(
					500
					,500
					,200
					,200
				)
			);
			this.myTestTrigger.setTrigger();}
//end HACK
			
			if(inInputEvent.myInputID === 1)
			{
				if(inInputEvent.buttons[0])
				{
					aWorld.getCamera().centerOn(
						inInputEvent.myMousePosition.scale(aWorld.getSize() / ECGame.Settings.Graphics.backBufferWidth)
						,aMap
					);
				}
				return;
			}
			
			
			aCameraAABB2D = aWorld.getCamera().getCaptureVolumeAABB2D();
			aMouseWorldPosition = inInputEvent.myMousePosition.add(aCameraAABB2D.getLeftTop());
			
			
			aSoundSystem = ECGame.instance.getSoundSystem();
			
			//TODO should be in component (and/or world)
			aSoundSystem.setListenerPosition(aCameraAABB2D.getCenter());
			
			
			
			/////////////////////////////////////////////////////////
			//Handle input:
			
			if(inInputEvent.keys[inInputEvent.KEYBOARD.KEY_ESC])
			{
				ECGame.instance.exit();
			}
			
			
			/////////////////////////////////////////////////////////
			//SOUND TESTING//////////////////////////////////////////
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_G])
			{
				this._myLastSoundPlayed = aSoundSystem.playSoundEffect(0);
			}
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_H])
			{
				this._myLastSoundPlayed = aSoundSystem.playPositionalSoundEffect2D(	//TODO the beep sound here instead!!
					1,
					new ECGame.EngineLib.Point2D(
						aMouseWorldPosition.myX,
						aMouseWorldPosition.myY
					)
				);
			}
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_T])
			{
				if(!this._myLastSoundPlayed.isFinished())
				{
					this._myLastSoundPlayed.stop();
				}
			}
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_L])
			{
				aSoundSystem.setMasterVolume(0.1);
			}
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_K])
			{
				aSoundSystem.setMasterVolume(0.5);
			}
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_J])
			{
				aSoundSystem.setMasterVolume(1.0);
			}
			if(this._myLastSoundPlayed && this._myLastSoundPlayed.setPosition)
			{
				if(this._myLastSoundPlayed.isPlaying() && aSoundSystem.getSoundHardwareTimeUpdateDelta() !== 0)
				{
					this._myLastSoundPlayed.setPosition(aMouseWorldPosition);
					this._myLastSoundPlayed.setVelocity(
						aMouseWorldPosition
							.subtract(this._myLastMouseWorldPosition)
							.scale( 1 / aSoundSystem.getSoundHardwareTimeUpdateDelta() )
					);
				}
			}
			//SOUND TESTING//////////////////////////////////////////
			/////////////////////////////////////////////////////////
			
			
			
			/////////////////////////////////////////////////////////
			//DEBUG DRAW/////////////////////////////////////////////
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_M])
			{
				ECGame.Settings.Debug.Map_Draw = !ECGame.Settings.Debug.Map_Draw;
			}
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_P])
			{
				ECGame.Settings.Debug.Physics_Print =
					ECGame.Settings.Debug.Physics_Draw =
						!ECGame.Settings.Debug.Physics_Draw;
			}
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_I])
			{
				ECGame.Settings.Debug.SceneGraph_Draw = !ECGame.Settings.Debug.SceneGraph_Draw;
			}
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_U])
			{
				ECGame.Settings.Debug.Input_Draw = !ECGame.Settings.Debug.Input_Draw;
			}
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_Y])
			{
				ECGame.Settings.Debug.Sound_Draw = !ECGame.Settings.Debug.Sound_Draw;
			}
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_O])
			{
				ECGame.Settings.Debug.Sprite_Draw = !ECGame.Settings.Debug.Sprite_Draw;
			}
			
			//HACK(y)
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_R])
			{
				this._myIsRayTestMode = !this._myIsRayTestMode;
			}
			//DEBUG DRAW/////////////////////////////////////////////
			/////////////////////////////////////////////////////////
			
			
			
			/////////////////////////////////////////////////////////
			//MAP EDITING (keyboard)/////////////////////////////////
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_0])
			{
				this._myDrawTile = 0;
			}
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_1])
			{
				this._myDrawTile = 1;
			}
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_2])
			{
				this._myDrawTile = 2;
			}
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_3])
			{
				this._myDrawTile = 3;
			}
			if(inInputEvent.keysPressed[inInputEvent.KEYBOARD.KEY_4])
			{
				this._myDrawTile = 4;
			}
			//MAP EDITING (keyboard)/////////////////////////////////
			/////////////////////////////////////////////////////////
			
			
			
			if(ECGame.Settings.Debug.Physics_Draw)
			{
				if(inInputEvent.clicked[0])
				{
					aPhysicsObject = aWorld.getPhysics().createNewPhysicsObject();
					aPhysicsObject.setAABB(
						ECGame.EngineLib.AABB2D.create(
							aMouseWorldPosition.myX
							,aMouseWorldPosition.myY
							,Math.random() * 200
							,Math.random() * 200
						)
					);
				}
				if(inInputEvent.clicked[1])
				{
					aPhysicsObject = aWorld.getPhysics().createNewPhysicsObject();
					aPhysicsObject.setAABB(
						ECGame.EngineLib.AABB2D.create(
							aMouseWorldPosition.myX
							,aMouseWorldPosition.myY
							,Math.random() * 200
							,Math.random() * 200
						)
					);
					aPhysicsObject.setActive();
				}
				if(inInputEvent.clicked[2])
				{
					aPhysicsObject = aWorld.getPhysics().createNewPhysicsObject();
					aPhysicsObject.setAABB(
						ECGame.EngineLib.AABB2D.create(
							aMouseWorldPosition.myX
							,aMouseWorldPosition.myY
							,Math.random() * 200
							,Math.random() * 200
						)
					);
					aPhysicsObject.setAlwaysActive();
				}
			}
			else if(this._myIsRayTestMode)
			{
				if(inInputEvent.buttons[0])
				{
					this._myRayStart.copyFrom(aMouseWorldPosition);
				}
				if(inInputEvent.buttons[2])
				{
					this._myRayEnd.copyFrom(aMouseWorldPosition);
				}
			}
			else
			{
				/////////////////////////////////////////////////////////
				//MAP EDITING (mouse)////////////////////////////////////
				if(inInputEvent.buttons[0])
				{
					aMap.setTileIndex(aMap.worldPositionToTileCoordinate(aMouseWorldPosition), this._myDrawTile);
				}
				if(inInputEvent.buttons[2])
				{
					aMap.clearTile(aMap.worldPositionToTileCoordinate(aMouseWorldPosition));
				}
				//MAP EDITING (mouse)////////////////////////////////////
				/////////////////////////////////////////////////////////
			}
			
			
			this._myLastMouseWorldPosition = aMouseWorldPosition;
			//Handle input:
			/////////////////////////////////////////////////////////
		}
	}
});
