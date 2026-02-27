import Overlay from "./Overlay";
import { localizeDate } from "./utils";

/** Manages the credits window for Blue Marble.
 * @class WindowCredits
 * @since 0.90.9
 * @see {@link Overlay} for examples
 */
export default class WindowCredts extends Overlay {

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

    // Creates a new credits window
    this.window = this.addDiv({'id': this.windowID, 'class': 'bm-window'}, (instance, div) => {})
      .addDragbar()
        .addButton({'class': 'bm-button-circle', 'textContent': '▼', 'aria-label': 'Minimize window "Credits"', 'data-button-status': 'expanded'}, (instance, button) => {
          button.onclick = () => instance.handleMinimization(button);
          button.ontouchend = () => {button.click()}; // Needed only to negate weird interaction with dragbar
        }).buildElement()
        .addDiv().buildElement() // Contains the minimized h1 element
        .addButton({'class': 'bm-button-circle', 'textContent': '🞪', 'aria-label': 'Close window "Credits"'}, (instance, button) => {
          button.onclick = () => {document.querySelector(`#${this.windowID}`)?.remove();};
          button.ontouchend = () => {button.click();}; // Needed only to negate weird interaction with dragbar
        }).buildElement()
      .buildElement()
      .addDiv({'class': 'bm-window-content'})
        .addDiv({'class': 'bm-container bm-center-vertically'})
          .addHeader(1, {'textContent': 'Credits'}).buildElement()
        .buildElement()
        .addHr().buildElement()
        .addDiv({'class': 'bm-container bm-scrollable'})
          .addSpan({'innerHTML': ascii, 'style': 'white-space: pre;'}).buildElement()
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
            .addLi({'innerHTML': '<a href="https://github.com/BullStein" target="_blank" rel="noopener noreferrer">BullStein</a>, <a href="https://github.com/allanf181" target="_blank" rel="noopener noreferrer">allanf181</a> for being early beta testers!'}).buildElement()
            .addLi({'innerHTML': 'guidu_ and <a href="https://github.com/Nick-machado" target="_blank" rel="noopener noreferrer">Nick-machado</a> for the original "Minimize" Button code!'}).buildElement()
            .addLi({'innerHTML': 'Nomad and <a href="https://www.youtube.com/@gustav_vv" target="_blank" rel="noopener noreferrer">Gustav</a> for the tutorials!'}).buildElement()
            .addLi({'innerHTML': '<a href="https://thebluecorner.net" target="_blank" rel="noopener noreferrer">TheBlueCorner</a> for getting me interested in online pixel canvases!'}).buildElement()
          .buildElement()
        .buildElement()
      .buildElement()
    .buildElement().buildOverlay(this.windowParent);
  }
}