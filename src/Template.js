import { consoleCSS, sleep, uint8ToBase64, viewCanvasInNewTab } from "./utils";

/** An instance of a template.
 * Handles all mathematics, manipulation, and analysis regarding a single template.
 * @class Template
 * @since 0.65.2
 */
export default class Template {

  /** The constructor for the {@link Template} class with enhanced pixel tracking.
   * @param {Object} [params={}] - Object containing all optional parameters
   * @param {string} [params.displayName='My template'] - The display name of the template
   * @param {number} [params.sortID=0] - The sort number of the template for rendering priority
   * @param {string} [params.authorID=''] - The user ID of the person who exported the template (prevents sort ID collisions)
   * @param {string} [params.url=''] - The URL to the source image
   * @param {File} [params.file=null] - The template file (pre-processed File or processed bitmap)
   * @param {Array<number, number, number, number>} [params.coords=null] - The coordinates of the top left corner as (tileX, tileY, pixelX, pixelY)
   * @param {Object} [params.chunked=null] - The affected chunks of the template, and their template for each chunk as a bitmap
   * @param {Object} [params.chunked32={}] - The affected chunks of the template, and their template for each chunk as a Uint32Array
   * @param {number} [params.tileSize=1000] - The size of a tile in pixels (assumes square tiles)
   * @param {Object} [params.pixelCount={total:0, colors:Map}] - Total number of pixels in the template (calculated automatically during processing)
   * @param {string} [params.scriptName='Template'] - The name of the userscript
   * @since 0.65.2
   */
  constructor({
    displayName = 'My template',
    sortID = 0,
    authorID = '',
    url = '',
    file = null,
    coords = null,
    chunked = null,
    chunked32 = {},
    tileSize = 1000,
    pixelCount = { total: 0, colors: new Map() },
    scriptName = 'Template',
  } = {}) {
    this.displayName = displayName;
    this.sortID = sortID;
    this.authorID = authorID;
    this.url = url;
    this.file = file;
    this.coords = coords;
    this.chunked = chunked;
    this.chunked32 = chunked32;
    this.tileSize = tileSize;
    /** Total pixel count in template @type {{total: number, colors: Map<number, number>, correct?: { [key: string]: Map<number, number> }}} */
    this.pixelCount = pixelCount;
    this.scriptName = scriptName;

    this.shouldSkipTransTiles = true; // Should transparent template tiles be skipped during template creation?
    this.shouldAggSkipTransTiles = false; // Should transparent template tiles be aggressively skipped during tempalte creation?
  }

