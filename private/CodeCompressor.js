var fs = require("fs");

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
	
	this._code = gameLoaderSrc;
}

GameEngineServer.CodeCompressor.prototype.getCompactCode = function getCompactCode()
{
	return new Buffer(this._code);
}