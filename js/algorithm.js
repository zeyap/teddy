const algorithm = (()=>{
    function computeNormal(A, B, C){
        //ccw order
        const normal = vec3.create()
        const BmA = vec3.create()
        vec3.subtract(BmA, B, A)
        const CmA = vec3.create()
        vec3.subtract(CmA, C, A)
        vec3.cross(normal, BmA, CmA)
        vec3.normalize(normal, normal)
        return normal;
    }

    function createNormalsAndEnforceCCW(viewDir, triangles, verts, normals){
        
        for(let i=0;i<verts.length;i++){
            if(normals[i]!=null)continue;
            normals[i] = vec3.fromValues(0,0,0);
        }

        for(let i=0;i<triangles.length;i++){
            const vertIds = triangles[i].vertIds;
            
            const normal = computeNormal(verts[vertIds[0]],verts[vertIds[1]],verts[vertIds[2]])

            if(viewDir!=null){
                if(vec3.dot(viewDir,normal)<0){
                
                    //switch vert 1 and 2
                    const temp = triangles[i].vertIds[0]
                    triangles[i].vertIds[0] = triangles[i].vertIds[1]
                    triangles[i].vertIds[1] = temp

                    vec3.scale(normal, normal, -1)
                }
            }
            
            for(let j=0;j<vertIds.length;j++){
                vec3.add(normals[vertIds[j]],normals[vertIds[j]],normal);
            }
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
                vertIds:[triiVerts[2]+vertsNum,triiVerts[1]+vertsNum,triiVerts[0]+vertsNum]//ccw
            }
        }
       
    }

    return {
        selfIntersect: _selfIntersect(),
        Equalize: _Equalize(),
        Delaunay: _Delaunay(),
        pruneTrianglesAndElevateVertices: _pruneTrianglesAndElevateVertices(),
        createNormalsAndEnforceCCW,
        computeNormal,
        drawBackface,
    }
})()