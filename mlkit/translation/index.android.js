"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function ensureTranslationModelDownloaded(options) {
    return new Promise(function (resolve, reject) {
        _downloadTranslationModelIfNeeded(options)
            .then(function () { return resolve(); })
            .catch(reject);
    });
}
exports.ensureTranslationModelDownloaded = ensureTranslationModelDownloaded;
function translateText(options) {
    return new Promise(function (resolve, reject) {
        try {
            var onSuccessListener_1 = new com.google.android.gms.tasks.OnSuccessListener({
                onSuccess: function (result) { return resolve(result); }
            });
            var onFailureListener_1 = new com.google.android.gms.tasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            });
            _downloadTranslationModelIfNeeded(options)
                .then(function (translator) {
                translator.translate(options.text)
                    .addOnSuccessListener(onSuccessListener_1)
                    .addOnFailureListener(onFailureListener_1);
            })
                .catch(reject);
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.translation.translateText: " + ex);
            reject(ex);
        }
    });
}
exports.translateText = translateText;
function _downloadTranslationModelIfNeeded(options) {
    return new Promise(function (resolve, reject) {
        try {
            var source = +com.google.firebase.ml.naturallanguage.translate.FirebaseTranslateLanguage.languageForLanguageCode(options.from);
            var target = +com.google.firebase.ml.naturallanguage.translate.FirebaseTranslateLanguage.languageForLanguageCode(options.to);
            var firTranslatorOptions = new com.google.firebase.ml.naturallanguage.translate.FirebaseTranslatorOptions.Builder()
                .setSourceLanguage(source)
                .setTargetLanguage(target)
                .build();
            var firTranslator_1 = com.google.firebase.ml.naturallanguage.FirebaseNaturalLanguage.getInstance().getTranslator(firTranslatorOptions);
            var modelDownloadConditions = new com.google.firebase.ml.common.modeldownload.FirebaseModelDownloadConditions.Builder()
                .requireWifi()
                .build();
            var onSuccessListener = new com.google.android.gms.tasks.OnSuccessListener({
                onSuccess: function () { return resolve(firTranslator_1); }
            });
            var onFailureListener = new com.google.android.gms.tasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            });
            firTranslator_1.downloadModelIfNeeded(modelDownloadConditions)
                .addOnSuccessListener(onSuccessListener)
                .addOnFailureListener(onFailureListener);
        }
        catch (ex) {
            console.log("Error downloading translation model: " + ex);
            reject(ex);
        }
    });
}
