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

GameUnitTests.registerTest(
	"GameObfuscator",
	function()
	{
		//line to generated the new location of the localization data:
		//console.log(obfuscator._stringToHex('GameEngineServer.localization['));//\x47\x61\x6d\x65\x45\x6e\x67\x69\x6e\x65\x53\x65\x72\x76\x65\x72\x2e\x6c\x6f\x63\x61\x6c\x69\x7a\x61\x74\x69\x6f\x6e\x5b
		var rememberDebugState = GameSystemVars.DEBUG;
		GameSystemVars.DEBUG = false;
		
		var obfuscator = new GameEngineServer.Obfuscator();
		var obfuscatorSrc = fs.readFileSync('../private/CodeObfuscator.js', encoding='utf8');
		obfuscator.addSrc(obfuscatorSrc);
		obfuscator.registerNamespace('GameEngineServer');
		obfuscator.run();
		
		var obfuscatorObfuscatedSrc = obfuscator.getObfuscatedCode();
		//console.log('\n\n' + obfuscatorObfuscatedSrc + '\n\n');
		
		var gameServerObfName = obfuscator.getObfuscatedName('GameEngineServer');
		if(gameServerObfName !== 'GameEngineServer')
		{
			eval(gameServerObfName + ' = {};');
		}
		eval(obfuscatorObfuscatedSrc);
		var callObfuscatedObfuscatorSrc =
			'var obfuscator2 = new ' + gameServerObfName + '.' + obfuscator.getObfuscatedName('Obfuscator') + '();\n' +
			'obfuscator2.' + obfuscator.getObfuscatedName('addSrc') + '(obfuscatorSrc);\n' +
			'obfuscator2.' + obfuscator.getObfuscatedName('registerNamespace') + '(\'GameEngineServer\');\n' +
			'obfuscator2.' + obfuscator.getObfuscatedName('run') + '();\n' +
			'var obfuscatorObfuscatedSrc2 = obfuscator2.' + obfuscator.getObfuscatedName('getObfuscatedCode') + '();\n'
		;
		//console.log("Executing code: \n" + callObfuscatedObfuscatorSrc);
		eval(callObfuscatedObfuscatorSrc);
		//console.log('\n\n' + obfuscatorObfuscatedSrc2 + '\n\n');
		
		delete a;
		
		gameAssert(
			obfuscatorObfuscatedSrc === obfuscatorObfuscatedSrc2,
			"Obfuscated Obfuscator did not produce same results as the original!"
		);
		
		
		//backup real obfuscation states and use these for the next two tests
		var backupObfuscationVars = GameSystemVars.Server;
		GameSystemVars.Server =
		{
			compressClientCode : true
			,removeTextForLocalization : true
			,removeNonNewlineWhiteSpace : true
			,removeNewlines : true
			,obfuscateNames : true
			,useModifiedNamesNotPureObfuscate : false
		};
		
		obfuscator = new GameEngineServer.Obfuscator();
		var src = 'var testMultipleInARow = 1;\ntestMultipleInARow=testMultipleInARow/testMultipleInARow/testMultipleInARow/testMultipleInARow/testMultipleInARow/testMultipleInARow;';
		obfuscator.addSrc(src);
		obfuscator.run();
		src = obfuscator.getObfuscatedCode();
		var obfWord = obfuscator.getObfuscatedName('testMultipleInARow');
		gameAssert(
			src === 'var ' + obfWord + '=1;' + obfWord + '=' + obfWord + '/' + obfWord + '/' + obfWord + '/' + obfWord + '/' + obfWord + '/' + obfWord + ';',
			"Cannot handle multiple of same var in a row!"
		);
				
		obfuscator = new GameEngineServer.Obfuscator();
		var src = 'var v1 = {asdf:[\'asdf\', [{asdf:[1,2,3]}], \'sdf\'], qwer:{}}, v2 = String(\'fudge\' + String(\'fudge2\'));';
		obfuscator.addSrc(src);
		obfuscator.run();
		src = obfuscator.getObfuscatedCode();
		gameAssert(
			src === 'var c={a:[\'a\',[{a:[1,2,3]}],\'sdf\'],b:{}},d=String(\'fudge\'+String(\'fudge2\'));',
			"Cannot handle nested brackets on variable declaration!"
		);
		
		//restore obfuscation states:
		GameSystemVars.Server = backupObfuscationVars;
		
		//restore debug state:
		GameSystemVars.DEBUG = rememberDebugState;
		
		return true;
	}
);
