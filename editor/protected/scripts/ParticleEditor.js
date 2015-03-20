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

ECGame.EditorLib.ParticleEditor = ECGame.EngineLib.Class.create({
	Constructor : function ParticleEditor()
	{
		var aThis;
		
		aThis = this;
		
		this._myParticleEffect = ECGame.EngineLib.ParticleEffect.create();
		
		//open the particle editor window
		this._myWindow = window.open(
			window.location.protocol + '\/\/'
			+ window.location.host + '/'
			+ 'engine_editor/html/ParticleEditor.html'
			,null
			,'width=1024, height=600'
		);
		
		//listen for it to load
		this._myWindow.addEventListener(
			'load'
			,function childWindowLoaded()
			{
				var aPreviewCanvas
					,aWindowResized
					;
				
				//get the graphics container
				aThis._myGraphicsContainer = aThis._myWindow.document
					.getElementById('graphicsContainer');
				
				//get the text area
				aThis._myJSONTextArea = aThis._myWindow.document
					.getElementById('ParticleJSONText');
				//setup acceptance of tab
				aThis._myJSONTextArea.addEventListener(
					'keydown'
					,function onKeyDown(inEvent)
					{
						var aKeyCode
							,aTarget
							,aStart
							,anEnd
							;
						
						//console.info(inEvent);
						
						aKeyCode = inEvent.keyCode;//TODO which?? || inEvent.which;
						if(aKeyCode === ECGame.EngineLib.Input.KEYBOARD.KEY_TAB)
						{
							inEvent.preventDefault();
							
							aTarget = inEvent.target;
							
							aStart = aTarget.selectionStart;
							anEnd = aTarget.selectionEnd;
							
							//console.log(aTarget, inEvent);
							//console.info('"' + aTarget.value + '"');
							//console.info('"' + aTarget.value.substring(0, aStart) + '"');
							//console.info('"' + aTarget.value.substring(anEnd) + '"');
							
							aTarget.value = aTarget.value.substring(0, aStart)
								+ "\t"
								+ aTarget.value.substring(anEnd);
								
							aTarget.selectionStart = aStart + 1;
							aTarget.selectionEnd = aStart + 1;//aTarget.selectionStart;
							
							//console.info('"' + aTarget.value + '"');
						}
					}
				);
					
				aThis._myExecuteButton = aThis._myWindow.document
					.getElementById('Execute');
				aThis._myExecuteButton.addEventListener(
					'click'
					,function executeClicked()
					{
						aThis._myParticleEffect.fromJSON(aThis._myJSONTextArea.value);
					}
				);
				
				//get the preview canvas
				aPreviewCanvas = aThis._myWindow.document
					.getElementById('ParticleEditorPreviewCanvas');
				
				//add the no canvas support message for if needed
				aPreviewCanvas.appendChild(
					document.createTextNode(
						ECGame.Settings.Graphics.NoCanvasSupportedMessage
					)
				);
				//setup the graphics object
				aThis._myGraphics = ECGame.EngineLib.Graphics2D.create();
				aThis._myGraphics.init(0, aPreviewCanvas);//TODO check for failure?
				
				//handle window resizes
				aWindowResized = function WindowResized()
				{
					ECGame.EngineLib.HandleCanvasContainerResize(
						aThis._myGraphicsContainer
						,aThis._myWindow
						,ECGame.Settings.Graphics.backBufferWidth * 2
						,ECGame.Settings.Graphics.backBufferHeight
					);
				};
				aThis._myWindow.addEventListener('resize', aWindowResized, false);
				aThis._myWindow.addEventListener('orientationchange', aWindowResized, false);
				//aThis._myWindow.addEventListener('load', aWindowResized, false);
				aWindowResized();
				
				
				
				//listen for the window to close/unload
				aThis._myWindow.addEventListener(
					'unload'
					,function childWindowUnloaded(inEvent)
					{
						//TODO destroy this, cleanup, etc..
						//console.info(arguments);
						aThis._myWindow.close();
					}
				);
				//listen for the master window to close/unload
				window.addEventListener(
					'unload'
					,function childWindowUnloaded(inEvent)
					{
						//TODO destroy this, cleanup, etc..
						//console.info(arguments);
						aThis._myWindow.close();
					}
				);
			}
		);
		
		//TODO add this to master list of child windows for closing when the master one closes
		
		//add this class to an updater
		ECGame.instance.createUpdater('EDITOR', 'MasterUpdater', /*inPriority HACK*/0);
		ECGame.instance.getUpdater('EDITOR').addUpdate(this);
	},
	Parents : [],
	flags : {},
		//netDynamic: sends dynamic messages over the network
		//TODO clientOnly??(<-how), serverOnly, clientCreatable??
	ChainUp : [],
	ChainDown : [],
	//TODO? mustOverride //pure virtual
	Definition :
	{
		update : function update(inUpdateData)
		{
			if(!this._myGraphics)
			{
				return;
			}
			
			//HACK
			//console.log(this._myJSONTextArea.value);
			
			this._myGraphics.render(this);
		}
		,render : function render(inGraphics)
		{
			this._myParticleEffect.render(inGraphics);
		}
	}
});