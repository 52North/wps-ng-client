import { Component } from '@angular/core'; import { tileLayer, latLng } from 'leaflet';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../environments/environment';
import { Process } from './model/process';
import { ProcessOffering, ProcessOfferingProcess } from './model/process-offering';
import { ExecuteResponse, ResponseDocument } from './model/execute-response';
import * as L from 'leaflet';

import * as $ from 'jquery';

declare var WpsService: any;
declare var InputGenerator: any;
declare var OutputGenerator: any;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {

    selectedWpsServiceVersion: string = "option1";
    title = 'wps-ng-client';
    options = {
        layers: [
            tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
        ],
        zoom: 5,
        center: latLng(
            environment.startCenter.latitude,
            environment.startCenter.longitude
        )
    };
    layersControl = {
        baseLayers: {
            'Open Street Map': tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
        },
        overlays: {
        }
    }
    startLanguage: string = 'de';
    translationService: TranslateService;
    webProcessingService: any;
    inputGenerator: any;
    outputGenerator: any;
    panelOpenState = false;
    serviceUrls: string[];
    selectedWpsServiceUrl: string;
    wpsGetCapLoading: boolean = false;
    wpsGetCapBlocking: boolean = false;
    wpsGetCapSuccess: boolean = false;
    wpsGetCapFail: boolean = false;
    processes: ProcessOfferingProcess[];
    selectedProcessIdentifier: string;
    selectedProcess: ProcessOfferingProcess;
    processOffering: ProcessOffering;
    processInputs = {};
    processInputsDone: boolean = false;
    executionPressed: boolean = false;
    wpsExecuteLoading: boolean = false;
    executeResponse: ExecuteResponse;
    polylineDrawer: any;
    polygonDrawer: any;
    rectangleDrawer: any;
    circleDrawer: any;
    markerDrawer: any;
    selectionDrawer: any;
    allDrawnItems: any;
    drawOptions = {
        position: 'bottomright',
        draw: {
            circlemarker: false,
            polyline: true
        },
        featureGroup: this.allDrawnItems,
        edit: {
            featureGroup: this.allDrawnItems,
            remove: true
        }
    }
    currentInputFeatureGroup: any;
    map: any;
    currentInput: any;
    showInfoControl: boolean = false;
    hasUnsetDefaultValues: boolean = false;
    info: any;
    inputMarkerIcon: any;
    inputMarkerHighlighIcon: any;
    outputMarkerIcon: any;
    outputMarkerHighlighIcon: any;
    LeafDefaultIcon: any;
    LeafHighlightIcon: any;
    responseDocumentAvailable: boolean = false;
    step: number = 0;
    geojsonOutputsExist: boolean = false;

    constructor(translate: TranslateService) {
        this.translationService = translate;
    }

    ngOnInit() {
        this.options = {
            layers: [
                tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
            ],
            zoom: 12,
            center: latLng(51.9487949, 7.6237527)
        };
        this.layersControl = {
            baseLayers: {
                'Open Street Map': tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
            },
            overlays: {
            }
        };
        if (environment.startZoom) {
            this.options.zoom = environment.startZoom;
        }
        if (environment.startCenter
            && environment.startCenter.latitude
            && environment.startCenter.longitude) {
            this.options.center = latLng(environment.startCenter.latitude, environment.startCenter.longitude);
        }
        if (environment.startLanguage
            && (environment.startLanguage == "en"
                || environment.startLanguage == "de")) {
            this.startLanguage = environment.startLanguage;
        } else {
            this.startLanguage = 'en';
        }
        if (environment.serviceVersion && environment.serviceVersion == "1.0.0") {
            this.selectedWpsServiceVersion = "1.0.0";
        } else {
            this.selectedWpsServiceVersion = "2.0.0";
        }
        if (environment.serviceUrls) {
            this.serviceUrls = environment.serviceUrls;
        } else {
            this.serviceUrls = [];
        }
        if (environment.defaultServiceUrl != undefined &&
            environment.defaultServiceUrl < this.serviceUrls.length) {
            this.selectedWpsServiceUrl =
                this.serviceUrls[environment.defaultServiceUrl];
            this.checkWPService();
        }
        if (environment.showInfoControl != undefined) {
            this.showInfoControl = environment.showInfoControl;
        }
        this.geojsonOutputsExist = false;
    }

    setStep(step: number) {
        this.step = step;
    }

    onMapReady(map: L.Map) {
        this.map = map;
        this.allDrawnItems = L.featureGroup().addTo(this.map);
        this.drawOptions = {
            position: 'bottomright',
            draw: {
                circlemarker: false,
                polyline: true
            },
            featureGroup: this.allDrawnItems,
            edit: {
                featureGroup: this.allDrawnItems,
                remove: true
            }
        }
        this.polylineDrawer = new L.Draw.Polyline(this.map);
        this.polygonDrawer = new L.Draw.Polygon(this.map);
        this.rectangleDrawer = new L.Draw.Rectangle(this.map);
        this.circleDrawer = new L.Draw.Circle(this.map);
        this.markerDrawer = new L.Draw.Marker(this.map);
        this.selectionDrawer = {
            _enabled: false
        }
        if (this.showInfoControl) {
            let heading = this.translationService.instant('INFO_PANEL_HEADING');
            this.info = new L.Control({ position: 'topright' });

            this.info.onAdd = function (map) {
                this._div = L.DomUtil.create('div', 'info-panel'); // create a div with a class "info"
                return this._div;
            };

            // method that we will use to update the control based on feature properties passed
            this.info.update = function (panelTitle, in_out_putTitle, hover_tooltip, props) {
                let content = '<h4>' + panelTitle + '</h4>';
                if (props != undefined) {
                    for (let key of Object.keys(props)) {
                        if (key == 'INPUT') {
                            content = content + '<br /><b>' + in_out_putTitle + '</b>: ' + props[key];
                        } else if (key == 'OUTPUT') {
                            content = content + '<br /><b>' + in_out_putTitle + '</b>: ' + props[key];
                        } else {
                            content = content + "<p><b>" + key + '</b>: ' + props[key] + '</p>';
                        }
                    }
                } else {
                    content = content + "<br/ > " + hover_tooltip + "!";
                }
                this._div.innerHTML = content;
            };
            this.info.addTo(map);
        }
        this.LeafDefaultIcon = L.Icon.extend({
            options: {
                iconUrl: "./assets/marker-icon-blue.png",
                iconSize: [25, 41],
                shadowSize: [41, 41],
                iconAnchor: [12, 41],
                shadowAnchor: [4, 41],
                popupAnchor: [1, -34]
            }
        });
        this.LeafHighlightIcon = L.Icon.extend({
            options: {
                iconUrl: "./assets/marker-icon-blue.png",
                iconSize: [31, 47],
                shadowSize: [47, 47],
                iconAnchor: [15, 47],
                shadowAnchor: [4, 47],
                popupAnchor: [1, -34]
            }
        });
        this.inputMarkerIcon = new this.LeafDefaultIcon({
            iconUrl: "./assets/marker-icon-blue.png"
        });
        this.inputMarkerHighlighIcon = new this.LeafHighlightIcon({
            iconUrl: "./assets/marker-icon-blue.png"
        });
        this.outputMarkerIcon = new this.LeafDefaultIcon({
            iconUrl: "./assets/marker-icon-red.png"
        });
        this.outputMarkerHighlighIcon = new this.LeafHighlightIcon({
            iconUrl: "./assets/marker-icon-red.png"
        });
    };

    updateInfoControl(props, isInput) {
        this.info.update(
            this.translationService.instant('INFO_PANEL_HEADING'),
            isInput ? this.translationService.instant('INPUT') : this.translationService.instant('OUTPUT'),
            this.translationService.instant('INFO_PANEL_HOVER_TIP'),
            props);
    }

    // TODO: CIRCLE --> POLYGON!
    onDrawReady(event) {
        let layer = event.layer;
        if (this.currentInput.boundingBoxData) {
            this.currentInput.botLeft = layer._bounds._southWest.lat + ' ' + layer._bounds._southWest.lng;
            this.currentInput.topRight = layer._bounds._northEast.lat + ' ' + layer._bounds._northEast.lng;
            if (this.currentInput.mapItems
                && this.currentInput.mapItems != undefined) {
                // remove old layer:
                console.log(this.currentInput.mapItems);
                this.map.removeLayer(this.currentInput.mapItems);
            }
            this.currentInput.mapItems = layer;
        } else {
            let inputFeatureCollection;
            if (this.currentInput.enteredValue == undefined || this.currentInput.enteredValue.length == 0) {
                inputFeatureCollection = this.allDrawnItems.toGeoJSON();
            } else {
                inputFeatureCollection = JSON.parse(this.currentInput.enteredValue);
            }
            if (this.isCircle(layer)) {
                inputFeatureCollection.features.push(this.getCircleFeature(layer));
            } else {
                inputFeatureCollection.features.push(layer.toGeoJSON());
            }
            this.currentInput.enteredValue = JSON.stringify(inputFeatureCollection);
            if (this.currentInput.mapItems == undefined) {
                this.currentInput.mapItems = L.geoJSON(
                    inputFeatureCollection, {
                        //                style: style,
                        //                onEachFeature: onEachFeature
                    }).addTo(this.map);
                this.map.removeLayer(this.allDrawnItems);
            } else {
                this.map.removeLayer(this.currentInput.mapItems);
                this.map.removeLayer(this.allDrawnItems);
                this.currentInput.mapItems = L.geoJSON(
                    inputFeatureCollection, {
                        //                style: style,
                        //                onEachFeature: onEachFeature
                    }).addTo(this.map);
            }
            this.map.removeLayer(this.allDrawnItems);
        }
        this.disableAllDrawer();
        this.checkInputsForCompleteness("");
    }

    selectedOutputLayers: any[] = [];
    isSelectedForInput(layer) {
        return this.selectedOutputLayers.includes(layer);
    }

    onInputChanged(event, input) {
        console.log(event);
        let geojsonFile = event.target.files[0];
        console.log(geojsonFile);
        let reader = new FileReader();
        reader.onload = function (e) {
            console.log("file is loaded:");
            // handle onload
            console.log(e);
            let lines = e.target["result"];
            let newArr = JSON.parse(lines);
            // add to complex payload:
            input.enteredValue = JSON.stringify(newArr);
            console.log(input.enteredValue);
        };
        reader.readAsText(geojsonFile);
    }

    disableAllDrawer() {
        this.polylineDrawer.disable();
        this.polygonDrawer.disable();
        this.rectangleDrawer.disable();
        this.circleDrawer.disable();
        this.markerDrawer.disable();
        this.selectionDrawer["_enabled"] = false;
    }

    btn_drawPolyline(input) {
        let wasEnabled = this.polylineDrawer._enabled && this.currentInput == input;
        this.currentInput = input;
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.polylineDrawer.enable();
        }
    }
    btn_drawPolygon(input) {
        let wasEnabled = this.polygonDrawer._enabled && this.currentInput == input;
        this.currentInput = input;
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.polygonDrawer.enable();
        }
    }
    btn_drawRectangle(input) {
        let wasEnabled = this.rectangleDrawer._enabled && this.currentInput == input;
        this.currentInput = input;
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.rectangleDrawer.enable();
        }
    }
    btn_drawCircle(input) {
        let wasEnabled = this.circleDrawer._enabled && this.currentInput == input;
        this.currentInput = input;
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.circleDrawer.enable();
        }
    }
    btn_drawMarker(input) {
        let wasEnabled = this.markerDrawer._enabled && this.currentInput == input;
        this.currentInput = input;
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.markerDrawer.enable();
        }
    }
    btn_drawSelector(input) {
        let wasEnabled = this.selectionDrawer._enabled && this.currentInput == input;
        this.currentInput = input;
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.selectionDrawer["_enabled"] = true;
        }
    }

    setDefaultFormat() {
        // default input format:
        let mimeTypeFound: boolean = false;
        let schemaFound: boolean = false;
        let encodingFound: boolean = false;
        for (let input of this.processOffering.process.inputs) {
            console.log(input);
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

    describeProcess() {
        this.webProcessingService.describeProcess_GET((callback) => {
            if (callback.processOffering && callback.processOffering != undefined) {
                this.processOffering = callback.processOffering;
                this.processOffering.selectedExecutionMode = "SELECT_EXECUTION_MODE_HINT";
                if (environment.defaultExecutionMode
                    && environment.defaultExecutionMode != undefined) {
                    if (this.processOffering.jobControlOptions.includes(environment.defaultExecutionMode)) {
                        this.processOffering.selectedExecutionMode = environment.defaultExecutionMode;
                    }
                }
                this.processOffering.selectedResponseFormat = "document";
                if (environment.defaultResponseFormat
                    && environment.defaultResponseFormat != undefined) {
                    if (["document", "raw"].includes(environment.defaultResponseFormat)) {
                        this.processOffering.selectedResponseFormat = environment.defaultResponseFormat;
                    }
                }
                this.setDefaultFormat();
                this.checkInputsForCompleteness("");
            } else {
                // feedback to user: describeProcess was errorneous
            }
        }, this.selectedProcess.identifier);
    }

    checkWPService() {
        this.wpsGetCapLoading = true;
        this.webProcessingService = new WpsService({
            url: this.selectedWpsServiceUrl,
            version: this.selectedWpsServiceVersion
        });
        this.webProcessingService.getCapabilities_GET((callback) => {
            this.wpsGetCapLoading = false;
            if (callback.textStatus && callback.textStatus == "error") {
                this.wpsGetCapSuccess = false;
                this.wpsGetCapFail = true;
                this.step = 0;
            } else {
                this.wpsGetCapSuccess = true;
                this.wpsGetCapFail = false;
                // fill process array:
                this.processes = [];
                let tempProc = -1;
                this.selectedProcessIdentifier;
                this.processInputsDone = false;
                for (let process of callback.capabilities.processes) {
                    this.processes.push(process);
                    if (environment.defaultProcessIdentifier != undefined &&
                        environment.defaultProcessIdentifier == process.identifier) {
                        // select default process:
                        this.selectedProcessIdentifier = process.identifier;
                        this.selectedProcess = process;
                        this.describeProcess();
                        this.step = 1;
                        tempProc = 0;
                    }
                }
                if (this.selectedProcessIdentifier == undefined
                    || tempProc == -1) {
                    this.selectedProcessIdentifier = "SELECT_PROCESS_HINT";
                    this.processOffering = undefined;
                }
            }
        });
    }

    wpsServiceVersionChange(event) {
        this.wpsGetCapSuccess = false;
        this.wpsGetCapFail = false;
        if (!this.wpsGetCapBlocking) {
            this.checkWPService();
        }
    }

    wpsServiceUrlChange(event) {
        if (this.selectedWpsServiceUrl == "WPS_ADD_SELECTED") {
            this.wpsGetCapBlocking = true;
            this.wpsGetCapSuccess = false;
            this.wpsGetCapFail = false;
        } else {
            this.wpsGetCapBlocking = false;
            this.checkWPService();
        }
    }

    btn_OnWpsAdd(value: string) {
        this.serviceUrls.push(value);
        this.selectedWpsServiceUrl = value;
        this.wpsGetCapBlocking = false;
        this.checkWPService();
    }

    processSelected(event) {
        if (this.selectedProcessIdentifier == "SELECT_PROCESS_HINT") {
            this.selectedProcess = undefined;
            this.processOffering = undefined;
            this.checkInputsForCompleteness("");
            // remove drawnItems:
            for (let input of this.processOffering.process.inputs) {
                if (input.mapItems && input.mapItems != undefined) {
                    this.map.removeLayer(input.mapItems);
                    this.allDrawnItems.removeLayer(input.mapItems);
                }
            }
        } else {
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
                        this.map.removeLayer(input.mapItems);
                        this.allDrawnItems.removeLayer(input.mapItems);
                    }
                }
            }
            this.describeProcess();
        }
    }

    checkInputsForCompleteness(event) {
        if (this.selectedProcessIdentifier == undefined) {
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
                console.log("input: " + input.identifier);
                console.log(boolTemp);
            }
            if (input.minOccurs > 0 &&
                input.boundingBoxData) {
                this.validateBothBBoxCorners("", input, "");
                boolTemp = boolTemp && input.validBbox;
                console.log("input: " + input.identifier);
                console.log(boolTemp);
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
            this.map.removeLayer(input.mapItems);
            this.allDrawnItems.removeLayer(input.mapItems);
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

    onTransmissionModeSelectionChange(event) {
    }

    onExecutionModeSelected(event) {
    }

    btn_onRefreshStatusAutomatically() {
        if (this.responseDocument.status != 'Succeeded'
            && this.responseDocument.status.info != 'wps:ProcessSucceeded') {
            setTimeout(() => {
                console.log('refreshing status...');
                this.btn_onRefreshStatus();
                this.btn_onRefreshStatusAutomatically();
            }, 5000);
        }
    }

    btn_onRefreshStatus() {
        console.log("on refresh clicked.");
        console.log(this.responseDocument);
        let jobId = this.responseDocument.jobId;
        if (this.responseDocument.version && this.responseDocument.version == "1.0.0") {
            let documentLocation = this.responseDocument.statusLocation;
            this.webProcessingService.parseStoredExecuteResponse_WPS_1_0((resp) => {
                console.log(resp);
                if (resp.executeResponse) {
                    this.executeResponse = resp.executeResponse;
                    this.responseDocument = this.executeResponse.responseDocument;
                    if (this.responseDocument.status != undefined
                        && this.responseDocument.status.info != undefined
                        && this.responseDocument.status.info.includes('percentCompleted:')) {
                        this.responseDocument.percentCompleted =
                            this.responseDocument.status.info.substring(
                                this.responseDocument.status.info.indexOf('percentCompleted:') + 17);
                        console.log(this.responseDocument.percentCompleted);
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
                                this.addLayerOnMap(output.identifier, geojsonOutput, false);
                            }
                        }
                    }
                }
            }, documentLocation);
        } else {
            this.webProcessingService.getStatus_WPS_2_0((response: any) => {
                console.log(response);
                this.executeResponse = response.executeResponse;
                this.responseDocument = this.executeResponse.responseDocument;
                console.log(this.responseDocument);
            }, jobId);
        }
    }

    btn_onGetResult() {
        let jobId = this.responseDocument.jobId;
        console.log("on getResult clicked.");
        this.webProcessingService.getResult_WPS_2_0((resp) => {
            console.log(resp);
            this.executeResponse = resp.executeResponse;
            this.responseDocument = this.executeResponse.responseDocument;
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
                        this.addLayerOnMap(output.identifier, geojsonOutput, false);
                    }
                }
            }
        }, jobId);
    }

    btn_onExecute() {
        this.currentInput = undefined;
        this.disableAllDrawer();
        this.executionPressed = true;
        this.wpsExecuteLoading = true;
        this.inputGenerator = new InputGenerator();
        this.outputGenerator = new OutputGenerator();
        let generatedInputs = [];
        let generatedOutputs = [];
        // create inputs
        for (let input of this.processOffering.process.inputs) {
            if (input.literalData
                && input.literalData != undefined
                && input.enteredValue
                && input.enteredValue != undefined
                && input.enteredValue.length > 0) {
                var literalInput =
                    this.inputGenerator.createLiteralDataInput_wps_1_0_and_2_0(
                        input.identifier,
                        undefined,
                        undefined,
                        input.enteredValue);
                generatedInputs.push(literalInput);
            }
            if (input.boundingBoxData
                && input.boundingBoxData != undefined
                && input.validBbox != undefined
                && input.validBbox == true) {
                var bboxInput =
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
                && input.complexData != undefined
                && input.enteredValue
                && input.enteredValue != undefined
                && input.enteredValue.length > 0) {
                var complexInput =
                    this.inputGenerator.createComplexDataInput_wps_1_0_and_2_0(
                        input.identifier,
                        input.selectedFormat.mimeType,
                        input.selectedFormat.schema,
                        input.selectedFormat.encoding,
                        input.selectedInputType == "option1",
                        input.enteredValue);
                generatedInputs.push(complexInput);
            }
        }

        // create outputs
        for (let output of this.processOffering.process.outputs) {
            var newOutput;
            if (output.literalData
                && output.literalData != undefined
                && output.selectedTransmissionMode != 'SELECT_TRANSMISSION_MODE_HINT') {
                switch (this.selectedWpsServiceVersion) {
                    case "1.0.0":
                        newOutput = this.outputGenerator.createLiteralOutput_WPS_1_0(
                            output.identifier,
                            output.selectedTransmissionMode == "reference"
                        );
                        generatedOutputs.push(newOutput);
                        break;
                    case "2.0.0":
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
                && output.boundingBoxData != undefined
                && output.selectedTransmissionMode != 'SELECT_TRANSMISSION_MODE_HINT') {
                switch (this.selectedWpsServiceVersion) {
                    case "1.0.0":
                        newOutput = this.outputGenerator.createLiteralOutput_WPS_1_0(
                            output.identifier,
                            output.selectedTransmissionMode == "reference"
                        );
                        generatedOutputs.push(newOutput);
                        break;
                    case "2.0.0":
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
                && output.complexData != undefined
                && output.selectedTransmissionMode != 'SELECT_TRANSMISSION_MODE_HINT'
                && output.selectedFormat != 'SELECT_MIMETYPE_HINT') {
                switch (this.selectedWpsServiceVersion) {
                    case "1.0.0":
                        newOutput = this.outputGenerator.createComplexOutput_WPS_1_0(
                            output.identifier,
                            output.selectedFormat.mimeType,
                            output.selectedFormat.schema,
                            output.selectedFormat.encoding,
                            undefined,
                            output.selectedTransmissionMode == "reference",
                            undefined,
                            undefined
                        );
                        generatedOutputs.push(newOutput);
                        break;
                    case "2.0.0":
                    default:
                        newOutput = this.outputGenerator.createComplexOutput_WPS_2_0(
                            output.identifier,
                            output.selectedFormat.mimeType,
                            output.selectedFormat.schema,
                            output.selectedFormat.encoding,
                            output.selectedTransmissionMode
                        );
                        generatedOutputs.push(newOutput);
                        break;
                }
            }
        }

        // execute the request
        if (this.processOffering.selectedExecutionMode.split("-")[0] == 'sync') {
            this.webProcessingService.execute(
                (callback) => {
                    if (callback.textStatus && callback.textStatus != undefined && callback.textStatus == 'error') {
                        this.wpsExecuteLoading = false;
                    } else {
                        this.executeResponse = callback.executeResponse;
                        this.responseDocumentAvailable = true;
                        this.wpsExecuteLoading = false;
                        // add inputs as layers:
                        for (let input of this.processOffering.process.inputs) {
                            if (input.selectedFormat && input.selectedFormat != undefined) {
                                let selectedFormat = input.selectedFormat;
                                if (selectedFormat.mimeType
                                    && selectedFormat.mimeType != undefined
                                    && selectedFormat.mimeType == "application/vnd.geo+json"
                                    && input.selectedInputType == 'option4') {
                                    let geojsonInput = JSON.parse(input.enteredValue);
                                    for (let feature of geojsonInput.features) {
                                        feature.properties['INPUT'] = input.identifier;
                                    }
                                    this.addLayerOnMap(input.identifier, geojsonInput, true);
                                    this.map.removeLayer(input.mapItems);
                                    this.map.removeLayer(this.allDrawnItems);
                                    this.allDrawnItems.removeLayer(input.mapItems);
                                }
                            }
                        }
                        // this.map.removeLayer(this.allDrawnItems);
                        // add outputs as layers:
                        console.log(this.executeResponse.responseDocument);
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
                                    this.addLayerOnMap(output.identifier, geojsonOutput, false);
                                }
                            }
                        }
                        this.step = 3;
                    }
                },
                this.selectedProcessIdentifier,
                this.processOffering.selectedResponseFormat,
                this.processOffering.selectedExecutionMode.split("-")[0],
                false, // lineage
                generatedInputs,
                generatedOutputs
            );
        } else {
            this.webProcessingService.execute(
                (callback) => {
                    console.log(callback);
                    if (callback.textStatus && callback.textStatus != undefined && callback.textStatus == 'error') {
                        this.wpsExecuteLoading = false;
                    } else {
                        console.log(callback);
                        this.executeResponse = callback.executeResponse;
                        this.responseDocument = this.executeResponse.responseDocument;
                        this.responseDocumentAvailable = true;
                        this.wpsExecuteLoading = false;
                        // add inputs as layers:
                        for (let input of this.processOffering.process.inputs) {
                            if (input.selectedFormat && input.selectedFormat != undefined) {
                                let selectedFormat = input.selectedFormat;
                                if (selectedFormat.mimeType
                                    && selectedFormat.mimeType != undefined
                                    && selectedFormat.mimeType == "application/vnd.geo+json"
                                    && input.selectedInputType == 'option4') {
                                    let geojsonInput = JSON.parse(input.enteredValue);
                                    for (let feature of geojsonInput.features) {
                                        feature.properties['INPUT'] = input.identifier;
                                    }
                                    this.addLayerOnMap(input.identifier, geojsonInput, true);
                                    this.map.removeLayer(this.allDrawnItems);
                                    this.map.removeLayer(input.mapItems);
                                    this.allDrawnItems.removeLayer(input.mapItems);
                                }
                            }
                        }
                        // this.map.removeLayer(this.allDrawnItems);
                        // add outputs as layers:
                        if (this.executeResponse.responseDocument.outputs != undefined) {
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
                                        this.addLayerOnMap(output.identifier, geojsonOutput, false);
                                    }
                                }
                            }
                        }
                        this.step = 3;
                    }
                },
                this.selectedProcessIdentifier,
                this.processOffering.selectedResponseFormat,
                this.processOffering.selectedExecutionMode.split("-")[0],
                false, // lineage
                generatedInputs,
                generatedOutputs
            );
        }
    }

    responseDocument: any;

    isCircle = function (layer) {
        if (layer._mRadius) {
            return true;
        }
        return false;
    };

    getCircleFeature(layer) {
        let polyCircle = {
            type: "Feature",
            properties: {},
            geometry: {
                type: "Polygon",
                coordinates: [
                    []
                ]
            }
        };
        let radius = layer._mRadius / 1609.344; // meters -> miles
        let lat = layer._latlng.lat;
        let lng = layer._latlng.lng;

        let deg2rad = Math.PI / 180; // degrees to radians
        let rad2deg = 180 / Math.PI; // radians to degrees
        let earthsradius = 3963; // radius earth in miles

        // find the radius in lat/lon
        let rlat = (radius / earthsradius) * rad2deg;
        let rlng = rlat / Math.cos(lat * deg2rad);

        let nPoints = 42;

        for (let i = 0; i < nPoints + 1; i++) {
            let theta = Math.PI * (i / (nPoints / 2));
            let ex = lng + (rlng * Math.cos(theta)); // center a + radius x * cos(theta)
            let ey = lat + (rlat * Math.sin(theta)); // center b + radius y * sin(theta)
            polyCircle.geometry.coordinates[0].push(
                [ex, ey]
            );
        }
        return polyCircle;
    };

    removeFeatureFromCollection(feature, featureCollection) {
        let geometryType = feature.geometry.type;
        featureCollection.features.forEach((currentFeature, index) => {
            if (currentFeature.geometry.type == geometryType) {
                if (this.equalGeometries(feature.geometry.coordinates, currentFeature.geometry.coordinates)) {
                    featureCollection.features.splice(index, 1);
                    return featureCollection;
                }
            }
        })
        return featureCollection;
    }

    equalGeometries(coordsA, coordsB) {
        if (Array.isArray(coordsA) && Array.isArray(coordsB)) {
            if (coordsA.length == coordsB.length) {
                let firstA = coordsA[0];
                let firstB = coordsB[0];
                let startEquals: boolean = true;
                if (Array.isArray(firstA) && Array.isArray(firstB)) {
                    let bool = this.equalGeometries(firstA, firstB);
                    if (!bool) {
                        return false;
                    }
                } else if (!Array.isArray(firstA) && !Array.isArray(firstB)) {
                    let bool = firstA == firstB;
                    if (!bool) {
                        return false;
                    }
                } else {
                    return false;
                }
                let restA = JSON.parse(JSON.stringify(coordsA));
                let restB = JSON.parse(JSON.stringify(coordsB));
                if (coordsA.length > 1 && coordsB.length > 1) {
                    restA.splice(0, 1);
                    restB.splice(0, 1);
                    return this.equalGeometries(restA, restB);
                } else {
                    if (coordsA[0] == coordsB[0]) {
                        return true;
                    } else {
                        return false;
                    }
                }
            } else {
                return false;
            }
        }
        else if (!Array.isArray(coordsA) && !Array.isArray(coordsB)) {
            if (coordsA == coordsB) {
                return true;
            }
        }
        return false;
    }

    inputDefaultStyle = {
        "fill": true,
        "fillColor": '#3388ff',
        "fillOpacity": 0.3,
        "color": "#fff",
        "weight": 1,
        "dashArray": '3',
        "opacity": 0.8
    };
    inputHighlightStyle = {
        "fill": true,
        "fillColor": '#3388ff',
        "fillOpacity": 0.3,
        "color": "#333",
        "weight": 5,
        "dashArray": '',
        "opacity": 0.65
    };
    inputLineStringDefaultStyle = {
        "fill": false,
        "color": "#3388ff",
        "fillOpacity": 1,
        "weight": 1,
        "dashArray": '3',
        "opacity": 0.8
    }
    outputLineStringDefaultStyle = {
        "fill": false,
        "color": "#fe57a1",
        "fillOpacity": 1,
        "weight": 1,
        "dashArray": '3',
        "opacity": 0.8
    }
    inputLineStringHighlightStyle = {
        "fill": false,
        "color": "#3388ff",
        "fillOpacity": 1,
        "weight": 5,
        "dashArray": '',
        "opacity": 0.65
    }
    outputLineStringHighlightStyle = {
        "fill": false,
        "color": "#fe57a1",
        "fillOpacity": 1,
        "weight": 5,
        "dashArray": '',
        "opacity": 0.65
    }

    outputDefaultStyle = {
        "fill": true,
        "fillColor": '#fe57a1',
        "fillOpacity": 0.3,
        "color": "#fff",
        "weight": 1,
        "dashArray": '3',
        "opacity": 0.8
    };
    outputHighlightStyle = {
        "fill": true,
        "fillColor": '#fe57a1',
        "fillOpacity": 0.3,
        "color": "#333",
        "weight": 5,
        "dashArray": '',
        "opacity": 0.65
    };

    addLayerOnMap(name, feature, isInput) {
        console.log(feature);
        let layerToAdd = L.geoJSON(
            feature, {
                style: feature.features[0].geometry.type == 'LineString' ?
                    (isInput ? this.inputLineStringDefaultStyle : this.outputLineStringDefaultStyle)
                    : (isInput ? this.inputDefaultStyle : this.outputDefaultStyle),
                onEachFeature: (feature, layer) => {
                    let popup = isInput ?
                        "<b>" + this.translationService.instant('INPUT') + ": </b>"
                        + feature.properties['INPUT']
                        :
                        "<b>" + this.translationService.instant('OUTPUT') + ": </b>"
                        + feature.properties['OUTPUT'];
                    let properties = layer["feature"].properties;
                    for (let key of Object.keys(properties)) {
                        if (key != 'INPUT' && key != 'OUTPUT') {
                            popup = popup + "<br/><b>" + key + '</b>: ' + properties[key];
                        }
                    }
                    layer.bindPopup(popup);
                    if (feature.geometry.type == 'Point' && !isInput) {
                        (layer as any).setIcon(this.outputMarkerIcon);
                    }

                    layer.on({
                        click: (event) => {
                            if (this.currentInput != undefined
                                && this.selectionDrawer._enabled) {
                                var layer = event.target;
                                var feature = layer.feature;
                                // if is unselected -> select:
                                if (!this.isSelectedForInput(layer)) {
                                    let inputFeatureCollection;
                                    if (this.currentInput.enteredValue == undefined || this.currentInput.enteredValue.length == 0) {
                                        inputFeatureCollection = {
                                            type: "FeatureCollection",
                                            features: []
                                        };
                                    } else {
                                        inputFeatureCollection = JSON.parse(this.currentInput.enteredValue);
                                    }
                                    inputFeatureCollection.features.push(feature);
                                    this.currentInput.enteredValue = JSON.stringify(inputFeatureCollection);
                                    if (this.currentInput.mapItems == undefined) {
                                        this.currentInput.mapItems = L.geoJSON(
                                            inputFeatureCollection, {
                                            });
                                    } else {
                                        this.currentInput.mapItems = L.geoJSON(
                                            inputFeatureCollection, {
                                            });
                                    }
                                    if (feature.geometry.type == 'Point') {
                                        layer.setIcon(this.inputMarkerIcon);
                                    } else if (feature.geometry.type == 'LineString') {
                                        layer.setStyle(this.inputLineStringDefaultStyle);
                                    } else {
                                        layer.setStyle(this.inputDefaultStyle);
                                    }
                                    this.selectedOutputLayers.push(layer);
                                } else {
                                    // if is selected -> unselect:
                                    // remove from currentInput.mapItems:
                                    let inputFeatureCollection = this.removeFeatureFromCollection(
                                        feature,
                                        JSON.parse(this.currentInput.enteredValue)
                                    );
                                    console.log(inputFeatureCollection);
                                    this.currentInput.mapItems = L.geoJSON(
                                        inputFeatureCollection, {
                                        });
                                    // visual unselect: 
                                    if (feature.geometry.type == 'Point') {
                                        layer.setIcon(this.outputMarkerIcon);
                                    } else if (feature.geometry.type == 'LineString') {
                                        layer.setStyle(this.outputLineStringDefaultStyle);
                                    } else {
                                        layer.setStyle(this.outputDefaultStyle);
                                    }
                                    let index = this.selectedOutputLayers.indexOf(layer);
                                    if (index > -1) {
                                        console.log("removing layer...");
                                        this.selectedOutputLayers.splice(index, 1);
                                    }
                                    this.currentInput.enteredValue = JSON.stringify(inputFeatureCollection);
                                }
                                this.checkInputsForCompleteness("");
                            }
                        },
                        mouseover: (event) => {
                            var layer = event.target;
                            var feature = layer.feature;
                            if (feature.geometry.type == 'Point') {
                                if (!this.isSelectedForInput(layer)) {
                                    layer.setIcon(isInput ? this.inputMarkerHighlighIcon : this.outputMarkerHighlighIcon);
                                } else {
                                    layer.setIcon(this.inputMarkerHighlighIcon);
                                }
                            } else if (feature.geometry.type == 'LineString') {
                                if (!this.isSelectedForInput(layer)) {
                                    layer.setStyle(isInput ? this.inputLineStringHighlightStyle : this.outputLineStringHighlightStyle);
                                } else {
                                    layer.setStyle(this.inputLineStringDefaultStyle);
                                }
                            } else {
                                if (!this.isSelectedForInput(layer)) {
                                    layer.setStyle(isInput ? this.inputHighlightStyle : this.outputHighlightStyle);
                                } else {
                                    layer.setStyle(this.inputDefaultStyle);
                                }
                            }
                            if (this.showInfoControl) {
                                this.updateInfoControl(layer.feature.properties, isInput);
                            }
                        },
                        mouseout: (event) => {
                            var layer = event.target;
                            var feature = layer.feature;
                            if (feature.geometry.type == 'Point') {
                                if (!this.isSelectedForInput(layer)) {
                                    layer.setIcon(isInput ? this.inputMarkerIcon : this.outputMarkerIcon);
                                } else {
                                    layer.setIcon(this.inputMarkerIcon);
                                }
                            } else if (feature.geometry.type == 'LineString') {
                                if (!this.isSelectedForInput(layer)) {
                                    layer.setStyle(isInput ? this.inputLineStringDefaultStyle : this.outputLineStringDefaultStyle);
                                } else {
                                    layer.setStyle(this.inputLineStringDefaultStyle);
                                }
                            } else {
                                if (!this.isSelectedForInput(layer)) {
                                    layer.setStyle(isInput ? this.inputDefaultStyle : this.outputDefaultStyle);
                                } else {
                                    layer.setStyle(this.inputDefaultStyle);
                                }
                            }
                            if (this.showInfoControl) {
                                this.updateInfoControl(undefined, isInput);
                            }
                        }
                    });
                }
            }).addTo(this.map);
        if (isInput) {
            this.layersControl.overlays["<b>Input:</b> " + name] = layerToAdd;
        } else {
            this.layersControl.overlays["<b>Output:</b> " + name] = layerToAdd;
            this.geojsonOutputsExist = true;
        }
    }
}
