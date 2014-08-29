//FUNCTIONS
/*LOWER AND TRIM:
 * INPUT: a string or an array of strings
 * PROCESS: lower/trims every element in array
 * OUTPUT: an array of trimmed/lowered strings
 */
exports.lowerAndTrim = function (arr) {
    if (typeof arr === "object") {
        return arr.map(function (el) {
            return el.trim().toLowerCase();
        });
    }
  //IF IT IS JUST A STRING
    return arr.trim().toLowerCase();
};
exports.serializeJSON = function (obj) {
    var attr, i,
        result = "";
    for (attr in obj) {
        if (obj[attr] instanceof Array) {
            for (i in obj[attr]) {
                result += attr + "=" + obj[attr][i] + "&";
            }
        } else {
            result += attr + "=" + obj[attr] + '&';
        }
    }
    return result;
};

exports.arrayify = function (str) {
    if (!(str instanceof Array)) {
        return [].concat(str);
    }
    return str;
};

exports.getShipping = function (total, shippingBool) {
    if (shippingBool) {
        return Math.max(
            (total * 0.1),
            10
        );
    }
    return 0;
};