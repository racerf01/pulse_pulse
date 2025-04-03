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

  // This function will be called when the sidebar emits new settings.
  updateSettings(newSettings: any) {
    console.log('AppComponent received settings:', newSettings);
    this.currentSettings = { ...newSettings };
  }  
}
