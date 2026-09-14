import Overlay from "./Overlay";
import { localizeDate } from "./utils";

/** Manages the credits window for Blue Marble.
 * @class WindowCredits
 * @since 0.90.9
 * @see {@link Overlay} for examples
 */
export default class WindowCredits extends Overlay {

  /** Constructor for the Credits window
   * @param {string} name - The name of the userscript
   * @param {string} version - The version of the userscript
   * @since 0.90.9
   * @see {@link Overlay#constructor} for examples
   */
  constructor(name, version) {
    super(name, version); // Executes the code in the Overlay constructor
    this.window = null; // Contains the *window* DOM tree
    this.windowID = 'bm-window-credits'; // The ID attribute for this window
    this.windowParent = document.body; // The parent of the window DOM tree

    this.settingsManager = null; // The settings manager

    // Enum for requesting window state variables from settingsManager
    this.WStateVariables = Object.freeze({
      DRAW_DEPTH: 0,
      WINDOW_EXISTS: 1,
      WINDOW_MINIMIZED: 2,
      WINDOW_MOVED: 3,
      X_TRANSLATION_IS_NEGATIVE: 4,
      Y_TRANSLATION_IS_NEGATIVE: 5,
      // Reserved for expansion: 6
      X_TRANSLATION: 7,
      Y_TRANSLATION: 8,
      // Bit flags: 9 - 21
    });
  }

