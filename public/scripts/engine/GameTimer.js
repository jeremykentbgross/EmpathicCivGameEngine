GameEngineLib.createGameTimer = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	if(GameSystemVars.DEBUG)
	{
		GameEngineLib.addDebugInfo("GameTimer", instance, private);
	}
	
	instance.init = function()
	{		
		private.lastFrameTimeStamp = 0;
		private.frameCount = 0;
		private.frameTimes = [];
		
		for(var i = 0; i < 64; ++i)
			private.frameTimes[i] = 16;
			
		private.lastFrameTimeStamp = (new Date()).getTime();
	}
	
	instance.update = function(time)
	{
		//prefer the browser presented time if it is availible, but fall back to getting it if its not there
		if(time === undefined)
		{
			//note must new it as it keeps the time it was created
			time = (new Date()).getTime();//TODO use .now
		}
		
		private.dt = time - private.lastFrameTimeStamp;
		private.lastFrameTimeStamp = time;
		++private.frameCount;
		
		//TODO handle HUGE dt's (by pausing?)
		
		private.frameTimes[private.frameCount % private.frameTimes.length] = private.dt;
		private.aveDt = 0;
		for(var i = 0; i < private.frameTimes.length; ++i)
			private.aveDt += private.frameTimes[i];
		private.aveDt /= private.frameTimes.length;
		
		//TODO update accumulators and fire timer events
		
		if(GameSystemVars.DEBUG)
		{
			var frameStats = [
				"Average FPS: " + (1000 / private.aveDt).toFixed(3),
				"Average MS/F: " + private.aveDt.toFixed(3),
				"Last Frame Time: " + private.dt,
				"Frame Count: " + private.frameCount
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
		
		return private.aveDt;
	}
	
	instance.getFrameCount = function()
	{
		return private.frameCount;
	}
	
	//TODO register timer events / accumulators
	
	return instance;
}