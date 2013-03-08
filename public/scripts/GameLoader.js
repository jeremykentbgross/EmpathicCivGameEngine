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

GameLoader =
{
	start : function(inIsServer, inSharedPath, inPrivatePath)//TODO inAppLoaderPath
	{
		var include;
		
		//Globals:
		ECGame = new (function ECGame(){})();
		//ECGame.Settings =  new (function ECGameSettings(){})();	TODO??
		//ECGame.loader GameLoader	TODO??
		//ECGame.unitTests = new (function ECGameUnitTests(){})();	TODO??
		if(inIsServer)
		{
			ECGame.Webserver = new (function ECGameWebserver(){})();	//TODO UPPER CASE!!!!
		}
		ECGame.EngineLib = new (function ECGameEngineLib(){})();
		ECGame.Lib =  new (function ECGameLib(){})();
		//ECGame.instance	TODO??
		//GameLocalization	//TODO
		
		//////////////////////////////////////////////////////////////////////////////
		////////////////////// Setup requestAnimFrame and include ////////////////////
		if(!inIsServer)
		{
			window.requestAnimFrame =
				window.requestAnimationFrame || 
				window.webkitRequestAnimationFrame || 
				window.mozRequestAnimationFrame || 
				window.oRequestAnimationFrame || 
				window.msRequestAnimationFrame ||
				function( callback ){
					window.setTimeout(callback, 1000 / 60);
				};
			
			include = function(filename)
			{
				require([filename, 'dojo/domReady']);
			};
		}
		else
		{
			requestAnimFrame =
				function( callback ){
					setTimeout(callback, 1000 / 60);
				};
				
			include = require;
			//TODO obfuscator + tests!
			include(inPrivatePath + "CodeObfuscator.js");
			include(inPrivatePath + "CodeCompressor.js");
		}
		////////////////////// Setup requestAnimFrame and include ////////////////////
		//////////////////////////////////////////////////////////////////////////////
		
		
		
		//////////////////////////////////////////////////////////////////////////////
		///////////////////////////////// GAME GLOBALS ///////////////////////////////
		//		Load the settings flags first:
		include(inSharedPath + "scripts/engine/GameSettings.js");//TODO include one from engine and game folder	//TODO rename this file!!
		//		Set the server flag in the global system
		ECGame.Settings.Network.isServer = inIsServer;
		
		if(inIsServer && !ECGame.Settings.Network.isMultiplayer)
		{
			return;
		}
				
		//TEMP HACK!! Should go somewhere else!!
		ECGame.EngineLib.isNumber = function isNumber(inString)
		{
			return !isNaN(parseFloat(inString)) && isFinite(inString);
		};
		
		//ECGame.EngineLib.include = include;//TODO needed?
				
		if(ECGame.Settings.RUN_UNIT_TESTS)
		{
			ECGame.unitTests =
			{
				tests : [],
				runTests :
					function()
					{
						var aTest;
						var i;
						console.log('\n************************');
						console.log("***Running Unit Tests***");
						for(i = 0; i < this.tests.length; ++i)
						{
							aTest = this.tests[i];
							console.log("\nRunning Test: " + aTest.testName);
							try
							{
								if(!aTest())
								{
									ECGame.log.error("Failed Test: " + aTest.testName);
								}
								else
								{
									console.log("Passed Test: " + aTest.testName);
								}
							}
							catch(error)
							{
								console.log(error.stack);
								console.log("Failed Test: " + aTest.testName + " with exception " + error + '\n');
							}
						}
						console.log("\n***Running Unit Tests***");
						console.log('************************\n\n');
					},
				registerTest :
					function(inTestName, inTest)
					{
						inTest.testName = inTestName;
						this.tests[this.tests.length] = inTest;
						console.log("Registered Test: " + inTest.testName);
					}
			};
		}
		///////////////////////////////// GAME GLOBALS ///////////////////////////////
		//////////////////////////////////////////////////////////////////////////////
		
		
		
		//////////////////////////////////////////////////////////////////////////////
		//////////////////////////////// ENGINE SCRIPTS //////////////////////////////
		
		//TODO order these better:
		include(inSharedPath + "scripts/engine/Game2DAABB.js");
		include(inSharedPath + "scripts/engine/Game2DPoint.js");
		include(inSharedPath + "scripts/engine/GameEngineLogger.js");
		include(inSharedPath + "scripts/engine/GameRegistry.js");
		include(inSharedPath + "scripts/engine/GameClass.js");
		include(inSharedPath + "scripts/engine/GameCircularDoublyLinkedListNode.js");
		if(!inIsServer)
		{
			if(ECGame.Settings.Network.isMultiplayer)
			{
				include(inSharedPath + "/socket.io/socket.io.js");
				include(inSharedPath + "scripts/engine/GameChatSystem.js");
			}
			include(inSharedPath + "scripts/engine/Game2DGraphics.js");
			include(inSharedPath + "scripts/engine/GameSoundSystem.js");
			include(inSharedPath + "scripts/engine/GameSound.js");
			include(inSharedPath + "scripts/engine/GameSound2D.js");
			include(inSharedPath + "scripts/engine/GameAssetManager.js");
		}
		include(inSharedPath + "scripts/engine/GameNetwork.js");//TODO if multiplayer?
		include(inSharedPath + "scripts/engine/GameInput.js");
		
		include(inSharedPath + "scripts/engine/Game2DCamera.js");
		
		include(inSharedPath + "scripts/engine/GameObject.js");
		include(inSharedPath + "scripts/engine/GameObjectRef.js");
		include(inSharedPath + "scripts/engine/GameBitPacker.js");//TODO if multiplayer?
		//include(inSharedPath + "scripts/engine/MultPacker.js");//TODO
		include(inSharedPath + "scripts/engine/GameArithmeticCompression.js");//TODO if multiplayer?
		include(inSharedPath + "scripts/engine/GameBinarySerializer.js");//TODO if multiplayer?
		include(inSharedPath + "scripts/engine/GameEventSystem.js");
		include(inSharedPath + "scripts/engine/GameEvent.js");
		include(inSharedPath + "scripts/engine/GameEntity.js");
		include(inSharedPath + "scripts/engine/GameEntityComponent.js");
		include(inSharedPath + "scripts/engine/GameEntityComponent_2DCamera.js");
		include(inSharedPath + "scripts/engine/GameEntityComponent_Input.js");
		include(inSharedPath + "scripts/engine/GameEntityComponent_Sprite.js");
		include(inSharedPath + "scripts/engine/GameEntityComponent_2DPhysics.js");
		
		include(inSharedPath + "scripts/engine/GameTimer.js");
		include(inSharedPath + "scripts/engine/GameInstance.js");
		include(inSharedPath + "scripts/engine/GameQuadTree.js");
		include(inSharedPath + "scripts/engine/GameRenderable2D.js");
		include(inSharedPath + "scripts/engine/GameRenderableTile2D.js");
		include(inSharedPath + "scripts/engine/Animation2DFrame.js");
		include(inSharedPath + "scripts/engine/Animation2D.js");
		include(inSharedPath + "scripts/engine/Animation2DInstance.js");
		include(inSharedPath + "scripts/engine/Game2DSceneGraph.js");
		include(inSharedPath + "scripts/engine/Game2DMap.js");
		include(inSharedPath + "scripts/engine/Game2DPhysics.js");
		include(inSharedPath + "scripts/engine/Game2DTileSet.js");
		include(inSharedPath + "scripts/engine/Game2DWorld.js");
		include(inSharedPath + "scripts/engine/GameRulesBase.js");
		//////////////////////////////// ENGINE SCRIPTS //////////////////////////////
		//////////////////////////////////////////////////////////////////////////////
		
		
		
		//////////////////////////////////////////////////////////////////////////////
		///////////////////////////////// GAME SCRIPTS ///////////////////////////////
		include(inSharedPath + "scripts/game/GameRules.js");
		//include(inSharedPath + "scripts/alife/GameRules.js");
		///////////////////////////////// GAME SCRIPTS ///////////////////////////////
		//////////////////////////////////////////////////////////////////////////////
		
		
		
		//////////////////////////////////////////////////////////////////////////////
		//////////////////////////////// UNIT TEST scripts ///////////////////////////
		if(ECGame.Settings.RUN_UNIT_TESTS)
		{			
			//ENGINE UNIT TESTS:
			include(inSharedPath + "scripts/engine/unit_tests/TestGameClass.js");
			include(inSharedPath + "scripts/engine/unit_tests/TestGameBitPacker.js");
			include(inSharedPath + "scripts/engine/unit_tests/TestGameEventSystem.js");
			//include(inSharedPath + "scripts/engine/unit_tests/TestMultPacker.js ");//TODO
			include(inSharedPath + "scripts/engine/unit_tests/TestGameArithmeticCompression.js");
			include(inSharedPath + "scripts/engine/unit_tests/TestGameBinarySerializer.js");
			include(inSharedPath + "scripts/engine/unit_tests/TestGameEntity.js");
			
			if(inIsServer)
			{
				include(inPrivatePath + "unit_tests/TestObfuscator.js");
			}
			//GAME UNIT TESTS:
			
			//TEMP UNIT TESTS:
			//include(inSharedPath + "LangTests.js");
		}
		//////////////////////////////// UNIT TEST scripts ///////////////////////////
		//////////////////////////////////////////////////////////////////////////////
		
		
		
		//////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////// RUN! ///////////////////////////////////
		if(!inIsServer)//TODO when node inspector loads all scripts correctly remove the if, and run code from server code
		{
			//TODO remove this, have a separate function to run loaded code that can be called from page or node
			include(inSharedPath + "scripts/GameRunner.js");
		}
		///////////////////////////////////// RUN! ///////////////////////////////////
		//////////////////////////////////////////////////////////////////////////////
	}
};
