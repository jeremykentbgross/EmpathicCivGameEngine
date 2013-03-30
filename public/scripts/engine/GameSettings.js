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

////////////////////////////////////////////////////////////////////
//NOTE: THESE ARE DEFAULTS!! ADD CUSTOM LOCAL CHANGES AT THE BOTTOM!
//
//Example:
//	Add the following to the bottom of the page to turn on the drawing of physics
// =>
//	ECGame.Settings.Debug.Physics_Draw = true;
//
////////////////////////////////////////////////////////////////////
ECGame.Settings = //TODO rename as GameSystemSettings
{
	DEBUG : true,//TODO replace ECGame.Settings.DEBUG
	RUN_UNIT_TESTS : true,//TODO replace ECGame.Settings.RUN_UNIT_TESTS
	
	//TODO appname
	
	Graphics :
	{
		initWidth : 768,
		initHeight : 512
		//use 3d?
	},
	
	Sound :
	{
		masterVolume : 0.85//TODO save user changes in their local settings
		,effectsVolume : 1.0//TODO save user changes in their local settings
		
		//Note this should be roughly the renderspace radius (or a bit more to hear off screen)
		,default2DRadius : 512
		
		/*
		Note: should instead probably convert pixels to meters,
			have AudioListener.speedOfSound set in pix/sec (instead of meters/sec)
			instead of setting AudioListener.dopplerFactor to a trial and error 'magic number'
			BUT for some reason this works better than doing it the theoretically 'correct' way
		Note: default AudioListener.speedOfSound === 343.3 (meters / sec)
		*/
		,dopplerFactor : 0.001
		,speedOfSound : 343.3/*meters/sec*/ // * 128/*pixels in a meter*/
	},
	
	Input :
	{
		//TODO controls
	},
	
	Network :
	{
		isServer : false
		,isMultiplayer : true
		,GamePort : null//1337	//if null then defaults to port 80 and reuses main connection
		//TODO editorPort : ??
	},
	
	Timer :
	{
		useRequestAnimFrame : false	//false -> requestAnimFrame is almost certainly less secure, and possibly slower
	},
	
	Server :
	{
		compressClientCode : true//true
		////////////////////////////////////////////
		//only working when compressing client code:
		,removeTextForLocalization : true//true
		,removeNonNewlineWhiteSpace : true//true
		,removeNewlines : true//true
		,obfuscateNames : true//true
		,useModifiedNamesNotPureObfuscate : false//false
		,saveResultsNotesToFile : true//true
		//:only working when compressing client code
		////////////////////////////////////////////
	},
	
	//TODO make the logger in global or instance space
	
	//TODO move all debug items into their normal specific categories
	Debug :
	{
		//Name_Type, Type = <Print (bool), Draw (bool), DrawColor (color), Size (int/float)>
		
		TextMessages_Draw : true,//TODO rename (use in renderer)
		
		//scenegraph
		SceneGraph_Draw : false,
		
		//map
		Map_Draw : false,
		//TODO colors
		
		//physics
		Physics_Draw : false,
		//TODO colors
		
		//camera
		GameWorld_CameraTarget_Draw : false,
		GameWorld_CameraTarget_Size : 10,
		GameWorld_CameraTarget_DrawColor : 'rgba(255, 255, 0, 1)',
		//TODO draw entity position locators
		
		//bsp tree
		SpacialPartitioningTree_Node_DrawColor : 'rgba(64, 64, 64, 1)',
		SpacialPartitioningTree_OccupiedNode_DrawColor : 'rgba(255, 255, 255, 1)',
		SpacialPartitioningTree_Item_DrawColor : 'rgba(128, 0, 128, 1)',
		
		//input
		Input_Draw : false,
		Input_Active_DrawColor : 'rgba(0, 255, 0, 1)',
		Input_Inactive_DrawColor : 'rgba(0, 0, 255, 1)',
		Input_Print : false,
		//TODO this goes in input NOT gameworld, how make sure the cursor is rendered?? have renderer listen to input?
		GameWorld_MouseCursor_Draw : true,//TODO merge this with Input_Draw
		GameWorld_MouseCursor_Size : 10,
		//TODO use active and inactive colors instead?
		GameWorld_MouseCursor_DrawColor : 'rgba(0, 255, 0, 1)',
		
		//frame stats
		FrameStats_Draw : true,
		FrameStats_DrawColor : 'rgba(255, 255, 0, 1)',
		FrameStats_Print : false,
		
		//Object
		GameObject_Print : false,
		
		//Sound:
		Sound_Print : true,
		Sound_Draw : false,
		Sound_Area_DrawColor : 'rgba(255, 128, 0, 1)',
		Sound_Listener_Size : 20,//TODO this should be in the regular sound part!??
		Sound_Source_Size : 10,
		
		Sprite_Draw : false,
		Sprite_AABB_DrawColor : 'rgba(256, 128, 128, 1)',
		Sprite_Origin_DrawColor : 'rgba(256, 128, 128, 1)',
		Sprite_Origin_Size : 10,
		
		//TODO search for rgba in all files		
		
		//Network
		NetworkMessages_Draw : true,
		NetworkMessages_DrawColor : 'rgba(0, 255, 0, 1)',
		NetworkMessages_Print : true,
		
		//default debug text color
		TextDefault_DrawColor : 'rgba(255, 255, 255, 1)',
		TextBackground_DrawColor : 'rgba(0, 0, 0, 0.5)',
		Text_Size : 12,
		
		Obfuscation_Print : false
	}
};



///////////////////////////////////////////////////////////////////
//NOTE: CUSTOM LOCAL CHANGES GO BELOW HERE
//
//example:
//	ECGame.Settings.Debug.Physics_Draw = true;
//
///////////////////////////////////////////////////////////////////

//ECGame.Settings.Debug.Text_Size = 10;
//ECGame.Settings.Graphics.initWidth = 1024;
//ECGame.Settings.Graphics.initHeight = 512;