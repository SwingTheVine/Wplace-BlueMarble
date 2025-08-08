

/** Sanitizes HTML to display as plain-text.
 * This prevents some Cross Site Scripting (XSS).
 * This is handy when you are displaying user-made data, and you *must* use innerHTML.
 * @param {string} text - The text to sanitize
 * @returns {string} HTML escaped string
 * @since 0.44.2
 * @example
 * const paragraph = document.createElement('p');
 * paragraph.innerHTML = escapeHTML('<u>Foobar.</u>');
 * // Output:
 * // (Does not include the paragraph element)
 * // (Output is not HTML formatted)
 * <p>
 *   "<u>Foobar.</u>"
 * </p>
 */
export function escapeHTML(text) {
  const div = document.createElement('div'); // Creates a div
  div.textContent = text; // Puts the text in a PLAIN-TEXT property
  return div.innerHTML; // Returns the HTML property of the div
}

/** Converts the server tile-pixel coordinate system to the displayed tile-pixel coordinate system.
 * @param {string[]} tile - The tile to convert (as an array like ["12", "124"])
 * @param {string[]} pixel - The pixel to convert (as an array like ["12", "124"])
 * @returns {number[]} [tile, pixel]
 * @since 0.42.4
 * @example
 * console.log(serverTPtoDisplayTP(['12', '123'], ['34', '567'])); // [34, 3567]
 */
export function serverTPtoDisplayTP(tile, pixel) {
  return [((parseInt(tile[0]) % 4) * 1000) + parseInt(pixel[0]), ((parseInt(tile[1]) % 4) * 1000) + parseInt(pixel[1])];
}

/** Negative-Safe Modulo. You can pass negative numbers into this.
 * @param {number} a - The first number
 * @param {number} b - The second number
 * @returns {number} Result
 * @author osuplace
 * @since 0.55.8
 */
export function negativeSafeModulo(a, b) {
  return (a % b + b) % b;
}

/** Bypasses terser's stripping of console function calls.
 * This is so the non-obfuscated code will contain debugging console calls, but the distributed version won't.
 * However, the distributed version needs to call the console somehow, so this wrapper function is how.
 * This is the same as `console.log()`.
 * @param {...any} args - Arguments to be passed into the `log()` function of the Console
 * @since 0.58.9
 */
export function consoleLog(...args) {((consoleLog) => consoleLog(...args))(console.log);}

/** Bypasses terser's stripping of console function calls.
 * This is so the non-obfuscated code will contain debugging console calls, but the distributed version won't.
 * However, the distributed version needs to call the console somehow, so this wrapper function is how.
 * This is the same as `console.error()`.
 * @param {...any} args - Arguments to be passed into the `error()` function of the Console
 * @since 0.58.13
 */
export function consoleError(...args) {((consoleError) => consoleError(...args))(console.error);}

/** Bypasses terser's stripping of console function calls.
 * This is so the non-obfuscated code will contain debugging console calls, but the distributed version won't.
 * However, the distributed version needs to call the console somehow, so this wrapper function is how.
 * This is the same as `console.warn()`.
 * @param {...any} args - Arguments to be passed into the `warn()` function of the Console
 * @since 0.58.13
 */
export function consoleWarn(...args) {((consoleWarn) => consoleWarn(...args))(console.warn);}

/** Encodes a number into a custom encoded string.
 * @param {number} number - The number to encode
 * @param {string} encoding - The characters to use when encoding
 * @since 0.65.2
 * @returns {string} Encoded string
 * @example
 * const encode = '012abcABC'; // Base 9
 * console.log(numberToEncoded(0, encode)); // 0
 * console.log(numberToEncoded(5, encode)); // c
 * console.log(numberToEncoded(15, encode)); // 1A
 * console.log(numberToEncoded(12345, encode)); // 1BCaA
 */
export function numberToEncoded(number, encoding) {

  if (number === 0) return encoding[0]; // End quickly if number equals 0. No special calculation needed

  let result = ''; // The encoded string
  const base = encoding.length; // The number of characters used, which determines the base

  // Base conversion algorithm
  while (number > 0) {
    result = encoding[number % base] + result; // Find's the character's encoded value determined by the modulo of the base
    number = Math.floor(number / base); // Divides the number by the base so the next iteration can find the next modulo character
  }

  return result; // The final encoded string
}

/** Converts a Uint8 array to base64 using the browser's built-in binary to ASCII function
 * @param {Uint8Array} uint8 - The Uint8Array to convert
 * @returns {Uint8Array} The base64 encoded Uint8Array
 * @since 0.72.9
 */
export function uint8ToBase64(uint8) {
  let binary = '';
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary); // Binary to ASCII
}

/** Decodes a base 64 encoded Uint8 array using the browser's built-in ASCII to binary function
 * @param {Uint8Array} base64 - The base 64 encoded Uint8Array to convert
 * @returns {Uint8Array} The decoded Uint8Array
 * @since 0.72.9
 */
export function base64ToUint8(base64) {
  const binary = atob(base64); // ASCII to Binary
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return array;
}

/** Returns the coordinate input fields
 * @returns {Element[]} The 4 coordinate Inputs
 * @since 0.74.0
 */
export function selectAllCoordinateInputs(document) {
  coords = [];

  coords.push(document.querySelector('#bm-input-tx'));
  coords.push(document.querySelector('#bm-input-ty'));
  coords.push(document.querySelector('#bm-input-px'));
  coords.push(document.querySelector('#bm-input-py'));

  return coords;
}