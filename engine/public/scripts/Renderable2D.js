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
ECGame.EngineLib.Renderable2D = ECGame.EngineLib.Class.create({
	Constructor : function Renderable2D()
	{
		this.QuadTreeItem(null/*aabb*/);
		
		//TODO maybe should have get functions for all these?
		
		//array of nodes that contain this renderable in the scene graph
		this._mySceneGraphOwningNodes = null;					//accessed only by the scenegraph
		this._myLastFrameDrawn = -1;							//accessed only by the scenegraph
		this._myDepth = 0;										//accessed many places (should it be private or smthg?)
		this._myAnchorPosition = new ECGame.EngineLib.Point2D();
		this._myScreenPos = new ECGame.EngineLib.Point2D();		//accessed only by the scenegraph
		this._myDrawOrderHelper = null;							//accessed only by the scenegraph
	},
	Parents : [ECGame.EngineLib.QuadTreeItem],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init(inAABB2D, inDepth, inAnchorPosition)
		{
			this._myAABB = inAABB2D;
			this._myDepth = inDepth;
			this._myAnchorPosition = inAnchorPosition;
		},
		
		render : function render(inGraphics)//abstract!!
		{
			ECGame.log.assert(false, "This method must be overridden");
		}
	}
});