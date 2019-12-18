const scene = (()=>{
    var view={
        projMat:null,
        viewMat:null,
        modelMat:null,
        lightPos:null,
    };
    var object = {
        vertices:[],indices:[],
    };
    var normalsList;
    var trianglesList;
    var verticesList;

    var eye = vec3.fromValues(0,0,1.0);
    const up = vec3.fromValues(0.0,1.0,0.0);
    var ratio;
    const  focal = vec3.fromValues(0,0,0);// look at -z
    clientRect = webglCanvas.getBoundingClientRect();
    setRatio(clientRect.width/clientRect.height);

    function getImagePlane(){
        const n = vec3.create();
        vec3.subtract(n,eye,focal);
        const p = focal;
        return {
            n,
            p,
        }
    }

    function setRatio(r){
        ratio = r;
    }

    function initCamera(){
        const near = 0.1, far = 1000.0;
        const fov = 80; 

        view.projMat = mat4.create();
        mat4.perspective(view.projMat, Math.PI/180*fov, ratio, near, far);
        view.modelMat = mat4.create();
        mat4.identity(view.modelMat);
        view.viewMat = mat4.create();
        mat4.lookAt(view.viewMat, eye, focal, up);
        
    }

    function resetCamera(){
        eye = vec3.fromValues(0,0,1.0);
    }

    function rotateCamera(radX, radY){
        if(object.vertices.length===0 || object.indices.length===0){
            return;
        }
        
        const viewDir = vec3.create()
        vec3.subtract(viewDir,focal,eye)

        const rotateCamX = mat4.create();
        const axisRotX = vec3.create();
        vec3.cross(axisRotX,viewDir,up);
        vec3.cross(up,axisRotX,viewDir)
        mat4.fromRotation(rotateCamX,radX,axisRotX);

        const rotateCamY = mat4.create();
        const axisRotY = vec3.create()
        vec3.copy(axisRotY, up);
        mat4.fromRotation(rotateCamY,radY,axisRotY);

        vec3.transformMat4(eye,eye,rotateCamX)
        vec3.transformMat4(eye,eye,rotateCamY)

        mat4.lookAt(view.viewMat, eye, focal, up);
        
    }

    function initLights(){
        if(eye!=null){
            view.lightPos = eye;
        }else{
            view.lightPos = vec3.fromValues(0,0,1);
        }
    }

    function clearObject(){
        object.vertices = [];
        object.indices = [];
    }

    function rebuildObjectFromPrimitiveList(){
        var outputVertices = [];
        for(let i=0;i<verticesList.length;i++){
            outputVertices = outputVertices.concat([verticesList[i][0],verticesList[i][1],verticesList[i][2],
            normalsList[i][0],normalsList[i][1],normalsList[i][2]])
        }

        const outputIndices = trianglesList.reduce((accum,tri)=>accum.concat([...tri.vertIds]),[]);

        object.vertices = outputVertices;
        object.indices = outputIndices;
    }

    function buildObject(eqPath){
        const currViewPoint = eye;
        resetCamera()

        const equalizedPath = []
        for(let i=0;i<eqPath.length;i++){
            equalizedPath.push(eqPath[i])
        }

        const triangles = algorithm.Delaunay([...equalizedPath]);
        
        const prunedTriangles = algorithm.pruneTrianglesAndElevateVertices(triangles, equalizedPath)
        
        const viewDir = vec3.create()
        vec3.subtract(viewDir,focal,eye)
        const normals = [];

        algorithm.createNormalsAndEnforceCCW(viewDir, prunedTriangles, equalizedPath,normals);
        
        algorithm.drawBackface(prunedTriangles, equalizedPath, normals);

        trianglesList = prunedTriangles;
        verticesList = equalizedPath;
        normalsList = normals;

        rebuildObjectFromPrimitiveList()
        eye = currViewPoint
    }

    function getNDCxy(clientX,clientY,clientRect){
        return [2.0*((clientX - clientRect.left) * 1.0 / clientRect.width) - 1.0,
        -2.0*((clientY - clientRect.top) * 1.0 / clientRect.height) + 1.0];
    }

    
    // output world coordinate position in vec3
    function NDCToWorld(posNDC){
        const posCam = vec4.create();
        const invProjMat = mat4.create();
        mat4.invert(invProjMat,view.projMat)
        vec4.transformMat4(posCam,posNDC,invProjMat)
        const posWorld = vec4.create();
        const invViewMat = mat4.create();
        mat4.invert(invViewMat, view.viewMat);
        vec4.transformMat4(posWorld,posCam,invViewMat)
        return vec3.fromValues(posWorld[0]/posWorld[3],posWorld[1]/posWorld[3], posWorld[2]/posWorld[3])
    }

    function worldToNDC(posWorld3){
        const posWorld = vec4.fromValues(posWorld3[0],posWorld3[1],posWorld3[2],1.0)
        const posNDC = vec4.create()
        vec4.transformMat4(posNDC,posWorld,view.viewMat)
        vec4.transformMat4(posNDC,posNDC,view.projMat)
        return vec3.fromValues(posNDC[0]/posNDC[3],posNDC[1]/posNDC[3], posNDC[2]/posNDC[3])
    }

    function getRay(x,y){
        const l0 = NDCToWorld(vec4.fromValues(x,y,1,1))
        const l1 = NDCToWorld(vec4.fromValues(x,y,-1,1))
        const rayDir = vec3.create();
        vec3.subtract(rayDir,l1,l0);
        vec3.normalize(rayDir,rayDir)
        return {o:l0,dir:rayDir};
    }

    function rayPlaneIntersect(ray, planeNormal, planePoint){
        const p0Minusl0 = vec3.create();
        vec3.subtract(p0Minusl0,planePoint,ray.o)

        if(vec3.dot(ray.dir,planeNormal)===0){
            return null;
        }

        const t = vec3.dot(p0Minusl0,planeNormal)/vec3.dot(ray.dir,planeNormal)
        if(t<=0){
            return null;
        }
        const intersectp = vec3.create()
        vec3.scaleAndAdd(intersectp,ray.o,ray.dir,t)
        return {p:intersectp, t};
    }

    function rayTriangleIntersect(ray, v1, v2, v3, normal){
        
        const intersect = rayPlaneIntersect(ray, normal, v1)
        if(intersect==null){
            return null;
        }

        const v3minusv2 = vec3.create();
        vec3.subtract(v3minusv2,v3,v2)
        const pminusv2 = vec3.create();
        vec3.subtract(pminusv2,intersect.p,v2)
        let prod1 = vec3.create();
        vec3.cross(prod1,v3minusv2,pminusv2)
        prod1 = vec3.dot(prod1,normal)

        const v1minusv3 = vec3.create();
        vec3.subtract(v1minusv3,v1,v3)
        const pminusv3 = vec3.create();
        vec3.subtract(pminusv3,intersect.p,v3)
        let prod2 = vec3.create();
        vec3.cross(prod2,v1minusv3,pminusv3)
        prod2 = vec3.dot(prod2,normal)

        const v2minusv1 = vec3.create();
        vec3.subtract(v2minusv1,v2,v1)
        const pminusv1 = vec3.create();
        vec3.subtract(pminusv1,intersect.p,v1)
        let prod3 = vec3.create();
        vec3.cross(prod3,v2minusv1,pminusv1)
        prod3 = vec3.dot(prod3,normal)

        if(prod1>0 && prod2>0 && prod3>0){
            return intersect
        }else{
            return null;
        }
    }

    function cut(path){
        
        const intersects = [];// only store first 2 intersects, with front surface and back surface
        const trianglesNearestSegment = [];// triangle is deleted if it is in the left side of its nearest segment on polyline
        var numIntersects = 0;
        var isCutLineComplete = false;
        for(let i=0;i<path.length;i++){
            const ray = getRay(path[i][0],path[i][1]);
            const newIntersects = [];
            
            for(let j=0;j<trianglesList.length;j++){
                const v1 = verticesList[trianglesList[j].vertIds[0]]
                const v2 = verticesList[trianglesList[j].vertIds[1]]
                const v3 = verticesList[trianglesList[j].vertIds[2]]
                const normal = algorithm.computeNormal(v1, v2, v3)
                
                const intersect = rayTriangleIntersect(ray, v1, v2, v3, normal);
                
                if(intersect!=null){
                    intersect.triangleId = j
                    if(vec3.dot(ray.dir,normal)<0){ 
                        // front face
                        if(newIntersects[0]==null){
                            newIntersects[0]=intersect;
                            numIntersects++
                        }
                    }else if(vec3.dot(ray.dir,normal)>0){// back face
                        if(newIntersects[1]==null){
                            newIntersects[1]=intersect
                            numIntersects++
                        }
                    }
                }
            }
            
            intersects.push(newIntersects)
            if(i==path.length-1){
                continue;
            }
            
        }
        if(numIntersects==0 || intersects[intersects.length-1].length>0){
            return;
        }
        
        //calculate centroid of triangles 
        //& find nearest segment on polyline
        
        for(let j=0;j<trianglesList.length;j++){
            if(trianglesList[j].centroid==null){
                trianglesList[j].centroid = triangleCentroid(trianglesList[j].vertIds);
            }
        }

        for(let i=0;i<path.length-1;i++){
            // distance to this segment
            const p1 = NDCToWorld(vec4.fromValues(path[i][0],path[i][1],0,1));
            const p2 = NDCToWorld(vec4.fromValues(path[i+1][0],path[i+1][1],0,1));

            for(let j=0;j<trianglesList.length;j++){
            
                const c = trianglesList[j].centroid
                const v1 = verticesList[trianglesList[j].vertIds[0]],
                v2 = verticesList[trianglesList[j].vertIds[1]],
                v3 = verticesList[trianglesList[j].vertIds[2]];
                
                const dists = [
                    algorithm.cut.pointToSegmentDistance(c,p1,p2),
                    algorithm.cut.pointToSegmentDistance(v1,p1,p2),
                    algorithm.cut.pointToSegmentDistance(v2,p1,p2),
                    algorithm.cut.pointToSegmentDistance(v3,p1,p2)];
                            // dist to segment
                const dist = Math.min(dists)

                if(trianglesNearestSegment[j]==null || dist<trianglesNearestSegment[j].dist){
                    trianglesNearestSegment[j]={
                        dist,
                        id:i
                    }
                }

            }
        }
        

        for(let i=0;i<trianglesList.length;i++){
            const id = trianglesNearestSegment[i].id
            if(!algorithm.cut.isTriangleAbovePlane(trianglesList[i],path[id],path[id+1],verticesList,getRay)){
                trianglesList[i] = undefined
            }
        }

        for(let i=0;i<trianglesList.length;i++){
            if(trianglesList[i]==null){
                trianglesList.splice(i,1)
                i--
            }
        }

        //sew together
        var newVertices = [];
        for(let i=0;i<intersects.length-1;i++){
            if(intersects[i][0]&&intersects[i][1]){
                newVertices.push(intersects[i][0].p)
                newVertices.push(intersects[i][1].p)
                
                // trianglesList[intersects[i][0].triangleId]=undefined
                // trianglesList[intersects[i][1].triangleId]=undefined
            }else{
                if(newVertices.length>0){
                    //sew
                    const starti = verticesList.length;
                    verticesList = verticesList.concat(newVertices)
                    const endi = verticesList.length;
                    
                    for(let j=starti;j<endi-3;j+=2){
                        //f1:j b1:j+1 f2:j+2 b2:j+3
                        trianglesList.push({
                            vertIds:[j,j+1,j+2]
                        })
                        trianglesList.push({
                            vertIds:[j+3,j+2,j+1]
                        })
                    }
                    newVertices = [];
                }
            }
        }

        algorithm.createNormalsAndEnforceCCW(null, trianglesList, verticesList, normalsList)

        rebuildObjectFromPrimitiveList()

    }

    function triangleCentroid(vertIds){
        const x1=verticesList[vertIds[0]][0], 
            x2=verticesList[vertIds[1]][0], 
            x3=verticesList[vertIds[2]][0], 
            y1=verticesList[vertIds[0]][1], 
            y2=verticesList[vertIds[1]][1],
            y3=verticesList[vertIds[2]][1],
            z1=verticesList[vertIds[0]][2], 
            z2=verticesList[vertIds[1]][2],
            z3=verticesList[vertIds[2]][2];
        return vec3.fromValues((x1+x2+x3)/3,(y1+y2+y3)/3,(x1+x2+x3)/3)
    }

    

    return {
        initCamera,
        initLights,
        buildObject,
        setRatio,
        rotateCamera,
        resetCamera,
        clearObject,
        cut,

        getNDCxy,
        getRay,
        getImagePlane,
        rayPlaneIntersect,

        view,

        object,
    };
})()