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

/** What code to execute instantly in the client (webpage) to spy on fetch calls.
 * This code will execute outside of TamperMonkey's sandbox.
 * @since 0.11.15
 */
const spyCodeInjection = () => {

  const script = document.currentScript; // Gets the current script HTML Script Element
  const name = script?.getAttribute('bm-name') || 'Blue Marble'; // Gets the name value that was passed in. Defaults to "Blue Marble" if nothing was found
  const consoleStyle = script?.getAttribute('bm-cStyle') || ''; // Gets the console style value that was passed in. Defaults to no styling if nothing was found
  const fetchedBlobQueue = new Map(); // Blobs being processed

  console.debug(`%c${name} Thread%c: (1/3) Starting spy code initialization...`, consoleStyle, '');

  // Spys on "spontaneous" fetch requests made by the client
  //const originalFetch = window.fetch; // Saves a copy of the original fetch

  console.debug(`%c${name} Thread%c: (2/3) Spy code finished retrieving window.fetch`, consoleStyle, '');

  // Overrides the fetch function on the window
  function fetchHookFactory_Build(possiblyHookedFetch) {
    // This function assignment is specifically referred to as a "fetch hook"
    // It contains Blue Marble's code to filter which network requests are sent to Blue Marble.
    // It contains the code that *receives* pixel tiles.
    // It contains the code that sends the pixel tiles to Blue Marble.
    // However, it does NOT contains the code that *resolves* the pixel tile network requests.
    // All other types of network requests are resolved here though.

    //const context = this || window; // Contains the context this code is running in, or if undefined, the window.
    // If we are the first/outside fetch hook, then the context is the window/document.
    // However, if we are the last/inside fetch hook (in a sequence of hooks)...
    // ...then the context will be whatever fetch hook this fetch hook is running in.
    // We can't use another fetch hook as our context, so we fallback to the window itself.
    // Ultimately, this code is executing inside the DOM, so `window` is the context regardless.

    const boundPossiblyHookedFetch = possiblyHookedFetch.bind(window);

    return async function(...args) {

      // Attempts to make a fetch request
      let response = undefined;
      try {
        response = await boundPossiblyHookedFetch(...args);
      } catch (exception) {
        // We are not running inside the sandbox, so we don't have access to `consoleError`
        console.error(`%c${name} Opener%c: Failed to make a fetch request! Error: `, consoleStyle, '', exception);
        throw exception; // There was no response, so we can't `return` anything expected.
        // The exception will spread up through all layers (the stack) of all fetch hooks, since a Promise is expected to be returned.
      }

      const cloned = response.clone(); // Makes a copy of the response
      
      // Retrieves the endpoint name. Unknown endpoint = "ignore"
      const endpointName = ((args[0] instanceof Request) ? args[0]?.url : args[0]) || 'ignore';

      // Check Content-Type to only process JSON
      const contentType = cloned.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {

        // Since this code does not run in the userscript, we can't use consoleLog().
        console.debug(`%c${name} Opener%c: Sending %cJSON%c message about endpoint "${endpointName}"`, consoleStyle, '', 'color: magenta;', '');

        // Sends a message about the endpoint it spied on
        cloned.json()
          .then(jsonData => {
            document.dispatchEvent(new CustomEvent('BM_NEWS_STREAM', {
              detail: {
                source: 'blue-marble',
                endpoint: endpointName,
                jsonData: jsonData,
              }
            }));
          })
          .catch(err => {
            console.error(`%c${name} Opener%c: Failed to send %cJSON%c message about endpoint: "${endpointName}"! Error: `, consoleStyle, '', 'color: magenta;', '', err);
          });
      } else if (contentType.includes('image/') && (!endpointName.includes('openfreemap') && !endpointName.includes('maps'))) {
        // Fetch custom for all images but opensourcemap

        const blink = Date.now(); // Current time

        // Attempts to run the code to manipulate the blob/image, then return it
        try {

          const blob = await cloned.blob(); // The original blob
          const blobUUID = crypto.randomUUID(); // Generates a random UUID
          let watchdog = undefined; // Watchdog timer ID
          const timeoutMs = 15000; // Timeout in miliseconds

          // Name of the event to watch for a response on
          const responseNameUUID = `BM_SPY_RESPONSE_${blobUUID}`;

          const handleResponse = (event) => {
            commonResolutionCode(responseNameUUID, handleResponse); // Close down everything else, so we don't somehow execute the same request/response multiple times

            const { source, endpoint, blobID, blobData, blink } = event.detail; // Deconstructs the message information

            // Throw a warning if the message did not match the expected format. Then, wait for timeout or another message
            if ((source == 'blue-marble') && !!blobID && !!blobData && !endpoint) {

              // Since this code does not run in the userscript, we can't use consoleLog().
              const elapsed = Date.now() - blink; // Calculates the time it took to process the pixel tile image
              console.debug(`%c${name} Closer%c: %c${fetchedBlobQueue.size}%c Received %cIMAGE%c message about blob "%c${blobID}%c"`, consoleStyle, '', 'color: deepskyblue;', '', 'color: magenta;', '', 'color: deepskyblue;', '');
              console.debug(`%c${name} Closer%c: Blob (%c${blobID}%c) fetch took %c${String(Math.floor(elapsed/60000)).padStart(2,'0')}:${String(Math.floor(elapsed/1000) % 60).padStart(2,'0')}.${String(elapsed % 1000).padStart(3,'0')}%c MM:SS.mmm`, consoleStyle, '', 'color: deepskyblue;', '', 'color: deepskyblue;', '');
              console.debug(fetchedBlobQueue);

              // Attempts to return the processed blob
              try {

                // Creates a new response
                const responseProcessed = new Response(blobData, {
                  headers: cloned.headers,
                  status: cloned.status,
                  statusText: cloned.statusText
                });

                // Since we cloned the original response, the reported origin changed.
                // So, we change the origin back to what it originally was.
                try {
                  Object.defineProperties(responseProcessed, 'url', {
                    value: response.url,
                    writable: false,
                  });
                } catch (ignored) {}

                // Since this code does not run in the userscript, we can't use consoleLog().
                console.debug(`%c${name} Closer%c: %c${fetchedBlobQueue.size}%c The blob "%c${blobUUID}%c" has now been processed.`, consoleStyle, '', 'color: deepskyblue;', '', 'color: deepskyblue;', '');
                return responseProcessed; // Returns the processed blob
              } catch (exception) {

                console.warn(`%c${name} Closer%c: %c${fetchedBlobQueue.size}%c Failed to resolve image blob request related to endpoint "${endpointName}" (%c${blobUUID}%c)!\nThe original blob will be returned. Error: `, consoleStyle, '', 'color: deepskyblue;', '', 'color: magenta;', '', 'color: deepskyblue;', '', exception);
                return blobData; // Returns the original blob
              }
            } else {
              console.warn(`%c${name} Closer%c: %c${fetchedBlobQueue.size}%c The recieved message for the blob related to the endpoint "${endpointName}" (%c${blobUUID}%c) does not match the expected format! Waiting until a proper message is sent...`, consoleStyle, '', 'color: deepskyblue;', '', 'color: magenta;', '', 'color: deepskyblue;', '');
            }
          };

          // Code to execute when the script resolves, regardless of how it resolves
          const commonResolutionCode = (responseNameUUID, handleResponse) => {
            // If there is a watchdog timer, clear the status, and delete the timer.
            if (watchdog) {
              clearTimeout(watchdog);
              watchdog = null;
            }
            document.removeEventListener(responseNameUUID, handleResponse); // Removes the event listener
            fetchedBlobQueue.delete(blobUUID); // Deletes the blob from the queue
          }

          // Since this code does not run in the userscript, we can't use consoleLog().
          console.debug(`%c${name} Opener%c: %c${fetchedBlobQueue.size}%c Sending %cIMAGE%c message about endpoint "${endpointName}" with blob UUID "%c${blobUUID}%c"`, consoleStyle, '', 'color: deepskyblue;', '', 'color: magenta;', '', 'color: deepskyblue;', '');

          // Returns the manipulated blob as a Promise
          // The Promise will wait X finite time to resolve, before returning the original response.
          // Otherwise, the spy code will wait for a message on the window that matches the UUID of the blob (main scenario).
          // It is expected that Blue Marble is the sender of the message on the window, but it does not *have* to be Blue Marble.
          // When the spy code receives the message, the Promise is fufilled (elsewhere in the code).
          return new Promise((resolve) => {

            // What to do (executes) if the Promise ages older than the timeout length
            watchdog = setTimeout(() => {
              // By this point, the queue will probably be full...
              // ...and the code will be failing & throwing errors elsewhere...
              // ...but this is just in case the other boilerplates fail...
              // ...we don't want the queue to infinitely bloat, after all, and...
              // ...I would rather instantly fail the "Two Generals' Problem"...
              // ...instead of having the script completely fail instead.

              commonResolutionCode(responseNameUUID, handleResponse);
              console.warn(`%c${name} Opener%c: %c${fetchedBlobQueue.size}%c Failed to return manipulated blob related to endpoint "${endpointName}" with blob ID "%c${blobUUID}%c"!\nThe blob took longer than ${timeoutMs} miliseconds to process! Returning original blob...`, consoleStyle, '', 'color: deepskyblue;', '', 'color: deepskyblue;', '');
              resolve(response); // Returns the original blob
            }, timeoutMs);

            // Store the blob in a queue while we wait for somebody else to process the blob.
            // The key is the UUID of the blob.
            // The value is a callback, which contains the code to generate the response.
            // When (elsewhere in the code) the spy code receives the processed blob...
            // ...it combines the UUID, and the processed blob, then uses **this callback** to create the response.
            fetchedBlobQueue.set(blobUUID, handleResponse);

            document.addEventListener(responseNameUUID, (event) => {
              resolve(handleResponse(event));
            });

            // Sends a message on the window.
            // This contains the original blob image to be processed, as well as the UUID for the blob.
            // This is more of a "yeet" since there is no established connection with...
            // ...the intended receiver, nor do we know if anyone will see it at all.
            document.dispatchEvent(new CustomEvent('BM_REQUEST_STREAM', {
              detail: {
                source: 'blue-marble',
                endpoint: endpointName,
                eventNameUUID: responseNameUUID,
                blobID: blobUUID,
                blobData: blob,
                blink: blink,
              }
            }))
            
          }).catch(exception => {
            commonResolutionCode(responseNameUUID, handleResponse); // Ensure we don't process this blob again
            console.warn(`%c${name} Opener%c: An error occured while resolving the Promise for blob "%c${blobUUID}%c"! The original blob will be returned. Error: `, consoleStyle, '', 'color: deepskyblue;', '', exception);
            return response; // Returns the original blob
          });

        } catch (exception) {
          const elapsed = Date.now() - blink;
          console.warn(`%c${name} Opener%c: An error occured before the blob could be queued! Returning original blob...\nDetails of failed blob Promise are below: `, consoleStyle, '');
          // Since we don't have a blob UUID to identify the blob with, report as much useful information as possible
          console.info(`%c${name} Opener%c: Endpoint: ${endpointName}\nThere are %c${fetchedBlobQueue.size}%c blobs processing.\nBlink: %c${new Date(blink).toLocaleString()}%c\nTime Since Blink: %c${String(Math.floor(elapsed/60000)).padStart(2,'0')}:${String(Math.floor(elapsed/1000) % 60).padStart(2,'0')}.${String(elapsed % 1000).padStart(3,'0')}%c (MM:SS.mmm)`, consoleStyle, '', 'color: deepskyblue;', '', 'color: deepskyblue;', '', 'color: deepskyblue;', '');
          console.warn(`%c${name} Opener%c: Error: `, consoleStyle, '', exception);
          return response; // Returns the original blob
        }
      }

      // If you are looking for the piece of code that uses the processed blob to resolve...
      // ...the network request, then look elsewhere in the Spy Code. It is not in the fetch hook.
      // However, the code to create the Response is in here.

      return response; // Returns the original response, because it did not match anything Blue Marble uses
    };
  }

  // Wraps whatever window.fetch currently exists, with the spy code fetch hook
  let spyCodeFetch = fetchHookFactory_Build(window.fetch);
  window.fetch = spyCodeFetch;

  console.debug(`%c${name} Thread%c: (3/3) Spy code finished initializing!`, consoleStyle, '');

  const mercyPeriodMs = 5000; // How long after the page finishes loading, should we keep trying to override window.fetch

  const fetchHookID = setInterval(() => {
    const currentFetch = window.fetch;
    if (currentFetch === spyCodeFetch) {return;}

    if (typeof currentFetch !== 'function') {
      console.warn(`%c${name}%c: window.fetch was overwritten with a non-function (${typeof currentFetch})! Waiting for it to recover before re-applying the spy hook...`, consoleStyle, '');
      return;
    }
    
    console.warn(`%c${name} Opener%c: Another window.fetch hook has been created! Reapplying spy code fetch hook...`, consoleStyle, '');
    spyCodeFetch = fetchHookFactory_Build(window.fetch);
    window.fetch = spyCodeFetch;
  }, 100);

  const stopFetchHookFactory_Build = () => {
    setTimeout(() => {
      clearInterval(fetchHookID);
      console.debug(`%c${name}%c: Stopping fetch hook factory...`, consoleStyle, '');
    }, mercyPeriodMs);
  };

  if (document.readyState === 'complete') {
    stopFetchHookFactory_Build();
  } else {
    window.addEventListener('load', stopFetchHookFactory_Build, { once: true });
  }
};

