import * as textrecognition from "./textrecognition";
import * as barcodescanning from "./barcodescanning";
import * as facedetection from "./facedetection";
import * as imagelabeling from "./imagelabeling";
import * as objectdetection from "./objectdetection";
import * as landmarkrecognition from "./landmarkrecognition";
import * as custommodel from "./custommodel";
import * as automl from "./automl";
import * as naturallanguageidentification from "./naturallanguageidentification";
import * as translation from "./translation";
import * as smartreply from "./smartreply";
import { ImageSource } from "tns-core-modules/image-source";
import { Image } from "tns-core-modules/ui/image";
export interface MLKitVisionOptions {
    image?: Image | ImageSource;
}
export declare type MLKitCloudModelType = "stable" | "latest";
export interface MLKitVisionCloudOptions extends MLKitVisionOptions {
    modelType?: MLKitCloudModelType;
    maxResults?: number;
}
export interface MLKitVisionResult {
}
export declare class MLKitCameraView {
}
export { textrecognition, barcodescanning, facedetection, imagelabeling, objectdetection, landmarkrecognition, custommodel, automl, naturallanguageidentification, translation, smartreply };
