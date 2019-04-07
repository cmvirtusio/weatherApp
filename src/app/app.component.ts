import { Component } from '@angular/core';
import { NgbModalConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap';

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

  portfolioModels: Array<Object> = [
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
  futureDraw = 30000;
  futureDrawGrowth = 0.03;

  cfData: Number[];
  manualCFData: Number[];
  postRetirementCFData: Number[];

  constructor(config: NgbModalConfig, private modalService: NgbModal) {
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
  }

  runSimulation() {

  }

}
