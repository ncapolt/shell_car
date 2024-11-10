'use client';
// Helper functions to extend prototypes
ArrayBuffer.prototype.tohex = function () {
    return [...new Uint8Array(this)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
};
Uint8Array.prototype.tohex = function () {
    return [...new Uint8Array(this)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
};
String.prototype.toUint8Array = function () {
    if (!this) return new Uint8Array();
    return Uint8Array.from(this.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
};
