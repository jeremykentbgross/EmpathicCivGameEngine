/*
	© Copyright 2011-2016 Jeremy Gross
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

/*!!
	* document: file
	* description: This file contains the central/master engine loading function /
		for the entire system
*/

/*!!
	@ namespace: Global
	* description: The Global Namespace.  Used for purely global functions/values.
*/

/*!!
	@ method: LoadEngine
	* namespace: Global
	* description: The loading entry point for the engine and game
	* parameters:
	[
		* parameter ["boolean"] inIsServer: Are we loading from the server (or the client)?
		* parameter ["string"] inProtectedEnginePath: Path to the protected engine files
		* parameter ["string"] inPrivateEnginePath: Path to the private engine files
		* parameter ["string"] inProtectedGamePath: Path to the protected game files
		* parameter ["string"] inPrivateGamePath: Path to the private game files
	]
	* returns: undefined
*/
//!!TODO Validate 8: Are the parameters here still really needed?
LoadEngine = function LoadEngine(
	inIsServer
	,inProtectedEnginePath
	,inPrivateEnginePath
	,inProtectedGamePath
	,inPrivateGamePath
)
{
	var include
		,createAndRunGame
		;
	
	
	//////////////////////////////////////////////////////////////////////////////
	///////////////////////////////Global Namespaces//////////////////////////////
	//Setup Global namespaces:

	/*!!
		* document: namespace
		* name: ECGame
		* description: This is the master namespace for the entire game / engine
	*/
	ECGame = function ECGame() { return; };
	ECGame = new ECGame();
	
	/*!!
		* document: namespace
		* name: EngineLib
		* namespace: ECGame
		* description: This is the engine library namespace
	*/
	ECGame.EngineLib = function ECGameEngineLib() { return; };
	ECGame.EngineLib = new ECGame.EngineLib();
	
	/*!!
		* document: namespace
		* name: Lib
		* namespace: ECGame
		* description: This is the game specific library namespace
	*/
	ECGame.Lib = function ECGameLib() { return; };
	ECGame.Lib = new ECGame.Lib();
	
	createAndRunGame = function createAndRunGame()
	{
		/*!!
			* document: member
			* name: instance
			* namespace: ECGame
			* types: ["ECGame.EngineLib.GameInstance"]
			* default: ECGame.EngineLib.GameInstance.create()
			* description: the game instance
		*/
		ECGame.instance = ECGame.EngineLib.GameInstance.create();
		ECGame.instance.run();
	};

	if(inIsServer)
	{
		/*!!
			* document: namespace
			* name: WebServerTools
			* namespace: ECGame
			* description: This is the namespace for all webserver related tools
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
	
	/*!!
		* document: beginNamespace
		* name: LoadParameters
		* namespace: ECGame.EngineLib
		* description: This isn't used atm
	*/
	//!!TODO Refactor 8: Remove this, it doesn't seem to be in use!
	ECGame.EngineLib.LoadParameters = 
	{
		/*!!
			* document: method
			* name: include
			* description: This is the include function for laoding files
			* parameters: [
				{
					* name: inFileName
					* types: ["string"]
					* description: Name of the file to load
				}
			]
			* returns: undefined
		*/
		include : include
		/*!!
			* document: member
			* name: PublicEnginePath
			* description: Path for public engine files
			* types: ["string"]
			* default: Set by external loading function
		*/
		,PublicEnginePath : inProtectedEnginePath
		/*!!
			* document: member
			* name: PrivateEnginePath
			* description: Path for private engine files
			* types: ["string"]
			* default: Set by external loading function
		*/
		,PrivateEnginePath : inPrivateEnginePath
		/*!!
			* document: member
			* name: PublicGamePath
			* description: Path for public game files
			* types: ["string"]
			* default: Set by external loading function
		*/
		,PublicGamePath : inProtectedGamePath
		/*!!
			* document: member
			* name: PrivateGamePath
			* description: Path for private game files
			* types: ["string"]
			* default: Set by external loading function
		*/
		,PrivateGamePath : inPrivateGamePath
	};
	//!!endNamespace: LoadParameters
	///////////////////////////////INCLUDE SETUP//////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////

	
	//!!TODO Feature 8: AssetPath(\"...\"), Localize(\"...\") + unmarked strings to obfuscate category
	
	//Load the settings flags first:
	include(inProtectedEnginePath + "scripts/EngineSettings.js");
	include(inProtectedGamePath + "scripts/GameSettings.js");
	
	//Set the server flag in the global system
	ECGame.Settings.Network.isServer = inIsServer;
	
	//!!TODO Refactor 8: make public and private loaders?
		
	if(ECGame.Settings.RUN_UNIT_TESTS)
	{
		include(inProtectedEnginePath + "scripts/UnitTestFramework/UnitTestFramework.js");
		/*!!
			@ member: unitTests
			* namespace: ECGame
			* types: ["ECGame.EngineLib.UnitTestFramework"]
			* description: "Unit Test Collection"
			* default: ECGame.EngineLib.UnitTestFramework.create()
		*/
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
			/*!!
				* document: namespace
				* name: Mongoose
				* namespace: ECGame.WebServerTools
				* description: This is the namespace for all mongoose related objects
			*/
			ECGame.WebServerTools.Mongoose = function ECGameWebServerMongoose() { return; };
			ECGame.WebServerTools.Mongoose = new ECGame.WebServerTools.Mongoose();

			include(inPrivateEnginePath + "scripts/Mongoose/MongooseConnection.js");
			include(inPrivateEnginePath + "scripts/Mongoose/MongooseUserModel.js");
			include(inPrivateEnginePath + "scripts/Mongoose/MongooseUserAuth.js");
		}
		include(inPrivateEnginePath + "scripts/WebServer.js");
		include(inPrivateEnginePath + "scripts/DocJS2.js");//include(inPrivateEnginePath + "scripts/DocJS.js");
		include(inPrivateEnginePath + "scripts/CodeObfuscator.js"); //!!TODO Rename 8: consider naming just Obfuscator
		include(inPrivateEnginePath + "scripts/CodeCompressor.js"); //!!TODO Rename 8: consider naming preprocessor or something
		include(inPrivateEnginePath + "scripts/CodeValidator.js");
		
		if(ECGame.Settings.RUN_UNIT_TESTS)
		{
			include(inPrivateEnginePath + "scripts/unit_tests/TestObfuscator.js");
			include(inPrivateEnginePath + "scripts/unit_tests/TestDocJS2.js");//include(inPrivateEnginePath + "scripts/unit_tests/TestDocJS.js");
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
				//!!TODO Refactor 8: delete unit tests now?
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
	//!!TODO Refactor 8: order these better:
	include(inProtectedEnginePath + "scripts/Misc/Helpers.js");
	include(inProtectedEnginePath + "scripts/Misc/JsNativeExtensions.js");
	
	include(inProtectedEnginePath + "scripts/Math/AABB2D.js");
	include(inProtectedEnginePath + "scripts/Math/Point2D.js");
	
	include(inProtectedEnginePath + "scripts/BresenhamsLine.js");//!!TODO Validate 8: BresenhamsLine inuse?
	
	include(inProtectedEnginePath + "scripts/DataStructures/LinkedListNode.js");
	
	include(inProtectedEnginePath + "scripts/Utilities/Timer.js");
	include(inProtectedEnginePath + "scripts/Utilities/Updater.js");
	include(inProtectedEnginePath + "scripts/Utilities/AssetManager.js");
	include(inProtectedEnginePath + "scripts/PrefabObject.js");
	
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

	//!!TODO Refactor 8: if multiplayer?
	//{
		include(inProtectedEnginePath + "scripts/Compression/BitPacker.js");
		include(inProtectedEnginePath + "scripts/Compression/ArithmeticCompression.js");
		include(inProtectedEnginePath + "scripts/Compression/ArithmeticCompressionModels.js");
		include(inProtectedEnginePath + "scripts/BinarySerializer.js");
	//}
	
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
	if(ECGame.Settings.Editor.Enabled)//!!TODO Rename 8: rename enabled
	{
		/*!!
			* document: beginNamespace
			* name: EditorLib
			* namespace: ECGame
			* description: This is the engine editor namespace
		*/
		//!!TODO Feature 5: editor
		/*
		Notice UI generation: http://json-schema.org/implementations.html
		https://github.com/jdorn/json-editor
		*/
		ECGame.EditorLib = function ECGameEditorLib() { return; };
		ECGame.EditorLib = new ECGame.EditorLib();
		if(!inIsServer)
		{
			//!!TODO Refactor 8: path for editor??
			include("engine_editor/" + "scripts/ParticleEditor.js");
		}
		//!!endNamespace: EditorLib
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
	if(inIsServer && ECGame.Settings.Server.jslintCheckCode)//!!TODO Feature 8: jshint also
	{
		(new ECGame.WebServerTools.CodeValidator()).validateDirectoryTree('../_unified_');
	}
	if(ECGame.Settings.RUN_UNIT_TESTS)
	{
		ECGame.unitTests.runTests();
		//!!TODO Refactor 8: delete unit tests now? => NO! delete unit tests at the end of runTests()
	}
	if(inIsServer)
	{
		/*!!
			* document: member
			* name: webServer
			* namespace: ECGame
			* types: ["ECGame.WebServerTools.WebServer"]
			* default: new ECGame.WebServerTools.WebServer()
			* description: The web server component serves static assets and manages logins
		*/
		//!!TODO Document 8: Document WebServer class
		ECGame.webServer = new ECGame.WebServerTools.WebServer();
		ECGame.webServer.run(
			function serverIsRunning()
			{
				if(ECGame.Settings.Network.isMultiplayer)
				{
					createAndRunGame();
				}
			}
		);
	}
	if(!inIsServer)
	{
		createAndRunGame();
	}
	///////////////////////////////////// RUN! ///////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
};
