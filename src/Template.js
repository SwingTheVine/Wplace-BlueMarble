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
   * @param {Object} [params.chunked=null] - The affected chunks of the template, and their template for each chunk
   * @param {number} [params.tileSize=1000] - The size of a tile in pixels (assumes square tiles)
   * @param {number} [params.pixelCount=0] - Total number of pixels in the template (calculated automatically during processing)
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
    tileSize = 1000,
  } = {}) {
    this.displayName = displayName;
    this.sortID = sortID;
    this.authorID = authorID;
    this.url = url;
    this.file = file;
    this.coords = coords;
    this.chunked = chunked;
    this.tileSize = tileSize;
    this.pixelCount = 0; // Total pixel count in template
  }

  /** Creates chunks of the template for each tile.
   * @param {Number} tileSize - Size of the tile as determined by templateManager
   * @param {Object} paletteBM - An collection of Uint32Arrays containing the palette BM uses
   * @param {Number} paletteTolerance - How close an RGB color has to be in order to be considered a palette color. A tolerance of "3" means the sum of the RGB can be up to 3 away from the actual value.
   * @returns {Object} Collection of template bitmaps & buffers organized by tile coordinates
   * @since 0.65.4
   */
  async createTemplateTiles(tileSize, paletteBM, paletteTolerance) {
    console.log('Template coordinates:', this.coords);

    const shreadSize = 3; // Scale image factor for pixel art enhancement (must be odd)
    const bitmap = await createImageBitmap(this.file); // Create efficient bitmap from uploaded file
    const imageWidth = bitmap.width;
    const imageHeight = bitmap.height;

    this.tileSize = tileSize; // Tile size predetermined by the templateManager
    
    // Calculate total pixel count using standard width × height formula
    // TODO: Use non-transparent pixels instead of basic width times height
    const totalPixels = imageWidth * imageHeight;
    console.log(`Template pixel analysis - Dimensions: ${imageWidth}×${imageHeight} = ${totalPixels.toLocaleString()} pixels`);
    
    // Store pixel count in instance property for access by template manager and UI components
    this.pixelCount = totalPixels;

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
    this.#calculateTotalPixelsFromTemplateData(context.getImageData(0, 0, imageWidth, imageHeight), paletteBM, paletteTolerance); // Calculates total pixels from the template buffer retrieved from the canvas context image data
    console.log(`Calculating total pixels took ${(Date.now() - timer) / 1000.0} seconds`);

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
          pixelX - this.coords[2], // Coordinate X to draw from
          pixelY - this.coords[3], // Coordinate Y to draw from
          drawSizeX, // X width to draw from
          drawSizeY, // Y height to draw from
          0, // Coordinate X to draw at
          0, // Coordinate Y to draw at
          drawSizeX * shreadSize, // X width to draw at
          drawSizeY * shreadSize // Y height to draw at
        ); // Coordinates and size of draw area of source image, then canvas

        // const final = await canvas.convertToBlob({ type: 'image/png' });
        // const url = URL.createObjectURL(final); // Creates a blob URL
        // window.open(url, '_blank'); // Opens a new tab with blob
        // setTimeout(() => URL.revokeObjectURL(url), 60000); // Destroys the blob 1 minute later

        context.save(); // Saves the current context of the canvas
        context.globalCompositeOperation = "destination-in"; // The existing canvas content is kept where both the new shape and existing canvas content overlap. Everything else is made transparent.
        // For our purposes, this means any non-transparent pixels on the mask will be kept

        // Fills the canvas with the mask
        context.fillStyle = context.createPattern(canvasMask, "repeat");
        context.fillRect(0, 0, canvasWidth, canvasHeight);

        context.restore(); // Restores the context of the canvas to the previous save

        const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight); // Data of the image on the canvas
        
        // TODO: Make Erased pixels calculated when showing the template, not generating it for the first time.
        // For every pixel...
        // for (let y = 0; y < canvasHeight; y++) {
        //   for (let x = 0; x < canvasWidth; x++) {

        //     const pixelIndex = (y * canvasWidth + x) * 4; // Find the pixel index in an array where every 4 indexes are 1 pixel
            
        //     // If the pixel is the color #deface, draw a translucent gray checkerboard pattern
        //     if (
        //       imageData.data[pixelIndex] === 222 &&
        //       imageData.data[pixelIndex + 1] === 250 &&
        //       imageData.data[pixelIndex + 2] === 206
        //     ) {
        //       if ((x + y) % 2 === 0) { // Formula for checkerboard pattern
        //         imageData.data[pixelIndex] = 0;
        //         imageData.data[pixelIndex + 1] = 0;
        //         imageData.data[pixelIndex + 2] = 0;
        //         imageData.data[pixelIndex + 3] = 32; // Translucent black
        //       } else { // Transparent negative space
        //         imageData.data[pixelIndex + 3] = 0;
        //       }
        //     } else if (x % shreadSize !== 1 || y % shreadSize !== 1) { // Otherwise make all non-middle pixels transparent
        //       imageData.data[pixelIndex + 3] = 0; // Make the pixel transparent on the alpha channel
        //     }
        //   }
        // }

        console.log(`Shreaded pixels for ${pixelX}, ${pixelY}`, imageData);

        context.putImageData(imageData, 0, 0);

        // Creates the "0000,0000,000,000" key name
        const templateTileName = `${
          (this.coords[0] + Math.floor(pixelX / 1000)).toString().padStart(4, '0')},${
          (this.coords[1] + Math.floor(pixelY / 1000)).toString().padStart(4, '0')},${
          (pixelX % 1000).toString().padStart(3, '0')},${
          (pixelY % 1000).toString().padStart(3, '0')
        }`;

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
    return { templateTiles, templateTilesBuffers };
  }

  /** Calculates the total pixels for each color for the template.
   * 
   * @param {ImageData} imageData - The pre-shreaded template "casted" onto a canvas
   * @param {Object} paletteBM - The palette Blue Marble uses for colors
   * @param {Number} paletteTolerance - How close an RGB color has to be in order to be considered a palette color. A tolerance of "3" means the sum of the RGB can be up to 3 away from the actual value.
   * @since 0.88.6
   */
  async #calculateTotalPixelsFromTemplateData(imageData, paletteBM, paletteTolerance) {

    const buffer32Arr = new Uint32Array(imageData.data.buffer); // RGB values as a Uint32Array. Each index represents 1 pixel.

    // Makes a copy of the color palette Blue Marble uses, turns it into a Map, and adds data to count the amount of each color
    const _colorpalette = new Map(); // Temp color palette
    paletteBM.palette.forEach(color => _colorpalette.set(color.id, 0));
    //paletteBM.palette.forEach(color => _colorpalette.set(color.id, { ...color, amount: 0 }));

    // For every pixel...
    for (let pixelIndex = 0; pixelIndex < buffer32Arr.length; pixelIndex++) {
      
      // Finds the best matching 
      const bestColorID = this.#findClosestPixelColorID(buffer32Arr[pixelIndex], paletteBM, paletteTolerance);

      // Adds one to the "amount" value for that pixel in the temporary color palette Map
      _colorpalette.set(bestColorID, _colorpalette.get(bestColorID) + 1);
      // This works since the Map keys are the color ID, which can be negative.
    }

    console.log(_colorpalette);
  }

  /** Takes a 32-bit integer of an RGB value and finds the closest palette color.
   * This uses squared Euclidean distance calculations to find the closest color in 3D space.
   * @param {Number} pixelColor32 - Pixel to find the color of
   * @param {Object} paletteBM - The palette Blue Marble uses for colors
   * @param {Number} paletteTolerance - How close an RGB color has to be in order to be considered a palette color. A tolerance of "3" means the sum of the RGB can be up to 3 away from the actual value.
   * @returns {Number} The ID value of the color that matches.
   * @since 0.88.10
   */
  #findClosestPixelColorID(pixelColor32, paletteBM, paletteTolerance) {

    let bestIndex = Infinity; // Best matching index palette color
    let bestDistance = Infinity; // The distance to the best matching index palette color
    const { palette: palette, RGB: _, R: paletteR, G: paletteG, B: paletteB } = paletteBM; // Gets the full color palette as Array<Object> as well as each R, G, and B palette as a Uint32Array

    const pixelR = (pixelColor32 >> 16) & 0xFF; // Red value for the pixel
    const pixelG = (pixelColor32 >> 8) & 0xFF; // Green value for the pixel
    const pixelB = pixelColor32 & 0xFF; // Blue value for the pixel

    // If the pixel we want to find the palette color of is transparent, then return the transparent index early
    if ((pixelColor32 >>> 24) == 0) {return 0;}

    // For every palette color...
    for (let paletteColorIndex = 0; paletteColorIndex < palette.length; paletteColorIndex++) {
      // ...find how close the pixel is in 3D space to each palette color, then return the closest palette color.

      // Skip all colors in the pallete where the color ID is 0 (Transparent color) or less than 0 (Blue Marble custom color)
      if (palette[paletteColorIndex].id <= 0) {continue;}

      // The difference in RGB values between the pixel color and the palette color for each of the 3 channels
      const deltaR = paletteR[paletteColorIndex] - pixelR;
      const deltaG = paletteG[paletteColorIndex] - pixelG;
      const deltaB = paletteB[paletteColorIndex] - pixelB;

      // If the palette color is outside of the tolerance, skip this color
      if ((Math.abs(deltaR) + Math.abs(deltaG) + Math.abs(deltaB)) > paletteTolerance) {continue;}
      // This is is the Manhattan distance. We don't need to do any of the calculations below if this exceeds the tolerance.
      // The tolerance check here is the sum of the difference across the RGB channels.
      // E.g. "123,45,6" minus "123,44,5" is 2, which is within tolerance. "123,45,6" minus "23,45,6" is 100, which is outside tolerance.

      // Squared Euclidean distance in space between palette color and pixel color
      const distance = (deltaR * deltaR) + (deltaG * deltaG) + (deltaB * deltaB);

      // If this palette color is the closest color YET, then update the "best" variables
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = paletteColorIndex;
      }
    }

    // Returns the ID of the best matching color in the palette, or returns the color ID for "Other" (which is -2)
    return (bestIndex == Infinity) ? -2 : palette[bestIndex].id;
  }
}