  /** Creates chunks of the template for each tile.
   * @param {Number} tileSize - Size of the tile as determined by templateManager
   * @param {Object} paletteBM - An collection of Uint32Arrays containing the palette BM uses
   * @param {boolean} shouldSkipTransTiles - Should transparent tiles be skipped over when creating the template?
   * @param {boolean} shouldAggSkipTransTiles - Should transparent tiles be aggressively skipped over when creating the template?
   * @returns {Object} Collection of template bitmaps & buffers organized by tile coordinates
   * @since 0.65.4
   */
  async createTemplateTiles(tileSize, paletteBM, shouldSkipTransTiles, shouldAggSkipTransTiles) {
    console.info(`%c${this.scriptName}%c: Creating template tiles at coordinates: `, consoleCSS.BLUE, consoleCSS.RESET, this.coords);

    // Updates the class instance variable with the new information
    this.shouldSkipTransTiles = shouldSkipTransTiles;
    this.shouldAggSkipTransTiles = shouldAggSkipTransTiles;

    const shredSize = 3; // Scale image factor for pixel art enhancement (must be odd)
    const bitmap = await createImageBitmap(this.file); // Create efficient bitmap from uploaded file
    const imageWidth = bitmap.width;
    const imageHeight = bitmap.height;

    this.tileSize = tileSize; // Tile size predetermined by the templateManager

    const templateTiles = {}; // Holds the template tiles
    const templateTilesBuffers = {}; // Holds the buffers of the template tiles

    // The main canvas used during template creation
    const canvas = new OffscreenCanvas(this.tileSize, this.tileSize);
    const context = canvas.getContext('2d', { willReadFrequently: true });

    // The canvas used to check if a specific template tile is transparent or not
    const transCanvas = new OffscreenCanvas(this.tileSize, this.tileSize);
    const transContext = transCanvas.getContext('2d', { willReadFrequently: true });

    // Makes it so that `.drawImage()` calls on the canvas used to calculate transparency always draw below what is already on the canvas
    transContext.globalCompositeOperation = "destination-over";
  
    // Prep the canvas for drawing the entire template (so we can find total pixels)
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    context.imageSmoothingEnabled = false; // Nearest neighbor

    context.drawImage(bitmap, 0, 0); // Draws the template to the canvas

    let timer = Date.now();
    const totalPixelMap = this.#calculateTotalPixelsFromImageData(context.getImageData(0, 0, imageWidth, imageHeight), paletteBM); // Calculates total pixels from the template buffer retrieved from the canvas context image data
    console.debug(`%c${this.scriptName}%c: Calculating total pixels for template "%c${this.displayName}%c" took %c${(Date.now() - timer) / 1000.0}%c seconds`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET);

    let totalPixels = 0; // Will store the total amount of non-Transparent color pixels
    const transparentColorID = 0; // Color ID for the Transparent color

    // For each color in the total pixel Map...
    for (const [color, total] of totalPixelMap) {

      if (color == transparentColorID) {continue;} // Skip Transparent color

      totalPixels += total; // Adds the total amount for the pixel color to the total amount for all colors
    }

    this.pixelCount = { total: totalPixels, colors: totalPixelMap }; // Stores the total pixel count in the Template instance

    timer = Date.now();

    // Creates a mask where the middle pixel is white, and everything else is transparent
    const canvasMask = new OffscreenCanvas(3, 3);
    const contextMask = canvasMask.getContext("2d");
    contextMask.clearRect(0, 0, 3, 3);
    contextMask.fillStyle = "white";
    contextMask.fillRect(1, 1, 1, 1);

    // For every tile...
    for (let pixelY = this.coords[3]; pixelY < imageHeight + this.coords[3];) {

      // Draws the partial tile first, if any
      // This calculates the size based on which is smaller:
      // A. The top left corner of the current tile to the bottom right corner of the current tile
      // B. The top left corner of the current tile to the bottom right corner of the image
      const drawSizeY = Math.min(this.tileSize - (pixelY % this.tileSize), imageHeight - (pixelY - this.coords[3]));

      console.debug(`%c${this.scriptName}%c: Template "%c${this.displayName}%c" draw size Y: Math.min(${this.tileSize} - (${pixelY} % ${this.tileSize}), ${imageHeight} - (${pixelY - this.coords[3]}))`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET);

      for (let pixelX = this.coords[2]; pixelX < imageWidth + this.coords[2];) {

        console.debug(`%c${this.scriptName}%c: Template "%c${this.displayName}%c"\nPixel X: %c${pixelX}%c\nPixel Y: %c${pixelY}%c`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET);

        // Draws the partial tile first, if any
        // This calculates the size based on which is smaller:
        // A. The top left corner of the current tile to the bottom right corner of the current tile
        // B. The top left corner of the current tile to the bottom right corner of the image
        const drawSizeX = Math.min(this.tileSize - (pixelX % this.tileSize), imageWidth - (pixelX - this.coords[2]));

        // If the user wants to skip any tiles where the template is transparent...
        if (shouldSkipTransTiles) {

          // Detects if the canvas is fully transparent
          const isTemplateTileTransparent = !this.calculateCanvasTransparency({
            bitmap: bitmap,
            bitmapParams: [pixelX - this.coords[2], pixelY - this.coords[3], drawSizeX, drawSizeY], // Top left X, Top left Y, Width, Height
            transCanvas: transCanvas,
            transContext: transContext
          });

          if (!isTemplateTileTransparent) {
            console.debug(`%c${this.scriptName}%c: Tile (%c${this.coords[0]}%c, %c${this.coords[1]}%c) contains template "%c${this.displayName}%c"`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET);
          }

          // If the template in this tile is transparent...
          if (isTemplateTileTransparent) {
            pixelX += drawSizeX; // If you remove this, it will get stuck forever processing the template
            continue; // ...the user does not want to save this tile, so we skip to the next tile
          }
        }
        
        console.debug(`%c${this.scriptName}%c: Template "%c${this.displayName}%c" draw size X: Math.min(${this.tileSize} - (${pixelX} % ${this.tileSize}), ${imageWidth} - (${pixelX - this.coords[2]}))`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET);

        // Change the canvas size and wipe the canvas
        const canvasWidth = drawSizeX * shredSize;// + (pixelX % this.tileSize) * shredSize;
        const canvasHeight = drawSizeY * shredSize;// + (pixelY % this.tileSize) * shredSize;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        console.debug(`%c${this.scriptName}%c: Template "%c${this.displayName}%c"\nDraw Size X: %c${drawSizeX}%c\nDraw Size Y: %c${drawSizeY}%c\nCanvas Width: %c${canvasWidth}%c\nCanvas Height: %c${canvasHeight}%c`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET);

        context.imageSmoothingEnabled = false; // Nearest neighbor

        console.debug(`%c${this.scriptName}%c: Template "%c${this.displayName}%c"\nGetting X %c${pixelX}%c-%c${pixelX + drawSizeX}%c\nGetting Y %c${pixelY}%c-%c${pixelY + drawSizeY}%c`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET);

        // Draws the template segment on this tile segment
        context.clearRect(0, 0, canvasWidth, canvasHeight); // Clear any previous drawing (only runs when canvas size does not change)
        context.drawImage(
          bitmap, // Bitmap image to draw
          pixelX - this.coords[2], // Coordinate X to draw *from*
          pixelY - this.coords[3], // Coordinate Y to draw *from*
          drawSizeX, // X width to draw *from*
          drawSizeY, // Y height to draw *from*
          0, // Coordinate X to draw *at*
          0, // Coordinate Y to draw *at*
          drawSizeX * shredSize, // X width to draw *at*
          drawSizeY * shredSize // Y height to draw *at*
        ); // Coordinates and size of draw area of source image, then canvas

        context.save(); // Saves the current context of the canvas
        context.globalCompositeOperation = "destination-in"; // The existing canvas content is kept where both the new shape and existing canvas content overlap. Everything else is made transparent.
        // For our purposes, this means any non-transparent pixels on the mask will be kept

        console.debug(`%c${this.scriptName}%c: User Settings:\nShould Skip: %c${shouldSkipTransTiles}%c;\nShould Agg Skip: %c${shouldAggSkipTransTiles}%c`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET);

        // Fills the canvas with the mask
        context.fillStyle = context.createPattern(canvasMask, "repeat");
        context.fillRect(0, 0, canvasWidth, canvasHeight);

        context.restore(); // Restores the context of the canvas to the previous save

        const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight); // Data of the image on the canvas

        console.debug(`%c${this.scriptName}%c: Shreded pixels for %c${pixelX}%c, %c${pixelY}%c on template "%c${this.displayName}%c". Image data: `, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, imageData);

        // Creates the "0000,0000,000,000" key name
        const templateTileName = `${
          (this.coords[0] + Math.floor(pixelX / 1000)).toString().padStart(4, '0')},${
          (this.coords[1] + Math.floor(pixelY / 1000)).toString().padStart(4, '0')},${
          (pixelX % 1000).toString().padStart(3, '0')},${
          (pixelY % 1000).toString().padStart(3, '0')
        }`;

        this.chunked32[templateTileName] = new Uint32Array(imageData.data.buffer); // Creates the Uint32Array

        templateTiles[templateTileName] = await createImageBitmap(canvas); // Creates the bitmap
        
        const canvasBlob = await canvas.convertToBlob();
        const canvasBuffer = await canvasBlob.arrayBuffer();
        const canvasBufferBytes = Array.from(new Uint8Array(canvasBuffer));
        templateTilesBuffers[templateTileName] = uint8ToBase64(canvasBufferBytes); // Stores the buffer

        console.debug(`%c${this.scriptName}%c: Value of %ctemplateTiles%c for template "%c${this.displayName}%c": `, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, templateTiles);

        pixelX += drawSizeX;
      }

      pixelY += drawSizeY;
    }

