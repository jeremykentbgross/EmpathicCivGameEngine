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


//This is actually almost more of an interface!
GameEngineLib.GameRenderable2D = GameEngineLib.Class({
	Constructor : function GameRenderable2D()
	{
		this.GameQuadTreeItem(/*aabb*/);
		//TODO maybe should have get functions for all these instead?
		this.sceneGraphOwningNodes = null;	//array of nodes containing this renderable in the scene graph
		this.lastFrameDrawn = -1;
		this.layer = 0;
		this.anchorPosition = new GameEngineLib.Game2DPoint();
		this.screenPos = new GameEngineLib.Game2DPoint();
		this.drawOrderHelper = null;
	},
	Parents : [GameEngineLib.GameQuadTreeItem],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		render : function render(inCanvas2DContext, inCameraRect)//abstract!!
		{
			gameAssert(false, "This method must be overridden");
		}
	}
});