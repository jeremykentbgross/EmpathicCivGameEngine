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


ECGame.EngineLib.GameRulesBase = ECGame.EngineLib.Class.create({
	Constructor : function GameRulesBase(){return;},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		init : function init()
		{
			return true;
		},
		
		registerClasses : function registerClasses()//Note: this is called before init
		{
			ECGame.log.warn("Expected function overload!");
		},
		
		render : function render(inGraphics)	//TODO make this some kind of full screen msg function?
		{
			var anX
				,aY
				,aMessage
				,aBackBufferRect
				;
				
			if(this.__proto__.constructor === ECGame.EngineLib.GameRulesBase)
			{
				aMessage = "No GameRules.js found!";
			}
			else
			{
				aMessage = "No render code found in your GameRules.js!";
			}
			
			//get the size of the Back buffer
			aBackBufferRect = inGraphics.getBackBufferRect();
			
			//fill the back buffer
			inGraphics.setFillStyle('rgba(128, 128, 128, 1)');
			inGraphics.fillRect(aBackBufferRect);
			
			//outline it too in case we need an outline from the background.
			inGraphics.setStrokeStyle('rgba(64, 64, 64, 1)');
			inGraphics.strokeRect(aBackBufferRect);
			
			//etup to draw message
			inGraphics.setFillStyle('rgba(64, 64, 64, 1)');
			inGraphics.setFont('30px Arial');
			anX = (aBackBufferRect.myWidth - inGraphics.measureText(aMessage).width) / 2;
			aY = (aBackBufferRect.myHeight - 30) / 2;
			//draw message
			inGraphics.fillTextXY(aMessage, anX, aY);
		}
	}
});