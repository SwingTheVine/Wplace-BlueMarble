/** @file The main file. Everything in the userscript is executed from here.
 * @since 0.0.0
 */

import Overlay from './Overlay.js';
import Observers from './observers.js';
import ApiManager from './apiManager.js';
import TemplateManager from './templateManager.js';
import { calculateRelativeLuminance, consoleLog, consoleWarn } from './utils.js';

const name = GM_info.script.name.toString(); // Name of userscript
const version = GM_info.script.version.toString(); // Version of userscript
const consoleStyle = 'color: cornflowerblue;'; // The styling for the console logs

/** Injects code into the client
 * This code will execute outside of TamperMonkey's sandbox
 * @param {*} callback - The code to execute
 * @since 0.11.15
 */
function inject(callback) {
    const script = document.createElement('script');
    script.setAttribute('bm-name', name); // Passes in the name value
    script.setAttribute('bm-cStyle', consoleStyle); // Passes in the console style value
    script.textContent = `(${callback})();`;
    document.documentElement?.appendChild(script);
    script.remove();
}

/** What code to execute instantly in the client (webpage) to spy on fetch calls.
 * This code will execute outside of TamperMonkey's sandbox.
 * @since 0.11.15
 */
inject(() => {

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
});

// Imports the CSS file from dist folder on github
const cssOverlay = GM_getResourceText("CSS-BM-File");
GM_addStyle(cssOverlay);

// Injection point for the Roboto Mono font file (only if this is the Standalone version)
const robotoMonoInjectionPoint = 'robotoMonoInjectionPoint';

