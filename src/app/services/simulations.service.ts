import { Injectable } from '@angular/core';
import * as gaussian from 'gaussian';
import * as stats from 'stats-lite';

@Injectable({
  providedIn: 'root'
})
export class SimulationsService {

  constructor() { }
  matrixTransposer(matrix) {
    return matrix[0].map((x, i) => matrix.map(y => y[i]));
  }
  getPercentilesFromSimulations(arrayOfSimulations) {
    return {
      percentile10: stats.percentile(arrayOfSimulations, 10 / 100),
      percentile30: stats.percentile(arrayOfSimulations, 30 / 100),
      percentile50: stats.percentile(arrayOfSimulations, 50 / 100),
      percentile70: stats.percentile(arrayOfSimulations, 70 / 100),
      percentile90: stats.percentile(arrayOfSimulations, 90 / 100),
    }
  }
  getPercentileArray(percentTileSimulations, percentileKey) {
    return percentTileSimulations.map(percentileObj => {
      return percentileObj[percentileKey];
    });
  }
  getPercentileEOYNW(eoyNetworths) {
    const percentileDynamicSims = eoyNetworths.map(currentYearArray => {
      return this.getPercentilesFromSimulations(currentYearArray);
    });
    return {
      percenttile10th: this.getPercentileArray(percentileDynamicSims, 'percentile10'),
      percenttile30th: this.getPercentileArray(percentileDynamicSims, 'percentile30'),
      percenttile50th: this.getPercentileArray(percentileDynamicSims, 'percentile50'),
      percenttile70th: this.getPercentileArray(percentileDynamicSims, 'percentile70'),
      percenttile90th: this.getPercentileArray(percentileDynamicSims, 'percentile90')
    }
  }
  dynamicPortfolioSolutionWithTimeHorizonLimit(
    numberOfSimulations,
    cashFlowDataBeforeRetirement,
    arrayOfPortfolios,
    retirementTarget,
    isStatic = false,
    cashFlowDataAfterRetirement = []
  ) {
    function convertNormalToLogNormal(normDist) {
      const variance = Math.pow(normDist.sd, 2);
      return {
        m: Math.log(normDist.m / Math.sqrt(1 + (variance / Math.pow(normDist.m, 2)))),
        sd: Math.sqrt(Math.log(1 + (variance / Math.pow(normDist.m, 2))))
      }
    }
    function riskProfileDecay(numberOfYears, riskProfileNumber, portfolioOptions, interval = 2) {
      const maxRiskPortfolioArray = Array(numberOfYears).fill(portfolioOptions[riskProfileNumber]);
      for (let i = 0; i < portfolioOptions.length; i++) {
        for (let j = 0; j < interval; j++) {
          const indexToUpdateBasedOnTimeHorizon = (numberOfYears - 1) - (i * interval + j);
          if (indexToUpdateBasedOnTimeHorizon >= 0) {
            const profile = Math.min(riskProfileNumber, i);
            maxRiskPortfolioArray[indexToUpdateBasedOnTimeHorizon] = portfolioOptions[profile];
          }
        }
      }
      return maxRiskPortfolioArray;
    }
    function preCalculateCompoundGrowth(maxPortfolioArray) {
      const reversedMPA = maxPortfolioArray.reverse();
      const returnArray = [];
      returnArray.unshift(convertNormalToLogNormal(reversedMPA[0]));

      for (let i = 1; i < reversedMPA.length; i++) {
        const currentAgg = returnArray[0];
        const currentProfile = convertNormalToLogNormal(reversedMPA[i]);
        const aggregatedMSD = {
          m: currentAgg.m + currentProfile.m,
          sd: Math.sqrt(Math.pow(returnArray[0].sd, 2) + Math.pow(currentProfile.sd, 2))
        }
        returnArray.unshift(aggregatedMSD);
      }
      return returnArray;
    }
    function getPortfoliosAllowed(numberOfYears, portfolioOptions, interval = 2) {
      let retArr = Array(numberOfYears).fill(portfolioOptions);
      for (let i = 0; i < portfolioOptions.length; i++) {
        for (let j = 0; j < interval; j++) {
          const indexToUpdateBasedOnTimeHorizon = (numberOfYears - 1) - (i * interval + j);
          if (indexToUpdateBasedOnTimeHorizon >= 0) {
            let arrOverride = [];
            for (let k = 0; k <= i; k++) {
              arrOverride.push(portfolioOptions[k]);
            }
            retArr[indexToUpdateBasedOnTimeHorizon] = arrOverride;
          }
        }
      }
      return retArr;
    }
    function searchPortfolio(currentNetWorth, currentIndex, portfoliosAllowed, retirementTarget, compoundGrowth, growthWithCashFlow) {
      // console.log(portfoliosAllowed);
      let leastRiskyPortfolio = portfoliosAllowed.length - 1;
      for (let i = 0; i < portfoliosAllowed.length; i++) {
        const preCalculatedLogNormalAggregate = compoundGrowth[i][currentIndex];
        let total = currentNetWorth * Math.pow(Math.E, preCalculatedLogNormalAggregate.m + (preCalculatedLogNormalAggregate.sd * gaussian(0, 1).ppf(10 / 100)));
        total = total + growthWithCashFlow[i][currentIndex];
        if (total > retirementTarget) {
          leastRiskyPortfolio = i;
          break;
        }
      }
      return portfoliosAllowed[leastRiskyPortfolio];
    }

    const decayInterval = 2;
    const portfoliosAllowedArray = getPortfoliosAllowed(cashFlowDataBeforeRetirement.length, arrayOfPortfolios, decayInterval);
    // console.log(portfoliosAllowedArray)
    const memoizeCompoundGrowth = [];
    const memoizeGrowthWithCashFlow = [];
    arrayOfPortfolios.forEach((portfolio, portfolioNumber) => {
      const currentPortfolio = riskProfileDecay(cashFlowDataBeforeRetirement.length, portfolioNumber, arrayOfPortfolios, decayInterval);
      const compoundGrowth = preCalculateCompoundGrowth(currentPortfolio);
      memoizeCompoundGrowth.push(compoundGrowth);
      let mathApproximation = 0;
      const mathApproximationOfFutureCashFlow = [];
      for (let i = cashFlowDataBeforeRetirement.length - 1; i >= 0; i--) {
        mathApproximationOfFutureCashFlow.unshift(mathApproximation);
        mathApproximation = mathApproximation + cashFlowDataBeforeRetirement[i] * Math.pow(Math.E, compoundGrowth[i].m + (compoundGrowth[i].sd * gaussian(0, 1).ppf(10 / 100)));
      }
      memoizeGrowthWithCashFlow.unshift(mathApproximationOfFutureCashFlow);
    });
    // console.log(memoizeCompoundGrowth);
    // console.log(memoizeGrowthWithCashFlow);

    const homogeneousDPSresults = Array(numberOfSimulations).fill(null).map(() => {
      let currentNetworth = 0;
      const eoyNetWorth = [];
      const eoyPortfolio = [];
      const eoyVAR = [];

      for (let i = 0; i < cashFlowDataBeforeRetirement.length; i++) {
        currentNetworth = (currentNetworth + cashFlowDataBeforeRetirement[i]);
        const portfoliosAllowed = portfoliosAllowedArray[i]
        let portfolioPicked = portfoliosAllowed[portfoliosAllowed.length-1];
        if(!isStatic) {
          portfolioPicked = searchPortfolio(currentNetworth, i, portfoliosAllowed, retirementTarget, memoizeCompoundGrowth, memoizeGrowthWithCashFlow);
        }
        const gsDistribution = gaussian(portfolioPicked.m, portfolioPicked.sd * portfolioPicked.sd);
        currentNetworth = currentNetworth * gsDistribution.ppf(Math.random());
        eoyNetWorth.push(currentNetworth);
        eoyPortfolio.push(portfolioPicked.name);
        eoyVAR.push(currentNetworth * 2 * portfolioPicked.sd);
      }

      for (let i = 0; i < cashFlowDataAfterRetirement.length; i++) {
        currentNetworth = (currentNetworth + cashFlowDataAfterRetirement[i]);
        const portfolioPicked = arrayOfPortfolios[0];
        const gsDistribution = gaussian(portfolioPicked.m, portfolioPicked.sd * portfolioPicked.sd);
        currentNetworth = currentNetworth * gsDistribution.ppf(Math.random());
        eoyNetWorth.push(currentNetworth);
        eoyPortfolio.push(portfolioPicked.name);
        eoyVAR.push(currentNetworth * 2 * portfolioPicked.sd);
      }

      return {
        eoyNetWorth: eoyNetWorth,
        eoyPortfolio: eoyPortfolio,
        eoyVAR: eoyVAR
      }
    });

    const homogeneousDPSeoyNetworths = this.matrixTransposer(homogeneousDPSresults.map(simulation => simulation.eoyNetWorth));
    const percentileEOYNW = this.getPercentileEOYNW(homogeneousDPSeoyNetworths);
    function getDistributionOfPortfolios(currentYearPortfolios, arrOfPortfolios, numberOfSimulations) {
      const keys = arrOfPortfolios.map(portfolio => portfolio.name);
      let distinctDistributionOfPortfolios = {};
      keys.forEach(key => {
        distinctDistributionOfPortfolios[key] = (currentYearPortfolios.filter(port => (port === key)).length / numberOfSimulations * 100).toFixed(2);
      });
      return distinctDistributionOfPortfolios;
    }
    const homogeneousDPSeoyPortfolios = this.matrixTransposer(homogeneousDPSresults.map(simulation => simulation.eoyPortfolio));
    const portfolioDistributionPerYear = homogeneousDPSeoyPortfolios.map(currentYearPortfolios => {
      return getDistributionOfPortfolios(currentYearPortfolios, arrayOfPortfolios, numberOfSimulations);
    });
    return {
      percentileEndOfYearNetWorth: percentileEOYNW,
      endOfYearPortfolioDistribution: portfolioDistributionPerYear,
      oddsOfHittingTarget: ((homogeneousDPSeoyNetworths[cashFlowDataBeforeRetirement.length - 1].filter(eoyNW => (eoyNW > retirementTarget))).length) / numberOfSimulations
    }

  }
}