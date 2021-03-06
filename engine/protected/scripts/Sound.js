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

ECGame.EngineLib.Sound = ECGame.EngineLib.Class.create(
{
	Constructor : function Sound(inSoundDescription, inDestination)
	{
		this._myDescription = inSoundDescription;
		this._myDestination = inDestination;
		this._mySource = null;
	},
	
	Parents : null,
	flags : {},
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		play : function play(/*inTimeDelay*/)
		{
			this._mySource = this._myDescription.createAndPlaySourceBuffer(this._myDestination);
			if(ECGame.Settings.isDebugPrint_Sound())
			{
				console.info("Played sound " + this._getDebugPlayingString());
			}
		},
		
		stop : function stop(inTimeDelay)
		{
			inTimeDelay = inTimeDelay || 0;
			this._mySource.stop(inTimeDelay);
		},
		
		/*
		TODO pause:
			this.pausedAtOffset = ... //now - sound.source.noteOnAt
			stop sound
			isPaused = true //not finished, etc
		TODO resume:
			setup new sound isntance
			play starting at this.pausedAtOffset
		Example (Sortof): http://www.html5rocks.com/en/tutorials/webaudio/fieldrunners/
		*/
		
		/*
		TODO getLength:
			return length of sound
		*/
		
		/*
		From Web Audio API:
		UNSCHEDULED_STATE, SCHEDULED_STATE, PLAYING_STATE, FINISHED_STATE
		*/
		isPlaying : function isPlaying()
		{
			/*
				https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Porting_webkitAudioContext_code_to_standards_based_AudioContext
				If you need to compare this attribute to PLAYING_STATE,
				you can compare the value of AudioContext.currentTime
				to the first argument passed to start() to know whether
				playback has started or not.
			*/
			return !this._mySource._myIsFinished
				&& this._mySource.context.currentTime > this._mySource._myStartTime
			;
		},
		isFinished : function isFinished()
		{
			return this._mySource._myIsFinished;//TODO guess this should not be private
		},
		
		_getDebugPlayingString : function _getDebugPlayingString()//TODO overload this as well!!
		{
			return (
				/*''//TODO add description name
				+*/ '(' + this._mySource._mySoundDescriptionID + '):'
				//TODO sample name?
				+ '(' + this._mySource._mySampleID + '):'
				+ this._mySource._myFileName
				+ '(' + this._mySource._myAssetID + ')'
			);
		},
		
		getPercentPlayed : function getPercentPlayed(inCurrentTime)
		{
			return (inCurrentTime - this._mySource._myStartTime) / this._mySource.buffer.duration;
		},
		
		debugDraw : function debugDraw(inGraphics, inCurrentTime)
		{
			inGraphics.drawDebugText(
				'-' + this._getDebugPlayingString() + ': %' + Math.floor(this.getPercentPlayed(inCurrentTime) * 100),
				ECGame.Settings.Debug.Sound_Area_DrawColor
			);
		}
	}
});