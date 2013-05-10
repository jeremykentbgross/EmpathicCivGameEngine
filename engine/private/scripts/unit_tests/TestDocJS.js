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
	"DocJS",
	function()
	{
		var theTestCode = function theTestCode()
		{
			/**!
				@namespace: MyNamespace
				/description: Blah blah blah
			*/
			MyNamespace = {};
			
			/**!
				@namespace: MyChildNamespace
				/parentNamespace: MyNamespace
				/description: Blah blah blah
			*/
			MyNamespace.MyChildNamespace = {};
			
			/**!
				@class: MyClass
				/parentNamespace: MyNamespace.MyChildNamespace
				/description: Blah blah blah
			*/
			MyNamespace.MyChildNamespace.MyClass = ECGame.EngineLib.Class.create({
				Constructor : function MyClass(){},
				Parents : [],
				flags : {},
				ChainUp : [],
				ChainDown : [],
				Definition :
				{
					
				}
			});/**! @endclass: MyClass */
			
			/**!
				@class: MyChildClass
				/parentNamespace: MyNamespace.MyChildNamespace
				/description: Blah blah blah
				/parents: MyNamespace.MyChildNamespace.MyClass
				/listensTo: SomeEvent
			*/
			MyNamespace.MyChildNamespace.MyChildClass = ECGame.EngineLib.Class.create({
				Constructor : function MyChildClass()
				{
					/**!
						@member: variable
						/description: Blah blah blah
						/types: [number]
						/default: 7
					*/
					this.variable = 7;
				},
				Parents : [MyNamespace.MyChildNamespace.MyClass],
				flags : {},
				ChainUp : [],
				ChainDown : [],
				Definition :
				{
					/**!
						@method: MyMethod
						/description: Blah blah blah
						/param: inParam1 [string] do da do da
						/param: outParam2 [number] batman smells
						/returns: [string, number] Robin laid an egg
						/fires: SomeEvent
					*/
					MyMethod : function MyMethod(inParam1, outParam2)
					{
						/**! @todo: 10 We need to do something else here! */
					}/**! @endmethod: MyMethod */
				}
			});/**! @endclass: MyChildClass */
		};
		
		var source = theTestCode.toString();
		console.log(source);
		
		//HACK!!!
		var /*ECGame.Webserver.*/DocJS = ECGame.EngineLib.Class.create({
			Constructor : function DocJS()
			{
				this._mySource = '';
				this._myGeneratedMetaData = null;
			},
			Parents : [],
			flags : {},
			ChainUp : [],
			ChainDown : [],
			Definition :
			{
				appendSource : function appendSource(inSource)
				{
					this._mySource += inSource;
				},
				
				run : function run()
				{
					var i,
						elements,
						element,
						elementType,
						elementName,
						elementData,
						startIndex,
						endIndex;
					
					this._myGeneratedMetaData = '[';
					
					//parse out all elements with proper comment blocks
					elements = this._mySource.match(/\x2f\x2a\x2a\x21[\S\s]*?\x2a\x2f/g);
					
					for(i = 0; i < elements.length; ++i)
					{
						//if this is not the first element, we need a comma to separate it from the previous one
						if(i !== 0)
						{
							this._myGeneratedMetaData += ',';
						}
						
						//get element and chop off comment parts
						element = elements[i];
						element = element.substring(4, element.length - 2);
						
						//get the element type, make sure there is only one type
						elementType = element.match(/@\w*:/g);
						ECGame.log.assert(elementType.length === 1, "To many element types: " + elementType);
						elementType = elementType[0];
						
						//find the element name
						startIndex = element.indexOf(elementType) + elementType.length;
						endIndex = element.indexOf('\n', startIndex);
						endIndex = endIndex !== -1 ? endIndex : element.length;
						elementName = element.substring(startIndex, endIndex);
						elementName = elementName.replace(/\s+/g,'');
						
						//cleanup elementType to final form, make sure there is a function to parse it
						elementType = elementType.toLowerCase();
						elementType = elementType.substr(1, elementType.length -2);
						ECGame.log.assert(this['_' + elementType] !== undefined, "No tag type of: " + elementType);
						
						//parse the rest of the element
						elementData = {};
						elementData.elementType = elementType;
						elementData.elementName = elementName;
						this._parseElementsProperties(element, elementData);
						this['_' + elementType](elementData);	/**! @todo function here should be better*/
					}
					this._myGeneratedMetaData += ']';
					
					console.log("Object: " + this._myGeneratedMetaData);
					console.log("Object: " + JSON.stringify(JSON.parse(this._myGeneratedMetaData)));
				},
				
				_parseElementsProperties : function _parseElementsProperties(inElement, outElementData)
				{
					var elementPropertyNames,
						elementPropertyValues,
						startIndex,
						endIndex,
						i;
						
					//outElementData = outElementData || {};
					
					//get rid of unneeded whitespace and then find the property names
					inElement = inElement.replace(/[\t\n\r]+/g, '');
					inElement = inElement.replace(/@todo:/gi, '/todo:');
					elementPropertyNames = inElement.match(/\/\w*:/g);
					if(!elementPropertyNames)
					{
						return;
					}
					
					startIndex = 0;
					endIndex = 0;
					elementPropertyValues = [];
					
					//find property values and clean property names
					for(i = 0; i < elementPropertyNames.length - 1; ++i)
					{
						startIndex = inElement.indexOf(elementPropertyNames[i], startIndex) + elementPropertyNames[i].length + 1;
						endIndex = inElement.indexOf(elementPropertyNames[i + 1], startIndex/* + 1*/);
						elementPropertyValues.push(inElement.substring(startIndex, endIndex));
						elementPropertyNames[i] = elementPropertyNames[i].substring(1, elementPropertyNames[i].length - 1);
						elementPropertyNames[i] = elementPropertyNames[i].toLowerCase();
					}
					startIndex = inElement.indexOf(elementPropertyNames[i], startIndex) + elementPropertyNames[i].length + 1;
					elementPropertyValues.push(inElement.substring(startIndex, inElement.length));
					elementPropertyNames[i] = elementPropertyNames[i].substring(1, elementPropertyNames[i].length - 1);
					elementPropertyNames[i] = elementPropertyNames[i].toLowerCase();

					//put our names and values into the out data
					outElementData.elementPropertyNames = elementPropertyNames;
					outElementData.elementPropertyValues = elementPropertyValues;
				},
				
				_parseElementProperty : function _parseElementProperty()
				{
				},
				
				_namespace : function _namespace(inElementData)
				{
					var i;
					console.log(inElementData);
					
					/**! @TODO: verify element properties*/
					/**! @TODO: parse element properties*/
					
					this._myGeneratedMetaData += '{';
					this._myGeneratedMetaData += '\"elementType\" : \"' + inElementData.elementType + '\"';
					this._myGeneratedMetaData += ', \"elementName\" : \"' + inElementData.elementName + '\"';
					for(i = 0; i < inElementData.elementPropertyNames.length; ++i)
					{
						this._myGeneratedMetaData += ', \"' + inElementData.elementPropertyNames[i]
							+ '\" : \"' + inElementData.elementPropertyValues[i] + '\"';
					}
					this._myGeneratedMetaData += '}';
				},
				
				_class : function _class(inElementData)
				{
					console.log(inElementData);
					
					/**! @TODO: verify element properties*/
					/**! @TODO: parse element properties*/
					
					this._myGeneratedMetaData += '{';
					this._myGeneratedMetaData += '\"elementType\" : \"' + inElementData.elementType + '\"';
					this._myGeneratedMetaData += ', \"elementName\" : \"' + inElementData.elementName + '\"';
					this._myGeneratedMetaData += '}';
				},
				
				_endclass : function _endclass(inElementData)
				{
					console.log(inElementData);
					
					/**! @TODO: verify element properties*/
					/**! @TODO: parse element properties*/
					
					this._myGeneratedMetaData += '{';
					this._myGeneratedMetaData += '\"elementType\" : \"' + inElementData.elementType + '\"';
					this._myGeneratedMetaData += ', \"elementName\" : \"' + inElementData.elementName + '\"';
					this._myGeneratedMetaData += '}';
				},
				
				_member : function _member(inElementData)
				{
					console.log(inElementData);
					
					/**! @TODO: verify element properties*/
					/**! @TODO: parse element properties*/
					
					this._myGeneratedMetaData += '{';
					this._myGeneratedMetaData += '\"elementType\" : \"' + inElementData.elementType + '\"';
					this._myGeneratedMetaData += ', \"elementName\" : \"' + inElementData.elementName + '\"';
					this._myGeneratedMetaData += '}';
				},
				
				_method : function _method(inElementData)
				{
					console.log(inElementData);
					
					/**! @TODO: verify element properties*/
					/**! @TODO: parse element properties*/
					
					this._myGeneratedMetaData += '{';
					this._myGeneratedMetaData += '\"elementType\" : \"' + inElementData.elementType + '\"';
					this._myGeneratedMetaData += ', \"elementName\" : \"' + inElementData.elementName + '\"';
					this._myGeneratedMetaData += '}';
				},
				
				_endmethod : function _endmethod(inElementData)
				{
					console.log(inElementData);
					
					/**! @TODO: verify element properties*/
					/**! @TODO: parse element properties*/
					
					this._myGeneratedMetaData += '{';
					this._myGeneratedMetaData += '\"elementType\" : \"' + inElementData.elementType + '\"';
					this._myGeneratedMetaData += ', \"elementName\" : \"' + inElementData.elementName + '\"';
					this._myGeneratedMetaData += '}';
				},
				
				_todo : function _todo(inElementData)
				{
					console.log(inElementData);
					
					/**! @TODO: verify element properties*/
					/**! @TODO: parse element properties*/
					
					this._myGeneratedMetaData += '{';
					this._myGeneratedMetaData += '\"elementType\" : \"' + inElementData.elementType + '\"';
					this._myGeneratedMetaData += ', \"elementName\" : \"' + inElementData.elementName + '\"';
					this._myGeneratedMetaData += '}';
				}
			}
		});
		
		var docJS = /*ECGame.Webserver.*/DocJS.create();
		docJS.appendSource(source);
		docJS.run();
		
		return true;
	}
);
