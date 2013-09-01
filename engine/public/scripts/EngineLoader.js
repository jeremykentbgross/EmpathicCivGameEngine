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

LoadEngine = function LoadEngine(inIsServer, inPublicEnginePath, inPrivateEnginePath, inPublicGamePath, inPrivateGamePath)//TODO inAppLoaderPath
{
	var include;
	
	
	//////////////////////////////////////////////////////////////////////////////
	///////////////////////////////Global Namespaces//////////////////////////////
	//Setup Global namespaces:
	/**!
		@namespace: ECGame
		/description: This is the master namespace for the entire game / engine
	*/
	ECGame = new (function ECGame(){})();
	
	/**!
		@namespace: EngineLib
		/parentNamespace: ECGame
		/description: This is the engine namespace
	*/
	ECGame.EngineLib = new (function ECGameEngineLib(){})();
	
	/**!
		@namespace: Lib
		/parentNamespace: ECGame
		/description: This is the game specific namespace
	*/
	ECGame.Lib =  new (function ECGameLib(){})();
	
	//ECGame.Settings TODO refactor/change how settings work?
	//ECGame.instance
	//ECGame.webServer
	//GameLocalization
	//ECGame.unitTests
	if(inIsServer)
	{
		/**!
			@namespace: WebServerTools
			/parentNamespace: ECGame
			/description: This is the namespace for all webserver related tools
		*/
		ECGame.WebServerTools = new (function ECGameWebServerTools(){})();
	}
	///////////////////////////////Global Namespaces//////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	
	
	
	//////////////////////////////////////////////////////////////////////////////
	///////////////////////////////INCLUDE SETUP//////////////////////////////////
	//Setup include
	if(!inIsServer)
	{
		include = function include(filename)
		{
			require([filename, 'dojo/domReady']);
		};
	}
	else
	{
		include = require;
	}
	///////////////////////////////INCLUDE SETUP//////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	
	
	
	//Load the settings flags first:
	include(inPublicEnginePath + "scripts/GameSettings.js");
	//TODO include GameSettings from game folder? (or will be done by user?)
	
	//Set the server flag in the global system
	ECGame.Settings.Network.isServer = inIsServer;	//TODO this should be parameters for creating it!
	
	//TODO make public and private loaders?
	
	//Include the logger
	include(inPublicEnginePath + "scripts/GameEngineLogger.js");//TODO consider https://developer.mozilla.org/en-US/docs/DOM/console#Stack_traces
	
	//TEMP HACK!! Should go somewhere else!! (but needs to load here)
	ECGame.EngineLib.isNumber = function isNumber(inString)
	{
		return !isNaN(parseFloat(inString)) && isFinite(inString);
	};
	
	if(ECGame.Settings.RUN_UNIT_TESTS)
	{
		include(inPublicEnginePath + "scripts/UnitTestFramework.js");
		ECGame.unitTests = ECGame.EngineLib.UnitTestFramework.create();
	}
	
	include(inPublicEnginePath + "scripts/GameClass.js");
	
	
	
	//////////////////////////////////////////////////////////////////////////////
	//////////////////////////////// SERVER SCRIPTS //////////////////////////////
	if(inIsServer)
	{
		include(inPrivateEnginePath + "scripts/WebServer.js");
		include(inPrivateEnginePath + "scripts/DocJS.js");
		include(inPrivateEnginePath + "scripts/CodeObfuscator.js"); /**! @todo: consider naming just Obfuscator*/
		include(inPrivateEnginePath + "scripts/CodeCompressor.js"); /**! @todo: consider naming preprocessor or something*/
		
		if(ECGame.Settings.RUN_UNIT_TESTS)
		{
			include(inPrivateEnginePath + "scripts/unit_tests/TestObfuscator.js");
			include(inPrivateEnginePath + "scripts/unit_tests/TestDocJS.js");
		}
		
		if(!ECGame.Settings.Network.isMultiplayer)
		{
			if(ECGame.Settings.RUN_UNIT_TESTS)
			{
				ECGame.unitTests.runTests();
			}
			ECGame.webServer = new ECGame.WebServerTools.WebServer();
			ECGame.webServer.run();
			return;
		}
	}
	//////////////////////////////// SERVER SCRIPTS //////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	
	
	
	//////////////////////////////////////////////////////////////////////////////
	//////////////////////////////// ENGINE SCRIPTS //////////////////////////////
	//TODO order these better:
	include(inPublicEnginePath + "scripts/AABB2.js");
	include(inPublicEnginePath + "scripts/Point2.js");
	include(inPublicEnginePath + "scripts/GameRegistry.js");
	include(inPublicEnginePath + "scripts/GameCircularDoublyLinkedListNode.js");
	include(inPublicEnginePath + "scripts/GameEventSystem.js");
	if(!inIsServer)
	{
		if(ECGame.Settings.Network.isMultiplayer)
		{
			include("/socket.io/socket.io.js");/////////////////////////TODO get rid of this!!
			include(inPublicEnginePath + "scripts/GameChatSystem.js");
		}
		include(inPublicEnginePath + "scripts/Game2DGraphics.js");
		include(inPublicEnginePath + "scripts/SoundAsset.js");
		include(inPublicEnginePath + "scripts/SoundSample.js");
		include(inPublicEnginePath + "scripts/SoundDescription.js");
		include(inPublicEnginePath + "scripts/SoundSystem.js");
		include(inPublicEnginePath + "scripts/Sound.js");
		include(inPublicEnginePath + "scripts/Sound2D.js");
		include(inPublicEnginePath + "scripts/AssetManager.js");
	}
include(inPublicEnginePath + "scripts/GameNetwork.js");//TODO if multiplayer?
//include(inPublicEnginePath + "scripts/NetworkBase.js");//TODO if multiplayer?
	include(inPublicEnginePath + "scripts/Input.js");
	include(inPublicEnginePath + "scripts/Camera2.js");
	include(inPublicEnginePath + "scripts/GameObject.js");
	include(inPublicEnginePath + "scripts/GameObjectRef.js");
	include(inPublicEnginePath + "scripts/BitPacker.js");//TODO if multiplayer?
	//include(inPublicEnginePath + "scripts/MultPacker.js");//TODO
	include(inPublicEnginePath + "scripts/ArithmeticCompression.js");//TODO if multiplayer?
	include(inPublicEnginePath + "scripts/ArithmeticCompressionModels.js");//TODO if multiplayer?
	include(inPublicEnginePath + "scripts/GameBinarySerializer.js");//TODO if multiplayer?
	include(inPublicEnginePath + "scripts/GameEvent.js");
	include(inPublicEnginePath + "scripts/GameEntity.js");
	include(inPublicEnginePath + "scripts/GameEntityComponent.js");
	include(inPublicEnginePath + "scripts/GameEntityComponent_2DCamera.js");
	include(inPublicEnginePath + "scripts/GameEntityComponent_Input.js");
	include(inPublicEnginePath + "scripts/GameEntityComponent_Sprite.js");
	include(inPublicEnginePath + "scripts/GameEntityComponent_2DPhysics.js");
	include(inPublicEnginePath + "scripts/GameEntityComponent_SoundPlayer.js");
	include(inPublicEnginePath + "scripts/Timer.js");
	include(inPublicEnginePath + "scripts/GameInstance.js");
	include(inPublicEnginePath + "scripts/QuadTree.js");
	include(inPublicEnginePath + "scripts/GameRenderable2D.js");
	include(inPublicEnginePath + "scripts/GameRenderableTile2D.js");
	include(inPublicEnginePath + "scripts/Animation2DFrame.js");
	include(inPublicEnginePath + "scripts/Animation2D.js");
	include(inPublicEnginePath + "scripts/Animation2DInstance.js");
	include(inPublicEnginePath + "scripts/Game2DSceneGraph.js");
	include(inPublicEnginePath + "scripts/Game2DMap.js");
	include(inPublicEnginePath + "scripts/Physics2D.js");
	include(inPublicEnginePath + "scripts/Ray2D.js");
	include(inPublicEnginePath + "scripts/RayTracer2D.js");
	include(inPublicEnginePath + "scripts/Game2DTileSet.js");
	include(inPublicEnginePath + "scripts/Game2DWorld.js");
	include(inPublicEnginePath + "scripts/GameRulesBase.js");
	//////////////////////////////// ENGINE SCRIPTS //////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	
	
	
	//////////////////////////////////////////////////////////////////////////////
	//////////////////////////////// ENGINE UNIT TEST ////////////////////////////
	if(ECGame.Settings.RUN_UNIT_TESTS)
	{			
		//ENGINE UNIT TESTS:
		include(inPublicEnginePath + "scripts/unit_tests/TestGameClass.js");
		include(inPublicEnginePath + "scripts/unit_tests/TestGameBitPacker.js");
		include(inPublicEnginePath + "scripts/unit_tests/TestGameEventSystem.js");
		//include(inPublicEnginePath + "scripts/unit_tests/TestMultPacker.js ");//TODO
		include(inPublicEnginePath + "scripts/unit_tests/TestGameArithmeticCompression.js");
		include(inPublicEnginePath + "scripts/unit_tests/TestGameBinarySerializer.js");
		include(inPublicEnginePath + "scripts/unit_tests/TestGameEntity.js");
		
		if(inIsServer)
		{
			
		}
		
		//TEMP UNIT TESTS:
		//include(inPublicEnginePath + "LangTests.js");
	}
	//////////////////////////////// ENGINE UNIT TEST ////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	
	
	
	//////////////////////////////////////////////////////////////////////////////
	///////////////////////////////// GAME SCRIPTS ///////////////////////////////
	include(inPublicGamePath + "scripts/GameLoader.js");
	ECGame.Lib.LoadGame(include, inPublicGamePath, inPrivateGamePath);
	///////////////////////////////// GAME SCRIPTS ///////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	
	
	
	//////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////// RUN! ///////////////////////////////////
	if(ECGame.Settings.RUN_UNIT_TESTS)
	{
		ECGame.unitTests.runTests();
	}
	if(inIsServer)
	{
		ECGame.webServer = new ECGame.WebServerTools.WebServer();
		ECGame.webServer.run();
	}
	if(!inIsServer || ECGame.Settings.Network.isMultiplayer)
	{
		ECGame.instance = ECGame.EngineLib.GameInstance.create();
		ECGame.instance.run();
	}
	///////////////////////////////////// RUN! ///////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
};
