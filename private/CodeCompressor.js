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

GameLoader window require requestAnimFrame setTimeout GameSystemVars GameEngineLib GameLib GameInstance GameClassRegistryMap GameUnitTests console gameAssert document Image GameEngineServer io
*/

GameEngineServer.CodeCompressor = function CodeCompressor(inRootPath)
{
	this._rootPath = inRootPath;
	this._code = "";
}

GameEngineServer.CodeCompressor.prototype.makeCompactGameLoader = function makeCompactGameLoader()
{
	var path;
	var i;
	
	//get the gameloader source code
	var gameLoaderSrc = fs.readFileSync('../public/scripts/GameLoader.js', encoding='utf8');
	
	//find all the includes that are not commented out:
	var regEx = new RegExp('\\n\\s*include\\x28inSharedPath \\x2b \\"\\w+(\\x2f\\w+)*\\x2ejs\\"\\x29\\x3b', 'g');
	var values = gameLoaderSrc.match(regEx);
	
	regEx.compile('\\"\\w+(\\x2f\\w+)*\\x2ejs\\"');
	//for all those includes, replace the include with the actual code!
	for(i = 0; i < values.length; ++i)
	{
		path = values[i].match(regEx)[0];//get just the path
		path = this._rootPath + path.substring(1, path.length - 1);

		var fileSourceCode = fs.readFileSync(path, encoding='utf8');
		gameLoaderSrc = gameLoaderSrc.replace(values[i], '\n' + fileSourceCode);
	}
	
	
	var obfuscator = new GameEngineServer.Obfuscator();
	obfuscator.addSrc(gameLoaderSrc);
	
	obfuscator.addIgnore('init');	//TODO use a different one for GameLoader to start!!
	obfuscator.addIgnore('name');//TODO make sure nothing uses 'name' that doesn't need to!
	obfuscator.addIgnore('dom');//TODO this is param, rename it so we dont need this
	obfuscator.addIgnore('create');//TODO this is used by dojo too
	obfuscator.addIgnore('id');//TODO remove unneeded, used by dom.create
	obfuscator.addIgnore('width');//TODO remove unneeded, used by dom.create
	obfuscator.addIgnore('height');//TODO remove unneeded, used by dom.create
	obfuscator.addIgnore('innerHTML');//TODO remove unneeded, used by dom.create
	obfuscator.addIgnore('floor');//TODO remove unneeded
	obfuscator.addIgnore('on');//TODO remove unneeded, used by dojo
	obfuscator.addIgnore('max');//TODO remove unneeded
	obfuscator.addIgnore('min');//TODO remove unneeded
	obfuscator.addIgnore('sin');//TODO remove unneeded
	obfuscator.addIgnore('cos');//TODO remove unneeded
		
	obfuscator.registerNamespace('GameEngineServer');
	obfuscator.registerNamespace('GameEngineLib');
	obfuscator.registerNamespace('GameLib');
	obfuscator.registerNamespace('GameInstance');
	obfuscator.registerNamespace('GameClassRegistryMap');
	obfuscator.registerNamespace('GameUnitTests');
	
	obfuscator.run();
	
	var obfuscatedSrc = obfuscator.getObfuscatedCode();
	this._code = new Buffer(obfuscatedSrc);
}

GameEngineServer.CodeCompressor.prototype.getCompactCode = function getCompactCode()
{
	return this._code;
}