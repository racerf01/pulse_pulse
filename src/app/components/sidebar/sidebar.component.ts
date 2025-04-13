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

  // Use separate properties:
  inputOption: string = 'option1';      // Default for Input dropdown
  templateOption: string = 'option1';     // Default for Template dropdown

  projectName: string = 'Untitled';
  colors = { hex: '#ffffff' };
  colorEffects = { hueShift: 0, saturation: 1, brightness: 1 };
  colorFilter: string = 'option1';
  shapeGeometryEffects = { scale: 1, rotation: 0, translation: 0, distortion: 0, morphing: 0, ripple: 0, master: 1 };
  noiseDeformation: string = 'option1';
  motionTemporalEffects = { oscillation: 1, pulsation: 1, speed: 1 };
  fractalKaleidoscopicEffects: string = 'option1';
  textureSpecialEffects = { noise: 0, glitch: 0, texturing: 0, pixelation: 0, mosaic: 0, blend: 0, master: 1 };
  spectrumAmplitude = { hz60: 0, hz170: 0, hz400: 0, hz1khz: 0, hz2_5khz: 0, hz6khz: 0, hz15khz: 0, master: 1 };

  // Knob range configuration remains unchanged
  knobRanges = {
    hueShift: { min: 0, max: 360 },
    saturation: { min: 0, max: 2 },
    brightness: { min: 0, max: 2 },
    scale: { min: 0.5, max: 5 },
    rotation: { min: 0, max: 360 },
    translation: { min: -100, max: 100 },
    distortion: { min: 0, max: 100 },
    morphing: { min: 0, max: 100 },
    ripple: { min: 0, max: 100 },
    master: { min: 0, max: 1 },
    oscillation: { min: 0, max: 10 },
    pulsation: { min: 0, max: 10 },
    speed: { min: 0, max: 10 },
    noise: { min: 0, max: 100 },
    glitch: { min: 0, max: 100 },
    texturing: { min: 0, max: 100 },
    pixelation: { min: 0, max: 100 },
    mosaic: { min: 0, max: 100 },
    blend: { min: 0, max: 100 },
    masterTexture: { min: 0, max: 1 },
    hz60: { min: 0, max: 1 },
    hz170: { min: 0, max: 1 },
    hz400: { min: 0, max: 1 },
    hz1khz: { min: 0, max: 1 },
    hz2_5khz: { min: 0, max: 1 },
    hz6khz: { min: 0, max: 1 },
    hz15khz: { min: 0, max: 1 },
    masterAmp: { min: 0, max: 1 }
  };

  // Toggle the options dropdown visibility
  optionsOpen: boolean = false;
  toggleOptions(): void {
    this.optionsOpen = !this.optionsOpen;
  }

  // Dummy functions for Import and Export project
  importProject(): void {
    console.log('Import Project clicked');
    // Close the dropdown after click
    this.optionsOpen = false;
  }

  exportProject(): void {
    console.log('Export Project clicked');
    // Close the dropdown after click
    this.optionsOpen = false;
  }

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

  // Update dropdown method: differentiate between input and template options.
  updateDropdown(field: string, event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    if (field === 'inputOption') {
      this.inputOption = value;
    } else if (field === 'templateOption') {
      this.templateOption = value;
    } else if (field === 'colorFilter') {
      this.colorFilter = value;
    } else if (field === 'noiseDeformation') {
      this.noiseDeformation = value;
    } else if (field === 'fractalKaleidoscopicEffects') {
      this.fractalKaleidoscopicEffects = value;
    }
    this.onChange();
  }

  // Other update methods remain unchanged...
  updateColorEffect(effectName: string, value: number) {
    this.colorEffects = { ...this.colorEffects, [effectName]: value };
    this.onChange();
  }

  updateShapeEffect(effectName: string, value: number) {
    this.shapeGeometryEffects = { ...this.shapeGeometryEffects, [effectName]: value };
    this.onChange();
  }

  updateMotionTemporalEffect(effectName: string, value: number) {
    this.motionTemporalEffects = { ...this.motionTemporalEffects, [effectName]: value };
    this.onChange();
  }

  updateTextureEffect(effectName: string, value: number) {
    this.textureSpecialEffects = { ...this.textureSpecialEffects, [effectName]: value };
    this.onChange();
  }

  updateSpectrum(freqLabel: string, value: number) {
    this.spectrumAmplitude = { ...this.spectrumAmplitude, [freqLabel]: value };
    this.onChange();
  }

  updateMasterSlider(value: number) {
    this.spectrumAmplitude = { ...this.spectrumAmplitude, master: value };
    this.onChange();
  }
}
