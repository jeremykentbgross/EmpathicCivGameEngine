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

ECGame.Lib.EntityComponent_Input = ECGame.EngineLib.Class.create(
{
	Constructor : function EntityComponent_Input()
	{
		this.EntityComponent();
		
		this._myUpString = "Up";
		this._myDownString = "Down";
		this._myLeftString = "Left";
		this._myRightString = "Right";
		
		this._myKeyMapConfiguration = {};
		this._myKeyMapConfiguration[this._myUpString] = ECGame.EngineLib.Input.KEYBOARD.KEY_W;
		this._myKeyMapConfiguration[this._myDownString] = ECGame.EngineLib.Input.KEYBOARD.KEY_S;
		this._myKeyMapConfiguration[this._myLeftString] = ECGame.EngineLib.Input.KEYBOARD.KEY_A;
		this._myKeyMapConfiguration[this._myRightString] = ECGame.EngineLib.Input.KEYBOARD.KEY_D;
		
		this._mySpeed = 128;
		
		this._myDirection = ECGame.EngineLib.Point2D.create(0, 0);
		this._myUp = ECGame.EngineLib.Point2D.create( 0,-1);
		this._myDown = ECGame.EngineLib.Point2D.create( 0, 1);
		this._myLeft = ECGame.EngineLib.Point2D.create(-1, 0);
		this._myRight = ECGame.EngineLib.Point2D.create( 1, 0);
	},
	
	Parents : [ECGame.EngineLib.EntityComponent],
	
	flags : { netDynamic : true },
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		_serializeFormat :
		[
			{
				name : '_myDirection',	//TODO should actually serialize 0-8 for direction (in 3bits)
				net : true,
				type : 'position',
				min : null,	//TODO
				max : null	//TODO
			}
		],
		
		onInput : function onInput(inInputEvent)
		{
			/*var anOldDirection
				;*/
			
			//if multiplayer and not locally owned
			if(!ECGame.Settings.Network.isMultiplayer || this.getNetOwnerID() === ECGame.instance.getLocalUser().userID)
			{
				//anOldDirection = this._myDirection.clone();
				this._myDirection.set(0, 0);
				
				if(inInputEvent.keys[this._myKeyMapConfiguration[this._myUpString]])
				{
					this._myDirection = this._myDirection.add(this._myUp);
				}
				if(inInputEvent.keys[this._myKeyMapConfiguration[this._myDownString]])
				{
					this._myDirection = this._myDirection.add(this._myDown);
				}
				if(inInputEvent.keys[this._myKeyMapConfiguration[this._myLeftString]])
				{
					this._myDirection = this._myDirection.add(this._myLeft);
				}
				if(inInputEvent.keys[this._myKeyMapConfiguration[this._myRightString]])
				{
					this._myDirection = this._myDirection.add(this._myRight);
				}
				
				/*if(!anOldDirection.equal(this._myDirection))
				{
					//this.setNetDirty();	//TODO sending input, physics master control, etc..
				}*/
			}
			
			if(this._myOwningEntity)
			{
				this._myOwningEntity.onEvent(
					new ECGame.EngineLib.Events.RequestVelocity(
						this._myDirection.unit().scale(this._mySpeed)
					)
				);
			}
			else
			{
				console.warn("Should not be getting input updates right now.");
			}
		},
		
		onAddedToEntity : function onAddedToEntity(/*inEvent*/)
		{
			var owner = this._myOwningEntity;//inEntity.entity;
		
			//register for events
			owner.registerListener('EntityAddedToWorld', this);
			owner.registerListener('EntityRemovedFromWorld', this);
		},

		onRemovedFromEntity : function onRemovedFromEntity(/*inEvent*/)
		{
			var owner = this._myOwningEntity;//inEntity.entity;
			
			if(owner)
			{
				//unregister for events
				owner.deregisterListener('EntityAddedToWorld', this);
				owner.deregisterListener('EntityRemovedFromWorld', this);
			}
		},
		
		onEntityAddedToWorld : function onEntityAddedToWorld(/*inEvent*/)
		{
			ECGame.instance.getInput().registerListener('Input', this);
		},
		
		onEntityRemovedFromWorld : function onEntityRemovedFromWorld(/*inEvent*/)
		{
			ECGame.instance.getInput().deregisterListener('Input', this);
		},
		
		cleanup : function cleanup(){return;},
		
		//set<classname>NetDirty
		clearNetDirty : function clearNetDirty(){return;},
		postSerialize : function postSerialize(){return;},

		serialize : function serialize(inSerializer)
		{
			var format = this.EntityComponent_Input._serializeFormat;
			format[0].min = ECGame.EngineLib.Point2D.create(-this._mySpeed, -this._mySpeed);
			format[0].max = ECGame.EngineLib.Point2D.create(this._mySpeed, this._mySpeed);
			inSerializer.serializeObject(this, format);
		},
		
		copyFrom : function copyFrom(/*inOther*/){return;}
	}
});