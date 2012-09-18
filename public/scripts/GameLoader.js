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
	init : function(inIsServer, inSharedPath, inPrivatePath)//TODO inAppLoaderPath
	{
		var include;
		
		//****************************************************************************
		//******************** Setup requestAnimFrame and include ********************
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
				require([filename, "dojo/domReady"]);
			}
		}
		else
		{
			requestAnimFrame =
				function( callback ){
					setTimeout(callback, 1000 / 60);
				};
				
			include = require;
		}
		//******************** Setup requestAnimFrame and include ********************
		//****************************************************************************
		
		
		
		//****************************************************************************
		//******************************* GAME GLOBALS *******************************
		//		Load the settings flags first:
		include(inSharedPath + "scripts/engine/GameSystemVars.js");//TODO include one from engine and game folder
		//		Set the server flag in the global system
		GameSystemVars.Network.isServer = inIsServer;
		
		if(inIsServer && !GameSystemVars.Network.isMultiplayer)
			return;
		
		//Global Game Objects
		GameEngineLib = {};
		GameLib = {};
		GameInstance = null;
		
		//GameEngineLib.include = include;//TODO needed?
				
		if(GameSystemVars.RUN_UNIT_TESTS)
		{
			GameUnitTests =
			{
				tests : [],
				runTests :
					function()
					{
						var test;
						console.log("\n************************\n");
						console.log("***Running Unit Tests***\n");
						for(var i = 0; i < this.tests.length; ++i)
						{
							test = this.tests[i];
							console.log("\nRunning Test: " + test.testName + "\n");
							try
							{
								if(!test())
									GameEngineLib.logger.error("Failed Test: " + test.testName);//console.log("Failed Test: " + test.testName + "\n");
								else
									console.log("Passed Test: " + test.testName + "\n");
							}
							catch(error)
							{
								console.log(error.stack);
								console.log("Failed Test: " + test.testName + " with exception " + error + "\n");
							}
						}
						console.log("\n***Running Unit Tests***\n");
						console.log("************************\n\n");
					},
				registerTest :
					function(inTestName, inTest)
					{
						inTest.testName = inTestName;
						this.tests[this.tests.length] = inTest;
						console.log("Registered Test: " + inTest.testName + "\n");
					}
			};
		}
		//******************************* GAME GLOBALS *******************************
		//****************************************************************************
		
		
		
		//****************************************************************************
		//****************************** ENGINE SCRIPTS ******************************
		include(inSharedPath + "scripts/engine/GameEngineLogger.js");
		include(inSharedPath + "scripts/engine/GameCircularDoublyLinkedListNode.js");
		if(!inIsServer)
		{
			if(GameSystemVars.Network.isMultiplayer)
			{
				include(inSharedPath + "/socket.io/socket.io.js");
			}
			include(inSharedPath + "scripts/engine/Game2DGraphics.js");
			include(inSharedPath + "scripts/engine/GameAssetManager.js");
		}
		include(inSharedPath + "scripts/engine/GameNetwork.js");
		include(inSharedPath + "scripts/engine/GameInput.js");
		
		include(inSharedPath + "scripts/engine/GameObject.js");
		include(inSharedPath + "scripts/engine/GameObjectRef.js");
		include(inSharedPath + "scripts/engine/GameRegistry.js");
		include(inSharedPath + "scripts/engine/GameObjectClassFactory.js");
		include(inSharedPath + "scripts/engine/GameBitPacker.js");
		//include(inSharedPath + "scripts/engine/MultPacker.js");//TODO
		include(inSharedPath + "scripts/engine/GameArithmeticCompression.js");
		include(inSharedPath + "scripts/engine/GameBinarySerializer.js");
		include(inSharedPath + "scripts/engine/GameEventSystem.js");
		include(inSharedPath + "scripts/engine/GameEntity.js");
		include(inSharedPath + "scripts/engine/GameEntityComponent_Sprite.js");
		include(inSharedPath + "scripts/engine/GameEntityComponent_Input.js");
		include(inSharedPath + "scripts/engine/GameEntityComponent_2DPhysics.js");
		include(inSharedPath + "scripts/engine/GameEntityComponent_2DCamera.js");
		include(inSharedPath + "scripts/engine/GameTimer.js");
		include(inSharedPath + "scripts/engine/GameFrameWork.js");
		include(inSharedPath + "scripts/engine/Game2DAABB.js");
		include(inSharedPath + "scripts/engine/Game2DPoint.js");
		include(inSharedPath + "scripts/engine/GameQuadTree.js");
		include(inSharedPath + "scripts/engine/Game2DSceneGraph.js");
		include(inSharedPath + "scripts/engine/Game2DMap.js");
		include(inSharedPath + "scripts/engine/Game2DCamera.js");
		include(inSharedPath + "scripts/engine/Game2DPhysics.js");
		include(inSharedPath + "scripts/engine/Game2DTileSet.js");
		include(inSharedPath + "scripts/engine/Game2DWorld.js");
		//****************************** ENGINE SCRIPTS ******************************
		//****************************************************************************
		
		
		
		//****************************************************************************
		//******************************* GAME SCRIPTS *******************************
		include(inSharedPath + "scripts/game/GameRules.js");
		//include(inSharedPath + "scripts/alife/GameRules.js");
		//******************************* GAME SCRIPTS *******************************
		//****************************************************************************
		
		
		
		//****************************************************************************
		//****************************** UNIT TEST scripts ***************************
		if(GameSystemVars.RUN_UNIT_TESTS)
		{			
			//ENGINE UNIT TESTS:
			include(inSharedPath + "scripts/engine/unit_tests/TestGameBitPacker.js");
			include(inSharedPath + "scripts/engine/unit_tests/TestGameEventSystem.js");
			include(inSharedPath + "scripts/engine/unit_tests/TestGameObjectClassSystem.js");
			//include(inSharedPath + "scripts/engine/unit_tests/TestMultPacker.js ");//TODO
			include(inSharedPath + "scripts/engine/unit_tests/TestGameArithmeticCompression.js");
			include(inSharedPath + "scripts/engine/unit_tests/TestGameBinarySerializer.js");
			
			
			//GAME UNIT TESTS:
			
			//TEMP UNIT TESTS:
			//include(inSharedPath + "LangTests.js");
		}
		//****************************** UNIT TEST scripts ***************************
		//****************************************************************************
		
		
		
		//****************************************************************************
		//*********************************** RUN! ***********************************
		if(!inIsServer)//TODO when node inspector loads all scripts correctly remove the if, and run code from server code
		{
			include(inSharedPath + "scripts/GameRunner.js");
		}
		//*********************************** RUN! ***********************************
		//****************************************************************************
	}
};



