import Template from "./Template";
import { base64ToUint8, colorpaletteForBlueMarble, consoleError, consoleLog, consoleWarn, localizeNumber, numberToEncoded, sleep } from "./utils";
import WindowWizard from "./WindowWizard";

/** Manages the template system.
 * This class handles all external requests for template modification, creation, and analysis.
 * It serves as the central coordinator between template instances and the user interface.
 * @class TemplateManager
 * @since 0.55.8
 * @example
 * // JSON structure for a template made in schema version 2.0.0.
 * // Note: The pixel "colors" Object contains more than 2 keys.
 * // Note: The template tiles are stored as base64 PNG images.
 * {
 *   "whoami": "BlueMarble",
 *   "scriptVersion": "1.13.0",
 *   "schemaVersion": "2.0.0",
 *   "templates": {
 *     "0 $Z": {
 *       "name": "My Template",
 *       "enabled": true,
 *       "pixels": {
 *         "total": 40399,
 *         "colors": {
 *           "-2": 40000,
 *           "0": 399
 *         }
 *       }
 *       "tiles": {
 *         "1231,0047,183,593": "iVBORw0KGgoAAAANSUhEUgAA",
 *         "1231,0048,183,000": "AAAFCAYAAACNbyblAAAAHElEQVQI12P4"
 *       }
 *     },
 *     "1 $Z": {
 *       "name": "My Template",
 *       "URL": "https://github.com/SwingTheVine/Wplace-BlueMarble/blob/main/dist/assets/Favicon.png",
 *       "URLType": "template",
 *       "enabled": false,
 *       "pixels": {
 *         "total": 40399,
 *         "colors": {
 *           "-2": 40000,
 *           "0": 399
 *         }
 *       }
 *       "tiles": {
 *         "375,1846,276,188": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA",
 *         "376,1846,000,188": "data:image/png;AAAFCAYAAACNbyblAAAAHElEQVQI12P4"
 *       }
 *     }
 *   }
 * }
 * @example
 * // JSON structure for a template made in schema version 1.0.0.
 * // Note: The template tiles are stored as base64 PNG images.
 * {
 *   "whoami": "BlueMarble",
 *   "scriptVersion": "1.13.0",
 *   "schemaVersion": "1.0.0",
 *   "templates": {
 *     "0 $Z": {
 *       "name": "My Template",
 *       "enabled": true,
 *       "coords": "2000, 230, 45, 201"
 *       "palette": {
 *         "0,0,0": {
 *            "count": 123,
 *            "enabled": true
 *         },
 *         "255,255,255": {
 *            "count": 1315,
 *            "enabled": false
 *         }
 *       }
 *       "tiles": {
 *         "1231,0047,183,593": "iVBORw0KGgoAAAANSUhEUgAA",
 *         "1231,0048,183,000": "AAAFCAYAAACNbyblAAAAHElEQVQI12P4"
 *       }
 *     }
 *   }
 * }
 */
export default class TemplateManager {

  /** The constructor for the {@link TemplateManager} class.
   * @since 0.55.8
   */
  constructor(name, version, overlay) {

    // Meta
    this.name = name; // Name of userscript
    this.version = version; // Version of userscript
    this.overlay = overlay; // The main instance of the Overlay class
    this.schemaVersion = '2.0.0'; // Version of JSON schema
    this.userID = null; // The ID of the current user
    this.encodingBase = '!#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~'; // Characters to use for encoding/decoding
    this.tileSize = 1000; // The number of pixels in a tile. Assumes the tile is square
    this.drawMult = 3; // The enlarged size for each pixel. E.g. when "3", a 1x1 pixel becomes a 1x1 pixel inside a 3x3 area. MUST BE ODD
    this.paletteTolerance = 3; // Tolerance for how close an RGB value has to be in order to be considered a color. A tolerance of "3" means the sum of the RGB can be up to 3 away from the actual value.
    this.paletteBM = colorpaletteForBlueMarble(this.paletteTolerance); // Retrieves the color palette BM will use as an Object containing multiple Uint32Arrays
    
    // Template
    this.template = null; // The template image.
    this.templateState = ''; // The state of the template ('blob', 'proccessing', 'template', etc.)
    /** An Array of Template classes @type {Array<Template>} */
    this.templatesArray = []; // All Template instnaces currently loaded (Template)
    this.templatesJSON = null; // All templates currently loaded (JSON)
    this.templatesShouldBeDrawn = true; // Should ALL templates be drawn to the canvas?
    this.templatePixelsCorrect = null; // An object where the keys are the tile coords, and the values are Maps (BM palette color IDs) containing the amount of correctly placed pixels for that tile in this template
    /** Will contain all color ID's to filter @type {Map<number, boolean>} */
    this.shouldFilterColor = new Map();
  }

