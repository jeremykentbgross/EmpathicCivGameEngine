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

ECGame.EngineLib.ParticleEffect = ECGame.EngineLib.Class.create({
	Constructor : function ParticleEffect()
	{
		this.Renderable2D();
		
		this._myParticleDesciption = null;
		this._mySourceImages = null;
	},
	Parents : [ECGame.EngineLib.Renderable2D],
	flags : {},
		//netDynamic: sends dynamic messages over the network
		//TODO clientOnly??(<-how), serverOnly, clientCreatable??
	ChainUp : [],
	ChainDown : [],
	//TODO? mustOverride //pure virtual
	Definition :
	{
		init : function init(/*TODO*/)
		{
			return;
		}
		
		,render : function render(inGraphics)
		{
			//console.assert(false, "This method must be overridden");
			inGraphics.fillRect(ECGame.EngineLib.AABB2D.create(0,0, 100,100));//HACK
		}
		
		,fromJSON : function fromJSON(inJSONString)
		{
			var aPropertyName
				;
			//TODO remove me from tree (if needed)
			//release everything else
			
			try
			{
				this._myParticleDesciption = JSON.parse(inJSONString);
				this._mySourceImages = [];
				
				for(aPropertyName in this._myParticleDesciption)
				{
					console.info(aPropertyName, this._myParticleDesciption[aPropertyName]);
				}
			}
			catch(inError)
			{
				console.error(inJSONString, inError.message, inError.stack, inError);
			}
		}
	}
});