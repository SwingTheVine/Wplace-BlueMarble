/** @file The main file. Everything in the userscript is executed from here.
 * @since 0.0.0
 */

import Observers from './observers.js';
import ApiManager from './apiManager.js';
import TemplateManager from './templateManager.js';
import { consoleLog, consoleWarn, consoleInfo, waitForDOMReady, consoleCSS } from './utils.js';
import WindowMain from './WindowMain.js';
import WindowTelemetry from './WindowTelemetry.js';
import SettingsManager from './settingsManager.js';
import WindowCredits from './WindowCredits.js';
import WindowWizard from './WindowWizard.js';
import WindowFilter from './WindowFilter.js';

const name = GM_info.script.name.toString(); // Name of userscript
const version = GM_info.script.version.toString(); // Version of userscript

console.debug(`%c${name}%c: Top of top-level execution.`, consoleCSS.BLUE, consoleCSS.RESET);
console.log('window.fetch', window.fetch.toString());

/** What code to execute instantly in the client (webpage) to spy on fetch calls.
 * This code will execute outside of TamperMonkey's sandbox.
 * @since 0.11.15
 */
const spyCodeInjection = () => {

  const script = document.currentScript; // Gets the current script HTML Script Element
  const name = script?.getAttribute('bm-name') || 'Blue Marble'; // Gets the name value that was passed in. Defaults to "Blue Marble" if nothing was found
  const consoleStyle = script?.getAttribute('bm-cStyle') || ''; // Gets the console style value that was passed in. Defaults to no styling if nothing was found
  const fetchedBlobQueue = new Map(); // Blobs being processed

  console.debug(`%c${name} Thread%c: (1/4) Starting spy code initialization...`, consoleStyle, '');

  // Creates an event listener, which listens for messages on the window.
  window.addEventListener('message', (event) => {
    // This is *one* of the intended receivers for Blue Marble's pixel tile blob messages.
    // The purpose of this event listener is to receive messages on the window that resolve pixel tile network requests.
    // The purpose of this event listener is to resolve those network requests using the information provided in the message.
    // This is the code that *resolves* the pixel tile network requests.
    // However, the code that specifies how the Response is *created* is elsewhere.

    const { source, endpoint, blobID, blobData, blink } = event.data; // Deconstructs the message information

    const elapsed = Date.now() - blink; // Calculates the time it took to process the pixel tile image

    // Since this code does not run in the userscript, we can't use consoleLog().
    console.groupCollapsed(`%c${name} Closer%c: ${fetchedBlobQueue.size} Received %cIMAGE%c message about blob "%c${blobID}%c"`, consoleStyle, '', 'color: magenta; ', '', 'color: deepskyblue; ', '');
    console.debug(`Blob fetch took %c${String(Math.floor(elapsed/60000)).padStart(2,'0')}:${String(Math.floor(elapsed/1000) % 60).padStart(2,'0')}.${String(elapsed % 1000).padStart(3,'0')}%c MM:SS.mmm`, consoleStyle, '');
    console.debug(fetchedBlobQueue);
    console.groupEnd();

    // Since there is a single channel of communication for all messages on the window, we ignore all messages that are not meant for us.
    if ((source == 'blue-marble') && !!blobID && !!blobData && !endpoint) {
      // The message with the modified blob won't have an endpoint, so we ignore any message without one.
      // The message, however, should be intended for 'blue-marble', and contain blob UUID & data.

      const callback = fetchedBlobQueue.get(blobID); // Retrieves the blob based on the UUID

      // If the value from the queue is a valid function...
      if (typeof callback === 'function') {

        callback(blobData); // ...execute the function
        // This function will create the Response that resolves the network request.
        // The Response is created with the blobData specific to this tile.

      } else {
        // ...else the blobID is unexpected. We don't know what it is, but we know for sure it is not a blob. This means we ignore it.

        // Can't use consoleWarn()
        console.warn(`%c${name} Closer%c: Attempted to retrieve a blob (%c%s%c) from queue, but the blobID was not a function! Skipping...`, consoleStyle, '', 'color: deepskyblue; ', blobID, '');
      }
    }
  });

  console.debug(`%c${name} Thread%c: (2/4) Spy code finished initalizing message hook.`, consoleStyle, '');

  // Spys on "spontaneous" fetch requests made by the client
  const originalFetch = window.fetch; // Saves a copy of the original fetch

  console.debug(`%c${name} Thread%c: (3/4) Spy code finished retrieving window.fetch`, consoleStyle, '');

  // Overrides the fetch function on the window
  window.fetch = async function(...args) {
    // This function assignment is specifically referred to as a "fetch hook"
    // It contains Blue Marble's code to filter which network requests are sent to Blue Marble.
    // It contains the code that *receives* pixel tiles.
    // It contains the code that sends the pixel tiles to Blue Marble.
    // However, it does NOT contains the code that *resolves* the pixel tile network requests.
    // All other types of network requests are resolved here though.

    const context = this || window; // Contains the context this code is running in, or if undefined, the window.
    // If we are the first/outside fetch hook, then the context is the window/document.
    // However, if we are the last/inside fetch hook (in a sequence of hooks)...
    // ...then the context will be whatever fetch hook this fetch hook is running in.
    // We can't use another fetch hook as our context, so we fallback to the window itself.
    // Ultimately, this code is executing inside the DOM, so `window` is the context regardless.

    // Attempts to make a fetch request
    let response = undefined;
    try {
      response = await originalFetch.apply(context, args); // Sends a fetch
    } catch (exception) {
      // We are not running inside the sandbox, so we don't have access to `consoleError`
      console.error(`%c${name} Opener%c: Failed to make a fetch request! Error: `, consoleStyle, '', exception);
      throw exception; // There was no response, so we can't `return` anything expected.
      // The exception will spread up through all layers of fetch hooks, since a Promise is expected to be returned.
    }

    const cloned = response.clone(); // Makes a copy of the response
    
    // Retrieves the endpoint name. Unknown endpoint = "ignore"
    const endpointName = ((args[0] instanceof Request) ? args[0]?.url : args[0]) || 'ignore';

    // Check Content-Type to only process JSON
    const contentType = cloned.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {

      // Since this code does not run in the userscript, we can't use consoleLog().
      console.debug(`%c${name} Opener%c: Sending %cJSON%c message about endpoint "${endpointName}"`, consoleStyle, '', 'color: magenta; ', '');

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
          console.error(`%c${name} Opener%c: Failed to parse JSON: `, consoleStyle, '', err);
        });
    } else if (contentType.includes('image/') && (!endpointName.includes('openfreemap') && !endpointName.includes('maps'))) {
      // Fetch custom for all images but opensourcemap

      // Attempts to run the code to manipulate the blob/image, then return it
      try {

        const blink = Date.now(); // Current time
        const blob = await cloned.blob(); // The original blob
        const blobUUID = crypto.randomUUID(); // Generates a random UUID

        // Since this code does not run in the userscript, we can't use consoleLog().
        console.debug(`%c${name} Opener%c: ${fetchedBlobQueue.size} Sending %cIMAGE%c message about endpoint "${endpointName}" with blob ID "%c%s%c"`, consoleStyle, '', 'color: magenta; ', '', 'color: deepskyblue; ', blobUUID, '');

        // Returns the manipulated blob as a Promise
        // The Promise will wait X finite time to resolve, before returning the original response.
        // Otherwise, the spy code will wait for a message on the window that matches the UUID of the blob (main scenario).
        // It is expected that Blue Marble is the sender of the message on the window, but it does not *have* to be Blue Marble.
        // When the spy code receives the message, the Promise is fufilled (elsewhere in the code).
        return new Promise((resolve) => {

          const timeoutMs = 10000; // Timeout in miliseconds

          // What to do (executes) if the Promise ages older than the timeout length
          const watchdog = setTimeout(() => {
            // By this point, the queue will probably be full...
            // ...and the code will be failing & throwing errors elsewhere...
            // ...but this is just in-case the other boilerplates fail...
            // ...we don't want the queue to infinitely bloat, after all

            console.warn(`%c${name} Opener%c: ${fetchedBlobQueue.size} Failed to return manipulated blob related to endpoint "${endpointName}" with blob ID "%c%s%c"!\nThe blob took longer than %d miliseconds to process! Returning original blob...`, consoleStyle, '', 'color: deepskyblue; ', blobUUID, '', timeoutMs);
            resolve(response); // Returns the original blob
          }, timeoutMs);

          // Store the blob in a queue while we wait for somebody else to process the blob.
          // The key is the UUID of the blob.
          // The value is a callback, which contains the code to generate the response.
          // When (elsewhere in the code) the spy code receives the processed blob...
          // ...it combines the UUID, and the processed blob, then uses **this callback** to create the response.
          fetchedBlobQueue.set(blobUUID, (blobProcessed) => {
            // The code below triggers when the blob is finished processing.
            // It should be assumed that the context this code is executing in, is NOT the fetch hook.
            // This function should be treated as if it is the code that is resolving the network request, and fufilling the Promise.
            // Another way to think about it, is that this function won't run until "somebody else" has processed the blob, and sent a message back with the processed blob.
            // Creates a Response with the processed blob.

            clearTimeout(watchdog); // Resets Watchdog timer
          fetchedBlobQueue.delete(blobUUID); // Removes the blob from the queue so we don't process it again

            // Attempts to return the processed blob
            try {

              // Creates a new response
              const responseProcessed = new Response(blobProcessed, {
                headers: cloned.headers,
                status: cloned.status,
                statusText: cloned.statusText
              });

              // Since we cloned the original response, the reported origin changed.
              // So, we change the origin back to what it originally was.
              Object.defineProperties(responseProcessed, 'url', {
                value: response.url,
                writable: false,
              });

              resolve(responseProcessed); // Returns the processed blob

              // Since this code does not run in the userscript, we can't use consoleLog().
              console.debug(`%c${name} Closer%c: ${fetchedBlobQueue.size} The blob "%c%s%c" has now been processed.`, consoleStyle, '', 'color: deepskyblue; ', blobUUID, '');
            } catch (exception) {

              console.warn(`%c${name} Closer%c: ${fetchedBlobQueue.size} Failed to resolve image blob request related to endpoint "${endpointName}" with blob ID "%c%s%c"!\nThe original blob will be returned. Error: `, consoleStyle, '', 'color: deepskyblue; ', blobUUID, '', exception);
              resolve(response); // Returns the original blob
            }
          });

          // Sends a message on the window.
          // This contains the original blob image to be processed, as well as the UUID for the blob.
          // This is more of a "yeet" since there is no established connection with...
          // ...the intended receiver, nor do we know if anyone will see it at all.
          window.postMessage({
            source: 'blue-marble',
            endpoint: endpointName,
            blobID: blobUUID,
            blobData: blob,
            blink: blink
          });
        }).catch(exception => {
          console.error(`%c${name} Opener%c: An error occured while resolving the Promise for a blob ID "%c%s%c"! The original blob will be returned. Error: `, consoleStyle, '', 'color: deepskyblue; ', blobUUID, '', exception);
          clearTimeout(watchdog); // Resets Watchdog timer
          fetchedBlobQueue.delete(blobUUID); // Removes the blob from the queue so we don't process it again
          return response; // Returns the original blob
        });

      } catch (exception) {
        const elapsed = Date.now();
        console.warn(`%c${name} Opener%c: An error occured before the blob could be queued! Returning original blob...`, consoleStyle, '');
        console.groupCollapsed(`%c${name} Opener%c: Details of failed blob Promise:`, consoleStyle, '');
        console.info(`Endpoint: ${endpointName}\nThere are ${fetchedBlobQueue.size} blobs processing...\nBlink: ${blink.toLocaleString()}\nTime Since Blink: ${String(Math.floor(elapsed/60000)).padStart(2,'0')}:${String(Math.floor(elapsed/1000) % 60).padStart(2,'0')}.${String(elapsed % 1000).padStart(3,'0')} MM:SS.mmm`);
        console.warn(`Error: `, exception);
        console.groupEnd();
      }
    }

    // If you are looking for the piece of code that uses the processed blob to resolve...
    // ...the network request, then look elsewhere in the Spy Code. It is not in the fetch hook.
    // However, the code to create the Response is in here.

    return response; // Returns the original response
  };

  console.debug(`%c${name} Thread%c: Spy code finished initializing! (4/4)`, consoleStyle, '');
};

