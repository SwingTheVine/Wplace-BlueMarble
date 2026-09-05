import { consoleError, encodedToNumber, numberToEncoded, set32BitPosition, sleep } from "./utils";
import WindowSettings from "./WindowSettings";

/** SettingsManager class for handling user settings and making them persist between sessions.
 * Logic for {@link WindowSettings} is managed here.
 * "Flags" should follow the same styling as `.classList()` and should not contain spaces.
 * A flag should always be false by default.
 * When a flag is false, it will not exist in the "flags" Array.
 * (Therefore, "flags" should be `[]` by default)
 * If it exists in the "flags" Array, then the flag is `true`.
 * @class SettingsManager
 * @since 0.91.11
 * @example
 * {
 *   "uuid": "497dcba3-ecbf-4587-a2dd-5eb0665e6880",
 *   "telemetry": 1,
 *   "flags": ["hl-noTrans", "ftr-oWin", "te-noSkip"],
 *   "highlight": [[1,0,-1],[1,-1,0],[2,1,0],[1,0,1]],
 *   "filter": "!!#L3/kBp'Gb8]q"
 * }
 */
export default class SettingsManager extends WindowSettings {

  /** Constructor for the SettingsManager class
   * @param {string} name - The name of the userscript
   * @param {string} version - The version of the userscript
   * @param {Object} userSettings - The user settings as an object
   * @param {TemplateManager} templateManager - The main templateManager instance
   * @since 0.91.11
   */
  constructor(name, version, userSettings, templateManager) {
    super(name, version); // Executes WindowSettings constructor
    
    this.userSettings = userSettings; // User settings as an Object
    this.userSettings.flags ??= []; // Makes sure the key "flags" always exists
    this.userSettingsOld = structuredClone(this.userSettings); // Creates a duplicate of the user settings to store the old version of user settings from 5+ seconds ago
    this.userSettingsSaveLocation = 'bmUserSettings'; // Storage save location

    this.updateFrequency = 5000; // Cooldown between saving to storage (throttle)
    this.lastUpdateTime = 0; // When this unix timestamp is within the last 5 seconds, we should not save this.userSettings to storage

    this.templateManager = templateManager; // The main template manager instance
    this.filteredColorsMapOld = this.templateManager?.shouldFilterColor; // The filtered colors Map from a few seconds ago

    // The character representing zero in Blue Marble's default encoding alphabet
    this.zerothEncodingAlphabetCharacter = numberToEncoded(0);

    setInterval(this.updateUserStorage.bind(this), this.updateFrequency); // Runs every X seconds (see updateFrequency)
  }

  /** Updates the user settings in userscript storage
   * @since 0.91.39
   */
  async updateUserStorage() {

    // Turns the objects into a string
    const userSettingsCurrent = JSON.stringify(this.userSettings);
    const userSettingsOld = JSON.stringify(this.userSettingsOld);

    await this.#updateFilteredColors();

    // If the user settings have changed, AND the last update to user storage was over 5 seconds ago (5sec throttle)...
    if ((userSettingsCurrent != userSettingsOld) && ((Date.now() - this.lastUpdateTime) > this.updateFrequency)) {
      await GM.setValue(this.userSettingsSaveLocation, userSettingsCurrent); // Updates user storage
      this.userSettingsOld = structuredClone(this.userSettings); // Updates the old user settings with a duplicate of the current user settings
      this.lastUpdateTime = Date.now(); // Updates the variable that contains the last time updated
      console.log(userSettingsCurrent);
    }
  }

  /** Toggles a boolean flag to the state that was passed in.
   * If no state was passed in, the flag will flip to the opposite state.
   * The existence of the flag determines its state. If it exists, it is `true`.
   * @param {string} flagName - The name of the flag to toggle
   * @param {boolean} [state=undefined] - (Optional) The state to change the flag to
   * @since 0.91.60
   */
  toggleFlag(flagName, state = undefined) {

    const flagIndex = this.userSettings?.flags?.indexOf(flagName) ?? -1; // Is the flag `true`?

    // If the flag is enabled, AND the user does not want to force the flag to be true...
    if ((flagIndex != -1) && (state !== true)) {

      this.userSettings?.flags?.splice(flagIndex, 1); // Remove the flag (makes it false)
    } else if ((flagIndex == -1) && (state !== false)) {
      // Else if the flag is disabled, AND the user does not want to force the flag to be false...
      this.userSettings?.flags?.push(flagName); // Add the flag (makes it true)
    }
  }

  // This is one of the most insane OOP setups I have ever laid my eyes on

