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

ECGame.EngineLib.EntityComponent_Camera2D = ECGame.EngineLib.Class.create({
	Constructor : function EntityComponent_Camera2D()
	{
		this.EntityComponent();
		
		this._myCamera = ECGame.EngineLib.Camera2D.create();
		this._myPosition = ECGame.EngineLib.Point2D.create();
	},
	Parents : [ECGame.EngineLib.EntityComponent],
	flags : { netDynamic : true },
	ChainUp : null,
	ChainDown : null,
	Definition :
	{
		onAddedToEntity : function onAddedToEntity(/*inEvent*/)
		{
			var owner = this._myOwningEntity;//inEvent.entity;
			
			//register for events
			owner.registerListener('UpdatedPhysicsStatus', this);
			owner.registerListener('EntityAddedToWorld', this);
			owner.registerListener('EntityRemovedFromWorld', this);
		}
		
		,onRemovedFromEntity : function onRemovedFromEntity(/*inEvent*/)
		{
			var owner = this._myOwningEntity;//inEvent.entity;
			
			//unregister for events
			owner.deregisterListener('UpdatedPhysicsStatus', this);
			owner.deregisterListener('EntityAddedToWorld', this);
			owner.deregisterListener('EntityRemovedFromWorld', this);
		}
		
		,onEntityAddedToWorld : function onEntityAddedToWorld(inEvent)
		{
			this._myMap = inEvent.world.getMap();
			
			if(this.getNetOwnerID() === ECGame.instance.getLocalUser().userID)
			{
				inEvent.world.setCamera(this);
			}
		}
		
		,onEntityRemovedFromWorld : function onEntityRemovedFromWorld(/*inEvent*/)
		{
			this._myMap = null;
		}
		
		,onUpdatedPhysicsStatus : function onUpdatedPhysicsStatus(inEvent)
		{
			this._myPosition.copyFrom(inEvent.position);
			this.centerOn(this._myPosition, this._myMap);
		}
		
		//set<classname>NetDirty
		,clearNetDirty : function clearNetDirty(){return;}
		,postSerialize : function postSerialize(){return;}
		,copyFrom : function copyFrom(/*inOther*/){return;}
		,cleanup : function cleanup(){return;}
		,serialize : function serialize(){return;}
		
		
		////////////////////////////////////////////
		//camera wrap functions/////////////////////
		,centerOn : function centerOn(inTargetCenter, inMap)
		{
			this._myCamera.centerOn(inTargetCenter, inMap);
			this._myOwningEntity.onEvent(
				new ECGame.EngineLib.Events.CameraVolumeUpdate(
					this
					,this.getCaptureVolumeAABB2D()
				)
			);
		}
		,getTargetPosition : function getTargetPosition()
		{
			return this._myPosition;	//return this._myCamera.getTargetPosition();
		}
		,getCaptureVolumeAABB2D : function getCaptureVolumeAABB2D()
		{
			return this._myCamera.getCaptureVolumeAABB2D();
		}
		,debugDraw : function debugDraw(inGraphics)
		{
			this._myCamera.debugDraw(inGraphics);
		}
		//camera wrap functions/////////////////////
		////////////////////////////////////////////
	}
});