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

ECGame.EngineLib.ImageLoaderInfo = function ImageLoaderInfo(inFileName)
{
	this.myFileName = inFileName;
	this.myIsLoaded = false;
	this.myListeners = [];
	this.myImage = new Image();
	this.myImage.src = inFileName;
};

ECGame.EngineLib.SoundLoaderInfo = function SoundLoaderInfo(inFileName)
{
	this.myFileName = inFileName;
	this.myIsLoaded = false;
	this.myListeners = [];
	this.mySoundBuffer = null;
};

ECGame.EngineLib.AssetManager = ECGame.EngineLib.Class.create({
	Constructor : function AssetManager()
	{
		this._myDefaultImageName = 'defaultImage';
		this._myImageInfoMap = {};
		
		this._myDefaultSoundName = 'defaultsound';
		this._mySoundInfoMap = {};
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		loadImage : function loadImage(inFileName, outLoadTarget)
		{
			var anImageInfo
				;
			
			anImageInfo = this._myImageInfoMap[inFileName];
			
			if(anImageInfo === undefined)
			{
				anImageInfo = new ECGame.EngineLib.ImageLoaderInfo(inFileName);
				anImageInfo.myListeners.push(outLoadTarget);
				anImageInfo.myImage.onload = function()
				{
					var i
						;
					
					anImageInfo.myIsLoaded = true;
					
					//set targets to have the loaded image
					for(i = 0; i < anImageInfo.myListeners.length; ++i)
					{
						anImageInfo.myListeners[i].setImage(anImageInfo.myImage, anImageInfo.myFileName);
					}
					delete anImageInfo.myListeners;
				};
				//TODO onFailedLoad?
				
				//TODO when !debug have grey image for streaming or instead of pink
							
				this._myImageInfoMap[inFileName] = anImageInfo;
				
				//set the default image
				outLoadTarget.setImage(document.images[this._myDefaultImageName], this._myDefaultImageName);
			}
			else
			{
				if(anImageInfo.myIsLoaded)
				{
					outLoadTarget.setImage(anImageInfo.myImage, anImageInfo.myFileName);
				}
				else
				{
					//queue it to get set when it loads
					anImageInfo.myListeners.push(outLoadTarget);
					
					//set the default image
					outLoadTarget.setImage(document.images[this._myDefaultImageName], anImageInfo.myFileName);
				}
			}
		},
		
		
		
		loadSound : function loadSound(inFileName, outLoadTarget)
		{		
			var aSoundInfo
				,aRequest
				;
			
			aSoundInfo = this._mySoundInfoMap[inFileName];
			
			if(aSoundInfo === undefined)
			{
				aRequest = new XMLHttpRequest();
				aRequest.open('GET', inFileName, true);
				aRequest.responseType = 'arraybuffer';
				
				aSoundInfo = new ECGame.EngineLib.SoundLoaderInfo(inFileName);
				aSoundInfo.myListeners.push(outLoadTarget);
				aRequest.onload = function()
				{
					//Decode asynchronously
					ECGame.instance.getSoundSystem()._myContext.decodeAudioData(
						aRequest.response,
						function decodedCallback(buffer)
						{
							var i;
							
							aSoundInfo.mySoundBuffer = buffer;
							aSoundInfo.myIsLoaded = true;
							
							//set targets to have the loaded sound
							for(i = 0; i < aSoundInfo.myListeners.length; ++i)
							{
								aSoundInfo.myListeners[i]._mySoundBuffer = aSoundInfo.mySoundBuffer;
							}
							delete aSoundInfo.myListeners;
						},
						function onError(/*inWhatParam??*/)
						{
							console.error("Failed to load " + inFileName, arguments);
						}
					);
					//TODO onFailedLoad? set placeholder, else have a grey or clear sound for streaming
				};
				aRequest.send();
				
				this._mySoundInfoMap[inFileName] = aSoundInfo;
				
				//set the default sound
				//outLoadTarget.sound = document.sounds[this._myDefaultSoundName];
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
			else
			{
				if(aSoundInfo.myIsLoaded)
				{
					outLoadTarget._mySoundBuffer = aSoundInfo.mySoundBuffer;
				}
				else
				{
					//queue it to get set when it loads
					aSoundInfo.myListeners.push(outLoadTarget);
					
					//set the default sound
					//DOESN'T WORK: outLoadTarget._mySoundBuffer = document.sounds[this._myDefaultSoundName];
				}
			}
		}
	}
});