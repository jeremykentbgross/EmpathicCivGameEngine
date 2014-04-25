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

//TODO rename CharacterInput??
ECGame.EngineLib.EntityComponent_Input = ECGame.EngineLib.Class.create(
{
	Constructor : function EntityComponent_Input()
	{
		this.EntityComponent();
		//this._keysEventMapper = [];//TODO make keys changable??
		
		this._myDirection = ECGame.EngineLib.Point2D.create(0, 0);
		
		//TODO put this elsewhere??
		this._mySpeed = 128;
		
		//TODO these should go in a child class, like CharacterInput or something
		this._myUp		= ECGame.EngineLib.Point2D.create( 0,-1);
		this._myDown	= ECGame.EngineLib.Point2D.create( 0, 1);
		this._myLeft	= ECGame.EngineLib.Point2D.create(-1, 0);
		this._myRight	= ECGame.EngineLib.Point2D.create( 1, 0);
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
				name : '_myDirection',
				net : true,
				type : 'position',
				min : null,	//this._mySpeed
				max : null	//this._mySpeed
			}
		],
		
		
		onInput : function onInput(inInputEvent)
		{
			//var anOldDirection;
			
			//if multiplayer and not locally owned
			if(!ECGame.Settings.Network.isMultiplayer || this.getNetOwnerID() === ECGame.instance.getLocalUser().userID)
			{
				//anOldDirection = this._myDirection;
				this._myDirection = ECGame.EngineLib.Point2D.create(0, 0);//TODO just set the fields, don't create a new one
				
				if(inInputEvent.keys[inInputEvent.KEYBOARD.KEY_W])
				{
					this._myDirection = this._myDirection.add(this._myUp);
				}
				if(inInputEvent.keys[inInputEvent.KEYBOARD.KEY_S])
				{
					this._myDirection = this._myDirection.add(this._myDown);
				}
				if(inInputEvent.keys[inInputEvent.KEYBOARD.KEY_A])
				{
					this._myDirection = this._myDirection.add(this._myLeft);
				}
				if(inInputEvent.keys[inInputEvent.KEYBOARD.KEY_D])
				{
					this._myDirection = this._myDirection.add(this._myRight);
				}
				
				//unitize it, then scale by speed
				this._myDirection = this._myDirection.unit().scale(this._mySpeed);
				
				/*if(!anOldDirection.equal(this._myDirection))
				{
					//this.setNetDirty();	//TODO sending input, physics master control, etc..
				}*/
			}
			
			if(this._myOwner)
			{
				this._myOwner.onEvent(new ECGame.EngineLib.Events.RequestVelocity(this._myDirection));
			}
			else
			{
				console.warn("Should not be getting input updates right now.");
			}
		},
		
		onAddedToEntity : function onAddedToEntity(/*inEvent*/)
		{
			var owner = this._myOwner;//inEntity.entity;
		
			//register for events
			owner.registerListener('EntityAddedToWorld', this);
			owner.registerListener('EntityRemovedFromWorld', this);
			/*if(inEvent.entity.getWorld())	//should be done when added to world, which will happen next
			{
				ECGame.instance.getInput().registerListener('Input', this);
			}*/
		},

		onRemovedFromEntity : function onRemovedFromEntity(/*inEvent*/)
		{
			var owner = this._myOwner;//inEntity.entity;
			
			if(owner)
			{
				//unregister for events
				owner.deregisterListener('EntityAddedToWorld', this);
				owner.deregisterListener('EntityRemovedFromWorld', this);
				//ECGame.instance.getInput().deregisterListener('Input', this);	//should be done when removed from world (which happens first)
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
		
		cleanup : function cleanup()
		{
			return;
			//this.onRemovedFromEntity();//WTF? Why was this there?
		},
		
		//TODO
		//set<classname>NetDirty
		clearNetDirty : function clearNetDirty(){return;},
		postSerialize : function postSerialize(){return;},

		serialize : function serialize(inSerializer)
		{
			var format = this.EntityComponent_Input._serializeFormat;
			format[0].min = ECGame.EngineLib.Point2D.create(-this._mySpeed,-this._mySpeed);
			format[0].max = ECGame.EngineLib.Point2D.create(this._mySpeed,this._mySpeed);
			inSerializer.serializeObject(this, format);
		},
		
		copyFrom : function copyFrom(inOther)
		{
			this._mySpeed = inOther._mySpeed;
		
			/*this._myUp.copyFrom(inOther._myUp);
			this._myDown.copyFrom(inOther._myDown);
			this._myLeft.copyFrom(inOther._myLeft);
			this._myRight.copyFrom(inOther._myRight);*/
		}
	}
});