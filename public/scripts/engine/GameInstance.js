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


ECGame.EngineLib.GameInstance = function GameInstance(){};
ECGame.EngineLib.GameInstance.prototype.constructor = ECGame.EngineLib.GameInstance;
ECGame.EngineLib.GameInstance.create = function create()
{
	return new ECGame.EngineLib.GameInstance();
};



ECGame.EngineLib.GameInstance.prototype.run = function run()
{
	try
	{
		if(this._init())
		{
			this.gameTimer.start();
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
};



ECGame.EngineLib.GameInstance.prototype._init = function _init()
{
	//the app is running or not
	this._running = true;
	
	//Init Timer
	this.gameTimer = ECGame.EngineLib.Timer.create();
	
	//TODO make this ordered event listeners?
	this.updateOrder = [];
	
	//Init Native GameObject Classes
	ECGame.EngineLib.Class.createInstanceRegistry();
	ECGame.EngineLib.GameObject.registerClass();
	ECGame.EngineLib.GameEntity.registerClass();
	ECGame.EngineLib.GameEntityComponent.registerClass();
	ECGame.EngineLib.EntityComponent_2DCamera.registerClass();
	ECGame.EngineLib.EntityComponent_2DPhysics.registerClass();
	ECGame.EngineLib.EntityComponent_Input.registerClass();
	ECGame.EngineLib.EntityComponent_Sprite.registerClass();
	ECGame.EngineLib.Game2DMap.registerClass();
	ECGame.EngineLib.Game2DTileSet.registerClass();
	ECGame.EngineLib.Game2DWorld.registerClass();
	//TODO thinnking EventSystem maybe should not be a gameobject ??? WTF is this??
	
	//TODO also needs to manage prefabs?
	
	//Create gamerules
	if(ECGame.Lib.GameRules !== undefined)
	{
		this.gameRules = ECGame.Lib.GameRules.create();
	}
	else
	{
		this.gameRules = ECGame.EngineLib.GameRulesBase.create();
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
		this.graphics = ECGame.EngineLib.createGame2DGraphics();
		if(!this.graphics.init())
		{
			return false;
		}
	
		//Init Asset Manager
		this.assetManager = ECGame.EngineLib.createGameAssetManager();
		
		//Init Sound
		this.soundSystem = ECGame.EngineLib.GameSoundSystem.create();
	}
	
	//Init Input
	this.input = ECGame.EngineLib.createInput();
	if(!ECGame.Settings.Network.isServer)
	{
		this.input.initClient(this.graphics.getDomTarget());
	}
	this.updateOrder.push(this.input);
	
	//setup network and chat
	if(ECGame.Settings.Network.isMultiplayer)
	{
		this.network = ECGame.EngineLib.GameNetwork.create();
		this.network.init();
		this.updateOrder.push(this.network);
		
		if(!ECGame.Settings.Network.isServer)
		{
			this.chatSystem = ECGame.EngineLib.ChatSystem.create();
		}
	}
		
	if(!ECGame.Settings.Network.isServer)
	{
		//TODO should be after physics (where is that added)?
		this.updateOrder.push(this.soundSystem);
	}
	
	//return this.gameRules.init();
	if(!this.gameRules.init())
	{
		return false;
	}
	
	return true;
};



ECGame.EngineLib.GameInstance.prototype.update = function update(inDt)
{
	var i;
	
	try
	{		
		//TODO make update list an event system for onUpdate
		for(i = 0; i < this.updateOrder.length; ++i)
		{
			var current = this.updateOrder[i];
			if(current.isUpdating())//TODO they can return if they are not, meaning we can/should get rid of this
			{
				current.update(inDt);
			}
		}
		
		if(!ECGame.Settings.Network.isServer)
		{
			this.graphics.render(this.gameRules);
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
			process.exit(0);
		}
	}
};



ECGame.EngineLib.GameInstance.prototype.exit = function exit()
{
	this._running = false;
};



ECGame.EngineLib.GameInstance.prototype.isRunning = function isRunning()
{
	return this._running;
};