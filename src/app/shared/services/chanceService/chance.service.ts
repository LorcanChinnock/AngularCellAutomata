import { Injectable } from '@angular/core';
import { Chance } from 'chance';

@Injectable({
  providedIn: 'root'
})
export class ChanceService {
  getWeightedRandom(items: any[], weights: number[]): any {
    return Chance().weighted(items, weights);
  }
}
