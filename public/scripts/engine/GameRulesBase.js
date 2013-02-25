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


GameEngineLib.GameRulesBase = GameEngineLib.Class.create({
	Constructor : function GameRulesBase(){},
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
		
		render : function render(inCanvas2DContext)
		{
			var x, y, message;
			
			inCanvas2DContext.fillStyle = 'rgba(128, 128, 128, 1)';
			inCanvas2DContext.strokeStyle = 'rgba(64, 64, 64, 1)';
			inCanvas2DContext.fillRect(0, 0,
				inCanvas2DContext.canvas.width,
				inCanvas2DContext.canvas.height
			);
			inCanvas2DContext.strokeRect(0, 0,
				inCanvas2DContext.canvas.width,
				inCanvas2DContext.canvas.height
			);
			
			inCanvas2DContext.fillStyle = 'rgba(64, 64, 64, 1)';
			
			inCanvas2DContext.font = '30px Arial';
			if(this.getClass() === GameEngineLib.GameRulesBase)
			{
				message = "No GameRules.js found!";
			}
			else
			{
				message = "No render code found in your GameRules.js!";
			}
			x = (inCanvas2DContext.canvas.width - inCanvas2DContext.measureText(message).width) / 2;
			y = (inCanvas2DContext.canvas.height - 30) / 2;
			inCanvas2DContext.fillText(message, x, y);
		}
	}
});