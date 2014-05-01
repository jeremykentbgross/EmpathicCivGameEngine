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

ECGame.EngineLib.EntityComponent = ECGame.EngineLib.Class.create({
	Constructor : function EntityComponent()
	{
		this.GameObject();
		
		this._myOwningEntity = null;
	},
	Parents : [ECGame.EngineLib.GameObject],
	flags : {},
	ChainUp : ['onRemovedFromEntity'],
	ChainDown : ['onAddedToEntity'],
	Definition :
	{
		onAddedToEntity : function onAddedToEntity(inEvent)
		{
			if(this._myOwningEntity)
			{
				this.onRemovedFromEntity(
					new ECGame.EngineLib.Events.RemovedFromEntity(this._myOwningEntity)
				);
			}
			this._myOwningEntity = inEvent.entity;
		},
		onRemovedFromEntity : function onRemovedFromEntity(inEvent)
		{
			console.assert(inEvent.entity === this._myOwningEntity);
			this._myOwningEntity = null;
		},
		
		getOwningEntity : function getOwningEntity()
		{
			return this._myOwningEntity;
		},
		
		//set<classname>NetDirty
		clearNetDirty : function clearNetDirty(){return;},
		postSerialize : function postSerialize(){return;},
		
		cleanup : function cleanup(){return;},
		serialize : function serialize(){return;},
		
		copyFrom : function copyFrom(/*inOther*/){return;}
	}
});