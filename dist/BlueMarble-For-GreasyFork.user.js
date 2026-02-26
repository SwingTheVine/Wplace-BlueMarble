// ==UserScript==
// @name            Blue Marble
// @name:en         Blue Marble
// @namespace       https://github.com/SwingTheVine/
// @version         0.88.471
// @description     A userscript to automate and/or enhance the user experience on Wplace.live. Make sure to comply with the site's Terms of Service, and rules! This script is not affiliated with Wplace.live in any way, use at your own risk. This script is not affiliated with TamperMonkey. The author of this userscript is not responsible for any damages, issues, loss of data, or punishment that may occur as a result of using this script. This script is provided "as is" under the MPL-2.0 license. The "Blue Marble" icon is licensed under CC0 1.0 Universal (CC0 1.0) Public Domain Dedication. The image is owned by NASA.
// @description:en  A userscript to automate and/or enhance the user experience on Wplace.live. Make sure to comply with the site's Terms of Service, and rules! This script is not affiliated with Wplace.live in any way, use at your own risk. This script is not affiliated with TamperMonkey. The author of this userscript is not responsible for any damages, issues, loss of data, or punishment that may occur as a result of using this script. This script is provided "as is" under the MPL-2.0 license. The "Blue Marble" icon is licensed under CC0 1.0 Universal (CC0 1.0) Public Domain Dedication. The image is owned by NASA.
// @author          SwingTheVine
// @license         MPL-2.0
// @supportURL      https://discord.gg/tpeBPy46hf
// @homepageURL     https://bluemarble.lol/
// @icon            https://raw.githubusercontent.com/SwingTheVine/Wplace-BlueMarble/0c760b903739e6214f7b8990ffc4089a93e73bd2/dist/assets/Favicon.png
// @updateURL       https://raw.githubusercontent.com/SwingTheVine/Wplace-BlueMarble/main/dist/BlueMarble-For-GreasyFork.user.js
// @downloadURL     https://raw.githubusercontent.com/SwingTheVine/Wplace-BlueMarble/main/dist/BlueMarble-For-GreasyFork.user.js
// @match           https://wplace.live/*
// @grant           GM_getResourceText
// @grant           GM_addStyle
// @grant           GM.setValue
// @grant           GM_getValue
// @grant           GM_xmlhttpRequest
// @connect         telemetry.thebluecorner.net
// @resource        CSS-BM-File https://raw.githubusercontent.com/SwingTheVine/Wplace-BlueMarble/0c760b903739e6214f7b8990ffc4089a93e73bd2/dist/BlueMarble-For-GreasyFork.user.css
// @antifeature     tracking Anonymous opt-in telemetry data
// @noframes
// ==/UserScript==

// Wplace  --> https://wplace.live
// License --> https://www.mozilla.org/en-US/MPL/2.0/
// Donate  --> https://ko-fi.com/swingthevine

