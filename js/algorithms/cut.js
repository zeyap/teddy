const _cut = ()=>{

    function pointToSegmentDistance(p, p1,p2){
        const dp1 = vec3.distance(p,p1)
        const dp2 = vec3.distance(p,p2)
        const segVec = vec3.create()
        vec3.subtract(segVec,p2,p1)
        vec3.normalize(segVec,segVec)
        const p1p = vec3.fromValues(p[0]-p1[0],p[1]-p1[1],p[2]-p1[3])
        const cosTheta = vec3.dot(segVec,p1p)/vec3.length(p1p)
        const dLine = vec3.length(p1p)*Math.sqrt(1-cosTheta*cosTheta)
        if(dLine<Math.min(dp1,dp2)){
            return Math.min(dp1,dp2)
        }else{
            return dLine;
        }
    }

    function isTriangleAbovePlane(triangle,p1,p2,verticesList,getRay){
        const ray1 = getRay(p1[0],p1[1])
        const ray2 = getRay(p2[0],p2[1])
        const planeN = vec3.create()
        vec3.cross(planeN,ray1.dir,ray2.dir)
        vec3.normalize(planeN,planeN)

        const c = triangle.centroid
        const v1 = verticesList[triangle.vertIds[0]],
        v2 = verticesList[triangle.vertIds[1]],
        v3 = verticesList[triangle.vertIds[2]];

        const cMinP0 = vec3.create()
        vec3.subtract(cMinP0,c,ray1.o)
        const v1MinP0 = vec3.create()
        vec3.subtract(v1MinP0,v1,ray1.o)
        const v2MinP0 = vec3.create()
        vec3.subtract(v2MinP0,v2,ray1.o)
        const v3MinP0 = vec3.create()
        vec3.subtract(v3MinP0,v3,ray1.o)
        
        const dists = [
                    vec3.dot(planeN,cMinP0),
                    vec3.dot(planeN,v1MinP0),
                    vec3.dot(planeN,v2MinP0),
                    vec3.dot(planeN,v3MinP0)];
                    // dot prod with the plane normal

        if(dists[0]<0||dists[1]<0||dists[2]<0||dists[3]<0){// segment is cw and centroid is left to the segment
            return false
        }
        return true
    }

    return {
        pointToSegmentDistance,
        isTriangleAbovePlane,
    };
}