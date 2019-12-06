import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { tileLayer, latLng } from 'leaflet';
import { TranslateService } from '@ngx-translate/core';
import { ProcessOffering, ProcessOfferingProcess } from './model/process-offering';
import { environment } from '../environments/environment';
import * as L from 'leaflet';
import * as $ from 'jquery';
import { ConfigurationComponent } from './configuration/configuration.component';
import { DataService } from './services/data.service';
import { ProcessSpecificationComponent } from './process-specification/process-specification.component';
import { HttpGetService } from './services/http-get.service';
import { AppSettings } from './model/app-setting';

declare var WpsService: any;
declare var InputGenerator: any;
declare var OutputGenerator: any;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {

    constructor(translate: TranslateService, private dataService: DataService, private httpGetService: HttpGetService) {
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
        );
        this.dataService.webProcessingService$.subscribe(
            wps => {
                this.webProcessingService = wps;
            }
        );
        this.dataService.processIdentifier$.subscribe(
            processId => {
                this.selectedProcessIdentifier = processId;
            }
        );
        this.dataService.expandedPanel$.subscribe(
            expandedPanel => {
                this.step = expandedPanel;
            }
        );
        this.dataService.currentInput$.subscribe(
            input => {
                this.currentInput = input;
            }
        );
        this.dataService.removeDrawnItems$.subscribe(
            layer => {
                this.map.removeLayer(layer);
                this.allDrawnItems.removeLayer(layer);
            }
        );
        this.dataService.processInputsDone$.subscribe(
            inputsDone => {
                this.processInputsDone = inputsDone;
            }
        );
        this.dataService.getCapSuccess$.subscribe(
            success => {
                this.wpsSuccess = success;
                this.wpsGetCapFail = !success;
            }
        );
        this.dataService.addLayerOnMap$.subscribe(
            layer => {
                this.map.removeLayer(layer);
                this.allDrawnItems.removeLayer(layer);
            }
        );
        this.dataService.executeResponse$.subscribe(
            resp => {
                this.responseDocumentAvailable = true;
            }
        );
    }
    @ViewChild(ConfigurationComponent, { static: true }) configuration: ConfigurationComponent;
    @ViewChild(ProcessSpecificationComponent, { static: true }) specification: ProcessSpecificationComponent;
    wpsSuccess = false;

    title = 'wps-ng-client';
    private settings: AppSettings;

    baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' });
    options = {
        zoom: environment.startZoom,
        center: latLng(environment.startCenter.latitude, environment.startCenter.longitude),
        layers: [this.baseLayer]
    };
    zoom: number;
    center: L.LatLng;
    layersControl = {
        baseLayers: {
            'Open Street Map': this.baseLayer
        },
        overlays: {
        }
    };
    addedLayers: any[] = [];
    startLanguage = 'de';
    translationService: TranslateService;
    webProcessingService: any;
    panelOpenState = false;
    selectedWpsServiceUrl: string;
    wpsGetCapLoading = false;
    wpsGetCapBlocking = false;
    wpsGetCapFail = false;
    processes: ProcessOfferingProcess[] = [];
    selectedProcess: ProcessOfferingProcess;
    processOffering: ProcessOffering = undefined;
    selectedProcessIdentifier: string;
    processInputs = {};
    polylineDrawer: any;
    polygonDrawer: any;
    rectangleDrawer: any;
    circleDrawer: any;
    markerDrawer: any;
    selectionDrawer: any;
    allDrawnItems: any;
    scaleBar: any;
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
    };
    removeLayerBtnOptions = {
        position: 'topright'
    };
    currentInputFeatureGroup: any;
    map: any;
    currentInput: any;
    showInfoControl = false;
    info: any;
    removeLayersBtn: any;
    inputMarkerIcon: any;
    inputMarkerHighlighIcon: any;
    outputMarkerIcon: any;
    outputMarkerHighlighIcon: any;
    LeafDefaultIcon: any;
    LeafHighlightIcon: any;
    step = 0;
    responseDocumentAvailable = false;

    selectedOutputLayers: any[] = [];

    inputDefaultStyle = {
        'fill': true,
        'fillColor': '#3388ff',
        'fillOpacity': 0.3,
        'color': '#fff',
        'weight': 1,
        'dashArray': '3',
        'opacity': 0.8
    };
    inputHighlightStyle = {
        'fill': true,
        'fillColor': '#3388ff',
        'fillOpacity': 0.3,
        'color': '#333',
        'weight': 5,
        'dashArray': '',
        'opacity': 0.65
    };
    inputLineStringDefaultStyle = {
        'fill': false,
        'color': '#3388ff',
        'fillOpacity': 1,
        'weight': 3,
        'dashArray': '3',
        'opacity': 0.8
    };
    outputLineStringDefaultStyle = {
        'fill': false,
        'color': '#fe57a1',
        'fillOpacity': 1,
        'weight': 3,
        'dashArray': '3',
        'opacity': 0.8
    };
    inputLineStringHighlightStyle = {
        'fill': false,
        'color': '#3388ff',
        'fillOpacity': 1,
        'weight': 5,
        'dashArray': '',
        'opacity': 0.65
    };
    outputLineStringHighlightStyle = {
        'fill': false,
        'color': '#fe57a1',
        'fillOpacity': 1,
        'weight': 5,
        'dashArray': '',
        'opacity': 0.65
    };

    outputDefaultStyle = {
        'fill': true,
        'fillColor': '#fe57a1',
        'fillOpacity': 0.3,
        'color': '#fff',
        'weight': 1,
        'dashArray': '3',
        'opacity': 0.8
    };
    outputHighlightStyle = {
        'fill': true,
        'fillColor': '#fe57a1',
        'fillOpacity': 0.3,
        'color': '#333',
        'weight': 5,
        'dashArray': '',
        'opacity': 0.65
    };

    ngOnInit() {
        this.layersControl = {
            baseLayers: {
                'Open Street Map': this.baseLayer
            },
            overlays: {
            }
        };
        this.dataService.setGeojsonOutputExists(false);
        this.setAppSettings();
    }

    addRemoveLayersButton = () => {
        if (document.getElementsByClassName('remove-layers-btn').length === 0) {
            const overlaysDivArray = document.getElementsByClassName('leaflet-control-layers-list');
            const overlaysDiv = overlaysDivArray[0];
            const removeLayersBtn = document.createElement('input');
            removeLayersBtn.type = 'button';
            removeLayersBtn.value = this.translationService.instant('REMOVE_LAYERS');
            removeLayersBtn.setAttribute('id', 'remove-layers-btn');
            removeLayersBtn.setAttribute('class', 'remove-layers-btn');
            removeLayersBtn.onclick = () => {
                this.btn_removeLayers();
            };
            overlaysDiv.appendChild(removeLayersBtn);
        }
    }

    setAppSettings() {
        // get AppSettings:
        this.httpGetService.getAppSettings()
            .subscribe((settings: AppSettings) => {
                this.settings = settings;
                console.log(settings);
                // MAP SETTINGS:
                if (settings.startZoom !== undefined && settings.startZoom) {
                    console.log('setting zoomlevel.');
                    this.zoom = settings.startZoom;
                }
                if (settings.startCenter !== undefined
                    && settings.startCenter.latitude
                    && settings.startCenter.longitude) {
                    console.log('setting startCenter.');
                    console.log('(' + settings.startCenter.latitude + ',' + settings.startCenter.longitude + ')');
                    this.center = latLng(settings.startCenter.latitude, settings.startCenter.longitude);
                    console.log(this.options);
                }
                // LANGUAGE SETTINGS:
                if (settings.startLanguage
                    && (settings.startLanguage === 'en'
                        || settings.startLanguage === 'de')) {
                    console.log('setting startLanguage');
                    this.startLanguage = settings.startLanguage;
                } else {
                    this.startLanguage = 'en';
                    console.log('setting startLanguage');
                }
                // INFO CONTROL SETTINGS:
                if (settings.showInfoControl !== undefined) {
                    console.log('setting showInfoControl');
                    this.showInfoControl = settings.showInfoControl;
                }

                if (settings.scaleBar && settings.scaleBar.visible) {
                  var sbSettings = this.settings.scaleBar.settings || {};
                  this.scaleBar = L.control.scale(sbSettings)
                                           .addTo(this.map);
                }
            });
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
        };
        this.polylineDrawer = new L.Draw.Polyline(this.map);
        this.polygonDrawer = new L.Draw.Polygon(this.map);
        this.rectangleDrawer = new L.Draw.Rectangle(this.map);
        this.circleDrawer = new L.Draw.Circle(this.map);
        this.markerDrawer = new L.Draw.Marker(this.map);
        this.selectionDrawer = {
            _enabled: false
        };
        this.httpGetService.getAppSettings()
            .subscribe((settings: AppSettings) => {
                if (settings.showInfoControl) {
                    const heading = this.translationService.instant('INFO_PANEL_HEADING');
                    this.info = new L.Control({ position: 'topright' });

                    this.info.onAdd = function (map) {
                        this._div = L.DomUtil.create('div', 'info-panel'); // create a div with a class "info"
                        return this._div;
                    };

                    // method that we will use to update the control based on feature properties passed
                    this.info.update = function (panelTitle: string, in_out_putTitle: string, hover_tooltip: string, props: any) {
                        let content = '<h4>' + panelTitle + '</h4>';
                        if (props !== undefined) {
                            const propertiesCount = Object.keys(props).length;
                            let currentCount = 0;
                            for (const key of Object.keys(props)) {
                                currentCount++;
                                if (key === 'INPUT') {
                                    content = content + '<br /><b>' + in_out_putTitle + '</b>: ' + props[key];
                                } else if (key === 'OUTPUT') {
                                    content = content + '<br /><b>' + in_out_putTitle + '</b>: ' + props[key];
                                } else {
                                    content = content + '<p><b>' + key + '</b>: ' + props[key] + '</p>';
                                }
                                if (currentCount >= 5 && propertiesCount > 5) {
                                    content = content + '<p> and ' + (propertiesCount - currentCount) + ' more...</p>';
                                    break;
                                }
                            }
                        } else {
                            content = content + '<br/ > ' + hover_tooltip + '!';
                        }
                        this._div.innerHTML = content;
                    };
                    this.info.addTo(map);
                    this.updateInfoControl(undefined, true);
                }
            });
        this.LeafDefaultIcon = L.Icon.extend({
            options: {
                iconUrl: './assets/marker-icon-blue.png',
                shadowUrl: './assets/marker-shadow.png',
                iconSize: [25, 41],
                shadowSize: [41, 41],
                iconAnchor: [12, 41],
                shadowAnchor: [12, 41],
                popupAnchor: [1, -34]
            }
        });
        this.LeafHighlightIcon = L.Icon.extend({
            options: {
                iconUrl: './assets/marker-icon-blue.png',
                shadowUrl: './assets/marker-shadow.png',
                iconSize: [31, 47],
                shadowSize: [47, 47],
                iconAnchor: [15, 47],
                shadowAnchor: [15, 47],
                popupAnchor: [1, -34]
            }
        });
        this.inputMarkerIcon = new this.LeafDefaultIcon({
            iconUrl: './assets/marker-icon-blue.png',
            shadowUrl: './assets/marker-shadow.png'
        });
        this.inputMarkerHighlighIcon = new this.LeafHighlightIcon({
            iconUrl: './assets/marker-icon-blue.png',
            shadowUrl: './assets/marker-shadow.png'
        });
        this.outputMarkerIcon = new this.LeafDefaultIcon({
            iconUrl: './assets/marker-icon-red.png',
            shadowUrl: './assets/marker-shadow.png'
        });
        this.outputMarkerHighlighIcon = new this.LeafHighlightIcon({
            iconUrl: './assets/marker-icon-red.png',
            shadowUrl: './assets/marker-shadow.png'
        });
    }

    updateInfoControl(props, isInput) {
        this.info.update(
            this.translationService.instant('INFO_PANEL_HEADING'),
            isInput ? this.translationService.instant('INPUT') : this.translationService.instant('OUTPUT'),
            this.translationService.instant('INFO_PANEL_HOVER_TIP'),
            props);
    }

    onDrawReady(event) {
        const layer = event.layer;
        if (this.currentInput.boundingBoxData) {
            this.currentInput.botLeft = layer._bounds._southWest.lat + ' ' + layer._bounds._southWest.lng;
            this.currentInput.topRight = layer._bounds._northEast.lat + ' ' + layer._bounds._northEast.lng;
            if (this.currentInput.mapItems
                && this.currentInput.mapItems !== undefined) {
                // remove old layer:
                this.map.removeLayer(this.currentInput.mapItems);
            }
            this.currentInput.mapItems = layer;
        } else {
            this.allDrawnItems.removeLayer(layer);
            let inputFeatureCollection;
            if (this.currentInput.enteredValue === undefined || this.currentInput.enteredValue.length === 0) {
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
            if (this.currentInput.mapItems === undefined) {
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
        this.specification.checkInputsForCompleteness('');
    }
    isSelectedForInput(layer) {
        return this.selectedOutputLayers.includes(layer);
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
        this.selectionDrawer['_enabled'] = false;
    }

    // enablePolylineDrawer() {
    //     this.polylineDrawer.enabled();
    // }

    btn_drawPolyline = (input) => {
        const wasEnabled = this.polylineDrawer._enabled && this.currentInput === input;
        this.currentInput = input;
        this.dataService.setCurrentInput(input);
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.polylineDrawer.enable();
            this.dataService.setPolylineDrawerEnabled(true);
        }
    }
    btn_drawPolygon = (input) => {
        const wasEnabled = this.polygonDrawer._enabled && this.currentInput === input;
        this.currentInput = input;
        this.dataService.setCurrentInput(input);
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.polygonDrawer.enable();
            this.dataService.setPolygonDrawerEnabled(true);
        }
    }
    btn_drawRectangle = (input) => {
        const wasEnabled = this.rectangleDrawer._enabled && this.currentInput === input;
        this.currentInput = input;
        this.dataService.setCurrentInput(input);
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.rectangleDrawer.enable();
            this.dataService.setRectangleDrawerEnabled(true);
        }
    }
    btn_drawCircle = (input) => {
        const wasEnabled = this.circleDrawer._enabled && this.currentInput === input;
        this.currentInput = input;
        this.dataService.setCurrentInput(input);
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.circleDrawer.enable();
            this.dataService.setCircleDrawerEnabled(true);
        }
    }
    btn_drawMarker = (input) => {
        const wasEnabled = this.markerDrawer._enabled && this.currentInput === input;
        this.currentInput = input;
        this.dataService.setCurrentInput(input);
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.markerDrawer.enable();
            this.dataService.setMarkerDrawerEnabled(true);
        }
    }
    btn_drawSelector = (input) => {
        const wasEnabled = this.selectionDrawer._enabled && this.currentInput === input;
        this.currentInput = input;
        this.dataService.setCurrentInput(input);
        this.disableAllDrawer();
        if (!wasEnabled) {
            this.selectionDrawer['_enabled'] = true;
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
        const polyCircle = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Polygon',
                coordinates: [
                    []
                ]
            }
        };
        const radius = layer._mRadius / 1609.344; // meters -> miles
        const lat = layer._latlng.lat;
        const lng = layer._latlng.lng;

        const deg2rad = Math.PI / 180; // degrees to radians
        const rad2deg = 180 / Math.PI; // radians to degrees
        const earthsradius = 3963; // radius earth in miles

        // find the radius in lat/lon
        const rlat = (radius / earthsradius) * rad2deg;
        const rlng = rlat / Math.cos(lat * deg2rad);

        const nPoints = 42;

        for (let i = 0; i < nPoints + 1; i++) {
            const theta = Math.PI * (i / (nPoints / 2));
            const ex = lng + (rlng * Math.cos(theta)); // center a + radius x * cos(theta)
            const ey = lat + (rlat * Math.sin(theta)); // center b + radius y * sin(theta)
            polyCircle.geometry.coordinates[0].push(
                [ex, ey]
            );
        }
        return polyCircle;
    }

    removeFeatureFromCollection(feature, featureCollection) {
        console.log(featureCollection.features);
        const geometryType = feature.geometry.type;
        featureCollection.features.forEach((currentFeature, index) => {
            if (currentFeature.geometry.type === geometryType) {
                if (this.equalGeometries(feature.geometry.coordinates, currentFeature.geometry.coordinates)) {
                    featureCollection.features.splice(index, 1);
                    console.log(featureCollection.features);
                    return featureCollection;
                }
            }
        });
        return featureCollection;
    }

    equalGeometries(coordsA, coordsB) {
        if (this.isPoint(coordsA) && this.isPoint(coordsB)) {
            if (this.equalPoints(coordsA, coordsB)) {
                return true;
            } else {
                return false;
            }
        } else if (!this.isPoint(coordsA) && !this.isPoint(coordsB)) {
            if (coordsA.length !== coordsB.length) {
                return false;
            }
            if (coordsA.length === 0 && coordsB.length === 0) {
                return true;
            } else if ((coordsA.length === 1 && coordsB.length === 1) &&
                !this.isPoint(coordsA[0] && !this.isPoint(coordsB[0]))) {
                return this.equalGeometries(coordsA[0], coordsB[0]);
            } else {
                const restA = JSON.parse(JSON.stringify(coordsA));
                const restB = JSON.parse(JSON.stringify(coordsB));
                restA.splice(0, 1);
                restB.splice(0, 1);
                return this.equalGeometries(coordsA[0], coordsB[0]) &&
                    this.equalGeometries(restA, restB);
            }
        } else {
            return false;
        }
    }

    isPoint(geom) {
        if (Array.isArray(geom) &&
            geom.length === 2 &&
            !Array.isArray(geom[0]) &&
            !Array.isArray(geom[1])) {
            return true;
        }
        return false;
    }

    equalPoints(pointA, pointB) {
        return (pointA[0] === pointB[0] &&
            pointA[1] === pointB[1]);
    }

    addWMSLayerOnMap = (baseUrl: string, layersNames: string, layerName: string, jobId: string) => {
        const addedWMSLayer = L.tileLayer.wms(
            baseUrl,
            {
                layers: layersNames,
                format: 'image/png',
                transparent: true
            }
        ).addTo(this.map);
        this.addedLayers.push(addedWMSLayer);
        this.layersControl.overlays['<b>JobID:</b> ' + jobId + '<br><b>Output:</b> ' + layerName] = addedWMSLayer;
    }

    addLayerOnMap = (name, feature, isInput, jobId) => {
        if (this.showInfoControl) {
            console.log(this.info);
            this.info._div.style['display'] = 'block';
        }
        const layerToAdd = L.geoJSON(
            feature, {
                style: (feature) => {
                    console.log(feature);
                    const featureStyle = (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') ?
                        (isInput ? this.inputLineStringDefaultStyle : this.outputLineStringDefaultStyle)
                        : (isInput ? this.inputDefaultStyle : this.outputDefaultStyle);
                    return featureStyle;
                },
                onEachFeature: (feature, layer) => {
                    let popup = isInput ?
                        '<b>' + this.translationService.instant('INPUT') + ': </b>'
                        + feature.properties['INPUT']
                        :
                        '<b>' + this.translationService.instant('OUTPUT') + ': </b>'
                        + feature.properties['OUTPUT'];
                    const properties = layer['feature'].properties;
                    let oldSplitKeys: string[] = [];
                    for (const key of Object.keys(properties)) {
                        const splitKeys = key.split('.');
                        if (key !== 'INPUT' && key !== 'OUTPUT') {
                            splitKeys.forEach((item, index) => {
                                if (oldSplitKeys !== undefined && oldSplitKeys.length >= index && item === oldSplitKeys[index]) {
                                    // old propertey key == this property key...
                                } else {
                                    // new property key:
                                    popup = popup + '<br/><b style=\'padding-left:' + (16 * index) + 'px;\'>' + item + '</b>: ';
                                }
                            });
                            oldSplitKeys = splitKeys;
                            popup = popup + properties[key];
                        }
                    }
                    layer.bindPopup(popup);
                    if (feature.geometry.type === 'Point' && !isInput) {
                        (layer as any).setIcon(this.outputMarkerIcon);
                    }

                    layer.on({
                        click: (event) => {
                            if (this.currentInput !== undefined
                                && this.selectionDrawer._enabled) {
                                const layer = event.target;
                                const feature = layer.feature;
                                // if is unselected -> select:
                                if (!this.isSelectedForInput(layer)) {
                                    let inputFeatureCollection;
                                    if (this.currentInput.enteredValue === undefined || this.currentInput.enteredValue.length === 0) {
                                        inputFeatureCollection = {
                                            type: 'FeatureCollection',
                                            features: []
                                        };
                                    } else {
                                        inputFeatureCollection = JSON.parse(this.currentInput.enteredValue);
                                    }
                                    inputFeatureCollection.features.push(feature);
                                    this.currentInput.enteredValue = JSON.stringify(inputFeatureCollection);
                                    if (this.currentInput.mapItems === undefined) {
                                        this.currentInput.mapItems = L.geoJSON(
                                            inputFeatureCollection, {
                                            });
                                    } else {
                                        this.currentInput.mapItems = L.geoJSON(
                                            inputFeatureCollection, {
                                            });
                                    }
                                    if (feature.geometry.type === 'Point') {
                                        layer.setIcon(this.inputMarkerIcon);
                                    } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
                                        layer.setStyle(this.inputLineStringDefaultStyle);
                                    } else {
                                        layer.setStyle(this.inputDefaultStyle);
                                    }
                                    this.renderFrontEnd();
                                    this.selectedOutputLayers.push(layer);
                                } else {
                                    // if is selected -> unselect:
                                    // remove from currentInput.mapItems:
                                    const inputFeatureCollection = this.removeFeatureFromCollection(
                                        feature,
                                        JSON.parse(this.currentInput.enteredValue)
                                    );
                                    this.currentInput.mapItems = L.geoJSON(
                                        inputFeatureCollection, {
                                        });
                                    // visual unselect:
                                    if (feature.geometry.type === 'Point') {
                                        layer.setIcon(this.outputMarkerIcon);
                                    } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
                                        layer.setStyle(this.outputLineStringDefaultStyle);
                                    } else {
                                        layer.setStyle(this.outputDefaultStyle);
                                    }
                                    const index = this.selectedOutputLayers.indexOf(layer);
                                    if (index > -1) {
                                        this.selectedOutputLayers.splice(index, 1);
                                    }
                                    this.currentInput.enteredValue = JSON.stringify(inputFeatureCollection);
                                    this.renderFrontEnd();
                                }
                                this.specification.checkInputsForCompleteness('');
                            }
                        },
                        mouseover: (event) => {
                            const layer = event.target;
                            const feature = layer.feature;
                            if (feature.geometry.type === 'Point') {
                                if (!this.isSelectedForInput(layer)) {
                                    layer.setIcon(isInput ? this.inputMarkerHighlighIcon : this.outputMarkerHighlighIcon);
                                } else {
                                    layer.setIcon(this.inputMarkerHighlighIcon);
                                }
                            } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
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
                            const layer = event.target;
                            const feature = layer.feature;
                            if (feature.geometry.type === 'Point') {
                                if (!this.isSelectedForInput(layer)) {
                                    layer.setIcon(isInput ? this.inputMarkerIcon : this.outputMarkerIcon);
                                } else {
                                    layer.setIcon(this.inputMarkerIcon);
                                }
                            } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
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
        this.addedLayers.push(layerToAdd);
        if (isInput) {
            this.layersControl.overlays['<b>JobID:</b> ' + jobId + '<br><b>Input:</b> ' + name] = layerToAdd;
        } else {
            this.layersControl.overlays['<b>JobID:</b> ' + jobId + '<br><b>Output:</b> ' + name] = layerToAdd;
            this.dataService.setGeojsonOutputExists(true);
        }
        this.addRemoveLayersButton();
    }

    btn_removeLayers() {
        for (const layer of this.addedLayers) {
            this.map.removeLayer(layer);
        }
        this.addedLayers = [];
        this.layersControl.overlays = {};
        const removeLayersBtn = document.getElementById('remove-layers-btn');
        removeLayersBtn.parentNode.removeChild(removeLayersBtn);

    }

    renderFrontEnd() {
        window.dispatchEvent(new Event('resize'));
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }

}
