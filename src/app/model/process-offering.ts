export class ProcessOffering {

    jobControlOptions: Array<string>;
    outputTransmissionModes: Array<string>;
    process: ProcessOfferingProcess;
    processVersion: string;
    service: string;
    version: string;
    selectedExecutionMode: string;
    selectedResponseFormat: string;
}

export class ProcessOfferingProcess {

    abstractValue: string;
    identifier: string;
    inputs: any[];
    outputs: any[];
    title: string;

}
