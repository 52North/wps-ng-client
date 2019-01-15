import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import { AppSettings } from './../model/app-setting';

@Injectable({
  providedIn: 'root'
})
export class HttpGetService {

  constructor(private http: HttpClient) { }

  getReferencedOutput(url: string) {
    return this.http.get(url);
  }

  getAppSettings() {
    return this.http.get("assets/AppSettings.json");
  }

}