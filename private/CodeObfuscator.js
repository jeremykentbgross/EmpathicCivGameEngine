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

///////////////////////////////////////////////////////////////////
//Obfuscator///////////////////////////////////////////////////////
/*
Notes:
1) Double Quotes are reserved for user display sentences while single quotes are for code only strings
2) ALL assignments (including multiline functions) need to be ended with a ';'
*/

GameEngineServer.localization = [];//TODO move this elsewhere!!

//TODO search and destroy the console.log
//console.log("Declaring Obfuscator Code");

GameEngineServer.Obfuscator = function Obfuscator()
{
	this._nameSpaces = {};
	this._functionNames = {};
	this._parameterNames = {};
	this._variableNames = {};
	this._memberNames = {};
	
	this._unmappedWordsMap = {};
	this._wordMap = {};
	this._ignoreMap = {};
	
	this._src = '';
	this._nextWordCount = 0;
	
	this.registerNamespace('this');
	this.registerNamespace('prototype');
	
	this.addIgnore('this');
	this.addIgnore('prototype');
	this.addIgnore('break');
	this.addIgnore('const');
	this.addIgnore('continue');
	this.addIgnore('delete');
	this.addIgnore('do');
	this.addIgnore('export');
	this.addIgnore('for');
	this.addIgnore('function');
	this.addIgnore('if');
	this.addIgnore('else');
	this.addIgnore('import');
	this.addIgnore('in');
	this.addIgnore('instanceOf');
	this.addIgnore('label');
	this.addIgnore('let');
	this.addIgnore('new');
	this.addIgnore('return');
	this.addIgnore('switch');
	this.addIgnore('this');
	this.addIgnore('throw');
	this.addIgnore('try');
	this.addIgnore('catch');
	this.addIgnore('typeof');
	this.addIgnore('var');
	this.addIgnore('void');
	this.addIgnore('while');
	this.addIgnore('with');
	this.addIgnore('yield');
	this.addIgnore('true');
	this.addIgnore('false');
	this.addIgnore('null');
	this.addIgnore('undefined');
	this.addIgnore('number');
	this.addIgnore('string');
	this.addIgnore('boolean');
	this.addIgnore('object');
	
	this._javascriptOperators = 
	[
		'+',
		'-',
		'*',
		'/',
		'%',
		'++',
		'--',
		'=',
		'+=',
		'-=',
		'*=',
		'/=',
		'>>=',
		'<<=',
		'>>>=',
		'&=',
		'|=',
		'^=',
		'&',
		'|',
		'^',
		'~',
		'<<',
		'>>',
		'>>>',
		'==',
		'!=',
		'===',
		'!==',
		'>',
		'>=',
		'<',
		'<=',
		'&&',
		'||',
		'!',
		',',
		'?',
		':',
		'true',
		'false',
		'null',
		'undefined',
		'(',
		')',
		'[',
		']',
		'{',
		'}',
		';',
		'.'
	];
};



GameEngineServer.Obfuscator.prototype.addSrc = function addSrc(inSrc)
{
	this._src += inSrc;
};



GameEngineServer.Obfuscator.prototype.registerNamespace = function registerNamespace(inNamespace)
{
	this._nameSpaces[inNamespace] = true;
	this._addWord(inNamespace);
};



GameEngineServer.Obfuscator.prototype.addIgnore = function addIgnore(inWord)
{
	this._ignoreMap[inWord] = true;
	delete this._unmappedWordsMap[inWord];
};



GameEngineServer.Obfuscator.prototype.getObfuscatedName = function getObfuscatedName(inWord)
{
	return this._wordMap[inWord].replacement;
};



GameEngineServer.Obfuscator.prototype.getObfuscatedCode = function getObfuscatedCode()
{
	return this._src;
};



