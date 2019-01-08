import { Component, OnInit, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { DataService } from '../services/data.service';
import { ProcessOffering, ProcessOfferingProcess } from '../model/process-offering';

declare var WpsService: any;

@Component({
  selector: 'app-process-specification',
  templateUrl: './process-specification.component.html',
  styleUrls: ['./process-specification.component.scss']
})
export class ProcessSpecificationComponent implements OnInit {
  @Input() disabled: boolean;
  @Input() expanded: boolean;
  @Input() disableAllDrawer;
  @Input() btn_drawPolyline;
  @Input() btn_drawPolygon;
  @Input() btn_drawRectangle;
  @Input() btn_drawCircle;
  @Input() btn_drawMarker;
  @Input() btn_drawSelector;

  webProcessingService: any;
  processOffering: ProcessOffering;
  selectedProcess: ProcessOfferingProcess;
  processes: ProcessOfferingProcess[];
  selectedProcessIdentifier: string;

  hasUnsetDefaultValues: boolean = false;
  processInputsDone: boolean = false;
  geojsonOutputsExist: boolean = false;
  currentInput: any;
  polylineDrawer: {
    _enabled: boolean
  };
  polygonDrawer: {
    _enabled: boolean
  };
  rectangleDrawer: {
    _enabled: boolean
  };
  circleDrawer: {
    _enabled: boolean
  };
  markerDrawer: {
    _enabled: boolean
  };
  selectionDrawer: {
    _enabled: boolean
  };

  subscription: Subscription;

  constructor(private dataService: DataService) {
    this.dataService.webProcessingService$.subscribe(
      wps => {
        this.webProcessingService = wps;
      }
    )
    this.subscription = dataService.processOffering$.subscribe(
      procOffering => {
        this.processOffering = procOffering;
      }
    );
    this.subscription = dataService.expandedPanel$.subscribe(
      panel => {
        if (panel === 1) {
          this.expanded = true;
        } else {
          this.expanded = false;
        }
      }
    )
    this.subscription = dataService.processes$.subscribe(
      processes => {
        this.processes = processes;
      }
    )
    this.dataService.processIdentifier$.subscribe(
      processId => {
        this.selectedProcessIdentifier = processId;
        if (this.selectedProcessIdentifier != 'SELECT_PROCESS_HINT') {
          this.describeProcess();
        }
      }
    )
    this.dataService.processInputsDone$.subscribe(
      processInputsDone => {
        this.processInputsDone = processInputsDone;
      }
    )
    this.dataService.currentInput$.subscribe(
      input => {
        this.currentInput = input;
      }
    )
    this.dataService.geojsonOutputExists$.subscribe(
      exists => {
        this.geojsonOutputsExist = exists;
      }
    )
  }

  ngOnInit() {
    this.currentInput = undefined;
    this.polylineDrawer = {
      _enabled: false
    }
    this.polygonDrawer = {
      _enabled: false
    }
    this.rectangleDrawer = {
      _enabled: false
    }
    this.circleDrawer = {
      _enabled: false
    }
    this.markerDrawer = {
      _enabled: false
    }
    this.selectionDrawer = {
      _enabled: false
    }
    this.dataService.polyLineDrawerEnabled$.subscribe(
      enabled => {
        this.polylineDrawer._enabled = enabled;
      }
    );
    this.dataService.polygonDrawerEnabled$.subscribe(
      enabled => {
        this.polygonDrawer._enabled = enabled;
      }
    );
    this.dataService.rectangleDrawerEnabled$.subscribe(
      enabled => {
        this.rectangleDrawer._enabled = enabled;
      }
    );
    this.dataService.circleDrawerEnabled$.subscribe(
      enabled => {
        this.circleDrawer._enabled = enabled;
      }
    );
    this.dataService.markerDrawerEnabled$.subscribe(
      enabled => {
        this.markerDrawer._enabled = enabled;
      }
    );
    this.dataService.selectionDrawerEnabled$.subscribe(
      enabled => {
        this.selectionDrawer._enabled = enabled;
      }
    );
    this.geojsonOutputsExist = false;
  }

  describeProcess = () => {
    console.log("describeProcess());");
    console.log(this.selectedProcessIdentifier);
    this.webProcessingService.describeProcess_GET((callback) => {
      let procOffering: ProcessOffering = undefined;
      if (callback.processOffering && callback.processOffering != undefined) {
        procOffering = callback.processOffering;
        procOffering.selectedExecutionMode = "SELECT_EXECUTION_MODE_HINT";
        if (environment.defaultExecutionMode
          && environment.defaultExecutionMode != undefined) {
          if (procOffering.jobControlOptions.includes(environment.defaultExecutionMode)) {
            procOffering.selectedExecutionMode = environment.defaultExecutionMode;
          }
        }
        procOffering.selectedResponseFormat = "document";
        if (environment.defaultResponseFormat
          && environment.defaultResponseFormat != undefined) {
          if (["document", "raw"].includes(environment.defaultResponseFormat)) {
            procOffering.selectedResponseFormat = environment.defaultResponseFormat;
          }
        }
        this.processOffering = procOffering;
        this.setDefaultFormat();
        this.checkInputsForCompleteness("");
      } else {
        this.processOffering = procOffering;
        // feedback to user: describeProcess was errorneous
      }
      this.dataService.setProcessOffering(procOffering);
    }, this.selectedProcessIdentifier);
  }

  checkInputsForCompleteness = (event) => {
    if (this.selectedProcessIdentifier == undefined) {
      this.dataService.setProcessInputsDone(true);
      return true;
    }
    let boolTemp = true;
    let hasDefValues = false;
    for (let input of this.processOffering.process.inputs) {
      if (input.minOccurs > 0 &&
        (input.enteredValue == undefined ||
          input.enteredValue.length == 0) &&
        !input.boundingBoxData) {
        boolTemp = false;
      }
      if (input.minOccurs > 0 &&
        input.boundingBoxData) {
        this.validateBothBBoxCorners("", input, "");
        boolTemp = boolTemp && input.validBbox;
      }
      if (input.literalData
        && input.literalData != undefined
        && input.literalData.literalDataDomains
        && input.literalData.literalDataDomains != undefined
        && input.literalData.literalDataDomains[0].defaultValue
        && input.literalData.literalDataDomains[0].defaultValue != undefined) {
        if (!input.enteredValue && (input.enteredValue == undefined || input.enteredValue.length == 0)) {
          hasDefValues = true;
        }
      }
    }
    this.hasUnsetDefaultValues = hasDefValues;
    this.processInputsDone = boolTemp;
    this.dataService.setProcessInputsDone(boolTemp);
    console.log(this.processInputsDone);
  }

  setTransmissionModes(output) {
    output.selectedTransmissionMode = "SELECT_TRANSMISSION_MODE_HINT";
    if (environment.defaultTransmissionMode
      && environment.defaultTransmissionMode != undefined) {
      if (this.processOffering.outputTransmissionModes.includes(environment.defaultTransmissionMode)) {
        output.selectedTransmissionMode = environment.defaultTransmissionMode;
      }
    }
  }

  setDefaultLiteralValue() {
    for (let input of this.processOffering.process.inputs) {
      if (input.literalData) {
        input.enteredValue = 'LITERAL_VALUE_HINT';
      }
    }
  }

  validateBothBBoxCorners(event, input, coord) {
    if (input != undefined
      && input.botLeft
      && input.botLeft != undefined
      && input.topRight
      && input.topRight != undefined
      && (this.validateBBoxCorner('', input, input.botLeft))
      && (this.validateBBoxCorner('', input, input.topRight))) {
      input.validBbox = true;
    } else {
      input.validBbox = false;
      return false;
    }
  }

  validateBBoxCorner(event, input, coord) {
    let boolTemp = false;
    if (coord != undefined
      && coord.length != 0
      && ((coord.indexOf(' ') > -1)
        || (coord.indexOf(',') > -1))) {
      let coords: string[] = coord.split(" ");
      if (coords.length == 2) {
        if ((isNaN(coords[0] as any) || (coords[0].length == 0))
          || (isNaN(coords[1] as any) || (coords[1].length == 0))) {
          boolTemp = false;
          input.validBbox = false;
          return false;
        } else {
          boolTemp = true;
        }
      } else {
        coords = coord.split(",");
        if (coords.length == 2) {
          if ((isNaN(coords[0] as any) || (coords[0].length == 0))
            || (isNaN(coords[1] as any) || (coords[1].length == 0))) {
            boolTemp = false;
            input.validBbox = false;
            return false;
          } else {
            boolTemp = true;
          }
        }
      }
    }
    return boolTemp;
  }

  setDefaultFormat = () => {
    // default input format:
    let mimeTypeFound: boolean = false;
    let schemaFound: boolean = false;
    let encodingFound: boolean = false;
    console.log(this.processOffering);
    for (let input of this.processOffering.process.inputs) {
      mimeTypeFound = false;
      schemaFound = false;
      encodingFound = false;
      if (input.complexData) {
        input.selectedFormat = "SELECT_MIMETYPE_HINT";
        input.selectedInputType = "option3";
        if (environment.defaultMimeType
          && environment.defaultMimeType != undefined) {
          for (let format of input.complexData.formats) {
            if (format.mimeType == environment.defaultMimeType) {
              if (!mimeTypeFound) {
                mimeTypeFound = true;
                input.selectedFormat = format;
              }
              if (environment.defaultSchema
                && environment.defaultSchema != undefined
                && environment.defaultSchema == format.schema) {
                schemaFound = true;
                input.selectedFormat = format;
              }
              if (environment.defaultEncoding
                && environment.defaultEncoding != undefined
                && environment.defaultEncoding == format.encoding) {
                if (!schemaFound) {
                  encodingFound = true;
                  input.selectedFormat = format;
                }
              }
            }
          }
        }
        if (input.selectedFormat.mimeType == "application/vnd.geo+json") {
          input.selectedInputType = 'option4';
        }
      } else if (input.literalData) {
        input.selectedFormat = "SELECT_MIMETYPE_HINT";
        if (environment.defaultMimeType
          && environment.defaultMimeType != undefined) {
          console.log(input);
          if (input.literalData.formats != undefined) {
            for (let format of input.literalData.formats) {
              if (format.mimeType == environment.defaultMimeType) {
                if (!mimeTypeFound) {
                  mimeTypeFound = true;
                  input.selectedFormat = format;
                }
                if (environment.defaultSchema
                  && environment.defaultSchema != undefined
                  && environment.defaultSchema == format.schema) {
                  schemaFound = true;
                  input.selectedFormat = format;
                }
                if (environment.defaultEncoding
                  && environment.defaultEncoding != undefined
                  && environment.defaultEncoding == format.encoding) {
                  if (!schemaFound) {
                    encodingFound = true;
                    input.selectedFormat = format;
                  }
                }
              }
            }
          }
        }
      } else if (input.boundingBoxData) {
        input.selectedCRS = 'SELECT_CRS_HINT';
      }
    }
    // default output format:
    for (let output of this.processOffering.process.outputs) {
      mimeTypeFound = false;
      schemaFound = false;
      encodingFound = false;
      this.setTransmissionModes(output);
      if (output.complexData) {
        output.selectedFormat = "SELECT_MIMETYPE_HINT";
        if (environment.defaultOutputMimeType
          && environment.defaultOutputMimeType != undefined) {
          for (let format of output.complexData.formats) {
            if (format.mimeType == environment.defaultOutputMimeType) {
              if (!mimeTypeFound) {
                mimeTypeFound = true;
                output.selectedFormat = format;
              }
              if (environment.defaultOutputSchema
                && environment.defaultOutputSchema != undefined
                && environment.defaultOutputSchema == format.schema) {
                schemaFound = true;
                output.selectedFormat = format;
              }
              if (environment.defaultOutputEncoding
                && environment.defaultOutputEncoding != undefined
                && environment.defaultOutputEncoding == format.encoding) {
                if (!schemaFound) {
                  encodingFound = true;
                  output.selectedFormat = format;
                }
              }
            }
          }
        }
      }
    }
  }

  processInputsChanged($event) {
    this.processInputsDone = $event;
    console.log(this.processInputsDone);
  }

  processSelected(event) {
    console.log(this.selectedProcessIdentifier);
    this.dataService.setSelectedProcessIdentifier(this.selectedProcessIdentifier);
    if (this.selectedProcessIdentifier == "SELECT_PROCESS_HINT") {
      this.selectedProcess = undefined;
      this.processOffering = undefined;
      this.checkInputsForCompleteness("");
      // remove drawnItems:
      for (let input of this.processOffering.process.inputs) {
        if (input.mapItems && input.mapItems != undefined) {
          this.dataService.setRemoveDrawnItems(input.mapItems);
        }
      }
    } else {
      console.log(this.processes);
      for (let process of this.processes) {
        if (this.selectedProcessIdentifier == process.identifier) {
          this.selectedProcess = process;
        }
      }
      // remove drawnItems:
      if (this.processOffering && this.processOffering != undefined
        && this.processOffering.process && this.processOffering.process != undefined
        && this.processOffering.process.inputs && this.processOffering.process.inputs != undefined) {
        for (let input of this.processOffering.process.inputs) {
          if (input.mapItems && input.mapItems != undefined) {
            this.dataService.setRemoveDrawnItems(input.mapItems);
          }
        }
      }
      console.log("describing process...");
      this.describeProcess();
    }
  }

  takeDefaultValues() {
    for (let input of this.processOffering.process.inputs) {
      if (input.literalData
        && input.literalData != undefined
        && input.literalData.literalDataDomains
        && input.literalData.literalDataDomains != undefined
        && input.literalData.literalDataDomains[0].defaultValue
        && input.literalData.literalDataDomains[0].defaultValue != undefined
        && !input.enteredValue) {
        input.enteredValue = input.literalData.literalDataDomains[0].defaultValue;
      }
    }
    this.checkInputsForCompleteness("");
  }

  onInputBBoxCrsChanged(event, input) {
    if (input.selectedCRS != 'SELECT_CRS_HINT') {
      if (input.selectedCRS.toLowerCase() == 'epsg:4326') {
        input.selectedInputType = 'option1'
      } else {
        input.selectedInputType = 'option2'
      }
    }
    this.checkInputsForCompleteness("");
  }

  onInputFormatSelectionChange(event, input) {
    if (input.mapItems != undefined) {
      this.dataService.setRemoveDrawnItems(input.mapItems);
    }
    if (input.selectedFormat.mimeType != 'application/vnd.geo+json' && input.selectedInputType == 'option4') {
      input.selectedInputType = 'option3';
    }
    if (input.selectedFormat.mimeType != 'application/vnd.geo+json') {
      input.selectedInputType = 'option3';
    }
    this.checkInputsForCompleteness("");
    input.enteredValue = "";
  }

  onFormatSelectionChange(event) {
    this.checkInputsForCompleteness("");
  }

  userInputTypeChanged(event, input, index) {
    this.checkInputsForCompleteness("");
  }

  setExpanded = (opened: boolean) => {
    if (opened) {
      this.dataService.setExpandedPanel(1);
    }
  }

}