// If the Roboto Mono injection point contains '@font-face'...
if (!!(robotoMonoInjectionPoint.indexOf('@font-face') + 1)) {
  // A very hacky way of doing truthy/falsy logic
  
  console.log(`Loading Roboto Mono as a file...`);
  GM_addStyle(robotoMonoInjectionPoint); // Add the Roboto Mono font-faces that were injected.
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

// CONSTRUCTORS
const observers = new Observers(); // Constructs a new Observers object
const overlayMain = new Overlay(name, version); // Constructs a new Overlay object for the main overlay
const overlayTabTemplate = new Overlay(name, version); // Constructs a Overlay object for the template tab
const templateManager = new TemplateManager(name, version, overlayMain); // Constructs a new TemplateManager object
const apiManager = new ApiManager(templateManager); // Constructs a new ApiManager object

overlayMain.setApiManager(apiManager); // Sets the API manager

const storageTemplates = JSON.parse(GM_getValue('bmTemplates', '{}'));
console.log(storageTemplates);
templateManager.importJSON(storageTemplates); // Loads the templates

const userSettings = JSON.parse(GM_getValue('bmUserSettings', '{}')); // Loads the user settings
console.log(userSettings);
console.log(Object.keys(userSettings).length);
if (Object.keys(userSettings).length == 0) {
  const uuid = crypto.randomUUID(); // Generates a random UUID
  console.log(uuid);
  GM.setValue('bmUserSettings', JSON.stringify({
    'uuid': uuid
  }));
}
setInterval(() => apiManager.sendHeartbeat(version), 1000 * 60 * 30); // Sends a heartbeat every 30 minutes

console.log(`Telemetry is ${!(userSettings?.telemetry == undefined)}`);
if ((userSettings?.telemetry == undefined) || (userSettings?.telemetry > 1)) { // Increment 1 to retrigger telemetry notice
  const telemetryOverlay = new Overlay(name, version);
  telemetryOverlay.setApiManager(apiManager); // Sets the API manager for the telemetry overlay
  buildTelemetryOverlay(telemetryOverlay); // Notifies the user about telemetry
}

buildWindowMain(); // Builds the main Blue Marble window

apiManager.spontaneousResponseListener(overlayMain); // Reads spontaneous fetch responces

observeBlack(); // Observes the black palette color

consoleLog(`%c${name}%c (${version}) userscript has loaded!`, 'color: cornflowerblue;', '');

/** Observe the black color, and add the "Move" button.
 * @since 0.66.3
 */
function observeBlack() {
  const observer = new MutationObserver((mutations, observer) => {

    const black = document.querySelector('#color-1'); // Attempt to retrieve the black color element for anchoring

    if (!black) {return;} // Black color does not exist yet. Kills iteself

    let move = document.querySelector('#bm-button-move'); // Tries to find the move button

    // If the move button does not exist, we make a new one
    if (!move) {
      move = document.createElement('button');
      move.id = 'bm-button-move';
      move.textContent = 'Move ↑';
      move.className = 'btn btn-soft';
      move.onclick = function() {
        const roundedBox = this.parentNode.parentNode.parentNode.parentNode; // Obtains the rounded box
        const shouldMoveUp = (this.textContent == 'Move ↑');
        roundedBox.parentNode.className = roundedBox.parentNode.className.replace(shouldMoveUp ? 'bottom' : 'top', shouldMoveUp ? 'top' : 'bottom'); // Moves the rounded box to the top
        roundedBox.style.borderTopLeftRadius = shouldMoveUp ? '0px' : 'var(--radius-box)';
        roundedBox.style.borderTopRightRadius = shouldMoveUp ? '0px' : 'var(--radius-box)';
        roundedBox.style.borderBottomLeftRadius = shouldMoveUp ? 'var(--radius-box)' : '0px';
        roundedBox.style.borderBottomRightRadius = shouldMoveUp ? 'var(--radius-box)' : '0px';
        this.textContent = shouldMoveUp ? 'Move ↓' : 'Move ↑';
      }

      // Attempts to find the "Paint Pixel" element for anchoring
      const paintPixel = black.parentNode.parentNode.parentNode.parentNode.querySelector('h2');

      paintPixel.parentNode?.appendChild(move); // Adds the move button
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

/** Creates the main Blue Marble window.
 * Parent/child relationships in the DOM structure below are indicated by indentation.
 * @since 0.58.3
 */
function buildWindowMain() {

  // Creates the window
  overlayMain.addDiv({'id': 'bm-window-main', 'class': 'bm-window', 'style': 'top: 10px; left: unset; right: 75px;'})
    .addDragbar()
      .addButton({'class': 'bm-button-circle', 'textContent': '▼', 'aria-label': 'Minimize window "Blue Marble"', 'data-button-status': 'expanded'}, (instance, button) => {
        button.onclick = () => instance.handleMinimization(button);
        button.ontouchend = () => {button.click();}; // Needed only to negate weird interaction with dragbar
      }).buildElement()
      .addDiv().buildElement() // Contains the minimized h1 element
    .buildElement()
    .addDiv({'class': 'bm-window-content'})
      .addDiv({'class': 'bm-container'})
        .addImg({'class': 'bm-favicon', 'src': 'https://raw.githubusercontent.com/SwingTheVine/Wplace-BlueMarble/main/dist/assets/Favicon.png'}).buildElement()
        .addHeader(1, {'textContent': name}).buildElement()
      .buildElement()
      .addHr().buildElement()
      .addDiv({'class': 'bm-container'})
        .addP({'id': 'bm-user-droplets', 'textContent': 'Droplets:'}).buildElement()
        .addP({'id': 'bm-user-nextlevel', 'textContent': 'Next level in...'}).buildElement()
      .buildElement()
      .addHr().buildElement()
      .addDiv({'class': 'bm-container'})
        .addDiv({'class': 'bm-container'})
          .addButton({'class': 'bm-button-circle bm-button-pin', 'style': 'margin-top: 0;', 'innerHTML': '<svg viewBox="0 0 4 6"><path d="M.5,3.4A2,2 0 1 1 3.5,3.4L2,6"/><circle cx="2" cy="2" r=".7" fill="#fff"/></svg>'},
            (instance, button) => {
              button.onclick = () => {
                const coords = instance.apiManager?.coordsTilePixel; // Retrieves the coords from the API manager
                if (!coords?.[0]) {
                  instance.handleDisplayError('Coordinates are malformed! Did you try clicking on the canvas first?');
                  return;
                }
                instance.updateInnerHTML('bm-input-tx', coords?.[0] || '');
                instance.updateInnerHTML('bm-input-ty', coords?.[1] || '');
                instance.updateInnerHTML('bm-input-px', coords?.[2] || '');
                instance.updateInnerHTML('bm-input-py', coords?.[3] || '');
              }
            }
          ).buildElement()
          .addInput({'type': 'number', 'id': 'bm-input-tx', 'class': 'bm-input-coords', 'placeholder': 'Tl X', 'min': 0, 'max': 2047, 'step': 1, 'required': true}, (instance, input) => {
            //if a paste happens on tx, split and format it into other coordinates if possible
            input.addEventListener("paste", (event) => {
              let splitText = (event.clipboardData || window.clipboardData).getData("text").split(" ").filter(n => n).map(Number).filter(n => !isNaN(n)); //split and filter all Non Numbers
              if (splitText.length !== 4 ) { // If we don't have 4 clean coordinates, end the function.
                return;
              }
              let coords = selectAllCoordinateInputs(document); 
              for (let i = 0; i < coords.length; i++) { 
                coords[i].value = splitText[i]; //add the split vales
              }
              event.preventDefault(); //prevent the pasting of the original paste that would overide the split value
            })
          }).buildElement()
          .addInput({'type': 'number', 'id': 'bm-input-ty', 'class': 'bm-input-coords', 'placeholder': 'Tl Y', 'min': 0, 'max': 2047, 'step': 1, 'required': true}).buildElement()
          .addInput({'type': 'number', 'id': 'bm-input-px', 'class': 'bm-input-coords', 'placeholder': 'Px X', 'min': 0, 'max': 2047, 'step': 1, 'required': true}).buildElement()
          .addInput({'type': 'number', 'id': 'bm-input-py', 'class': 'bm-input-coords', 'placeholder': 'Px Y', 'min': 0, 'max': 2047, 'step': 1, 'required': true}).buildElement()
        .buildElement()
        .addDiv({'class': 'bm-container'})
          .addInputFile({'class': 'bm-input-file', 'textContent': 'Upload Template', 'accept': 'image/png, image/jpeg, image/webp, image/bmp, image/gif'}).buildElement()
        .buildElement()
        .addDiv({'class': 'bm-container bm-flex-between'})
          .addButton({'textContent': 'Disable', 'data-button-status': 'shown'}, (instance, button) => {
            button.onclick = () => {
              button.disabled = true; // Disables the button until the transition ends
              if (button.dataset['buttonStatus'] == 'shown') { // If templates are currently being 'shown' then hide them
                instance.apiManager?.templateManager?.setTemplatesShouldBeDrawn(false); // Disables templates from being drawn
                button.dataset['buttonStatus'] = 'hidden'; // Swap internal button status tracker
                button.textContent = 'Enable'; // Swap button text
                instance.handleDisplayStatus(`Disabled templates!`); // Inform the user
              } else { // In all other cases, we should show templates instead of hiding them
                instance.apiManager?.templateManager?.setTemplatesShouldBeDrawn(true); // Allows templates to be drawn
                button.dataset['buttonStatus'] = 'shown'; // Swap internal button status tracker
                button.textContent = 'Disable'; // Swap button text
                instance.handleDisplayStatus(`Enabled templates!`); // Inform the user
              }
              button.disabled = false; // Enables the button
            }
          }).buildElement()
          .addButton({'textContent': 'Create'}, (instance, button) => {
            button.onclick = () => {
              const input = document.querySelector('#bm-window-main .bm-input-file');

              // Checks to see if the coordinates are valid. Throws an error if they are not
              const coordTlX = document.querySelector('#bm-input-tx');
              if (!coordTlX.checkValidity()) {coordTlX.reportValidity(); instance.handleDisplayError('Coordinates are malformed! Did you try clicking on the canvas first?'); return;}
              const coordTlY = document.querySelector('#bm-input-ty');
              if (!coordTlY.checkValidity()) {coordTlY.reportValidity(); instance.handleDisplayError('Coordinates are malformed! Did you try clicking on the canvas first?'); return;}
              const coordPxX = document.querySelector('#bm-input-px');
              if (!coordPxX.checkValidity()) {coordPxX.reportValidity(); instance.handleDisplayError('Coordinates are malformed! Did you try clicking on the canvas first?'); return;}
              const coordPxY = document.querySelector('#bm-input-py');
              if (!coordPxY.checkValidity()) {coordPxY.reportValidity(); instance.handleDisplayError('Coordinates are malformed! Did you try clicking on the canvas first?'); return;}

              // Kills itself if there is no file
              if (!input?.files[0]) {instance.handleDisplayError(`No file selected!`); return;}

              templateManager.createTemplate(input.files[0], input.files[0]?.name.replace(/\.[^/.]+$/, ''), [Number(coordTlX.value), Number(coordTlY.value), Number(coordPxX.value), Number(coordPxY.value)]);
              instance.handleDisplayStatus(`Drew to canvas!`);
            }
          }).buildElement()
          .addButton({'textContent': 'Filter'}, (instance, button) => {
            button.onclick = () => buildWindowFilter();
          }).buildElement()
        .buildElement()
        .addDiv({'class': 'bm-container'})
          .addTextarea({'id': overlayMain.outputStatusId, 'placeholder': `Status: Sleeping...\nVersion: ${version}`, 'readOnly': true}).buildElement()
        .buildElement()
        .addDiv({'class': 'bm-container bm-flex-between', 'style': 'margin-bottom: 0;'})
          .addDiv({'class': 'bm-flex-between'})
            // .addButton({'class': 'bm-button-circle', 'innerHTML': '🖌'}).buildElement()
            .addButton({'class': 'bm-button-circle', 'innerHTML': '🎨', 'title': 'Template Color Converter'}, (instance, button) => {
              button.onclick = () => {
                window.open('https://pepoafonso.github.io/color_converter_wplace/', '_blank', 'noopener noreferrer');
              }
            }).buildElement()
            .addButton({'class': 'bm-button-circle', 'innerHTML': '🌐', 'title': 'Official Blue Marble Website'}, (instance, button) => {
              button.onclick = () => {
                window.open('https://bluemarble.lol/', '_blank', 'noopener noreferrer');
              }
            }).buildElement()
          .buildElement()
          .addSmall({'textContent': 'Made by SwingTheVine', 'style': 'margin-top: auto;'}).buildElement()
        .buildElement()
      .buildElement()
    .buildElement()
  .buildElement().buildOverlay(document.body);

  // Creates dragging capability on the drag bar for dragging the window
  overlayMain.handleDrag('#bm-window-main.bm-window', '#bm-window-main .bm-dragbar');
}

function buildTelemetryOverlay(overlay) {
  overlay.addDiv({'id': 'bm-overlay-telemetry', style: 'top: 0px; left: 0px; width: 100vw; max-width: 100vw; height: 100vh; max-height: 100vh; z-index: 9999;'})
    .addDiv({'id': 'bm-contain-all-telemetry', style: 'display: flex; flex-direction: column; align-items: center;'})
      .addDiv({'id': 'bm-contain-header-telemetry', style: 'margin-top: 10%;'})
        .addHeader(1, {'textContent': `${name} Telemetry`}).buildElement()
      .buildElement()

      .addDiv({'id': 'bm-contain-telemetry', style: 'max-width: 50%; overflow-y: auto; max-height: 80vh;'})
        .addHr().buildElement()
        .addBr().buildElement()
        .addDiv({'style': 'width: fit-content; margin: auto; text-align: center;'})
        .addButton({'id': 'bm-button-telemetry-more', 'textContent': 'More Information'}, (instance, button) => {
          button.onclick = () => {
            window.open('https://github.com/SwingTheVine/Wplace-TelemetryServer#telemetry-data', '_blank', 'noopener noreferrer');
          }
        }).buildElement()
        .buildElement()
        .addBr().buildElement()
        .addDiv({style: 'width: fit-content; margin: auto; text-align: center;'})
          .addButton({'id': 'bm-button-telemetry-enable', 'textContent': 'Enable Telemetry', 'style': 'margin-right: 2ch;'}, (instance, button) => {
            button.onclick = () => {
              const userSettings = JSON.parse(GM_getValue('bmUserSettings', '{}'));
              userSettings.telemetry = 1;
              GM.setValue('bmUserSettings', JSON.stringify(userSettings));
              const element = document.getElementById('bm-overlay-telemetry');
              if (element) {
                element.style.display = 'none';
              }
            }
          }).buildElement()
          .addButton({'id': 'bm-button-telemetry-disable', 'textContent': 'Disable Telemetry'}, (instance, button) => {
            button.onclick = () => {
              const userSettings = JSON.parse(GM_getValue('bmUserSettings', '{}'));
              userSettings.telemetry = 0;
              GM.setValue('bmUserSettings', JSON.stringify(userSettings));
              const element = document.getElementById('bm-overlay-telemetry');
              if (element) {
                element.style.display = 'none';
              }
            }
          }).buildElement()
        .buildElement()
        .addBr().buildElement()
        .addP({'textContent': 'We collect anonymous telemetry data such as your browser, OS, and script version to make the experience better for everyone. The data is never shared personally. The data is never sold. You can turn this off by pressing the \'Disable\' button, but keeping it on helps us improve features and reliability faster. Thank you for supporting the Blue Marble!'}).buildElement()
        .addP({'textContent': 'You can disable telemetry by pressing the "Disable" button below.'}).buildElement()
      .buildElement()
    .buildElement()
  .buildOverlay(document.body);
}

/** Spawns a Color Filter window.
 * If another color filter window already exists, we DON'T spawn another!
 * Parent/child relationships in the DOM structure below are indicated by indentation.
 * @since 0.88.149
 */
function buildWindowFilter() {

  // If a color filter window already exists, throw an error and return early
  if (document.querySelector('#bm-window-filter')) {
    overlayMain.handleDisplayError('Color Filter window already exists!');
    return;
  }

  // Eye icons
  const eyeOpen = '<svg viewBox="0 .5 6 3"><path d="M0,2Q3-1 6,2Q3,5 0,2H2A1,1 0 1 0 3,1Q3,2 2,2"/></svg>';
  const eyeClosed = '<svg viewBox="0 1 12 6"><mask id="a"><path d="M0,0H12V8L0,2" fill="#fff"/></mask><path d="M0,4Q6-2 12,4Q6,10 0,4H4A2,2 0 1 0 6,2Q6,4 4,4ZM1,2L10,6.5L9.5,7L.5,2.5" mask="url(#a)"/></svg>';

  const localizeNumber = new Intl.NumberFormat();
  const localizePercent = new Intl.NumberFormat(undefined, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Creates a new color filter window
  const overlayFilter = new Overlay(name, version);
  overlayFilter.addDiv({'id': 'bm-window-filter', 'class': 'bm-window'})
    .addDragbar()
      .addButton({'class': 'bm-button-circle', 'textContent': '▼', 'aria-label': 'Minimize window "Color Filter"', 'data-button-status': 'expanded'}, (instance, button) => {
        button.onclick = () => instance.handleMinimization(button);
        button.ontouchend = () => {button.click()}; // Needed only to negate weird interaction with dragbar
      }).buildElement()
      .addDiv().buildElement() // Contains the minimized h1 element
      .addButton({'class': 'bm-button-circle', 'textContent': '🞪', 'aria-label': 'Close window "Color Filter"'}, (instance, button) => {
        button.onclick = () => {document.querySelector('#bm-window-filter')?.remove();};
        button.ontouchend = () => {button.click();}; // Needed only to negate weird interaction with dragbar
      }).buildElement()
    .buildElement()
    .addDiv({'class': 'bm-window-content'})
      .addDiv({'class': 'bm-container bm-center-vertically'})
        .addHeader(1, {'textContent': 'Color Filter'}).buildElement()
      .buildElement()
      .addHr().buildElement()
      .addDiv({'class': 'bm-container bm-flex-between', 'style': 'gap: 1.5ch; width: fit-content; margin-left: auto; margin-right: auto;'})
        .addButton({'textContent': 'Select All'}, (instance, button) => {
          button.onclick = () => selectColorList(false);
        }).buildElement()
        .addButton({'textContent': 'Unselect All'}, (instance, button) => {
          button.onclick = () => selectColorList(true);
        }).buildElement()
      .buildElement()
      .addDiv({'class': 'bm-container bm-scrollable'})
        .addDiv({'class': 'bm-container', 'style': 'margin-left: 2.5ch; margin-right: 2.5ch;'})
          .addDiv({'class': 'bm-container'})
            .addSpan({'id': 'bm-filter-tot-correct', 'innerHTML': '<b>Correct Pixels:</b> ???'}).buildElement()
            .addBr().buildElement()
            .addSpan({'id': 'bm-filter-tot-total', 'innerHTML': '<b>Total Pixels:</b> ???'}).buildElement()
            .addBr().buildElement()
            .addSpan({'id': 'bm-filter-tot-remaining', 'innerHTML': '<b>Complete:</b> ??? (???)'}).buildElement()
            .addBr().buildElement()
            .addSpan({'id': 'bm-filter-tot-completed', 'innerHTML': '??? ???'}).buildElement()
          .buildElement()
          .addDiv({'class': 'bm-container'})
            .addP({'innerHTML': `Colors with the icon ${eyeOpen.replace('<svg', '<svg aria-label="Eye Open"')} will be shown on the canvas. Colors with the icon ${eyeClosed.replace('<svg', '<svg aria-label="Eye Closed"')} will not be shown on the canvas. The "Select All" and "Unselect All" buttons only apply to colors that display in the list below. The amount of correct pixels is dependent on how much of the template you have loaded since you opened Wplace.live.`}).buildElement()
          .buildElement()
          .addHr().buildElement()
          .addForm({'class': 'bm-container'})
            .addFieldset()
              .addLegend({'textContent': 'Sort Options:', 'style': 'font-weight: 700;'}).buildElement()
              .addDiv({'class': 'bm-container'})
                .addSelect({'id': 'bm-filter-sort-primary', 'name': 'sortPrimary', 'textContent': 'I want to view '})
                  .addOption({'value': 'id', 'textContent': 'color IDs'}).buildElement()
                  .addOption({'value': 'name', 'textContent': 'color names'}).buildElement()
                  .addOption({'value': 'premium', 'textContent': 'premium colors'}).buildElement()
                  .addOption({'value': 'percent', 'textContent': 'percentage'}).buildElement()
                  .addOption({'value': 'correct', 'textContent': 'correct pixels'}).buildElement()
                  .addOption({'value': 'incorrect', 'textContent': 'incorrect pixels'}).buildElement()
                  .addOption({'value': 'total', 'textContent': 'total pixels'}).buildElement()
                .buildElement()
                .addSelect({'id': 'bm-filter-sort-secondary', 'name': 'sortSecondary', 'textContent': ' in '})
                  .addOption({'value': 'ascending', 'textContent': 'ascending'}).buildElement()
                  .addOption({'value': 'descending', 'textContent': 'descending'}).buildElement()
                .buildElement()
                .addSpan({'textContent': ' order.'}).buildElement()
              .buildElement()
              .addDiv({'class': 'bm-container'})
                .addCheckbox({'id': 'bm-filter-show-unused', 'name': 'showUnused', 'textContent': 'Show unused colors'}).buildElement()
              .buildElement()
            .buildElement()
            .addDiv({'class': 'bm-container'})
              .addButton({'textContent': 'Sort Colors', 'type': 'submit'}, (instance, button) => {
                button.onclick = (event) => {
                  event.preventDefault(); // Stop default form submission

                  // Get the form data
                  const formData = new FormData(document.querySelector('#bm-window-filter form'));
                  const formValues = {};
                  for ([input, value] of formData) {
                    formValues[input] = value;
                  }
                  console.log(`Primary: ${formValues['sortPrimary']}; Secondary: ${formValues['sortSecondary']}; Unused: ${formValues['showUnused'] == 'on'}`);
                  
                  // Sort the color list
                  sortColorList(formValues['sortPrimary'], formValues['sortSecondary'], formValues['showUnused'] == 'on');
                }
              }).buildElement()
            .buildElement()
          .buildElement()
        .buildElement()
        // Color list will appear here in the DOM tree
      .buildElement()
    .buildElement()
  .buildElement().buildOverlay(document.body);

  // Creates dragging capability on the drag bar for dragging the window
  overlayFilter.handleDrag('#bm-window-filter.bm-window', '#bm-window-filter .bm-dragbar');

  // Obtains the scrollable container to put the color filter in
  const scrollableContainer = document.querySelector('#bm-window-filter .bm-container.bm-scrollable');

  // Obtains the palette Blue Marble currently uses
  const { palette: palette, LUT: _ } = templateManager.paletteBM;

  // Pixel totals
  let allPixelsTotal = 0;
  let allPixelsCorrectTotal = 0;
  const allPixelsCorrect = new Map();
  const allPixelsColor = new Map();

  // Sum the pixel totals across all templates.
  // If there is no total for a template, it defaults to zero
  for (const template of templateManager.templatesArray) {

    const total = template.pixelCount?.total ?? 0;
    allPixelsTotal += total ?? 0; // Sums the pixels placed as "total" per everything

    const colors = template.pixelCount?.colors ?? new Map();

    // Sums the color pixels placed as "total" per color ID
    for (const [colorID, colorPixels] of colors) {
      const _colorPixels = Number(colorPixels) || 0; // Boilerplate
      const allPixelsColorSoFar = allPixelsColor.get(colorID) ?? 0; // The total color pixels for this color ID so far, or zero if none counted so far
      allPixelsColor.set(colorID, allPixelsColorSoFar + _colorPixels);
    }

    // Object that contains the tiles which contain Maps as correct pixels per tile as the value in the key-value pair
    const correctObject = template.pixelCount?.correct ?? {};

    // Sums the pixels placed as "correct" per color ID
    for (const map of Object.values(correctObject)) { // Per tile per template
      for (const [colorID, correctPixels] of map) { // Per color per tile per template
        const _correctPixels = Number(correctPixels) || 0; // Boilerplate
        allPixelsCorrectTotal += _correctPixels; // Sums the pixels placed as "correct" per everything
        const allPixelsCorrectSoFar = allPixelsCorrect.get(colorID) ?? 0; // The total correct pixels for this color ID so far, or zero if none counted so far
        allPixelsCorrect.set(colorID, allPixelsCorrectSoFar + _correctPixels);
      }
    }
  }

  // Localization string formatting for "Remaining Time" in color filter window
  // This is more of a hint than anything, as browsers seem to ignore it >:(
  const localizeDateTimeOptions = {
    month: 'long', // July
    day: 'numeric', // 23
    hour: '2-digit', // 17
    minute: '2-digit', // 47
    second: '2-digit' // 00
  }

  // Calculates the date & time the user will complete the templates
  const timeRemaining = new Date(((allPixelsTotal - allPixelsCorrectTotal) * 30 * 1000) + Date.now()).toLocaleString(undefined, localizeDateTimeOptions);
  // "30" is seconds. "1000" converts to milliseconds. "undefined" forces the localization to be the users.

  // Displays the total amounts across all colors to the user
  overlayFilter.updateInnerHTML('#bm-filter-tot-correct', `<b>Correct Pixels:</b> ${localizeNumber.format(allPixelsCorrectTotal)}`);
  overlayFilter.updateInnerHTML('#bm-filter-tot-total', `<b>Total Pixels:</b> ${localizeNumber.format(allPixelsTotal)}`);
  overlayFilter.updateInnerHTML('#bm-filter-tot-remaining', `<b>Remaining:</b> ${localizeNumber.format((allPixelsTotal || 0) - (allPixelsCorrectTotal || 0))} (${localizePercent.format(((allPixelsTotal || 0) - (allPixelsCorrectTotal || 0)) / (allPixelsTotal || 1))})`);
  overlayFilter.updateInnerHTML('#bm-filter-tot-completed', `<b>Completed at:</b> ${timeRemaining}`)

  // These run when the user opens the Color Filter window
  buildColorList();
  sortColorList('id', 'ascending', false);

  // Creates the color list container
  function buildColorList() {

    const colorList = new Overlay(name, version);
    colorList.addDiv({'class': 'bm-filter-flex'})
    // We leave it open so we can add children to the grid

    // For each color in the palette...
    for (const color of palette) {

      // Relative Luminance
      const lumin = calculateRelativeLuminance(color.rgb);

      // Calculates if white or black text would contrast better with the palette color
      const textColorForPaletteColorBackground = 
      (((1.05) / (lumin + 0.05)) > ((lumin + 0.05) / 0.05)) 
      ? 'white' : 'black';

      const bgEffectForButtons = (textColorForPaletteColorBackground == 'white') ? 'bm-button-hover-white' : 'bm-button-hover-black';
      
      // Turns "total" color into a string of a number; "0" if unknown
      const colorTotal = allPixelsColor.get(color.id) ?? 0
      const colorTotalLocalized = localizeNumber.format(colorTotal);
      
      // This will be displayed if the total pixels for this color is zero
      let colorCorrect = 0;
      let colorCorrectLocalized = '0';
      let colorPercent = localizePercent.format(1);

      // This will be displayed if the total pixels for this color is non-zero
      if (colorTotal != 0) {
        colorCorrect = allPixelsCorrect.get(color.id) ?? '???';
        colorCorrectLocalized = (typeof colorCorrect == 'string') ? colorCorrect : localizeNumber.format(colorCorrect);
        colorPercent = isNaN(colorCorrect / colorTotal) ? '???' : localizePercent.format(colorCorrect / colorTotal);
      }

      // Incorrect pixels for this color
      const colorIncorrect = parseInt(colorTotal) - parseInt(colorCorrect);

      const isColorHidden = !!(templateManager.shouldFilterColor.get(color.id) || false);

      // Construct the DOM tree for color in color list
      colorList.addDiv({'class': 'bm-container bm-filter-color bm-flex-between',
        'data-id': color.id,
        'data-name': color.name,
        'data-premium': +color.premium,
        'data-correct': !Number.isNaN(parseInt(colorCorrect)) ? colorCorrect : '0',
        'data-total': colorTotal,
        'data-percent': (colorPercent.slice(-1) == '%') ? colorPercent.slice(0, -1) : '0',
        'data-incorrect': colorIncorrect || 0
      }).addDiv({'class': 'bm-filter-container-rgb', 'style': `background-color: rgb(${color.rgb?.map(channel => Number(channel) || 0).join(',')});`})
          .addButton({
            'class': 'bm-button-trans ' + bgEffectForButtons,
            'data-state': isColorHidden ? 'hidden' : 'shown',
            'aria-label': isColorHidden ? `Show the color ${color.name || ''} on templates.` : `Hide the color ${color.name || ''} on templates.`,
            'innerHTML': isColorHidden ? eyeClosed.replace('<svg', `<svg fill="${textColorForPaletteColorBackground}"`) : eyeOpen.replace('<svg', `<svg fill="${textColorForPaletteColorBackground}"`)},
            (instance, button) => {
              button.onclick = () => {
                button.style.textDecoration = 'none';
                button.disabled = true;
                if (button.dataset['state'] == 'shown') {
                  button.innerHTML = eyeClosed.replace('<svg', `<svg fill="${textColorForPaletteColorBackground}"`);
                  button.dataset['state'] = 'hidden';
                  button.ariaLabel = `Show the color ${color.name || ''} on templates.`;
                  templateManager.shouldFilterColor.set(color.id, true);
                } else {
                  button.innerHTML = eyeOpen.replace('<svg', `<svg fill="${textColorForPaletteColorBackground}"`);
                  button.dataset['state'] = 'shown';
                  button.ariaLabel = `Hide the color ${color.name || ''} on templates.`;
                  templateManager.shouldFilterColor.delete(color.id);
                }
                button.disabled = false;
                button.style.textDecoration = '';
              }
            }
          ).buildElement()
        .buildElement()
        .addDiv({'class': 'bm-flex-between'})
          .addHeader(2, {'textContent': (color.premium ? '★ ' : '') + color.name}).buildElement()
          .addDiv({'class': 'bm-flex-between', 'style': 'gap: 1.5ch;'})
            .addSmall({'textContent': `#${color.id}`}).buildElement()
            .addSmall({'textContent': `${colorCorrectLocalized} / ${colorTotalLocalized}`}).buildElement()
          .buildElement()
          .addP({'textContent': `${((typeof colorIncorrect == 'number') && !isNaN(colorIncorrect)) ? colorIncorrect : '???'} incorrect pixels. Completed: ${colorPercent}`}).buildElement()
        .buildElement()
      .buildElement()
    }

    // Adds the colors to the color container in the filter window
    colorList.buildOverlay(scrollableContainer);
  }

  // Sorts the color list & hides unused colors
  function sortColorList(sortPrimary, sortSecondary, showUnused) {
    // "sortSecondary" can be either 'ascending' or 'descending'

    const colorList = document.querySelector('.bm-filter-flex');

    const colors = Array.from(colorList.children);

    colors.sort((index, nextIndex) => {
      const indexValue = index.getAttribute('data-' + sortPrimary);
      const nextIndexValue = nextIndex.getAttribute('data-' + sortPrimary);

      const indexValueNumber = parseFloat(indexValue);
      const nextIndexValueNumber = parseFloat(nextIndexValue);

      const indexValueNumberIsNumber = !isNaN(indexValueNumber);
      const nextIndexValueNumberIsNumber = !isNaN(nextIndexValueNumber);

      // If the user wants to show unused colors...
      if (showUnused) {
        index.classList.remove('bm-color-hide'); // Show the color
      } else if (!Number(index.getAttribute('data-total'))) {
        // ...else if the user wants to hide unused colors, and this color is unused...
        
        index.classList.add('bm-color-hide'); // Hide the color
      }

      // If both index values are numbers...
      if (indexValueNumberIsNumber && nextIndexValueNumberIsNumber) {
        // Perform numeric comparison
        return sortSecondary === 'ascending' ? indexValueNumber - nextIndexValueNumber : nextIndexValueNumber - indexValueNumber;
      } else {
        // Otherwise, perform string comparison
        const indexValueString = indexValue.toLowerCase();
        const nextIndexValueString = nextIndexValue.toLowerCase();
        if (indexValueString < nextIndexValueString) return sortSecondary === 'ascending' ? -1 : 1;
        if (indexValueString > nextIndexValueString) return sortSecondary === 'ascending' ? 1 : -1;
        return 0;
      }
    });

    colors.forEach(color => colorList.appendChild(color));
  }

  // (Un)selects all colors in the color list that are visible to the user
  function selectColorList(userWantsUnselect) {

    // Gets the colors
    const colorList = document.querySelector('.bm-filter-flex');
    const colors = Array.from(colorList.children);

    // For each color...
    for (const color of colors) {

      // Skip this color if it is hidden
      if (color.classList?.contains('bm-color-hide')) {continue;}

      // Gets the button to click
      const button = color.querySelector('.bm-filter-container-rgb button');
      
      // Exits early if the button is in its proper state
      if ((button.dataset['state'] == 'hidden') && !userWantsUnselect) {continue;} // If the button is selected, and the user wants to select all buttons, then skip this one
      if ((button.dataset['state'] == 'shown') && userWantsUnselect) {continue;} // If the button is not selected, and the user wants to unselect all buttons, then skip this one
      
      button.click(); // If the button is not in its proper state, then we click it
    }
  }
}
