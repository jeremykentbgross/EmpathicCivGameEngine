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

LoadEngine = function LoadEngine(
	inIsServer
	,inProtectedEnginePath
	,inPrivateEnginePath
	,inProtectedGamePath
	,inPrivateGamePath
)
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
				,aFullPathFileName
				;
			
			//setup the full relative filename
			aFullPathFileName = 
				window.location.protocol + '\/\/'
				+ window.location.host + '/'
				+ inFileName;
			
			//synchronously get the code
			aRequest = new XMLHttpRequest();
			aRequest.open('GET', aFullPathFileName, false);
			aRequest.send();
			/*NOTE:^^ XMLHttpRequest.open(..., async=false) doesn't work on Firefox.
				This seems to be why audio doesn't work in FF when the code isn't compressed as one file.
				If needed, this can be fixed by queueing the files to request in an array and poping the next
				during "onload", but this requires that function calls made lower in this file also somehow
				be queued.  Atm this isn't a priority to me, but if needed can be done for debuging firefox
			*/
			
			//set the returned script text while adding special comment to 
			// auto include in debugger source listing:
			aScriptSource = aRequest.responseText
				+ '\n\/\/# sourceURL=' + aFullPathFileName + '\n';
			
			//if(true)
			//{
				//create a dom element to hold the code
				aScript = document.createElement('script');
				aScript.type = 'text/javascript';
				aScript.id = inFileName;	//tried using this as variations of the id for debug readability
				
				//set the script tag text, including the debugger id at the end!!
				aScript.text/*?vs textContent?*/ = aScriptSource;
							
				//append the code to the dom
				document.getElementsByTagName('body')[0].appendChild(aScript);
			//}
			/*else
			{
				//This works also, but eval is marked as evil when lint'ing.
				//	Left in to document alternative solutions and why they are not currently used.
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
		
		,PublicEnginePath : inProtectedEnginePath
		,PrivateEnginePath : inPrivateEnginePath
		
		,PublicGamePath : inProtectedGamePath
		,PrivateGamePath : inPrivateGamePath
	};
	///////////////////////////////INCLUDE SETUP//////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////

	
	//TODO: AssetPath("..."), Localize("...") + unmarked strings to obfuscate category
	
	//Load the settings flags first:
	include(inProtectedEnginePath + "scripts/EngineSettings.js");
	include(inProtectedGamePath + "scripts/GameSettings.js");
	//TODO include GameSettings from game folder? (or will be done by user?)
	
	//Set the server flag in the global system
	ECGame.Settings.Network.isServer = inIsServer;	//TODO this should be parameters for creating it!
	
	//TODO make public and private loaders?
		
	if(ECGame.Settings.RUN_UNIT_TESTS)
	{
		include(inProtectedEnginePath + "scripts/UnitTestFramework/UnitTestFramework.js");
		ECGame.unitTests = ECGame.EngineLib.UnitTestFramework.create();
	}
	
	include(inProtectedEnginePath + "scripts/Registry.js");
	include(inProtectedEnginePath + "scripts/Events/EventSystem.js");
	include(inProtectedEnginePath + "scripts/GameClass.js");

	//////////////////////////////////////////////////////////////////////////////
	//////////////////////////////// SERVER SCRIPTS //////////////////////////////
	if(inIsServer)
	{
		if(ECGame.Settings.Server.useMongoose)
		{
			/**!
				@namespace: Mongoose
				/parentNamespace: ECGame.WebServerTools
				/description: This is the namespace for all mongoose related objects
			*/
			ECGame.WebServerTools.Mongoose = function ECGameWebServerMongoose() { return; };
			ECGame.WebServerTools.Mongoose = new ECGame.WebServerTools.Mongoose();

			include(inPrivateEnginePath + "scripts/Mongoose/MongooseConnection.js");
			include(inPrivateEnginePath + "scripts/Mongoose/MongooseUserModel.js");
			include(inPrivateEnginePath + "scripts/Mongoose/MongooseUserAuth.js");
		}
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
				//TODO delete unit tests now?
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
	include(inProtectedEnginePath + "scripts/Misc/Helpers.js");
	include(inProtectedEnginePath + "scripts/Misc/JsNativeExtensions.js");
	
	include(inProtectedEnginePath + "scripts/Math/AABB2D.js");
	include(inProtectedEnginePath + "scripts/Math/Point2D.js");
	
	include(inProtectedEnginePath + "scripts/BresenhamsLine.js");/////
	
	include(inProtectedEnginePath + "scripts/DataStructures/LinkedListNode.js");
	
	include(inProtectedEnginePath + "scripts/Utilities/Timer.js");
	include(inProtectedEnginePath + "scripts/Utilities/Updater.js");
	include(inProtectedEnginePath + "scripts/Utilities/AssetManager.js");
	
	if(!inIsServer)
	{
		if(ECGame.Settings.Network.isMultiplayer)
		{
			include(inProtectedEnginePath + "scripts/ChatSystem.js");
		}
		include(inProtectedEnginePath + "scripts/Graphics2D.js");
		include(inProtectedEnginePath + "scripts/SoundAsset.js");
		include(inProtectedEnginePath + "scripts/SoundSample.js");
		include(inProtectedEnginePath + "scripts/SoundDescription.js");
		include(inProtectedEnginePath + "scripts/SoundSystem.js");
		include(inProtectedEnginePath + "scripts/Sound.js");
		include(inProtectedEnginePath + "scripts/Sound2D.js");
	}
	if(ECGame.Settings.Network.isMultiplayer)
	{
		include(inProtectedEnginePath + "scripts/NetUser.js");
		include(inProtectedEnginePath + "scripts/NetGroup.js");
		include(inProtectedEnginePath + "scripts/NetworkBase.js");
		if(inIsServer)
		{
			include(inPrivateEnginePath + "scripts/NetworkServer.js");
		}
		else
		{
			include(inProtectedEnginePath + "scripts/NetworkClient.js");
		}
	}

	include(inProtectedEnginePath + "scripts/Input.js");
	include(inProtectedEnginePath + "scripts/World2D/Camera2D.js");
	include(inProtectedEnginePath + "scripts/GameObject.js");
	include(inProtectedEnginePath + "scripts/GameObjectRef.js");
	include(inProtectedEnginePath + "scripts/GameObjectCollection.js");

	if(ECGame.Settings.Debug.UseServerMonitor)
	{
		include(inProtectedEnginePath + "scripts/ServerMonitor.js");
	}

	include(inProtectedEnginePath + "scripts/Compression/BitPacker.js");//TODO if multiplayer?
	include(inProtectedEnginePath + "scripts/Compression/ArithmeticCompression.js");//TODO if multiplayer?
	include(inProtectedEnginePath + "scripts/Compression/ArithmeticCompressionModels.js");//TODO if multiplayer?
	include(inProtectedEnginePath + "scripts/BinarySerializer.js");//TODO if multiplayer?
	
	include(inProtectedEnginePath + "scripts/GameEvent.js");

	include(inProtectedEnginePath + "scripts/Entity/Entity.js");
	include(inProtectedEnginePath + "scripts/Entity/EntityComponent.js");
	include(inProtectedEnginePath + "scripts/Entity/EntityComponent_Camera2D.js");
	include(inProtectedEnginePath + "scripts/EntityComponent_SoundPlayer.js");

	
	include(inProtectedEnginePath + "scripts/GameInstance.js");
	include(inProtectedEnginePath + "scripts/QuadTree.js");
	
	include(inProtectedEnginePath + "scripts/Renderable2D.js");
	
	include(inProtectedEnginePath + "scripts/TileDescription2D.js");
	include(inProtectedEnginePath + "scripts/TileInstance2D.js");
	include(inProtectedEnginePath + "scripts/TileRenderable2D.js");
	
	include(inProtectedEnginePath + "scripts/Animation2D/Animation2DFrame.js");
	include(inProtectedEnginePath + "scripts/Animation2D/Animation2D.js");
	include(inProtectedEnginePath + "scripts/Animation2D/Animation2DInstance.js");
	include(inProtectedEnginePath + "scripts/Animation2D/LayeredAnimation2DInstances.js");
	
	include(inProtectedEnginePath + "scripts/ParticleEffect.js");
	
	include(inProtectedEnginePath + "scripts/SceneGraph2D.js");
	
	include(inProtectedEnginePath + "scripts/TileMap2D.js");
	include(inProtectedEnginePath + "scripts/Physics2D.js");
	include(inProtectedEnginePath + "scripts/Ray2D.js");
	include(inProtectedEnginePath + "scripts/RayTracer2D.js");
	include(inProtectedEnginePath + "scripts/TileSet2D.js");
	include(inProtectedEnginePath + "scripts/World2D.js");
	include(inProtectedEnginePath + "scripts/GameRulesBase.js");
	//////////////////////////////// ENGINE SCRIPTS //////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	
	
	
	//////////////////////////////////////////////////////////////////////////////
	//////////////////////////////// ENGINE UNIT TEST ////////////////////////////
	if(ECGame.Settings.RUN_UNIT_TESTS)
	{			
		//ENGINE UNIT TESTS:
		include(inProtectedEnginePath + "scripts/TestGameClass.js");//////////
		
		include(inProtectedEnginePath + "scripts/Events/UnitTests/TestEventSystem.js");
		
		include(inProtectedEnginePath + "scripts/Compression/UnitTests/TestBitPacker.js");
		include(inProtectedEnginePath + "scripts/Compression/UnitTests/TestArithmeticCompression.js");

		include(inProtectedEnginePath + "scripts/TestBinarySerializer.js");/////
		
		include(inProtectedEnginePath + "scripts/Entity/UnitTests/TestEntity.js");
		
		/*if(inIsServer)
		{
			
		}*/
		
		//TEMP UNIT TESTS:
		//include(inProtectedEnginePath + "LangTests.js");
	}
	//////////////////////////////// ENGINE UNIT TEST ////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	
	
	
	//////////////////////////////////////////////////////////////////////////////
	///////////////////////////////// EDITOR SCRIPTS /////////////////////////////
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
	///////////////////////////////// EDITOR SCRIPTS /////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	
	
	
	//////////////////////////////////////////////////////////////////////////////
	///////////////////////////////// GAME SCRIPTS ///////////////////////////////
	include(inProtectedGamePath + "scripts/GameLoader.js");
	ECGame.Lib.LoadGame(include, inProtectedGamePath, inPrivateGamePath);
	///////////////////////////////// GAME SCRIPTS ///////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	
	
	
	//////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////// RUN! ///////////////////////////////////
	if(inIsServer && ECGame.Settings.Server.jslintCheckCode)//TODO jshint also
	{
		(new ECGame.WebServerTools.CodeValidator()).validateDirectoryTree('../_unified_');
	}
	if(ECGame.Settings.RUN_UNIT_TESTS)
	{
		ECGame.unitTests.runTests();
		//TODO delete unit tests now?
	}
	if(inIsServer)
	{
		ECGame.webServer = new ECGame.WebServerTools.WebServer();
		ECGame.webServer.run(
			function serverIsRunning()
			{
				if(ECGame.Settings.Network.isMultiplayer)
				{
					ECGame.instance = ECGame.EngineLib.GameInstance.create();
					ECGame.instance.run();
				}
			}
		);
	}
	if(!inIsServer)
	{
		ECGame.instance = ECGame.EngineLib.GameInstance.create();
		ECGame.instance.run();
	}
	///////////////////////////////////// RUN! ///////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
};
