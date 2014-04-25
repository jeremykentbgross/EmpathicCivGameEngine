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
		this.EntityComponent();
		
		this._myPosition = new ECGame.EngineLib.Point2D();
		this._myVelocity = new ECGame.EngineLib.Point2D();
	},
	
	Parents : [ECGame.EngineLib.EntityComponent],
	
	flags : {},
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		/*init : function()
		{
		},*/

		onAddedToEntity : function onAddedToEntity(/*inEvent*/)
		{
			var owner = this._myOwner;//inEvent.entity;
			
			//register for events
			owner.registerListener('PlaySound', this);
			owner.registerListener('UpdatedPhysicsStatus', this);
			owner.registerListener('EntityAddedToWorld', this);
			owner.registerListener('EntityRemovedFromWorld', this);
			
			//TODO owner.event(getposition, myPos);
		},

		onRemovedFromEntity : function()
		{
			var owner = this._myOwner;//inEvent.entity;
			
			//unregister for events
			owner.deregisterListener('PlaySound', this);
			owner.deregisterListener('UpdatedPhysicsStatus', this);
			owner.deregisterListener('EntityAddedToWorld', this);
			owner.deregisterListener('EntityRemovedFromWorld', this);
						
			//this._myOwner = null;
		},
		
		onPlaySound : function onPlaySound(inEvent)
		{
			var aSoundSystem,
				aSound;
				
			if(ECGame.Settings.Network.isServer)
			{
				return;
			}
			
			aSoundSystem = ECGame.instance.getSoundSystem();
			
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

		onUpdatedPhysicsStatus : function onUpdatedPhysicsStatus(inEvent)
		{
			this._myPosition.copyFrom(inEvent.position);
			this._myVelocity.copyFrom(inEvent.velocity);
			//TODO for all playing sounds update position and velocity (if appropriate)
			//TODO change location in spacial partitioning in the world!!
		},

		onEntityAddedToWorld : function onEntityAddedToWorld(inEvent)
		{
			this._myWorld = inEvent.world;//TODO move to parent??
			//this._myWorld.getSceneGraph().insertItem(this._sceneGraphRenderable);
		},

		onEntityRemovedFromWorld : function onEntityRemovedFromWorld(/*inEvent*/)
		{
			//this._myWorld.getSceneGraph().removeItem(this._sceneGraphRenderable);
			this._myWorld = null;
		},

		//set<classname>NetDirty
		clearNetDirty : function clearNetDirty(){return;},
		postSerialize : function postSerialize(){return;},
		
		cleanup : function cleanup(){return;},//TODO
		serialize : function serialize(){return;},//TODO
		copyFrom : function copyFrom(/*inOther*/){return;}
	}
});