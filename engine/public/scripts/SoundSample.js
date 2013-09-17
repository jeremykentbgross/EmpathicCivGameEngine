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

ECGame.EngineLib.SoundSample = ECGame.EngineLib.Class.create({
	Constructor : function SoundSample(
		inID
		//TODO name?
		,inAssetID
		,inProbability
		,inVolume			//base volume %
		,inVolumeVariation	//optional +/- random range (%)
		,inPitchShift	//optional +/- random range (in semitones)
						//	Note: semitone == halfstep == 100 cents == 1/12 of an octave.
		)
	{
		this._myID = inID;
		this._mySoundAsset = ECGame.instance.getSoundSystem()._mySoundAssetLib[inAssetID];
		this._myProbablity = (inProbability === undefined) ? 1 : inProbability;
		this._myVolume = (inVolume === undefined) ? 1 : inVolume;
		this._myVolumeVariation = (inVolumeVariation === undefined) ? 0 : inVolumeVariation;
		this._myPitchVariation = (inPitchShift === undefined) ? 0 : inPitchShift;
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		createSourceBuffer : function createSourceBuffer()
		{
			var aSound, aSourceBuffer;
			
			aSourceBuffer = ECGame.instance.getSoundSystem()._myContext.createBufferSource();
			aSourceBuffer.buffer = this._mySoundAsset._mySoundBuffer;
			aSourceBuffer._myFileName = this._mySoundAsset._myFileName;
			aSourceBuffer._myAssetID = this._mySoundAsset._myID;
			aSourceBuffer._mySampleID = this._myID;
			//TODO sample name?
			aSourceBuffer.gain.value = this._myVolume + Math.random() * 2 * this._myVolumeVariation - this._myVolumeVariation;
			//semitone == halfstep == 100 cents == 1/12 of an octave.
			//	(+/- semiTone => 2 * X - 1)
			//	playback = 2^(octave delta)
			//	playback = 2^(semiTone/12)
			aSourceBuffer.playbackRate.value = Math.pow(
				2,
				(Math.random() * 2 * this._myPitchVariation - this._myPitchVariation) / 12
			);
			
			return aSourceBuffer;
		}
	}
});