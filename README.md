# Teddy 

Modeling by Freeform Stroke

## Overview

The project is based on Igarashi’s work [“Teddy: a sketching interface for 3D freeform design”](https://www-ui.is.s.u-tokyo.ac.jp/~takeo/teddy/teddy.htm) in SIGGRAPH '99. Teddy generates plausible 3D model with spherical topology (closed, having two sides and without holes) based on your freeform strokes on 2D canvas, instead of letting you build with primitives like spheres and cubes. 

## Implemented features

- [x] Object creation: construction of polygonal surface by inflating the region surrounded by the silhouette

### Running the code

In terminal, cd to the directory of /teddy, then run `python -m SimpleHTTPServer 8000` or `python3 -m http.server 8000`. Go to `0.0.0.0:8000` in browser. (You can also use another port #)

## Technical Details

### Detect self-intersection in polyline

To detect self intersection in polyline, I used [Shamos-Hoey Algorithm](http://geomalgorithms.com/a09-_intersect-3.html), a variance of Sweepline Algorithm. It keeps segments along the trajectory with binary search tree, and if any segment inserted to the tree intersects with the segments immediately above and below it (segment 1 above segment 2 generally means 1’s left endpoint is on the right of 2’s left endpoint, see code snapshot below). If no such intersection exists, the trajectory is not self intersecting. [Here](https://www.quora.com/Given-four-Cartesian-coordinates-how-do-I-check-whether-these-two-segments-intersect-or-not-using-C-C++#)'s a resource for 2 segment intersection. See `js/algorithms/selfIntersect.js`.

### Path equalization

To create a polyline with approximately uniform edge length, the program sample points along the trajectory by fixed distance, this distance is measured by treating all the segments along the trajectory as vectors, and adding up their lengths. The vertices on the result polyline is not necessarily from the original mouse trajectory. See `js/algorithms/Equalize.js`. 

Below is a pseudocode of [YANG-H's implementation of Equalization](http://mattatz.org/works/teddy/https://github.com/YANG-H/Teddy).

```
Equalize (outputVerts, mousePositions, step, isClosed)
	N = mousePositions.length
	if isClosed: N = N+1
	if mousePositions contains <=1 points: discard the trajectory
	otherwise:
		segmentLen = 0
		lastAddedPoint=mousePositions[0]
		outputVerts.add(lastAddedPoint)
		for (i=0; i<N; i++):
			newVec = mousePositions[i%len] - mousePositions[i-1]
			newVecLen = |newVec|
			if (segmentLen + newVecLen< step):
				segmentLen += newVecLen
				continue
			//else
			d = step - segmentLen
			while (d<=newVecLen)
				newPoint = mousePositions[i-1] + newVec.normalize()*d
				outputVerts.add(newPoint)
				lastAddedPoint = newPoint
				segmentLen = newVecLen - d
				d += step
		//end for
	//end if
 ```

### Constrained Delaunay Triangulation

For triangulation based on the polygon vertices, I implemented [Delaunay triangulation](http://paulbourke.net/papers/triangulate/), a version that iteratively adds each vertex into the triangulation. For a discrete point set, Delaunay triangulation ensures no point is inside circumcircle of any other triangle, but it only makes use of the polygon vertices information, so the result is a convex hull around all vertices. 
	
However user input is not necessarily convex, so the program later deletes all triangles whose centroid is outside of the polygon we have. To determine whether a point is inside a polygon, [Winding algorithm](http://forums.codeguru.com/showthread.php?497679-To-check-if-a-point-is-inside-a-polygon) is used. It counts the number of times the polygon outline travels counterclockwise around the point, which is called winding number. If it is nonzero, then the point is within the polygon. See `js/algorithms/Delaunay.js`.

### Triangle pruning

To create a spine based on the triangulated polygon, we first classify triangles into Terminal(1 internal edge), Junction(3 internal edges) and Sleeve(2 internal edges) triangles, then prune insignificant branches of triangles. 

Next we convert T triangle to fan triangles: for each T triangle X, erect a semicircle with the internal edge as diameter, if all 3 vertices lie on or within the semicircle, remove the interior edge and merge X with triangle that lies in the other side of the edge.
	
Then add chordal axis/ spine by connecting internal point of fan triangles and midpoints of internal edges (we call the 2 types of vertices as spine vertices).
	
The last step is subdividing edges connecting spine vertex and external vertex (the vertex that originally belongs to the polygon contour) equally into 4 parts and lift them as if they are on a 1/4 oval.

For more detail, see figure 13-15 in the original paper.
	
See `js/algorithms/pruneTrianglesAndElevateVertices.js`.

### References
- Igarashi, Takeo, et al. "Teddy: a sketching interface for 3D freeform design." Acm siggraph 2007 courses. ACM, 2007.
- Other resources are linked to inline
