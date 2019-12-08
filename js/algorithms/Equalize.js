const _Equalize = ()=>{
    function Equalize(outputVerts,mousePath,step){
        if(mousePath.length<=1){
            
            return;
        }
        var segmentLen = 0;
        if(outputVerts==null){
            outputVerts = [];
        }
        outputVerts.push(mousePath[0])
        var lastAddedPoint = mousePath[0];
        
        for(let i=1;i<=mousePath.length;i++){
            
            const newVec = vec3.create();
            vec3.subtract(newVec, mousePath[i%mousePath.length], mousePath[i-1]);
            const newVecNorm = vec3.create();
            vec3.normalize(newVecNorm,newVec)
            const newVecLen = vec3.length(newVec);

            if(segmentLen+newVecLen<step){
                segmentLen+=newVecLen;
                continue;
            }
            //else
            var d = step - segmentLen;
            
            while(d<=newVecLen){
                const newPoint = vec3.create()
                vec3.scaleAndAdd(newPoint, mousePath[i-1], newVecNorm,d)
                outputVerts.push(newPoint)
                
                lastAddedPoint = newPoint
                segmentLen = newVecLen - d;
                d+=step;
            }
        }

    }
    
    return Equalize
}