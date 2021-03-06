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

//TODO: http://small-codes.com/tutoriel-passer-en-plein-ecran-le-html5-canvas-et-dautres-elements-du-dom/?lang=en
//TODO: http://www.html5rocks.com/en/tutorials/casestudies/gopherwoord-studios-resizing-html5-games/

//Note: A good reference: http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#images


ECGame.EngineLib.Graphics2D = ECGame.EngineLib.Class.create({
	Constructor : function Graphics2D()
	{
		this._myIndex = -1;
		this._myCanvas = null;
		this._myCanvas2DContext = null;
		
		this._myBackBufferCanvas = null;
		this._myBackBufferCanvas2DContext = null;
		
		this._myDebugTextArray = null;
		this._myDebugTextAssociatedColorsArray = null;
		this._myDebugTextStartIndex = 0;
		this._myTabReplaceString = "        ";
		
		this._myCurrentCamera = null;
		this._myDrawOffsetX = 0;
		this._myDrawOffsetY = 0;
		
		this._myLineWidth = 0;
		
		this._myInput = null;
	},
	Parents : [],
	flags : {},

	ChainUp : [],
	ChainDown : [],

	Definition :
	{
		init : function init(inGraphicsIndex, inCanvas)
		{
			var aThis = this;
			
			this._myIndex = inGraphicsIndex;
			
			aThis._myCanvas = inCanvas;
			
			if(!(this._myCanvas && this._myCanvas.getContext))
			{
				return false;//TODO test when this fails and give user error
			}
			this._myCanvas2DContext = this._myCanvas.getContext('2d');
			
			this._myBackBufferCanvas = document.createElement('canvas');
			this._myBackBufferCanvas.width = this._myCanvas.width = ECGame.Settings.Graphics.backBufferWidth;
			this._myBackBufferCanvas.height = this._myCanvas.height = ECGame.Settings.Graphics.backBufferHeight;
			this._myBackBufferCanvas2DContext = this._myBackBufferCanvas.getContext('2d');
			
			this._myDebugTextArray = [];
			this._myDebugTextAssociatedColorsArray = [];
			
			this._myInput = ECGame.EngineLib.Input.create(this, this._myCanvas);
			//register for input to scroll debug draw text:
			this._myInput.registerListener('Input', this);
			
			this.setLineWidth(1);
			
			return true;
		},
		
		render : function render(inRenderer)
		{
			//clear front/back canvas buffers
			this._myBackBufferCanvas2DContext.clearRect(0, 0, this._myBackBufferCanvas.width, this._myBackBufferCanvas.height);
			this._myCanvas2DContext.clearRect(0, 0, this._myCanvas.width, this._myCanvas.height);
			
			//render to back buffer
			inRenderer.render(this);
			
			//debug draw stats
			if(ECGame.Settings.isDebugDraw())
			{
				this._drawDebugText();
			}
			
			this._myInput.render(this);
			
			//draw buffer on screen
			this._myCanvas2DContext.drawImage(this._myBackBufferCanvas, 0, 0);
		},
		
		drawDebugText : function drawDebugText(inText, inColor)
		{
			var i;

			inColor = inColor || ECGame.Settings.Debug.TextDefault_DrawColor;
			
			if(ECGame.Settings.isDebugDraw_Text())
			{
				//setup tabs, global and multiple line:
				inText = inText.replace(/\t/g, this._myTabReplaceString);

				//split lines also
				inText = inText.split(/\n|\r/g);//	\f-form feed also?

				for(i = 0; i < inText.length; ++i)
				{
					this._myDebugTextArray.push(' ' + inText[i] + ' ');
					this._myDebugTextAssociatedColorsArray.push(inColor);
				}
			}
		},
		
		getInput : function getInput()
		{
			return this._myInput;
		},
		getIndex : function getIndex()
		{
			return this._myIndex;
		},
		
		//TODO rename final/frontbuffer/??getW/H
		/*getWidth : function getWidth()
		{
			return this._myCanvas.width;
		},
		getHeight : function getHeight()
		{
			return this._myCanvas.height;
		},*/
		getBackBufferWidth : function getBackBufferWidth()
		{
			return this._myBackBufferCanvas.width;
		},
		getBackBufferHeight : function getBackBufferHeight()
		{
			return this._myBackBufferCanvas.height;
		},
		getBackBufferRect : function getBackBufferRect()
		{
			return ECGame.EngineLib.AABB2D.create(
				0,
				0,
				this._myBackBufferCanvas.width,
				this._myBackBufferCanvas.height
			);
		},
		getBackBufferToFrontBufferRatio : function getBackBufferToFrontBufferRatio()
		{
			return this._myBackBufferCanvas.width / this._myCanvas.clientWidth;
		},
		
		
		
		
		
		setCamera2D : function setCamera2D(inCamera)
		{
			this._myCurrentCamera = inCamera;
			if(inCamera)
			{
				this._myDrawOffsetX = inCamera.getCaptureVolumeAABB2D().myX;
				this._myDrawOffsetY = inCamera.getCaptureVolumeAABB2D().myY;
			}
			else
			{
				this._myDrawOffsetX = 0;
				this._myDrawOffsetY = 0;
			}
		},
		getCamera2D : function getCamera2D()
		{
			return this._myCurrentCamera;
		},
		
		///////////////////////////////////////////////////////////////////////
		//context wrapper functions////////////////////////////////////////////
		
		setLineWidth : function setLineWidth(inWidth)
		{
			this._myLineWidth = inWidth;
			this._myBackBufferCanvas2DContext.lineWidth = inWidth;
		},
		
		beginPath : function beginPath()
		{
			this._myBackBufferCanvas2DContext.beginPath();
		},
		closePath : function closePath()
		{
			this._myBackBufferCanvas2DContext.closePath();
		},
		moveTo : function moveTo(inPoint2D)
		{
			this._myBackBufferCanvas2DContext.moveTo(
				Math.round(inPoint2D.myX - this._myDrawOffsetX),
				Math.round(inPoint2D.myY - this._myDrawOffsetY)
			);
		},
		lineTo : function lineTo(inPoint2D)
		{
			this._myBackBufferCanvas2DContext.lineTo(
				Math.round(inPoint2D.myX - this._myDrawOffsetX),
				Math.round(inPoint2D.myY - this._myDrawOffsetY)
			);
		},
		lineToXY : function lineToXY(inX, inY)
		{
			this._myBackBufferCanvas2DContext.lineTo(
				Math.round(inX - this._myDrawOffsetX),
				Math.round(inY - this._myDrawOffsetY)
			);
		},
		arc : function arc(inCenter, inRadius, inStartAngle, inEndAngle /*inCounterClockwise*/)
		{
			this._myBackBufferCanvas2DContext.arc(
				Math.round(inCenter.myX - this._myDrawOffsetX),
				Math.round(inCenter.myY - this._myDrawOffsetY),
				Math.round(inRadius),
				inStartAngle,
				inEndAngle
				/*inCounterClockwise*/
			);
		},
		
		setAlpha : function setAlpha(inAlpha)
		{
			this._myBackBufferCanvas2DContext.globalAlpha = inAlpha;
		},
		
		createLinearGradientY : function createLinearGradientY(inAABB2D)
		{
			return this._myBackBufferCanvas2DContext.createLinearGradient(
				Math.round(0/*inAABB2D.myX - this._myDrawOffsetX*/),	//x0
				Math.round(inAABB2D.myY - this._myDrawOffsetY),	//y0
				Math.round(0/*inAABB2D.myX + inAABB2D.myWidth - this._myDrawOffsetX*/),	//x1
				Math.round(inAABB2D.myY + inAABB2D.myHeight - this._myDrawOffsetY)	//y1
			);
		},
		
		//fill funtions
		setFillStyle : function setFillStyle(inFillStyle)
		{
			this._myBackBufferCanvas2DContext.fillStyle = inFillStyle;
		},
		fillRect : function fillRect(inAABB2D)
		{
			this._myBackBufferCanvas2DContext.fillRect(
				Math.round(inAABB2D.myX - this._myDrawOffsetX),
				Math.round(inAABB2D.myY - this._myDrawOffsetY),
				Math.round(inAABB2D.myWidth),
				Math.round(inAABB2D.myHeight)
			);
		},
		fillRectXYWH : function fillRectXYWH(inX, inY, inWidth, inHeight)
		{
			this._myBackBufferCanvas2DContext.fillRect(
				Math.round(inX - this._myDrawOffsetX),
				Math.round(inY - this._myDrawOffsetY),
				Math.round(inWidth),
				Math.round(inHeight)
			);
		},
		
		//stroke functions
		setStrokeStyle : function setStrokeStyle(inStrokeStyle)
		{
			this._myBackBufferCanvas2DContext.strokeStyle = inStrokeStyle;
		},
		strokeRect : function strokeRect(inAABB2D)
		{
			//see lineWidth section: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Applying_styles_and_colors
			var aPartialPixedOffset = (this._myLineWidth % 2 === 1 ? 0.5 : 0);//TODO do this for lines too
			
			this._myBackBufferCanvas2DContext.strokeRect(
				Math.round(inAABB2D.myX - this._myDrawOffsetX) + aPartialPixedOffset,
				Math.round(inAABB2D.myY - this._myDrawOffsetY) + aPartialPixedOffset,
				Math.round(inAABB2D.myWidth),
				Math.round(inAABB2D.myHeight)
			);
		},
		strokeRectXYWH : function strokeRectXYWH(inX, inY, inWidth, inHeight)
		{
			//see lineWidth section: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Applying_styles_and_colors
			var aPartialPixedOffset = (this._myLineWidth % 2 === 1 ? 0.5 : 0);
			
			this._myBackBufferCanvas2DContext.strokeRect(
				Math.round(inX - this._myDrawOffsetX) + aPartialPixedOffset,
				Math.round(inY - this._myDrawOffsetY) + aPartialPixedOffset,
				Math.round(inWidth),
				Math.round(inHeight)
			);
		},
		stroke : function stroke()
		{
			this._myBackBufferCanvas2DContext.stroke();
		},
		
		//text functions
		setFont : function setFont(inFont)
		{
			this._myBackBufferCanvas2DContext.font = inFont;
		},
		fillTextXY : function fillTextXY(inText, inX, inY)//TODO better with Point2D/Vector2D?
		{
			this._myBackBufferCanvas2DContext.fillText(
				inText,
				Math.round(inX - this._myDrawOffsetX),
				Math.round(inY - this._myDrawOffsetY)
			);
		},
		fillCenteredText : function fillCenteredText(inText)
		{
			var anX
				,aY
				;
				
			anX = (this._myBackBufferCanvas.width - this._myBackBufferCanvas2DContext.measureText(inText).width) / 2;
			aY = this._myBackBufferCanvas.height / 2;
			this._myBackBufferCanvas2DContext.fillText(inText, anX, aY);
		},
		measureText : function measureText(inText)
		{
			return this._myBackBufferCanvas2DContext.measureText(inText);
		},
		
		//image functions
		drawImage : function drawImage(inImage, inLocation)
		{
			this._myBackBufferCanvas2DContext.drawImage(
				inImage,
				Math.round(inLocation.myX - this._myDrawOffsetX),
				Math.round(inLocation.myY - this._myDrawOffsetY)
			);
		},
		drawImageInRect : function drawImageInRect(inImage, inRect)
		{
			this._myBackBufferCanvas2DContext.drawImage(
				inImage,
				Math.round(inRect.myX - this._myDrawOffsetX),
				Math.round(inRect.myY - this._myDrawOffsetY),
				Math.round(inRect.myWidth),
				Math.round(inRect.myHeight)
			);
		},
		drawImageSection : function drawImageSection(inImage, inSrcRect, inPosition)
		{
			this._myBackBufferCanvas2DContext.drawImage(
				inImage,
				Math.round(inSrcRect.myX),
				Math.round(inSrcRect.myY),
				Math.round(inSrcRect.myWidth),
				Math.round(inSrcRect.myHeight),
				Math.round(inPosition.myX - this._myDrawOffsetX),
				Math.round(inPosition.myY - this._myDrawOffsetY),
				Math.round(inSrcRect.myWidth),
				Math.round(inSrcRect.myHeight)
			);
		},
		//context wrapper functions////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////
		
		onInput : function onInput(inEvent)
		{
			if(inEvent.keys[inEvent.KEYBOARD.KEY_PageUp])
			{
				--this._myDebugTextStartIndex;
			}
			if(inEvent.keys[inEvent.KEYBOARD.KEY_PageDown])
			{
				++this._myDebugTextStartIndex;
			}
		},
		
		_drawDebugText : function _drawDebugText()
		{
			var x
				,y
				,fontSize
				,maxWidth
				,metrics
				,i
				;
				
			x = 0;
			y = 0;
			fontSize = ECGame.Settings.Debug.Text_Size;
			
			//set font
			this._myBackBufferCanvas2DContext.font = fontSize + 'px Arial';

			//clamp the start index to [0, n-1]
			this._myDebugTextStartIndex = Math.max(
				0
				,Math.min(
					this._myDebugTextStartIndex
					,this._myDebugTextArray.length - 1
				)
			);

			//figure out a backdrop box size to draw text in and draw it
			maxWidth = 0;
			for(i = 0; i < this._myDebugTextArray.length; ++i)
			{
				metrics = this._myBackBufferCanvas2DContext.measureText(this._myDebugTextArray[i]);
				maxWidth = Math.max(maxWidth, metrics.width);
			}
			this._myBackBufferCanvas2DContext.fillStyle = ECGame.Settings.Debug.TextBackground_DrawColor;
			this._myBackBufferCanvas2DContext.fillRect(
				x,
				y,
				maxWidth,
				fontSize * (this._myDebugTextArray.length - this._myDebugTextStartIndex + 0.5)
			);
			
			//draw all the text in the correct color
			for(i = this._myDebugTextStartIndex; i < this._myDebugTextArray.length; ++i)
			{
				this._myBackBufferCanvas2DContext.fillStyle = this._myDebugTextAssociatedColorsArray[i];
				y += fontSize;
				this._myBackBufferCanvas2DContext.fillText(this._myDebugTextArray[i], x, y);
			}
			
			//release the old debug draw messages
			this._myDebugTextArray = [];
			this._myDebugTextAssociatedColorsArray = [];
		}
	}
});


