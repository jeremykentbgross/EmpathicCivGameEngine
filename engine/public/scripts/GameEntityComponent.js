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

ECGame.EngineLib.GameEntityComponent = ECGame.EngineLib.Class.create({
	Constructor : function GameEntityComponent()
	{
		this.GameObject();
		
		this._myOwner = null;//TODO rename owningEntity
	},
	Parents : [ECGame.EngineLib.GameObject],
	flags : {},
	ChainUp : ['onRemovedFromEntity'],
	ChainDown : ['onAddedToEntity'],
	Definition :
	{
		onAddedToEntity : function onAddedToEntity(inEvent)
		{
			if(this._myOwner)
			{
				this.onRemovedFromEntity();
			}
			this._myOwner = inEvent.entity;
		},
		onRemovedFromEntity : function onRemovedFromEntity(inEvent)
		{
			this._myOwner = null;
		},
		
		//set<classname>NetDirty
		clearNetDirty : function clearNetDirty(){return;},
		postSerialize : function postSerialize(){return;},
		
		cleanup : function cleanup(){return;},
		serialize : function serialize(){return;},
		
		copyFrom : function copyFrom(){return;}
	}
});