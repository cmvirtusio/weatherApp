import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SimulationsService } from './services/simulations.service';
import { ChartsModule } from 'ng2-charts';


import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    NgbModule.forRoot(),
    ChartsModule
  ],
  providers: [SimulationsService],
  bootstrap: [AppComponent]
})
export class AppModule { }
