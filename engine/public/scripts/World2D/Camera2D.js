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

ECGame.EngineLib.Camera2D = ECGame.EngineLib.Class.create({
	Constructor : function Camera2D()
	{
		this._myCaptureVolume = ECGame.EngineLib.AABB2D.create(
			0,
			0,
			ECGame.Settings.Graphics.backBufferWidth,
			ECGame.Settings.Graphics.backBufferHeight
		);
	},
	Parents : [],
	flags : {},
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		/*init : function init(inWidth, inHeight)
		{
			if(inWidth &&inHeight)
			{
				this._myCaptureVolume = ECGame.EngineLib.AABB2D.create(0, 0, inWidth, inHeight);
			}
		}
		,*/centerOn : function centerOn(inTargetCenter, inMap)
		{
			var aLeftTop
			;
			
			//(top left) = target - view(width, height) / 2
			aLeftTop = inTargetCenter.subtract(
				this._myCaptureVolume.getWidthHeight().scale(0.5)
			);
			
			//if the map does not wrap
			//	clamp camera to within the world favouring the upper left corner
			if(inMap && !inMap.isWrappable())
			{
				//(top left) = min((top, left), map(bottom right) - view(width, height))
				aLeftTop = aLeftTop.min(inMap.getMapLowerRight().subtract(this._myCaptureVolume.getWidthHeight()));
				//(top left) = max((top, left), map(top, left))
				aLeftTop = aLeftTop.max(ECGame.EngineLib.Point2D.create(0,0));
			}
			
			this._myCaptureVolume.setLeftTop(aLeftTop);
		}
		
		,getTargetPosition : function getTargetPosition()
		{
			return this._myCaptureVolume.getCenter();
		}
		
		,debugDraw : function debugDraw(inGraphics)
		{
			var aCameraTarget
			;
			
			aCameraTarget = ECGame.EngineLib.AABB2D.create(
				0,
				0,
				ECGame.Settings.Debug.CameraTarget_Size,
				ECGame.Settings.Debug.CameraTarget_Size
			);
			aCameraTarget.setLeftTop(
				//center target rect on camera target by subtracting half its width/height
				this.getTargetPosition().subtract(
					aCameraTarget.getWidthHeight().scale(0.5)
				)
			);
			
			//setup the color
			inGraphics.setFillStyle(ECGame.Settings.Debug.CameraTarget_DrawColor);
			//draw the target
			inGraphics.fillRect(aCameraTarget);
		}
		
		,getCaptureVolumeAABB2D : function getCaptureVolumeAABB2D()
		{
			return this._myCaptureVolume.clone();
		}
	}
});

