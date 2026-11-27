import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import { middleEllipsis } from '../../utils/middleEllipsis';

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

const measureFactory = (font) => (str) => {
  const key = `${font}\u0000${str}`;
  const cached = widthCache.get(key);

  if (typeof cached !== 'undefined') {
    return cached;
  }

  const ctx = getCanvasContext();

  ctx.font = font;
  const { width } = ctx.measureText(str);

  setBounded(widthCache, key, width);

  return width;
};

const truncate = ({ text, width, font, fontSize, lines }) => {
  const key = `${font}\u0000${width}\u0000${lines}\u0000${text}`;
  const cached = resultCache.get(key);

  if (cached) {
    return cached;
  }

  // With `word-break: break-all` every line but the last can lose up to one
  // character width; keep one font size of slack per line to stay safe.
  const budget =
    lines > 1 ? Math.max(0, lines * (width - fontSize)) : Math.max(0, width);
  const result = middleEllipsis(text, budget, measureFactory(font));

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
  const ref = useRef(null);
  const [box, setBox] = useState(null);

  useLayoutEffect(() => {
    const el = ref.current;

    if (!el) {
      return undefined;
    }

    return observeWidth(el, (rawWidth) => {
      const width = Math.floor(rawWidth);

      setBox((prev) => {
        if (prev && prev.width === width) {
          return prev;
        }

        const fontInfo = prev?.font
          ? { font: prev.font, fontSize: prev.fontSize }
          : readFont(el);

        return { ...fontInfo, width };
      });
    });
  }, []);

  const result = useMemo(() => {
    if (!box || box.width <= 0) {
      return { text, truncatedText: text, isTruncated: false };
    }

    return truncate({
      text,
      width: box.width,
      font: box.font,
      fontSize: box.fontSize,
      lines,
    });
  }, [text, box, lines]);

  return (
    <Tooltip
      title={result.isTruncated ? text : ''}
      placement={tooltipPlacement}
    >
      <span ref={ref} className={className}>
        {result.truncatedText}
      </span>
    </Tooltip>
  );
}

export default React.memo(MiddleEllipsis);