(() => {
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

  // src/observers.js
  var Observers = class {
    /** The constructor for the observer class
     * @since 0.43.2
     */
    constructor() {
      this.observerBody = null;
      this.observerBodyTarget = null;
      this.targetDisplayCoords = "#bm-display-coords";
    }
    /** Creates the MutationObserver for document.body
     * @param {HTMLElement} target - Targeted element to watch
     * @returns {Observers} this (Observers class)
     * @since 0.43.2
     */
    createObserverBody(target) {
      this.observerBodyTarget = target;
      this.observerBody = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (!(node instanceof HTMLElement)) {
              continue;
            }
            if (node.matches?.(this.targetDisplayCoords)) {
            }
          }
        }
      });
      return this;
    }
    /** Retrieves the MutationObserver that watches document.body
     * @returns {MutationObserver}
     * @since 0.43.2
     */
    getObserverBody() {
      return this.observerBody;
    }
    /** Observe a MutationObserver
     * @param {MutationObserver} observer - The MutationObserver
     * @param {boolean} watchChildList - (Optional) Should childList be watched? False by default
     * @param {boolean} watchSubtree - (Optional) Should childList be watched? False by default
     * @since 0.43.2
     */
    observe(observer, watchChildList = false, watchSubtree = false) {
      observer.observe(this.observerBodyTarget, {
        childList: watchChildList,
        subtree: watchSubtree
      });
    }
  };

  // src/utils.js
  function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  function serverTPtoDisplayTP(tile, pixel) {
    return [parseInt(tile[0]) % 4 * 1e3 + parseInt(pixel[0]), parseInt(tile[1]) % 4 * 1e3 + parseInt(pixel[1])];
  }
  function consoleLog(...args) {
    ((consoleLog2) => consoleLog2(...args))(console.log);
  }
  function consoleError(...args) {
    ((consoleError2) => consoleError2(...args))(console.error);
  }
  function consoleWarn(...args) {
    ((consoleWarn2) => consoleWarn2(...args))(console.warn);
  }
  function numberToEncoded(number, encoding) {
    if (number === 0) return encoding[0];
    let result = "";
    const base = encoding.length;
    while (number > 0) {
      result = encoding[number % base] + result;
      number = Math.floor(number / base);
    }
    return result;
  }
  function encodedToNumber(encoded, encoding) {
    let decodedNumber = 0;
    const base = encoding.length;
    for (const character of encoded) {
      const decodedCharacter = encoding.indexOf(character);
      if (decodedCharacter == -1) {
        consoleError(`Invalid character '${character}' encountered whilst decoding! Is the decode alphabet/base incorrect?`);
      }
      decodedNumber = decodedNumber * base + decodedCharacter;
    }
    return decodedNumber;
  }
  function uint8ToBase64(uint8) {
    let binary = "";
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  }
  function base64ToUint8(base64) {
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return array;
  }
  async function getClipboardData(event = void 0) {
    let data = "";
    if (event) {
      data = event.clipboardData.getData("text/plain");
    }
    if (data.length != 0) {
      return data;
    }
    await navigator.clipboard.readText().then((text) => {
      data = text;
    }).catch((error) => {
      consoleLog(`Failed to retrieve clipboard data using navigator! Using fallback methods...`);
    });
    if (data.length != 0) {
      return data;
    }
    data = window.clipboardData?.getData("Text");
    return data;
  }
  function calculateRelativeLuminance(array) {
    const srgb = array.map((channel) => {
      channel /= 255;
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  }
  function colorpaletteForBlueMarble(tolerance) {
    const colorpaletteBM = colorpalette;
    colorpaletteBM.unshift({ "id": -1, "premium": false, "name": "Erased", "rgb": [222, 250, 206] });
    colorpaletteBM.unshift({ "id": -2, "premium": false, "name": "Other", "rgb": [0, 0, 0] });
    const lookupTable = /* @__PURE__ */ new Map();
    for (const color of colorpaletteBM) {
      if (color.id == 0 || color.id == -2) continue;
      const targetRed = color.rgb[0];
      const targetGreen = color.rgb[1];
      const targetBlue = color.rgb[2];
      for (let deltaRedRange = -tolerance; deltaRedRange <= tolerance; deltaRedRange++) {
        for (let deltaGreenRange = -tolerance; deltaGreenRange <= tolerance; deltaGreenRange++) {
          for (let deltaBlueRange = -tolerance; deltaBlueRange <= tolerance; deltaBlueRange++) {
            const derivativeRed = targetRed + deltaRedRange;
            const derivativeGreen = targetGreen + deltaGreenRange;
            const derivativeBlue = targetBlue + deltaBlueRange;
            if (derivativeRed < 0 || derivativeRed > 255 || derivativeGreen < 0 || derivativeGreen > 255 || derivativeBlue < 0 || derivativeBlue > 255) continue;
            const derivativeColor32 = (255 << 24 | derivativeBlue << 16 | derivativeGreen << 8 | derivativeRed) >>> 0;
            if (!lookupTable.has(derivativeColor32)) {
              lookupTable.set(derivativeColor32, color.id);
            }
          }
        }
      }
    }
    return { palette: colorpaletteBM, LUT: lookupTable };
  }
  var colorpalette = [
    { "id": 0, "premium": false, "name": "Transparent", "rgb": [0, 0, 0] },
    { "id": 1, "premium": false, "name": "Black", "rgb": [0, 0, 0] },
    { "id": 2, "premium": false, "name": "Dark Gray", "rgb": [60, 60, 60] },
    { "id": 3, "premium": false, "name": "Gray", "rgb": [120, 120, 120] },
    { "id": 4, "premium": false, "name": "Light Gray", "rgb": [210, 210, 210] },
    { "id": 5, "premium": false, "name": "White", "rgb": [255, 255, 255] },
    { "id": 6, "premium": false, "name": "Deep Red", "rgb": [96, 0, 24] },
    { "id": 7, "premium": false, "name": "Red", "rgb": [237, 28, 36] },
    { "id": 8, "premium": false, "name": "Orange", "rgb": [255, 127, 39] },
    { "id": 9, "premium": false, "name": "Gold", "rgb": [246, 170, 9] },
    { "id": 10, "premium": false, "name": "Yellow", "rgb": [249, 221, 59] },
    { "id": 11, "premium": false, "name": "Light Yellow", "rgb": [255, 250, 188] },
    { "id": 12, "premium": false, "name": "Dark Green", "rgb": [14, 185, 104] },
    { "id": 13, "premium": false, "name": "Green", "rgb": [19, 230, 123] },
    { "id": 14, "premium": false, "name": "Light Green", "rgb": [135, 255, 94] },
    { "id": 15, "premium": false, "name": "Dark Teal", "rgb": [12, 129, 110] },
    { "id": 16, "premium": false, "name": "Teal", "rgb": [16, 174, 166] },
    { "id": 17, "premium": false, "name": "Light Teal", "rgb": [19, 225, 190] },
    { "id": 18, "premium": false, "name": "Dark Blue", "rgb": [40, 80, 158] },
    { "id": 19, "premium": false, "name": "Blue", "rgb": [64, 147, 228] },
    { "id": 20, "premium": false, "name": "Cyan", "rgb": [96, 247, 242] },
    { "id": 21, "premium": false, "name": "Indigo", "rgb": [107, 80, 246] },
    { "id": 22, "premium": false, "name": "Light Indigo", "rgb": [153, 177, 251] },
    { "id": 23, "premium": false, "name": "Dark Purple", "rgb": [120, 12, 153] },
    { "id": 24, "premium": false, "name": "Purple", "rgb": [170, 56, 185] },
    { "id": 25, "premium": false, "name": "Light Purple", "rgb": [224, 159, 249] },
    { "id": 26, "premium": false, "name": "Dark Pink", "rgb": [203, 0, 122] },
    { "id": 27, "premium": false, "name": "Pink", "rgb": [236, 31, 128] },
    { "id": 28, "premium": false, "name": "Light Pink", "rgb": [243, 141, 169] },
    { "id": 29, "premium": false, "name": "Dark Brown", "rgb": [104, 70, 52] },
    { "id": 30, "premium": false, "name": "Brown", "rgb": [149, 104, 42] },
    { "id": 31, "premium": false, "name": "Beige", "rgb": [248, 178, 119] },
    { "id": 32, "premium": true, "name": "Medium Gray", "rgb": [170, 170, 170] },
    { "id": 33, "premium": true, "name": "Dark Red", "rgb": [165, 14, 30] },
    { "id": 34, "premium": true, "name": "Light Red", "rgb": [250, 128, 114] },
    { "id": 35, "premium": true, "name": "Dark Orange", "rgb": [228, 92, 26] },
    { "id": 36, "premium": true, "name": "Light Tan", "rgb": [214, 181, 148] },
    { "id": 37, "premium": true, "name": "Dark Goldenrod", "rgb": [156, 132, 49] },
    { "id": 38, "premium": true, "name": "Goldenrod", "rgb": [197, 173, 49] },
    { "id": 39, "premium": true, "name": "Light Goldenrod", "rgb": [232, 212, 95] },
    { "id": 40, "premium": true, "name": "Dark Olive", "rgb": [74, 107, 58] },
    { "id": 41, "premium": true, "name": "Olive", "rgb": [90, 148, 74] },
    { "id": 42, "premium": true, "name": "Light Olive", "rgb": [132, 197, 115] },
    { "id": 43, "premium": true, "name": "Dark Cyan", "rgb": [15, 121, 159] },
    { "id": 44, "premium": true, "name": "Light Cyan", "rgb": [187, 250, 242] },
    { "id": 45, "premium": true, "name": "Light Blue", "rgb": [125, 199, 255] },
    { "id": 46, "premium": true, "name": "Dark Indigo", "rgb": [77, 49, 184] },
    { "id": 47, "premium": true, "name": "Dark Slate Blue", "rgb": [74, 66, 132] },
    { "id": 48, "premium": true, "name": "Slate Blue", "rgb": [122, 113, 196] },
    { "id": 49, "premium": true, "name": "Light Slate Blue", "rgb": [181, 174, 241] },
    { "id": 50, "premium": true, "name": "Light Brown", "rgb": [219, 164, 99] },
    { "id": 51, "premium": true, "name": "Dark Beige", "rgb": [209, 128, 81] },
    { "id": 52, "premium": true, "name": "Light Beige", "rgb": [255, 197, 165] },
    { "id": 53, "premium": true, "name": "Dark Peach", "rgb": [155, 82, 73] },
    { "id": 54, "premium": true, "name": "Peach", "rgb": [209, 128, 120] },
    { "id": 55, "premium": true, "name": "Light Peach", "rgb": [250, 182, 164] },
    { "id": 56, "premium": true, "name": "Dark Tan", "rgb": [123, 99, 82] },
    { "id": 57, "premium": true, "name": "Tan", "rgb": [156, 132, 107] },
    { "id": 58, "premium": true, "name": "Dark Slate", "rgb": [51, 57, 65] },
    { "id": 59, "premium": true, "name": "Slate", "rgb": [109, 117, 141] },
    { "id": 60, "premium": true, "name": "Light Slate", "rgb": [179, 185, 209] },
    { "id": 61, "premium": true, "name": "Dark Stone", "rgb": [109, 100, 63] },
    { "id": 62, "premium": true, "name": "Stone", "rgb": [148, 140, 107] },
    { "id": 63, "premium": true, "name": "Light Stone", "rgb": [205, 197, 158] }
  ];

  // src/Template.js
  var _Template_instances, calculateTotalPixelsFromImageData_fn;
  var Template = class {
    /** The constructor for the {@link Template} class with enhanced pixel tracking.
     * @param {Object} [params={}] - Object containing all optional parameters
     * @param {string} [params.displayName='My template'] - The display name of the template
     * @param {number} [params.sortID=0] - The sort number of the template for rendering priority
     * @param {string} [params.authorID=''] - The user ID of the person who exported the template (prevents sort ID collisions)
     * @param {string} [params.url=''] - The URL to the source image
     * @param {File} [params.file=null] - The template file (pre-processed File or processed bitmap)
     * @param {Array<number>} [params.coords=null] - The coordinates of the top left corner as (tileX, tileY, pixelX, pixelY)
     * @param {Object} [params.chunked=null] - The affected chunks of the template, and their template for each chunk as a bitmap
     * @param {Object} [params.chunked32={}] - The affected chunks of the template, and their template for each chunk as a Uint32Array
     * @param {number} [params.tileSize=1000] - The size of a tile in pixels (assumes square tiles)
     * @param {Object} [params.pixelCount={total:0, colors:Map}] - Total number of pixels in the template (calculated automatically during processing)
     * @since 0.65.2
     */
    constructor({
      displayName = "My template",
      sortID = 0,
      authorID = "",
      url = "",
      file = null,
      coords: coords2 = null,
      chunked = null,
      chunked32 = {},
      tileSize = 1e3
    } = {}) {
      __privateAdd(this, _Template_instances);
      this.displayName = displayName;
      this.sortID = sortID;
      this.authorID = authorID;
      this.url = url;
      this.file = file;
      this.coords = coords2;
      this.chunked = chunked;
      this.chunked32 = chunked32;
      this.tileSize = tileSize;
      this.pixelCount = { total: 0, colors: /* @__PURE__ */ new Map() };
    }
    /** Creates chunks of the template for each tile.
     * @param {Number} tileSize - Size of the tile as determined by templateManager
     * @param {Object} paletteBM - An collection of Uint32Arrays containing the palette BM uses
     * @returns {Object} Collection of template bitmaps & buffers organized by tile coordinates
     * @since 0.65.4
     */
    async createTemplateTiles(tileSize, paletteBM) {
      console.log("Template coordinates:", this.coords);
      const shreadSize = 3;
      const bitmap = await createImageBitmap(this.file);
      const imageWidth = bitmap.width;
      const imageHeight = bitmap.height;
      this.tileSize = tileSize;
      const templateTiles = {};
      const templateTilesBuffers = {};
      const canvas = new OffscreenCanvas(this.tileSize, this.tileSize);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      canvas.width = imageWidth;
      canvas.height = imageHeight;
      context.imageSmoothingEnabled = false;
      context.drawImage(bitmap, 0, 0);
      let timer = Date.now();
      const totalPixelMap = __privateMethod(this, _Template_instances, calculateTotalPixelsFromImageData_fn).call(this, context.getImageData(0, 0, imageWidth, imageHeight), paletteBM);
      console.log(`Calculating total pixels took ${(Date.now() - timer) / 1e3} seconds`);
      let totalPixels = 0;
      const transparentColorID = 0;
      for (const [color, total] of totalPixelMap) {
        if (color == transparentColorID) {
          continue;
        }
        totalPixels += total;
      }
      this.pixelCount = { total: totalPixels, colors: totalPixelMap };
      timer = Date.now();
      const canvasMask = new OffscreenCanvas(3, 3);
      const contextMask = canvasMask.getContext("2d");
      contextMask.clearRect(0, 0, 3, 3);
      contextMask.fillStyle = "white";
      contextMask.fillRect(1, 1, 1, 1);
      for (let pixelY = this.coords[3]; pixelY < imageHeight + this.coords[3]; ) {
        const drawSizeY = Math.min(this.tileSize - pixelY % this.tileSize, imageHeight - (pixelY - this.coords[3]));
        console.log(`Math.min(${this.tileSize} - (${pixelY} % ${this.tileSize}), ${imageHeight} - (${pixelY - this.coords[3]}))`);
        for (let pixelX = this.coords[2]; pixelX < imageWidth + this.coords[2]; ) {
          console.log(`Pixel X: ${pixelX}
Pixel Y: ${pixelY}`);
          const drawSizeX = Math.min(this.tileSize - pixelX % this.tileSize, imageWidth - (pixelX - this.coords[2]));
          console.log(`Math.min(${this.tileSize} - (${pixelX} % ${this.tileSize}), ${imageWidth} - (${pixelX - this.coords[2]}))`);
          console.log(`Draw Size X: ${drawSizeX}
Draw Size Y: ${drawSizeY}`);
          const canvasWidth = drawSizeX * shreadSize;
          const canvasHeight = drawSizeY * shreadSize;
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          console.log(`Draw X: ${drawSizeX}
Draw Y: ${drawSizeY}
Canvas Width: ${canvasWidth}
Canvas Height: ${canvasHeight}`);
          context.imageSmoothingEnabled = false;
          console.log(`Getting X ${pixelX}-${pixelX + drawSizeX}
Getting Y ${pixelY}-${pixelY + drawSizeY}`);
          context.clearRect(0, 0, canvasWidth, canvasHeight);
          context.drawImage(
            bitmap,
            // Bitmap image to draw
            pixelX - this.coords[2],
            // Coordinate X to draw *from*
            pixelY - this.coords[3],
            // Coordinate Y to draw *from*
            drawSizeX,
            // X width to draw *from*
            drawSizeY,
            // Y height to draw *from*
            0,
            // Coordinate X to draw *at*
            0,
            // Coordinate Y to draw *at*
            drawSizeX * shreadSize,
            // X width to draw *at*
            drawSizeY * shreadSize
            // Y height to draw *at*
          );
          context.save();
          context.globalCompositeOperation = "destination-in";
          context.fillStyle = context.createPattern(canvasMask, "repeat");
          context.fillRect(0, 0, canvasWidth, canvasHeight);
          context.restore();
          const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
          console.log(`Shreaded pixels for ${pixelX}, ${pixelY}`, imageData);
          const templateTileName = `${(this.coords[0] + Math.floor(pixelX / 1e3)).toString().padStart(4, "0")},${(this.coords[1] + Math.floor(pixelY / 1e3)).toString().padStart(4, "0")},${(pixelX % 1e3).toString().padStart(3, "0")},${(pixelY % 1e3).toString().padStart(3, "0")}`;
          this.chunked32[templateTileName] = new Uint32Array(imageData.data.buffer);
          templateTiles[templateTileName] = await createImageBitmap(canvas);
          const canvasBlob = await canvas.convertToBlob();
          const canvasBuffer = await canvasBlob.arrayBuffer();
          const canvasBufferBytes = Array.from(new Uint8Array(canvasBuffer));
          templateTilesBuffers[templateTileName] = uint8ToBase64(canvasBufferBytes);
          console.log(templateTiles);
          pixelX += drawSizeX;
        }
        pixelY += drawSizeY;
      }
      console.log(`Parsing template took ${(Date.now() - timer) / 1e3} seconds`);
      console.log("Template Tiles: ", templateTiles);
      console.log("Template Tiles Buffers: ", templateTilesBuffers);
      console.log("Template Tiles Uint32Array: ", this.chunked32);
      return { templateTiles, templateTilesBuffers };
    }
  };
  _Template_instances = new WeakSet();
  /** Calculates the total pixels for each color for the image.
   * 
   * @param {ImageData} imageData - The pre-shreaded image "casted" onto a canvas
   * @param {Object} paletteBM - The palette Blue Marble uses for colors
   * @param {Number} paletteTolerance - How close an RGB color has to be in order to be considered a palette color. A tolerance of "3" means the sum of the RGB can be up to 3 away from the actual value.
   * @returns {Map<Number, Number>} A map where the key is the color ID, and the value is the total pixels for that color ID
   * @since 0.88.6
   */
  calculateTotalPixelsFromImageData_fn = function(imageData, paletteBM) {
    const buffer32Arr = new Uint32Array(imageData.data.buffer);
    const { palette: _, LUT: lookupTable } = paletteBM;
    const _colorpalette = /* @__PURE__ */ new Map();
    for (let pixelIndex = 0; pixelIndex < buffer32Arr.length; pixelIndex++) {
      const pixel = buffer32Arr[pixelIndex];
      let bestColorID = -2;
      if (pixel >>> 24 == 0) {
        bestColorID = 0;
      } else {
        bestColorID = lookupTable.get(pixel) ?? -2;
      }
      const colorIDcount = _colorpalette.get(bestColorID);
      _colorpalette.set(bestColorID, colorIDcount ? colorIDcount + 1 : 1);
    }
    console.log(_colorpalette);
    return _colorpalette;
  };

  // src/Overlay.js
  var _Overlay_instances, createElement_fn, applyAttribute_fn;
  var Overlay = class {
    /** Constructor for the Overlay class.
     * @param {string} name - The name of the userscript
     * @param {string} version - The version of the userscript
     * @since 0.0.2
     * @see {@link Overlay}
     */
    constructor(name2, version2) {
      __privateAdd(this, _Overlay_instances);
      this.name = name2;
      this.version = version2;
      this.apiManager = null;
      this.outputStatusId = "bm-output-status";
      this.overlay = null;
      this.currentParent = null;
      this.parentStack = [];
    }
    /** Populates the apiManager variable with the apiManager class.
     * @param {ApiManager} apiManager - The apiManager class instance
     * @since 0.41.4
     */
    setApiManager(apiManager2) {
      this.apiManager = apiManager2;
    }
    /** Finishes building an element.
     * Call this after you are finished adding children.
     * If the element will have no children, call it anyways.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.2
     * @example
     * overlay
     *   .addDiv()
     *     .addHeader(1).buildElement() // Breaks out of the <h1>
     *     .addP().buildElement() // Breaks out of the <p>
     *   .buildElement() // Breaks out of the <div>
     *   .addHr() // Since there are no more elements, calling buildElement() is optional
     * .buildOverlay(document.body);
     */
    buildElement() {
      if (this.parentStack.length > 0) {
        this.currentParent = this.parentStack.pop();
      }
      return this;
    }
    /** Finishes building the overlay and displays it.
     * Call this when you are done chaining methods.
     * @param {HTMLElement} parent - The parent HTMLElement this overlay should be appended to as a child.
     * @since 0.43.2
     * @example
     * overlay
     *   .addDiv()
     *     .addP().buildElement()
     *   .buildElement()
     * .buildOverlay(document.body); // Adds DOM structure to document body
     * // <div><p></p></div>
     */
    buildOverlay(parent) {
      parent?.appendChild(this.overlay);
      this.overlay = null;
      this.currentParent = null;
      this.parentStack = [];
    }
    /** Adds a `div` to the overlay.
     * This `div` element will have properties shared between all `div` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `div` that are NOT shared between all overlay `div` elements. These should be camelCase.
     * @param {function(Overlay, HTMLDivElement):void} [callback=()=>{}] - Additional JS modification to the `div`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.2
     * @example
     * // Assume all <div> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addDiv({'id': 'foo'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <div id="foo" class="bar"></div>
     * </body>
     */
    addDiv(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const div = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "div", properties, additionalProperties);
      callback(this, div);
      return this;
    }
    /** Adds a `p` to the overlay.
     * This `p` element will have properties shared between all `p` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `p` that are NOT shared between all overlay `p` elements. These should be camelCase.
     * @param {function(Overlay, HTMLParagraphElement):void} [callback=()=>{}] - Additional JS modification to the `p`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.2
     * @example
     * // Assume all <p> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addP({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <p id="foo" class="bar">Foobar.</p>
     * </body>
     */
    addP(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const p = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "p", properties, additionalProperties);
      callback(this, p);
      return this;
    }
    /** Adds a `small` to the overlay.
     * This `small` element will have properties shared between all `small` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `small` that are NOT shared between all overlay `small` elements. These should be camelCase.
     * @param {function(Overlay, HTMLElement):void} [callback=()=>{}] - Additional JS modification to the `small`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.55.8
     * @example
     * // Assume all <small> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addSmall({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <small id="foo" class="bar">Foobar.</small>
     * </body>
     */
    addSmall(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const small = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "small", properties, additionalProperties);
      callback(this, small);
      return this;
    }
    /** Adds a `span` to the overlay.
     * This `span` element will have properties shared between all `span` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `span` that are NOT shared between all overlay `span` elements. These should be camelCase.
     * @param {function(Overlay, HTMLSpanElement):void} [callback=()=>{}] - Additional JS modification to the `span`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.55.8
     * @example
     * // Assume all <span> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addSpan({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <span id="foo" class="bar">Foobar.</span>
     * </body>
     */
    addSpan(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const span = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "span", properties, additionalProperties);
      callback(this, span);
      return this;
    }
    /** Adds a `details` to the overlay.
     * This `details` element will have properties shared between all `details` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `details` that are NOT shared between all overlay `details` elements. These should be camelCase.
     * @param {function(Overlay, HTMLDetailsElement):void} [callback=()=>{}] - Additional JS modification to the `details`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.96
     * @example
     * // Assume all <details> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addDetails({'id': 'foo'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <details id="foo" class="bar"></details>
     * </body>
     */
    addDetails(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const details = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "details", properties, additionalProperties);
      callback(this, details);
      return this;
    }
    /** Adds a `summary` to the overlay.
     * This `summary` element will have properties shared between all `summary` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `summary` that are NOT shared between all overlay `summary` elements. These should be camelCase.
     * @param {function(Overlay, HTMLElement):void} [callback=()=>{}] - Additional JS modification to the `summary`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.96
     * @example
     * // Assume all <summary> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addSummary({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <summary id="foo" class="bar">Foobar.</summary>
     * </body>
     */
    addSummary(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const summary = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "summary", properties, additionalProperties);
      callback(this, summary);
      return this;
    }
    /** Adds a `img` to the overlay.
     * This `img` element will have properties shared between all `img` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `img` that are NOT shared between all overlay `img` elements. These should be camelCase.
     * @param {function(Overlay, HTMLImageElement):void} [callback=()=>{}] - Additional JS modification to the `img`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.2
     * @example
     * // Assume all <img> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addimg({'id': 'foo', 'src': './img.png'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <img id="foo" src="./img.png" class="bar">
     * </body>
     */
    addImg(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const img = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "img", properties, additionalProperties);
      callback(this, img);
      return this;
    }
    /** Adds a header to the overlay.
     * This header element will have properties shared between all header elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {number} level - The header level. Must be between 1 and 6 (inclusive)
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the header that are NOT shared between all overlay header elements. These should be camelCase.
     * @param {function(Overlay, HTMLHeadingElement):void} [callback=()=>{}] - Additional JS modification to the header.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.7
     * @example
     * // Assume all header elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addHeader(6, {'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <h6 id="foo" class="bar">Foobar.</h6>
     * </body>
     */
    addHeader(level, additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const header = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "h" + level, properties, additionalProperties);
      callback(this, header);
      return this;
    }
    /** Adds a `hr` to the overlay.
     * This `hr` element will have properties shared between all `hr` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `hr` that are NOT shared between all overlay `hr` elements. These should be camelCase.
     * @param {function(Overlay, HTMLHRElement):void} [callback=()=>{}] - Additional JS modification to the `hr`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.7
     * @example
     * // Assume all <hr> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addhr({'id': 'foo'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <hr id="foo" class="bar">
     * </body>
     */
    addHr(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const hr = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "hr", properties, additionalProperties);
      callback(this, hr);
      return this;
    }
    /** Adds a `br` to the overlay.
     * This `br` element will have properties shared between all `br` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `br` that are NOT shared between all overlay `br` elements. These should be camelCase.
     * @param {function(Overlay, HTMLBRElement):void} [callback=()=>{}] - Additional JS modification to the `br`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.11
     * @example
     * // Assume all <br> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addbr({'id': 'foo'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <br id="foo" class="bar">
     * </body>
     */
    addBr(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const br = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "br", properties, additionalProperties);
      callback(this, br);
      return this;
    }
    /** Adds a `form` to the overlay.
     * This `form` element will have properties shared between all `form` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `form` that are NOT shared between all overlay `form` elements. These should be camelCase.
     * @param {function(Overlay, HTMLFormElement):void} [callback=()=>{}] - Additional JS modification to the `form`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.246
     * @example
     * // Assume all <form> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addForm({'id': 'foo'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <form id="foo" class="bar"></form>
     * </body>
     */
    addForm(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const form = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "form", properties, additionalProperties);
      callback(this, form);
      return this;
    }
    /** Adds a `fieldset` to the overlay.
     * This `fieldset` element will have properties shared between all `fieldset` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `fieldset` that are NOT shared between all overlay `fieldset` elements. These should be camelCase.
     * @param {function(Overlay, HTMLFieldSetElement):void} [callback=()=>{}] - Additional JS modification to the `fieldset`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.246
     * @example
     * // Assume all <fieldset> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addFieldset({'id': 'foo'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <fieldset id="foo" class="bar"></fieldset>
     * </body>
     */
    addFieldset(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const fieldset = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "fieldset", properties, additionalProperties);
      callback(this, fieldset);
      return this;
    }
    /** Adds a `legend` to the overlay.
     * This `legend` element will have properties shared between all `legend` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `legend` that are NOT shared between all overlay `legend` elements. These should be camelCase.
     * @param {function(Overlay, HTMLLegendElement):void} [callback=()=>{}] - Additional JS modification to the `legend`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.246
     * @example
     * // Assume all <legend> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addLegend({'id': 'foo', textContent: 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <legend id="foo" class="bar">
     *     "Foobar."
     *   </legend>
     * </body>
     */
    addLegend(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const legend = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "legend", properties, additionalProperties);
      callback(this, legend);
      return this;
    }
    /** Adds a checkbox to the overlay.
     * This checkbox element will have properties shared between all checkbox elements in the overlay.
     * You can override the shared properties by using a callback. Note: the checkbox element is inside a label element.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the checkbox that are NOT shared between all overlay checkbox elements. These should be camelCase.
     * @param {function(Overlay, HTMLLabelElement, HTMLInputElement):void} [callback=()=>{}] - Additional JS modification to the checkbox.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.10
     * @example
     * // Assume all checkbox elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addCheckbox({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <label>
     *     <input type="checkbox" id="foo" class="bar">
     *     "Foobar."
     *   </label>
     * </body>
     */
    addCheckbox(additionalProperties = {}, callback = () => {
    }) {
      const properties = { "type": "checkbox" };
      const label = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "label", { "textContent": additionalProperties["textContent"] ?? "" });
      delete additionalProperties["textContent"];
      const checkbox = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "input", properties, additionalProperties);
      label.insertBefore(checkbox, label.firstChild);
      this.buildElement();
      callback(this, label, checkbox);
      return this;
    }
    /** Adds a label & select element to the overlay.
     * This select element will have properties shared between all select elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the checkbox that are NOT shared between all overlay select elements. These should be camelCase.
     * @param {function(Overlay, HTMLLabelElement, HTMLSelectElement):void} [callback=()=>{}] - Additional JS modification to the label/select elements.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.243
     * @example
     * // Assume all select elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addSelect({'id': 'foo', 'textContent': 'Foobar: '}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <label for="foo">
     *     "Foobar: "
     *   </label>
     *   <select id="foo" class="bar"></select>
     * </body>
     */
    addSelect(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const label = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "label", { "textContent": additionalProperties["textContent"] ?? "", "for": additionalProperties["id"] ?? "" });
      delete additionalProperties["textContent"];
      this.buildElement();
      const select = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "select", properties, additionalProperties);
      callback(this, label, select);
      return this;
    }
    /** Adds an option to the overlay.
     * This `option` element will have properties shared between all `option` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `option` that are NOT shared between all overlay `option` elements. These should be camelCase.
     * @param {function(Overlay, HTMLOptionElement):void} [callback=()=>{}] - Additional JS modification to the `option`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.244
     * @example
     * // Assume all <option> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addOption({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <option id="foo" class="bar">Foobar.</option>
     * </body>
     */
    addOption(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const option = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "option", properties, additionalProperties);
      callback(this, option);
      return this;
    }
    /** Adds an ordered list to the overlay.
     * This `ol` element will have properties shared between all `ol` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `ol` that are NOT shared between all overlay `ol` elements. These should be camelCase.
     * @param {function(Overlay, HTMLOListElement):void} [callback=()=>{}] - Additional JS modification to the `ol`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <ol> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addOl({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <ol id="foo" class="bar">Foobar.</ol>
     * </body>
     */
    addOl(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const ol = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "ol", properties, additionalProperties);
      callback(this, ol);
      return this;
    }
    /** Adds an unordered list to the overlay.
     * This `ul` element will have properties shared between all `ul` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `ul` that are NOT shared between all overlay `ul` elements. These should be camelCase.
     * @param {function(Overlay, HTMLUListElement):void} [callback=()=>{}] - Additional JS modification to the `ul`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <ul> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addUl({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <ul id="foo" class="bar">Foobar.</ul>
     * </body>
     */
    addUl(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const ul = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "ul", properties, additionalProperties);
      callback(this, ul);
      return this;
    }
    /** Adds a `menu` to the overlay.
     * This `menu` element will have properties shared between all `menu` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `menu` that are NOT shared between all overlay `menu` elements. These should be camelCase.
     * @param {function(Overlay, HTMLMenuElement):void} [callback=()=>{}] - Additional JS modification to the `menu`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <menu> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addMenu({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <menu id="foo" class="bar">Foobar.</menu>
     * </body>
     */
    addMenu(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const menu = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "menu", properties, additionalProperties);
      callback(this, menu);
      return this;
    }
    /** Adds a list item to the overlay.
     * This `li` element will have properties shared between all `li` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `li` that are NOT shared between all overlay `li` elements. These should be camelCase.
     * @param {function(Overlay, HTMLLIElement):void} [callback=()=>{}] - Additional JS modification to the `li`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <li> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addLi({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <li id="foo" class="bar">Foobar.</li>
     * </body>
     */
    addLi(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const li = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "li", properties, additionalProperties);
      callback(this, li);
      return this;
    }
    /** Adds a table to the overlay.
     * This `table` element will have properties shared between all `table` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `table` that are NOT shared between all overlay `table` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTableElement):void} [callback=()=>{}] - Additional JS modification to the `table`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <table> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addTable({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <table id="foo" class="bar">Foobar.</table>
     * </body>
     */
    addTable(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const table = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "table", properties, additionalProperties);
      callback(this, table);
      return this;
    }
    /** Adds a table caption to the overlay.
     * This `caption` element will have properties shared between all `caption` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `caption` that are NOT shared between all overlay `caption` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTableCaptionElement):void} [callback=()=>{}] - Additional JS modification to the `caption`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <caption> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addCaption({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <caption id="foo" class="bar">Foobar.</caption>
     * </body>
     */
    addCaption(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const caption = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "caption", properties, additionalProperties);
      callback(this, caption);
      return this;
    }
    /** Adds a table header to the overlay.
     * This `thead` element will have properties shared between all `thead` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `thead` that are NOT shared between all overlay `thead` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTableSectionElement):void} [callback=()=>{}] - Additional JS modification to the `thead`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <thead> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addThead({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <thead id="foo" class="bar">Foobar.</thead>
     * </body>
     */
    addThead(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const thead = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "thead", properties, additionalProperties);
      callback(this, thead);
      return this;
    }
    /** Adds a table body to the overlay.
     * This `tbody` element will have properties shared between all `tbody` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `tbody` that are NOT shared between all overlay `tbody` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTableSectionElement):void} [callback=()=>{}] - Additional JS modification to the `tbody`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <tbody> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addTbody({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <tbody id="foo" class="bar">Foobar.</tbody>
     * </body>
     */
    addTbody(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const tbody = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "tbody", properties, additionalProperties);
      callback(this, tbody);
      return this;
    }
    /** Adds a table footer to the overlay.
     * This `tfoot` element will have properties shared between all `tfoot` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `tfoot` that are NOT shared between all overlay `tfoot` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTableSectionElement):void} [callback=()=>{}] - Additional JS modification to the `tfoot`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <tfoot> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addTfoot({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <tfoot id="foo" class="bar">Foobar.</tfoot>
     * </body>
     */
    addTfoot(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const tfoot = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "tfoot", properties, additionalProperties);
      callback(this, tfoot);
      return this;
    }
    /** Adds a table row to the overlay.
     * This `tr` element will have properties shared between all `tr` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `tr` that are NOT shared between all overlay `tr` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTableRowElement):void} [callback=()=>{}] - Additional JS modification to the `tr`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <tr> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addTr({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <tr id="foo" class="bar">Foobar.</tr>
     * </body>
     */
    addTr(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const tr = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "tr", properties, additionalProperties);
      callback(this, tr);
      return this;
    }
    /** Adds a table header (label) cell to the overlay.
     * This `th` element will have properties shared between all `th` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `th` that are NOT shared between all overlay `th` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTableCellElement):void} [callback=()=>{}] - Additional JS modification to the `th`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <th> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addTh({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <th id="foo" class="bar">Foobar.</th>
     * </body>
     */
    addTh(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const th = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "th", properties, additionalProperties);
      callback(this, th);
      return this;
    }
    /** Adds a table data cell to the overlay.
     * This `td` element will have properties shared between all `td` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `td` that are NOT shared between all overlay `td` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTableCellElement):void} [callback=()=>{}] - Additional JS modification to the `td`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <td> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addTd({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <td id="foo" class="bar">Foobar.</td>
     * </body>
     */
    addTd(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const td = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "td", properties, additionalProperties);
      callback(this, td);
      return this;
    }
    /** Adds a `button` to the overlay.
     * This `button` element will have properties shared between all `button` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `button` that are NOT shared between all overlay `button` elements. These should be camelCase.
     * @param {function(Overlay, HTMLButtonElement):void} [callback=()=>{}] - Additional JS modification to the `button`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.12
     * @example
     * // Assume all <button> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addButton({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <button id="foo" class="bar">Foobar.</button>
     * </body>
     */
    addButton(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const button = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "button", properties, additionalProperties);
      callback(this, button);
      return this;
    }
    /** Adds a help button to the overlay. It will have a "?" icon unless overridden in callback.
     * On click, the button will attempt to output the title to the output element (ID defined in Overlay constructor).
     * This `button` element will have properties shared between all `button` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `button` that are NOT shared between all overlay `button` elements. These should be camelCase.
     * @param {function(Overlay, HTMLButtonElement):void} [callback=()=>{}] - Additional JS modification to the `button`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.12
     * @example
     * // Assume all help button elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addButtonHelp({'id': 'foo', 'title': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <button id="foo" class="bar" title="Help: Foobar.">?</button>
     * </body>
     * @example
     * // Assume all help button elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addButtonHelp({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <button id="foo" class="bar" title="Help: Foobar.">?</button>
     * </body>
     */
    addButtonHelp(additionalProperties = {}, callback = () => {
    }) {
      const tooltip = additionalProperties["title"] ?? additionalProperties["textContent"] ?? "Help: No info";
      delete additionalProperties["textContent"];
      additionalProperties["title"] = `Help: ${tooltip}`;
      const properties = {
        "textContent": "?",
        "className": "bm-help",
        "onclick": () => {
          this.updateInnerHTML(this.outputStatusId, tooltip);
        }
      };
      const help = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "button", properties, additionalProperties);
      callback(this, help);
      return this;
    }
    /** Adds a `input` to the overlay.
     * This `input` element will have properties shared between all `input` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `input` that are NOT shared between all overlay `input` elements. These should be camelCase.
     * @param {function(Overlay, HTMLInputElement):void} [callback=()=>{}] - Additional JS modification to the `input`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.13
     * @example
     * // Assume all <input> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addInput({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <input id="foo" class="bar">Foobar.</input>
     * </body>
     */
    addInput(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const input = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "input", properties, additionalProperties);
      callback(this, input);
      return this;
    }
    /** Adds a file input to the overlay with enhanced visibility controls.
     * This input element will have properties shared between all file input elements in the overlay.
     * Uses multiple hiding methods to prevent browser native text from appearing during minimize/maximize.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the file input that are NOT shared between all overlay file input elements. These should be camelCase.
     * @param {function(Overlay, HTMLDivElement, HTMLInputElement, HTMLButtonElement):void} [callback=()=>{}] - Additional JS modification to the file input.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.17
     * @example
     * // Assume all file input elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addInputFile({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <div>
     *     <input type="file" id="foo" class="bar" style="display: none"></input>
     *     <button>Foobar.</button>
     *   </div>
     * </body>
     */
    addInputFile(additionalProperties = {}, callback = () => {
    }) {
      const properties = {
        "type": "file",
        "tabindex": "-1",
        "aria-hidden": "true"
      };
      const text = additionalProperties["textContent"] ?? "";
      delete additionalProperties["textContent"];
      const container = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "div");
      const input = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "input", properties, additionalProperties);
      this.buildElement();
      const button = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "button", { "textContent": text });
      this.buildElement();
      this.buildElement();
      button.addEventListener("click", () => {
        input.click();
      });
      input.addEventListener("change", () => {
        button.style.maxWidth = `${button.offsetWidth}px`;
        if (input.files.length > 0) {
          button.textContent = input.files[0].name;
        } else {
          button.textContent = text;
        }
      });
      callback(this, container, input, button);
      return this;
    }
    /** Adds a `textarea` to the overlay.
     * This `textarea` element will have properties shared between all `textarea` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `textarea` that are NOT shared between all overlay `textarea` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTextAreaElement):void} [callback=()=>{}] - Additional JS modification to the `textarea`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.13
     * @example
     * // Assume all <textarea> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addTextarea({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <textarea id="foo" class="bar">Foobar.</textarea>
     * </body>
     */
    addTextarea(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const textarea = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "textarea", properties, additionalProperties);
      callback(this, textarea);
      return this;
    }
    /** Adds a dragbar `div` element to the overlay.
     * This dragbar element will have properties shared between all dragbar elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the dragbar that are NOT shared between all overlay dragbars. These should be camelCase.
     * @param {function(Overlay, HTMLDivElement):void} [callback=()=>{}] - Additional JS modification to the dragbar.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.145
     * @example
     * // Assume all dragbar elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addDragbar({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <div id="foo" class="bar">Foobar.</div>
     * </body>
     */
    addDragbar(additionalProperties = {}, callback = () => {
    }) {
      const properties = {
        "class": "bm-dragbar"
      };
      const dragbar = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "div", properties, additionalProperties);
      callback(this, dragbar);
      return this;
    }
    /** Adds a timer `time` element to the overlay.
     * This timer will countdown until it reaches the end date that was passed in.
     * Additionally, you can update the end date by changing the endDate dataset attribute on the element.
     * This timer will have properties shared between all timers in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Date} [endDate=Date.now()] - The time to count down to.
     * @param {number} [updateInterval=500] - The time in milliseconds to update the display of the timer. Default is 500 milliseconds.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the timer that are NOT shared between all overlay timers. These should be camelCase.
     * @param {function(Overlay, HTMLTimeElement):void} [callback=()=>{}] - Additional JS modification to the timer.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.313
     * @example
     * // Assume all timers have a shared class (e.g. {'className': 'bar'})
     * overlay.addTimer(Date.now() + 2211632704000, 500, {'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <time id="bm-timer-dh8fhw80" class="bar" datetime="PT27H34M56S" data-end-date="1771749296000">27:34:56</div>
     * </body>
     */
    addTimer(endDate = Date.now(), updateInterval = 500, additionalProperties = {}, callback = () => {
    }) {
      const timerClass = "bm-timer";
      const timerID = additionalProperties?.["id"] || timerClass + "-" + crypto.randomUUID().slice(0, 8);
      const properties = {
        "class": timerClass
      };
      const timer = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "time", properties, additionalProperties);
      timer.id = timerID;
      timer.dataset["endDate"] = endDate;
      setInterval(() => {
        if (!timer.isConnected) {
          return;
        }
        const timeRemainingTotalMs = Math.max(timer.dataset["endDate"] - Date.now(), 0);
        const timeRemainingTotalSec = Math.floor(timeRemainingTotalMs / 1e3);
        const timeRemainingTotalHr = Math.floor(timeRemainingTotalSec / 3600);
        const timeRemainingOnlySec = Math.floor(timeRemainingTotalSec % 60);
        const timeRemainingOnlyMin = Math.floor(timeRemainingTotalSec % 3600 / 60);
        timer.setAttribute("datetime", `PT${timeRemainingTotalHr}H${timeRemainingOnlyMin}M${timeRemainingOnlySec}S`);
        timer.textContent = String(timeRemainingTotalHr).padStart(2, "0") + ":" + String(timeRemainingOnlyMin).padStart(2, "0") + ":" + String(timeRemainingOnlySec).padStart(2, "0");
      }, updateInterval);
      callback(this, timer);
      return this;
    }
    /** Updates the inner HTML of the element.
     * The element is discovered by it's id.
     * If the element is an `input`, it will modify the value attribute instead.
     * @param {string} id - The ID of the element to change
     * @param {string} html - The HTML/text to update with
     * @param {boolean} [doSafe] - (Optional) Should `textContent` be used instead of `innerHTML` to avoid XSS? False by default
     * @since 0.24.2
     */
    updateInnerHTML(id, html, doSafe = false) {
      const element = document.getElementById(id.replace(/^#/, ""));
      if (!element) {
        return;
      }
      if (element instanceof HTMLInputElement) {
        element.value = html;
        return;
      }
      if (doSafe) {
        element.textContent = html;
      } else {
        element.innerHTML = html;
      }
    }
    /** Handles the minimization logic for windows spawned by Blue Marble
     * @param {HTMLButtonElement} button - The UI button that triggered this minimization event
     * @since 0.88.142
    */
    handleMinimization(button) {
      if (button.disabled) {
        return;
      }
      button.disabled = true;
      button.style.textDecoration = "none";
      const window2 = button.closest(".bm-window");
      const dragbar = button.closest(".bm-dragbar");
      const header = window2.querySelector("h1");
      const windowContent = window2.querySelector(".bm-window-content");
      if (button.dataset["buttonStatus"] == "expanded") {
        windowContent.style.height = windowContent.scrollHeight + "px";
        window2.style.width = window2.scrollWidth + "px";
        windowContent.style.height = "0";
        windowContent.addEventListener("transitionend", function handler() {
          windowContent.style.display = "none";
          button.disabled = false;
          button.style.textDecoration = "";
          windowContent.removeEventListener("transitionend", handler);
        });
        const dragbarHeader1 = header.cloneNode(true);
        const dragbarHeader1Text = dragbarHeader1.textContent;
        button.nextElementSibling.appendChild(dragbarHeader1);
        button.textContent = "\u25B6";
        button.dataset["buttonStatus"] = "collapsed";
        button.ariaLabel = `Unminimize window "${dragbarHeader1Text}"`;
      } else {
        const dragbarHeader1 = dragbar.querySelector("h1");
        const dragbarHeader1Text = dragbarHeader1.textContent;
        dragbarHeader1.remove();
        windowContent.style.display = "";
        windowContent.style.height = "0";
        window2.style.width = "";
        windowContent.style.height = windowContent.scrollHeight + "px";
        windowContent.addEventListener("transitionend", function handler() {
          windowContent.style.height = "";
          button.disabled = false;
          button.style.textDecoration = "";
          windowContent.removeEventListener("transitionend", handler);
        });
        button.textContent = "\u25BC";
        button.dataset["buttonStatus"] = "expanded";
        button.ariaLabel = `Minimize window "${dragbarHeader1Text}"`;
      }
    }
    /** Handles dragging of the overlay.
     * Uses requestAnimationFrame for smooth animations and GPU-accelerated transforms.
     * Make sure to use the appropriate CSS selectors.
     * @param {string} moveMe - The element to be moved
     * @param {string} iMoveThings - The drag handle element
     * @since 0.8.2
    */
    handleDrag(moveMe, iMoveThings) {
      moveMe = document.querySelector(moveMe);
      iMoveThings = document.querySelector(iMoveThings);
      if (!moveMe || !iMoveThings) {
        this.handleDisplayError(`Can not drag! ${!moveMe ? "moveMe" : ""} ${!moveMe && !iMoveThings ? "and " : ""}${!iMoveThings ? "iMoveThings " : ""}was not found!`);
        return;
      }
      let isDragging = false;
      let offsetX, offsetY = 0;
      let animationFrame = null;
      let currentX = 0;
      let currentY = 0;
      let targetX = 0;
      let targetY = 0;
      let initialRect = null;
      const updatePosition = () => {
        if (isDragging) {
          const deltaX = Math.abs(currentX - targetX);
          const deltaY = Math.abs(currentY - targetY);
          if (deltaX > 0.5 || deltaY > 0.5) {
            currentX = targetX;
            currentY = targetY;
            moveMe.style.transform = `translate(${currentX}px, ${currentY}px)`;
            moveMe.style.left = "0px";
            moveMe.style.top = "0px";
            moveMe.style.right = "";
          }
          animationFrame = requestAnimationFrame(updatePosition);
        }
      };
      const startDrag = (clientX, clientY) => {
        isDragging = true;
        initialRect = moveMe.getBoundingClientRect();
        offsetX = clientX - initialRect.left;
        offsetY = clientY - initialRect.top;
        const computedStyle = window.getComputedStyle(moveMe);
        const transform = computedStyle.transform;
        if (transform && transform !== "none") {
          const matrix = new DOMMatrix(transform);
          currentX = matrix.m41;
          currentY = matrix.m42;
        } else {
          currentX = initialRect.left;
          currentY = initialRect.top;
        }
        targetX = currentX;
        targetY = currentY;
        document.body.style.userSelect = "none";
        iMoveThings.classList.add("bm-dragging");
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("touchmove", onTouchMove, { passive: false });
        document.addEventListener("mouseup", endDrag);
        document.addEventListener("touchend", endDrag);
        document.addEventListener("touchcancel", endDrag);
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
        updatePosition();
      };
      const endDrag = () => {
        isDragging = false;
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
        document.body.style.userSelect = "";
        iMoveThings.classList.remove("bm-dragging");
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("mouseup", endDrag);
        document.removeEventListener("touchend", endDrag);
        document.removeEventListener("touchcancel", endDrag);
      };
      const onMouseMove = (event) => {
        if (isDragging && initialRect) {
          targetX = event.clientX - offsetX;
          targetY = event.clientY - offsetY;
        }
      };
      const onTouchMove = (event) => {
        if (isDragging && initialRect) {
          const touch = event.touches[0];
          if (!touch) return;
          targetX = touch.clientX - offsetX;
          targetY = touch.clientY - offsetY;
          event.preventDefault();
        }
      };
      iMoveThings.addEventListener("mousedown", function(event) {
        event.preventDefault();
        startDrag(event.clientX, event.clientY);
      });
      iMoveThings.addEventListener("touchstart", function(event) {
        const touch = event?.touches?.[0];
        if (!touch) {
          return;
        }
        startDrag(touch.clientX, touch.clientY);
        event.preventDefault();
      }, { passive: false });
    }
    /** Handles status display.
     * This will output plain text into the output Status box.
     * Additionally, this will output an info message to the console.
     * @param {string} text - The status text to display.
     * @since 0.58.4
     */
    handleDisplayStatus(text) {
      const consoleInfo = console.info;
      consoleInfo(`${this.name}: ${text}`);
      this.updateInnerHTML(this.outputStatusId, "Status: " + text, true);
    }
    /** Handles error display.
     * This will output plain text into the output Status box.
     * Additionally, this will output an error to the console.
     * @param {string} text - The error text to display.
     * @since 0.41.6
     */
    handleDisplayError(text) {
      const consoleError2 = console.error;
      consoleError2(`${this.name}: ${text}`);
      this.updateInnerHTML(this.outputStatusId, "Error: " + text, true);
    }
  };
  _Overlay_instances = new WeakSet();
  /** Creates an element.
   * For **internal use** of the {@link Overlay} class.
   * @param {string} tag - The tag name as a string.
   * @param {Object.<string, any>} [properties={}] - The DOM properties of the element.
   * @returns {HTMLElement} HTML Element
   * @since 0.43.2
   */
  createElement_fn = function(tag, properties = {}, additionalProperties = {}) {
    const element = document.createElement(tag);
    if (!this.overlay) {
      this.overlay = element;
      this.currentParent = element;
    } else {
      this.currentParent?.appendChild(element);
      this.parentStack.push(this.currentParent);
      this.currentParent = element;
    }
    for (const [property, value] of Object.entries(properties)) {
      __privateMethod(this, _Overlay_instances, applyAttribute_fn).call(this, element, property, value);
    }
    for (const [property, value] of Object.entries(additionalProperties)) {
      __privateMethod(this, _Overlay_instances, applyAttribute_fn).call(this, element, property, value);
    }
    return element;
  };
  /** Applies an attribute to an element
   * @param {HTMLElement} element - The element to apply the attribute to
   * @param {String} property - The name of the attribute to apply
   * @param {String} value - The value of the attribute
   * @since 0.88.136
   */
  applyAttribute_fn = function(element, property, value) {
    if (property == "class") {
      element.classList.add(...value.split(/\s+/));
    } else if (property == "for") {
      element.htmlFor = value;
    } else if (property == "tabindex") {
      element.tabIndex = Number(value);
    } else if (property == "readonly") {
      element.readOnly = value == "true" || value == "1";
    } else if (property == "maxlength") {
      element.maxLength = Number(value);
    } else if (property.startsWith("data")) {
      element.dataset[property.slice(5).split("-").map(
        (part, i) => i == 0 ? part : part[0].toUpperCase() + part.slice(1)
      ).join("")] = value;
    } else if (property.startsWith("aria")) {
      const camelCase = property.slice(5).split("-").map(
        (part, i) => i == 0 ? part : part[0].toUpperCase() + part.slice(1)
      ).join("");
      element["aria" + camelCase[0].toUpperCase() + camelCase.slice(1)] = value;
    } else {
      element[property] = value;
    }
  };

  // src/WindowWizard.js
  var _WindowWizard_instances, displaySchemaHealth_fn, displayTemplateList_fn;
  var WindowWizard = class extends Overlay {
    /** Constructor for the Template Wizard window
     * @param {string} name - The name of the userscript
     * @param {string} version - The version of the userscript
     * @param {string} schemaVersionBleedingEdge - The bleeding edge of schema versions for Blue Marble
     * @param {string} encodingBase - The encoding base typically used by Blue Marble for encoding numbers
     * @since 0.88.434
     * @see {@link Overlay#constructor} for examples
     */
    constructor(name2, version2, schemaVersionBleedingEdge, encodingBase) {
      super(name2, version2);
      __privateAdd(this, _WindowWizard_instances);
      this.window = null;
      this.windowID = "bm-window-wizard";
      this.windowParent = document.body;
      this.currentJSON = JSON.parse(GM_getValue("bmTemplates", "{}"));
      this.scriptVersion = this.currentJSON?.scriptVersion;
      this.schemaVersion = this.currentJSON?.schemaVersion;
      this.schemaHealth = void 0;
      this.schemaVersionBleedingEdge = schemaVersionBleedingEdge;
      this.encodingBase = encodingBase;
    }
    /** Spawns a Template Wizard window.
     * If another template wizard window already exists, we DON'T spawn another!
     * Parent/child relationships in the DOM structure below are indicated by indentation.
     * @since 0.88.434
     */
    buildWindow() {
      if (document.querySelector(`#${this.windowID}`)) {
        this.handleDisplayError("Template Wizard window already exists!");
        return;
      }
      this.window = this.addDiv({ "id": this.windowID, "class": "bm-window", "style": "z-index: 9001;" }).addDragbar().addButton({ "class": "bm-button-circle", "textContent": "\u25BC", "aria-label": 'Minimize window "Template Wizard"', "data-button-status": "expanded" }, (instance, button) => {
        button.onclick = () => instance.handleMinimization(button);
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().addDiv().buildElement().addButton({ "class": "bm-button-circle", "textContent": "\u{1F7AA}", "aria-label": 'Close window "Template Wizard"' }, (instance, button) => {
        button.onclick = () => {
          document.querySelector(`#${this.windowID}`)?.remove();
        };
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().buildElement().addDiv({ "class": "bm-window-content" }).addDiv({ "class": "bm-container bm-center-vertically" }).addHeader(1, { "textContent": "Template Wizard" }).buildElement().buildElement().addHr().buildElement().addDiv({ "class": "bm-container" }).addHeader(2, { "textContent": "Status" }).buildElement().addP({ "id": "bm-wizard-status", "textContent": "Loading template storage status..." }).buildElement().buildElement().addDiv({ "class": "bm-container bm-scrollable" }).addHeader(2, { "textContent": "Detected templates:" }).buildElement().buildElement().buildElement().buildElement().buildOverlay(this.windowParent);
      this.handleDrag(`#${this.windowID}.bm-window`, `#${this.windowID} .bm-dragbar`);
      __privateMethod(this, _WindowWizard_instances, displaySchemaHealth_fn).call(this);
      __privateMethod(this, _WindowWizard_instances, displayTemplateList_fn).call(this);
    }
  };
  _WindowWizard_instances = new WeakSet();
  /** Determines how "healthy" the template storage is.
   * @since 0.88.436
   */
  displaySchemaHealth_fn = function() {
    const schemaVersionArray = this.schemaVersion.split(/[-\.\+]/);
    const schemaVersionBleedingEdgeArray = this.schemaVersionBleedingEdge.split(/[-\.\+]/);
    let schemaHealthBanner = "";
    if (schemaVersionArray[0] == schemaVersionBleedingEdgeArray[0]) {
      if (schemaVersionArray[1] == schemaVersionBleedingEdgeArray[1]) {
        schemaHealthBanner = 'Template storage health: <b style="color:#0f0;">Healthy!</b><br>No futher action required. (Reason: Semantic version matches)';
        this.schemaHealth = "Good";
      } else {
        schemaHealthBanner = `Template storage health: <b style="color:#ff0;">Poor!</b><br>You can still use your template, but some features may not work. It is recommended that you update Blue Marble's template storage. (Reason: MINOR version mismatch)`;
        this.schemaHealth = "Poor";
      }
    } else if (schemaVersionArray[0] < schemaVersionBleedingEdgeArray[0]) {
      schemaHealthBanner = `Template storage health: <b style="color:#f00;">Bad!</b><br>It is guaranteed that some features are broken. You <em>might</em> still be able to use the template. It is HIGHLY recommended that you update Blue Marble's template storage. (Reason: MAJOR version mismatch)`;
      this.schemaHealth = "Bad";
    } else {
      schemaHealthBanner = 'Template storage health: <b style="color:#f00">Dead!</b><br>Blue Marble can not load the template storage. (Reason: MAJOR version unknown)';
      this.schemaHealth = "Dead";
    }
    this.updateInnerHTML("#bm-wizard-status", `${schemaHealthBanner}<br>Your templates were created during Blue Marble version <b>${escapeHTML(this.scriptVersion)}</b> with schema version <b>${escapeHTML(this.schemaVersion)}</b>.<br>The current Blue Marble version is <b>${escapeHTML(this.version)}</b> and requires schema version <b>${escapeHTML(this.schemaVersionBleedingEdge)}</b>.<hr style="margin:.5ch">If you want to continue using your current templates, then make sure the template storage (schema) is up-to-date.<br>If you don't want to update the template storage, then downgrade Blue Marble to version <b>${escapeHTML(this.scriptVersion)}</b> to continue using your templates.<br>Alternatively, if you don't care about corrupting the templates listed below, you can fix any issues with the template storage by uploading a new template.`);
    const buttonOptions = new Overlay(this.name, this.version);
    if (this.schemaHealth != "Dead") {
      buttonOptions.addDiv({ "class": "bm-container bm-flex-center bm-center-vertically", "style": "gap: 1.5ch;" });
      buttonOptions.addButton({ "textContent": "Download all templates" }, (instance, button) => {
        button.onclick = () => {
        };
      }).buildElement();
    }
    if (this.schemaHealth == "Poor" || this.schemaHealth == "Bad") {
      buttonOptions.addButton({ "textContent": `Update template storage to ${this.schemaVersionBleedingEdge}` }, (instance, button) => {
        button.onclick = () => {
        };
      }).buildElement();
    }
    buttonOptions.buildElement().buildOverlay(document.querySelector("#bm-wizard-status").parentNode);
  };
  /** Displays loaded templates to the user.
   * @since 0.88.441
   */
  displayTemplateList_fn = function() {
    const templates = this.currentJSON?.templates;
    console.log("Loading Template Wizard...");
    console.log(templates);
    console.log(Object.keys(templates).length);
    if (Object.keys(templates).length > 0) {
      const templateListParentElement = document.querySelector(`#${this.windowID} .bm-scrollable`);
      console.log(templateListParentElement);
      const templateList = new Overlay(this.name, this.version);
      templateList.addDiv({ "id": "bm-wizard-tlist", "class": "bm-container" });
      for (const template in templates) {
        const templateKey = template;
        const templateValue = templates[template];
        console.log(`Wzrd - Template Key: ${templateKey}`);
        if (templates.hasOwnProperty(template)) {
          const templateKeyArray = templateKey.split(" ");
          const sortID = Number(templateKeyArray?.[0]);
          const authorID = encodedToNumber(templateKeyArray?.[1] || "0", this.encodingBase);
          const displayName = templateValue.name || `Template ${sortID || ""}`;
          const coords2 = templateValue?.coords?.split(",").map(Number);
          const totalPixelCount = templateValue.pixels?.total ?? void 0;
          const templateImage = void 0;
          console.log("Sort ID:", sortID);
          console.log("Author ID:", authorID);
          console.log("Display Name:", displayName);
          console.log("Coords", coords2);
          console.log("Pixels:", totalPixelCount);
          templateList.addDiv({ "class": "bm-container bm-flex-center" }).addDiv({ "class": "bm-flex-center", "style": "flex-direction: column; gap: 0;" }).addDiv({ "class": "bm-wizard-template-container-image", "textContent": templateImage || "\u{1F5BC}\uFE0F" }).buildElement().addSmall({ "textContent": `#${sortID}` }).buildElement().buildElement().addDiv({ "class": "bm-flex-center bm-wizard-template-container-flavor" }).addHeader(3, { "textContent": displayName }).buildElement().addSpan({ "textContent": `Uploaded by user #${authorID}` }).buildElement().addSpan({ "textContent": `Coordinates: ${coords2.join(", ")}` }).buildElement().addSpan({ "textContent": `Total Pixels: ${totalPixelCount || "???"}` }).buildElement().buildElement().buildElement();
        }
      }
      templateList.buildElement().buildOverlay(templateListParentElement);
    }
  };

  // src/templateManager.js
  var _TemplateManager_instances, loadTemplate_fn, storeTemplates_fn, parseBlueMarble_fn, parseOSU_fn, calculateCorrectPixelsOnTile_And_FilterTile_fn;
  var TemplateManager = class {
    /** The constructor for the {@link TemplateManager} class.
     * @since 0.55.8
     */
    constructor(name2, version2, overlay) {
      __privateAdd(this, _TemplateManager_instances);
      this.name = name2;
      this.version = version2;
      this.overlay = overlay;
      this.schemaVersion = "2.0.0";
      this.userID = null;
      this.encodingBase = "!#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~";
      this.tileSize = 1e3;
      this.drawMult = 3;
      this.paletteTolerance = 3;
      this.paletteBM = colorpaletteForBlueMarble(this.paletteTolerance);
      this.template = null;
      this.templateState = "";
      this.templatesArray = [];
      this.templatesJSON = null;
      this.templatesShouldBeDrawn = true;
      this.templatePixelsCorrect = null;
      this.shouldFilterColor = /* @__PURE__ */ new Map();
    }
    /** Creates the JSON object to store templates in
     * @returns {{ whoami: string, scriptVersion: string, schemaVersion: string, templates: Object }} The JSON object
     * @since 0.65.4
     */
    async createJSON() {
      return {
        "whoami": this.name.replace(" ", ""),
        // Name of userscript without spaces
        "scriptVersion": this.version,
        // Version of userscript
        "schemaVersion": this.schemaVersion,
        // Version of JSON schema
        "templates": {}
        // The templates
      };
    }
    /** Creates the template from the inputed file blob
     * @param {File} blob - The file blob to create a template from
     * @param {string} name - The display name of the template
     * @param {Array<number, number, number, number>} coords - The coordinates of the top left corner of the template
     * @since 0.65.77
     */
    async createTemplate(blob, name2, coords2) {
      if (!this.templatesJSON) {
        this.templatesJSON = await this.createJSON();
        console.log(`Creating JSON...`);
      }
      this.overlay.handleDisplayStatus(`Creating template at ${coords2.join(", ")}...`);
      const template = new Template({
        displayName: name2,
        sortID: 0,
        // Object.keys(this.templatesJSON.templates).length || 0, // Uncomment this to enable multiple templates (1/2)
        authorID: numberToEncoded(this.userID || 0, this.encodingBase),
        file: blob,
        coords: coords2
      });
      const { templateTiles, templateTilesBuffers } = await template.createTemplateTiles(this.tileSize, this.paletteBM);
      template.chunked = templateTiles;
      const _pixels = { "total": template.pixelCount.total, "colors": Object.fromEntries(template.pixelCount.colors) };
      this.templatesJSON.templates[`${template.sortID} ${template.authorID}`] = {
        "name": template.displayName,
        // Display name of template
        "coords": coords2.join(", "),
        // The coords of the template
        "enabled": true,
        "pixels": _pixels,
        // The total pixels in the template
        "tiles": templateTilesBuffers
        // Stores the chunked tile buffers
      };
      this.templatesArray = [];
      this.templatesArray.push(template);
      this.overlay.handleDisplayStatus(`Template created at ${coords2.join(", ")}!`);
      console.log(Object.keys(this.templatesJSON.templates).length);
      console.log(this.templatesJSON);
      console.log(this.templatesArray);
      console.log(JSON.stringify(this.templatesJSON));
      await __privateMethod(this, _TemplateManager_instances, storeTemplates_fn).call(this);
    }
    /** Deletes a template from the JSON object.
     * Also delete's the corrosponding {@link Template} class instance
     */
    deleteTemplate() {
    }
    /** Disables the template from view
     */
    async disableTemplate() {
      if (!this.templatesJSON) {
        this.templatesJSON = await this.createJSON();
        console.log(`Creating JSON...`);
      }
    }
    /** Draws all templates on the specified tile.
     * This method handles the rendering of template overlays on individual tiles.
     * @param {File} tileBlob - The pixels that are placed on a tile
     * @param {Array<number>} tileCoords - The tile coordinates [x, y]
     * @since 0.65.77
     */
    async drawTemplateOnTile(tileBlob, tileCoords) {
      if (!this.templatesShouldBeDrawn) {
        return tileBlob;
      }
      const drawSize = this.tileSize * this.drawMult;
      tileCoords = tileCoords[0].toString().padStart(4, "0") + "," + tileCoords[1].toString().padStart(4, "0");
      console.log(`Searching for templates in tile: "${tileCoords}"`);
      const templateArray = this.templatesArray;
      console.log(templateArray);
      templateArray.sort((a, b) => {
        return a.sortID - b.sortID;
      });
      console.log(templateArray);
      const templatesToDraw = templateArray.map((template) => {
        const matchingTiles = Object.keys(template.chunked).filter(
          (tile) => tile.startsWith(tileCoords)
        );
        if (matchingTiles.length === 0) {
          return null;
        }
        const matchingTileBlobs = matchingTiles.map((tile) => {
          const coords2 = tile.split(",");
          return {
            instance: template,
            bitmap: template.chunked[tile],
            chunked32: template.chunked32?.[tile],
            tileCoords: [coords2[0], coords2[1]],
            pixelCoords: [coords2[2], coords2[3]]
          };
        });
        return matchingTileBlobs?.[0];
      }).filter(Boolean);
      console.log(templatesToDraw);
      const templateCount = templatesToDraw?.length || 0;
      console.log(`templateCount = ${templateCount}`);
      if (templateCount > 0) {
        const totalPixels = templateArray.filter((template) => {
          const matchingTiles = Object.keys(template.chunked).filter(
            (tile) => tile.startsWith(tileCoords)
          );
          return matchingTiles.length > 0;
        }).reduce((sum, template) => sum + (template.pixelCount.total || 0), 0);
        const pixelCountFormatted = new Intl.NumberFormat().format(totalPixels);
        this.overlay.handleDisplayStatus(
          `Displaying ${templateCount} template${templateCount == 1 ? "" : "s"}.
Total pixels: ${pixelCountFormatted}`
        );
      } else {
        this.overlay.handleDisplayStatus(`Sleeping
Version: ${this.version}`);
        return tileBlob;
      }
      const tileBitmap = await createImageBitmap(tileBlob);
      const canvas = new OffscreenCanvas(drawSize, drawSize);
      const context = canvas.getContext("2d");
      context.imageSmoothingEnabled = false;
      context.beginPath();
      context.rect(0, 0, drawSize, drawSize);
      context.clip();
      context.clearRect(0, 0, drawSize, drawSize);
      context.drawImage(tileBitmap, 0, 0, drawSize, drawSize);
      const tileBeforeTemplates = context.getImageData(0, 0, drawSize, drawSize);
      const tileBeforeTemplates32 = new Uint32Array(tileBeforeTemplates.data.buffer);
      for (const template of templatesToDraw) {
        console.log(`Template:`);
        console.log(template);
        const templateHasErased = !!template.instance.pixelCount?.colors?.get(-1);
        let templateBeforeFilter32 = template.chunked32.slice();
        const coordXtoDrawAt = Number(template.pixelCoords[0]) * this.drawMult;
        const coordYtoDrawAt = Number(template.pixelCoords[1]) * this.drawMult;
        if (this.shouldFilterColor.size == 0 && !templateHasErased) {
          context.drawImage(template.bitmap, coordXtoDrawAt, coordYtoDrawAt);
        }
        if (!templateBeforeFilter32) {
          const templateBeforeFilter = context.getImageData(coordXtoDrawAt, coordYtoDrawAt, template.bitmap.width, template.bitmap.height);
          templateBeforeFilter32 = new Uint32Array(templateBeforeFilter.data.buffer);
        }
        const timer = Date.now();
        const {
          correctPixels: pixelsCorrect,
          filteredTemplate: templateAfterFilter
        } = __privateMethod(this, _TemplateManager_instances, calculateCorrectPixelsOnTile_And_FilterTile_fn).call(this, {
          tile: tileBeforeTemplates32,
          template: templateBeforeFilter32,
          templateInfo: [coordXtoDrawAt, coordYtoDrawAt, template.bitmap.width, template.bitmap.height]
        });
        let pixelsCorrectTotal = 0;
        const transparentColorID = 0;
        for (const [color, total] of pixelsCorrect) {
          if (color == transparentColorID) {
            continue;
          }
          pixelsCorrectTotal += total;
        }
        if (this.shouldFilterColor.size != 0 || templateHasErased) {
          console.log("Colors to filter: ", this.shouldFilterColor);
          context.drawImage(await createImageBitmap(new ImageData(new Uint8ClampedArray(templateAfterFilter.buffer), template.bitmap.width, template.bitmap.height)), coordXtoDrawAt, coordYtoDrawAt);
        }
        console.log(`Finished calculating correct pixels & filtering colors for the tile ${tileCoords} in ${(Date.now() - timer) / 1e3} seconds!
There are ${pixelsCorrectTotal} correct pixels.`);
        if (typeof template.instance.pixelCount["correct"] == "undefined") {
          template.instance.pixelCount["correct"] = {};
        }
        template.instance.pixelCount["correct"][tileCoords] = pixelsCorrect;
      }
      return await canvas.convertToBlob({ type: "image/png" });
    }
    /** Imports the JSON object, and appends it to any JSON object already loaded
     * @param {string} json - The JSON string to parse
     */
    importJSON(json) {
      console.log(`Importing JSON...`);
      console.log(json);
      if (json?.whoami == "BlueMarble") {
        __privateMethod(this, _TemplateManager_instances, parseBlueMarble_fn).call(this, json);
      }
    }
    /** Sets the `templatesShouldBeDrawn` boolean to a value.
     * @param {boolean} value - The value to set the boolean to
     * @since 0.73.7
     */
    setTemplatesShouldBeDrawn(value) {
      this.templatesShouldBeDrawn = value;
    }
  };
  _TemplateManager_instances = new WeakSet();
  /** Generates a {@link Template} class instance from the JSON object template
   */
  loadTemplate_fn = function() {
  };
  storeTemplates_fn = async function() {
    GM.setValue("bmTemplates", JSON.stringify(this.templatesJSON));
  };
  parseBlueMarble_fn = async function(json) {
    console.log(`Parsing BlueMarble...`);
    const templates = json.templates;
    console.log(`BlueMarble length: ${Object.keys(templates).length}`);
    const schemaVersion = json?.schemaVersion;
    const schemaVersionArray = schemaVersion.split(/[-\.\+]/);
    const schemaVersionBleedingEdge = this.schemaVersion.split(/[-\.\+]/);
    const scriptVersion = json?.scriptVersion;
    console.log(`BlueMarble Template Schema: ${schemaVersion}; Script Version: ${scriptVersion}`);
    if (schemaVersionArray[0] == schemaVersionBleedingEdge[0]) {
      if (schemaVersionArray[1] != schemaVersionBleedingEdge[1]) {
        const windowWizard = new WindowWizard(this.name, this.version, this.schemaVersion, this.encodingBase);
        windowWizard.buildWindow();
      }
      this.templatesArray = await loadSchema({
        tileSize: this.tileSize,
        drawMult: this.drawMult,
        templatesArray: this.templatesArray
      });
    } else if (schemaVersionArray[0] < schemaVersionBleedingEdge[0]) {
      const windowWizard = new WindowWizard(this.name, this.version, this.schemaVersion, this.encodingBase);
      windowWizard.buildWindow();
    } else {
      this.overlay.handleDisplayError(`Template version ${schemaVersion} is unsupported.
Use Blue Marble version ${scriptVersion} or load a new template.`);
    }
    async function loadSchema({
      tileSize,
      drawMult,
      templatesArray
    }) {
      if (Object.keys(templates).length > 0) {
        for (const template in templates) {
          const templateKey = template;
          const templateValue = templates[template];
          console.log(`Template Key: ${templateKey}`);
          if (templates.hasOwnProperty(template)) {
            const templateKeyArray = templateKey.split(" ");
            const sortID = Number(templateKeyArray?.[0]);
            const authorID = templateKeyArray?.[1] || "0";
            const displayName = templateValue.name || `Template ${sortID || ""}`;
            const pixelCount = {
              total: templateValue.pixels?.total,
              colors: new Map(Object.entries(templateValue.pixels?.colors || {}).map(([key, value]) => [Number(key), value]))
            };
            const tilesbase64 = templateValue.tiles;
            const templateTiles = {};
            const templateTiles32 = {};
            const actualTileSize = tileSize * drawMult;
            for (const tile in tilesbase64) {
              console.log(tile);
              if (tilesbase64.hasOwnProperty(tile)) {
                const encodedTemplateBase64 = tilesbase64[tile];
                const templateUint8Array = base64ToUint8(encodedTemplateBase64);
                const templateBlob = new Blob([templateUint8Array], { type: "image/png" });
                const templateBitmap = await createImageBitmap(templateBlob);
                templateTiles[tile] = templateBitmap;
                const canvas = new OffscreenCanvas(actualTileSize, actualTileSize);
                const context = canvas.getContext("2d");
                context.drawImage(templateBitmap, 0, 0);
                const imageData = context.getImageData(0, 0, templateBitmap.width, templateBitmap.height);
                templateTiles32[tile] = new Uint32Array(imageData.data.buffer);
              }
            }
            const template2 = new Template({
              displayName,
              sortID: sortID || this.templatesArray?.length || 0,
              authorID: authorID || ""
              //coords: coords,
            });
            template2.pixelCount = pixelCount;
            template2.chunked = templateTiles;
            template2.chunked32 = templateTiles32;
            templatesArray.push(template2);
            console.log(this.templatesArray);
            console.log(`^^^ This ^^^`);
          }
        }
      }
      return templatesArray;
    }
  };
  /** Parses the OSU! Place JSON object
   */
  parseOSU_fn = function() {
  };
  /** Calculates the correct pixels on this tile.
   * In addition, this function filters colors based on user input.
   * In addition, this function modifies colors to properly display (#deface).
   * This function has multiple purposes only to reduce iterations of scans over every pixel on the template.
   * @param {Object} params - Object containing all parameters
   * @param {Uint32Array} params.tile - The tile without templates as a Uint32Array
   * @param {Uint32Array} params.template - The template without filtering as a Uint32Array
   * @param {Array<Number, Number, Number, Number>} params.templateInfo - Information about template location and size
   * @returns {{correctPixels: Map<number, number>, filteredTemplate: Uint32Array}} A Map containing the color IDs (keys) and how many correct pixels there are for that color (values)
   */
  calculateCorrectPixelsOnTile_And_FilterTile_fn = function({
    tile: tile32,
    template: template32,
    templateInfo: templateInformation
  }) {
    const pixelSize = this.drawMult;
    const tileWidth = this.tileSize * pixelSize;
    const tileHeight = tileWidth;
    const tilePixelOffsetY = -1;
    const tilePixelOffsetX = 0;
    const templateCoordX = templateInformation[0];
    const templateCoordY = templateInformation[1];
    const templateWidth = templateInformation[2];
    const templateHeight = templateInformation[3];
    const tolerance = this.paletteTolerance;
    const { palette: _, LUT: lookupTable } = this.paletteBM;
    const _colorpalette = /* @__PURE__ */ new Map();
    for (let templateRow = 1; templateRow < templateHeight; templateRow += pixelSize) {
      for (let templateColumn = 1; templateColumn < templateWidth; templateColumn += pixelSize) {
        const tileRow = templateCoordY + templateRow + tilePixelOffsetY;
        const tileColumn = templateCoordX + templateColumn + tilePixelOffsetX;
        const tilePixelAbove = tile32[tileRow * tileWidth + tileColumn];
        const templatePixel = template32[templateRow * templateWidth + templateColumn];
        const templatePixelAlpha = templatePixel >>> 24 & 255;
        const tilePixelAlpha = tilePixelAbove >>> 24 & 255;
        const bestTemplateColorID = lookupTable.get(templatePixel) ?? -2;
        if (this.shouldFilterColor.get(bestTemplateColorID)) {
          template32[templateRow * templateWidth + templateColumn] = tilePixelAbove;
        }
        if (bestTemplateColorID == -1) {
          const blackTrans = 536870912;
          if (this.shouldFilterColor.get(bestTemplateColorID)) {
            template32[templateRow * templateWidth + templateColumn] = 0;
          } else {
            if ((tileRow / pixelSize & 1) == (tileColumn / pixelSize & 1)) {
              template32[templateRow * templateWidth + templateColumn] = blackTrans;
              template32[(templateRow - 1) * templateWidth + (templateColumn - 1)] = blackTrans;
              template32[(templateRow - 1) * templateWidth + (templateColumn + 1)] = blackTrans;
              template32[(templateRow + 1) * templateWidth + (templateColumn - 1)] = blackTrans;
              template32[(templateRow + 1) * templateWidth + (templateColumn + 1)] = blackTrans;
            } else {
              template32[templateRow * templateWidth + templateColumn] = 0;
              template32[(templateRow - 1) * templateWidth + templateColumn] = blackTrans;
              template32[(templateRow + 1) * templateWidth + templateColumn] = blackTrans;
              template32[templateRow * templateWidth + (templateColumn - 1)] = blackTrans;
              template32[templateRow * templateWidth + (templateColumn + 1)] = blackTrans;
            }
          }
        }
        if (bestTemplateColorID == -1 && tilePixelAbove <= tolerance) {
          const colorIDcount2 = _colorpalette.get(bestTemplateColorID);
          _colorpalette.set(bestTemplateColorID, colorIDcount2 ? colorIDcount2 + 1 : 1);
          continue;
        }
        if (templatePixelAlpha <= tolerance || tilePixelAlpha <= tolerance) {
          continue;
        }
        const bestTileColorID = lookupTable.get(tilePixelAbove) ?? -2;
        if (bestTileColorID != bestTemplateColorID) {
          continue;
        }
        const colorIDcount = _colorpalette.get(bestTemplateColorID);
        _colorpalette.set(bestTemplateColorID, colorIDcount ? colorIDcount + 1 : 1);
      }
    }
    console.log(`List of template pixels that match the tile:`);
    console.log(_colorpalette);
    return { correctPixels: _colorpalette, filteredTemplate: template32 };
  };

  // src/apiManager.js
  var ApiManager = class {
    /** Constructor for ApiManager class
     * @param {TemplateManager} templateManager 
     * @since 0.11.34
     */
    constructor(templateManager2) {
      this.templateManager = templateManager2;
      this.disableAll = false;
      this.chargeRefillTimerID = "";
      this.coordsTilePixel = [];
      this.templateCoordsTilePixel = [];
    }
    /** Determines if the spontaneously received response is something we want.
     * Otherwise, we can ignore it.
     * Note: Due to aggressive compression, make your calls like `data['jsonData']['name']` instead of `data.jsonData.name`
     * 
     * @param {Overlay} overlay - The Overlay class instance
     * @since 0.11.1
    */
    spontaneousResponseListener(overlay) {
      window.addEventListener("message", async (event) => {
        const data = event.data;
        const dataJSON = data["jsonData"];
        if (!(data && data["source"] === "blue-marble")) {
          return;
        }
        if (!data["endpoint"]) {
          return;
        }
        const endpointText = data["endpoint"]?.split("?")[0].split("/").filter((s) => s && isNaN(Number(s))).filter((s) => s && !s.includes(".")).pop();
        console.log(`%cBlue Marble%c: Recieved message about "%s"`, "color: cornflowerblue;", "", endpointText);
        switch (endpointText) {
          case "me":
            if (dataJSON["status"] && dataJSON["status"]?.toString()[0] != "2") {
              overlay.handleDisplayError(`You are not logged in!
Could not fetch userdata.`);
              return;
            }
            const nextLevelPixels = Math.ceil(Math.pow(Math.floor(dataJSON["level"]) * Math.pow(30, 0.65), 1 / 0.65) - dataJSON["pixelsPainted"]);
            console.log(dataJSON["id"]);
            if (!!dataJSON["id"] || dataJSON["id"] === 0) {
              console.log(numberToEncoded(
                dataJSON["id"],
                "!#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~"
              ));
            }
            this.templateManager.userID = dataJSON["id"];
            if (this.chargeRefillTimerID.length != 0) {
              const chargeRefillTimer = document.querySelector("#" + this.chargeRefillTimerID);
              if (chargeRefillTimer) {
                const chargeData = dataJSON["charges"];
                chargeRefillTimer.dataset["endDate"] = Date.now() + (chargeData["max"] - chargeData["count"]) * chargeData["cooldownMs"];
              }
            }
            overlay.updateInnerHTML("bm-user-droplets", `Droplets: <b>${new Intl.NumberFormat().format(dataJSON["droplets"])}</b>`);
            overlay.updateInnerHTML("bm-user-nextlevel", `Next level in <b>${new Intl.NumberFormat().format(nextLevelPixels)}</b> pixel${nextLevelPixels == 1 ? "" : "s"}`);
            break;
          case "pixel":
            const coordsTile = data["endpoint"].split("?")[0].split("/").filter((s) => s && !isNaN(Number(s)));
            const payloadExtractor = new URLSearchParams(data["endpoint"].split("?")[1]);
            const coordsPixel = [payloadExtractor.get("x"), payloadExtractor.get("y")];
            if (this.coordsTilePixel.length && (!coordsTile.length || !coordsPixel.length)) {
              overlay.handleDisplayError(`Coordinates are malformed!
Did you try clicking the canvas first?`);
              return;
            }
            this.coordsTilePixel = [...coordsTile, ...coordsPixel];
            const displayTP = serverTPtoDisplayTP(coordsTile, coordsPixel);
            const spanElements = document.querySelectorAll("span");
            for (const element of spanElements) {
              if (element.textContent.trim().includes(`${displayTP[0]}, ${displayTP[1]}`)) {
                let displayCoords = document.querySelector("#bm-display-coords");
                const text = `(Tl X: ${coordsTile[0]}, Tl Y: ${coordsTile[1]}, Px X: ${coordsPixel[0]}, Px Y: ${coordsPixel[1]})`;
                if (!displayCoords) {
                  displayCoords = document.createElement("span");
                  displayCoords.id = "bm-display-coords";
                  displayCoords.textContent = text;
                  displayCoords.style = "margin-left: calc(var(--spacing)*3); font-size: small;";
                  element.parentNode.parentNode.insertAdjacentElement("afterend", displayCoords);
                } else {
                  displayCoords.textContent = text;
                }
              }
            }
            break;
          case "tiles":
            let tileCoordsTile = data["endpoint"].split("/");
            tileCoordsTile = [parseInt(tileCoordsTile[tileCoordsTile.length - 2]), parseInt(tileCoordsTile[tileCoordsTile.length - 1].replace(".png", ""))];
            const blobUUID = data["blobID"];
            const blobData = data["blobData"];
            const timer = Date.now();
            const templateBlob = await this.templateManager.drawTemplateOnTile(blobData, tileCoordsTile);
            console.log(`Finished loading the tile in ${(Date.now() - timer) / 1e3} seconds!`);
            window.postMessage({
              source: "blue-marble",
              blobID: blobUUID,
              blobData: templateBlob,
              blink: data["blink"]
            });
            break;
          case "robots":
            this.disableAll = dataJSON["userscript"]?.toString().toLowerCase() == "false";
            break;
        }
      });
    }
    // Sends a heartbeat to the telemetry server
    async sendHeartbeat(version2) {
      console.log("Sending heartbeat to telemetry server...");
      let userSettings2 = GM_getValue("bmUserSettings", "{}");
      userSettings2 = JSON.parse(userSettings2);
      if (!userSettings2 || !userSettings2.telemetry || !userSettings2.uuid) {
        console.log("Telemetry is disabled, not sending heartbeat.");
        return;
      }
      const ua = navigator.userAgent;
      let browser = await this.getBrowserFromUA(ua);
      let os = this.getOS(ua);
      GM_xmlhttpRequest({
        method: "POST",
        url: "https://telemetry.thebluecorner.net/heartbeat",
        headers: {
          "Content-Type": "application/json"
        },
        data: JSON.stringify({
          uuid: userSettings2.uuid,
          version: version2,
          browser,
          os
        }),
        onload: (response) => {
          if (response.status !== 200) {
            consoleError("Failed to send heartbeat:", response.statusText);
          }
        },
        onerror: (error) => {
          consoleError("Error sending heartbeat:", error);
        }
      });
    }
    async getBrowserFromUA(ua = navigator.userAgent) {
      ua = ua || "";
      if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
      if (ua.includes("Edg/")) return "Edge";
      if (ua.includes("Vivaldi")) return "Vivaldi";
      if (ua.includes("YaBrowser")) return "Yandex";
      if (ua.includes("Kiwi")) return "Kiwi";
      if (ua.includes("Brave")) return "Brave";
      if (ua.includes("Firefox/")) return "Firefox";
      if (ua.includes("Chrome/")) return "Chrome";
      if (ua.includes("Safari/")) return "Safari";
      if (navigator.brave && typeof navigator.brave.isBrave === "function") {
        if (await navigator.brave.isBrave()) return "Brave";
      }
      return "Unknown";
    }
    getOS(ua = navigator.userAgent) {
      ua = ua || "";
      if (/Windows NT 11/i.test(ua)) return "Windows 11";
      if (/Windows NT 10/i.test(ua)) return "Windows 10";
      if (/Windows NT 6\.3/i.test(ua)) return "Windows 8.1";
      if (/Windows NT 6\.2/i.test(ua)) return "Windows 8";
      if (/Windows NT 6\.1/i.test(ua)) return "Windows 7";
      if (/Windows NT 6\.0/i.test(ua)) return "Windows Vista";
      if (/Windows NT 5\.1|Windows XP/i.test(ua)) return "Windows XP";
      if (/Mac OS X 10[_\.]15/i.test(ua)) return "macOS Catalina";
      if (/Mac OS X 10[_\.]14/i.test(ua)) return "macOS Mojave";
      if (/Mac OS X 10[_\.]13/i.test(ua)) return "macOS High Sierra";
      if (/Mac OS X 10[_\.]12/i.test(ua)) return "macOS Sierra";
      if (/Mac OS X 10[_\.]11/i.test(ua)) return "OS X El Capitan";
      if (/Mac OS X 10[_\.]10/i.test(ua)) return "OS X Yosemite";
      if (/Mac OS X 10[_\.]/i.test(ua)) return "macOS";
      if (/Android/i.test(ua)) return "Android";
      if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
      if (/Linux/i.test(ua)) return "Linux";
      return "Unknown";
    }
  };

  // src/confetttiManager.js
  var ConfettiManager = class {
    /** The constructor for the confetti manager.
     * @since 0.88.356
     */
    constructor() {
      this.confettiCount = Math.ceil(80 / 1300 * window.innerWidth);
      this.colorPalette = colorpalette.slice(1);
    }
    /** Immedently creates confetti inside the parent element.
     * @param {HTMLElement} parentElement - The parent element to create confetti inside of
     * @since 0.88.356
     */
    createConfetti(parentElement) {
      const confettiContainer = document.createElement("div");
      for (let currentCount = 0; currentCount < this.confettiCount; currentCount++) {
        const confettiShard = document.createElement("confetti-piece");
        confettiShard.style.setProperty("--x", `${Math.random() * 100}vw`);
        confettiShard.style.setProperty("--delay", `${Math.random() * 2}s`);
        confettiShard.style.setProperty("--duration", `${3 + Math.random() * 3}s`);
        confettiShard.style.setProperty("--rot", `${Math.random() * 360}deg`);
        confettiShard.style.setProperty("--size", `${6 + Math.random() * 6}px`);
        confettiShard.style.backgroundColor = `rgb(${this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)].rgb.join(",")})`;
        confettiShard.onanimationend = () => {
          if (confettiShard.parentNode.childElementCount <= 1) {
            confettiShard.parentNode.remove();
          } else {
            confettiShard.remove();
          }
        };
        confettiContainer.appendChild(confettiShard);
      }
      parentElement.appendChild(confettiContainer);
    }
  };
  var BlueMarbleConfettiPiece = class extends HTMLElement {
  };
  customElements.define("confetti-piece", BlueMarbleConfettiPiece);

  // src/WindowFilter.js
  var _WindowFilter_instances, buildColorList_fn, sortColorList_fn, selectColorList_fn;
  var WindowFilter = class extends Overlay {
    /** Constructor for the color filter window
     * @param {*} executor - The executing class
     * @since 0.88.329
     * @see {@link Overlay#constructor}
     */
    constructor(executor) {
      super(executor.name, executor.version);
      __privateAdd(this, _WindowFilter_instances);
      this.window = null;
      this.windowID = "bm-window-filter";
      this.windowParent = document.body;
      this.templateManager = executor.apiManager?.templateManager;
      this.eyeOpen = '<svg viewBox="0 .5 6 3"><path d="M0,2Q3-1 6,2Q3,5 0,2H2A1,1 0 1 0 3,1Q3,2 2,2"/></svg>';
      this.eyeClosed = '<svg viewBox="0 1 12 6"><mask id="a"><path d="M0,0H12V8L0,2" fill="#fff"/></mask><path d="M0,4Q6-2 12,4Q6,10 0,4H4A2,2 0 1 0 6,2Q6,4 4,4ZM1,2L10,6.5L9.5,7L.5,2.5" mask="url(#a)"/></svg>';
      this.localizeNumber = new Intl.NumberFormat();
      this.localizePercent = new Intl.NumberFormat(void 0, {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      this.localizeDateTimeOptions = {
        month: "long",
        // July
        day: "numeric",
        // 23
        hour: "2-digit",
        // 17
        minute: "2-digit",
        // 47
        second: "2-digit"
        // 00
      };
      const { palette, LUT: _ } = this.templateManager.paletteBM;
      this.palette = palette;
      this.tilesLoadedTotal = 0;
      this.tilesTotal = 0;
    }
    /** Spawns a Color Filter window.
     * If another color filter window already exists, we DON'T spawn another!
     * Parent/child relationships in the DOM structure below are indicated by indentation.
     * @since 0.88.149
     */
    buildWindow() {
      if (document.querySelector(`#${this.windowID}`)) {
        this.handleDisplayError("Color Filter window already exists!");
        return;
      }
      this.window = this.addDiv({ "id": this.windowID, "class": "bm-window" }).addDragbar().addButton({ "class": "bm-button-circle", "textContent": "\u25BC", "aria-label": 'Minimize window "Color Filter"', "data-button-status": "expanded" }, (instance, button) => {
        button.onclick = () => instance.handleMinimization(button);
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().addDiv().buildElement().addButton({ "class": "bm-button-circle", "textContent": "\u{1F7AA}", "aria-label": 'Close window "Color Filter"' }, (instance, button) => {
        button.onclick = () => {
          document.querySelector(`#${this.windowID}`)?.remove();
        };
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().buildElement().addDiv({ "class": "bm-window-content" }).addDiv({ "class": "bm-container bm-center-vertically" }).addHeader(1, { "textContent": "Color Filter" }).buildElement().buildElement().addHr().buildElement().addDiv({ "class": "bm-container bm-flex-between bm-center-vertically", "style": "gap: 1.5ch;" }).addButton({ "textContent": "Select All" }, (instance, button) => {
        button.onclick = () => __privateMethod(this, _WindowFilter_instances, selectColorList_fn).call(this, false);
      }).buildElement().addButton({ "textContent": "Unselect All" }, (instance, button) => {
        button.onclick = () => __privateMethod(this, _WindowFilter_instances, selectColorList_fn).call(this, true);
      }).buildElement().buildElement().addDiv({ "class": "bm-container bm-scrollable" }).addDiv({ "class": "bm-container", "style": "margin-left: 2.5ch; margin-right: 2.5ch;" }).addDiv({ "class": "bm-container" }).addSpan({ "id": "bm-filter-tile-load", "innerHTML": "<b>Tiles Loaded:</b> 0 / ???" }).buildElement().addBr().buildElement().addSpan({ "id": "bm-filter-tot-correct", "innerHTML": "<b>Correct Pixels:</b> ???" }).buildElement().addBr().buildElement().addSpan({ "id": "bm-filter-tot-total", "innerHTML": "<b>Total Pixels:</b> ???" }).buildElement().addBr().buildElement().addSpan({ "id": "bm-filter-tot-remaining", "innerHTML": "<b>Complete:</b> ??? (???)" }).buildElement().addBr().buildElement().addSpan({ "id": "bm-filter-tot-completed", "innerHTML": "??? ???" }).buildElement().buildElement().addDiv({ "class": "bm-container" }).addP({ "innerHTML": `Colors with the icon ${this.eyeOpen.replace("<svg", '<svg aria-label="Eye Open"')} will be shown on the canvas. Colors with the icon ${this.eyeClosed.replace("<svg", '<svg aria-label="Eye Closed"')} will not be shown on the canvas. The "Select All" and "Unselect All" buttons only apply to colors that display in the list below. The amount of correct pixels is dependent on how many tiles of the template you have loaded since you last opened Wplace.live. If all tiles have been loaded, then the "correct pixel" count is accurate.` }).buildElement().buildElement().addHr().buildElement().addForm({ "class": "bm-container" }).addFieldset().addLegend({ "textContent": "Sort Options:", "style": "font-weight: 700;" }).buildElement().addDiv({ "class": "bm-container" }).addSelect({ "id": "bm-filter-sort-primary", "name": "sortPrimary", "textContent": "I want to view " }).addOption({ "value": "id", "textContent": "color IDs" }).buildElement().addOption({ "value": "name", "textContent": "color names" }).buildElement().addOption({ "value": "premium", "textContent": "premium colors" }).buildElement().addOption({ "value": "percent", "textContent": "percentage" }).buildElement().addOption({ "value": "correct", "textContent": "correct pixels" }).buildElement().addOption({ "value": "incorrect", "textContent": "incorrect pixels" }).buildElement().addOption({ "value": "total", "textContent": "total pixels" }).buildElement().buildElement().addSelect({ "id": "bm-filter-sort-secondary", "name": "sortSecondary", "textContent": " in " }).addOption({ "value": "ascending", "textContent": "ascending" }).buildElement().addOption({ "value": "descending", "textContent": "descending" }).buildElement().buildElement().addSpan({ "textContent": " order." }).buildElement().buildElement().addDiv({ "class": "bm-container" }).addCheckbox({ "id": "bm-filter-show-unused", "name": "showUnused", "textContent": "Show unused colors" }).buildElement().buildElement().buildElement().addDiv({ "class": "bm-container" }).addButton({ "textContent": "Sort Colors", "type": "submit" }, (instance, button) => {
        button.onclick = (event) => {
          event.preventDefault();
          const formData = new FormData(document.querySelector(`#${this.windowID} form`));
          const formValues = {};
          for (const [input, value] of formData) {
            formValues[input] = value;
          }
          console.log(`Primary: ${formValues["sortPrimary"]}; Secondary: ${formValues["sortSecondary"]}; Unused: ${formValues["showUnused"] == "on"}`);
          __privateMethod(this, _WindowFilter_instances, sortColorList_fn).call(this, formValues["sortPrimary"], formValues["sortSecondary"], formValues["showUnused"] == "on");
        };
      }).buildElement().buildElement().buildElement().buildElement().buildElement().buildElement().buildElement().buildOverlay(this.windowParent);
      this.handleDrag(`#${this.windowID}.bm-window`, `#${this.windowID} .bm-dragbar`);
      const scrollableContainer = document.querySelector(`#${this.windowID} .bm-container.bm-scrollable`);
      let allPixelsTotal = 0;
      let allPixelsCorrectTotal = 0;
      const allPixelsCorrect = /* @__PURE__ */ new Map();
      const allPixelsColor = /* @__PURE__ */ new Map();
      for (const template of this.templateManager.templatesArray) {
        const total = template.pixelCount?.total ?? 0;
        allPixelsTotal += total ?? 0;
        const colors = template.pixelCount?.colors ?? /* @__PURE__ */ new Map();
        for (const [colorID, colorPixels] of colors) {
          const _colorPixels = Number(colorPixels) || 0;
          const allPixelsColorSoFar = allPixelsColor.get(colorID) ?? 0;
          allPixelsColor.set(colorID, allPixelsColorSoFar + _colorPixels);
        }
        const correctObject = template.pixelCount?.correct ?? {};
        this.tilesLoadedTotal += Object.keys(correctObject).length;
        this.tilesTotal += Object.keys(template.chunked).length;
        for (const map of Object.values(correctObject)) {
          for (const [colorID, correctPixels] of map) {
            const _correctPixels = Number(correctPixels) || 0;
            allPixelsCorrectTotal += _correctPixels;
            const allPixelsCorrectSoFar = allPixelsCorrect.get(colorID) ?? 0;
            allPixelsCorrect.set(colorID, allPixelsCorrectSoFar + _correctPixels);
          }
        }
      }
      console.log(`Tiles loaded: ${this.tilesLoadedTotal} / ${this.tilesTotal}`);
      if (allPixelsCorrectTotal >= allPixelsTotal && !!allPixelsTotal && this.tilesLoadedTotal == this.tilesTotal) {
        const confettiManager = new ConfettiManager();
        confettiManager.createConfetti(document.querySelector(`#${this.windowID}`));
      }
      const timeRemaining = new Date((allPixelsTotal - allPixelsCorrectTotal) * 30 * 1e3 + Date.now());
      const timeRemainingLocalized = timeRemaining.toLocaleString(void 0, this.localizeDateTimeOptions);
      this.updateInnerHTML("#bm-filter-tile-load", `<b>Tiles Loaded:</b> ${this.localizeNumber.format(this.tilesLoadedTotal)} / ${this.localizeNumber.format(this.tilesTotal)}`);
      this.updateInnerHTML("#bm-filter-tot-correct", `<b>Correct Pixels:</b> ${this.localizeNumber.format(allPixelsCorrectTotal)}`);
      this.updateInnerHTML("#bm-filter-tot-total", `<b>Total Pixels:</b> ${this.localizeNumber.format(allPixelsTotal)}`);
      this.updateInnerHTML("#bm-filter-tot-remaining", `<b>Remaining:</b> ${this.localizeNumber.format((allPixelsTotal || 0) - (allPixelsCorrectTotal || 0))} (${this.localizePercent.format(((allPixelsTotal || 0) - (allPixelsCorrectTotal || 0)) / (allPixelsTotal || 1))})`);
      this.updateInnerHTML("#bm-filter-tot-completed", `<b>Completed at:</b> <time datetime="${timeRemaining.toISOString().replace(/\.\d{3}Z$/, "Z")}">${timeRemainingLocalized}</time>`);
      __privateMethod(this, _WindowFilter_instances, buildColorList_fn).call(this, scrollableContainer, allPixelsCorrect, allPixelsColor);
      __privateMethod(this, _WindowFilter_instances, sortColorList_fn).call(this, "id", "ascending", false);
    }
  };
  _WindowFilter_instances = new WeakSet();
  /** Creates the color list container.
   * @param {HTMLElement} parentElement - Parent element to add the color list to as a child
   * @param {Map<number, number>} allPixelsCorrect - All pixels that are considered correct per color for all templates
   * @param {Map<number, number>} allPixelsColor - All pixels that are considered that color, totaled across all templates
   * @since 0.88.222
   */
  buildColorList_fn = function(parentElement, allPixelsCorrect, allPixelsColor) {
    const colorList = new Overlay(this.name, this.version);
    colorList.addDiv({ "class": "bm-filter-flex" });
    for (const color of this.palette) {
      const lumin = calculateRelativeLuminance(color.rgb);
      let textColorForPaletteColorBackground = 1.05 / (lumin + 0.05) > (lumin + 0.05) / 0.05 ? "white" : "black";
      if (!color.id) {
        textColorForPaletteColorBackground = "transparent";
      }
      const bgEffectForButtons = textColorForPaletteColorBackground == "white" ? "bm-button-hover-white" : "bm-button-hover-black";
      const colorTotal = allPixelsColor.get(color.id) ?? 0;
      const colorTotalLocalized = this.localizeNumber.format(colorTotal);
      let colorCorrect = 0;
      let colorCorrectLocalized = "0";
      let colorPercent = this.localizePercent.format(1);
      if (colorTotal != 0) {
        colorCorrect = allPixelsCorrect.get(color.id) ?? "???";
        if (typeof colorCorrect != "number" && this.tilesLoadedTotal == this.tilesTotal && !!color.id) {
          colorCorrect = 0;
        }
        colorCorrectLocalized = typeof colorCorrect == "string" ? colorCorrect : this.localizeNumber.format(colorCorrect);
        colorPercent = isNaN(colorCorrect / colorTotal) ? "???" : this.localizePercent.format(colorCorrect / colorTotal);
      }
      const colorIncorrect = parseInt(colorTotal) - parseInt(colorCorrect);
      const isColorHidden = !!(this.templateManager.shouldFilterColor.get(color.id) || false);
      colorList.addDiv({
        "class": "bm-container bm-filter-color bm-flex-between",
        "data-id": color.id,
        "data-name": color.name,
        "data-premium": +color.premium,
        "data-correct": !Number.isNaN(parseInt(colorCorrect)) ? colorCorrect : "0",
        "data-total": colorTotal,
        "data-percent": colorPercent.slice(-1) == "%" ? colorPercent.slice(0, -1) : "0",
        "data-incorrect": colorIncorrect || 0
      }).addDiv({ "class": "bm-filter-container-rgb", "style": `background-color: rgb(${color.rgb?.map((channel) => Number(channel) || 0).join(",")});` }).addButton(
        {
          "class": "bm-button-trans " + bgEffectForButtons,
          "data-state": isColorHidden ? "hidden" : "shown",
          "aria-label": isColorHidden ? `Show the color ${color.name || ""} on templates.` : `Hide the color ${color.name || ""} on templates.`,
          "innerHTML": isColorHidden ? this.eyeClosed.replace("<svg", `<svg fill="${textColorForPaletteColorBackground}"`) : this.eyeOpen.replace("<svg", `<svg fill="${textColorForPaletteColorBackground}"`)
        },
        (instance, button) => {
          button.onclick = () => {
            button.style.textDecoration = "none";
            button.disabled = true;
            if (button.dataset["state"] == "shown") {
              button.innerHTML = this.eyeClosed.replace("<svg", `<svg fill="${textColorForPaletteColorBackground}"`);
              button.dataset["state"] = "hidden";
              button.ariaLabel = `Show the color ${color.name || ""} on templates.`;
              this.templateManager.shouldFilterColor.set(color.id, true);
            } else {
              button.innerHTML = this.eyeOpen.replace("<svg", `<svg fill="${textColorForPaletteColorBackground}"`);
              button.dataset["state"] = "shown";
              button.ariaLabel = `Hide the color ${color.name || ""} on templates.`;
              this.templateManager.shouldFilterColor.delete(color.id);
            }
            button.disabled = false;
            button.style.textDecoration = "";
          };
          if (!color.id) {
            button.disabled = true;
          }
        }
      ).buildElement().buildElement().addDiv({ "class": "bm-flex-between" }).addHeader(2, { "textContent": (color.premium ? "\u2605 " : "") + color.name }).buildElement().addDiv({ "class": "bm-flex-between", "style": "gap: 1.5ch;" }).addSmall({ "textContent": `#${color.id}` }).buildElement().addSmall({ "textContent": `${colorCorrectLocalized} / ${colorTotalLocalized}` }).buildElement().buildElement().addP({ "textContent": `${typeof colorIncorrect == "number" && !isNaN(colorIncorrect) ? colorIncorrect : "???"} incorrect pixels. Completed: ${colorPercent}` }).buildElement().buildElement().buildElement();
    }
    colorList.buildOverlay(parentElement);
  };
  /** Sorts the color list & hides unused colors
   * @param {string} sortPrimary - The name of the dataset attribute to sort by.
   * @param {string} sortSecondary - Secondary sort. It can be either 'ascending' or 'descending'.
   * @param {boolean} showUnused - Should unused colors be displayed in the list to the user?
   * @since 0.88.222
   */
  sortColorList_fn = function(sortPrimary, sortSecondary, showUnused) {
    const colorList = document.querySelector(".bm-filter-flex");
    const colors = Array.from(colorList.children);
    colors.sort((index, nextIndex) => {
      const indexValue = index.getAttribute("data-" + sortPrimary);
      const nextIndexValue = nextIndex.getAttribute("data-" + sortPrimary);
      const indexValueNumber = parseFloat(indexValue);
      const nextIndexValueNumber = parseFloat(nextIndexValue);
      const indexValueNumberIsNumber = !isNaN(indexValueNumber);
      const nextIndexValueNumberIsNumber = !isNaN(nextIndexValueNumber);
      if (showUnused) {
        index.classList.remove("bm-color-hide");
      } else if (!Number(index.getAttribute("data-total"))) {
        index.classList.add("bm-color-hide");
      }
      if (indexValueNumberIsNumber && nextIndexValueNumberIsNumber) {
        return sortSecondary === "ascending" ? indexValueNumber - nextIndexValueNumber : nextIndexValueNumber - indexValueNumber;
      } else {
        const indexValueString = indexValue.toLowerCase();
        const nextIndexValueString = nextIndexValue.toLowerCase();
        if (indexValueString < nextIndexValueString) return sortSecondary === "ascending" ? -1 : 1;
        if (indexValueString > nextIndexValueString) return sortSecondary === "ascending" ? 1 : -1;
        return 0;
      }
    });
    colors.forEach((color) => colorList.appendChild(color));
  };
  /** (Un)selects all colors in the color list that are visible to the user.
   * @param {boolean} userWantsUnselect - Does the user want to unselect colors?
   * @since 0.88.222
   */
  selectColorList_fn = function(userWantsUnselect) {
    const colorList = document.querySelector(".bm-filter-flex");
    const colors = Array.from(colorList.children);
    for (const color of colors) {
      if (color.classList?.contains("bm-color-hide")) {
        continue;
      }
      const button = color.querySelector(".bm-filter-container-rgb button");
      if (button.dataset["state"] == "hidden" && !userWantsUnselect) {
        continue;
      }
      if (button.dataset["state"] == "shown" && userWantsUnselect) {
        continue;
      }
      button.click();
    }
  };

  // src/WindowMain.js
  var _WindowMain_instances, buildWindowFilter_fn, coordinateInputPaste_fn;
  var WindowMain = class extends Overlay {
    /** Constructor for the main Blue Marble window
     * @param {string} name - The name of the userscript
     * @param {string} version - The version of the userscript
     * @since 0.88.326
     * @see {@link Overlay#constructor}
     */
    constructor(name2, version2) {
      super(name2, version2);
      __privateAdd(this, _WindowMain_instances);
      this.window = null;
      this.windowID = "bm-window-main";
      this.windowParent = document.body;
    }
    /** Creates the main Blue Marble window.
     * Parent/child relationships in the DOM structure below are indicated by indentation.
     * @since 0.58.3
     */
    buildWindow() {
      if (document.querySelector(`#${this.windowID}`)) {
        this.handleDisplayError("Main window already exists!");
        return;
      }
      this.window = this.addDiv({ "id": this.windowID, "class": "bm-window", "style": "top: 10px; left: unset; right: 75px;" }).addDragbar().addButton({ "class": "bm-button-circle", "textContent": "\u25BC", "aria-label": 'Minimize window "Blue Marble"', "data-button-status": "expanded" }, (instance, button) => {
        button.onclick = () => instance.handleMinimization(button);
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().addDiv().buildElement().buildElement().addDiv({ "class": "bm-window-content" }).addDiv({ "class": "bm-container" }).addImg({ "class": "bm-favicon", "src": "https://raw.githubusercontent.com/SwingTheVine/Wplace-BlueMarble/main/dist/assets/Favicon.png" }, (instance, img) => {
        const date = /* @__PURE__ */ new Date();
        const dayOfTheYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1)) / (1e3 * 60 * 60 * 24)) + 1;
        if (dayOfTheYear == 204) {
          img.parentNode.style.position = "relative";
          img.parentNode.innerHTML = img.parentNode.innerHTML + `<svg viewBox="0 0 9 7" width="2em" height="2em" style="position: absolute; top: -.75em; left: 3.25ch;"><path d="M0,3L9,0L2,7" fill="#0af"/><path d="M0,3A.4,.4 0 1 1 1,5" fill="#a00"/><path d="M1.5,6A1,1 0 0 1 3,6L2,7" fill="#a0f"/><path d="M4,5A.6,.6 0 1 1 5,4" fill="#0a0"/><path d="M6,3A.8,.8 0 1 1 7,2" fill="#fa0"/><path d="M4.5,1.5A1,1 0 0 1 3,2" fill="#aa0"/></svg>`;
          img.onload = () => {
            const confettiManager = new ConfettiManager();
            confettiManager.createConfetti(document.querySelector(`#${this.windowID}`));
          };
        }
      }).buildElement().addHeader(1, { "textContent": this.name }).buildElement().buildElement().addHr().buildElement().addDiv({ "class": "bm-container" }).addSpan({ "id": "bm-user-droplets", "textContent": "Droplets:" }).buildElement().addBr().buildElement().addSpan({ "id": "bm-user-nextlevel", "textContent": "Next level in..." }).buildElement().addBr().buildElement().addSpan({ "textContent": "Charges: " }).addTimer(Date.now(), 1e3, { "style": "font-weight: 700;" }, (instance, timer) => {
        instance.apiManager.chargeRefillTimerID = timer.id;
      }).buildElement().buildElement().buildElement().addHr().buildElement().addDiv({ "class": "bm-container" }).addDiv({ "class": "bm-container" }).addButton(
        { "class": "bm-button-circle bm-button-pin", "style": "margin-top: 0;", "innerHTML": '<svg viewBox="0 0 4 6"><path d="M.5,3.4A2,2 0 1 1 3.5,3.4L2,6"/><circle cx="2" cy="2" r=".7" fill="#fff"/></svg>' },
        (instance, button) => {
          button.onclick = () => {
            const coords2 = instance.apiManager?.coordsTilePixel;
            if (!coords2?.[0]) {
              instance.handleDisplayError("Coordinates are malformed! Did you try clicking on the canvas first?");
              return;
            }
            instance.updateInnerHTML("bm-input-tx", coords2?.[0] || "");
            instance.updateInnerHTML("bm-input-ty", coords2?.[1] || "");
            instance.updateInnerHTML("bm-input-px", coords2?.[2] || "");
            instance.updateInnerHTML("bm-input-py", coords2?.[3] || "");
          };
        }
      ).buildElement().addInput({ "type": "number", "id": "bm-input-tx", "class": "bm-input-coords", "placeholder": "Tl X", "min": 0, "max": 2047, "step": 1, "required": true }, (instance, input) => {
        input.addEventListener("paste", (event) => __privateMethod(this, _WindowMain_instances, coordinateInputPaste_fn).call(this, instance, input, event));
      }).buildElement().addInput({ "type": "number", "id": "bm-input-ty", "class": "bm-input-coords", "placeholder": "Tl Y", "min": 0, "max": 2047, "step": 1, "required": true }, (instance, input) => {
        input.addEventListener("paste", (event) => __privateMethod(this, _WindowMain_instances, coordinateInputPaste_fn).call(this, instance, input, event));
      }).buildElement().addInput({ "type": "number", "id": "bm-input-px", "class": "bm-input-coords", "placeholder": "Px X", "min": 0, "max": 2047, "step": 1, "required": true }, (instance, input) => {
        input.addEventListener("paste", (event) => __privateMethod(this, _WindowMain_instances, coordinateInputPaste_fn).call(this, instance, input, event));
      }).buildElement().addInput({ "type": "number", "id": "bm-input-py", "class": "bm-input-coords", "placeholder": "Px Y", "min": 0, "max": 2047, "step": 1, "required": true }, (instance, input) => {
        input.addEventListener("paste", (event) => __privateMethod(this, _WindowMain_instances, coordinateInputPaste_fn).call(this, instance, input, event));
      }).buildElement().buildElement().addDiv({ "class": "bm-container" }).addInputFile({ "class": "bm-input-file", "textContent": "Upload Template", "accept": "image/png, image/jpeg, image/webp, image/bmp, image/gif" }).buildElement().buildElement().addDiv({ "class": "bm-container bm-flex-between" }).addButton({ "textContent": "Disable", "data-button-status": "shown" }, (instance, button) => {
        button.onclick = () => {
          button.disabled = true;
          if (button.dataset["buttonStatus"] == "shown") {
            instance.apiManager?.templateManager?.setTemplatesShouldBeDrawn(false);
            button.dataset["buttonStatus"] = "hidden";
            button.textContent = "Enable";
            instance.handleDisplayStatus(`Disabled templates!`);
          } else {
            instance.apiManager?.templateManager?.setTemplatesShouldBeDrawn(true);
            button.dataset["buttonStatus"] = "shown";
            button.textContent = "Disable";
            instance.handleDisplayStatus(`Enabled templates!`);
          }
          button.disabled = false;
        };
      }).buildElement().addButton({ "textContent": "Create" }, (instance, button) => {
        button.onclick = () => {
          const input = document.querySelector(`#${this.windowID} .bm-input-file`);
          const coordTlX = document.querySelector("#bm-input-tx");
          if (!coordTlX.checkValidity()) {
            coordTlX.reportValidity();
            instance.handleDisplayError("Coordinates are malformed! Did you try clicking on the canvas first?");
            return;
          }
          const coordTlY = document.querySelector("#bm-input-ty");
          if (!coordTlY.checkValidity()) {
            coordTlY.reportValidity();
            instance.handleDisplayError("Coordinates are malformed! Did you try clicking on the canvas first?");
            return;
          }
          const coordPxX = document.querySelector("#bm-input-px");
          if (!coordPxX.checkValidity()) {
            coordPxX.reportValidity();
            instance.handleDisplayError("Coordinates are malformed! Did you try clicking on the canvas first?");
            return;
          }
          const coordPxY = document.querySelector("#bm-input-py");
          if (!coordPxY.checkValidity()) {
            coordPxY.reportValidity();
            instance.handleDisplayError("Coordinates are malformed! Did you try clicking on the canvas first?");
            return;
          }
          if (!input?.files[0]) {
            instance.handleDisplayError(`No file selected!`);
            return;
          }
          instance?.apiManager?.templateManager.createTemplate(input.files[0], input.files[0]?.name.replace(/\.[^/.]+$/, ""), [Number(coordTlX.value), Number(coordTlY.value), Number(coordPxX.value), Number(coordPxY.value)]);
          instance.handleDisplayStatus(`Drew to canvas!`);
        };
      }).buildElement().addButton({ "textContent": "Filter" }, (instance, button) => {
        button.onclick = () => __privateMethod(this, _WindowMain_instances, buildWindowFilter_fn).call(this);
      }).buildElement().buildElement().addDiv({ "class": "bm-container" }).addTextarea({ "id": this.outputStatusId, "placeholder": `Status: Sleeping...
Version: ${this.version}`, "readOnly": true }).buildElement().buildElement().addDiv({ "class": "bm-container bm-flex-between", "style": "margin-bottom: 0;" }).addDiv({ "class": "bm-flex-between" }).addButton({ "class": "bm-button-circle", "innerHTML": "\u{1F3A8}", "title": "Template Color Converter" }, (instance, button) => {
        button.onclick = () => {
          window.open("https://pepoafonso.github.io/color_converter_wplace/", "_blank", "noopener noreferrer");
        };
      }).buildElement().addButton({ "class": "bm-button-circle", "innerHTML": "\u{1F310}", "title": "Official Blue Marble Website" }, (instance, button) => {
        button.onclick = () => {
          window.open("https://bluemarble.lol/", "_blank", "noopener noreferrer");
        };
      }).buildElement().buildElement().addSmall({ "textContent": "Made by SwingTheVine", "style": "margin-top: auto;" }).buildElement().buildElement().buildElement().buildElement().buildElement().buildOverlay(this.windowParent);
      this.handleDrag(`#${this.windowID}.bm-window`, `#${this.windowID} .bm-dragbar`);
    }
  };
  _WindowMain_instances = new WeakSet();
  /** Displays a new color filter window.
   * This is a helper function that creates a new class instance.
   * This might cause a memory leak. I pray that this is not the case...
   * @since 0.88.330
   */
  buildWindowFilter_fn = function() {
    const windowFilter = new WindowFilter(this);
    windowFilter.buildWindow();
  };
  coordinateInputPaste_fn = async function(instance, input, event) {
    event.preventDefault();
    const data = await getClipboardData(event);
    const coords2 = data.split(/[^a-zA-Z0-9]+/).filter((index) => index).map(Number).filter(
      (number) => !isNaN(number)
      // Removes NaN `[4]`
    );
    if (coords2.length == 2 && input.id == "bm-input-px") {
      instance.updateInnerHTML("bm-input-px", coords2?.[0] || "");
      instance.updateInnerHTML("bm-input-py", coords2?.[1] || "");
    } else if (coords2.length == 1) {
      instance.updateInnerHTML(input.id, coords2?.[0] || "");
    } else {
      instance.updateInnerHTML("bm-input-tx", coords2?.[0] || "");
      instance.updateInnerHTML("bm-input-ty", coords2?.[1] || "");
      instance.updateInnerHTML("bm-input-px", coords2?.[2] || "");
      instance.updateInnerHTML("bm-input-py", coords2?.[3] || "");
    }
  };

  // src/WindowTelemetry.js
  var _WindowTelemetry_instances, setTelemetryValue_fn;
  var WindowTelemetry = class extends Overlay {
    /** Constructor for the telemetry window
     * @param {string} name - The name of the userscript
     * @param {string} version - The version of the userscript
     * @param {number} currentTelemetryVersion - The current "version" of the data collection agreement
     * @param {string} uuid - The UUID of the user
     * @since 0.88.339
     * @see {@link Overlay#constructor}
     */
    constructor(name2, version2, currentTelemetryVersion2, uuid) {
      super(name2, version2);
      __privateAdd(this, _WindowTelemetry_instances);
      this.window = null;
      this.windowID = "bm-window-telemetry";
      this.windowParent = document.body;
      this.currentTelemetryVersion = currentTelemetryVersion2;
      this.uuid = uuid;
    }
    /** Spawns a telemetry window.
     * If another telemetry window already exists, we DON'T spawn another!
     * Parent/child relationships in the DOM structure below are indicated by indentation.
     * @since 0.88.339
     */
    async buildWindow() {
      if (document.querySelector(`#${this.windowID}`)) {
        this.handleDisplayError("Telemetry window already exists!");
        return;
      }
      const browser = await this.apiManager.getBrowserFromUA(navigator.userAgent);
      const os = this.apiManager.getOS(navigator.userAgent);
      this.window = this.addDiv({ "id": this.windowID, "class": "bm-window", "style": "height: 80vh; z-index: 9998;" }).addDiv({ "class": "bm-window-content" }).addDiv({ "class": "bm-container bm-center-vertically" }).addHeader(1, { "textContent": `${this.name} Telemetry` }).buildElement().buildElement().addHr().buildElement().addDiv({ "class": "bm-container bm-flex-center", "style": "gap: 1.5ch; flex-wrap: wrap;" }).addButton({ "textContent": "Enable Telemetry" }, (instance, button) => {
        button.onclick = () => {
          __privateMethod(this, _WindowTelemetry_instances, setTelemetryValue_fn).call(this, this.currentTelemetryVersion);
          const element = document.getElementById(this.windowID);
          element?.remove();
        };
      }).buildElement().addButton({ "textContent": "Disable Telemetry" }, (instance, button) => {
        button.onclick = () => {
          __privateMethod(this, _WindowTelemetry_instances, setTelemetryValue_fn).call(this, 0);
          const element = document.getElementById(this.windowID);
          element?.remove();
        };
      }).buildElement().addButton({ "textContent": "More Information" }, (instance, button) => {
        button.onclick = () => {
          window.open("https://github.com/SwingTheVine/Wplace-TelemetryServer#telemetry-data", "_blank", "noopener noreferrer");
        };
      }).buildElement().buildElement().addDiv({ "class": "bm-container bm-scrollable" }).addDiv({ "class": "bm-container" }).addHeader(2, { "textContent": "Legal" }).buildElement().addP({ "textContent": `We collect anonymous telemetry data such as your browser, OS, and script version to make the experience better for everyone. The data is never shared personally. The data is never sold. You can turn this off by pressing the "Disable" button, but keeping it on helps us improve features and reliability faster. Thank you for supporting ${this.name}!` }).buildElement().buildElement().addHr().buildElement().addDiv({ "class": "bm-container" }).addHeader(2, { "textContent": "Non-Legal Summary" }).buildElement().addP({ "innerHTML": `You can disable telemetry by pressing the "Disable" button. If you would like to read more about what information we collect, press the "More Information" button.<br>This is the data <em>stored</em> on our servers:` }).buildElement().addUl().addLi({ "innerHTML": `A unique identifier (UUIDv4) generated by Blue Marble. This enables our telemetry to function without tracking your actual user ID.<br>Your UUID is: <b>${escapeHTML(this.uuid)}</b>` }).buildElement().addLi({ "innerHTML": `The version of Blue Marble you are using.<br>Your version is: <b>${escapeHTML(this.version)}</b>` }).buildElement().addLi({ "innerHTML": `Your browser type, which is used to determine Blue Marble outages and browser popularity.<br>Your browser type is: <b>${escapeHTML(browser)}</b>` }).buildElement().addLi({ "innerHTML": `Your OS type, which is used to determine Blue Marble outages and OS popularity.<br>Your OS type is: <b>${escapeHTML(os)}</b>` }).buildElement().addLi({ "innerHTML": `The date and time that Blue Marble sent the telemetry information.` }).buildElement().buildElement().addP({ "innerHTML": `All of the data mentioned above is <b>aggregated every hour</b>. This means every hour, anything that could even remotly be considered "personal data" is deleted from our server. Here, "aggregated" data means things like "42 people used Blue Marble on Google Chrome this hour", which can't be used to identify anyone in particular.` }).buildElement().buildElement().buildElement().buildElement().buildElement().buildOverlay(this.windowParent);
    }
  };
  _WindowTelemetry_instances = new WeakSet();
  /** Enables or disables telemetry based on the value passed in.
   * A value of zero will always disable telemetry.
   * A numeric, non-zero value will enable telemetry until the telemetry agreement is changed.
   * @param {number} value - The value to set the telemetry to
   * @since 0.88.339
   */
  setTelemetryValue_fn = function(value) {
    const userSettings2 = JSON.parse(GM_getValue("bmUserSettings", "{}"));
    userSettings2.telemetry = value;
    GM.setValue("bmUserSettings", JSON.stringify(userSettings2));
  };

  // src/main.js
  var name = GM_info.script.name.toString();
  var version = GM_info.script.version.toString();
  var consoleStyle = "color: cornflowerblue;";
  function inject(callback) {
    const script = document.createElement("script");
    script.setAttribute("bm-name", name);
    script.setAttribute("bm-cStyle", consoleStyle);
    script.textContent = `(${callback})();`;
    document.documentElement?.appendChild(script);
    script.remove();
  }
  inject(() => {
    const script = document.currentScript;
    const name2 = script?.getAttribute("bm-name") || "Blue Marble";
    const consoleStyle2 = script?.getAttribute("bm-cStyle") || "";
    const fetchedBlobQueue = /* @__PURE__ */ new Map();
    window.addEventListener("message", (event) => {
      const { source, endpoint, blobID, blobData, blink } = event.data;
      const elapsed = Date.now() - blink;
      console.groupCollapsed(`%c${name2}%c: ${fetchedBlobQueue.size} Recieved IMAGE message about blob "${blobID}"`, consoleStyle2, "");
      console.log(`Blob fetch took %c${String(Math.floor(elapsed / 6e4)).padStart(2, "0")}:${String(Math.floor(elapsed / 1e3) % 60).padStart(2, "0")}.${String(elapsed % 1e3).padStart(3, "0")}%c MM:SS.mmm`, consoleStyle2, "");
      console.log(fetchedBlobQueue);
      console.groupEnd();
      if (source == "blue-marble" && !!blobID && !!blobData && !endpoint) {
        const callback = fetchedBlobQueue.get(blobID);
        if (typeof callback === "function") {
          callback(blobData);
        } else {
          consoleWarn(`%c${name2}%c: Attempted to retrieve a blob (%s) from queue, but the blobID was not a function! Skipping...`, consoleStyle2, "", blobID);
        }
        fetchedBlobQueue.delete(blobID);
      }
    });
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      const cloned = response.clone();
      const endpointName = (args[0] instanceof Request ? args[0]?.url : args[0]) || "ignore";
      const contentType = cloned.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        console.log(`%c${name2}%c: Sending JSON message about endpoint "${endpointName}"`, consoleStyle2, "");
        cloned.json().then((jsonData) => {
          window.postMessage({
            source: "blue-marble",
            endpoint: endpointName,
            jsonData
          }, "*");
        }).catch((err) => {
          console.error(`%c${name2}%c: Failed to parse JSON: `, consoleStyle2, "", err);
        });
      } else if (contentType.includes("image/") && (!endpointName.includes("openfreemap") && !endpointName.includes("maps"))) {
        const blink = Date.now();
        const blob = await cloned.blob();
        console.log(`%c${name2}%c: ${fetchedBlobQueue.size} Sending IMAGE message about endpoint "${endpointName}"`, consoleStyle2, "");
        return new Promise((resolve) => {
          const blobUUID = crypto.randomUUID();
          fetchedBlobQueue.set(blobUUID, (blobProcessed) => {
            resolve(new Response(blobProcessed, {
              headers: cloned.headers,
              status: cloned.status,
              statusText: cloned.statusText
            }));
            console.log(`%c${name2}%c: ${fetchedBlobQueue.size} Processed blob "${blobUUID}"`, consoleStyle2, "");
          });
          window.postMessage({
            source: "blue-marble",
            endpoint: endpointName,
            blobID: blobUUID,
            blobData: blob,
            blink
          });
        }).catch((exception) => {
          const elapsed = Date.now();
          console.error(`%c${name2}%c: Failed to Promise blob!`, consoleStyle2, "");
          console.groupCollapsed(`%c${name2}%c: Details of failed blob Promise:`, consoleStyle2, "");
          console.log(`Endpoint: ${endpointName}
There are ${fetchedBlobQueue.size} blobs processing...
Blink: ${blink.toLocaleString()}
Time Since Blink: ${String(Math.floor(elapsed / 6e4)).padStart(2, "0")}:${String(Math.floor(elapsed / 1e3) % 60).padStart(2, "0")}.${String(elapsed % 1e3).padStart(3, "0")} MM:SS.mmm`);
          console.error(`Exception stack:`, exception);
          console.groupEnd();
        });
      }
      return response;
    };
  });
  var cssOverlay = GM_getResourceText("CSS-BM-File");
  GM_addStyle(cssOverlay);
  var robotoMonoInjectionPoint = "robotoMonoInjectionPoint";
  if (!!(robotoMonoInjectionPoint.indexOf("@font-face") + 1)) {
    console.log(`Loading Roboto Mono as a file...`);
    GM_addStyle(robotoMonoInjectionPoint);
  } else {
    stylesheetLink = document.createElement("link");
    stylesheetLink.href = "https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap";
    stylesheetLink.rel = "preload";
    stylesheetLink.as = "style";
    stylesheetLink.onload = function() {
      this.onload = null;
      this.rel = "stylesheet";
    };
    document.head?.appendChild(stylesheetLink);
  }
  var stylesheetLink;
  var observers = new Observers();
  var windowMain = new WindowMain(name, version);
  var templateManager = new TemplateManager(name, version, windowMain);
  var apiManager = new ApiManager(templateManager);
  windowMain.setApiManager(apiManager);
  var storageTemplates = JSON.parse(GM_getValue("bmTemplates", "{}"));
  console.log(storageTemplates);
  templateManager.importJSON(storageTemplates);
  var userSettings = JSON.parse(GM_getValue("bmUserSettings", "{}"));
  console.log(userSettings);
  console.log(Object.keys(userSettings).length);
  if (Object.keys(userSettings).length == 0) {
    const uuid = crypto.randomUUID();
    console.log(uuid);
    GM.setValue("bmUserSettings", JSON.stringify({
      "uuid": uuid
    }));
  }
  setInterval(() => apiManager.sendHeartbeat(version), 1e3 * 60 * 30);
  var currentTelemetryVersion = 1;
  var previousTelemetryVersion = userSettings?.telemetry;
  console.log(`Telemetry is ${!(previousTelemetryVersion == void 0)}`);
  if (previousTelemetryVersion == void 0 || previousTelemetryVersion > currentTelemetryVersion) {
    const windowTelemetry = new WindowTelemetry(name, version, currentTelemetryVersion, userSettings?.uuid);
    windowTelemetry.setApiManager(apiManager);
    windowTelemetry.buildWindow();
  }
  windowMain.buildWindow();
  apiManager.spontaneousResponseListener(windowMain);
  observeBlack();
  consoleLog(`%c${name}%c (${version}) userscript has loaded!`, "color: cornflowerblue;", "");
  function observeBlack() {
    const observer = new MutationObserver((mutations, observer2) => {
      const black = document.querySelector("#color-1");
      if (!black) {
        return;
      }
      let move = document.querySelector("#bm-button-move");
      if (!move) {
        move = document.createElement("button");
        move.id = "bm-button-move";
        move.textContent = "Move \u2191";
        move.className = "btn btn-soft";
        move.onclick = function() {
          const roundedBox = this.parentNode.parentNode.parentNode.parentNode;
          const shouldMoveUp = this.textContent == "Move \u2191";
          roundedBox.parentNode.className = roundedBox.parentNode.className.replace(shouldMoveUp ? "bottom" : "top", shouldMoveUp ? "top" : "bottom");
          roundedBox.style.borderTopLeftRadius = shouldMoveUp ? "0px" : "var(--radius-box)";
          roundedBox.style.borderTopRightRadius = shouldMoveUp ? "0px" : "var(--radius-box)";
          roundedBox.style.borderBottomLeftRadius = shouldMoveUp ? "var(--radius-box)" : "0px";
          roundedBox.style.borderBottomRightRadius = shouldMoveUp ? "var(--radius-box)" : "0px";
          this.textContent = shouldMoveUp ? "Move \u2193" : "Move \u2191";
        };
        const paintPixel = black.parentNode.parentNode.parentNode.parentNode.querySelector("h2");
        paintPixel.parentNode?.appendChild(move);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
