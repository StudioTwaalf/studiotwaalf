/**
 * Studio Twaalf — Illustrator export script
 * Exports the active document to TemplateDesign JSON (schema v1).
 *
 * Installation:
 *   File > Scripts > Browse… → select this file
 *   Or place in: Adobe Illustrator/Presets/<locale>/Scripts/
 *
 * Output: one .json file per run, saved via save dialog.
 *         Paste the contents into the "Default design JSON" field in the admin.
 *
 * Compatibility: Illustrator CS5+ / CC (ExtendScript / ES3).
 *
 * ─── Coordinate conversion ────────────────────────────────────────────────────
 *   Illustrator scripting uses POINTS (pt) for all measurements.
 *   1 pt = 0.352778 mm
 *
 *   Illustrator coordinate system: Y-axis points UP.
 *     artboardRect = [left, top, right, bottom]  (top > bottom)
 *
 *   TemplateDesign coordinate system: origin at top-left of artboard, Y-axis DOWN.
 *     x = (item.left  − artboard.left) × PT_TO_MM
 *     y = (artboard.top − item.top)    × PT_TO_MM   ← Y-flip
 *
 * ─── Layer conventions (enforced by designer guidelines) ─────────────────────
 *   Layers named "tekst_editable" or "text_editable"  → editable: true
 *   All other text layers                             → editable: false
 *   Background shapes are exported as regular shape elements.
 *   Use layer name "achtergrond" or "background" for background shapes.
 */

// @target illustrator

// ─── Constants ────────────────────────────────────────────────────────────────

var SCHEMA_VERSION = 1;
var PT_TO_MM = 0.352778;  // 1 point in millimetres

// ─── Utility functions ────────────────────────────────────────────────────────

