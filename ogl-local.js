/* ============================================
   Minimal OGL Implementation for Plasma Effect
   ============================================ */

// Minimal WebGL wrapper that mimics OGL API
window.OGL = {
  Renderer: class Renderer {
    constructor(options = {}) {
      this.canvas = document.createElement('canvas');
      
      const contextAttributes = {
        alpha: options.alpha || false,
        antialias: options.antialias !== false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'default'
      };

      const forceWebgl2 = options.webgl === 2;
      if (forceWebgl2) {
        this.gl = this.canvas.getContext('webgl2', contextAttributes);
        if (!this.gl) {
          throw new Error('WebGL2 not supported');
        }
      } else {
        // Attempt 1: WebGL 2 with specific attributes
        this.gl = this.canvas.getContext('webgl2', contextAttributes);
        
        // Attempt 2: WebGL 1 with specific attributes
        if (!this.gl) {
          this.gl = this.canvas.getContext('webgl', contextAttributes);
        }
        
        // Attempt 3: Experimental WebGL
        if (!this.gl) {
          this.gl = this.canvas.getContext('experimental-webgl', contextAttributes);
        }

        // Attempt 4: Last resort - any context without specific attributes
        if (!this.gl) {
          this.gl = this.canvas.getContext('webgl2') || 
                    this.canvas.getContext('webgl') || 
                    this.canvas.getContext('experimental-webgl');
        }
      }
      
      if (!this.gl) {
        throw new Error('WebGL not supported');
      }
      
      this.dpr = Math.min(window.devicePixelRatio || 1, options.dpr || 2);
    }
    
    setSize(width, height) {
      this.canvas.width = width * this.dpr;
      this.canvas.height = height * this.dpr;
      this.gl.viewport(0, 0, width * this.dpr, height * this.dpr);
    }
    
    render({ scene }) {
      const gl = this.gl;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (scene && scene.draw) {
        scene.draw(gl);
      }
    }
  },
  
  Program: class Program {
    constructor(gl, options = {}) {
      this.gl = gl;
      this.uniforms = options.uniforms || {};
      
      // Compile shaders
      const vertexShader = this.compileShader(gl.VERTEX_SHADER, options.vertex);
      const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, options.fragment);
      
      // Create program
      this.program = gl.createProgram();
      gl.attachShader(this.program, vertexShader);
      gl.attachShader(this.program, fragmentShader);
      gl.linkProgram(this.program);
      
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        throw new Error('Program link failed: ' + gl.getProgramInfoLog(this.program));
      }
      
      gl.useProgram(this.program);
      
      // Set up uniform locations
      this.uniformLocations = {};
      for (const name in this.uniforms) {
        const location = gl.getUniformLocation(this.program, name);
        if (location) {
          this.uniformLocations[name] = location;
        }
      }
    }
    
    compileShader(type, source) {
      const gl = this.gl;
      const shader = gl.createShader(type);
      
      // Handle WebGL1 vs WebGL2 shader versions
      let shaderSource = source;
      const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
      if (!isWebGL2) {
        // Convert WebGL2 shaders to WebGL1
        if (type === gl.VERTEX_SHADER) {
          shaderSource = source.replace('#version 300 es', '#version 100')
                              .replace('in vec2 position;', 'attribute vec2 position;')
                              .replace('in vec2 uv;', 'attribute vec2 uv;')
                              .replace('out vec2 vUv;', 'varying vec2 vUv;');
        } else if (type === gl.FRAGMENT_SHADER) {
          shaderSource = source.replace('#version 300 es', '#version 100')
                              .replace('in vec2 vUv;', 'varying vec2 vUv;')
                              .replace('out vec4 fragColor;', '')
                              .replace(/fragColor\s*=/g, 'gl_FragColor =');
        }
      }
      
      gl.shaderSource(shader, shaderSource);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        console.error('Shader compile error:', error);
        console.error('Shader source:', shaderSource);
        throw new Error('Shader compile failed: ' + error);
      }
      
      return shader;
    }
    
    setUniform(name, value) {
      const gl = this.gl;
      const location = this.uniformLocations[name];
      if (!location) return;
      
      const uniform = this.uniforms[name];
      if (uniform.value instanceof Float32Array) {
        if (uniform.value.length === 2) {
          gl.uniform2fv(location, uniform.value);
        } else if (uniform.value.length === 3) {
          gl.uniform3fv(location, uniform.value);
        }
      } else if (typeof uniform.value === 'number') {
        gl.uniform1f(location, uniform.value);
      }
    }
    
    updateUniforms() {
      for (const name in this.uniforms) {
        this.setUniform(name, this.uniforms[name].value);
      }
    }
  },
  
  Mesh: class Mesh {
    constructor(gl, options = {}) {
      this.gl = gl;
      this.geometry = options.geometry;
      this.program = options.program;
      
      // Create buffers
      this.setupBuffers();
    }
    
    setupBuffers() {
      const gl = this.gl;
      
      // Position buffer
      this.positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.geometry.positions), gl.STATIC_DRAW);
      
      // UV buffer (if available)
      if (this.geometry.uvs) {
        this.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.geometry.uvs), gl.STATIC_DRAW);
      }
    }
    
    draw(gl) {
      const program = this.program.program;
      gl.useProgram(program);
      
      // Enable blending for transparency
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      // Set uniforms
      this.program.updateUniforms();
      
      // Bind position attribute
      const positionLoc = gl.getAttribLocation(program, 'position');
      if (positionLoc !== -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
      }
      
      // Bind UV attribute if available
      if (this.geometry.uvs) {
        const uvLoc = gl.getAttribLocation(program, 'uv');
        if (uvLoc !== -1) {
          gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
          gl.enableVertexAttribArray(uvLoc);
          gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
        }
      }
      
      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, this.geometry.count || 3);
    }
  },
  
  Triangle: class Triangle {
    constructor(gl) {
      this.positions = new Float32Array([
        -1, -1,
         3, -1,
        -1,  3
      ]);
      this.uvs = new Float32Array([
        0, 0,
        2, 0,
        0, 2
      ]);
      this.count = 3;
    }
  }
};

console.log('Local OGL implementation loaded successfully');
