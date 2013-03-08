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
			requestAnimFrame(this._update);//TODO timer instead!!
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
	//////////////////////////////////////////////////
	//Create gamerules this///////////////////////
	// TODO move default setup code elsewhere?
	if(ECGame.Lib.GameRules !== undefined)
	{
		this.GameRules = ECGame.Lib.GameRules.create();
	}
	else
	{
		this.GameRules = ECGame.EngineLib.GameRulesBase.create();
	}
	//Create gamerules this///////////////////////
	//////////////////////////////////////////////////
	
	//TODO make this ordered event listeners?
	this.UpdateOrder = [];
	
	//the app is running or not
	this._running = true;
	
	
	//////////////////////////////////////////////////
	//Init frame times////////////////////////////////
	this.GameTimer = ECGame.EngineLib.createGameTimer();
	this.GameTimer.init(this);
	//Init frame times////////////////////////////////
	//////////////////////////////////////////////////
	
	if(!ECGame.Settings.Network.isServer)
	{
		//////////////////////////////////////////////////
		//Init graphics///////////////////////////////////
		this.Graphics = ECGame.EngineLib.createGame2DGraphics();
		if(!this.Graphics.init())
		{
			return false;
		}
		//Init graphics///////////////////////////////////
		//////////////////////////////////////////////////
		
		
		
		//////////////////////////////////////////////////
		//Init Asset Manager//////////////////////////////
		this.AssetManager = ECGame.EngineLib.createGameAssetManager();
		//Init Asset Manager//////////////////////////////
		//////////////////////////////////////////////////
		
		
		//////////////////////////////////////////////////
		//Init Sound//////////////////////////////////////
		this.soundSystem = ECGame.EngineLib.GameSoundSystem.create();
		//Init Sound//////////////////////////////////////
		//////////////////////////////////////////////////
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
	}
	
	
	
	//////////////////////////////////////////////////
	//Init Input//////////////////////////////////////
	this.Input = ECGame.EngineLib.createInput();
	if(!ECGame.Settings.Network.isServer)
	{
		this.Input.initClient(this.Graphics.getDomTarget());
	}
	this.UpdateOrder.push(this.Input);
	//Init Input//////////////////////////////////////
	//////////////////////////////////////////////////
	
	
	
	//////////////////////////////////////////////////
	//Init Native GameObject Classes//////////////////
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
	//TODO thinnking EventSystem maybe should not be a gameobject
	
	//TODO also needs to manage prefabs?
	
	//Init Native GameObject Classes//////////////////
	//////////////////////////////////////////////////
	
	if(ECGame.Settings.Network.isMultiplayer)
	{
		this.Network = ECGame.EngineLib.GameNetwork.create();
		this.Network.init();
		this.UpdateOrder.push(this.Network);
	}
	if(!ECGame.Settings.Network.isServer && ECGame.Settings.Network.isMultiplayer)
	{
		this.chatSystem = ECGame.EngineLib.ChatSystem.create();
	}
	
	if(!ECGame.Settings.Network.isServer)
	{
		//TODO should be after physics (where is that added)?
		this.UpdateOrder.push(this.soundSystem);
	}
	
	//return this.GameRules.init();
	if(!this.GameRules.init())
	{
		return false;
	}
	
	return true;
};



ECGame.EngineLib.GameInstance.prototype._update = function _update(inTime)
{
	var i,
		aveDt,
		_this_;
		
	_this_ = ECGame.instance;
	
	try
	{
		aveDt = _this_.GameTimer.update(inTime);
		
		//TODO make update list an event system for onUpdate
		for(i = 0; i < _this_.UpdateOrder.length; ++i)
		{
			var current = _this_.UpdateOrder[i];
			if(current.isUpdating())//TODO they can return if they are not, meaning we can/should get rid of this
			{
				current.update(aveDt);
			}
		}
		
		if(!ECGame.Settings.Network.isServer)
		{
			_this_.Graphics.render(_this_.GameRules);
		}
	}
	catch(error)
	{
		console.log(error.stack);
	}
	
	//loop by sending browser event to queue a call to this function again
	if(_this_._running)
	{
		requestAnimFrame(_this_._update);
	}
	//else shut down?
};



ECGame.EngineLib.GameInstance.prototype.exit = function exit()
{
	this._running = false;
	//TODO clean everything?
	if(ECGame.Settings.Network.isServer)
	{
		//TODO send reset/quit message to clients
		process.exit(0);
	}
};
