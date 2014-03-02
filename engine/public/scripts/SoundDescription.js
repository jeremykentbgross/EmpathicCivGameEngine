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

//Passed to sound or sound2d
ECGame.EngineLib.SoundDescription = ECGame.EngineLib.Class.create({
	Constructor : function SoundDescription(
		inID
		//TODO name
		,inSoundSampleIDs
//		,inRepeat		//[0,?) || -1 for infinite
//		,inRepeatDelay	//time between repeats
//		,inRepeatDelayVariation
	)
	{
		var i, aTotal, aSample, aAudioSystem;
		
		aAudioSystem = ECGame.instance.getSoundSystem();

		this._myID = inID;
		this._mySamples = [];
//		this._myRepeat = inRepeat || 0;
//		this._myRepeatDelay = inRepeatDelay || 0;
//		this._myRepeatDelayVariation = inRepeatDelayVariation || 0;
		
		//find the total probablity of all samples (should == 1)
		aTotal = 0;
		for(i = 0; i < inSoundSampleIDs.length; ++i)
		{
			aSample = aAudioSystem._mySoundSampleLib[inSoundSampleIDs[i]];
			this._mySamples.push(aSample);
			aTotal += aSample._myProbablity;
		}
		//assert that the total probablity of all samples is ~1.0
		console.assert(Math.abs(aTotal - 1) < 0.01);
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		/*
		SEE: http://www.html5rocks.com/en/tutorials/webaudio/games/samples/machine-gun/gun.js
		function ??(inDestination)
			var time = context.currentTime;
			if(repeat === 0 || repeat === -1)
			{
				aSource = makeSource probablity weighted random sample;
				aSource.loop = (repeat === -1);	//maybe not the best way
				aSource.connect(inDestination);
				aSource.noteOn(	//how to handle this with actual sound object??
					time + i * _myRepeatDelay
					+ Math.random() * 2 * _myRepeatDelayVariation - _myRepeatDelayVariation
				);
			}
			for (var i = 0; i < repeat; i++)
			{
				aSource = makeSource probablity weighted random sample;
				aSource.connect(inDestination);
				aSource.noteOn(	//how to handle this with actual sound object??
					time + i * _myRepeatDelay
					+ Math.random() * 2 * _myRepeatDelayVariation - _myRepeatDelayVariation
				);
			}
			return aSources[];??
		*/
		//TODO should be plural using psuedo code above!!!!!!!!!!!!!!!!
		createAndPlaySourceBuffer : function createAndPlaySourceBuffer(inDestination)
		{
			var i,
				aTotal,
				aSample,
				aRandomValue,
				aSourceBuffer;
			
			aRandomValue = Math.random();
			aTotal = 0;
			for(i = 0; i < this._mySamples.length; ++i)
			{
				aSample = this._mySamples[i];
				aTotal += aSample._myProbablity;
				if(aTotal >= aRandomValue)
				{
					aSourceBuffer = aSample.createSourceBuffer();
					aSourceBuffer.connect(inDestination);
					aSourceBuffer.noteOn(0);
					aSourceBuffer._myStartTime = ECGame.instance.getSoundSystem()._myContext.currentTime;
					aSourceBuffer._mySoundDescriptionID = this._myID;
					//TODO add description name
					return aSourceBuffer;
				}
			}
		}
	}
});