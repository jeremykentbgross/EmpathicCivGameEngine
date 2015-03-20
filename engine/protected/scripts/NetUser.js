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

//TODO rename Object NetUser

/*//all user objects should be added to netgroups as objects
User : Object
	-name
	-id
	-ping
	-connected (bool)
	-socket (server only??)
	-fb/pic/etc?
	-serialize if locally owned?, make local User
	-netgroup (there can only be one)
	-onDisconnectedToLongTimer
*/
//TODO make server id for smaller messages!!
//Note: watch out when adding new values to this structure as it is serialized
ECGame.EngineLib.User = function User(inName, inID)
{
	var i;
	
	this.userName = inName || "Guest";	//TODO give random name here??
	this.userID = inID || ECGame.EngineLib.User.USER_IDS.NEW_USER;
	this.reconnectKey = Math.random();
	
	this.mySocket = null;
	
	this.myUnacknowledgedFrames = [];//sent frames that are unacknowledged; TODO linkedlist
	this.myLastAcknowledgedFrame = -1;//last acknowledged frame
	this.myLastRecievedFrame = 0;	//most recent frame stamp sent to us by the other side that needs to be acknowledged
	
	this.myPing = 0;
	this.myPings = [];
	this.myNextPingIndex = 0;
	for(i = 0; i < 128; ++i)
	{
		this.myPings[i] = 0;
	}
	
	this._myRemoteFPS = [];
	this._myRemoteAverageFPS = 0;
};
ECGame.EngineLib.User.prototype.constructor = ECGame.EngineLib.User;

ECGame.EngineLib.User.USER_IDS =
{
	UNUSED : 0
	,SERVER : 1
	,NEW_USER : 2
	
	,CURRENT_MAX : 2	//enum max!	TODO make static, and this one is not const!
	
	,MAX_EVER : 65535
};



ECGame.EngineLib.User.prototype.addRemoteFPS = function addRemoteFPS(inRemoteFPS)
{
	this._myRemoteFPS.push(inRemoteFPS);
};



ECGame.EngineLib.User.prototype.createUnacknowledgedNetFrame = function createUnacknowledgedNetFrame()
{
	var anUnacknowledgedNetFrame
		,aTimer
		;
	
	aTimer = ECGame.instance.getTimer();
	anUnacknowledgedNetFrame = 
	{
		myFrame : aTimer.getFrameCount() % (ECGame.Settings.Network.maxFrameWrapForPing + 1),
		myTime : aTimer.getCurrentTime()
	};
	
	this.myUnacknowledgedFrames.push(anUnacknowledgedNetFrame);
	
	if(this.myUnacknowledgedFrames.length >= ECGame.Settings.Network.maxFrameWrapForPing)
	{
		this.mySocket.close(
			4000
			,"Timeout due to over extending max size of ping calculation on "
				+ (ECGame.Settings.Network.isServer ? "server." : "client.")
				+ " (" + this.myUnacknowledgedFrames.length  + "/" + ECGame.Settings.Network.maxFrameWrapForPing + ")"
		);
	}
	
	return anUnacknowledgedNetFrame.myFrame;
};

