import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
//This Enables http calls;
import { HttpClientModule } from '@angular/common/http';
import { WeatherService } from './weather.service';
//enable twowaybinding
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule 
  ],
  providers: [WeatherService],
  bootstrap: [AppComponent]
})
export class AppModule { }
