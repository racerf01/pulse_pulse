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

  private u_colorFilterType!: WebGLUniformLocation;
  private u_templateOption!: WebGLUniformLocation;
  private u_color0!: WebGLUniformLocation;
  private u_color1!: WebGLUniformLocation;
  private u_color2!: WebGLUniformLocation;
  private u_color3!: WebGLUniformLocation;
  private u_color4!: WebGLUniformLocation;

  private sub!: Subscription;
  private audioLevel = 0;

  // FFT data for EQ
  private freqData!: Uint8Array;
  private readonly bandFreqs = [60, 170, 400, 1000, 2500, 6000, 15000];

  private customRender?: (gl: WebGLRenderingContext, program: WebGLProgram, uniforms: any, time: number, audioLevel: number, bandAmps: Float32Array, settings: any) => void;
  private customUniforms: any;

  constructor(private audioSvc: AudioInputService) {}

  ngAfterViewInit() {
    this.setup();
  }

  ngOnChanges(changes: SimpleChanges) {
    const change = changes['settings'];
    if (change && !change.firstChange) {
      const prev = change.previousValue;
      const curr = change.currentValue;
      
      // Check if template option changed or custom shader changed
      if (curr.templateOption !== prev.templateOption || 
          curr.customFragmentShader !== prev.customFragmentShader) {
        console.log('Template or shader changed, reinitializing...');
        // Clean up existing resources
        if (this.sub) {
          this.sub.unsubscribe();
        }
        if (this.program) {
          this.gl.deleteProgram(this.program);
        }
        // Reinitialize WebGL
        this.setup();
      }
    }
  }
  ngOnDestroy() { this.sub.unsubscribe(); }

  private setup(): void {
    const canvas = this.canvasRef.nativeElement;
    
    // 1. First ensure we can get a WebGL context
    try {
      // Try WebGL 2 first, fall back to WebGL 1
      const gl = (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ?? 
                (canvas.getContext('webgl') as WebGLRenderingContext | null);
      
      if (!gl) {
        throw new Error('WebGL not supported in your browser');
      }

      // Set canvas size to match display size
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // Store the WebGL context
      this.gl = gl;

      // 2. If we have a custom shader and templateOption is 'option4', try to load it
      if ((this.settings as any).customFragmentShader && this.settings.templateOption === 'option4') {
        console.log('Loading custom shader...');
        const code = (this.settings as any).customFragmentShader;
        const blob = new Blob([code], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        
        import(/* webpackIgnore: true */ url).then(mod => {
          console.log('Custom shader module loaded');
          
          // Get the analyser
          const analyser = this.audioSvc.analyserNode;
          if (!analyser) {
            throw new Error('AnalyserNode is not initialized');
          }

          try {
            // Initialize the custom shader
            console.log('Initializing custom shader...');
            const result = mod.init(this.gl, analyser, this.settings);
            console.log('Custom shader initialized');
            
            this.program = result.program;
            this.customUniforms = result.uniforms;
            this.customRender = mod.render;
            this.gl.useProgram(this.program);
            
            // Start audio and render loop
            this.sub = this.audioSvc.audioLevel$.subscribe(l => this.audioLevel = l);
            requestAnimationFrame(this.renderCustom);
          } catch (error) {
            console.error('Failed to initialize custom shader:', error);
            this.fallbackToDefault();
          }
        }).catch(err => {
          console.error('Failed to load custom shader module:', err);
          this.fallbackToDefault();
        });
      } else {
        // 3. No custom shader or not option4, use default
        console.log('Using default shader');
        this.initWebGL();
        this.sub = this.audioSvc.audioLevel$.subscribe(l => this.audioLevel = l);
        requestAnimationFrame(() => this.render());
      }
    } catch (error) {
      console.error('WebGL initialization failed:', error);
      alert('WebGL initialization failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  private fallbackToDefault(): void {
    console.log('Falling back to default shader');
    delete this.settings.customFragmentShader;
    this.initWebGL();
    this.sub = this.audioSvc.audioLevel$.subscribe(l => this.audioLevel = l);
    requestAnimationFrame(() => this.render());
  }

  private renderCustom = (now: number) => {
    // Compute bandAmps as before
    const analyser = this.audioSvc.analyserNode;
    // ... reuse band computation from render() ...
    const sa = this.settings.spectrumAmplitude;
    const gains = [sa.hz60, sa.hz170, sa.hz400, sa.hz1khz, sa['hz2_5khz'], sa.hz6khz, sa.hz15khz];
    const bandAmps = new Float32Array(7);
    let audioVal = this.audioLevel;
    if (analyser) {
      const binCount = analyser.frequencyBinCount;
      if (!this.freqData || this.freqData.length !== binCount) this.freqData = new Uint8Array(binCount);
      analyser.getByteFrequencyData(this.freqData);
      const binHz = analyser.context.sampleRate / analyser.fftSize;
      let sum = 0;
      for (let i = 0; i < this.bandFreqs.length; i++) {
        const bin = Math.min(binCount - 1, Math.round(this.bandFreqs[i] / binHz));
        const raw = this.freqData[bin] / 255;
        const curved = Math.pow(raw, 1.7);
        const amp = curved * gains[i];
        bandAmps[i] = amp;
        sum += curved;
      }
      audioVal = sum / this.bandFreqs.length;
    }
    const master = sa.master;
    const scaledAudio = audioVal * master;
    const time = now * 0.001;
    if (this.customRender && this.gl && this.program && this.customUniforms) {
      this.gl.useProgram(this.program);  // bind custom program each frame
      // Pass current settings into custom render so knobs affect animation
      this.customRender(this.gl, this.program, this.customUniforms, time, scaledAudio, bandAmps, this.settings);
      requestAnimationFrame(this.renderCustom);
    }
  }

  private initWebGL() {
    const vs = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = (this.settings.templateOption === 'option4' && this.settings.customFragmentShader)
      ? this.settings.customFragmentShader
      : `
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

      uniform float u_colorFilterType; // 0: none, 1: grayscale, 2: sepia, 3: invert, 4: brightness+, 5: contrast+, 6: hue rotate, 7: posterize, 8: threshold, 9: red only, 10: green only, 11: blue only, 12: tint blue, 13: tint red, 14: tint yellow
      uniform float u_templateOption; // 0: Pixel Grid, 1: Dark Holes, 2: Pulsatic Waves

      uniform vec3 u_color0;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      uniform vec3 u_color3;
      uniform vec3 u_color4;

      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
      }

      vec2 rot2d(vec2 p, float a) {
        float s = sin(a), c = cos(a);
        p -= 0.5;
        p = mat2(c, -s, s, c) * p;
        return p + 0.5;
      }

      // --- Hue rotation utility ---
      vec3 hueRotate(vec3 color, float angle) {
        float c = cos(angle);
        float s = sin(angle);
        mat3 m = mat3(
          0.299 + 0.701 * c + 0.168 * s, 0.587 - 0.587 * c + 0.330 * s, 0.114 - 0.114 * c - 0.497 * s,
          0.299 - 0.299 * c - 0.328 * s, 0.587 + 0.413 * c + 0.035 * s, 0.114 - 0.114 * c + 0.292 * s,
          0.299 - 0.300 * c + 1.250 * s, 0.587 - 0.588 * c - 1.050 * s, 0.114 + 0.886 * c - 0.203 * s
        );
        return clamp(m * color, 0.0, 1.0);
      }

      void main() {
        vec2 uv = v_uv;
        
        // apply EQ-driven scale
        float scaleMod = 1.0 + u_hz60 * 0.2;
        uv = (uv - 0.5) * (u_shapeScale * scaleMod) + 0.5;

        // rotation + audio-driven rotation
        uv = rot2d(uv, u_shapeRotation + u_pulsation * u_audio * 0.5);

        // translation w/ bass reaction
        uv += u_shapeTranslation * 0.001 + vec2(u_hz400, u_hz60) * 0.002;

        // distortion & morphing modulated by audio
        if (u_noiseDeformation > 0.5) {
          // Stronger and more obvious noise deformation
          uv += (noise(uv * 5.0 + u_time * 0.5) - 0.5) * u_shapeDistortion * 0.04 * (0.5 + u_audio);
          uv += (noise(uv * 20.0 + u_time) - 0.5) * u_shapeDistortion * 0.01 * (0.5 + u_audio); // high-frequency layer
        }
        uv += (noise(uv * 10.0) - 0.5) * u_shapeMorphing * 0.01;

        // ripple speed modulated
        uv += sin((uv.x + uv.y) * 10.0 + u_time * u_speed * (1.0 + u_masterAmp)) * u_shapeRipple * 0.001;

        // fractal toggle
        if (u_fractal > 0.5) {
          uv = abs(fract(uv * 2.0) - 0.5);
        }

        // oscillator + audio reaction
        float t = u_time * (1.0 + u_speed * 0.5);
        float a = pow(u_audio, 2.0);
        vec3 col;
        if (u_templateOption == 1.0) {
          // Pixel-grid holes: one hole per 5×5 cell, with rotation
          int row = int(floor(uv.y * 5.0));
          int colC = int(floor(uv.x * 5.0));
          int idx = int(mod(float(row + colC), 5.0));
          vec3 colBase = idx==0 ? u_color0 : idx==1 ? u_color1 : idx==2 ? u_color2 : idx==3 ? u_color3 : u_color4;
          // black hole core and accretion glow
          float radiusBase = mix(0.12, 0.25, u_shapeDistortion * 0.7);
          // make holes slide horizontally per row and vertically per column
          vec2 cellUV = uv * 5.0;
          float rowF = floor(cellUV.y);
          float colF = floor(cellUV.x);
          float slideX = sin(u_time * u_speed + rowF * 1.2) * 0.2;
          float slideY = cos(u_time * u_speed + colF * 1.7) * 0.2;
          cellUV.x += slideX;
          cellUV.y += slideY;
          vec2 gv = fract(cellUV) - 0.5;
          float d = length(gv);
          float pulse = 1.0 + u_audio * u_shapeMaster;
          float r = radiusBase / pulse;
          // make hole radius pulse over time
          float sizeOsc = 1.0 + 0.3 * sin(u_time * u_speed * 2.0);
          float rMod = r * sizeOsc;
          // dark core mask (inside pulsating radius)
          float holeMask = 1.0 - smoothstep(rMod * 0.8, rMod, d);
          // glowing accretion ring just outside core
          float ring = smoothstep(rMod * 0.9, rMod * 1.1, d) - smoothstep(rMod * 0.8, rMod * 0.9, d);
          // combine base color core and ring glow
          col = colBase * holeMask;
          vec3 ringColor = mix(vec3(1.0), colBase, 0.5);
          col += ring * ringColor * u_shapeMaster;
        } else if (u_templateOption == 2.0) {
          // Sea Waves: layered ocean-like waves
          float lanes = mix(2.0, 6.0, u_shapeScale * 0.3);
          float w1 = sin((uv.x * lanes - u_time * (u_speed + 0.3)) * 1.0);
          float w2 = sin((uv.x * lanes * 0.8 + u_time * (u_speed * 0.7)) * 1.5);
          float wave = w1 + 0.5 * w2;
          float wNorm = clamp((wave + 1.0) * 0.5, 0.0, 1.0);
          float idxF = wNorm * 4.0;
          int i0 = int(floor(idxF));
          float frac = fract(idxF);
          vec3 c0; vec3 c1;
          if (i0 == 0) { c0 = u_color0; c1 = u_color1; }
          else if (i0 == 1) { c0 = u_color1; c1 = u_color2; }
          else if (i0 == 2) { c0 = u_color2; c1 = u_color3; }
          else if (i0 == 3) { c0 = u_color3; c1 = u_color4; }
          else { c0 = u_color4; c1 = u_color4; }
          vec3 colBase = mix(c0, c1, frac);
          // fluid vertical displacement
          uv.y += wave * u_shapeRipple * 0.02;
          col = colBase;
          // slight shear for motion
          float shear = u_shapeRipple * 0.05;
          uv.x += shear * wave;
        } else {
          // Pixel Grid
          float osc = sin((uv.x + uv.y) * u_oscillation + t * u_pulsation + u_hueShift * 0.1);
          int row = int(floor(clamp(uv.y * 5.0, 0.0, 4.999)));
          int colI = int(floor(clamp(uv.x * 5.0, 0.0, 4.999)));
          int gridIdx = int(mod(float(row + colI), 5.0));
          if (gridIdx == 0) col = u_color0;
          else if (gridIdx == 1) col = u_color1;
          else if (gridIdx == 2) col = u_color2;
          else if (gridIdx == 3) col = u_color3;
          else col = u_color4;
          col *= (osc * 0.5 + 0.5);
        }
        
        // texture effects with audio
        col += noise(uv * 20.0 + t * 0.1) * u_texNoise * u_audio * 0.1;
        col += (sin(uv.y * 50.0 + t * 30.0) * 0.5 + 0.5) * u_glitch * a * 0.05;
        col = mix(col, floor(col * 10.0) / 10.0, u_texturing * 0.1);
        col += noise(uv * 5.0) * u_pixelation * 0.05;
        uv = floor(uv * (10.0 - u_mosaic)) / (10.0 - u_mosaic);
        col = mix(col, vec3(uv.x, uv.y, 1.0 - uv.x), u_blend * 0.1);
        col *= u_masterTexture;

        // color adjustments + audio tint
        float gray = dot(col, vec3(0.3, 0.59, 0.11));
        if (u_saturation < 0.5) col = vec3(gray);
        col = mix(vec3(gray), col, u_saturation);
        col *= u_brightness * (1.0 + a);

        // final tint by EQ master amp
        col.r += u_hz15khz * 0.1;
        col.b += u_hz60 * 0.1;

        // --- Color Filter ---
        if (u_colorFilterType == 1.0) {
          gray = dot(col, vec3(0.299, 0.587, 0.114));
          col = vec3(gray);
        } else if (u_colorFilterType == 2.0) {
          // Sepia
          col = vec3(
            dot(col, vec3(0.393, 0.769, 0.189)),
            dot(col, vec3(0.349, 0.686, 0.168)),
            dot(col, vec3(0.272, 0.534, 0.131))
          );
        } else if (u_colorFilterType == 3.0) {
          col = vec3(1.0) - col;
        } else if (u_colorFilterType == 4.0) {
          // Brightness+
          col = min(col * 1.3, 1.0);
        } else if (u_colorFilterType == 5.0) {
          // Contrast+
          col = (col - 0.5) * 1.5 + 0.5;
        } else if (u_colorFilterType == 6.0) {
          // Hue Rotate (simple, rotates RGB channels)
          col = col.rgb;
          col = vec3(col.g, col.b, col.r);
        } else if (u_colorFilterType == 7.0) {
          // Posterize
          col = floor(col * 4.0) / 4.0;
        } else if (u_colorFilterType == 8.0) {
          // Threshold
          float avg = (col.r + col.g + col.b) / 3.0;
          col = avg > 0.5 ? vec3(1.0) : vec3(0.0);
        } else if (u_colorFilterType == 9.0) {
          // Red Only
          col = vec3(col.r, 0.0, 0.0);
        } else if (u_colorFilterType == 10.0) {
          // Green Only
          col = vec3(0.0, col.g, 0.0);
        } else if (u_colorFilterType == 11.0) {
          // Blue Only
          col = vec3(0.0, 0.0, col.b);
        } else if (u_colorFilterType == 12.0) {
          // Tint Blue
          col = mix(col, vec3(0.2, 0.4, 1.0), 0.4);
        } else if (u_colorFilterType == 13.0) {
          // Tint Red
          col = mix(col, vec3(1.0, 0.2, 0.2), 0.4);
        } else if (u_colorFilterType == 14.0) {
          // Tint Yellow
          col = mix(col, vec3(1.0, 1.0, 0.2), 0.4);
        }

        // --- True hue shift (after all filters) ---
        col = hueRotate(col, u_hueShift * 3.14159 / 180.0);

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const vsh = this.createShader(this.gl, this.gl.VERTEX_SHADER, vs);
    const fsh = this.createShader(this.gl, this.gl.FRAGMENT_SHADER, fs);
    this.program = this.createProgram(this.gl, vsh, fsh);

    const g = this.gl;
    this.a_position = g.getAttribLocation(this.program, 'a_position');
    this.u_time = g.getUniformLocation(this.program, 'u_time')!;
    this.u_audio = g.getUniformLocation(this.program, 'u_audio')!;

    this.u_hueShift = g.getUniformLocation(this.program, 'u_hueShift')!;
    this.u_saturation = g.getUniformLocation(this.program, 'u_saturation')!;
    this.u_brightness = g.getUniformLocation(this.program, 'u_brightness')!;

    this.u_shapeScale = g.getUniformLocation(this.program, 'u_shapeScale')!;
    this.u_shapeRotation = g.getUniformLocation(this.program, 'u_shapeRotation')!;
    this.u_shapeTranslation = g.getUniformLocation(this.program, 'u_shapeTranslation')!;
    this.u_shapeDistortion = g.getUniformLocation(this.program, 'u_shapeDistortion')!;
    this.u_shapeMorphing = g.getUniformLocation(this.program, 'u_shapeMorphing')!;
    this.u_shapeRipple = g.getUniformLocation(this.program, 'u_shapeRipple')!;
    this.u_shapeMaster = g.getUniformLocation(this.program, 'u_shapeMaster')!;

    this.u_oscillation = g.getUniformLocation(this.program, 'u_oscillation')!;
    this.u_pulsation = g.getUniformLocation(this.program, 'u_pulsation')!;
    this.u_speed = g.getUniformLocation(this.program, 'u_speed')!;

    this.u_noiseDeformation = g.getUniformLocation(this.program, 'u_noiseDeformation')!;
    this.u_fractal = g.getUniformLocation(this.program, 'u_fractal')!;

    this.u_texNoise = g.getUniformLocation(this.program, 'u_texNoise')!;
    this.u_glitch = g.getUniformLocation(this.program, 'u_glitch')!;
    this.u_texturing = g.getUniformLocation(this.program, 'u_texturing')!;
    this.u_pixelation = g.getUniformLocation(this.program, 'u_pixelation')!;
    this.u_mosaic = g.getUniformLocation(this.program, 'u_mosaic')!;
    this.u_blend = g.getUniformLocation(this.program, 'u_blend')!;
    this.u_masterTexture = g.getUniformLocation(this.program, 'u_masterTexture')!;

    this.u_hz60 = g.getUniformLocation(this.program, 'u_hz60')!;
    this.u_hz170 = g.getUniformLocation(this.program, 'u_hz170')!;
    this.u_hz400 = g.getUniformLocation(this.program, 'u_hz400')!;
    this.u_hz1khz = g.getUniformLocation(this.program, 'u_hz1khz')!;
    this.u_hz2_5khz = g.getUniformLocation(this.program, 'u_hz2_5khz')!;
    this.u_hz6khz = g.getUniformLocation(this.program, 'u_hz6khz')!;
    this.u_hz15khz = g.getUniformLocation(this.program, 'u_hz15khz')!;
    this.u_masterAmp = g.getUniformLocation(this.program, 'u_masterAmp')!;

    this.u_colorFilterType = g.getUniformLocation(this.program, 'u_colorFilterType')!;
    this.u_templateOption = g.getUniformLocation(this.program, 'u_templateOption')!;
    this.u_color0 = g.getUniformLocation(this.program, 'u_color0')!;
    this.u_color1 = g.getUniformLocation(this.program, 'u_color1')!;
    this.u_color2 = g.getUniformLocation(this.program, 'u_color2')!;
    this.u_color3 = g.getUniformLocation(this.program, 'u_color3')!;
    this.u_color4 = g.getUniformLocation(this.program, 'u_color4')!;

    const quad = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
    this.positionBuffer = g.createBuffer()!;
    g.bindBuffer(g.ARRAY_BUFFER, this.positionBuffer);
    g.bufferData(g.ARRAY_BUFFER, quad, g.STATIC_DRAW);
  }

  private render() {
    const gl       = this.gl;
    const analyser = this.audioSvc.analyserNode;
  
    /* ─── 1.  FFT ➜ per-band amplitudes (scaled by each slider) ─── */
    const sa    = this.settings.spectrumAmplitude;
    const gains = [
      sa.hz60, sa.hz170, sa.hz400, sa.hz1khz,
      sa['hz2_5khz'], sa.hz6khz, sa.hz15khz
    ];
    const bandAmps = new Float32Array(7);
  
    /* overall loudness before the master fader */
    let audioVal = this.audioLevel;                 // fallback if analyser == null
  
    if (analyser) {
      const binCount = analyser.frequencyBinCount;
      if (!this.freqData || this.freqData.length !== binCount) {
        this.freqData = new Uint8Array(binCount);
      }
      analyser.getByteFrequencyData(this.freqData);
  
      const binHz = analyser.context.sampleRate / analyser.fftSize;
      let sum = 0;
  
      for (let i = 0; i < this.bandFreqs.length; i++) {
        const bin   = Math.min(binCount - 1, Math.round(this.bandFreqs[i] / binHz));
        const raw   = this.freqData[bin] / 255;          // 0-1 linear
        const curved = Math.pow(raw, 1.7);               // little boost
        const amp   = curved * gains[i];                 // per-band gain
        bandAmps[i] = amp;
  
        sum += curved;                                   // for overall loudness
      }
      audioVal = sum / this.bandFreqs.length;            // plain average 0-1
    }
  
    /* ─── 2.  Apply master slider to the global value ─── */
    const master = sa.master;                // 0-1 from the UI
    const scaledAudio = audioVal * master;   // if master = 0 ➜ 0
  
    /* ─── 3.  Draw ─── */
    const canvas = this.canvasRef.nativeElement;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
  
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.a_position);
    gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);
  
    const t = performance.now() * 0.001;
    gl.uniform1f(this.u_time,  t);
    gl.uniform1f(this.u_audio, scaledAudio);   // <── now GLOBAL × master
  
    /* ---- Color Effects -------------------------------------------------------- */
    const ce = this.settings.colorEffects;
    gl.uniform1f(this.u_hueShift,   ce.hueShift   + scaledAudio * 10.0);
    gl.uniform1f(this.u_saturation, ce.saturation * (1.0 + scaledAudio * 0.5));
    gl.uniform1f(this.u_brightness, ce.brightness * (1.0 + scaledAudio * 0.5));
  
    /* ---- Shape & Geometry ----------------------------------------------------- */
    const sge = this.settings.shapeGeometryEffects;
    const shapeMaster = sge.master;
    gl.uniform1f(this.u_shapeScale, sge.scale * (1.0 + scaledAudio * 0.3));
    gl.uniform1f(this.u_shapeRotation,   (sge.rotation * shapeMaster + scaledAudio * 10.0) * 0.0174533);
    gl.uniform1f(this.u_shapeTranslation, sge.translation * shapeMaster * scaledAudio);
    gl.uniform1f(this.u_shapeDistortion,  sge.distortion * shapeMaster * scaledAudio);
    gl.uniform1f(this.u_shapeMorphing,    sge.morphing * shapeMaster * scaledAudio);
    gl.uniform1f(this.u_shapeRipple,      sge.ripple * shapeMaster * scaledAudio * 0.5);
    gl.uniform1f(this.u_shapeMaster,      shapeMaster * (1.0 + scaledAudio * 0.5));
  
    /* ---- Motion & Temporal ---------------------------------------------------- */
    const mte = this.settings.motionTemporalEffects;
    gl.uniform1f(this.u_oscillation, mte.oscillation);
    gl.uniform1f(this.u_pulsation,   mte.pulsation);
    gl.uniform1f(this.u_speed,       mte.speed * (1.0 + scaledAudio * 0.5));
  
    /* ---- Toggles -------------------------------------------------------------- */
    gl.uniform1f(this.u_noiseDeformation,
                 this.settings.noiseDeformation === 'option1' ? 1.0 : 0.0);
    gl.uniform1f(this.u_fractal,
                 this.settings.fractalKaleidoscopicEffects === 'option1' ? 1.0 : 0.0);
  
    /* ---- Texture & Special Effects ------------------------------------------- */
    const tse = this.settings.textureSpecialEffects;
    const textureMaster = tse.master;
    gl.uniform1f(this.u_texNoise,      tse.noise * textureMaster * scaledAudio);
    gl.uniform1f(this.u_glitch,        tse.glitch * textureMaster * scaledAudio);
    gl.uniform1f(this.u_texturing,     tse.texturing * textureMaster * scaledAudio);
    gl.uniform1f(this.u_pixelation,    tse.pixelation * textureMaster);
    gl.uniform1f(this.u_mosaic,        tse.mosaic * textureMaster);
    gl.uniform1f(this.u_blend,         tse.blend * textureMaster * scaledAudio);
    gl.uniform1f(this.u_masterTexture, textureMaster);
  
    /* ---- Spectrum & Amplitude (per-band) ------------------------------------- */
    gl.uniform1f(this.u_hz60,     bandAmps[0]);
    gl.uniform1f(this.u_hz170,    bandAmps[1]);
    gl.uniform1f(this.u_hz400,    bandAmps[2]);
    gl.uniform1f(this.u_hz1khz,   bandAmps[3]);
    gl.uniform1f(this.u_hz2_5khz, bandAmps[4]);
    gl.uniform1f(this.u_hz6khz,   bandAmps[5]);
    gl.uniform1f(this.u_hz15khz,  bandAmps[6]);
  
    /* (u_masterAmp is not needed now; keep if shader still references it) */
    gl.uniform1f(this.u_masterAmp, master);
  
    /* ---- Color Filter Type ---- */
    let filterType = 0.0;
    switch (this.settings.colorFilter) {
      case 'none': filterType = 0.0; break;
      case 'grayscale': filterType = 1.0; break;
      case 'sepia': filterType = 2.0; break;
      case 'invert': filterType = 3.0; break;
      case 'brightnessUp': filterType = 4.0; break;
      case 'contrastUp': filterType = 5.0; break;
      case 'hueRotate': filterType = 6.0; break;
      case 'posterize': filterType = 7.0; break;
      case 'threshold': filterType = 8.0; break;
      case 'redOnly': filterType = 9.0; break;
      case 'greenOnly': filterType = 10.0; break;
      case 'blueOnly': filterType = 11.0; break;
      case 'tintBlue': filterType = 12.0; break;
      case 'tintRed': filterType = 13.0; break;
      case 'tintYellow': filterType = 14.0; break;
      default: filterType = 0.0;
    }
    gl.uniform1f(this.u_colorFilterType, filterType);
    let tempType = 0.0;
    switch (this.settings.templateOption) {
      case 'option1': tempType = 0.0; break;
      case 'option2': tempType = 1.0; break;
      case 'option3': tempType = 2.0; break;
      default: tempType = 0.0;
    }
    gl.uniform1f(this.u_templateOption, tempType);
  
    // Set color uniforms from settings.colors (assume hex strings)
    function hexToRgbNorm(hex: string) {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
      const num = parseInt(hex, 16);
      return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
    }
    const colorArr = this.settings.colors.map(hexToRgbNorm);
    gl.uniform3fv(this.u_color0, colorArr[0] || [1,1,1]);
    gl.uniform3fv(this.u_color1, colorArr[1] || [1,1,1]);
    gl.uniform3fv(this.u_color2, colorArr[2] || [1,1,1]);
    gl.uniform3fv(this.u_color3, colorArr[3] || [1,1,1]);
    gl.uniform3fv(this.u_color4, colorArr[4] || [1,1,1]);
  
    /* ---- Draw ---------------------------------------------------------------- */
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
