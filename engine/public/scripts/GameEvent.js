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

//namespace:
ECGame.EngineLib.Events = new (function Events(){});



ECGame.EngineLib.Events.GameEventBase = ECGame.EngineLib.Class.create({
	Constructor : function GameEventBase(inCallbackName)
	{
		this._callbackName = inCallbackName;
	},
	Parents : null,
	flags : {},
	ChainUp : [],
	ChainDown : ['copyFrom'],
	Definition :
	{
		//TODO add init function for the event that chains down so that the constructor doesn't have to be used
		getName : function getName()
		{
			return this.constructor.name;
		},
		getCallbackName : function getCallbackName()
		{
			return this._callbackName;
		},
		
		clone : function clone()
		{
			var newInstance = new this.constructor();
			newInstance.copyFrom(this);
			return newInstance;
		},
		
		copyFrom : function copyFrom(inOther)
		{
			this._callbackName = inOther._callbackName;
		}
	}
});

//TODO change function names (and the event listeners) to the full name (GameEvent_XXX)



ECGame.EngineLib.Events.GameObjectNetDirty = ECGame.EngineLib.Class.create({
	Constructor : function GameObjectNetDirty(inObject)
	{
		this.GameEventBase('onGameObjectNetDirty');
		this.myObject = inObject;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(inOther)
		{
			//TODO
		}
	}
});
ECGame.EngineLib.Events.GameObjectDestroyed = ECGame.EngineLib.Class.create({
	Constructor : function GameObjectDestroyed(inObject)
	{
		this.GameEventBase('onGameObjectDestroyed');
		this.myObject = inObject;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(inOther)
		{
			//TODO
		}
	}
});





ECGame.EngineLib.Events.AddedToEntity = ECGame.EngineLib.Class.create({
	Constructor : function AddedToEntity(inEntity)
	{
		this.GameEventBase('onAddedToEntity');
		this.entity = inEntity;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(inOther)
		{
			//TODO
		}
	}
});



//TODO move to own file
ECGame.EngineLib.Events.RemovedFromEntity = ECGame.EngineLib.Class.create({
	Constructor : function RemovedFromEntity(inEntity)
	{
		this.GameEventBase('onRemovedFromEntity');
		this.entity = inEntity;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(inOther)
		{
			//TODO
		}
	}
});



//TODO move to own file
ECGame.EngineLib.Events.AddedToWorld = ECGame.EngineLib.Class.create({
	Constructor : function AddedToWorld(inWorld)
	{
		this.GameEventBase('onAddedToWorld');
		this.world = inWorld;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(inOther)
		{
			//TODO
		}
	}
});



ECGame.EngineLib.Events.RemovedFromWorld = ECGame.EngineLib.Class.create({
	Constructor : function RemovedFromWorld(inWorld)
	{
		this.GameEventBase('onRemovedFromWorld');
		this.world = inWorld;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(inOther)
		{
			//TODO
		}
	}
});



ECGame.EngineLib.Events.Input = ECGame.EngineLib.Class.create({
	Constructor : function Input(inMousePosition, inButtons, inKeys, inKeysPressed)
	{
		this.GameEventBase('onInput');
		if(inMousePosition)
		{
			this.mouseLoc = inMousePosition.clone();//TODO rename mouseLoc to mousePos
		}
		else
		{
			this.mouseLoc = new ECGame.EngineLib.Point2();
		}
		this.buttons = inButtons || {};
		this.keys = inKeys || {};
		this.keysPressed = inKeysPressed || {};
		this.clicked = {};//TODO param?
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(inOther)
		{
			//TODO
		}
	}
});






ECGame.EngineLib.Events.ConnectedToServer = ECGame.EngineLib.Class.create({
	Constructor : function ConnectedToServer()
	{
		this.GameEventBase('onConnectedToServer');
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(inOther)
		{
			//TODO
		}
	}
});








