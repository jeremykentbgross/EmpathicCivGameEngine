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

GameEngineLib.GameNetwork = function GameNetwork()
{
	GameEngineLib.GameNetwork.instance = this;
}
GameEngineLib.GameNetwork.prototype.constructor = GameEngineLib.GameNetwork;

GameEngineLib.GameNetwork.create = function create()
{
	return new GameEngineLib.GameNetwork();
}



GameEngineLib.GameNetwork.prototype.init = function init()
{
	if(GameSystemVars.Network.GamePort !== null)
	{
		this._listenSocket = GameEngineServer.socketio.listen(GameSystemVars.Network.GamePort);
	}
	else
	{
		this._listenSocket = GameEngineServer.listenSocket;
	}
	
	this._listenSocket.sockets.on("connection", this._onClientConnected);
	
	console.log("TCP Server running.");
}



GameEngineLib.GameNetwork.prototype._onClientConnected = function _onClientConnected(inConnectedSocket)
{
	var _this_ = GameEngineLib.GameNetwork.instance;
	
	//TODO event
	
	inConnectedSocket.on("msg", _this_._onMsgRecv);
	inConnectedSocket.on("data", _this_._onDataRecv);
	inConnectedSocket.on("disconnect", _this_._onClientDisconnected);
	
	//tell everone they have connected:
	inConnectedSocket.broadcast.emit("msg", "User Connected");
}



GameEngineLib.GameNetwork.prototype._onClientDisconnected = function _onClientDisconnected()
{
	//this == socket disconnecting!
	var _this_ = GameEngineLib.GameNetwork.instance;
	
	_this_._listenSocket.sockets.emit("msg", "User Disconnected");
	
	//on disconnect tell everyone that they are gone
}



GameEngineLib.GameNetwork.prototype._onMsgRecv = function _onMsgRecv(inMsg)
{
	//TODO append users name
	this.broadcast.emit("msg", inMsg);
	
	if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
	{
		GameEngineLib.logger.info("NetRecv: " + inMsg);
	}
}



GameEngineLib.GameNetwork.prototype._onDataRecv = function _onDataRecv(inData)
{
	this.broadcast.emit("data", inData);
			
	if(GameSystemVars.DEBUG && GameSystemVars.Debug.NetworkMessages_Print)
	{
		GameEngineLib.logger.info("NetRecv: " + inData);
	}
}



GameEngineLib.GameNetwork.prototype.isUpdating = function isUpdating()
{
	return false;//TEMP HACK
}