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

/*NOTE: This is not EXACTLY BresenhamsLine internally because javascript
	has no pure integers.  So I made my own optimization by changing the rounding
*/

ECGame.EngineLib.BresenhamsLine = function BresenhamsLine(inPoint1, inPoint2, inCallback)
{
	var aDeltaX
		,aDeltaY
		,aSignX
		,aSignY
		,aSlope
		,i, j
		;
	
	aDeltaX = inPoint2.myX - inPoint1.myX;
	aDeltaY = inPoint2.myY - inPoint1.myY;
	
	if(aDeltaX === 0 && aDeltaY === 0)
	{
		return;
	}
	
	aSignX = aDeltaX < 0 ? -1 : 1;
	aSignY = aDeltaY < 0 ? -1 : 1;
	
	if(Math.abs(aDeltaX) >= Math.abs(aDeltaY))
	{
		aSlope = aDeltaY / Math.abs(aDeltaX);
		j = inPoint1.myY + 0.5;
		for(i = inPoint1.myX; i !== inPoint2.myX; i += aSignX)
		{
			if(!inCallback(ECGame.EngineLib.Point2.create(i, Math.floor(j))))
			{
				return;
			}
			j += aSlope;
		}
		inCallback(ECGame.EngineLib.Point2.create(i, Math.floor(j)));
	}
	else
	{
		aSlope = aDeltaX / Math.abs(aDeltaY);
		i = inPoint1.myX + 0.5;
		for(j = inPoint1.myY; j !== inPoint2.myY; j += aSignY)
		{
			if(!inCallback(ECGame.EngineLib.Point2.create(Math.floor(i), j)))
			{
				return;
			}
			i += aSlope;
		}
		inCallback(ECGame.EngineLib.Point2.create(Math.floor(i), j));
	}
};