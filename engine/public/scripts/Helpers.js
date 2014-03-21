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

ECGame.EngineLib.HandleCanvasContainerResize = function HandleCanvasContainerResize(
	inContainer
	,inWindow
	,inMaxWidth
	,inMaxHeight
)
{
	var aWidthToHeight
		,aNewWidth
		,aNewHeight
		,aNewWidthToHeight
		;
	
	aWidthToHeight = inMaxWidth / inMaxHeight;

	aNewWidth = inWindow.innerWidth;
	aNewHeight = inWindow.innerHeight;
	aNewWidthToHeight = aNewWidth / aNewHeight;
	
	if(aNewWidthToHeight > aWidthToHeight)
	{
		aNewWidth = aNewHeight * aWidthToHeight;
	}
	else
	{
		aNewHeight = aNewWidth / aWidthToHeight;
	}
	aNewHeight = Math.min(aNewHeight, inMaxHeight);
	aNewWidth = Math.min(aNewWidth, inMaxWidth);
	if(!ECGame.Settings.Graphics.resizable)
	{
		aNewHeight = inMaxHeight;
		aNewWidth = inMaxWidth;
	}
	
	inContainer.style.height = aNewHeight + 'px';
	inContainer.style.width = aNewWidth + 'px';
	inContainer.style.marginTop = Math.max((inWindow.innerHeight-aNewHeight) / 2, 0) + 'px';
	inContainer.style.marginLeft = Math.max((inWindow.innerWidth-aNewWidth) / 2, 0) + 'px';
};

