/*
� Copyright 2012 Jeremy Gross
	jeremykentbgross@gmail.com
	Distributed under the terms of the GNU Lesser GPL (LGPL)
		
	This file is part of EmpathicCivGameEngine�.
	
	EmpathicCivGameEngine� is free software: you can redistribute it and/or modify
	it under the terms of the GNU Lesser General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	
	EmpathicCivGameEngine� is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Lesser General Public License for more details.
	
	You should have received a copy of the GNU Lesser General Public License
	along with EmpathicCivGameEngine�.  If not, see <http://www.gnu.org/licenses/>.
*/

ECGame.EngineLib.RenderableTile2D = ECGame.EngineLib.Class.create({
	Constructor : function RenderableTile2D()
	{
		this.GameRenderable2D();
		this.tileValue = 0;
		this.ownerMap = null;
	},
	Parents : [ECGame.EngineLib.GameRenderable2D],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		render : function render(inCanvas2DContext, inCameraRect)
		{
			if(ECGame.Settings.DEBUG && ECGame.Settings.Debug.Map_Draw)
			{
				return;
			}
			this.ownerMap._myTileSet.renderTile(
				inCanvas2DContext,
				this.tileValue,
				this.anchorPosition.subtract(inCameraRect)
			);
		}
	}
});