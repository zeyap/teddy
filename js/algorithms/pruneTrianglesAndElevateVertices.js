const _pruneTrianglesAndElevateVertices = ()=>{

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
                        spineEdges:[[verts.length-1, edgeBuffer[j][0]],[verts.length-1, edgeBuffer[j][1]]]
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
                        spineEdges:[[startVertId, e[0]],[verts.length-1, e[0]]]
                    })
                    
                    addInteriorExteriorPair(startVertId, e[0],interiorVerts)
                    addInteriorExteriorPair(verts.length-1, e[0],interiorVerts)

                    prunedTriangles.push({
                        vertIds:[startVertId,verts.length-1,e[1]],
                        spineEdges:[[startVertId, e[1]],[verts.length-1, e[1]]]
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
                        vertIds:[startVertId,eEdge[0],eEdge[1]],
                        spineEdges:[[startVertId, eEdge[0]],[startVertId, eEdge[1]]]
                    })
                    
                    addInteriorExteriorPair(startVertId, eEdge[0],interiorVerts)
                    addInteriorExteriorPair(startVertId, eEdge[1],interiorVerts)

                }
                
            }
            
        }

        const divTriangles = elevateVertices(prunedTriangles,interiorVerts, verts)
        return divTriangles;
    }

    function getEdgeCenter(v1,v2){
        const center = vec3.create();
        vec3.add(center,v1,v2);
        vec3.scale(center,center,0.5);
        return center;
    }

    function addInteriorExteriorPair(inId, outId,interiorVerts){
        interiorVerts[inId] = interiorVerts[inId]||{}
        interiorVerts[inId][outId] = []

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

        // turn each spine edge into quarter oval
        const divTriangles = []
        const triangleNum = triangles.length
        for(let i=0;i<triangleNum;i++){
            const triangle = triangles[i];
            //sew two spines
            const p = [];
            for(let j=0;j<2;j++){
                
                const e = triangle.spineEdges[j];
                p[j] = [];
                p[j][0] = e[0];
                p[j][4] = e[1];
                if(interiorVerts[e[0]][e[1]].length>0){
                    p[j][1] = interiorVerts[e[0]][e[1]][0]
                    p[j][2] = interiorVerts[e[0]][e[1]][1]
                    p[j][3] = interiorVerts[e[0]][e[1]][2]
                }else{
                    
                    const b = verts[p[j][0]][2]
                    const p2 = getEdgeCenter(verts[p[j][0]],verts[p[j][4]]);
                    p2[2] = b*Math.sqrt(3)/2;
                    verts.push(p2)
                    p[j][2] = verts.length-1
                    const p1 = getEdgeCenter(verts[p[j][0]],verts[p[j][2]]);
                    p1[2] = b*Math.sqrt(15)/4;
                    verts.push(p1)
                    p[j][1] = verts.length-1
                    const p3 = getEdgeCenter(verts[p[j][2]],verts[p[j][4]])
                    p3[2] = b*Math.sqrt(7)/4;
                    verts.push(p3)
                    p[j][3] = verts.length-1

                    interiorVerts[e[0]][e[1]][0] = p[j][1]
                    interiorVerts[e[0]][e[1]][1] = p[j][2]
                    interiorVerts[e[0]][e[1]][2] = p[j][3]
                }
                
            }
            
            for(let j=0;j<4;j++){
                divTriangles.push({
                    vertIds:[p[0][j],p[1][j],p[1][j+1]]
                })
                divTriangles.push({
                    vertIds:[p[0][j],p[1][j+1],p[0][j+1]]
                })
            }
            
            
        }
        // console.log(verts.length)
        return divTriangles;
        
    }
    
    return pruneTrianglesAndElevateVertices
}