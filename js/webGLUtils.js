const webGLUtils = (function(){
    var gl = null;

    const programs = {};

    function createShader(text, type) {
        var shaderSource = text;
        var shaderType = null;
        if (type == "x-shader/x-vertex") {
            shaderType = gl.VERTEX_SHADER;
        } else if (type == "x-shader/x-fragment") {
            shaderType = gl.FRAGMENT_SHADER;
        } else {
            throw new Error("Invalid shader type: " + type)
        }
        var shader = gl.createShader(shaderType);
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            var infoLog = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error("An error occurred compiling the shader: " + infoLog);
        } else {
            return shader;
        }
    }

    function setUniform(program, uniformName, value){
        const type = program[uniformName+'$type']
        const location = program[uniformName];
        if(program[uniformName]!=null){
            if(type.indexOf('Matrix')>-1){
                gl['uniform'+type](location,false, value)
            }else{
                gl['uniform'+type](location, value)
            }
            
        }
    }

    function createShape(vertices, indices, textures) {
        var shape = {};

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        shape.vertexBuffer = vertexBuffer;
        shape.indexBuffer = indexBuffer;
        shape.textures = textures;
        shape.size = indices.length;

        return shape;
    };

    function drawWireframe(vertices, indices, program, positionAttrId){
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        for(let start = 0; start<=indices.length-3;start+=3){
            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices.slice(start, start+3)),gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.enableVertexAttribArray(program[positionAttrId]);
            gl.vertexAttribPointer(program[positionAttrId], 3, gl.FLOAT, false, 4*6, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.drawElements(gl.LINE_LOOP, 3, gl.UNSIGNED_SHORT, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }
        
    }

    function drawTriangles(program, shape, positionAttrId, textureAttrId, normalAttrId){
        const stride = 4*(3+(textureAttrId!=null?2:0)+(normalAttrId!=null?3:0));
        // vertex (position / texCoord)
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
        gl.enableVertexAttribArray(program[positionAttrId]);
        gl.vertexAttribPointer(program[positionAttrId], 3, gl.FLOAT, false, stride, 0);

        if(textureAttrId!=null){
            const offset = 4*3;
            gl.enableVertexAttribArray(program[textureAttrId]);
            gl.vertexAttribPointer(program[textureAttrId], 2, gl.FLOAT, false, stride, offset);
        }
        
        if(normalAttrId!=null){
            const offset = 4*(3+(textureAttrId!=null?2:0));
            gl.enableVertexAttribArray(program[normalAttrId]);
            gl.vertexAttribPointer(program[normalAttrId], 3, gl.FLOAT, false, stride, offset);
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // draw triangle
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
        gl.drawElements(gl.TRIANGLES, shape.size, gl.UNSIGNED_SHORT, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    return {
        initializeWegGL: function(canvasName){
            // initialize gl
            var canvas = document.getElementById(canvasName);
            // Getting WebGL context the right way
            const option = {premultipliedAlpha: false,}
            try {
                gl = canvas.getContext("experimental-webgl", option);
                if (!gl) {
                    gl = canvas.getContext("webgl", option);
                }
            } catch (error) {
                // NO-OP
            }
            if (!gl) {
                alert("Could not get WebGL context!");
                throw new Error("Could not get WebGL context!");
            }
            
        },

        createGlslProgram: function(programId, vertexShaderText, fragmentShaderText, variables) {
            /*
            variables = {uniforms:[{name:'123', type:'Matrix4fv'}], attributes:[]}
            */
            var program = gl.createProgram();
            gl.attachShader(program, createShader(vertexShaderText,'x-shader/x-vertex'));
            gl.attachShader(program, createShader(fragmentShaderText,'x-shader/x-fragment'));
            gl.linkProgram(program);
            gl.validateProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                var infoLog = gl.getProgramInfoLog(program);
                gl.deleteProgram(program);
                throw new Error("An error occurred linking the program: " + infoLog);
            } else {
                if(programs[programId]!=undefined){
                    throw new Error("Program named" + programId+" already exists");
                }
                programs[programId] = program;
            }

            // get variable locations
            const {uniforms, attributes} = variables;
            for(let i=0;i<uniforms.length;i++){
                const name = uniforms[i].name;
                program[name] = gl.getUniformLocation(program, name);
                if(program[name]<0){
                    throw new Error("Uniform variable "+name+' is not declared or used in shader program!')
                }
                program[name+'$type'] = uniforms[i].type;
            }
            for(let i=0;i<attributes.length;i++){
                const name = attributes[i].name;
                program[name] = gl.getAttribLocation(program, name);
                if(program[name]<0){
                    throw new Error("Attribute variable "+name+' is not declared or used in shader program!')
                }
                
            }
            return programId;
        },

        createTexture: function(image){
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            
            // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            // gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); // have WebGL pre-multiply the alpha
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // non pre-multiplied alpha
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);  
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            // gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);
            return texture;
        },

        drawShape: function(vertices, indices, textureUnits, programId, uniforms, {
            positionAttributeId,
            textureAttributeId,
            normalAttributeId,
        }, wireframe){
            /*
            uniforms = {'name':'value',...}
            */
            if(vertices==null ||indices==null){
                return;
            }
            
            const shape = createShape(vertices, indices, textureUnits);
            const program =programs[programId];
            
            gl.useProgram(program)

            // for(let id in shape.textures){
            //     gl.activeTexture(gl.TEXTURE0+parseInt(id));
            //     gl.bindTexture(gl.TEXTURE_2D, shape.textures[id]);
            // }
            for(let uniformName in uniforms){
                const value = uniforms[uniformName];
                setUniform(program, uniformName, value)
            }

            if(!wireframe){
                drawTriangles(program, shape, positionAttributeId, textureAttributeId, normalAttributeId);
            }else{
                drawWireframe(vertices, indices, program, positionAttributeId);
            }
            
            gl.useProgram(null)
        },

        drawLine:function(vertices,programId,uniforms,
        {
            positionAttributeId,
        }){
            if(vertices==null||vertices.length<3){
                return;
            }
            
            const indices = new Array(Math.floor(vertices.length/3)-1);
            for(let i=0;i<indices.length;i++){
                indices[i] = i+1;
            }

            const shape = createShape(vertices, indices, null);
            const stride = 4*3;
            const program = programs[programId];

            gl.useProgram(program);

            gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
            gl.enableVertexAttribArray(program[positionAttributeId]);
            gl.vertexAttribPointer(program[positionAttributeId], 3, gl.FLOAT, false, stride, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
            gl.drawElements(gl.LINE_STRIP, shape.size, gl.UNSIGNED_SHORT, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            
            gl.useProgram(null)
        },

        drawDots:function(dotPositions,dotScales,programId,uniforms,
        {
            positionAttributeId,
        }){
            if(dotPositions==null||dotPositions.length===0){
                return;
            }
            const r = 0.005
            const r1 = r*dotScales[0], r2 = r*dotScales[1]
            const vertsOnDot = [[r1,-r2],[r1,r2],[-r1,r2],[-r1,-r2]]
            //tl, tr, br, bl

            var vertices = []
            var indices = []
            
            for(let i=0;i<dotPositions.length;i++){
                const pt = dotPositions[i]

                const floor = Math.floor(vertices.length/3)

                vertices = vertices.concat([
                    
                    pt[0]+vertsOnDot[0][0],pt[1]+vertsOnDot[0][1],pt[2],
                    pt[0]+vertsOnDot[1][0],pt[1]+vertsOnDot[1][1],pt[2],
                    pt[0]+vertsOnDot[2][0],pt[1]+vertsOnDot[2][1],pt[2],
                    pt[0]+vertsOnDot[3][0],pt[1]+vertsOnDot[3][1],pt[2],
                    
                ])
                
                indices.push(floor+0)
                indices.push(floor+1)
                indices.push(floor+2)
                indices.push(floor+0)
                indices.push(floor+2)
                indices.push(floor+3)
            }

            const shape = createShape(vertices, indices, null);
            
            const program = programs[programId];

            gl.useProgram(program);

            drawTriangles(program, shape, positionAttributeId, null, null);

            gl.useProgram(null)
        },

        clearScreen:function(color){
            if(color == undefined) {
                color = [1.0, 1.0, 1.0, 1.0];
            }
            gl.clearColor(...color);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
        },
    }
})()