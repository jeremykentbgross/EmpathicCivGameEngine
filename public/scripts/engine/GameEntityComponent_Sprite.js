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

GameEngineLib.EntityComponent_Sprite = GameEngineLib.Class(
{
	Constructor : function EntityComponent_Sprite()
	{
		this.GameEntityComponent();
		this._position = GameEngineLib.createGame2DPoint();
		this._myFrames = [{}];
		this._myCurrentFrame = 0;
		//todo myFrames[currentAnimation, currentFrame]
		
		//TODO frame knows filename, offset, collision rects, (sound?) events, etc
		//TODO ^^^ same kind of thing for map tiles?
		
		if(!GameSystemVars.Network.isServer)
		{
			GameInstance.AssetManager.loadImage(/*'images/testsprite.png'*/'images/wall_level01_01.png', this._myFrames[0]);
		}
		else
		{
			this._myFrames[0] = {};
		}
		
		this._myFrames[0].offset = GameEngineLib.createGame2DPoint(-64, -64);//(-32, -64-16);//hack
	},
	
	Parents : [GameEngineLib.GameEntityComponent],
	
	flags : {},
	
	ChainUp : [],
	ChainDown : [],
	
	Definition :
	{
		init : function()
		{
			//var i = 0;
			//for(i = 0; i < this._myFiles.length; ++i)
			//{
			//	this._myTiles[i] = {};
				//GameInstance.assetManager.loadImage('images/testsprite.png', this._myFrames[i]);
			//}
			
			//this._sceneGraphRenderable.myPosition********
			
			var _this_ = this;
			this._sceneGraphRenderable =//TODO need a better class for thie renderable thing
			{
				myLayer : 1,//TODO this should always be odd
				myAnchorPosition : GameEngineLib.createGame2DPoint(),//TODO rename as sort position
				myGame2DAABB : GameEngineLib.createGame2DAABB(0, 0, /*64*/96,/*HACK*/ 96/*HACK*/),
				render : function(inCanvas2DContext, inCameraPoint)
				{
					var renderPoint = _this_._myFrames[_this_._myCurrentFrame].offset.
						add(_this_._position/*this.myPosition*/).
						subtract(inCameraPoint);
					//TODO debug print that this is not clipped (global debug vars)
					inCanvas2DContext.drawImage(
						_this_._myFrames[_this_._myCurrentFrame].image,
						renderPoint.myX,
						renderPoint.myY
					);
				}
			};
		},
		//TODO update!!!!!!!!!!!!!!!!!!!!!!!!!!!!??
		
		render : function(inCanvasContext, inCameraPoint)
		{
			/*var renderPoint = this._myFrames[this._myCurrentFrame].offset.
				add(this._position).
				subtract(inCameraPoint);
			//TODO debug print that this is not clipped (global debug vars)
			inCanvasContext.drawImage(
				this._myFrames[this._myCurrentFrame].image,
				renderPoint.myX,
				renderPoint.myY
			);*/
		},

		onAddedToEntity : function(inEvent)
		{
			var owner = this._owner;//inEvent.entity;
			
			//register for events
			owner.registerListener('UpdatePosition', this);
			owner.registerListener('AddedToWorld', this);
			owner.registerListener('RemovedFromWorld', this);
			
			//TODO owner.event(getposition, myPos);
			//todo add to scene graph
		},

		onRemovedFromEntity : function()
		{
			var owner = this._owner;//inEvent.entity;
			
			//unregister for events
			owner.deregisterListener('UpdatePosition', this);
			owner.deregisterListener('AddedToWorld', this);
			owner.deregisterListener('RemovedFromWorld', this);
			
			//todo remove from scenegraph
			
			//this._owner = null;
		},

		onUpdatePosition : function(inEvent)
		{
			this._world.getSceneGraph().removeItem(this._sceneGraphRenderable);
			
			//this._position = this._sceneGraphRenderable.myPosition = inEvent.position;
			//this._sceneGraphRenderable.myGame2DAABB.setLeftTop(this._position.add(this._myFrames[this._myCurrentFrame].offset));
			
			this._position = inEvent.position;
			this._sceneGraphRenderable.myAnchorPosition = inEvent.boundingRect.getLeftTop();//inEvent.position;
			this._sceneGraphRenderable.myGame2DAABB.setLeftTop(inEvent.position.add(this._myFrames[this._myCurrentFrame].offset));
			
			//TODO change renderable position everywhere it should change
			
			this._world.getSceneGraph().insertItem(this._sceneGraphRenderable);
		},

		onAddedToWorld : function(inEvent)
		{
			this._world = inEvent.world;
			this._world.getSceneGraph().insertItem(this._sceneGraphRenderable);
		},

		onRemovedFromWorld : function(inEvent)
		{
			this._world.getSceneGraph().removeItem(this._sceneGraphRenderable);
			this._world = null;
		},

		destroy : function(){},//TODO
		serialize : function(){}//TODO
	}
});