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

ECGame.EngineLib.EntityComponent_SoundPlayer = ECGame.EngineLib.Class.create(
{
	Constructor : function EntityComponent_SoundPlayer()
	{
		this.GameEntityComponent();
		
		this._myPosition = new ECGame.EngineLib.Point2();
		this._myVelocity = new ECGame.EngineLib.Point2();
	},
	
	Parents : [ECGame.EngineLib.GameEntityComponent],
	
	flags : {},
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		/*init : function()
		{
		},*/

		onAddedToEntity : function onAddedToEntity(inEvent)
		{
			var owner = this._owner;//inEvent.entity;
			
			//register for events
			owner.registerListener('PlaySound', this);
			owner.registerListener('UpdatePosition', this);
			owner.registerListener('AddedToWorld', this);
			owner.registerListener('RemovedFromWorld', this);
			
			//TODO owner.event(getposition, myPos);
		},

		onRemovedFromEntity : function()
		{
			var owner = this._owner;//inEvent.entity;
			
			//unregister for events
			owner.deregisterListener('PlaySound', this);
			owner.deregisterListener('UpdatePosition', this);
			owner.deregisterListener('AddedToWorld', this);
			owner.deregisterListener('RemovedFromWorld', this);
						
			//this._owner = null;
		},
		
		onPlaySound : function onPlaySound(inEvent)
		{
			var aSoundSystem,
				aSound;
				
			if(ECGame.Settings.Network.isServer)
			{
				return;
			}
			
			aSoundSystem = ECGame.instance.soundSystem;
			
			//TODO insert to spacial partitioning culling in the world!!!!!!
			
			if(inEvent.myIsPositional)
			{
				aSound = aSoundSystem.playPositionalSoundEffect2D(
					inEvent.mySoundDescriptionID
					,this._myPosition
					,inEvent.myRadius
				);
				if(inEvent.myIsFollowingSource)
				{
					aSound.setVelocity(this._myVelocity);
					//TODO add it to position updating sounds
				}
			}
			else
			{
				aSound = aSoundSystem.playSoundEffect(inEvent.mySoundDescriptionID);
			}
			
			//TODO add to list to stop playing if it is removed from the world
		},

		onUpdatePosition : function onUpdatePosition(inEvent)
		{
			this._myPosition.copyFrom(inEvent.position);
			this._myVelocity.copyFrom(inEvent.velocity);
			//TODO for all playing sounds update position and velocity (if appropriate)
			//TODO change location in spacial partitioning in the world!!
		},

		onAddedToWorld : function onAddedToWorld(inEvent)
		{
			this._myWorld = inEvent.world;
			//this._myWorld.getSceneGraph().insertItem(this._sceneGraphRenderable);
		},

		onRemovedFromWorld : function onRemovedFromWorld(inEvent)
		{
			//this._myWorld.getSceneGraph().removeItem(this._sceneGraphRenderable);
			this._myWorld = null;
		},

		//set<classname>NetDirty
		clearNetDirty : function clearNetDirty(){},
		
		cleanup : function cleanup(){},//TODO
		serialize : function serialize(){},//TODO
		copyFrom : function copyFrom(inOther){}
	}
});