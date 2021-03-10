"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var image_source_1 = require("tns-core-modules/image-source");
var utils_1 = require("tns-core-modules/utils/utils");
var barcodescanning_common_1 = require("./barcodescanning-common");
exports.BarcodeFormat = barcodescanning_common_1.BarcodeFormat;
var MLKitBarcodeScanner = (function (_super) {
    __extends(MLKitBarcodeScanner, _super);
    function MLKitBarcodeScanner() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.inverseThrottle = 0;
        return _this;
    }
    MLKitBarcodeScanner.prototype.createDetector = function () {
        var formats;
        if (this.formats) {
            formats = [];
            var requestedFormats = this.formats.split(",");
            requestedFormats.forEach(function (format) { return formats.push(barcodescanning_common_1.BarcodeFormat[format.trim().toUpperCase()]); });
        }
        if (this.beepOnScan) {
            AVAudioSession.sharedInstance().setCategoryModeOptionsError(AVAudioSessionCategoryPlayback, AVAudioSessionModeDefault, 1);
            var barcodeBundlePath = NSBundle.bundleWithIdentifier("org.nativescript.plugin.firebase.MLKit").bundlePath;
            this.player = new AVAudioPlayer({ contentsOfURL: NSURL.fileURLWithPath(barcodeBundlePath + "/beep.caf") });
            this.player.numberOfLoops = 1;
            this.player.volume = 0.7;
            this.player.prepareToPlay();
        }
        return getBarcodeDetector(formats);
    };
    MLKitBarcodeScanner.prototype.createSuccessListener = function () {
        var _this = this;
        return function (barcodes, error) {
            if (error !== null) {
                console.log(error.localizedDescription);
            }
            else if (barcodes !== null) {
                var result = {
                    barcodes: []
                };
                for (var i = 0, l = barcodes.count; i < l; i++) {
                    var barcode = barcodes.objectAtIndex(i);
                    var image = _this.lastVisionImage;
                    var imageWidth = image.size.width;
                    var imageHeight = image.size.height;
                    var _a = barcode.frame.origin, x = _a.x, y = _a.y;
                    var _b = barcode.frame.size, width = _b.width, height = _b.height;
                    if (image) {
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
                    result.barcodes.push({
                        value: barcode.rawValue,
                        displayValue: barcode.displayValue,
                        format: barcodescanning_common_1.BarcodeFormat[barcode.format],
                        ios: barcode,
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
                    });
                }
                _this.notify({
                    eventName: MLKitBarcodeScanner.scanResultEvent,
                    object: _this,
                    value: result
                });
                if (barcodes.count > 0 && _this.player) {
                    _this.player.play();
                }
            }
        };
    };
    MLKitBarcodeScanner.prototype.rotateRecording = function () {
        return false;
    };
    MLKitBarcodeScanner.prototype.preProcessImage = function (image) {
        if (this.supportInverseBarcodes && this.inverseThrottle++ % 2 === 0) {
            var filter = CIFilter.filterWithName('CIColorInvert');
            var ciImg = CIImage.alloc().initWithImage(image);
            filter.setValueForKey(ciImg, kCIInputImageKey);
            filter.setDefaults();
            ciImg = filter.outputImage;
            var context = CIContext.alloc().init();
            var cgImg = context.createCGImageFromRect(ciImg, ciImg.extent);
            image = UIImage.alloc().initWithCGImage(cgImg);
        }
        return image;
    };
    return MLKitBarcodeScanner;
}(barcodescanning_common_1.MLKitBarcodeScanner));
exports.MLKitBarcodeScanner = MLKitBarcodeScanner;
function getBarcodeDetector(formats) {
    if (formats && formats.length > 0) {
        var barcodeFormats_1 = 0;
        formats.forEach(function (format) { return barcodeFormats_1 |= format; });
        return FIRVision.vision().barcodeDetectorWithOptions(FIRVisionBarcodeDetectorOptions.alloc().initWithFormats(barcodeFormats_1));
    }
    else {
        return FIRVision.vision().barcodeDetector();
    }
}
function scanBarcodesOnDevice(options) {
    return new Promise(function (resolve, reject) {
        try {
            var barcodeDetector = getBarcodeDetector(options.formats);
            var image_1 = options.image instanceof image_source_1.ImageSource ? options.image.ios : options.image.imageSource.ios;
            var firImage = FIRVisionImage.alloc().initWithImage(image_1);
            barcodeDetector.detectInImageCompletion(firImage, function (barcodes, error) {
                if (error !== null) {
                    reject(error.localizedDescription);
                }
                else if (barcodes !== null) {
                    var result = {
                        barcodes: []
                    };
                    for (var i = 0, l = barcodes.count; i < l; i++) {
                        var barcode = barcodes.objectAtIndex(i);
                        result.barcodes.push({
                            value: barcode.rawValue,
                            displayValue: barcode.displayValue,
                            format: barcodescanning_common_1.BarcodeFormat[barcode.format],
                            ios: barcode,
                            bounds: barcode.frame,
                            image: {
                                width: image_1.size.width,
                                height: image_1.size.height
                            }
                        });
                    }
                    resolve(result);
                }
            });
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.scanBarcodesOnDevice: " + ex);
            reject(ex);
        }
    });
}
exports.scanBarcodesOnDevice = scanBarcodesOnDevice;
