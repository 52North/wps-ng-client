import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Subscription }   from 'rxjs';

import { environment } from '../../environments/environment';

import { ProcessOffering, ProcessOfferingProcess } from '../model/process-offering';

import { DataService } from '../services/data.service';

declare var WpsService: any;

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit {
  @Input() wpsGetCapSuccessNotifiy;
  @Input() expanded;

  wps: any;
  wpsGetCapSuccess: boolean;
  wpsGetCapFail: boolean = false;
  wpsGetCapBlocking: boolean = false;
  wpsGetCapLoading: boolean = false;
  selectedWpsServiceUrl: string;
  selWpsServiceVersion: string = "option1";
  serviceUrls: string[];
  procOffering: ProcessOffering = undefined;
  procs: ProcessOfferingProcess[] = undefined;

  subscription: Subscription;

  constructor(private dataService: DataService) { 
    this.subscription = dataService.processOffering$.subscribe(
      procOffering => {
        this.procOffering = procOffering;
      }
    );
    this.subscription = dataService.processes$.subscribe(
      processes => {
        this.procs = processes;
      }
    );
    this.subscription = dataService.webProcessingService$.subscribe(
      wps => {
        this.wps = wps;
      }
    );
    this.subscription = dataService.wpsVersion$.subscribe(
      version => {
        this.selWpsServiceVersion = version;
      }
    );
    this.subscription = dataService.expandedPanel$.subscribe(
      panel => {
        if (panel === 0) {
          this.expanded = true;
        }
      }
    )
  }

  ngOnInit() {
    if (environment.serviceUrls) {
      this.serviceUrls = environment.serviceUrls;
    } else {
      this.serviceUrls = [];
    }
    if (environment.serviceVersion && environment.serviceVersion == "1.0.0") {
      this.selWpsServiceVersion = "1.0.0";
    } else {
      this.selWpsServiceVersion = "2.0.0";
    }
    this.dataService.setWpsVersion(this.selWpsServiceVersion);
    if (environment.defaultServiceUrl != undefined &&
      environment.defaultServiceUrl < this.serviceUrls.length) {
      this.selectedWpsServiceUrl =
        this.serviceUrls[environment.defaultServiceUrl];
      this.checkWPService();
    }
  }

  wpsServiceVersionChange = (event) => {
    this.wpsGetCapSuccess = false;
    this.wpsGetCapFail = false;
    this.dataService.setWpsVersion(this.selWpsServiceVersion);
    if (!this.wpsGetCapBlocking) {
      this.checkWPService();
    }
  }

  checkWPService = () => {
    this.wpsGetCapLoading = true;
    this.wps = new WpsService({
      url: this.selectedWpsServiceUrl,
      version: this.selWpsServiceVersion
    });
    this.dataService.setWebProcessingService(this.wps);
    this.wps.getCapabilities_GET((callback) => {
      this.wpsGetCapLoading = false;
      if (callback.textStatus && callback.textStatus == "error") {
        this.wpsGetCapSuccess = false;
        this.dataService.setGetCapSuccessful(false);
        this.wpsGetCapFail = true;
        this.dataService.setExpandedPanel(0);
      } else {
        this.wpsGetCapSuccess = true;
        this.wpsGetCapFail = false;
        // fill process array:
        let procs: ProcessOfferingProcess[] = [];
        let tempProc = -1;
        let selProcId: string = "SELECT_PROCESS_HINT";
        this.dataService.setProcessInputsDone(false);
        for (let process of callback.capabilities.processes) {
          procs.push(process);
          if (environment.defaultProcessIdentifier != undefined &&
            environment.defaultProcessIdentifier == process.identifier) {
            // select default process:
            selProcId = process.identifier;
            this.dataService.setSelectedProcessIdentifier(selProcId);
            this.dataService.setExpandedPanel(1);
            tempProc = 0;
          }
        }
        if (selProcId == undefined
          || tempProc == -1) {
          selProcId = "SELECT_PROCESS_HINT";
          let procOffering: ProcessOffering = undefined;
          this.dataService.setProcessOffering(procOffering);
        }
        this.dataService.setProcesses(procs);
        this.dataService.setSelectedProcessIdentifier(selProcId);
        this.dataService.setGetCapSuccessful(true);
      }
    });
  }

  wpsServiceUrlChange = (event) => {
    if (this.selectedWpsServiceUrl == "WPS_ADD_SELECTED") {
      this.wpsGetCapBlocking = true;
      this.wpsGetCapSuccess = false;
      this.dataService.setGetCapSuccessful(false);
      this.wpsGetCapFail = false;
    } else {
      this.wpsGetCapBlocking = false;
      this.checkWPService();
    }
  }

  btn_OnWpsAdd = (value: string) => {
    this.serviceUrls.push(value);
    this.selectedWpsServiceUrl = value;
    this.wpsGetCapBlocking = false;
    this.checkWPService();
  }

  setExpanded = (opened: boolean) => {
    if (opened) {
      this.dataService.setExpandedPanel(0);
    } else {
      this.dataService.setExpandedPanel(1);
    }
  }

}
