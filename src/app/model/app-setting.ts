export class AppSettings {
    startCenter: {
      latitude: number,
      longitude: number
    };
    startZoom: number;   
    startLanguage: string;
    serviceUrls: string[];
    defaultServiceUrl: number;
    serviceVersion: string;
  
    defaultProcessIdentifier: string;

    defaultMimeType: string;
    defaultSchema: string;
    defaultEncoding: string;

    defaultOutputMimeType: string;
    defaultOutputSchema: string;
    defaultOutputEncoding: string;
    defaultTransmissionMode: string;
  
    defaultExecutionMode: string;
    defaultResponseFormat: string;
  
    showInfoControl: boolean;
}