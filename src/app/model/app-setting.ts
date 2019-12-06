export class AppSettings {
    startCenter: {
      latitude: number,
      longitude: number
    };
    scaleBar: {
      visible: boolean,
      settings: object
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
    asyncAutoRefreshInterval: number;

    showInfoControl: boolean;
}
