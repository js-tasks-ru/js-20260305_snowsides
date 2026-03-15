/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
    if ( string === undefined || (size === 0) ) return '';
    if ( size === undefined ) return string;
    const res = [];
    let count = 1,
        i = 0,
        len = string.length;
  
    while( i < len ){
      if ( string[i] === string[i-1] ) {
            count++;
        } else {
            count = 1;
        }
        if ( count <= size ) {
            res.push(string[i]);
        }
      i++;
    }
    return res.join('');
}

