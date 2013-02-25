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

GameEngineLib.GameBinarySerializer = function GameBinarySerializer(){};
GameEngineLib.GameBinarySerializer.prototype.constructor = GameEngineLib.GameBinarySerializer;
GameEngineLib.GameBinarySerializer.create = function create()
{
	return new GameEngineLib.GameBinarySerializer();
};

/*
Flags =
{
	NET,
	CLONE	//TODO not needed anymore I think
	ALL/NEW??
	DUMMY_MODE
	//BINARY?, UI_GEN, NO_REFS??
}
*/
GameEngineLib.GameBinarySerializer.prototype.initWrite = function initWrite(inFlags)
{
	this._isWriting = true;
	this._init(inFlags);
};

GameEngineLib.GameBinarySerializer.prototype.initRead = function initRead(inFlags, inData)
{
	this._isWriting = false;
	this._init(inFlags);
	this._compressor.setString(inData);
};

GameEngineLib.GameBinarySerializer.prototype._init = function _init(inFlags)
{
	this._net = inFlags.NET;
	this._dummyMode = inFlags.DUMMY_MODE;
	//TODO should this really be created every time?? !!likely not!!! It is being created all the time!!
	this._compressor = GameEngineLib.createGameArithmeticCompression();
	this._integerRangeModel = GameEngineLib.
		GameArithmeticCompressionModels.
		createEvenProbabilityIntegerRangeModel();
};


GameEngineLib.GameBinarySerializer.prototype.isNet = function isNet()
{
	return this._net;
};
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
	},
]
*/
GameEngineLib.GameBinarySerializer.prototype.serializeObject = function serializeObject(inObject, inDataFormat)
{
	var i, j, 
		arrayLength,
		value,
		path;
	
	for(i = 0; i < inDataFormat.length; ++i)//TODO unit tests to see if dummy reads work right, including arrays!
	{
		var entry = inDataFormat[i];
		
		if(this._net && !entry.net)
		{
			continue;
		}
		
		if(entry.maxArrayLength)
		{
			arrayLength = inObject[entry.name].length;
			arrayLength = this.serializeInt(arrayLength, 0, entry.maxArrayLength);
			if(this.isReading() && !this._dummyMode)
			{
				inObject[entry.name] = [];
			}
		}
		else
		{
			arrayLength = 1;
		}
		
		for(j = 0; j < arrayLength; ++j)
		{
			if(entry.maxArrayLength)
			{
				value = inObject[entry.name][j];
			}
			else
			{
				value = inObject[entry.name];
			}
			
			switch(entry.type)
			{
				case 'bool':
					value = this.serializeBool(value);
					break;
				case 'int':
					value = this.serializeInt(value, entry.min, entry.max);
					break;
				case 'float':
					value = this.serializeFloat(value, entry.min, entry.max, entry.precision);
					break;
				case 'string':
					value = this.serializeString(value);
					break;
				case 'position':
					value = this.serializePoint2D(value, entry.min, entry.max/*, entry.precision*/);
					break;
				case 'objRef':
					value = this.serializeGameObjectRef(value);
					break;
			}
			if(!this._dummyMode)
			{
				if(entry.maxArrayLength)
				{
					inObject[entry.name][j] = value;
				}
				else
				{
					inObject[entry.name] = value;
				}
			}
		}
	}
};


GameEngineLib.GameBinarySerializer.prototype.serializeGameObjectRef = function serializeGameObjectRef(value)
{
	var readResult,
		objectHeaderFormat,
		object;
	
	readResult = value;
	
	if(!readResult)
	{
		readResult = new GameEngineLib.GameObjectRef();
	}
	
	objectHeaderFormat =	//TODO put in shared place (like the GameObjectRef) as it is also used in Network system code!
	[
		{
			name : 'classID',
			type : 'int',
			net : true,
			min : 0,
			max : GameEngineLib.Class.getInstanceRegistry().getMaxID()
		},
		{
			name : 'instanceID',
			type : 'int',
			net : true,
			min : 0,
			max : 4096	//note: this assumes a max of 4096 objects of any given type.  may want max items per type in the future
		}
	];
	
	readResult.toBinary();
	this.serializeObject(readResult, objectHeaderFormat);
	
	/*if(!this._isWriting)//Should be covered in convert to binary
	{
		readResult._value = null;
	}*/
	
	if(!this._dummyMode)
	{
		value = readResult;
	}
	
	return value;
};


