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

GameEngineLib.GameSoundSystem = GameEngineLib.Class({
	Constructor : function GameSoundSystem()
	{
		if(GameSystemVars.Network.isServer)
		{
			return;
		}
		
		this.soundLib = [];
		
		try
		{
			//TODO support non webkit AudioContext's
			this.context = new webkitAudioContext();
			
			//HACK!!
			this.loadSounds(
				[
					new GameEngineLib.SoundDescription(0, 'sounds/placeholder.mp3')
				]
			);
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
				
				this.soundLib[soundDesc.quickName] = soundDesc;
				GameInstance.AssetManager.loadSound(soundDesc.fileName, soundDesc);
			}
		},
		
		playSound : function playSound(inQuickName)
		{
			var source = this.context.createBufferSource();
			source.buffer = this.soundLib[inQuickName].sound;
			source.connect(this.context.destination);
			source.noteOn(0);
		}
	}
});


GameEngineLib.SoundDescription = function SoundDescription(inQuickName, inFileName)
{
	this.quickName = inQuickName;
	this.fileName = inFileName;
	//this.sound = null;
}