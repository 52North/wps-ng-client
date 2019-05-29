import { Component, OnInit, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from '../services/data.service';
import { ProcessOffering, ProcessOfferingProcess } from '../model/process-offering';
import { ExecuteResponse, ResponseDocument, ReferencedOutput } from '../model/execute-response';
import { AppSettings } from '../model/app-setting';
import { HttpGetService } from '../services/http-get.service';

declare var WpsService: any;
declare var InputGenerator: any;
declare var OutputGenerator: any;

@Component({
  selector: 'app-execution',
  templateUrl: './execution.component.html',
  styleUrls: ['./execution.component.scss']
})
export class ExecutionComponent implements OnInit {
  @Input() disabled: boolean;
  @Input() expanded: boolean;
  @Input() disableAllDrawer;
  @Input() addLayerOnMap;
  @Input() addWMSLayerOnMap;

  processInputsDone: boolean;
  translationService: TranslateService;
  processOffering: ProcessOffering = undefined;
  wpsGetCapSuccess: boolean;
  wpsGetCapFail: boolean;
  webProcessingService: any;
  inputGenerator: any;
  outputGenerator: any;
  wpsExecuteLoading = false;
  selectedWpsServiceVersion: string;
  executeResponse: ExecuteResponse;
  responseDocumentAvailable = false;
  selectedProcessIdentifier: string;

  settings: AppSettings;
  subscription: Subscription;

  constructor(translate: TranslateService, private dataService: DataService, private httpGetService: HttpGetService) {
    this.translationService = translate;
    this.dataService.webProcessingService$.subscribe(
      wps => {
        this.webProcessingService = wps;
      }
    );
    this.dataService.processOffering$.subscribe(
      procOffering => {
        this.processOffering = procOffering;
        console.log(this.processOffering);
      }
    );
    this.subscription = dataService.expandedPanel$.subscribe(
      panel => {
        if (panel === 2) {
          this.expanded = true;
        } else {
          this.expanded = false;
        }
      }
    );
    this.dataService.processInputsDone$.subscribe(
      processInputsDone => {
        this.processInputsDone = processInputsDone;
      }
    );
    this.dataService.getCapSuccess$.subscribe(
      success => {
        this.wpsGetCapSuccess = success;
        this.wpsGetCapFail = !success;
      }
    );
    this.dataService.wpsVersion$.subscribe(
      wpsVersion => {
        this.selectedWpsServiceVersion = wpsVersion;
      }
    );
    this.dataService.processIdentifier$.subscribe(
      processId => {
        this.selectedProcessIdentifier = processId;
      }
    );
  }

  ngOnInit() {
    this.httpGetService.getAppSettings()
      .subscribe((settings: AppSettings) => {
        this.settings = settings;
      });
  }

  btn_onExecute() {
    this.dataService.setResponseError(undefined);
    this.dataService.setCurrentInput(undefined);
    this.dataService.setExecuteResponse(undefined);
    this.dataService.setResponseDocument(undefined);
    this.disableAllDrawer();
    this.wpsExecuteLoading = true;
    this.dataService.setWpsExecuteLoading(true);
    this.inputGenerator = new InputGenerator();
    this.outputGenerator = new OutputGenerator();
    const generatedInputs = [];
    const generatedOutputs = [];
    // create inputs
    for (const input of this.processOffering.process.inputs) {
      if (input.literalData
        && input.literalData !== undefined
        && input.enteredValue
        && input.enteredValue !== undefined
        && input.enteredValue.length > 0) {
        const literalInput =
          this.inputGenerator.createLiteralDataInput_wps_1_0_and_2_0(
            input.identifier,
            undefined,
            undefined,
            input.enteredValue);
        generatedInputs.push(literalInput);
      }
      if (input.boundingBoxData
        && input.boundingBoxData !== undefined
        && input.validBbox !== undefined
        && input.validBbox === true) {
        const bboxInput =
          this.inputGenerator.createBboxDataInput_wps_1_0_and_2_0(
            input.identifier,
            input.selectedCRS,
            undefined,
            input.botLeft.indexOf(' ') > -1 ? input.botLeft : input.botLeft.replace(',', ' '),
            input.topRight.indexOf(' ') > -1 ? input.topRight : input.topRight.replace(',', ' ')
          );
        generatedInputs.push(bboxInput);
      }
      if (input.complexData
        && input.complexData !== undefined
        && input.enteredValue
        && input.enteredValue !== undefined
        && input.enteredValue.length > 0) {
        if (input.selectedFormat.mimeType === 'application/vnd.geo+json') {
          // remove possible 'output' property from selection input method:
          const gjson = JSON.parse(input.enteredValue);
          for (const feature of gjson.features) {
            if (feature.properties.hasOwnProperty('OUTPUT')) {
              delete feature.properties['OUTPUT'];
            }
          }
          input.enteredValue = JSON.stringify(gjson);
        }
        const complexInput =
          this.inputGenerator.createComplexDataInput_wps_1_0_and_2_0(
            input.identifier,
            input.selectedFormat.mimeType,
            input.selectedFormat.schema,
            input.selectedFormat.encoding,
            input.selectedInputType === 'option1',
            input.enteredValue);
        generatedInputs.push(complexInput);
      }
    }

    // create outputs
    for (const output of this.processOffering.process.outputs) {
      let newOutput;
      if (output.literalData
        && output.literalData !== undefined
        && output.selectedTransmissionMode !== 'SELECT_TRANSMISSION_MODE_HINT') {
        switch (this.selectedWpsServiceVersion) {
          case '1.0.0':
            newOutput = this.outputGenerator.createLiteralOutput_WPS_1_0(
              output.identifier,
              output.selectedTransmissionMode === 'reference'
            );
            generatedOutputs.push(newOutput);
            break;
          case '2.0.0':
          default:
            newOutput = this.outputGenerator.createLiteralOutput_WPS_2_0(
              output.identifier,
              output.selectedTransmissionMode
            );
            generatedOutputs.push(newOutput);
            break;
        }
      }
      if (output.boundingBoxData
        && output.boundingBoxData !== undefined
        && output.selectedTransmissionMode !== 'SELECT_TRANSMISSION_MODE_HINT') {
        switch (this.selectedWpsServiceVersion) {
          case '1.0.0':
            newOutput = this.outputGenerator.createLiteralOutput_WPS_1_0(
              output.identifier,
              output.selectedTransmissionMode === 'reference'
            );
            generatedOutputs.push(newOutput);
            break;
          case '2.0.0':
          default:
            newOutput = this.outputGenerator.createLiteralOutput_WPS_2_0(
              output.identifier,
              output.selectedTransmissionMode
            );
            generatedOutputs.push(newOutput);
            break;
        }
      }
      if (output.complexData
        && output.complexData !== undefined
        && output.selectedTransmissionMode !== 'SELECT_TRANSMISSION_MODE_HINT'
        && output.selectedFormat !== 'SELECT_MIMETYPE_HINT') {
        switch (this.selectedWpsServiceVersion) {
          case '1.0.0':
            newOutput = this.outputGenerator.createComplexOutput_WPS_1_0(
              output.identifier,
              output.selectedFormat.mimeType,
              output.selectedFormat.schema,
              output.selectedFormat.encoding,
              undefined,
              output.selectedTransmissionMode === 'reference',
              undefined,
              undefined
            );
            generatedOutputs.push(newOutput);
            break;
          case '2.0.0':
          default:
            console.log(output);
            newOutput = this.outputGenerator.createComplexOutput_WPS_2_0(
              output.identifier,
              output.selectedFormat.mimeType,
              output.selectedFormat.schema,
              output.selectedFormat.encoding,
              output.selectedTransmissionMode
            );
            console.log(newOutput);
            generatedOutputs.push(newOutput);
            break;
        }
      }
    }

    // execute the request
    try {
      this.webProcessingService.execute(
        (callback) => {
          console.log(callback);
          if (callback.textStatus && callback.textStatus !== undefined && callback.textStatus === 'error') {
            this.wpsExecuteLoading = false;
            this.dataService.setWpsExecuteLoading(false);
            const error = {
              'textStatus': callback.textStatus,
              'errorThrown': callback.errorThrown
            };
            this.dataService.setResponseError(error);
            this.dataService.setExpandedPanel(3);
          } else {
            console.log(callback);
            this.executeResponse = callback.executeResponse;
            this.dataService.setExecuteResponse(this.executeResponse);
            this.responseDocumentAvailable = true;
            this.wpsExecuteLoading = false;
            this.dataService.setWpsExecuteLoading(false);
            const jobId = this.executeResponse.responseDocument.jobId;
            // add inputs as layers:
            for (const input of this.processOffering.process.inputs) {
              if (input.selectedFormat && input.selectedFormat !== undefined) {
                const selectedFormat = input.selectedFormat;
                if (selectedFormat.mimeType
                  && selectedFormat.mimeType !== undefined
                  && selectedFormat.mimeType === 'application/vnd.geo+json'
                  && input.selectedInputType === 'option4') {
                  const geojsonInput = JSON.parse(input.enteredValue);
                  for (const feature of geojsonInput.features) {
                    feature.properties['INPUT'] = input.identifier;
                  }
                  this.addLayerOnMap(input.identifier, geojsonInput, true, jobId);
                  this.dataService.addLayerOnMap(input.mapItems);
                } else if (input.boundingBoxData &&
                  input.boundingBoxData !== undefined &&
                  input.selectedCRS === 'EPSG:4326') {
                  // bounding box input:
                  const geojsonInput = this.bboxToGeojson(input, true);
                  this.addLayerOnMap(input.identifier, geojsonInput, true, jobId);
                  this.dataService.addLayerOnMap(input.mapItems);
                }
              }
            }
            // add outputs as layers:
            if (this.executeResponse.responseDocument.outputs !== undefined) {
              for (const output of this.executeResponse.responseDocument.outputs) {
                if (output.reference === undefined && output.data.complexData && output.data.complexData !== undefined) {
                  const complexData = output.data.complexData;
                  console.log(complexData);
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
                } else if (output.boundingBoxData &&
                  output.boundingBoxData !== undefined &&
                  output.selectedCRS === 'EPSG:4326') {
                  // bounding box input:
                  const geojsonInput = this.bboxToGeojson(output, false);
                  this.addLayerOnMap(output.identifier, geojsonInput, true, jobId);
                }
              }
            }
            this.dataService.setExpandedPanel(3);
          }
        },
        this.selectedProcessIdentifier,
        this.processOffering.selectedResponseFormat,
        this.processOffering.selectedExecutionMode.split('-')[0], // FIXME:'a-sync', 'sync' good, but wont work for 'dismiss'
        false, // lineage
        generatedInputs,
        generatedOutputs
      );
    } catch (error) {
      console.log(error);
    }
    /**
  } else {
    this.wpsExecuteLoading = false;
    this.dataService.setWpsExecuteLoading(false);
    this.dataService.setResponseError({
      textStatus: "Execution ResponseFormat 'raw' is currently not supported.",
      errorThrown: "Unsupported ResponseFormat."
    });
    this.dataService.setExpandedPanel(3);
  }
  */
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

  onResponseFormatSelected() {
    this.dataService.setProcessOffering(this.processOffering);
  }

  bboxToGeojson(bboxInput, isInput: boolean) {
    const geojsonInput = {
      'type': 'FeatureCollection',
      'features': [
        {
          'type': 'Feature',
          'properties': {
          },
          'geometry': {
            'type': 'Polygon',
            'coordinates': []
          }
        }
      ]
    };
    if (isInput) {
      geojsonInput.features[0].properties['INPUT'] = bboxInput.identifier;
    } else {
      geojsonInput.features[0].properties['OUTPUT'] = bboxInput.identifier;
    }
    const y_min = Number(bboxInput.botLeft.split(' ')[0]);
    const x_min = Number(bboxInput.botLeft.split(' ')[1]);
    const y_max = Number(bboxInput.topRight.split(' ')[0]);
    const x_max = Number(bboxInput.topRight.split(' ')[1]);
    const polygonBbox = [];
    polygonBbox.push([x_min, y_min]);
    polygonBbox.push([x_min, y_max]);
    polygonBbox.push([x_max, y_max]);
    polygonBbox.push([x_max, y_min]);
    polygonBbox.push([x_min, y_min]);
    geojsonInput.features[0].geometry.coordinates.push(polygonBbox);
    return geojsonInput;
  }

  onExecutionModeSelected(event) {
  }

  setExpanded = (opened: boolean) => {
    if (opened) {
      this.dataService.setExpandedPanel(2);
    }
  }

}
