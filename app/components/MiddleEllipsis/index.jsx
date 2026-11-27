import React, { useLayoutEffect, useMemo, useState } from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import { middleEllipsis, splitGraphemes } from '../../utils/middleEllipsis';

/**
 * Renders a text truncated in the middle (Finder style) according to the
 * real width of its container. Shows the full text in a tooltip only when it
 * was truncated.
 *
 * The element must get its width from its parent (eg: `display: block`, or
 * `flex: 1 1 0; min-width: 0` inside a flex row), not from its content.
 *
 * Performance notes (folders may contain thousands of entries):
 * - a single shared ResizeObserver is used for every instance;
 * - text widths are measured with a shared canvas and cached per font;
 * - truncation results are cached per (font, width, lines, text).
 *
 * Canvas `measureText` ignores CSS `letter-spacing`, so it is added by hand.
 * Widths measured before a web font (eg: Roboto) has loaded are measured
 * with a fallback font: every cache is cleared and every instance re-reads
 * its font once the document fonts finish loading.
 */

const MAX_CACHE_ENTRIES = 20000;

let canvasContext = null;
const widthCache = new Map();
const resultCache = new Map();

const setBounded = (map, key, value) => {
  if (map.size >= MAX_CACHE_ENTRIES) {
    map.clear();
  }

  map.set(key, value);
};

const getCanvasContext = () => {
  if (!canvasContext) {
    canvasContext = document.createElement('canvas').getContext('2d');
  }

  return canvasContext;
};

const measureFactory = (font, letterSpacing) => (str) => {
  const key = `${font}\u0000${letterSpacing}\u0000${str}`;
  const cached = widthCache.get(key);

  if (typeof cached !== 'undefined') {
    return cached;
  }

  const ctx = getCanvasContext();

  ctx.font = font;
  // CSS applies `letter-spacing` after every character, canvas does not
  const width =
    ctx.measureText(str).width +
    (letterSpacing ? letterSpacing * splitGraphemes(str).length : 0);

  setBounded(widthCache, key, width);

  return width;
};

const truncate = ({ text, width, font, fontSize, letterSpacing, lines }) => {
  const key = `${font}\u0000${letterSpacing}\u0000${width}\u0000${lines}\u0000${text}`;
  const cached = resultCache.get(key);

  if (cached) {
    return cached;
  }

  // With `word-break: break-all` every line but the last can lose up to one
  // character width; keep one font size of slack per line to stay safe.
  const budget =
    lines > 1 ? Math.max(0, lines * (width - fontSize)) : Math.max(0, width);
  const result = middleEllipsis(
    text,
    budget,
    measureFactory(font, letterSpacing)
  );

  setBounded(resultCache, key, result);

  return result;
};

const readFont = (el) => {
  const style = window.getComputedStyle(el);
  const font =
    style.font ||
    `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

  return {
    font,
    fontSize: parseFloat(style.fontSize) || 0,
    // `normal` parses to NaN, ie: no extra spacing
    letterSpacing: parseFloat(style.letterSpacing) || 0,
  };
};

// ---- web font loading ----
const fontChangeListeners = new Set();
let fontsWatched = false;

const onFontsLoaded = () => {
  widthCache.clear();
  resultCache.clear();
  fontChangeListeners.forEach((listener) => listener());
};

const watchFonts = () => {
  const { fonts } = document;

  if (fontsWatched || !fonts) {
    return;
  }

  fontsWatched = true;

  if (typeof fonts.addEventListener === 'function') {
    fonts.addEventListener('loadingdone', onFontsLoaded);
  }

  if (fonts.ready && typeof fonts.ready.then === 'function') {
    fonts.ready.then(onFontsLoaded).catch(() => {});
  }
};

const onFontChange = (listener) => {
  watchFonts();
  fontChangeListeners.add(listener);

  return () => {
    fontChangeListeners.delete(listener);
  };
};

// ---- shared ResizeObserver ----
let resizeObserver = null;
const observedCallbacks = new WeakMap();

const getResizeObserver = () => {
  if (!resizeObserver && typeof window.ResizeObserver === 'function') {
    resizeObserver = new window.ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const callback = observedCallbacks.get(entry.target);

        if (callback) {
          callback(entry.contentRect.width);
        }
      });
    });
  }

  return resizeObserver;
};

const observeWidth = (el, callback) => {
  const observer = getResizeObserver();

  if (!observer) {
    callback(el.clientWidth);

    return () => {};
  }

  observedCallbacks.set(el, callback);
  observer.observe(el);

  return () => {
    observer.unobserve(el);
    observedCallbacks.delete(el);
  };
};

function MiddleEllipsis({ text, lines = 1, className, tooltipPlacement }) {
  // callback ref: the span is remounted when the Tooltip wrapper comes and
  // goes, and the observers must follow the new element
  const [el, setEl] = useState(null);
  const [box, setBox] = useState(null);

  useLayoutEffect(() => {
    if (!el) {
      return undefined;
    }

    const unobserveWidth = observeWidth(el, (rawWidth) => {
      const width = Math.floor(rawWidth);

      setBox((prev) => {
        if (prev && prev.width === width) {
          return prev;
        }

        const fontInfo = prev?.font
          ? {
              font: prev.font,
              fontSize: prev.fontSize,
              letterSpacing: prev.letterSpacing,
            }
          : readFont(el);

        return { ...fontInfo, width };
      });
    });

    // the caches were cleared: re-read the font and truncate again
    const unwatchFonts = onFontChange(() => {
      setBox((prev) => (prev ? { ...readFont(el), width: prev.width } : prev));
    });

    return () => {
      unobserveWidth();
      unwatchFonts();
    };
  }, [el]);

  const result = useMemo(() => {
    if (!box || box.width <= 0) {
      return { text, truncatedText: text, isTruncated: false };
    }

    return truncate({
      text,
      width: box.width,
      font: box.font,
      fontSize: box.fontSize,
      letterSpacing: box.letterSpacing,
      lines,
    });
  }, [text, box, lines]);

  const content = (
    <span ref={setEl} className={className}>
      {result.truncatedText}
    </span>
  );

  // no Tooltip for names shown in full: folders may list thousands of rows
  if (!result.isTruncated) {
    return content;
  }

  return (
    <Tooltip title={text} placement={tooltipPlacement}>
      {content}
    </Tooltip>
  );
}

export default React.memo(MiddleEllipsis);
