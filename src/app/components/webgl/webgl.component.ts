import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { AudioInputService } from '../../services/audio-input.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-webgl',
  templateUrl: './webgl.component.html',
  styleUrls: ['./webgl.component.scss'],
  standalone: false
})
export class WebglComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() settings!: any;  // Full WebGlConfig
  @ViewChild('canvasElement', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private gl!: WebGLRenderingContext;
  private program!: WebGLProgram;
  private positionBuffer!: WebGLBuffer;

  // attribute + uniform locations
  private a_position!: number;
  private u_time!: WebGLUniformLocation;
  private u_audio!: WebGLUniformLocation;

  // Color effects
  private u_hueShift!: WebGLUniformLocation;
  private u_saturation!: WebGLUniformLocation;
  private u_brightness!: WebGLUniformLocation;

  // Shape & Geometry
  private u_shapeScale!: WebGLUniformLocation;
  private u_shapeRotation!: WebGLUniformLocation;
  private u_shapeTranslation!: WebGLUniformLocation;
  private u_shapeDistortion!: WebGLUniformLocation;
  private u_shapeMorphing!: WebGLUniformLocation;
  private u_shapeRipple!: WebGLUniformLocation;
  private u_shapeMaster!: WebGLUniformLocation;

  // Motion & Temporal
  private u_oscillation!: WebGLUniformLocation;
  private u_pulsation!: WebGLUniformLocation;
  private u_speed!: WebGLUniformLocation;

  // Noise & Fractal toggles
  private u_noiseDeformation!: WebGLUniformLocation;
  private u_fractal!: WebGLUniformLocation;

  // Texture & Special Effects
  private u_texNoise!: WebGLUniformLocation;
  private u_glitch!: WebGLUniformLocation;
  private u_texturing!: WebGLUniformLocation;
  private u_pixelation!: WebGLUniformLocation;
  private u_mosaic!: WebGLUniformLocation;
  private u_blend!: WebGLUniformLocation;
  private u_masterTexture!: WebGLUniformLocation;

  // Spectrum & Amplitude sliders
  private u_hz60!: WebGLUniformLocation;
  private u_hz170!: WebGLUniformLocation;
  private u_hz400!: WebGLUniformLocation;
  private u_hz1khz!: WebGLUniformLocation;
  private u_hz2_5khz!: WebGLUniformLocation;
  private u_hz6khz!: WebGLUniformLocation;
  private u_hz15khz!: WebGLUniformLocation;
  private u_masterAmp!: WebGLUniformLocation;

  private sub!: Subscription;
  private audioLevel = 0;

  // FFT data for EQ
  private freqData!: Uint8Array;
  private readonly bandFreqs = [60, 170, 400, 1000, 2500, 6000, 15000];

  constructor(private audioSvc: AudioInputService) {}

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.gl = canvas.getContext('webgl')!;
    if (!this.gl) { console.error('WebGL not supported'); return; }

    this.initWebGL();
    this.sub = this.audioSvc.audioLevel$.subscribe(l => this.audioLevel = l);
    requestAnimationFrame(() => this.render());
  }

  ngOnChanges(_: SimpleChanges) {}
  ngOnDestroy() { this.sub.unsubscribe(); }

  private initWebGL() {
    const vs = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision mediump float;
      varying vec2 v_uv;
      uniform float u_time;
      uniform float u_audio;

      uniform float u_hueShift;
      uniform float u_saturation;
      uniform float u_brightness;

      uniform float u_shapeScale;
      uniform float u_shapeRotation;
      uniform float u_shapeTranslation;
      uniform float u_shapeDistortion;
      uniform float u_shapeMorphing;
      uniform float u_shapeRipple;
      uniform float u_shapeMaster;

      uniform float u_oscillation;
      uniform float u_pulsation;
      uniform float u_speed;

      uniform float u_noiseDeformation;
      uniform float u_fractal;

      uniform float u_texNoise;
      uniform float u_glitch;
      uniform float u_texturing;
      uniform float u_pixelation;
      uniform float u_mosaic;
      uniform float u_blend;
      uniform float u_masterTexture;

      uniform float u_hz60;
      uniform float u_hz170;
      uniform float u_hz400;
      uniform float u_hz1khz;
      uniform float u_hz2_5khz;
      uniform float u_hz6khz;
      uniform float u_hz15khz;
      uniform float u_masterAmp;

      // noise helper
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
      }

      void main() {
        // 1) apply shape & geometry
        vec2 uv = v_uv;
        uv = (uv - 0.5) * u_shapeScale + 0.5;
        float s = sin(u_shapeRotation);
        float c = cos(u_shapeRotation);
        uv = ((uv - 0.5) * mat2(c,-s,s,c)) + 0.5;
        uv += u_shapeTranslation * 0.002;
        if (u_noiseDeformation > 0.5) {
          uv += (noise(uv * 5.0) - 0.5) * u_shapeDistortion * 0.01;
        }
        uv += (noise(uv * 10.0) - 0.5) * u_shapeMorphing * 0.01;
        uv += sin((uv.x+uv.y)*10.0 + u_time*u_speed) * u_shapeRipple * 0.001;
        uv = (uv - 0.5) * u_shapeMaster + 0.5;

        // 2) fractal
        if (u_fractal > 0.5) {
          uv = abs(fract(uv * 2.0) - 0.5);
        }

        // 3) oscillator + audio
        float t = u_time * u_speed;
        float a = pow(u_audio, 2.0);
        float osc1 = sin(uv.x * u_oscillation + t * u_pulsation + u_hueShift);
        float osc2 = sin(uv.y * u_oscillation - t * u_pulsation + u_hueShift);
        float diff = abs(osc1 - osc2);
        vec3 col = vec3(diff * (1.0 + a));

        // 4) textures
        col += noise(uv * 20.0 + t * 0.1) * u_texNoise * 0.1;
        col += (sin(uv.y * 50.0 + t * 30.0) * 0.5 + 0.5) * u_glitch * 0.05;
        col = mix(col, floor(col * 10.0) / 10.0, u_texturing * 0.1);
        col += noise(uv * 5.0) * u_pixelation * 0.05;
        uv = floor(uv * (10.0 - u_mosaic)) / (10.0 - u_mosaic);
        col = mix(col, vec3(uv.x, uv.y, 1.0 - uv.x), u_blend * 0.1);
        col *= u_masterTexture;

        // 5) color filter
        float gray = dot(col, vec3(0.3,0.59,0.11));
        if (u_saturation < 0.5) col = vec3(gray);

        // 6) color effects
        col = mix(vec3(gray), col, u_saturation);
        col *= u_brightness;

        // 7) EQ tints
        col.r += u_hz60 * 0.2;
        col.g += u_hz400 * 0.2;
        col.b += u_hz15khz * 0.2;
        col *= 1.0 + u_masterAmp;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    // compile & link
    const vsh = this.createShader(this.gl, this.gl.VERTEX_SHADER, vs);
    const fsh = this.createShader(this.gl, this.gl.FRAGMENT_SHADER, fs);
    this.program = this.createProgram(this.gl, vsh, fsh);

    // get locations
    const g = this.gl;
    this.a_position         = g.getAttribLocation(this.program, 'a_position');
    this.u_time             = g.getUniformLocation(this.program, 'u_time')!;
    this.u_audio            = g.getUniformLocation(this.program, 'u_audio')!;
    this.u_hueShift         = g.getUniformLocation(this.program, 'u_hueShift')!;
    this.u_saturation       = g.getUniformLocation(this.program, 'u_saturation')!;
    this.u_brightness       = g.getUniformLocation(this.program, 'u_brightness')!;
    this.u_shapeScale = g.getUniformLocation(this.program, 'u_shapeScale')!;
    this.u_shapeRotation    = g.getUniformLocation(this.program, 'u_shapeRotation')!;
    this.u_shapeTranslation = g.getUniformLocation(this.program, 'u_shapeTranslation')!;
    this.u_shapeDistortion  = g.getUniformLocation(this.program, 'u_shapeDistortion')!;
    this.u_shapeMorphing    = g.getUniformLocation(this.program, 'u_shapeMorphing')!;
    this.u_shapeRipple      = g.getUniformLocation(this.program, 'u_shapeRipple')!;
    this.u_shapeMaster      = g.getUniformLocation(this.program, 'u_shapeMaster')!;
    this.u_oscillation      = g.getUniformLocation(this.program, 'u_oscillation')!;
    this.u_pulsation        = g.getUniformLocation(this.program, 'u_pulsation')!;
    this.u_speed            = g.getUniformLocation(this.program, 'u_speed')!;
    this.u_noiseDeformation = g.getUniformLocation(this.program, 'u_noiseDeformation')!;
    this.u_fractal          = g.getUniformLocation(this.program, 'u_fractal')!;
    this.u_texNoise         = g.getUniformLocation(this.program, 'u_texNoise')!;
    this.u_glitch           = g.getUniformLocation(this.program, 'u_glitch')!;
    this.u_texturing        = g.getUniformLocation(this.program, 'u_texturing')!;
    this.u_pixelation       = g.getUniformLocation(this.program, 'u_pixelation')!;
    this.u_mosaic           = g.getUniformLocation(this.program, 'u_mosaic')!;
    this.u_blend            = g.getUniformLocation(this.program, 'u_blend')!;
    this.u_masterTexture    = g.getUniformLocation(this.program, 'u_masterTexture')!;
    this.u_hz60             = g.getUniformLocation(this.program, 'u_hz60')!;
    this.u_hz170            = g.getUniformLocation(this.program, 'u_hz170')!;
    this.u_hz400            = g.getUniformLocation(this.program, 'u_hz400')!;
    this.u_hz1khz           = g.getUniformLocation(this.program, 'u_hz1khz')!;
    this.u_hz2_5khz         = g.getUniformLocation(this.program, 'u_hz2_5khz')!;
    this.u_hz6khz           = g.getUniformLocation(this.program, 'u_hz6khz')!;
    this.u_hz15khz          = g.getUniformLocation(this.program, 'u_hz15khz')!;
    this.u_masterAmp        = g.getUniformLocation(this.program, 'u_masterAmp')!;

    // create quad buffer
    const quad = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
    this.positionBuffer = g.createBuffer()!;
    g.bindBuffer(g.ARRAY_BUFFER, this.positionBuffer);
    g.bufferData(g.ARRAY_BUFFER, quad, g.STATIC_DRAW);
  }

  private render() {
    const gl = this.gl;
    const analyser = this.audioSvc.analyserNode;
    let audioVal = this.audioLevel;

    if (analyser) {
      const fftSize = analyser.fftSize;
      const binCount = analyser.frequencyBinCount;
      if (!this.freqData || this.freqData.length !== binCount) {
        this.freqData = new Uint8Array(binCount);
      }
      analyser.getByteFrequencyData(this.freqData);
      const sr = analyser.context.sampleRate;
      const binHz = sr / fftSize;
      const gains = this.settings.spectrumAmplitude;
      const eqGains = [
        gains.hz60, gains.hz170, gains.hz400,
        gains.hz1khz, gains.hz2_5khz,
        gains.hz6khz, gains.hz15khz
      ];
      let sumProd = 0, sumG = 0;
      for (let i = 0; i < this.bandFreqs.length; i++) {
        const freq = this.bandFreqs[i];
        const idx = Math.min(binCount - 1, Math.floor(freq / binHz));
        const lvl = this.freqData[idx] / 255;
        sumProd += lvl * eqGains[i];
        sumG += eqGains[i];
      }
      if (sumG > 0) audioVal = sumProd / sumG;
    }

    // viewport & clear
    const canvas = this.canvasRef.nativeElement;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);

    // bind quad
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.a_position);
    gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);

    // upload uniforms
    const t = performance.now() * 0.001;
    gl.uniform1f(this.u_time, t);
    gl.uniform1f(this.u_audio, audioVal);

    const ce = this.settings.colorEffects;
    gl.uniform1f(this.u_hueShift, ce.hueShift);
    gl.uniform1f(this.u_saturation, ce.saturation);
    gl.uniform1f(this.u_brightness, ce.brightness);

    const sge = this.settings.shapeGeometryEffects;
    gl.uniform1f(this.u_shapeScale, sge.scale);
    gl.uniform1f(this.u_shapeRotation, sge.rotation * 0.0174533);
    gl.uniform1f(this.u_shapeTranslation, sge.translation);
    gl.uniform1f(this.u_shapeDistortion, sge.distortion);
    gl.uniform1f(this.u_shapeMorphing, sge.morphing);
    gl.uniform1f(this.u_shapeRipple, sge.ripple);
    gl.uniform1f(this.u_shapeMaster, sge.master);

    const mte = this.settings.motionTemporalEffects;
    gl.uniform1f(this.u_oscillation, mte.oscillation);
    gl.uniform1f(this.u_pulsation, mte.pulsation);
    gl.uniform1f(this.u_speed, mte.speed);

    gl.uniform1f(this.u_noiseDeformation, this.settings.noiseDeformation === 'option1' ? 1 : 0);
    gl.uniform1f(this.u_fractal, this.settings.fractalKaleidoscopicEffects === 'option1' ? 1 : 0);

    const tse = this.settings.textureSpecialEffects;
    gl.uniform1f(this.u_texNoise, tse.noise);
    gl.uniform1f(this.u_glitch, tse.glitch);
    gl.uniform1f(this.u_texturing, tse.texturing);
    gl.uniform1f(this.u_pixelation, tse.pixelation);
    gl.uniform1f(this.u_mosaic, tse.mosaic);
    gl.uniform1f(this.u_blend, tse.blend);
    gl.uniform1f(this.u_masterTexture, tse.master);

    const sa = this.settings.spectrumAmplitude;
    gl.uniform1f(this.u_hz60, sa.hz60);
    gl.uniform1f(this.u_hz170, sa.hz170);
    gl.uniform1f(this.u_hz400, sa.hz400);
    gl.uniform1f(this.u_hz1khz, sa.hz1khz);
    gl.uniform1f(this.u_hz2_5khz, sa['hz2_5khz']);
    gl.uniform1f(this.u_hz6khz, sa.hz6khz);
    gl.uniform1f(this.u_hz15khz, sa.hz15khz);
    gl.uniform1f(this.u_masterAmp, sa.master);

    // draw & loop
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(() => this.render());
  }

  private createShader(gl: WebGLRenderingContext, type: number, src: string) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh) || 'Shader compile failed');
    }
    return sh;
  }

  private createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader) {
    const pr = gl.createProgram()!;
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(pr) || 'Program link failed');
    }
    return pr;
  }
}
