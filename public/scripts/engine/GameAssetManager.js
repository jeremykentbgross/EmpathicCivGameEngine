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