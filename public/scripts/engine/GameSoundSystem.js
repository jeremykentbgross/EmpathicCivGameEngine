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



GameEngineLib.SoundDescription = function SoundDescription(inID, inFileName)
{
	this.id = inID;
	this.fileName = inFileName;
	//this.sound = null;	//TODO rename _soundBuffer
	//TODO default sound specific volume??
};



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



GameEngineLib.Sound2D = GameEngineLib.Class(
{
	Constructor : function Sound2D(inSource, inStartedTime, inFileName, inPanner, inPosition, inRadius)
	{
		this.Sound(inSource, inStartedTime, inFileName);
		this._panner = inPanner;
		this._position = inPosition.clone();
		this._radius = inRadius;
	},
	Parents : [GameEngineLib.Sound],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		//TODO setPosition/velocity/cones/angles
		
		debugDraw : function debugDraw(inCanvas2DContext, inCameraRect, inCurrentTime)
		{
			var percentPlayed = (inCurrentTime - this._startedTime) / this._source.buffer.duration;
							
			GameInstance.Graphics.drawDebugText(
				'-' + this._fileName + ': %' + Math.floor(percentPlayed * 100),
				GameSystemVars.Debug.Sound_Area_DrawColor
			);
			GameInstance.Graphics.drawDebugText(
				'----' + '(' + this._position.myX + ', ' + this._position.myY + ')',
				GameSystemVars.Debug.Sound_Area_DrawColor
			);
				
			//draw circle of sound
			inCanvas2DContext.beginPath();
			inCanvas2DContext.arc(
				this._position.myX - inCameraRect.myX,
				this._position.myY - inCameraRect.myY,
				this._radius,
				0,
				2*Math.PI
			);
			inCanvas2DContext.stroke();
			
			//TODO draw velocity of sound
			
			//draw playback percent as expanding circle
			inCanvas2DContext.beginPath();
			inCanvas2DContext.arc(
				this._position.myX - inCameraRect.myX,
				this._position.myY - inCameraRect.myY,
				Math.floor(this._radius * percentPlayed),
				0,
				2*Math.PI
			);
			inCanvas2DContext.stroke();
		}
	}
});



