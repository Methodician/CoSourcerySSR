export class Upload {
    public uid: string;
    public file: File;
    public url: string;
    public fullPath: string;
    public name: string;
    public timestamp: any;
    public progress: string;
    public size: number;
    public type: string;
    constructor(file: File) {
        this.file = file;
    }
}
