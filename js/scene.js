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

    function rotateCamera(rad){
        if(object.vertices.length===0 || object.indices.length===0){
            return;
        }
        vec3.rotateY(eye, eye, focal, rad/Math.PI*180)
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

        const outputVertices = equalizedPath.reduce((accum, vec3vert)=> accum.concat([vec3vert[0],vec3vert[1],vec3vert[2]]),[]);

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