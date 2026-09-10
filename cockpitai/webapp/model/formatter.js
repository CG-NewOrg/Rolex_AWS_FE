sap.ui.define([], () => {
    "use strict";

    return {

        setVisibility: function (frName) {

            if (frName === "admin") {
                return true;
            } else if (frName === "user") {
                return true;
            } else {
                return false;
            }
        },
        setIcon: function (fileType) {

            if (fileType == "pdf") {
                return "sap-icon://pdf-attachment";
            } else if (fileType == "xls") {
                return "sap-icon://excel-attachment";
            } else if (fileType == "doc" || fileType == "docx") {
                return "sap-icon://document-text";
            } else {
                return "sap-icon://document"
            }
        },
        formatModelUsage: function (modelName, tokensUsed) {
            if (modelName == null || modelName === "") {
                return "0"
            }
            return modelName + " - " + tokensUsed;
        },
        listLogTablevisibilityUA: function (typeRole) {

            if (typeRole == "admin" || typeRole == "user") {
                return true;
            } else {
                return false;
            }
        },
        userLogListTitle: function (fragName) {
            if (fragName == "user") {
                return "User List Log";
            } else if (fragName == "admin") {
                return "Admin Log List";
            } else if (fragName == "promptlibpr") {
                return "Prompt Library";
            } else if (fragName == "knowlB") {
                return "Knowledge Base";
            } else if (fragName == "knowlBAdmin") {
                return "Knowledge Base Admin";
            } else if (fragName == "promptsUsed") {
                return "Prompts Used";
            }
        },
        formatPara: function (txt) {

        },
        dateCoversion: function (dt) {
            var dateComp = new Date(dt);
            return dateComp.getDate() + "/" + (dateComp.getMonth() + 1) + "/" + dateComp.getFullYear();
        },
        decodeHtml: function (html) {
            if (html == null) {
                return "";
            }
            var txt = document.createElement("textarea");
            txt.innerHTML = String(html);
            return txt.value;
        },
        formatListToLines: function (listOrString) {
            if (listOrString == null) return "";

            if (Array.isArray(listOrString)) {
                return listOrString
                    .map(function (item) {
                        if (item == null) return "";
                        if (typeof item === "string") return item.trim();
                        if (typeof item === "object") {
                            return (item.name || item.text || item.id || item.value || "").toString().trim();
                        }
                        return String(item).trim();
                    })
                    .filter(Boolean)
                    .join("\n");
            }

            if (typeof listOrString === "string") {
                var s = listOrString.trim();
                if (!s) return "";
                if (s.indexOf("\n") > -1) return s;
                if (s.indexOf("|") > -1) return s.split("|").map(x => x.trim()).filter(Boolean).join("\n");
                return s.split(",").map(x => x.trim()).filter(Boolean).join("\n");
            }

            return "";
        },

        itemToString: function (item) {
            if (item == null) return "";
            if (typeof item === "string") return item.trim();
            if (typeof item === "object") {
                return (item.name || item.text || item.id || item.value || "").toString().trim();
            }
            return String(item).trim();
        },
        hideinFilter1: function (fragment) {
            // //user id/ email id
            if (fragment == "admin" || fragment == "promptsUsed" || fragment == "promptlibpr") {
                return false;
            } else {
                return true;
            }
        },
        hideinFilter2: function (fragment) {
            ///Category
            if (fragment == "promptlibpr" || fragment == "knowlBAdmin") {
                return false;
            } else {
                return true;
            }
        },
        setMsgText: function (msgSel) {
            if (msgSel == "Prompt") {
                return "Prompt";
            } else if (msgSel == "System") {
                return "System Message";
            }
        },
        setIDText: function (msgSel, isUpd) {
            if (msgSel == "Prompt") {
                return "Prompt ID";
            } else if (msgSel == "System") {
                return "System ID";
            }
            // if(isUpd==true){
            //     if (msgSel == "Prompt") {
            //     return "Update Prompt";
            // } else if (msgSel == "System") {
            //     return "Update System Message";
            // }
            // }
        },
        typeNav: function (frg) {
            if (frg == "admin") {
                return "Navigation";
            } else {
                return "Inactive";
            }
        },
        setWidth: function (vis) {
            if (vis == false) {
                return "100%";
            } else {
                return "50%";
            }
        },
        formatDateTime: function (v) {
            if (!v) return "";
            var d = v instanceof Date ? v : new Date(v);
            if (isNaN(d)) return v;
            var dd = String(d.getDate()).padStart(2, "0");
            var mm = String(d.getMonth() + 1).padStart(2, "0");
            var yyyy = d.getFullYear();
            var HH = String(d.getHours()).padStart(2, "0");
            var MM = String(d.getMinutes()).padStart(2, "0");
            return dd + "/" + mm + "/" + yyyy + " " + HH + ":" + MM;
        },
        hasText: function (sText) {
            return !!(sText && sText.trim());
        },
        isTextContent: function (value) {
            return typeof value === "string" && value.trim().length > 0;
        },
        enableSys: function (isAdmin, isSys) {
            return isAdmin && !isSys;
        },
        isImageContent: function (value) {
            return typeof value === "string" && value.startsWith("data:image");
        },
        formatTemplateDownloadVisibility: function (bToggle, bDownloadVis, sKeyTab) {
            if (sKeyTab === "retroDocKey") {
                return false;
            }
            if (!bToggle) {
                return false;
            }
            return !!bDownloadVis;
        },
        mdToHTML: function (mdText) {
            if (mdText == null) {
                return "";
            }
            var src = String(mdText);

            // 1) HTML-escape the whole input first (sanitizeContent="false" on
            //    the HTML control, so we must not let raw HTML through).
            function esc(s) {
                return s
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#39;");
            }

            // 2) Extract fenced code blocks first so their content is preserved
            //    verbatim (ASCII diagrams, code snippets, etc.).
            var codeBlocks = [];
            src = src.replace(/```([a-zA-Z0-9_+\-]*)\n([\s\S]*?)```/g, function (m, lang, code) {
                var token = "\u0000CODEBLOCK" + (codeBlocks.length) + "\u0000";

                // If the fenced block is actually a markdown table → render it as a <table>
                var trimmed = code.replace(/^\s+|\s+$/g, "");
                var firstTwo = trimmed.split(/\r?\n/, 2);
                var sepRe = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/;
                var langOk = !lang || /^(plaintext|text|md|markdown)$/i.test(lang);
                if (langOk && firstTwo.length === 2 &&
                    firstTwo[0].indexOf("|") !== -1 && sepRe.test(firstTwo[1])) {
                    var rows = trimmed.split(/\r?\n/);
                    var splitRow = function (s) {
                        var r = s.trim();
                        if (r.charAt(0) === "|") { r = r.slice(1); }
                        if (r.charAt(r.length - 1) === "|") { r = r.slice(0, -1); }
                        return r.split("|").map(function (c) { return c.trim(); });
                    };
                    var header = splitRow(rows[0]);
                    var body = rows.slice(2).filter(function (r) { return r.trim().length > 0; });
                    var tbl = ['<table class="aiRespTable"><thead><tr>'];
                    header.forEach(function (c) { tbl.push("<th>" + esc(c) + "</th>"); });
                    tbl.push("</tr></thead><tbody>");
                    body.forEach(function (rs) {
                        tbl.push("<tr>");
                        splitRow(rs).forEach(function (c) { tbl.push("<td>" + esc(c) + "</td>"); });
                        tbl.push("</tr>");
                    });
                    tbl.push("</tbody></table>");
                    codeBlocks.push(tbl.join(""));
                    return token;
                }

                codeBlocks.push(
                    '<pre class="aiRespPre"><code' +
                    (lang ? ' class="lang-' + esc(lang) + '"' : "") +
                    ">" + esc(code.replace(/\n$/, "")) + "</code></pre>"
                );
                return token;
            });

            // Now safely escape the remaining text.
            src = esc(src);

            // 3) Inline replacements (work on escaped text, so &lt;/&gt; safe).
            function inline(text) {
                // Links: [label](url)
                text = text.replace(
                    /\[([^\]]+)\]\(([^)\s]+)\)/g,
                    function (m, label, url) {
                        return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + "</a>";
                    }
                );
                // Bold **text** (lazy; allow inner asterisks/whitespace so models like
                // claude-3-haiku & gpt-5 that produce nested or wide bold spans still render)
                text = text.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
                // Bold __text__ (alternative markdown bold; require word boundaries
                // so identifiers like ZSD_CHECK_DEA_NUM are not affected)
                text = text.replace(/(^|[^A-Za-z0-9_])__([^_\n][\s\S]*?[^_\n]|[^_\n])__(?=$|[^A-Za-z0-9_])/g,
                    "$1<strong>$2</strong>");
                // Italic *text* (single asterisk; not adjacent to another asterisk)
                text = text.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");
                // Italic _text_ (single underscore; only with word boundaries to
                // avoid breaking SAP identifiers like ZSD_CHECK_DEA_NUM)
                text = text.replace(/(^|[^A-Za-z0-9_])_([^_\n]+?)_(?=$|[^A-Za-z0-9_])/g,
                    "$1<em>$2</em>");
                // Inline code `code`
                text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
                return text;
            }

            // 4) Block-level parsing line by line.
            var lines = src.split(/\r?\n/);
            var html = [];
            var i = 0;

            function isTableSeparator(s) {
                return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(s);
            }
            function splitRow(s) {
                var r = s.trim();
                if (r.charAt(0) === "|") { r = r.slice(1); }
                if (r.charAt(r.length - 1) === "|") { r = r.slice(0, -1); }
                return r.split("|").map(function (c) { return c.trim(); });
            }

            var paraBuf = [];
            function flushPara() {
                if (paraBuf.length) {
                    html.push("<p>" + inline(paraBuf.join(" ")) + "</p>");
                    paraBuf = [];
                }
            }

            while (i < lines.length) {
                var line = lines[i];

                // Restore code-block placeholder lines as-is.
                if (/\u0000CODEBLOCK\d+\u0000/.test(line)) {
                    flushPara();
                    html.push(line);
                    i++;
                    continue;
                }

                // Blank line -> paragraph break
                if (/^\s*$/.test(line)) {
                    flushPara();
                    i++;
                    continue;
                }

                // Headings  # .. ######
                var mH = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
                if (mH) {
                    flushPara();
                    var lvl = mH[1].length;
                    html.push("<h" + lvl + ">" + inline(mH[2]) + "</h" + lvl + ">");
                    i++;
                    continue;
                }

                // SECTION/PART/APPENDIX/CHAPTER/PHASE/STEP heading (GPT-5 style)
                var mSec = line.match(/^\s*((?:SECTION|PART|APPENDIX|CHAPTER|PHASE|STEP)\s+[\w\d.\-]+(?:\s*[—:\-]\s*.+)?)\s*$/);
                if (mSec) {
                    flushPara();
                    html.push("<h2>" + inline(mSec[1].trim()) + "</h2>");
                    i++;
                    continue;
                }

                // Multi-level numbering (1.1, 1.1.1, ...) is always a heading;
                var mMultiNum = line.match(/^\s*(\d+(?:\.\d+)+)\.?\s+(\S.*?)\s*$/);
                if (mMultiNum && !/[.;!?]\s*$/.test(line)) {
                    flushPara();
                    var depthDots = (mMultiNum[1].match(/\./g) || []).length;
                    var hLvl = Math.min(6, 2 + depthDots); // 1.1 → h3, 1.1.1 → h4
                    html.push("<h" + hLvl + ">" + inline(mMultiNum[1] + " " + mMultiNum[2]) + "</h" + hLvl + ">");
                    i++;
                    continue;
                }
                // Single-level "1. Title" only counts as a heading when the very
                // next non-blank line is a sub-numbered heading like "1.1 ..."
                // (the GPT-5 / outline style).
                var mTopNum = line.match(/^\s*(\d+)\.\s+([A-Z][^\n]{0,200})$/);
                if (mTopNum && !/[.;!?]\s*$/.test(line)) {
                    var lookJ = i + 1;
                    while (lookJ < lines.length && /^\s*$/.test(lines[lookJ])) { lookJ++; }
                    var nextL = (lookJ < lines.length) ? lines[lookJ] : "";
                    var nextIsSubNum = /^\s*\d+(?:\.\d+)+\.?\s+\S/.test(nextL);
                    if (nextIsSubNum) {
                        flushPara();
                        html.push("<h2>" + inline(mTopNum[1] + ". " + mTopNum[2]) + "</h2>");
                        i++;
                        continue;
                    }
                }

                // Horizontal rule
                if (/^\s*([-*_])\s*\1\s*\1[\s\S]*$/.test(line) && line.replace(/[\s*\-_]/g, "") === "") {
                    flushPara();
                    html.push("<hr/>");
                    i++;
                    continue;
                }

                // Pipe table: header | sep | rows...
                if (line.indexOf("|") !== -1 && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
                    flushPara();
                    var header = splitRow(line);
                    i += 2; // skip header + separator
                    var rows = [];
                    while (i < lines.length && lines[i].indexOf("|") !== -1 && !/^\s*$/.test(lines[i])) {
                        rows.push(splitRow(lines[i]));
                        i++;
                    }
                    var tbl = ['<table class="aiRespTable">'];
                    tbl.push("<thead><tr>");
                    header.forEach(function (c) { tbl.push("<th>" + inline(c) + "</th>"); });
                    tbl.push("</tr></thead><tbody>");
                    rows.forEach(function (r) {
                        tbl.push("<tr>");
                        r.forEach(function (c) { tbl.push("<td>" + inline(c) + "</td>"); });
                        tbl.push("</tr>");
                    });
                    tbl.push("</tbody></table>");
                    html.push(tbl.join(""));
                    continue;
                }

                // List-item "Label:" prefix → bold the label so GPT-5 / Haiku bullets like
                function boldLabelPrefix(itemText) {
                    if (/^\*\*/.test(itemText)) { return itemText; } // already bolded
                    var m = itemText.match(/^([A-Za-z][A-Za-z0-9 ()\/&\-]{0,60}):\s+(.+)$/);
                    if (m) { return "**" + m[1] + ":** " + m[2]; }
                    return itemText;
                }

                // Unordered list
                if (/^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/.test(line)) {
                    flushPara();
                    html.push("<ul>");
                    while (i < lines.length && /^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/.test(lines[i])) {
                        var item = lines[i].replace(/^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/, "");
                        item = boldLabelPrefix(item);
                        html.push("<li>" + inline(item) + "</li>");
                        i++;
                    }
                    html.push("</ul>");
                    continue;
                }

                // Ordered list
                if (/^\s*\d+[\.\)]\s+/.test(line)) {
                    flushPara();
                    var startNum = parseInt(line.match(/^\s*(\d+)/)[1], 10) || 1;
                    html.push('<ol start="' + startNum + '">');
                    while (i < lines.length) {
                        if (/^\s*$/.test(lines[i]) &&
                            i + 1 < lines.length && /^\s*\d+[\.\)]\s+/.test(lines[i + 1])) {
                            i++; continue;
                        }
                        if (!/^\s*\d+[\.\)]\s+/.test(lines[i])) break;
                        var item2 = lines[i].replace(/^\s*\d+[\.\)]\s+/, "");
                        item2 = boldLabelPrefix(item2);
                        html.push("<li>" + inline(item2) + "</li>");
                        i++;
                    }
                    html.push("</ol>");
                    continue;
                }

                // "Label1: val1 Label2: val2 Label3: val3 …" → split into one <p> per pair (GPT-5 style)
                var labelMatches = line.match(/[A-Z][A-Za-z][A-Za-z0-9 \/\-]{1,40}:/g);
                if (labelMatches && labelMatches.length >= 3) {
                    flushPara();
                    var splitRe = /\s+(?=[A-Z][A-Za-z][A-Za-z0-9 \/\-]{1,40}:\s)/g;
                    line.split(splitRe).forEach(function (seg) {
                        seg = seg.trim();
                        if (!seg) { return; }
                        var idx = seg.indexOf(":");
                        if (idx > -1) {
                            html.push("<p><strong>" + inline(seg.slice(0, idx + 1)) + "</strong>"
                                + inline(seg.slice(idx + 1)) + "</p>");
                        } else {
                            html.push("<p>" + inline(seg) + "</p>");
                        }
                    });
                    i++;
                    continue;
                }

                // "Label:" heading (Haiku / Claude / GPT style):
                // A short Title-Case line ending with ":" that is immediately
                if (paraBuf.length === 0 &&
                    /^\s*[A-Z][A-Za-z0-9 \/&()\-]{0,99}:\s*$/.test(line) &&
                    !/[*_`#|]/.test(line)) {
                    var k0 = i + 1;
                    while (k0 < lines.length && /^\s*$/.test(lines[k0])) { k0++; }
                    var nextLn0 = (k0 < lines.length) ? lines[k0] : "";
                    var nextIsListLbl = /^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/.test(nextLn0) ||
                                        /^\s*\d+[\.\)]\s+/.test(nextLn0);
                    var wordCountLbl = line.trim().replace(/:$/, "").split(/\s+/).length;
                    if (nextIsListLbl && wordCountLbl >= 1) {
                        flushPara();
                        html.push("<h3>" + inline(line.trim()) + "</h3>");
                        i++;
                        continue;
                    }
                }

                // Bare-text section heading (GPT-5 / GPT-5-mini style):
                // A short Title-Case line with no terminal punctuation, no markdown
                if (paraBuf.length === 0 &&
                    /^\s*[A-Z][^\n]{0,79}$/.test(line) &&
                    !/[.,;:!?]\s*$/.test(line) &&
                    !/[*_`#|]/.test(line) &&
                    !/^\s*\d+[\.\)]\s+/.test(line) &&
                    !/^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/.test(line)) {
                    // Look ahead: skip blank lines, then check the next non-blank line
                    var j = i + 1;
                    while (j < lines.length && /^\s*$/.test(lines[j])) { j++; }
                    var nextLine = (j < lines.length) ? lines[j] : "";
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
                        html.push("<h3>" + inline(line.trim()) + "</h3>");
                        i++;
                        continue;
                    }
                }

                // Default: accumulate paragraph text
                paraBuf.push(line.trim());
                i++;
            }
            flushPara();

            var out = html.join("\n");

            // 5) Restore code-block placeholders.
            out = out.replace(/\u0000CODEBLOCK(\d+)\u0000/g, function (m, idx) {
                return codeBlocks[parseInt(idx, 10)] || "";
            });
            return '<div class="aiRespMd">' + out + "</div>";
        },
    };
});