ECGame.EngineLib.User.prototype.acknowledgedNetFrame = function acknowledgedNetFrame(inMessageHeader)
{
	if(ECGame.Settings.isDebugPrint_NetworkPingCompute())
	{
		console.info(
			"LOOP START:" 
			+ this.myUnacknowledgedFrames.length + " " 
			+ inMessageHeader.acknowledgingFrame + " " 
			+ this.myLastAcknowledgedFrame
		);
	}
	
	//if the acknowledge counter wrapped around
	if(inMessageHeader.acknowledgingFrame < this.myLastAcknowledgedFrame)
	{
		while(
			this.myUnacknowledgedFrames.length	//UnacknowledgedFrames
			&& this.myUnacknowledgedFrames[0].myFrame <= ECGame.Settings.Network.maxFrameWrapForPing	//and all the frames to the wrap around
			&& this.myLastAcknowledgedFrame < this.myUnacknowledgedFrames[0].myFrame	//but don't actually wrap yet
		)
		{
			this._processAcknowledgedFrame(this.myUnacknowledgedFrames.shift(), inMessageHeader.acknowledgingFrame);
		}
	}
	
	this.myLastRecievedFrame = inMessageHeader.frame;
	this.myLastAcknowledgedFrame = inMessageHeader.acknowledgingFrame;
	//HACK:
	//this.myLastRecievedFrame = inMessageHeader.frame < 500 ? inMessageHeader.frame : 499;
	
	while(
		this.myUnacknowledgedFrames.length	//UnacknowledgedFrames
		&& this.myUnacknowledgedFrames[0].myFrame <= inMessageHeader.acknowledgingFrame	//all the frames up to present
	)
	{
		this._processAcknowledgedFrame(this.myUnacknowledgedFrames.shift(), inMessageHeader.acknowledgingFrame);
	}
	if(ECGame.Settings.isDebugPrint_NetworkPingCompute())
	{
		console.info("BREAK END:" + this.myUnacknowledgedFrames.length);
	}
};

ECGame.EngineLib.User.prototype._processAcknowledgedFrame = function _processAcknowledgedFrame(inAcknowledgedFrame, inMessageAcknowledgedFrame)
{
	var anIndex
		;
	
	anIndex = this.myNextPingIndex % this.myPings.length;
	this.myPings[anIndex] = (ECGame.instance.getTimer().getCurrentTime() - inAcknowledgedFrame.myTime);
	++this.myNextPingIndex;
	
	if(ECGame.Settings.isDebugPrint_NetworkPingCompute())
	{
		console.info(
			"User: " + this.userID
			+ " Ping: " + this.myPings[anIndex]
			+ " Struct:" + JSON.stringify(inAcknowledgedFrame)
			+ " In:" + inMessageAcknowledgedFrame
		);
	}
};

ECGame.EngineLib.User.prototype.updatePing = function updatePing()//TODO rename computePing //and remoteFPS??
{
	var aTime
		,aTotal
		,i
		;
	
	aTotal = 0;
	aTime = ECGame.instance.getTimer().getCurrentTime();
	
	for(i = 0; i < this.myPings.length; ++i)
	{
		aTotal += this.myPings[i];
	}
	for(i = 0; i < this.myUnacknowledgedFrames.length; ++i)
	{
		aTotal += (aTime - this.myUnacknowledgedFrames[i].myTime);
	}
	
	aTotal /= (this.myPings.length + this.myUnacknowledgedFrames.length);
	
	this.myPing = aTotal;
	
	if(ECGame.Settings.Network.isServer)//HACK, cause debugDraw not called.
	{
		this._myRemoteFPS = [];
	}
};

ECGame.EngineLib.User.prototype.debugDraw = function debugDraw(inGraphics)
{
	var aMessage = ''
		,aCount = 0
		,i
		;
	
	this.updatePing();
	inGraphics.drawDebugText("Ping: " + this.myPing.toFixed(3), ECGame.Settings.Debug.NetworkMessages_DrawColor);
	
	ECGame.instance.getGraphics().drawDebugText(
		"Recv Packets: " + this._myRemoteFPS.length, ECGame.Settings.Debug.NetworkMessages_DrawColor
	);
	for(i = 0; i < this._myRemoteFPS.length; ++i)
	{
		aMessage += ', ' + this._myRemoteFPS[i].toFixed(3);
		aCount += this._myRemoteFPS[i];
	}
	if(this._myRemoteFPS.length)
	{
		this._myRemoteAverageFPS = aCount / this._myRemoteFPS.length;
	}
	aMessage = "Server FPS: ("
		+ this._myRemoteAverageFPS.toFixed(3)
		+ ')' + aMessage;
	ECGame.instance.getGraphics().drawDebugText(aMessage, ECGame.Settings.Debug.NetworkMessages_DrawColor);
	
	this._myRemoteFPS = [];
};


