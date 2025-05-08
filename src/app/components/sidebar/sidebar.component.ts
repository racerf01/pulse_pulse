import { Component, ElementRef, HostListener, Output, EventEmitter, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { AudioInputService, AudioSourceKind } from '../../services/audio-input.service';
import { Subscription } from 'rxjs';

interface WebGlConfig {
  projectName: string;
  templateOption: string;
  colors: string[];
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
export class SidebarComponent implements OnInit, OnDestroy {
  @Output() settingsChange = new EventEmitter<WebGlConfig>();

  constructor(private audioSvc: AudioInputService) {}

  // Template references
  @ViewChild('optionsContainer', { static: true })
  optionsContainer!: ElementRef;
  @ViewChild('fileInput')
  fileInput!: ElementRef<HTMLInputElement>;

  // Modal state for custom template prompt
  showTemplateModal: boolean = false;
  templatePromptText: string = '';

  // Use separate properties:
  inputOption: string = 'option1';      // Default for Input dropdown
  templateOption: string = 'option1';     // Default for Template dropdown

  projectName: string = 'Untitled';
  colors: string[] = [
    '#252732',
    '#5e3332',
    '#944236',
    '#e44d0e',
    '#f9833b'
  ];
  colorEffects = { hueShift: 0, saturation: 1, brightness: 1 };
  colorFilter: string = 'none';
  shapeGeometryEffects = { scale: 1, rotation: 0, translation: 0, distortion: 0, morphing: 0, ripple: 0, master: 1 };
  noiseDeformation: string = 'option1';
  motionTemporalEffects = { oscillation: 1, pulsation: 1, speed: 1 };
  fractalKaleidoscopicEffects: string = 'option1';
  textureSpecialEffects = { noise: 0, glitch: 0, texturing: 0, pixelation: 0, mosaic: 0, blend: 0, master: 1 };
  spectrumAmplitude = { hz60: 0, hz170: 0, hz400: 0, hz1khz: 0, hz2_5khz: 0, hz6khz: 0, hz15khz: 0, master: 1 };

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

  inputActive: boolean = false; // True if input is active
  blink: boolean = false;      // For blinking indicator
  blinkOpacity: number = 1;
  private blinkInterval: any;
  private audioLevel: number = 0;
  private blinkRaf: any;
  private audioLevelSub?: Subscription;
  // Recording support
  isRecording: boolean = false;
  private mediaRecorder?: MediaRecorder;
  private recordedChunks: Blob[] = [];
  private recorderMimeType?: string;

  ngOnInit(): void {
    this.switchInput(this.inputOption);   // start analyser on mic
    this.onChange();                      // emit initial settings
    this.subscribeToAudioLevel();
  }

  ngOnDestroy(): void {
    if (this.blinkInterval) clearInterval(this.blinkInterval);
    if (this.audioLevelSub) this.audioLevelSub.unsubscribe();
    if (this.blinkRaf) cancelAnimationFrame(this.blinkRaf);
  }

  private subscribeToAudioLevel() {
    this.audioLevelSub = this.audioSvc.audioLevel$.subscribe(level => {
      this.audioLevel = level;
      this.inputActive = level > 0.05;
      if (!this.blinkRaf) this.blinkWithAudio();
    });
  }

  private blinkWithAudio = () => {
    if (this.inputActive) {
      // Use a fixed sine wave for constant blinking
      const t = performance.now() * 0.004; // ~1.5 Hz blink
      this.blinkOpacity = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t));
    } else {
      this.blinkOpacity = 1;
    }
    this.blinkRaf = requestAnimationFrame(this.blinkWithAudio);
  }

  private switchInput(id: string): void {
    const map: Record<string, AudioSourceKind> = {
      option1: AudioSourceKind.Microphone, // "Default Microphone"
      option2: AudioSourceKind.File,       // "Music Import"
      option3: AudioSourceKind.System      // "Device Sounds"
    };
    this.audioSvc.setInput(map[id])
      .catch(err => {
        console.warn('Audio input rejected:', err);
        // Prompt user to resume audio context and retry
        if (confirm('Audio context is suspended. Click OK to resume audio.')) {
          this.audioSvc.setInput(map[id])
            .catch(retryErr => console.error('Retry failed:', retryErr));
        }
      });
  }

  // Dropdown open state
  optionsOpen: boolean = false;
  toggleOptions(): void {
    this.optionsOpen = !this.optionsOpen;
  }

  // Dummy actions for Import and Export
  importProject(): void {
    this.fileInput.nativeElement.click();
    this.optionsOpen = false;
  }

  exportProject(): void {
    const config: WebGlConfig = {
      projectName: this.projectName,
      templateOption: this.templateOption,
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
    const dataStr = JSON.stringify(config, null, 2);
    const blob = new Blob([dataStr], { type: 'application/x-pulse' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.projectName || 'project'}.pulse`;
    a.click();
    URL.revokeObjectURL(url);
    this.optionsOpen = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const config: WebGlConfig = JSON.parse(reader.result as string);
          this.projectName = config.projectName;
          this.templateOption = config.templateOption;
          this.colors = config.colors;
          this.colorEffects = config.colorEffects;
          this.colorFilter = config.colorFilter;
          this.shapeGeometryEffects = config.shapeGeometryEffects;
          this.noiseDeformation = config.noiseDeformation;
          this.motionTemporalEffects = config.motionTemporalEffects;
          this.fractalKaleidoscopicEffects = config.fractalKaleidoscopicEffects;
          this.textureSpecialEffects = config.textureSpecialEffects;
          this.spectrumAmplitude = config.spectrumAmplitude;
          this.onChange();
        } catch (err) {
          console.error('Failed to import project:', err);
        }
      };
      reader.readAsText(file);
      input.value = '';
      this.optionsOpen = false;
    }
  }

  // HostListener to close the dropdown on click outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.optionsOpen && !this.optionsContainer.nativeElement.contains(event.target)) {
      this.optionsOpen = false;
    }
  }

  onChange(): void {
    const cfg: WebGlConfig = {
      projectName: this.projectName,
      templateOption: this.templateOption,
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
    this.settingsChange.emit(cfg);
  }

  updateDropdown(field: string, evt: Event) {
    const value = (evt.target as HTMLSelectElement).value;

    if (field === 'inputOption') {
      this.inputOption = value;
      if (value !== 'option2') {          // avoid calling File with no file
        this.switchInput(value);
      }
    } else if (field === 'templateOption') {
      this.templateOption = value;
      if (value === 'option4') {
        this.showTemplateModal = true;
      }
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

  // Reset all knob‑based groups to 0
  resetColorEffects() {
    this.colorEffects = { hueShift: 0, saturation: 0, brightness: 0 };
    this.onChange();
  }

  resetShapeEffects() {
    this.shapeGeometryEffects = {
      scale: 0,
      rotation: 0,
      translation: 0,
      distortion: 0,
      morphing: 0,
      ripple: 0,
      master: 0
    };
    this.onChange();
  }

  resetMotionEffects() {
    this.motionTemporalEffects = { oscillation: 0, pulsation: 0, speed: 0 };
    this.onChange();
  }

  resetTextureEffects() {
    this.textureSpecialEffects = {
      noise: 0,
      glitch: 0,
      texturing: 0,
      pixelation: 0,
      mosaic: 0,
      blend: 0,
      master: 0
    };
    this.onChange();
  }

  // Reset sliders (0–1) to 0.5 (i.e. 50%)
  resetSpectrum() {
    this.spectrumAmplitude = {
      hz60: 0.5,
      hz170: 0.5,
      hz400: 0.5,
      hz1khz: 0.5,
      hz2_5khz: 0.5,
      hz6khz: 0.5,
      hz15khz: 0.5,
      master: 0.5
    };
    this.onChange();
  }

  updateColors(p: string[]) {
    this.colors = p;
    this.onChange();
  }

  /** Toggle recording on or off */
  toggleRecording(): void {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  private async startRecording(): Promise<void> {
    // Ensure system audio stream exists; only prompt if not already streaming
    let audioStream = this.audioSvc.getSystemStream();
    if (!audioStream) {
      try {
        await this.audioSvc.setInput(AudioSourceKind.System);
      } catch (err) {
        console.error('Failed to switch to system audio:', err);
        alert('Unable to access internal audio for recording.');
        return;
      }
      audioStream = this.audioSvc.getSystemStream();
    }
    if (!audioStream) {
      alert('Internal audio stream is not available.');
      return;
    }
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) {
      alert('Canvas element not found');
      return;
    }
    const videoStream = (canvas as any).captureStream(30);
    // Combine video and audio tracks
    const combinedStream = new MediaStream();
    videoStream.getVideoTracks().forEach((track: MediaStreamTrack) => combinedStream.addTrack(track));
    audioStream.getAudioTracks().forEach((track: MediaStreamTrack) => combinedStream.addTrack(track));
    this.recordedChunks = [];
    // Select a supported format: prefer MP4, then WebM
    let mimeType = '';
    if (MediaRecorder.isTypeSupported('video/mp4; codecs=h264')) {
      mimeType = 'video/mp4; codecs=h264';
    } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9,opus')) {
      mimeType = 'video/webm; codecs=vp9,opus';
    } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp8,opus')) {
      mimeType = 'video/webm; codecs=vp8,opus';
    }
    if (!mimeType) {
      alert('Your browser does not support MP4 or WebM recording.');
      return;
    }
    this.recorderMimeType = mimeType;
    this.mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };
    this.mediaRecorder.start();
    this.isRecording = true;
  }

  private stopRecording(): void {
    if (!this.mediaRecorder) { return; }
    this.mediaRecorder.onstop = () => {
      const type = this.recorderMimeType || 'video/webm';
      const ext = type.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(this.recordedChunks, { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${this.projectName || 'animation'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    this.mediaRecorder.stop();
    this.isRecording = false;
  }

  /** Handler for file import in modal */
  onTemplateFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const reader = new FileReader();
      reader.onload = () => {
        this.templatePromptText = reader.result as string;
      };
      reader.readAsText(input.files[0]);
      input.value = '';
    }
  }

  /** Apply the custom prompt and close modal */
  applyTemplatePrompt(): void {
    console.log('Applying custom template prompt:', this.templatePromptText);
    // TODO: integrate templatePromptText into your prompt workflow
    this.showTemplateModal = false;
  }

  /** Cancel and close the custom prompt modal */
  closeTemplateModal(): void {
    this.showTemplateModal = false;
    this.templatePromptText = '';
  }
}
