import { firestore } from "./firebase";
export declare type JDocumentReference = com.google.firebase.firestore.DocumentReference;
export declare type JCollectionReference = com.google.firebase.firestore.CollectionReference;
export declare class QuerySnapshot implements firestore.QuerySnapshot {
    private snapshot;
    private _docSnapshots;
    constructor(snapshot: com.google.firebase.firestore.QuerySnapshot);
    metadata: {
        fromCache: boolean;
        hasPendingWrites: boolean;
    };
    readonly docs: firestore.QueryDocumentSnapshot[];
    docSnapshots: firestore.DocumentSnapshot[];
    docChanges(options?: firestore.SnapshotListenOptions): firestore.DocumentChange[];
    forEach(callback: (result: firestore.DocumentSnapshot) => void, thisArg?: any): void;
}
