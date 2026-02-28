import ConfettiManager from "./confetttiManager";
import Overlay from "./Overlay";
import { calculateRelativeLuminance, localizeDate, localizeNumber, localizePercent, rgbToHex } from "./utils";

/** The overlay builder for the color filter Blue Marble window.
 * @description This class handles the overlay UI for the color filter window of the Blue Marble userscript.
 * @class WindowFilter
 * @since 0.88.329
 * @see {@link Overlay} for examples
 */
export default class WindowFilter extends Overlay {

  /** Constructor for the color filter window
   * @param {*} executor - The executing class
   * @since 0.88.329
   * @see {@link Overlay#constructor}
   */
  constructor(executor) {
    super(executor.name, executor.version); // Executes the code in the Overlay constructor
    this.window = null; // Contains the *window* DOM tree
    this.windowID = 'bm-window-filter'; // The ID attribute for this window
    this.windowParent = document.body; // The parent of the window DOM tree

    /** The templateManager instance currently being used. @type {TemplateManager} */
    this.templateManager = executor.apiManager?.templateManager;

    // Eye icons
    this.eyeOpen = '<svg viewBox="0 .5 6 3"><path d="M0,2Q3-1 6,2Q3,5 0,2H2A1,1 0 1 0 3,1Q3,2 2,2"/></svg>';
    this.eyeClosed = '<svg viewBox="0 1 12 6"><mask id="a"><path d="M0,0H12V8L0,2" fill="#fff"/></mask><path d="M0,4Q6-2 12,4Q6,10 0,4H4A2,2 0 1 0 6,2Q6,4 4,4ZM1,2L10,6.5L9.5,7L.5,2.5" mask="url(#a)"/></svg>';

    // Obtains the color palette Blue Marble currently uses
    const { palette: palette, LUT: _ } = this.templateManager.paletteBM;
    this.palette = palette;

    // Tile quantity information
    this.tilesLoadedTotal = 0; // Number of tiles that have been loaded in this session
    this.tilesTotal = 0; // Number of tiles total, across all templates

    // Pixel statistics
    this.allPixelsColor = new Map(); // The amount of pixels total per color as a Map
    this.allPixelsCorrect = new Map(); // The amount of correct pixels per color as a Map
    this.allPixelsCorrectTotal = 0; // Sums the pixels placed as "correct" per everything
    this.allPixelsTotal = 0; // Sums the pixels placed as "total" per everything
    this.timeRemaining = 0; // Calculates the date & time the user will complete the templates
    this.timeRemainingLocalized = ''; // The date & time the user will complete the templates in the date-time format of the user's device, as a string

    // Color list display settings
    this.sortPrimary = 'id'; // The last used primary sort option
    this.sortSecondary = 'ascending'; // The last used secondary sort option
    this.showUnused = false; // Were unused colors shown the last time the user sorted the color list?
  }

