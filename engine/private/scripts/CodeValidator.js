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

//In this file we want to allow sync methods because it is run at startup and needs to complete before the app runs.
//So that means we set the following directive in our comments for the lint'er:
/*jslint stupid : true*/


//TODO replace this with jshint as an npm package
//See: http://af-design.com/blog/2011/01/04/automating-jslint-validation/

	
ECGame.WebServerTools.CodeValidator = ECGame.EngineLib.Class.create({
	Constructor : function CodeValidator()
	{
		this._myFileSystem = require('fs');	//TODO put all such things into some namespace!!
		this._myJSlint = require('../../../3rdParty/private/jslint.js');
	
		this._myProperties =
			"/*global "
			+ "ECGame, Uint8Array "
			+ "*/\t"
		//	+ "/*properties "
		//	+ "*/"
		;
		
		this._myReport = '';
	},
	Parents : [],
	flags : {},
		
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		validateDirectoryTree : function validateDirectoryTree(inFileName)
		{
			this._myReport += "\n\n************************\n";
			this._myReport += "***Starting JSLint:***\n\n";
			
			//run the checker
			this._handleFileOrDirectory(inFileName);
			
			this._myReport += "***Finished JSLint***\n";
			this._myReport += "************************\n\n";
			
			//print the report
			console.log(this._myReport);
			
			//save it to a file
			if(ECGame.Settings.Server.saveResultsNotesToFile)
			{
				this._myFileSystem.writeFileSync(//TODO make writeFileSync when I update my nodejs version (why?)
					'../_unified_/game/JSLintResults.txt',
					this._myReport
				);
			}
		},
		
		_handleFileOrDirectory : function _handleFileOrDirectory(inFileName)
		{
			var aFileStat;
			
			//note: we use sync versions here because this is startup code that we want to run before the rest of the app does!
			aFileStat = this._myFileSystem.statSync(inFileName);
			if(aFileStat.isFile() && inFileName.match(/\.js$/))
			{
				//if its a file, then validate it
				this._validateFile(inFileName);
			}
			else if(aFileStat.isDirectory())
			{
				//if its a directory then recurse
				this._readDirectory(inFileName);
			}
		},
		
		_readDirectory : function _readDirectory(inFolderName)
		{
			var aFileNames
				,i
				;
			
			//note: we use sync versions here because this is startup code that we want to run before the rest of the app does!
			aFileNames = this._myFileSystem.readdirSync(inFolderName);
			for(i = 0; i < aFileNames.length; ++i)
			{
				this._handleFileOrDirectory(inFolderName + '/' + aFileNames[i]);
			}
		},
		
		_validateFile : function _validateFile(inFileName)
		{
			var aFileContent
				,anErrorsList
				,anError
				,anErrorString
				,i
				;
			
			this._myReport += "Checking " + inFileName.replace(__dirname + '/', '') + '\n';
			
			//note: we use sync versions here because this is startup code that we want to run before the rest of the app does!
			aFileContent = this._myFileSystem.readFileSync(inFileName, 'utf8');
			
			if(!this._myJSlint.check(
				this._myProperties + aFileContent
				,ECGame.Settings.Server.jslint_options)
			)
			{
				anErrorsList = this._myJSlint.check.errors;
				
				//console.log(this._myJSlint.check);
				//for(var propertyName in this._myJSlint.check){ console.log(propertyName + ' : ' + (typeof this._myJSlint.check[propertyName])); }
				
				this._myReport += anErrorsList.length + " errors found\n";
				
				for(i = 0; i<anErrorsList.length; ++i)
				{
					anError = anErrorsList[i];
					if(anError)
					{
						anErrorString = anError.reason + "\n\t@" + inFileName + '::' + anError.line + ':' + anError.character;
						if(anError.evidence)
						{
							anErrorString = anError.evidence.trim() + '\n\t' + anErrorString;
						}
						this._myReport += anErrorString + '\n';
					}
				}
				this._myReport += '\n';
			}
			else
			{
				this._myReport += "No errors found\n\n";
			}
		}
	}
});