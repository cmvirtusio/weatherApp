import { Component, OnInit } from '@angular/core';
import { WeatherService } from './weather.service';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  city : string = "Toronto";
  chart = [];

  constructor(private weather:WeatherService){  };
  ngOnInit(){
    this.getValues();
  }

  getValues(){
    this.weather.dailyForecast(this.city)
      .subscribe(res => {
        let temp = res['list'].map(res => res.main.temp);
        let humidity = res['list'].map(res => res.main.humidity);
        let alldates = res['list'].map(res => res.dt)
        let weatherDates = []
        alldates.forEach((res) => {
            let jsdate = new Date(res * 1000)
            weatherDates.push(jsdate.toLocaleTimeString('en', { year: 'numeric', month: 'short', day: 'numeric' }))
        })
        console.log(weatherDates);

        this.chart = new Chart('canvas', {
          type: 'line',
          data: {
            labels: weatherDates,
            datasets: [{
              label: 'Temperature in Kelvin',
              borderColor: "#3cba9f",
              fill: false,
              data: temp,
              yAxisID: 'y-axis-1',
            }, {
              label: 'Humidity',
              borderColor: '#ffcc00',
              fill: false,
              data: humidity,
              yAxisID: 'y-axis-2'
            }]
          },
          options: {
            responsive: true,
            hoverMode: 'index',
            stacked: false,
            title: {
              display: true,
              text: '5 day Forecast in ' + this.city
            },
            scales: {
              yAxes: [{
                type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                display: true,
                position: 'left',
                id: 'y-axis-1',
              }, {
                type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                display: true,
                position: 'right',
                id: 'y-axis-2',
  
                // grid line settings
                gridLines: {
                  drawOnChartArea: false, // only want the grid lines for one axis to show up
                },
              }],
            }
          }

        });
    },(err)=>{
      alert(err['error'].message);
    })
  }
}