GameEngineLib.GameBinarySerializer.prototype.serializeBool = function serializeBool(value)
{
	var readResult = value;
	
	this._integerRangeModel.setMinMax(0, 1);
	if(this._isWriting)
	{
		this._compressor.encode(value ? 1 : 0, this._integerRangeModel);
	}
	else
	{
		readResult = this._compressor.decode(this._integerRangeModel) === 1 ? true : false;
	}

	if(!this._dummyMode)
	{
		value = readResult;
	}
	
	return value;
};

GameEngineLib.GameBinarySerializer.prototype.serializeInt = function serializeInt(value, min, max)
{
	var readResult = value;
	
	this._integerRangeModel.setMinMax(min, max);
	if(this._isWriting)
	{
		this._compressor.encode(value, this._integerRangeModel);
	}
	else
	{
		readResult = this._compressor.decode(this._integerRangeModel);
	}
		
	if(!this._dummyMode)
	{
		value = readResult;
	}
		
	return value;
};

GameEngineLib.GameBinarySerializer.prototype.serializeFloat = function serializeFloat(value, min, max, precision)
{
	precision = Math.pow(10, precision);
	
	//TODO consider if I should modify the originals like this, and if so, what notification should be given
	//obj[entry.name] = Math.min(obj[entry.name], entry.max);
	//obj[entry.name] = Math.max(obj[entry.name], entry.min);
	
	//note the precision is distributed manually because it causes floating point errors if I don't
	var wholePart = Math.floor(value);
	var fractionalPart = Math.floor(precision * value - precision * wholePart);
	var readResult = value;
	//TODO consider if I should modify the originals like this, and if so, what notification should be given
	//value = wholePart + fractionalPart / precision;
	
	if(this._isWriting)
	{
		this._compressor.encode(
			wholePart,
			this._integerRangeModel.setMinMax(
				Math.floor(min),
				Math.ceil(max)
			)
		);
		this._compressor.encode(
			fractionalPart,
			this._integerRangeModel.setMinMax(
				0,
				precision
			)
		);
	}
	else
	{
		readResult =
			this._compressor.decode(
				this._integerRangeModel.setMinMax(
					Math.floor(min),
					Math.ceil(max)
				)
			) +
			this._compressor.decode(
				this._integerRangeModel.setMinMax(
					0,
					precision
				)
			) / precision;
	}
	
	if(!this._dummyMode)
	{
		value = readResult;
	}
		
	return value;
};


GameEngineLib.GameBinarySerializer.prototype.serializeString = function serializeString(value)
{
	var readResult = value;
	var charIndex;
	var stringLength;
	var string;
	
	//TODO: get a proper dynamic probability model for the strings
	this._integerRangeModel.setMinMax(0, 65535);
	if(this._isWriting)
	{
		stringLength = value.length;
		string = value;
		this._compressor.encode(stringLength, this._integerRangeModel);
		for(charIndex = 0; charIndex < stringLength; ++charIndex)
		{
			this._compressor.encode(string.charCodeAt(charIndex), this._integerRangeModel);
		}
	}
	else
	{
		stringLength = this._compressor.decode(this._integerRangeModel);
		string = '';
		for(charIndex = 0; charIndex < stringLength; ++charIndex)
		{
			string += String.fromCharCode(
				this._compressor.decode(
					this._integerRangeModel
				)
			);
		}
		readResult = string;
	}
	
	if(!this._dummyMode)
	{
		value = readResult;
	}
	
	return value;
};

GameEngineLib.GameBinarySerializer.prototype.serializePoint2D = function serializePoint2D(value, min, max)
{
	var readResult = value.clone();
	
	readResult.myX = this.serializeFloat(readResult.myX, min.myX, max.myX, 3);
	readResult.myY = this.serializeFloat(readResult.myY, min.myY, max.myY, 3);
	
	if(!this._dummyMode)
	{
		value = readResult;
	}
	
	return value;
};

GameEngineLib.GameBinarySerializer.prototype.getString = function getString()
{
	return this._compressor.getString();
};

GameEngineLib.GameBinarySerializer.prototype.isReading = function isReading()
{
	return !this._isWriting;
};

GameEngineLib.GameBinarySerializer.prototype.setDummyMode = function setDummyMode(inIsDummyMode)
{
	this._dummyMode = inIsDummyMode;
};

GameEngineLib.GameBinarySerializer.prototype.getDummyMode = function getDummyMode()
{
	return this._dummyMode;
};