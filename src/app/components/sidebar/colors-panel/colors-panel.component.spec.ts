import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorsPanelComponent } from './colors-panel.component';

describe('ColorsPanelComponent', () => {
  let component: ColorsPanelComponent;
  let fixture: ComponentFixture<ColorsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ColorsPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ColorsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
