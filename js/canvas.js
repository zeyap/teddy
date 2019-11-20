const canvas = (()=>{
    var clientRect = webglCanvas.getBoundingClientRect();
    var mouseDown = false;
    var mode = 'create'//extrude, cut
    var path = [];
    
    function onMouseDown(e){
        scene.resetCamera();
        mouseDown = true;
        path = [];
    }

    function onMouseMove(e){
        if(!mouseDown){
            return;
        }
        
        const [x,y] = scene.getNDCxy(e.clientX,e.clientY,clientRect);
        const l0 = scene.NDCToWorld(vec4.fromValues(x,y,1,1))
        const l1 = scene.NDCToWorld(vec4.fromValues(x,y,-1,1))
        const rayDir = vec3.create();
        vec3.subtract(rayDir,l1,l0);
        vec3.normalize(rayDir,rayDir)

        if(mode === 'create'){
            const planeNormal = vec3.fromValues(0,0,1);
            const planePoint = vec3.fromValues(0,0,0);//near
            const p0Minusl0 = vec3.create();
            vec3.subtract(p0Minusl0,planePoint,l0)
            const t = vec3.dot(p0Minusl0,planeNormal)/vec3.dot(rayDir,planeNormal)
            const intersectp = vec3.create()
            vec3.scaleAndAdd(intersectp,l0,rayDir,t)
            
            path.push(intersectp)
        }

        const equalizedPath = [];
        algorithm.Equalize(equalizedPath,path,0.04)
        scene.buildObject(equalizedPath);

    }

    function onMouseUp(e){
        mouseDown = false;
        // const equalizedPath = [];
        // algorithm.Equalize(equalizedPath,path,0.05)
        // scene.buildObject(equalizedPath);
    }

    function setMode(){
        
    }

    function onScroll(event){
        const rotateRadY = event.deltaX
        const rotateRadX = event.deltaY
        scene.rotateCamera(rotateRadX/1000,rotateRadY/1000)
        
        event.preventDefault();
    }

    function onResize(){
        clientRect = webglCanvas.getBoundingClientRect();
        scene.setRatio(clientRect.width/clientRect.height);
    }

    function initializeMouseEvents(){
        var webglCanvas = document.getElementById("webglCanvas");
        webglCanvas.addEventListener('mousedown', onMouseDown)
        webglCanvas.addEventListener('mousemove', onMouseMove)
        webglCanvas.addEventListener('mouseup', onMouseUp)
        webglCanvas.addEventListener('mouseleave', onMouseUp)
        webglCanvas.onwheel = onScroll
        window.onresize = onResize
    }

    return {
        initializeMouseEvents,
        path,
    };
})()