  /** Creates the JSON object to store templates in
   * @returns {{ whoami: string, scriptVersion: string, schemaVersion: string, templates: Object }} The JSON object
   * @since 0.65.4
   */
  async createJSON() {
    return {
      "whoami": this.name.replace(' ', ''), // Name of userscript without spaces
      "scriptVersion": this.version, // Version of userscript
      "schemaVersion": this.schemaVersion, // Version of JSON schema
      "templates": {} // The templates
    };
  }

  /** Creates the template from the inputed file blob
   * @param {File} blob - The file blob to create a template from
   * @param {string} name - The display name of the template
   * @param {Array<number, number, number, number>} coords - The coordinates of the top left corner of the template
   * @since 0.65.77
   */
  async createTemplate(blob, name, coords) {

    // Creates the JSON object if it does not already exist
    if (!this.templatesJSON) {this.templatesJSON = await this.createJSON(); console.log(`Creating JSON...`);}

    this.overlay.handleDisplayStatus(`Creating template at ${coords.join(', ')}...`);

    // Creates a new template instance
    const template = new Template({
      displayName: name,
      sortID: 0, // Object.keys(this.templatesJSON.templates).length || 0, // Uncomment this to enable multiple templates (1/2)
      authorID: numberToEncoded(this.userID || 0, this.encodingBase),
      file: blob,
      coords: coords
    });
    
    const { templateTiles, templateTilesBuffers } = await template.createTemplateTiles(this.tileSize, this.paletteBM); // Chunks the tiles
    
    template.chunked = templateTiles; // Stores the chunked tile bitmaps

    // Converts total pixel Object/Map variables into JSON-ready format
    const _pixels = { "total": template.pixelCount.total, "colors": Object.fromEntries(template.pixelCount.colors) }

    // Appends a child into the templates object
    // The child's name is the number of templates already in the list (sort order) plus the encoded player ID
    this.templatesJSON.templates[`${template.sortID} ${template.authorID}`] = {
      "name": template.displayName, // Display name of template
      "coords": coords.join(', '), // The coords of the template
      "enabled": true,
      "pixels": _pixels, // The total pixels in the template
      "tiles": templateTilesBuffers // Stores the chunked tile buffers
    };

    this.templatesArray = []; // Remove this to enable multiple templates (2/2)
    this.templatesArray.push(template); // Pushes the Template object instance to the Template Array

    this.overlay.handleDisplayStatus(`Template created at ${coords.join(', ')}!`);

    console.log(Object.keys(this.templatesJSON.templates).length);
    console.log(this.templatesJSON);
    console.log(this.templatesArray);
    console.log(JSON.stringify(this.templatesJSON));

    await this.#storeTemplates();
  }

  /** Generates a {@link Template} class instance from the JSON object template.
   * {@link createTemplate()} will create a class instance and save to template storage.
   * `#loadTemplate()` will create a class instance without saving to the template storage.
   * @param {Object} template - The template to load
   * @since 0.88.504
   */
  #loadTemplate(templateObject) {

    // Calculates the pixel count
    const pixelCount = {
      total: templateObject.pixels?.total,
      colors: new Map(Object.entries(templateObject.pixels?.colors || {}).map(([key, value]) => [Number(key), value]))
    };

    // Creates the template
    const template = new Template({
      displayName: templateObject.displayName,
      sortID: Object.keys(this.templatesJSON.templates).length || 0,
      authorID: numberToEncoded(this.userID || 0, this.encodingBase),
      pixelCount: pixelCount,
      chunked: templateObject.tiles
    });

    template.calculateCoordsFromChunked(); // Updates `Template.coords`

