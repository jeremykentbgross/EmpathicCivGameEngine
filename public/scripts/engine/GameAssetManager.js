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

GameEngineLib.createGameAssetManager = function(instance, private)
{
	instance = instance || {};
	private = private || {};
	
	private.images = {};
	
	//TODO make pink say: "loading/missing asset"
	
	instance.loadImage = function(inFileName, outLoadTarget)
	{
		var imageInfo;
		var i;
		
		imageInfo = private.images[inFileName];
		
		if(imageInfo !== undefined)
		{
			if(imageInfo.isLoaded)
			{
				outLoadTarget.image = imageInfo.image;
			}
			else
			{
				//queue it to get set when it loads
				imageInfo.listeners.push(outLoadTarget);
				
				//set the default image
				outLoadTarget.image = document.images["defaultimage"];
			}
		}
		else
		{
			imageInfo = {};
			imageInfo.isLoaded = false;
			imageInfo.listeners = [];
			
			imageInfo.listeners[0] = outLoadTarget;
			
			imageInfo.image = new Image();
			imageInfo.image.src = inFileName;
			imageInfo.image.onload = function()
			{
				imageInfo.isLoaded = true;
				
				//set targets to have the loaded image
				for(i = 0; i < imageInfo.listeners.length; ++i)
				{
					imageInfo.listeners[i].image = imageInfo.image;
				}
				delete imageInfo.listeners;
			};
			//TODO onFailedLoad? set placeholder, else have a grey or clear image for streaming
						
			private.images[inFileName] = imageInfo;
			
			//set the default image
			outLoadTarget.image = document.images["defaultimage"];
		}
	}
	
	return instance;
}