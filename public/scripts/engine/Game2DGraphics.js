//Note: A good reference: http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#images

GameEngineLib.createGame2DGraphics = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	if(GameSystemVars.DEBUG)
	{
		GameEngineLib.addDebugInfo("GameGraphics", instance, private);
	}

	instance.init = function()
	{
		require(
			["dojo/dom", "dojo/dom-construct"],
			function(dom, domConstruct){
    			var graphics_container = dom.byId("graphics_container");
    			private.myCanvas = domConstruct.create(
    				"canvas",
    				{
    					id : "canvas",
    					width : GameSystemVars.Graphics.initWidth,
						height : GameSystemVars.Graphics.initHeight,
						innerHTML: "Sorry your browser does not support Canvas. Please use different browser:" +
										"<a href=\"http://www.google.com/chrome\">Get Chrome (**recommended!**) </a> or" +
										"<a href=\"http://www.mozilla-europe.org/en/firefox/\">Get Firefox</a>"
					},
					graphics_container
				);
			}
		);
		
		if(!(private.myCanvas && private.myCanvas.getContext))
		{
			return false;
		}
		private.myCanvas2DContext = private.myCanvas.getContext('2d');
		
		private.myBackBufferCanvas = document.createElement('canvas');
		private.myBackBufferCanvas.width = private.myCanvas.width;
		private.myBackBufferCanvas.height = private.myCanvas.height;
		private.myBackBufferCanvas2DContext = private.myBackBufferCanvas.getContext('2d');
		
		private.debugText = [];
		private.debugTextColor = [];
		
		return true;
	}
	
	//todo remove the dt, aveDt and frameCount when I add timer object
	instance.render = function(inRenderer)
	{
		var x = 0, y = 0;
		var fontSize = GameSystemVars.Debug.Text_Size;
		
		//clear canvas
		private.myBackBufferCanvas2DContext.clearRect(0, 0, private.myCanvas.width, private.myCanvas.height);
		private.myCanvas2DContext.clearRect(0, 0, private.myCanvas.width, private.myCanvas.height);
		
		//draw map to buffer
		inRenderer.render(private.myBackBufferCanvas2DContext);
		
		//draw frame counters
		if(GameSystemVars.DEBUG)
		{
			private.myBackBufferCanvas2DContext.font = fontSize + "px Arial";

			var maxWidth = 0;
			for(var i = 0; i < private.debugText.length; ++i)
			{
				var metrics = private.myBackBufferCanvas2DContext.measureText(private.debugText[i]);
				maxWidth = Math.max(maxWidth, metrics.width);
			}
			private.myBackBufferCanvas2DContext.fillStyle = GameSystemVars.Debug.TextBackground_DrawColor;
			private.myBackBufferCanvas2DContext.fillRect(
				x,
				y,
				maxWidth,
				fontSize * (private.debugText.length + 0.5)
			);
			
			for(var i = 0; i < private.debugText.length; ++i)
			{
				private.myBackBufferCanvas2DContext.fillStyle = private.debugTextColor[i];
				private.myBackBufferCanvas2DContext.fillText(private.debugText[i], x, y+=fontSize);
			}
			
			private.debugText = [];
			private.debugTextColor = [];
		}
		
		//draw buffer on screen
		private.myCanvas2DContext.drawImage(private.myBackBufferCanvas, 0, 0);
	}
	
	instance.getDomTarget = function()
	{
		return private.myCanvas;
	}
	
	instance.drawDebugText = function(text, color)
	{
		color = color || GameSystemVars.Debug.TextDefault_DrawColor;
		
		if(GameSystemVars.DEBUG && GameSystemVars.Debug.TextMessages_Draw)
		{
			private.debugText.push(" " + text + " ");
			private.debugTextColor.push(color);
		}
	}
	
	//todo resize, listeners (like cameras)
	
	instance.getWidth = function()
	{
		return private.myCanvas.width;
	}
	instance.getHeight = function()
	{
		return private.myCanvas.height;
	}
	
	return instance;
}