    this.templatesArray.push(template);
  }

  /** Stores the JSON object of the loaded templates into TamperMonkey (GreaseMonkey) storage.
   * @since 0.72.7
   */
  async #storeTemplates() {
    GM.setValue('bmTemplates', JSON.stringify(this.templatesJSON));
  }

  /** Deletes a template from the JSON object.
   * Also delete's the corrosponding {@link Template} class instance
   */
  deleteTemplate() {

  }

  /** Disables the template from view
   */
  async disableTemplate() {

    // Creates the JSON object if it does not already exist
    if (!this.templatesJSON) {this.templatesJSON = await this.createJSON(); console.log(`Creating JSON...`);}


  }

  /** Downloads all templates loaded.
   * @since 0.88.499
   */
  async downloadAllTemplates() {

    consoleLog(`Downloading all templates...`);

    console.log(this.templatesArray);

    // For each template loaded...
    for (const template of this.templatesArray) {

      await this.downloadTemplate(template); // Downloads the template

      await sleep(500); // Avoids download throttling from the browser
    }
  }

  /** Downloads all templates from Blue Marble's template storage.
   * @since 0.88.474
   */
  async downloadAllTemplatesFromStorage() {

    // Templates in user storage
    const templates = JSON.parse(GM_getValue('bmTemplates', '{}'))?.templates;

    console.log(templates);

    // If there is at least one template loaded...
    if (Object.keys(templates).length > 0) {

      // For each template loaded...
      for (const [key, template] of Object.entries(templates)) {

        // If the template is a direct child of the templates Object...
        if (templates.hasOwnProperty(key)) {
          
          // Downloads the template using a dummy Template instance
          await this.downloadTemplate(new Template({
            displayName: template.name,
            sortID: key.split(' ')?.[0],
            authorID: key.split(' ')?.[1],
            chunked: template.tiles
          }));

          await sleep(500); // Avoids download throttling from the browser
        }
      }
    }
  }

  /** Downloads the template passed-in.
   * @param {Template} template - The template class instance to download
   * @since 0.88.499
   */
  async downloadTemplate(template) {

    template.calculateCoordsFromChunked(); // Updates `Template.coords`

    // Constructs the file name to download as
    const templateFileName = `${template.coords.join('-')}_${template.displayName.replaceAll(' ', '-')}`;

    // Converts `Template.chunked` to a blob
    const blob = await this.convertTemplateToBlob(template);

    // Downloads the template
    await GM.download({
      url: URL.createObjectURL(blob),
      name: templateFileName + '.png',
      conflictAction: 'uniquify',
      onload: () => {consoleLog(`Download of template '${templateFileName}' complete!`);},
      onerror: (error, details) => {consoleError(`Download of template '${templateFileName}' failed because ${error}! Details: ${details}`);},
      ontimeout: () => {consoleWarn(`Download of template '${templateFileName}' has timed out!`);}
    });
  }

  /** Converts a Template class instance into a Blob. 
   * Specifically, this takes `Template.chunked` and converts it to a Blob.
   * @since 0.88.504
   * @returns {Promise<Blob>} A Promise of a Blob PNG image of the template
   */
  async convertTemplateToBlob(template) {

    console.log(template);

    const templateTiles64 = template.chunked; // Tiles of template image as base 64

    // Sorts the keys of the tiles (Object -> Array)
    const templateTileKeysSorted = Object.keys(templateTiles64).sort();

    // Turns the base64 tiles into Images
    const templateTilesImageSorted = await Promise.all(templateTileKeysSorted.map(tileKey => convertBase64ToImage(templateTiles64[tileKey])));

    // Absolute pixel coordinates for smallest (top left) and largest (bottom right) pixel coordinates
    let absoluteSmallestX = Infinity;
    let absoluteSmallestY = Infinity;
    let absoluteLargestX = 0;
    let absoluteLargestY = 0;

    // Calculates the minimum and maximum (X, Y) absolute coordinates
    templateTileKeysSorted.forEach((key, index) => {

      // Deconstructs the tile coordinates
      const [tileX, tileY, pixelX, pixelY] = key.split(',').map(Number);

      const tileImage = templateTilesImageSorted[index]; // Obtains the image for this tile

      // Calculates the absolute pixel coordinates for this tile
      const absoluteX = (tileX * this.tileSize) + pixelX;
      const absoluteY = (tileY * this.tileSize) + pixelY;

      // Record the smallest/largest absolute coordinates if and only if this tile is the smallest/largest. Otherwise, use previous best
      absoluteSmallestX = Math.min(absoluteSmallestX, absoluteX);
      absoluteSmallestY = Math.min(absoluteSmallestY, absoluteY);
      absoluteLargestX = Math.max(absoluteLargestX, absoluteX + (tileImage.width / this.drawMult));
      absoluteLargestY = Math.max(absoluteLargestY, absoluteY + (tileImage.height / this.drawMult));
    })

    console.log(`Absolute coordinates: (${absoluteSmallestX}, ${absoluteSmallestY}) and (${absoluteLargestX}, ${absoluteLargestY})`);

    // Calculates the template/canvas width and height
    const templateWidth = absoluteLargestX - absoluteSmallestX;
    const templateHeight = absoluteLargestY - absoluteSmallestY;

    console.log(`Template Width: ${templateWidth}\nTemplate Height: ${templateHeight}`);

    // Creates a new canvas the size of the template
    const canvas = new OffscreenCanvas(templateWidth, templateHeight);
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false; // Forces nearest neighbor scaling algorithm

    // For each tile...
    templateTileKeysSorted.forEach((key, index) => {

      // Deconstructs the tile coordinates
      const [tileX, tileY, pixelX, pixelY] = key.split(',').map(Number);

      const tileImage = templateTilesImageSorted[index]; // Obtains the image for this tile

      // Calculates the absolute pixel coordinates for this tile
      const absoluteX = (tileX * this.tileSize) + pixelX;
      const absoluteY = (tileY * this.tileSize) + pixelY;

      console.log(`Drawing tile (${tileX}, ${tileY}, ${pixelX}, ${pixelY}) (${absoluteX}, ${absoluteY}) at (${absoluteX - absoluteSmallestX}, ${absoluteY - absoluteSmallestY}) on the canvas...`);

      // Draws the tile to the canvas AND scales it down in the process
      context.drawImage(tileImage, absoluteX - absoluteSmallestX, absoluteY - absoluteSmallestY, tileImage.width / this.drawMult, tileImage.height / this.drawMult);
    })

    // Returns a blob
    return canvas.convertToBlob({ type: 'image/png' });

    /** Turns a chunked base 64 string template tile into an Image template tile
     * @param {string} base64 - Base64 string of image data (without URI header)
     * @since 0.88.474
     * @returns {Promise} Promise to load a new Image()
     */
    function convertBase64ToImage(base64) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = "data:image/png;base64," + base64;
      });
    }
  }

  /** Draws all templates on the specified tile.
   * This method handles the rendering of template overlays on individual tiles.
   * @param {File} tileBlob - The pixels that are placed on a tile
   * @param {Array<number>} tileCoords - The tile coordinates [x, y]
   * @since 0.65.77
   */
  async drawTemplateOnTile(tileBlob, tileCoords) {

    // Returns early if no templates should be drawn
    if (!this.templatesShouldBeDrawn) {return tileBlob;}

    const drawSize = this.tileSize * this.drawMult; // Calculate draw multiplier for scaling

    // Format tile coordinates with proper padding for consistent lookup
    tileCoords = tileCoords[0].toString().padStart(4, '0') + ',' + tileCoords[1].toString().padStart(4, '0');

    console.log(`Searching for templates in tile: "${tileCoords}"`);

    const templateArray = this.templatesArray; // Stores a copy for sorting
    console.log(templateArray);

    // Sorts the array of Template class instances. 0 = first = lowest draw priority
    templateArray.sort((a, b) => {return a.sortID - b.sortID;});

    console.log(templateArray);

    // Retrieves the relavent template tile blobs
    const templatesToDraw = templateArray
      .map(template => {
        const matchingTiles = Object.keys(template.chunked).filter(tile =>
          tile.startsWith(tileCoords)
        );

        if (matchingTiles.length === 0) {return null;} // Return null when nothing is found

        // Retrieves the blobs of the templates for this tile
        const matchingTileBlobs = matchingTiles.map(tile => {

          const coords = tile.split(','); // [x, y, x, y] Tile/pixel coordinates
          
          return {
            instance: template,
            bitmap: template.chunked[tile],
            chunked32: template.chunked32?.[tile],
            tileCoords: [coords[0], coords[1]],
            pixelCoords: [coords[2], coords[3]]
          }
        });

        return matchingTileBlobs?.[0];
      })
    .filter(Boolean);

    console.log(templatesToDraw);

    const templateCount = templatesToDraw?.length || 0; // Number of templates to draw on this tile
    console.log(`templateCount = ${templateCount}`);

    if (templateCount > 0) {
      
      // Calculate total pixel count for templates actively being displayed in this tile
      const totalPixels = templateArray
        .filter(template => {
          // Filter templates to include only those with tiles matching current coordinates
          // This ensures we count pixels only for templates actually being rendered
          const matchingTiles = Object.keys(template.chunked).filter(tile =>
            tile.startsWith(tileCoords)
          );
          return matchingTiles.length > 0;
        })
        .reduce((sum, template) => sum + (template.pixelCount.total || 0), 0);
      
      // Format pixel count with locale-appropriate thousands separators for better readability
      // Examples: "1,234,567" (US), "1.234.567" (DE), "1 234 567" (FR)
      const pixelCountFormatted = localizeNumber(totalPixels);
      
      // Display status information about the templates being rendered
      this.overlay.handleDisplayStatus(
        `Displaying ${templateCount} template${templateCount == 1 ? '' : 's'}.\nTotal pixels: ${pixelCountFormatted}`
      );
    } else {
      //this.overlay.handleDisplayStatus(`Displaying ${templateCount} templates.`);
      this.overlay.handleDisplayStatus(`Sleeping\nVersion: ${this.version}`);
      return tileBlob; // No templates are on this tile. Return the original tile early
    }
    
    const tileBitmap = await createImageBitmap(tileBlob);

    const canvas = new OffscreenCanvas(drawSize, drawSize);
    const context = canvas.getContext('2d');

    context.imageSmoothingEnabled = false; // Nearest neighbor

    // Tells the canvas to ignore anything outside of this area
    context.beginPath();
    context.rect(0, 0, drawSize, drawSize);
    context.clip();

    context.clearRect(0, 0, drawSize, drawSize); // Draws transparent background
    context.drawImage(tileBitmap, 0, 0, drawSize, drawSize); // Draw tile to canvas

    const tileBeforeTemplates = context.getImageData(0, 0, drawSize, drawSize);
    const tileBeforeTemplates32 = new Uint32Array(tileBeforeTemplates.data.buffer);
    
    // For each template in this tile, draw them.
    for (const template of templatesToDraw) {
      console.log(`Template:`);
      console.log(template);

      const templateHasErased = !!template.instance.pixelCount?.colors?.get(-1); // Does this template have Erased (#deface) pixels?

      // Obtains the template (for only this tile) as a Uint32Array
      let templateBeforeFilter32 = template.chunked32.slice();
      // Remove the `.slice()` and colors, once disabled, can never be re-enabled

      const coordXtoDrawAt = Number(template.pixelCoords[0]) * this.drawMult;
      const coordYtoDrawAt = Number(template.pixelCoords[1]) * this.drawMult;

      // Draws the template to the tile if there are no colors to filter, and there are no Erased pixels
      if ((this.shouldFilterColor.size == 0) && !templateHasErased) {
        context.drawImage(template.bitmap, coordXtoDrawAt, coordYtoDrawAt);
      }

      // If we failed to get the template for this tile, we use a shoddy, buggy, failsafe
      if (!templateBeforeFilter32) {
        const templateBeforeFilter = context.getImageData(coordXtoDrawAt, coordYtoDrawAt, template.bitmap.width, template.bitmap.height);
        templateBeforeFilter32 = new Uint32Array(templateBeforeFilter.data.buffer);
      }

      // Take the pre-filter template ImageData + the pre-filter tile ImageData, and use that to calculate the correct pixels
      const timer = Date.now();
      const {
        correctPixels: pixelsCorrect,
        filteredTemplate: templateAfterFilter
      } = this.#calculateCorrectPixelsOnTile_And_FilterTile({
        tile: tileBeforeTemplates32,
        template: templateBeforeFilter32,
        templateInfo: [coordXtoDrawAt, coordYtoDrawAt, template.bitmap.width, template.bitmap.height]
      });

      let pixelsCorrectTotal = 0;
      const transparentColorID = 0;

      // For each color with correct pixels placed for this template...
      for (const [color, total] of pixelsCorrect) {

        if (color == transparentColorID) {continue;} // Skip Transparent color

        pixelsCorrectTotal += total; // Add the current total for this color to the summed total of all correct
      }

      // If there are colors to filter, then we draw the filtered template on the canvas
      // Or, if there are Erased (#deface) pixels, then we draw the modified template on the canvas
      if ((this.shouldFilterColor.size != 0) || templateHasErased) {
        console.log('Colors to filter: ', this.shouldFilterColor);
        //context.putImageData(new ImageData(new Uint8ClampedArray(templateAfterFilter.buffer), template.bitmap.width, template.bitmap.height), coordXtoDrawAt, coordYtoDrawAt);
        context.drawImage(await createImageBitmap(new ImageData(new Uint8ClampedArray(templateAfterFilter.buffer), template.bitmap.width, template.bitmap.height)), coordXtoDrawAt, coordYtoDrawAt);
      }

      console.log(`Finished calculating correct pixels & filtering colors for the tile ${tileCoords} in ${(Date.now() - timer) / 1000} seconds!\nThere are ${pixelsCorrectTotal} correct pixels.`);

      // If "correct" does not exist as a key of the object "pixelCount", we create it
      if (typeof template.instance.pixelCount['correct'] == 'undefined') {
        template.instance.pixelCount['correct'] = {};
      }

      // Adds the correct pixel Map to the template instance
      template.instance.pixelCount['correct'][tileCoords] = pixelsCorrect;
    }

    return await canvas.convertToBlob({ type: 'image/png' });
  }

  /** Imports the JSON object, and appends it to any JSON object already loaded
   * @param {string} json - The JSON string to parse
   */
  importJSON(json) {

    console.log(`Importing JSON...`);
    console.log(json);

    // If the passed in JSON is a Blue Marble template object...
    if (json?.whoami == 'BlueMarble') {
      this.#parseBlueMarble(json); // ...parse the template object as Blue Marble
    }
  }

  /** Parses the Blue Marble JSON object
   * @param {string} json - The JSON string to parse
   * @since 0.72.13
   */
  async #parseBlueMarble(json) {

    console.log(`Parsing BlueMarble...`);

    const templates = json.templates;

    console.log(`BlueMarble length: ${Object.keys(templates).length}`);

    const schemaVersion = json?.schemaVersion;
    const schemaVersionArray = schemaVersion.split(/[-\.\+]/); // SemVer -> string[]
    const schemaVersionBleedingEdge = this.schemaVersion.split(/[-\.\+]/); // SemVer -> string[]
    const scriptVersion = json?.scriptVersion;

    console.log(`BlueMarble Template Schema: ${schemaVersion}; Script Version: ${scriptVersion}`);

    // If MAJOR version is up-to-date...
    if (schemaVersionArray[0] == schemaVersionBleedingEdge[0]) {

      // If MINOR version is NOT up-to-date...
      if (schemaVersionArray[1] != schemaVersionBleedingEdge[1]) {

        // Spawns a new Template Wizard
        const windowWizard = new WindowWizard(this.name, this.version, this.schemaVersion, this);
        windowWizard.buildWindow();
      }

      // Load using the latest schema loader. It will be fine, probably...
      this.templatesArray = await loadSchema({
        tileSize: this.tileSize,
        drawMult: this.drawMult,
        templatesArray: this.templatesArray
      });

    } else if (schemaVersionArray[0] < schemaVersionBleedingEdge[0]) {
      // Else if the MAJOR verison is out-of-date

      // Spawns a new Template Wizard
      const windowWizard = new WindowWizard(this.name, this.version, this.schemaVersion, this);
      windowWizard.buildWindow();
    
    } else {
      // We don't know what the schema is. Unsupported?

      this.overlay.handleDisplayError(`Template version ${schemaVersion} is unsupported.\nUse Blue Marble version ${scriptVersion} or load a new template.`);
    }

    /** Loads schema of Blue Marble template storage
     * @param {Object} params - Object containing parameters
     * @param {number} params.tileSize - Size of tile
     * @param {number} params.drawMult - Tile scale multiplier
     * @param {Array<Template>} params.templatesArray - Array of Template instances
     * @since 0.88.434
     */
    async function loadSchema({
      tileSize: tileSize,
      drawMult: drawMult,
      templatesArray: templatesArray
    }) {

      // Run only if there are templates saved
      if (Object.keys(templates).length > 0) {
  
        // For each template...
        for (const template in templates) {
  
          const templateKey = template; // The identification key for the template. E.g., "0 $Z"
          const templateValue = templates[template]; // The actual content of the template
          console.log(`Template Key: ${templateKey}`);
  
          if (templates.hasOwnProperty(template)) {
  
            const templateKeyArray = templateKey.split(' '); // E.g., "0 $Z" -> ["0", "$Z"]
            const sortID = Number(templateKeyArray?.[0]); // Sort ID of the template
            const authorID = templateKeyArray?.[1] || '0'; // User ID of the person who exported the template
            const displayName = templateValue.name || `Template ${sortID || ''}`; // Display name of the template
            //const coords = templateValue?.coords?.split(',').map(Number); // "1,2,3,4" -> [1, 2, 3, 4]
  
            const pixelCount = {
              total: templateValue.pixels?.total,
              colors: new Map(Object.entries(templateValue.pixels?.colors || {}).map(([key, value]) => [Number(key), value]))
            };
  
            const tilesbase64 = templateValue.tiles;
            const templateTiles = {}; // Stores the template bitmap tiles for each tile.
            const templateTiles32 = {}; // Stores the template Uint32Array tiles for each tile.
  
            const actualTileSize = tileSize * drawMult;
  
            for (const tile in tilesbase64) {
              console.log(tile);
              if (tilesbase64.hasOwnProperty(tile)) {
                const encodedTemplateBase64 = tilesbase64[tile];
                const templateUint8Array = base64ToUint8(encodedTemplateBase64); // Base 64 -> Uint8Array
  
                const templateBlob = new Blob([templateUint8Array], { type: "image/png" }); // Uint8Array -> Blob
                const templateBitmap = await createImageBitmap(templateBlob) // Blob -> Bitmap
                templateTiles[tile] = templateBitmap;
  
                // Converts to Uint32Array
                const canvas = new OffscreenCanvas(actualTileSize, actualTileSize);
                const context = canvas.getContext('2d');
                context.drawImage(templateBitmap, 0, 0);
                const imageData = context.getImageData(0, 0, templateBitmap.width, templateBitmap.height);
                templateTiles32[tile] = new Uint32Array(imageData.data.buffer);
              }
            }
  
            // Creates a new Template class instance
            const template = new Template({
              displayName: displayName,
              sortID: sortID || this.templatesArray?.length || 0,
              authorID: authorID || '',
              //coords: coords,
            });
            template.pixelCount = pixelCount;
            template.chunked = templateTiles;
            template.chunked32 = templateTiles32;
            
            templatesArray.push(template);
            console.log(this.templatesArray);
            console.log(`^^^ This ^^^`);
          }
        }
      }

      return templatesArray
    }
  }

  /** Parses the OSU! Place JSON object
   */
  #parseOSU() {

  }

  /** Sets the `templatesShouldBeDrawn` boolean to a value.
   * @param {boolean} value - The value to set the boolean to
   * @since 0.73.7
   */
  setTemplatesShouldBeDrawn(value) {
    this.templatesShouldBeDrawn = value;
  }

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
  #calculateCorrectPixelsOnTile_And_FilterTile({
    tile: tile32, 
    template: template32, 
    templateInfo: templateInformation
  }) {

    // Size of a pixel in actuality
    const pixelSize = this.drawMult;

    // Tile information
    const tileWidth = this.tileSize * pixelSize;
    const tileHeight = tileWidth;
    const tilePixelOffsetY = -1; // Shift off of target template pixel to target on tile. E.g. "-1" would be the pixel above the template pixel on the tile
    const tilePixelOffsetX = 0; // Shift off of target template pixel to target on tile. E.g. "-1" would be the pixel to the left of the template pixel on the tile

    // Template information
    const templateCoordX = templateInformation[0];
    const templateCoordY = templateInformation[1];
    const templateWidth = templateInformation[2];
    const templateHeight = templateInformation[3];
    const tolerance = this.paletteTolerance;

    //console.log(`TemplateX: ${templateCoordX}\nTemplateY: ${templateCoordY}\nStarting Row:${templateCoordY+tilePixelOffsetY}\nStarting Column:${templateCoordX+tilePixelOffsetX}`);

    const { palette: _, LUT: lookupTable } = this.paletteBM; // Obtains the palette and LUT

    // Makes a copy of the color palette Blue Marble uses, turns it into a Map, and adds data to count the amount of each color
    const _colorpalette = new Map(); // Temp color palette

    // For each center pixel...
    for (let templateRow = 1; templateRow < templateHeight; templateRow += pixelSize) {
      for (let templateColumn = 1; templateColumn < templateWidth; templateColumn += pixelSize) {

        // The pixel on the tile to target (1 pixel above the template)
        const tileRow = (templateCoordY + templateRow) + tilePixelOffsetY; // (Template offset + current row) - 1
        const tileColumn = (templateCoordX + templateColumn) + tilePixelOffsetX; // Template offset + current column
        
        // Retrieves the targeted pixels
        const tilePixelAbove = tile32[(tileRow * tileWidth) + tileColumn];
        const templatePixel = template32[(templateRow * templateWidth) + templateColumn];

        // Obtains the alpha channel of the targeted pixels
        const templatePixelAlpha = (templatePixel >>> 24) & 0xFF;
        const tilePixelAlpha = (tilePixelAbove >>> 24) & 0xFF;

        // Finds the best matching color ID for the template pixel. If none is found, default to "-2"
        const bestTemplateColorID = lookupTable.get(templatePixel) ?? -2;

        // -----     COLOR FILTER      -----
        // If this pixel on the template is a color the user wants to hide on the canvas...
        if (this.shouldFilterColor.get(bestTemplateColorID)) {

          // Sets template pixel to match tile background (which removes the template pixel from the user's view)
          template32[(templateRow * templateWidth) + templateColumn] = tilePixelAbove;
        }
        // -----  END OF COLOR FILTER  -----

        // -----        ERASED         -----
        // If this pixel on the template is the Erased (#deface) color...
        if (bestTemplateColorID == -1) {

          const blackTrans = 0x20000000; // Black translucent color for Erased pixels

          // If Erased color should be filtered
          if (this.shouldFilterColor.get(bestTemplateColorID)) {
            template32[(templateRow * templateWidth) + templateColumn] = 0x00000000; // Center (black, 0% opacity)
          } else {
            // Don't filter Erased color

            // If the tile row and tile column are even,
            // Or the tile row and tile column are odd...
            if (((tileRow / pixelSize) & 1) == ((tileColumn / pixelSize) & 1)) {

              // Sets the template pixels to be a semi-transparent, black grid
              template32[(templateRow * templateWidth) + templateColumn] = blackTrans; // Center
              template32[((templateRow - 1) * templateWidth) + (templateColumn - 1)] = blackTrans; // Top Left
              template32[((templateRow - 1) * templateWidth) + (templateColumn + 1)] = blackTrans; // Top Right
              template32[((templateRow + 1) * templateWidth) + (templateColumn - 1)] = blackTrans; // Bottom Left
              template32[((templateRow + 1) * templateWidth) + (templateColumn + 1)] = blackTrans; // Bottom Right
            } else {
              // Else, either the row or column is odd, and the other is even.

              // Sets the template pixels to the the inverse of a semi-transparent, black grid
              template32[(templateRow * templateWidth) + templateColumn] = 0x00000000; // Center (black, 0% opacity)
              template32[((templateRow - 1) * templateWidth) + (templateColumn)] = blackTrans; // Top Center
              template32[((templateRow + 1) * templateWidth) + (templateColumn)] = blackTrans; // Bottom Center
              template32[((templateRow) * templateWidth) + (templateColumn - 1)] = blackTrans; // Middle Left
              template32[((templateRow) * templateWidth) + (templateColumn + 1)] = blackTrans; // Middle Right
            }
          }
        }
        // -----     END OF ERASED     -----

        // If the template pixel is Erased, and the tile pixel is transparent...
        if ((bestTemplateColorID == -1) && (tilePixelAbove <= tolerance)) {

          // Increments the count by 1 for the Erased (#deface) color.
          // If the color ID has not been counted yet, default to 1
          const colorIDcount = _colorpalette.get(bestTemplateColorID);
          _colorpalette.set(bestTemplateColorID, colorIDcount ? colorIDcount + 1 : 1);
          continue;
        }
        // If the code passes this point, the pixel is not a correct Erased color.

        // If either pixel is transparent...
        if ((templatePixelAlpha <= tolerance) || (tilePixelAlpha <= tolerance)) {
          continue; // ...we skip it. We can't match the RGB color of transparent pixels.
        }
        // If the code passes this point, both pixels are opaque & not Erased.

        // Finds the best matching color ID for the tile pixel. If none is found, default to "-2"
        const bestTileColorID = lookupTable.get(tilePixelAbove) ?? -2;

        // If the template pixel does not match the tile pixel, then the pixel is skipped.
        if (bestTileColorID != bestTemplateColorID) {continue;}
        // If the code passes this point, the template pixel matches the tile pixel.

        // Increments the count by 1 for the best matching color ID (which can be negative).
        // If the color ID has not been counted yet, default to 1
        const colorIDcount = _colorpalette.get(bestTemplateColorID);
        _colorpalette.set(bestTemplateColorID, colorIDcount ? colorIDcount + 1 : 1);
      }
    }

    console.log(`List of template pixels that match the tile:`);
    console.log(_colorpalette);
    return { correctPixels: _colorpalette, filteredTemplate: template32 };
  }
}
