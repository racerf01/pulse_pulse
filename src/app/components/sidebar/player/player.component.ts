import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { AudioInputService, AudioSourceKind } from '../../../services/audio-input.service';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  standalone: false
})
export class PlayerComponent implements AfterViewInit {
  @ViewChild('audioRef', { static: false }) audioRef!: ElementRef<HTMLAudioElement>;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  constructor(private audioSvc: AudioInputService) { }  

  // Initial audio source is set to a default sample file.
  audioSrc: string = 'assets/sample.mp3';
  isPlaying = false;
  currentTime = 0;
  duration = 0;

  ngAfterViewInit(): void {
    this.audioSvc.connectMediaElement(this.audioRef.nativeElement);
  }

  /**
   * Called after audio metadata is loaded and we know the duration.
   */
  onLoadedMetadata(event: Event): void {
    const audioEl = event.target as HTMLAudioElement;
    this.duration = audioEl.duration;
  }

  /**
   * Called continuously as the audio is playing.
   */
  onTimeUpdate(event: Event): void {
    const audioEl = event.target as HTMLAudioElement;
    this.currentTime = audioEl.currentTime;
  }

  /**
   * Toggle play/pause.
   */
  togglePlay(): void {
    const audioEl = this.audioRef.nativeElement;
    if (this.isPlaying) {
      audioEl.pause();
    } else {
      audioEl.play();
    }
    this.isPlaying = !this.isPlaying;
  }

  /**
   * Seek backward 10 seconds.
   */
  seekBackward(): void {
    const audioEl = this.audioRef.nativeElement;
    audioEl.currentTime = Math.max(0, audioEl.currentTime - 10);
  }

  /**
   * Seek forward 10 seconds.
   */
  seekForward(): void {
    const audioEl = this.audioRef.nativeElement;
    audioEl.currentTime = Math.min(this.duration, audioEl.currentTime + 10);
  }

  /**
   * Handler for clicking on the progress bar.
   * It calculates the new time based on click position.
   */
  onSeekClick(event: MouseEvent): void {
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const ratio = clickX / rect.width;
    const newTime = ratio * this.duration;
    this.audioRef.nativeElement.currentTime = newTime;
  }

  /**
   * Getter to calculate current progress percentage.
   */
  get progressPercentage(): number {
    return this.duration ? (this.currentTime / this.duration) * 100 : 0;
  }

  /**
   * Reset state when audio ends.
   */
  onEnded(): void {
    this.isPlaying = false;
    this.currentTime = 0;
  }

  /**
   * Trigger the hidden file input to select a music file.
   */
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * Handle the file selection and load the selected music file.
   */
  onFileSelected(evt: Event): void {
    const file = (evt.target as HTMLInputElement).files?.[0];
    if (!file) { return; }

    const url = URL.createObjectURL(file);
    const el  = this.audioRef.nativeElement;
    el.src = url; el.load(); el.play();
    this.isPlaying = true;
  }
}
