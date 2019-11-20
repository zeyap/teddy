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

    var eye = vec3.fromValues(0,0,1.0);
    const up = vec3.fromValues(0.0,1.0,0.0);
    var ratio;
    const  focal = vec3.fromValues(0,0,0);// look at -z
    clientRect = webglCanvas.getBoundingClientRect();
    setRatio(clientRect.width/clientRect.height);

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

    function buildObject(equalizedPath){
        const triangles = algorithm.Delaunay([...equalizedPath]);
        
        const prunedTriangles = algorithm.pruneTrianglesAndElevateVertices(triangles, equalizedPath)
        
        const normals = algorithm.createNormals(null, prunedTriangles, equalizedPath);
        
        algorithm.drawBackface(prunedTriangles, equalizedPath, normals);

        var outputVertices = [];
        for(let i=0;i<equalizedPath.length;i++){
            
            outputVertices = outputVertices.concat([equalizedPath[i][0],equalizedPath[i][1],equalizedPath[i][2],
            normals[i][0],normals[i][1],normals[i][2]])
        }

        const outputIndices = prunedTriangles.reduce((accum,tri)=>accum.concat([...tri.vertIds]),[]);

        object.vertices = outputVertices;
        object.indices = outputIndices;
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
        return vec3.fromValues(posWorld[0],posWorld[1], posWorld[2])
    }

    return {
        initCamera,
        initLights,
        buildObject,
        setRatio,
        rotateCamera,
        resetCamera,

        getNDCxy,
        NDCToWorld,

        view,

        object,
    };
})()