/** Injects code into the client
 * This code will execute outside of TamperMonkey's sandbox.
 * @param {string} name - Human-readable identifier that appears in console logs
 * @param {*} callback - The code to execute
 * @param {string | undefined} [uuid] - Unique, not human-readable identifier that appears in console logs. This is managed automatically, and it is not expected that you pass something in here.
 * @since 0.11.15
 */
function inject(name, callback, uuid) {

  const injectionUUID = uuid ?? crypto.randomUUID().slice(0, 8); // Random UUID

  consoleLog(`Injecting code '${name}' (${injectionUUID}) into <html>...`);
  console.log(`DOM state is ${document.readyState}.`);

  // If the <html> element does not exist yet...
  if (!document.documentElement) {
    consoleWarn(`<html> element has not loaded! Waiting for element to exist before injecting...`); // Warn is used here, because I can't test this functionality and therefore, it might not work.

    // Create a new Mutation Observer to try executing this function again once the <html> element exists.
    new MutationObserver((mutations, observer) => {
      if (document.documentElement) {
        observer.disconnect();
        inject(name, callback, injectionUUID);
      }
    }).observe(document, { childList: true });

    consoleLog(`Halting injection process of code '${name}' (${injectionUUID})...`);
    return; // Returns early, because we can't do anything if <html> does not exist yet
  }

  const script = document.createElement('script');
  script.setAttribute('bm-name', name); // Passes in the name value
  script.setAttribute('bm-cStyle', consoleCSS.BLUE); // Passes in the console style value
  script.setAttribute('data-uuid', injectionUUID); // Adds the UUID as an attribute to the <script> element
  script.textContent = `(${callback})();`;
  document.documentElement.appendChild(script);
  if (document.querySelector(`script[data-uuid='${injectionUUID}']`)) {console.log(`Injected code '${name}' (${injectionUUID}) script exists in the DOM tree.`);}
  script.remove();
  consoleLog(`Removed injection code '${name}' (${injectionUUID}) from the DOM tree.`);
}

