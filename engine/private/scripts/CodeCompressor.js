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

var fs = require("fs");

/*
Note:
Should also run jslint: http://www.jslint.com/

Known globals:

*/

ECGame.WebServerTools.CodeCompressor = function CodeCompressor(inEngineRootPath, inGameRootPath)
{
	this._engineRootPath = inEngineRootPath;
	this._gameRootPath = inGameRootPath;
	this._code = "";
};

ECGame.WebServerTools.CodeCompressor.prototype.makeCompactGameLoader = function makeCompactGameLoader()
{
	var path,
		i, j,
		gameLoaderSrc,
		regEx,
		values,
		fileSourceCode,
		obfuscator,
		obfuscatedSrc,
		systemGlobalObjects,
		currentObject,
		nextObject,
		systemIgnoreIndex;
	
	//get the gameloader source code
	gameLoaderSrc = fs.readFileSync('../engine/public/scripts/EngineLoader.js', 'utf8');
	
	
	///////////////////////////////////////////////////////
	//replace the public engine includes with the real code
	//find all the includes that are not commented out:
	regEx = new RegExp('\\n\\s*include\\x28inPublicEnginePath \\x2b \\"\\w+(\\x2f\\w+)*\\x2ejs\\"\\x29\\x3b', 'g');
	values = gameLoaderSrc.match(regEx);
	regEx.compile('\\"\\w+(\\x2f\\w+)*\\x2ejs\\"');
	//for all those includes, replace the include with the actual code!
	for(i = 0; i < values.length; ++i)
	{
		path = values[i].match(regEx)[0];//get just the path
		path = this._engineRootPath + path.substring(1, path.length - 1);

		fileSourceCode = fs.readFileSync(path, 'utf8');
		gameLoaderSrc = gameLoaderSrc.replace(values[i], '\n' + fileSourceCode);
	}
	//replace the public engine includes with the real code
	///////////////////////////////////////////////////////
	
	///////////////////////////////////////////////////////
	//replace the public game includes with the real code
	for(j = 0; j < 2; ++j)	//Do it 2x because the first time it will just load the GameLoader
	{
		//find all the includes that are not commented out:
		regEx = new RegExp('\\n\\s*include\\x28inPublicGamePath \\x2b \\"\\w+(\\x2f\\w+)*\\x2ejs\\"\\x29\\x3b', 'g');
		values = gameLoaderSrc.match(regEx);
		
		if(!values)
		{
			break;
		}
		
		regEx.compile('\\"\\w+(\\x2f\\w+)*\\x2ejs\\"');
		//for all those includes, replace the include with the actual code!
		for(i = 0; i < values.length; ++i)
		{
			path = values[i].match(regEx)[0];//get just the path
			path = this._gameRootPath + path.substring(1, path.length - 1);

			fileSourceCode = fs.readFileSync(path, 'utf8');
			gameLoaderSrc = gameLoaderSrc.replace(values[i], '\n' + fileSourceCode);
		}
	}
	//replace the public game includes with the real code
	///////////////////////////////////////////////////////
	
	
	obfuscator = new ECGame.WebServerTools.Obfuscator();
	obfuscator.addSrc('var ECGame, GameLocalization; var ' + gameLoaderSrc);
	
	obfuscator.registerNamespace('ECGame');
	obfuscator.registerNamespace('WebServerTools');//ECGame.WebServerTools
	obfuscator.registerNamespace('EngineLib');//ECGame.EngineLib
	obfuscator.registerNamespace('Lib');//ECGame.Lib
	obfuscator.registerNamespace('instance');//ECGame.instance
	obfuscator.registerNamespace('webServer');//ECGame.webServer
	//obfuscator.registerNamespace('GameClassRegistryMap');
	obfuscator.registerNamespace('unitTests');//ECGame.unitTests
	obfuscator.registerNamespace('Settings');//ECGame.Settings
	//TODO logger?

	obfuscator._addFunctionName('requestAnimFrame')//TODO make not private!	
	obfuscator.addIgnore('requestAnimationFrame');
	obfuscator.addIgnore('webkitRequestAnimationFrame');
	obfuscator.addIgnore('mozRequestAnimationFrame');
	obfuscator.addIgnore('oRequestAnimationFrame');
	obfuscator.addIgnore('msRequestAnimationFrame');
	obfuscator.addIgnore('setTimeout');
	obfuscator.addIgnore('require');
	
	//TODO probably should be in the obfuscator itself!
	//TODO have switch to turn off auto adding globals so I can find items in my code that are named the same as globals
	//TODO figure out how to add: window, document, and browser controls, etc
	systemGlobalObjects = [Array, Boolean, Date, Math, Number, String, RegExp, GLOBAL,/*Global,*/ Object, console, Function];
	for(i = 0; i < systemGlobalObjects.length; ++i)
	{
		currentObject = systemGlobalObjects[i];
		while(currentObject)
		{
			if(currentObject.name)
			{
				obfuscator.addIgnore(currentObject.name);
			}
			
			nextObject = currentObject.prototype;
			
			currentObject = Object.getOwnPropertyNames(currentObject);
			for(systemIgnoreIndex in currentObject)
			{
				//TODO consider the order this is created in so that we don't get stuff added here we should not!
				if(currentObject[systemIgnoreIndex] === 'ECGame' || currentObject[systemIgnoreIndex] === 'LoadEngine')
				{
					continue;
				}
				obfuscator.addIgnore(currentObject[systemIgnoreIndex]);
			}
			
			currentObject = nextObject;
		}
	}
	
	//TODO many of these should be in the obfuscator itself!
	obfuscator.addIgnore('Math');//because for some reason doesn't have it's name property
	obfuscator.addIgnore('console');//because for some reason doesn't have it's name property
	obfuscator.addIgnore('window');//TODO remove unneeded
	
	obfuscator.addIgnore('dom');//TODO this is param, rename it so we dont need this
	obfuscator.addIgnore('id');//TODO remove unneeded, used by dom.create
	obfuscator.addIgnore('width');//TODO remove unneeded, used by dom.create
	obfuscator.addIgnore('height');//TODO remove unneeded, used by dom.create
	obfuscator.addIgnore('innerHTML');//TODO remove unneeded, used by dom.create
	obfuscator.addIgnore('on');//TODO remove unneeded, used by dojo
	obfuscator.addIgnore('emit');//TODO remove unneeded
	obfuscator.addIgnore('document');//TODO remove unneeded??
	
	obfuscator.addIgnore('placeholder');//field for the HTML input control
	obfuscator.addIgnore('src');//the source of a js image
	obfuscator.addIgnore('type');//HTML user input events
	obfuscator.addIgnore('buffer');//used by native sound system
	obfuscator.addIgnore('class');//used as css class in html elements
	obfuscator.addIgnore('js');//TEMP HACK until strings removed correctly
	
	//audio
	obfuscator.addIgnore('setOrientation');//Native Audio
	obfuscator.addIgnore('setPosition');//Native Audio
	obfuscator.addIgnore('setVelocity');//Native Audio
	obfuscator.addIgnore('dopplerFactor');//Native Audio
	obfuscator.addIgnore('speedOfSound');//Native Audio
	
	//TODO, instead of ignoring these, server side should interpret them!!!
	obfuscator.addIgnore('userName');//network user object field
	obfuscator.addIgnore('userID');//network user object field
	obfuscator.addIgnore('reconnectKey');//network user object field
	//TODO depricate(d?)
	obfuscator.addIgnore('msg');//network msg type
	obfuscator.addIgnore('data');//network msg type
	
	obfuscator.addIgnore('className');//dom modify element for css
	obfuscator.addIgnore('focus');//dom UI function
	obfuscator.addIgnore('color');//for dom border-color
//	obfuscator.addIgnore('setSupressKeyboardEvents');//used in chat system
	obfuscator.addIgnore('blur');//The blur() method is used to remove focus from a dom element.
	obfuscator.addIgnore('value');//html input.value TODO value is used for TONS of other stuff!!
	
	obfuscator.addIgnore('send');//socket function
	/*
	ECGame.log.assert   AudioContext Image XMLHttpRequest io
	*/
		
	
	
	obfuscator.run();
		
	//TODO allow custom comment here
	obfuscatedSrc = '\x2f\x2a\n'
		+ 'This file is generated by EmpathicCivGameEngine™.\n'
		+ '© Copyright 2012 Jeremy Gross\n'
		+ 'jeremykentbgross@gmail.com\n'
		+ '\x2a\x2f\n'
		+ 'LoadEngine = function LoadEngine(inIsServer, inPublicEnginePath, inPrivateEnginePath, inPublicGamePath, inPrivateGamePath){'
		+ obfuscator.getObfuscatedCode()
		+ obfuscator.getObfuscatedName('LoadEngine') + '(inIsServer, inPublicEnginePath, inPrivateEnginePath, inPublicGamePath, inPrivateGamePath);'
		+ '};';
	this._code = new Buffer(obfuscatedSrc);
};

ECGame.WebServerTools.CodeCompressor.prototype.getCompactCode = function getCompactCode()
{
	return this._code;
};