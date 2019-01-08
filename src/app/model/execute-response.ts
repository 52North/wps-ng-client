export class ExecuteResponse {
    serviceVersion: string;
    type: string;
    responseDocument: ResponseDocument;
}

export class ResponseDocument {
    expirationDate: string;
    jobId: string;
    outputs: Array<any>;
    status: any;
    percentCompleted: any;
    statusLocation: any;
    version: any;
}