const canvas = (()=>{
    var clientRect = webglCanvas.getBoundingClientRect();
    var mouseDown = false;
    var mode = 'create'//paint, extrude, cut
    var color = vec4.fromValues(1.0,0.6,0.1,1.0);
    var stroke = [];// trajectory in NDC
    var showWireframe = false
    var originalObjectPath = [];
    
    function onClear(){
        scene.clearObject();
        scene.resetCamera();
        originalObjectPath = [];
        mouseDown = false;
        setMode('create');
    }

    function onUndo(){
        if(mode==='create'){
            return;
        }
        
        scene.buildObject(originalObjectPath)
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

                const imgPlane = scene.getImagePlane();
                const planeNormal = imgPlane.n;
                const planePoint = imgPlane.p;//near
                const intersectp = scene.rayPlaneIntersect(ray, planeNormal, planePoint).p
                path.push(intersectp)
            }

            const equalizedPath = [];
            algorithm.Equalize(equalizedPath,path,0.05, true)
            for(let i=0;i<equalizedPath.length;i++){
                originalObjectPath.push(equalizedPath[i])
            }
            
            scene.buildObject(equalizedPath);
            setMode('paint');
        } else if(mode==='paint'){
            const path = [];
            for(let i=0;i<stroke.length;i+=3){
                const x = stroke[3*i],y = stroke[3*i+1];
                path.push(vec3.fromValues(x,y,0))
            }
            
            const equalizedPath = [];
            algorithm.Equalize(equalizedPath,path,0.05, false)

            scene.cut(equalizedPath)
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

    function getReferenceDotPositions(){
        const dotPositions = []
        const pixstep=50
        
        const stepx = 2/(clientRect.height/pixstep)
        const stepy = 2/(clientRect.width/pixstep)

        const z = 0.9
        
        for(let c=-stepx/2;c>-1;c-=stepx){
            for(let r=stepy/2;r<1;r+=stepy){
                dotPositions.push([r,c,z])
            }
            for(let r=-stepy/2;r>-1;r-=stepy){
                dotPositions.push([r,c,z])
            }
        }

        for(let c=stepx/2;c<1;c+=stepx){
            for(let r=stepy/2;r<1;r+=stepy){
                dotPositions.push([r,c,z])
            }
            for(let r=-stepy/2;r>-1;r-=stepy){
                dotPositions.push([r,c,z])
            }
        }
        
        return dotPositions
        
    }

    function getReferenceDotScales(){
        const scalex = 300/clientRect.width
        const scaley = 300/clientRect.height
        return [scalex,scaley]
    }

    function onSwitchWireframe(){
        showWireframe = !showWireframe;
        const elem = document.getElementById('wireframeButtonIcon')
        if(showWireframe){
            elem.src = "images/border-all-solid.svg"
        }else{
            elem.src = "images/th-large-solid.svg"
        }
    }
    function getIfShowWireframe(){
        return showWireframe
    }

    function initializeMouseEvents(){
        var webglCanvas = document.getElementById("webglCanvas");
        webglCanvas.addEventListener('mousedown', onMouseDown)
        webglCanvas.addEventListener('mousemove', onMouseMove)
        webglCanvas.addEventListener('mouseup', onMouseUp)
        webglCanvas.onwheel = onScroll
        
        var clearButton = document.getElementById("clearButton");
        clearButton.addEventListener('click',onClear)

        var undoButton = document.getElementById("undoButton");
        undoButton.addEventListener('click',onUndo)

        var colorPicker = document.getElementById("colorPicker");
        colorPicker.addEventListener('change',onColorChange)

        var wireframeButton = document.getElementById("wireframeButton");
        wireframeButton.addEventListener('click',onSwitchWireframe);

        window.onresize = onResize
    }

    return {
        initializeMouseEvents,
        getStroke,
        getColor,
        getMode,
        getIfShowWireframe,
        getReferenceDotPositions,
        getReferenceDotScales,
    };
})()