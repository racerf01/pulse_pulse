import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-webgl',
  templateUrl: './webgl.component.html',
  styleUrls: ['./webgl.component.scss'],
  standalone: false
})
export class WebglComponent implements AfterViewInit, OnChanges {
  @Input() settings: any;
  @ViewChild('canvasElement', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private gl!: WebGLRenderingContext;

  ngAfterViewInit() {
    this.gl = this.canvasRef.nativeElement.getContext('webgl')!;
    if (!this.gl) {
      console.error('WebGL not supported!');
      return;
    }
    this.initWebGL();
    this.render();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['settings'] && !changes['settings'].firstChange) {
      this.updateEffects();
    }
  }

  // Initialize WebGL settings.
  initWebGL() {
    this.gl.viewport(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
  }

  // Render loop.
  render() {
    // Update clear color using a simple demo animation for now.
    const time = Date.now() * 0.001;
    const red = (Math.sin(time) * 0.5) + 0.5;
    this.gl.clearColor(red, 0.1, 0.1, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    requestAnimationFrame(() => this.render());
  }

  // Update shader uniforms or effects based on settings.
  updateEffects() {
    console.log('Updated settings:', this.settings);
    // Here you would update your WebGL shader uniforms with new settings.
    // For example:
    // this.gl.uniform1f(oscillationFrequencyLocation, this.settings.oscillationFrequency);
    // etc.
  }
}