GameEngineServer.Obfuscator.prototype.run = function run()
{
	var name;
	var i;
	
	this._removeComments();
	if(GameSystemVars.Server.removeTextForLocalization)
	{
		this._removeTextForLocalization();
	}
	this._findAllPotentialWords();
	
	if(GameSystemVars.DEBUG)
	{
		console.log("Base NameSpaces:");
		for(name in this._nameSpaces)
		{
			console.log('\t' + name);
		}
	}
	
	this._findFunctionNames();
	this._findParameterNames();
	this._findVariableNames();
	this._findValuesInNamespaces();
	this._findJSONFields();
	
	//remove the ignored words before processing:
	for(name in this._ignoreMap)
	{
		delete this._wordMap[name];
		delete this._unmappedWordsMap[name];
	}
	
	if(GameSystemVars.DEBUG)
	{
		console.log("Final NameSpaces:");
		for(name in this._nameSpaces)
		{
			console.log('\t' + name);
		}
		
		console.log("Function Names:");
		for(name in this._functionNames)
		{
			console.log('\t' + name);
		}
		
		console.log("Parameter Variables:");
		for(name in this._parameterNames)
		{
			console.log('\t' + name);
		}
		
		console.log("Local Variable Names:");
		for(name in this._variableNames)
		{
			console.log('\t' + name);
		}
		
		console.log("Member Variables:");
		for(name in this._memberNames)
		{
			console.log('\t' + name);
		}
		
		console.log("\n\n\nIncluded Words:");
		for(name in this._wordMap)
		{
			console.log('\t' + name);
		}
		
		console.log("Ignored Words:");
		for(name in this._ignoreMap)
		{
			console.log('\t' + name);
		}
		
		console.log("Unmapped Words:");
		for(name in this._unmappedWordsMap)
		{
			console.log('\t' + name);
		}
		
		console.log("Localized Strings:");
		for(i = 0; i < GameEngineServer.localization.length; ++i)
		{
			console.log('\t\"' + GameEngineServer.localization[i] + '\"');
		}
	}
	
	if(GameSystemVars.Server.obfuscateNames)
	{
		this._doWordReplacement();
	}
	
	if(GameSystemVars.Server.removeNewlines)
	{
		this._clearNewlines();
	}
	
	if(GameSystemVars.Server.removeNonNewlineWhiteSpace)
	{
		this._clearWhiteSpace();
	}
	
	this._checkForErrors();
	
	
	//TODO cleanup unneeded data
};



GameEngineServer.Obfuscator.prototype._checkForErrors = function _checkForErrors()
{
	var regEx = new RegExp();
	var values;
	var i;
	
	regEx.compile('\\w+\\x2b\\x2b\\x2b\\w+', 'g');
	values = this._src.match(regEx);
	if(values)
	{
		for(i = 0; i < values.length; ++i)//}a.c.prototype.Z
		{
			console.log("Likely problem compressing code!: " + values[i]);//TODO change warning/assert?
		}
	}
	
	regEx.compile('\\w+\\x2d\\x2d\\x2d\\w+', 'g');
	values = this._src.match(regEx);
	if(values)
	{
		for(i = 0; i < values.length; ++i)//}a.c.prototype.Z
		{
			console.log("Likely problem compressing code!: " + values[i]);//TODO change warning/assert?
		}
	}
	
	regEx.compile('\\x7d\\s*([\\w]+\\x2e)+\\w+\\x3d', 'g');//	}asdf.asdf.prototype =
	values = this._src.match(regEx);
	if(values)
	{
		for(i = 0; i < values.length; ++i)//}a.c.prototype.Z
		{
			if(values[i].indexOf('prototype') !== -1)
			{
				console.log("Missing ';' before member function definition: " + values[i]);//TODO change warning/assert?
			}
		}
	}
};



GameEngineServer.Obfuscator.prototype._addWord = function _addWord(inWord)
{
	if(GameSystemVars.DEBUG && typeof inWord !== 'string')
	{
		console.log("Error input is not a word!");//TODO this should be an exception!
	}
	if(!this._wordMap[inWord])
	{
		this._wordMap[inWord] = 
		{
			count : 1
			,word : inWord
			,uniqueInstances : {}
			,replacement : inWord
		};
	}
	
	delete this._unmappedWordsMap[inWord];
};



GameEngineServer.Obfuscator.prototype._addFunctionName = function _addFunctionName(inFunctionName)
{
	this._functionNames[inFunctionName] = true;
	this.registerNamespace(inFunctionName);
};



