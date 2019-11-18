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
            edgeBuffer = newEdgeBuffer;
            
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
                    radius,
                }
                
                triangles.push(newTriangle);
            }
        }

        //    remove any triangles from the triangle list that use the supertriangle vertices
        for(let i=0;i<triangles.length;i++){
            if(triangles[i].vertIds.indexOf(verts.length-1)>-1
            ||triangles[i].vertIds.indexOf(verts.length-2)>-1
            ||triangles[i].vertIds.indexOf(verts.length-3)>-1){
                triangles.splice(i,1);
                i--;
            }
        }
        
        //    remove the supertriangle vertices from the vertex list
        verts.splice(verts.length-3,3);
        // console.log(verts.length)
        const outputVertices = verts.reduce((accum, vec3vert)=> accum.concat([vec3vert[0],vec3vert[1],vec3vert[2]]),[]);
        const outputIndices = triangles.reduce((accum,tri)=>accum.concat([...tri.vertIds]),[]);
        // console.log(outputVertices.length/6,Math.max(...outputIndices))
        
        return {
            vertices: outputVertices,
            indices: outputIndices,
        };
        // return triangles;
        
    }

    return {
        Equalize,
        Delaunay,
    }
})()