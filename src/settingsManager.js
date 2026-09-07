import ApiManager from "./apiManager";
import { consoleError, consoleWarn, encodedToNumber, numberToEncoded, numberUnsignedTo32BitBooleanArray, set32BitPosition, sleep } from "./utils";
import WindowSettings from "./WindowSettings";

/** Documentation for `windowState` encoding.
 * The variables are stored as concatnated, Big-Endian, base 92, substrings.
 * 
 *  Var 1 | Var 2 | Var 3
 * 123456781234567812345678 (do not assume each variable is 8 bytes)
 * 
 * Variable width is non-standard, but known (e.g. first variable is one byte, next variable is twenty bytes). Therefore, seperators are not used.
 * These variables are listed from their first occurance, to their last occurance, in order.
 * The first section ("All Windows") contains the variables which occur at the start of every window state.
 * Variables unique to a window are stored *after* that section.
 * The "Binary" type refers to variables that require additional decoding, as they are not stored as a `Number`.
 * Storing a `Number` in the default, 13 unique bit flags is discouraged.
 * Text should never be stored, because it will always bloat.
 * Avoid collisions with other user storage settings. If a variable's state is managed elsewhere, don't add it here.
 * If a variable is critical to non-display functionality, don't add it here.
 * (i.e. Filter Window's displayed filtered colors is managed elsewhere, and is critical to templateManager for template rendering)
 * (i.e. All of the Settings Window's variables are critical to functionality elsewhere)
 * Nothing other than settingsManager should write to `windowState`, because there is no point. Just update the Manager's variable.
 * "Why did you make this so hard?" because it reduces the file size by up to ~95% (with key-value pairs)
 * For example, the main window is stored as 30 bytes in the JSON file, and the non-compressed version would be ~400 bytes (with key-value pairs).
 * 
 *  _____________________________________________________
 * |             |# of |  Slice  |         |
 * | Window Name |bytes|  Value  |  Type   | Description
 * #-------------+-----+---------+---------+-------------
 * | All Windows |  1  |  0,  1  | Number  | Draw depth of the window. (0 is the window on the bottom, 91 is the window on the top)
 * | All Windows |  1  |  1,  2  | Binary  | 6 bit flags (Big-Endian, most-significant bit is reserved)
 * | All Windows |     |    ^---0| Boolean |  *Does the window exist in the DOM tree? (Is the window displayed to the user?)
 * | All Windows |     |   /|\--1| Boolean |  *Is the window minimized?
 * | All Windows |     |    |---2| Boolean |  *Has the window been moved/dragged by the user?
 * | All Windows |     |    |---3| Boolean |  *Is the X-axis shift translation negative? (This is a sign)
 * | All Windows |     |    |---4| Boolean |  *Is the Y-axis shift translation negative? (This is a sign)
 * | All Windows |     |    |---5| Boolean |  *Reserved for future extension. (True = the next byte contains 6 bit flags)
 * | All Windows |  3  |  2,  5  | Number  | Shift translation across the X-axis (zeroed if none)
 * | All Windows |  3  |  5,  8  | Number  | Shift translation across the Y-axis (zeroed if none)
 * #-------------+-----+---------+---------+------------
 * | Main Window |  2  |  8, 10  | Binary  | 13 bit flags, which are unique to this window
 * | Main Window |  4  | 10, 14  | Number  | "Upload Template" input fields for the X coordinates (stored in the 2-coordinate system)
 * | Main Window |  4  | 14, 18  | Number  | "Upload Template" input fields for the Y coordinates (stored in the 2-coordinate system)
 * |    Filter   |  2  |  8, 10  | Binary  | 13 bit flags, which are unique to this window
 * |   Settings  |  2  |  8, 10  | Binary  | 13 bit flags, which are unique to this window
 * | Temp Wizard |  2  |  8, 10  | Binary  | 13 bit flags, which are unique to this window
 * |   Credits   |  2  |  8, 10  | Binary  | 13 bit flags, which are unique to this window
 * 
 */

