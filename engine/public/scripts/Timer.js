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

/*global requestAnimFrame: true */

ECGame.EngineLib.TimerUpdateData = function TimerUpdateData(
	inDeltaTime
	,inAverageDeltaTime
	,inFrameCount
	,inFrameTime
)
{
	this.myDeltaTime = inDeltaTime;
	this.myAverageDeltaTime = inAverageDeltaTime;
	this.myFrameCount = inFrameCount;
	this.myFrameTime = inFrameTime;
	
	this.myFPS = (1000 / inAverageDeltaTime).toFixed(3);
};



ECGame.EngineLib.Timer = ECGame.EngineLib.Class.create({
	Constructor : function Timer()
	{
		this._myFrameTime = 0;
		this._myFrameCount = 0;
		this._myFrameTimes = [];
		this._myIntervalHandle = null;
		this._myTimerCallbacks = new ECGame.EngineLib.createGameCircularDoublyLinkedListNode();
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		getFrameCount : function getFrameCount()
		{
			return this._myFrameCount;
		}
		,getFrameTime : function getFrameTime()
		{
			return this._myFrameTime;
		}
		
		,setTimerCallback : function setTimerCallback(inTimeDelay, inCallback)
		{
			var aTimerNode;

			this._myTimerCallbacks.insertBack(
				aTimerNode = new ECGame.EngineLib.createGameCircularDoublyLinkedListNode(
					{
						_myCallback : inCallback,
						_myTimeDelay : inTimeDelay,
						_myAccumulatedTime : 0
					}
				)
			);
			
			return aTimerNode;
		},
		clearTimerCallback : function clearTimerCallback(inCallbackHandle)
		{
			inCallbackHandle.remove();
		},

		start : function start()
		{
			var i;
				
			this._myFrameTime = 0;
			this._myFrameCount = 0;
			this._myFrameTimes = [];
			
			if(this._myIntervalHandle)
			{
				clearInterval(this._myIntervalHandle);
				this._myIntervalHandle = null;
			}
			
			for(i = 0; i < 64; ++i)
			{
				this._myFrameTimes[i] = 16;
			}
				
			this._myFrameTime = (new Date()).getTime();
			
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
							window.setTimeout(
								callback
								,1000 / ECGame.Settings.Timer.targetFPS
							);
						};
				}
				else
				{
					requestAnimFrame =
						function requestAnimFrame( callback ){
							setTimeout(
								callback
								,1000 / ECGame.Settings.Timer.targetFPS
							);
						};
				}
				
				requestAnimFrame(this._onAnimFrame);
			}
			else
			{
				this._myIntervalHandle = setInterval(
					this._onAnimFrame
					,1000 / ECGame.Settings.Timer.targetFPS
				);
			}
		},
		
		update : function update(inTime)//TODO private?
		{
			var aDeltaTime
				,anAverageDeltaTime
				,aFinishedTimerNodes
				,aTimerNode
				,aFrameStats
				,i
				;
			
			//prefer the browser presented inTime if it is availible, but fall back to getting it if its not there
			if(inTime === undefined)
			{
				//note must new it as it keeps the inTime it was created
				inTime = (new Date()).getTime();//TODO use .now
			}
			
			aDeltaTime = Math.max(0, inTime - this._myFrameTime);
			this._myFrameTime = inTime;
			++this._myFrameCount;
			
			//TODO handle HUGE dt's (by pausing?)
			
			this._myFrameTimes[this._myFrameCount % this._myFrameTimes.length] = aDeltaTime;
			
			anAverageDeltaTime = 0;
			for(i = 0; i < this._myFrameTimes.length; ++i)
			{
				anAverageDeltaTime += this._myFrameTimes[i];
			}
			anAverageDeltaTime /= this._myFrameTimes.length;
				
			if(ECGame.Settings.DEBUG)
			{
				aFrameStats = [
					"Average FPS: " + (1000 / anAverageDeltaTime).toFixed(3),
					"Average MS/F: " + anAverageDeltaTime.toFixed(3),
					"Last Frame Time: " + aDeltaTime,
					"Frame Count: " + this._myFrameCount
				];
				if(ECGame.Settings.isDebugDraw_FrameStats())
				{
					ECGame.instance.getGraphics().drawDebugText(aFrameStats[0], ECGame.Settings.Debug.FrameStats_DrawColor);
					ECGame.instance.getGraphics().drawDebugText(aFrameStats[1], ECGame.Settings.Debug.FrameStats_DrawColor);
					ECGame.instance.getGraphics().drawDebugText(aFrameStats[2], ECGame.Settings.Debug.FrameStats_DrawColor);
					ECGame.instance.getGraphics().drawDebugText(aFrameStats[3], ECGame.Settings.Debug.FrameStats_DrawColor);
				}
				if(ECGame.Settings.isDebugPrint_FrameStats())
				{
					console.log(
						'\n' + aFrameStats[0] +
						'\n' + aFrameStats[1] +
						'\n' + aFrameStats[2] +
						'\n' + aFrameStats[3]
					);
				}
			}
			
			//fire custom timers
			aFinishedTimerNodes = [];
			this._myTimerCallbacks.forAll(
				function updateTimerCallback(inItem, inNode)
				{
					inItem._myAccumulatedTime += aDeltaTime;
					if(inItem._myTimeDelay < inItem._myAccumulatedTime)
					{
						inItem._myAccumulatedTime -= inItem._myTimeDelay;
						aFinishedTimerNodes.push(inNode);
					}
				},
				true
			);
			for(i = 0; i < aFinishedTimerNodes.length; ++i)
			{
				aTimerNode = aFinishedTimerNodes[i];
				if(!aTimerNode.item._myCallback())
				{
					this.clearTimerCallback(aTimerNode);
				}
			}
			
			ECGame.instance.update(
				new ECGame.EngineLib.TimerUpdateData(
					aDeltaTime
					,(
						ECGame.Settings.Timer.averageDeltaTimes ?
							anAverageDeltaTime
							:aDeltaTime
					)
					,this._myFrameCount
					,this._myFrameTime
				)
			);
			
			if(ECGame.Settings.Timer.useRequestAnimFrame && ECGame.instance.isRunning())//TODO higher fps likely if at start??
			{
				requestAnimFrame(this._onAnimFrame);
			}
			else if(!ECGame.Settings.Timer.useRequestAnimFrame && !ECGame.instance.isRunning())
			{
				clearInterval(this._myIntervalHandle);
			}
		},
		
		_onAnimFrame : function _onAnimFrame(inTime)
		{
			ECGame.instance.getTimer().update(inTime);//TODO static instance, assert(singleton)
		}
	}
});


