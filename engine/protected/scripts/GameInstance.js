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
		var aThis;
		
		aThis = this;
		
		this._myIsRunning = false;
		
		this._myGameRules = null;
		
		this._myUpdaterMap = null;
		this._myMasterUpdater = null;
		
		this._myTimer = null;
		this._myInput = [];
		this._myGraphics = [];
		this._mySoundSystem = null;
		this._myNetwork = null;
		
		this._myAssetManager = null;
		
		this._myChatSystem = null;
		
		this._myLocalUser = null;
		
		this._myRenderSpaceWidth = 0;
		this._myRenderSpaceHeight = 0;
		
		this._myGraphicsContainer = null;
		if(!ECGame.Settings.Network.isServer)
		{
			aThis._myGraphicsContainer = document.getElementById('graphicsContainer');
		}
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
					console.error("GameFrameWork Init failed!");
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
		
		createUpdater : function createUpdater(inUpdaterName, inParentUpdaterName, inPriority)
		{
			this._myUpdaterMap[inUpdaterName] = ECGame.EngineLib.Updater.create(inUpdaterName, inPriority);
			
			if(inParentUpdaterName)
			{
				this._myUpdaterMap[inParentUpdaterName].addUpdate(this._myUpdaterMap[inUpdaterName]);
			}
			
			return this._myUpdaterMap[inUpdaterName];
		},
		getUpdater : function getUpdater(inUpdaterName)
		{
			return this._myUpdaterMap[inUpdaterName];
		},
		
		getTimer : function getTimer()
		{
			return this._myTimer;
		},
		getInput : function getInput(inIndex)
		{
			inIndex = inIndex || 0;
			return this._myInput[inIndex];
		},
		getGraphics : function getGraphics(inIndex)
		{
			inIndex = inIndex || 0;
			return this._myGraphics[inIndex];
		},
		getNumberOfGraphicsDisplays : function getNumberOfGraphicsDisplays()
		{
			return this._myGraphics.length;
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
		getRules : function getRules()
		{
			return this._myGameRules;
		},
		
		_setupSinglePaneGraphics : function _setupSinglePaneGraphics()
		{
			var aGraphics
				,aSucceeded
				;
			
			this._myRenderSpaceWidth = ECGame.Settings.Graphics.backBufferWidth;
			this._myRenderSpaceHeight = ECGame.Settings.Graphics.backBufferHeight;
			
			this._myGraphicsContainer.innerHTML +=
				"<canvas id='canvasSingle'>" +
				ECGame.Settings.Graphics.NoCanvasSupportedMessage +
				"</canvas>";
			
			aGraphics = ECGame.EngineLib.Graphics2D.create();
			this._myGraphics.push(aGraphics);
			aSucceeded = aGraphics.init(0, document.getElementById('canvasSingle'));
			this._myInput.push(aGraphics.getInput());
			
			return aSucceeded;
		},
		
		_setupSplitHorizontalGraphics : function _setupSplitHorizontalGraphics()
		{
			var aGraphics
				,aSucceeded
				;
				
			aSucceeded = true;
			
			this._myRenderSpaceWidth = ECGame.Settings.Graphics.backBufferWidth * 2;
			this._myRenderSpaceHeight = ECGame.Settings.Graphics.backBufferHeight;
			
			this._myGraphicsContainer.innerHTML +=
				"<canvas id='canvasSplitHorizontalLeft'>" +
				ECGame.Settings.Graphics.NoCanvasSupportedMessage +
				"</canvas>" +
				"<canvas id='canvasSplitHorizontalRight'>" +
				ECGame.Settings.Graphics.NoCanvasSupportedMessage +
				"</canvas>";
			
			aGraphics = ECGame.EngineLib.Graphics2D.create();
			this._myGraphics.push(aGraphics);
			aSucceeded = aSucceeded && aGraphics.init(0, document.getElementById('canvasSplitHorizontalLeft'));
			this._myInput.push(aGraphics.getInput());
			
			aGraphics = ECGame.EngineLib.Graphics2D.create();
			this._myGraphics.push(aGraphics);
			aSucceeded = aSucceeded && aGraphics.init(1, document.getElementById('canvasSplitHorizontalRight'));
			this._myInput.push(aGraphics.getInput());
			
			return aSucceeded;
		},
		
		_setupSplit4WayGraphics : function _setupSplit4WayGraphics()
		{
			var aGraphics
				,aSucceeded
				;
				
			aSucceeded = true;
			
			this._myRenderSpaceWidth = ECGame.Settings.Graphics.backBufferWidth * 2;
			this._myRenderSpaceHeight = ECGame.Settings.Graphics.backBufferHeight * 2;
			
			this._myGraphicsContainer.innerHTML +=
				"<canvas id='canvas4WayTopLeft'>" +
				ECGame.Settings.Graphics.NoCanvasSupportedMessage +
				"</canvas>" +
				"<canvas id='canvas4WayTopRight'>" +
				ECGame.Settings.Graphics.NoCanvasSupportedMessage +
				"</canvas><br/>" +
				"<canvas id='canvas4WayBottomLeft'>" +
				ECGame.Settings.Graphics.NoCanvasSupportedMessage +
				"</canvas>" +
				"<canvas id='canvas4WayBottomRight'>" +
				ECGame.Settings.Graphics.NoCanvasSupportedMessage +
				"</canvas>";
			
			aGraphics = ECGame.EngineLib.Graphics2D.create();
			this._myGraphics.push(aGraphics);
			aSucceeded = aSucceeded && aGraphics.init(0, document.getElementById('canvas4WayTopLeft'));
			this._myInput.push(aGraphics.getInput());
			
			aGraphics = ECGame.EngineLib.Graphics2D.create();
			this._myGraphics.push(aGraphics);
			aSucceeded = aSucceeded && aGraphics.init(1, document.getElementById('canvas4WayTopRight'));
			this._myInput.push(aGraphics.getInput());
			
			aGraphics = ECGame.EngineLib.Graphics2D.create();
			this._myGraphics.push(aGraphics);
			aSucceeded = aSucceeded && aGraphics.init(2, document.getElementById('canvas4WayBottomLeft'));
			this._myInput.push(aGraphics.getInput());
			
			aGraphics = ECGame.EngineLib.Graphics2D.create();
			this._myGraphics.push(aGraphics);
			aSucceeded = aSucceeded && aGraphics.init(3, document.getElementById('canvas4WayBottomRight'));
			this._myInput.push(aGraphics.getInput());
			
			return aSucceeded;
		},
		
		
		update : function update(inUpdateData)
		{
			var i;
			
			try
			{
				//TODO pass update struct instead
				this._myMasterUpdater.update(inUpdateData);
				
				if(!ECGame.Settings.Network.isServer)
				{
					for(i = 0; i < this._myGraphics.length; ++i)
					{
						this._myGraphics[i].render(this._myGameRules);
					}
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

		_windowResized : function _windowResized()
		{
			ECGame.EngineLib.HandleCanvasContainerResize(
				ECGame.instance._myGraphicsContainer
				,window
				,ECGame.instance._myRenderSpaceWidth
				,ECGame.instance._myRenderSpaceHeight
			);
		},
		
		_init : function _init()
		{
			var i
				;
			
			//the app is running or not
			this._myIsRunning = true;
			
			//Init Timer
			this._myTimer = ECGame.EngineLib.Timer.create();
			
			this._myUpdaterMap = {};
			this._myMasterUpdater = this.createUpdater("MasterUpdater", null, 0);
			this.createUpdater("SpritesUpdater", "MasterUpdater", ECGame.Settings.UpdateOrder.SPRITES);
			this.createUpdater("PhysicsUpdater", "MasterUpdater", ECGame.Settings.UpdateOrder.PHYSICS);

			//Create gamerules
			if(ECGame.Lib.GameRules !== undefined)
			{
				this._myGameRules = ECGame.Lib.GameRules.create();
			}
			else
			{
				this._myGameRules = ECGame.EngineLib.GameRulesBase.create();
			}
			
			//Init Native GameObject Classes
			ECGame.EngineLib.Class.createInstanceRegistry();
			ECGame.EngineLib.GameObject.registerClass();
			ECGame.EngineLib.Entity.registerClass();
			ECGame.EngineLib.EntityComponent.registerClass();
			ECGame.EngineLib.EntityComponent_Camera2D.registerClass();
			ECGame.EngineLib.EntityComponent_SoundPlayer.registerClass();
			ECGame.EngineLib.World2D.registerClass();
			ECGame.EngineLib.TileMap2D.registerClass();
			ECGame.EngineLib.TileSet2D.registerClass();
			this._myGameRules.registerClasses();
			
			//TODO also needs to manage prefabs?
			
			//Init Asset Manager
			this._myAssetManager = ECGame.EngineLib.AssetManager.create();
			
			if(ECGame.Settings.Network.isServer)
			{
				this._myLocalUser = new ECGame.EngineLib.NetUser("Server", ECGame.EngineLib.NetUser.USER_IDS.SERVER);
				
				switch(ECGame.Settings.Graphics.mode)
				{
					case ECGame.Settings.Graphics.MODES.SINGLE_PANE:
						//create input(s) on server so input components can get proper updates.
						this._myInput.push(ECGame.EngineLib.Input.create());
					break;
					case ECGame.Settings.Graphics.MODES.SPLIT_HORIZONTAL:
					//case ECGame.Settings.Graphics.MODES.SPLIT_VERTICAL:
						//create input(s) on server so input components can get proper updates.
						this._myInput.push(ECGame.EngineLib.Input.create());
						this._myInput.push(ECGame.EngineLib.Input.create());
					break;
					case ECGame.Settings.Graphics.MODES.SPLIT_4WAY:
						//create input(s) on server so input components can get proper updates.
						this._myInput.push(ECGame.EngineLib.Input.create());
						this._myInput.push(ECGame.EngineLib.Input.create());
						this._myInput.push(ECGame.EngineLib.Input.create());
						this._myInput.push(ECGame.EngineLib.Input.create());
					break;
					/*case ECGame.Settings.Graphics.MODES.CUSTOM_SCREEN_LAYOUT:
					break;*/
				}
				for(i = 0; i < this._myInput.length; ++i)
				{
					this._myInput[i].serverInit(i);
				}
			}
			else
			{
				window.addEventListener('resize', this._windowResized, false);
				window.addEventListener('orientationchange', this._windowResized, false);
				window.addEventListener('load', this._windowResized, false);
				
				this._myLocalUser = new ECGame.EngineLib.NetUser();
				
				//Init graphics
				switch(ECGame.Settings.Graphics.mode)
				{
					case ECGame.Settings.Graphics.MODES.SINGLE_PANE:
						if(!this._setupSinglePaneGraphics())
						{
							return false;
						}
					break;
					case ECGame.Settings.Graphics.MODES.SPLIT_HORIZONTAL:
						if(!this._setupSplitHorizontalGraphics())
						{
							return false;
						}
					break;
					/*case ECGame.Settings.Graphics.MODES.SPLIT_VERTICAL:
						return false;
					break;*/
					case ECGame.Settings.Graphics.MODES.SPLIT_4WAY:
						if(!this._setupSplit4WayGraphics())
						{
							return false;
						}
					break;
					/*case ECGame.Settings.Graphics.MODES.CUSTOM_SCREEN_LAYOUT:
						//TODO
					break;*/
				}
				
				//Init Sound
				this._mySoundSystem = ECGame.EngineLib.SoundSystem.create();
				
				//with EngineLoad() called from window.onload in the HTML it canot fire again to resize at startup, do it manually
				this._windowResized();
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


