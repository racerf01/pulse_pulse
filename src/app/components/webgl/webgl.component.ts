import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-webgl',
  templateUrl: './webgl.component.html',
  styleUrls: ['./webgl.component.scss'],
  standalone: false
})
export class WebglComponent implements AfterViewInit, OnChanges {
  @Input() settings: any;  // Currently not used in the shader, but you can incorporate it later.
  @ViewChild('canvasElement', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private gl!: WebGLRenderingContext;
  private program!: WebGLProgram;
  private a_position!: number;
  private u_time!: WebGLUniformLocation;
  private u_audio!: WebGLUniformLocation;
  private positionBuffer!: WebGLBuffer;

  // Audio context variables
  private audioContext!: AudioContext;
  private analyser!: AnalyserNode;
  private dataArray!: Uint8Array;
  private microphoneStream: MediaStream | null = null;

  ngAfterViewInit() {
    this.gl = this.canvasRef.nativeElement.getContext('webgl')!;
    if (!this.gl) {
      console.error('WebGL not supported!');
      return;
    }
    this.initWebGL();
    this.setupAudio();
    this.render();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Here you can update effects if settings change.
  }

  // Initialize shaders, program, and buffers.
  initWebGL() {
    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        // Map the position from [-1,1] to [0,1] for UV coordinates.
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    const fragmentShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform float u_audio;
      varying vec2 v_uv;
      void main() {
        // Calculate distance from the center.
        float dist = distance(v_uv, vec2(0.5, 0.5));
        // Base radius is 0.3, and it pulses by adding 0.2 scaled by the audio level.
        float radius = 0.3 + 0.2 * u_audio;
        // Use smoothstep for a soft edge.
        float circle = smoothstep(radius, radius - 0.01, dist);
        // Color oscillates with time.
        vec3 color = vec3(0.5 + 0.5*sin(u_time), 0.5 + 0.5*cos(u_time), 0.5);
        // The final color darkens inside the circle.
        gl_FragColor = vec4(color * (1.0 - circle), 1.0);
      }
    `;
    // Compile shaders.
    const vertexShader = this.createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    // Create the shader program.
    this.program = this.createProgram(this.gl, vertexShader, fragmentShader);

    // Get attribute and uniform locations.
    this.a_position = this.gl.getAttribLocation(this.program, "a_position");
    this.u_time = this.gl.getUniformLocation(this.program, "u_time")!;
    this.u_audio = this.gl.getUniformLocation(this.program, "u_audio")!;

    // Create a buffer for a full-screen quad.
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]);
    this.positionBuffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
  }

  // Helper: Create and compile a shader.
  createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      throw new Error("Shader compile failed");
    }
    return shader;
  }

  // Helper: Create a shader program.
  createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      throw new Error("Program linking failed");
    }
    return program;
  }

  // Set up the audio context and analyser to get microphone input.
  async setupAudio() {
    try {
      // Request microphone access.
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.microphoneStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      source.connect(this.analyser);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }

  // Render loop: update audio data, set uniforms, and draw.
  render() {
    // Get audio frequency data and calculate average amplitude.
    let audioLevel = 0;
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.dataArray);
      const sum = this.dataArray.reduce((acc, val) => acc + val, 0);
      audioLevel = sum / this.dataArray.length;
      // Normalize (0 to 1) assuming data is 0-255.
      audioLevel = audioLevel / 255;
    }

    // Set viewport and clear.
    this.gl.viewport(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Use our shader program.
    this.gl.useProgram(this.program);

    // Bind the buffer and set the attribute.
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.enableVertexAttribArray(this.a_position);
    this.gl.vertexAttribPointer(this.a_position, 2, this.gl.FLOAT, false, 0, 0);

    // Set uniform values: current time and the audio level.
    const time = performance.now() / 1000;
    this.gl.uniform1f(this.u_time, time);
    this.gl.uniform1f(this.u_audio, audioLevel);

    // Draw the full-screen quad.
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    requestAnimationFrame(() => this.render());
  }
}
