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

**
https://hacks.mozilla.org/2012/04/html5-audio-and-audio-sprites-this-should-be-simple/
*/



//TODO soundListenerComponent (attached to camera?), soundPlayerComponent

ECGame.EngineLib.SoundSystem = ECGame.EngineLib.Class.create({
	Constructor : function SoundSystem()
	{
		if(ECGame.Settings.Network.isServer)
		{
			return;
		}
		
		this._mySoundAssetLib = [];
		this._mySoundSampleLib = [];
		this._mySoundDescriptionLib = [];
		
		this._myNextAssetID = -1;
		this._myNextSampleID = -1;
		this._myNextSoundDescriptionID = -1;
		
		this._myPlayingSounds = new ECGame.EngineLib.GameCircularDoublyLinkedListNode(null);
		this._myListenerPosition2D = new ECGame.EngineLib.Point2();
		
		if(!ECGame.Settings.Caps.Audio)
		{
			ECGame.log.warn("Audio System not supported in your browser!");
			alert("Audio System not supported in your browser!");	//TODO detect/reuse duplicate strings in compression
			return;
		}
		
		try
		{
			window.AudioContext =
				window.AudioContext ||
				window.webkitAudioContext ||
				null;
			
			this._myContext = new AudioContext();
			
			this._mySoundHardwareUpdateTime = this.getSoundHardwareTime();
			this._myLastSoundHardwareUpdateTime = this.getSoundHardwareTime();
			
			this._myContext.listener.dopplerFactor = ECGame.Settings.Sound.dopplerFactor;
			this._myContext.listener.speedOfSound = ECGame.Settings.Sound.speedOfSound;
			
			//Setup dynamic compressor (smart sound) to prevent clipping and overly silent sounds.
			this._myDynamicCompressor = this._myContext.createDynamicsCompressor();
			this._myDynamicCompressor.connect(this._myContext.destination);
			
			//setup master volume
			this._myMasterVolume = this._myContext.createGainNode();
			this._myMasterVolume.connect(this._myDynamicCompressor);
			this._myMasterVolumeUserValue = 0;
			this.setMasterVolume(ECGame.Settings.Sound.masterVolume);
			
			//setup effects volume
			this._myEffectsVolume = this._myContext.createGainNode();
			this._myEffectsVolume.connect(this._myMasterVolume);
			this._myEffectsVolumeUserValue = 0;
			this.setEffectsVolume(ECGame.Settings.Sound.effectsVolume);
			
			//TODO setup UI effects volume
						
			//TODO setup music volume (including cross fading tracks)
			
			//TODO Convolver node(s) for environment(s)
			
			//TODO do I ever need to disconnect soud api nodes?
			
			this.loadSoundAssets(
				[
					new ECGame.EngineLib.SoundAsset(this.generateNextAssetID()
						,'engine/sounds/placeholder.mp3')
				]
			);
			
			ECGame.instance.getUpdater("MasterUpdater").addUpdate(this);
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
		getName : function getName()
		{
			return 'SoundSystem';
		},
		getUpdatePriority : function getUpdatePriority()
		{
			return ECGame.Settings.UpdateOrder.SOUND;
		},
		
		//noAudio : function noAudio
		generateNextAssetID : function generateNextAssetID()
		{
			return ++this._myNextAssetID;
		},
		generateNextSampleID : function generateNextSampleID()
		{
			return ++this._myNextSampleID;
		},
		generateNextSoundDescriptionID : function generateNextSoundDescriptionID()
		{
			return ++this._myNextSoundDescriptionID;
		},
		
		loadSoundAssets : function loadSoundAssets(inSoundAssets)
		{
			var i, aSoundAsset;
			
			if(!ECGame.Settings.Caps.Audio)
			{
				return;
			}
			
			for(i = 0; i < inSoundAssets.length; ++i)
			{
				aSoundAsset = inSoundAssets[i];
				this._mySoundAssetLib[aSoundAsset._myID] = aSoundAsset;
				ECGame.instance.getAssetManager().loadSound(aSoundAsset._myFileName, aSoundAsset);
			}
		},
		
		setSoundSamples : function setSoundSamples(inSamples)
		{
			var i, aSoundSample;
			
			if(!ECGame.Settings.Caps.Audio)
			{
				return;
			}
			
			for(i = 0; i < inSamples.length; ++i)
			{
				aSoundSample = inSamples[i];
				this._mySoundSampleLib[aSoundSample._myID] = aSoundSample;
			}
		},
		
		setSoundDescriptions : function setSoundDescriptions(inDescriptions)
		{
			var i, aSoundDescription;
			
			if(!ECGame.Settings.Caps.Audio)
			{
				return;
			}
			
			for(i = 0; i < inDescriptions.length; ++i)
			{
				aSoundDescription = inDescriptions[i];
				this._mySoundDescriptionLib[aSoundDescription._myID] = aSoundDescription;
			}
		},
		
		update : function update(/*??params??*/)	//TODO why is this not called on the server?
		{
			var aFinishedSounds = [], i;
			
			if(!ECGame.Settings.Caps.Audio)
			{
				return;
			}
			
			this._myPlayingSounds.forAll(
				function checkFinished(inItem, inNode)
				{
					if(inItem.isFinished())
					{
						aFinishedSounds.push(inNode);
					}
				},
				true
			);
			
			//remove finished sounds from this._myPlayingSounds
			for(i = 0; i < aFinishedSounds.length; ++i)
			{
				//Note: It may be needed to tell the sound objects audio api node to disconnect,
				//	but from what I get from the documentation they should disconnect automatically
				//	https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html
				aFinishedSounds[i].remove();
			}
			
			//TODO detect out of focus to pause/silence sounds
			//http://www.w3.org/TR/2011/WD-page-visibility-20110602/
			
			this._myLastSoundHardwareUpdateTime = this._mySoundHardwareUpdateTime;
			this._mySoundHardwareUpdateTime = this.getSoundHardwareTime();
		},
		
		
		getSoundHardwareTime : function getSoundHardwareTime()
		{
			return this._myContext.currentTime;
		},
		getSoundHardwareTimeUpdateDelta : function getSoundHardwareTimeUpdateDelta()
		{
			return this._mySoundHardwareUpdateTime - this._myLastSoundHardwareUpdateTime;
		},
		
		
		setMasterVolume : function setMasterVolume(inValue)
		{
			this._myMasterVolumeUserValue = Math.max(Math.min(inValue, 1), 0);
			this._myMasterVolume.gain.value = this._myMasterVolumeUserValue * this._myMasterVolumeUserValue;
		},
		getMasterVolume : function getMasterVolume()
		{
			return this._myMasterVolumeUserValue;
		},
		
		setEffectsVolume : function setEffectsVolume(inValue)
		{
			this._myEffectsVolumeUserValue = Math.max(Math.min(inValue, 1), 0);
			this._myEffectsVolume.gain.value = this._myEffectsVolumeUserValue * this._myEffectsVolumeUserValue;
		},
		getEffectsVolume : function getEffectsVolume()
		{
			return this._myEffectsVolumeUserValue;
		},
		
		
		playSoundEffect: function playSoundEffect(inID)
		{
			var aSoundDescription,
				aSound;
			
			aSoundDescription = this._mySoundDescriptionLib[inID];
			
			aSound = new ECGame.EngineLib.Sound(aSoundDescription, this._myEffectsVolume);
			aSound.play();
			this._myPlayingSounds.insert(new ECGame.EngineLib.GameCircularDoublyLinkedListNode(aSound));

			return aSound;
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
			this._myListenerPosition2D.copyFrom(inPosition);
			if(!ECGame.Settings.Caps.Audio)
			{
				return;
			}
			this._myContext.listener.setPosition(inPosition.myX, inPosition.myY, 0);
		},
		//TODO setListenerVelocity
		//TODO set listener cones
		
		
		//TODO param velocity, cones?
		playPositionalSoundEffect2D : function playPositionalSoundEffect2D(inID, inPosition, inRadius)
		{
			var aSoundDescription,
				aSound;
			
			aSoundDescription = this._mySoundDescriptionLib[inID];
			
			aSound = new ECGame.EngineLib.Sound2D(aSoundDescription, this._myEffectsVolume, inPosition, inRadius);
			aSound.play();
			this._myPlayingSounds.insert(new ECGame.EngineLib.GameCircularDoublyLinkedListNode(aSound));

			return aSound;
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
			var aCurrentTime, i;
			ECGame.instance.getGraphics().drawDebugText("Debug Drawing Sounds", ECGame.Settings.Debug.Sound_Area_DrawColor);
			
			inCanvas2DContext.strokeStyle = ECGame.Settings.Debug.Sound_Area_DrawColor;
			inCanvas2DContext.fillStyle = ECGame.Settings.Debug.Sound_Area_DrawColor;
			
			//draw listener position
			inCanvas2DContext.fillRect(
				this._myListenerPosition2D.myX - inCameraRect.myX - (ECGame.Settings.Debug.Sound_Listener_Size / 2),
				this._myListenerPosition2D.myY - inCameraRect.myY - (ECGame.Settings.Debug.Sound_Listener_Size / 2),
				ECGame.Settings.Debug.Sound_Listener_Size,
				ECGame.Settings.Debug.Sound_Listener_Size
			);
			//TODO draw player and listener angles
			
			aCurrentTime = this._myContext.currentTime;
			
			//draw sounds
			this._myPlayingSounds.forAll(
				function debugDrawCallback(inItem)
				{					
					inItem.debugDraw(inCanvas2DContext, inCameraRect, aCurrentTime);
				},
				true
			);
		}
	}
});
