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

//TODO update order, updaters, remove from update(er)
//TODO naming convention (which will touch a LOT of files probably)
//TODO rename this file/class to just Game


ECGame.EngineLib.GameInstance = ECGame.EngineLib.Class.create({
	Constructor : function GameInstance()
	{
		//TODO values listed in constructor
	/*	this.rules
		this.timer
		this._running
		this.updateOrder
		this.graphics
		this.localUser
		this.assetManager
		this.soundSystem
		this.input
		this.network
		this.chatSystem*/
		
		this._myUpdaterMap = null;
		this._myMasterUpdater = null;
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
					this.timer.start();
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
			return this._running;
		},
		
		exit : function exit()
		{
			this._running = false;
		},
		
		update : function update(inDt)
		{
			try
			{		
				//TODO make update list an event system for onUpdate
				/*for(i = 0; i < this.updateOrder.length; ++i)
				{
					this.updateOrder[i].update(inDt);
				}*/
				this._myMasterUpdater.update(inDt);
				
				if(!ECGame.Settings.Network.isServer)
				{
					this.graphics.render(this.rules);
				}
			}
			catch(error)
			{
				console.log(error.stack);
			}
			
			//if not running then shut down
			if(!this._running)
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
		
		
		createUpdater : function createUpdater(inUpdaterName, inPriority)
		{
			return this._myUpdaterMap[inUpdaterName] = ECGame.EngineLib.Updater.create(inUpdaterName, inPriority);
		},
		getUpdater : function getUpdater(inUpdaterName)
		{
			return this._myUpdaterMap[inUpdaterName];
		},
		
		
		_init : function _init()
		{
			//the app is running or not
			this._running = true;
			
			//Init Timer
			this.timer = ECGame.EngineLib.Timer.create();
			
			//TODO make this ordered event listeners?
			//this.updateOrder = [];
			this._myUpdaterMap = {};
			this._myMasterUpdater = this.createUpdater("MasterUpdater", 0);
			this._myMasterUpdater.addUpdate(this.createUpdater("InputUpdater", 1));//TODO name them _updater
			this._myMasterUpdater.addUpdate(this.createUpdater("NetworkUpdater", 2));
			this._myMasterUpdater.addUpdate(this.createUpdater("SoundUpdater", 3));
			this._myMasterUpdater.addUpdate(this.createUpdater("SpritesUpdater", 2.7));
			this._myMasterUpdater.addUpdate(this.createUpdater("PhysicsUpdater", 2.5));
			this._myMasterUpdater.addUpdate(this.createUpdater("MiscUpdater", 5));
			
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
				this.rules = ECGame.Lib.GameRules.create();
			}
			else
			{
				this.rules = ECGame.EngineLib.GameRulesBase.create();
			}
			
			if(ECGame.Settings.Network.isServer)
			{
				this.localUser = new ECGame.EngineLib.User("Server", ECGame.EngineLib.User.USER_IDS.SERVER);
			}
			else
			{
				//TODO use FB id or something in the future
				this.localUser = new ECGame.EngineLib.User(
					"NewUser" + Math.floor(Math.random()*65536)
					,ECGame.EngineLib.User.USER_IDS.NEW_USER
				);
				
				//Init graphics
				this.graphics = ECGame.EngineLib.Game2DGraphics.create();
				if(!this.graphics.init())
				{
					return false;
				}
			
				//Init Asset Manager
				this.assetManager = ECGame.EngineLib.AssetManager.create();
				
				//Init Sound
				this.soundSystem = ECGame.EngineLib.SoundSystem.create();
			}
			
			//Init Input
			this.input = ECGame.EngineLib.Input.create();
			if(!ECGame.Settings.Network.isServer)
			{
				this.input.initClient(this.graphics.getDomTarget());
			}
			//this.updateOrder.push(this.input);
			this.getUpdater("InputUpdater").addUpdate(this.input);
			
			//setup network and chat
			if(ECGame.Settings.Network.isMultiplayer)
			{
				this.network = ECGame.EngineLib.Network.create();
				this.network.init();
				//this.updateOrder.push(this.network);
				this.getUpdater("NetworkUpdater").addUpdate(this.network);
				
				if(!ECGame.Settings.Network.isServer)
				{
					this.chatSystem = ECGame.EngineLib.ChatSystem.create();
				}
			}
				
			if(!ECGame.Settings.Network.isServer)
			{
				//TODO should be after physics (where is that added)?
				//this.updateOrder.push(this.soundSystem);
				this.getUpdater("SoundUpdater").addUpdate(this.soundSystem);
			}
			
			//return this.rules.init();
			if(!this.rules.init())
			{
				return false;
			}
			
			return true;
		}//end init
	}
});


