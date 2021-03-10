"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var image_source_1 = require("tns-core-modules/image-source");
var utils_1 = require("tns-core-modules/utils/utils");
var objectdetection_common_1 = require("./objectdetection-common");
var MLKitObjectDetection = (function (_super) {
    __extends(MLKitObjectDetection, _super);
    function MLKitObjectDetection() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MLKitObjectDetection.prototype.createDetector = function () {
        return getDetector(true, this.classify, this.multiple);
    };
    MLKitObjectDetection.prototype.createSuccessListener = function () {
        var _this = this;
        return function (objects, error) {
            if (error !== null) {
                console.log(error.localizedDescription);
            }
            else if (objects !== null && objects.count > 0) {
                var result = {
                    objects: []
                };
                for (var i = 0, l = objects.count; i < l; i++) {
                    var obj = objects.objectAtIndex(i);
                    result.objects.push(getMLKitObjectDetectionResultItem(obj, _this.lastVisionImage));
                }
                _this.notify({
                    eventName: MLKitObjectDetection.scanResultEvent,
                    object: _this,
                    value: result
                });
            }
        };
    };
    MLKitObjectDetection.prototype.rotateRecording = function () {
        return true;
    };
    return MLKitObjectDetection;
}(objectdetection_common_1.MLKitObjectDetection));
exports.MLKitObjectDetection = MLKitObjectDetection;
function getDetector(stream, classify, multiple) {
    var firVision = FIRVision.vision();
    var fIRVisionObjectDetectorOptions = FIRVisionObjectDetectorOptions.new();
    fIRVisionObjectDetectorOptions.detectorMode = stream ? 1 : 0;
    fIRVisionObjectDetectorOptions.shouldEnableClassification = classify || false;
    fIRVisionObjectDetectorOptions.shouldEnableMultipleObjects = multiple || false;
    return firVision.objectDetectorWithOptions(fIRVisionObjectDetectorOptions);
}
function detectObjects(options) {
    return new Promise(function (resolve, reject) {
        try {
            var detector = getDetector(false, options.classify, options.multiple);
            detector.processImageCompletion(getImage(options), function (objects, error) {
                if (error !== null) {
                    reject(error.localizedDescription);
                }
                else if (objects !== null) {
                    var result = {
                        objects: []
                    };
                    var image = options.image instanceof image_source_1.ImageSource ? options.image.ios : options.image.imageSource.ios;
                    for (var i = 0, l = objects.count; i < l; i++) {
                        var obj = objects.objectAtIndex(i);
                        result.objects.push(getMLKitObjectDetectionResultItem(obj, image));
                    }
                    resolve(result);
                }
            });
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.detectObjects: " + ex);
            reject(ex);
        }
    });
}
exports.detectObjects = detectObjects;
function getMLKitObjectDetectionResultItem(obj, image) {
    console.log(">> getMLKitObjectDetectionResultItem, image: " + image);
    var imageWidth;
    var imageHeight;
    var _a = obj.frame.origin, x = _a.x, y = _a.y;
    var _b = obj.frame.size, width = _b.width, height = _b.height;
    if (image) {
        imageWidth = image.size.width;
        imageHeight = image.size.height;
        var origX = x;
        var origWidth = width;
        var origImageWidth = imageWidth;
        if (utils_1.ios.isLandscape()) {
            if (UIDevice.currentDevice.orientation === 4) {
                x = image.size.width - (width + x);
                y = image.size.height - (height + y);
            }
        }
        else {
            x = image.size.height - (height + y);
            y = origX;
            width = height;
            height = origWidth;
            imageWidth = imageHeight;
            imageHeight = origImageWidth;
        }
    }
    return {
        id: obj.trackingID,
        category: objectdetection_common_1.ObjectDetectionCategory[obj.classificationCategory],
        confidence: obj.confidence,
        ios: obj,
        bounds: {
            origin: {
                x: x,
                y: y
            },
            size: {
                width: width,
                height: height
            }
        },
        image: {
            width: imageWidth,
            height: imageHeight
        }
    };
}
function getImage(options) {
    var image = options.image instanceof image_source_1.ImageSource ? options.image.ios : options.image.imageSource.ios;
    return FIRVisionImage.alloc().initWithImage(image);
}
