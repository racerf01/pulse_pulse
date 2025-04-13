import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent {
  title = 'my-app';

  // Initial settings (will be overridden by the random generator)
  currentSettings: any = {
    projectName: 'Default Animation',
    colors: { hex: '#ffffff' },
    colorEffects: { hueShift: 0, saturation: 1, brightness: 1 },
    colorFilter: 'option1',
    shapeGeometryEffects: { 
      scale: 1, rotation: 0, translation: 0, 
      distortion: 0, morphing: 0, ripple: 0, master: 1 
    },
    noiseDeformation: 'option1',
    motionTemporalEffects: { oscillation: 1, pulsation: 1, speed: 1 },
    fractalKaleidoscopicEffects: 'option1',
    textureSpecialEffects: { 
      noise: 0, glitch: 0, texturing: 0, pixelation: 0, 
      mosaic: 0, blend: 0, master: 1 
    },
    spectrumAmplitude: { 
      hz60: 0, hz170: 0, hz400: 0, hz1khz: 0, 
      hz2_5khz: 0, hz6khz: 0, hz15khz: 0, master: 1 
    }
  };

  // Called when sidebar emits new settings.
  updateSettings(newSettings: any) {
    console.log('AppComponent received settings:', newSettings);
    this.currentSettings = { ...newSettings };
  }

  // Helper to pad random color codes to ensure six-digit hex codes.
  private getRandomColor(): string {
    return '#' + Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0');
  }

  // Generates new random settings and assigns them to currentSettings.
  generateRandomShaderSource(): string {
    // Generate random parameters for each building block.
    const oscFreq = (Math.random() * 10 + 1).toFixed(2);
    const oscAmp = (Math.random() * 2).toFixed(2);
    const rotateAngle = (Math.random() * 6.28).toFixed(2); // 0 to 2π radians
    const colorMix = [
      Math.random().toFixed(2),
      Math.random().toFixed(2),
      Math.random().toFixed(2)
    ].join(', ');
  
    // You can also decide randomly whether to include some operations.
    const includeRotation = Math.random() > 0.5;
    const includeColorMix  = Math.random() > 0.5;
    const includeAudioMod  = Math.random() > 0.5;
  
    // Begin building the shader string.
    let shaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform float u_audio;
      varying vec2 v_uv;
      
      // --- Function definitions ---
      vec3 osc(vec2 uv, float freq, float amp) {
        return vec3(
          sin(uv.x * freq + u_time * amp),
          sin(uv.y * freq + u_time * amp),
          sin((uv.x + uv.y) * freq + u_time * amp)
        );
      }
      
      vec2 rotate(vec2 uv, float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
      }
      
      // Main function: chain operations based on random settings.
      void main() {
        vec2 uv = v_uv;
    `;
  
    // Optionally apply a rotation.
    if (includeRotation) {
      shaderSource += `
        uv = rotate(uv, ${rotateAngle});
      `;
    }
  
    // Base operation: use the oscillator function.
    shaderSource += `
        vec3 col = osc(uv, ${oscFreq}, ${oscAmp});
    `;
  
    // Optionally mix in color adjustment.
    if (includeColorMix) {
      shaderSource += `
        col *= vec3(${colorMix});
      `;
    }
  
    // Optionally modulate with audio.
    if (includeAudioMod) {
      // For instance, add a fraction of the audio input to each channel.
      shaderSource += `
        col += u_audio * 0.3;
      `;
    }
  
    // You could add further operations (like blending with another osc call,
    // subtracting or differencing layers, etc.) here, composing a dynamic chain.
    shaderSource += `
        gl_FragColor = vec4(col, 1.0);
      }
    `;
  
    return shaderSource;
  }  
}
