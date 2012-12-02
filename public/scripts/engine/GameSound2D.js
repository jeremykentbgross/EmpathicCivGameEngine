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
				'----' + '(' + this._position.myX + ', ' + this._position.myY + '), R:' + this._radius,
				GameSystemVars.Debug.Sound_Area_DrawColor
			);
			
			//draw source position
			inCanvas2DContext.fillRect(
				this._position.myX - inCameraRect.myX,
				this._position.myY - inCameraRect.myY,
				GameSystemVars.Debug.Sound_Source_Size,
				GameSystemVars.Debug.Sound_Source_Size
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