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
//TODO TileDesc/Animation/multi-layers??
//TODO target impl:
animFrame =
{
	filename
	image
	anchor	//unscaled
	scaledRect //optional
	Depth
	//triggers/events/physics object changes
}
animation =
{
	animFrames
	speed
	bounding box	//THIS IS related 2 the ONE IN THE SCENE MANAGER TREE??
}
tileDesc =
{
	animation(s)
	physics + other properties (sound effects, etc)
}
tiles = tileDesc[];
*/

ECGame.EngineLib.TileDescription2D = ECGame.EngineLib.Class.create({
	Constructor : function TileDescription2D()
	{
		this._mySize = null;//TODO change from this point to being source rect!
		this._myAnchor = null;
		this._myDepth = null;
		this._myMiniMapColor = null;
		this._myPhysicsAABB2D = null;
		this._myImage = null;
		
		//HACK
		//this._myShadowedImage = null;
	},
	Parents : [],
	flags : {},

	ChainUp : [],
	ChainDown : [],

	Definition :
	{
		init : function init(
			inFileName
			,inSize//TODO inImageSrcRect
			,inAnchorPoint
			,inDepth
			,inMiniMapColor
			,inPhysicsAABB
		)
		{
			this._mySize = inSize;
			this._myAnchor = inAnchorPoint;
			this._myDepth = inDepth;
			this._myMiniMapColor = inMiniMapColor;
			this._myPhysicsAABB2D = inPhysicsAABB;
			
			if(!ECGame.Settings.Network.isServer)
			{
				ECGame.instance.getAssetManager().loadImage(inFileName, this);
			}
		}
		
		,getImage : function getImage()
		{
			return this._myImage;
		}
		,setImage : function setImage(inImage/*, inFileName*/)
		{
			this._myImage = inImage;
		}
		
		//TODO work out how to drop map param? or maybe insert stuff to map from here?
		//TODO also consider moving cleanup/removal for scenegraph, tile, and physics object
		,createTileInstance2D : function createTileInstance2D(inMap, inTileInstanceAABB2D)
		{
			var aPhysicsObject
				,aTileRenderableAABB2D
				,aTileInstance
				;
			
			aPhysicsObject = null;
			
			aTileRenderableAABB2D = ECGame.EngineLib.AABB2D.create(
				inTileInstanceAABB2D.myX - this._myAnchor.myX,
				inTileInstanceAABB2D.myY - this._myAnchor.myY,
				this._mySize.myX,	//TODO _myImage.width,//todo consider possible =>tile.scaledRect
				this._mySize.myY	//TODO _myImage.height	//NO srcRect size
			);
			
			if(this._myPhysicsAABB2D)
			{
				//note if need be, could use a tree to merge physics objects to nearest squares for optimization
				//TODO may also have other physics properties later (ie not solid but slippery or something)
				aPhysicsObject = inMap.getWorld().getPhysics().createNewPhysicsObject();//TODO rework this too!!
				aPhysicsObject.setAABB(
					ECGame.EngineLib.AABB2D.create(
						inTileInstanceAABB2D.myX + this._myPhysicsAABB2D.myX,
						inTileInstanceAABB2D.myY + this._myPhysicsAABB2D.myY,
						this._myPhysicsAABB2D.myWidth,
						this._myPhysicsAABB2D.myHeight
					)
				);
			}
			
			aTileInstance = ECGame.EngineLib.TileInstance2D.create(
				inTileInstanceAABB2D
				,this
				,ECGame.EngineLib.TileRenderable2D.create(
					aTileRenderableAABB2D
					,this._myDepth
					,inTileInstanceAABB2D.getLeftTop()
					,this
				)
				,aPhysicsObject
			);
			
			//insert to scenegraph
			inMap.getWorld().getSceneGraph().insertItem(aTileInstance.getRenderable());
			
			return aTileInstance;
		}
		
		,getAnchor : function getAnchor()
		{
			return this._myAnchor;
		}
		,getTileMiniMapColor : function getTileMiniMapColor()
		{
			return this._myMiniMapColor;
		}
		,getPhysicsAABB2D : function getPhysicsAABB2D()
		{
			return this._myPhysicsAABB2D;
		}
	}
});