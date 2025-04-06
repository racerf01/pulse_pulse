import { Component, ElementRef, EventEmitter, Input, Output, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-small-knob',
  standalone: false,
  templateUrl: './small-knob.component.html',
  styleUrl: './small-knob.component.scss'
})
export class SmallKnobComponent {
  @Input() label?: string;
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

  rotate(event: MouseEvent) {
    const deltaX = event.clientX - this.centerX;
    const deltaY = event.clientY - this.centerY;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    // Adjust so 0° is at the top.
    this.angle = angle + 90;
    
    // Optional: Emit a normalized value (e.g. 0 to 1)
    // let normalizedValue = ((this.angle % 360) + 360) % 360 / 360;
    // this.valueChange.emit(normalizedValue);

    // Here, we're simply emitting the raw angle.
    this.valueChange.emit(this.angle);
  }

  stopRotation() {
    if (this.moveListener) { this.moveListener(); }
    if (this.upListener) { this.upListener(); }
  }
}
