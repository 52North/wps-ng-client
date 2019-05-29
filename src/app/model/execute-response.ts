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

export class ReferencedOutput {
    identifier: string;
    reference: Reference;
}

export class Reference {
    encoding: string;
    format: string;
    href: string;
    schema: string;
}
