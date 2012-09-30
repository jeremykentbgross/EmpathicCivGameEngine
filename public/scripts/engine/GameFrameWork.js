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

GameEngineLib.createGameFrameWork = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	if(GameSystemVars.DEBUG)
	{
		GameEngineLib.addDebugInfo("GameFrameWork", instance, private);
	}
	
	//////////////////////////////////////////////////
	//Create gamerules instance///////////////////////
	// todo move default setup code elsewhere?
	if(GameLib.createGameRules !== undefined)
		instance.GameRules = GameLib.createGameRules();//TODO make this an GameObject?
	
	instance.GameRules = 
		instance.GameRules || { noUserGameRules : true };
	
	instance.GameRules.init =
		instance.GameRules.init || function(){ return true; };
	
	instance.GameRules.render =
		instance.GameRules.render ||
		function(inCanvas2DContext)
		{
			var x, y;
			var message;
			
			inCanvas2DContext.fillStyle = "rgba(128, 128, 128, 1)";
			inCanvas2DContext.strokeStyle = "rgba(64, 64, 64, 1)";
			inCanvas2DContext.fillRect(0, 0,
				inCanvas2DContext.canvas.width,
				inCanvas2DContext.canvas.height
			);
			inCanvas2DContext.strokeRect(0, 0,
				inCanvas2DContext.canvas.width,
				inCanvas2DContext.canvas.height
			);
			
			inCanvas2DContext.fillStyle = "rgba(64, 64, 64, 1)";
			
			inCanvas2DContext.font = "30px Arial";
			if(!this.noUserGameRules)
				message = "No Game Specific Render Code Is Present!";
			else
				message = "No Game Specific GameRule Code Is Present!";
			x = (inCanvas2DContext.canvas.width - inCanvas2DContext.measureText(message).width) / 2;
			y = (inCanvas2DContext.canvas.height - 30) / 2;
			inCanvas2DContext.fillText(message, x, y);
		};
	//Create gamerules instance///////////////////////
	//////////////////////////////////////////////////
	
	//TODO make this ordered event listeners?
	instance.UpdateOrder = [];
	
	//the app is running or not
	private.running = true;
	

	private.init = function()
	{		
		//////////////////////////////////////////////////
		//Init frame times////////////////////////////////
		instance.GameTimer = GameEngineLib.createGameTimer();
		instance.GameTimer.init(instance);
		//Init frame times////////////////////////////////
		//////////////////////////////////////////////////
		
		if(!GameSystemVars.Network.isServer)
		{
			//////////////////////////////////////////////////
			//Init graphics///////////////////////////////////
			instance.Graphics = GameEngineLib.createGame2DGraphics();
			if(!instance.Graphics.init())
				return false;
			//Init graphics///////////////////////////////////
			//////////////////////////////////////////////////
			
			
			
			//////////////////////////////////////////////////
			//Init Asset Manager//////////////////////////////
			instance.AssetManager = GameEngineLib.createGameAssetManager();
			//Init Asset Manager//////////////////////////////
			//////////////////////////////////////////////////
			
			
			//////////////////////////////////////////////////
			//Init Sound//////////////////////////////////////
			// TODO
			//Init Sound//////////////////////////////////////
			//////////////////////////////////////////////////
		}
		
		if(GameSystemVars.Network.isServer)
		{
			instance.localUser = new GameEngineLib.User("Server", GameEngineLib.User.USER_IDS.SERVER);
		}
		else
		{
			//TODO use FB id or something in the future
			instance.localUser = new GameEngineLib.User(
				"NewUser" + Math.floor(Math.random()*65536)
				,GameEngineLib.User.USER_IDS.NEW_USER
			);
		}
		
		
		
		//////////////////////////////////////////////////
		//Init Input//////////////////////////////////////
		instance.Input = GameEngineLib.createInput();
		if(!GameSystemVars.Network.isServer)
			instance.Input.initClient(instance.Graphics.getDomTarget());
		instance.UpdateOrder.push(instance.Input);
		//Init Input//////////////////////////////////////
		//////////////////////////////////////////////////
		
		
		
		//////////////////////////////////////////////////
		//Init Native GameObject Classes//////////////////
		GameClassRegistryMap = {}; //TODO new system!
		GameEngineLib.GameObject.registerClass();
		GameEngineLib.GameEntity.registerClass();
		GameEngineLib.GameEntityComponent.registerClass();
		GameEngineLib.EntityComponent_2DCamera.registerClass();
		GameEngineLib.EntityComponent_2DPhysics.registerClass();
		GameEngineLib.EntityComponent_Input.registerClass();
		GameEngineLib.EntityComponent_Sprite.registerClass();
		GameEngineLib.Game2DMap.registerClass();
		GameEngineLib.Game2DTileSet.registerClass();
		GameEngineLib.Game2DWorld.registerClass();
		
		//TODO make this class the GameObjectClassFactory directly by passing in instance and private?
		//TODO also needs to manage prefabs?
		instance.GameObjectClasses = GameEngineLib.createGameObjectClassFactory();
		instance.GameObjectClasses.create(
			"GameObject",
			null,
			GameEngineLib.createGameObject
		);
		instance.GameObjectClasses.create(//TODO thinnking maybe this should not be a gameobject
			"EventSystem",
			null,
			GameEngineLib.createEventSystem
		);
		instance.GameObjectClasses.create(
			"Entity",
			null,
			GameEngineLib.createEntity
		);
		instance.GameObjectClasses.create(
			"EntityComponent",
			null,
			GameEngineLib.createEntityComponent
		);
		instance.GameObjectClasses.create(
			"EntityComponent_Sprite",
			"EntityComponent",
			GameEngineLib.createEntityComponent_Sprite
		);
		instance.GameObjectClasses.create(
			"EntityComponent_Input",
			"EntityComponent",
			GameEngineLib.createEntityComponent_Input
		);
		instance.GameObjectClasses.create(
			"EntityComponent_2DPhysics",//TODO rename 2D
			"EntityComponent",
			GameEngineLib.createEntityComponent_2DPhysics,
			{net:true}
		);
		instance.GameObjectClasses.create(
			"EntityComponent_2DCamera",
			"EntityComponent",
			GameEngineLib.createEntityComponent_2DCamera
		);
		instance.GameObjectClasses.create(
			"Game2DWorld",//todo make this a component?
			null,
			GameEngineLib.createGame2DWorld
		);
		instance.GameObjectClasses.create(
			"Game2DTileSet",
			null,
			GameEngineLib.createGame2DTileSet
		);
		instance.GameObjectClasses.create(
			"Game2DMap",
			null,
			GameEngineLib.createGame2DMap
		);
		//Init Native GameObject Classes//////////////////
		//////////////////////////////////////////////////
		
		if(GameSystemVars.Network.isMultiplayer)
		{
			instance.Network = GameEngineLib.GameNetwork.create();
			instance.Network.init();
			instance.UpdateOrder.push(instance.Network);
		}
		
		//return instance.GameRules.init();
		if(!instance.GameRules.init())
			return false;
		
		
		
		return true;
	}
	
	
	
	private.update = function(time)
	{		
		var aveDt = instance.GameTimer.update(time);
		
		//TODO make update list an event system for onUpdate
		for(var i = 0; i < instance.UpdateOrder.length; ++i)
		{
			var current = instance.UpdateOrder[i];
			if(current.isUpdating())//TODO they can return if they are not, meaning we can get rid of this
				current.update(aveDt);
		}
		
		if(!GameSystemVars.Network.isServer)
			instance.Graphics.render(instance.GameRules);
		
		//loop by sending browser event to queue a call to this function again
		if(private.running)
			requestAnimFrame(private.update);
		//else shut down?
	}
	///////////////////////////////////////////////////
	

	
	///////////////////////////////////////////////////
	//execute:
	instance.run = function()
	{
		try
		{
			if(private.init())
			{
				requestAnimFrame(private.update);
			}
			else
			{
				GameEngineLib.logger.error("GameFrameWork Init failed!");
			}
		}
		catch(error)
		{
			console.log(error.stack);
		}
	}
	
	instance.exit = function()
	{
		private.running = false;
		//TODO clean everything?
	}
	
	return instance;
	///////////////////////////////////////////////////
}