    console.debug(`%c${this.scriptName}%c: Parsing template "%c${this.displayName}%c" took %c${(Date.now() - timer) / 1000.0}%c seconds!`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET);
    console.debug(`%c${this.scriptName}%c: Template "%c${this.displayName}%c" Tiles: `, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, templateTiles);
    console.debug(`%c${this.scriptName}%c: Template "%c${this.displayName}%c" Tiles Buffers: `, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, templateTilesBuffers);
    console.debug(`%c${this.scriptName}%c: Template "%c${this.displayName}%c" Tiles Uint32Array: `, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, this.chunked32);
    return { templateTiles, templateTilesBuffers };
  }

  /** Detects if the canvas is transparent.
   * @param {Object} param - Object that contains the parameters for the function
   * @param {ImageBitmap} param.bitmap - The bitmap template image
   * @param {Array<number, number, number, number>} param.bitmapParams - The parameters to obtain the template tile image from the bitmap
   * @param {OffscreenCanvas | HTMLCanvasElement} param.transCanvas - The canvas to draw to in order to calculate this
   * @param {OffscreenCanvasRenderingContext2D} param.transContext - The context for the transparent canvas to draw to
   * @return {boolean} Is the canvas transparent? If transparent, then `true` is returned. Otherwise, `false`.
   * @since 0.91.75
   */
  calculateCanvasTransparency({
    bitmap: bitmap,
    bitmapParams: bitmapParams,
    transCanvas: transCanvas,
    transContext: transContext
  }) {

    console.debug(`${this.scriptName}%c: Calculating template tile transparency...`, consoleCSS.BLUE, consoleCSS.RESET);

    console.debug(`%c${this.scriptName}%c: User Settings:\nShould Skip: %c${this.shouldSkipTransTiles}%c;\nShould Agg Skip: %c${this.shouldAggSkipTransTiles}%c`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET);
    
    const timer = Date.now(); // Starts the timer

    // Contains the directions to move the canvas when duplicating, in the unit of pixels
    const duplicationCoordinateArray = [
      [  0,   1], // E.g. move 0 on the x axis, and 1 down on the y axis
      [  1,   0],
      [  0,  -2], // E.g. move 0 on the x axis, and 2 up on the y axis
      [ -2,   0],
      [  0,   4],
      [  4,   0],
      [  0,  -8],
      [ -8,   0],
      [  0,  16],
      [ 16,   0],
      [  0, -32],
      [-32,   0]
    ];

    // Changes the size of the canvas so that it equals the template tile
    const transCanvasWidth = bitmapParams[2];
    const transCanvasHeight = bitmapParams[3];
    transCanvas.width = transCanvasWidth;
    transCanvas.height = transCanvasHeight;

    transContext.clearRect(0, 0, transCanvasWidth, transCanvasHeight); // Clear any previous drawing (only runs when canvas size does not change)

    // If the user does want to aggressively skip transparent template tiles...
    if (this.shouldAggSkipTransTiles) {
      // (This code will only run if `this.shouldSkipTransTiles` is `true`)

      // Draw the template tile onto the canvas scaled down to 10x10
      transContext.drawImage(
        bitmap, // The bitmap image
        ...bitmapParams, // Bitmap image parameters (x, y, width, height)
        0, 0, // The coordinate draw the output *at*
        10, 10 // The width and height of the output
      );
    } else {
      // Else, the user wants to skip transparent template tiles normally...

      // Draw the template tile onto the canvas
      transContext.drawImage(
        bitmap, // The bitmap image
        ...bitmapParams, // Bitmap image parameters (x, y, width, height)
        0, 0, // The coordinate draw the output *at*
        transCanvasWidth, transCanvasHeight // Stretch to canvas (the canvas should already be the same size as the template image)
      )

      // For each canvas duplication...
      for (const [relativeX, relativeY] of duplicationCoordinateArray) {

        // Duplicate the canvas onto itself, but shifted slightly
        transContext.drawImage(
          transCanvas, // The canvas we are drawing to *is* the source image
          0, 0, transCanvasWidth, transCanvasHeight, // The entire canvas (as a source image)
          relativeX, relativeY, transCanvasWidth, transCanvasHeight // The output coordinates and size on the same canvas
        )
      }

      // Scale down the image to 10x10, and store it between (0, 0) and (9, 9) on the canvas
      transContext.drawImage(
        transCanvas, // The canvas we are drawing to *is* the source image
        0, 0, transCanvasWidth, transCanvasHeight, // The entire canvas (as a source image)
        0, 0, 10, 10 // The output coordinates and size on the same canvas
      );
    }

    const shunkCanvas = transContext.getImageData(0, 0, 10, 10);
    const shunkCanvas32 = new Uint32Array(shunkCanvas.data.buffer);

    console.debug(`%c${this.scriptName}%c: Calculated canvas transparency in %c${(Date.now() - timer) / 1000}%c seconds.`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET);

    // For every pixel in the `shrunkCanvas32` array...
    for (const pixel of shunkCanvas32) {

      // If the pixel is NOT 100% transparent
      if (!!pixel) {
        return true; // Return `true` early since we confirmed a template exists in the tile
      }
    }

    return false; // Since we could not confirm any template exists, we assume no template eixsts in this tile
  }

  /** Calculates top left coordinate of template.
   * It uses `Template.chunked` to update `Template.coords`
   * @since 0.88.504
   */
  calculateCoordsFromChunked() {
    let topLeftCoord = [Infinity, Infinity, Infinity, Infinity];
    const tileKeys = Object.keys(this.chunked).sort(); // Sorts the tile keys
    tileKeys.forEach((key, index) => { // For each tile key...
      const [tileX, tileY, pixelX, pixelY] = key.split(',').map(Number); // Deconstruct the tile key
      if ((tileY < topLeftCoord[1]) || (tileY == topLeftCoord[1] && tileX < topLeftCoord[0])) {
        topLeftCoord = [tileX, tileY, pixelX, pixelY]; // Record the smallest tile key coordinates. Otherwise, use previous best
      }
    });
    this.coords = topLeftCoord;
  }

  /** Calculates the total pixels for each color for the image.
   * 
   * @param {ImageData} imageData - The pre-shreded image "casted" onto a canvas
   * @param {Object} paletteBM - The palette Blue Marble uses for colors
   * @param {Number} paletteTolerance - How close an RGB color has to be in order to be considered a palette color. A tolerance of "3" means the sum of the RGB can be up to 3 away from the actual value.
   * @returns {Map<Number, Number>} A map where the key is the color ID, and the value is the total pixels for that color ID
   * @since 0.88.6
   */
  #calculateTotalPixelsFromImageData(imageData, paletteBM) {

    const buffer32Arr = new Uint32Array(imageData.data.buffer); // RGB values as a Uint32Array. Each index represents 1 pixel.
    const { palette: _, LUT: lookupTable } = paletteBM; // Obtains the palette and LUT

    // Makes a copy of the color palette Blue Marble uses, turns it into a Map, and adds data to count the amount of each color
    const _colorpalette = new Map(); // Temp color palette

    // For every pixel...
    for (let pixelIndex = 0; pixelIndex < buffer32Arr.length; pixelIndex++) {
      
      const pixel = buffer32Arr[pixelIndex]; // Current pixel to check
      let bestColorID = -2; // Will eventually store the best match for color ID

      // If the pixel is transparent...
      if ((pixel >>> 24) == 0) {
        bestColorID = 0; // Set the color ID to 0
      } else {
        // Else, look up the color ID in the "cube" LUT. If none is found, fallback to -2 ("Other")
        bestColorID = lookupTable.get(pixel) ?? -2;
      }

      // Increments the count by 1 for the best matching color ID (which can be negative).
      // If the color ID has not been counted yet, default to 1
      const colorIDcount = _colorpalette.get(bestColorID);
      _colorpalette.set(bestColorID, colorIDcount ? colorIDcount + 1 : 1);
    }

    console.debug(`%c${this.scriptName}%c: Value of %c_colorpalette%c: `, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, _colorpalette);
    return _colorpalette;
  }
}
