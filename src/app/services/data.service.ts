import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ProcessOffering, ProcessOfferingProcess } from '../model/process-offering';
import { ExecuteResponse, ResponseDocument } from '../model/execute-response';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  // Observable sources
  private expandedPanelSource = new Subject<number>();

  private WebProcessingServiceSource = new Subject<any>();
  private WPSVersionSource = new Subject<string>();
  private getCapSuccessfulSource = new Subject<boolean>();

  private selectedProcessIdSource = new Subject<string>();
  private processInputsDoneSource = new Subject<boolean>();
  private processOfferingSource = new Subject<ProcessOffering>();
  private processesSource = new Subject<ProcessOfferingProcess[]>();
  private polyLineDrawerSource = new Subject<boolean>();
  private polygonDrawerSource = new Subject<boolean>();
  private rectangleDrawerSource = new Subject<boolean>();
  private circleDrawerSource = new Subject<boolean>();
  private markerDrawerSource = new Subject<boolean>();
  private selectionDrawerSource = new Subject<boolean>();
  private currentInputSource = new Subject<any>();
  private removeDrawnItemsSource = new Subject<any>();

  private addLayerOnMapSource = new Subject<any>();
  private geojsonOutputExistsSource = new Subject<boolean>();
  private wpsExecuteLoadingSource = new Subject<boolean>();
  private errorResponseSource = new Subject<any>();

  private executeResponseSource = new Subject<ExecuteResponse>();
  private responseDocumentSource = new Subject<ResponseDocument>();

  // Observable streams
  expandedPanel$ = this.expandedPanelSource.asObservable();

  webProcessingService$ = this.WebProcessingServiceSource.asObservable();
  wpsVersion$ = this.WPSVersionSource.asObservable();
  getCapSuccess$ = this.getCapSuccessfulSource.asObservable();

  processIdentifier$ = this.selectedProcessIdSource.asObservable();
  processInputsDone$ = this.processInputsDoneSource.asObservable();
  processOffering$ = this.processOfferingSource.asObservable();
  processes$ = this.processesSource.asObservable();
  polyLineDrawerEnabled$ = this.polyLineDrawerSource.asObservable();
  polygonDrawerEnabled$ = this.polygonDrawerSource.asObservable();
  rectangleDrawerEnabled$ = this.rectangleDrawerSource.asObservable();
  circleDrawerEnabled$ = this.circleDrawerSource.asObservable();
  markerDrawerEnabled$ = this.markerDrawerSource.asObservable();
  selectionDrawerEnabled$ = this.selectionDrawerSource.asObservable();
  currentInput$ = this.currentInputSource.asObservable();
  removeDrawnItems$ = this.removeDrawnItemsSource.asObservable();

  addLayerOnMap$ = this.addLayerOnMapSource.asObservable();
  geojsonOutputExists$ = this.geojsonOutputExistsSource.asObservable();
  wpsExecuteLoading$ = this.wpsExecuteLoadingSource.asObservable();
  errorResponse$ = this.errorResponseSource.asObservable();

  executeResponse$ = this.executeResponseSource.asObservable();
  responseDocument$ = this.responseDocumentSource.asObservable();

  // Service setters
  setExpandedPanel(panel: number) {
    this.expandedPanelSource.next(panel);
  }

  setWebProcessingService(wps: any) {
    this.WebProcessingServiceSource.next(wps);
  }
  setWpsVersion(version: string) {
    this.WPSVersionSource.next(version);
  }
  setGetCapSuccessful(success: boolean) {
    this.getCapSuccessfulSource.next(success);
  }

  setSelectedProcessIdentifier(processId: string) {
    this.selectedProcessIdSource.next(processId);
  }
  setProcessInputsDone(processInputsDone: boolean) {
    this.processInputsDoneSource.next(processInputsDone);
  }
  setProcessOffering(processOffering: ProcessOffering) {
    this.processOfferingSource.next(processOffering);
  }
  setProcesses(processes: ProcessOfferingProcess[]) {
    this.processesSource.next(processes);
  }
  setPolylineDrawerEnabled(enabled: boolean) {
    this.polyLineDrawerSource.next(enabled);
  }
  setPolygonDrawerEnabled(enabled: boolean) {
    this.polygonDrawerSource.next(enabled);
  }
  setRectangleDrawerEnabled(enabled: boolean) {
    this.rectangleDrawerSource.next(enabled);
  }
  setCircleDrawerEnabled(enabled: boolean) {
    this.circleDrawerSource.next(enabled);
  }
  setMarkerDrawerEnabled(enabled: boolean) {
    this.markerDrawerSource.next(enabled);
  }
  setSelectionDrawerEnabled(enabled: boolean) {
    this.selectionDrawerSource.next(enabled);
  }
  setCurrentInput(input: any) {
    this.currentInputSource.next(input);
  }
  setRemoveDrawnItems(layer) {
    this.removeDrawnItemsSource.next(layer);
  }

  addLayerOnMap(layer) {
    this.addLayerOnMapSource.next(layer);
  }
  setGeojsonOutputExists(exists: boolean) {
    this.geojsonOutputExistsSource.next(exists);
  }
  setWpsExecuteLoading(loading: boolean) {
    this.wpsExecuteLoadingSource.next(loading);
  }
  setResponseError(error: any) {
    this.errorResponseSource.next(error);
  }

  setExecuteResponse(executeResponse) {
    this.executeResponseSource.next(executeResponse);
  }

  setResponseDocument(responseDocument) {
    this.responseDocumentSource.next(responseDocument);
  }
}