  /** Spawns a Credits window.
   * If another credits window already exists, we DON'T spawn another!
   * Parent/child relationships in the DOM structure below are indicated by indentation.
   * @since 0.90.9
   */
  buildWindow() {

    // ASCII art of "Blue Marble"
    const ascii = `
██████╗ ██╗     ██╗   ██╗███████╗
██╔══██╗██║     ██║   ██║██╔════╝
██████╔╝██║     ██║   ██║█████╗  
██╔══██╗██║     ██║   ██║██╔══╝  
██████╔╝███████╗╚██████╔╝███████╗
╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝

███╗   ███╗ █████╗ ██████╗ ██████╗ ██╗     ███████╗
████╗ ████║██╔══██╗██╔══██╗██╔══██╗██║     ██╔════╝
██╔████╔██║███████║██████╔╝██████╔╝██║     █████╗  
██║╚██╔╝██║██╔══██║██╔══██╗██╔══██╗██║     ██╔══╝  
██║ ╚═╝ ██║██║  ██║██║  ██║██████╔╝███████╗███████╗
╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝
`;

    // If a credits window already exists, close it
    if (document.querySelector(`#${this.windowID}`)) {
      document.querySelector(`#${this.windowID}`).remove();
      return;
    }

    // Should the window start off minimized?
    const wStartsExp = !this.settingsManager.getWindowStateVariable('crdt', this.WStateVariables.WINDOW_MINIMIZED);

    // Obtains if the window was in the DOM tree during the last cold save
    const windowWasInDOM = this.settingsManager.getWindowStateVariable('crdt', this.WStateVariables.WINDOW_EXISTS);

    // Obtains the draw depth from the last save
    const drawDepthOld = this.settingsManager.getWindowStateVariable('crdt', this.WStateVariables.DRAW_DEPTH);

    // If this window was open when the user left the page, we request the draw depth this window had when the page closed.
    // If this window was NOT open, then we put it on top
    const drawDepthNew = this.handleDrawDepth(windowWasInDOM ? drawDepthOld : undefined);

    // Raw translation coordinates
    let translateX = this.settingsManager.getWindowStateVariable('crdt', this.WStateVariables.X_TRANSLATION_IS_NEGATIVE) ? -1 * this.settingsManager.getWindowStateVariable('crdt', this.WStateVariables.X_TRANSLATION) : this.settingsManager.getWindowStateVariable('crdt', this.WStateVariables.X_TRANSLATION);
    let translateY = this.settingsManager.getWindowStateVariable('crdt', this.WStateVariables.Y_TRANSLATION_IS_NEGATIVE) ? -1 * this.settingsManager.getWindowStateVariable('crdt', this.WStateVariables.Y_TRANSLATION) : this.settingsManager.getWindowStateVariable('crdt', this.WStateVariables.Y_TRANSLATION);
    
    // Clampped coordinates, so you can't permanantly lose the window
    translateX = Math.max(-100, Math.min(window.innerWidth - 40, translateX));
    translateY = Math.max(-10, Math.min(window.innerHeight - 35, translateY));
    
    // If the window has NOT been moved, use the default starting location.
    const startingPosition = !this.settingsManager.getWindowStateVariable('crdt', this.WStateVariables.WINDOW_MOVED) ? '' : `top: 0px; left: 0px; transform: translate(${translateX}px, ${translateY}px);`;
    
    // If we don't call this, and the DOM tree loaded AFTER the class, but BEFORE the .buildWindow() call, BM will crash
    this.windowParent = document.body; // The parent of the window DOM tree

    // Creates a new credits window
    this.window = this.addDiv({'id': this.windowID, 'class': 'bm-window', 'style': `${startingPosition} z-index: ${9000 + drawDepthNew};`, 'data-draw-depth': drawDepthNew})
      .addDragbar()
        .addButton({'class': 'bm-button-circle', 'textContent': wStartsExp ? '▼' : '▶', 'aria-label': wStartsExp ? 'Minimize window "Credits"' : 'Unminimize window "Credits"', 'data-button-status': wStartsExp ? 'expanded' : 'collapsed'}, (instance, button) => {
          button.onclick = () => instance.handleMinimization(button);
          button.ontouchend = () => {button.click()}; // Needed only to negate weird interaction with dragbar
        }).buildElement()
        .addDiv(undefined, (instance, div) => {
          if (!wStartsExp) { // If we start collapsed, add the dragbar header
            instance.addHeader(1, {'textContent': 'Credits'}).buildElement();
          }
        }).buildElement() // Contains the minimized h1 element
        .addButton({'class': 'bm-button-circle', 'textContent': '✖', 'aria-label': 'Close window "Credits"'}, (instance, button) => {
          button.onclick = () => {document.querySelector(`#${this.windowID}`)?.remove();};
          button.ontouchend = () => {button.click();}; // Needed only to negate weird interaction with dragbar
        }).buildElement()
      .buildElement()
      .addDiv({'class': 'bm-window-content', 'style': wStartsExp ? '' : 'height: 0px; display: none;'})
        .addDiv({'class': 'bm-container bm-center-vertically'})
          .addHeader(1, {'textContent': 'Credits'}).buildElement()
        .buildElement()
        .addHr().buildElement()
        .addDiv({'class': 'bm-container bm-scrollable'})
          .addSpan({'role': 'img', 'aria-label': this.name})
            .addSpan({'innerHTML': ascii, 'class': 'bm-ascii', 'aria-hidden': 'true'}).buildElement()
          .buildElement()
          .addBr().buildElement()
          .addHr().buildElement()
          .addBr().buildElement()
          .addSpan({'textContent': '"Blue Marble" userscript is made by SwingTheVine.'}).buildElement()
          .addBr().buildElement()
          .addSpan({'innerHTML': 'The <a href="https://bluemarble.lol/" target="_blank" rel="noopener noreferrer">Blue Marble Website</a> is made by <a href="https://github.com/crqch" target="_blank" rel="noopener noreferrer">crqch</a>.'}).buildElement()
          .addBr().buildElement()
          .addSpan({'textContent': `The Blue Marble Website used until ${localizeDate(new Date(1756069320 * 1000))} was made by Camille Daguin.`}).buildElement()
          .addBr().buildElement()
          .addSpan({'textContent': 'The favicon "Blue Marble" is owned by NASA. (The image of the Earth is owned by NASA)'}).buildElement()
          .addBr().buildElement()
          .addSpan({'textContent': 'Special Thanks:'}).buildElement()
          .addUl()
            .addLi({'textContent': 'Espresso, Meqa, and Robot for moderating SwingTheVine\'s community.'}).buildElement()
            .addLi({'innerHTML': 'nof, <a href="https://github.com/TouchedByDarkness" target="_blank" rel="noopener noreferrer">darkness</a> for creating similar userscripts!'}).buildElement()
            .addLi({'innerHTML': '<a href="https://wondapon.net/" target="_blank" rel="noopener noreferrer">Wonda</a> for the Blue Marble banner image!'}).buildElement()
            .addLi({'innerHTML': '<a href="https://crqch.dev/" target="_blank" rel="noopener noreferrer">crqch</a> for creating, maintaining, and hosting the <a href="https://bluemarble.lol/" target="_blank" rel="noopener noreferrer">Blue Marble website</a>!'}).buildElement()
            .addLi({'innerHTML': '<a href="https://github.com/BullStein" target="_blank" rel="noopener noreferrer">BullStein</a>, <a href="https://github.com/allanf181" target="_blank" rel="noopener noreferrer">allanf181</a> for being early beta testers!'}).buildElement()
            .addLi({'innerHTML': 'guidu_ and <a href="https://github.com/Nick-machado" target="_blank" rel="noopener noreferrer">Nick-machado</a> for the original "Minimize" Button code!'}).buildElement()
            .addLi({'innerHTML': '<a href="https://github.com/LolipopJ" target="_blank" rel="noopener noreferrer">LolipopJ</a> and <a href="https://github.com/Arttful" target="_blank" rel="noopener noreferrer">Arttful</a> for providing a solution to a bug I could not solve!'}).buildElement()
            .addLi({'innerHTML': 'Nomad and <a href="https://www.youtube.com/@gustav_vv" target="_blank" rel="noopener noreferrer">Gustav</a> for the tutorials!'}).buildElement()
            .addLi({'innerHTML': '<a href="https://github.com/cfpwastaken" target="_blank" rel="noopener noreferrer">cfp</a> for creating the template overlay that Blue Marble was based on!'}).buildElement()
            .addLi({'innerHTML': '<a href="https://forcenetwork.cloud/" target="_blank" rel="noopener noreferrer">Force Network</a> for hosting the <a href="https://github.com/SwingTheVine/Wplace-TelemetryServer" target="_blank" rel="noopener noreferrer">telemetry server</a>!'}).buildElement()
            .addLi({'innerHTML': '<a href="https://thebluecorner.net" target="_blank" rel="noopener noreferrer">TheBlueCorner</a> for getting me interested in online pixel canvases!'}).buildElement()
          .buildElement()
          .addBr().buildElement()
          .addSpan({'innerHTML': '<a href="https://ko-fi.com/swingthevine" target="_blank" rel="noopener noreferrer">Donators</a>:'}).buildElement()
          .addUl()
            .addLi({'textContent': 'Soultree'}).buildElement()
            .addLi({'textContent': 'Espresso'}).buildElement()
            .addLi({'textContent': 'BEST FAN'}).buildElement()
            .addLi({'textContent': 'Ferb'}).buildElement()
            .addLi({'textContent': 'FuchsDresden'}).buildElement()
            .addLi({'textContent': 'Jack'}).buildElement()
            .addLi({'textContent': 'raiken_au'}).buildElement()
            .addLi({'textContent': 'Jacob'}).buildElement()
            .addLi({'textContent': 'StupidOne'}).buildElement()
            .addLi({'textContent': 'Glox'}).buildElement()
            .addLi({'textContent': 'PintilieVasile'}).buildElement()
            .addLi({'textContent': 'Corni'}).buildElement()
            .addLi({'textContent': 'Liam'}).buildElement()
            .addLi({'textContent': 'som9'}).buildElement()
            .addLi({'textContent': '2 Anonymous Supporters'}).buildElement()
          .buildElement()
        .buildElement()
      .buildElement()
    .buildElement().buildOverlay(this.windowParent);

    // Creates dragging capability on the drag bar for dragging the window
    this.handleDrag(`#${this.windowID}.bm-window`, `#${this.windowID} .bm-dragbar`);
  }

  /** Populates the settingsManager variable with the settingsManager class.
   * @param {SettingsManager} settingsManager - The settingsManager class instance
   * @since 0.94.19
   */
  setSettingsManager(settingsManager) {
    this.settingsManager = settingsManager;
  }
}