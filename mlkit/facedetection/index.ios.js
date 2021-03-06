"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var image_source_1 = require("tns-core-modules/image-source");
var utils_1 = require("tns-core-modules/utils/utils");
var facedetection_common_1 = require("./facedetection-common");
var MLKitFaceDetection = (function (_super) {
    __extends(MLKitFaceDetection, _super);
    function MLKitFaceDetection() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MLKitFaceDetection.prototype.createDetector = function () {
        return getDetector({
            detectionMode: this.detectionMode,
            enableFaceTracking: this.enableFaceTracking,
            minimumFaceSize: this.minimumFaceSize
        });
    };
    MLKitFaceDetection.prototype.createSuccessListener = function () {
        var _this = this;
        return function (faces, error) {
            if (error !== null) {
                console.log(error.localizedDescription);
            }
            else if (faces !== null && faces.count > 0) {
                var result = {
                    faces: []
                };
                for (var i = 0, l = faces.count; i < l; i++) {
                    var face = faces.objectAtIndex(i);
                    result.faces.push({
                        smilingProbability: face.hasSmilingProbability ? face.smilingProbability : undefined,
                        leftEyeOpenProbability: face.hasLeftEyeOpenProbability ? face.leftEyeOpenProbability : undefined,
                        rightEyeOpenProbability: face.hasRightEyeOpenProbability ? face.rightEyeOpenProbability : undefined,
                        trackingId: face.hasTrackingID ? face.trackingID : undefined,
                        bounds: face.frame,
                        headEulerAngleY: face.headEulerAngleY,
                        headEulerAngleZ: face.headEulerAngleZ
                    });
                }
                _this.notify({
                    eventName: MLKitFaceDetection.scanResultEvent,
                    object: _this,
                    value: result
                });
            }
        };
    };
    MLKitFaceDetection.prototype.rotateRecording = function () {
        return false;
    };
    MLKitFaceDetection.prototype.getVisionOrientation = function (imageOrientation) {
        if (imageOrientation === 0 && !utils_1.ios.isLandscape()) {
            return 6;
        }
        else {
            return _super.prototype.getVisionOrientation.call(this, imageOrientation);
        }
    };
    return MLKitFaceDetection;
}(facedetection_common_1.MLKitFaceDetection));
exports.MLKitFaceDetection = MLKitFaceDetection;
function getDetector(options) {
    var firVision = FIRVision.vision();
    var firOptions = FIRVisionFaceDetectorOptions.new();
    firOptions.performanceMode = options.detectionMode === "accurate" ? 2 : 1;
    firOptions.landmarkMode = 2;
    firOptions.classificationMode = 2;
    firOptions.minFaceSize = options.minimumFaceSize;
    firOptions.trackingEnabled = options.enableFaceTracking === true;
    return firVision.faceDetectorWithOptions(firOptions);
}
function detectFacesOnDevice(options) {
    return new Promise(function (resolve, reject) {
        try {
            var faceDetector = getDetector(options);
            faceDetector.processImageCompletion(getImage(options), function (faces, error) {
                if (error !== null) {
                    reject(error.localizedDescription);
                }
                else if (faces !== null) {
                    var result = {
                        faces: []
                    };
                    for (var i = 0, l = faces.count; i < l; i++) {
                        var face = faces.objectAtIndex(i);
                        result.faces.push({
                            smilingProbability: face.hasSmilingProbability ? face.smilingProbability : undefined,
                            leftEyeOpenProbability: face.hasLeftEyeOpenProbability ? face.leftEyeOpenProbability : undefined,
                            rightEyeOpenProbability: face.hasRightEyeOpenProbability ? face.rightEyeOpenProbability : undefined,
                            trackingId: face.hasTrackingID ? face.trackingID : undefined,
                            bounds: face.frame,
                            headEulerAngleY: face.headEulerAngleY,
                            headEulerAngleZ: face.headEulerAngleZ
                        });
                    }
                    resolve(result);
                }
            });
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.detectFaces: " + ex);
            reject(ex);
        }
    });
}
exports.detectFacesOnDevice = detectFacesOnDevice;
function getImage(options) {
    var image = options.image instanceof image_source_1.ImageSource ? options.image.ios : options.image.imageSource.ios;
    var newImage = UIImage.alloc().initWithCGImageScaleOrientation(image.CGImage, 1, 0);
    return FIRVisionImage.alloc().initWithImage(newImage);
}