/** Injects code into the client
 * This code will execute outside of TamperMonkey's sandbox.
 * @param {string} injectCodeName - Human-readable identifier that appears in console logs
 * @param {*} callback - The code to execute
 * @param {string | undefined} [uuid] - Unique, not human-readable identifier that appears in console logs. This is managed automatically, and it is not expected that you pass something in here.
 * @since 0.11.15
 */
function inject(injectCodeName, callback, uuid) {

  const injectionUUID = uuid ?? crypto.randomUUID().slice(0, 8); // Random UUID

  consoleInfo(`%c${name}%c: Injecting code '%c${injectCodeName}%c' (%c${injectionUUID}%c) into <html>...`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET);
  console.debug(`%c${name}%c: DOM state is %c${document.readyState}%c.`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET);

  // If the <html> element does not exist yet...
  if (!document.documentElement) {
    consoleWarn(`%c${name}%c: <html> element has not loaded! Waiting for element to exist before injecting '%c${injectCodeName}%c' (%c${injectionUUID}%c)'`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET); // Warn is used here, because I can't test this functionality and therefore, it might not work.

    // Create a new Mutation Observer to try executing this function again once the <html> element exists.
    new MutationObserver((mutations, observer) => {
      if (document.documentElement) {
        observer.disconnect();
        inject(injectCodeName, callback, injectionUUID);
      }
    }).observe(document, { childList: true });

    consoleInfo(`%c${name}%c: Halting injection process of code '%c${injectCodeName}%c' (%c${injectionUUID}%c)...`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET);
    return; // Returns early, because we can't do anything if <html> does not exist yet
  }

  const script = document.createElement('script');
  script.setAttribute('bm-name', injectCodeName); // Passes in the name value
  script.setAttribute('bm-cStyle', consoleCSS.BLUE); // Passes in the console style value
  script.setAttribute('data-uuid', injectionUUID); // Adds the UUID as an attribute to the <script> element
  script.textContent = `(${callback})();`;
  document.documentElement.appendChild(script);
  if (document.querySelector(`script[data-uuid='${injectionUUID}']`)) {
    consoleInfo(`%c${name}%c: Executed injected code '%c${injectCodeName}%c' (%c${injectionUUID}%c)`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET);
  }
  script.remove();
  consoleInfo(`%c${name}%c: Removed injected code '%c${injectCodeName}%c' (%c${injectionUUID}%c) from the DOM tree.`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET);
}

