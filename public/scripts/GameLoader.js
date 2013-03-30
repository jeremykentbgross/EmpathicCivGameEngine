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
		
		//Setup Globals:
		ECGame = new (function ECGame(){})();
		//ECGame.Settings =  new (function ECGameSettings(){})();	TODO??
		//ECGame.loader GameLoader	TODO??
		//ECGame.unitTests = new (function ECGameUnitTests(){})();	TODO??
		ECGame.EngineLib = new (function ECGameEngineLib(){})();
		ECGame.Lib =  new (function ECGameLib(){})();
		//ECGame.instance	TODO??
		//GameLocalization	//TODO
		if(inIsServer)
		{
			ECGame.Webserver = new (function ECGameWebserver(){})();	//TODO UPPER CASE!!!!
		}
		
		
		//Setup include
		if(!inIsServer)
		{
			include = function(filename)
			{
				require([filename, 'dojo/domReady']);
			};
		}
		else
		{
			include = require;
		}
				
		//Load the settings flags first:
		include(inSharedPath + "scripts/engine/GameSettings.js");
		//TODO include one GameSettings from engine and one from the game folder
		
		//Set the server flag in the global system
		ECGame.Settings.Network.isServer = inIsServer;
		
		//Include the logger
		include(inSharedPath + "scripts/engine/GameEngineLogger.js");
		
		//TEMP HACK!! Should go somewhere else!! (but needs to load here)
		ECGame.EngineLib.isNumber = function isNumber(inString)
		{
			return !isNaN(parseFloat(inString)) && isFinite(inString);
		};
		
		if(ECGame.Settings.RUN_UNIT_TESTS)
		{
			include(inSharedPath + "scripts/engine/UnitTestFramework.js");
			ECGame.unitTests = ECGame.EngineLib.UnitTestFramework.create();
		}
		
		if(inIsServer)
		{
			include(inPrivatePath + "CodeObfuscator.js");
			include(inPrivatePath + "CodeCompressor.js");
			if(ECGame.Settings.RUN_UNIT_TESTS)
			{
				include(inPrivatePath + "unit_tests/TestObfuscator.js");
			}
			//TODO put server main webserver include here??
			if(!ECGame.Settings.Network.isMultiplayer)
			{
				return;
			}
		}
		
		
		
		
		
		//////////////////////////////////////////////////////////////////////////////
		//////////////////////////////// ENGINE SCRIPTS //////////////////////////////
		
		//TODO order these better:
		include(inSharedPath + "scripts/engine/AABB2.js");
		include(inSharedPath + "scripts/engine/Point2.js");
		include(inSharedPath + "scripts/engine/GameRegistry.js");
		include(inSharedPath + "scripts/engine/GameClass.js");
		include(inSharedPath + "scripts/engine/GameCircularDoublyLinkedListNode.js");
		include(inSharedPath + "scripts/engine/GameEventSystem.js");
		if(!inIsServer)
		{
			if(ECGame.Settings.Network.isMultiplayer)
			{
				include(inSharedPath + "/socket.io/socket.io.js");
				include(inSharedPath + "scripts/engine/GameChatSystem.js");
			}
			include(inSharedPath + "scripts/engine/Game2DGraphics.js");
			include(inSharedPath + "scripts/engine/SoundAsset.js");
			include(inSharedPath + "scripts/engine/SoundSample.js");
			include(inSharedPath + "scripts/engine/SoundDescription.js");
			include(inSharedPath + "scripts/engine/SoundSystem.js");
			include(inSharedPath + "scripts/engine/Sound.js");
			include(inSharedPath + "scripts/engine/Sound2D.js");
			include(inSharedPath + "scripts/engine/AssetManager.js");
		}
		include(inSharedPath + "scripts/engine/GameNetwork.js");//TODO if multiplayer?
		include(inSharedPath + "scripts/engine/Input.js");
		include(inSharedPath + "scripts/engine/Camera2.js");
		include(inSharedPath + "scripts/engine/GameObject.js");
		include(inSharedPath + "scripts/engine/GameObjectRef.js");
		include(inSharedPath + "scripts/engine/BitPacker.js");//TODO if multiplayer?
		//include(inSharedPath + "scripts/engine/MultPacker.js");//TODO
		include(inSharedPath + "scripts/engine/ArithmeticCompression.js");//TODO if multiplayer?
		include(inSharedPath + "scripts/engine/ArithmeticCompressionModels.js");//TODO if multiplayer?
		include(inSharedPath + "scripts/engine/GameBinarySerializer.js");//TODO if multiplayer?
		include(inSharedPath + "scripts/engine/GameEvent.js");
		include(inSharedPath + "scripts/engine/GameEntity.js");
		include(inSharedPath + "scripts/engine/GameEntityComponent.js");
		include(inSharedPath + "scripts/engine/GameEntityComponent_2DCamera.js");
		include(inSharedPath + "scripts/engine/GameEntityComponent_Input.js");
		include(inSharedPath + "scripts/engine/GameEntityComponent_Sprite.js");
		include(inSharedPath + "scripts/engine/GameEntityComponent_2DPhysics.js");
		include(inSharedPath + "scripts/engine/GameEntityComponent_SoundPlayer.js");
		include(inSharedPath + "scripts/engine/Timer.js");
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
		
		//TODO include GameLoader (vs engine loader) here
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
