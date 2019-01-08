import { Component, OnInit, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from '../services/data.service';
import { ResponseDocument, ExecuteResponse } from '../model/execute-response';

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

  executionPressed: boolean;
  responseDocumentAvailable: boolean;
  wpsExecuteLoading: boolean = false;

  constructor(translate: TranslateService, private dataService: DataService) {
    this.dataService.webProcessingService$.subscribe(
      wps => {
        this.webProcessingService = wps;
      }
    )
    this.dataService.expandedPanel$.subscribe(
      panel => {
        if (panel === 3) {
          this.expanded = true;
        } else {
          this.expanded = false;
        }
      }
    )
    this.dataService.executeResponse$.subscribe(
      executeResponse => {
        this.executeResponse = executeResponse;
        this.responseDocumentAvailable = true;
        this.executionPressed = true;
        this.responseDocument = this.executeResponse.responseDocument;
      }
    )
    this.dataService.wpsExecuteLoading$.subscribe(
      executeLoading => {
        this.wpsExecuteLoading = executeLoading;
      }
    )
  }

  ngOnInit() {
  }

  btn_onRefreshStatusAutomatically() {
    if (this.responseDocument.status != 'Succeeded'
      && this.responseDocument.status.info != 'wps:ProcessSucceeded') {
      setTimeout(() => {
        this.btn_onRefreshStatus();
        this.btn_onRefreshStatusAutomatically();
      }, 5000);
    }
  }

  btn_onRefreshStatus() {
    let jobId = this.responseDocument.jobId;
    if (this.responseDocument.version && this.responseDocument.version == "1.0.0") {
      let documentLocation = this.responseDocument.statusLocation;
      this.webProcessingService.parseStoredExecuteResponse_WPS_1_0((resp) => {
        if (resp.executeResponse) {
          this.executeResponse = resp.executeResponse;
          this.responseDocument = this.executeResponse.responseDocument;
          let jobId = this.executeResponse.responseDocument.jobId;
          if (this.responseDocument.status != undefined
            && this.responseDocument.status.info != undefined
            && this.responseDocument.status.info.includes('percentCompleted:')) {
            this.responseDocument.percentCompleted =
              this.responseDocument.status.info.substring(
                this.responseDocument.status.info.indexOf('percentCompleted:') + 17);
          }
          for (let output of this.responseDocument.outputs) {
            if (output.data.complexData && output.data.complexData != undefined) {
              let complexData = output.data.complexData;
              if (complexData.mimeType
                && complexData.mimeType != undefined
                && complexData.mimeType == 'application/vnd.geo+json') {
                let geojsonOutput = JSON.parse(complexData.value);
                for (let feature of geojsonOutput.features) {
                  feature.properties['OUTPUT'] = output.identifier;
                }
                this.addLayerOnMap(output.identifier, geojsonOutput, false, jobId);
              }
            }
          }
        }
      }, documentLocation);
    } else {
      this.webProcessingService.getStatus_WPS_2_0((response: any) => {
        this.executeResponse = response.executeResponse;
        this.responseDocument = this.executeResponse.responseDocument;
      }, jobId);
    }
  }

  btn_onGetResult() {
    let jobId = this.responseDocument.jobId;
    this.webProcessingService.getResult_WPS_2_0((resp) => {
      this.executeResponse = resp.executeResponse;
      this.responseDocument = this.executeResponse.responseDocument;
      let jobId = this.executeResponse.responseDocument.jobId;
      // add outputs as layers:
      for (let output of this.executeResponse.responseDocument.outputs) {
        if (output.data.complexData && output.data.complexData != undefined) {
          let complexData = output.data.complexData;
          if (complexData.mimeType
            && complexData.mimeType != undefined
            && complexData.mimeType == 'application/vnd.geo+json') {
            let geojsonOutput = JSON.parse(complexData.value);
            for (let feature of geojsonOutput.features) {
              feature.properties['OUTPUT'] = output.identifier;
            }
            this.addLayerOnMap(output.identifier, geojsonOutput, false, jobId);
          } else if (complexData.mimeType
            && complexData.mimeType != undefined
            && complexData.mimeType == 'application/WMS') {
            // get wms URL:
            let wmsTargetUrl = complexData.value;
            wmsTargetUrl = wmsTargetUrl.replace("<![CDATA[", "");
            wmsTargetUrl = wmsTargetUrl.replace("]]>", "");
            // encode URL:
            let regex = new RegExp("[?&]" + "layers" + "(=([^&#]*)|&|#|$)");
            let resultsArray = regex.exec(wmsTargetUrl);
            let layerNamesString = decodeURIComponent(resultsArray[2].replace(/\+/g, " "));
            let wmsBaseUrl = wmsTargetUrl.split("?")[0];
            wmsBaseUrl = wmsBaseUrl + '?';
            let wmsLayer = {
              name: 'Output: ' + output.identifier,
              type: 'wms',
              visible: true,
              url: wmsBaseUrl,
              layerParams: {
                layers: layerNamesString,
                format: 'image/png',
                transparent: true
              }
            }
            this.addWMSLayerOnMap(wmsBaseUrl, layerNamesString);
          }
        }
      }
    }, jobId);
  }

  setExpanded = (opened: boolean) => {
    if (opened) {
      this.dataService.setExpandedPanel(3);
    }
  }
}