// Inject the spy code as soon as possible
// The code will be injected into <html>, which should exist at this point
inject('Spy Code', spyCodeInjection);

console.debug(`%c${name}%c: Blue Marble after spy code injected.`, consoleCSS.BLUE, consoleCSS.RESET);

// ----- START OF BLUE MARBLE EXECUTION -----
(async () => {
  // All `await` GM calls must be inside this annon async function

  const prayThisIsNotTrue = document.querySelector('#bm-window-main');
  
  // If Blue Marble has already initalized, don't initalize this copy of Blue Marble
  if (prayThisIsNotTrue) {
    // Unfortunatly, there are multiple copies of the spy code running now, but that can't be bad riiiiiiight?

    // Since Blue Marble is already initalized, we can modify the window before building the window :melting_face:
    new WindowMain(name, version).handleDisplayError('You have multiple copies of Blue Marble running! Open your userscript manager and disable all but one.');

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
    
    console.info(`%c${name}%c: Loading Roboto Mono as a file...`, consoleCSS.BLUE, consoleCSS.RESET);
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
  const apiManager = new ApiManager(name, version, templateManager); // Constructs a new ApiManager object
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
  console.debug(`%c${name}%c: %cstorageTemplates%c:`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, storageTemplates);
  await templateManager.importJSON(storageTemplates); // Loads the templates

  console.debug(`%c${name}%c: %cuserSettings%c:`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET, userSettings);

  // If the user does not have a UUID yet, make a new one.
  if (Object.keys(userSettings).length == 0) {
    const uuid = crypto.randomUUID(); // Generates a random UUID
    console.debug(`%c${name}%c: Created UUID for user. UUID: %c${uuid}%c`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET);
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
  console.debug(`%c${name}%c: Telemetry value is %c${previousTelemetryVersion}%c.`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET);



  // Waits until the DOM is ready, before attempting to observe or modify the DOM tree
  consoleInfo(`%c${name}%c: Halting %cBlue Marble%c execution until the DOM is ready...`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET);
  await waitForDOMReady();
  consoleInfo(`%c${name}%c: DOM is ready! Resuming %cBlue Marble%c execution...`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET);



  // If the user has not agreed to the current data collection terms, we need to show the Telemetry window.
  if ((previousTelemetryVersion == undefined) || (previousTelemetryVersion < currentTelemetryVersion)) {
    const windowTelemetry = new WindowTelemetry(name, version, currentTelemetryVersion, userSettings?.uuid);
    windowTelemetry.setApiManager(apiManager);
    windowTelemetry.buildWindow(); // Asks the user if they want to enable telemetry
  }

  console.debug(`%c${name}%c: Building %cMain Window%c...`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET);
  windowMain.buildWindow(); // Builds the main Blue Marble window

  apiManager.spontaneousResponseListener(windowMain); // Reads spontaneous fetch responces
  // Note: Once `windowMain` manages it's own window content, this line should be moved up as far as possible

  observeBlack(); // Observes the black palette color

  const windowStates = settingsManager.getWindowStatesObject(); // Obtains the decoded (hopefully) window states

  const WINDOW_EXISTS = 1; // Bitflag index for if a window exists (this line is to make the code easier to read)

  // If the Credits window exists, build it
  if (windowStates['crdt']?.[WINDOW_EXISTS]) {
    console.debug(`%c${name}%c: Building %cCredits Window%c...`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET);
    const credits = new WindowCredits(name, version);
    credits.setSettingsManager(settingsManager);
    settingsManager.setWindowCredits(credits);
    credits.buildWindow();
  }

  // If the Template Wizard window exists, build it
  if (windowStates['wzrd']?.[WINDOW_EXISTS]) {
    console.debug(`%c${name}%c: Building %cTemplate Wizard Window%c...`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET);
    const wizard = new WindowWizard(name, version, templateManager?.schemaVersion, templateManager);
    wizard.setSettingsManager(settingsManager);
    settingsManager.setWindowWizard(wizard);
    wizard.buildWindow();
  }

  // If the Settings window exists, build it
  if (windowStates['sett']?.[WINDOW_EXISTS]) {
    console.debug(`%c${name}%c: Building %cSettings Window%c...`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET);
    settingsManager.setSettingsManager(settingsManager); // Gives Settings Window access to the settings manager
    settingsManager.buildWindow(); // Builds the settings window
  }

  // If the Color Filter window exists, build it
  if (windowStates['fltr']?.[WINDOW_EXISTS]) {
    console.debug(`%c${name}%c: Building %cColor Filter Window%c...`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET);
    const filter = new WindowFilter(windowMain); // Supposed to pass in a window class as the executor
    filter.setSettingsManager(settingsManager);
    settingsManager.setWindowFilter(filter);
    filter.buildWindow();
  }

  console.debug(`%c${name}%c: End of Blue Marble file.`, consoleCSS.BLUE, consoleCSS.RESET);

  consoleLog(`%c${name}%c (%c${version}%c) userscript has loaded!`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.CYAN, consoleCSS.RESET);

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
          consoleWarn(`%c${name}%c: Observer "%cobserveBlack%c" could not find palette toolbar to inject Move button into!`, consoleCSS.BLUE, consoleCSS.RESET, consoleCSS.MAGENTA, consoleCSS.RESET);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
