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

//TODO depricated
GameEngineLib.createEntityComponent = function(instance, private)
{		
	var temp = new GameEngineLib.GameEntityComponent();
	instance = instance || {};
	
	for(property in temp)
	{
		instance[property] = temp[property]
	}
	for(property in temp.prototype)
	{
		instance[property] = temp.prototype[property];
	}
	
	return instance;
}



GameEngineLib.GameEntityComponent = GameEngineLib.Class({
	Constructor : function GameEntityComponent(){},
	Parents : [GameEngineLib.GameObject],
	ChainUp : ["onRemovedFromEntity"],
	ChainDown : ["onAddedToEntity"],
	Definition :
	{
		onAddedToEntity : function onAddedToEntity(inEntity)
		{
			if(this._myOwner)
			{
				this.onRemovedFromEntity();
			}
			this._myOwner = inEntity;
			
			//todo register for events
		},
		onRemovedFromEntity : function onRemovedFromEntity()
		{
			this._myOwner = null;
			//todo unregister for events
		},
		
		destroy : function destroy(){},
		serialize : function serialize(){}
	}
});