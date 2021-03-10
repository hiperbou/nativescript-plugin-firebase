"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ListResult = (function () {
    function ListResult(items, prefixes, nextPageToken) {
        this.items = items;
        this.prefixes = prefixes;
        this.nextPageToken = nextPageToken;
    }
    return ListResult;
}());
exports.ListResult = ListResult;
