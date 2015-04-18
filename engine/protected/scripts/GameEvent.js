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
ECGame.EngineLib.Events = function Events() { return; };
ECGame.EngineLib.Events = new ECGame.EngineLib.Events();

//TODO split to different files: entity events, net events, etc

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
		//TODO function getPriority()
		
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


////////////////////////////////////////////////////////////////////////////////////////
//GameObject Events/////////////////////////////////////////////////////////////////////
ECGame.EngineLib.Events.GameObjectNetDirty = ECGame.EngineLib.Class.create({
	Constructor : function GameObjectNetDirty(inObject, inUserID)
	{
		this.GameEventBase('onGameObjectNetDirty');
		this.myObject = inObject;
		this.myUserID = inUserID;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(/*inOther*/){return;}
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
		copyFrom : function copyFrom(/*inOther*/){return;}
	}
});
//GameObject Events/////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////////////////
//EntityComponent Events////////////////////////////////////////////////////////////////
//TODO rename to Component<AddedTo/RemovedFrom>Entity
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
		copyFrom : function copyFrom(/*inOther*/){return;}
	}
});

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
		copyFrom : function copyFrom(/*inOther*/){return;}
	}
});
//EntityComponent Events////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////////////////
//Entity Events/////////////////////////////////////////////////////////////////////////
ECGame.EngineLib.Events.EntityAddedToWorld = ECGame.EngineLib.Class.create({
	Constructor : function EntityAddedToWorld(inWorld, inEntity)
	{
		this.GameEventBase('onEntityAddedToWorld');
		this.world = inWorld;
		this.myEntity = inEntity;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(/*inOther*/){return;}
	}
});

ECGame.EngineLib.Events.EntityRemovedFromWorld = ECGame.EngineLib.Class.create({
	Constructor : function EntityRemovedFromWorld(inWorld, inEntity)
	{
		this.GameEventBase('onEntityRemovedFromWorld');
		this.world = inWorld;
		this.myEntity = inEntity;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(/*inOther*/){return;}
	}
});
//Entity Events/////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////////////////
//Input Events//////////////////////////////////////////////////////////////////////////
ECGame.EngineLib.Events.Input = ECGame.EngineLib.Class.create({
	Constructor : function Input(inInputID, inMousePosition, inButtons, inKeys, inKeysPressed)
	{
		this.GameEventBase('onInput');
		
		this.myInputID = inInputID;
		
		if(inMousePosition)
		{
			this.myMousePosition = inMousePosition.clone();
		}
		else
		{
			this.myMousePosition = new ECGame.EngineLib.Point2D();
		}
		this.buttons = inButtons || {};
		this.keys = inKeys || {};
		this.keysPressed = inKeysPressed || {};
		this.clicked = {};//TODO param?
		
		this.KEYBOARD = ECGame.EngineLib.Input.KEYBOARD;
		
		//TODO: input source??
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(/*inOther*/){return;}
	}
});
//Input Events//////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////






////////////////////////////////////////////////////////////////////////////////////////
//Network Events////////////////////////////////////////////////////////////////////////
//TODO which of these are still used?

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
		copyFrom : function copyFrom(/*inOther*/){return;}
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
		copyFrom : function copyFrom(/*inOther*/){return;}
	}
});

ECGame.EngineLib.Events.ClientConnected = ECGame.EngineLib.Class.create({
	Constructor : function ClientConnected(inUser)
	{
		this.GameEventBase('onClientConnected');
		this.user = inUser;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : 
	{
		copyFrom : function copyFrom(/*inOther*/){return;}
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
		copyFrom : function copyFrom(/*inOther*/){return;}
	}
});

//TODO rename NetMsg or *ChatMessage*
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
		copyFrom : function copyFrom(/*inOther*/){return;}
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
		copyFrom : function copyFrom(/*inOther*/){return;}
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
		copyFrom : function copyFrom(/*inOther*/){return;}
	}
});
//Network Events////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////////////////
//Physics Events////////////////////////////////////////////////////////////////////////
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
		copyFrom : function copyFrom(/*inOther*/){return;}
	}
});

ECGame.EngineLib.Events.SetPosition = ECGame.EngineLib.Class.create({
	Constructor : function SetPosition(inPosition)
	{
		this.GameEventBase('onSetPosition');
		this.myPosition = inPosition;
		//TODO orientation?
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init(inPosition)
		{
			this.myPosition = inPosition;
		},
		
		copyFrom : function copyFrom(/*inOther*/){return;}
	}
});

//TODO SetPhysicsStatus/GetPhysicsStatus (all valid fields)??
/*ECGame.EngineLib.Events.GetPhysicsStatus = ECGame.EngineLib.Class.create({
	Constructor : function GetPhysicsStatus()
	{
		this.GameEventBase('onGetPhysicsStatus');
		this.myPosition = null;
		this.myVelocity = null;
		this.myAABB = null;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		copyFrom : function copyFrom(/ *inOther* /){return;}
	}
});*/

ECGame.EngineLib.Events.UpdatedPhysicsStatus = ECGame.EngineLib.Class.create({
	Constructor : function UpdatedPhysicsStatus(inEntity, inPos, inVel, inAABB)
	{
		this.GameEventBase('onUpdatedPhysicsStatus');
		this.myEntity = inEntity;
		this.position = inPos.clone();
		this.velocity = inVel.clone();
		this.boundingRect = inAABB.clone();//TODO rename boundingRect => aabb
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		copyFrom : function copyFrom(/*inOther*/){return;}
	}
});

ECGame.EngineLib.Events.PhysicsObjectUpdated = ECGame.EngineLib.Class.create({
	Constructor : function PhysicsObjectUpdated(inPosition, inVelocity, inAABB)
	{
		this.GameEventBase('onPhysicsObjectUpdated');//TODO rename (on)PhysicsObjectUpdate
		this.position = inPosition.clone();
		this.velocity = inVelocity.clone();
		this.boundingRect = inAABB.clone();//TODO rename AABB
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		copyFrom : function copyFrom(/*inOther*/){return;}
	}
});
//Physics Events////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////////////////
//Sound Events//////////////////////////////////////////////////////////////////////////
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
//Sound Events//////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////////////////
//Camera////////////////////////////////////////////////////////////////////////////////
ECGame.EngineLib.Events.CameraVolumeUpdate = ECGame.EngineLib.Class.create({
	Constructor : function CameraVolumeUpdate(inCameraComponent, inAABB2D)
	{
		this.GameEventBase('onCameraVolumeUpdate');
		this.myCameraComponent = inCameraComponent;
		this.myAABB2D = inAABB2D;
	},
	Parents : [ECGame.EngineLib.Events.GameEventBase],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		copyFrom : function copyFrom(/*inOther*/){return;}//TODO
	}
});
//Camera////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////


