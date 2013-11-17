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

/**! @TODO: optional warnings in obfuscate for unnamed functions and wrong naming conventions*/
/**! @TODO: @ link tag */
/**! @TODO: parse element params */
/**! @TODO: file with a loose function in it? */
/**! @TODO: declare method as a listener */
/**! @TODO: @ event name / eventObjectType */
/**! @todo: handle list below: */
/*
	-namespace page			X
	--todos?				X
	--class					X
	--method				X
	--members				X
	-finish class page
	--child classes			O
	--todos					X
	--method:	TYPES
	---todos!!
	---params 
	---returns
	---fires
	---listens
	---etc?
	--members:
	---types
	---desc
	---?
	-finish file page (class like indexes at the top)
	--todos	(2 links?)		1/2
	--namespaces			X
	--classes				X
	--members				
	--method				
	-todo page(s)
	--by priority
	--by file
	--by object path?
	-event page
	--types
	--listeners
	--firers
*/

/**!
	@beginmethod: rmdirRecursive
	/description: recursively removes all files and folders under the specified directory
	/param1: inPath [string] path to the base folder
	/parentNamespace: ECGame.WebServerTools
*/
ECGame.WebServerTools.rmdirRecursive = function rmdirRecursive(inPath)
{
	/**! @todo: this function should go somewhere better */
	var aFileList = [];
	if(fs.existsSync(inPath))
	{
		aFileList = fs.readdirSync(inPath);
		aFileList.forEach(
			function(inFile, inIndex)
			{
				var curPath = inPath + "/" + inFile;
				if(fs.statSync(curPath).isDirectory())
				{
					// recurse
					deleteFolderRecursive(curPath);
				}
				else
				{
					// delete inFile
					fs.unlinkSync(curPath);
				}
			}
		);
		fs.rmdirSync(inPath);
	}
};
/**! @endmethod: rmdirRecursive */


