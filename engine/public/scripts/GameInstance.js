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

ECGame.EngineLib.GameInstance = ECGame.EngineLib.Class.create({
	Constructor : function GameInstance()
	{
		this._myIsRunning = false;
		
		this._myGameRules = null;
		
		this._myUpdaterMap = null;
		this._myMasterUpdater = null;
		
		this._myTimer = null;
		this._myInput = null;
		this._myGraphics = null;
		this._mySoundSystem = null;
		this._myNetwork = null;
		
		this._myAssetManager = null;
		
		this._myChatSystem = null;
		
		this._myLocalUser = null;
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		run : function run()
		{
			try
			{
				if(this._init())
				{
					this._myTimer.start();
				}
				else
				{
					ECGame.log.error("GameFrameWork Init failed!");
				}
			}
			catch(error)
			{
				console.log(error.stack);
			}
		},
		
		isRunning : function isRunning()
		{
			return this._myIsRunning;
		},
		
		exit : function exit()
		{
			this._myIsRunning = false;
		},
		
		createUpdater : function createUpdater(inUpdaterName, inPriority)
		{
			return this._myUpdaterMap[inUpdaterName] = ECGame.EngineLib.Updater.create(inUpdaterName, inPriority);
		},
		getUpdater : function getUpdater(inUpdaterName)
		{
			return this._myUpdaterMap[inUpdaterName];
		},
		
		getTimer : function getTimer()
		{
			return this._myTimer;
		},
		getInput : function getInput()
		{
			return this._myInput;
		},
		getGraphics : function getGraphics()
		{
			return this._myGraphics;
		},
		getSoundSystem : function getSoundSystem()
		{
			return this._mySoundSystem;
		},
		getNetwork : function getNetwork()
		{
			return this._myNetwork;
		},
		getAssetManager : function getAssetManager()
		{
			return this._myAssetManager;
		},
		getLocalUser : function getLocalUser()
		{
			return this._myLocalUser;
		},
		
		
		
		
		update : function update(inDt)
		{
			try
			{
				//TODO pass update struct instead
				this._myMasterUpdater.update(inDt);
				
				if(!ECGame.Settings.Network.isServer)
				{
					//TODO pass graphics/struct to stuff and not just the back buffer
					this._myGraphics.render(this._myGameRules);
				}
			}
			catch(error)
			{
				console.log(error.stack);
			}
			
			//if not running then shut down
			if(!this._myIsRunning)
			{
				//TODO clean everything?
				
				if(ECGame.Settings.Network.isServer)
				{
					//TODO send reset/quit message to clients
					
					//Exits Node as described here:
					//	http://stackoverflow.com/questions/5266152/how-to-exit-in-node-js
					process.exit(0);
				}
			}
		},
		
		_init : function _init()
		{
			//the app is running or not
			this._myIsRunning = true;
			
			//Init Timer
			this._myTimer = ECGame.EngineLib.Timer.create();
			
			this._myUpdaterMap = {};
			this._myMasterUpdater = this.createUpdater("MasterUpdater", 0);
			this._myMasterUpdater.addUpdate(this.createUpdater("SpritesUpdater", ECGame.Settings.UpdateOrder.SPRITES));
			this._myMasterUpdater.addUpdate(this.createUpdater("PhysicsUpdater", ECGame.Settings.UpdateOrder.PHYSICS));

			
			//Init Native GameObject Classes
			ECGame.EngineLib.Class.createInstanceRegistry();
			ECGame.EngineLib.GameObject.registerClass();
			ECGame.EngineLib.GameEntity.registerClass();
			ECGame.EngineLib.GameEntityComponent.registerClass();
			ECGame.EngineLib.EntityComponent_2DCamera.registerClass();
			ECGame.EngineLib.EntityComponent_2DPhysics.registerClass();
			ECGame.EngineLib.EntityComponent_Input.registerClass();
			ECGame.EngineLib.EntityComponent_Sprite.registerClass();
			ECGame.EngineLib.EntityComponent_SoundPlayer.registerClass();
			ECGame.EngineLib.Game2DMap.registerClass();
			ECGame.EngineLib.Game2DTileSet.registerClass();
			ECGame.EngineLib.Game2DWorld.registerClass();
			//TODO thinnking EventSystem maybe should not be a gameobject ??? WTF is this??
			
			//TODO also needs to manage prefabs?
			
			//Create gamerules
			if(ECGame.Lib.GameRules !== undefined)
			{
				this._myGameRules = ECGame.Lib.GameRules.create();
			}
			else
			{
				this._myGameRules = ECGame.EngineLib.GameRulesBase.create();
			}
			
			if(ECGame.Settings.Network.isServer)
			{
				this._myLocalUser = new ECGame.EngineLib.User("Server", ECGame.EngineLib.User.USER_IDS.SERVER);
			}
			else
			{
				//TODO use FB id or something in the future
				this._myLocalUser = new ECGame.EngineLib.User(
					"NewUser" + Math.floor(Math.random()*65536)
					,ECGame.EngineLib.User.USER_IDS.NEW_USER
				);
				
				//Init graphics
				this._myGraphics = ECGame.EngineLib.Game2DGraphics.create();
				if(!this._myGraphics.init())
				{
					return false;
				}
			
				//Init Asset Manager
				this._myAssetManager = ECGame.EngineLib.AssetManager.create();
				
				//Init Sound
				this._mySoundSystem = ECGame.EngineLib.SoundSystem.create();
			}
			
			//Init Input
			this._myInput = ECGame.EngineLib.Input.create();
			if(!ECGame.Settings.Network.isServer)
			{
				this._myInput.initClient(this._myGraphics.getDomTarget());
			}
			
			//setup network and chat
			if(ECGame.Settings.Network.isMultiplayer)
			{
				this._myNetwork = ECGame.EngineLib.Network.create();
				this._myNetwork.init();
				
				if(!ECGame.Settings.Network.isServer)
				{
					this._myChatSystem = ECGame.EngineLib.ChatSystem.create();
				}
			}
			
			//return this._myGameRules.init();
			if(!this._myGameRules.init())
			{
				return false;
			}
			
			return true;
		}//end init
	}
});


