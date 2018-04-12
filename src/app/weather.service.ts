import { Injectable } from '@angular/core';
//Imported so that I can pull
import { HttpClient, HttpHeaders } from '@angular/common/http';
import 'rxjs/add/operator/map';


@Injectable()
export class WeatherService {
  //inject dependency
  //add httpclient
  constructor(private _http:HttpClient) { }

  dailyForecast(city:string){
    return this._http.get("https://api.openweathermap.org/data/2.5/forecast?q="+ city +"&APPID=6810758956cf67385902c70fdaac9f1a").map(result=>result);
  }

}