function ptToMm(pt) {
  return Math.round(pt * PT_TO_MM * 1000) / 1000;
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function rgbToHex(r, g, b) {
  function h(n) {
    var s = Math.round(clamp(n, 0, 255)).toString(16);
    return s.length === 1 ? '0' + s : s;
  }
  return '#' + h(r) + h(g) + h(b);
}

/**
 * Convert an Illustrator Color object to a CSS hex string.
 * Returns null when the colour is None, a pattern, or unreadable.
 */
function colorToHex(color) {
  if (!color) return null;
  try {
    var t = color.typename;
    if (!t) return null;
    if (t === 'NoColor')       return null;   // transparent / none
    if (t === 'RGBColor') {
      return rgbToHex(color.red, color.green, color.blue);
    }
    if (t === 'CMYKColor') {
      // Approximate CMYK → RGB
      var k  = color.black  / 100;
      var r  = 255 * (1 - color.cyan    / 100) * (1 - k);
      var g2 = 255 * (1 - color.magenta / 100) * (1 - k);
      var b2 = 255 * (1 - color.yellow  / 100) * (1 - k);
      return rgbToHex(r, g2, b2);
    }
    if (t === 'GrayColor') {
      var v = Math.round(255 * (1 - color.gray / 100));
      return rgbToHex(v, v, v);
    }
    if (t === 'SpotColor') {
      return colorToHex(color.spot.color);
    }
  } catch (e) { /* unreadable color type — return null */ }
  return null;
}

/**
 * Read the fill colour of a text frame's first character.
 * Tries three fallback paths to handle mixed-format text frames and
 * Illustrator versions where characterAttributes.fillColor throws.
 */
function textFrameColor(tf) {
  // Path 1 — first character (most reliable for mixed-colour text)
  try {
    var c = colorToHex(tf.characters[0].characterAttributes.fillColor);
    if (c) return c;
  } catch (e) {}
  // Path 2 — whole textRange attributes
  try {
    var c2 = colorToHex(tf.textRange.characterAttributes.fillColor);
    if (c2) return c2;
  } catch (e) {}
  // Path 3 — appearance (CS5+)
  try {
    var fills = tf.fillColor;
    var c3 = colorToHex(fills);
    if (c3) return c3;
  } catch (e) {}
  return null;
}

/**
 * Convert an Illustrator Justification constant to a CSS textAlign string.
 */
function justToAlign(just) {
  if (!just) return 'left';
  var s = just.toString();
  if (s.indexOf('CENTER') !== -1) return 'center';
  if (s.indexOf('RIGHT')  !== -1) return 'right';
  if (s.indexOf('FULLY')  !== -1) return 'justify';
  return 'left';
}

/**
 * Return the index of the artboard that best contains the center of itemBounds.
 * itemBounds: [left, top, right, bottom] in document pt (Y-up).
 */
function getArtboardIndex(doc, itemBounds) {
  var cx = (itemBounds[0] + itemBounds[2]) / 2;
  var cy = (itemBounds[1] + itemBounds[3]) / 2;
  for (var i = 0; i < doc.artboards.length; i++) {
    var r = doc.artboards[i].artboardRect;
    // r[0]=left, r[1]=top, r[2]=right, r[3]=bottom; top > bottom in Y-up
    if (cx >= r[0] && cx <= r[2] && cy <= r[1] && cy >= r[3]) {
      return i;
    }
  }
  return 0;  // fallback: assign to first artboard
}

/**
 * Convert item bounds to mm relative to a given artboard.
 * Returns { x, y, width, height } in mm.
 * x/y = top-left corner of the item in TemplateDesign coordinate space.
 */
function boundsToMm(itemBounds, artboardRect) {
  var iL = itemBounds[0], iT = itemBounds[1],
      iR = itemBounds[2], iB = itemBounds[3];
  var aL = artboardRect[0], aT = artboardRect[1];
  return {
    x:      ptToMm(iL - aL),       // left of item relative to artboard left
    y:      ptToMm(aT - iT),       // top of item relative to artboard top (Y-flip)
    width:  ptToMm(iR - iL),
    height: ptToMm(iT - iB),       // iT > iB because Y-up
  };
}

/**
 * Returns true if the layer or item name suggests an editable text layer.
 * Designers should name text layers "tekst_editable" or "text_editable".
 */
function isEditableLayer(name) {
  if (!name) return false;
  var n = name.toLowerCase();
  return n.indexOf('editable') !== -1 || n.indexOf('bewerkbaar') !== -1;
}

// ─── JSON serialiser for ExtendScript (no JSON.stringify in ES3) ──────────────

/**
 * Minimal JSON serialiser.
 * Handles: null, boolean, number, string, Array, plain Object.
 * undefined values in objects are omitted.
 */
function toJson(val, indent, depth) {
  if (indent === undefined) indent = '    ';
  if (depth  === undefined) depth  = 0;

  var pad      = '';
  var childPad = indent;
  for (var i = 0; i < depth; i++) {
    pad      += indent;
    childPad += indent;
  }

  if (val === null || val === undefined) return 'null';

  var t = typeof val;

  if (t === 'boolean') return val ? 'true' : 'false';

  if (t === 'number') {
    if (isNaN(val) || !isFinite(val)) return 'null';
    // Round to at most 6 decimal places to avoid floating-point noise
    return String(Math.round(val * 1000000) / 1000000);
  }

  if (t === 'string') {
    // Escape special characters
    var out = val
      .replace(/\\/g, '\\\\')
      .replace(/"/g,  '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    // Replace remaining control characters
    out = out.replace(/[\x00-\x1f]/g, function (c) {
      return '\\u00' + ('0' + c.charCodeAt(0).toString(16)).slice(-2);
    });
    return '"' + out + '"';
  }

  // Array
  if (val instanceof Array) {
    if (val.length === 0) return '[]';
    var aItems = [];
    for (var ai = 0; ai < val.length; ai++) {
      aItems.push(childPad + toJson(val[ai], indent, depth + 1));
    }
    return '[\n' + aItems.join(',\n') + '\n' + pad + ']';
  }

  // Object
  if (t === 'object') {
    var keys = [];
    for (var k in val) {
      if (val.hasOwnProperty(k) && val[k] !== undefined) {
        keys.push(k);
      }
    }
    if (keys.length === 0) return '{}';
    var oItems = [];
    for (var ki = 0; ki < keys.length; ki++) {
      var key = keys[ki];
      oItems.push(childPad + toJson(key) + ': ' + toJson(val[key], indent, depth + 1));
    }
    return '{\n' + oItems.join(',\n') + '\n' + pad + '}';
  }

  return 'null';
}

// ─── Main export ──────────────────────────────────────────────────────────────

function exportTemplate() {

  // ── Guard: need an open document ──────────────────────────────────────────
  var doc;
  try { doc = app.activeDocument; }
  catch (e) { alert('Geen document open.'); return; }

  var artboards = [];
  var elements  = [];
  var idCounter = 0;

  function nextId(prefix) {
    return prefix + '_' + (++idCounter);
  }

  // ── 1. Artboards ──────────────────────────────────────────────────────────
  for (var ai = 0; ai < doc.artboards.length; ai++) {
    var ab   = doc.artboards[ai];
    var rect = ab.artboardRect;  // [left, top, right, bottom]
    var abW  = rect[2] - rect[0];
    var abH  = rect[1] - rect[3];  // top > bottom

    artboards.push({
      id:     'artboard_' + ai,
      name:   ab.name || ('Artboard ' + (ai + 1)),
      width:  ptToMm(abW),
      height: ptToMm(abH),
      unit:   'mm',
    });
    // backgroundColor is not directly accessible via scripting;
    // it must be set manually in the JSON if the background is a solid fill layer.
  }

  // ── 2. PathItems (shapes) ─────────────────────────────────────────────────
  // Shapes are collected before text so they appear first in the elements array.
  // CSS renders later DOM siblings on top, so shapes end up behind text in the preview.
  for (var pi = 0; pi < doc.pathItems.length; pi++) {
    var path   = doc.pathItems[pi];
    var pBnds  = path.geometricBounds;
    var pAbi   = getArtboardIndex(doc, pBnds);
    var pPos   = boundsToMm(pBnds, doc.artboards[pAbi].artboardRect);

    var shapeStyle = {};
    try {
      if (path.filled) {
        var fc = path.fillColor;
        shapeStyle.fill = colorToHex(fc) || 'none';
        // Preserve CMYK values for print-accurate colour editing.
        // fillCmyk: [C, M, Y, K] each 0–100, matching the TemplateEditor CMYK inputs.
        try {
          if (fc && fc.typename === 'CMYKColor') {
            shapeStyle.fillCmyk = [
              Math.round(fc.cyan),
              Math.round(fc.magenta),
              Math.round(fc.yellow),
              Math.round(fc.black),
            ];
          }
        } catch (e2) {}
      } else {
        shapeStyle.fill = 'none';
      }
    } catch (e) { shapeStyle.fill = 'none'; }

    try {
      if (path.stroked) {
        shapeStyle.stroke      = colorToHex(path.strokeColor) || 'none';
        shapeStyle.strokeWidth = ptToMm(path.strokeWidth || 0);
      }
    } catch (e) {}

    try {
      var op = path.opacity;
      if (typeof op === 'number' && op !== 100) {
        shapeStyle.opacity = Math.round(op) / 100;
      }
    } catch (e) {}

    var pLayerName = '';
    try { pLayerName = path.layer.name; } catch (e) {}

    var pName = '';
    try { pName = path.name || ''; } catch (e) {}

    elements.push({
      id:         pName !== '' ? pName : nextId('shape'),
      type:       'shape',
      artboardId: 'artboard_' + pAbi,
      name:       pName || pLayerName || '',
      editable:   false,
      shapeType:  'rect',   // bounding-box approximation; full path data not included
      x:          pPos.x,
      y:          pPos.y,
      width:      pPos.width,
      height:     pPos.height,
      style:      shapeStyle,
    });
  }

  // ── 4. PlacedItems (embedded / linked images) ──────────────────────────────
  for (var ii = 0; ii < doc.placedItems.length; ii++) {
    var placed  = doc.placedItems[ii];
    var iBnds   = placed.geometricBounds;
    var iAbi    = getArtboardIndex(doc, iBnds);
    var iPos    = boundsToMm(iBnds, doc.artboards[iAbi].artboardRect);

    var iName = '';
    try { iName = placed.name || ''; } catch (e) {}
    var iLayerName = '';
    try { iLayerName = placed.layer.name; } catch (e) {}

    // Local paths are not usable in a browser.
    // Leave src empty — replace with a /public URL after uploading the image asset.
    elements.push({
      id:         iName !== '' ? iName : nextId('image'),
      type:       'image',
      artboardId: 'artboard_' + iAbi,
      name:       iName || iLayerName || '',
      editable:   false,
      src:        '',  // ← replace with web-accessible URL after asset upload
      x:          iPos.x,
      y:          iPos.y,
      width:      iPos.width,
      height:     iPos.height,
    });
  }

  // ── 3. TextFrames (text) ──────────────────────────────────────────────────
  // Text is collected last so it appears at the end of the elements array,
  // ensuring text renders on top of shapes and images in the browser preview.
  for (var ti = 0; ti < doc.textFrames.length; ti++) {
    var tf     = doc.textFrames[ti];
    var tBnds  = tf.geometricBounds;  // [left, top, right, bottom]
    var tAbi   = getArtboardIndex(doc, tBnds);
    var tPos   = boundsToMm(tBnds, doc.artboards[tAbi].artboardRect);

    // ── Text style ──────────────────────────────────────────────────────────
    var style = {
      fontFamily:    'Arial',
      fontSize:      ptToMm(12),
      fontWeight:    400,
      fontStyle:     'normal',
      color:         '#000000',
      textAlign:     'left',
    };

    // Use first character attributes as primary source — more reliable than
    // textRange.characterAttributes when the frame has mixed formatting.
    var ca    = null;
    var caFb  = null;  // fallback: whole textRange attributes
    try { ca   = tf.characters[0].characterAttributes; }  catch (e) {}
    try { caFb = tf.textRange.characterAttributes;     }  catch (e) {}

    try {
      var src = ca || caFb;  // prefer per-character, fall back to range

      // Font family
      try {
        var ff = (src && src.textFont && src.textFont.family) ||
                 (caFb && caFb.textFont && caFb.textFont.family) || 'Arial';
        style.fontFamily = ff;
      } catch (e) {}

      // Font size (pt → mm)
      try {
        var fsz = (src && typeof src.size === 'number' && src.size > 0) ? src.size
                : (caFb && typeof caFb.size === 'number' && caFb.size > 0) ? caFb.size
                : 12;
        style.fontSize = ptToMm(fsz);
      } catch (e) {}

      // Font weight / italic from typeface style string
      try {
        var fStyle = ((src && src.textFont && src.textFont.style) ||
                      (caFb && caFb.textFont && caFb.textFont.style) || '').toLowerCase();
        style.fontWeight = (fStyle.indexOf('bold')    !== -1) ? 700 : 400;
        style.fontStyle  = (fStyle.indexOf('italic')  !== -1 ||
                            fStyle.indexOf('oblique') !== -1) ? 'italic' : 'normal';
      } catch (e) {}

      // Fill colour — use multi-path helper
      var fc = textFrameColor(tf);
      if (fc) style.color = fc;

      // Tracking → letterSpacing (Illustrator tracking is in 1/1000 em units)
      try {
        var trk = (src && typeof src.tracking === 'number') ? src.tracking
                : (caFb && typeof caFb.tracking === 'number') ? caFb.tracking : 0;
        if (trk !== 0) {
          style.letterSpacing = Math.round(trk / 1000 * 10000) / 10000;
        }
      } catch (e) {}

      // Leading → lineHeight
      try {
        var autoL = (src && src.autoLeading) || (caFb && caFb.autoLeading);
        var leadV = (src && typeof src.leading === 'number') ? src.leading
                  : (caFb && typeof caFb.leading === 'number') ? caFb.leading : 0;
        var sizeV = (src && typeof src.size === 'number') ? src.size
                  : (caFb && typeof caFb.size === 'number') ? caFb.size : 12;
        if (autoL) {
          style.lineHeight = 1.2;
        } else if (leadV > 0 && sizeV > 0) {
          style.lineHeight = Math.round(leadV / sizeV * 1000) / 1000;
        }
      } catch (e) {}

      // Paragraph alignment
      try {
        var pa = tf.textRange.paragraphAttributes;
        style.textAlign = justToAlign(pa.justification);
      } catch (e) {}

    } catch (e) { /* use defaults */ }

    // ── Editable flag from layer name ────────────────────────────────────────
    var tfLayerName = '';
    try { tfLayerName = tf.layer.name; } catch (e) {}
    var tfEditable = isEditableLayer(tfLayerName);

    // ── Build element ────────────────────────────────────────────────────────
    var textEl = {
      id:         tf.name && tf.name !== '' ? tf.name : nextId('text'),
      type:       'text',
      artboardId: 'artboard_' + tAbi,
      name:       tf.name || '',
      editable:   tfEditable,
      content:    tf.contents || '',
      x:          tPos.x,
      y:          tPos.y,
      width:      tPos.width,
      height:     tPos.height,
      style:      style,
    };

    elements.push(textEl);
  }

  // ── 4. Build output ────────────────────────────────────────────────────────
  var docName = '';
  try { docName = doc.name.replace(/\.[^.]+$/, ''); } catch (e) {}

  var output = {
    version:   SCHEMA_VERSION,
    name:      docName,
    artboards: artboards,
    elements:  elements,
  };

  // ── 5. Save ────────────────────────────────────────────────────────────────
  var file = File.saveDialog('Sla TemplateDesign JSON op', '*.json');
  if (!file) return;  // user cancelled

  try {
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(toJson(output));
    file.close();
    alert('Geëxporteerd naar:\n' + file.fsName);
  } catch (e) {
    alert('Export mislukt:\n' + e.message);
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────
exportTemplate();
