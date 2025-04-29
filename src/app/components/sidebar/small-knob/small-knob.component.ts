import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, Renderer2, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-small-knob',
  templateUrl: './small-knob.component.html',
  styleUrls: ['./small-knob.component.scss'],
  standalone: false
})
export class SmallKnobComponent implements OnInit, OnChanges {
  @Input() label?: string;
  @Input() min: number = 0;    // Example: 0
  @Input() max: number = 360;  // Example: 360
  @Input() value: number = 0;  
  @Output() valueChange: EventEmitter<number> = new EventEmitter<number>();

  // Store the angle if you want to show a visual indicator.
  angle = 0;
  
  private centerX!: number;
  private centerY!: number;
  private moveListener!: () => void;
  private upListener!: () => void;

  constructor(private renderer: Renderer2, private elRef: ElementRef) {}

  ngOnInit() {
    this.updateAngleFromValue();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value']) {
      this.updateAngleFromValue();
    }
  }

  private updateAngleFromValue() {
    // invert your mapAngleToValue:
    this.angle = ((this.value - this.min) / (this.max - this.min)) * 360;
  }

  startRotation(event: MouseEvent) {
    event.preventDefault();
    const rotatingEl = this.elRef.nativeElement.querySelector('.knob-rotating');
    const rect = rotatingEl.getBoundingClientRect();
    this.centerX = rect.left + rect.width / 2;
    this.centerY = rect.top + rect.height / 2;
    this.moveListener = this.renderer.listen('window', 'mousemove', (e) => this.rotate(e));
    this.upListener = this.renderer.listen('window', 'mouseup', () => this.stopRotation());
    this.elRef.nativeElement
      .querySelector('.knob-rotating')
      .classList.remove('animate'); 
  }

  // Maps a raw rotation angle (0-360°) into the given [min, max] range.
  mapAngleToValue(rawAngle: number): number {
    return this.min + (rawAngle / 360) * (this.max - this.min);
  }

  rotate(event: MouseEvent) {
    const deltaX = event.clientX - this.centerX;
    const deltaY = event.clientY - this.centerY;
    // Calculate angle in degrees
    let rawAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
    if (rawAngle < 0) {
      rawAngle += 360;
    }
    // Update the component’s angle for visual feedback if needed.
    this.angle = rawAngle;
    
    // Map the normalized angle to the provided min/max range.
    const mappedValue = this.mapAngleToValue(rawAngle);
    this.valueChange.emit(mappedValue);
  }

  stopRotation() {
    if (this.moveListener) { this.moveListener(); }
    if (this.upListener) { this.upListener(); }
    this.elRef.nativeElement
      .querySelector('.knob-rotating')
      .classList.add('animate'); 
  }
}
