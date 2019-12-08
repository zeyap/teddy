const _selfIntersect = ()=>{
    // compare segments
    function equals(seg1, seg2){
        return seg1[0].x==seg2[0].x&&seg1[0].y==seg2[0].y&&seg1[1].x==seg2[1].x&&seg1[1].y==seg2[1].y;
    }

    function larger(seg1, seg2){
        if(seg1[0].x==seg2[0].x&&seg1[0].y==seg2[0].y){
            return seg1[1].x>seg2[1].x||(seg1[1].x==seg2[1].x&&seg1[1].y>seg2[1].y);
        }else{
            return seg1[0].x>seg2[0].x||(seg1[0].x==seg2[0].x&&seg1[0].y>seg2[0].y);
        }
    }

    function insertSegmentToSL(segmentId, SL, segments){

        if(SL.length===0){
            SL.push(segmentId);
            return 0;
        }else if(SL.length<2){
            if(larger(segments[segmentId],segments[SL[0]])){
                SL.push(segmentId)
                return 1;
            }else{
                SL.unshift(segmentId)
                return 0;
            }
        }

        let l=0, r=SL.length-1;
        let mid = Math.floor((l+r)/2);
        while(l<r){
            let midSegId = SL[mid]
            if(larger(segments[segmentId],segments[midSegId])){
                l = mid+1
            }else{
                r = mid
            }
            mid = Math.floor((l+r)/2)
        }

        if(larger(segments[segmentId],segments[SL[mid]])){
            SL.splice(mid+1,0,segmentId);
            return mid+1
        }else{
            SL.splice(mid,0,segmentId);
            return mid
        }
    }

    function deleteSegmentFromSL(segmentId, SL, segments){

        let l=0, r=SL.length-1;
        let mid = Math.floor((l+r)/2);
        while(l<r){
            let midSegId = SL[mid]
            if(larger(segments[segmentId],segments[midSegId])){
                l = mid+1
            }else{
                r = mid
            }
            mid = Math.floor((l+r)/2)
        }
        if(SL[mid]!=null && equals(segments[segmentId],segments[SL[mid]])){
            SL.splice(mid,1)
            return mid;
        }
        return null;

    }

    function segmentsIntersect(segBId, segAId, segments){

        const segA = segments[segAId]
        const segB = segments[segBId]

        function onSegment(a, b, c){
            
            const AB = vec2.create()
            vec2.subtract(AB, b, a)
            const CB = vec2.create()
            vec2.subtract(CB, b, c)
            const AC = vec2.create()
            vec2.subtract(AC, c, a)

            const res = vec2.length(AC)+vec2.length(CB)=== vec2.length(AB) && vec2.length(AC)>0 && vec2.length(CB)>0
            
            if(res){
                console.log('intersected on segment')
            }
            return res// Whether C lies on AB
        }

        const a = vec2.fromValues(segB[0].x,segB[0].y)
        const b = vec2.fromValues(segB[1].x,segB[1].y)

        const c = vec2.fromValues(segA[0].x,segA[0].y)
        const d = vec2.fromValues(segA[1].x,segA[1].y)

        const AB = vec2.create()
        vec2.subtract(AB, b, a)
        const BC = vec2.create()
        vec2.subtract(BC, c, b)
        const BD = vec2.create()
        vec2.subtract(BD, d, b)
        const CD = vec2.create()
        vec2.subtract(CD, d, c)
        const DA = vec2.create()
        vec2.subtract(DA, a, d)
        const DB = vec2.create()
        vec2.subtract(DB, b, d)

        // Proper intersection
        const crossprod = [vec3.create(),vec3.create(),vec3.create(),vec3.create()];
        vec2.cross(crossprod[0],AB,BC)
        vec2.cross(crossprod[1],AB,BD)
        vec2.cross(crossprod[2],CD,DA)
        vec2.cross(crossprod[3],CD,DB)
        if (vec3.dot(crossprod[0],crossprod[1])<0
        && vec3.dot(crossprod[2],crossprod[3])<0){
            return true
        }

        // Improper intersection
        if (onSegment(a, b, c) ||
        onSegment(a, b, d)  ||
        onSegment(c, d, a)  ||
        onSegment(c, d, b)){
            return true
        }
            
        // No intersection
        return false
    }


    function selfIntersect(stroke){
        const endpoints = [];
        const segments = [];
        for(let i=0;i<(stroke.length-4)/3;i++){
            const p1 = {
                x:stroke[3*i],
                y:stroke[3*i+1],
                segmentId:i
            }
            const p2 = {
                x:stroke[3*(i+1)],
                y:stroke[3*(i+1)+1],
                segmentId:i
            }
            if(p1.x<p2.x||(p1.x==p2.x&&p1.y<p2.y)){
                p1.left = true
                p2.left = false
            }else{
                p1.left = false
                p2.left = true
            }

            let left, right;
            if(p1.left){
                endpoints.push(p1)
                endpoints.push(p2)
                left = {
                    x:p1.x,
                    y:p1.y,
                    segmentId:p1.segmentId,
                    left:p1.left
                }
                right = {
                    x:p2.x,
                    y:p2.y,
                    segmentId:p2.segmentId,
                    left:p2.left
                }
            }else{
                endpoints.push(p2)
                endpoints.push(p1)
                right = {
                    x:p1.x,
                    y:p1.y,
                    segmentId:p1.segmentId,
                    left:p1.left
                }
                left = {
                    x:p2.x,
                    y:p2.y,
                    segmentId:p2.segmentId,
                    left:p2.left
                }
            }
            

            segments.push([left,right])
        }

        endpoints.sort((p1,p2)=>{
            if(p1.x<p2.x){
                return -1;
            }else if(p1.x==p2.x){
                if(p1.y<p2.y){
                    return -1;
                }else if(p1.y==p2.y){
                    return 0;
                }else{
                    return 1;
                }
            }else{
                return 1;
            }
        })

        // console.log("segments",segments)
        // console.log("endpoints",endpoints)

        const SL = [];//sweepline
        while(endpoints.length>1){
            const e = endpoints.shift();
            const segE = e.segmentId;
            
            if(e.left===true){
                const pos = insertSegmentToSL(segE, SL, segments)
                // console.log('insert', pos, SL)
                
                const segA = SL[pos+1];
                const segB = SL[pos-1];
                
                if(segA!=null && segmentsIntersect(segA,segE,segments)){
                    return true;
                }
                
                if(segB!=null && segmentsIntersect(segB,segE,segments)){
                    return true;
                }
            }else{
                const pos = deleteSegmentFromSL(segE, SL, segments)
                // console.log('delete', pos)
                const segA = SL[pos];
                const segB = SL[pos-1];
                if(segA!=null && segB!=null && segmentsIntersect(segA,segB,segments)){
                    return true;
                }
            }
        }
        // console.log("SL",SL)
        return false
    }

    return selfIntersect
}