GameEngineServer.Obfuscator.prototype._addParameterName = function _addParameterName(inParameterName)
{
	this._parameterNames[inParameterName] = true;
	this._addWord(inParameterName);
};



GameEngineServer.Obfuscator.prototype._addVariableName = function _addVariableName(inVariableName)
{
	this._variableNames[inVariableName] = true;
	this._addWord(inVariableName);
};



GameEngineServer.Obfuscator.prototype._addMemberName = function _addMemberName(inMemberName)
{
	this._memberNames[inMemberName] = true;
	this._addWord(inMemberName);
};



GameEngineServer.Obfuscator.prototype._removeComments = function _removeComments()
{
	/*remove block comments:*/
	this._src = this._src.replace(/\x2f\x2a[\S\s]*?\x2a\x2f/g, '');
	
	//remove line comments
	this._src = this._src.replace(/\x2f\x2f[^\n]*\n/g, '\n');
};



GameEngineServer.Obfuscator.prototype._removeTextForLocalization = function _removeTextForLocalization()
{
	var quoteMark = '\x22';
	var escapeChar = '\x5c';
	var i;
	
	var startIndex = 0;
	var endIndex = 0;
	
	//find start of comment block
	do
	{
		startIndex = this._src.indexOf(quoteMark, startIndex + 1);
	} while(this._src[startIndex - 1] === escapeChar);
	
	while(startIndex >= 0)
	{
		do
		{
			//get the end quote
			endIndex = this._src.indexOf(quoteMark, Math.max(startIndex + 1, endIndex));
			//while this end quote is not an internal escape character (ie printable text quote, not code quote)
		} while(this._src[endIndex - 1] === escapeChar);
		endIndex += quoteMark.length;
		
		//add this to the localization array
		GameEngineServer.localization.push(this._src.substring(startIndex + 1, endIndex - 1));
		//replace the code string with the new array value
		this._src =
			this._src.substring(0, startIndex) + 
			//'ObfuscatorNameSpace.localization[' +	//TODO change this to the proper namespace and variable (in hex):
			//'\x4f\x62\x66\x75\x73\x63\x61\x74\x6f\x72\x4e\x61\x6d\x65\x53\x70\x61\x63\x65\x2e\x6c\x6f\x63\x61\x6c\x69\x7a\x61\x74\x69\x6f\x6e\x5b' +
			//'GameEngineServer.localization[' +
			'\x47\x61\x6d\x65\x45\x6e\x67\x69\x6e\x65\x53\x65\x72\x76\x65\x72\x2e\x6c\x6f\x63\x61\x6c\x69\x7a\x61\x74\x69\x6f\x6e\x5b' +
			(GameEngineServer.localization.length - 1) + ']' +
			this._src.substring(endIndex);
		
		//start of next comment block
		startIndex = 0;
		do
		{
			startIndex = this._src.indexOf(quoteMark, startIndex + 1);
		} while(this._src[startIndex - 1] === escapeChar);
	}
	//correct values in the strings removed:
	for(i = 0; i < GameEngineServer.localization.length; ++i)
	{
		GameEngineServer.localization[i] = GameEngineServer.localization[i].replace(/\\n/g, '\n');
	}
};



GameEngineServer.Obfuscator.prototype._findAllPotentialWords = function _findAllPotentialWords()
{
	var potentialWords = this._src.match(/\w+/g);
	var i;
	
	for(i = 0; i < potentialWords.length; ++i)
	{
		if(!this._wordMap[potentialWords[i]])
		{
			this._unmappedWordsMap[potentialWords[i]] = true;
		}
	}
};



GameEngineServer.Obfuscator.prototype._findFunctionNames = function _findFunctionNames()
{
	var functions = this._src.match(/function\s+\w+/g) || [];
	var i;
	
	for(i = 0; i < functions.length; ++i)
	{
		functions[i] = functions[i].match(/\s+\w+/)[0].match(/\w+/)[0];
		this._addFunctionName(functions[i]);
	}
};



