"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function onMessageClicked(callback) {
    var listener = new com.google.firebase.inappmessaging.FirebaseInAppMessagingClickListener({
        messageClicked: function (message, action) {
            callback({
                campaignName: message.getCampaignName()
            });
        }
    });
    com.google.firebase.inappmessaging.FirebaseInAppMessaging.getInstance().addClickListener(listener);
}
exports.onMessageClicked = onMessageClicked;
function onMessageImpression(callback) {
    var listener = new com.google.firebase.inappmessaging.FirebaseInAppMessagingImpressionListener({
        impressionDetected: function (message) {
            callback({
                campaignName: message.getCampaignName()
            });
        }
    });
    com.google.firebase.inappmessaging.FirebaseInAppMessaging.getInstance().addImpressionListener(listener);
}
exports.onMessageImpression = onMessageImpression;
function triggerEvent(eventName) {
    com.google.firebase.inappmessaging.FirebaseInAppMessaging.getInstance().triggerEvent(eventName);
}
exports.triggerEvent = triggerEvent;
