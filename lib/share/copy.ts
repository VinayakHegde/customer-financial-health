/**
 * Copy strings owned by the share recipient surfaces. Kept in their own module
 * so T76's tone + advice-implying-token scan can target the source string and
 * `<ShareUnavailable />` can render without re-deriving copy from outcome
 * state (the page carries no outcome).
 */

export const shareUnavailableHeading = "This share link is no longer available";
export const shareUnavailableBody =
  "Please ask the person who shared it to send a new one.";

/**
 * Concatenated form used by the T76 tone-token scan. Renderers compose the
 * heading + body separately for accessibility (heading is its own landmark).
 */
export const shareUnavailableCopySample = `${shareUnavailableHeading}. ${shareUnavailableBody}`;

export const shareWordmark = "Customer Financial Health";
