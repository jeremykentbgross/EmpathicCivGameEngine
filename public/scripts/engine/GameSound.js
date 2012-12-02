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

GameEngineLib.Sound = GameEngineLib.Class(
{
	Constructor : function Sound(inSource, inStartedTime, inFileName)
	{
		this._source = inSource;
		this._startedTime = inStartedTime;
		this._fileName = inFileName;
	},
	
	Parents : null,
	flags : {},
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		play : function play(inTimeDelay)
		{
			this._source.noteOn(inTimeDelay);
		},
		
		/*
		From Web Audio API:
		UNSCHEDULED_STATE, SCHEDULED_STATE, PLAYING_STATE, FINISHED_STATE
		*/
		isFinished : function isFinished()
		{
			return (this._source.playbackState === this._source.FINISHED_STATE);
		},
		
		//TODO
		//function stop() this.source.stop(0);

		debugDraw : function debugDraw(inCanvas2DContext, inCameraRect, inCurrentTime)
		{
			var percentPlayed = (inCurrentTime - this._startedTime) / this._source.buffer.duration;
							
			GameInstance.Graphics.drawDebugText(
				'-' + this._fileName + ': %' + Math.floor(percentPlayed * 100),
				GameSystemVars.Debug.Sound_Area_DrawColor
			);
		}
	}
});