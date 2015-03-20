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
		
		this._myMasterLayeredAnimations = [];
		this._myLayeredAnimations = [];
		
		this._myAABBDirty = false;
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
				this._myMasterLayeredAnimations[i] =
					this._myLayeredAnimations[i] =
					ECGame.EngineLib.Animation2DInstance.create()
				;
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
			if(this._myAABBDirty)
			{
				this._updateAABB2D();
				this._myAABBDirty = false;
			}
			return this._myAABB.offset(this._myAnchorPosition);
		}
		,_updateAABB2D : function _updateAABB2D()
		{
			var aNewAABB
				,i
				;
			
			aNewAABB = this._myLayeredAnimations[0].getAABB2D().clone();
			for(i = 1; i < this._myLayeredAnimations.length; ++i)
			{
				//TODO need a self_Union/self_XXX
				aNewAABB = aNewAABB.getUnion(this._myLayeredAnimations[i].getAABB2D());
			}
			
			this._myAABB.copyFrom(aNewAABB.offset(this._myAnchorPosition.scale(-1)));
		}
		
		//TODO may need to remove from scene graph and then re-add for these to work properly!!!
		,setAnimation : function setAnimation(inAnimation, inLayer)
		{
			if(this.isInTree())
			{
				console.warn("Already in scene graph, changing animation might change AABB.");
			}
			this._myMasterLayeredAnimations[inLayer].setAnimation(inAnimation);
			this._myLayeredAnimations[inLayer] = this._myMasterLayeredAnimations[inLayer];
			this._myLayeredAnimations[inLayer].setAnchorPosition(this._myAnchorPosition);
			this._myAABBDirty = true;
		}
		//TODO may need to remove from scene graph and then re-add for these to work properly!!!
		,setNestedLayeredAnimation : function setNestedLayeredAnimation(inLayeredAnimation, inLayer)
		{
			if(this.isInTree())
			{
				console.warn("Already in scene graph, changing animation might change AABB.");
			}
			this._myLayeredAnimations[inLayer] = inLayeredAnimation;
			this._myLayeredAnimations[inLayer].setAnchorPosition(this._myAnchorPosition);
			this._myAABBDirty = true;
		}
		
		,setAnimationSpeed : function setAnimationSpeed(inSpeed, inLayer)
		{
			var i;
			
			if(inLayer)
			{
				this._myLayeredAnimations[inLayer].setAnimationSpeed(inSpeed);
			}
			else
			{
				for(i = 0; i < this._myLayeredAnimations.length; ++i)
				{
					this._myLayeredAnimations[i].setAnimationSpeed(inSpeed);
				}
			}
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
			this._myAABBDirty = true;
		}
	}
});


