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

/*jslint stupid : true*/

/*!!
	* document: file
	* description: This file contains the Documentation generation code /
		and is it's own advanced test case suite extending the actual unit case.
*/



////////////////////////////////////////////////////////////////////
//File scope vars://////////////////////////////////////////////////
var fs
	,handlebars
	,plantuml
	,Ajv
	;

fs = require("fs");
handlebars = require('handlebars');

//http://plantuml.com/PlantUML_Language_Reference_Guide.pdf
plantuml = require('node-plantuml');

/*
https://www.npmjs.com/package/jsonschema
	https://github.com/ebdrup/json-schema-benchmark
	http://cosmicrealms.com/blog/2014/02/07/benchmark-of-node-dot-js-json-validation-modules-part-2/
*/
Ajv = require('ajv');
//File scope vars://////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////
//Helper functions://///////////////////////////////////////////////

/*!!
	@ beginMethod: rmdirRecursiveSync
	* namespace: ECGame.WebServerTools
	* description: Recursively and syncronously remove a directory
	* parameters:
	[
		* parameter ["string"] inPath: directory to remove
	]
	* returns: undefined
*/
//!!TODO Refactor 8: rmdirRecursiveSync should go in another file
ECGame.WebServerTools.rmdirRecursiveSync = function rmdirRecursiveSync(inPath)
{
	var aFileList
		;
	
	aFileList = [];

	//!# start

	//!# if(inPath exists)
	if(fs.existsSync(inPath))
	{
		//!# :read directory file names
		aFileList = fs.readdirSync(inPath);
		//!# while(for all files)
		aFileList.forEach(
			function(inFile/*, inIndex*/)
			{
				var aCurrentPath = inPath + "/" + inFile;
				//!# if(directory)
				if(fs.statSync(aCurrentPath).isDirectory())
				{
					//!# :recurse
					ECGame.WebServerTools.rmdirRecursiveSync(aCurrentPath);
				}
				else//!# else
				{
					//!# :delete file
					fs.unlinkSync(aCurrentPath);
				}
				//!# endif
			}
		);
		//!# endwhile

		//!# :remove directory
		fs.rmdirSync(inPath);
	}
	//!# else
	else
	{
		//!# :error out the path and filename
		console.error(inPath, __filename/*, __dirname*/);
	}
	//!# endif

	//!# stop
};
//!!endMethod: rmdirRecursiveSync



/*!!
	* document: beginMethod
	* namespace: ECGame.WebServerTools
	* name: mkdirRecursiveSync
	* description: Recursively and syncronously create a directory
	* parameters:
	[
		{
			* name: inPath
			* types: ["string"]
			* description: directory to add
		}
	]
	* returns: undefined
*/
//!!TODO Refactor 8: mkdirRecursiveSync should go in another file
ECGame.WebServerTools.mkdirRecursiveSync = function mkdirRecursiveSync(inPath)
{
	var aSplitPath
		,aPath
		,i
		;

	//!# start

	//!# :split the path into a list of nested directories
	aSplitPath = inPath.split('/');
	aPath = "";

	//!# while(for each directory nesting)
	for(i = 0; i < aSplitPath.length -1; ++i)
	{
		//!# :append directory name
		aPath += aSplitPath[i];

		try	//!# partition Try {
		{
			//!# if(path does not exist)
			if(!fs.existsSync(aPath))
			{
				//!# :make directory
				fs.mkdirSync(aPath);
			}
			//!# endif
		}//!# }
		catch(inError)	//!# partition Catch {
		{
			//!# :error
			console.error(inError);
		}//!# }

		aPath += '/';
	}
	//!# endwhile

	//!# stop
};
//!!endMethod: mkdirRecursiveSync

