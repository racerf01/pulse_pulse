import { Injectable } from '@angular/core';
import {
  BehaviorSubject, Observable, interval, animationFrameScheduler
} from 'rxjs';

export enum AudioSourceKind { Microphone, File, System }

@Injectable({ providedIn: 'root' })
export class AudioInputService {
  private ctx!: AudioContext;
  private analyser!: AnalyserNode;
  private data!: Uint8Array;

  private mediaNode?: MediaElementAudioSourceNode | AudioBufferSourceNode;
  private streamNode?: MediaStreamAudioSourceNode;
  private systemStream?: MediaStream;

  private level$ = new BehaviorSubject<number>(0);
  get audioLevel$(): Observable<number> { return this.level$.asObservable(); }

  get analyserNode(): AnalyserNode | null {
    return this.analyser ?? null;
  }

  /* ───── bootstrap or no‑op ───── */
  private async ensureContext(): Promise<void> {
    if (this.ctx) { return; }

    this.ctx = new AudioContext();

    // resume audio context on any user gesture
    const resumeOnGesture = () => {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    };
    document.addEventListener('click', resumeOnGesture);
    document.addEventListener('keydown', resumeOnGesture);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.data = new Uint8Array(this.analyser.frequencyBinCount);

    /* 60‑fps RMS pump */
    interval(0, animationFrameScheduler).subscribe(() => {
      this.analyser.getByteFrequencyData(this.data);
      const rms = Math.hypot(...this.data) /
                  (255 * Math.sqrt(this.data.length));
      this.level$.next(rms);
    });
  }

  /* ───── public API ───── */

  /** change active input */
  async setInput(kind: AudioSourceKind, file?: File): Promise<void> {
    await this.ensureContext();
    await this.ctx.resume();                 // ← un‑suspend after user gesture

    /* clean out previous nodes */
    this.mediaNode?.disconnect();
    this.streamNode?.disconnect();
    this.mediaNode = this.streamNode = undefined;
    this.systemStream = undefined;

    switch (kind) {
      /* — mic — */
      case AudioSourceKind.Microphone: {
        const stream = await navigator.mediaDevices
                            .getUserMedia({ audio: true });
        this.streamNode = this.ctx.createMediaStreamSource(stream);
        this.streamNode.connect(this.analyser);
        break;
      }

      /* — system / tab audio — */
      case AudioSourceKind.System: {
        let ok = false;
        while (!ok) {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            audio : true,
            video : { width: 1, height: 1, frameRate: 1 } as any
          });
      
          if (stream.getAudioTracks().length) {
            /* success: wire up analyser */
            stream.getVideoTracks().forEach((t: MediaStreamTrack) => t.stop());
            this.systemStream = stream;
            this.streamNode = this.ctx.createMediaStreamSource(stream);
            this.streamNode.connect(this.analyser);
            ok = true;
          } else {
            /* user didn't tick audio – stop tracks and prompt again */
            stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
            alert('No audio track detected.\n'
                + 'Please pick "Entire screen" or "Chrome tab" and tick "Share audio".');
            /* loop will re‑prompt */
          }
        }
        break;
      }      

      /* — imported file — */
      case AudioSourceKind.File: {
        if (!file) { throw new Error('File input requires a File'); }
        const arrayBuf = await file.arrayBuffer();
        const buffer   = await this.ctx.decodeAudioData(arrayBuf);

        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.loop   = true;
        src.start();

        /* analyser + speakers */
        src.connect(this.analyser);
        src.connect(this.ctx.destination);

        this.mediaNode = src;
        break;
      }
    }
  }

  /** tap an existing <audio>/<video> element */
  async connectMediaElement(el: HTMLMediaElement): Promise<void> {
    await this.ensureContext();
    await this.ctx.resume();

    this.mediaNode?.disconnect();
    this.mediaNode = this.ctx.createMediaElementSource(el);
    this.mediaNode.connect(this.analyser);
    this.mediaNode.connect(this.ctx.destination);  // ← restore audibility
  }

  /** Returns the MediaStream used for system audio */
  public getSystemStream(): MediaStream | undefined {
    return this.systemStream;
  }
}
