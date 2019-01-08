// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // map configuration:
  startCenter: {
//    latitude: 51.9487949,
//    longitude: 7.6237527
    latitude: -33.465921,
    longitude: -70.660072
  },
  startZoom: 9,                    // 1,2,...,18 ; 1-world view, 18-very close
  startLanguage: "en",              // "en", "de"
  
  // wps configuration:
  serviceUrls: [
    "http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService",
    "https://riesgos.52north.org/wps/WebProcessingService"
  ],
  defaultServiceUrl: 1,
  serviceVersion: "2.0.0",           // "1.0.0", "2.0.0"
  
  // process configuration:
//  defaultProcessIdentifier: "org.n52.wps.python.algorithm.QuakeMLProcessBBox",
  defaultProcessIdentifier: "org.n52.wps.server.algorithm.SimpleBufferAlgorithm",
  // process inputs:
  defaultMimeType: "application/vnd.geo+json",
  defaultSchema: "http://schemas.opengis.net/gml/3.1.0/base/feature.xsd",
  defaultEncoding: "base64",
  // process outputs:
  defaultOutputMimeType: "application/vnd.geo+json",
  defaultOutputSchema: "http://schemas.opengis.net/gml/3.1.0/base/feature.xsd",
  defaultOutputEncoding: "base64",
  defaultTransmissionMode: "value",
  
  // execute configuration:
  defaultExecutionMode: "sync-execute",
  defaultResponseFormat: "document",
  
  // info control:
  showInfoControl: true
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
