const algorithm = (()=>{

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
        selfIntersect: _selfIntersect(),
        Equalize: _Equalize(),
        Delaunay: _Delaunay(),
        pruneTrianglesAndElevateVertices: _pruneTrianglesAndElevateVertices(),
        createNormals,
        drawBackface,
    }
})()