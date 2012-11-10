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



/*
Some relevant web links:
http://www.html5rocks.com/en/tutorials/webaudio/intro/
http://www.html5rocks.com/en/tutorials/webaudio/games/
http://www.html5rocks.com/en/tutorials/webaudio/positional_audio/
http://www.html5rocks.com/en/tutorials/webaudio/fieldrunners/
http://html5doctor.com/native-audio-in-the-browser/
*/

GameEngineLib.SoundDescription = function SoundDescription(inQuickName, inFileName)
{
	this.quickName = inQuickName;
	this.fileName = inFileName;
	//this.sound = null;
};



GameEngineLib.GameSoundSystem = GameEngineLib.Class({
	Constructor : function GameSoundSystem()
	{
		if(GameSystemVars.Network.isServer)
		{
			return;
		}
		
		this._soundLib = [];
		
		try
		{
			//TODO support non webkit AudioContext's
			this._context = new webkitAudioContext();
			
			//HACK!!
			this.loadSounds(
				[
					new GameEngineLib.SoundDescription(0, 'sounds/placeholder.mp3')
				]
			);
			
			//setup master volume
			this._masterVolume = this._context.createGainNode();
			this._masterVolume.connect(this._context.destination);
			
			//setup effects volume
			this._effectsVolume = this._context.createGainNode();
			this._effectsVolume.connect(this._masterVolume);
			
			//TODO setup positional effects volume (linked to effects volume)
			
			//TODO setup music volume (including cross fading tracks)
			//TODO setup UI effects volume
		}
		catch(error)
		{
			console.log(error.stack);
			GameEngineLib.logger.warn("Audio System failed to start in your browser!");
		}
	},
	Parents : null,
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		setMasterVolume : function setMasterVolume(inValue)
		{
			this._masterVolume.gain.value = inValue * inValue;//TODO save value for return
		},
		getMasterVolume : function getMasterVolume()
		{
			return this._masterVolume.gain.value;
		},
		
		
		setEffectsVolume : function setEffectsVolume(inValue)
		{
			this._effectsVolume.gain.value = inValue * inValue;//TODO save value for return
		},
		getEffectsVolume : function getEffectsVolume()
		{
			return this._effectsVolume.gain.value;
		},
		
		
		loadSounds : function loadSounds(inSoundDescriptions)
		{
			var i;
			if(GameSystemVars.Network.isServer)
			{
				return;
			}
			
			for(i = 0; i < inSoundDescriptions.length; ++i)
			{
				var soundDesc = inSoundDescriptions[i];
				
				this._soundLib[soundDesc.quickName] = soundDesc;
				GameInstance.AssetManager.loadSound(soundDesc.fileName, soundDesc);
			}
			/*
			TODO default sound in assentmanager:
			var audioElement = document.querySelector('audio');
			var mediaSourceNode = context.createMediaElementSource(audioElement);
			// Create the filter
			var filter = context.createBiquadFilter();
			// Create the audio graph.
			mediaSourceNode.connect(filter);
			filter.connect(context.destination);
			*/
		},
		
		playSound : function playSound(inQuickName)//TODO change to playSoundEffect
		{
			var source = this._context.createBufferSource();
			source.buffer = this._soundLib[inQuickName].sound;
			source.connect(this._effectsVolume);
			//source.loop = true;
			source.noteOn(0);//TODO this would be delay parameter
		}
		//stop this.source.noteOff(0);
	}
});
