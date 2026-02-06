/**
 * Single source of truth for checkout UI (customer display) screen styling.
 * Used by Settings editor and CustomerDisplayPopup so saved values apply everywhere.
 */

export const CHECKOUT_UI_SCREEN_KEYS = ['review_order', 'cash_confirmation', 'tip_selection', 'card', 'receipt']

/** Default values for one screen (one object per screen, merged with API data). */
export function getCheckoutUiScreenDefaults() {
  return {
    backgroundColor: '#e8f0fe',
    buttonColor: '#4a90e2',
    textColor: '#1a1a1a',
    button_style: 'default',
    title_font: 'system-ui',
    title_font_size: 36,
    title_bold: false,
    title_italic: false,
    title_align: 'center',
    body_font: 'system-ui',
    body_font_size: 24,
    body_bold: false,
    body_italic: false,
    body_align: 'left',
    button_font: 'system-ui',
    button_font_size: 36,
    button_bold: true,
    button_italic: false,
    signature_background: '#ffffff',
    signature_border_width: 2,
    signature_border_color: 'rgba(0,0,0,0.2)',
    signature_ink_color: '#000000',
    receipt_options_offered: { print: true, email: true, no_receipt: true }
  }
}

/** Full default checkout_ui object for all screens. */
export function getDefaultCheckoutUi() {
  const base = getCheckoutUiScreenDefaults()
  return {
    review_order: { ...base },
    cash_confirmation: { ...base, title_font_size: 40 },
    tip_selection: { ...base },
    receipt: { ...base },
    card: { ...base, instruction_text: 'Please insert or tap your card', body_font_size: 20 }
  }
}

/**
 * Merge API checkout_ui with defaults so every screen has all keys.
 * Use in Settings (load + after save) and in CustomerDisplayPopup (after fetch).
 * @param {object|null|undefined} apiCheckoutUi - Raw checkout_ui from API
 * @returns {object} Full checkout_ui with defaults filled in
 */
export function mergeCheckoutUiFromApi(apiCheckoutUi) {
  const defaults = getDefaultCheckoutUi()
  if (!apiCheckoutUi || typeof apiCheckoutUi !== 'object') {
    return { ...defaults }
  }
  return {
    review_order: { ...defaults.review_order, ...(apiCheckoutUi.review_order || {}) },
    cash_confirmation: { ...defaults.cash_confirmation, ...(apiCheckoutUi.cash_confirmation || {}) },
    tip_selection: { ...defaults.tip_selection, ...(apiCheckoutUi.tip_selection || {}) },
    card: { ...defaults.card, ...(apiCheckoutUi.card || {}) },
    receipt: { ...defaults.receipt, ...(apiCheckoutUi.receipt || {}) }
  }
}
