/** @file The main file. Everything in the userscript is executed from here.
 * @since 0.0.0
 */

import Observers from './observers.js';
import ApiManager from './apiManager.js';
import TemplateManager from './templateManager.js';
import { consoleLog, consoleWarn, consoleInfo, waitForDOMReady } from './utils.js';
import WindowMain from './WindowMain.js';
import WindowTelemetry from './WindowTelemetry.js';
import SettingsManager from './settingsManager.js';

const name = GM_info.script.name.toString(); // Name of userscript
const version = GM_info.script.version.toString(); // Version of userscript
const consoleStyle = 'color: cornflowerblue;'; // The styling for the console logs

/** What code to execute instantly in the client (webpage) to spy on fetch calls.
 * This code will execute outside of TamperMonkey's sandbox.
 * @since 0.11.15
 */
const injectionCode = () => {

  const script = document.currentScript; // Gets the current script HTML Script Element
  const name = script?.getAttribute('bm-name') || 'Blue Marble'; // Gets the name value that was passed in. Defaults to "Blue Marble" if nothing was found
  const consoleStyle = script?.getAttribute('bm-cStyle') || ''; // Gets the console style value that was passed in. Defaults to no styling if nothing was found
  const fetchedBlobQueue = new Map(); // Blobs being processed

  window.addEventListener('message', (event) => {
    const { source, endpoint, blobID, blobData, blink } = event.data;

    const elapsed = Date.now() - blink;

    // Since this code does not run in the userscript, we can't use consoleLog().
    console.groupCollapsed(`%c${name}%c: ${fetchedBlobQueue.size} Recieved IMAGE message about blob "${blobID}"`, consoleStyle, '');
    console.log(`Blob fetch took %c${String(Math.floor(elapsed/60000)).padStart(2,'0')}:${String(Math.floor(elapsed/1000) % 60).padStart(2,'0')}.${String(elapsed % 1000).padStart(3,'0')}%c MM:SS.mmm`, consoleStyle, '');
    console.log(fetchedBlobQueue);
    console.groupEnd();

    // The modified blob won't have an endpoint, so we ignore any message without one.
    if ((source == 'blue-marble') && !!blobID && !!blobData && !endpoint) {

      const callback = fetchedBlobQueue.get(blobID); // Retrieves the blob based on the UUID

      // If the blobID is a valid function...
      if (typeof callback === 'function') {

        callback(blobData); // ...Retrieve the blob data from the blobID function
      } else {
        // ...else the blobID is unexpected. We don't know what it is, but we know for sure it is not a blob. This means we ignore it.

        consoleWarn(`%c${name}%c: Attempted to retrieve a blob (%s) from queue, but the blobID was not a function! Skipping...`, consoleStyle, '', blobID);
      }

      fetchedBlobQueue.delete(blobID); // Delete the blob from the queue, because we don't need to process it again
    }
  });

  // Spys on "spontaneous" fetch requests made by the client
  const originalFetch = window.fetch; // Saves a copy of the original fetch

  // Overrides fetch
  window.fetch = async function(...args) {

    const response = await originalFetch.apply(this, args); // Sends a fetch
    const cloned = response.clone(); // Makes a copy of the response

    // Retrieves the endpoint name. Unknown endpoint = "ignore"
    const endpointName = ((args[0] instanceof Request) ? args[0]?.url : args[0]) || 'ignore';

    // Check Content-Type to only process JSON
    const contentType = cloned.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {


      // Since this code does not run in the userscript, we can't use consoleLog().
      console.log(`%c${name}%c: Sending JSON message about endpoint "${endpointName}"`, consoleStyle, '');

      // Sends a message about the endpoint it spied on
      cloned.json()
        .then(jsonData => {
          window.postMessage({
            source: 'blue-marble',
            endpoint: endpointName,
            jsonData: jsonData
          }, '*');
        })
        .catch(err => {
          console.error(`%c${name}%c: Failed to parse JSON: `, consoleStyle, '', err);
        });
    } else if (contentType.includes('image/') && (!endpointName.includes('openfreemap') && !endpointName.includes('maps'))) {
      // Fetch custom for all images but opensourcemap

      const blink = Date.now(); // Current time

      const blob = await cloned.blob(); // The original blob

      // Since this code does not run in the userscript, we can't use consoleLog().
      console.log(`%c${name}%c: ${fetchedBlobQueue.size} Sending IMAGE message about endpoint "${endpointName}"`, consoleStyle, '');

      // Returns the manipulated blob
      return new Promise((resolve) => {
        const blobUUID = crypto.randomUUID(); // Generates a random UUID

        // Store the blob while we wait for processing
        fetchedBlobQueue.set(blobUUID, (blobProcessed) => {
          // The response that triggers when the blob is finished processing

          // Creates a new response
          resolve(new Response(blobProcessed, {
            headers: cloned.headers,
            status: cloned.status,
            statusText: cloned.statusText
          }));

          // Since this code does not run in the userscript, we can't use consoleLog().
          console.log(`%c${name}%c: ${fetchedBlobQueue.size} Processed blob "${blobUUID}"`, consoleStyle, '');
        });

        window.postMessage({
          source: 'blue-marble',
          endpoint: endpointName,
          blobID: blobUUID,
          blobData: blob,
          blink: blink
        });
      }).catch(exception => {
        const elapsed = Date.now();
        console.error(`%c${name}%c: Failed to Promise blob!`, consoleStyle, '');
        console.groupCollapsed(`%c${name}%c: Details of failed blob Promise:`, consoleStyle, '');
        console.log(`Endpoint: ${endpointName}\nThere are ${fetchedBlobQueue.size} blobs processing...\nBlink: ${blink.toLocaleString()}\nTime Since Blink: ${String(Math.floor(elapsed/60000)).padStart(2,'0')}:${String(Math.floor(elapsed/1000) % 60).padStart(2,'0')}.${String(elapsed % 1000).padStart(3,'0')} MM:SS.mmm`);
        console.error(`Exception stack:`, exception);
        console.groupEnd();
      });

      // cloned.blob().then(blob => {
      //   window.postMessage({
      //     source: 'blue-marble',
      //     endpoint: endpointName,
      //     blobData: blob
      //   }, '*');
      // });
    }

    return response; // Returns the original response
  };
};

