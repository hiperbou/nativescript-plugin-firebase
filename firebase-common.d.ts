import { firestore } from "./firebase";
export declare class FieldValue {
    type: firestore.FieldValueType;
    value: any;
    constructor(type: firestore.FieldValueType, value: any);
    static serverTimestamp: () => string;
    static delete: () => string;
    static arrayUnion: (...elements: any[]) => FieldValue;
    static arrayRemove: (...elements: any[]) => FieldValue;
    static increment: (n: number) => any;
}
export declare class GeoPoint {
    latitude: number;
    longitude: number;
    constructor(latitude: number, longitude: number);
}
export declare const firebase: any;
export declare abstract class DocumentSnapshot implements firestore.DocumentSnapshot {
    id: string;
    exists: boolean;
    ref: firestore.DocumentReference;
    data: () => firestore.DocumentData;
    constructor(id: string, exists: boolean, documentData: firestore.DocumentData, ref: firestore.DocumentReference);
}
export declare function isDocumentReference(object: any): object is firestore.DocumentReference;
