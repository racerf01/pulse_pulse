import { Component, Output, EventEmitter } from '@angular/core';

interface WebGlConfig {
  projectName: string;
  colors: {
    hex: string;
  };
  colorEffects: {
    hueShift: number;
    saturation: number;
    brightness: number;
  };
  colorFilter: string;
  shapeGeometryEffects: {
    scale: number;
    rotation: number;
    translation: number;
    distortion: number;
    morphing: number;
    ripple: number;
    master: number;
  };
  noiseDeformation: string;
  motionTemporalEffects: {
    oscillation: number;
    pulsation: number;
    speed: number;
  };
  fractalKaleidoscopicEffects: string;
  textureSpecialEffects: {
    noise: number;
    glitch: number;
    texturing: number;
    pixelation: number;
    mosaic: number;
    blend: number;
    master: number;
  };
  spectrumAmplitude: {
    hz60: number;
    hz170: number;
    hz400: number;
    hz1khz: number;
    hz2_5khz: number;
    hz6khz: number;
    hz15khz: number;
    master: number;
  };
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: false
})

export class SidebarComponent {
  @Output() settingsChange = new EventEmitter<WebGlConfig>();

  // Default configuration values
  projectName: string = 'Untitled';
  inputOption: string = 'option1';
  
  // Colors defined as a hex string
  colors = { hex: '#ffffff' };

  colorEffects = { hueShift: 0, saturation: 1, brightness: 1 };
  colorFilter: string = 'option1';
  shapeGeometryEffects = {
    scale: 1,
    rotation: 0,
    translation: 0,
    distortion: 0,
    morphing: 0,
    ripple: 0,
    master: 1
  };
  noiseDeformation: string = 'option1';
  motionTemporalEffects = { oscillation: 1, pulsation: 1, speed: 1 };
  fractalKaleidoscopicEffects: string = 'option1';
  textureSpecialEffects = {
    noise: 0,
    glitch: 0,
    texturing: 0,
    pixelation: 0,
    mosaic: 0,
    blend: 0,
    master: 1
  };
  spectrumAmplitude = {
    hz60: 0,
    hz170: 0,
    hz400: 0,
    hz1khz: 0,
    hz2_5khz: 0,
    hz6khz: 0,
    hz15khz: 0,
    master: 1
  };

  onChange() {
    const settings: WebGlConfig = {
      projectName: this.projectName,
      colors: this.colors,
      colorEffects: this.colorEffects,
      colorFilter: this.colorFilter,
      shapeGeometryEffects: this.shapeGeometryEffects,
      noiseDeformation: this.noiseDeformation,
      motionTemporalEffects: this.motionTemporalEffects,
      fractalKaleidoscopicEffects: this.fractalKaleidoscopicEffects,
      textureSpecialEffects: this.textureSpecialEffects,
      spectrumAmplitude: this.spectrumAmplitude
    };

    console.log('Sidebar emitting settings:', settings);
    this.settingsChange.emit(settings);
  }

  updateShapeEffect(effectName: string, value: number) {
    this.shapeGeometryEffects = {
      ...this.shapeGeometryEffects,
      [effectName]: value
    };
    this.onChange();
  }

  // Example update method for spectrum amplitude
  updateSpectrum(freqLabel: string, value: number) {
    this.spectrumAmplitude = {
      ...this.spectrumAmplitude,
      [freqLabel]: value
    };
    this.onChange();
  }

  updateMaster(value: number) {
    this.textureSpecialEffects = {
      ...this.textureSpecialEffects,
      master: value
    };
    // Call onChange() to emit the updated configuration
    this.onChange();
  }

  updateMasterSlider(value: number) {
    this.spectrumAmplitude = {
      ...this.spectrumAmplitude,
      master: value  // or you might normalize the value as needed
    };
    this.onChange();
  }
  
  updateDropdown(field: string, event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;

    // Update the correct property based on the field name
    if (field === 'inputOption') {
      this.inputOption = value;
    } else if (field === 'colorFilter') {
      this.colorFilter = value;
    } else if (field === 'noiseDeformation') {
      this.noiseDeformation = value;
    } else if (field === 'fractalKaleidoscopicEffects') {
      this.fractalKaleidoscopicEffects = value;
    }
    // Optionally log or perform other tasks here

    this.onChange();
  }
}
