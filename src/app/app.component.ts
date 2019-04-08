import { Component } from '@angular/core';
import { NgbModalConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SimulationsService } from './services/simulations.service';
import { Chart } from 'chart.js';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  // add NgbModalConfig and NgbModal to the component providers
  providers: [NgbModalConfig, NgbModal]
})
export class AppComponent {
  numberOfSimulations = 1000;
  inflationRate = 0.02;
  sharpeRatio = 0.7;
  vcReturn = 0.05;
  cReturn = 0.06;
  bReturn = 0.07;
  gReturn = 0.08;
  agReturn = 0.09;

  portfolioModels: Array<any> = [
    {
      longName: 'Very Conservative',
      shortName: 'VC',
    },
    {
      longName: 'Conservative',
      shortName: 'C',
    },
    {
      longName: 'Balanced',
      shortName: 'B',
    },
    {
      longName: 'Growth',
      shortName: 'G',
    },
    {
      longName: 'Aggressive Growth',
      shortName: 'AG',
    },
  ]
  riskProfile = this.portfolioModels[this.portfolioModels.length - 1];
  currentAge = 30;
  retirementAge = 65;
  retirementTarget = 3000000;
  initialInvestment = 100000;
  futureCashFlow = 20000;
  futureCashFlowGrowth = 0;
  isAdjustedForInflation = false;

  includePostRetirementInModel = false;
  deathAge = 90;
  futureDraw = -30000;
  futureDrawGrowth = 0.03;

  cfData: Number[];
  manualCFData: Number[];
  postRetirementCFData: Number[];


  constructor(
    config: NgbModalConfig,
    private modalService: NgbModal,
    private _simulation: SimulationsService
  ) {
    // customize default values of modals used by this component tree
    config.backdrop = 'static';
    config.keyboard = false;
  }

  ngOnInit() {
    this.populateCashFlowData();
    this.populatePostRetirementData();
    this.runSimulation();
  }
  // Modal Related Logic
  open(content) {
    this.manualCFData = this.cfData;
    this.modalService.open(content, { size: 'lg', backdrop: 'static' });
  }
  // Modal Related Logic
  trackByIndex(index: number, obj: any): any {
    return index;
  }
  // Modal Related Logic
  updateManualCFData(cf) {
    this.manualCFData = cf.map(amount => Math.round(amount));
  }
  // Modal Related Logic
  saveCFData(cf) {
    this.cfData = cf.map(amount => Math.round(amount));
    this.createBarChartCFPreRetirement(this.cfData);
  }

  populateCashFlowData() {
    const numberOfYears = this.retirementAge - this.currentAge;
    const cashFlowData = Array(numberOfYears).fill(this.futureCashFlow);
    cashFlowData.unshift(this.initialInvestment);
    let cashFlowWithGrowth = cashFlowData.map((cf, i) => {
      return cf * Math.pow((1 + this.futureCashFlowGrowth), i);
    });
    if (this.isAdjustedForInflation) {
      cashFlowWithGrowth = cashFlowWithGrowth.map((curCF, i) => {
        return curCF * Math.pow((1 + this.inflationRate), i);
      });
    }
    this.cfData = cashFlowWithGrowth.map(amount => Math.round(amount));
    this.createBarChartCFPreRetirement(this.cfData);
  }

  populatePostRetirementData() {
    const numberOfYears = this.deathAge - this.retirementAge;
    const cashFlowData = Array(numberOfYears).fill(this.futureDraw);
    let cashFlowWithGrowth = cashFlowData.map((cf, i) => {
      return cf * Math.pow((1 + this.futureDrawGrowth), i);
    }).map((curCF, i) => {
      return curCF * Math.pow((1 + this.inflationRate), i);
    });
    this.postRetirementCFData = cashFlowWithGrowth.map(amount => Math.round(amount));
    this.createBarChartCFPostRetirement(this.postRetirementCFData);
  }

