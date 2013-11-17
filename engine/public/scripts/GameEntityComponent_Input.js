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
		this.GameEntityComponent();
		//this._keysEventMapper = [];//TODO make keys changable??
		
		this._direction = ECGame.EngineLib.Point2D.create(0, 0);
		
		//TODO put this elsewhere??
		this._speed = 128;
		
		//TODO these should go in a child class, like CharacterInput or something
		this._up		= ECGame.EngineLib.Point2D.create( 0,-1);
		this._down	= ECGame.EngineLib.Point2D.create( 0, 1);
		this._left	= ECGame.EngineLib.Point2D.create(-1, 0);
		this._right	= ECGame.EngineLib.Point2D.create( 1, 0);
	},
	
	Parents : [ECGame.EngineLib.GameEntityComponent],
	
	flags : { netDynamic : true },
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		_serializeFormat :
		[
			{
				name : '_direction',
				net : true,
				type : 'position',
				min : null,	//this._speed
				max : null	//this._speed
			}
		],
		
		
		onInput : function onInput(inInputEvent)
		{
			var anOldDirection;
			//if multiplayer and not locally owned
			if(ECGame.Settings.Network.isMultiplayer && this.getNetOwnerID() !== ECGame.instance.getLocalUser().userID)
			{
				//don't update using the local input data!
			}
			else
			{
				anOldDirection = this._direction;
				this._direction = ECGame.EngineLib.Point2D.create(0, 0);//TODO just set the fields, don't create a new one
				
				if(inInputEvent.keys[inInputEvent.KEYBOARD.KEY_W])
				{
					this._direction = this._direction.add(this._up);
				}
				if(inInputEvent.keys[inInputEvent.KEYBOARD.KEY_S])
				{
					this._direction = this._direction.add(this._down);
				}
				if(inInputEvent.keys[inInputEvent.KEYBOARD.KEY_A])
				{
					this._direction = this._direction.add(this._left);
				}
				if(inInputEvent.keys[inInputEvent.KEYBOARD.KEY_D])
				{
					this._direction = this._direction.add(this._right);
				}
				
				//unitize it, then scale by speed
				this._direction = this._direction.unit().scale(this._speed);
				
				if(!anOldDirection.equal(this._direction))
				{
					//this.setNetDirty();	//TODO sending input, physics master control, etc..
				}
			}
			
			if(this._owner)
			{
				this._owner.onEvent(new ECGame.EngineLib.Events.RequestVelocity(this._direction));
			}
			else
			{
				ECGame.log.warn("Should not be getting input updates right now.");
			}
		},
		
		onAddedToEntity : function onAddedToEntity(inEvent)
		{
			var owner = this._owner;//inEntity.entity;
		
			//register for events
			owner.registerListener('AddedToWorld', this);
			owner.registerListener('RemovedFromWorld', this);
			/*if(inEvent.entity.getWorld())	//should be done when added to world, which will happen next
			{
				ECGame.instance.getInput().registerListener('Input', this);
			}*/
		},

		onRemovedFromEntity : function onRemovedFromEntity(inEvent)
		{
			var owner = this._owner;//inEntity.entity;
			
			if(owner)
			{
				//unregister for events
				owner.deregisterListener('AddedToWorld', this);
				owner.deregisterListener('RemovedFromWorld', this);
				//ECGame.instance.getInput().deregisterListener('Input', this);	//should be done when removed from world (which happens first)
			}
		},
		
		onAddedToWorld : function onAddedToWorld(inEvent)
		{
			ECGame.instance.getInput().registerListener('Input', this);
		},
		
		onRemovedFromWorld : function onRemovedFromWorld(inEvent)
		{
			ECGame.instance.getInput().deregisterListener('Input', this);
		},
		
		cleanup : function cleanup()
		{
			this.onRemovedFromEntity();
		},
		
		//TODO
		//set<classname>NetDirty
		clearNetDirty : function clearNetDirty(){return;},
		postSerialize : function postSerialize(){return;},

		serialize : function serialize(inSerializer)
		{
			var format = this.EntityComponent_Input._serializeFormat;
			format[0].min = ECGame.EngineLib.Point2D.create(-this._speed,-this._speed);
			format[0].max = ECGame.EngineLib.Point2D.create(this._speed,this._speed);
			inSerializer.serializeObject(this, format);
		},
		
		copyFrom : function copyFrom(inOther)
		{
			this._speed = inOther._speed;
		
			/*this._up.copyFrom(inOther._up);
			this._down.copyFrom(inOther._down);
			this._left.copyFrom(inOther._left);
			this._right.copyFrom(inOther._right);*/
		}
	}
});