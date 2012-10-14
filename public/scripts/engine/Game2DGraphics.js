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



//Note: A good reference: http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#images


//TODO depricated!
GameEngineLib.createGame2DGraphics = function(instance)
{
	var property;
	var temp = new GameEngineLib.Game2DGraphics();
	instance = instance || {};
	
	for(property in temp)
	{
		instance[property] = temp[property];
	}
	for(property in temp.prototype)
	{
		instance[property] = temp.prototype[property];
	}
	
	return instance;
};






GameEngineLib.Game2DGraphics = function Game2DGraphics(){};
GameEngineLib.Game2DGraphics.prototype.constructor = GameEngineLib.Game2DGraphics;



GameEngineLib.Game2DGraphics.prototype.init = function init()
{
	var _this_ = this;
	require(
		["dojo/dom", "dojo/dom-construct"],
		function(dom, domConstruct){
			var graphics_container = dom.byId("graphics_container");
			_this_._myCanvas = domConstruct.create(
				"canvas",
				{
					id : "canvas",//TODO different id here!
					width : GameSystemVars.Graphics.initWidth,
					height : GameSystemVars.Graphics.initHeight,
					//TODO localize this:
					innerHTML: "Sorry your browser does not support Canvas. Please use different browser:" +
									"<a href=\"http:\\x2f\\x2fwww.google.com/chrome\">Get Chrome (**recommended!**) </a> or" +
									"<a href=\"http:\\x2f\\x2fwww.mozilla-europe.org/en/firefox/\">Get Firefox</a>"
				},
				graphics_container
			);
		}
	);
	
	if(!(this._myCanvas && this._myCanvas.getContext))
	{
		return false;//TODO test when this fails and give user error
	}
	this._myCanvas2DContext = this._myCanvas.getContext('2d');
	
	this._myBackBufferCanvas = document.createElement('canvas');	//TODO create another way, with dojo maybe?
	this._myBackBufferCanvas.width = this._myCanvas.width;
	this._myBackBufferCanvas.height = this._myCanvas.height;
	this._myBackBufferCanvas2DContext = this._myBackBufferCanvas.getContext('2d');
	
	this._debugText = [];
	this._debugTextColor = [];
	
	return true;
};



GameEngineLib.Game2DGraphics.prototype.render = function render(inRenderer)
{
	var x = 0;
	var y = 0;
	var fontSize = GameSystemVars.Debug.Text_Size;
	
	//clear canvas
	this._myBackBufferCanvas2DContext.clearRect(0, 0, this._myCanvas.width, this._myCanvas.height);
	this._myCanvas2DContext.clearRect(0, 0, this._myCanvas.width, this._myCanvas.height);
	
	//draw map to buffer
	inRenderer.render(this._myBackBufferCanvas2DContext);
	
	//draw frame counters
	if(GameSystemVars.DEBUG)
	{
		this._myBackBufferCanvas2DContext.font = fontSize + "px Arial";

		var maxWidth = 0;
		var i;
		for(i = 0; i < this._debugText.length; ++i)
		{
			var metrics = this._myBackBufferCanvas2DContext.measureText(this._debugText[i]);
			maxWidth = Math.max(maxWidth, metrics.width);
		}
		this._myBackBufferCanvas2DContext.fillStyle = GameSystemVars.Debug.TextBackground_DrawColor;
		this._myBackBufferCanvas2DContext.fillRect(
			x,
			y,
			maxWidth,
			fontSize * (this._debugText.length + 0.5)
		);
		
		for(i = 0; i < this._debugText.length; ++i)
		{
			this._myBackBufferCanvas2DContext.fillStyle = this._debugTextColor[i];
			this._myBackBufferCanvas2DContext.fillText(this._debugText[i], x, y+=fontSize);
		}
		
		this._debugText = [];
		this._debugTextColor = [];
	}
	
	//draw buffer on screen
	this._myCanvas2DContext.drawImage(this._myBackBufferCanvas, 0, 0);
};



//TODO needed?
GameEngineLib.Game2DGraphics.prototype.getDomTarget = function getDomTarget()
{
	return this._myCanvas;
};



GameEngineLib.Game2DGraphics.prototype.drawDebugText = function drawDebugText(text, color)
{
	color = color || GameSystemVars.Debug.TextDefault_DrawColor;
	
	if(GameSystemVars.DEBUG && GameSystemVars.Debug.TextMessages_Draw)
	{
		this._debugText.push(" " + text + " ");
		this._debugTextColor.push(color);
	}
};

//TODO resize canvas listeners (like cameras)

GameEngineLib.Game2DGraphics.prototype.getWidth = function getWidth()
{
	return this._myCanvas.width;
};



GameEngineLib.Game2DGraphics.prototype.getHeight = function getHeight()
{
	return this._myCanvas.height;
};
