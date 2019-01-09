import { Component, ViewChild } from '@angular/core';
import { tileLayer, latLng } from 'leaflet';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../environments/environment';
import { ProcessOffering, ProcessOfferingProcess } from './model/process-offering';
import { ExecuteResponse, ResponseDocument } from './model/execute-response';
import * as L from 'leaflet';

import * as $ from 'jquery';
import { ConfigurationComponent } from './configuration/configuration.component';
import { DataService } from './services/data.service';
import { ProcessSpecificationComponent } from './process-specification/process-specification.component';

declare var WpsService: any;
declare var InputGenerator: any;
declare var OutputGenerator: any;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    @ViewChild(ConfigurationComponent) configuration: ConfigurationComponent;
    @ViewChild(ProcessSpecificationComponent) specification: ProcessSpecificationComponent;
    wpsSuccess: boolean = false;

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
    selectedWpsServiceVersion: string;
    panelOpenState = false;
    selectedWpsServiceUrl: string;
    wpsGetCapLoading: boolean = false;
    wpsGetCapBlocking: boolean = false;
    wpsGetCapFail: boolean = false;
    processes: ProcessOfferingProcess[] = [];
    selectedProcess: ProcessOfferingProcess;
    processOffering: ProcessOffering = undefined;
    selectedProcessIdentifier: string;
    executeResponse: ExecuteResponse;
    responseDocumentAvailable: boolean = false;
    processInputs = {};
    polylineDrawer: any;
    polygonDrawer: any;
    rectangleDrawer: any;
    circleDrawer: any;
    markerDrawer: any;
    executionPressed: boolean = false;
    selectionDrawer: any;
    allDrawnItems: any;
    processInputsDone: boolean;
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
    info: any;
    inputMarkerIcon: any;
    inputMarkerHighlighIcon: any;
    outputMarkerIcon: any;
    outputMarkerHighlighIcon: any;
    LeafDefaultIcon: any;
    LeafHighlightIcon: any;
    step: number = 0;

    responseDocument: ResponseDocument;

    constructor(translate: TranslateService, private dataService: DataService) {
        this.translationService = translate;
        this.dataService.processOffering$.subscribe(
            procOffering => {
                this.processOffering = procOffering;
            }
        );
        this.dataService.processes$.subscribe(
            processes => {
                this.processes = processes;
            }
        )
        this.dataService.webProcessingService$.subscribe(
            wps => {
                this.webProcessingService = wps;
            }
        )
        this.dataService.wpsVersion$.subscribe(
            wpsVersion => {
                this.selectedWpsServiceVersion = wpsVersion;
            }
        )
        this.dataService.processIdentifier$.subscribe(
            processId => {
                this.selectedProcessIdentifier = processId;
            }
        )
        this.dataService.expandedPanel$.subscribe(
            expandedPanel => {
                this.step = expandedPanel;
            }
        )
        this.dataService.currentInput$.subscribe(
            input => {
                this.currentInput = input;
            }
        )
        this.dataService.removeDrawnItems$.subscribe(
            layer => {
                this.map.removeLayer(layer);
                this.allDrawnItems.removeLayer(layer);
            }
        )
        this.dataService.processInputsDone$.subscribe(
            inputsDone => {
                this.processInputsDone = inputsDone;
            }
        )
        this.dataService.getCapSuccess$.subscribe(
            success => {
                this.wpsSuccess = success;
                this.wpsGetCapFail = !success;
            }
        )
        this.dataService.addLayerOnMap$.subscribe(
            layer => {
                this.map.removeLayer(layer);
                this.map.removeLayer(this.allDrawnItems);
                this.allDrawnItems.removeLayer(layer);

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
        if (environment.showInfoControl != undefined) {
            this.showInfoControl = environment.showInfoControl;
        }
        this.dataService.setGeojsonOutputExists(false);
    }

    ngAfterViewInit() {
    }

    notifyGetCapabilitiesSuccess = (success) => {
        this.wpsSuccess = success;
    }

    setExpandedNotify = (expandedPanel) => {
        this.step = expandedPanel;
    }

    processOfferingChanged($event) {
        this.processOffering = $event;
    }

    processIdentifierChanged($event) {
        this.selectedProcessIdentifier = $event;
    }

    webProcessingServiceChanged($event) {
        this.webProcessingService = $event;
    }

    serviceVersionChanged($event) {
        this.selectedWpsServiceVersion = $event;
    }

    setStep = (step: number) => {
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

    onDrawReady(event) {
        let layer = event.layer;
        if (this.currentInput.boundingBoxData) {
            this.currentInput.botLeft = layer._bounds._southWest.lat + ' ' + layer._bounds._southWest.lng;
            this.currentInput.topRight = layer._bounds._northEast.lat + ' ' + layer._bounds._northEast.lng;
            if (this.currentInput.mapItems
                && this.currentInput.mapItems != undefined) {
                // remove old layer:
                this.map.removeLayer(this.currentInput.mapItems);
            }
            this.currentInput.mapItems = layer;
        } else {
            this.allDrawnItems.removeLayer(layer);
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
        this.specification.checkInputsForCompleteness("");
    }

    selectedOutputLayers: any[] = [];
    isSelectedForInput(layer) {
        return this.selectedOutputLayers.includes(layer);
    }

    onInputChanged(event, input) {
        let geojsonFile = event.target.files[0];
        let reader = new FileReader();
        reader.onload = function (e) {
            // handle onload
            let lines = e.target["result"];
            let newArr = JSON.parse(lines);
            // add to complex payload:
            input.enteredValue = JSON.stringify(newArr);
        };
        reader.readAsText(geojsonFile);
    }

    disableAllDrawer = () => {
        this.dataService.setPolylineDrawerEnabled(false);
        this.dataService.setPolygonDrawerEnabled(false);
        this.dataService.setRectangleDrawerEnabled(false);
        this.dataService.setCircleDrawerEnabled(false);
        this.dataService.setMarkerDrawerEnabled(false);
        this.dataService.setSelectionDrawerEnabled(false);
        this.polylineDrawer.disable();
        this.polygonDrawer.disable();
        this.rectangleDrawer.disable();
        this.circleDrawer.disable();
        this.markerDrawer.disable();
        this.selectionDrawer["_enabled"] = false;
    }

    // enablePolylineDrawer() {
    //     this.polylineDrawer.enabled();
    // }

    btn_drawPolyline = (input) => {
        let wasEnabled = this.polylineDrawer._enabled && this.currentInput == input;
        this.currentInput = input;
        this.dataService.setCurrentInput(input);
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.polylineDrawer.enable();
            this.dataService.setPolylineDrawerEnabled(true);
        }
    }
    btn_drawPolygon = (input) => {
        let wasEnabled = this.polygonDrawer._enabled && this.currentInput == input;
        this.currentInput = input;
        this.dataService.setCurrentInput(input);
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.polygonDrawer.enable();
            this.dataService.setPolygonDrawerEnabled(true);
        }
    }
    btn_drawRectangle = (input) => {
        let wasEnabled = this.rectangleDrawer._enabled && this.currentInput == input;
        this.currentInput = input;
        this.dataService.setCurrentInput(input);
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.rectangleDrawer.enable();
            this.dataService.setRectangleDrawerEnabled(true);
        }
    }
    btn_drawCircle = (input) => {
        let wasEnabled = this.circleDrawer._enabled && this.currentInput == input;
        this.currentInput = input;
        this.dataService.setCurrentInput(input);
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.circleDrawer.enable();
            this.dataService.setCircleDrawerEnabled(true);
        }
    }
    btn_drawMarker = (input) => {
        let wasEnabled = this.markerDrawer._enabled && this.currentInput == input;
        this.currentInput = input;
        this.dataService.setCurrentInput(input);
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.markerDrawer.enable();
            this.dataService.setMarkerDrawerEnabled(true);
        }
    }
    btn_drawSelector = (input) => {
        let wasEnabled = this.selectionDrawer._enabled && this.currentInput == input;
        this.currentInput = input;
        this.dataService.setCurrentInput(input);
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.selectionDrawer["_enabled"] = true;
            this.dataService.setSelectionDrawerEnabled(true);
        }
    }

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

    addWMSLayerOnMap = (baseUrl: string, layersNames: string) => {
        let addedWMSLayer = L.tileLayer.wms(
            baseUrl,
            {
                layers: layersNames,
                format: 'image/png',
                transparent: true
            }
        ).addTo(this.map);
    }

    addLayerOnMap = (name, feature, isInput, jobId) => {
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
                                        this.selectedOutputLayers.splice(index, 1);
                                    }
                                    this.currentInput.enteredValue = JSON.stringify(inputFeatureCollection);
                                }
                                this.specification.checkInputsForCompleteness("");
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
            this.layersControl.overlays["<b>JobID:</b> " + jobId + "<br><b>Input:</b> " + name] = layerToAdd;
        } else {
            this.layersControl.overlays["<b>JobID:</b> " + jobId + "<br><b>Output:</b> " + name] = layerToAdd;
            this.dataService.setGeojsonOutputExists(true);
        }
    }

}
