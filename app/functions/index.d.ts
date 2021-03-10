import * as firebase from "../../firebase";
export declare namespace functions {
    class Functions {
        httpsCallable<I, O>(functionName: string, region?: firebase.functions.SupportedRegions): firebase.functions.HttpsCallable<I, O>;
    }
}
