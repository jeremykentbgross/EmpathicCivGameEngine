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
https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html
*/



ECGame.EngineLib.SoundDescription = function SoundDescription(inID, inFileName)
{
	this.id = inID;
	this.fileName = inFileName;
	//this.sound = null;	//TODO rename _soundBuffer
	//TODO default sound specific volume??
};

//TODO soundListenerComponent, soundPlayerComponent

ECGame.EngineLib.GameSoundSystem = ECGame.EngineLib.Class.create({
	Constructor : function GameSoundSystem()
	{
		if(ECGame.Settings.Network.isServer)
		{
			return;
		}
		
		this._soundLib = [];
		this._playingSounds = new ECGame.EngineLib.GameCircularDoublyLinkedListNode(null);
		this._listenerPosition2D = new ECGame.EngineLib.Game2DPoint();
		
		try
		{
			window.AudioContext =
				window.AudioContext ||
				window.webkitAudioContext ||
				null;
			
			this._context = new AudioContext();
			
			this._soundHardwareUpdateTime = this.getSoundHardwareTime();
			this._lastSoundHardwareUpdateTime = this.getSoundHardwareTime();
			
			this._context.listener.dopplerFactor = ECGame.Settings.Sound.dopplerFactor;
			this._context.listener.speedOfSound = ECGame.Settings.Sound.speedOfSound;
			
			//////////////////////////////////////////////////////////
			//HACK!!//////////////////////////////////////////////////
			this.loadSounds(
				[
					new ECGame.EngineLib.SoundDescription(0, 'sounds/placeholder.mp3')
				]
			);
			//HACK!!//////////////////////////////////////////////////
			//////////////////////////////////////////////////////////
			
			//setup master volume
			this._masterVolume = this._context.createGainNode();
			this._masterVolume.connect(this._context.destination);
			this._masterVolumeUserValue = 0;
			this.setMasterVolume(ECGame.Settings.Sound.masterVolume);
			
			//setup effects volume
			this._effectsVolume = this._context.createGainNode();
			this._effectsVolume.connect(this._masterVolume);
			this._effectsVolumeUserValue = 0;
			this.setEffectsVolume(ECGame.Settings.Sound.effectsVolume);
			
			//TODO setup UI effects volume
						
			//TODO setup music volume (including cross fading tracks)
			
			//TODO compressor node(s) (looks like after mastergain??=>http://www.html5rocks.com/en/tutorials/webaudio/games/)
			//TODO Convolver node(s) for environment(s)
			//TODO detect/prevent clipping
		}
		catch(error)
		{
			console.log(error.stack);
			ECGame.log.warn("Audio System failed to start in your browser!");
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
			var i, soundDesc;
			
			if(ECGame.Settings.Network.isServer)
			{
				return;
			}
			
			for(i = 0; i < inSoundDescriptions.length; ++i)
			{
				soundDesc = inSoundDescriptions[i];
				this._soundLib[soundDesc.id] = soundDesc;
				ECGame.instance.AssetManager.loadSound(soundDesc.fileName, soundDesc);
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
		
		isUpdating : function isUpdating()
		{
			return true;
		},
		update : function update(/*??params??*/)
		{
			var finishedSounds = [], i;
			
			this._playingSounds.forAll(
				function(inItem, inNode)
				{
					//head node has no sound
					if(inItem)
					{
						if(inItem.isFinished())
						{
							finishedSounds.push(inNode);
						}
					}
				}
			);
			
			//remove finished sounds from this._playingSounds
			for(i = 0; i < finishedSounds.length; ++i)
			{
				finishedSounds[i].remove();
			}
			
			//TODO detect out of focus to pause/silence sounds
			//http://www.w3.org/TR/2011/WD-page-visibility-20110602/
			
			this._lastSoundHardwareUpdateTime = this._soundHardwareUpdateTime;
			this._soundHardwareUpdateTime = this.getSoundHardwareTime();
		},
		
		
		getSoundHardwareTime : function getSoundHardwareTime()
		{
			return this._context.currentTime;
		},
		getSoundHardwareTimeUpdateDelta : function getSoundHardwareTimeUpdateDelta()
		{
			return this._soundHardwareUpdateTime - this._lastSoundHardwareUpdateTime;
		},
		
		
		setMasterVolume : function setMasterVolume(inValue)
		{
			this._masterVolumeUserValue = Math.min(inValue, 1);	//TODO clamp(0,1)??
			this._masterVolume.gain.value = this._masterVolumeUserValue * this._masterVolumeUserValue;
		},
		getMasterVolume : function getMasterVolume()
		{
			return this._masterVolumeUserValue;
		},
		
		setEffectsVolume : function setEffectsVolume(inValue)
		{
			this._effectsVolumeUserValue = Math.min(inValue, 1);	//TODO clamp(0,1)??
			this._effectsVolume.gain.value = this._effectsVolumeUserValue * this._effectsVolumeUserValue;
		},
		getEffectsVolume : function getEffectsVolume()
		{
			return this._effectsVolumeUserValue;
		},
		
		
		playSoundEffect: function playSoundEffect(inID)
		{
			var sound, source;
			
			source = this._context.createBufferSource();
			source.buffer = this._soundLib[inID].sound;
			source.connect(this._effectsVolume);
			//source.loop = true;//TODO param about looping (+loopStart, loopEnd)
			//source.playbackRate = ??//TODO vary sound effect slightly
			
			sound = new ECGame.EngineLib.Sound(
				source,
				this._context.currentTime,
				this._soundLib[inID].fileName
			);
			
			sound.play(0);//TODO this would be delay parameter
			this._playingSounds.insert(new ECGame.EngineLib.GameCircularDoublyLinkedListNode(sound));
			if(ECGame.Settings.Debug.Sound_Print)
			{
				ECGame.log.info("Played sound " + this._soundLib[inID].fileName);
			}
			
			return sound;
		},
		
		
		/*
		AudioListener:
			// same as OpenAL (default 1) 
			float dopplerFactor;
			
			// in meters / second (default 343.3) 
			float speedOfSound;
			
			// Uses a 3D cartesian coordinate system 
			void setPosition(float x, float y, float z);
			void setOrientation(float x, float y, float z, float xUp, float yUp, float zUp);
			void setVelocity(float x, float y, float z);
		*/
		setListenerPosition : function setListenerPosition(inPosition /*TODO velocity?*/)
		{
			this._listenerPosition2D.copyFrom(inPosition);
			this._context.listener.setPosition(inPosition.myX, inPosition.myY, 0);
		},
		//TODO setListenerVelocity
		//TODO set listener cones
		
		
		//TODO param velocity?
		playPositionalSoundEffect2D : function playPositionalSoundEffect2D(inID, inPosition, inRadius)
		{
			var sound, source, panner;
			
			inRadius = inRadius || ECGame.Settings.Sound.default2DRadius;
			
			panner = this._context.createPanner();
			panner.connect(this._effectsVolume);
			panner.setPosition(inPosition.myX, inPosition.myY, 0);
			panner.maxDistance = inRadius;
			panner.distanceModel = panner.LINEAR_DISTANCE;
			//TODO cones
			
			source = this._context.createBufferSource();
			source.buffer = this._soundLib[inID].sound;
			source.connect(panner);
			//source.loop = true;//TODO param about looping (+loopStart, loopEnd)
			//source.playbackRate = ??//TODO vary sound effect slightly
			
			sound = new ECGame.EngineLib.Sound2D(
				source,
				this._context.currentTime,
				this._soundLib[inID].fileName,
				panner,
				inRadius
			);
			sound.setPosition(inPosition);
			//TODO velocity?
			
			sound.play(0);//TODO this would be delay parameter
			this._playingSounds.insert(new ECGame.EngineLib.GameCircularDoublyLinkedListNode(sound));
			if(ECGame.Settings.Debug.Sound_Print)
			{
				ECGame.log.info("Played sound " + this._soundLib[inID].fileName + " at (" + inPosition.myX + ', ' + inPosition.myY + ')');
			}
			
			return sound;
		},
		
		
		/*
		TODO
		pause:
			forall playing sounds
				pause
		resume:
			forall playing sounds
				resume
		*/
		
		
		debugDraw : function debugDraw(inCanvas2DContext, inCameraRect)
		{
			var _this_ = this, i;
			ECGame.instance.Graphics.drawDebugText("Debug Drawing Sounds", ECGame.Settings.Debug.Sound_Area_DrawColor);
			
			inCanvas2DContext.strokeStyle = ECGame.Settings.Debug.Sound_Area_DrawColor;
			inCanvas2DContext.fillStyle = ECGame.Settings.Debug.Sound_Area_DrawColor;
			
			//draw listener position
			inCanvas2DContext.fillRect(
				this._listenerPosition2D.myX - inCameraRect.myX - (ECGame.Settings.Debug.Sound_Listener_Size / 2),
				this._listenerPosition2D.myY - inCameraRect.myY - (ECGame.Settings.Debug.Sound_Listener_Size / 2),
				ECGame.Settings.Debug.Sound_Listener_Size,
				ECGame.Settings.Debug.Sound_Listener_Size
			);
			//TODO draw listener angle
			
			//draw sounds
			this._playingSounds.forAll(
				function(inItem)
				{					
					//head node has no sound
					if(inItem)
					{
						inItem.debugDraw(inCanvas2DContext, inCameraRect, _this_._context.currentTime);
					}
				}
			);
		}
	}
});
