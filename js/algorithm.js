const algorithm = (()=>{
    function Equalize(outputVerts,mousePath,step){
        if(mousePath.length<=1){
            
            return;
        }
        var segmentLen = 0;
        if(outputVerts==null){
            outputVerts = [];
        }
        outputVerts.push(mousePath[0])
        var lastAddedPoint = mousePath[0];
        
        for(let i=1;i<=mousePath.length;i++){
            const newVec = vec3.create();
            vec3.subtract(newVec, mousePath[i%mousePath.length], mousePath[i-1]);
            const newVecNorm = vec3.create();
            vec3.normalize(newVecNorm,newVec)
            const newVecLen = vec3.length(newVec);

            if(segmentLen+newVecLen<step){
                segmentLen+=newVecLen;
                continue;
            }
            //else
            var d = step - segmentLen;
            
            while(d<=newVecLen){
                const newPoint = vec3.create()
                vec3.scaleAndAdd(newPoint, mousePath[i-1], newVecNorm,d)
                outputVerts.push(newPoint)
                
                lastAddedPoint = newPoint
                segmentLen = newVecLen - d;
                d+=step;
            }
        }

    }

    function isInsidePolygon(p, edgeVerts){
        function isLeft(p1,p2,p){
            return (p2[0]-p1[0])*(p[1]-p1[1])-(p2[1]-p1[1])*(p[0]-p1[0])
        }

        var windingNumber = 0;
        for(let i=0;i<edgeVerts.length;i++){
            // edge edgeVerts[i] to edgeVerts[i+1]
            var p1 = edgeVerts[i], p2;
            if(i===edgeVerts.length-1){
                p2 = edgeVerts[0]
            }else{
                p2 = edgeVerts[i+1];
            }
            if(p1[1]<=p[1]){
                if(p2[1]>p[1]){ // An upward crossing
                    if(isLeft(p1,p2,p)>0){
                        windingNumber++;
                    }
                }
            }else{
                if(p2[1]<=p[1]){
                    if(isLeft(p1,p2,p)<0){
                        windingNumber--;
                    }
                }
            }
        }
        return windingNumber!==0;
    }

    function removeDoublyDefinedEdges(edgeBuffer){
        edgeBuffer.sort((e1,e2)=>{
            if(e1[0]<e2[0]){
                return -1;
            }else if(e1[0]>e2[0]){
                return 1;
            }

            if(e1[1]<e2[1]){
                return -1
            }else if(e1[1]>e2[1]){
                return 1;
            }
            return 0;
        })
        
        const newEdgeBuffer = [];
        
        for(let j=0;j<edgeBuffer.length;j++){
            const curr = edgeBuffer[j]
            
            if(j>0 
            && edgeBuffer[j-1][0]===curr[0] 
            && edgeBuffer[j-1][1]===curr[1]){
                if(newEdgeBuffer.length>0 
                && newEdgeBuffer[newEdgeBuffer.length-1][0]===curr[0] 
                && newEdgeBuffer[newEdgeBuffer.length-1][1]===curr[1]){
                    newEdgeBuffer.pop();
                }
            }else{
                newEdgeBuffer.push(curr)
            }
        }
        return newEdgeBuffer;
    }

    function Delaunay(verts){

        function triangleCircumcenter(vertIds){
            
            const x1=verts[vertIds[0]][0], 
                x2=verts[vertIds[1]][0], 
                x3=verts[vertIds[2]][0], 
                y1=verts[vertIds[0]][1], 
                y2=verts[vertIds[1]][1],
                y3=verts[vertIds[2]][1];
                
            const center = vec3.fromValues(
                ((y2-y1) * (y3*y3 - y1*y1 + x3*x3 - x1*x1) - (y3-y1)* (y2*y2 - y1*y1 + x2*x2 - x1*x1))/ (2 * (x3-x1) * (y2-y1) - 2 * ((x2-x1) * (y3-y1))),
                ((x2-x1) * (x3*x3 - x1*x1 + y3*y3 - y1*y1) - (x3-x1)* (x2*x2 - x1*x1 + y2*y2 - y1*y1))/ (2 * (y3-y1) * (x2-x1) - 2 * ((y2-y1) * (x3-x1)))
                ,z);
            return center;
        }

        function triangleCentroid(vertIds){
            const x1=verts[vertIds[0]][0], 
                x2=verts[vertIds[1]][0], 
                x3=verts[vertIds[2]][0], 
                y1=verts[vertIds[0]][1], 
                y2=verts[vertIds[1]][1],
                y3=verts[vertIds[2]][1];
            return vec3.fromValues((x1+x2+x3)/3,(y1+y2+y3)/3,z)
        }

        const triangles = [];
        /* each triangle: {
            vertIds:[],
            center:vec3,
            radius:Number,
        }
        */
        // determine the super triangle, add to the end of vertices list
        if(verts.length===0){
            return triangles;
        }
        var xLBound = verts[0][0], xUBound=verts[0][0], yLBound=verts[0][1], yUBound=verts[0][1];
        const z = verts[0][2];
        for(let i=1;i<verts.length;i++){
            xLBound = Math.min(verts[i][0],xLBound);
            xUBound = Math.max(verts[i][0],xUBound);
            yLBound = Math.min(verts[i][1],yLBound);
            yUBound = Math.max(verts[i][1],yUBound);
        }
        verts.push(vec3.fromValues(
            (xLBound+xUBound)/2,yUBound+(yUBound-yLBound)/2,z
        ))
        verts.push(vec3.fromValues(
            xLBound-(xUBound-xLBound),yLBound,z
        ))
        verts.push(vec3.fromValues(
            xUBound+(xUBound-xLBound),yLBound,z
        ))

        const superTVertIds = [verts.length-1,verts.length-2,verts.length-3];
        const superTCenter = triangleCircumcenter(superTVertIds);
        
        triangles.push({
            vertIds:superTVertIds,
            center:superTCenter,
            centroid: triangleCentroid(superTVertIds),
            radius:vec3.distance(superTCenter,verts[verts.length-1]),
        })
        
        
        for(let i=0;i<verts.length;i++){
            var edgeBuffer = [];
            
            for(let j=0;j<triangles.length;j++){
                const triangle = triangles[j];
                
                if(triangle.radius>=vec3.distance(verts[i],triangle.center)){
                    // if the point lies in the triangle circumcircle then
                    // - add the three triangle edges to the edge buffer
                    // - remove the triangle from the triangle list
                    var v1Id = triangle.vertIds[0],
                    v2Id = triangle.vertIds[1],
                    v3Id = triangle.vertIds[2];
                    if(i!==v1Id && i!==v2Id){
                        edgeBuffer.push([Math.min(v1Id,v2Id),Math.max(v1Id,v2Id)]);
                    }
                    if(i!==v2Id && i!==v3Id){
                        edgeBuffer.push([Math.min(v2Id,v3Id),Math.max(v2Id,v3Id)]);
                    }
                    if(i!==v1Id && i!==v3Id){
                        edgeBuffer.push([Math.min(v3Id,v1Id),Math.max(v3Id,v1Id)]);
                    }

                    triangles.splice(j,1);
                    j--;
                }
            }
            // delete all doubly specified edges from the edge buffer
            edgeBuffer = removeDoublyDefinedEdges(edgeBuffer)
            
            // add to the triangle list all triangles formed between the point and the edges of the enclosing polygon
            for(let j=0;j<edgeBuffer.length;j++){
                
                const vertIds = [i,edgeBuffer[j][0],edgeBuffer[j][1]];
                
                const center = triangleCircumcenter(vertIds);

                const radius = vec3.distance(center,verts[i]);
                if(isNaN(radius)){
                    // 3 verts are in a line
                    continue;
                }
                
                const newTriangle = {
                    vertIds,
                    center,
                    centroid: triangleCentroid(vertIds),
                    radius,
                }
                
                triangles.push(newTriangle);
            }
        }

        // remove any triangles 1. from the triangle list that use the supertriangle vertices, 2. centroid of which is outside of the polygon (using winding number algorithm)
        for(let i=0;i<triangles.length;i++){
            const triangle = triangles[i]
            if(triangle.vertIds.indexOf(verts.length-1)>-1
            ||triangle.vertIds.indexOf(verts.length-2)>-1
            ||triangle.vertIds.indexOf(verts.length-3)>-1
            ||isInsidePolygon(triangle.centroid,verts.slice(0,verts.length-3))===false){
                triangles.splice(i,1);
                i--;
            }
        }
        
        // remove the supertriangle vertices from the vertex list
        verts.splice(verts.length-3,3);

        return triangles;
        
    }

    function removeAnEdgeFromInteriorEdges(interiorEdges, p1, p2){
        for(let k=0;k<interiorEdges.length;k++){
            if(interiorEdges[k][0]===p1&&interiorEdges[k][1]===p2){
                interiorEdges.splice(k,1)
                break;
            }
        }
    }

    function pruneTrianglesAndElevateVertices(triangles, verts){
        if(triangles.length<2){
            return triangles;
        }
        
        const edgeToTriangle = {};
        for(let i=0;i<verts.length;i++){
            edgeToTriangle[i] = {};
            for(let j=i+1;j<verts.length;j++){
                edgeToTriangle[i][j] = [];
            }
        }

        // classify triangles, and create a dictionary from edge to triangle
        for(let i=0;i<triangles.length;i++){
            const triangle = triangles[i]
            var vert1Id = triangle.vertIds[0];
            var vert2Id = triangle.vertIds[1];
            var vert3Id = triangle.vertIds[2];
            var minId = Math.min(vert1Id,vert2Id,vert3Id), 
            maxId = Math.max(vert1Id,vert2Id,vert3Id), 
            midId = minId^maxId^vert1Id^vert2Id^vert3Id;
            
            edgeToTriangle[minId][midId].push(i);
            edgeToTriangle[midId][maxId].push(i);
            edgeToTriangle[minId][maxId].push(i);

            triangle.interiorEdges = [];
            triangle.externalEdges = [];
            
            if(minId === 0&&maxId === verts.length-1){
                triangle.externalEdges.push([minId, maxId])
            }else{
                triangle.interiorEdges.push([minId, maxId])
            }
            if(minId+1===midId){
                triangle.externalEdges.push([minId, midId])
            }else{
                triangle.interiorEdges.push([minId, midId])
            }
            if(midId+1===maxId){
                triangle.externalEdges.push([midId, maxId])
            }else{
                triangle.interiorEdges.push([midId, maxId])
            }

            switch(triangle.externalEdges.length){
                case 0:
                triangle.type = 'J';//junction
                break;
                case 1:
                triangle.type = 'S';//sleeve
                break;
                case 2:
                triangle.type = 'T';//terminal
                break;
            }
        }

        // pruning
        const prunedTriangles = [];
        const triangleDeleted = [];
        const spineEndpointsId = [];
        const spineEndpointsTriangleId = [];
        const interiorVerts = {};

        for(let i=0;i<triangles.length;i++){
            
            var triangle = triangles[i]
            var triangleId = i;
            if(triangle.type === 'T'){
                
                var edgeBuffer = [];
                const vertBuffer = [];
                var interiorEdge = triangle.interiorEdges[0];
                var anotherVertId;
                var semicircleCenter = vec3.create();
                while(true){
                    triangleDeleted[triangleId] = true;
                    // create a semicircle using the interior edge

                    const inEdgeV1Id = interiorEdge[0],
                    inEdgeV2Id = interiorEdge[1];
                    semicircleCenter = getEdgeCenter(verts[inEdgeV1Id],verts[inEdgeV2Id])

                    anotherVertId = triangle.vertIds[0]^triangle.vertIds[1]^triangle.vertIds[2]
                    ^inEdgeV1Id^inEdgeV2Id;

                    // stop if some vertex is outside the semicircle, or the newly merged triangle is a junction triangle
                    
                    vertBuffer.push(anotherVertId);
                    var anyVertOutOfSemicircle = false;
                    for(let j=0;j<vertBuffer.length;j++){
                        
                        if(vec3.distance(semicircleCenter,verts[vertBuffer[j]])>vec3.distance(semicircleCenter,verts[inEdgeV1Id])){
                            anyVertOutOfSemicircle = true;
                            break;
                        }
                    }
                    if(anyVertOutOfSemicircle===true){
                        
                        // if(triangle.type==='T'){
                            
                        //     break;
                        // }
                        // const anotherInEdge = (triangle.interiorEdges[0][0]===interiorEdge[0]&&triangle.interiorEdges[0][1]===interiorEdge[1])?triangle.interiorEdges[1]:triangle.interiorEdges[0];
                        // const mid = vec3.create()
                        // vec3.add(mid,verts[anotherInEdge[0]],verts[anotherInEdge[1]])
                        
                        // vec3.scale(mid,mid,0.5)
                        // verts.push(mid)
                        // edgeBuffer.push([verts.length-1,inEdgeV1Id]);
                        // edgeBuffer.push([verts.length-1,inEdgeV2Id]);
                        
                        break;
                    }

                    if(triangle.type==='T'){
                        edgeBuffer.push([...triangle.externalEdges[0]]);
                        edgeBuffer.push([...triangle.externalEdges[1]]);
                    }else if(triangle.type==='S'){
                        edgeBuffer.push([...triangle.externalEdges[0]]);
                    }
                    
                    // find the next triangle to merge
                    const adjacentTriangles = edgeToTriangle[inEdgeV1Id][inEdgeV2Id];
                    
                    triangleId = adjacentTriangles[0]===i?adjacentTriangles[1]:adjacentTriangles[0];

                    triangle = triangles[triangleId];

                    if(triangleId==null||triangle==null){
                        break;
                    }
                    
                    if(triangle.type === 'J'){
                        semicircleCenter = triangle.centroid

                        removeAnEdgeFromInteriorEdges(triangle.interiorEdges, inEdgeV1Id, inEdgeV2Id)
                        
                        break;//while
                    }

                    interiorEdge = (triangle.interiorEdges[0][0]===inEdgeV1Id&&triangle.interiorEdges[0][1]===inEdgeV2Id)?triangle.interiorEdges[1]:triangle.interiorEdges[0];
                    
                }
                // retriangulate
                
                
                verts.push(semicircleCenter)
                spineEndpointsId.push(verts.length-1)
                spineEndpointsTriangleId.push(triangleId)

                edgeBuffer = removeDoublyDefinedEdges(edgeBuffer)

                for(let j=0;j<edgeBuffer.length;j++){
                    prunedTriangles.push({
                        vertIds:[edgeBuffer[j][0],edgeBuffer[j][1],verts.length-1],
                    })
                    addInteriorExteriorPair(verts.length-1, edgeBuffer[j][0],interiorVerts)
                    addInteriorExteriorPair(verts.length-1, edgeBuffer[j][1],interiorVerts)
                    
                }
            }
        }
        
        for(let i=0;i<spineEndpointsId.length;i++){
            
            var nextTriangleIds = [spineEndpointsTriangleId[i]];
            var startVertIds = [spineEndpointsId[i]];
            while(nextTriangleIds.length>0){
                
                const triangleId = nextTriangleIds.shift();
                const startVertId = startVertIds.shift();
                
                if(triangleId!==spineEndpointsTriangleId[i]&&triangleDeleted[triangleId]){
                    continue;
                }
                
                triangleDeleted[triangleId] = true;
                
                const triangle = triangles[triangleId];
                if(triangle==null){
                    continue;
                }
                for(let k=0;k<triangle.interiorEdges.length;k++){
                    const e = triangle.interiorEdges[k];
                    // retriangulate
                    const eCenter = getEdgeCenter(verts[e[0]],verts[e[1]])

                    verts.push(eCenter);

                    // retriangulate

                    prunedTriangles.push({
                        vertIds:[startVertId,verts.length-1,e[0]],
                    })
                    
                    addInteriorExteriorPair(startVertId, e[0],interiorVerts)
                    addInteriorExteriorPair(verts.length-1, e[0],interiorVerts)

                    prunedTriangles.push({
                        vertIds:[startVertId,verts.length-1,e[1]]
                    })
                    addInteriorExteriorPair(startVertId, e[1],interiorVerts)
                    addInteriorExteriorPair(verts.length-1, e[1],interiorVerts)

                    // add adjacent triangle to the queue

                    const nextId = edgeToTriangle[e[0]][e[1]][0]^edgeToTriangle[e[0]][e[1]][1]^triangleId;

                    if(nextId!=null&&(
                        triangles[nextId].type === 'J'||
                        triangles[nextId].type === 'S')&&!triangleDeleted[nextId]){
                        nextTriangleIds.push(nextId);
                        
                        if(triangles[nextId].type === 'S'){
                            startVertIds.push(verts.length-1);
                            removeAnEdgeFromInteriorEdges(triangles[nextId].interiorEdges, e[0], e[1])
                            
                        }else if(triangles[nextId].type === 'J'){
                            verts.push(triangles[nextId].centroid)
                            startVertIds.push(verts.length-1);
                        }
                        
                    }
                }
                if(triangle.type === 'S'){
                    const eEdge = triangle.externalEdges[0];
                    prunedTriangles.push({
                        vertIds:[startVertId,eEdge[0],eEdge[1]]
                    })
                    
                    addInteriorExteriorPair(startVertId, eEdge[0],interiorVerts)
                    addInteriorExteriorPair(startVertId, eEdge[1],interiorVerts)

                }
                
            }
            
        }

        elevateVertices(prunedTriangles,interiorVerts, verts)
        return prunedTriangles;
    }

    function getEdgeCenter(v1,v2){
        const center = vec3.create();
        vec3.add(center,v1,v2);
        vec3.scale(center,center,0.5);
        return center;
    }

    function addInteriorExteriorPair(inId, outId,interiorVerts){
        interiorVerts[inId] = interiorVerts[inId]||{}
        interiorVerts[inId][outId] = 1

    }

    function elevateVertices(triangles, interiorVerts, verts){
        
        for(let inVId in interiorVerts){
            var avgDist = 0;
            var n = 0;
            for(let eVId in interiorVerts[inVId]){
                avgDist+=vec3.distance(verts[eVId],verts[inVId])
                n++;
            }
            avgDist/=n;
            verts[inVId][2] = -0.5*avgDist;
        }
        
    }

    function createNormals(viewDir, triangles, verts){
        const normals = [];
        for(let i=0;i<verts.length;i++){
            if(normals[i]!=null)continue;
            normals[i] = vec3.fromValues(0,0,0);
        }

        for(let i=0;i<triangles.length;i++){
            const normal = vec3.fromValues(0,0,0);
            const vertIds = triangles[i].vertIds;
            for(let j=0;j<vertIds.length;j++){
                vec3.add(normal, normal, verts[vertIds[j]])
            }
            vec3.normalize(normal, normal)
            // vec3.scale(normal, normal, -1)
            
            for(let j=0;j<vertIds.length;j++){
                vec3.add(normals[vertIds[j]],normals[vertIds[j]],normal);
            }
        }

        for(let i=0;i<verts.length;i++){
            vec3.normalize(normals[i],normals[i]);
        }
        
        return normals;
    }

    function drawBackface(triangles, verts, normals){
        //copy each vertex and triangle
        
        const vertsNum = verts.length;
        const triangleNum = triangles.length;
        for(let i=0;i<vertsNum;i++){
            verts[vertsNum+i] = vec3.create();
            vec3.copy(verts[vertsNum+i],verts[i])
            verts[vertsNum+i][2] = -verts[vertsNum+i][2]
            normals[vertsNum+i] = vec3.create()
            
            vec3.copy(normals[vertsNum+i],normals[i])
            normals[vertsNum+i][2] = -normals[vertsNum+i][2]
        }

        for(let i=0;i<triangleNum;i++){
            const triiVerts = triangles[i].vertIds;
            triangles[triangleNum+i] = {
                vertIds:[triiVerts[0]+vertsNum,triiVerts[1]+vertsNum,triiVerts[2]+vertsNum]
            }
        }
    }

    return {
        Equalize,
        Delaunay,
        pruneTrianglesAndElevateVertices,
        createNormals,
        drawBackface,
    }
})()