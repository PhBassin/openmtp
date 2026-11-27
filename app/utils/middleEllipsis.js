/**
 * Finder-style middle truncation.
 *
 * Pure helpers: no DOM access here. The caller provides a `measure` function
 * returning the rendered width (in px) of a string, which keeps this module
 * testable and independent from the canvas/DOM measuring strategy.
 */

export const MIDDLE_ELLIPSIS = '…';

// Extensions longer than this are not treated as extensions (eg: "a.verylongsuffixname")
const MAX_EXTENSION_LENGTH = 10;

let graphemeSegmenter = null;

/**
 * Split a string into user-perceived characters (grapheme clusters) so that
 * truncation never cuts a surrogate pair, an emoji sequence or a decomposed
 * accent (macOS file names are often NFD normalized).
 *
 * @param {string} str
 * @returns {string[]}
 */
export const splitGraphemes = (str) => {
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    if (!graphemeSegmenter) {
      graphemeSegmenter = new Intl.Segmenter(undefined, {
        granularity: 'grapheme',
      });
    }

    return Array.from(graphemeSegmenter.segment(str), (s) => s.segment);
  }

  return Array.from(str);
};

/**
 * Number of trailing graphemes forming the extension, dot included
 * ("photo.jpeg" -> 5). Returns 0 when there is no usable extension
 * (no dot, leading dot only like ".bashrc", or a very long suffix).
 *
 * @param {string[]} graphemes
 * @returns {number}
 */
export const extensionLength = (graphemes) => {
  const dotIndex = graphemes.lastIndexOf('.');

  if (dotIndex <= 0) {
    return 0;
  }

  const length = graphemes.length - dotIndex;

  if (length < 2 || length > MAX_EXTENSION_LENGTH + 1) {
    return 0;
  }

  return length;
};

/**
 * For a total number of kept graphemes `keep`, how many go to the tail.
 * Both head and tail lengths never decrease when `keep` grows, which keeps
 * the rendered width monotonic and allows a binary search.
 *
 * @param {number} keep
 * @param {number} extLength
 * @returns {number}
 */
const tailLengthFor = (keep, extLength) => {
  return Math.max(Math.floor(keep / 2), Math.min(keep, extLength));
};

const build = (graphemes, keep, extLength, ellipsis) => {
  const tail = tailLengthFor(keep, extLength);
  const head = keep - tail;

  return `${graphemes.slice(0, head).join('')}${ellipsis}${graphemes
    .slice(graphemes.length - tail)
    .join('')}`;
};

/**
 * Truncate `text` in the middle so that its measured width fits `maxWidth`.
 * The beginning and the end (including the file extension when possible)
 * are preserved.
 *
 * @param {string} text
 * @param {number|null|undefined} maxWidth - available width; a non finite or
 *   missing value means "unknown yet" and returns the text untouched.
 * @param {(str: string) => number} measure - returns the width of a string.
 * @param {string} [ellipsis]
 * @returns {{ text: string, truncatedText: string, isTruncated: boolean }}
 */
export const middleEllipsis = (
  text,
  maxWidth,
  measure,
  ellipsis = MIDDLE_ELLIPSIS
) => {
  const _text = typeof text === 'string' ? text : `${text ?? ''}`;
  const untouched = {
    text: _text,
    truncatedText: _text,
    isTruncated: false,
  };

  if (
    _text === '' ||
    typeof maxWidth !== 'number' ||
    !Number.isFinite(maxWidth) ||
    measure(_text) <= maxWidth
  ) {
    return untouched;
  }

  const graphemes = splitGraphemes(_text);
  const extLength = extensionLength(graphemes);

  // binary search for the largest number of kept graphemes which fits
  let low = 0;
  let high = graphemes.length - 1;

  while (low < high) {
    const mid = Math.ceil((low + high) / 2);

    if (measure(build(graphemes, mid, extLength, ellipsis)) <= maxWidth) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return {
    text: _text,
    truncatedText: build(graphemes, low, extLength, ellipsis),
    isTruncated: true,
  };
};
