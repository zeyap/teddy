const canvas = (()=>{
    var clientRect = webglCanvas.getBoundingClientRect();
    var mouseDown = false;
    var mode = 'create'//paint, extrude, cut
    var color = vec4.fromValues(0.3,0.8,1.0,1.0);
    var path = [];
    
    function onClear(){
        scene.clearObject();
        scene.resetCamera();
        mouseDown = false;
        path = [];
        setMode('create');
    }

    function getColor(){
        return color;
    }

    function onColorChange(evt){
        const hex = evt.target.value;
        const r = parseInt(hex[1]+hex[2],16)/255,
        g = parseInt(hex[3]+hex[4],16)/255,
        b = parseInt(hex[5]+hex[6],16)/255;
        color = vec4.fromValues(r,g,b,1.0);
    }
    
    function onMouseDown(){
        mouseDown = true;
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

        // const equalizedPath = [];
        // algorithm.Equalize(equalizedPath,path,0.04)
        // scene.buildObject(equalizedPath);

    }

    function onMouseUp(e){
        mouseDown = false;
        const equalizedPath = [];
        algorithm.Equalize(equalizedPath,path,0.05)
        scene.buildObject(equalizedPath);
        setMode('paint');
    }

    function setMode(newMode){
        mode = newMode
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
        webglCanvas.onwheel = onScroll
        
        var clearButton = document.getElementById("clearButton");
        clearButton.addEventListener('click',onClear)

        var colorPicker = document.getElementById("colorPicker");
        colorPicker.addEventListener('change',onColorChange)

        window.onresize = onResize
    }

    return {
        initializeMouseEvents,
        path,
        getColor,
    };
})()