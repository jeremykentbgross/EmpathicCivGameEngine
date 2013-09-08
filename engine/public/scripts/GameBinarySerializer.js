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

//TODO adaptive encode
//TODO try to increase the precision of the coder and model(s)
//TODO rename GameSerializer_Binary? actually make it not just binary in the same ser!

//TODO rename BinarySerializer
ECGame.EngineLib.GameBinarySerializer = ECGame.EngineLib.Class.create({
	Constructor : function GameBinarySerializer()
	{
		this._myCompresser = ECGame.EngineLib.ArithmeticCompresser.create(true);
		
		this._myIsWriting = undefined;
		this._myIsDummyMode = false;
		this._myIsNetMode = false;	//if net mode is enabled we do not do full serializes
		
		this._myIntegerRangeModel = ECGame.EngineLib.
				ArithmeticCompressionModels.
				EvenProbabilityIntegerRangeModel.create();
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		/*
		Flags =
		{
			NET,
			DUMMY_MODE
			//BINARY?, UI_GEN, NO_REFS??
		}
		*/
		//TODO flag for read/write instead of two init functions
		initWrite : function initWrite(inFlags)
		{
			this._myIsWriting = true;
			this._init(inFlags);
		},
		
		initRead : function initRead(inFlags, inData)
		{
			this._myIsWriting = false;
			this._init(inFlags);
			this._myCompresser.setString(inData);
		},
		
		_init : function _init(inFlags)
		{
			this._myIsNetMode = inFlags.NET;
			this._myIsDummyMode = inFlags.DUMMY_MODE;
			this._myCompresser.init(true);
		},
		
		isReading : function isReading()
		{
			return !this._myIsWriting;
		},
		
		setNetMode : function setNetMode(inNetMode)
		{
			this._myIsNetMode = inNetMode;
		},
		isNetMode : function isNetMode()
		{
			return this._myIsNetMode;
		},
		
		setDummyMode : function setDummyMode(inIsDummyMode)
		{
			this._myIsDummyMode = inIsDummyMode;
		},
		/*getDummyMode : function getDummyMode()
		{
			return this._myIsDummyMode;
		},*/
		
		getString : function getString()
		{
			return this._myCompresser.getString();
		},
		//TODO setString??
		
		/*
		dataDesc = [
			{
				name : //variable name
				net : true/false,
				min : //int or float
				max : //int or float
				precision : //float only
				//values : []//possible values (strings?/enums)?
				type :
						//X - int
						//X - float	//TODO rename as 'real'
						//X - bool
						//X - string
						//O - filename
						//X - objRef
						//O - position
						//O - array? map/object?
						//O - color?
						//O - image?
						//O - vector?
				maxArrayLength : //undefined OR max length if this is an array
				//classRefType : //class type for references?
				//file extention(s)?
				//tooltip : //string for the UI
				//noeditor : //not shown in editor
				//var id generated by the order in the list?
				condition : //if !object[condition] skip
				//		TODO conditions : [[],[]] inner ones and'ed, outer ones or'ed
			},
		]
		*/
		serializeObject : function serializeObject(inObject, inDataFormat)
		{
			var i
				,j
				,anArrayLength
				,aValue
				,anEntry
				;
			
			for(i = 0; i < inDataFormat.length; ++i)//TODO unit tests to see if dummy reads work right, including arrays!
			{
				anEntry = inDataFormat[i];
				
				if(this._myIsNetMode && !anEntry.net)
				{
					continue;
				}
				
				if(anEntry.condition && !inObject[anEntry.condition])
				{
					continue;
				}
				
				if(anEntry.maxArrayLength)
				{
					anArrayLength = inObject[anEntry.name].length;
					anArrayLength = this.serializeInt(anArrayLength, 0, anEntry.maxArrayLength);
					if(this.isReading() && !this._myIsDummyMode)
					{
						inObject[anEntry.name] = [];
					}
				}
				else
				{
					anArrayLength = 1;
				}
				
				for(j = 0; j < anArrayLength; ++j)
				{
					if(anEntry.maxArrayLength)
					{
						aValue = inObject[anEntry.name][j];
					}
					else
					{
						aValue = inObject[anEntry.name];
					}
					
					switch(anEntry.type)
					{
						case 'bool':
							aValue = this.serializeBool(aValue);
							break;
						case 'int':
							aValue = this.serializeInt(aValue, anEntry.min, anEntry.max);
							break;
						case 'float':
							aValue = this.serializeFloat(aValue, anEntry.min, anEntry.max, anEntry.precision);
							break;
						case 'string':
							aValue = this.serializeString(aValue);
							break;
						case 'position':
							aValue = this.serializePoint2D(aValue, anEntry.min, anEntry.max/*, anEntry.precision*/);
							break;
						case 'objRef':
							aValue = this.serializeGameObjectRef(aValue);
							break;
					}
					if(!this._myIsDummyMode)//TODO?? && this.isReading() //on ALL of these..
					{
						if(anEntry.maxArrayLength)
						{
							inObject[anEntry.name][j] = aValue;
						}
						else
						{
							inObject[anEntry.name] = aValue;
						}
					}
				}
			}
		},
		
		serializeGameObjectRef : function serializeGameObjectRef(inValue)
		{
			var aReadResult,
				objectHeaderFormat,
				object;
			
			aReadResult = inValue;
			
			if(!aReadResult)
			{
				aReadResult = new ECGame.EngineLib.GameObjectRef();
			}
			
			objectHeaderFormat =	//TODO put in shared place (like the GameObjectRef) as it is also used in Network system code!
			[
				{
					name : 'classID',
					type : 'int',
					net : true,
					min : 0,
					max : ECGame.EngineLib.Class.getInstanceRegistry().getMaxID()
				},
				{
					name : 'instanceID',
					type : 'int',
					net : true,
					min : 0,
					max : 4096	//note: this assumes a max of 4096 objects of any given type.  may want max items per type in the future
				}
			];
			
			aReadResult.toBinary();
			this.serializeObject(aReadResult, objectHeaderFormat);
			
			/*if(!this._myIsWriting)//Should be covered in convert to binary
			{
				aReadResult._value = null;
			}*/
			
			if(!this._myIsDummyMode)
			{
				inValue = aReadResult;
			}
			
			return inValue;
		},
		
		serializeBool : function serializeBool(inValue)
		{
			var aReadResult = inValue;
			
			this._myIntegerRangeModel.setMinMax(0, 1);
			if(this._myIsWriting)
			{
				this._myCompresser.encode(inValue ? 1 : 0, this._myIntegerRangeModel);
			}
			else
			{
				aReadResult = this._myCompresser.decode(this._myIntegerRangeModel) === 1 ? true : false;
			}

			if(!this._myIsDummyMode)
			{
				inValue = aReadResult;
			}
			
			return inValue;
		},
		
		serializeInt : function serializeInt(inValue, min, max)
		{
			var aReadResult = inValue;
			
			this._myIntegerRangeModel.setMinMax(min, max);
			if(this._myIsWriting)
			{
				this._myCompresser.encode(inValue, this._myIntegerRangeModel);
			}
			else
			{
				aReadResult = this._myCompresser.decode(this._myIntegerRangeModel);
			}
				
			if(!this._myIsDummyMode)
			{
				inValue = aReadResult;
			}
				
			return inValue;
		},
		
		serializeFloat : function serializeFloat(inValue, min, max, precision)
		{
			precision = Math.pow(10, precision);
			
			//TODO consider if I should modify the originals like this, and if so, what notification should be given
			//obj[anEntry.name] = Math.min(obj[anEntry.name], anEntry.max);
			//obj[anEntry.name] = Math.max(obj[anEntry.name], anEntry.min);
			
			//note the precision is distributed manually because it causes floating point errors if I don't
			var wholePart = Math.floor(inValue);
			var fractionalPart = Math.floor(precision * inValue - precision * wholePart);
			var aReadResult = inValue;
			//TODO consider if I should modify the originals like this, and if so, what notification should be given
			//inValue = wholePart + fractionalPart / precision;
			
			if(this._myIsWriting)
			{
				this._myCompresser.encode(
					wholePart,
					this._myIntegerRangeModel.setMinMax(
						Math.floor(min),
						Math.ceil(max)
					)
				);
				this._myCompresser.encode(
					fractionalPart,
					this._myIntegerRangeModel.setMinMax(
						0,
						precision
					)
				);
			}
			else
			{
				aReadResult =
					this._myCompresser.decode(
						this._myIntegerRangeModel.setMinMax(
							Math.floor(min),
							Math.ceil(max)
						)
					) +
					this._myCompresser.decode(
						this._myIntegerRangeModel.setMinMax(
							0,
							precision
						)
					) / precision;
			}
			
			if(!this._myIsDummyMode)
			{
				inValue = aReadResult;
			}
				
			return inValue;
		},
		
		//TODO see: http://stackoverflow.com/questions/6965107/converting-between-strings-and-arraybuffers
		serializeString : function serializeString(inValue)
		{
			var aReadResult = inValue;
			var charIndex;
			var stringLength;
			var string;
			
			//TODO: get a proper dynamic probability model for the strings
			this._myIntegerRangeModel.setMinMax(0, 65535);
			if(this._myIsWriting)
			{
				stringLength = inValue.length;
				string = inValue;
				this._myCompresser.encode(stringLength, this._myIntegerRangeModel);
				for(charIndex = 0; charIndex < stringLength; ++charIndex)
				{
					this._myCompresser.encode(string.charCodeAt(charIndex), this._myIntegerRangeModel);
				}
			}
			else
			{
				stringLength = this._myCompresser.decode(this._myIntegerRangeModel);
				string = '';
				for(charIndex = 0; charIndex < stringLength; ++charIndex)
				{
					string += String.fromCharCode(
						this._myCompresser.decode(
							this._myIntegerRangeModel
						)
					);
				}
				aReadResult = string;
			}
			
			if(!this._myIsDummyMode)
			{
				inValue = aReadResult;
			}
			
			return inValue;
		},
		
		serializePoint2D : function serializePoint2D(inValue, min, max)
		{
			var aReadResult = inValue.clone();
			
			aReadResult.myX = this.serializeFloat(aReadResult.myX, min.myX, max.myX, 3);
			aReadResult.myY = this.serializeFloat(aReadResult.myY, min.myY, max.myY, 3);
			
			if(!this._myIsDummyMode)
			{
				inValue = aReadResult;
			}
			
			return inValue;
		}
	}
});
