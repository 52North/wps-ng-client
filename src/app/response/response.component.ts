import { Component, OnInit, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from '../services/data.service';
import { ResponseDocument, ExecuteResponse } from '../model/execute-response';
import { HttpGetService } from '../services/http-get.service';
import { AppSettings } from '../model/app-setting';

declare var WpsService: any;

@Component({
  selector: 'app-response',
  templateUrl: './response.component.html',
  styleUrls: ['./response.component.scss']
})
export class ResponseComponent implements OnInit {
  @Input() disabled: boolean;
  @Input() expanded: boolean;
  @Input() addLayerOnMap;
  @Input() addWMSLayerOnMap;

  executeResponse: ExecuteResponse;
  responseDocument: ResponseDocument;
  webProcessingService: any;
  error: {
    textStatus: string;
    errorThrown: string;
  };

  appSettings: AppSettings = undefined;
  executionPressed: boolean;
  responseDocumentAvailable: boolean;
  wpsExecuteLoading = false;
  refreshInProgress = false;
  btn_autorefresh_icon = 'loop';
  refreshing = false;
  fetchingReferencedOutputs = false;
  btn_refresh_color = 'primary';
  refreshInterval = 5000;

  constructor(translate: TranslateService, private dataService: DataService, private httpGetService: HttpGetService) {
    this.dataService.webProcessingService$.subscribe(
      wps => {
        this.webProcessingService = wps;
      }
    );
    this.dataService.expandedPanel$.subscribe(
      panel => {
        if (panel === 3) {
          this.expanded = true;
        } else {
          this.expanded = false;
        }
      }
    );
    this.dataService.executeResponse$.subscribe(
      executeResponse => {
        console.log(executeResponse);
        this.executeResponse = executeResponse;
        this.executionPressed = true;
        if (this.executeResponse !== undefined) {
          this.responseDocumentAvailable = true;
          this.responseDocument = this.executeResponse.responseDocument;
        } else {
          this.responseDocument = undefined;
        }
      }
    );
    this.dataService.wpsExecuteLoading$.subscribe(
      executeLoading => {
        this.wpsExecuteLoading = executeLoading;
      }
    );
  }

  ngOnInit() {
    this.dataService.errorResponse$.subscribe(
      error => {
        this.error = error;
        this.disabled = false;
      }
    );
    this.httpGetService.getAppSettings()
      .subscribe((settings: AppSettings) => {
        this.appSettings = settings;
        if (this.appSettings.asyncAutoRefreshInterval !== undefined && typeof this.appSettings.asyncAutoRefreshInterval === 'number') {
          this.refreshInterval = this.appSettings.asyncAutoRefreshInterval;
        } else {
          this.refreshInterval = 5000;
        }
      });
  }

  refresh() {
    const jobId = this.responseDocument.jobId;
    if (this.responseDocument.version && this.responseDocument.version === '1.0.0') {
      const documentLocation = this.responseDocument.statusLocation;
      this.webProcessingService.parseStoredExecuteResponse_WPS_1_0((resp) => {
        this.refreshInProgress = false;
        if (resp.executeResponse) {
          this.executeResponse = resp.executeResponse;
          this.responseDocument = this.executeResponse.responseDocument;
          const jobId = this.executeResponse.responseDocument.jobId;
          if (this.responseDocument.status !== undefined
            && this.responseDocument.status.info !== undefined
            && this.responseDocument.status.info.includes('percentCompleted:')) {
            this.responseDocument.percentCompleted =
              this.responseDocument.status.info.substring(
                this.responseDocument.status.info.indexOf('percentCompleted:') + 17);
          }
          for (const output of this.responseDocument.outputs) {
            if (output.data.complexData && output.data.complexData !== undefined) {
              const complexData = output.data.complexData;
              if (complexData.mimeType
                && complexData.mimeType !== undefined
                && complexData.mimeType === 'application/vnd.geo+json') {
                if (complexData.value.includes('<![CDATA[')) {
                  complexData.value = this.unCDATAOutput(complexData.value);
                }
                const geojsonOutput = JSON.parse(complexData.value);
                for (const feature of geojsonOutput.features) {
                  feature.properties['OUTPUT'] = output.identifier;
                }
                this.addLayerOnMap(output.identifier, geojsonOutput, false, jobId);
              } else if (complexData.mimeType
                && complexData.mimeType !== undefined
                && complexData.mimeType === 'application/WMS') {
                // get wms URL:
                if (complexData.value.includes('<![CDATA[')) {
                  complexData.value = this.unCDATAOutput(complexData.value);
                }
                const wmsTargetUrl = complexData.value;
                // encode URL:
                const regex = new RegExp('[?&]' + 'layers' + '(=([^&#]*)|&|#|$)');
                const resultsArray = regex.exec(wmsTargetUrl);
                const layerNamesString = decodeURIComponent(resultsArray[2].replace(/\+/g, ' '));
                let wmsBaseUrl = wmsTargetUrl.split('?')[0];
                wmsBaseUrl = wmsBaseUrl + '?';
                const wmsLayer = {
                  name: 'Output: ' + output.identifier,
                  type: 'wms',
                  visible: true,
                  url: wmsBaseUrl,
                  layerParams: {
                    layers: layerNamesString,
                    format: 'image/png',
                    transparent: true
                  }
                };
                this.addWMSLayerOnMap(wmsBaseUrl, layerNamesString, 'Output: ' + output.identifier, jobId);
              }
            }
          }
        }
      }, documentLocation);
    } else {
      this.webProcessingService.getStatus_WPS_2_0((response: any) => {
        console.log(response);
        this.refreshInProgress = false;
        this.executeResponse = response.executeResponse;
        this.responseDocument = this.executeResponse.responseDocument;
        if (this.responseDocument.status === 'Failed') {
          this.dataService.setResponseError({
            'textStatus': 'error',
            'errorThrown': ''
          });
        } else {
          this.dataService.setResponseError(undefined);
        }
      }, jobId);
    }
  }

  trimStartDigits(outputvalue) {
    const idx = outputvalue.indexOf('<![CDATA[');
    return outputvalue.substring(idx, 0);
  }

  unCDATAOutput(outputvalue) {
    this.trimStartDigits(outputvalue);
    const trimmedStart = outputvalue.replace('<![CDATA[', '');
    const trimmedEnd = trimmedStart.replace(']]>', '');
    return trimmedEnd;
  }

  refreshingAutomatically() {
    if (this.responseDocument.status !== 'Succeeded'
      && (this.responseDocument.status !== undefined && this.responseDocument.status.info !== 'wps:ProcessSucceeded')
      && this.responseDocument.status !== 'Failed') {
      if (!this.refreshing) {
        this.refreshing = true;
        this.animateRefreshing();
      }
      if (this.refreshing) {
        this.refresh();
      }
      setTimeout(() => {
        if (this.refreshing) {
          this.refreshInProgress = true;
          this.refreshingAutomatically();
        }
      }, this.refreshInterval);
    } else {
      this.refreshing = false;
      this.refreshInProgress = false;
      this.btn_refresh_color = 'primary';
      if (this.responseDocument.status === 'Failed') {
        this.dataService.setResponseError({
          'textStatus': 'error',
          'errorThrown': ''
        });
      } else {
        this.dataService.setResponseError(undefined);
      }
    }
  }

  btn_onRefreshStatusAutomatically() {
    if (this.refreshing) {
      this.refreshing = !this.refreshing;
      console.log('refreshing canceled.');
      this.btn_refresh_color = 'primary';
    } else {
      this.btn_refresh_color = 'accent';
      this.refreshingAutomatically();
      console.log('refreshing started.');
    }
  }

  animateRefreshing() {
    if (this.refreshing) {
      if (this.responseDocument.status !== 'Succeeded'
        && (this.responseDocument.status !== undefined && this.responseDocument.status.info !== 'wps:ProcessSucceeded')
        && this.responseDocument.status !== 'Failed') {
        setTimeout(() => {
          if (this.btn_autorefresh_icon === 'loop') {
            this.btn_autorefresh_icon = 'cached';
          } else {
            this.btn_autorefresh_icon = 'loop';
          }
          this.animateRefreshing();
        }, 250);
      } else {
        this.refreshing = false;
        this.refreshInProgress = false;
        if (this.responseDocument.status === 'Failed') {
          this.dataService.setResponseError({
            'textStatus': 'error',
            'errorThrown': ''
          });
        } else {
          this.dataService.setResponseError(undefined);
        }
      }
    }
  }

  btn_onRefreshStatus() {
    this.refresh();
  }

  btn_onGetResult() {
    const jobId = this.responseDocument.jobId;
    this.webProcessingService.getResult_WPS_2_0((resp) => {
      this.executeResponse = resp.executeResponse;
      this.responseDocument = this.executeResponse.responseDocument;
      const jobId = this.executeResponse.responseDocument.jobId;
      // add outputs as layers:
      for (const output of this.executeResponse.responseDocument.outputs) {
        if (output.reference === undefined && output.data.complexData && output.data.complexData !== undefined) {
          const complexData = output.data.complexData;
          if (complexData.mimeType
            && complexData.mimeType !== undefined
            && complexData.mimeType === 'application/vnd.geo+json') {
            if (complexData.value.includes('<![CDATA[')) {
              complexData.value = this.unCDATAOutput(complexData.value);
            }
            const geojsonOutput = JSON.parse(complexData.value);
            for (const feature of geojsonOutput.features) {
              feature.properties['OUTPUT'] = output.identifier;
            }
            this.addLayerOnMap(output.identifier, geojsonOutput, false, jobId);
          } else if (complexData.mimeType
            && complexData.mimeType !== undefined
            && complexData.mimeType === 'application/WMS') {
            // get wms URL:
            if (complexData.value.includes('<![CDATA[')) {
              complexData.value = this.unCDATAOutput(complexData.value);
            }
            const wmsTargetUrl = complexData.value;
            // encode URL:
            const regex = new RegExp('[?&]' + 'layers' + '(=([^&#]*)|&|#|$)');
            const resultsArray = regex.exec(wmsTargetUrl);
            const layerNamesString = decodeURIComponent(resultsArray[2].replace(/\+/g, ' '));
            let wmsBaseUrl = wmsTargetUrl.split('?')[0];
            wmsBaseUrl = wmsBaseUrl + '?';
            const wmsLayer = {
              name: 'Output: ' + output.identifier,
              type: 'wms',
              visible: true,
              url: wmsBaseUrl,
              layerParams: {
                layers: layerNamesString,
                format: 'image/png',
                transparent: true
              }
            };
            this.addWMSLayerOnMap(wmsBaseUrl, layerNamesString, 'Output: ' + output.identifier, jobId);
          }
        }
      }
    }, jobId);
  }

  btn_fetchAndVisualize(output: any, jobId: string) {
    this.fetchingReferencedOutputs = true;
    this.httpGetService.getReferencedOutput(output.reference.href)
      .subscribe((data: any) => {
        for (const feature of data.features) {
          feature.properties['OUTPUT'] = output.identifier;
        }
        this.addLayerOnMap(output.identifier, data, false, jobId);
        this.fetchingReferencedOutputs = false;
        output.isFetched = true;
      });
  }

  btn_downloadReferencedOutput(output) {
    console.log(output);
    this.httpGetService.getReferencedOutput(output.reference.href)
      .subscribe((data: any) => {
        console.log(data);
      });
  }

  setExpanded = (opened: boolean) => {
    if (opened) {
      this.dataService.setExpandedPanel(3);
    }
  }

}