/** SettingsManager class for handling user settings and making them persist between sessions.
 * Logic for {@link WindowSettings} is managed here.
 * "Flags" should follow the same styling as `.classList()` and should not contain spaces.
 * A flag should always be false by default.
 * When a flag is false, it will not exist in the "flags" Array.
 * (Therefore, "flags" should be `[]` by default)
 * If it exists in the "flags" Array, then the flag is `true`.
 * Windows are assumed to have only one `translate()` call in a `transform:` CSS in-line style.
 * Aforementioned `translate()` is expected to be in pixel units. It can read non-pixel units, but will save/load as pixel units.
 * @class SettingsManager
 * @since 0.91.11
 * @example
 * {
 *   "uuid": "497dcba3-ecbf-4587-a2dd-5eb0665e6880",
 *   "telemetry": 1,
 *   "flags": ["hl-noTrans", "ftr-oWin", "te-noSkip"],
 *   "highlight": [[1,0,-1],[1,-1,0],[2,1,0],[1,0,1]],
 *   "filter": "!!#L3/kBp'Gb8]q"
 *   "windowStates": {"ftr": "!!$L4", "bm": "/kBp:"}
 * }
 */
export default class SettingsManager extends WindowSettings {

  #windowStatesObject;
  #windowStatesObjectEncoded;

