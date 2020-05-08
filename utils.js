Array.prototype.top = function() {
    return this[this.length - 1]
}

function floatToHex(f) {
    var NAN_BITS = 0|0x7FC00000;
    var INF_BITS = 0|0x7F800000;
    var ZERO_BITS = 0|0x00000000;
    var SIGN_MASK = 0|0x80000000;
    var EXP_MASK = 0|0x7F800000;
    var MANT_MASK = 0|0x007FFFFF;
    var MANT_MAX = Math.pow(2.0, 23) - 1.0;

    if (f != f)
        return NAN_BITS;
    var hasSign = f < 0.0 || (f == 0.0 && 1.0 / f < 0);
    var signBits = hasSign ? SIGN_MASK : 0;
    var fabs = Math.abs(f);

    if (fabs == Number.POSITIVE_INFINITY)
        return signBits | INF_BITS;

    var exp = 0, x = fabs;
    while (x >= 2.0 && exp <= 127) {
        exp++;
        x /= 2.0;
    }
    while (x < 1.0 && exp >= -126) {
        exp--;
        x *= 2.0;
    }
    //assert(x * Math.pow(2.0, exp) == fabs, "fabs");
    var biasedExp = exp + 127;
    //assert(0 <= biasedExp && biasedExp <= 254, biasedExp);

    if (biasedExp == 255)
        return signBit | INF_BITS;
    if (biasedExp == 0) {
        //assert(0.0 <= x && x < 2.0, "x in [0.0, 1.0)", x);
        var mantissa = x * Math.pow(2.0, 23) / 2.0;
    } else {
        //assert(1.0 <= x && x < 2.0, "x in [0.5; 1.0)", x);
        var mantissa = x * Math.pow(2.0, 23) - Math.pow(2.0, 23);
    }
    //assert(0.0 <= mantissa && mantissa <= MANT_MAX, "mantissa in [0.0, 2^23)", mantissa);

    //console.log("number", f, "x", x, "biasedExp", biasedExp, "mantissa", mantissa.toString(16));
    var expBits = (biasedExp << 23) & EXP_MASK;
    var mantissaBits = mantissa & MANT_MASK;

    //console.log("number", f, "sign", signBits.toString(16), "expBits", expBits.toString(16), "mantissaBits", mantissaBits.toString(16));
    return (signBits | expBits | mantissaBits).toString(16);
}

module.exports = {
    floatToHex
}