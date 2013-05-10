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

ECGame.unitTests.registerTest(
	"GameObfuscator",
	function()
	{
		var backupDebugState,
			obfuscator,
			obfuscatorSrc,
			obfuscatorObfuscatedSrc,
			obfuscatedNameECGame,
			obfuscatedNameECGameWebserver,
			callObfuscatedObfuscatorSrc,
			backupObfuscationVars,
			testSrc,
			obfValue;
		
		//Backup the debug setting so we cant turn it off for this test and return it to whatever it's current setting is
		backupDebugState = ECGame.Settings.DEBUG;
		ECGame.Settings.DEBUG = false;
		
		//obfuscate the obfuscator code
		obfuscator = new ECGame.Webserver.Obfuscator();
		obfuscatorSrc = fs.readFileSync('../engine/private/scripts/CodeObfuscator.js', /*encoding=*/'utf8');
		obfuscator.addSrc(obfuscatorSrc);
		obfuscator.registerNamespace('ECGame');
		obfuscator.registerNamespace('Webserver');
		obfuscator.run();
		obfuscatorObfuscatedSrc = obfuscator.getObfuscatedCode();
		//console.log('\n\n' + obfuscatorObfuscatedSrc + '\n\n');
		
		obfuscatedNameECGame = obfuscator.getObfuscatedName('ECGame');
		obfuscatedNameECGameWebserver = obfuscatedNameECGame + '.' + obfuscator.getObfuscatedName('Webserver');
		if(obfuscatedNameECGameWebserver !== 'ECGame.Webserver')
		{
			//create localization:
			eval('var ' + obfuscator.getObfuscatedName('GameLocalization') + ';');
			//create ECGame NOTE: put var in front of it so it will be cleaned automatically when this function ends!!
			eval('var ' + obfuscatedNameECGame + ' = {};');
			//create ECGame.Webserver
			eval(obfuscatedNameECGameWebserver + ' = {};');
			//create ECGame.EngineLib
			eval(obfuscatedNameECGame + '.' + obfuscator.getObfuscatedName('EngineLib') + ' = {};');
		}
		//console.log(obfuscatorObfuscatedSrc);		
		//console.log(obfuscator.getUnObfuscatedName(''));
		
		//eval the Obfuscated obfuscator Src code!
		eval(obfuscatorObfuscatedSrc);
		
		//make sure generated code knows about the system settings, and the helper function it needs
		eval(obfuscatedNameECGame + '.' + obfuscator.getObfuscatedName('Settings') + '= ECGame.Settings;');
		eval(obfuscatedNameECGame + '.' + obfuscator.getObfuscatedName('EngineLib') + '.isNumber = ECGame.EngineLib.isNumber;');
		
		callObfuscatedObfuscatorSrc =
			'var obfuscator2 = new ' + obfuscatedNameECGameWebserver + '.' + obfuscator.getObfuscatedName('Obfuscator') + '();\n' +
			'obfuscator2.' + obfuscator.getObfuscatedName('addSrc') + '(obfuscatorSrc);\n' +
			'obfuscator2.' + obfuscator.getObfuscatedName('registerNamespace') + '(\'ECGame\');\n' +
			'obfuscator2.' + obfuscator.getObfuscatedName('registerNamespace') + '(\'Webserver\');\n' +
			'obfuscator2.' + obfuscator.getObfuscatedName('run') + '();\n' +
			'var obfuscatorObfuscatedSrc2 = obfuscator2.' + obfuscator.getObfuscatedName('getObfuscatedCode') + '();\n'
		;
		//console.log("Executing code: \n" + callObfuscatedObfuscatorSrc);
		
		//create and run the Obfuscated Obfuscator
		eval(callObfuscatedObfuscatorSrc);
		
		//not needed atm because it is declared above as a var
		//eval('delete ' + obfuscatedNameECGame + ';');
		
		if(obfuscatorObfuscatedSrc !== obfuscatorObfuscatedSrc2)
		{
			console.log(
				"\n\nORIGINAL GENERATED CODE:\n\n" + obfuscatorObfuscatedSrc +
				"\n\nSECONDARY GENERATED CODE:\n\n" + obfuscatorObfuscatedSrc2
			);
		}
		ECGame.log.assert(
			obfuscatorObfuscatedSrc === obfuscatorObfuscatedSrc2,
			"Obfuscated Obfuscator did not produce same results as the original!"
		);
		
		
		//backup real obfuscation states and use these for the next two tests
		backupObfuscationVars = ECGame.Settings.Server;
		ECGame.Settings.Server =
		{
			compressClientCode : true
			,removeTextForLocalization : true
			,removeNonNewlineWhiteSpace : true
			,removeNewlines : true
			,obfuscateNames : true
			,useModifiedNamesNotPureObfuscate : false
		};
		
		//Test multiple symbols in a row being replaced correctly
		obfuscator = new ECGame.Webserver.Obfuscator();
		testSrc = 'var testMultipleInARow = 1;\ntestMultipleInARow=testMultipleInARow/testMultipleInARow/testMultipleInARow/testMultipleInARow/testMultipleInARow/testMultipleInARow;';
		obfuscator.addSrc(testSrc);
		obfuscator.run();
		testSrc = obfuscator.getObfuscatedCode();
		obfValue = obfuscator.getObfuscatedName('testMultipleInARow');
		ECGame.log.assert(
			testSrc === 'var ' + obfValue + '=1;' + obfValue + '=' + obfValue + '/' + obfValue + '/' + obfValue + '/' + obfValue + '/' + obfValue + '/' + obfValue + ';' + obfuscator.getObfuscatedName('GameLocalization') + '=[];',
			"Cannot handle multiple of same var in a row!"
		);
		
		//Test nested crap being handled correctly
		obfuscator = new ECGame.Webserver.Obfuscator();
		testSrc = 'var v1 = {asdf:[\'asdf\', [{asdf:[1,2,3]}], \'sdf\'], qwer:{}}, v2 = String(\'fudge\' + String(\'fudge2\'));';
		obfuscator.addSrc(testSrc);
		obfuscator.run();
		testSrc = obfuscator.getObfuscatedCode();
		obfValue = //nested stuff
		{
			v1 : obfuscator.getObfuscatedName('v1'),
			v2 : obfuscator.getObfuscatedName('v2'),
			asdf : obfuscator.getObfuscatedName('asdf'),
			qwer : obfuscator.getObfuscatedName('qwer'),
			GameLocalization : obfuscator.getObfuscatedName('GameLocalization')
		};
		ECGame.log.assert(
			testSrc === 'var ' + obfValue.v1 + '={' + obfValue.asdf + ':[\'' + obfValue.asdf + '\',[{' + obfValue.asdf + ':[1,2,3]}],\'sdf\'],' + obfValue.qwer + ':{}},' + obfValue.v2 + '=String(\'fudge\'+String(\'fudge2\'));' + obfValue.GameLocalization + '=[];',
			"Cannot handle nested brackets on variable declaration!"
		);
		
		//restore obfuscation states:
		ECGame.Settings.Server = backupObfuscationVars;
		
		//restore debug state:
		ECGame.Settings.DEBUG = backupDebugState;
		
		return true;
	}
);
