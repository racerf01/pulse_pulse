import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-webgl',
  templateUrl: './webgl.component.html',
  styleUrls: ['./webgl.component.scss'],
  standalone: false
})
export class WebglComponent implements AfterViewInit, OnChanges {
  @Input() settings: any; // Expected to follow the WebGlConfig interface
  @ViewChild('canvasElement', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private gl!: WebGLRenderingContext;
  private program!: WebGLProgram;
  private a_position!: number;
  private u_time!: WebGLUniformLocation;
  private u_audio!: WebGLUniformLocation;
  private u_hueShift!: WebGLUniformLocation;
  private u_saturation!: WebGLUniformLocation;
  private u_brightness!: WebGLUniformLocation;
  private u_scale!: WebGLUniformLocation;
  private u_oscillationFrequency!: WebGLUniformLocation;
  private u_oscillationAmplitude!: WebGLUniformLocation;

  private positionBuffer!: WebGLBuffer;

  // Audio variables.
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
    if (changes['settings']) {
      console.log('New settings:', this.settings);
      // Updated configuration will be used in the next render frame.
    }
  }

  initWebGL() {
    // Vertex shader: passes along positions and computes UV coordinates.
    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        // Map from [-1,1] to [0,1].
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader now uses configuration uniforms to drive oscillators.
    const fragmentShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform float u_audio;
      uniform float u_hueShift;
      uniform float u_saturation;
      uniform float u_brightness;
      uniform float u_scale;
      uniform float u_oscillationFrequency;
      uniform float u_oscillationAmplitude;
      varying vec2 v_uv;
      
      // Simple 2D noise.
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
      }
      
      void main() {
        // Scale UV coordinates.
        vec2 uv = (v_uv - 0.5) * u_scale + 0.5;
        
        // Emphasize the audio input nonlinearly.
        float audioReaction = pow(u_audio, 2.0);
        
        // Use config values for oscillation.
        float osc1 = sin(uv.x * u_oscillationFrequency + u_time * (-u_oscillationAmplitude + audioReaction * u_oscillationAmplitude) + u_hueShift) * 0.5 + 0.5 + 0.3;
        float osc2 = sin(uv.y * u_oscillationFrequency + u_time * (u_oscillationAmplitude + audioReaction * u_oscillationAmplitude)) * 0.5 + 0.5;
        float diffOsc = abs(osc1 - osc2);
        
        // Modulate scale using noise and an additional oscillator.
        float n = noise(uv * 3.5 + u_time * 0.25);
        float osc15 = sin(uv.x * 15.0 + sin(u_time / 2.0)) * 0.5 + 0.5;
        float modScale = mix(n, osc15, 0.5);
        float modulated = diffOsc * (1.0 + modScale * (0.6 + audioReaction * 0.8));
        
        // Apply a color tint and contrast adjustments.
        vec3 col = vec3(u_brightness, u_saturation, 0.4) * modulated;
        col = mix(vec3(0.5), col, 1.4 + audioReaction);
        col += col * 0.6;
        
        // Invert and adjust brightness/contrast.
        col = 1.0 - col;
        col = (col - 0.5) * (1.2 + audioReaction * 0.5) + 0.1;
        
        // Final modulation using a low-frequency oscillator.
        float osc2_low = sin(uv.x * 2.0 + u_time) * 0.5 + 0.5;
        col *= mix(1.0, osc2_low, -0.2 - audioReaction * 0.3);
        
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    // Compile shaders.
    const vertexShader = this.createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    // Create and link the program.
    this.program = this.createProgram(this.gl, vertexShader, fragmentShader);

    // Retrieve attribute and uniform locations.
    this.a_position = this.gl.getAttribLocation(this.program, "a_position");
    this.u_time = this.gl.getUniformLocation(this.program, "u_time")!;
    this.u_audio = this.gl.getUniformLocation(this.program, "u_audio")!;
    this.u_hueShift = this.gl.getUniformLocation(this.program, "u_hueShift")!;
    this.u_saturation = this.gl.getUniformLocation(this.program, "u_saturation")!;
    this.u_brightness = this.gl.getUniformLocation(this.program, "u_brightness")!;
    this.u_scale = this.gl.getUniformLocation(this.program, "u_scale")!;
    this.u_oscillationFrequency = this.gl.getUniformLocation(this.program, "u_oscillationFrequency")!;
    this.u_oscillationAmplitude = this.gl.getUniformLocation(this.program, "u_oscillationAmplitude")!;

    // Create a full-screen quad.
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

  // Helper: Compile a shader.
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

  // Set up the audio context and analyser.
  async setupAudio() {
    try {
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

  render() {
    // Get audio level from the analyser.
    let audioLevel = 0;
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.dataArray);
      const sum = this.dataArray.reduce((acc, val) => acc + val, 0);
      audioLevel = (sum / this.dataArray.length) / 255;
    }
    
    this.gl.viewport(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.enableVertexAttribArray(this.a_position);
    this.gl.vertexAttribPointer(this.a_position, 2, this.gl.FLOAT, false, 0, 0);

    const time = performance.now() / 1000;
    this.gl.uniform1f(this.u_time, time);
    this.gl.uniform1f(this.u_audio, audioLevel);

    // Pass config values for color effects.
    const hueShift = this.settings?.colorEffects?.hueShift ?? 0.0;
    const saturation = this.settings?.colorEffects?.saturation ?? 1.0;
    const brightness = this.settings?.colorEffects?.brightness ?? 1.0;
    this.gl.uniform1f(this.u_hueShift, hueShift);
    this.gl.uniform1f(this.u_saturation, saturation);
    this.gl.uniform1f(this.u_brightness, brightness);

    // Pass scale factor from config.
    const scale = this.settings?.shapeGeometryEffects?.scale ?? 1.0;
    this.gl.uniform1f(this.u_scale, scale);

    // Pass oscillator parameters from config (using defaults if missing).
    const oscFreq = this.settings?.motionTemporalEffects?.oscillation ?? 60.0;
    const oscAmp  = this.settings?.motionTemporalEffects?.pulsation ?? 0.08;
    this.gl.uniform1f(this.u_oscillationFrequency, oscFreq);
    this.gl.uniform1f(this.u_oscillationAmplitude, oscAmp);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    requestAnimationFrame(() => this.render());
  }
}
