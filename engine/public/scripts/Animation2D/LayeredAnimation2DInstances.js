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

ECGame.EngineLib.LayeredAnimation2DInstances = ECGame.EngineLib.Class.create({
	Constructor : function LayeredAnimation2DInstances()
	{
		this.Renderable2D();
		
		this._myLayeredAnimations = [];
	},
	Parents : [ECGame.EngineLib.Renderable2D],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init(inLayers)
		{
			var i
				;
			
			for(i = 0; i < inLayers; ++i)
			{
				this._myLayeredAnimations[i] = ECGame.EngineLib.Animation2DInstance.create();
			}
		}
		
		,update : function update(inUpdateData)
		{
			var i
				,aFrameEventList
				,aReturnList
				;
			
			aReturnList = [];
			for(i = 0; i < this._myLayeredAnimations.length; ++i)
			{
				aFrameEventList = this._myLayeredAnimations[i].update(inUpdateData);
				if(aFrameEventList)
				{
					aReturnList = aReturnList.concat(aFrameEventList);
				}
			}
			
			return aReturnList;
		}
		
		,render : function render(inGraphics)
		{
			var i
				;
			
			for(i = 0; i < this._myLayeredAnimations.length; ++i)
			{
				this._myLayeredAnimations[i].render(inGraphics);
			}
		}
		
		,getAABB2D : function getAABB2D()
		{
			var aReturnAABB2D
				,i
				;
			
			//TODO optimize this by generating it on dirty (see Animation2DInstance.getAABB2D())
			aReturnAABB2D = this._myLayeredAnimations[0].getAABB2D().clone();
			for(i = 1; i < this._myLayeredAnimations.length; ++i)
			{
				aReturnAABB2D = aReturnAABB2D.getUnion(this._myLayeredAnimations[i].getAABB2D());
			}
			
			return aReturnAABB2D;
		}
		
		,setAnimation : function setAnimation(inAnimation, inLayer)
		{
			this._myLayeredAnimations[inLayer].setAnimation(inAnimation);
		}
		
		,setAnimationSpeed : function setAnimationSpeed(inSpeed, inLayer)
		{
			this._myLayeredAnimations[inLayer].setAnimationSpeed(inSpeed);
		}
		
		,setAnchorPosition : function setAnchorPosition(inAnchorPosition)
		{
			var i
				;
			
			for(i = 0; i < this._myLayeredAnimations.length; ++i)
			{
				this._myLayeredAnimations[i].setAnchorPosition(inAnchorPosition);
			}
			this._myAnchorPosition = inAnchorPosition;
		}
	}
});


