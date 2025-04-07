import { Component, ElementRef, EventEmitter, Input, Output, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-small-knob',
  templateUrl: './small-knob.component.html',
  styleUrls: ['./small-knob.component.scss'],
  standalone: false
})
export class SmallKnobComponent {
  @Input() label?: string;
  @Input() min: number = 0;    // Example: 0
  @Input() max: number = 360;  // Example: 360
  @Output() valueChange: EventEmitter<number> = new EventEmitter<number>();

  angle = 0;
  
  private centerX!: number;
  private centerY!: number;
  private moveListener!: () => void;
  private upListener!: () => void;

  constructor(private renderer: Renderer2, private elRef: ElementRef) {}

  startRotation(event: MouseEvent) {
    event.preventDefault();
    const rotatingEl = this.elRef.nativeElement.querySelector('.knob-rotating');
    const rect = rotatingEl.getBoundingClientRect();
    this.centerX = rect.left + rect.width / 2;
    this.centerY = rect.top + rect.height / 2;
    this.moveListener = this.renderer.listen('window', 'mousemove', (e) => this.rotate(e));
    this.upListener = this.renderer.listen('window', 'mouseup', () => this.stopRotation());
  }

  mapAngleToValue(rawAngle: number): number {
    return this.min + (rawAngle / 360) * (this.max - this.min);
  }

  rotate(event: MouseEvent) {
    const deltaX = event.clientX - this.centerX;
    const deltaY = event.clientY - this.centerY;
    let rawAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
    if (rawAngle < 0) {
      rawAngle += 360;
    }
    this.angle = rawAngle;
    const mappedValue = this.mapAngleToValue(rawAngle);
    this.valueChange.emit(mappedValue);
  }

  stopRotation() {
    if (this.moveListener) { this.moveListener(); }
    if (this.upListener) { this.upListener(); }
  }
}
