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

ECGame.EngineLib.createGameFrameWork = function(instance, PRIVATE)
{
	instance = instance || {};
	PRIVATE = PRIVATE || {};
	
	if(ECGame.Settings.DEBUG)
	{
		ECGame.EngineLib.addDebugInfo('GameFrameWork', instance, PRIVATE);
	}
	
	//////////////////////////////////////////////////
	//Create gamerules instance///////////////////////
	// TODO move default setup code elsewhere?
	if(ECGame.Lib.GameRules !== undefined)
	{
		instance.GameRules = ECGame.Lib.GameRules.create();
	}
	else
	{
		instance.GameRules = ECGame.EngineLib.GameRulesBase.create();
	}
	//Create gamerules instance///////////////////////
	//////////////////////////////////////////////////
	
	//TODO make this ordered event listeners?
	instance.UpdateOrder = [];
	
	//the app is running or not
	PRIVATE.running = true;
	

	PRIVATE.init = function()
	{		
		//////////////////////////////////////////////////
		//Init frame times////////////////////////////////
		instance.GameTimer = ECGame.EngineLib.createGameTimer();
		instance.GameTimer.init(instance);
		//Init frame times////////////////////////////////
		//////////////////////////////////////////////////
		
		if(!ECGame.Settings.Network.isServer)
		{
			//////////////////////////////////////////////////
			//Init graphics///////////////////////////////////
			instance.Graphics = ECGame.EngineLib.createGame2DGraphics();
			if(!instance.Graphics.init())
			{
				return false;
			}
			//Init graphics///////////////////////////////////
			//////////////////////////////////////////////////
			
			
			
			//////////////////////////////////////////////////
			//Init Asset Manager//////////////////////////////
			instance.AssetManager = ECGame.EngineLib.createGameAssetManager();
			//Init Asset Manager//////////////////////////////
			//////////////////////////////////////////////////
			
			
			//////////////////////////////////////////////////
			//Init Sound//////////////////////////////////////
			instance.soundSystem = ECGame.EngineLib.GameSoundSystem.create();
			//Init Sound//////////////////////////////////////
			//////////////////////////////////////////////////
		}
		
		if(ECGame.Settings.Network.isServer)
		{
			instance.localUser = new ECGame.EngineLib.User("Server", ECGame.EngineLib.User.USER_IDS.SERVER);
		}
		else
		{
			//TODO use FB id or something in the future
			instance.localUser = new ECGame.EngineLib.User(
				"NewUser" + Math.floor(Math.random()*65536)
				,ECGame.EngineLib.User.USER_IDS.NEW_USER
			);
		}
		
		
		
		//////////////////////////////////////////////////
		//Init Input//////////////////////////////////////
		instance.Input = ECGame.EngineLib.createInput();
		if(!ECGame.Settings.Network.isServer)
		{
			instance.Input.initClient(instance.Graphics.getDomTarget());
		}
		instance.UpdateOrder.push(instance.Input);
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
			instance.Network = ECGame.EngineLib.GameNetwork.create();
			instance.Network.init();
			instance.UpdateOrder.push(instance.Network);
		}
		if(!ECGame.Settings.Network.isServer && ECGame.Settings.Network.isMultiplayer)
		{
			instance.chatSystem = ECGame.EngineLib.ChatSystem.create();
		}
		
		if(!ECGame.Settings.Network.isServer)
		{
			//TODO should be after physics (where is that added)?
			instance.UpdateOrder.push(instance.soundSystem);
		}
		
		//return instance.GameRules.init();
		if(!instance.GameRules.init())
		{
			return false;
		}
		
		return true;
	};
	
	
	
	PRIVATE.update = function(inTime)
	{
		var i;
		var aveDt;
		
		try
		{
			aveDt = instance.GameTimer.update(inTime);
			
			//TODO make update list an event system for onUpdate
			for(i = 0; i < instance.UpdateOrder.length; ++i)
			{
				var current = instance.UpdateOrder[i];
				if(current.isUpdating())//TODO they can return if they are not, meaning we can/should get rid of this
				{
					current.update(aveDt);
				}
			}
			
			if(!ECGame.Settings.Network.isServer)
			{
				instance.Graphics.render(instance.GameRules);
			}
		}
		catch(error)
		{
			console.log(error.stack);
		}
		
		//loop by sending browser event to queue a call to this function again
		if(PRIVATE.running)
		{
			requestAnimFrame(PRIVATE.update);
		}
		//else shut down?
	};
	///////////////////////////////////////////////////
	

	
	///////////////////////////////////////////////////
	//execute:
	instance.run = function()
	{
		try
		{
			if(PRIVATE.init())
			{
				requestAnimFrame(PRIVATE.update);
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
	
	instance.exit = function()
	{
		PRIVATE.running = false;
		//TODO clean everything?
		if(ECGame.Settings.Network.isServer)
		{
			//TODO send reset/quit message to clients
			process.exit(0);
		}
	};
	
	return instance;
	///////////////////////////////////////////////////
};