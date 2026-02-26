import { uint8ToBase64 } from "./utils";

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
   * @param {Array<number>} [params.coords=null] - The coordinates of the top left corner as (tileX, tileY, pixelX, pixelY)
   * @param {Object} [params.chunked=null] - The affected chunks of the template, and their template for each chunk as a bitmap
   * @param {Object} [params.chunked32={}] - The affected chunks of the template, and their template for each chunk as a Uint32Array
   * @param {number} [params.tileSize=1000] - The size of a tile in pixels (assumes square tiles)
   * @param {Object} [params.pixelCount={total:0, colors:Map}] - Total number of pixels in the template (calculated automatically during processing)
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
    this.pixelCount = { total: 0, colors: new Map() };
  }

  /** Creates chunks of the template for each tile.
   * @param {Number} tileSize - Size of the tile as determined by templateManager
   * @param {Object} paletteBM - An collection of Uint32Arrays containing the palette BM uses
   * @returns {Object} Collection of template bitmaps & buffers organized by tile coordinates
   * @since 0.65.4
   */
  async createTemplateTiles(tileSize, paletteBM) {
    console.log('Template coordinates:', this.coords);

    const shreadSize = 3; // Scale image factor for pixel art enhancement (must be odd)
    const bitmap = await createImageBitmap(this.file); // Create efficient bitmap from uploaded file
    const imageWidth = bitmap.width;
    const imageHeight = bitmap.height;

    this.tileSize = tileSize; // Tile size predetermined by the templateManager

    const templateTiles = {}; // Holds the template tiles
    const templateTilesBuffers = {}; // Holds the buffers of the template tiles

    const canvas = new OffscreenCanvas(this.tileSize, this.tileSize);
    const context = canvas.getContext('2d', { willReadFrequently: true });
  
    // Prep the canvas for drawing the entire template (so we can find total pixels)
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    context.imageSmoothingEnabled = false; // Nearest neighbor

    context.drawImage(bitmap, 0, 0); // Draws the template to the canvas

    let timer = Date.now();
    const totalPixelMap = this.#calculateTotalPixelsFromImageData(context.getImageData(0, 0, imageWidth, imageHeight), paletteBM); // Calculates total pixels from the template buffer retrieved from the canvas context image data
    console.log(`Calculating total pixels took ${(Date.now() - timer) / 1000.0} seconds`);

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
    for (let pixelY = this.coords[3]; pixelY < imageHeight + this.coords[3]; ) {

      // Draws the partial tile first, if any
      // This calculates the size based on which is smaller:
      // A. The top left corner of the current tile to the bottom right corner of the current tile
      // B. The top left corner of the current tile to the bottom right corner of the image
      const drawSizeY = Math.min(this.tileSize - (pixelY % this.tileSize), imageHeight - (pixelY - this.coords[3]));

      console.log(`Math.min(${this.tileSize} - (${pixelY} % ${this.tileSize}), ${imageHeight} - (${pixelY - this.coords[3]}))`);

      for (let pixelX = this.coords[2]; pixelX < imageWidth + this.coords[2];) {

        console.log(`Pixel X: ${pixelX}\nPixel Y: ${pixelY}`);

        // Draws the partial tile first, if any
        // This calculates the size based on which is smaller:
        // A. The top left corner of the current tile to the bottom right corner of the current tile
        // B. The top left corner of the current tile to the bottom right corner of the image
        const drawSizeX = Math.min(this.tileSize - (pixelX % this.tileSize), imageWidth - (pixelX - this.coords[2]));

        console.log(`Math.min(${this.tileSize} - (${pixelX} % ${this.tileSize}), ${imageWidth} - (${pixelX - this.coords[2]}))`);

        console.log(`Draw Size X: ${drawSizeX}\nDraw Size Y: ${drawSizeY}`);

        // Change the canvas size and wipe the canvas
        const canvasWidth = drawSizeX * shreadSize;// + (pixelX % this.tileSize) * shreadSize;
        const canvasHeight = drawSizeY * shreadSize;// + (pixelY % this.tileSize) * shreadSize;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        console.log(`Draw X: ${drawSizeX}\nDraw Y: ${drawSizeY}\nCanvas Width: ${canvasWidth}\nCanvas Height: ${canvasHeight}`);

        context.imageSmoothingEnabled = false; // Nearest neighbor

        console.log(`Getting X ${pixelX}-${pixelX + drawSizeX}\nGetting Y ${pixelY}-${pixelY + drawSizeY}`);

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
          drawSizeX * shreadSize, // X width to draw *at*
          drawSizeY * shreadSize // Y height to draw *at*
        ); // Coordinates and size of draw area of source image, then canvas

        context.save(); // Saves the current context of the canvas
        context.globalCompositeOperation = "destination-in"; // The existing canvas content is kept where both the new shape and existing canvas content overlap. Everything else is made transparent.
        // For our purposes, this means any non-transparent pixels on the mask will be kept

        // Fills the canvas with the mask
        context.fillStyle = context.createPattern(canvasMask, "repeat");
        context.fillRect(0, 0, canvasWidth, canvasHeight);

        context.restore(); // Restores the context of the canvas to the previous save

        const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight); // Data of the image on the canvas

        console.log(`Shreaded pixels for ${pixelX}, ${pixelY}`, imageData);

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

        console.log(templateTiles);

        pixelX += drawSizeX;
      }

      pixelY += drawSizeY;
    }

    console.log(`Parsing template took ${(Date.now() - timer) / 1000.0} seconds`);
    console.log('Template Tiles: ', templateTiles);
    console.log('Template Tiles Buffers: ', templateTilesBuffers);
    console.log('Template Tiles Uint32Array: ', this.chunked32);
    return { templateTiles, templateTilesBuffers };
  }

  /** Calculates the total pixels for each color for the image.
   * 
   * @param {ImageData} imageData - The pre-shreaded image "casted" onto a canvas
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

    console.log(_colorpalette);
    return _colorpalette;
  }
}