// Inject the spy code as soon as possible
// The code will be injected into <html>, which should exist at this point
inject('Spy Code', spyCodeInjection);

console.log('BM after spy code injected.');
console.log('window.fetch', window.fetch.toString());

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
  await templateManager.importJSON(storageTemplates); // Loads the templates

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
  if ((previousTelemetryVersion == undefined) || (previousTelemetryVersion < currentTelemetryVersion)) {
    const windowTelemetry = new WindowTelemetry(name, version, currentTelemetryVersion, userSettings?.uuid);
    windowTelemetry.setApiManager(apiManager);
    windowTelemetry.buildWindow(); // Asks the user if they want to enable telemetry
  }

  windowMain.buildWindow(); // Builds the main Blue Marble window

  apiManager.spontaneousResponseListener(windowMain); // Reads spontaneous fetch responces

  observeBlack(); // Observes the black palette color

  const windowStates = settingsManager.getWindowStatesObject(); // Obtains the decoded (hopefully) window states

  const WINDOW_EXISTS = 1; // Bitflag index for if a window exists (this is to make the code easier to read)

  // If the Credits window exists, build it
  if (windowStates['crdt']?.[WINDOW_EXISTS]) {
    const credits = new WindowCredits(name, version);
    credits.setSettingsManager(settingsManager);
    settingsManager.setWindowCredits(credits);
    credits.buildWindow();
  }

  // If the Template Wizard window exists, build it
  if (windowStates['wzrd']?.[WINDOW_EXISTS]) {
    const wizard = new WindowWizard(name, version, templateManager?.schemaVersion, templateManager);
    wizard.setSettingsManager(settingsManager);
    settingsManager.setWindowWizard(wizard);
    wizard.buildWindow();
  }

  // If the Settings window exists, build it
  if (windowStates['sett']?.[WINDOW_EXISTS]) {
    settingsManager.setSettingsManager(settingsManager); // Gives Settings Window access to the settings manager
    settingsManager.buildWindow(); // Builds the settings window
  }

  // If the Color Filter window exists, build it
  if (windowStates['fltr']?.[WINDOW_EXISTS]) {
    const filter = new WindowFilter(windowMain); // Supposed to pass in a window class as the executor
    filter.setSettingsManager(settingsManager);
    settingsManager.setWindowFilter(filter);
    filter.buildWindow();
  }

  console.log('End of BM file.');
  console.log('window.fetch', window.fetch.toString());

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
          const paletteWindowVisible = this.closest('div:has(dialog):not(:has([id="map"]))'); // Obtains the visible palette window
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
