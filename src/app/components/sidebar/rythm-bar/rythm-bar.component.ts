import {
  Component, AfterViewInit, ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { AudioInputService } from '../../../services/audio-input.service';

@Component({
  selector   : 'app-rythm-bar',
  templateUrl: './rythm-bar.component.html',
  styleUrls  : ['./rythm-bar.component.scss'],
  standalone: false
})
export class RythmBarComponent implements AfterViewInit {

  /** seven LEDs */
  circles = Array<boolean>(7).fill(false);

  private data!: Uint8Array;

  constructor(
    private audioSvc: AudioInputService,
    private cd: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngAfterViewInit(): void {
    /* run the loop outside Angular to avoid hammering change‑detection */
    this.zone.runOutsideAngular(() => this.tick());
  }

  /** one frame loop */
  private tick = () => {
    const analyser = this.audioSvc.analyserNode;
    if (analyser) {
      // allocate FFT buffer once
      if (!this.data || this.data.length !== analyser.frequencyBinCount) {
        this.data = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteFrequencyData(this.data);
  
      // ── user‑tweakable bass range ──
      const minBassHz =  50;   // e.g. 50, not 20
      const maxBassHz = 500;      // up to 200Hz
  
      // compute which FFT bins correspond to that range
      const binHz    = analyser.context.sampleRate / analyser.fftSize;
      const minBin   = Math.ceil(minBassHz / binHz);
      const maxBin   = Math.floor(maxBassHz / binHz);
  
      // average only those bins
      let sum = 0;
      for (let i = minBin; i <= maxBin; i++) { sum += this.data[i]; }
      const count = maxBin - minBin + 1;
      const bass = sum / (count * 255);  // normalized 0–1
  
      // map to 0–7 LEDs (bottom‑to‑top via column‑reverse CSS)
      const lit = Math.round(bass * this.circles.length);
      this.circles = this.circles.map((_, i) => i < lit);
  
      // mark view for check back in Angular zone
      this.zone.run(() => this.cd.markForCheck());
    }
  
    requestAnimationFrame(this.tick);
  };  
}