/** Injects code into the client
 * This code will execute outside of TamperMonkey's sandbox.
 * @param {*} callback - The code to execute
 * @since 0.11.15
 */
function inject(callback) {
  consoleLog('DOM has finished loading!');
  const script = document.createElement('script');
  script.setAttribute('bm-name', name); // Passes in the name value
  script.setAttribute('bm-cStyle', consoleStyle); // Passes in the console style value
  script.textContent = `(${callback})();`;
  document.documentElement?.appendChild(script);
  script.remove();
}

if (document.readyState === 'loading') {

  // If the DOM is still loading, (when done) we inject the code using an event listener
  consoleLog('DOM is still loading! Using an event listener to wait until the page is ready...');
  document.addEventListener('DOMContentLoaded', inject(injectionCode));
} else {

  // Else, the DOM is ready, so we inject directly
  inject(injectionCode);
}

// ----- START OF BLUE MARBLE EXECUTION -----
(async () => {
  // All `await` GM calls must be inside this annon async function

  const prayThisIsNotTrue = document.querySelector('#bm-window-main');
  
  // If Blue Marble has already initalized, don't initalize this copy of Blue Marble
  if (prayThisIsNotTrue) {
    // Unfortunatly, there are multiple copies of the spy code running now, but that can't be bad riiiiiiight?

    // Since Blue Marble is already initalized, we can modify the window before building the window :melting_face:
    new WindowMain(name, version).handleDisplayError('You have multiple copies of Blue Marble running! Open your userscript manager and disable them.');

    // Crash this instance of Blue Marble so we don't cause race conditions, overlapping UI, etc.
    throw new Error(`Blue Marble has already initalized! Do you have multiple copies of Blue Marble running simultaneously?`);
  }

  // Imports the CSS file from dist folder on github
  const cssOverlay = await GM.getResourceText("CSS-BM-File");
  GM.addStyle(cssOverlay);

  // Injection point for the Roboto Mono font file (only if this is the Standalone version)
  const robotoMonoInjectionPoint = 'robotoMonoInjectionPoint';

  // If the Roboto Mono injection point contains '@font-face'...
  if (!!(robotoMonoInjectionPoint.indexOf('@font-face') + 1)) {
    // A very hacky way of doing truthy/falsy logic
    
    console.log(`Loading Roboto Mono as a file...`);
    GM.addStyle(robotoMonoInjectionPoint); // Add the Roboto Mono font-faces that were injected.
  } else {
    // Else, no Roboto Mono was found. We need to use a stylesheet.
    
    // Imports the Roboto Mono font family as a stylesheet
    var stylesheetLink = document.createElement('link');
    stylesheetLink.href = 'https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap';
    stylesheetLink.rel = 'preload';
    stylesheetLink.as = 'style';
    stylesheetLink.onload = function () {
      this.onload = null;
      this.rel = 'stylesheet';
    };
    document.head?.appendChild(stylesheetLink);
  }

  const userSettings = JSON.parse(await GM.getValue('bmUserSettings', '{}')); // Loads the user settings

  // CONSTRUCTORS
  const observers = new Observers(); // Constructs a new Observers object
  const windowMain = new WindowMain(name, version); // Constructs a new Overlay object for the main overlay
  const templateManager = new TemplateManager(name, version); // Constructs a new TemplateManager object
  const apiManager = new ApiManager(templateManager); // Constructs a new ApiManager object
  const settingsManager = new SettingsManager(name, version, userSettings); // Constructs a new SettingsManager

  // Allows the class instances to access each other
  // Main Window
  windowMain.setSettingsManager(settingsManager);
  windowMain.setApiManager(apiManager);
  // Template Manager
  templateManager.setWindowMain(windowMain);
  templateManager.setSettingsManager(settingsManager);
  // Settings Manager
  settingsManager.setTemplateManager(templateManager);
  templateManager.shouldFilterColor = settingsManager.decodeFilteredColorBitFlags(userSettings?.filter); // Tells the template manager which colors should be filtered
  settingsManager.filteredColorsMapOld = templateManager.shouldFilterColor; // Sets the "old" value to the current value (so we don't trigger a storage save)

  settingsManager.setWindowMain(windowMain);
  settingsManager.setTemplateManager(templateManager);
  settingsManager.setApiManager(apiManager);

  const storageTemplates = JSON.parse(await GM.getValue('bmTemplates', '{}'));
  console.log(storageTemplates);
  templateManager.importJSON(storageTemplates); // Loads the templates

  console.log(userSettings);
  console.log(Object.keys(userSettings).length);

  // If the user does not have a UUID yet, make a new one.
  if (Object.keys(userSettings).length == 0) {
    const uuid = crypto.randomUUID(); // Generates a random UUID
    console.log(uuid);
    await GM.setValue('bmUserSettings', JSON.stringify({
      'uuid': uuid
    }));
  }

  setInterval(() => apiManager.sendHeartbeat(version), 1000 * 60 * 30); // Sends a heartbeat every 30 minutes

  // The current "version" of the data collection agreement
  // Increment by 1 to retrigger the telemetry window
  const currentTelemetryVersion = 1;

  // The last "version" of the data collection agreement that the user agreed too
  const previousTelemetryVersion = userSettings?.telemetry;
  console.log(`Telemetry is ${!(previousTelemetryVersion == undefined)}`);



  // Waits until the DOM is ready, before attempting to observe or modify the DOM tree
  consoleInfo('Halting Blue Marble execution until the DOM is ready...');
  await waitForDOMReady();
  consoleInfo('DOM is ready! Resuming Blue Marble execution...');



  // If the user has not agreed to the current data collection terms, we need to show the Telemetry window.
  if ((previousTelemetryVersion == undefined) || (previousTelemetryVersion > currentTelemetryVersion)) {
    const windowTelemetry = new WindowTelemetry(name, version, currentTelemetryVersion, userSettings?.uuid);
    windowTelemetry.setApiManager(apiManager);
    windowTelemetry.buildWindow(); // Asks the user if they want to enable telemetry
  }

  windowMain.buildWindow(); // Builds the main Blue Marble window

  apiManager.spontaneousResponseListener(windowMain); // Reads spontaneous fetch responces

  observeBlack(); // Observes the black palette color

  consoleLog(`%c${name}%c (${version}) userscript has loaded!`, 'color: cornflowerblue;', '');

  /** Observe the black color, and add the "Move" button.
   * @since 0.66.3
   */
  function observeBlack() {
    const observer = new MutationObserver((mutations, observer) => {

      const black = document.querySelector('#color-1'); // Attempt to retrieve the black color element for anchoring

      if (!black) {return;} // Black color does not exist yet. Returns early

      let move = document.querySelector('#bm-button-move'); // Tries to find the move button

      // If the move button does not exist, we make a new one
      if (!move) {
        move = document.createElement('button');
        move.id = 'bm-button-move';
        move.textContent = 'Move ↑';
        move.dataset['screenPosition'] = 'bottom';
        move.className = 'btn btn-soft';
        move.onclick = function() {
          const paletteWindowVisible = this.closest('div:has(dialog):not(:has([id="map"])'); // Obtains the visible palette window
          const paletteWindow = paletteWindowVisible.closest('div:is([class~="bottom-0"], [class~="top-0"])'); // Obtains the entire palette window (includes wrappers)
          // Specifically, `paletteWindow` should be the element anchoring the window to the bottom of the screen
          
          // Figures out the direction the window should move, then moves it
          const shouldMoveUp = (this.dataset?.['screenPosition'] == 'bottom');
          paletteWindow.className = paletteWindow?.className?.replace(shouldMoveUp ? 'bottom-0' : 'top-0', shouldMoveUp ? 'top-0' : 'bottom-0'); // Moves the palette window to the top of the screen
          
          // Fixes borders
          paletteWindowVisible.style.borderTopLeftRadius = shouldMoveUp ? '0px' : 'var(--radius-box)';
          paletteWindowVisible.style.borderTopRightRadius = shouldMoveUp ? '0px' : 'var(--radius-box)';
          paletteWindowVisible.style.borderBottomLeftRadius = shouldMoveUp ? 'var(--radius-box)' : '0px';
          paletteWindowVisible.style.borderBottomRightRadius = shouldMoveUp ? 'var(--radius-box)' : '0px';
          
          // Toggles movement direction
          this.textContent = shouldMoveUp ? 'Move ↓' : 'Move ↑';
          this.dataset['screenPosition'] = shouldMoveUp ? 'top' : 'bottom';

          // Shows only the arrow on smaller screens
          if (paletteWindowVisible?.getBoundingClientRect()?.width <= 650) {this.textContent = this.textContent.slice(-1);}
        }

        // Obtains the palette window's container, which holds all interactive elements in the window
        // Obtains the palette window's toolbar, which holds the non-palette of buttons
        const paletteWindowInteractiveUiContainer = black.closest('div[id]:has(h2):has(canvas)');
        const paletteToolbar = paletteWindowInteractiveUiContainer?.querySelector('div:has(h2) div:has(button):has(div[class~="tooltip"] kbd):not(:has(h2))');
        
        // If the toolbar exists, we add the move button to it
        if (paletteToolbar) {
          paletteToolbar.appendChild(move); // Adds the "Move" button
        } else {
          consoleWarn('Could not find palette toolbar to inject Move button into!');
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
