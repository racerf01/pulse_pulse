import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'], 
  standalone: false
})
export class SidebarComponent {
  @Output() settingsChange = new EventEmitter<any>();

  // Define default settings
  oscillationFrequency: number = 1;
  oscillationAmplitude: number = 1;
  feedbackEnabled: boolean = false;
  blurType: string = 'gaussian';
  blurIntensity: number = 5;
  timeRemapSpeed: number = 1;

  // Emit updated settings when any control is changed.
  onChange() {
    this.settingsChange.emit({
      oscillationFrequency: this.oscillationFrequency,
      oscillationAmplitude: this.oscillationAmplitude,
      feedbackEnabled: this.feedbackEnabled,
      blurType: this.blurType,
      blurIntensity: this.blurIntensity,
      timeRemapSpeed: this.timeRemapSpeed
    });
  }
}
