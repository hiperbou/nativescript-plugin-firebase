import { firestore } from "./firebase";
export declare class QuerySnapshot implements firestore.QuerySnapshot {
    private snapshot;
    private _docSnapshots;
    constructor(snapshot: FIRQuerySnapshot);
    metadata: {
        fromCache: boolean;
        hasPendingWrites: boolean;
    };
    readonly docs: firestore.QueryDocumentSnapshot[];
    docSnapshots: firestore.DocumentSnapshot[];
    docChanges(options?: firestore.SnapshotListenOptions): firestore.DocumentChange[];
    forEach(callback: (result: firestore.DocumentSnapshot) => void, thisArg?: any): void;
}
