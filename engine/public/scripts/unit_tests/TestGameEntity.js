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

ECGame.unitTests.registerTest(
	"GameEntity",
	function()
	{
		var anEntity
			,TestComponent
			,component1
			;
			
		anEntity = ECGame.EngineLib.GameEntity.create();
		anEntity.addedToWorld(6);
		
		TestComponent = ECGame.EngineLib.Class.create({
			Constructor : function TestComponent()
			{
				this.GameEntityComponent();
			},
			Parents : [ECGame.EngineLib.GameEntityComponent],
			flags : {},
			ChainUp : [],
			ChainDown : [],
			Definition :
			{
				onAddedToEntity : function onAddedToEntity(inEvent)
				{
					this.added = inEvent.entity;
					
					this._myOwner.registerListener('EntityAddedToWorld', this);
					this._myOwner.registerListener('EntityRemovedFromWorld', this);
				},
				
				onRemovedFromEntity : function onRemovedFromEntity(inEvent)
				{
					ECGame.log.assert(
						inEvent.entity === this._myOwner
						,"Didn't belong to this entity!"
					);
					this.added = null;
					
					this._myOwner.deregisterListener('EntityAddedToWorld', this);
					this._myOwner.deregisterListener('EntityRemovedFromWorld', this);
				},
				
				onEntityAddedToWorld : function onEntityAddedToWorld(inEvent)
				{
					this._containingWorld = inEvent.world;
				},
				
				onEntityRemovedFromWorld : function onEntityRemovedFromWorld(inEvent)
				{
					ECGame.log.assert(this._containingWorld === inEvent.world, "Removing from wrong world");
					this._removedWorld = true;
					this._containingWorld = null;
				},
				//set<classname>NetDirty
				clearNetDirty : function clearNetDirty(){return;},
				postSerialize : function postSerialize(){return;},
				serialize : function serialize(){return;},
				cleanup : function cleanup(){return;},
				copyFrom : function copyFrom(/*inOther*/){return;}
			}
		});
		
		component1 = TestComponent.create();
		anEntity.addComponent(component1);
		
		ECGame.log.assert(
			component1.added === anEntity
			&& anEntity === component1._myOwner
			&& component1._containingWorld === 6
			,"Did not add component successfully"
		);
		
		anEntity.addedToWorld(7);
		ECGame.log.assert(
			component1._removedWorld
			&& component1._containingWorld === 7,
			"World not set correctly."
		);
		
		anEntity.removeComponent(component1);
		ECGame.log.assert(
			component1.added === null
			&& null === component1._myOwner 
			&& component1._containingWorld === null,
			"Did not remove component successfully"
		);
		
		return true;
	}
);