/**!
	@beginclass: DocJS
	/parentNamespace: ECGame.WebServerTools
	/description: This class generates the code documentation html pages
*/
ECGame.WebServerTools.DocJS = ECGame.EngineLib.Class.create({
	Constructor : function DocJS()
	{
		/**!
			@member: _myGeneratedMetaData
			/description: Contains meta data created from parsed documentation comments
			/types: [string]
			/default: null
		*/
		this._myGeneratedMetaData = null;
		/**!
			@member: _mySource
			/description: Contains the source code and file name in an object for each loaded file. Used to iterate over files in main generation loop.
			/types: [[object]]
			/default: []
		*/
		this._mySource = [];
		/**!
			@member: _myStack
			/description: Contains info to detect being inside scope of classes, methods, files, etc.
			/types: [[object]]
			/default: []
		*/
		this._myStack = [];
		/**!
			@member: _myFileNametoSource
			/description: Map linking the filename to the source code. Used in exporting the source file descriptions.
			/types: [object]
			/default: {}
		*/
		this._myFileNametoSource = {};
		/**!
			@member: _myNamespaces
			/description: Map of all namespaces
			/types: [object]
			/default: {}
		*/
		this._myNamespaces = {};
		/**!
			@member: _myClasses
			/description: Map of all classes
			/types: [object]
			/default: {}
		*/
		this._myClasses = {};
		/**!
			@member: _myTodos
			/description: Array of all todos
			/types: [[]]
			/default: []
		*/
		this._myTodos = [];
		/**!
			@member: _myFiles
			/description: Map of all files
			/types: [object]
			/default: {}
		*/
		this._myFiles = {};
		/**!
			@member: _myAllElements
			/description: A map of all elements
			/types: [object]
			/default: {}
		*/
		this._myAllElements = {};
		
		/**!
			@member: _myTagDescriptions
			/description: A map to descriptors of all element types
			/types: [object]
			/default: See file.
		*/
		this._myTagDescriptions =
		{
			_file :
			{
				possibleElements : ['description', 'name'],
				requiredElements : ['description'],
				addToMap : '_myFiles'
			},
			_beginfile :
			{
				stackPush : 'file'
			},
			_endfile :
			{
				stackPop : 'file'
			},
			_namespace :
			{
				possibleElements : ['description', 'parentNamespace'],
				requiredElements : ['description'],
				addToMap : '_myNamespaces'
			},
			_class :
			{
				possibleElements : ['description', 'parentNamespace', 'parents', 'listensTo'],
				requiredElements : ['description', 'parentNamespace'],
				addToMap : '_myClasses'
			},
			_beginclass :
			{
				stackPush : 'class'
			},
			_endclass :
			{
				stackPop : 'class'
			},
			_member :
			{
				possibleElements : ['description', 'types', 'default', 'parentNamespace'],/**! @TODO: consider having type and default required*/
				requiredElements : ['description']
			},
			_method :
			{
				possibleElements : [
					'parentNamespace',
					'description',
					'param1', 'param2', 'param3', 'param4', 'param5', 'param6',
					'returns',
					'fires'
					/**! @todo: listens? */
				],
				requiredElements : ['description']
			},
			_beginmethod :
			{
				stackPush : 'method'
			},
			_endmethod :
			{
				stackPop : 'method'
			},
			_todo :
			{
				possibleElements : ['todo', 'priority', 'example'],/**! @TODO: keep example?? add category?? */
				requiredElements : ['todo'],
				hasNoName : true,
				addToList : '_myTodos'
			}
		};
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		/**!
			@beginmethod: loadDirectory
			/description: Recursively loads all the source files starting at the path.
		*/
		loadDirectory : function loadDirectory(inPath)
		{
			/**! @todo: document param*/
			var aFileList = [],
				aThis;
			
			aThis = this;
			
			if(fs.existsSync(inPath))
			{
				aFileList = fs.readdirSync(inPath);
				aFileList.forEach(
					function(inFile, inIndex)
					{
						var curPath = inPath + "/" + inFile;
						if(fs.statSync(curPath).isDirectory())
						{
							//recurse
							aThis.loadDirectory(curPath);
						}
						else if(curPath.substr(curPath.lastIndexOf('.')).toLowerCase() === '.js')
						{
							//add inFile
							aThis.appendSource(
								fs.readFileSync(curPath, 'utf8'),
								inFile
							);
						}
					}
				);
			}
		},
		/**! @endmethod: loadDirectory */
		
		
		/**!
			@beginmethod: appendSource
			/description: Adds a source file to parse for documentation comments
		*/
		appendSource : function appendSource(inSource, inFileName)
		{
			/**! @TODO: document parameters */
			/**! @TODO: how to handle the filepath '/' etc */
			this._mySource.push({ source : inSource, file : inFileName});
			this._myFileNametoSource[inFileName] = inSource;
		},
		/**! @endmethod: appendSource*/
		
		/**!
			@method: _addMissingFileHeader
			/description: Inserts a dummy file wrapper if one is missing.
		*/
		/**! @todo: document params*/
		_addMissingFileHeader : function _addMissingFileHeader(inElements, inFileName)
		{
			inElements.unshift('\/\*\*! @todo: document file ' + inFileName + ' \*\/');
			inElements.unshift('\/\*\*! @beginfile: ' + inFileName + ' /description: TODO document this file \*\/');
			inElements.push('\/\*\*! @endfile: ' + inFileName + ' \*\/');
		},
		
		/**!
			@method: run
			/description: Parses all loaded source files and generates documentation into html pages.
		*/
		run : function run()
		{
			var i, j,
				anElementsList,
				anElement,
				anElementType,
				anElementName,
				anElementData,
				aStartIndex,
				anEndIndex,
				aLineNumber,
				aFile,
				aNeedForComma,
				aFinalObjectSet,
				aSource,
				anIndex;
			
			ECGame.WebServerTools.rmdirRecursive('../docs/generated');
			
			this._myGeneratedMetaData = '[';
			
			//no leading comma the first loop
			aNeedForComma = false;
			
			for(j = 0; j < this._mySource.length; ++j)
			{
				aFile = this._mySource[j].file;
				aSource = this._mySource[j].source;
				
				//parse out all elements with proper comment blocks
				anElementsList = aSource.match(/(\x2f\x2a\x2a\x21[\S\s]*?\x2a\x2f|\x2f\x2f\x21[^\n]*\n)/g);
				if(!anElementsList)
				{
					anElementsList = [];
					this._addMissingFileHeader(anElementsList, aFile);
				}
				
				for(i = 0; i < anElementsList.length; ++i)
				{
					//if this is not the first element, we need a comma to separate it from the previous one
					if(aNeedForComma)
					{
						this._myGeneratedMetaData += ',';
						aNeedForComma = false;
					}
					
					//get element
					anElement = anElementsList[i];
					
					//get its line number
					aStartIndex = aSource.indexOf(anElement);
					if(aStartIndex === -1)
					{
						aLineNumber = 1;
					}
					else
					{
						aLineNumber = aSource.substr(0, aStartIndex).match(/\n/g).length + 1;
					}
					
					//chop comment off of the element
					anElement = anElement.substring(4, anElement.length - 2);
					
					//get the element type, make sure there is only one type
					anElementType = anElement.match(/@\w*:/g);
					ECGame.log.assert(
						anElementType && anElementType.length === 1,
						"Expected exactly one element type of the form '@type:'" + this._genErrorMessageLocation(aFile, aLineNumber) + '\n' + anElement
					);
					anElementType = anElementType[0];
												
					//find the element name, it ends by the end of the line for sure
					aStartIndex = anElement.indexOf(anElementType) + anElementType.length;
					anEndIndex = anElement.indexOf('\n', aStartIndex);
					anEndIndex = anEndIndex !== -1 ? anEndIndex : anElement.length;
					//element name might end before the new line if the first property is on the same line
					anIndex = anElement.indexOf('/', aStartIndex);
					if(anIndex !== -1 && anIndex < anEndIndex)
					{
						anEndIndex = anIndex;
					}
					anElementName = anElement.substring(aStartIndex, anEndIndex);
					anElementName = anElementName.replace(/\s+/g,'');	/**! @todo: is it needed to get rid of this strings white space */
					
					//cleanup anElementType to final form, make sure there is a function to parse it
					anElementType = anElementType.toLowerCase();
					anElementType = anElementType.substr(1, anElementType.length -2);
					ECGame.log.assert(
						this._myTagDescriptions['_' + anElementType] !== undefined,
						"No tag type of " + anElementType + this._genErrorMessageLocation(aFile, aLineNumber)
					);
					
					
					if(i === 0)
					{
						//if this is the first element in the file, it better be for the file
						if(anElementType === 'file')
						{
							anElementsList[i] = anElementsList[i].replace('file', 'beginfile');
							anElementsList.push('\/\*\*! @endfile: ' + aFile + ' \*\/');
							--i;
							continue;
						}
						//if it isn't for the file, add one, and also a todo: document file
						else if(anElementType !== 'beginfile')
						{
							this._addMissingFileHeader(anElementsList, aFile);
							--i;
							continue;
						}
					}
					
					//parse the rest of the element
					anElementData = {};	/**! @todo: make a class for this */
					anElementData.elementType = anElementType;
					anElementData.elementName = anElementName;
					anElementData.fileName = aFile;
					anElementData.lineNumber = aLineNumber;
					this._parseElementsProperties(anElement, anElementData);
					aNeedForComma = this._genElementJSON(anElementData);
				}
				
				//assert stack is empty as this is the end of the file
				if(this._myStack.length !== 0)
				{
					anElement = this._myStack[this._myStack.length - 1];
					ECGame.log.assert(
						false,
						"Expected end of " + anElement.type + ':' + anElement.name + 
							this._genErrorMessageLocation(aFile, 'EOF')
					);
				}
			}
			//we are finished parsing all code
			this._myGeneratedMetaData += ']';
			
			
			//print the generated metadata
			console.log("Object: " + this._myGeneratedMetaData);
			
			//parse the final object set from the meta data
			aFinalObjectSet = JSON.parse(this._myGeneratedMetaData);
			
			//test print the objects a couple of ways
			//console.log("Object: " + JSON.stringify(aFinalObjectSet));
			//console.dir(aFinalObjectSet);

			//fix up object references to/within the final object set
			this._indexCoreTypes(aFinalObjectSet);
			this._includeAllInParentNamespaces(aFinalObjectSet);
			this._includeTodosInAllAncestorElements();
			this._includeAllObjectsInTheirFileObject();
			//print the lists we have gathered
			//console.log(this._myNamespaces);
			//console.log(this._myClasses);
			//console.log(this._myTodos);
			//console.log(this.??);
			
			//output the actual documentation
			this.generateHtmlFiles();
		},

		/**!
			@method: _includeAllObjectsInTheirFileObject
			/description: Adds all documentation objects to their file metadata object
		*/
		_includeAllObjectsInTheirFileObject : function _includeAllObjectsInTheirFileObject()
		{
			var anObjectPath
				,anObject
				,aFileObject
				;
			
			for(anObjectPath in this._myAllElements)
			{
				anObject = this._myAllElements[anObjectPath];
				if(anObject.elementType !== 'file')
				{
					aFileObject = this._myFiles[anObject.fileName];
					if(aFileObject)
					{
						if(!aFileObject.members)
						{
							aFileObject.members = [];
						}
						if(aFileObject.members.indexOf(anObject) === -1)
						{
							aFileObject.members.push(anObject);
						}
					}
				}
			}
		},
		
		/**!
			@method: _includeTodosInAllAncestorElements
			/description: Adds all todo items to ancestor metadata objects
		*/
		_includeTodosInAllAncestorElements : function _includeTodosInAllAncestorElements()
		{
			var i, j
				,anObject
				,aParentObject
				;
			
			for(i = 0; i < this._myTodos.length; ++i)
			{
				anObject = this._myTodos[i];
				aParentObject = this._myAllElements[anObject.parentNamespace];
				while(aParentObject)
				{
					if(!aParentObject.members)
					{
						aParentObject.members = [];
					}
					if(aParentObject.members.indexOf(anObject) === -1)
					{
						aParentObject.members.push(anObject);
					}
					aParentObject = this._myAllElements[aParentObject.parentNamespace];
				}
			}
		},
		
		/**!
			@method: _includeAllInParentNamespaces
			/description: Adds all documentation objects to their parentnamespace object
		*/
		_includeAllInParentNamespaces : function _includeAllInParentNamespaces(inFinalObjectSet)
		{
			var anObject,
				aParentObject,
				i;
				
			for(i = 0; i < inFinalObjectSet.length; ++i)
			{
				anObject = inFinalObjectSet[i];
				aParentObject = this._myAllElements[anObject.parentNamespace];
				if(aParentObject)
				{
					if(!aParentObject.members)
					{
						aParentObject.members = [];
					}
					if(aParentObject.members.indexOf(anObject) === -1)
					{
						aParentObject.members.push(anObject);
					}
				}
				if(anObject.members)
				{
					this._includeAllInParentNamespaces(anObject.members);
				}
			}
		},

		/**!
			@beginmethod: _indexCoreTypes
			/description: Creates index of parsed metadata objects
		*/
		_indexCoreTypes : function _indexCoreTypes(inFinalObjectSet)
		{
			/**! @todo: rename function and document param */
			var anElementTypeDescription,
				anObject,
				i, j;
				
			for(i = 0; i < inFinalObjectSet.length; ++i)
			{
				anObject = inFinalObjectSet[i];
				
				anElementTypeDescription = this._myTagDescriptions['_' + anObject.elementType];
				if(anElementTypeDescription.addToList)
				{
					this[anElementTypeDescription.addToList].push(anObject);
				}
				if(anElementTypeDescription.addToMap)
				{
					this[anElementTypeDescription.addToMap][this.getObjectsFullPathName(anObject)] = anObject;
				}
				this._myAllElements[this.getObjectsFullPathName(anObject)] = anObject;
				if(anObject.members)
				{
					for(j = 0; j < anObject.members.length; ++j)
					{
						if(anObject.elementType !== 'file')
						{
							anObject.members[j].parentNamespace = 
								(anObject.parentNamespace ? anObject.parentNamespace + '.' : '') +
								anObject.elementName;
						}
					}
					this._indexCoreTypes(anObject.members);
				}
			}
		},
		/**! @endmethod: _indexCoreTypes */
		
		/**!
			@method: getObjectsFullPathName
			/description: Gets the full name index for an object based on its parent namespaces
		*/
		/** @todo: document parameter */
		getObjectsFullPathName : function getObjectsFullPathName(inObject)
		{
			if(inObject.parentNamespace)
			{
				return inObject.parentNamespace + '.' + inObject.elementName;
			}
			return inObject.elementName;
		},
		
		/** @todo: keep documenting file from here */
		
		_parseElementsProperties : function _parseElementsProperties(inElement, outElementData)
		{
			var anElementPropertyNames,
				anElementPropertyValues,
				aStartIndex,
				anEndIndex,
				i;
			
			//get rid of unneeded whitespace and then find the property names
			inElement = inElement.replace(/[\t\n\r]+/g, '');
			inElement = inElement.replace(/@todo:/gi, '/todo:');	/**! @TODO: why did I do this?? */
			anElementPropertyNames = inElement.match(/\/[^\/:\s]*:/g);
			if(!anElementPropertyNames)
			{
				outElementData.elementPropertyNames = [];
				outElementData.elementPropertyValues = [];
				return;
			}
			
			aStartIndex = 0;
			anEndIndex = 0;
			anElementPropertyValues = [];
			
			//find property values and clean property names
			for(i = 0; i < anElementPropertyNames.length - 1; ++i)
			{
				aStartIndex = inElement.indexOf(anElementPropertyNames[i], aStartIndex) + anElementPropertyNames[i].length + 1;
				anEndIndex = inElement.indexOf(anElementPropertyNames[i + 1], aStartIndex/* + 1*/);
				anElementPropertyValues.push(inElement.substring(aStartIndex, anEndIndex));
				anElementPropertyNames[i] = anElementPropertyNames[i].substring(1, anElementPropertyNames[i].length - 1);
			}
			aStartIndex = inElement.indexOf(anElementPropertyNames[i], aStartIndex) + anElementPropertyNames[i].length + 1;
			anElementPropertyValues.push(inElement.substring(aStartIndex, inElement.length));
			anElementPropertyNames[i] = anElementPropertyNames[i].substring(1, anElementPropertyNames[i].length - 1);

			//put our names and values into the out data
			outElementData.elementPropertyNames = anElementPropertyNames;
			outElementData.elementPropertyValues = anElementPropertyValues;
		},
		
		_parseElementProperty : function _parseElementProperty(inPropertyType, inProperty)
		{
			if('parents' === inPropertyType)
			{
				inProperty = inProperty.replace(/\s*/g, '');
				return JSON.stringify(inProperty.split(','));
			}
			/**! @todo: other types */
			
			return '\"' + inProperty + '\"';
		},
		
		_genErrorMessageLocation : function _genErrorMessageLocation(inFileName, inLineNumber)
		{
			return " at: " + inFileName + ':' + inLineNumber;
		},
		_genErrorMessageLocationFromElementData : function _genErrorMessageLocationFromElementData(inElementData)
		{
			return " in: @" + inElementData.elementType + ":" + inElementData.elementName + this._genErrorMessageLocation(inElementData.fileName, inElementData.lineNumber);
		},
		
		_genElementJSON : function _genElementJSON(inElementData)
		{
			var i,
				aPossibleElements,
				aRequiredElements,
				anElementTypeDescription,
				aStackElement,
				aStackPush,
				anIndex;
			
			//get the element type description
			anElementTypeDescription = this._myTagDescriptions['_' + inElementData.elementType];
			ECGame.log.assert(
				anElementTypeDescription,
				"Unknown element tag \'" + inElementData.elementType + '\'' + this._genErrorMessageLocationFromElementData(inElementData)
			);
			
			//if it is a stack element push it, and get the real description
			if(anElementTypeDescription.stackPush)
			{
				aStackPush = anElementTypeDescription.stackPush;
				inElementData.elementType = aStackPush;
				this._myStack.push(
					{
						type : inElementData.elementType,
						name : inElementData.elementName
					}
				);
				anElementTypeDescription = this._myTagDescriptions['_' + inElementData.elementType];
				ECGame.log.assert(
					anElementTypeDescription,
					"Unknown element tag \'" + inElementData.elementType + '\'' + this._genErrorMessageLocationFromElementData(inElementData)
				);
			}
			//if it is an end of stack element pop it and return
			if(anElementTypeDescription.stackPop)
			{
				aStackElement = this._myStack.pop();
				ECGame.log.assert(
					aStackElement.type === anElementTypeDescription.stackPop && aStackElement.name === inElementData.elementName,
					"Expected end of \'" + aStackElement.type + ':' + aStackElement.name + '\'' + this._genErrorMessageLocationFromElementData(inElementData)
				);
				
				//if the last character is a ',' then chop it off
				anIndex = this._myGeneratedMetaData.length - 1;
				if(this._myGeneratedMetaData[anIndex] === ',')
				{
					this._myGeneratedMetaData = this._myGeneratedMetaData.substring(0, anIndex);
				}
				
				//end the block and return
				this._myGeneratedMetaData += ']}';
				return true;
			}
			
			//if this type should have no name, get rid of it.
			if(anElementTypeDescription.hasNoName)
			{
				inElementData.elementName = inElementData.fileName + ':' + inElementData.lineNumber;
			}
			
			aPossibleElements = anElementTypeDescription.possibleElements;
			aRequiredElements = anElementTypeDescription.requiredElements;
			for(i = 0; i < inElementData.elementPropertyNames.length; ++i)
			{
				ECGame.log.assert(aPossibleElements.indexOf(inElementData.elementPropertyNames[i]) !== -1,
					"Unexpected element property: \'" + inElementData.elementPropertyNames[i] + "\'" + 
						this._genErrorMessageLocationFromElementData(inElementData)
				);
			}
			for(i = 0; i < aRequiredElements.length; ++i)
			{
				ECGame.log.assert(inElementData.elementPropertyNames.indexOf(aRequiredElements[i]) !== -1,
					"Expected element property: \'" + aRequiredElements[i] + "\' not found" + 
						this._genErrorMessageLocationFromElementData(inElementData)
				);
			}
			
			this._myGeneratedMetaData += '{';
			this._myGeneratedMetaData += '\"elementType\" : \"' + inElementData.elementType + '\"';
			this._myGeneratedMetaData += ', \"elementName\" : \"' + inElementData.elementName + '\"';
			this._myGeneratedMetaData += ', \"fileName\" : \"' + inElementData.fileName + '\"';
			this._myGeneratedMetaData += ', \"lineNumber\" : \"' + inElementData.lineNumber + '\"';
			for(i = 0; i < inElementData.elementPropertyNames.length; ++i)
			{
				this._myGeneratedMetaData += ', \"' + inElementData.elementPropertyNames[i] + '\" : '
					+ this._parseElementProperty(
						inElementData.elementPropertyNames[i],
						inElementData.elementPropertyValues[i]
					);
			}
			if(aStackPush)
			{
				this._myGeneratedMetaData += ', \"members\" : [';
				return false;
			}
			else
			{
				this._myGeneratedMetaData += '}';
				return true;
			}
		},
		
		generateHtmlFiles : function generateHtmlFiles()
		{
			var fileHead
				,fileTail
				;
			
			fs.mkdirSync('../docs/generated', function doNothing(){return;});
			
			fileHead =
				"<!DOCTYPE html>\n" +
				"<html>\n" +
				"	<head>\n" +
				"		<link rel=\"stylesheet\" type=\"text/css\" href=\"../docs.css\">\n" +
				"	</head>\n" +
				"	<body>\n";
			fileTail =
				"	</body>\n" +
				"</html>\n";

			//export indexes
			this.exportMasterIndex(fileHead, fileTail);
			this.exportNamespaceIndex(fileHead, fileTail);
			this.exportClassIndex(fileHead, fileTail);
			this.exportFileIndex(fileHead, fileTail);
			this.exportTodoIndex(fileHead, fileTail);
			
			//header tag for all the reference files
			fileHead += "<h1>EmpathicCivGameEngine</h1>";
			
			//export actual refrence files
			/**! @todo: export welcome page */
			this.exportNamespaces(fileHead, fileTail);
			this.exportClasses(fileHead, fileTail);
			this.exportFiles(fileHead, fileTail);
			/**! @todo: export todos */
		},
		
		exportMasterIndex : function exportMasterIndex(inFileHead, inFileTail)
		{
			var aStringForFile;
			
			//write indexes:
			aStringForFile = inFileHead;
			aStringForFile += "<a href=\"namespacesIndex.html\" target=\"indexFrame\" >Namespaces</a><br>\n";
			aStringForFile += "<a href=\"classesIndex.html\" target=\"indexFrame\" >Classes</a><br>\n";
			aStringForFile += "<a href=\"filesIndex.html\" target=\"indexFrame\" >Files</a><br>\n";
			aStringForFile += "<a href=\"todosIndex.html\" target=\"indexFrame\" >Todo's</a><br>\n";
			aStringForFile += inFileTail;
			fs.writeFileSync("../docs/generated/masterIndex.html", aStringForFile);
		},
		
		exportNamespaceIndex : function exportNamespaceIndex(inFileHead, inFileTail)
		{
			var aStringForFile
				,aName
				;
			
			//write namespaces
			aStringForFile = inFileHead;
			for(aName in this._myNamespaces)
			{
				aStringForFile +=
					"<a href=\"" + aName + ".html\" target=\"mainFrame\" >"
					+ aName
					+ "</a><br>\n";
			}
			aStringForFile += inFileTail;
			fs.writeFileSync("../docs/generated/namespacesIndex.html", aStringForFile);
		},
		
		exportClassIndex : function exportClassIndex(inFileHead, inFileTail)
		{
			var aStringForFile
				,aName
				;
			
			aStringForFile = inFileHead;
			for(aName in this._myClasses)
			{
				aStringForFile += "<a href=\"" + aName + ".html\" target=\"mainFrame\" >"
					+ aName
					+ "</a><br>\n";
			}
			aStringForFile += inFileTail;
			fs.writeFileSync("../docs/generated/classesIndex.html", aStringForFile);
		},
		
		exportFileIndex : function exportFileIndex(inFileHead, inFileTail)
		{
			var aStringForFile
				,aName
				;
			
			aStringForFile = inFileHead;
			for(aName in this._myFiles)
			{
				aStringForFile += "<a href=\"" + aName + ".html\" target=\"mainFrame\" >"
					+ aName
					+ "</a><br>\n";
			}
			aStringForFile += inFileTail;
			fs.writeFileSync("../docs/generated/filesIndex.html", aStringForFile);
		},
		
		exportTodoIndex : function exportTodoIndex(inFileHead, inFileTail)
		{
			var aStringForFile
				,aName
				,anElement
				;
			
			aStringForFile = inFileHead;
			for(aName in this._myTodos)
			{
				anElement = this._myTodos[aName];
				aStringForFile +=
					"<a href=\"" + anElement.fileName + '.html#' + anElement.lineNumber + "\" target=\"mainFrame\" >"
					+ anElement.elementName
					+ "</a><br>\n";
			}
			aStringForFile += inFileTail;
			fs.writeFileSync("../docs/generated/todosIndex.html", aStringForFile);
		},
		
		/**! @todo: namespaces page should look MUCH like classes page. Extract functionality so we can share it between them! */
		exportNamespaces : function exportNamespaces(inFileHead, inFileTail)
		{
			var aStringForFile
				,aName
				,anElement
			//	,subName
				,subElement
				,i
				,aFullPathName
				;
				
			for(aName in this._myNamespaces)
			{
				//get the namespace object
				anElement = this._myNamespaces[aName];

				
				//write the header of the namespace file
				aStringForFile = inFileHead;
				aStringForFile += "<h2>Namespace: " + anElement.elementName + "</h2>\n";
				aStringForFile += "<ul>\n";
				aStringForFile += "<li>Description: " + anElement.description + "</li>\n";
				if(anElement.parentNamespace)
				{
					aStringForFile += "<li>Parent Namespace: "
						+ "<a href=\"" + anElement.parentNamespace + ".html\" target=\"mainFrame\" >"
						+ anElement.parentNamespace
						+ "</a></li>\n";
				}
				aStringForFile +=
					"<li>Location: <a href=\"" + anElement.fileName + '.html#' + anElement.lineNumber + "\" target=\"mainFrame\" >"
					+ anElement.fileName + ':' + anElement.lineNumber
					+ "</a></li>\n";
				aStringForFile += "</ul>\n";
				
				aStringForFile = this._writeTodoIndex(aStringForFile, anElement);
				
				//write the namespaces list
				aStringForFile += "<h3>Child Namespaces:</h3>\n";
				aStringForFile += "<ul>\n";
				anElement.members = anElement.members || [];
				for(i = 0; i < anElement.members.length; ++i)
				{
					subElement = anElement.members[i];
					if(subElement.elementType === 'namespace')
					{
						aFullPathName = this.getObjectsFullPathName(subElement);
						aStringForFile += "<li><a href=\"" + aFullPathName + ".html\" target=\"mainFrame\" >"
							+ aFullPathName
							+ "</a></li>\n";
					}
				}
				aStringForFile += "</ul>\n";
				
				//write the class list
				aStringForFile += "<h3>Classes:</h3>\n";
				aStringForFile += "<ul>\n";
				for(i = 0; i < anElement.members.length; ++i)
				{
					subElement = anElement.members[i];
					if(subElement.elementType === 'class')
					{
						aStringForFile += "<li><a href=\"" + this.getObjectsFullPathName(subElement) + ".html\" target=\"mainFrame\" >"
							+ subElement.elementName
							+ "</a></li>\n";
					}
				}
				aStringForFile += "</ul>\n";
				
				/**! @todo: members */
				aStringForFile = this._writeMemberIndex(aStringForFile, anElement);
				/**! @todo: methods body needs to be written out and properly linked too!!! */
				aStringForFile = this._writeMethodIndex(aStringForFile, anElement);
				
				
				aStringForFile = this._writeTodoList(aStringForFile, anElement);
				aStringForFile = this._writeMemberList(aStringForFile, anElement);
				aStringForFile = this._writeMethodList(aStringForFile, anElement);
				
				aStringForFile += inFileTail;
				fs.writeFileSync("../docs/generated/" + aName + ".html", aStringForFile);
			}
		},
		
		_writeTodoIndex : function _writeTodoIndex(aStringForFile, anElement)
		{
			aStringForFile += "<h3>Todo's:</h3>\n";
			aStringForFile += "<ul>\n";
			if(anElement.members)
			{
				for(i = 0; i < anElement.members.length; ++i)
				{
					subElement = anElement.members[i];
					if(subElement.elementType === 'todo')
					{
						aStringForFile += "<li><a href=\"#" + subElement.elementName + "\">"
							+ subElement.todo
							+ "</a>"/**! @todo: link these two also: function and file locations? */
							+ ' (' + this._myAllElements[subElement.parentNamespace].elementName + '--' + subElement.elementName + ')'
							+ "</li>\n";
					}
				}
			}
			aStringForFile += "</ul>\n";
			
			return aStringForFile;
		},
		_writeTodoList : function _writeTodoList(aStringForFile, anElement)
		{
			//add a horizontal break before we show detailed versions
			aStringForFile += "<hr/>\n";
			aStringForFile += "<h3>Todo's:</h3>\n";
			if(anElement.members)
			{
				for(i = 0; i < anElement.members.length; ++i)
				{
					subElement = anElement.members[i];
					if(subElement.elementType === 'todo')
					{
						aStringForFile += "<h4 id=" + subElement.elementName + ">Todo: "
							+ subElement.todo + ' (' + subElement.elementName + ')'
							+ "</h4>\n";
						aStringForFile += "<ul>\n";
						aStringForFile += "<li>Description: " + subElement.todo + "</li>\n";
						aStringForFile += "<li>priority: " + subElement.priority + "</li>\n";
						/**! @todo: priority, category */
						aStringForFile += "<li>Location: <a href=\"" + subElement.fileName + '.html#' + subElement.lineNumber + "\" target=\"mainFrame\" >"
							+ subElement.fileName + ':' + subElement.lineNumber
							+ "</a></li>\n";
						aStringForFile += "</ul>\n";
					}
				}
			}
			
			return aStringForFile;
		},
		_writeMemberIndex : function _writeMemberIndex(aStringForFile, anElement)
		{
			aStringForFile += "<h3>Members:</h3>\n";
			aStringForFile += "<ul>\n";
			if(anElement.members)
			{
				for(i = 0; i < anElement.members.length; ++i)
				{
					subElement = anElement.members[i];
					if(subElement.elementType === 'member')
					{
						aStringForFile += "<li><a href=\"#" + subElement.elementName + "\">"
							+ subElement.elementName
							+ "</a></li>\n";
					}
				}
			}
			aStringForFile += "</ul>\n";
			
			return aStringForFile;
		},
		_writeMemberList : function _writeMemberList(aStringForFile, anElement)
		{
			//add a horizontal break before we show detailed versions
			aStringForFile += "<hr/>\n";
			aStringForFile += "<h3>Members:</h3>\n";
			if(anElement.members)
			{
				for(i = 0; i < anElement.members.length; ++i)
				{
					subElement = anElement.members[i];
					if(subElement.elementType === 'member')
					{
						aStringForFile += "<h4 id=" + subElement.elementName + ">Member: " + subElement.elementName + "</h4>\n";
						aStringForFile += "<ul>\n";
						aStringForFile += "<li>Description: " + subElement.description + "</li>\n";
						/**! @todo: types + default */
						
						/**! @todo: namespace (if in namespace not class; for other types of locations?) */
						
						aStringForFile += "<li>Location: <a href=\"" + subElement.fileName + '.html#' + subElement.lineNumber + "\" target=\"mainFrame\" >"
							+ subElement.fileName + ':' + subElement.lineNumber
							+ "</a></li>\n";
						aStringForFile += "</ul>\n";
					}
				}
			}
			return aStringForFile;
		},
		_writeMethodIndex : function _writeMethodIndex(aStringForFile, anElement)
		{
			aStringForFile += "<h3>Methods:</h3>\n";
			aStringForFile += "<ul>\n";
			if(anElement.members)
			{
				for(i = 0; i < anElement.members.length; ++i)
				{
					subElement = anElement.members[i];
					if(subElement.elementType === 'method')
					{
						aStringForFile += "<li><a href=\"#" + subElement.elementName + "\">"
							+ subElement.elementName + '('
							/**! @todo: params */
							+ ')'
							+ "</a></li>\n";
					}
				}
			}
			aStringForFile += "</ul>\n";
			
			return aStringForFile;
		},
		_writeMethodList : function _writeMethodList(aStringForFile, anElement)
		{
			//add a horizontal break before we show detailed versions
			aStringForFile += "<hr/>\n";
			aStringForFile += "<h3>Methods:</h3>\n";
			if(anElement.members)
			{
				for(i = 0; i < anElement.members.length; ++i)
				{
					subElement = anElement.members[i];
					if(subElement.elementType === 'method')
					{
						/**! @todo: write prototype / interface here: */
						aStringForFile += "<h4 id=" + subElement.elementName + ">Method: " + subElement.elementName + "</h4>\n";
						aStringForFile += "<ul>\n";
						aStringForFile += "<li>Description: " + subElement.description + "</li>\n";
						/**! @todo: param */
						/**! @todo: returns */
						/**! @todo: fires */
						/**! @todo: todo's (need to chain up!!) */
						
						/**! @todo: namespace (if in namespace not class) */
						
						aStringForFile += "<li>Location: <a href=\"" + subElement.fileName + '.html#' + subElement.lineNumber + "\" target=\"mainFrame\" >"
							+ subElement.fileName + ':' + subElement.lineNumber
							+ "</a></li>\n";
						aStringForFile += "</ul>\n";
					}
				}
			}
			
			return aStringForFile;
		},
		
		exportClasses : function exportClasses(inFileHead, inFileTail)
		{
			var aStringForFile
				,aName
				,anElement
				,subName
				,subElement
				,i
				;
			
			for(aName in this._myClasses)
			{
				//write the header of the class file
				aStringForFile = inFileHead;
				anElement = this._myClasses[aName];
				aStringForFile += "<h2>Class: " + anElement.elementName + "</h2>\n";
				aStringForFile += "<ul>\n";
				aStringForFile += "<li>Description: " + anElement.description + "</li>\n";
				/**! @todo: listensTo */
				aStringForFile += "<li>Namespace: <a href=\"" + anElement.parentNamespace + ".html\" target=\"mainFrame\" >"
					+ anElement.parentNamespace
					+ "</a></li>\n";
				if(anElement.parents)
				{
					aStringForFile += "<li>Parents: ";
					for(i = 0; i < anElement.parents.length; ++i)
					{
						if(0 !== i)
						{
							aStringForFile += ', ';
						}
						aStringForFile += "<a href=\"" + anElement.parents[i] + ".html\" target=\"mainFrame\" >"
							+ anElement.parents[i]
							+ "</a>\n";
					}
					aStringForFile += "</li>\n";
				}
				aStringForFile +=
					"<li>Location: <a href=\"" + anElement.fileName + '.html#' + anElement.lineNumber + "\" target=\"mainFrame\" >"
					+ anElement.fileName + ':' + anElement.lineNumber
					+ "</a></li>\n";
				aStringForFile += "</ul>\n";
				
				
				//write the todo list
				aStringForFile = this._writeTodoIndex(aStringForFile, anElement);
				
				//write the member list
				aStringForFile = this._writeMemberIndex(aStringForFile, anElement);
				
				//write the method list
				aStringForFile = this._writeMethodIndex(aStringForFile, anElement);
				
				//write the actual todo's
				aStringForFile = this._writeTodoList(aStringForFile, anElement);
				
				//write the actual members
				aStringForFile = this._writeMemberList(aStringForFile, anElement);
				
				//write the actual methods
				aStringForFile = this._writeMethodList(aStringForFile, anElement);
				
				aStringForFile += inFileTail;
				fs.writeFileSync("../docs/generated/" + aName + ".html", aStringForFile);
			}
		},
		
		exportFiles : function exportFiles(inFileHead, inFileTail)
		{
			var keywordList
				,aName
				,aStringForFile
				,anElement
				,aSource
				,i,j
				,keyWordInstances
				,aStartCommentIndex
				,anEndCommentIndex
				,isComment
				;
				
			/**! @todo: share keyword list with the obfuscator */
			keywordList = [
				'this'
				,'prototype'
				,'break'
				,'const'
				,'continue'
				,'delete'
				,'do'
				,'export'
				,'for'
				,'function'
				,'if'
				,'else'
				,'import'
				,'in'
				,'instanceOf'
				,'label'
				,'let'
				,'new'
				,'return'
				,'switch'
				,'case'
				,'this'
				,'throw'
				,'try'
				,'catch'
				,'typeof'
				,'var'
				,'void'
				,'while'
				,'with'
				,'yield'
				,'true'
				,'false'
				,'null'
				,'undefined'
				,'number'
				,'string'
				,'boolean'
				,'object'
				,'apply'
			];
			//write files
			for(aName in this._myFiles)
			{
				aStringForFile = inFileHead;
				anElement = this._myFiles[aName];
				aStringForFile += "<h2>File: " + anElement.elementName + "</h2>\n";
				aStringForFile += "<ul>\n";
				aStringForFile += "<li>Description: " + anElement.description + "</li>\n";
				aStringForFile += "</ul>\n";

				
				//write the todo list
				aStringForFile += "<h3>Todo's:</h3>\n";
				aStringForFile += "<ul>\n";
				for(i = 0; i < anElement.members.length; ++i)
				{
					subElement = anElement.members[i];
					if(subElement.elementType === 'todo')
					{
						/**! @todo: two links: todo page + file location*/
						aStringForFile += "<li><a href=\"#" + subElement.lineNumber + "\">"
							+ subElement.todo
							+ "</a>"
							+ ' (' + subElement.elementName + ')'
							+ "</li>\n";
					}
				}
				aStringForFile += "</ul>\n";
				
				
				//write the namespaces list
				aStringForFile += "<h3>Namespaces:</h3>\n";
				aStringForFile += "<ul>\n";
				for(i = 0; i < anElement.members.length; ++i)
				{
					subElement = anElement.members[i];
					if(subElement.elementType === 'namespace')
					{
						aStringForFile +=
							"<li><a href=\"" + this.getObjectsFullPathName(subElement) + ".html\" target=\"mainFrame\" >"
							+ subElement.elementName
							+ "</a>"
							+ " (<a href=\"#" + subElement.lineNumber + "\">"
							+ subElement.fileName + ':' + subElement.lineNumber
							+ "</a>)"
							+ "</li>\n";
					}
				}
				aStringForFile += "</ul>\n";
				
				
				//write the class list
				aStringForFile += "<h3>Classes:</h3>\n";
				aStringForFile += "<ul>\n";
				for(i = 0; i < anElement.members.length; ++i)
				{
					subElement = anElement.members[i];
					if(subElement.elementType === 'class')
					{
						aStringForFile +=
							"<li><a href=\"" + this.getObjectsFullPathName(subElement) + ".html\" target=\"mainFrame\" >"
							+ subElement.elementName
							+ "</a>"
							+ " (<a href=\"#" + subElement.lineNumber + "\">"
							+ subElement.fileName + ':' + subElement.lineNumber
							+ "</a>)"
							+ "</li>\n";
					}
				}
				aStringForFile += "</ul>\n";
				
				
				aStringForFile += "<h3>Source:</h3>\n";
				//get the source for this file
				aSource = this._myFileNametoSource[anElement.elementName];
				//highlight the keywords
				for(i = 0; i < keywordList.length; ++i)
				{
					keyWordInstances = aSource.match(new RegExp('\\W' + keywordList[i] + '\\W', 'g'));
					if(keyWordInstances)
					{
						for(j = 0; j < keyWordInstances.length; ++j)
						{
							aSource = aSource.replace(
								new RegExp(
									'\\' + keyWordInstances[j].substring(0, keyWordInstances[j].length - 1) + '\\' + keyWordInstances[j].charAt(keyWordInstances[j].length - 1)
									,'g'
								)
								,keyWordInstances[j].charAt(0)
									+ '<mark class=\'keyword\'>' + keywordList[i] + '</mark>'
									+ keyWordInstances[j].charAt(keyWordInstances[j].length - 1)
							);
						}
					}
				}
				//setup tab spacing to display in html
				aSource = aSource.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
				
				aSource = aSource.split('\n');
				aStringForFile += '<div id=code>';
				aStringForFile += '<ol>';
				
				isComment = false;
				//write out each source line, and keep track if we are in comments or not
				for(i = 0; i < aSource.length; ++i)
				{
					aSource[i] = aSource[i].replace(/\/\*/g, '<mark class="comment">\/\*');
					aSource[i] = aSource[i].replace(/\/\//g, '<mark class="comment">\/\/');
					aSource[i] = aSource[i].replace(/\*\//g, '\*\/</mark>');

					if(isComment)
					{
						aStringForFile += '<li id=' + (i + 1) + '>' + '<mark class="comment">'
							+ aSource[i]
							+ '</li>';
					}
					else
					{
						aStringForFile += '<li id=' + (i + 1) + '>'
							+ aSource[i]
							+ '</li>';
					}
					
					aStartCommentIndex = aSource[i].lastIndexOf('\/\*');
					anEndCommentIndex = aSource[i].lastIndexOf('\*\/');
					isComment = (isComment || (anEndCommentIndex < aStartCommentIndex))
						&& !(anEndCommentIndex > aStartCommentIndex);
				}
				aStringForFile += '</ol>';
				aStringForFile += '</div>';
				
				aStringForFile += inFileTail;
				fs.writeFileSync("../docs/generated/" + aName + ".html", aStringForFile);
			}
		}
		
	}
});
/**! @endclass: DocJS */