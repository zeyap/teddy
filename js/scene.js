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

    var eye;
    var ratio;
    clientRect = webglCanvas.getBoundingClientRect();
    setRatio(clientRect.width/clientRect.height);

    function setRatio(r){
        ratio = r;
    }

    function initCamera(){
        const near = 0.1, far = 1000.0;
        const fov = 80; 
        eye = vec3.fromValues(0,0,1.5);
        var up = vec3.fromValues(0.0,1.0,0.0);
        var focal = vec3.fromValues(0,0,0);// look at -z

        view.projMat = mat4.create();
        mat4.perspective(view.projMat, Math.PI/180*fov, ratio, near, far);
        view.modelMat = mat4.create();
        mat4.identity(view.modelMat);
        view.viewMat = mat4.create();
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
        console.log(equalizedPath)
        const triangles = algorithm.Delaunay(equalizedPath);
        object.vertices = triangles.vertices;
        object.indices = triangles.indices;
        // object.vertices = [1,-0.5,-0.5, 0,0,1,
        //                 1,0.5,0, 0,0,1,
        //                 -1,0,0, 0,0,1];
        // object.indices = [0,1,2];
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

        getNDCxy,
        NDCToWorld,

        view,

        object,
    };
})()