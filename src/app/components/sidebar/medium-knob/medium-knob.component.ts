import { Component, ElementRef, Input, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-medium-knob',
  standalone: false,
  templateUrl: './medium-knob.component.html',
  styleUrl: './medium-knob.component.scss'
})
export class MediumKnobComponent {
  @Input() label?: string;
  angle = 0;

  private centerX!: number;
  private centerY!: number;
  private moveListener!: () => void;
  private upListener!: () => void;

  constructor(private renderer: Renderer2, private elRef: ElementRef) {}

  startRotation(event: MouseEvent) {
    event.preventDefault();

    // The container that rotates is .knob-rotating
    const rotatingEl = this.elRef.nativeElement.querySelector('.knob-rotating');
    const rect = rotatingEl.getBoundingClientRect();

    this.centerX = rect.left + rect.width / 2;
    this.centerY = rect.top + rect.height / 2;

    // Listen for mouse moves on the window
    this.moveListener = this.renderer.listen('window', 'mousemove', (e) => this.rotate(e));
    this.upListener = this.renderer.listen('window', 'mouseup', () => this.stopRotation());
  }

  rotate(event: MouseEvent) {
    const deltaX = event.clientX - this.centerX;
    const deltaY = event.clientY - this.centerY;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // If you want 0° to be at the top, add 90 degrees
    this.angle = angle + 90;
  }

  stopRotation() {
    if (this.moveListener) this.moveListener();
    if (this.upListener) this.upListener();
  }
}