  //CFPreRetirement
  barChartDataCFPreRetirement = [];
  barChartLabelsCFPreRetirement = [];
  barChartOptionsCFPreRetirement = {
    scaleShowVerticalLines: false,
    responsive: true,
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true
          }
        }
      ]
    }
  };
  barChartLegendCFPreRetirement = true;
  barChartTypeCFPreRetirement = 'bar';
  createBarChartCFPreRetirement(dataValues) {
    this.barChartLabelsCFPreRetirement = dataValues.map((hello, i) => {
      return (this.currentAge + i).toString();
    });
    this.barChartDataCFPreRetirement = [{
      data: dataValues,
      label: 'CashFlow Before Retirement'
    }]
  }

  //CFPostRetirement
  barChartDataCFPostRetirement = [];
  barChartLabelsCFPostRetirement = [];
  barChartOptionsCFPostRetirement = {
    scaleShowVerticalLines: false,
    responsive: true,
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true
          }
        }
      ]
    }
  };
  barChartLegendCFPostRetirement = true;
  barChartTypeCFPostRetirement = 'bar';
  createBarChartCFPostRetirement(dataValues) {
    this.barChartLabelsCFPostRetirement = dataValues.map((hello, i) => {
      return (this.retirementAge + i + 1).toString();
    });
    this.barChartDataCFPostRetirement = [{
      data: dataValues,
      label: 'CashFlow After Retirement'
    }]
  }

  // Dynamic Portfolio Model
  oddsDynamic;

  dynamicDataStacked = [];
  dynamicLabelsStacked = [];
  dynamicOptionsStacked = {
    title: {
      display: true,
      text: 'Distribution of Portfolio Per Year Assuming Portfolios are Homogeneous'
    },
    tooltips: {
      mode: 'index',
      intersect: false
    },
    responsive: true,
    scales: {
      xAxes: [{
        stacked: true,
      }],
      yAxes: [{
        stacked: true
      }]
    }
  };
  dynamicLegendStacked = true;
  dynamicTypeStacked = 'bar';
  createDynamicStacked(eoyPD, currentAge) {
    const bgColourList = [
      '#FFA07A',
      '#E9967A',
      '#FA8072',
      '#F08080',
      '#CD5C5C',
    ]
    this.dynamicLabelsStacked = eoyPD.map((value, i) => {
      return currentAge + i;
    });
    this.dynamicDataStacked = Object.keys(eoyPD[0]).map((key, index) => {
      return {
        label: key,
        backgroundColor: bgColourList[index],
        data: eoyPD.map(obj => {
          return obj[key];
        })
      }
    });
  }

  dynamicDataPercentile = [];
  dynamicLabelsPercentile = [];
  dynamicOptionsPercentile = {
    maintainAspectRatio: true,
    spanGaps: false,
    title: {
      display: true,
      text: 'DynamicPortfolio'
    },
    elements: {
      line: {
        tension: 0.000001
      }
    },
    scales: {
      yAxes: [{
        stacked: false,
        type: 'linear'
      }]
    },
    plugins: {
      filler: {
        propagate: false
      },
      'samples-filler-analyser': {
        target: 'chart-analyser'
      }
    }
  };
  dynamicLegendPercentile = true;
  dynamicTypePercentile = 'line';
  createDynamicPercentileChart(eoyNW, currentAge) {
    const bgColourList = [
      '#FFA07A',
      '#E9967A',
      '#FA8072',
      '#F08080',
      '#CD5C5C',
    ]
    this.dynamicLabelsPercentile = eoyNW[Object.keys(eoyNW)[0]].map((value, i) => {
      return currentAge + i;
    });
    this.dynamicDataPercentile = Object.keys(eoyNW).map((key, index) => {
      return {
        borderColor: bgColourList[index],
        data: eoyNW[key].map(numbers => {
          return numbers.toFixed();
        }),
        label: key,
        fill: false,
      }
    });
  }

  // VC Portfolio Model
  oddsVCPortfolio;
  vcPortfolioDataStacked = [];
  vcPortfolioLabelsStacked = [];
  vcPortfolioDataPercentile = [];
  vcPortfolioLabelsPercentile = [];
  createVCStacked(eoyPD, currentAge) {
    const bgColourList = [
      '#FFA07A',
      '#E9967A',
      '#FA8072',
      '#F08080',
      '#CD5C5C',
    ]
    this.vcPortfolioLabelsStacked = eoyPD.map((value, i) => {
      return currentAge + i;
    });
    this.vcPortfolioDataStacked = Object.keys(eoyPD[0]).map((key, index) => {
      return {
        label: key,
        backgroundColor: bgColourList[index],
        data: eoyPD.map(obj => {
          return obj[key];
        })
      }
    });
  }
  createVCPercentileChart(eoyNW, currentAge) {
    const bgColourList = [
      '#FFA07A',
      '#E9967A',
      '#FA8072',
      '#F08080',
      '#CD5C5C',
    ]
    this.vcPortfolioLabelsPercentile = eoyNW[Object.keys(eoyNW)[0]].map((value, i) => {
      return currentAge + i;
    });
    this.vcPortfolioDataPercentile = Object.keys(eoyNW).map((key, index) => {
      return {
        borderColor: bgColourList[index],
        data: eoyNW[key].map(numbers => {
          return numbers.toFixed();
        }),
        label: key,
        fill: false,
      }
    });
  }

  // B Portfolio Model
  oddsBPortfolio;
  bPortfolioDataStacked = [];
  bPortfolioLabelsStacked = [];
  bPortfolioDataPercentile = [];
  bPortfolioLabelsPercentile = [];
  createBStacked(eoyPD, currentAge) {
    const bgColourList = [
      '#FFA07A',
      '#E9967A',
      '#FA8072',
      '#F08080',
      '#CD5C5C',
    ]
    this.bPortfolioLabelsStacked = eoyPD.map((value, i) => {
      return currentAge + i;
    });
    this.bPortfolioDataStacked = Object.keys(eoyPD[0]).map((key, index) => {
      return {
        label: key,
        backgroundColor: bgColourList[index],
        data: eoyPD.map(obj => {
          return obj[key];
        })
      }
    });
  }
  createBPercentileChart(eoyNW, currentAge) {
    const bgColourList = [
      '#FFA07A',
      '#E9967A',
      '#FA8072',
      '#F08080',
      '#CD5C5C',
    ]
    this.bPortfolioLabelsPercentile = eoyNW[Object.keys(eoyNW)[0]].map((value, i) => {
      return currentAge + i;
    });
    this.bPortfolioDataPercentile = Object.keys(eoyNW).map((key, index) => {
      return {
        borderColor: bgColourList[index],
        data: eoyNW[key].map(numbers => {
          return numbers.toFixed();
        }),
        label: key,
        fill: false,
      }
    });
  }

  // AG Portfolio Model
  oddsAGPortfolio;
  agPortfolioDataStacked = [];
  agPortfolioLabelsStacked = [];
  agPortfolioDataPercentile = [];
  agPortfolioLabelsPercentile = [];
  createAGStacked(eoyPD, currentAge) {
    const bgColourList = [
      '#FFA07A',
      '#E9967A',
      '#FA8072',
      '#F08080',
      '#CD5C5C',
    ]
    this.agPortfolioLabelsStacked = eoyPD.map((value, i) => {
      return currentAge + i;
    });
    this.agPortfolioDataStacked = Object.keys(eoyPD[0]).map((key, index) => {
      return {
        label: key,
        backgroundColor: bgColourList[index],
        data: eoyPD.map(obj => {
          return obj[key];
        })
      }
    });
  }
  createAGPercentileChart(eoyNW, currentAge) {
    const bgColourList = [
      '#FFA07A',
      '#E9967A',
      '#FA8072',
      '#F08080',
      '#CD5C5C',
    ]
    this.agPortfolioLabelsPercentile = eoyNW[Object.keys(eoyNW)[0]].map((value, i) => {
      return currentAge + i;
    });
    this.agPortfolioDataPercentile = Object.keys(eoyNW).map((key, index) => {
      return {
        borderColor: bgColourList[index],
        data: eoyNW[key].map(numbers => {
          return numbers.toFixed();
        }),
        label: key,
        fill: false,
      }
    });
  }

  runSimulation() {
    // numberOfSimulations, cashFlowDataBeforeRetirement, arrayOfPortfolios, retirementTarget, cashFlowDataAfterRetirement = null
    function getSDCalculator(sharpe, riskFreeRate) {
      return function (percentReturn) {
        return {
          m: 1 + percentReturn,
          sd: (percentReturn - riskFreeRate) / sharpe
        };
      }
    }
    function createArrayOfPortfolios(sharpe, riskFreeRate, arrayOfReturns, arrayOfNames) {
      const sdCalculator = getSDCalculator(sharpe, riskFreeRate);
      return arrayOfReturns.map((percentReturn, i) => {
        return {
          m: 1 + percentReturn,
          sd: sdCalculator(percentReturn).sd,
          name: arrayOfNames[i]
        }
      });
    }
    const allPossiblePortfolios = createArrayOfPortfolios(
      this.sharpeRatio,
      this.inflationRate,
      [this.vcReturn, this.cReturn, this.bReturn, this.gReturn, this.agReturn],
      ['VC', 'C', 'B', 'G', 'AG']
    );
    const arrayOfPortfolio = [];
    for (let i = 0; i < allPossiblePortfolios.length; i++) {
      arrayOfPortfolio.push(allPossiblePortfolios[i]);
      if (allPossiblePortfolios[i].name === this.riskProfile.shortName) {
        break;
      }
    }
    console.log(arrayOfPortfolio);
    let postRetirement = [];
    if (this.includePostRetirementInModel) {
      postRetirement = this.postRetirementCFData;
    }

    // Dynamic Portfolio Model
    const dynamicNumbers = this._simulation.dynamicPortfolioSolutionWithTimeHorizonLimit(
      this.numberOfSimulations,
      this.cfData,
      arrayOfPortfolio,
      this.retirementTarget,
      false,
      postRetirement
    );
    this.oddsDynamic = (dynamicNumbers.oddsOfHittingTarget * 100).toFixed(2) + '%';
    this.createDynamicPercentileChart(dynamicNumbers.percentileEndOfYearNetWorth, this.currentAge);
    this.createDynamicStacked(dynamicNumbers.endOfYearPortfolioDistribution, this.currentAge);

    // VC Portfolio Model
    const vcPortfolio = [];
    for (let i = 0; i < allPossiblePortfolios.length; i++) {
      vcPortfolio.push(allPossiblePortfolios[i]);
      if (allPossiblePortfolios[i].name === 'VC') {
        break;
      }
    }
    const vcNumbers = this._simulation.dynamicPortfolioSolutionWithTimeHorizonLimit(
      this.numberOfSimulations,
      this.cfData,
      vcPortfolio,
      this.retirementTarget,
      true,
      postRetirement
    );
    this.oddsVCPortfolio = (vcNumbers.oddsOfHittingTarget * 100).toFixed(2) + '%';
    this.createVCPercentileChart(vcNumbers.percentileEndOfYearNetWorth, this.currentAge);
    this.createVCStacked(vcNumbers.endOfYearPortfolioDistribution, this.currentAge);

    // B Portfolio Model
    const bPortfolio = [];
    for (let i = 0; i < allPossiblePortfolios.length; i++) {
      bPortfolio.push(allPossiblePortfolios[i]);
      if (allPossiblePortfolios[i].name === 'B') {
        break;
      }
    }
    const bNumbers = this._simulation.dynamicPortfolioSolutionWithTimeHorizonLimit(
      this.numberOfSimulations,
      this.cfData,
      bPortfolio,
      this.retirementTarget,
      true,
      postRetirement
    );
    this.oddsBPortfolio = (bNumbers.oddsOfHittingTarget * 100).toFixed(2) + '%';
    this.createBPercentileChart(bNumbers.percentileEndOfYearNetWorth, this.currentAge);
    this.createBStacked(bNumbers.endOfYearPortfolioDistribution, this.currentAge);

    // AG Portfolio Model
    const agPortfolio = [];
    for (let i = 0; i < allPossiblePortfolios.length; i++) {
      agPortfolio.push(allPossiblePortfolios[i]);
      if (allPossiblePortfolios[i].name === 'AG') {
        break;
      }
    }
    const agNumbers = this._simulation.dynamicPortfolioSolutionWithTimeHorizonLimit(
      this.numberOfSimulations,
      this.cfData,
      agPortfolio,
      this.retirementTarget,
      true,
      postRetirement
    );
    this.oddsAGPortfolio = (agNumbers.oddsOfHittingTarget * 100).toFixed(2) + '%';
    this.createAGPercentileChart(agNumbers.percentileEndOfYearNetWorth, this.currentAge);
    this.createAGStacked(agNumbers.endOfYearPortfolioDistribution, this.currentAge);
  }



}
