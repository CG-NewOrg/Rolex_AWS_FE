sap.ui.define([
  "sap/m/MessageToast"
], function (MessageToast) {
  "use strict";

  function getJsPDF() {
    return (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : null;
  }

  var __jspdfLoadPromise = null;
  function ensureJsPDFLoaded() {
    if (getJsPDF()) {
      return Promise.resolve();
    }
    if (__jspdfLoadPromise) {
      return __jspdfLoadPromise;
    }

    // Build candidate URLs (correct app namespace is "aicockpitfeq", with trailing q).
    var candidates = [];
    try {
      var u1 = sap.ui.require.toUrl("aicockpitfeq/lib/jspdf.umd.min.js");
      if (u1) { candidates.push(u1); }
    } catch (e) { /* ignore */ }
    try {
      var base = sap.ui.require.toUrl("aicockpitfeq");
      if (base) { candidates.push(base.replace(/\/$/, "") + "/lib/jspdf.umd.min.js"); }
    } catch (e) { /* ignore */ }
    // Last-resort relative fallback (works when running standalone via webapp/index.html).
    candidates.push("lib/jspdf.umd.min.js");

    // De-duplicate while preserving order
    var seen = {};
    candidates = candidates.filter(function (u) {
      if (!u || seen[u]) return false;
      seen[u] = true;
      return true;
    });

    __jspdfLoadPromise = new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-jspdf="loader"]');
      if (existing) {
        existing.addEventListener("load", function () {
          if (getJsPDF()) { resolve(); }
          else { reject(new Error("jsPDF loader existing tag loaded but window.jspdf.jsPDF not found")); }
        }, { once: true });
        existing.addEventListener("error", function () { reject(new Error("jsPDF loader existing tag failed")); }, { once: true });
        return;
      }

      var idx = 0;
      // Temporarily suppress AMD so the jsPDF UMD bundle takes the browser-global
      // branch and assigns to window.jspdf. SAPUI5 defines a global `define` with
      // `define.amd` truthy, which would otherwise cause jsPDF to register as an
      // anonymous AMD module that we cannot retrieve by name.
      var savedDefine = window.define;
      try { window.define = undefined; } catch (e) { /* ignore */ }

      function restoreDefine() {
        try { window.define = savedDefine; } catch (e) { /* ignore */ }
      }

      function tryNext() {
        if (idx >= candidates.length) {
          restoreDefine();
          reject(new Error("Failed to load jsPDF from all candidate URLs: " + candidates.join(", ")));
          return;
        }
        var url = candidates[idx++];
        var s = document.createElement("script");
        s.setAttribute("data-jspdf", "loader");
        s.async = true;
        s.src = url;
        s.onload = function () {
          restoreDefine();
          if (getJsPDF()) {
            resolve();
          } else {
            // Script loaded but global not set (e.g. some environment still routed
            // it through AMD). Remove tag and try the next candidate.
            try { s.parentNode && s.parentNode.removeChild(s); } catch (e) { /* ignore */ }
            // Re-suppress define for next attempt
            savedDefine = window.define;
            try { window.define = undefined; } catch (e) { /* ignore */ }
            tryNext();
          }
        };
        s.onerror = function () {
          try { s.parentNode && s.parentNode.removeChild(s); } catch (e) { /* ignore */ }
          tryNext();
        };
        document.head.appendChild(s);
      }

      tryNext();
    }).catch(function (err) {
      __jspdfLoadPromise = null;
      try { console.error("[PdfUtil] jsPDF load failed:", err); } catch (e) { /* ignore */ }
      throw err;
    });
    return __jspdfLoadPromise;
  }

  // ============================================================
  // PDF rendering helpers (mirrors generateWordContent2 logic)
  // ============================================================

  function sanitizeForPdf(text) {
    if (text == null) return "";
    var s = String(text);

    // Remove zero-width / formatting characters that break width measurement
    s = s.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "");

    // Normalize various Unicode whitespace to a regular space
    s = s.replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, " ");

    // Horizontal box-drawing / heavy lines / blocks  ->  "-"
    s = s.replace(/[\u2500\u2501\u2504\u2505\u2508\u2509\u254C\u254D\u2550\u23AF\u23BC\u23BD\u2581-\u2588\u25AC\u25AD\u23E4]/g, "-");

    // Vertical box-drawing  ->  "|"
    s = s.replace(/[\u2502\u2503\u2506\u2507\u250A\u250B\u2551\u23B8\u23B9\u258F\u2590]/g, "|");

    // Box-drawing corners / junctions  ->  "+"
    s = s.replace(/[\u250C-\u254B\u2552-\u256C\u256D-\u257F]/g, "+");

    // Em/En dash, minus, figure dash, horizontal bar  ->  "-"
    s = s.replace(/[\u2010-\u2015\u2212]/g, "-");

    // Ellipsis
    s = s.replace(/[\u2026\u22EF]/g, "...");

    // Single quotes (curly, low, prime)
    s = s.replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'");

    // Double quotes (curly, low, guillemets, prime)
    s = s.replace(/[\u201C\u201D\u201E\u201F\u2033\u00AB\u00BB]/g, '"');

    // Bullets / list glyphs (non-bullet-list contexts)
    s = s.replace(/[\u2022\u2023\u2043\u25E6\u25AA\u25AB\u25CF\u25CB\u00B7\u2219]/g, "*");

    // Arrows
    s = s.replace(/[\u2192\u21D2\u279C\u27A4\u2794\u279D\u279E\u279F\u27A1]/g, "->");
    s = s.replace(/[\u2190\u21D0]/g, "<-");
    s = s.replace(/[\u2194\u21D4]/g, "<->");
    s = s.replace(/[\u2191\u21D1]/g, "^");
    s = s.replace(/[\u2193\u21D3]/g, "v");

    // Math / comparison
    s = s.replace(/\u2264/g, "<=");
    s = s.replace(/\u2265/g, ">=");
    s = s.replace(/\u2260/g, "!=");
    s = s.replace(/\u00B1/g, "+/-");
    s = s.replace(/\u00D7/g, "x");
    s = s.replace(/\u00F7/g, "/");
    s = s.replace(/[\u221E]/g, "inf");

    // Check / cross / stars
    s = s.replace(/[\u2713\u2714]/g, "[x]");
    s = s.replace(/[\u2717\u2718]/g, "[ ]");
    s = s.replace(/[\u2605\u2606\u2729\u272D\u272E\u272F\u2730]/g, "*");
    s = s.replace(/[\u2726\u2727\u25C6\u25C7\u25C8\u25C9]/g, "*");

    // Fractions
    s = s.replace(/\u00BC/g, "1/4");
    s = s.replace(/\u00BD/g, "1/2");
    s = s.replace(/\u00BE/g, "3/4");
    s = s.replace(/\u2153/g, "1/3");
    s = s.replace(/\u2154/g, "2/3");

    // Final sweep: any remaining codepoint outside WinAnsi (CP1252) safe range.
    // WinAnsi roughly covers 0x20-0x7E and 0xA0-0xFF plus a few specific
    // characters in 0x80-0x9F (which jsPDF Helvetica handles via the WinAnsi
    // remap). Anything else becomes "?".
    s = s.replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u02C6\u02DC\u2030\u2039\u203A\u20AC\u2122]/g, "?");

    return s;
  }

  function isTableSeparator(s) {
    return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(s);
  }

  function splitRow(s) {
    var r = s.trim();
    if (r.charAt(0) === "|") r = r.slice(1);
    if (r.charAt(r.length - 1) === "|") r = r.slice(0, -1);
    return r.split("|").map(function (c) { return c.trim(); });
  }

  /**
   * Parse inline markdown tokens from text and return an array of segments:
   * Each segment: { text, bold, italic, code }
   */
  function parseInlineSegments(text) {
    if (!text) return [{ text: "", bold: false, italic: false, code: false }];

    var segments = [];
    var remaining = String(text);

    // Convert links [text](url) to just text
    remaining = remaining.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    var regex = /(\*\*[\s\S]+?\*\*|__[\s\S]+?__|`[^`]+`|\*[^*\n]+?\*|_[^_\n]+?_)/g;
    var lastIndex = 0;
    var match;

    while ((match = regex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ text: remaining.slice(lastIndex, match.index), bold: false, italic: false, code: false });
      }

      var token = match[0];
      if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) {
        segments.push({ text: token.slice(2, -2), bold: true, italic: false, code: false });
      } else if (token.startsWith("`") && token.endsWith("`")) {
        segments.push({ text: token.slice(1, -1), bold: false, italic: false, code: true });
      } else if ((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) {
        segments.push({ text: token.slice(1, -1), bold: false, italic: true, code: false });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < remaining.length) {
      segments.push({ text: remaining.slice(lastIndex), bold: false, italic: false, code: false });
    }

    return segments.length > 0 ? segments : [{ text: text, bold: false, italic: false, code: false }];
  }

  /**
   * Detects bold label prefix pattern: "Label: rest text"
   * Returns segments with the label bolded
   */
  function boldLabelSegments(itemText) {
    if (/^\*\*/.test(itemText)) return parseInlineSegments(itemText);
    var m = itemText.match(/^([A-Za-z][A-Za-z0-9 ()\/&\-]{0,60}):\s+(.+)$/);
    if (m) {
      var rest = parseInlineSegments(m[2]);
      return [{ text: m[1] + ": ", bold: true, italic: false, code: false }].concat(rest);
    }
    return parseInlineSegments(itemText);
  }

  return {
    ensureLoaded: function () {
      return ensureJsPDFLoaded();
    },
    isAvailable: function () {
      return !!getJsPDF();
    },

    createSimplePdf: async function (filename, lines, options) {
      try {
        await ensureJsPDFLoaded();
      } catch (e) {
        MessageToast.show("jsPDF failed to load. " + e.message);
        return;
      }
      var JsPDF = getJsPDF();
      if (!JsPDF) {
        MessageToast.show("jsPDF not loaded. Ensure lib/jspdf.umd.min.js is present under webapp/lib.");
        return;
      }

      var doc = new JsPDF({ unit: "pt", format: "a4" });
      var margin = 40;
      var pageW = doc.internal.pageSize.getWidth();
      var pageH = doc.internal.pageSize.getHeight();
      var contentW = pageW - margin * 2;

      var opts = options || {};
      var baseSize = typeof opts.fontSize === "number" ? opts.fontSize : 11;
      var lineStep = Math.round(baseSize * 1.5);
      var BLUE = [31, 78, 121]; // #1F4E79 - matches Word blue color
      var BLACK = [0, 0, 0];
      var GRAY_BG = [245, 245, 245];
      var TABLE_HEADER_BG = [217, 226, 243]; // #D9E2F3

      var y = margin;

      function needNewPage(extra) {
        extra = extra || lineStep;
        if (y + extra > pageH - margin) {
          doc.addPage();
          y = margin;
        }
      }

      function writeSegments(segments, x, maxWidth, fontSize, defaultColor) {
        defaultColor = defaultColor || BLACK;
        fontSize = fontSize || baseSize;
        var currentLineStep = Math.round(fontSize * 1.5);

        if (!segments || segments.length === 0) {
          return;
        }

        // Tokenize each segment into a flat list of word/whitespace tokens
        // preserving per-segment formatting on each token.
        var tokens = [];
        segments.forEach(function (seg) {
          var txt = (seg && seg.text) ? String(seg.text) : "";
          if (!txt) return;
          // Split into runs of non-whitespace OR runs of whitespace
          var parts = txt.match(/\S+|\s+/g);
          if (!parts) return;
          parts.forEach(function (part) {
            tokens.push({
              text: part,
              bold: !!(seg && seg.bold),
              italic: !!(seg && seg.italic),
              code: !!(seg && seg.code),
              isWhitespace: /^\s+$/.test(part)
            });
          });
        });

        if (tokens.length === 0) {
          return;
        }

        function applyFont(tok) {
          var fontName = tok.code ? "courier" : "helvetica";
          var fontStyle = "normal";
          if (tok.bold && tok.italic) fontStyle = "bolditalic";
          else if (tok.bold) fontStyle = "bold";
          else if (tok.italic) fontStyle = "italic";
          doc.setFont(fontName, fontStyle);
          doc.setFontSize(fontSize);
        }

        needNewPage(currentLineStep);
        var lineX = x;
        var pendingSpaceW = 0;
        var anyRenderedOnLine = false;

        tokens.forEach(function (tok) {
          if (tok.isWhitespace) {
            // Accumulate whitespace width to apply before the next word
            // (skipped entirely if it falls at the start of a wrapped line).
            applyFont(tok);
            // Normalize tabs/newlines to single spaces for width measurement
            var wsText = tok.text.replace(/[\t\n\r]/g, " ");
            pendingSpaceW += doc.getTextWidth(wsText);
            return;
          }

          applyFont(tok);
          // Sanitize the word text for safe rendering with WinAnsi-only fonts
          var safeWord = sanitizeForPdf(tok.text);
          var wordW = doc.getTextWidth(safeWord);

          // Defensive: if a single token is wider than the entire content area,
          // hard-break it character-by-character to prevent right-margin overflow.
          if (wordW > maxWidth) {
            // First, ensure we are at the start of a fresh line if anything is
            // already rendered on the current line.
            if (anyRenderedOnLine) {
              y += currentLineStep;
              needNewPage(currentLineStep);
              lineX = x;
              pendingSpaceW = 0;
              anyRenderedOnLine = false;
            }
            doc.setTextColor(defaultColor[0], defaultColor[1], defaultColor[2]);
            var chunk = "";
            for (var ci = 0; ci < safeWord.length; ci++) {
              var ch = safeWord.charAt(ci);
              var candidate = chunk + ch;
              if (doc.getTextWidth(candidate) > maxWidth && chunk.length > 0) {
                doc.text(chunk, lineX, y);
                y += currentLineStep;
                needNewPage(currentLineStep);
                lineX = x;
                chunk = ch;
              } else {
                chunk = candidate;
              }
            }
            if (chunk.length > 0) {
              doc.text(chunk, lineX, y);
              lineX += doc.getTextWidth(chunk);
              anyRenderedOnLine = true;
            }
            pendingSpaceW = 0;
            return;
          }

          // Decide if we need to wrap before rendering this word
          if (anyRenderedOnLine && (lineX + pendingSpaceW + wordW) > (x + maxWidth)) {
            // Wrap to next line
            y += currentLineStep;
            needNewPage(currentLineStep);
            lineX = x;
            pendingSpaceW = 0;
            anyRenderedOnLine = false;
          }

          // Apply pending space only if we're not at the start of a line
          if (anyRenderedOnLine && pendingSpaceW > 0) {
            lineX += pendingSpaceW;
          }
          pendingSpaceW = 0;

          doc.setTextColor(defaultColor[0], defaultColor[1], defaultColor[2]);
          doc.text(safeWord, lineX, y);
          lineX += wordW;
          anyRenderedOnLine = true;
        });

        // Advance y past the last rendered line
        y += currentLineStep;
      }

      function writeSimple(text, fontSize, fontStyle, color, indent, gapAfter) {
        fontSize = fontSize || baseSize;
        fontStyle = fontStyle || "normal";
        color = color || BLACK;
        indent = indent || 0;
        gapAfter = gapAfter !== undefined ? gapAfter : Math.floor(fontSize * 0.4);

        doc.setFont("helvetica", fontStyle);
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);

        var effectiveWidth = Math.max(10, contentW - indent);
        var safeText = sanitizeForPdf(text);
        var wrapped = doc.splitTextToSize(safeText, effectiveWidth);

        var currentLineStep = Math.round(fontSize * 1.5);
        wrapped.forEach(function (line) {
          // Defensive: splitTextToSize occasionally returns a line that still
          // overflows when the line contains no whitespace at all (long run of
          // identical chars). Hard-break it character-by-character.
          if (doc.getTextWidth(line) > effectiveWidth) {
            var chunk = "";
            for (var ci = 0; ci < line.length; ci++) {
              var ch = line.charAt(ci);
              var candidate = chunk + ch;
              if (doc.getTextWidth(candidate) > effectiveWidth && chunk.length > 0) {
                needNewPage(currentLineStep);
                doc.text(chunk, margin + indent, y);
                y += currentLineStep;
                chunk = ch;
              } else {
                chunk = candidate;
              }
            }
            if (chunk.length > 0) {
              needNewPage(currentLineStep);
              doc.text(chunk, margin + indent, y);
              y += currentLineStep;
            }
          } else {
            needNewPage(currentLineStep);
            doc.text(line, margin + indent, y);
            y += currentLineStep;
          }
        });

        if (gapAfter > 0) {
          needNewPage(gapAfter);
          y += gapAfter;
        }
      }

      /**
       * Write inline-formatted text (bold, italic, code) with word wrapping
       */
      function writeFormatted(text, indent, color, fontSize) {
        indent = indent || 0;
        color = color || BLACK;
        fontSize = fontSize || baseSize;
        var segments = parseInlineSegments(text);
        var effectiveWidth = Math.max(10, contentW - indent);
        writeSegments(segments, margin + indent, effectiveWidth, fontSize, color);
        // small gap after
        var gap = Math.floor(fontSize * 0.3);
        if (gap > 0) {
          needNewPage(gap);
          y += gap;
        }
      }

      /**
       * Write segments array directly (for bold label prefix patterns)
       */
      function writeSegmentsDirect(segments, indent, color, fontSize) {
        indent = indent || 0;
        color = color || BLACK;
        fontSize = fontSize || baseSize;
        var effectiveWidth = Math.max(10, contentW - indent);
        writeSegments(segments, margin + indent, effectiveWidth, fontSize, color);
        var gap = Math.floor(fontSize * 0.3);
        if (gap > 0) {
          needNewPage(gap);
          y += gap;
        }
      }

      /**
       * Draw a table with header and body rows
       */
      function drawTable(headerCells, bodyRows) {
        var colCount = headerCells.length;
        var colWidth = contentW / colCount;
        var cellPadding = 5;
        var cellFontSize = baseSize - 1;
        var cellLineStep = Math.round(cellFontSize * 1.4);

        // Calculate row heights
        function getRowHeight(cells) {
          var maxLines = 1;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(cellFontSize);
          cells.forEach(function (cell) {
            var lines = doc.splitTextToSize(sanitizeForPdf(cell), colWidth - cellPadding * 2);
            if (lines.length > maxLines) maxLines = lines.length;
          });
          return maxLines * cellLineStep + cellPadding * 2;
        }

        // Draw header row
        var headerHeight = getRowHeight(headerCells);
        needNewPage(headerHeight + 10);

        var startX = margin;
        // Header background
        doc.setFillColor(TABLE_HEADER_BG[0], TABLE_HEADER_BG[1], TABLE_HEADER_BG[2]);
        doc.rect(startX, y, contentW, headerHeight, "F");

        // Header borders and text
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.5);
        headerCells.forEach(function (cell, ci) {
          var cellX = startX + ci * colWidth;
          doc.rect(cellX, y, colWidth, headerHeight);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(cellFontSize);
          doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
          var lines = doc.splitTextToSize(sanitizeForPdf(cell), colWidth - cellPadding * 2);
          lines.forEach(function (line, li) {
            doc.text(line, cellX + cellPadding, y + cellPadding + (li + 1) * cellLineStep - 2);
          });
        });
        y += headerHeight;

        // Body rows
        bodyRows.forEach(function (row) {
          var rowHeight = getRowHeight(row);
          needNewPage(rowHeight);

          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.5);
          row.forEach(function (cell, ci) {
            var cellX = startX + ci * colWidth;
            doc.rect(cellX, y, colWidth, rowHeight);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(cellFontSize);
            doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
            var lines = doc.splitTextToSize(sanitizeForPdf(cell), colWidth - cellPadding * 2);
            lines.forEach(function (line, li) {
              doc.text(line, cellX + cellPadding, y + cellPadding + (li + 1) * cellLineStep - 2);
            });
          });
          y += rowHeight;
        });

        // Gap after table
        y += 10;
      }

      // ============================================================
      // Normalize input
      // ============================================================
      var raw = [];
      if (Array.isArray(lines)) {
        raw = lines.map(function (s) { return String(s == null ? "" : s); });
      } else {
        raw = String(lines == null ? "" : lines)
          .replace(/\r\n/g, "\n")
          .split("\n");
      }

      // ============================================================
      // Extract fenced code blocks (same as generateWordContent2)
      // ============================================================
      var src = raw.join("\n");
      var codeBlocks = [];
      src = src.replace(/```([a-zA-Z0-9_+\-]*)\n([\s\S]*?)```/g, function (m, lang, code) {
        var token = "\u0000CODEBLOCK" + codeBlocks.length + "\u0000";
        var trimmed = code.replace(/^\s+|\s+$/g, "");
        var firstTwo = trimmed.split(/\r?\n/, 2);
        var sepRe = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/;
        var langOk = !lang || /^(plaintext|text|md|markdown)$/i.test(lang);

        if (langOk && firstTwo.length === 2 &&
          firstTwo[0].indexOf("|") !== -1 && sepRe.test(firstTwo[1])) {
          codeBlocks.push({ type: "table", content: trimmed });
        } else {
          codeBlocks.push({ type: "code", lang: lang || "", content: code.replace(/\n$/, "") });
        }
        return token;
      });

      var parsedLines = src.split(/\r?\n/);

      // ============================================================
      // Parse and render (matching generateWordContent2 block logic)
      // ============================================================
      var i = 0;
      var paraBuf = [];
      var plainMode = false;

      function flushPara() {
        if (paraBuf.length) {
          if (plainMode) {
            writeSimple(paraBuf.join(" "), baseSize, "normal", BLACK, 0, Math.floor(baseSize * 0.3));
          } else {
            writeFormatted(paraBuf.join(" "), 0, BLACK, baseSize);
            // Add paragraph spacing
            y += Math.floor(baseSize * 0.4);
          }
          paraBuf = [];
        }
      }

      // Title
      needNewPage(30);
      writeSimple("AI Response", 18, "bold", BLUE, 0, 12);

      while (i < parsedLines.length) {
        var line = parsedLines[i];

        // Plain-mode sentinels: toggle plain rendering for content between markers.
        if (line.trim() === "__PDF_PLAIN_BEGIN__") {
          flushPara();
          plainMode = true;
          i++;
          continue;
        }
        if (line.trim() === "__PDF_PLAIN_END__") {
          flushPara();
          plainMode = false;
          i++;
          continue;
        }
        if (plainMode) {
          flushPara(); // safety: ensure no leftover buffer from before
          if (/^\s*$/.test(line)) {
            // Blank line -> small vertical gap (paragraph break)
            needNewPage(Math.floor(baseSize * 0.5));
            y += Math.floor(baseSize * 0.5);
          } else {
            // Right-trim only — preserve any intentional leading whitespace
            // that the author may have used for indentation/alignment.
            var plainLine = line.replace(/\s+$/, "");
            writeSimple(plainLine, baseSize, "normal", BLACK, 0, 0);
          }
          i++;
          continue;
        }

        // Restore code-block placeholder
        var codeMatch = line.match(/\u0000CODEBLOCK(\d+)\u0000/);
        if (codeMatch) {
          flushPara();
          var block = codeBlocks[parseInt(codeMatch[1], 10)];
          if (block) {
            if (block.type === "table") {
              var tableRows = block.content.split(/\r?\n/);
              if (tableRows.length >= 2) {
                var header = splitRow(tableRows[0]);
                var body = tableRows.slice(2)
                  .filter(function (r) { return r.trim().length > 0; })
                  .map(splitRow);
                if (header.length > 0 && body.length > 0) {
                  drawTable(header, body);
                }
              }
            } else {

              var codeLines = block.content.split(/\r?\n/);
              var codeLineStep = Math.round(9 * 1.4);
              var codeBlockHeight = codeLines.length * codeLineStep + 10;
              needNewPage(Math.min(codeBlockHeight, 100));

              doc.setFont("courier", "normal");
              doc.setFontSize(9);
              var codeInnerWidth = contentW - 16; // 8pt padding each side

              codeLines.forEach(function (codeLine) {
                var safeLine = sanitizeForPdf(codeLine);
                // Preserve empty lines as a single blank row
                if (safeLine.length === 0) {
                  needNewPage(codeLineStep);
                  doc.setFillColor(GRAY_BG[0], GRAY_BG[1], GRAY_BG[2]);
                  doc.rect(margin, y - codeLineStep + 4, contentW, codeLineStep, "F");
                  y += codeLineStep;
                  return;
                }

                // Word-wrap first
                var wrapped = doc.splitTextToSize(safeLine, codeInnerWidth);

                wrapped.forEach(function (sub) {
                  // Char-level hard-break for runs that still exceed width
                  // (e.g. long unbroken "----------" sequences).
                  if (doc.getTextWidth(sub) > codeInnerWidth) {
                    var chunk = "";
                    for (var ci = 0; ci < sub.length; ci++) {
                      var ch = sub.charAt(ci);
                      var candidate = chunk + ch;
                      if (doc.getTextWidth(candidate) > codeInnerWidth && chunk.length > 0) {
                        needNewPage(codeLineStep);
                        doc.setFillColor(GRAY_BG[0], GRAY_BG[1], GRAY_BG[2]);
                        doc.rect(margin, y - codeLineStep + 4, contentW, codeLineStep, "F");
                        doc.setFont("courier", "normal");
                        doc.setFontSize(9);
                        doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
                        doc.text(chunk, margin + 8, y);
                        y += codeLineStep;
                        chunk = ch;
                      } else {
                        chunk = candidate;
                      }
                    }
                    if (chunk.length > 0) {
                      needNewPage(codeLineStep);
                      doc.setFillColor(GRAY_BG[0], GRAY_BG[1], GRAY_BG[2]);
                      doc.rect(margin, y - codeLineStep + 4, contentW, codeLineStep, "F");
                      doc.setFont("courier", "normal");
                      doc.setFontSize(9);
                      doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
                      doc.text(chunk, margin + 8, y);
                      y += codeLineStep;
                    }
                  } else {
                    needNewPage(codeLineStep);
                    doc.setFillColor(GRAY_BG[0], GRAY_BG[1], GRAY_BG[2]);
                    doc.rect(margin, y - codeLineStep + 4, contentW, codeLineStep, "F");
                    doc.setFont("courier", "normal");
                    doc.setFontSize(9);
                    doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
                    doc.text(sub, margin + 8, y);
                    y += codeLineStep;
                  }
                });
              });
              y += 8;
            }
          }
          i++;
          continue;
        }

        // Blank line -> paragraph break
        if (/^\s*$/.test(line)) {
          flushPara();
          needNewPage(Math.floor(baseSize * 0.6));
          y += Math.floor(baseSize * 0.6);
          i++;
          continue;
        }

        // ATX Headings # .. ######
        var mH = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
        if (mH) {
          flushPara();
          var lvl = mH[1].length;
          var sizes = [18, 16, 14, 13, 12, 11];
          var headingSize = sizes[lvl - 1] || 11;
          needNewPage(Math.round(headingSize * 2));
          y += Math.floor(headingSize * 0.5); // space before
          writeSimple(mH[2], headingSize, "bold", BLUE, 0, Math.floor(headingSize * 0.4));
          i++;
          continue;
        }

        // SECTION/PART/APPENDIX/CHAPTER/PHASE/STEP heading
        var mSec = line.match(/^\s*((?:SECTION|PART|APPENDIX|CHAPTER|PHASE|STEP)\s+[\w\d.\-]+(?:\s*[—:\-]\s*.+)?)\s*$/);
        if (mSec) {
          flushPara();
          needNewPage(30);
          y += 8;
          writeSimple(mSec[1].trim(), 16, "bold", BLUE, 0, 8);
          i++;
          continue;
        }

        // Multi-level numbered heading (1.1, 1.1.1, ...)
        var mMultiNum = line.match(/^\s*(\d+(?:\.\d+)+)\.?\s+(\S.*?)\s*$/);
        if (mMultiNum && !/[.;!?]\s*$/.test(line)) {
          flushPara();
          var depthDots = (mMultiNum[1].match(/\./g) || []).length;
          var hLvl = Math.min(5, 1 + depthDots);
          var mSizes = [16, 14, 13, 12, 11];
          var mSize = mSizes[hLvl - 1] || 12;
          needNewPage(Math.round(mSize * 2));
          y += Math.floor(mSize * 0.4);
          writeSimple(mMultiNum[1] + " " + mMultiNum[2], mSize, "bold", BLUE, 0, Math.floor(mSize * 0.3));
          i++;
          continue;
        }

        // Single-level "1. Title" when followed by sub-numbered heading
        var mTopNum = line.match(/^\s*(\d+)\.\s+([A-Z][^\n]{0,200})$/);
        if (mTopNum && !/[.;!?]\s*$/.test(line)) {
          var lookJ = i + 1;
          while (lookJ < parsedLines.length && /^\s*$/.test(parsedLines[lookJ])) lookJ++;
          var nextL = (lookJ < parsedLines.length) ? parsedLines[lookJ] : "";
          var nextIsSubNum = /^\s*\d+(?:\.\d+)+\.?\s+\S/.test(nextL);
          if (nextIsSubNum) {
            flushPara();
            needNewPage(30);
            y += 8;
            writeSimple(mTopNum[1] + ". " + mTopNum[2], 16, "bold", BLUE, 0, 8);
            i++;
            continue;
          }
        }

        // Horizontal rule
        if (/^\s*([-*_])\s*\1\s*\1[\s\S]*$/.test(line) && line.replace(/[\s*\-_]/g, "") === "") {
          flushPara();
          needNewPage(lineStep);
          y += 6;
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(1);
          doc.line(margin, y, margin + contentW, y);
          y += 10;
          i++;
          continue;
        }

        // Pipe table
        if (line.indexOf("|") !== -1 && i + 1 < parsedLines.length && isTableSeparator(parsedLines[i + 1])) {
          flushPara();
          var tHeader = splitRow(line);
          i += 2;
          var tRows = [];
          while (i < parsedLines.length && parsedLines[i].indexOf("|") !== -1 && !/^\s*$/.test(parsedLines[i])) {
            tRows.push(splitRow(parsedLines[i]));
            i++;
          }
          if (tHeader.length > 0 && tRows.length > 0) {
            drawTable(tHeader, tRows);
          }
          continue;
        }

        // Unordered list
        if (/^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/.test(line)) {
          flushPara();
          while (i < parsedLines.length && /^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/.test(parsedLines[i])) {
            var item = parsedLines[i].replace(/^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/, "");
            var bulletSegments = boldLabelSegments(item);
            // Draw bullet character
            needNewPage(lineStep);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(baseSize);
            doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
            doc.text("\u2022", margin + 10, y);
            // Draw item text with formatting
            writeSegmentsDirect(bulletSegments, 22, BLACK, baseSize);
            i++;
          }
          y += Math.floor(baseSize * 0.3);
          continue;
        }
        if (/^\s*\d+[\.\)]\s+/.test(line)) {
          flushPara();
          while (i < parsedLines.length) {
            var curLine = parsedLines[i];

            // Skip a blank line if the next non-blank line is another
            // numbered item or a bullet continuation — keeps the list
            // contiguous across paragraph breaks.
            if (/^\s*$/.test(curLine)) {
              var la = i + 1;
              while (la < parsedLines.length && /^\s*$/.test(parsedLines[la])) la++;
              var laLine = (la < parsedLines.length) ? parsedLines[la] : "";
              if (/^\s*\d+[\.\)]\s+/.test(laLine) ||
                  /^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/.test(laLine)) {
                i++;
                continue;
              }
              break;
            }

            var olMatch = curLine.match(/^\s*(\d+)[\.\)]\s+(.*)$/);
            if (olMatch) {
              // Numbered item — render with its own source number, in bold.
              var actualNum = olMatch[1];
              var olItem = olMatch[2];
              var olSegments = boldLabelSegments(olItem);
              needNewPage(lineStep);
              doc.setFont("helvetica", "bold");
              doc.setFontSize(baseSize);
              doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
              doc.text(actualNum + ".", margin + 6, y);
              writeSegmentsDirect(olSegments, 22, BLACK, baseSize);
              i++;
              continue;
            }

            // Bullet continuation belonging to the current numbered item —
            // render as an indented sub-bullet.
            if (/^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/.test(curLine)) {
              var subItem = curLine.replace(/^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/, "");
              var subSegments = boldLabelSegments(subItem);
              needNewPage(lineStep);
              doc.setFont("helvetica", "normal");
              doc.setFontSize(baseSize);
              doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
              doc.text("\u2022", margin + 28, y);
              writeSegmentsDirect(subSegments, 40, BLACK, baseSize);
              i++;
              continue;
            }

            // Anything else ends the ordered list.
            break;
          }
          y += Math.floor(baseSize * 0.3);
          continue;
        }

        // "Label1: val1 Label2: val2 Label3: val3" → split into separate lines
        var labelMatches = line.match(/[A-Z][A-Za-z][A-Za-z0-9 \/\-]{1,40}:/g);
        if (labelMatches && labelMatches.length >= 3) {
          flushPara();
          var splitRe = /\s+(?=[A-Z][A-Za-z][A-Za-z0-9 \/\-]{1,40}:\s)/g;
          line.split(splitRe).forEach(function (seg) {
            seg = seg.trim();
            if (!seg) return;
            var idx = seg.indexOf(":");
            if (idx > -1) {
              var labelSegs = [
                { text: seg.slice(0, idx + 1), bold: true, italic: false, code: false },
                { text: seg.slice(idx + 1), bold: false, italic: false, code: false }
              ];
              writeSegmentsDirect(labelSegs, 0, BLACK, baseSize);
            } else {
              writeFormatted(seg, 0, BLACK, baseSize);
            }
          });
          i++;
          continue;
        }

        // "Label:" heading followed by list
        if (paraBuf.length === 0 &&
          /^\s*[A-Z][A-Za-z0-9 \/&()\-]{0,99}:\s*$/.test(line) &&
          !/[*_`#|]/.test(line)) {
          var k0 = i + 1;
          while (k0 < parsedLines.length && /^\s*$/.test(parsedLines[k0])) k0++;
          var nextLn0 = (k0 < parsedLines.length) ? parsedLines[k0] : "";
          var nextIsListLbl = /^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/.test(nextLn0) ||
            /^\s*\d+[\.\)]\s+/.test(nextLn0);
          if (nextIsListLbl) {
            flushPara();
            needNewPage(20);
            y += 6;
            writeSimple(line.trim(), 14, "bold", BLUE, 0, 6);
            i++;
            continue;
          }
        }

        // Bare-text section heading followed by list
        if (paraBuf.length === 0 &&
          /^\s*[A-Z][^\n]{0,79}$/.test(line) &&
          !/[.,;:!?]\s*$/.test(line) &&
          !/[*_`#|]/.test(line) &&
          !/^\s*\d+[\.\)]\s+/.test(line) &&
          !/^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/.test(line)) {
          var j = i + 1;
          while (j < parsedLines.length && /^\s*$/.test(parsedLines[j])) j++;
          var nextLine = (j < parsedLines.length) ? parsedLines[j] : "";
          var nextStartsList = /^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/.test(nextLine) ||
            /^\s*\d+[\.\)]\s+/.test(nextLine);
          var nextIsBareHeading = /^\s*[A-Z][^\n]{0,79}$/.test(nextLine) &&
            !/[.,;:!?]\s*$/.test(nextLine) &&
            !/[*_`#|]/.test(nextLine) &&
            nextLine.trim().length > 0;
          var wordCount = line.trim().split(/\s+/).length;
          var hasHyphenWord = /[A-Za-z]-[A-Za-z]/.test(line);
          if ((nextStartsList || nextIsBareHeading) && (wordCount >= 2 || hasHyphenWord)) {
            flushPara();
            needNewPage(20);
            y += 6;
            writeSimple(line.trim(), 14, "bold", BLUE, 0, 6);
            i++;
            continue;
          }
        }

        // Default: accumulate paragraph text
        paraBuf.push(line.trim());
        i++;
      }

      flushPara();

      doc.save(filename || "document.pdf");
    }
  };
});