ECGame.EngineLib.Events.DisconnectedFromServer = ECGame.EngineLib.Class.create({
	Constructor : function DisconnectedFromServer()
	{
		this.GameEventBase('onDisconnectedFromServer');
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(inOther)
		{
			//TODO
		}
	}
});





ECGame.EngineLib.Events.IdentifiedUser = ECGame.EngineLib.Class.create({
	Constructor : function IdentifiedUser(inUser)
	{
		this.GameEventBase('onIdentifiedUser');
		this.user = inUser;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(inOther)
		{
			//TODO
		}
	}
});



//Note: This is actually only fired if the user is identified TODO rename as such??
ECGame.EngineLib.Events.ClientDisconnected = ECGame.EngineLib.Class.create({
	Constructor : function ClientDisconnected(inUser)
	{
		this.GameEventBase('onClientDisconnected');
		this.user = inUser;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(inOther)
		{
			//TODO
		}
	}
});





//TODO rename NetMsg
ECGame.EngineLib.Events.Msg = ECGame.EngineLib.Class.create({
	Constructor : function Msg(inMsg)
	{
		this.GameEventBase('onMsg');
		this.msg = inMsg;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(inOther)
		{
			//TODO
		}
	}
});




//TODO rename NetData
ECGame.EngineLib.Events.Data = ECGame.EngineLib.Class.create({
	Constructor : function Data(inData)
	{
		this.GameEventBase('onData');
		this.data = inData;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(inOther)
		{
			//TODO
		}
	}
});



ECGame.EngineLib.Events.NetObjects = ECGame.EngineLib.Class.create({
	Constructor : function NetObjects(inData)
	{
		this.GameEventBase('onNetObjects');
		this.data = inData;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(inOther)
		{
			//TODO
		}
	}
});



ECGame.EngineLib.Events.RequestVelocity = ECGame.EngineLib.Class.create({
	Constructor : function RequestVelocity(inVelocity)
	{
		this.GameEventBase('onRequestVelocity');
		this.direction = inVelocity;//TODO rename direction as velocity
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(inOther)
		{
			//TODO
		}
	}
});


//TODO ECGame.EngineLib.Events.PhysObjectUpdate and this are the same
ECGame.EngineLib.Events.UpdatePosition = ECGame.EngineLib.Class.create({
	Constructor : function UpdatePosition(inPos, inVel, inAABB)
	{
		this.GameEventBase('onUpdatePosition');
		this.position = inPos;
		this.velocity = inVel;
		this.boundingRect = inAABB;//TODO rename boundingRect => aabb
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		copyFrom : function copyFrom(inOther)
		{
			//TODO
		}
	}
});



ECGame.EngineLib.Events.PlaySound = ECGame.EngineLib.Class.create({
	Constructor : function PlaySound(inSoundDescriptionID, inIsPositional, inIsFollowingSource, inRadius)
	{
		this.GameEventBase('onPlaySound');
		this.mySoundDescriptionID = inSoundDescriptionID;
		this.myIsPositional = inIsPositional;
		this.myIsFollowingSource = inIsFollowingSource;//TODO rename isMovingWithSource
		this.myRadius = inRadius;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		copyFrom : function copyFrom(inOther)
		{
			this.mySoundDescriptionID = inOther.mySoundDescriptionID;
			this.myIsPositional = inOther.myIsPositional;
			this.myIsFollowingSource = inOther.myIsFollowingSource;
			this.myRadius = inOther.myRadius;
		}
	}
});


//TODO ECGame.EngineLib.Events.UpdatePosition and this are the same!!!
ECGame.EngineLib.Events.PhysObjectUpdate = ECGame.EngineLib.Class.create({
	Constructor : function PhysObjectUpdate(inPosition, inVelocity, inAABB)
	{
		this.GameEventBase('onPhysObjectUpdate');//TODO rename (on)PhysicsObjectUpdate
		this.position = inPosition;
		this.velocity = inVelocity;
		this.boundingRect = inAABB;//TODO rename AABB
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		copyFrom : function copyFrom(inOther)
		{
			//TODO
		}
	}
});