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

GameEngineLib.Sound2D = GameEngineLib.Class(
{
	Constructor : function Sound2D(inSource, inStartedTime, inFileName, inPanner, inRadius)
	{
		this.Sound(inSource, inStartedTime, inFileName);
		this._panner = inPanner;
		this._position = new GameEngineLib.Game2DPoint();
		this._velocity = new GameEngineLib.Game2DPoint();
		this._radius = inRadius;
	},
	Parents : [GameEngineLib.Sound],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		setPosition : function setPosition(inPosition)
		{
			this._position.copyFrom(inPosition);
			this._panner.setPosition(inPosition.myX, inPosition.myY, 0);
		},
		setVelocity : function setVelocity(inVelocity)
		{
			this._velocity.copyFrom(inVelocity);
			this._panner.setVelocity(inVelocity.myX, inVelocity.myY, 0);
		},
		//TODO set cones/angles
		
		
		debugDraw : function debugDraw(inCanvas2DContext, inCameraRect, inCurrentTime)
		{
			var percentPlayed, soundScreenLoc;
			
			percentPlayed = (inCurrentTime - this._startedTime) / this._source.buffer.duration;
			soundScreenLoc = this._position.sub(inCameraRect);
							
			GameInstance.Graphics.drawDebugText(
				'-' + this._fileName + ': %' + Math.floor(percentPlayed * 100),
				GameSystemVars.Debug.Sound_Area_DrawColor
			);
			GameInstance.Graphics.drawDebugText(
				'----Pos:(' + this._position.myX + ', ' + this._position.myY + '), R:' + this._radius,
				GameSystemVars.Debug.Sound_Area_DrawColor
			);
			GameInstance.Graphics.drawDebugText(
				'----Vel:(' + this._velocity.myX + ', ' + this._velocity.myY + ')',
				GameSystemVars.Debug.Sound_Area_DrawColor
			);
			
			//draw source position
			inCanvas2DContext.fillRect(
				soundScreenLoc.myX - (GameSystemVars.Debug.Sound_Source_Size / 2),
				soundScreenLoc.myY - (GameSystemVars.Debug.Sound_Source_Size / 2),
				GameSystemVars.Debug.Sound_Source_Size,
				GameSystemVars.Debug.Sound_Source_Size
			);
			//TODO draw facing cone
				
			//draw circle of sound
			inCanvas2DContext.beginPath();
			inCanvas2DContext.arc(
				soundScreenLoc.myX,
				soundScreenLoc.myY,
				this._radius,
				0,
				2*Math.PI
			);
			inCanvas2DContext.stroke();
			
			//draw velocity of sound
			inCanvas2DContext.beginPath();
			inCanvas2DContext.moveTo(
				soundScreenLoc.myX,
				soundScreenLoc.myY
			);
			inCanvas2DContext.lineTo(
				soundScreenLoc.myX + (this._velocity.myX * GameInstance.soundSystem.getSoundHardwareTimeUpdateDelta()),
				soundScreenLoc.myY + (this._velocity.myY * GameInstance.soundSystem.getSoundHardwareTimeUpdateDelta())
			);
			inCanvas2DContext.closePath();
			inCanvas2DContext.stroke();
			
			//draw playback percent as expanding circle
			inCanvas2DContext.beginPath();
			inCanvas2DContext.arc(
				soundScreenLoc.myX,
				soundScreenLoc.myY,
				Math.floor(this._radius * percentPlayed),
				0,
				2*Math.PI
			);
			inCanvas2DContext.stroke();
		}
	}
});