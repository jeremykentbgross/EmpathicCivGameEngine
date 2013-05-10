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

ECGame.Webserver.CodeCompressor = function CodeCompressor(inRootPath)
{
	this._rootPath = inRootPath;
	this._code = "";
};

ECGame.Webserver.CodeCompressor.prototype.makeCompactGameLoader = function makeCompactGameLoader()
{
	var path,
		i,
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
	gameLoaderSrc = fs.readFileSync('../public/scripts/GameLoader.js', 'utf8');
	
	//find all the includes that are not commented out:
	regEx = new RegExp('\\n\\s*include\\x28inSharedPath \\x2b \\"\\w+(\\x2f\\w+)*\\x2ejs\\"\\x29\\x3b', 'g');
	values = gameLoaderSrc.match(regEx);
	
	regEx.compile('\\"\\w+(\\x2f\\w+)*\\x2ejs\\"');
	//for all those includes, replace the include with the actual code!
	for(i = 0; i < values.length; ++i)
	{
		path = values[i].match(regEx)[0];//get just the path
		path = this._rootPath + path.substring(1, path.length - 1);

		fileSourceCode = fs.readFileSync(path, 'utf8');
		gameLoaderSrc = gameLoaderSrc.replace(values[i], '\n' + fileSourceCode);
	}
	
	
	obfuscator = new ECGame.Webserver.Obfuscator();
	obfuscator.addSrc(gameLoaderSrc);
	
	obfuscator.registerNamespace('ECGame');
	obfuscator.registerNamespace('Webserver');//ECGame.Webserver
	obfuscator.registerNamespace('EngineLib');//ECGame.EngineLib
	obfuscator.registerNamespace('Lib');//ECGame.Lib
	obfuscator.registerNamespace('instance');//ECGame.instance
	//obfuscator.registerNamespace('GameClassRegistryMap');
	obfuscator.registerNamespace('unitTests');//ECGame.unitTests
//	obfuscator.registerNamespace('GameLoader');
	obfuscator.registerNamespace('Settings');//ECGame.Settings
	//TODO locailization
	//TODO logger?
	//BIG Crashes: obfuscator.registerNamespace('PRIVATE');//TEMP HACK!!!!!

	obfuscator._addFunctionName('requestAnimFrame')//TODO make not private!	
	obfuscator.addIgnore('requestAnimationFrame');
	obfuscator.addIgnore('webkitRequestAnimationFrame');
	obfuscator.addIgnore('mozRequestAnimationFrame');
	obfuscator.addIgnore('oRequestAnimationFrame');
	obfuscator.addIgnore('msRequestAnimationFrame');
	obfuscator.addIgnore('setTimeout');
	obfuscator.addIgnore('require');
	
	obfuscator.addIgnore('GameLoader');
	obfuscator.addIgnore('start');//TODO should rename 'load' (game loader entry function)

	
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
				if(currentObject[systemIgnoreIndex] === 'ECGame')
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
	obfuscator.addIgnore('dom');//TODO this is param, rename it so we dont need this
	obfuscator.addIgnore('id');//TODO remove unneeded, used by dom.create
	obfuscator.addIgnore('width');//TODO remove unneeded, used by dom.create
	obfuscator.addIgnore('height');//TODO remove unneeded, used by dom.create
	obfuscator.addIgnore('innerHTML');//TODO remove unneeded, used by dom.create
	obfuscator.addIgnore('on');//TODO remove unneeded, used by dojo
	obfuscator.addIgnore('window');//TODO remove unneeded
	obfuscator.addIgnore('emit');//TODO remove unneeded
//	obfuscator.addIgnore('console');//TODO remove unneeded??
	obfuscator.addIgnore('document');//TODO remove unneeded??
	obfuscator.addIgnore('placeholder');//field for the HTML input control
	obfuscator.addIgnore('src');//the source of a js image
	obfuscator.addIgnore('type');//HTML user input events
	obfuscator.addIgnore('buffer');//used by native sound system
	obfuscator.addIgnore('class');//used as css class in html elements
	obfuscator.addIgnore('js');//TEMP HACK until strings removed correctly
	obfuscator.addIgnore('setOrientation');//Native Audio
	obfuscator.addIgnore('setPosition');//Native Audio
	obfuscator.addIgnore('setVelocity');//Native Audio
	obfuscator.addIgnore('dopplerFactor');//Native Audio
	obfuscator.addIgnore('speedOfSound');//Native Audio
	obfuscator.addIgnore('userName');//network user object field
	obfuscator.addIgnore('userID');//network user object field
	obfuscator.addIgnore('msg');//network msg type
	obfuscator.addIgnore('data');//network msg type
	obfuscator.addIgnore('className');//dom modify element for css
	obfuscator.addIgnore('focus');//dom UI function
	obfuscator.addIgnore('color');//for dom border-color
//	obfuscator.addIgnore('setSupressKeyboardEvents');//used in chat system
	obfuscator.addIgnore('blur');//The blur() method is used to remove focus from a dom element.
	obfuscator.addIgnore('value');//html input.value TODO value is used for TONS of other stuff!!
	
	
	/*
	ECGame.log.assert   AudioContext Image XMLHttpRequest io
	*/
		
	
	
	obfuscator.run();
	
	obfuscatedSrc = obfuscator.getObfuscatedCode();
	this._code = new Buffer(obfuscatedSrc);
};

ECGame.Webserver.CodeCompressor.prototype.getCompactCode = function getCompactCode()
{
	return this._code;
};