  /** Builds the "highlight" category of the settings window
   * @since 0.91.18
   * @see WindowSettings#buildHighlight
   */
  buildHighlight() {

    const highlightPresetOff = '<svg viewBox="0 0 3 3"><path d="M0,0H3V3H0ZM0,1H3M0,2H3M1,0V3M2,0V3" fill="#fff"/><path d="M1,1H2V2H1Z" fill="#2f4f4f"/></svg>';
    const highlightPresetCross = '<svg viewBox="0 0 3 3"><path d="M0,0H3V3H0Z" fill="#fff"/><path d="M1,0H2V1H3V2H2V3H1V2H0V1H1Z" fill="brown"/><path d="M1,1H2V2H1Z" fill="#2f4f4f"/></svg>';
    
    // Obtains user settings for highlight from storage, or the default array if nothing was found
    const storedHighlight = this.userSettings?.highlight ?? [[1, 0, 1], [2, 0, 0], [1, -1, 0], [1, 1, 0], [1, 0, -1]];

    // Constructs the category and adds it to the window
    this.window = this.addDiv({'class': 'bm-container'})
      .addHeader(2, {'textContent': 'Pixel Highlight'}).buildElement()
      .addHr().buildElement()
      .addDiv({'class': 'bm-container', 'style': 'margin-left: 1.5ch;'})
        .addCheckbox({'textContent': 'Highlight transparent pixels'}, (instance, label, checkbox) => {
          checkbox.checked = !this.userSettings?.flags?.includes('hl-noTrans'); // Makes the checkbox match the last stored user setting
          checkbox.onchange = (event) => this.toggleFlag('hl-noTrans', !event.target.checked); // Forces the flag to be the opposite state as the checkbox. E.g. "Checked" means 'hl-noTrans' is false (does not exist).
        }).buildElement()
        .addP({'id': 'bm-highlight-preset-label', 'textContent': 'Choose a preset:', 'style': 'font-weight: 700;'}).buildElement()
        .addDiv({'class': 'bm-flex-center', 'role': 'group', 'aria-labelledby': 'bm-highlight-preset-label'})
          .addDiv({'class': 'bm-highlight-preset-container'})
            .addSpan({'textContent': 'None'}).buildElement()
            .addButton({'innerHTML': highlightPresetOff, 'aria-label': 'Preset "None"'}, (instance, button) => {button.onclick = () => this.#updateHighlightToPreset('None')}).buildElement()
          .buildElement()
          .addDiv({'class': 'bm-highlight-preset-container'})
            .addSpan({'textContent': 'Cross'}).buildElement()
            .addButton({'innerHTML': highlightPresetCross, 'aria-label': 'Preset "Cross Shape"'}, (instance, button) => {button.onclick = () => this.#updateHighlightToPreset('Cross')}).buildElement()
          .buildElement()
          .addDiv({'class': 'bm-highlight-preset-container'})
            .addSpan({'textContent': 'X'}).buildElement()
            .addButton({'innerHTML': highlightPresetCross.replace('d="M1,0H2V1H3V2H2V3H1V2H0V1H1Z"', 'd="M0,0V1H3V0H2V3H3V2H0V3H1V0Z"'), 'aria-label': 'Preset "X Shape"'}, (instance, button) => {button.onclick = () => this.#updateHighlightToPreset('X')}).buildElement()
          .buildElement()
          .addDiv({'class': 'bm-highlight-preset-container'})
            .addSpan({'textContent': 'Full'}).buildElement()
            .addButton({'innerHTML': highlightPresetOff.replace('#fff', '#2f4f4f'), 'aria-label': 'Preset "Full Template"'}, (instance, button) => {button.onclick = () => this.#updateHighlightToPreset('Full')}).buildElement()
          .buildElement()
        .buildElement()
        .addP({'id': 'bm-highlight-grid-label', 'textContent': 'Create a custom pattern:', 'style': 'font-weight: 700;'}).buildElement()
        .addDiv({'class': 'bm-highlight-grid', 'role': 'group', 'aria-labelledby': 'bm-highlight-grid-label'});
          // We leave this open so we can add buttons

          // For each of the 9 buttons...
          for (let buttonY = -1; buttonY <= 1; buttonY++) {
            for (let buttonX = -1; buttonX <= 1; buttonX++) {
              const buttonState = storedHighlight[storedHighlight.findIndex(([, x, y]) => ((x == buttonX) && (y == buttonY)))]?.[0] ?? 0;
              let buttonStateName = 'Disabled';
              if (buttonState == 1) {
                buttonStateName = 'Incorrect';
              } else if (buttonState == 2) {
                buttonStateName = 'Template';
              }
              this.window = this.addButton({
                'data-status': buttonStateName,
                'aria-label': `Sub-pixel ${buttonStateName.toLowerCase()}`
              }, (instance, button) => {
                button.onclick = () => this.#updateHighlightSettings(button, [buttonX, buttonY])
              }).buildElement();
            }
          }

          // Resumes from where we left off before we added buttons
        this.window = this.buildElement()
      .buildElement()
    .buildElement();
  }

  /** Updates the display of the highlight buttons in the settings window.
   * Additionally, it will update user settings with the new selection.
   * @param {HTMLButtonElement} button - The button that was pressed
   * @param {Array<number, number>} coords - The relative coordinates of the button
   * @since 0.91.46
   */
  #updateHighlightSettings(button, coords) {

    button.disabled = true; // Disabled the button until we are done

    const status = button.dataset['status']; // Obtains the current status of the button

    /** Obtains the old highlight storage, or sets it to default. @type {Array<number[]>} */
    const userStorageOld = this.userSettings?.highlight ?? [[1, 0, 1], [2, 0, 0], [1, -1, 0], [1, 1, 0], [1, 0, -1]];

    let userStorageChange = [2, 0, 0]; // The new change to the user storage

    const userStorageNew = userStorageOld; // The old storage with the new change

    // For each different type of status...
    switch (status) {

      // If the button was in the "Disabled" state
      case 'Disabled':

        // Change to "Incorrect"
        button.dataset['status'] = 'Incorrect';
        button.ariaLabel = 'Sub-pixel incorrect';
        userStorageChange = [1, ...coords];
        break;
      
      // If the button was in the "Incorrect" state
      case 'Incorrect':

        // Change to "Template"
        button.dataset['status'] = 'Template';
        button.ariaLabel = 'Sub-pixel template';
        userStorageChange = [2, ...coords];
        break;
      
      // If the button was in the "Template" state
      case 'Template':

        // Change to "Disabled"
        button.dataset['status'] = 'Disabled';
        button.ariaLabel = 'Sub-pixel disabled';
        userStorageChange = [0, ...coords];
        break;
    }

    // Finds the index of the pixel to change
    const indexOfChange = userStorageOld.findIndex(([, x, y]) => ((x == userStorageChange[1]) && (y == userStorageChange[2])));

    // If the new sub-pixel state is NOT disabled
    if (userStorageChange[0] != 0) {

      // If a sub-pixel was found...
      if (indexOfChange != -1) {
        userStorageNew[indexOfChange] = userStorageChange;
      } else {
        userStorageNew.push(userStorageChange);
      }
    } else if (indexOfChange != -1) {
      // Else, it is disabled. We want to remove it if it exists.
      userStorageNew.splice(indexOfChange, 1); // Removes 1 index from the array at the index of the pixel change
    }

    this.userSettings['highlight'] = userStorageNew;
    // TODO: Add timer update here

    button.disabled = false; // Reenables the button since we are done
  }

  /** Changes the highlight buttons to the clicked preset.
   * @param {string} preset - The name of the preset
   * @since 0.91.49
   */
  async #updateHighlightToPreset(preset) {

    // Obtains all preset buttons as a NodeList
    const presetButtons = document.querySelectorAll('.bm-highlight-preset-container button');

    // For each preset...
    for (const button of presetButtons) {
      button.disabled = true; // Disables the button
    }

    let presetArray = [0,0,0,0,2,0,0,0,0]; // The preset "None"

    // Selects the preset passed in
    switch (preset) {
      case 'Cross':
        presetArray = [0,1,0,1,2,1,0,1,0]; // The preset "Cross"
        break;
      case 'X':
        presetArray = [1,0,1,0,2,0,1,0,1]; // The preset "X"
        break;
      case 'Full': 
        presetArray = [2,2,2,2,2,2,2,2,2]; // The preset "Full"
        break;
    }

    // Obtains the buttons to click as a NodeList
    const buttons = document.querySelector('.bm-highlight-grid')?.childNodes ?? [];

    // For each button...
    for (let buttonIndex = 0; buttonIndex < buttons.length; buttonIndex++) {

      const button = buttons[buttonIndex]; // Gets the current button to check

      // Gets the state of the button as a number
      let buttonState = button.dataset['status'];
      buttonState = (buttonState != 'Disabled') ? ((buttonState != 'Incorrect') ? 2 : 1) : 0;

      // Finds the difference between the preset and the button
      let buttonStateDelta = presetArray[buttonIndex] - buttonState;

      // Since there is no difference, the button matches, so we skip it
      if (buttonStateDelta == 0) {continue;}

      // Makes the difference positive
      buttonStateDelta += (buttonStateDelta < 0) ? 3 : 0;

      /** At this point, these are the possible options:
       * 1. The preset is zero and the button is two (-2) so we need to click once
       * 2. The preset is one and the button is two (-1) so we need to click twice
       * 3. The preset is one ahead of the button (1) so we need to click once
       * 4. The preset is two ahead of the button (2) so we need to click twice
       * Due to the addition of three in the line above, options 1 & 3 combine, and options 2 & 4 combine.
       * Now the only options we have are:
       * 1. If (1) then click once
       * 2. If (2) then click twice
       * Also due to the addition of three in the line above, our two options are POSITIVE numbers
       */

      button.click(); // Clicks once
      
      // Clicks a second time if needed
      if (buttonStateDelta == 2) {

        // For 0.2 seconds, or when the button is NOT disabled, wait for 10 milliseconds before attempting to continue
        for (let timeWaited = 0; timeWaited < 200; timeWaited += 10) {
          if (!button.disabled) {break;} // Breaks early once the button is enabled
          await sleep(10);
        }

        button.click(); // Clicks again
      }
    }

    // For each preset...
    for (const button of presetButtons) {
      button.disabled = false; // Re-enables the button
    }
  }

  /** Updates filtered colors in user storage.
   * @since 0.92.15
   */
  async #updateFilteredColors() {

    const timer = performance.now();
    
    // The current color filter Map
    const filteredColorMap = this.templateManager.shouldFilterColor;
    console.log('FilteredColorMap', filteredColorMap);

    // If no colors are to be filtered, store an empty string
    if (!filteredColorMap.size) {
      this.userSettings.filter = '';
      return; // Returns early
    }

    let mutableBitFlagsNegSmall = 0; // Colors -1 to -31 in Blue Marble's palette
    let mutableBitFlagsPosSmall = 0; // Colors 0 to 31 in Wplace's palette
    let mutableBitFlagsPosLarge = 0; // Colors 32 to 63 in Wplace's palette
    
    // For each color passed in...
    for (const [id, value] of filteredColorMap) {

      if (id >= -32 && id <= -1) {
        mutableBitFlagsNegSmall = set32BitPosition(mutableBitFlagsNegSmall, id + 32, value);
      } else if (id >= 0 && id <= 31) {
        mutableBitFlagsPosSmall = set32BitPosition(mutableBitFlagsPosSmall, id, value);
      } else if (id >= 32 && id <= 63) {
        mutableBitFlagsPosLarge = set32BitPosition(mutableBitFlagsPosLarge, id - 32, value);
      } else {
        consoleError(`Attempted to store filter color with ID #${id} but this ID number is out of bounds (-32 to 63)! The color will not be stored.`);
      }
    }

    const encodedBitFlags = numberToEncoded(mutableBitFlagsNegSmall).padStart(5, this.zerothEncodingAlphabetCharacter)
      + numberToEncoded(mutableBitFlagsPosSmall).padStart(5, this.zerothEncodingAlphabetCharacter)
      + numberToEncoded(mutableBitFlagsPosLarge).padStart(5, this.zerothEncodingAlphabetCharacter);

    console.log(mutableBitFlagsNegSmall);
    console.log(mutableBitFlagsPosSmall);
    console.log(mutableBitFlagsPosLarge);
    console.log(encodedBitFlags);

    this.userSettings.filter = encodedBitFlags; // Stores the encoded bit flags

    console.log(`Finished updating filter color storage in ${(performance.now() - timer).toFixed(3) / 1000} seconds!\nThere are ${filteredColorMap.size} hidden colors.`);
  }

  /** Build the "template" category of settings window
   * @since 0.91.68
   * @see WindowSettings#buildTemplate
   */
  buildTemplate() {

    this.window = this.addDiv({'class': 'bm-container'})
      .addHeader(2, {'textContent': 'Template'}).buildElement()
      .addHr().buildElement()
      .addDiv({'class': 'bm-container', 'style': 'margin-left: 1.5ch;'})
        .addCheckbox({'textContent': 'Template creation should skip transparent tiles'}, (instance, label, checkbox) => {
          checkbox.checked = !this.userSettings?.flags?.includes('hl-noSkip'); // Makes the checkbox match the last stored user setting
          checkbox.onchange = (event) => this.toggleFlag('hl-noSkip', !event.target.checked); // If the user wants to skip, then the checkbox is NOT checked
        }).buildElement()
        .addCheckbox({'innerHTML': 'Experimental: Template creation should <em>aggressively</em> skip transparent tiles'}, (instance, label, checkbox) => {
          checkbox.checked = this.userSettings?.flags?.includes('hl-agSkip'); // Makes the checkbox match the last stored user setting
          checkbox.onchange = (event) => this.toggleFlag('hl-agSkip', event.target.checked); // If the user wants to aggressively skip, then the checkbox is checked
        }).buildElement()
      .buildElement()
    .buildElement()
  }
}