import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'], 
  standalone: false
})
export class SidebarComponent {
  @Output() settingsChange = new EventEmitter<any>();

  // Define default settings for the motion & temporal effects
  oscillationFrequency: number = 1;
  oscillationAmplitude: number = 1;
  feedbackEnabled: boolean = false;
  blurType: string = 'gaussian';
  blurIntensity: number = 5;
  timeRemapSpeed: number = 1;

  // Emit the updated settings whenever a control changes
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