  /** Constructor for the SettingsManager class
   * @param {string} name - The name of the userscript
   * @param {string} version - The version of the userscript
   * @param {Object} userSettings - The user settings as an object
   * @since 0.91.11
   */
  constructor(name, version, userSettings) {
    super(name, version); // Executes WindowSettings constructor

    // The character representing zero and one in Blue Marble's default encoding alphabet
    this.zerothEncodingAlphabetCharacter = numberToEncoded(0);
    this.onethEncodingAlphabetCharacter = numberToEncoded(1);

    this.windowMain = null; // The Main Blue Marble window
    this.templateManager = null; // The template manager instance
    this.apiManager = null; // The API manager

    this.userSettings = userSettings; // User settings as an Object
    this.userSettings.flags ??= []; // Makes sure the key "flags" always exists
    this.userSettingsOld = structuredClone(this.userSettings); // Creates a duplicate of the user settings to store the old version of user settings from 5+ seconds ago
    this.userSettingsSaveLocation = 'bmUserSettings'; // Storage save location

    this.commonStatesByteLength = 8; // Sum of bytes of the common window state variables ("All Windows")
    this.#windowStatesObjectEncoded = this.userSettings?.windowStates ?? {};
    this.#windowStatesObject = this.#decodeWindowStateToObject(this.#windowStatesObjectEncoded) ?? {};
    this.commonWindowStateTranslateRegEx = new RegExp(/translate\((-?\d*\.?\d*)\w*\s*,?\s*(-?\d*\.?\d*)/i); // RegEx for finding where the window is

    this.updateFrequency = 2000; // Cooldown between saving to storage (throttle)
    this.lastUpdateTime = 0; // When this unix timestamp is within the last 5 seconds, we should not save this.userSettings to storage

    setInterval(this.#updateWindowState.bind(this), this.updateFrequency * 0.6);
    setInterval(this.updateUserStorage.bind(this), this.updateFrequency); // Runs every X seconds (see updateFrequency)
  }

  /** Updates the user settings in userscript storage
   * @since 0.91.39
   */
  async updateUserStorage() {

    await this.#updateFilteredColors(); // Update the encoded string of filtered colors

    this.userSettings['windowStates'] = this.#windowStatesObjectEncoded;

    // Turns the objects into a string
    const userSettingsCurrent = JSON.stringify(this.userSettings);
    const userSettingsOld = JSON.stringify(this.userSettingsOld);

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

      this.userSettings?.flags?.slice(flagIndex, 1); // Remove the flag (makes it false)
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
      userStorageNew.slice(indexOfChange, 1); // Removes 1 index from the array at the index of the pixel change
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

    //const timer = performance.now();
    
    // The current color filter Map
    const filteredColorMap = this.templateManager.shouldFilterColor;

    // If no colors are to be filtered, return early
    if (!filteredColorMap.size) {
      this.userSettings.filter = this.zerothEncodingAlphabetCharacter.repeat(15);
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

    this.userSettings.filter = encodedBitFlags; // Stores the encoded bit flags

    //console.log(`Finished updating filter color storage in ${(performance.now() - timer).toFixed(3) / 1000} seconds!\nThere are ${filteredColorMap.size} hidden colors.`);
  }

  /** Decodes the filtered color bit flags that came from user storage.
   * @param {string} encodedString - The filtered color save-state from user storage
   * @returns {Map<number, boolean>} A map containing only entries of colors to filter
   * @since 0.92.18
   */
  decodeFilteredColorBitFlags(encodedString) {

    const shouldColorBeFiltered = new Map(); // Will contain colors to be filtered

    // If encodedString is in an unexpected state...
    if (typeof encodedString !== 'string') {
      consoleWarn('Could not decode filtered colors from user storage! Either the filtered colors are not stored as a string, or the user storage does not exist. Assuming no colors are filtered...');
      return shouldColorBeFiltered; // Return early
    }

    // Return early if no colors are filtered
    if (!encodedString || encodedString == this.zerothEncodingAlphabetCharacter.repeat(15)) {return shouldColorBeFiltered;}

    const minSupportedBitFlag = -32; // Minimum supported color ID (Reserved Blue Marble color)
    const maxSupportedBitFlag = 63; // Maximum supported color ID (Light Stone Wplace color)
    const supportedEncodedBitFlags = encodedString.slice(0, 15); // This version of Blue Marble can not support more than 15 encoded characters, so we ignore them.

    // The bit flags
    const bitFlagsNegSmall = encodedToNumber(supportedEncodedBitFlags.slice(0, 5));
    const bitFlagsPosSmall = encodedToNumber(supportedEncodedBitFlags.slice(5, 10));
    const bitFlagsPosLarge = encodedToNumber(supportedEncodedBitFlags.slice(10, 15));
    // It is assumed that `encodedToNumber` outputs an unsigned number (0 to 4294967295)

    // For all supported color IDs...
    for (let id = minSupportedBitFlag; id <= maxSupportedBitFlag; id++) {

      let isBitTrue = false;

      // Find if the bit is one, and if it is, mark that ID as a filtered color
      if (id >= -32 && id <= -1) {
        isBitTrue = (bitFlagsNegSmall & (1 << (id + 32))) !== 0;
      } else if (id >= 0 && id <= 31) {
        isBitTrue = (bitFlagsPosSmall & (1 << id)) !== 0;
      } else if (id >= 32 && id <= 63) {
        isBitTrue = (bitFlagsPosLarge & (1 << (id - 32))) !== 0;
      }
      if (isBitTrue) {
        shouldColorBeFiltered.set(id, true);
      }
    }

    return shouldColorBeFiltered;
  }

  /** Retrieves all window states, and *overrides* the user storage version stored in `this.userStorage.windowStates`.
   * This encodes window states.
   * @since 0.92.23
   */
  #updateWindowState() {

    /** Obtains common window states, which are non-unique to the window.
     * (Every window can have these states)
     * @param {HTMLElement} windowElement - The ID (DOM attribute) of the window.
     * @param {string} userStorageID - The UID (key) used in user storage to signify this window
     * @since 0.92.23
     * @returns {string} Encoded string, which contains the common state variables.
     */
    const obtainCommonStates = (windowElement, userStorageID) => {

      // Retrieves the hottest stored common state for this window.
      // This is the memory version, as opposed to disk version, which is cold
      // If it can't retrieve the common state, we use zeros, because either the window is new, or something went VERY wrong somewhere else, so a little data loss here is fine compared to the alternative (crashing)
      console.log(this.#windowStatesObjectEncoded?.[userStorageID]?.slice(0, this.commonStatesByteLength) ?? this.zerothEncodingAlphabetCharacter.repeat(this.commonStatesByteLength));
      const commonStatesOld = this.#windowStatesObjectEncoded?.[userStorageID]?.slice(0, this.commonStatesByteLength) ?? this.zerothEncodingAlphabetCharacter.repeat(this.commonStatesByteLength);
      // This is ONLY the common states of the window

      // Returns the previously stored window state variables...
      // ...but sets the "is window shown" variable to `false`
      if (!windowElement) {return commonStatesOld.slice(0, 1) + numberToEncoded(set32BitPosition(encodedToNumber(commonStatesOld.slice(1, 2)), 0, false)) + commonStatesOld.slice(2);}

      // Obtain the draw depth, or if it does not exist, (cause a collision) by setting it to zero
      // Refuses to set a draw depth greater than 91
      const drawDepth = Math.max(0, Math.min(Number(windowElement.dataset['drawDepth'] ?? 0), 91));

      // Declares the dynamically constructed bit flag byte
      // We immediately set the "is window shown" bit to `true`
      let bitFlagsMutable = set32BitPosition(0, 0, true); // Use only the 6 least-significant bits

      // Figures out if the window is minimized, and sets the cooresponding bit
      const windowMinimizationButton = windowElement.querySelector('button[data-button-status]');
      const isWindowMinimized = (windowMinimizationButton?.dataset['buttonStatus'] == 'collapsed');
      bitFlagsMutable = set32BitPosition(bitFlagsMutable, 1, isWindowMinimized);

      const windowStyle = windowElement.style; // The in-line style DOM attribute for the window

      /** RegEx matches, which contain the coordinate strings.
       * Matches against the `transform` style property
       * @type {string[] | null}
       */
      const matches = this.commonWindowStateTranslateRegEx.exec(windowStyle.getPropertyValue('transform') ?? '');

      // If matches exists, then the window has been moved,
      // so we update the corresponding bit
      bitFlagsMutable = set32BitPosition(bitFlagsMutable, 2, !!matches);

      const xTransCoord = Number(matches?.[1] ?? 0); // X Coordinate, or zero
      const yTransCoord = Number(matches?.[2] ?? 0); // Y Coordinate, or zero

      // Is the [axis] shift translation negative?
      // A really cool trick, which turns the sign of a number into a boolean. (Negative zero becomes positive)
      // !!(Math.sign(number) + 1)
      // But since `negative = true` here, we invert the boolean
      // and assign the boolean to the corresponding bit
      bitFlagsMutable = set32BitPosition(bitFlagsMutable, 3, !(Math.sign(xTransCoord) + 1));
      bitFlagsMutable = set32BitPosition(bitFlagsMutable, 4, !(Math.sign(yTransCoord) + 1));

      const windowCoordinateMaximum = 778687; // Ones, for three encoded characters  (92^3)-1

      // Encodes the X & Y coordinates, clamped to the farthest supported coordinate
      const windowTransX = numberToEncoded(Math.min(Math.abs(xTransCoord), windowCoordinateMaximum));
      const windowTransY = numberToEncoded(Math.min(Math.abs(yTransCoord), windowCoordinateMaximum));

      // Stores one/true because the window always exists if this code reaches this point
      return numberToEncoded(drawDepth).slice(-1) // Clamp to 1 character
        + numberToEncoded(bitFlagsMutable).slice(-1) // Clamp to 1 character
        + windowTransX.padStart(3, this.zerothEncodingAlphabetCharacter).slice(-3) // Clamp to 3 characters
        + windowTransY.padStart(3, this.zerothEncodingAlphabetCharacter).slice(-3); // Clamp to 3 characters
    };
    
    // Obtains the window ID for the main window
    const windowMainID = this.windowMain?.windowID;
    
    // Obtains the main window element itself
    const windowMainElement = windowMainID ? document.querySelector('#' + this.windowMain?.windowID) : undefined;
    // Obtains the most-up-to-date common window state for the main window
    const windowMainCommonStates = obtainCommonStates(windowMainElement, 'bm');
    // Stores 13 bit flags unique to this window
    let windowMainUniqueStatesMutable = 0; // Currently there are none, so this is the final verison
    // Stores the X coordinates for the "Upload Template" coordinate input fields. Fallback is zero. Note: This is a user-specified field
    const windowMainTemplateCoordinateX = Math.min(2047999, Math.max(0, (Number(windowMainElement?.querySelector('#bm-input-tx')?.value ?? 0) * 1000) + Number(windowMainElement?.querySelector('#bm-input-px')?.value ?? 0)));
    // Stores the Y coordinates for the "Upload Template" coordinate input fields. Fallback is zero. Note: This is a user-specified field
    const windowMainTemplateCoordinateY = Math.min(2047999, Math.max(0, (Number(windowMainElement?.querySelector('#bm-input-ty')?.value ?? 0) * 1000) + Number(windowMainElement?.querySelector('#bm-input-py')?.value ?? 0)));
    const windowMainState = windowMainCommonStates
      + numberToEncoded(windowMainUniqueStatesMutable).padStart(2, this.zerothEncodingAlphabetCharacter).slice(-2) // Ensures this is always two characters
      + numberToEncoded(windowMainTemplateCoordinateX).padStart(4, this.zerothEncodingAlphabetCharacter).slice(-4) // Ensures this is always four characters
      + numberToEncoded(windowMainTemplateCoordinateY).padStart(4, this.zerothEncodingAlphabetCharacter).slice(-4); // Ensures this is always four characters

    // Save the window state, or fallback to zeros
    this.#windowStatesObjectEncoded['bm'] = windowMainState ?? this.zerothEncodingAlphabetCharacter.repeat(18);
  }

  /** Decodes & builds the window state object.
   * This function parses user storage into a readable format,
   * then passes it to the {@link SettingsManager}, which is the owner of the windows state object.
   * @param {Object} windowState - The encoded state of all windows saved in user storage
   * @since 0.92.23
   */
  #decodeWindowStateToObject(windowState) {

    console.log('Recieved window state to decode: ', windowState);

    /** Decodes the common header data in each encoded value.
     * This is an arrow function so code inside the function can easily access class-level variables (using `this`).
     * @param {string} encodedString - The encoded value
     * @returns {Array<number, number>}
     * @since 0.92.23
     */
    const decodeCommonStates = (encodedString) => {

      // If the passed in encodedString is invalid...
      if ((typeof encodedString !== 'string') || (encodedString.length == 0)) {
        consoleWarn(`Could not decode common states of a window! Expected a 'string' that is ${this.commonStatesByteLength} bytes long, but recieved a '${typeof encodedString}' with value: ${encodedString}\nAssuming all common states are zeros...`);
        encodedString = this.zerothEncodingAlphabetCharacter.repeat(this.commonStatesByteLength);
      } // The data we are supposed to read is corrupt, so we can zero all bytes and continue as normal.

      // Stores the "layer" this window is at, compared to zero
      const drawDepth = encodedToNumber(encodedString.slice(0, 1));

      // The bit flags 0 to 5
      const bitFlags = encodedToNumber(encodedString.slice(1, 2));
      const isWindowInDOM = (bitFlags & (1 << 0)) !== 0; // Stores the value of the 0th bit, as a Boolean
      const isWindowMinimized = (bitFlags & (1 << 1)) !== 0; // Stores the value of the 1st bit, as a Boolean
      const hasWindowBeenMoved = (bitFlags & (1 << 2)) !== 0; // Stores the value of the 2nd bit, as a Boolean
      const xAxisSignIsNegative = (bitFlags & (1 << 3)) !== 0; // Stores the value of the 3rd bit, as a Boolean
      const yAxisSignIsNegative = (bitFlags & (1 << 4)) !== 0; // Stores the value of the 4th bit, as a Boolean
      const reservedCommonFlag = false; // Reserved

      // Shift Translations
      const xAxisShiftTrans = encodedToNumber(encodedString.slice(2, 5));
      const yAxisShiftTrans = encodedToNumber(encodedString.slice(5, 8));

      const commonStates = [drawDepth, isWindowInDOM, isWindowMinimized, hasWindowBeenMoved, xAxisSignIsNegative, yAxisSignIsNegative, reservedCommonFlag, xAxisShiftTrans, yAxisShiftTrans];
      console.log(commonStates);
      return commonStates;
    };

    const mainWindowStateDefault = '!#!!!!!!!!!!!!!!!!'; // Default state of the main window

    // Main Window
    const mainWindowEncodedState = windowState['bm'] ?? mainWindowStateDefault; // The entire encoded window state. Fallback to default
    const mainWindowEncodedCommon = mainWindowEncodedState?.slice(0, this.commonStatesByteLength); // The encoded window state for common variables
    const mainWindowEncodedFlags = mainWindowEncodedState?.slice(this.commonStatesByteLength, 10); // The encoded window state for bit flags
    const mainWindowTemplateCoordX = encodedToNumber(mainWindowEncodedState?.slice(10, 14)); // The numbers to store in the "Upload Template" input fields
    const mainWindowTemplateCoordY = encodedToNumber(mainWindowEncodedState?.slice(14, 18)); // The numbers to store in the "Upload Template" input fields
    const mainWindowState = 
      decodeCommonStates(mainWindowEncodedCommon).concat(
        numberUnsignedTo32BitBooleanArray(encodedToNumber(mainWindowEncodedFlags) >>> 0).slice(-13), // If we don't clamp to the last 13 flags, we will return 19 additional flags that don't exist
        mainWindowTemplateCoordX, mainWindowTemplateCoordY
      );
    // mainWindowState is an Array where each index is variable. The order is preserved.

    console.log(mainWindowState);

    return {
      'bm': mainWindowState
    };
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

  /** Returns the decoded window states
   * @since 0.92.69
   * @returns {Object} An object containing window states
   */
  getWindowStatesObject() {
    console.log('#windowStatesObject: ', this.#windowStatesObject);
    return this.#windowStatesObject;
  }

  /** Returns the corresponding variable's value from the window state.
   * This was specifically so an enum value could be passed in as the `index`.
   * @param {string} tinyID - The ID for the window that is ONLY used inside user storage
   * @param {number} index - The Array index that contains the value
   * @since 0.92.77
   * @returns {number | boolean}
   */
  getWindowStateVariable(tinyID, index) {

    // If the passed in arguments are invalid
    if ((typeof tinyID !== 'string') || (typeof index !== 'number')) {
      consoleError(`Attempted to get window state variable with type (string, number), but recieved type (${typeof tinyID}, ${typeof index}) instead! Value: (${tinyID}, ${index})\nReturning zero...`);
      return 0;
    }

    const windowState = this.#windowStatesObject?.[tinyID];

    // If the passed in arguments are valid types, but an invalid Array index
    if (!Number.isInteger(index) || (index < 0) || (index > windowState.length - 1)) {
      consoleError(`Attempted to retrieve index ${index} in '${tinyID}' window state, but the index is out-of-bounds! Valid: 0 - ${windowState.length - 1}\n Returning zero...`);
      return 0;
    }

    return windowState[index]; // Returns the value
  }

  /** Populates the windowMain variable with the windowMain class.
   * @param {WindowMain} windowMain - The windowMain class instance
   * @since 0.92.23
   */
  setWindowMain(windowMain) {this.windowMain = windowMain;}

  /** Populates the templateManager variable with the templateManager class.
   * @param {TemplateManager} templateManager - The templateManager class instance
   * @since 0.92.22
   */
  setTemplateManager(templateManager) {this.templateManager = templateManager;}

  /** Populates the apiManager variable with the apiManager class.
   * @param {ApiManager} apiManager - The apiManager class instance
   * @since 0.92.23
   */
  setApiManager(apiManager) {this.apiManager = apiManager;}
}