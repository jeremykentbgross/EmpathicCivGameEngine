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

//Allows sync file method call(s)
/*jslint stupid : true*/

///////////////////////////////////////////////////////////////////
//Obfuscator///////////////////////////////////////////////////////
/*
Notes:
1) Double Quotes are reserved for user display sentences while single quotes are for code only strings
2) ALL assignments (including multiline functions) need to be ended with a ';'
*/

//TODO search and destroy the console.log
//console.log("Declaring Obfuscator Code");

//TODO: bug: obfuscationResults: functions are not member variables

var fileSystem = require('fs');

ECGame.WebServerTools.Obfuscator = function Obfuscator()
{
	this._nameSpaces = {};
	this._functionNames = {};
	this._parameterNames = {};
	this._variableNames = {};
	this._memberNames = {};
	this._localizationStringMap = {};
	this._localizationStrings = [];
	
	this._unmappedWordsMap = {};
	this._wordMap = {};
	this._ignoreMap = {};
	this._reverseWordMap = {};
	
	this._src = '';
	this._nextWordCount = 0;
	
	this.registerNamespace('this');
	this.registerNamespace('prototype');
	
	this.addIgnore('this');
	this.addIgnore('prototype');
	this.addIgnore('constructor');
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
	this.addIgnore('case');
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
	this.addIgnore('apply');//TODO maybe add ignore for all core prototype members?
	
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
//		'true',
//		'false',
//		'null',
//		'undefined',
//		'return',
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



ECGame.WebServerTools.Obfuscator.prototype.addSrc = function addSrc(inSrc)
{
	this._src += inSrc;
};



ECGame.WebServerTools.Obfuscator.prototype.registerNamespace = function registerNamespace(inNamespace)
{
	this._nameSpaces[inNamespace] = true;
	this._addWord(inNamespace);
};



ECGame.WebServerTools.Obfuscator.prototype.addIgnore = function addIgnore(inWord)
{
	this._ignoreMap[inWord] = true;
	delete this._unmappedWordsMap[inWord];
};



ECGame.WebServerTools.Obfuscator.prototype.getObfuscatedName = function getObfuscatedName(inWord)
{
	if(!this._wordMap[inWord])
	{
		console.warn("WTF no word replacement? " + inWord);
	}
	return this._wordMap[inWord].replacement;
};



ECGame.WebServerTools.Obfuscator.prototype.getUnObfuscatedName = function getUnObfuscatedName(inWord)
{
	if(!this._reverseWordMap[inWord])
	{
		console.warn("WTF no original word? " + inWord);
	}
	return this._reverseWordMap[inWord].word;
};



ECGame.WebServerTools.Obfuscator.prototype.getObfuscatedCode = function getObfuscatedCode()
{
	return this._src;
};



ECGame.WebServerTools.Obfuscator.prototype.run = function run()
{
	var aName
		,aLogString
		,aReorderingArray
		,aRespacedCode
		,i
		;
	
	aLogString = '';
	
	//comment out all instances of eval
	this._src = this._src.replace(/\x65val/g, '\/\/');
	
	this._removeComments();
	
	if(ECGame.Settings.Server.removeTextForLocalization)
	{
		//the strings is split so that it will not be found when this file compresses itself.
		this.registerNamespace('G' + 'ameLocalization');//TODO rename registerNamespace to addNamespace??
		this._src += '\nG' + 'ameLocalization=';
		this._removeTextForLocalization();
	}
	
	this._findAllPotentialWords();
	
	aReorderingArray = [];
	aLogString += "Base NameSpaces:" + '\n';
	for(aName in this._nameSpaces)
	{
		aReorderingArray.push(aName);
	}
	aReorderingArray.sort();
	for(i = 0; i < aReorderingArray.length; ++i)
	{
		aLogString += 'Base NameSpace:\t' + aReorderingArray[i] + '\n';
	}
	
	this._findFunctionNames();
	this._findParameterNames();
	this._findVariableNames();
	this._findValuesInNamespaces();
	this._findJSONFields();
	
	//remove the ignored words before processing:
	for(aName in this._ignoreMap)
	{
		delete this._wordMap[aName];
		delete this._unmappedWordsMap[aName];
	}
	
	aReorderingArray = [];
	aLogString += "\n\n\nFinal NameSpaces:" + '\n';
	for(aName in this._nameSpaces)
	{
		aReorderingArray.push(aName);
	}
	aReorderingArray.sort();
	for(i = 0; i < aReorderingArray.length; ++i)
	{
		aLogString += 'Final NameSpace:\t' + aReorderingArray[i] + '\n';
	}
	
	aReorderingArray = [];
	aLogString += "\n\n\nFunction Names:" + '\n';
	for(aName in this._functionNames)
	{
		aReorderingArray.push(aName);
	}
	aReorderingArray.sort();
	for(i = 0; i < aReorderingArray.length; ++i)
	{
		aLogString += 'Function Name:\t' + aReorderingArray[i] + '\n';
	}
	
	aReorderingArray = [];
	aLogString += "\n\n\nParameter Variables:" + '\n';
	for(aName in this._parameterNames)
	{
		aReorderingArray.push(aName);
	}
	aReorderingArray.sort();
	for(i = 0; i < aReorderingArray.length; ++i)
	{
		aLogString += 'Parameter Variable:\t' + aReorderingArray[i]
			+ (
				aReorderingArray[i].indexOf('in') !== 0
				&& aReorderingArray[i].indexOf('out') !== 0
					? '\t\t\t*****'
					: ''
			)//highlight incorrectly named parameters
			+ '\n';
	}
	
	aReorderingArray = [];
	aLogString += "\n\n\nLocal Variables:" + '\n';
	for(aName in this._variableNames)
	{
		aReorderingArray.push(aName);
	}
	aReorderingArray.sort();
	for(i = 0; i < aReorderingArray.length; ++i)
	{
		aLogString += 'Local Variable:\t' + aReorderingArray[i]
		+ (
			(aReorderingArray[i].indexOf('a') !== 0 || aReorderingArray[i].charAt(1).toUpperCase() !== aReorderingArray[i].charAt(1))
			&& (aReorderingArray[i].indexOf('an') !== 0 || aReorderingArray[i].charAt(2).toUpperCase() !== aReorderingArray[i].charAt(2))
			? '\t\t\t*****' : ''	//highlight incorrectly named variables
		)
		+ '\n';
	}
	
	aReorderingArray = [];
	aLogString += "\n\n\nMember Variables:" + '\n';
	for(aName in this._memberNames)
	{
		aReorderingArray.push(aName);
	}
	aReorderingArray.sort();
	for(i = 0; i < aReorderingArray.length; ++i)
	{
		aLogString += 'Member Variable:\t' + aReorderingArray[i]
		+ (
			(aReorderingArray[i].indexOf('my') !== 0 || aReorderingArray[i].charAt(2).toUpperCase() !== aReorderingArray[i].charAt(2))
			&& (aReorderingArray[i].indexOf('_my') !== 0 || aReorderingArray[i].charAt(3).toUpperCase() !== aReorderingArray[i].charAt(3))
			? '\t\t\t*****' : ''	//highlight incorrectly named variables
		)
		 + '\n';
	}
	
	aReorderingArray = [];
	aLogString += "\n\n\n\n\n\nIncluded Words:" + '\n';
	for(aName in this._wordMap)
	{
		aReorderingArray.push(aName);
	}
	aReorderingArray.sort();
	for(i = 0; i < aReorderingArray.length; ++i)
	{
		aLogString += 'Included Word:\t' + aReorderingArray[i] + '\n';
	}
	
	aReorderingArray = [];
	aLogString += "\n\n\nIgnored Words:" + '\n';
	for(aName in this._ignoreMap)
	{
		aReorderingArray.push(aName);
	}
	aReorderingArray.sort();
	for(i = 0; i < aReorderingArray.length; ++i)
	{
		aLogString += 'Ignored Word:\t' + aReorderingArray[i] + '\n';
	}
	
	aReorderingArray = [];
	aLogString += "\n\n\nUnmapped Words:" + '\n';
	for(aName in this._unmappedWordsMap)
	{
		aReorderingArray.push(aName);
	}
	aReorderingArray.sort();
	for(i = 0; i < aReorderingArray.length; ++i)
	{
		aLogString += 'Unmapped Word:\t' + aReorderingArray[i] + '\n';
	}
	
	aReorderingArray = [];
	aLogString += "\n\n\nLocalized Strings:" + '\n';
	for(i = 0; i < this._localizationStrings.length; ++i)
	{
		aLogString += 'Localized String:\t' + this._localizationStrings[i] + '\n';
	}
	
	if(ECGame.Settings.isDebugPrint_Obfuscation())
	{
		console.log(aLogString);
	}
	
	if(ECGame.Settings.Server.obfuscateNames)
	{
		this._doWordReplacement();
	}
	
	if(ECGame.Settings.Server.removeNewlines)
	{
		this._clearNewlines();
	}
	
	if(ECGame.Settings.Server.removeNonNewlineWhiteSpace)
	{
		this._clearWhiteSpace();
	}
	
	//Put *some* newlines back because it can't seem to deliver the file otherwise
	if(ECGame.Settings.Server.removeNewlines)
	{
		aRespacedCode = this._src.match(/[\s\S]{8192}[^\x3b]*\x3b/g);//TODO should size of lines be constant here? Or variable declared?
		if(aRespacedCode !== null)
		{
			for(i = 0; i < aRespacedCode.length; ++i)
			{
				this._src = this._src.replace(aRespacedCode[i], aRespacedCode[i] + '\n');
			}
		}
		//TODO add custom game + engine copyright text
	}
	
	if(ECGame.Settings.Server.removeTextForLocalization)
	{
		//this._src += this.getObfuscatedName('ECGame.instance') + '.' + this.getObfuscatedName('localization') + '=' + this._localizationStrings + ';';
		this._src += /*this.getObfuscatedName('\x47ameLocalization') +*/ '[' + this._localizationStrings + '];';
	}
	
	this._checkForErrors();//TODO review this function
	
	if(ECGame.Settings.Server.saveResultsNotesToFile)
	{
		//is really: aLogString = '/*\n' + aLogString + '*/\n\n\n' + this._src;
		//aLogString = '/\x2a\n' + aLogString + '\x2a/\n\n\n';// + this._src;
		fileSystem.writeFileSync(//TODO make writeFileSync when I update my nodejs version
			'../_unified_/game/ObfuscationResults.txt',
			aLogString/*,
			function ?funcname?(inError)
			{
				if(inError)
				{
					throw inError;
				}
				console.info('Saved ObfuscationResults.txt');
			}*/
		);
	}
	
	if(ECGame.Settings.isDebugPrint_Obfuscation())
	{
		console.log(this._src);
	}
	
	//TODO cleanup unneeded data
};



ECGame.WebServerTools.Obfuscator.prototype._checkForErrors = function _checkForErrors()
{
	var regEx = new RegExp(),
		values,
		i;
	
	//detect +++
	regEx.compile('\\w+\\x2b\\x2b\\x2b\\w+', 'g');
	values = this._src.match(regEx);
	if(values)
	{
		for(i = 0; i < values.length; ++i)
		{
			console.warn("Likely problem compressing code!: " + values[i]);//TODO change warning/assert?
		}
	}
	
	//detect ---
	regEx.compile('\\w+\\x2d\\x2d\\x2d\\w+', 'g');
	values = this._src.match(regEx);
	if(values)
	{
		for(i = 0; i < values.length; ++i)
		{
			console.warn("Likely problem compressing code!: " + values[i]);//TODO change warning/assert?
		}
	}
	
	//TODO document
/*not correct for all cases, maybe put back later with a fix?:
	regEx.compile('\\x7d\\s*([\\w]+\\x2e)+\\w+\\x3d', 'g');//	}asdf.asdf.prototype =
	values = this._src.match(regEx);
	if(values)
	{
		for(i = 0; i < values.length; ++i)
		{
			if(values[i].indexOf('prototype') !== -1)
			{
				console.warn("Missing ';' before member function definition: " + values[i]);//TODO change warning/assert?
			}
		}
	}*/
};



ECGame.WebServerTools.Obfuscator.prototype._addWord = function _addWord(inWord)
{
	if(ECGame.Settings.DEBUG && typeof inWord !== 'string')
	{
		console.warn("Error input is not a word!");//TODO this should be an exception!
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



ECGame.WebServerTools.Obfuscator.prototype._addFunctionName = function _addFunctionName(inFunctionName)
{
	this._functionNames[inFunctionName] = true;
	this.registerNamespace(inFunctionName);
};



ECGame.WebServerTools.Obfuscator.prototype._addParameterName = function _addParameterName(inParameterName)
{
	this._parameterNames[inParameterName] = true;
	this._addWord(inParameterName);
};



ECGame.WebServerTools.Obfuscator.prototype._addVariableName = function _addVariableName(inVariableName)
{
	this._variableNames[inVariableName] = true;
	this._addWord(inVariableName);
};



ECGame.WebServerTools.Obfuscator.prototype._addMemberName = function _addMemberName(inMemberName)
{
		//if this member is also a function then its already covered!
	if(this._functionNames[inMemberName])
	{
		return;
	}
	this._memberNames[inMemberName] = true;
	this._addWord(inMemberName);
};



ECGame.WebServerTools.Obfuscator.prototype._removeComments = function _removeComments()
{
	/*remove block comments:*/
	this._src = this._src.replace(/\x2f\x2a[\S\s]*?\x2a\x2f/g, '');
	
	//remove line comments
	this._src = this._src.replace(/\x2f\x2f[^\n]*\n/g, '\n');
};



ECGame.WebServerTools.Obfuscator.prototype._removeTextForLocalization = function _removeTextForLocalization()
{
	var regEx, i, stringsToRemove, currentString;

	//Find text strings that we should remove from the code:
	//Match(\"\s\S?[^\\]\")
	regEx = new RegExp(/\x22[\S\s]*?[^\x5c]\x22/g);
	stringsToRemove = this._src.match(regEx);
	if(!stringsToRemove)
	{
		return;
	}
	
	//create a map so we don't have duplicates
	for(i = 0; i < stringsToRemove.length; ++i)
	{
		currentString = stringsToRemove[i];
		this._localizationStringMap[currentString] = currentString;
	}
	
	//go through the map and find all unique strings!
	for(currentString in this._localizationStringMap)
	{
		i = this._localizationStrings.length;
		this._localizationStrings.push(currentString);
		while(this._src.indexOf(currentString) !== -1)
		{
			//this._src = this._src.replace(currentString, 'ECGame.instance.localization[' + i + ']');
			this._src = this._src.replace(currentString, 'G' + 'ameLocalization[' + i + ']');//NOTE: string split on purpose!
		}
	}
};



ECGame.WebServerTools.Obfuscator.prototype._findAllPotentialWords = function _findAllPotentialWords()
{
	var potentialWords = this._src.match(/\w+/g),
		i;
	
	for(i = 0; i < potentialWords.length; ++i)
	{
		if(!this._wordMap[potentialWords[i]]
			&& !('0' + potentialWords[i]).isNumber()
			//&& !('0x' + potentialWords[i]).isNumber()
		)
		{
			this._unmappedWordsMap[potentialWords[i]] = true;
		}
	}
};



ECGame.WebServerTools.Obfuscator.prototype._findFunctionNames = function _findFunctionNames()
{
	var functions = this._src.match(/function\s+\w+/g) || [],
		i;
	
	for(i = 0; i < functions.length; ++i)
	{
		functions[i] = functions[i].match(/\s+\w+/)[0].match(/\w+/)[0];
		this._addFunctionName(functions[i]);
	}
};



ECGame.WebServerTools.Obfuscator.prototype._findParameterNames = function _findParameterNames()
{
	var functionSignatures = this._src.match(/function\s*\w*\s*\x28[^\x29]+\x29/g) || [],
		parameters = [],
		i,
		j,
		params;
	
	for(i = 0; i < functionSignatures.length; ++i)
	{
		params = functionSignatures[i].match(/\x28[^\x29]*\x29/)[0].match(/\w+/g) || [];
		for(j = 0; j < params.length; ++j)
		{
			parameters.push(params[j]);
			this._addParameterName(params[j]);
		}
	}
};



ECGame.WebServerTools.Obfuscator.prototype._findVariableNames = function _findVariableNames()
{
	var variableDeclareLines = this._src.match(/var\s+\w+[^\x3b]*\x3b/g) || [],
		variables,
		i,
		j;
	
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



ECGame.WebServerTools.Obfuscator.prototype._findValuesInNamespaces = function _findValuesInNamespaces()
{
	var 
		//,valuesInNameSpaces
		aRegEx
		,aNameSpace
		,aValues
		,aLoops
		,i
		;
	
	aRegEx = new RegExp();
	/*
	valuesInNameSpaces = [];
	for(aNameSpace in this._nameSpaces)
	{
		valuesInNameSpaces.push(aNameSpace);
	}*/
	
	for(aNameSpace in this._nameSpaces)//for(j = 0; j < valuesInNameSpaces.length; ++j)
	{
		//aNameSpace = valuesInNameSpaces[j];
		aRegEx.compile(aNameSpace + '\\x2e\\w+', 'g');
		aValues = this._src.match(aRegEx);
		aLoops = aValues ? aValues.length : 0;
		for(i = 0; i < aLoops; ++i)
		{
			aValues[i] = aValues[i].match(/\x2e\w+/)[0].match(/\w+/)[0];
			/*if(!this._wordMap[aValues[i]])
			{
				valuesInNameSpaces.push(aValues[i]);
			}*/
			this._addMemberName(aValues[i]);
		}
	}
};



ECGame.WebServerTools.Obfuscator.prototype._findJSONFields = function _findJSONFields()
{
	var fields = this._src.match(/[\x2c\x7b]\s*\w+\s*\x3a/g) || [],
		i;
	
	for(i = 0; i < fields.length; ++i)
	{
		fields[i] = fields[i].match(/\w+/)[0];
		this._addMemberName(fields[i]);
	}
};



ECGame.WebServerTools.Obfuscator.prototype._clearNewlines = function _clearNewlines()
{
	this._src = this._src.replace(/[\s]+/g, ' ');
};



ECGame.WebServerTools.Obfuscator.prototype._clearWhiteSpace = function _clearWhiteSpace()
{
	var regEx = new RegExp(),
		i,
		hex;
	
	for(i = 0; i < this._javascriptOperators.length; ++i)
	{
		hex = this._stringToHex(this._javascriptOperators[i]);
		//regEx.compile('\\s*' + hex + '\\s*', 'g');
		//'[ \t]*' + hex + '[ \t]*'
		regEx.compile('[\\x20\\t]*' + hex + '[\\x20\\t]*', 'g');
		this._src = this._src.replace(regEx, this._javascriptOperators[i]);
	}
};



ECGame.WebServerTools.Obfuscator.prototype._stringToHex = function _stringToHex(inString)
{
	var hex = '',
		i,
		string;
	
	for(i = 0; i < inString.length; ++i)
	{
		string = inString.charCodeAt(i).toString(16);
		string = (string.length === 2 ? string : '0' + string);
		hex += '\\x' + string;
	}
	
	return hex;
};



ECGame.WebServerTools.Obfuscator.prototype._doWordReplacement = function _doWordReplacement()
{
	var wordList = [],
		regEx = new RegExp(),
		wordData,
		word,
		i,
		j,
		instances,
		moreInstances,
		aLoops,
		replacement;
	
	for(word in this._wordMap)
	{
		//get the entry
		wordData = this._wordMap[word];
		
		//get the instances of the word in the source code
		regEx.compile('\\W' + word + '\\W', 'g');
		instances = this._src.match(regEx);
		
		if(!instances)
		{
			console.warn("No instances of " + word);
			continue;
		}
		
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
		moreInstances = this._src.match(regEx);
		
		aLoops = moreInstances ? moreInstances.length : 0;
		//add the additional unique instances
		for(i = 0; i < aLoops; ++i)
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
		function wordCompare(inLHS, inRHS)
		{
			var LHV = inLHS.count * inLHS.word.length,
				RHV = inRHS.count * inRHS.word.length;
			if(LHV > RHV)
			{
				return -1;
			}
			if(LHV < RHV)
			{
				return 1;
			}
			return 0;
		}
	);
	
	for(i = 0; i < wordList.length; ++i)
	{
		wordData = wordList[i];
		wordData.replacement = ECGame.Settings.Server.useModifiedNamesNotPureObfuscate ? 'o' + wordData.word + 'o' : this._genValidWordReplacement();
		this._reverseWordMap[wordData.replacement] = wordData;
		
		for(j in wordData.uniqueInstances)
		{
			replacement = j[0] + wordData.replacement + j[j.length-1];
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



ECGame.WebServerTools.Obfuscator.prototype._genValidWordReplacement = function _genValidWordReplacement()
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



ECGame.WebServerTools.Obfuscator.prototype._genWordReplacement = function _genWordReplacement()
{
	var word = '',
		currentCount = this._nextWordCount,
		charIndex = currentCount % 52;
	
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
