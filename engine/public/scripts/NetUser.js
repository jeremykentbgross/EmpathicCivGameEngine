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
	this.userName = inName || "Guest";	//TODO give random name here??
	this.userID = inID || ECGame.EngineLib.User.USER_IDS.NEW_USER;
	this.reconnectKey = Math.random();
	//this.mySocket = null;	//this is added later..
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