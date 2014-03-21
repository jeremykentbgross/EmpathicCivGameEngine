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

/*global LoadEngine:true */

LoadEngine = function LoadEngine(inIsServer, inPublicEnginePath, inPrivateEnginePath, inPublicGamePath, inPrivateGamePath)//TODO inAppLoaderPath
{
	var include
		;
	
	
	//////////////////////////////////////////////////////////////////////////////
	///////////////////////////////Global Namespaces//////////////////////////////
	//Setup Global namespaces:
	/**!
		@namespace: ECGame
		/description: This is the master namespace for the entire game / engine
	*/
	ECGame = function ECGame() { return; };
	ECGame = new ECGame();
	
	/**!
		@namespace: EngineLib
		/parentNamespace: ECGame
		/description: This is the engine namespace
	*/
	ECGame.EngineLib = function ECGameEngineLib() { return; };
	ECGame.EngineLib = new ECGame.EngineLib();
	
	/**!
		@namespace: Lib
		/parentNamespace: ECGame
		/description: This is the game specific namespace
	*/
	ECGame.Lib = function ECGameLib() { return; };
	ECGame.Lib = new ECGame.Lib();
	
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
		ECGame.WebServerTools = function ECGameWebServerTools() { return; };
		ECGame.WebServerTools = new ECGame.WebServerTools();
	}
	///////////////////////////////Global Namespaces//////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	
	
	
	//////////////////////////////////////////////////////////////////////////////
	///////////////////////////////INCLUDE SETUP//////////////////////////////////
	//Setup include
	if(!inIsServer)
	{
		include = function include(inFileName)
		{
			var aRequest
				,aScript
				,aScriptSource
				;
			
			//setup the full relative filename
			inFileName = 
				window.location.protocol + '\/\/'
				+ window.location.host + '/'
				+ inFileName;
			
			//synchronously get the code
			aRequest = new XMLHttpRequest();
			aRequest.open('GET', inFileName, false);
			aRequest.send();
			
			//set the returned script text while adding special comment to 
			// auto include in debugger source listing:
			aScriptSource = aRequest.responseText
				+ '\n\/\/\/\/# sourceURL=' + inFileName + '\n';
			
			//if(true)
			//{
				//create a dom element to hold the code
				aScript = document.createElement('script');
				aScript.type = 'text/javascript';
				
				//set the script tag text, including the debugger id at the end!!
				aScript.text = aScriptSource;
							
				//append the code to the dom
				document.getElementsByTagName('body')[0].appendChild(aScript);
			//}
			/*else
			{
				eval(aScriptSource);
			}*/
		};
	}
	else
	{
		include = require;
		include(inPrivateEnginePath + "scripts/ServerConsoleMods.js");
	}
	
	ECGame.EngineLib.LoadParameters = 
	{
		include : include
		
		,PublicEnginePath : inPublicEnginePath
		,PrivateEnginePath : inPrivateEnginePath
		
		,PublicGamePath : inPublicGamePath
		,PrivateGamePath : inPrivateGamePath
	};
	///////////////////////////////INCLUDE SETUP//////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////

	//TODO: AssetPath("..."), Localize("...")
	
	
	//Load the settings flags first:
	include(inPublicEnginePath + "scripts/EngineSettings.js");
	include(inPublicGamePath + "scripts/GameSettings.js");
	//TODO include GameSettings from game folder? (or will be done by user?)
	
	//Set the server flag in the global system
	ECGame.Settings.Network.isServer = inIsServer;	//TODO this should be parameters for creating it!
	
	//TODO make public and private loaders?
		
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
		include(inPrivateEnginePath + "scripts/CodeValidator.js");
		
		if(ECGame.Settings.RUN_UNIT_TESTS)
		{
			include(inPrivateEnginePath + "scripts/unit_tests/TestObfuscator.js");
			include(inPrivateEnginePath + "scripts/unit_tests/TestDocJS.js");
		}
		
		if(!ECGame.Settings.Network.isMultiplayer)
		{
			if(ECGame.Settings.Server.jslintCheckCode)
			{
				(new ECGame.WebServerTools.CodeValidator()).validateDirectoryTree('../_unified_');
			}
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
	include(inPublicEnginePath + "scripts/Helpers.js");
	include(inPublicEnginePath + "scripts/JsNativeExtensions.js");
	include(inPublicEnginePath + "scripts/AABB2D.js");
	include(inPublicEnginePath + "scripts/Point2D.js");
	include(inPublicEnginePath + "scripts/BresenhamsLine.js");
	include(inPublicEnginePath + "scripts/GameRegistry.js");
	include(inPublicEnginePath + "scripts/GameCircularDoublyLinkedListNode.js");
	include(inPublicEnginePath + "scripts/GameEventSystem.js");
	include(inPublicEnginePath + "scripts/Updater.js");
	if(!inIsServer)
	{
		if(ECGame.Settings.Network.isMultiplayer)
		{
			include(inPublicEnginePath + "scripts/ChatSystem.js");
		}
		include(inPublicEnginePath + "scripts/Graphics2D.js");
		include(inPublicEnginePath + "scripts/SoundAsset.js");
		include(inPublicEnginePath + "scripts/SoundSample.js");
		include(inPublicEnginePath + "scripts/SoundDescription.js");
		include(inPublicEnginePath + "scripts/SoundSystem.js");
		include(inPublicEnginePath + "scripts/Sound.js");
		include(inPublicEnginePath + "scripts/Sound2D.js");
		include(inPublicEnginePath + "scripts/AssetManager.js");
	}
	if(ECGame.Settings.Network.isMultiplayer)
	{
		include(inPublicEnginePath + "scripts/NetUser.js");
		include(inPublicEnginePath + "scripts/NetGroup.js");
		include(inPublicEnginePath + "scripts/NetworkBase.js");
		if(inIsServer)
		{
			include(inPrivateEnginePath + "scripts/NetworkServer.js");
		}
		else
		{
			include(inPublicEnginePath + "scripts/NetworkClient.js");
		}
	}

	include(inPublicEnginePath + "scripts/Input.js");
	include(inPublicEnginePath + "scripts/Camera2.js");
	include(inPublicEnginePath + "scripts/GameObject.js");
	include(inPublicEnginePath + "scripts/GameObjectRef.js");
	include(inPublicEnginePath + "scripts/GameObjectCollection.js");
	include(inPublicEnginePath + "scripts/BitPacker.js");//TODO if multiplayer?
	//include(inPublicEnginePath + "scripts/MultPacker.js");//TODO
	include(inPublicEnginePath + "scripts/ArithmeticCompression.js");//TODO if multiplayer?
	include(inPublicEnginePath + "scripts/ArithmeticCompressionModels.js");//TODO if multiplayer?
	include(inPublicEnginePath + "scripts/BinarySerializer.js");//TODO if multiplayer?
	include(inPublicEnginePath + "scripts/GameEvent.js");

	include(inPublicEnginePath + "scripts/GameEntity.js");
	include(inPublicEnginePath + "scripts/GameEntityComponent.js");
	include(inPublicEnginePath + "scripts/GameEntityComponent_2DCamera.js");
	include(inPublicEnginePath + "scripts/GameEntityComponent_Input.js");
	include(inPublicEnginePath + "scripts/GameEntityComponent_Sprite.js");
	include(inPublicEnginePath + "scripts/EntityComponent_Physics2D.js");
	include(inPublicEnginePath + "scripts/GameEntityComponent_SoundPlayer.js");

	include(inPublicEnginePath + "scripts/Timer.js");
	include(inPublicEnginePath + "scripts/GameInstance.js");
	include(inPublicEnginePath + "scripts/QuadTree.js");
	
	include(inPublicEnginePath + "scripts/Renderable2D.js");
	
	include(inPublicEnginePath + "scripts/TileDescription2D.js");
	include(inPublicEnginePath + "scripts/TileInstance2D.js");
	include(inPublicEnginePath + "scripts/TileRenderable2D.js");
	
	include(inPublicEnginePath + "scripts/Animation2DFrame.js");
	include(inPublicEnginePath + "scripts/Animation2D.js");
	include(inPublicEnginePath + "scripts/Animation2DInstance.js");
	include(inPublicEnginePath + "scripts/ParticleEffect.js");
	
	include(inPublicEnginePath + "scripts/SceneGraph2D.js");
	
	include(inPublicEnginePath + "scripts/TileMap2D.js");
	include(inPublicEnginePath + "scripts/Physics2D.js");
	include(inPublicEnginePath + "scripts/Ray2D.js");
	include(inPublicEnginePath + "scripts/RayTracer2D.js");
	include(inPublicEnginePath + "scripts/TileSet2D.js");
	include(inPublicEnginePath + "scripts/World2D.js");
	include(inPublicEnginePath + "scripts/GameRulesBase.js");
	//////////////////////////////// ENGINE SCRIPTS //////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	
	
	
	//////////////////////////////////////////////////////////////////////////////
	//////////////////////////////// ENGINE UNIT TEST ////////////////////////////
	if(ECGame.Settings.RUN_UNIT_TESTS)
	{			
		//ENGINE UNIT TESTS:
		include(inPublicEnginePath + "scripts/unit_tests/TestGameClass.js");
		include(inPublicEnginePath + "scripts/unit_tests/TestBitPacker.js");
		include(inPublicEnginePath + "scripts/unit_tests/TestGameEventSystem.js");
		//include(inPublicEnginePath + "scripts/unit_tests/TestMultPacker.js ");//TODO
		include(inPublicEnginePath + "scripts/unit_tests/TestArithmeticCompression.js");
		include(inPublicEnginePath + "scripts/unit_tests/TestBinarySerializer.js");
		include(inPublicEnginePath + "scripts/unit_tests/TestGameEntity.js");
		
		/*if(inIsServer)
		{
			
		}*/
		
		//TEMP UNIT TESTS:
		//include(inPublicEnginePath + "LangTests.js");
	}
	//////////////////////////////// ENGINE UNIT TEST ////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	
	
	
	//////////////////////////////////////////////////////////////////////////////
	///////////////////////////////// GAME SCRIPTS ///////////////////////////////
	if(ECGame.Settings.Editor.Enabled)
	{
		/**!
			@namespace: EditorLib
			/parentNamespace: ECGame
			/description: This is the engine namespace
		*/
		ECGame.EditorLib = function ECGameEditorLib() { return; };
		ECGame.EditorLib = new ECGame.EditorLib();
		if(!inIsServer)
		{
			//TODO path for editor??
			include("engine_editor/" + "scripts/ParticleEditor.js");
		}
	}
	///////////////////////////////// GAME SCRIPTS ///////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	
	
	
	//////////////////////////////////////////////////////////////////////////////
	///////////////////////////////// GAME SCRIPTS ///////////////////////////////
	include(inPublicGamePath + "scripts/GameLoader.js");
	ECGame.Lib.LoadGame(include, inPublicGamePath, inPrivateGamePath);
	///////////////////////////////// GAME SCRIPTS ///////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	
	
	
	//////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////// RUN! ///////////////////////////////////
	if(inIsServer && ECGame.Settings.Server.jslintCheckCode)
	{
		(new ECGame.WebServerTools.CodeValidator()).validateDirectoryTree('../_unified_');
	}
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
