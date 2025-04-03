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
    // Get the WebGL context from the canvas
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

  // Initialize WebGL by setting up the viewport and clear color.
  initWebGL() {
    // Set the viewport to match the canvas size
    this.gl.viewport(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    // Set a clear color (e.g., dark gray)
    this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
  }

  // Use requestAnimationFrame for continuous rendering.
  render() {
    // Optionally, update clear color dynamically for a demo effect.
    // For instance, make the red component pulse over time.
    const time = Date.now() * 0.001;
    const red = (Math.sin(time) * 0.5) + 0.5; // oscillates between 0 and 1
    this.gl.clearColor(red, 0.1, 0.1, 1.0);

    // Clear the canvas with the specified clear color
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Continue rendering the next frame
    requestAnimationFrame(() => this.render());
  }

  // Update uniforms or shader parameters based on the current settings.
  updateEffects() {
    // For example, update shader uniforms with this.settings values.
    console.log('Updating effects with settings:', this.settings);
    // Add your uniform update logic here.
  }
}
