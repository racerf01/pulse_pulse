import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RythmBarComponent } from './rythm-bar.component';

describe('RythmBarComponent', () => {
  let component: RythmBarComponent;
  let fixture: ComponentFixture<RythmBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RythmBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RythmBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
