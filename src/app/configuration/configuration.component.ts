import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';

import { ProcessOffering, ProcessOfferingProcess } from '../model/process-offering';

import { DataService } from '../services/data.service';
import { HttpGetService } from '../services/http-get.service';
import { AppSettings } from '../model/app-setting';

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
  wpsGetCapFail = false;
  wpsGetCapBlocking = false;
  wpsGetCapLoading = false;
  selectedWpsServiceUrl: string;
  selWpsServiceVersion = '1.0.0';
  serviceUrls: string[];
  procOffering: ProcessOffering = undefined;
  procs: ProcessOfferingProcess[] = undefined;
  settings: AppSettings;

  subscription: Subscription;

  constructor(private dataService: DataService, private httpGetService: HttpGetService) {
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
    );
  }

  ngOnInit() {
    // get AppSettings:
    this.httpGetService.getAppSettings()
      .subscribe((settings: AppSettings) => {
        this.settings = settings;
        if (settings.serviceUrls) {
          console.log('setting serviceUrls.');
          this.serviceUrls = settings.serviceUrls;
        } else {
          this.serviceUrls = [];
        }
        if (settings.serviceVersion && settings.serviceVersion === '1.0.0') {
          console.log('setting serviceVersion.');
          this.selWpsServiceVersion = '1.0.0';
        } else {
          console.log('setting serviceVersion.');
          this.selWpsServiceVersion = '2.0.0';
        }
        this.dataService.setWpsVersion(this.selWpsServiceVersion);
        if (settings.defaultServiceUrl !== undefined &&
          settings.defaultServiceUrl < this.serviceUrls.length) {
          console.log('setting selectedWpsServiceUrl.');
          this.selectedWpsServiceUrl =
            this.serviceUrls[settings.defaultServiceUrl];
        } else {
          this.selectedWpsServiceUrl =
            'SELECT_SERVICE_HINT';
        }
        if (this.selectedWpsServiceUrl !== undefined
          && this.selWpsServiceVersion !== undefined) {
          console.log('checking Wps');
          this.checkWPService();
        }
      });
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
    this.wps = new WpsService({
      url: this.selectedWpsServiceUrl,
      version: this.selWpsServiceVersion
    });
    if (this.selectedWpsServiceUrl !== 'SELECT_SERVICE_HINT') {
      this.wpsGetCapLoading = true;
      this.dataService.setWebProcessingService(this.wps);
      this.wps.getCapabilities_GET((callback) => {
        console.log(callback);
        this.wpsGetCapLoading = false;
        if (callback.textStatus && callback.textStatus === 'error') {
          this.wpsGetCapSuccess = false;
          this.dataService.setGetCapSuccessful(false);
          this.wpsGetCapFail = true;
          this.dataService.setExpandedPanel(0);
        } else {
          this.wpsGetCapSuccess = true;
          this.wpsGetCapFail = false;
          // fill process array:
          const procs: ProcessOfferingProcess[] = [];
          let tempProc = -1;
          let selProcId = 'SELECT_PROCESS_HINT';
          this.dataService.setProcessInputsDone(false);
          for (const process of callback.capabilities.processes) {
            procs.push(process);
            if (this.settings.defaultProcessIdentifier !== undefined &&
              this.settings.defaultProcessIdentifier === process.identifier) {
              // select default process:
              selProcId = process.identifier;
              this.dataService.setSelectedProcessIdentifier(selProcId);
              tempProc = 0;
            }
          }
          if (selProcId === undefined
            || tempProc === -1) {
            selProcId = 'SELECT_PROCESS_HINT';
            let procOffering: ProcessOffering;
            this.dataService.setProcessOffering(procOffering);
          }
          this.dataService.setProcesses(procs);
          this.dataService.setSelectedProcessIdentifier(selProcId);
          this.dataService.setGetCapSuccessful(true);
          this.dataService.setExpandedPanel(1);
        }
      });
    } else {
      this.wpsGetCapSuccess = false;
      this.wpsGetCapFail = false;
      this.dataService.setGetCapSuccessful(false);
    }
  }

  wpsServiceUrlChange = (event) => {
    if (this.selectedWpsServiceUrl === 'WPS_ADD_SELECTED') {
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
