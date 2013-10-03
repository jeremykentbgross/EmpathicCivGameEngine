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
		
		this._myNoCanvasSupportedMessage =
			"Sorry your browser does not support Canvas. Please use different browser:<br/>" +
			"<a href=\"http:\x2f\x2fwww.google.com/chrome\">Get Chrome (**recommended!**) </a><br/>" +
			"or<br/>" +
			"<a href=\"http:\x2f\x2fwww.mozilla-europe.org/en/firefox/\">Get Firefox</a>";
		
		this._myGraphicsContainer = null;
		if(!ECGame.Settings.Network.isServer)
		{
			require(
				['dojo/dom'],
				function importDojoCallback(dom)
				{
					aThis._myGraphicsContainer = dom.byId('graphicsContainer');
				}
			);
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
		
		_setupSinglePaneGraphics : function _setupSinglePaneGraphics()
		{
			var aGraphics
				,aSucceeded
				;
			
			this._myRenderSpaceWidth = ECGame.Settings.Graphics.backBufferWidth;
			this._myRenderSpaceHeight = ECGame.Settings.Graphics.backBufferHeight;
			
			this._myGraphicsContainer.innerHTML +=
				"<canvas id='canvasSingle'>" +
				this._myNoCanvasSupportedMessage +
				"</canvas>";
			
			aGraphics = ECGame.EngineLib.Graphics2D.create();
			this._myGraphics.push(aGraphics);
			aSucceeded = aGraphics.init(0, 'canvasSingle');
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
				this._myNoCanvasSupportedMessage +
				"</canvas>" +
				"<canvas id='canvasSplitHorizontalRight'>" +
				this._myNoCanvasSupportedMessage +
				"</canvas>";
			
			aGraphics = ECGame.EngineLib.Graphics2D.create();
			this._myGraphics.push(aGraphics);
			aSucceeded = aSucceeded && aGraphics.init(0, 'canvasSplitHorizontalLeft');
			this._myInput.push(aGraphics.getInput());
			
			aGraphics = ECGame.EngineLib.Graphics2D.create();
			this._myGraphics.push(aGraphics);
			aSucceeded = aSucceeded && aGraphics.init(1, 'canvasSplitHorizontalRight');
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
				this._myNoCanvasSupportedMessage +
				"</canvas>" +
				"<canvas id='canvas4WayTopRight'>" +
				this._myNoCanvasSupportedMessage +
				"</canvas><br/>" +
				"<canvas id='canvas4WayBottomLeft'>" +
				this._myNoCanvasSupportedMessage +
				"</canvas>" +
				"<canvas id='canvas4WayBottomRight'>" +
				this._myNoCanvasSupportedMessage +
				"</canvas>";
			
			aGraphics = ECGame.EngineLib.Graphics2D.create();
			this._myGraphics.push(aGraphics);
			aSucceeded = aSucceeded && aGraphics.init(0, 'canvas4WayTopLeft');
			this._myInput.push(aGraphics.getInput());
			
			aGraphics = ECGame.EngineLib.Graphics2D.create();
			this._myGraphics.push(aGraphics);
			aSucceeded = aSucceeded && aGraphics.init(1, 'canvas4WayTopRight');
			this._myInput.push(aGraphics.getInput());
			
			aGraphics = ECGame.EngineLib.Graphics2D.create();
			this._myGraphics.push(aGraphics);
			aSucceeded = aSucceeded && aGraphics.init(2, 'canvas4WayBottomLeft');
			this._myInput.push(aGraphics.getInput());
			
			aGraphics = ECGame.EngineLib.Graphics2D.create();
			this._myGraphics.push(aGraphics);
			aSucceeded = aSucceeded && aGraphics.init(3, 'canvas4WayBottomRight');
			this._myInput.push(aGraphics.getInput());
			
			return aSucceeded;
		},
		
		
		update : function update(inDt)
		{
			var i;
			
			try
			{
				//TODO pass update struct instead
				this._myMasterUpdater.update(inDt);
				
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

		
		_resizeSpace : function _resizeSpace()
		{
			var aContainer
				,aMaxWidth
				,aMaxHeight
				,aWidthToHeight
				,aNewWidth
				,aNewHeight
				,aNewWidthToHeight
				,aThis
				;
			
			aThis = ECGame.instance;
			
			aContainer = aThis._myGraphicsContainer;
			aMaxWidth = ECGame.instance._myRenderSpaceWidth;
			aMaxHeight = ECGame.instance._myRenderSpaceHeight;
			aWidthToHeight = aMaxWidth / aMaxHeight;

			aNewWidth = window.innerWidth;
			aNewHeight = window.innerHeight;
			aNewWidthToHeight = aNewWidth / aNewHeight;
			
			if(aNewWidthToHeight > aWidthToHeight)
			{
				aNewWidth = aNewHeight * aWidthToHeight;
			}
			else
			{
				aNewHeight = aNewWidth / aWidthToHeight;
			}
			aNewHeight = Math.min(aNewHeight, aMaxHeight);
			aNewWidth = Math.min(aNewWidth, aMaxWidth);
			if(false)//no resize
			{
				aNewHeight = aMaxHeight;
				aNewWidth = aMaxWidth;
			}
			
			aContainer.style.height = aNewHeight + 'px';
			aContainer.style.width = aNewWidth + 'px';
			aContainer.style.marginTop = Math.max((window.innerHeight-aNewHeight) / 2, 0) + 'px';
			aContainer.style.marginLeft = Math.max((window.innerWidth-aNewWidth) / 2, 0) + 'px';
		},
		
		_init : function _init()
		{
			var aThis;

			aThis = this;
			
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
			ECGame.EngineLib.TileMap2D.registerClass();
			ECGame.EngineLib.TileSet2D.registerClass();
			ECGame.EngineLib.World2D.registerClass();
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
				
				//create input TODO input(s) on server so input components can get updates.
				this._myInput.push(ECGame.EngineLib.Input.create());
			}
			else
			{
				/*window.addEventListener('resize', this._resizeSpace, false);
				window.addEventListener('orientationchange', this._resizeSpace, false);
				window.addEventListener('load', this._resizeSpace, false);*/
				require(
					['dojo/on'],
					function importDojoCallback(inOn)
					{
						inOn(window, 'resize', aThis._resizeSpace);
						inOn(window, 'orientationchange', aThis._resizeSpace);
						inOn(window, 'load', aThis._resizeSpace);
					}
				);
				
				//TODO use FB id or something in the future
				this._myLocalUser = new ECGame.EngineLib.User(
					"NewUser" + Math.floor(Math.random()*65536)
					,ECGame.EngineLib.User.USER_IDS.NEW_USER
				);
				
				//Init graphics
				switch(ECGame.Settings.Graphics.mode)
				{
					case ECGame.Settings.Graphics.MODES.SINGLE_PANE:
					{
						if(!this._setupSinglePaneGraphics())
						{
							return false;
						}
					}
					break;
					case ECGame.Settings.Graphics.MODES.SPLIT_HORIZONTAL:
					{
						if(!this._setupSplitHorizontalGraphics())
						{
							return false;
						}
					}
					break;
					/*case ECGame.Settings.Graphics.MODES.SPLIT_VERTICAL:
					{
						return false;
					}
					break;*/
					case ECGame.Settings.Graphics.MODES.SPLIT_4WAY:
					{
						if(!this._setupSplit4WayGraphics())
						{
							return false;
						}
					}
					break;
					/*case ECGame.Settings.Graphics.MODES.CUSTOM_SCREEN_LAYOUT:
					{
						//TODO
					}
					break;*/
				}
			
				//Init Asset Manager
				this._myAssetManager = ECGame.EngineLib.AssetManager.create();
				
				//Init Sound
				this._mySoundSystem = ECGame.EngineLib.SoundSystem.create();
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


