const canvas = (()=>{
    var clientRect = webglCanvas.getBoundingClientRect();
    var mouseDown = false;
    var mode = 'create'//paint, extrude, cut
    var color = vec4.fromValues(0.3,0.8,1.0,1.0);
    var stroke = [];
    
    function onClear(){
        scene.clearObject();
        scene.resetCamera();
        mouseDown = false;
        stroke = [];
        setMode('create');
    }

    function getStroke(){
        return stroke;
    }

    function getColor(){
        return color;
    }

    function getMode(){
        return mode;
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

        stroke = stroke.concat([x,y,0])

    }

    function onMouseUp(e){
        mouseDown = false;

        if(mode==='create'){
            // detect intersection
            if(algorithm.selfIntersect(stroke)){
                console.log('self intersects')
                stroke = [];
                return;
            }

            var path = []; // stroke projected onto image plane
            for(let i=0;i<stroke.length;i+=3){
                const x = stroke[3*i],y = stroke[3*i+1];
                
                const ray = scene.getRay(x,y)

                const planeNormal = vec3.fromValues(0,0,1);
                const planePoint = vec3.fromValues(0,0,0);//near
                const intersectp = scene.rayPlaneIntersect(ray, planeNormal, planePoint).p
                path.push(intersectp)
            }

            const equalizedPath = [];
            algorithm.Equalize(equalizedPath,path,0.1)
            
            scene.buildObject(equalizedPath);
            setMode('paint');
        } else if(mode==='paint'){
            const path = [];
            for(let i=0;i<stroke.length;i+=3){
                const x = stroke[3*i],y = stroke[3*i+1];
                path.push(vec3.fromValues(x,y,0))
            }
            
            const equalizedPath = [];
            algorithm.Equalize(equalizedPath,path,0.1)

            scene.cut(path)
        }
        stroke = []
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
        getStroke,
        getColor,
        getMode,
    };
})()