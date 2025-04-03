import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'my-app';

  // This object holds the current settings for the WebGL animations.
  currentSettings: any = {
    oscillationFrequency: 1,
    oscillationAmplitude: 1,
    feedbackEnabled: false,
    blurType: 'gaussian',
    blurIntensity: 5,
    timeRemapSpeed: 1
  };

  // This method updates the settings based on the values emitted by the Sidebar.
  updateSettings(newSettings: any) {
    this.currentSettings = { ...newSettings };
  }
}
