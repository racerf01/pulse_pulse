import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WebglComponent } from './components/webgl/webgl.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { MediumKnobComponent } from './components/sidebar/medium-knob/medium-knob.component';
import { ColorsPanelComponent } from './components/sidebar/colors-panel/colors-panel.component';
import { SmallKnobComponent } from './components/sidebar/small-knob/small-knob.component';
import { RythmBarComponent } from './components/sidebar/rythm-bar/rythm-bar.component';
import { MasterKnobComponent } from './components/sidebar/master-knob/master-knob.component';

@NgModule({
  declarations: [
    AppComponent,
    WebglComponent,
    SidebarComponent,
    MediumKnobComponent,
    ColorsPanelComponent,
    SmallKnobComponent,
    RythmBarComponent,
    MasterKnobComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
