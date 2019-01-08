export const environment = {
  production: true,
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
