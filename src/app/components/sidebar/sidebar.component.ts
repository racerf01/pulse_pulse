// sidebar.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { AudioInputService, AudioSourceKind } from '../../services/audio-input.service';

export interface WebGlConfig {
  projectName: string;
  colors: { hex: string };
  colorEffects: { hueShift: number; saturation: number; brightness: number };
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
  motionTemporalEffects: { oscillation: number; pulsation: number; speed: number };
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
export class SidebarComponent implements OnChanges {
  @Input() settings!: WebGlConfig;
  @Output() settingsChange = new EventEmitter<WebGlConfig>();

  @ViewChild('optionsContainer', { static: true }) optionsContainer!: ElementRef;
  optionsOpen = false;

  // Local copies for binding:
  projectName = '';
  colors = { hex: '' };
  colorEffects = { hueShift: 0, saturation: 1, brightness: 1 };
  colorFilter = 'option1';
  shapeGeometryEffects = { scale: 1, rotation: 0, translation: 0, distortion: 0, morphing: 0, ripple: 0, master: 1 };
  noiseDeformation = 'option1';
  motionTemporalEffects = { oscillation: 1, pulsation: 1, speed: 1 };
  fractalKaleidoscopicEffects = 'option1';
  textureSpecialEffects = { noise: 0, glitch: 0, texturing: 0, pixelation: 0, mosaic: 0, blend: 0, master: 1 };
  spectrumAmplitude = { hz60: 0, hz170: 0, hz400: 0, hz1khz: 0, hz2_5khz: 0, hz6khz: 0, hz15khz: 0, master: 1 };

  // Ranges (for knobs)
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

  constructor(private audioSvc: AudioInputService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['settings'] && this.settings) {
      const s = this.settings;
      this.projectName               = s.projectName;
      this.colors                    = { ...s.colors };
      this.colorEffects              = { ...s.colorEffects };
      this.colorFilter               = s.colorFilter;
      this.shapeGeometryEffects      = { ...s.shapeGeometryEffects };
      this.noiseDeformation          = s.noiseDeformation;
      this.motionTemporalEffects     = { ...s.motionTemporalEffects };
      this.fractalKaleidoscopicEffects = s.fractalKaleidoscopicEffects;
      this.textureSpecialEffects     = { ...s.textureSpecialEffects };
      this.spectrumAmplitude         = { ...s.spectrumAmplitude };
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.optionsOpen && !this.optionsContainer.nativeElement.contains(event.target)) {
      this.optionsOpen = false;
    }
  }

  toggleOptions() {
    this.optionsOpen = !this.optionsOpen;
  }

  importProject() { /* … */ this.optionsOpen = false; }
  exportProject() { /* … */ this.optionsOpen = false; }

  public emitChange() {
    this.settingsChange.emit({
      projectName: this.projectName,
      colors:      this.colors,
      colorEffects: this.colorEffects,
      colorFilter:  this.colorFilter,
      shapeGeometryEffects: this.shapeGeometryEffects,
      noiseDeformation:      this.noiseDeformation,
      motionTemporalEffects: this.motionTemporalEffects,
      fractalKaleidoscopicEffects: this.fractalKaleidoscopicEffects,
      textureSpecialEffects: this.textureSpecialEffects,
      spectrumAmplitude:     this.spectrumAmplitude
    });
  }

  updateDropdown(field: string, evt: Event) {
    const v = (evt.target as HTMLSelectElement).value;
    switch (field) {
      case 'colorFilter': this.colorFilter = v; break;
      case 'noiseDeformation': this.noiseDeformation = v; break;
      case 'fractalKaleidoscopicEffects': this.fractalKaleidoscopicEffects = v; break;
      // add other dropdowns here…
    }
    this.emitChange();
  }

  updateColorEffect(name: keyof typeof this.colorEffects, val: number) {
    (this.colorEffects as any)[name] = val;
    this.emitChange();
  }

  updateShapeEffect(name: keyof typeof this.shapeGeometryEffects, val: number) {
    (this.shapeGeometryEffects as any)[name] = val;
    this.emitChange();
  }

  updateMotionTemporalEffect(name: keyof typeof this.motionTemporalEffects, val: number) {
    (this.motionTemporalEffects as any)[name] = val;
    this.emitChange();
  }

  updateTextureEffect(name: keyof typeof this.textureSpecialEffects, val: number) {
    (this.textureSpecialEffects as any)[name] = val;
    this.emitChange();
  }

  updateSpectrum(freq: keyof typeof this.spectrumAmplitude, val: number) {
    (this.spectrumAmplitude as any)[freq] = val;
    this.emitChange();
  }

  updateMasterSlider(val: number) {
    this.spectrumAmplitude.master = val;
    this.emitChange();
  }

  // Resets:
  resetColorEffects() {
    this.colorEffects = { hueShift: 0, saturation: 0, brightness: 0 };
    this.emitChange();
  }
  resetShapeEffects() {
    this.shapeGeometryEffects = { scale: 0, rotation: 0, translation: 0, distortion: 0, morphing: 0, ripple: 0, master: 0 };
    this.emitChange();
  }
  resetMotionEffects() {
    this.motionTemporalEffects = { oscillation: 0, pulsation: 0, speed: 0 };
    this.emitChange();
  }
  resetTextureEffects() {
    this.textureSpecialEffects = { noise: 0, glitch: 0, texturing: 0, pixelation: 0, mosaic: 0, blend: 0, master: 0 };
    this.emitChange();
  }
  resetSpectrum() {
    this.spectrumAmplitude = { hz60: 0.5, hz170: 0.5, hz400: 0.5, hz1khz: 0.5, hz2_5khz: 0.5, hz6khz: 0.5, hz15khz: 0.5, master: 0.5 };
    this.emitChange();
  }
}
