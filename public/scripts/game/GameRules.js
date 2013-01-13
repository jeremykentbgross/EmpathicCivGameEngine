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


GameLib.GameRules = GameEngineLib.Class({
	Constructor : function GameRules()
	{
		this.GameRulesBase();
		
		//constants:
		this._mapSizeInTiles = 16;
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
		
		//editor stuff:
		this._drawTile = 0;
		
		//sound test stuff
		this._lastSoundPlayed = null;
		this._lastMouseWorldPosition = null;
	},
	
	Parents : [GameEngineLib.GameRulesBase],
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
			//todo register GameLib GameObject classes
			
			//todo setup updaters
			
			//todo create default objects
			/////////////////////////////////////////////////////////
			
			
			
			/////////////////////////////////////////////////////////
			//setup event listeners
			if(!GameSystemVars.Network.isServer)
			{
				GameInstance.Input.registerListener('Input', this);
			}
			if(GameSystemVars.Network.isMultiplayer)
			{
				GameInstance.Network.registerListener(
					'IdentifiedUser',//TODO use actual event class to de/register listener(s)
					this
				);
			}
			//setup event listeners
			/////////////////////////////////////////////////////////
			
			
			
			/////////////////////////////////////////////////////////
			//create and initialize a game world
			this._gameWorld = GameEngineLib.Game2DWorld.create(
				this._mapSizeInTiles
				,this._tileSize
				,this._minPhysicsPartitionSize
			);
			this._tileset = GameEngineLib.Game2DTileSet.create(
				[
					{
						fileName : 'images/grass.png'
						,anchor : GameEngineLib.createGame2DPoint()
						,layer : 0
						,size : GameEngineLib.createGame2DPoint(64,64)
					},
					{
						fileName : 'images/test/waterSub.png' //'images/water.png'
						,anchor : GameEngineLib.createGame2DPoint()
						,layer : 0
						,size : GameEngineLib.createGame2DPoint(/*64,64*/96,96)
					},
					{
						fileName : 'images/ground_256.png'//'images/test/groundSub5.png' // 'images/ground_level01_01.png' //'images/dirt.png',
						,anchor : GameEngineLib.createGame2DPoint()
						,layer : 0
						,size : GameEngineLib.createGame2DPoint(96,96)//64,64)
					},
					{
						fileName : 'images/dirt.png2'//HACK 'images/wall_level01_01__.png'
						,anchor : GameEngineLib.createGame2DPoint()
						,layer : 0
						,size : GameEngineLib.createGame2DPoint(64,64)
					},
					{
						fileName : 'images/wall_256.png'//'images/test/wall.png' //'images/wall_level01_01.png'
						,anchor : GameEngineLib.createGame2DPoint(32, 32)
						,layer : 1
						,physics : GameEngineLib.createGame2DAABB(0, 0, 64, 64)
						,size : GameEngineLib.createGame2DPoint(96,96)
					}
					//,
				]
			);
			this._map = this._gameWorld.getMap();
			this._map.setTileSet(this._tileset);
			
			/////////////////////////////////////////////
			//HACK put something in the map to start with
			for(i = 0; i < this._mapSizeInTiles; ++i)
			{
				for(j = 0; j < this._mapSizeInTiles; ++j)
				{
					if(i === 0 || j === 0 || i === this._mapSizeInTiles - 1 || j === this._mapSizeInTiles - 1)
						this._map.setTile(new GameEngineLib.Game2DPoint(i, j), /*(i+j)%5*/4);
					else
						this._map.setTile(new GameEngineLib.Game2DPoint(i, j), /*(i+j)%5*/2);
				}
			}
			//HACK put something in the map to start with
			/////////////////////////////////////////////
			
			//create and initialize a game world
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
						GameEngineLib.Animation2DFrame.create().init(
							new GameEngineLib.Game2DAABB(96 * (i + 1), 96 * j, 96, 96),
							new GameEngineLib.Game2DPoint(32, 32)
						)
					);
				}
				animation = new GameEngineLib.Animation2D();
				animation.init('images/test_anims_run/jogSheet.png', 10, frames);
				this._animations.push(animation);
			}
			for(j = 0; j < 8; ++j)
			{
				frames = [];
				frames.push(
					GameEngineLib.Animation2DFrame.create().init(
						new GameEngineLib.Game2DAABB(0, 96 * j, 96, 96),
						new GameEngineLib.Game2DPoint(32, 32)
					)
				);
				animation = new GameEngineLib.Animation2D();
				animation.init('images/test_anims_run/jogSheet.png', 10, frames);
				this._animations.push(animation);
			}
			//create and initialize animations
			//////////////////////////////////
			
			this._referenceEntity = GameEngineLib.GameEntity.create();
			
			this._referenceEntityInputComponent = GameEngineLib.EntityComponent_Input.create();
			this._referenceEntity.addComponent(this._referenceEntityInputComponent);
			
			this._referenceEntitySpriteComponent = GameEngineLib.EntityComponent_Sprite.create(this._animations);
			this._referenceEntity.addComponent(this._referenceEntitySpriteComponent);
			
			this._referenceEntityPhysicsComponent = GameEngineLib.EntityComponent_2DPhysics.create();
			this._referenceEntity.addComponent(this._referenceEntityPhysicsComponent);
			
			//TODO this vv should have params if it is going to call init.  Where does it get init'ed from atm?
			this._referenceEntityCameraComponent = GameEngineLib.EntityComponent_2DCamera.create(/*TODO params??*/);
			this._referenceEntity.addComponent(this._referenceEntityCameraComponent);
			
			this._gameWorld.addEntity(this._referenceEntity);
			//TODO comment out and fix default camera vv
			this._gameWorld.setCamera(this._referenceEntityCameraComponent);
			//create reference entity
			/////////////////////////////////////////////////////////
					
			return true;
		},
		
		
		//TODO should rename this onIdentified>Net<User
		onIdentifiedUser : function onIdentifiedUser(inEvent)
		{
			GameEngineLib.logger.info("setting owner for physics component: " + inEvent.user.userName );
			this._referenceEntityPhysicsComponent.setNetOwner(inEvent.user.userID);
		},
		
		
		render : function render(inCanvas2DContext)
		{
			this._gameWorld.render(inCanvas2DContext);
		},
		
		
		onInput : function onInput(inInputEvent)
		{
			var cameraAABB, cameraLeftTop, mouseWorldPosition;
			
			cameraAABB = this._gameWorld.getCurrentCamera().getRect();//TODO rename getAABB
			cameraLeftTop = cameraAABB.getLeftTop();
			mouseWorldPosition = inInputEvent.mouseLoc.add(cameraLeftTop);
			
			//TODO should be in component (and/or world)
			GameInstance.soundSystem.setListenerPosition(cameraAABB.getCenter());
						
			
			
			/////////////////////////////////////////////////////////
			//Handle input:
			
			if(inInputEvent.keysPressed['\x67'])//g
			{
				this._lastSoundPlayed = GameInstance.soundSystem.playSoundEffect(0);
			}
			if(inInputEvent.keysPressed['\x68'])//h
			{
				this._lastSoundPlayed = GameInstance.soundSystem.playPositionalSoundEffect2D(
					0,
					new GameEngineLib.Game2DPoint(
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
			if(this._lastSoundPlayed && this._lastSoundPlayed.setPosition)
			{
				if(this._lastSoundPlayed.isPlaying())
				{
					this._lastSoundPlayed.setPosition(mouseWorldPosition);
					this._lastSoundPlayed.setVelocity(
						mouseWorldPosition
							.sub(this._lastMouseWorldPosition)
							.multiply( 1 / GameInstance.soundSystem.getSoundHardwareTimeUpdateDelta() )
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
			//TODO drawing debug sprite, debug audio
			
			
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
			
			
			if(inInputEvent.buttons[0])
			{
				this._map.setTile(this._map.toTileCoordinate(mouseWorldPosition), this._drawTile);
			}
			if(inInputEvent.buttons[2])
			{
				this._map.clearTile(this._map.toTileCoordinate(mouseWorldPosition));
			}
			
			
			this._lastMouseWorldPosition = mouseWorldPosition;
			//Handle input:
			/////////////////////////////////////////////////////////
		}
	}
});
