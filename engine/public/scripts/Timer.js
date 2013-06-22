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


ECGame.EngineLib.Timer = function Timer(){};
ECGame.EngineLib.Timer.prototype.constructor = ECGame.EngineLib.Timer;
ECGame.EngineLib.Timer.create = function create()
{
	return new ECGame.EngineLib.Timer();
};



ECGame.EngineLib.Timer.prototype.start = function start()
{
	var i;
		
	this._lastFrameTimeStamp = 0;
	this._frameCount = 0;
	this._frameTimes = [];
	
	for(i = 0; i < 64; ++i)
	{
		this._frameTimes[i] = 16;
	}
		
	this._lastFrameTimeStamp = (new Date()).getTime();
	
	if(ECGame.Settings.Timer.useRequestAnimFrame)
	{
		if(!ECGame.Settings.Network.isServer)
		{
			window.requestAnimFrame =
				window.requestAnimationFrame || 
				window.webkitRequestAnimationFrame || 
				window.mozRequestAnimationFrame || 
				window.oRequestAnimationFrame || 
				window.msRequestAnimationFrame ||
				function requestAnimFrame( callback ){
					window.setTimeout(callback, 1000 / 60);
				};
		}
		else
		{
			requestAnimFrame =
				function requestAnimFrame( callback ){
					setTimeout(callback, 1000 / 60);
				};
		}
		
		requestAnimFrame(this._onAnimFrame);
	}
	else
	{
		this._intervalHandle = setInterval(this._onAnimFrame, 1000 / 120);
	}
};



ECGame.EngineLib.Timer.prototype._onAnimFrame = function _onAnimFrame(inTime)
{
	ECGame.instance.timer.update(inTime);//TODO static instance, assert(singleton)
};



ECGame.EngineLib.Timer.prototype.update = function update(inTime)
{
	var i;
	
	//prefer the browser presented inTime if it is availible, but fall back to getting it if its not there
	if(inTime === undefined)
	{
		//note must new it as it keeps the inTime it was created
		inTime = (new Date()).getTime();//TODO use .now
	}
	
	this._dt = Math.max(0, inTime - this._lastFrameTimeStamp);
	this._lastFrameTimeStamp = inTime;
	++this._frameCount;
	
	//TODO handle HUGE dt's (by pausing?)
	
	this._frameTimes[this._frameCount % this._frameTimes.length] = this._dt;
	this._aveDt = 0;
	for(i = 0; i < this._frameTimes.length; ++i)
	{
		this._aveDt += this._frameTimes[i];
	}
	this._aveDt /= this._frameTimes.length;
		
	//if(ECGame.Settings.DEBUG)//Not needed with the functions below
	{
		var frameStats = [
			"Average FPS: " + (1000 / this._aveDt).toFixed(3),
			"Average MS/F: " + this._aveDt.toFixed(3),
			"Last Frame Time: " + this._dt,
			"Frame Count: " + this._frameCount
		];
		if(ECGame.Settings.isDebugDraw_FrameStats())
		{
			ECGame.instance.graphics.drawDebugText(frameStats[0], ECGame.Settings.Debug.FrameStats_DrawColor);
			ECGame.instance.graphics.drawDebugText(frameStats[1], ECGame.Settings.Debug.FrameStats_DrawColor);
			ECGame.instance.graphics.drawDebugText(frameStats[2], ECGame.Settings.Debug.FrameStats_DrawColor);
			ECGame.instance.graphics.drawDebugText(frameStats[3], ECGame.Settings.Debug.FrameStats_DrawColor);
		}
		if(ECGame.Settings.isDebugPrint_FrameStats())
		{
			console.log(
				'\n' + frameStats[0] +
				'\n' + frameStats[1] +
				'\n' + frameStats[2] +
				'\n' + frameStats[3]
			);
		}
	}
	
	//TODO update accumulators and fire timer events instead (likely own update order, etc)
	//TODO update event could have dt, aveDt, Date, etc
	ECGame.instance.update(this._aveDt);
	
	if(ECGame.Settings.Timer.useRequestAnimFrame && ECGame.instance.isRunning())//TODO higher fps likely if at start??
	{
		requestAnimFrame(this._onAnimFrame);
	}
	else if(!ECGame.Settings.Timer.useRequestAnimFrame && !ECGame.instance.isRunning())
	{
		clearInterval(this._intervalHandle);
	}
};



ECGame.EngineLib.Timer.prototype.getFrameCount = function getFrameCount()
{
	return this._frameCount;
};