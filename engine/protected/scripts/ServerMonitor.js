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

ECGame.EngineLib.ServerMonitor = ECGame.EngineLib.Class.create({
	Constructor : function ServerMonitor()
	{
		this.GameObject();

		this._myGameObjectInstanceDebugString = '';
		ECGame.instance.myServerMonitor = this;//HACK????

		if(ECGame.Settings.Network.isServer)
		{
			ECGame.EngineLib.Class.registerListener('GameObjectRegistered', this);
			ECGame.EngineLib.Class.registerListener('GameObjectDeregistered', this);
		}
	},
	Parents : [ECGame.EngineLib.GameObject],
	flags : { netDynamic: true},

	ChainUp : [],
	ChainDown : [],
	//TODO? mustOverride //pure virtual
	//TODO: SerializeFormat:
	Definition :
	{
		_serializeFormat :
		[
			{
				name : '_myGameObjectInstanceDebugString',
				type : 'string',
				//TODO no length property? should the default be good enough?
				net : true
			}
		]

		,onGameObjectRegistered: function onGameObjectRegistered(/*inEvent*/)
		{
			//console.info(inEvent.myObject.getName());
			this._setClassDebugString(ECGame.EngineLib.Class.getDebugString());
		}
		,onGameObjectDeregistered: function onGameObjectDeregistered(/*inEvent*/)
		{
			//console.info(inEvent.myObject.getName());
			this._setClassDebugString(ECGame.EngineLib.Class.getDebugString());
		}
		,_setClassDebugString: function _setClassDebugString(inString)
		{
			this._myGameObjectInstanceDebugString = inString;
			//console.info("This message should be rare!!!");
			this.setNetDirty();
		}
		,debugDrawClass: function debugDrawClass()
		{
			ECGame.EngineLib.Class.debugDraw("+++Server Object Tree:+++\n" + this._myGameObjectInstanceDebugString);
		}

		,cleanup: function cleanup(){return;}

		,serialize: function serialize(inSerializer)
		{
			inSerializer.serializeObject(this, this.ServerMonitor._serializeFormat);
		}

		,copyFrom: function copyFrom(){return;}
		,clearNetDirty: function clearNetDirty(){return;}
		,postSerialize: function postSerialize(){return;}
	}
});