GameEngineServer.Obfuscator.prototype._findParameterNames = function _findParameterNames()
{
	var functionSignatures = this._src.match(/function\s*\w*\s*\x28[^\x29]+\x29/g) || [];
	var parameters = [];
	var i;
	var j;
	
	for(i = 0; i < functionSignatures.length; ++i)
	{
		var params = functionSignatures[i].match(/\x28[^\x29]*\x29/)[0].match(/\w+/g) || [];
		for(j = 0; j < params.length; ++j)
		{
			parameters.push(params[j]);
			this._addParameterName(params[j]);
		}
	}
};



GameEngineServer.Obfuscator.prototype._findVariableNames = function _findVariableNames()
{
	var variableDeclareLines = this._src.match(/var\s+\w+[^\x3b]*\x3b/g) || [];
	var variables;
	var i, j;
	
	for(i = 0; i < variableDeclareLines.length; ++i)
	{
		//strip out nested {}
		while(variableDeclareLines[i].match(/\x7b[^\x7b\x7d]*\x7d/g, ''))
		{
			variableDeclareLines[i] = variableDeclareLines[i].replace(/\x7b[^\x7b\x7d]*\x7d/g, '');
		}
		//strip out nested ()
		while(variableDeclareLines[i].match(/\x28[^\x28\x29]*\x29/g, ''))
		{
			variableDeclareLines[i] = variableDeclareLines[i].replace(/\x28[^\x28\x29]*\x29/g, '');
		}
		//strip out nested []
		while(variableDeclareLines[i].match(/\x5b[^\x5b\x5d]*\x5d/g, ''))
		{
			variableDeclareLines[i] = variableDeclareLines[i].replace(/\x5b[^\x5b\x5d]*\x5d/g, '');
		}
		//strip out assignments (which should have little or no content now)
		variableDeclareLines[i] = variableDeclareLines[i].replace(/\s*\x3d[^\x2c\x3b]*[\x2c\x3b]/g, ',');
		//remove the var at the start
		variableDeclareLines[i] = variableDeclareLines[i].replace(/var\s+/, '');
		
		//What is left should be comman separated variable names
		variables = variableDeclareLines[i].match(/\w+/g);
		for(j = 0; j < variables.length; ++j)
		{
			this._addVariableName(variables[j]);
		}
	}
};



GameEngineServer.Obfuscator.prototype._findValuesInNamespaces = function _findValuesInNamespaces()
{
	var valuesInNameSpaces = [];
	var regEx = new RegExp();
	var i;
	var nameSpace;
	
	for(nameSpace in this._nameSpaces)
	{
		regEx.compile(nameSpace + '\\x2e\\w+', 'g');
		var values = this._src.match(regEx);
		var loops = values ? values.length : 0;
		for(i = 0; i < loops; ++i)
		{
			values[i] = values[i].match(/\x2e\w+/)[0].match(/\w+/)[0];
			valuesInNameSpaces.push(values[i]);
			this._addMemberName(values[i]);
		}
	}
};



GameEngineServer.Obfuscator.prototype._findJSONFields = function _findJSONFields()
{
	var fields = this._src.match(/[\x2c\x7b]\s*\w+\s*\x3a/g) || [];
	var i;
	
	for(i = 0; i < fields.length; ++i)
	{
		fields[i] = fields[i].match(/\w+/)[0];
		this._addMemberName(fields[i]);
	}
};



GameEngineServer.Obfuscator.prototype._clearNewlines = function _clearNewlines()
{
	this._src = this._src.replace(/[\s]+/g, ' ');
};



GameEngineServer.Obfuscator.prototype._clearWhiteSpace = function _clearWhiteSpace()
{
	var regEx = new RegExp();
	var i;
	
	for(i = 0; i < this._javascriptOperators.length; ++i)
	{
		var hex = this._stringToHex(this._javascriptOperators[i]);
		//regEx.compile('\\s*' + hex + '\\s*', 'g');
		regEx.compile('[\\x20\\t]*' + hex + '[\\x20\\t]*', 'g');
		this._src = this._src.replace(regEx, this._javascriptOperators[i]);
	}
};



