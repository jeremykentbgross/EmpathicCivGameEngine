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

ECGame.EngineLib.AssetManager = ECGame.EngineLib.Class.create({
	Constructor : function AssetManager()
	{
		this._images = {};
		this._sounds = {};
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		loadImage : function loadImage(inFileName, outLoadTarget)
		{
			var defaultImageName,
				imageInfo,
				i;
			
			defaultImageName = 'defaultImage';
			
			imageInfo = this._images[inFileName];
			
			if(imageInfo !== undefined)
			{
				if(imageInfo.isLoaded)
				{
					outLoadTarget._myImage = imageInfo._myImage;
				}
				else
				{
					//queue it to get set when it loads
					imageInfo.listeners.push(outLoadTarget);
					
					//set the default image
					outLoadTarget._myImage = document.images[defaultImageName];//TODO query this with dojo
				}
			}
			else
			{
				imageInfo = {};
				imageInfo.isLoaded = false;
				imageInfo.listeners = [];
				
				imageInfo.listeners[0] = outLoadTarget;
				
				imageInfo._myImage = new Image();
				imageInfo._myImage.src = inFileName;
				imageInfo._myImage.onload = function()
				{
					imageInfo.isLoaded = true;
					
					//set targets to have the loaded image
					for(i = 0; i < imageInfo.listeners.length; ++i)
					{
						imageInfo.listeners[i]._myImage = imageInfo._myImage;
					}
					delete imageInfo.listeners;
				};
				//TODO onFailedLoad? set placeholder, else have a grey or clear image for streaming
							
				this._images[inFileName] = imageInfo;
				
				//set the default image
				outLoadTarget._myImage = document.images[defaultImageName];//TODO query this with dojo
			}
		},
		
		loadSound : function loadSound(inFileName, outLoadTarget)
		{		
			var defaultSoundName = 'defaultsound',
				soundInfo,
				request,
				i;
			
			soundInfo = this._sounds[inFileName];
			
			if(soundInfo !== undefined)
			{
				if(soundInfo.isLoaded)
				{
					outLoadTarget._mySoundBuffer = soundInfo.mySoundBuffer;
				}
				else
				{
					//queue it to get set when it loads
					soundInfo.listeners.push(outLoadTarget);
					
					//set the default sound
					outLoadTarget._mySoundBuffer = document.sounds[defaultSoundName];//TODO query this with dojo
				}
			}
			else
			{
				soundInfo = {};
				soundInfo.isLoaded = false;
				soundInfo.listeners = [];
				
				soundInfo.listeners[0] = outLoadTarget;
				
				soundInfo.mySoundBuffer = null;
				//soundInfo.sound.src = inFileName;
				
				request = new XMLHttpRequest();
				request.open('GET', inFileName, true);
				request.responseType = 'arraybuffer';
				
				//Decode asynchronously
				request.onload = function()
				{
					ECGame.instance.getSoundSystem()._myContext.decodeAudioData(
						request.response,
						function decodedCallback(buffer)
						{
							soundInfo.mySoundBuffer = buffer;
							soundInfo.isLoaded = true;
							
							//set targets to have the loaded sound
							for(i = 0; i < soundInfo.listeners.length; ++i)
							{
								soundInfo.listeners[i]._mySoundBuffer = soundInfo.mySoundBuffer;
							}
							delete soundInfo.listeners;
						},
						function onError(/*inWhatParam??*/)
						{
							ECGame.log.error("Failed to load " + inFileName);
						}
					);
					//TODO onFailedLoad? set placeholder, else have a grey or clear sound for streaming
				};
				request.send();
							
				this._sounds[inFileName] = soundInfo;
				
				//set the default sound
				//outLoadTarget.sound = document.sounds[defaultSoundName];//TODO query this with dojo
				//TODO PUT THIS BACK^^^^^^^^^^^^^^^^^^^^^^^^^!!!
				
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
			}
		}
	}
});