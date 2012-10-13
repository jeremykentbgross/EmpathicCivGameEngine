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

GameEngineLib.createGameTimer = function(instance, PRIVATE)
{
	instance = instance || {};
	PRIVATE = PRIVATE || {};
	
	if(GameSystemVars.DEBUG)
	{
		GameEngineLib.addDebugInfo("GameTimer", instance, PRIVATE);
	}
	
	instance.init = function()
	{
		var i;
		
		PRIVATE.lastFrameTimeStamp = 0;
		PRIVATE.frameCount = 0;
		PRIVATE.frameTimes = [];
		
		for(i = 0; i < 64; ++i)
		{
			PRIVATE.frameTimes[i] = 16;
		}
			
		PRIVATE.lastFrameTimeStamp = (new Date()).getTime();
	};
	
	instance.update = function(time)
	{
		var i;
		
		//prefer the browser presented time if it is availible, but fall back to getting it if its not there
		if(time === undefined)
		{
			//note must new it as it keeps the time it was created
			time = (new Date()).getTime();//TODO use .now
		}
		
		PRIVATE.dt = time - PRIVATE.lastFrameTimeStamp;
		PRIVATE.lastFrameTimeStamp = time;
		++PRIVATE.frameCount;
		
		//TODO handle HUGE dt's (by pausing?)
		
		PRIVATE.frameTimes[PRIVATE.frameCount % PRIVATE.frameTimes.length] = PRIVATE.dt;
		PRIVATE.aveDt = 0;
		for(i = 0; i < PRIVATE.frameTimes.length; ++i)
		{
			PRIVATE.aveDt += PRIVATE.frameTimes[i];
		}
		PRIVATE.aveDt /= PRIVATE.frameTimes.length;
		
		//TODO update accumulators and fire timer events
		
		if(GameSystemVars.DEBUG)
		{
			var frameStats = [
				"Average FPS: " + (1000 / PRIVATE.aveDt).toFixed(3),
				"Average MS/F: " + PRIVATE.aveDt.toFixed(3),
				"Last Frame Time: " + PRIVATE.dt,
				"Frame Count: " + PRIVATE.frameCount
			];
			if(GameSystemVars.Debug.FrameStats_Draw && !GameSystemVars.Network.isServer)
			{
				GameInstance.Graphics.drawDebugText(frameStats[0], GameSystemVars.Debug.FrameStats_DrawColor);
				GameInstance.Graphics.drawDebugText(frameStats[1], GameSystemVars.Debug.FrameStats_DrawColor);
				GameInstance.Graphics.drawDebugText(frameStats[2], GameSystemVars.Debug.FrameStats_DrawColor);
				GameInstance.Graphics.drawDebugText(frameStats[3], GameSystemVars.Debug.FrameStats_DrawColor);
			}
			if(GameSystemVars.Debug.FrameStats_Print)
			{
				console.log(
					"\n" + frameStats[0] +
					"\n" + frameStats[1] +
					"\n" + frameStats[2] +
					"\n" + frameStats[3]
				);
			}
		}
		
		return PRIVATE.aveDt;
	};
	
	instance.getFrameCount = function()
	{
		return PRIVATE.frameCount;
	};
	
	//TODO register timer events / accumulators
	
	return instance;
};