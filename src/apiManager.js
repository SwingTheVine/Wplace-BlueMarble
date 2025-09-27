/** ApiManager class for handling API requests, responses, and interactions.
 * Note: Fetch spying is done in main.js, not here.
 * @class ApiManager
 * @since 0.11.1
 */

import TemplateManager from "./templateManager.js";
import { consoleError, escapeHTML, numberToEncoded, serverTPtoDisplayTP, colorpalette } from "./utils.js";

export default class ApiManager {

  /** Constructor for ApiManager class
   * @param {TemplateManager} templateManager 
   * @since 0.11.34
   */
  constructor(templateManager) {
    this.templateManager = templateManager;
    this.disableAll = false; // Should the entire userscript be disabled?
    this.coordsTilePixel = []; // Contains the last detected tile/pixel coordinate pair requested
    this.templateCoordsTilePixel = []; // Contains the last "enabled" template coords
    this.colorMap = this.#buildColorMap(); // RGB to color name mapping
  }
  
  #buildColorMap() {
    const map = new Map();
    colorpalette.forEach(color => {
      if (color?.rgb && color?.name) {
        map.set(`${color.rgb[0]},${color.rgb[1]},${color.rgb[2]}`, color.name);
      }
    });
    return map;
  }
  
  #getColorName(r, g, b) {
    return this.colorMap.get(`${r},${g},${b}`) || `RGB(${r},${g},${b})`;
  }

  /** Determines if the spontaneously received response is something we want.
   * Otherwise, we can ignore it.
   * Note: Due to aggressive compression, make your calls like `data['jsonData']['name']` instead of `data.jsonData.name`
   * 
   * @param {Overlay} overlay - The Overlay class instance
   * @since 0.11.1
  */
  spontaneousResponseListener(overlay) {

    // Triggers whenever a message is sent
    window.addEventListener('message', async (event) => {

      const data = event.data; // The data of the message
      const dataJSON = data['jsonData']; // The JSON response, if any

      // Kills itself if the message was not intended for Blue Marble
      if (!(data && data['source'] === 'blue-marble')) {return;}



      // Kills itself if the message has no endpoint (intended for Blue Marble, but not this function)
      if (!data['endpoint']) {return;}

      // Trims endpoint to the second to last non-number, non-null directoy.
      // E.g. "wplace.live/api/pixel/0/0?payload" -> "pixel"
      // E.g. "wplace.live/api/files/s0/tiles/0/0/0.png" -> "tiles"
      const endpointText = data['endpoint']?.split('?')[0].split('/').filter(s => s && isNaN(Number(s))).filter(s => s && !s.includes('.')).pop();

      console.log(`%cBlue Marble%c: Recieved message about "%s"`, 'color: cornflowerblue;', '', endpointText);

      // Each case is something that Blue Marble can use from the fetch.
      // For instance, if the fetch was for "me", we can update the overlay stats
      console.log(`endpointText: ${endpointText}`);
      switch (endpointText) {

        case 'me': // Request to retrieve user data

          // If the game can not retrieve the userdata...
          if (dataJSON['status'] && dataJSON['status']?.toString()[0] != '2') {
            // The server is probably down (NOT a 2xx status)
            
            overlay.handleDisplayError(`You are not logged in!\nCould not fetch userdata.`);
            return; // Kills itself before attempting to display null userdata
          }

          const nextLevelPixels = Math.ceil(Math.pow(Math.floor(dataJSON['level']) * Math.pow(30, 0.65), (1/0.65)) - dataJSON['pixelsPainted']); // Calculates pixels to the next level

          console.log(dataJSON['id']);
          if (!!dataJSON['id'] || dataJSON['id'] === 0) {
            console.log(numberToEncoded(
              dataJSON['id'],
              '!#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~'
            ));
          }
          this.templateManager.userID = dataJSON['id'];
          
          overlay.updateInnerHTML('bm-user-name', `Username: <b>${escapeHTML(dataJSON['name'])}</b>`); // Updates the text content of the username field
          overlay.updateInnerHTML('bm-user-droplets', `Droplets: <b>${new Intl.NumberFormat().format(dataJSON['droplets'])}</b>`); // Updates the text content of the droplets field
          overlay.updateInnerHTML('bm-user-nextlevel', `Next level in <b>${new Intl.NumberFormat().format(nextLevelPixels)}</b> pixel${nextLevelPixels == 1 ? '' : 's'}`); // Updates the text content of the next level field
          break;

        case 'pixel': // Request to retrieve pixel data
          // Reset color display immediately
          const existingColorDisplay = document.querySelector('#bm-display-color');
          if (existingColorDisplay) {
            existingColorDisplay.innerHTML = 'Loading color...';
          }
          
          const coordsTile = data['endpoint'].split('?')[0].split('/').filter(s => s && !isNaN(Number(s))); // Retrieves the tile coords as [x, y]
          const payloadExtractor = new URLSearchParams(data['endpoint'].split('?')[1]); // Declares a new payload deconstructor and passes in the fetch request payload
          const coordsPixel = [payloadExtractor.get('x'), payloadExtractor.get('y')]; // Retrieves the deconstructed pixel coords from the payload
          
          console.log(`Pixel clicked at tile (${coordsTile[0]}, ${coordsTile[1]}) pixel (${coordsPixel[0]}, ${coordsPixel[1]})`);
          console.log('Pixel API response:', dataJSON);
          console.log('Available response fields:', Object.keys(dataJSON || {}));

          // Don't save the coords if there are previous coords that could be used
          if (this.coordsTilePixel.length && (!coordsTile.length || !coordsPixel.length)) {
            overlay.handleDisplayError(`Coordinates are malformed!\nDid you try clicking the canvas first?`);
            return; // Kills itself
          }
          
          this.coordsTilePixel = [...coordsTile, ...coordsPixel]; // Combines the two arrays such that [x, y, x, y]
          const displayTP = serverTPtoDisplayTP(coordsTile, coordsPixel);
          

          
          // Calculate pixel color information
          const pixelColor = await this.#calculatePixelColor(coordsTile, coordsPixel, dataJSON);
          
          const spanElements = document.querySelectorAll('span'); // Retrieves all span elements

          // For every span element, find the one we want (pixel numbers when canvas clicked)
          for (const element of spanElements) {
            if (element.textContent.trim().includes(`${displayTP[0]}, ${displayTP[1]}`)) {

              let displayCoords = document.querySelector('#bm-display-coords'); // Find the additional pixel coords span
              let displayColor = document.querySelector('#bm-display-color'); // Find the color info span

              const coordsText = `(Tl X: ${coordsTile[0]}, Tl Y: ${coordsTile[1]}, Px X: ${coordsPixel[0]}, Px Y: ${coordsPixel[1]})`;
              
              // Create or update coordinates display
              if (!displayCoords) {
                displayCoords = document.createElement('span');
                displayCoords.id = 'bm-display-coords';
                displayCoords.textContent = coordsText;
                displayCoords.style = 'margin-left: calc(var(--spacing)*3); font-size: small;';
                element.parentNode.parentNode.parentNode.insertAdjacentElement('afterend', displayCoords);
              } else {
                displayCoords.textContent = coordsText;
              }
              
              // Create or update color display
              if (!displayColor) {
                displayColor = document.createElement('div');
                displayColor.id = 'bm-display-color';
                displayColor.style = 'margin-left: calc(var(--spacing)*3); font-size: small; margin-top: 4px;';
                element.parentNode.parentNode.parentNode.insertAdjacentElement('afterend', displayColor);
              }
              displayColor.innerHTML = pixelColor;
            }
          }
          break;
        
        case 'tiles':

          // Runs only if the tile has the template
          let tileCoordsTile = data['endpoint'].split('/');
          tileCoordsTile = [parseInt(tileCoordsTile[tileCoordsTile.length - 2]), parseInt(tileCoordsTile[tileCoordsTile.length - 1].replace('.png', ''))];
          
          const blobUUID = data['blobID'];
          const blobData = data['blobData'];
          
          const templateBlob = await this.templateManager.drawTemplateOnTile(blobData, tileCoordsTile);

          window.postMessage({
            source: 'blue-marble',
            blobID: blobUUID,
            blobData: templateBlob,
            blink: data['blink']
          });
          break;

        case 'robots': // Request to retrieve what script types are allowed
          this.disableAll = dataJSON['userscript']?.toString().toLowerCase() == 'false'; // Disables Blue Marble if site owner wants userscripts disabled
          break;
      }
    });
  }

  // Sends a heartbeat to the telemetry server
  async sendHeartbeat(version) {

    console.log('Sending heartbeat to telemetry server...');

    let userSettings = GM_getValue('bmUserSettings', '{}')
    userSettings = JSON.parse(userSettings);

    if (!userSettings || !userSettings.telemetry || !userSettings.uuid) {
      console.log('Telemetry is disabled, not sending heartbeat.');
      return; // If telemetry is disabled, do not send heartbeat
    }

    const ua = navigator.userAgent;
    let browser = await this.#getBrowserFromUA(ua);
    let os = this.#getOS(ua);

    GM_xmlhttpRequest({
      method: 'POST',
      url: 'https://telemetry.thebluecorner.net/heartbeat',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        uuid: userSettings.uuid,
        version: version,
        browser: browser,
        os: os,
      }),
      onload: (response) => {
        if (response.status !== 200) {
          consoleError('Failed to send heartbeat:', response.statusText);
        }
      },
      onerror: (error) => {
        consoleError('Error sending heartbeat:', error);
      }
    });
  }

  async #getBrowserFromUA(ua = navigator.userAgent) {
    ua = ua || "";

    // Opera
    if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";

    // Edge (Chromium-based uses "Edg/")
    if (ua.includes("Edg/")) return "Edge";

    // Vivaldi
    if (ua.includes("Vivaldi")) return "Vivaldi";

    // Yandex
    if (ua.includes("YaBrowser")) return "Yandex";

    // Kiwi (not guaranteed, but typically shows "Kiwi")
    if (ua.includes("Kiwi")) return "Kiwi";

    // Brave (doesn't expose in UA by default; heuristic via Brave/ token in some versions)
    if (ua.includes("Brave")) return "Brave";

    // Firefox
    if (ua.includes("Firefox/")) return "Firefox";

    // Chrome (catch-all for Chromium browsers)
    if (ua.includes("Chrome/")) return "Chrome";

    // Safari (must be after Chrome check)
    if (ua.includes("Safari/")) return "Safari";

    // Brave special check
    if (navigator.brave && typeof navigator.brave.isBrave === "function") {
      if (await navigator.brave.isBrave()) return "Brave";
    }

    // Fallback
    return 'Unknown';
  }

  #getOS(ua = navigator.userAgent) {
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
    if (/Mac OS X 10[_\.]/i.test(ua)) return "macOS"; // Generic fallback

    if (/Android/i.test(ua)) return "Android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";

    if (/Linux/i.test(ua)) return "Linux";

    return "Unknown";
  }

  async #getCurrentPixelColor(coordsTile, coordsPixel) {
    try {
      // Use the same URL format as the main tile fetching system
      const tileUrl = `https://backend.wplace.live/files/s0/tiles/${coordsTile[0]}/${coordsTile[1]}.png`;
      const response = await fetch(tileUrl);
      
      if (!response.ok) {
        console.warn(`Tile fetch failed: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(bitmap, 0, 0);
      
      const imageData = ctx.getImageData(parseInt(coordsPixel[0]), parseInt(coordsPixel[1]), 1, 1);
      const [r, g, b, a] = imageData.data;
      
      return a >= 64 ? { r, g, b } : null;
    } catch (error) {
      console.warn('Failed to get current pixel color:', error);
      return null;
    }
  }

  /** Calculates pixel color information and checks against template
   * @param {Array} coordsTile - Tile coordinates [x, y]
   * @param {Array} coordsPixel - Pixel coordinates [x, y] 
   * @param {Object} responseData - API response data containing color info
   * @returns {string} HTML string with color information
   */
  async #calculatePixelColor(coordsTile, coordsPixel, responseData) {
    try {
      // Get template color
      const templateColor = this.templateManager.getTemplateColorAt(coordsTile, coordsPixel);
      
      if (!templateColor) {
        return '<span style="color: #888;">Current: N/A • Template: N/A • No template at this position</span>';
      }
      
      const { r: templateR, g: templateG, b: templateB } = templateColor;
      const templateColorName = this.#getColorName(templateR, templateG, templateB);
      
      // Get current pixel color from tile
      const currentColor = await this.#getCurrentPixelColor(coordsTile, coordsPixel);
      
      if (!currentColor) {
        return `<span style="color: #888;">Current: Transparent</span> • <span style="color: rgb(${templateR},${templateG},${templateB});">■</span> Template: ${templateColorName} • <span style="color: #f44336;">✗ Wrong</span>`;
      }
      
      const { r: currentR, g: currentG, b: currentB } = currentColor;
      const isCorrect = (currentR === templateR && currentG === templateG && currentB === templateB);
      const status = isCorrect ? 
        '<span style="color: #4CAF50;">✓ Correct</span>' : 
        '<span style="color: #f44336;">✗ Wrong</span>';
      
      const currentColorName = this.#getColorName(currentR, currentG, currentB);
      
      return `<span style="color: rgb(${currentR},${currentG},${currentB});">■</span> Current: ${currentColorName} • <span style="color: rgb(${templateR},${templateG},${templateB});">■</span> Template: ${templateColorName} • ${status}`;
    } catch (error) {
      console.warn('Error calculating pixel color:', error);
      return '<span style="color: #f44336;">Current: Error • Template: Error • Error calculating color</span>';
    }
  }
}
