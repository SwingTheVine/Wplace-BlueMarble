/** Styling for the console log.
 * This only affects the console in the dev's IDE and GitHub Workflow.
 * @since 0.58.24
 */
export const consoleStyle = {

  // CONTROL CHARACTERS
  /** Resets all styling */
  RESET: '\x1b[0m',
  /** Makes the text **bold** */
  BOLD: '\x1b[1m',
  /** Makes the text underlined */
  UNDERLINE: '\x1b[4m',
  /** Inverses the color of the text and the background */
  INVERSE: '\x1b[7m',

  // COLOR CHARACTERS
  /** Turns the text white */
  WHITE: '\x1b[37m',
  /** Turns the text black */
  BLACK: '\x1b[30m',
  /** Turns the text red */
  RED: '\x1b[31m',
  /** Turns the text green */
  GREEN: '\x1b[32m',
  /** Turns the text yellow */
  YELLOW: '\x1b[33m',
  /** Turns the text blue */
  BLUE: '\x1b[34m',
  /** Turns the text magenta */
  MAGENTA: '\x1b[35m',
  /** Turns the text cyan */
  CYAN: '\x1b[36m'
}