  /** Spawns a Color Filter window.
   * If another color filter window already exists, we DON'T spawn another!
   * Parent/child relationships in the DOM structure below are indicated by indentation.
   * @since 0.88.149
   */
  buildWindow() {

    // If a color filter wizard window already exists, close it
    if (document.querySelector(`#${this.windowID}`)) {
      document.querySelector(`#${this.windowID}`).remove();
      return;
    }
    
    // Creates a new color filter window
    this.window = this.addDiv({'id': this.windowID, 'class': 'bm-window'}, (instance, div) => {
      // div.onclick = (event) => {
      //   if (event.target.closest('button, a, input, select')) {return;} // Exit-early if interactive child was clicked
      //   div.parentElement.appendChild(div); // When the window is clicked on, bring to top
      // }
    }).addDragbar()
        .addButton({'class': 'bm-button-circle', 'textContent': '▼', 'aria-label': 'Minimize window "Color Filter"', 'data-button-status': 'expanded'}, (instance, button) => {
          button.onclick = () => instance.handleMinimization(button);
          button.ontouchend = () => {button.click()}; // Needed only to negate weird interaction with dragbar
        }).buildElement()
        .addDiv().buildElement() // Contains the minimized h1 element
        .addButton({'class': 'bm-button-circle', 'textContent': '🞪', 'aria-label': 'Close window "Color Filter"'}, (instance, button) => {
          button.onclick = () => {document.querySelector(`#${this.windowID}`)?.remove();};
          button.ontouchend = () => {button.click();}; // Needed only to negate weird interaction with dragbar
        }).buildElement()
      .buildElement()
      .addDiv({'class': 'bm-window-content'})
        .addDiv({'class': 'bm-container bm-center-vertically'})
          .addHeader(1, {'textContent': 'Color Filter'}).buildElement()
        .buildElement()
        .addHr().buildElement()
        .addDiv({'class': 'bm-container bm-flex-between bm-center-vertically', 'style': 'gap: 1.5ch;'})
          .addButton({'textContent': 'Hide All Colors'}, (instance, button) => {
            button.onclick = () => this.#selectColorList(false);
          }).buildElement()
          .addButton({'textContent': 'Show All Colors'}, (instance, button) => {
            button.onclick = () => this.#selectColorList(true);
          }).buildElement()
        .buildElement()
        .addDiv({'class': 'bm-container bm-scrollable'})
          .addDiv({'class': 'bm-container', 'style': 'margin-left: 2.5ch; margin-right: 2.5ch;'})
            .addDiv({'class': 'bm-container'})
              .addSpan({'id': 'bm-filter-tile-load', 'innerHTML': '<b>Tiles Loaded:</b> 0 / ???'}).buildElement()
              .addBr().buildElement()
              .addSpan({'id': 'bm-filter-tot-correct', 'innerHTML': '<b>Correct Pixels:</b> ???'}).buildElement()
              .addBr().buildElement()
              .addSpan({'id': 'bm-filter-tot-total', 'innerHTML': '<b>Total Pixels:</b> ???'}).buildElement()
              .addBr().buildElement()
              .addSpan({'id': 'bm-filter-tot-remaining', 'innerHTML': '<b>Complete:</b> ??? (???)'}).buildElement()
              .addBr().buildElement()
              .addSpan({'id': 'bm-filter-tot-completed', 'innerHTML': '??? ???'}).buildElement()
            .buildElement()
            .addDiv({'class': 'bm-container'})
              .addP({'innerHTML': `Colors with the icon ${this.eyeOpen.replace('<svg', '<svg aria-label="Eye Open"')} will be shown on the canvas. Colors with the icon ${this.eyeClosed.replace('<svg', '<svg aria-label="Eye Closed"')} will not be shown on the canvas. The "Hide All Colors" and "Show All Colors" buttons only apply to colors that display in the list below. The amount of correct pixels is dependent on how many tiles of the template you have loaded since you last opened Wplace.live. If all tiles have been loaded, then the "correct pixel" count is accurate.`}).buildElement()
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
                    const formData = new FormData(document.querySelector(`#${this.windowID} form`));
                    const formValues = {};
                    for (const [input, value] of formData) {
                      formValues[input] = value;
                    }
                    console.log(`Primary: ${formValues['sortPrimary']}; Secondary: ${formValues['sortSecondary']}; Unused: ${formValues['showUnused'] == 'on'}`);
                    
                    // Sort the color list
                    this.#sortColorList(formValues['sortPrimary'], formValues['sortSecondary'], formValues['showUnused'] == 'on');
                  }
                }).buildElement()
              .buildElement()
            .buildElement()
          .buildElement()
          // Color list will appear here in the DOM tree
        .buildElement()
      .buildElement()
    .buildElement().buildOverlay(this.windowParent);

    // Creates dragging capability on the drag bar for dragging the window
    this.handleDrag(`#${this.windowID}.bm-window`, `#${this.windowID} .bm-dragbar`);

    // Obtains the scrollable container to put the color filter in
    const scrollableContainer = document.querySelector(`#${this.windowID} .bm-container.bm-scrollable`);

    this.#calculatePixelStatistics();

    // Displays some template statistics to the user
    this.updateInnerHTML('#bm-filter-tile-load', `<b>Tiles Loaded:</b> ${localizeNumber(this.tilesLoadedTotal)} / ${localizeNumber(this.tilesTotal)}`);
    this.updateInnerHTML('#bm-filter-tot-correct', `<b>Correct Pixels:</b> ${localizeNumber(this.allPixelsCorrectTotal)}`);
    this.updateInnerHTML('#bm-filter-tot-total', `<b>Total Pixels:</b> ${localizeNumber(this.allPixelsTotal)}`);
    this.updateInnerHTML('#bm-filter-tot-remaining', `<b>Remaining:</b> ${localizeNumber((this.allPixelsTotal || 0) - (this.allPixelsCorrectTotal || 0))} (${localizePercent(((this.allPixelsTotal || 0) - (this.allPixelsCorrectTotal || 0)) / (this.allPixelsTotal || 1))})`);
    this.updateInnerHTML('#bm-filter-tot-completed', `<b>Completed at:</b> <time datetime="${this.timeRemaining.toISOString().replace(/\.\d{3}Z$/, 'Z')}">${this.timeRemainingLocalized}</time>`);

    // These run when the user opens the Color Filter window
    this.#buildColorList(scrollableContainer);
    this.#sortColorList('id', 'ascending', false);
  }

  /** Creates the color list container.
   * @param {HTMLElement} parentElement - Parent element to add the color list to as a child
   * @since 0.88.222
   */
  #buildColorList(parentElement) {

    const colorList = new Overlay(this.name, this.version);
    colorList.addDiv({'class': 'bm-filter-flex'})
    // We leave it open so we can add children to the grid

    // For each color in the palette...
    for (const color of this.palette) {

      // Converts the RGB color to hexdecimal
      const colorValueHex = '#' + rgbToHex(color.rgb).toUpperCase();

      // Relative Luminance
      const lumin = calculateRelativeLuminance(color.rgb);

      // Calculates if white or black text would contrast better with the palette color
      let textColorForPaletteColorBackground = 
      (((1.05) / (lumin + 0.05)) > ((lumin + 0.05) / 0.05)) 
      ? 'white' : 'black';

      // However, if the color is "Transparent" (or there is no color ID), then we make the text color transparent
      if (!color.id) {
        textColorForPaletteColorBackground = 'transparent';
      }

      // Changes the luminance of the hover/focus button effect
      const bgEffectForButtons = (textColorForPaletteColorBackground == 'white') ? 'bm-button-hover-white' : 'bm-button-hover-black';
      
      // Turns "total" color into a string of a number; "0" if unknown
      const colorTotal = this.allPixelsColor.get(color.id) ?? 0
      const colorTotalLocalized = localizeNumber(colorTotal);
      
      // This will be displayed if the total pixels for this color is zero
      let colorCorrect = 0;
      let colorCorrectLocalized = '0';
      let colorPercent = localizePercent(1);

      // This will be displayed if the total pixels for this color is non-zero
      if (colorTotal != 0) {

        // Determines the correct pixels, or the proper fallback
        colorCorrect = this.allPixelsCorrect.get(color.id) ?? '???';
        if ((typeof colorCorrect != 'number') && (this.tilesLoadedTotal == this.tilesTotal) && !!color.id) {
          colorCorrect = 0;
        }

        colorCorrectLocalized = (typeof colorCorrect == 'string') ? colorCorrect : localizeNumber(colorCorrect);
        colorPercent = isNaN(colorCorrect / colorTotal) ? '???' : localizePercent(colorCorrect / colorTotal);
      }
      // There are four outcomes:
      // 1. The correct pixel count is displayed, because there are correct pixels.
      // 2. There are NO correct pixels, and the color is not transparent, but since all tiles are loaded, we know that the correct pixel count is actually 0.
      // 3. There are NO correct pixels, and the color is not transparent, and not all tiles are loaded. We don't know if there are correct pixels or not, so we display "???" instead.
      // 4. There are NO correct pixels, and the color is transparent, so we display '???' because tracking the "Transparent" color is currently disabled.

      // Incorrect pixels for this color
      const colorIncorrect = parseInt(colorTotal) - parseInt(colorCorrect);

      const isColorHidden = !!(this.templateManager.shouldFilterColor.get(color.id) || false);

      // Construct the DOM tree for color in color list
      colorList.addDiv({'class': 'bm-container bm-filter-color bm-flex-between',
        'data-id': color.id,
        'data-name': color.name,
        'data-premium': +color.premium,
        'data-correct': !Number.isNaN(parseInt(colorCorrect)) ? colorCorrect : '0',
        'data-total': colorTotal,
        'data-percent': (colorPercent.slice(-1) == '%') ? colorPercent.slice(0, -1) : '0',
        'data-incorrect': colorIncorrect || 0
      })
      .addDiv({'class': 'bm-flex-center', 'style': 'flex-direction: column;'})
        .addDiv({'class': 'bm-filter-container-rgb', 'style': `background-color: rgb(${color.rgb?.map(channel => Number(channel) || 0).join(',')});`})
          .addButton({
            'class': 'bm-button-trans ' + bgEffectForButtons,
            'data-state': isColorHidden ? 'hidden' : 'shown',
            'aria-label': isColorHidden ? `Show the color ${color.name || ''} on templates.` : `Hide the color ${color.name || ''} on templates.`,
            'innerHTML': isColorHidden ? this.eyeClosed.replace('<svg', `<svg fill="${textColorForPaletteColorBackground}"`) : this.eyeOpen.replace('<svg', `<svg fill="${textColorForPaletteColorBackground}"`)},
            (instance, button) => {

              // When the button is clicked
              button.onclick = () => {
                button.style.textDecoration = 'none';
                button.disabled = true;
                if (button.dataset['state'] == 'shown') {
                  button.innerHTML = this.eyeClosed.replace('<svg', `<svg fill="${textColorForPaletteColorBackground}"`);
                  button.dataset['state'] = 'hidden';
                  button.ariaLabel = `Show the color ${color.name || ''} on templates.`;
                  this.templateManager.shouldFilterColor.set(color.id, true);
                } else {
                  button.innerHTML = this.eyeOpen.replace('<svg', `<svg fill="${textColorForPaletteColorBackground}"`);
                  button.dataset['state'] = 'shown';
                  button.ariaLabel = `Hide the color ${color.name || ''} on templates.`;
                  this.templateManager.shouldFilterColor.delete(color.id);
                }
                button.disabled = false;
                button.style.textDecoration = '';
              }

              // Disables the "hide color" button if the color is "Transparent" (or no ID exists)
              if (!color.id) {button.disabled = true;}
            }
          ).buildElement()
        .buildElement()
        .addSmall({'textContent': (color.id == -2) ? '???????' : colorValueHex}).buildElement()
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
    colorList.buildOverlay(parentElement);
  }

  /** Sorts the color list & hides unused colors
   * @param {string} sortPrimary - The name of the dataset attribute to sort by.
   * @param {string} sortSecondary - Secondary sort. It can be either 'ascending' or 'descending'.
   * @param {boolean} showUnused - Should unused colors be displayed in the list to the user?
   * @since 0.88.222
   */
  #sortColorList(sortPrimary, sortSecondary, showUnused) {

    // Update memorised sort settings
    this.sortPrimary = sortPrimary;
    this.sortSecondary = sortSecondary;
    this.showUnused = showUnused;

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

  /** (Un)selects all colors in the color list that are visible to the user.
   * @param {boolean} userWantsUnselect - Does the user want to unselect colors?
   * @since 0.88.222
   */
  #selectColorList(userWantsUnselect) {

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

  /** Calculates all pixel statistics used in the color filter.
   * @since 0.90.34
   */
  #calculatePixelStatistics() {

    // Resets pixel totals to 0
    this.allPixelsTotal = 0;
    this.allPixelsCorrectTotal = 0;
    this.allPixelsCorrect = new Map();
    this.allPixelsColor = new Map();

    // Sum the pixel totals across all templates.
    // If there is no total for a template, it defaults to zero
    for (const template of this.templateManager.templatesArray) {

      const total = template.pixelCount?.total ?? 0;
      this.allPixelsTotal += total ?? 0; // Sums the pixels placed as "total" per everything

      const colors = template.pixelCount?.colors ?? new Map();

      // Sums the color pixels placed as "total" per color ID
      for (const [colorID, colorPixels] of colors) {
        const _colorPixels = Number(colorPixels) || 0; // Boilerplate
        const allPixelsColorSoFar = this.allPixelsColor.get(colorID) ?? 0; // The total color pixels for this color ID so far, or zero if none counted so far
        this.allPixelsColor.set(colorID, allPixelsColorSoFar + _colorPixels);
      }

      // Object that contains the tiles which contain Maps as correct pixels per tile as the value in the key-value pair
      const correctObject = template.pixelCount?.correct ?? {};

      this.tilesLoadedTotal += Object.keys(correctObject).length; // Sums the total loaded tiles per template
      this.tilesTotal += Object.keys(template.chunked).length; // Sums the total tiles per template

      // Sums the pixels placed as "correct" per color ID
      for (const map of Object.values(correctObject)) { // Per (loaded) tile per template
        for (const [colorID, correctPixels] of map) { // Per color per (loaded) tile per template
          const _correctPixels = Number(correctPixels) || 0; // Boilerplate
          this.allPixelsCorrectTotal += _correctPixels; // Sums the pixels placed as "correct" per everything
          const allPixelsCorrectSoFar = allPixelsCorrect.get(colorID) ?? 0; // The total correct pixels for this color ID so far, or zero if none counted so far
          this.allPixelsCorrect.set(colorID, allPixelsCorrectSoFar + _correctPixels);
        }
      }
    }

    console.log(`Tiles loaded: ${this.tilesLoadedTotal} / ${this.tilesTotal}`);

    // If the template is complete, and the pixel count is non-zero, and at least 1 template exists, and all template tiles have been loaded this session...
    if ((this.allPixelsCorrectTotal >= this.allPixelsTotal) && !!this.allPixelsTotal && (this.tilesLoadedTotal == this.tilesTotal)) {
      // Basically, only run if Blue Marble can confirm with 100% certanty that all (>0) templates are complete.
      
      // Create confetti in the color filter window
      const confettiManager = new ConfettiManager();
      confettiManager.createConfetti(document.querySelector(`#${this.windowID}`));
    }

    // Calculates the date & time the user will complete the templates
    this.timeRemaining = new Date(((this.allPixelsTotal - this.allPixelsCorrectTotal) * 30 * 1000) + Date.now());
    this.timeRemainingLocalized = localizeDate(this.timeRemaining);
  }
}