GameEngineLib.GameSoundSystem = GameEngineLib.Class({
	Constructor : function GameSoundSystem()
	{
		if(GameSystemVars.Network.isServer)
		{
			return;
		}
		
		this._soundLib = [];
		this._playingSounds = new GameEngineLib.GameCircularDoublyLinkedListNode(null);
		this._listenerPosition2D = new GameEngineLib.Game2DPoint();
		
		try
		{
			window.AudioContext =
				window.AudioContext ||
				window.webkitAudioContext ||
				null;
			
			this._context = new AudioContext();
			
			//////////////////////////////////////////////////////////
			//HACK!!//////////////////////////////////////////////////
			this.loadSounds(
				[
					new GameEngineLib.SoundDescription(0, 'sounds/placeholder.mp3')
				]
			);
			//HACK!!//////////////////////////////////////////////////
			//////////////////////////////////////////////////////////
			
			//setup master volume
			this._masterVolume = this._context.createGainNode();
			this._masterVolume.connect(this._context.destination);
			this._masterVolumeUserValue = 0;
			this.setMasterVolume(GameSystemVars.Sound.masterVolume);
			
			//setup effects volume
			this._effectsVolume = this._context.createGainNode();
			this._effectsVolume.connect(this._masterVolume);
			this._effectsVolumeUserValue = 0;
			this.setEffectsVolume(GameSystemVars.Sound.effectsVolume);
			
			//TODO setup UI effects volume
						
			//TODO setup music volume (including cross fading tracks)
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
			var i, soundDesc;
			
			if(GameSystemVars.Network.isServer)
			{
				return;
			}
			
			for(i = 0; i < inSoundDescriptions.length; ++i)
			{
				soundDesc = inSoundDescriptions[i];
				this._soundLib[soundDesc.id] = soundDesc;
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
			//source.loop = true;//TODO param about looping
			
			sound = new GameEngineLib.Sound(
				source,
				this._context.currentTime,
				this._soundLib[inID].fileName
			);
			
			sound.play(0);//TODO this would be delay parameter
			this._playingSounds.insert(new GameEngineLib.GameCircularDoublyLinkedListNode(sound));
			if(GameSystemVars.Debug.Sound_Print)
			{
				GameEngineLib.logger.info("Played sound " + this._soundLib[inID].fileName);
			}
			
			return sound;
		},
		
		
		setListenerPosition : function setListenerPosition(inPosition /*TODO velocity?*/)
		{
			this._listenerPosition2D.copyFrom(inPosition);
			this._context.listener.setPosition(inPosition.myX, inPosition.myY, 0);
			//TODO cones
		},
		
		//TODO param velocity?
		playPositionalSoundEffect2D : function playPositionalSoundEffect2D(inID, inPosition, inRadius)
		{
			var sound, source, panner;
			
			inRadius = inRadius || GameSystemVars.Sound.default2DRadius;
			
			panner = this._context.createPanner();
			panner.connect(this._effectsVolume);
			panner.setPosition(inPosition.myX, inPosition.myY, 0);
			panner.maxDistance = inRadius;
			panner.distanceModel = panner.LINEAR_DISTANCE;
			//TODO cones
			
			source = this._context.createBufferSource();
			source.buffer = this._soundLib[inID].sound;
			source.connect(panner);
			//source.loop = true;//TODO param about looping
			
			sound = new GameEngineLib.Sound2D(
				source,
				this._context.currentTime,
				this._soundLib[inID].fileName,
				panner,
				inPosition,
				inRadius
			);
			
			sound.play(0);//TODO this would be delay parameter
			this._playingSounds.insert(new GameEngineLib.GameCircularDoublyLinkedListNode(sound));
			if(GameSystemVars.Debug.Sound_Print)
			{
				GameEngineLib.logger.info("Played sound " + this._soundLib[inID].fileName + " at (" + inPosition.myX + ', ' + inPosition.myY + ')');
			}
			
			return sound;
		},
		
		
		debugDraw : function debugDraw(inCanvas2DContext, inCameraRect)
		{
			var _this_ = this, i;
			GameInstance.Graphics.drawDebugText("Debug Drawing Sounds", GameSystemVars.Debug.Sound_Area_DrawColor);
			
			inCanvas2DContext.strokeStyle = GameSystemVars.Debug.Sound_Area_DrawColor;
			inCanvas2DContext.fillStyle = GameSystemVars.Debug.Sound_Area_DrawColor;
			
			//draw listener position
			inCanvas2DContext.fillRect(
				this._listenerPosition2D.myX - inCameraRect.myX,
				this._listenerPosition2D.myY - inCameraRect.myY,
				GameSystemVars.Debug.Sound_Listener_Size,
				GameSystemVars.Debug.Sound_Listener_Size
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





/*

function Field(canvas)
{
	this.ANGLE_STEP=0.2;
	this.canvas=canvas;
	this.isMouseInside=false;
	this.center={x:canvas.width/2,y:canvas.height/2};
	this.angle=0;
	this.point=null;
	var obj=this;
	canvas.addEventListener(
		'mouseover',
		function()
		{
			obj.handleMouseOver.apply(obj,arguments)
		}
	);
	canvas.addEventListener(
		'mouseout',
		function()
		{
			obj.handleMouseOut.apply(obj,arguments)
		}
	);
	canvas.addEventListener('mousemove',function(){obj.handleMouseMove.apply(obj,arguments)});
	canvas.addEventListener('mousewheel',function(){obj.handleMouseWheel.apply(obj,arguments);});
	canvas.addEventListener('keydown',function(){obj.handleKeyDown.apply(obj,arguments);});
	this.manIcon=new Image();
	this.manIcon.src='res/man.svg';
	this.speakerIcon=new Image();
	this.speakerIcon.src='res/speaker.svg';
	var ctx=this;
	this.manIcon.onload=function(){ctx.render();}
}

Field.prototype.render=function()
{
	var ctx=this.canvas.getContext('2d');
	ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
	ctx.drawImage(this.manIcon,this.center.x-this.manIcon.width/2,this.center.y-this.manIcon.height/2);
	ctx.fill();
	if(this.point)
	{
		ctx.save();
		ctx.translate(this.point.x,this.point.y);
		ctx.rotate(this.angle);
		ctx.translate(-this.speakerIcon.width/2,-this.speakerIcon.height/2);
		ctx.drawImage(this.speakerIcon,0,0);
		ctx.restore();
	}
	ctx.fill();
};

Field.prototype.handleMouseOver=function(e)
{
	this.isMouseInside=true;
};
Field.prototype.handleMouseOut=function(e)
{
	this.isMouseInside=false;
	if(this.callback){this.callback(null);}
	this.point=null;
	this.render();
};

Field.prototype.handleMouseMove=function(e)
{
	if(this.isMouseInside)
	{
		this.point={x:e.offsetX,y:e.offsetY};
		this.render();
		if(this.callback)
		{
			this.callback(
				{x:this.point.x-this.center.x,y:this.point.y-this.center.y}
			);
		}
	}
};

Field.prototype.handleKeyDown=function(e)
{
	if(e.keyCode==37)
	{
		this.changeAngleHelper(-this.ANGLE_STEP);
	}
	else if(e.keyCode==39)
	{this.changeAngleHelper(this.ANGLE_STEP);}
};

Field.prototype.handleMouseWheel=function(e)
{
	e.preventDefault();
	this.changeAngleHelper(e.wheelDelta/500);
};

Field.prototype.changeAngleHelper=function(delta)
{
	this.angle+=delta;
	if(this.angleCallback)
	{
		this.angleCallback(this.angle);
	}
	this.render();
}

Field.prototype.registerPointChanged=function(callback)
{
	this.callback=callback;
};

Field.prototype.registerAngleChanged=function(callback)
{
	this.angleCallback=callback;
};

function PositionSample(el,context)
{
	var urls=['sounds/position.wav'];
	var sample=this;
	this.isPlaying=false;
	this.size={width:400,height:300};
	var loader=new BufferLoader(
		context,
		urls,
		function(buffers)
		{
			sample.buffer=buffers[0];
		}
	);
	loader.load();
	var canvas=document.createElement('canvas');
	canvas.setAttribute('width',this.size.width);
	canvas.setAttribute('height',this.size.height);
	el.appendChild(canvas);
	field=new Field(canvas);
	field.registerPointChanged(
		function()
		{
			sample.changePosition.apply(sample,arguments);
		}
	);
	field.registerAngleChanged(
		function()
		{
			sample.changeAngle.apply(sample,arguments);
		}
	);
}

PositionSample.prototype.play=function()
{
	var source=context.createBufferSource();
	source.buffer=this.buffer;
	source.loop=true;
	var panner=context.createPanner();
	panner.coneOuterGain=0.1;
	panner.coneOuterAngle=180;
	panner.coneInnerAngle=0;
	panner.connect(context.destination);
	source.connect(panner);
	source.noteOn(0);
	context.listener.setPosition(0,0,0);
	this.source=source;
	this.panner=panner;
	this.isPlaying=true;
}

PositionSample.prototype.stop=function(){this.source.noteOff(0);this.isPlaying=false;}

PositionSample.prototype.changePosition=function(position)
{
	if(position)
	{
		if(!this.isPlaying){this.play();}
		var mul=2;
		var x=position.x/this.size.width;
		var y=-position.y/this.size.height;
		this.panner.setPosition(x*mul,y*mul,-0.5);
	}
	else
	{
		this.stop();
	}
};

PositionSample.prototype.changeAngle=function(angle)
{
	console.log(angle);
	this.panner.setOrientation(Math.cos(angle),-Math.sin(angle),1);
};







function MachineGun(context)
{
	var ctx=this;
	var loader = new BufferLoader(
		context,
		['sounds/m4a1.mp3','sounds/m1-garand.mp3']
		,onLoaded
	);
	function onLoaded(buffers)
	{
		ctx.buffers=buffers;
	};
	loader.load();
}
MachineGun.prototype.shootRound = function(type,rounds,interval,random,random2)
{
	if(typeof random=='undefined')
	{
		random=0;
	}
	var time=context.currentTime;
	for(var i=0;i<rounds;i++)
	{
		var source=this.makeSource(this.buffers[type]);
		source.playbackRate.value=1+Math.random()*random2;
		source.noteOn(time+i*interval+Math.random()*random);
	}
}
MachineGun.prototype.makeSource = function(buffer)
{
	var source = context.createBufferSource();
	var compressor = context.createDynamicsCompressor();
	var gain = context.createGainNode();
	gain.gain.value=0.2;
	source.buffer = buffer;
	source.connect(gain);
	gain.connect(compressor);
	compressor.connect(context.destination);
	return source;
};

*/