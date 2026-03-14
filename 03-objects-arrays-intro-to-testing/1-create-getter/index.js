/**
 * createGetter - creates function getter which allows select value from object
 * @param {string} path - the strings path separated by dot
 * @returns {function} - function-getter which allow get value from object by set path
 */
export function createGetter(path) {
    return (obj) => {
        const keys = path.split('.');
        let res = obj;
        for (const key of keys) {
            if ( res === undefined || !Object.prototype.hasOwnProperty.call(res, key) ) return undefined;
            res = res[key];
        }
        return res;
    };
}