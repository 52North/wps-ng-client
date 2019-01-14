import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HttpGetService {

  constructor(private http: HttpClient) { }

  getReferencedOutput(url: string) {
    return this.http.get(url);
  }
}
