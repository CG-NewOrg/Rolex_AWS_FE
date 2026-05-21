sap.ui.define([
  "sap/m/MessageToast"
], function (MessageToast) {
  "use strict";

  function getJsPDF() {
    // jsPDF UMD exposes window.jspdf.jsPDF when loaded via <script src="lib/jspdf.umd.min.js">
    return (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : null;
  }

  // Ensure jsPDF script is present (works both standalone and in FLP)
  var __jspdfLoadPromise = null;
  function ensureJsPDFLoaded() {
    if (getJsPDF()) {
      return Promise.resolve();
    }
    if (__jspdfLoadPromise) {
      return __jspdfLoadPromise;
    }
    var primaryUrl = null;
    try {
      // Primary: module path under app namespace (works in FLP when resources are served under /resources/aicockpitfeq/)
      primaryUrl = sap.ui.require.toUrl("aicockpitfeq/lib/jspdf.umd.min.js");
    } catch (e) {
      // sap.ui not ready yet, will fallback below
    }
    var fallbackUrl = "lib/jspdf.umd.min.js"; // Relative to application root (works in local ui5 serve)
    __jspdfLoadPromise = new Promise(function (resolve, reject) {
      // Avoid injecting duplicates
      var existing = document.querySelector('script[data-jspdf="loader"]');
      if (existing) {
        existing.addEventListener("load", function () { resolve(); }, { once: true });
        existing.addEventListener("error", function () { reject(new Error("jsPDF loader existing tag failed")); }, { once: true });
        return;
      }
      var s = document.createElement("script");
      s.setAttribute("data-jspdf", "loader");
      s.async = true;
      s.crossOrigin = "anonymous";
      var triedFallback = false;
      function tryLoad(url) {
        s.src = url;
        document.head.appendChild(s);
      }
      s.onload = function () {
        // Some environments need a tick for window.jspdf to be populated
        setTimeout(function () {
          if (getJsPDF()) {
            resolve();
            return;
          }
          // In managed FLP, UMD may register as AMD module instead of global.
          try {
            if (sap && sap.ui && sap.ui.require) {
              sap.ui.require(["jspdf"], function (mod) {
                try {
                  var JsPDF = (mod && (mod.jsPDF || mod.default || mod)) || null;
                  if (JsPDF) {
                    // Bridge to expected global shape
                    window.jspdf = window.jspdf || {};
                    window.jspdf.jsPDF = JsPDF;
                  }
                } catch (e) {
                  // ignore
                }
                if (getJsPDF()) {
                  resolve();
                } else {
                  reject(new Error("jsPDF AMD module loaded but jsPDF constructor not found"));
                }
              }, function () {
                reject(new Error("AMD require for 'jspdf' failed after script load: " + (primaryUrl || fallbackUrl)));
              });
            } else {
              reject(new Error("jsPDF loaded but global not found and AMD loader unavailable"));
            }
          } catch (e) {
            reject(new Error("Post-load hook failed: " + e.message));
          }
        }, 0);
      };
      s.onerror = function () {
        if (!triedFallback && primaryUrl && s.src.indexOf(primaryUrl) !== -1) {
          // Retry with fallback relative URL
          triedFallback = true;
          tryLoad(fallbackUrl);
        } else if (!triedFallback && !primaryUrl) {
          // If primary could not be resolved at all, try fallback once
          triedFallback = true;
          tryLoad(fallbackUrl);
        } else {
          reject(new Error("Failed to load jsPDF from " + s.src));
        }
      };
      // Prefer primary if resolved, else fallback
      tryLoad(primaryUrl || fallbackUrl);
    }).catch(function (err) {
      __jspdfLoadPromise = null;
      throw err;
    });
    return __jspdfLoadPromise;
  }

  return {
    // Quick check to see if the library is available
    ensureLoaded: function () {
      return ensureJsPDFLoaded();
    },
    isAvailable: function () {
      return !!getJsPDF();
    },

    // Improved generator: wraps long text, paginates, and handles simple markdown headings/lists/code blocks.
    // filename: string
    // lines: string | string[]
    createSimplePdf: async function (filename, lines, options) {
      try {
        await ensureJsPDFLoaded();
      } catch (e) {
        MessageToast.show("jsPDF failed to load. " + e.message);
        return;
      }
      const JsPDF = getJsPDF();
      if (!JsPDF) {
        MessageToast.show("jsPDF not loaded. Ensure lib/jspdf.umd.min.js is present under webapp/lib.");
        return;
      }

      const doc = new JsPDF({ unit: "pt", format: "a4" });
      const margin = 40;
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const contentW = pageW - margin * 2;

      // Options and base typography
      const opts = options || {};
      const baseFont = opts.fontFamily || "helvetica";
      const baseSize = typeof opts.fontSize === "number" ? opts.fontSize : 11;
      const lineStep = Math.round(baseSize * 1.4); // ~1.4 line height
      const useMd = !!opts.markdown;

      let y = margin;

      function needNewPage(extra = lineStep) {
        if (y + extra > pageH - margin) {
          doc.addPage();
          y = margin;
        }
      }

      // Remove inline markdown emphasis so it doesn't render as bold unexpectedly:
      // **bold**, __bold__, *italic*, _italic_
      function sanitizeInline(text) {
        return String(text || "")
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/__(.*?)__/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          .replace(/_(.*?)_/g, "$1");
      }

      function writeWrapped(text, opts) {
        const font = opts && opts.font ? opts.font : baseFont;
        const style = opts && opts.style ? opts.style : "normal";
        const size = opts && opts.size ? opts.size : baseSize;
        const indent = opts && opts.indent ? opts.indent : 0;
        const gapAfter = opts && opts.gapAfter != null ? opts.gapAfter : Math.floor(size * 0.4);

        doc.setFont(font, style);
        doc.setFontSize(size);

        const effectiveWidth = Math.max(10, contentW - indent);
        const wrapped = doc.splitTextToSize(sanitizeInline(text), effectiveWidth);

        wrapped.forEach(function (line) {
          needNewPage(lineStep);
          doc.text(line, margin + indent, y);
          y += lineStep;
        });

        if (gapAfter) {
          needNewPage(gapAfter);
          y += gapAfter;
        }
      }

      // Normalize input into an array of raw lines
      let raw = [];
      if (Array.isArray(lines)) {
        raw = lines.map(function (s) { return String(s == null ? "" : s); });
      } else {
        raw = String(lines == null ? "" : lines)
          .replace(/\r\n/g, "\n")
          .split("\n");
      }

      if (useMd) {
        // Very light markdown support: #, ##, ### headings; lists (-,*,1.); fenced code blocks ```
        let inCode = false;

        raw.forEach(function (line) {
          const trimmed = line.trim();

          // Fence toggle
          if (trimmed === "```") {
            inCode = !inCode;
            return;
          }

          if (inCode) {
            // Code block: monospaced, smaller size, indent
            writeWrapped(line, { font: "courier", style: "normal", size: 9, indent: 14, gapAfter: 0 });
            return;
          }

          // Blank line -> vertical spacing
          if (!trimmed) {
            needNewPage(lineStep);
            y += Math.floor(baseSize * 0.6);
            return;
          }

          // Headings
          if (/^#{1,6}\s+/.test(trimmed)) {
            const level = (trimmed.match(/^#+/)[0] || "").length;
            const txt = trimmed.replace(/^#{1,6}\s+/, "");
            // Make headings readable but not oversized; cap to 16pt and slightly scale by level
            const size = Math.max(baseSize + 2, Math.min(16, Math.round(baseSize + (6 - level) * 1.5)));
            writeWrapped(txt, { font: baseFont, style: "bold", size: size, gapAfter: Math.floor(size * 0.5) });
            return;
          }

          // Bulleted list
          if (/^(\*|-)\s+/.test(trimmed)) {
            const txt = trimmed.replace(/^(\*|-)\s+/, "• ");
            writeWrapped(txt, { font: baseFont, style: "normal", size: baseSize, indent: 10, gapAfter: 0 });
            return;
          }

          // Numbered list
          if (/^\d+\.\s+/.test(trimmed)) {
            writeWrapped(trimmed, { font: baseFont, style: "normal", size: baseSize, indent: 10, gapAfter: 0 });
            return;
          }

          // Default paragraph
          writeWrapped(line, { font: baseFont, style: "normal", size: baseSize });
        });
      } else {
        // Plain mode: no markdown interpretation, consistent style
        raw.forEach(function (line) {
          const trimmed = line.trim();
          if (!trimmed) {
            needNewPage(lineStep);
            y += Math.floor(baseSize * 0.6);
            return;
          }
          writeWrapped(line, { font: baseFont, style: "normal", size: baseSize });
        });
      }

      // Optional footer: simple page number on last page (commented out by default)
      // const pageCount = doc.getNumberOfPages();
      // doc.setFont(baseFont, "normal");
      // doc.setFontSize(9);
      // doc.text(String(pageCount), pageW - margin, pageH - Math.floor(baseSize * 0.6), { align: "right" });

      doc.save(filename || "document.pdf");
    }
  };
});