GameEngineServer.Obfuscator.prototype._stringToHex = function _stringToHex(inString)
{
	var hex = '';
	var i;
	
	for(i = 0; i < inString.length; ++i)
	{
		var string = inString.charCodeAt(i).toString(16);
		string = (string.length === 2 ? string : '0' + string);
		hex += '\\x' + string;
	}
	
	return hex;
};



GameEngineServer.Obfuscator.prototype._doWordReplacement = function _doWordReplacement()
{
	var wordList = [];
	var regEx = new RegExp();
	var wordData;
	var word;
	var i;
	var j;
	
	for(word in this._wordMap)
	{
		//get the entry
		wordData = this._wordMap[word];
		
		//get the instances of the word in the source code
		regEx.compile('\\W' + word + '\\W', 'g');
		var instances = this._src.match(regEx);
		
		//remember the unique instances
		for(i = 0; i < instances.length; ++i)
		{
			wordData.uniqueInstances[instances[i]] = true;
		}
		
		/*
		get the instances of the word in the source code where the word is used a couple times in a row
			and the regular expression would miss the second one
		*/
		regEx.compile('\\W' + word + '\\W' + word + '\\W', 'g');
		var moreInstances = this._src.match(regEx);
		
		var loops = moreInstances ? moreInstances.length : 0;
		//add the additional unique instances
		for(i = 0; i < loops; ++i)
		{
			moreInstances[i] = moreInstances[i].substr(word.length + 1);
			wordData.uniqueInstances[moreInstances[i]] = true;
			instances.push(moreInstances[i]);
		}
		
		//remember the count
		wordData.count = instances.length;
		
		//add it to the array
		wordList.push(wordData);
	}
	
	wordList.sort(
		function(inLHS, inRHS)
		{
			var LHV = inLHS.count * inLHS.word.length;
			var RHV = inRHS.count * inRHS.word.length;
			if(LHV > RHV)
			{
				return -1;
			}
			else if(LHV < RHV)
			{
				return 1;
			}
			return 0;
		}
	);
	
	for(i = 0; i < wordList.length; ++i)
	{
		wordData = wordList[i];
		wordData.replacement = GameSystemVars.Server.useModifiedNamesNotPureObfuscate ? '$' + wordData.word + '$' : this._genValidWordReplacement();
		
		for(j in wordData.uniqueInstances)
		{
			var replacement = j[0] + wordData.replacement + j[j.length-1];
			regEx.compile(
				this._stringToHex(j[0])
				+ wordData.word
				+ this._stringToHex(j[j.length-1])
				,'g'
			);
			//replace it
			this._src = this._src.replace(regEx, replacement);
			//replace it again because the regular expression can miss overlaps
			this._src = this._src.replace(regEx, replacement);
		}
	}
};



GameEngineServer.Obfuscator.prototype._genValidWordReplacement = function _genValidWordReplacement()
{
	var replacementWord;
	
	do
	{
		replacementWord = this._genWordReplacement();
	} while(
		this._unmappedWordsMap[replacementWord] ||
		this._wordMap[replacementWord] ||
		this._ignoreMap[replacementWord]
	);
	
	return replacementWord;
};



GameEngineServer.Obfuscator.prototype._genWordReplacement = function _genWordReplacement()
{
	var word = '';
	var currentCount = this._nextWordCount;
	
	var charIndex = currentCount % 52;
	
	//if lower case
	if(charIndex < 26)
	{
		word += String.fromCharCode(charIndex + 97);
	}
	//else upper case
	else
	{
		word += String.fromCharCode(charIndex - 26 + 65);
	}
		
	currentCount = Math.floor(currentCount / 52);
		
	while(currentCount)
	{
		--currentCount;
		
		charIndex = currentCount % 62;
		//if lower case
		if(charIndex < 26)
		{
			word += String.fromCharCode(charIndex + 97);
		}
		//else if 0-9
		else if(charIndex < 36)
		{
			word += String.fromCharCode(charIndex - 26 + 48);
		}
		//else upper case
		else
		{
			word += String.fromCharCode(charIndex - 36 + 65);
		}
			
		currentCount = Math.floor(currentCount / 62);
	}
	
	++this._nextWordCount;
	
	return word;
};
//Obfuscator///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////