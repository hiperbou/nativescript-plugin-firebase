"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("tns-core-modules/utils/utils");
var application = require("tns-core-modules/application");
var mlkit_cameraview_common_1 = require("./mlkit-cameraview-common");
var MLKitCameraView = (function (_super) {
    __extends(MLKitCameraView, _super);
    function MLKitCameraView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MLKitCameraView.prototype.disposeNativeView = function () {
        _super.prototype.disposeNativeView.call(this);
        if (this.captureSession) {
            this.captureSession.stopRunning();
            this.captureSession = undefined;
        }
        this.captureDevice = undefined;
        this.previewLayer = undefined;
        this.cameraView = undefined;
        application.off("orientationChanged");
    };
    MLKitCameraView.prototype.createNativeView = function () {
        var v = _super.prototype.createNativeView.call(this);
        if (this.canUseCamera()) {
            this.initView();
        }
        else {
            console.log("There's no Camera on this device :(");
        }
        return v;
    };
    MLKitCameraView.prototype.canUseCamera = function () {
        try {
            return !!AVCaptureDeviceDiscoverySession &&
                AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeVideo) !== null &&
                NSProcessInfo.processInfo.environment.objectForKey("SIMULATOR_DEVICE_NAME") === null;
        }
        catch (ignore) {
            return false;
        }
    };
    MLKitCameraView.prototype.initView = function () {
        var _this = this;
        this.captureDevice = AVCaptureDeviceDiscoverySession.discoverySessionWithDeviceTypesMediaTypePosition([AVCaptureDeviceTypeBuiltInWideAngleCamera], AVMediaTypeVideo, this.preferFrontCamera ? 2 : 1).devices.firstObject;
        if (this.torchOn) {
            this.updateTorch();
        }
        this.captureSession = AVCaptureSession.new();
        this.captureSession.sessionPreset = AVCaptureSessionPreset1280x720;
        try {
            var captureDeviceInput = AVCaptureDeviceInput.deviceInputWithDeviceError(this.captureDevice);
            this.captureSession.addInput(captureDeviceInput);
        }
        catch (e) {
            console.log("Error while trying to use the camera: " + e);
            return;
        }
        this.previewLayer = AVCaptureVideoPreviewLayer.layerWithSession(this.captureSession);
        this.previewLayer.videoGravity = AVLayerVideoGravityResizeAspectFill;
        if (utils_1.ios.isLandscape()) {
            var deviceOrientation = UIDevice.currentDevice.orientation;
            this.previewLayer.connection.videoOrientation = deviceOrientation === 3 ? 3 : 4;
        }
        else {
            this.previewLayer.connection.videoOrientation = 1;
        }
        application.off("orientationChanged");
        application.on("orientationChanged", this.rotateOnOrientationChange.bind(this));
        setTimeout(function () {
            if (_this.ios) {
                _this.ios.layer.addSublayer(_this.previewLayer);
            }
            if (!_this.pause) {
                _this.captureSession.startRunning();
            }
            _this.cameraView = TNSMLKitCameraView.alloc().initWithCaptureSession(_this.captureSession);
            _this.cameraView.processEveryXFrames = _this.processEveryNthFrame;
            if (_this.rotateRecording()) {
                _this.cameraView.imageOrientation = 3;
            }
            _this.cameraView.delegate = TNSMLKitCameraViewDelegateImpl.createWithOwnerResultCallbackAndOptions(new WeakRef(_this), function (data) { }, _this.preProcessImage, {});
        }, 0);
    };
    MLKitCameraView.prototype.rotateOnOrientationChange = function (args) {
        if (this.previewLayer) {
            if (args.newValue === "landscape") {
                var deviceOrientation = UIDevice.currentDevice.orientation;
                this.previewLayer.connection.videoOrientation = deviceOrientation === 3 ? 3 : 4;
            }
            else if (args.newValue === "portrait") {
                this.previewLayer.connection.videoOrientation = 1;
            }
        }
    };
    MLKitCameraView.prototype.onLayout = function (left, top, right, bottom) {
        _super.prototype.onLayout.call(this, left, top, right, bottom);
        if (this.previewLayer && this.ios && this.canUseCamera()) {
            this.previewLayer.frame = this.ios.layer.bounds;
        }
    };
    MLKitCameraView.prototype.getVisionOrientation = function (imageOrientation) {
        if (imageOrientation === 0) {
            return 1;
        }
        else if (imageOrientation === 1) {
            return 3;
        }
        else if (imageOrientation === 2) {
            return 8;
        }
        else if (imageOrientation === 3) {
            return 6;
        }
        else if (imageOrientation === 4) {
            return 2;
        }
        else if (imageOrientation === 5) {
            return 4;
        }
        else if (imageOrientation === 6) {
            return 5;
        }
        else if (imageOrientation === 7) {
            return 7;
        }
        else {
            return 1;
        }
    };
    MLKitCameraView.prototype.updateTorch = function () {
        var device = this.captureDevice;
        if (device && device.hasTorch && device.lockForConfiguration()) {
            if (this.torchOn) {
                device.torchMode = 1;
                device.flashMode = 1;
            }
            else {
                device.torchMode = 0;
                device.flashMode = 0;
            }
            device.unlockForConfiguration();
        }
    };
    MLKitCameraView.prototype.pauseScanning = function () {
        if (this.captureSession && this.captureSession.running) {
            this.captureSession.stopRunning();
        }
    };
    MLKitCameraView.prototype.resumeScanning = function () {
        if (this.captureSession && !this.captureSession.running) {
            this.captureSession.startRunning();
        }
    };
    MLKitCameraView.prototype.runDetector = function (image, onComplete) {
        throw new Error("No custom detector implemented, so 'runDetector' can't do its thing");
    };
    return MLKitCameraView;
}(mlkit_cameraview_common_1.MLKitCameraView));
exports.MLKitCameraView = MLKitCameraView;
var TNSMLKitCameraViewDelegateImpl = (function (_super) {
    __extends(TNSMLKitCameraViewDelegateImpl, _super);
    function TNSMLKitCameraViewDelegateImpl() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.detectorBusy = false;
        return _this;
    }
    TNSMLKitCameraViewDelegateImpl.createWithOwnerResultCallbackAndOptions = function (owner, callback, preProcessImageCallback, options) {
        if (TNSMLKitCameraViewDelegateImpl.ObjCProtocols.length === 0 && typeof (TNSMLKitCameraViewDelegate) !== "undefined") {
            TNSMLKitCameraViewDelegateImpl.ObjCProtocols.push(TNSMLKitCameraViewDelegate);
        }
        var delegate = TNSMLKitCameraViewDelegateImpl.new();
        delegate.owner = owner;
        delegate.options = options;
        delegate.resultCallback = callback;
        delegate.preProcessImageCallback = preProcessImageCallback;
        delegate.detector = owner.get().createDetector();
        delegate.onSuccessListener = owner.get().createSuccessListener();
        return delegate;
    };
    TNSMLKitCameraViewDelegateImpl.prototype.cameraDidOutputImage = function (image) {
        var _this = this;
        if (!image || this.detectorBusy) {
            return;
        }
        this.detectorBusy = true;
        var onComplete = function () {
            _this.detectorBusy = false;
        };
        this.owner.get().lastVisionImage = image;
        if (this.detector.detectInImageCompletion) {
            this.detector.detectInImageCompletion(this.uiImageToFIRVisionImage(image), function (result, error) {
                _this.onSuccessListener(result, error);
                onComplete();
            });
        }
        else if (this.detector.processImageCompletion) {
            this.detector.processImageCompletion(this.uiImageToFIRVisionImage(image), function (result, error) {
                _this.onSuccessListener(result, error);
                onComplete();
            });
        }
        else {
            this.owner.get().runDetector(image, onComplete);
        }
    };
    TNSMLKitCameraViewDelegateImpl.prototype.uiImageToFIRVisionImage = function (image) {
        image = this.preProcessImageCallback(image);
        var fIRVisionImage = FIRVisionImage.alloc().initWithImage(image);
        var fIRVisionImageMetadata = FIRVisionImageMetadata.new();
        fIRVisionImageMetadata.orientation = this.owner.get().getVisionOrientation(image.imageOrientation);
        fIRVisionImage.metadata = fIRVisionImageMetadata;
        return fIRVisionImage;
    };
    TNSMLKitCameraViewDelegateImpl.ObjCProtocols = [];
    return TNSMLKitCameraViewDelegateImpl;
}(NSObject));
