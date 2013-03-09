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

ECGame.EngineLib.GameEvent = ECGame.EngineLib.Class.create({
	Constructor : function GameEvent(inCallbackName)
	{
		this._callbackName = inCallbackName;
	},
	Parents : null,
	flags : {},
	ChainUp : [],
	ChainDown : [],
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
		}
	}
});





ECGame.EngineLib.GameEvent_AddedToEntity = ECGame.EngineLib.Class.create({
	Constructor : function AddedToEntity(inEntity)
	{
		this.GameEvent('onAddedToEntity');
		this.entity = inEntity;
	},
	Parents : [ECGame.EngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});



//TODO move to own file
ECGame.EngineLib.GameEvent_RemovedFromEntity = ECGame.EngineLib.Class.create({
	Constructor : function RemovedFromEntity(inEntity)
	{
		this.GameEvent('onRemovedFromEntity');
		this.entity = inEntity;
	},
	Parents : [ECGame.EngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});



//TODO move to own file
ECGame.EngineLib.GameEvent_AddedToWorld = ECGame.EngineLib.Class.create({
	Constructor : function AddedToWorld(inWorld)
	{
		this.GameEvent('onAddedToWorld');
		this.world = inWorld;
	},
	Parents : [ECGame.EngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});



ECGame.EngineLib.GameEvent_RemovedFromWorld = ECGame.EngineLib.Class.create({
	Constructor : function RemovedFromWorld(inWorld)
	{
		this.GameEvent('onRemovedFromWorld');
		this.world = inWorld;
	},
	Parents : [ECGame.EngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});



ECGame.EngineLib.GameEvent_Input = ECGame.EngineLib.Class.create({
	Constructor : function Input(inMousePosition, inButtons, inKeys, inKeysPressed)
	{
		this.GameEvent('onInput');
		if(inMousePosition)
		{
			this.mouseLoc = inMousePosition.clone();//TODO rename mouseLoc to mousePos
		}
		else
		{
			this.mouseLoc = new ECGame.EngineLib.Game2DPoint();
		}
		this.buttons = inButtons || {};
		this.keys = inKeys || {};
		this.keysPressed = inKeysPressed || {};
		this.clicked = {};//TODO param?
	},
	Parents : [ECGame.EngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});






ECGame.EngineLib.GameEvent_ConnectedToServer = ECGame.EngineLib.Class.create({
	Constructor : function ConnectedToServer()
	{
		this.GameEvent('onConnectedToServer');
	},
	Parents : [ECGame.EngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});








ECGame.EngineLib.GameEvent_DisconnectedFromServer = ECGame.EngineLib.Class.create({
	Constructor : function DisconnectedFromServer()
	{
		this.GameEvent('onDisconnectedFromServer');
	},
	Parents : [ECGame.EngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});





ECGame.EngineLib.GameEvent_IdentifiedUser = ECGame.EngineLib.Class.create({
	Constructor : function IdentifiedUser(inUser)
	{
		this.GameEvent('onIdentifiedUser');
		this.user = inUser;
	},
	Parents : [ECGame.EngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});



//Note: This is actually only fired if the user is identified TODO rename as such??
ECGame.EngineLib.GameEvent_ClientDisconnected = ECGame.EngineLib.Class.create({
	Constructor : function ClientDisconnected(inUser)
	{
		this.GameEvent('onClientDisconnected');
		this.user = inUser;
	},
	Parents : [ECGame.EngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});





//TODO rename NetMsg
ECGame.EngineLib.GameEvent_Msg = ECGame.EngineLib.Class.create({
	Constructor : function Msg(inMsg)
	{
		this.GameEvent('onMsg');
		this.msg = inMsg;
	},
	Parents : [ECGame.EngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});




//TODO rename NetData
ECGame.EngineLib.GameEvent_Data = ECGame.EngineLib.Class.create({
	Constructor : function Data(inData)
	{
		this.GameEvent('onData');
		this.data = inData;
	},
	Parents : [ECGame.EngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});



ECGame.EngineLib.GameEvent_NetObjects = ECGame.EngineLib.Class.create({
	Constructor : function NetObjects(inData)
	{
		this.GameEvent('onNetObjects');
		this.data = inData;
	},
	Parents : [ECGame.EngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});



ECGame.EngineLib.GameEvent_RequestVelocity = ECGame.EngineLib.Class.create({
	Constructor : function RequestVelocity(inVelocity)
	{
		this.GameEvent('onRequestVelocity');
		this.direction = inVelocity;//TODO rename direction as velocity
	},
	Parents : [ECGame.EngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});








ECGame.EngineLib.GameEvent_UpdatePosition = ECGame.EngineLib.Class.create({
	Constructor : function UpdatePosition(inPos, inVel, inAABB)
	{
		this.GameEvent('onUpdatePosition');
		this.position = inPos;
		this.velocity = inVel;
		this.boundingRect = inAABB;//TODO rename boundingRect => aabb
	},
	Parents : [ECGame.EngineLib.GameEvent],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition : {}
});