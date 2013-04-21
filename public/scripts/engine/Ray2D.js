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

ECGame.EngineLib.Ray2D = ECGame.EngineLib.Class.create({
	Constructor : function Ray2D()
	{
		//Line equation:
		//v = p1 - p0
		//P = p0 + vt
		this._myP0 = null;
		this._myP1 = null;
		this._myV = null;
		this._myT = 0;		//current length along the ray
		this._myMaxT = 0;	 //max length of ray
			
		this._myCurrentPoint = null;	 //current position along the ray //TODO rename currentPoint?
		this._myCurrentNode = null;
	},
	Parents : [],
	flags : {},
	ChainUp : [],
	ChainDown : [],
	Definition :
	{
		ourFrameRayCounter : 0,	//TODO needed???
		
		init : function init(inRootNode, inStartingPoint, inEndingPoint)
		{
			this._myCurrentNode = inRootNode;
			
			this._myP0 = inStartingPoint;
			this._myP1 = inEndingPoint;
			this._myV = this._myP1.subtract(this._myP0);
			
			this._myT = 0;	//starting at 0 makes sure the ray goes the right direction in the first node.
			this._myMaxT = this._myV.length();
			
			this._myV = this._myV.scale((1.0 / this._myMaxT));	//the same as v.normalize(), but reusing sqrt from length above
			
			this._myCurrentPoint = this._myP0;	//also 'last point', so start at p0
			this._myCurrentNode = this._myCurrentNode.findSmallestContainingDescendant(this._myCurrentPoint);

			++ECGame.EngineLib.Ray2D.ourFrameRayCounter;
		},

		//returns if it can continue
		update : function update()
		{
			var aD123,
				aD456,
				aT123,
				aT456,
				aNewT;
			
			if(this._myCurrentNode === null)
			{
				return false;
			}
			
			//TODO note current node here is visible this frame, add it to a list

//TODO: handle solid based trees!!
			//we cannot go deeper, and this is blocled
//			if(this._myCurrentNode->Full())//todo change this for transperancy!!
//			{
//				return false;
//			}

			//collide ray vs box walls (which happen to be all axis aligned planes)
			//	Meaning: all planes are of the form: X = 3, or Y = 4
			//		where a plane is given by: AX + BY + CZ = D
			//	So: for "left top front", and "right bottom back" (2 sets of 3 planes)
			//		Solve plane 1X + 0Y + 0Z = D1 and line P = p0 + t * v for 't'
			//		Solve plane 0X + 1Y + 0Z = D2 and line P = p0 + t * v for 't'
			//		Solve plane 0X + 0Y + 1Z = D3 and line P = p0 + t * v for 't'
			//			This would be done by plugging P (or 'p0 + t * v') into X,Y,Z of each plane equation.
			//	But: Each plane solution only needs one of the vector components (the others are times 0),
			//		so we can solve all at once by putting a plane into each component of D123 and D456 and treating 't' as a vector
			//			D1 = [1, 0, 0] * p0 + t * v		//only has x
			//			D2 = [0, 1, 0] * p0 + t * v		//only has y
			//			D3 = [0, 0, 1] * p0 + t * v		//only has z
			//			=>	D123.xyz = p0 + t * v		//where t is vector, and t * v is per component mul
			aD123 = new ECGame.EngineLib.Point2(
				this._myCurrentNode.getAABB().getLeft()
				,this._myCurrentNode.getAABB().getTop()
				//,this._myCurrentNode.getAABB().getFront()
			);
			aD456 = new ECGame.EngineLib.Point2(
				this._myCurrentNode.getAABB().getRight()
				,this._myCurrentNode.getAABB().getBottom()
				//,this._myCurrentNode.getAABB().getBack()
			);
			//	P = p0 + t * v
			//	and P = D
			//		=>	
			//		t = (D - p0) / v
			aT123 = aD123.subtract(this._myP0).divide(this._myV);	//per component div
			aT456 = aD456.subtract(this._myP0).divide(this._myV);	//per component div

			//now find the min aNewT (first plane intersection)
			//	that is also > t_old (meaning skipping plane intersection that happened before reaching this node as t_old is last intersection)
			aNewT = Number.MAX_VALUE;
			if(aT123.myX < aNewT && aT123.myX > this._myT)
				aNewT = aT123.myX;
			if(aT123.myY < aNewT && aT123.myY > this._myT)
				aNewT = aT123.myY;
//			if(aT123.myZ < aNewT && aT123.myZ > this._myT)
//				aNewT = aT123.myZ;
			if(aT456.myX < aNewT && aT456.myX > this._myT)
				aNewT = aT456.myX;
			if(aT456.myY < aNewT && aT456.myY > this._myT)
				aNewT = aT456.myY;
//			if(aT456.myZ < aNewT && aT456.myZ > this._myT)
//				aNewT = aT456.myZ;

			//if we are past the end of the ray, quit!
			if(aNewT > this._myMaxT)
			{
				this._myT = this._myMaxT;
				this._myCurrentPoint = this.getPoint(this._myT);
				return false;
			}

			//bump t into the next node, and remember this spot for next time.
			this._myT = aNewT += 0.001;

			this._myCurrentPoint = this.getPoint(this._myT);
				
			//while we do not contain the collision point (bumped into next node) recurse to parent
			//	then go back into the smallest child:
			this._myCurrentNode = this._myCurrentNode.findSmallestContainingNodeFromHere(this._myCurrentPoint);
			if(this._myCurrentNode === null)
			{
				return false;
			}

			return true;
		},
		
		intersectAABB : function intersectAABB(inAABB)
		{
			var aD123,
				aD456,
				aT123,
				aT456,
				aNewT;
			
			if(inAABB.containsPoint(this._myP0))
			{
				return this._myP0.clone();
			}

			//collide ray vs box walls (which happen to be all axis aligned planes)
			//	Meaning: all planes are of the form: X = 3, or Y = 4
			//		where a plane is given by: AX + BY + CZ = D
			//	So: for "left top front", and "right bottom back" (2 sets of 3 planes)
			//		Solve plane 1X + 0Y + 0Z = D1 and line P = p0 + t * v for 't'
			//		Solve plane 0X + 1Y + 0Z = D2 and line P = p0 + t * v for 't'
			//		Solve plane 0X + 0Y + 1Z = D3 and line P = p0 + t * v for 't'
			//			This would be done by plugging P (or 'p0 + t * v') into X,Y,Z of each plane equation.
			//	But: Each plane solution only needs one of the vector components (the others are times 0),
			//		so we can solve all at once by putting a plane into each component of D123 and D456 and treating 't' as a vector
			//			D1 = [1, 0, 0] * p0 + t * v		//only has x
			//			D2 = [0, 1, 0] * p0 + t * v		//only has y
			//			D3 = [0, 0, 1] * p0 + t * v		//only has z
			//			=>	D123.xyz = p0 + t * v		//where t is vector, and t * v is per component mul
			aD123 = new ECGame.EngineLib.Point2(
				inAABB.getLeft()
				,inAABB.getTop()
				//,inAABB.getFront()
			);
			aD456 = new ECGame.EngineLib.Point2(
				inAABB.getRight()
				,inAABB.getBottom()
				//,inAABB.getBack()
			);
			//	P = p0 + t * v
			//	and P = D
			//		=>	
			//		t = (D - p0) / v
			aT123 = aD123.subtract(this._myP0).divide(this._myV);	//per component div
			aT456 = aD456.subtract(this._myP0).divide(this._myV);	//per component div

			//now find the min aNewT (first plane intersection)
			//	that is also > t_old (meaning skipping plane intersection that happened before reaching this node as t_old is last intersection)
			aNewT = this._myMaxT;
			if(aT123.myX < aNewT && aT123.myX > 0 && inAABB.containsPoint(this.getPoint(aT123.myX + 0.001)))
				aNewT = aT123.myX;
			if(aT123.myY < aNewT && aT123.myY > 0 && inAABB.containsPoint(this.getPoint(aT123.myY + 0.001)))
				aNewT = aT123.myY;
//			if(aT123.myZ < aNewT && aT123.myZ > 0)
//				aNewT = aT123.myZ;
			if(aT456.myX < aNewT && aT456.myX > 0 && inAABB.containsPoint(this.getPoint(aT456.myX + 0.001)))
				aNewT = aT456.myX;
			if(aT456.myY < aNewT && aT456.myY > 0 && inAABB.containsPoint(this.getPoint(aT456.myY + 0.001)))
				aNewT = aT456.myY;
//			if(aT456.myZ < aNewT && aT456.myZ > 0)
//				aNewT = aT456.myZ;

			//if we are past the end of the ray, quit!
			if(aNewT !== this._myMaxT)
			{
				return this.getPoint(aNewT + 0.001);//TODO make 0.001 a constant var!
			}

			return null;
		},
		
		getPoint : function getPoint(inT)
		{
			return this._myP0.add(this._myV.scale(inT));
		},
		
		getCurrentNode : function getCurrentNode()
		{
			return this._myCurrentNode;
		},

		getCurrentPoint : function getCurrentPoint()
		{
			return this._myCurrentPoint;
		},

		getStartPoint : function getStartPoint()
		{
			return this._myP0;
		},

		getEndPoint : function getEndPoint()
		{
			return this._myP1;
		},

		getCurrentLength : function getCurrentLength()
		{
			return this._myT;
		},

		getMaxLength : function getMaxLength()
		{
			return this._myMaxT;
		},
	}
});