/** ApiManager class for handling API requests, responses, and interactions.
 * Note: Fetch spying is done in main.js, not here.
 * @class ApiManager
 * @since 0.11.1
 */

import TemplateManager from "./templateManager.js";
import { consoleError, escapeHTML, localizeNumber, numberToEncoded, serverTPtoDisplayTP } from "./utils.js";

export default class ApiManager {

  /** Constructor for ApiManager class
   * @param {TemplateManager} templateManager 
   * @since 0.11.34
   */
  constructor(templateManager) {
    this.templateManager = templateManager;
    this.disableAll = false; // Should the entire userscript be disabled?
    this.chargeRefillTimerID = ''; // Contains the Charge refill timer element ID attribute so we can update the timer.
    this.coordsTilePixel = []; // Contains the last detected tile/pixel coordinate pair requested
    this.templateCoordsTilePixel = []; // Contains the last "enabled" template coords
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

      // Returns early if the message was not intended for Blue Marble
      if (!(data && data['source'] === 'blue-marble')) {return;}

      // Returns early if the message has no endpoint (intended for Blue Marble, but not this function)
      if (!data['endpoint']) {return;}

      // Trims endpoint to the second to last non-number, non-null directoy.
      // E.g. "wplace.live/api/pixel/0/0?payload" -> "pixel"
      // E.g. "wplace.live/api/files/s0/tiles/0/0/0.png" -> "tiles"
      const endpointText = data['endpoint']?.split('?')[0].split('/').filter(s => s && isNaN(Number(s))).filter(s => s && !s.includes('.')).pop();

      console.log(`%cBlue Marble%c: Recieved message about "%s"`, 'color: cornflowerblue;', '', endpointText);

      // Each case is something that Blue Marble can use from the fetch.
      // For instance, if the fetch was for "me", we can update the overlay stats
      switch (endpointText) {

        case 'me': // Request to retrieve user data

          // If the game can not retrieve the userdata...
          if (dataJSON['status'] && dataJSON['status']?.toString()[0] != '2') {
            // The server is probably down (NOT a 2xx status)
            
            overlay.handleDisplayError(`You are not logged in or Wplace is offline!\nCould not fetch userdata.`);
            return; // Returns early to avoid displaying null userdata
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

          // Obtains the refill timer for charges
          if (this.chargeRefillTimerID.length != 0) {
            const chargeRefillTimer = document.querySelector('#' + this.chargeRefillTimerID);
            
            // If the refill timer exists...
            if (chargeRefillTimer) {
              
              /** Obtains the information about the user's charges @type {{cooldownMs: number, count: number, max: number}} */
              const chargeData = dataJSON['charges'];
  
              // Date that the user's charges will be refilled
              chargeRefillTimer.dataset['endDate'] = Date.now() + ((chargeData['max'] - chargeData['count']) * chargeData['cooldownMs']);
            }
          }

          // Updates displayed droplet information
          overlay.updateInnerHTML('bm-user-droplets', `Droplets: <b>${localizeNumber(dataJSON['droplets'])}</b>`); // Updates the text content of the droplets field
          overlay.updateInnerHTML('bm-user-nextlevel', `Next level in <b>${localizeNumber(nextLevelPixels)}</b> pixel${nextLevelPixels == 1 ? '' : 's'}`); // Updates the text content of the next level field
          break;

        case 'pixel': // Request to retrieve pixel data
          const coordsTile = data['endpoint'].split('?')[0].split('/').filter(s => s && !isNaN(Number(s))); // Retrieves the tile coords as [x, y]
          const payloadExtractor = new URLSearchParams(data['endpoint'].split('?')[1]); // Declares a new payload deconstructor and passes in the fetch request payload
          const coordsPixel = [payloadExtractor.get('x'), payloadExtractor.get('y')]; // Retrieves the deconstructed pixel coords from the payload
          
          // Don't save the coords if there are previous coords that could be used
          if (this.coordsTilePixel.length && (!coordsTile.length || !coordsPixel.length)) {
            overlay.handleDisplayError(`Coordinates are malformed!\nDid you try clicking the canvas first?`);
            return; // Returns early
          }
          
          this.coordsTilePixel = [...coordsTile, ...coordsPixel]; // Combines the two arrays such that [x, y, x, y]
          
          const displayTP = serverTPtoDisplayTP(coordsTile, coordsPixel); // Retrieves the coordinates that Wplace displays for this region

          const spanElements = document.querySelectorAll('span'); // Retrieves all span elements

          // For every span element, find the one we want (pixel numbers when canvas clicked)
          for (const element of spanElements) {
            // We use the pixel numbers to find this element because it is the only identifiable piece of information, assuming the website can load in non-Engligh languages.

            const elementTextTrimmed = element.textContent.trim(); // Stores the text of the span element, without leading or trailing spaces

            // If the text content of the element includes both coordinates seperatly (avoids failure when the comma seperator changes due to localization)
            if (elementTextTrimmed.includes(displayTP[0]) && elementTextTrimmed.includes(displayTP[1])) {

              let displayCoords = document.querySelector('#bm-display-coords'); // Find the additional pixel coords span

              const text = `(Tl X: ${coordsTile[0]}, Tl Y: ${coordsTile[1]}, Px X: ${coordsPixel[0]}, Px Y: ${coordsPixel[1]})`;
              
              // All 4 coordinate labels, IDs, and values
              const coordsLabel = ['Tl X:', 'Tl Y:', 'Px X:', 'Px Y:'];
              const coordsID = ['bm-tile-x', 'bm-tile-y', 'bm-pixel-x', 'bm-pixel-y'];
              const coordsCombined = [...coordsTile, ...coordsPixel];

              // If we could not find the addition coord span, we make it then update the textContent with the new coords
              if (!displayCoords) {
                displayCoords = document.createElement('span');
                displayCoords.id = 'bm-display-coords';
                displayCoords.style = 'display: flex; flex-wrap: wrap; gap: 0 1ch; font-size: small;';

                // For each of the 4 coordinates...
                for (const [coordIndex, coordValue] of coordsCombined.entries()) {

                  const coordElement = document.createElement('span'); // Creates a `<span>` element

                  coordElement.id = coordsID[coordsCombined.indexOf(coordValue) ?? '']; // Applys the ID to the coord element

                  // Outputs something like "Tl X: 483"
                  coordElement.textContent = `${coordsLabel[coordIndex] ?? '??:'} ${coordValue}`;
                  // Or if the amount of labels is less than the provided values, it outputs something like "??: 483" instead of failing

                  displayCoords.appendChild(coordElement); // Adds the span coordinate as a child for the flexbox container
                }

                // Adds the display coordinate flexbox container to the pixel info menu
                element.parentNode.parentNode.parentNode.insertAdjacentElement('afterend', displayCoords);
              } else {
                
                // For each of the 4 coordinates...
                for (const [coordIndex, coordID] of coordsID.entries()) {

                  const coordElement = document.getElementById(coordID); // Obtains the coordinate element

                  // Outputs something like "Tl X: 483"
                  coordElement.textContent = `${coordsLabel[coordIndex] ?? '??:'} ${coordsCombined[coordIndex]}`;
                  // Or if the amount of labels is less than the provided values, it outputs something like "??: 483" instead of failing
                }
              }
            }
          }
          break;
        
        case 'tile':
        case 'tiles':

          let tileCoordsTile = data['endpoint'].split('/');
          tileCoordsTile = [parseInt(tileCoordsTile[tileCoordsTile.length - 2]), parseInt(tileCoordsTile[tileCoordsTile.length - 1].replace('.png', ''))];
          
          const blobUUID = data['blobID'];
          const blobData = data['blobData'];
          
          const timer = Date.now();
          const templateBlob = await this.templateManager.drawTemplateOnTile(blobData, tileCoordsTile);
          console.log(`Finished loading the tile in ${(Date.now() - timer) / 1000} seconds!`);

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

    let userSettings = await GM.getValue('bmUserSettings', '{}')
    userSettings = JSON.parse(userSettings);

    if (!userSettings || !userSettings.telemetry || !userSettings.uuid) {
      console.log('Telemetry is disabled, not sending heartbeat.');
      return; // If telemetry is disabled, do not send heartbeat
    }

    const ua = navigator.userAgent;
    let browser = await this.getBrowserFromUA(ua);
    let os = this.getOS(ua);

    // No await. We are throwing data into the void, and we don't expect anything in return.
    GM.xmlhttpRequest({
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

  async getBrowserFromUA(ua = navigator.userAgent) {
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

    // Samsung's default internet browser
    if (ua.includes("SamsungBrowser")) return "Samsung Internet";

    // Brave (will probably not work, but I'm including it anyways)
    if (navigator.brave && typeof navigator.brave.isBrave === "function") {
      if (await navigator.brave.isBrave()) return "Brave";
    }
    // If it does not work, "Chrome" is reported instead

    // Firefox
    if (ua.includes("Firefox/")) return "Firefox";

    // Chrome (catch-all for Chromium browsers)
    if (ua.includes("Chrome/")) return "Chrome";

    // Safari (must be after Chrome check)
    if (ua.includes("Safari/")) return "Safari";

    // Fallback
    return 'Unknown';
  }

  getOS(ua = navigator.userAgent) {
    ua = ua || "";

    // Windows
    if (/Windows NT 10\.0/i.test(ua)) return "Windows 10"; // Also Windows 11
    if (/Windows NT 6\.3/i.test(ua)) return "Windows 8.1";
    if (/Windows NT 6\.2/i.test(ua)) return "Windows 8";
    if (/Windows NT 6\.1/i.test(ua)) return "Windows 7";
    if (/Windows NT 6\.0/i.test(ua)) return "Windows Vista";
    if (/Windows NT 5\.1|Windows XP/i.test(ua)) return "Windows XP";

    // ChromeOS
    if (/CrOS/i.test(ua)) return "ChromeOS"; // Also reports as Linux (because it is), so this must be returned before the Linux check

    // MacOS
    if (/Mac OS X 10[_\.]15/i.test(ua)) return "macOS Catalina"; // For privacy reasons, most browsers report this version
    if (/Mac OS X 10[_\.]14/i.test(ua)) return "macOS Mojave";
    if (/Mac OS X 10[_\.]13/i.test(ua)) return "macOS High Sierra";
    if (/Mac OS X 10[_\.]12/i.test(ua)) return "macOS Sierra";
    if (/Mac OS X 10[_\.]11/i.test(ua)) return "OS X El Capitan";
    if (/Mac OS X 10[_\.]10/i.test(ua)) return "OS X Yosemite";
    if (/Mac OS X 1[5-9][_\.]/i.test(ua)) return "macOS Sequoia or newer";
    if (/Mac OS X 14[_\.]/i.test(ua)) return "macOS Sonoma";
    if (/Mac OS X 13[_\.]/i.test(ua)) return "macOS Ventura";
    if (/Mac OS X 12[_\.]/i.test(ua)) return "macOS Monterey";
    if (/Mac OS X 11[_\.]/i.test(ua)) return "macOS Big Sur";
    if (/Mac OS X 10[_\.]/i.test(ua)) return "macOS";

    // Mobiles
    if (/Android/i.test(ua)) return "Android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";

    // FOSS
    if (/Linux/i.test(ua)) return "Linux";

    return "Unknown"; // Fallback
  }
}
