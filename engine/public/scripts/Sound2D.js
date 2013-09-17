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

ECGame.EngineLib.Sound2D = ECGame.EngineLib.Class.create(
{
	Constructor : function Sound2D(inSoundDescription, inDestination, inPosition, inRadius)
	{
		inRadius = inRadius || ECGame.Settings.Sound.default2DRadius;
		
		this._myPosition = inPosition.clone();
		this._myVelocity = new ECGame.EngineLib.Point2();
		this._myRadius = inRadius;
		
		this._myPanner = ECGame.instance.getSoundSystem()._myContext.createPanner();
		this._myPanner.connect(inDestination);
		this._myPanner.setPosition(inPosition.myX, inPosition.myY, 0);
		this._myPanner.maxDistance = inRadius;
		this._myPanner.distanceModel = this._myPanner.LINEAR_DISTANCE;
		//TODO cones
			
		this.Sound(inSoundDescription, this._myPanner/*inSource, inStartedTime, inFileName*/);
	},
	Parents : [ECGame.EngineLib.Sound],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		setPosition : function setPosition(inPosition)
		{
			this._myPosition.copyFrom(inPosition);
			this._myPanner.setPosition(inPosition.myX, inPosition.myY, 0);
		},
		setVelocity : function setVelocity(inVelocity)
		{
			this._myVelocity.copyFrom(inVelocity);
			this._myPanner.setVelocity(inVelocity.myX, inVelocity.myY, 0);
		},
		//TODO set cones/angles
		
		_getDebugPlayingString : function _getDebugPlayingString()//TODO overload this as well!!
		{
			return this.Sound.prototype._getDebugPlayingString.call(this)
				+ " at (" + Math.floor(this._myPosition.myX) + ', ' + Math.floor(this._myPosition.myY) + '):' + this._myRadius;
		},
		
		
		debugDraw : function debugDraw(inCanvas2DContext, inCameraRect, inCurrentTime)
		{
			var aPercentPlayed, aSoundScreenLoc;
			
			aPercentPlayed = this.getPercentPlayed(inCurrentTime);
			aSoundScreenLoc = this._myPosition.subtract(inCameraRect);
							
			ECGame.instance.getGraphics().drawDebugText(
				'-' + /*this._getDebugPlayingString()*/this.Sound.prototype._getDebugPlayingString.call(this) + ': %' + Math.floor(aPercentPlayed * 100),
				ECGame.Settings.Debug.Sound_Area_DrawColor
			);
			ECGame.instance.getGraphics().drawDebugText(
				"----Pos:(" + Math.floor(this._myPosition.myX) + ', ' + Math.floor(this._myPosition.myY) + "), Radius:" + this._myRadius,
				ECGame.Settings.Debug.Sound_Area_DrawColor
			);
			ECGame.instance.getGraphics().drawDebugText(
				"----Vel:(" + Math.floor(this._myVelocity.myX) + ', ' + Math.floor(this._myVelocity.myY) + ')',
				ECGame.Settings.Debug.Sound_Area_DrawColor
			);
			
			//draw source position
			inCanvas2DContext.fillRect(
				aSoundScreenLoc.myX - (ECGame.Settings.Debug.Sound_Source_Size / 2),
				aSoundScreenLoc.myY - (ECGame.Settings.Debug.Sound_Source_Size / 2),
				ECGame.Settings.Debug.Sound_Source_Size,
				ECGame.Settings.Debug.Sound_Source_Size
			);
			//TODO draw facing cone
				
			//draw circle of sound
			inCanvas2DContext.beginPath();
			inCanvas2DContext.arc(
				aSoundScreenLoc.myX,
				aSoundScreenLoc.myY,
				this._myRadius,
				0,
				2*Math.PI
			);
			inCanvas2DContext.stroke();
			
			//draw velocity of sound
			inCanvas2DContext.beginPath();
			inCanvas2DContext.moveTo(
				aSoundScreenLoc.myX,
				aSoundScreenLoc.myY
			);
			inCanvas2DContext.lineTo(
				aSoundScreenLoc.myX + (this._myVelocity.myX * ECGame.instance.getSoundSystem().getSoundHardwareTimeUpdateDelta()),
				aSoundScreenLoc.myY + (this._myVelocity.myY * ECGame.instance.getSoundSystem().getSoundHardwareTimeUpdateDelta())
			);
			inCanvas2DContext.closePath();
			inCanvas2DContext.stroke();
			
			//draw playback percent as expanding circle
			inCanvas2DContext.beginPath();
			inCanvas2DContext.arc(
				aSoundScreenLoc.myX,
				aSoundScreenLoc.myY,
				Math.floor(this._myRadius * aPercentPlayed),
				0,
				2*Math.PI
			);
			inCanvas2DContext.stroke();
		}
	}
});