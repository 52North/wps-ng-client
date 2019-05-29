import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RawWpsService {

  private wpsUrl: string;
  private wpsVersion: string;
  private wpsProcessIdentifier: string;
  private wpsExecutionMode: string;
  private generatedInputs: any[];
  private generatedOutputs: any[];

  constructor() { }

  executeRaw(callback: any, wpsUrl: string,
    wpsVersion: string, wpsProcessIdentifier: string, wpsExecutionMode: string,
    generatedInputs: any[], generatedOutputs: any[]) {
    this.wpsUrl = wpsUrl;
    this.wpsVersion = wpsVersion;
    this.wpsProcessIdentifier = wpsProcessIdentifier;
    this.wpsExecutionMode = wpsExecutionMode;
    this.generatedInputs = generatedInputs;
    this.generatedOutputs = generatedOutputs;
    console.log('executeRaw called.');
    console.log(callback);
  }

}
