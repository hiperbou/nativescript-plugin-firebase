"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("tns-core-modules/file-system");
var image_source_1 = require("tns-core-modules/image-source");
var custommodel_common_1 = require("./custommodel-common");
var gmsTasks = com.google.android.gms.tasks;
var MLKitCustomModel = (function (_super) {
    __extends(MLKitCustomModel, _super);
    function MLKitCustomModel() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MLKitCustomModel.prototype.createDetector = function () {
        this.detector = getInterpreter(this.localModelFile);
        return this.detector;
    };
    MLKitCustomModel.prototype.runDetector = function (imageByteBuffer, previewWidth, previewHeight) {
        var _this = this;
        if (this.detectorBusy) {
            return;
        }
        this.detectorBusy = true;
        if (!this.onFailureListener) {
            this.onFailureListener = new gmsTasks.OnFailureListener({
                onFailure: function (exception) {
                    console.log(exception.getMessage());
                    _this.detectorBusy = false;
                }
            });
        }
        var modelExpectsWidth = this.modelInputShape[1];
        var modelExpectsHeight = this.modelInputShape[2];
        var isQuantized = this.modelInputType !== "FLOAT32";
        if (!this.inputOutputOptions) {
            var intArrayIn = Array.create("int", 4);
            intArrayIn[0] = this.modelInputShape[0];
            intArrayIn[1] = modelExpectsWidth;
            intArrayIn[2] = modelExpectsHeight;
            intArrayIn[3] = this.modelInputShape[3];
            var inputType = isQuantized ? com.google.firebase.ml.custom.FirebaseModelDataType.BYTE : com.google.firebase.ml.custom.FirebaseModelDataType.FLOAT32;
            var intArrayOut = Array.create("int", 2);
            intArrayOut[0] = 1;
            intArrayOut[1] = this.labels.length;
            this.inputOutputOptions = new com.google.firebase.ml.custom.FirebaseModelInputOutputOptions.Builder()
                .setInputFormat(0, inputType, intArrayIn)
                .setOutputFormat(0, inputType, intArrayOut)
                .build();
        }
        var input = org.nativescript.plugins.firebase.mlkit.BitmapUtil.byteBufferToByteBuffer(imageByteBuffer, previewWidth, previewHeight, modelExpectsWidth, modelExpectsHeight, isQuantized);
        var inputs = new com.google.firebase.ml.custom.FirebaseModelInputs.Builder()
            .add(input)
            .build();
        this.detector
            .run(inputs, this.inputOutputOptions)
            .addOnSuccessListener(this.onSuccessListener)
            .addOnFailureListener(this.onFailureListener);
    };
    MLKitCustomModel.prototype.createSuccessListener = function () {
        var _this = this;
        this.onSuccessListener = new gmsTasks.OnSuccessListener({
            onSuccess: function (output) {
                var probabilities = output.getOutput(0)[0];
                if (_this.labels.length !== probabilities.length) {
                    console.log("The number of labels (" + _this.labels.length + ") is not equal to the interpretation result (" + probabilities.length + ")!");
                    return;
                }
                var result = {
                    result: getSortedResult(_this.labels, probabilities, _this.maxResults)
                };
                _this.notify({
                    eventName: MLKitCustomModel.scanResultEvent,
                    object: _this,
                    value: result
                });
                _this.detectorBusy = false;
            }
        });
        return this.onSuccessListener;
    };
    return MLKitCustomModel;
}(custommodel_common_1.MLKitCustomModel));
exports.MLKitCustomModel = MLKitCustomModel;
var registeredModels = [];
function getInterpreter(localModelFile) {
    var localModelName = localModelFile.lastIndexOf("/") === -1 ? localModelFile : localModelFile.substring(localModelFile.lastIndexOf("/") + 1);
    var localModelRegistrationSuccess = false;
    if (localModelFile) {
        var localModelBuilder = new com.google.firebase.ml.custom.FirebaseCustomLocalModel.Builder();
        if (localModelFile.indexOf("~/") === 0) {
            localModelBuilder.setFilePath(fs.knownFolders.currentApp().path + localModelFile.substring(1));
        }
        else {
            localModelBuilder.setAssetFilePath(localModelFile);
        }
        var firModelOptions = new com.google.firebase.ml.custom.FirebaseModelInterpreterOptions.Builder(localModelBuilder.build()).build();
        return com.google.firebase.ml.custom.FirebaseModelInterpreter.getInstance(firModelOptions);
    }
    return null;
}
function useCustomModel(options) {
    return new Promise(function (resolve, reject) {
        try {
            var interpreter_1 = getInterpreter(options.localModelFile);
            var labels_1;
            if (options.labelsFile.indexOf("~/") === 0) {
                labels_1 = custommodel_common_1.getLabelsFromAppFolder(options.labelsFile);
            }
            else {
                reject("Use the ~/ prefix for now..");
                return;
            }
            var onSuccessListener = new gmsTasks.OnSuccessListener({
                onSuccess: function (output) {
                    var probabilities = output.getOutput(0)[0];
                    if (labels_1.length !== probabilities.length) {
                        console.log("The number of labels in " + options.labelsFile + " (" + labels_1.length + ") is not equal to the interpretation result (" + probabilities.length + ")!");
                        return;
                    }
                    var result = {
                        result: getSortedResult(labels_1, probabilities, options.maxResults)
                    };
                    resolve(result);
                    interpreter_1.close();
                }
            });
            var onFailureListener = new gmsTasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            });
            var intArrayIn = Array.create("int", 4);
            intArrayIn[0] = options.modelInput[0].shape[0];
            intArrayIn[1] = options.modelInput[0].shape[1];
            intArrayIn[2] = options.modelInput[0].shape[2];
            intArrayIn[3] = options.modelInput[0].shape[3];
            var isQuantized = options.modelInput[0].type !== "FLOAT32";
            var inputType = isQuantized ? com.google.firebase.ml.custom.FirebaseModelDataType.BYTE : com.google.firebase.ml.custom.FirebaseModelDataType.FLOAT32;
            var intArrayOut = Array.create("int", 2);
            intArrayOut[0] = 1;
            intArrayOut[1] = labels_1.length;
            var inputOutputOptions = new com.google.firebase.ml.custom.FirebaseModelInputOutputOptions.Builder()
                .setInputFormat(0, inputType, intArrayIn)
                .setOutputFormat(0, inputType, intArrayOut)
                .build();
            var image = options.image instanceof image_source_1.ImageSource ? options.image.android : options.image.imageSource.android;
            var input = org.nativescript.plugins.firebase.mlkit.BitmapUtil.bitmapToByteBuffer(image, options.modelInput[0].shape[1], options.modelInput[0].shape[2], isQuantized);
            var inputs = new com.google.firebase.ml.custom.FirebaseModelInputs.Builder()
                .add(input)
                .build();
            interpreter_1
                .run(inputs, inputOutputOptions)
                .addOnSuccessListener(onSuccessListener)
                .addOnFailureListener(onFailureListener);
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.useCustomModel: " + ex);
            reject(ex);
        }
    });
}
exports.useCustomModel = useCustomModel;
function getSortedResult(labels, probabilities, maxResults) {
    if (maxResults === void 0) { maxResults = 5; }
    var result = [];
    labels.forEach(function (text, i) { return result.push({ text: text, confidence: probabilities[i] }); });
    result.sort(function (a, b) { return a.confidence < b.confidence ? 1 : (a.confidence === b.confidence ? 0 : -1); });
    if (result.length > maxResults) {
        result.splice(maxResults);
    }
    result.map(function (r) { return r.confidence = (r.confidence & 0xff) / 255.0; });
    return result;
}