//Helper functions://///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////
//DocJS:////////////////////////////////////////////////////////////
/*!!
	* document: beginClass
	* name: DocJS
	* namespace: ECGame.WebServerTools
	* description: This class is used to generate project documentation
	* parents: []
*/
//!!TODO Feature 9: 'see also'/'link'/'tags'/'notes?' etc (reference doxygen?)
//!!TODO Feature 7: support for the sh/bat files also
//!!TODO Feature 2: fires(emits)/listens + declare method as a listener, gen Sequence/swimlane diagrams
//!!TODO Refactor 8: bower support content for: https://github.com/isagalaev/highlight.js
//!!TODO Feature 9: Search all docs
//!!TODO Feature 5: File Index page by directory and/or extention
//!!TODO Refactor 8: Main File List should have Path headers and filename(s) without path, and/or mutliple list types..
//!!TODO Action 9: Compare too http://docs.oracle.com/javase/6/docs/api/java/util/UUID.html
//!!TODO Action 9: Compare too http://www.stack.nl/~dimitri/doxygen/manual/docblocks.html
ECGame.WebServerTools.DocJS = ECGame.EngineLib.Class.create({
	Constructor : function DocJS()
	{
		var aStandardFields
			,aStandardField
			,anElementDescription
			,anElementTypeName
			;

		//!!member ["ECGame.WebServerTools.DocJS"] _$ourInstance = "this": Singleton used by sort function
		ECGame.WebServerTools.DocJS._$ourInstance = this;

		/*!!
			@ member: _mySource
			* description: Contains all the source files than need to be processed
			* types: ["Array"]
			* default: "[]"
		*/
		this._mySource = [];

		/*!!
			* document: member
			* name: _myTargetDirectory
			* description: Contains target directory root
			* types: ["String"]
			* default: '../docs/generated/'
		*/
		this._myTargetDirectory = '../docs/generated/';

		//!!member ["Array"] _myElementStack = "[]": Array contains stack of doc elements during processing
		this._myElementStack = [];

		/*!!member ["Object"] _myAllElements = "{}": /
			Map contains all compiled documentation elements*/
		this._myAllElements = {};

		/*!!member ["Object"] _myNamespaces = "{}": /
			Map contains all compiled namespace documentation elements*/
		this._myNamespaces = {};

		/*!!member ["Object"] _myClasses = "{}": /
			Map contains all compiled class documentation elements*/
		this._myClasses = {};

		/*!!member ["Object"] _myFiles = "{}": /
			Map contains all compiled file documentation elements*/
		this._myFiles = {};

		/*!!member ["Object"] _myTodos = "{}": /
			Map contains all compiled todo documentation elements*/
		this._myTodos = {};

		/*!!member ["Object"] _myTemplates = "{}": /
			Map contains all handlebars templates*/
		this._myTemplates = {};

		/*!!member ["Object"] _myContainerNames = "{..mapping..}": /
			Map between element types and container names*/
		this._myContainerNames =
		{
			namespace: "containedNamespaces",
			class: "containedClasses",
			method: "containedMethods",
			member: "containedMembers",
			TODO: "containedTodos"
		};

		//fields contained by all elements:
		aStandardFields =
		{
			document: {type:"string"}
			,name: {type:"string"}
			,description: {type:"string"}
			,fileName: {type:"string"}
			,lineNumber: {type:"integer"}
		};
		//!!TODO Feature 9: aOptionalFields = diagram?, links, seeAlso, ??
		/*!!member ["Object"] _myElementDescriptions = "{..mapping..}": /
			Map of element descriptions for validation*/
		this._myElementDescriptions =
		{
			namespace:
			{
				addTo: [this._myAllElements, this._myNamespaces],
				processFunction: '_processNormalElement',
				schema:
				{
					title: "namespace"
					,type: "object"
					,properties:
					{
						namespace: {type:"string"}
					}
					,required: []
					,additionalProperties: false
				}
			},
			beginNamespace:
			{
				alias: 'namespace',
				processFunction: '_processPushElement'
			},
			endNamespace:
			{
				processFunction: '_processPopElement',
				matchesBegin: 'namespace'
			},

			class:
			{
				addTo: [this._myAllElements, this._myClasses],
				processFunction: '_processNormalElement',
				schema:
				{
					title: "class"
					,type: "object"
					,properties:
					{
						namespace: {type:"string"}
						,parents: {type:"array", items: { type: "string" }}
					}
					,required: ['namespace']
					,additionalProperties: false
				}
			},
			beginClass:
			{
				alias: 'class',
				processFunction: '_processPushElement'
			},
			endClass:
			{
				processFunction: '_processPopElement',
				matchesBegin: 'class'
			},
			method:
			{
				addTo: [this._myAllElements],
				processFunction: '_processMethodElement',
				schema:
				{
					title: "method"
					,type: "object"
					,properties:
					{
						namespace: {type:"string"}
						,class: {type:"string"}
						,parameters:{
							type: "array"
							,items:
							{
								type: "object"
								,properties:
								{
									name: {type:"string"}
									,types: {type: "array", items:{type:"string"}}
									,description: {type: "string"}
									,default: {}
								}
								,required:["name", "types", "description"]
								,additionalProperties: false
							}
						}
						,returns: {type:"array", items: { type: "string" }}
					}
					,required: ['parameters', 'returns']
					,oneOf:[
						{required:['class']}
						,{required:['namespace']}
					]
					,additionalProperties: false
				}
			},
			beginMethod:
			{
				alias: 'method',
				processFunction: '_processPushElement'
			},
			endMethod:
			{
				processFunction: '_processPopElement',
				matchesBegin: 'method'
			},

			member:
			{
				addTo: [this._myAllElements],
				processFunction: '_processNormalElement',
				schema:
				{
					title: "member"
					,type: "object"
					,properties:
					{
						namespace: {type:"string"}
						,class: {type:"string"}
						,types: {type: "array", items:{type:"string"}}
						,default: {}
					}
					,required: ['types', 'default']
					,additionalProperties: false
					,oneOf:[
						{required:['class']}
						,{required:['namespace']}
					]
				}
			},

			file:
			{
				addTo: [this._myAllElements, this._myFiles],
				processFunction: '_processNormalElement',
				schema:
				{
					title: "file"
					,type: "object"
					,properties:
					{
						sourceCode: {type:"string"}
					}
					,required: ['sourceCode']
					,additionalProperties: false
				}
			},

			TODO:
			{
				addTo: [this._myAllElements, this._myTodos],
				processFunction: '_processTodoElement',
				schema:
				{
					title: "TODO"
					,type: "object"
					,properties:
					{
						priority: {type: "integer", minimum: 1, maximum: 10}
						/*
							1 - High Priority
							...
							9 - Very low, as needed (may be unmissable later)
							10 - Should be for generated todos only (file doc header missing, etc)
						*/
						,category: {
							enum:
							[
								"Action"	//non code/testing misc catchall; ?example?: get keys or certifications
								,"Bug"
								,"Document"
								,"Feature"
								,"Optimize"
								,"Refactor"
								,"Rename"
								,"Test"	//create unit test (or at least test manually)
								,"Validate"	//manually check code concept(s)
							]
						}
						,namespace: {type: "string"}
						,class: {type: "string"}
						,method: {type: "string"}
					}
					,required: ['priority', 'category']
					,additionalProperties: false
					/*,oneOf:[
						{required:['class']}
						,{required:['namespace']}
						,{required:['method']}
					]*/
				}
			}
		};

		for(anElementTypeName in this._myElementDescriptions)
		{
			anElementDescription = this._myElementDescriptions[anElementTypeName];
			if(anElementDescription.hasOwnProperty('schema'))
			{
				for(aStandardField in aStandardFields)
				{
					anElementDescription.schema.properties[aStandardField] = aStandardFields[aStandardField];
					anElementDescription.schema.required.push(aStandardField);
				}
				anElementDescription.validate = Ajv({allErrors: true}).compile(anElementDescription.schema);
			}
		}
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		/*!!
			@ beginMethod: loadDirectory
			* description: Recursively loads files from the directory
			* parameters:
			[
				* parameter ["string"] inPath: target directory
				* parameter ["array", "string"] inFileExtentions = "[]": array of file extentions
				* parameter ["array", "string"] inExcludeDirectories = "[]": array of directories to exclude
			]
			* returns: undefined
		*/
		//!!TODO Refactor 9: loadDirectory() as namespace scope function taking file type and callback
		loadDirectory : function loadDirectory(inPath, inFileExtentions, inExcludeDirectories)
		{
			//!# start
			var aFileList = [],
				aThis;

			aThis = this;

			inFileExtentions = inFileExtentions || [];
			inExcludeDirectories = inExcludeDirectories || [];

			//!# if(path exists)
			if(fs.existsSync(inPath))
			{
				//!# :read directory
				aFileList = fs.readdirSync(inPath);
				//!# while(for each directory item)
				aFileList.forEach(
					function(inFile/*, inIndex*/)
					{
						var aCurrentPath, i, anIncluded;
						aCurrentPath = inPath + "/" + inFile;
						//!# if(directory)
						if(fs.statSync(aCurrentPath).isDirectory())
						{
							anIncluded = true;
							for(i = 0; i < inExcludeDirectories.length; ++i)
							{
								if(aCurrentPath.indexOf(inExcludeDirectories[i]) !== -1)
								{
									anIncluded = false;
								}
							}

							if(anIncluded)//!# if(included)
							{
								//!# :recurse loadDirectory()
								aThis.loadDirectory(aCurrentPath, inFileExtentions, inExcludeDirectories);
							}//!# endif
						}
						//!# elseif(approved file type)
						else if(
							inFileExtentions.indexOf(
								aCurrentPath.substr(aCurrentPath.lastIndexOf('.')).toLowerCase()
							) !== -1
						)
						{
							//!# :appendSource()
							aThis.appendSource(
								fs.readFileSync(aCurrentPath, 'utf8'),
								aCurrentPath
							);
						}
						//!# endif
					}
				);//!# endwhile
			}//!# endif

			return;//!# stop
		}//!!endMethod: loadDirectory



		/*!!
			@ method: appendSource
			* description: Registers loaded source code to parse along with it's filename
			* parameters:
			[
				* parameter ["string"] inSource: Source Code of the file
				* parameter ["string"] inFileName: File Name
			]
			* returns: undefined
		*/
		,appendSource : function appendSource(inSource, inFileName)
		{
			this._mySource.push(
				{
					mySourceCode : inSource
					,myFileName : inFileName
				}
			);
		}



		/*!!
			@ beginMethod: run
			* description: Runs the documentation process
			* parameters: []
			* returns: undefined
		*/
		,run : function run()
		{
			//!# start
			var aSourceIndex
				,aSourceCode
				,aFileName
				,anElementsList
				,anElementIndex
				,anElementString
				,aPreprocessedElementString
				,aParsedElement
				,aLineNumber
				,aDefaultFileHeader
				,aNoDocTODO
				,aStackTop
				;

			//!# :load all templates;
			this._loadTemplates();

			//!# :delete target folder to get rid of old content;
			ECGame.WebServerTools.rmdirRecursiveSync(this._myTargetDirectory);
			//!# :recreate target folder;
			ECGame.WebServerTools.mkdirRecursiveSync(this._myTargetDirectory + 'files/images/');
			ECGame.WebServerTools.mkdirRecursiveSync(this._myTargetDirectory + 'classes/images/');
			ECGame.WebServerTools.mkdirRecursiveSync(this._myTargetDirectory + 'namespaces/images/');
			ECGame.WebServerTools.mkdirRecursiveSync(this._myTargetDirectory + 'methods/images/');

			//!# while (for all source files)
			for(aSourceIndex = 0; aSourceIndex < this._mySource.length; ++aSourceIndex)
			{
				aSourceCode = this._mySource[aSourceIndex].mySourceCode;
				aFileName = this._mySource[aSourceIndex].myFileName;
				aFileName = (
					aFileName.indexOf("../_unified_/") === 0
					? aFileName.substring("../_unified_/".length)
					: aFileName
				);
				aDefaultFileHeader = {
					document: "file",
					name: aFileName,
					description: "THIS FILE NEEDS DOCUMENTED",
					fileName: aFileName,
					lineNumber: 1,
					sourceCode: aSourceCode
				};
				aNoDocTODO = {
					document: "TODO"
					,description: "File document header missing: " + aFileName
					,priority: 10
					,category: "Document"
					,fileName: aFileName
					,lineNumber: 1
				};

				//!# :parse out all elements with proper comment blocks;
				anElementsList = aSourceCode.match(/(\x2f\x2a\x21[\S\s]*?\x2a\x2f|\x2f\x2f\x21[^\n]*\n|\x3c\x21\x2d\x2d\x21[\S\s]*?\x2d\x2d\x3e)/g);

				//!# if (no elements in the file)
				if(!anElementsList)
				{
					//!# :warn the file is missing documentation
					if(ECGame.Settings.Server.warnUndocumentedFiles)
					{
						console.warn("Missing Documentation:", aFileName);
					}
					//!# :create default file header and todo requesting documentation
					anElementsList = [
						JSON.stringify(aDefaultFileHeader)
						,JSON.stringify(aNoDocTODO)
					];
				}
				//!# endif

				//!# while (for all elements)
				for(anElementIndex = 0; anElementIndex < anElementsList.length; ++anElementIndex)
				{
					anElementString = anElementsList[anElementIndex];
					//!# :trim comment characters
					anElementString = anElementString.replace(/(^\x2f\x2a\x21|\x2a\x2f$|^\x2f\x2f\x21|^\x3c\x21\x2d\x2d\x21|\x2d\x2d\x3e$)/g, '');
					//!# :calculate line numbers
					aLineNumber = this._getLineNumber(aSourceCode, anElementString);
					aParsedElement = null;

					//!# if (inline uml)
					if(anElementString.charAt(0) === '#')
					{
						//!# :preProcessUmlElementString()
						aPreprocessedElementString = this._preProcessUmlElementString(anElementString);
					}
					else //!# else
					{
						//!# if (turbo comment) then (true)
						if(anElementString.charAt(0) === '!')
						{
							//!# :preProcessTurboElementString()
							aPreprocessedElementString = this._preProcessTurboElementString(anElementString);
						}
						//!# else (standard comment)
						else
						{
							//!# :use normal documentation comments
							aPreprocessedElementString = anElementString;
						}
						//!# endif

						try	//!# partition try {
						{
							//!# :JSON.parse(preprocessed element)
							aParsedElement = JSON.parse(aPreprocessedElementString);
							//!# :store file/line
							aParsedElement.fileName = aFileName;
							aParsedElement.lineNumber = aLineNumber;
						}//!# }
						catch(inError)	//!# partition catch {
						{
							console.error(	//!# :error
								inError.message
									+ "\nParsing: " + aFileName + ':' + aLineNumber
									+ "\n" + anElementString
									+ "\n" + aPreprocessedElementString
							);
						}//!# }
						//!# if(first element && parse failed || is not file)
						if(anElementIndex === 0 && (!aParsedElement || aParsedElement.document !== "file"))
						{
							if(ECGame.Settings.Server.warnUndocumentedFiles)
							{
								console.warn("Missing file documentation header: ", aFileName);
							}
							//!# :create default file header and documentation todo
							this._processElement(aDefaultFileHeader);
							this._processElement(aNoDocTODO);
						}//!# endif
						if(!aParsedElement)
						{
							continue;
						}

						//!# :set parsed element as child of top stack item
						if(this._myElementStack.length)
						{
							aStackTop = this._myElementStack[this._myElementStack.length - 1];
							aParsedElement[aStackTop.document] =
								(aParsedElement[aStackTop.document]	//allow the user to override the stack location
								|| this._getFullElementName(aStackTop));
						}

						//!# :if it is a file, set name and source code fields
						if(aParsedElement.document === "file")
						{
							aParsedElement.name = aFileName;
							aParsedElement.sourceCode = aSourceCode;
						}

						//!# :process the parsed element
						this._processElement(aParsedElement);
					}
					//!# endif
				}
				//!# endwhile

				//!# :warn of any items still on the stack
				if(this._myElementStack.length)
				{
					console.error(
						"Unfinished items on stack:"
							+ "\n" + JSON.stringify(this._myElementStack, null, '\t')
					);
					this._myElementStack = [];
				}
			}//!# endwhile

			//!# :doPostLoadProcessing()
			this._doPostLoadProcessing();

			//!# :generate and write output files
			this._writeHtmlFile(
				'masterIndex'
				,this._myTemplates.base(
					{
						body:this._myTemplates.masterIndex({})
					}
				)
			);
			this._writeNamespaceFiles();
			this._writeClassFiles();
			this._writeFileFiles();
			this._writeTODOFiles();

			//console.log(JSON.stringify(this._myAllElements, null, '\t'));

			//!# stop
		}
		//!!endMethod: run



		/*!!
			@ beginMethod: _loadTemplates
			* parameters: []
			* returns: undefined
			* description: Loads the handlebars templates for rendering documentation
		*/
		,_loadTemplates : function _loadTemplates()
		{
			var aThis;

			aThis = this;

			handlebars.registerPartial(
				'basicProperties',
				fs.readFileSync('../docs/templates/basicProperties.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);
			handlebars.registerPartial(
				'todosSection',
				fs.readFileSync('../docs/templates/todosSection.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);
			handlebars.registerPartial(
				'namespacesSection',
				fs.readFileSync('../docs/templates/namespacesSection.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);
			handlebars.registerPartial(
				'classesSection',
				fs.readFileSync('../docs/templates/classesSection.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);
			handlebars.registerPartial(
				'methodsSection',
				fs.readFileSync('../docs/templates/methodsSection.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);
			handlebars.registerPartial(
				'methodsIndex',
				fs.readFileSync('../docs/templates/methodsIndex.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);
			handlebars.registerPartial(
				'membersSection',
				fs.readFileSync('../docs/templates/membersSection.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);
			handlebars.registerPartial(
				'membersIndex',
				fs.readFileSync('../docs/templates/membersIndex.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);
			handlebars.registerPartial(
				'todoList',
				fs.readFileSync('../docs/templates/todoList.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);
			handlebars.registerPartial(
				'types',
				fs.readFileSync('../docs/templates/types.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);

			handlebars.registerHelper(
				'isOverrideStyle'
				,function beginIsOverride(inParent, inItem)
				{
					var aContainer
						,isMostRecent
						,i
						;
					
					aContainer = inParent[aThis._myContainerNames[inItem.document]];

					isMostRecent = false;
					for(i = 0; i < aContainer.length; ++i)
					{
						if(aContainer[i].name.localeCompare(inItem.name) === 0)
						{
							if(aContainer[i] === inItem)
							{
								isMostRecent = true;
							}
							else
							{
								isMostRecent = false;
							}
						}
					}
					return (!isMostRecent ? "text-decoration: line-through; color:grey;" : "");
				}
			);

			this._myTemplates.base = handlebars.compile(
				fs.readFileSync('../docs/templates/base.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);
			this._myTemplates.masterIndex = handlebars.compile(
				fs.readFileSync('../docs/templates/masterIndex.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);
			this._myTemplates.namespacesIndex = handlebars.compile(
				fs.readFileSync('../docs/templates/namespacesIndex.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);
			this._myTemplates.classesIndex = handlebars.compile(
				fs.readFileSync('../docs/templates/classesIndex.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);
			this._myTemplates.filesIndex = handlebars.compile(
				fs.readFileSync('../docs/templates/filesIndex.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);
			this._myTemplates.todosIndex = handlebars.compile(
				fs.readFileSync('../docs/templates/todosIndex.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);

			this._myTemplates.mainFrameBase = handlebars.compile(
				fs.readFileSync('../docs/templates/mainFrameBase.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);

			this._myTemplates.namespace = handlebars.compile(
				fs.readFileSync('../docs/templates/namespace.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);
			this._myTemplates.class = handlebars.compile(
				fs.readFileSync('../docs/templates/class.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);
			this._myTemplates.file = handlebars.compile(
				fs.readFileSync('../docs/templates/file.hbs', 'utf8')
					.replace(/\x3c\x21\x2d\x2d[\S\s]*?\x2d\x2d\x3e/g, '')
			);
		}//!!endMethod: _loadTemplates



		/*!!
			@ beginMethod: _getFullElementName
			* description: get full path name of element
			* parameters:
			[
				* parameter ["object"] inElement: documentation element object
			]
			* returns: string
		*/
		,_getFullElementName : function _getFullElementName(inElement)
		{
			if(inElement.hasOwnProperty("namespace"))
			{
				return inElement.namespace + "." + inElement.name;
			}
			if(inElement.hasOwnProperty("class"))
			{
				return inElement.class + "." + inElement.name;
			}
			return inElement.name;
		}
		//!!endMethod: _getFullElementName



		/*!!
			@ beginMethod: _getLineNumber
			* description: find the line number for the element
			* parameters:
			[
				* parameter ["string"] inSource: source code
				* parameter ["string"] inElementText: text version of the original element
			]
			* returns: string
		*/
		,_getLineNumber : function _getLineNumber(inSource, inElementText)
		{
			var aStartIndex
				,aLineNumber
				;

			//get its line number
			aStartIndex = inSource.indexOf(inElementText);
			if(aStartIndex === -1)
			{
				aLineNumber = 1;
			}
			else
			{
				aLineNumber = (inSource.substr(0, aStartIndex).match(/\n/g) || []).length + 1;
			}

			if(
				inSource.indexOf(inElementText, aStartIndex + 1) !== -1
				&& inElementText.charAt(0) !== '#'
			)
			{
				console.warn("Element repeated, line number uncertain:", inElementText);
			}

			return aLineNumber;
		}
		//!!endMethod: _getLineNumber



		/*!!
			* document: beginMethod
			* name: _patchClass
			* description: inherits methods and members from parent classes
			* parameters:
			[
				* parameter ["object"] inElement: documentation element object
			]
			* returns: undefined
		*/
		,_patchClass : function _patchClass(inElement)
		{
			var aChildClassElement
				,methodList
				,aMemberList
				,i
				;

			//!# start

			//!# if(no child classes)
			if(!inElement.childClasses)
			{
				//!# :end recursion
				return;	//!# stop
			}
			//!# endif

			methodList = this._myContainerNames.method;
			aMemberList = this._myContainerNames.member;

			//!# while(for all child classes)
			for(i = 0; i < inElement.childClasses.length; ++i)
			{
				aChildClassElement = this._myAllElements[inElement.childClasses[i]];

				//pass down inherited methods/members:
				
				//!# if(method list)
				if(inElement[methodList])
				{
					//!# :childClass.methods = methods + childClass.methods
					aChildClassElement[methodList] =
						inElement[methodList].concat(
							aChildClassElement[methodList]
						)
					;
				}//!# endif
				//!# if(member list)
				if(inElement[aMemberList])
				{
					//!# :childClass.members = members + childClass.members
					aChildClassElement[aMemberList] =
						inElement[aMemberList].concat(
							aChildClassElement[aMemberList]
						)
					;
				}//!# endif

				//!# :recurse _patchClass(childClass)
				this._patchClass(aChildClassElement);
			}//!# endwhile

			//!# stop
		}
		//!!endMethod: _patchClass



		/*!!
			@ method: _patchTypes
			* description: identifies if the types are part of the project or should be built into js /
				and patches up the element for the UI to link it properly
			* parameters:
			[
				* parameter ["array", "string"] inoutTypes: /
					array of strings of object type names which will be /
					converted to objects for linking basic/local types
			]
			* returns: undefined
		*/
		,_patchTypes : function _patchTypes(inoutTypes)
		{
			var i;

			for(i = 0; i < inoutTypes.length; ++i)
			{
				if(this._myAllElements[inoutTypes[i]])
				{
					inoutTypes[i] = {localType: inoutTypes[i]};
				}
				else
				{
					inoutTypes[i] = {basicType: inoutTypes[i]};
				}
			}
		}



		/*!!
			@ method: _$elementSort
			* description: sort function for element list
			* parameters:
			[
				* parameter ["object"] inLeft: documentation element
				* parameter ["object"] inRight: documentation element
			]
			* returns: number
		*/
		,_$elementSort : function _$elementSort(inLeft, inRight)
		{
			var aThis = ECGame.WebServerTools.DocJS._$ourInstance;
			return aThis._getFullElementName(inLeft).localeCompare(aThis._getFullElementName(inRight));
		}



		/*!!
			@ method: _$todosSort
			* description: sort function for todo list
			* parameters:
			[
				* parameter ["object"] inLeft: documentation element
				* parameter ["object"] inRight: documentation element
			]
			* returns: number
		*/
		,_$todosSort : function _$todosSort(inLeft, inRight)
		{
			var aReturn;

			aReturn = inLeft.priority - inRight.priority;
			if(aReturn === 0)
			{
				aReturn = inLeft.category.localeCompare(inRight.category);
			}
			if(aReturn === 0)
			{
				aReturn = inLeft.fileName.localeCompare(inRight.fileName);
			}
			if(aReturn === 0)
			{
				aReturn = inLeft.lineNumber - inRight.lineNumber;
			}

			return aReturn;
		}



		/*!!
			@ beginMethod: _preProcessUmlElementString
			* description: preprocesses UML element string
			* parameters:
			[
				* parameter ["string"] inElementString: documentation element string
			]
			* returns: string
		*/
		,_preProcessUmlElementString : function _preProcessUmlElementString(inElementString)
		{
			//!# start
			var aPreprocessedElementString
				,aStackTop
				;

			//!# :remove uml signaling character
			aPreprocessedElementString = inElementString.replace(/^#\s*/,'');
			//!# :remove carraige returns
			aPreprocessedElementString = aPreprocessedElementString.replace(/\r/,'');
			//!# :auto add missed simicolons
			aPreprocessedElementString = aPreprocessedElementString.replace(/^(:.*[^;])(\s+)$/,'$1;$2');
			//!# :add default "then" statement to if/elses
			aPreprocessedElementString = aPreprocessedElementString.replace(
				/^(if|elseif)(\s*\([^\)]*\))(?!\s+then)/
				,'$1$2 then(true)'
			);
			//!# :add default condition statement to elses
			aPreprocessedElementString = aPreprocessedElementString.replace(
				/^else\s*$/
				,'else (false)\n'
			);

			//!# if (stack empty)
			if(!this._myElementStack.length)
			{
				//!# :warn: empty stack
				console.warn("Cannot process element on empty stack:\n" + inElementString);
			}//!!TODO Bug 9: Don't allow non method elements to do this
			else //!# else
			{
				//!# :add uml section to current stack item
				aStackTop = this._myElementStack[this._myElementStack.length - 1];
				aStackTop.inlineUml = (aStackTop.inlineUml || "") + aPreprocessedElementString;
			}
			//!# endif
			
			//console.info("Element:" + aPreprocessedElementString.trim());
			//console.info("UML so far:\n" + aStackTop.inlineUml.trim());

			return aPreprocessedElementString;

			//!# stop
		}
		//!!endMethod: _preProcessUmlElementString



		/*!!
			@ beginMethod: _preProcessTurboElementString
			* description: preprocesses turbo comment element string
			* parameters:
			[
				* parameter ["string"] inElementString: documentation element string
			]
			* returns: string
		*/
		,_preProcessTurboElementString : function _preProcessTurboElementString(inElementString)
		{
			//!# start
			var aPreprocessedElementString;

			aPreprocessedElementString = inElementString;

			//!# :get rid of '!' character at the start
			aPreprocessedElementString = aPreprocessedElementString.replace(/^!/,'');
			//!# :trim end of line whitespace
			aPreprocessedElementString = aPreprocessedElementString.replace(/\s*\n/g, '\n');

			//!# :concat multiline data (marked with '/' at the end of the line)
			aPreprocessedElementString = aPreprocessedElementString.replace(/\/\n\s*/g, '');

			//!# :process fast action todo's
			aPreprocessedElementString = aPreprocessedElementString.replace(
				/^TODO\s+(\w+)\s+(\d+):\s*(.*)/
				,'"document":"TODO", "category":"$1", "priority":$2, "description":"$3"'
			);
			//!# :process fast action end elements
			aPreprocessedElementString = aPreprocessedElementString.replace(
				/^(end\w+)\s*:\s*(.*)/
				,'"document":"$1", "name":"$2"'
			);
			//!# :process fast action members
			aPreprocessedElementString = aPreprocessedElementString.replace(
				/^member\s+(\[.*\])\s+([\$\w]+)\s*=\s*(\".*\")\s*:\s+(.*)/
				,'"document":"member", "name":"$2", "types":$1, "description":"$4", "default":$3'
			);

			//!# :surround block with '{' and '}'
			aPreprocessedElementString = '{' + aPreprocessedElementString + '}';

			//!# :handle "* parameter [types] name = default: desciption"
			aPreprocessedElementString = aPreprocessedElementString.replace(
				/\*\sparameter\s+(\[.*\])\s+(\w+)\s*=\s*(\".*\")\s*:\s+(.*)/g
				,'{"name":"$2", "types":$1, "description":"$4", "default":$3}'
			);
			//!# :handle "* parameter [types] name: desciption"
			aPreprocessedElementString = aPreprocessedElementString.replace(
				/\*\sparameter\s+(\[.*\])\s+(\w+)\s*:\s+(.*)/g
				,'{"name":"$2", "types":$1, "description":"$3"}'
			);

			//!# :handle "@ elementType: name"
			aPreprocessedElementString = aPreprocessedElementString.replace(
				/@\s(\w+)\s*:\s*(\w+)/g
				,'* document: $1\n* name:$2'
			);

			//!# :process "* property: value" for non-object/array/digit unquoted strings
			aPreprocessedElementString = aPreprocessedElementString.replace(
				/\*\s(\w+)\s*:\s*([^\s\{\[\d\"])([^\n\}]*)/g
				,'"$1": "$2$3"'
			);
			//!# :process "* property: value" for object/array types
			aPreprocessedElementString = aPreprocessedElementString.replace(/\*\s(\w+)\s*:\s*([\s\{\[]|\d)/g, '"$1": $2');

			//!# :add commas where needed
			aPreprocessedElementString = aPreprocessedElementString.replace(/([^{])(\n\s*)"/g, '$1$2,"');
			aPreprocessedElementString = aPreprocessedElementString.replace(/([^\[,])(\n\s*)\{/g, '$1$2,{');

			return aPreprocessedElementString;

			//!# stop
		}
		//!!endMethod: _preProcessTurboElementString



		/*!!
			@ method: _processElement
			* description: processes an elements
			* parameters:
			[
				* parameter ["object"] inElement: documentation element object
			]
			* returns: undefined
		*/
		,_processElement : function _processElement(inElement)
		{
			var anElementDescription;

			anElementDescription = this._myElementDescriptions[inElement.document];
			if(!anElementDescription)
			{
				//console.error("No Schema for:", inElement.document);
				console.error(
					'Unknown document type "' + inElement.document + '" for:'
						+ "\n" + JSON.stringify(inElement, null, '\t')
				);
				return;
			}

			this[anElementDescription.processFunction](inElement);
		}



		/*!!
			@ method: _processPushElement
			* description: processes stack push element
			* parameters:
			[
				* parameter ["object"] inElement: documentation element object
			]
			* returns: undefined
		*/
		,_processPushElement : function _processPushElement(inElement)
		{
			this._myElementStack.push(inElement);
			this._processNormalElement(inElement);
		}



		/*!!
			@ method: _processPopElement
			* description: processes stack pop element
			* parameters:
			[
				* parameter ["object"] inElement: documentation element object
			]
			* returns: undefined
		*/
		,_processPopElement : function _processPopElement(inElement)
		{
			var aStackItem
				,anElementDescription
				;

			if(!this._myElementStack.length)
			{
				console.error(
					"No items to pop off stack:"
						+ "\n" + JSON.stringify(inElement, null, '\t')
				);
				return;
			}

			anElementDescription = this._myElementDescriptions[inElement.document];

			aStackItem = this._myElementStack.pop();
			if(anElementDescription.matchesBegin !== aStackItem.document || aStackItem.name !== inElement.name)
			{
				console.error(
					"Stack pop miss match:"
					,anElementDescription.matchesBegin + "<=>" + aStackItem.document
						+ " && "
						+ aStackItem.name + "<=>" + inElement.name
						+ "\n" + JSON.stringify(aStackItem, null, '\t')
						+ "\n" + JSON.stringify(inElement, null, '\t')
				);
				//put it back:
				this._myElementStack.push(aStackItem);
			}
		}



		/*!!
			@ method: _processNormalElement
			* description: processes element
			* parameters:
			[
				* parameter ["object"] inElement: documentation element object
			]
			* returns: undefined
		*/
		,_processNormalElement : function _processNormalElement(inElement)
		{
			var anElementDescription
				,i
				;

			anElementDescription = this._myElementDescriptions[inElement.document];
			if(anElementDescription.alias)
			{
				inElement.document = anElementDescription.alias;
				this._processElement(inElement);
				return;
			}

			if(!anElementDescription.validate(inElement))
			{
				console.error(
					JSON.stringify(
						{
							Errors: anElementDescription.validate.errors
							,Element: inElement
							,Schema: anElementDescription.schema
							/*, ajv.errorsText()*/
						}
						,null
						,'\t'
					)
				);
			}

			for(i = 0; i < anElementDescription.addTo.length; ++i)
			{
				anElementDescription.addTo[i][this._getFullElementName(inElement)] = inElement;
			}
		}



		/*!!
			@ beginMethod: _processTodoElement
			* description: processes todo element
			* parameters:
			[
				* parameter ["object"] inElement: documentation element object
			]
			* returns: undefined
		*/
		//!!TODO Validate 8: is _processTodoElement needed?
		,_processTodoElement : function _processTodoElement(inElement)
		{
			inElement.name = "(" + inElement.priority + ") " + inElement.fileName + ":" + inElement.lineNumber;
			this._processNormalElement(inElement);
		}
		//!!endMethod: _processTodoElement



		/*!!
			@ beginMethod: _processMethodElement
			* description: processes method element
			* parameters:
			[
				* parameter ["object"] inElement: documentation element object
			]
			* returns: undefined
		*/
		//!!TODO Validate 8: is _processMethodElement needed?
		,_processMethodElement : function _processMethodElement(inElement)
		{
			//inElement.parameters = inElement.parameters || [];
			//inElement.returns = inElement.returns || ["undefined"];
			if(typeof inElement.returns === "string")
			{
				inElement.returns = [inElement.returns];
			}

			this._processNormalElement(inElement);
		}
		//!!endMethod: _processMethodElement



		/*!!
			@ beginMethod: _doPostLoadProcessing
			* description: Runs additional processing on elements after all elements are loaded
			* parameters: []
			* returns: undefined
		*/
		,_doPostLoadProcessing : function _doPostLoadProcessing()
		{
			var aParentElementTypesList
				,anElementIndex
				,anElement
				,aParentType
				,aParentName
				,aListName
				,i
				;

			aParentElementTypesList = ["namespace", "class", "method"];

			//First Pass: register with parent elements
			for(anElementIndex in this._myAllElements)
			{
				anElement = this._myAllElements[anElementIndex];

				//make sure file contains all children!
				if(anElement.document !== 'file')
				{
					aListName = this._myContainerNames[anElement.document];
					this._myFiles[anElement.fileName][aListName]
						= this._myFiles[anElement.fileName][aListName] || [];
					this._myFiles[anElement.fileName][aListName].push(anElement);
				}

				for(i = 0; i < aParentElementTypesList.length; ++i)
				{
					aParentType = aParentElementTypesList[i];
					if(anElement.hasOwnProperty(aParentType))
					{
						aListName = this._myContainerNames[anElement.document];
						aParentName = anElement[aParentType];
						this._myAllElements[aParentName][aListName]
							= this._myAllElements[aParentName][aListName] || [];
						this._myAllElements[aParentName][aListName].push(anElement);
					}
				}

				if(anElement.document === 'class' && anElement.parents)
				{
					if(typeof anElement.parents === 'string')
					{
						anElement.parents = [anElement.parents];
					}
					for(i = 0; i < anElement.parents.length; ++i)
					{
						aParentName = anElement.parents[i];
						this._myAllElements[aParentName].childClasses
							= this._myAllElements[aParentName].childClasses || [];
						this._myAllElements[aParentName].childClasses.push(this._getFullElementName(anElement));
					}
				}
			}

			//Second Pass: create diagrams:
			for(anElementIndex in this._myAllElements)
			{
				anElement = this._myAllElements[anElementIndex];

				if(anElement.document === 'class')
				{
					this._createClassDiagram(anElement);
				}
				if(anElement.document === 'namespace')
				{
					this._createNamespaceDiagram(anElement);
				}
				if(anElement.document === 'method' && anElement.inlineUml)
				{
					this._createMethodDiagram(anElement);
				}
				//!!TODO Feature 9: if existing, create Activity diagram/Component diagram/State diagram/etc or user created!!
			}

			//Third Pass: custom fixes/additions
			for(anElementIndex in this._myAllElements)
			{
				anElement = this._myAllElements[anElementIndex];

				if(anElement.document === 'class')
				{
					//if this is a base class:
					if(!anElement.parents || anElement.parents.length === 0)
					{
						this._patchClass(anElement);
					}
				}
				if(anElement.document === 'method')
				{
					for(i = 0; i < anElement.parameters.length; ++i)
					{
						this._patchTypes(anElement.parameters[i].types);
					}
					this._patchTypes(anElement.returns);
					//todo's propagate "up" to other scopes, method parent, child classes, etc..:
					if(anElement.containedTodos)
					{
						for(i = 0; i < aParentElementTypesList.length; ++i)
						{
							aParentType = aParentElementTypesList[i];
							if(anElement.hasOwnProperty(aParentType))
							{
								aParentName = anElement[aParentType];
								this._myAllElements[aParentName].containedTodos
									= this._myAllElements[aParentName].containedTodos || [];
								this._myAllElements[aParentName].containedTodos
									= this._myAllElements[aParentName].containedTodos.concat(anElement.containedTodos);
							}
						}
					}
				}
				if(anElement.document === 'member')
				{
					this._patchTypes(anElement.types);
				}
			}

			//Fourth Pass: Sort output for display:
			for(anElementIndex in this._myAllElements)
			{
				anElement = this._myAllElements[anElementIndex];
				if(anElement.containedTodos)
				{
					anElement.containedTodos.sort(this._$todosSort);
				}
				if(anElement.containedNamespaces)
				{
					anElement.containedNamespaces.sort(this._$elementSort);
				}
				if(anElement.containedClasses)
				{
					anElement.containedClasses.sort(this._$elementSort);
				}
			}
		}//!!endMethod: _doPostLoadProcessing



		/*!!
			* document: beginMethod
			* name: _createNamespaceDiagram
			* description: returns recursively created Namespace uml
			* parameters:
			[
				{
					* name: inElement
					* types: ["object"]
					* description: documentation element object
				}
			]
			* returns: string
		*/
		,_createNamespaceDiagram : function _createNamespaceDiagram(inElement)
		{
			var aUML
				;

			aUML = "@startuml\n";
			if(inElement.namespace)
			{
				aUML += "package " + inElement.namespace + "{\n";
			}
			aUML += this._createNamespaceDiagramSection(inElement);
			if(inElement.namespace)
			{
				aUML += "}\n";
			}
			aUML += "@enduml\n";
			//console.info(aUML);

			plantuml.generate(
				aUML
				,{format : 'svg' }	//options
				,function callback(inError)
				{
					if(inError){console.error(arguments);}
				}
			).out.pipe(
				fs.createWriteStream(
					this._myTargetDirectory + 'namespaces/images/' + this._getFullElementName(inElement) + ".svg"
				)
			);
		}
		//!!endMethod: _createNamespaceDiagram



		/*!!
			* document: beginMethod
			* name: _createNamespaceDiagramSection
			* description: returns recursively created Namespace uml section
			* parameters:
			[
				{
					* name: inElement
					* types: ["object"]
					* description: documentation element object
				}
			]
			* returns: string
		*/
		,_createNamespaceDiagramSection : function _createNamespaceDiagramSection(inElement)
		{
			var aUML
				,i
			;

			aUML = "package " + inElement.name + "{\n";

			if(inElement.containedMembers || inElement.containedMethods)
			{
				aUML += this._createClassDiagramClass(inElement);
			}
			
			if(inElement.containedNamespaces)
			{
				for(i = 0; i < inElement.containedNamespaces.length; ++i)
				{
					aUML += this._createNamespaceDiagramSection(inElement.containedNamespaces[i]);
				}
			}

			if(inElement.containedClasses)
			{
				for(i = 0; i < inElement.containedClasses.length; ++i)
				{
					aUML += "class " + inElement.containedClasses[i].name + "\n";
				}
			}

			aUML += "}\n";

			return aUML;
		}
		//!!endMethod: _createNamespaceDiagramSection



		/*!!
			* document: beginMethod
			* name: _createClassDiagram
			* description: creates and saves a class diagram for the given class element
			* parameters:[
				{
					* name: inElement
					* types: ["object"]
					* description: documentation element object
				}
			]
			* returns: undefined
		*/
		,_createClassDiagram : function _createClassDiagram(inElement)
		{
			var aUML
				;

			aUML = "@startuml\n";
			aUML += this._createClassDiagramSection(inElement, true);
			aUML += "@enduml\n";
			//console.info(aUML);

			plantuml.generate(
				aUML
				,{format : 'svg' }	//options
				,function callback(inError)
				{
					if(inError){console.error(arguments);}
				}
			).out.pipe(
				fs.createWriteStream(
					this._myTargetDirectory + 'classes/images/' + this._getFullElementName(inElement) + ".svg"
				)
			);
		}
		//!!endMethod: _createClassDiagram



		/*!!
			* document: beginMethod
			* name: _createClassDiagramSection
			* description: returns recursive uml section linking class with parents and children
			* parameters:
			[
				{
					* name: inElement
					* types: ["object"]
					* description: documentation element object
				},
				{
					* name: inRenderChildren
					* types: ["boolean"]
					* description: to render child classes or not
				}
			]
			* returns: string
		*/
		,_createClassDiagramSection : function _createClassDiagramSection(
			inElement
			,inRenderChildren
			//!!TODO Feature 9: ?inRenderParents?
		)
		{
			var aUML
				,aParent
				,aParentName
				,aElementFullname
				,i
				;

			aUML = "";

			aElementFullname = this._getFullElementName(inElement);

			if(inElement.parents)
			{
				for(i = 0; i < inElement.parents.length; ++i)
				{
					aParentName = inElement.parents[i];
					aParent = this._myAllElements[inElement.parents[i]];
					aUML += this._createClassDiagramSection(aParent);
					//inherit:
					aUML += aParentName + " <|-- " + aElementFullname + "\n";
				}
			}

			//Actual class w/members
			aUML += this._createClassDiagramClass(inElement, true);

			if(inElement.childClasses && inRenderChildren)//TODO render children recursively without the regular properties or parents
			{
				for(i = 0; i < inElement.childClasses.length; ++i)
				{
					//aParent = this._myAllElements[inElement.parents[i]];
					aUML += this._getFullElementName(inElement) + " <|-- " + inElement.childClasses[i] + "\n";
				}
			}

			return aUML;
		}
		//!!endMethod: _createClassDiagramSection



		/*!!
			* document: method
			* name:  _createClassDiagramClass
			* description: returns uml for the class
			* parameters:
				[
					{
						* name: inElement
						* types: ["object"]
						* description: documentation element object
					},
					{
						* name: inUseFullName
						* types: ["boolean"]
						* description: use the full path name of the class
					}
				]
			* returns: string
		*/
		,_createClassDiagramClass : function _createClassDiagramClass(inElement, inUseFullName)
		{
			var aName
				,aUML
				,i
				;

			aName = (inUseFullName? this._getFullElementName(inElement) : inElement.name);

			aUML = "class " + aName + " {\n";
			if(inElement.containedMembers)
			{
				for(i = 0; i < inElement.containedMembers.length; ++i)
				{
					if(inElement.containedMembers[i].name.indexOf('$') === 0
						|| inElement.containedMembers[i].name.indexOf('_$') === 0)
					{
						aUML += "{static} ";
					}
					if(
						inElement.containedMembers[i].name.charAt(0) === '_'
						&& inElement.containedMembers[i].name
							.charAt(inElement.containedMembers[i].name.length - 1) === '_'
					)
					{
						aUML += "-" + inElement.containedMembers[i].name + "\n";
					}
					else if(inElement.containedMembers[i].name.charAt(0) === '_')
					{
						aUML += "#" + inElement.containedMembers[i].name + "\n";
					}
					else
					{
						aUML += "+" + inElement.containedMembers[i].name + "\n";
					}
				}
			}
			if(inElement.containedMethods)
			{
				for(i = 0; i < inElement.containedMethods.length; ++i)
				{
					if(inElement.containedMethods[i].name.indexOf('$') === 0
						|| inElement.containedMethods[i].name.indexOf('_$') === 0)
					{
						aUML += "{static} ";
					}
					if(
						inElement.containedMethods[i].name.charAt(0) === '_'
						&& inElement.containedMethods[i].name
							.charAt(inElement.containedMethods[i].name.length - 1) === '_'
					)
					{
						aUML += "-" + inElement.containedMethods[i].name + "()\n";
					}
					else if(inElement.containedMethods[i].name.charAt(0) === '_')
					{
						aUML += "#" + inElement.containedMethods[i].name + "()\n";
					}
					else
					{
						aUML += "+" + inElement.containedMethods[i].name + "()\n";
					}
				}
			}
			aUML += "}\n";

			return aUML;
		}



		/*!!
			@ beginMethod: _createMethodDiagram
			* parameters:[
				* parameter ["object"] inElement: documentation element
			]
			* returns: undefined
			* description: creates activity/flow control diagram
		*/
		,_createMethodDiagram : function _createMethodDiagram(inElement)
		{
			var aUML
				;

			aUML = "@startuml\n";
			aUML += inElement.inlineUml;
			aUML += "@enduml\n";
			//console.info(aUML);

			plantuml.generate(
				aUML
				,{format : 'svg' }	//options
				,function callback(inError)
				{
					if(inError){console.error(arguments);}
				}
			).out.pipe(
				fs.createWriteStream(
					this._myTargetDirectory + 'methods/images/' + this._getFullElementName(inElement) + ".svg"
				)
			);
		}
		//!!endMethod: _createMethodDiagram



		/*!!
			* document: beginMethod
			* name: _writeHtmlFile
			* description: Write out an HTML file
			* parameters:
			[
				{
					* name: inPath
					* types: ["string"]
					* description: Path to output file
				},
				{
					* name: inContent
					* types: ["string"]
					* description: Content to write to the file
				}
			]
			* returns: undefined

		*/
		,_writeHtmlFile : function _writeHtmlFile(inPath, inContent)
		{
			//Make directory for the file
			ECGame.WebServerTools.mkdirRecursiveSync(this._myTargetDirectory + inPath);

			//write the file
			fs.writeFileSync(this._myTargetDirectory + inPath + ".html", inContent);
		}//!!endMethod: _writeHtmlFile



		/*!!
			* document: beginMethod
			* name: _writeNamespaceFiles
			* description: write the namespace html files
			* parameters:[]
			* returns: undefined
		*/
		,_writeNamespaceFiles : function _writeNamespaceFiles()
		{
			var aNamespaceIndex
				,aNamespace
				,anAlphabetized
				;

			anAlphabetized = [];

			//write the actual namespaces:
			for(aNamespaceIndex in this._myNamespaces)
			{
				aNamespace = this._myNamespaces[aNamespaceIndex];
				anAlphabetized.push(aNamespace);///////////
				this._writeHtmlFile(
					'namespaces/' + this._getFullElementName(aNamespace)
					,this._myTemplates.base(
						{
							body:
								this._myTemplates.mainFrameBase(
									{ body: this._myTemplates.namespace(aNamespace) }
								)
						}
					)
				);
			}

			anAlphabetized.sort(this._$elementSort);

			//write the index:
			this._writeHtmlFile(
				'namespacesIndex'
				,this._myTemplates.base(
					{
						body:this._myTemplates.namespacesIndex(
							{namespaces: anAlphabetized}
						)
					}
				)
			);
		}
		//!!endMethod: _writeNamespaceFiles



		/*!!
			* document: beginMethod
			* name: _writeClassFiles
			* description: write the class html files
			* parameters:[]
			* returns: undefined
		*/
		,_writeClassFiles : function _writeClassFiles()
		{
			var aClassIndex
				,aClass
				;

			this._writeHtmlFile(
				'classesIndex'
				,this._myTemplates.base(
					{
						body:this._myTemplates.classesIndex(
							{classes: this._myClasses}
						)
					}
				)
			);

			for(aClassIndex in this._myClasses)
			{
				aClass = this._myClasses[aClassIndex];
				this._writeHtmlFile(
					'classes/' + this._getFullElementName(aClass)
					,this._myTemplates.base(
						{
							body:
								this._myTemplates.mainFrameBase(
									{ body: this._myTemplates.class(aClass) }
								)
						}
					)
				);
			}
		}
		//!!endMethod: _writeClassFiles



		/*!!
			* document: beginMethod
			* name: _writeFileFiles
			* description: write the file html files
			* parameters:[]
			* returns: undefined
		*/
		,_writeFileFiles : function _writeFileFiles()
		{
			var aFileIndex
				,aFile
				,i
				;

			this._writeHtmlFile(
				'filesIndex'
				,this._myTemplates.base(
					{
						body:this._myTemplates.filesIndex(
							{files: this._myFiles}
						)
					}
				)
			);

			for(aFileIndex in this._myFiles)
			{
				aFile = this._myFiles[aFileIndex];

				//put this before writing file, then remove it
				//	it allows proper line numbers and id links
				aFile.lines = aFile.sourceCode.match(/\n/g).concat('\n');
				for(i = 0; i < aFile.lines.length; ++i)
				{
					aFile.lines[i] = { text: (i + 1) + aFile.lines[i], id: (i + 1) };
				}

				this._writeHtmlFile(
					'files/' + aFile.fileName
					,this._myTemplates.base(
						{
							body: this._myTemplates.mainFrameBase({body:this._myTemplates.file(aFile)})
						}
					)
				);

				//remove the temporary lines helper
				delete aFile.lines;
			}
		}
		//!!endMethod: _writeFileFiles



		/*!!
			* document: beginMethod
			* name: _writeTODOFiles
			* description: write the todo html files
			* parameters:[]
			* returns: undefined
		*/
		,_writeTODOFiles : function _writeTODOFiles()
		{
			var aTodoIndex
				,aTodo
				,aTodosByPriority
				,aTodosByCategory
				,aTodoCategory, aFinalTodoCategory
				,i
				;

			aTodosByPriority = [];
			aTodosByCategory = {};
			aFinalTodoCategory = [];

			for(aTodoIndex in this._myTodos)
			{
				aTodo = this._myTodos[aTodoIndex];
				aTodo.priority = parseInt(aTodo.priority, 10);
				aTodo.priority = aTodo.priority || 1;
				aTodo.priority = Math.max(aTodo.priority, 1);
				aTodo.priority = Math.min(aTodo.priority, 10);

				aTodosByPriority[aTodo.priority]
					= aTodosByPriority[aTodo.priority]
					|| [];
				aTodosByPriority[aTodo.priority].push(aTodo);

				aTodosByCategory[aTodo.category]
					= aTodosByCategory[aTodo.category]
					|| [];
				aTodosByCategory[aTodo.category].push(aTodo);
			}

			for(i = 0; i < aTodosByPriority.length; ++i)
			{
				aTodosByPriority[i] = aTodosByPriority[i] || [];
				aTodosByPriority[i].sort(this._$todosSort);
			}
			for(aTodoCategory in aTodosByCategory)
			{
				aTodosByCategory[aTodoCategory].sort(this._$todosSort);
				aFinalTodoCategory.push({
					category: aTodoCategory
					,list: aTodosByCategory[aTodoCategory]
				});
			}
			aFinalTodoCategory.sort(
				function(inLeft, inRight)
				{
					return inLeft.category.localeCompare(inRight.category);
				}
			);

			this._writeHtmlFile(
				'todosIndex'
				,this._myTemplates.base(
					{
						body:this._myTemplates.todosIndex(
							{
								todosByPriority: aTodosByPriority
								,todosByCategory: aFinalTodoCategory
							}
						)
					}
				)
			);
		}
		//!!endMethod: _writeTODOFiles

	}//end class description
});
//!!endClass: DocJS

//DocJS:////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////



