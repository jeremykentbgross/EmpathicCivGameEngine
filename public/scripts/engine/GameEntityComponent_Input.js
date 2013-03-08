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
		
		this._direction = ECGame.EngineLib.createGame2DPoint(0, 0);
		
		//TODO put this elsewhere??
		this._speed = 128;
		
		//TODO these should go in a child class, like CharacterInput or something
		this._up		= ECGame.EngineLib.createGame2DPoint( 0,-1);
		this._down	= ECGame.EngineLib.createGame2DPoint( 0, 1);
		this._left	= ECGame.EngineLib.createGame2DPoint(-1, 0);
		this._right	= ECGame.EngineLib.createGame2DPoint( 1, 0);
	},
	
	Parents : [ECGame.EngineLib.GameEntityComponent],
	
	flags : { net : true },
	
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
			//if multiplayer and not locally owned
			if(ECGame.Settings.Network.isMultiplayer && this.getNetOwner() !== ECGame.instance.localUser.userID)
			{
				//don't update using the local input data!
			}
			else
			{
				this._direction = ECGame.EngineLib.createGame2DPoint(0, 0);//TODO just set the fields, don't create a new one
				
				if(inInputEvent.myKeys.W/*['W']*/)
				{
					this._direction = this._direction.add(this._up);
				}
				if(inInputEvent.myKeys.S/*['S']*/)
				{
					this._direction = this._direction.add(this._down);
				}
				if(inInputEvent.myKeys.A/*['A']*/)
				{
					this._direction = this._direction.add(this._left);
				}
				if(inInputEvent.myKeys.D/*['D']*/)
				{
					this._direction = this._direction.add(this._right);
				}
				
				//unitize it, then multiply by speed
				this._direction = this._direction.unit().multiply(this._speed);
			}
			
			if(this._owner)
			{
				this._owner.onEvent(new ECGame.EngineLib.GameEvent_RequestVelocity(this._direction));
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
			if(inEvent.entity.getWorld())
			{
				ECGame.instance.input.registerListener('Input', this);
			}
		},

		onRemovedFromEntity : function onRemovedFromEntity(inEvent)
		{
			var owner = this._owner;//inEntity.entity;
			
			//unregister for events
			owner.deregisterListener('AddedToWorld', this);
			owner.deregisterListener('RemovedFromWorld', this);
			ECGame.instance.input.deregisterListener('Input', this);
		},
		
		onAddedToWorld : function onAddedToWorld(inEvent)
		{
			ECGame.instance.input.registerListener('Input', this);
		},
		
		onRemovedFromWorld : function onRemovedFromWorld(inEvent)
		{
			ECGame.instance.input.deregisterListener('Input', this);
		},
		
		destroy : function destroy()
		{
			this.onRemovedFromEntity();
		},

		serialize : function serialize(inSerializer)
		{
			var format = this.EntityComponent_Input._serializeFormat;
			format[0].min = ECGame.EngineLib.createGame2DPoint(-this._speed,-this._speed);
			format[0].max = ECGame.EngineLib.createGame2DPoint(this._speed,this._speed);
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