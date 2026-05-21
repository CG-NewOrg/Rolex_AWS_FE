sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "aicockpitfeq/model/models",
    "aicockpitfeq/util/Utility",
    "sap/f/library",
    "sap/ui/core/BusyIndicator",
    "../model/formatter",
    'sap/m/MessageBox',
    'sap/m/MessageToast',
    'aicockpitfeq/util/PdfUtil'
], function (Controller, models, Utility, fioriLibrary, BusyIndicator, formatter, MessageBox, MessageToast, PdfUtil) {
    "use strict";

    return Controller.extend("aicockpitfeq.controller.DetailDetail", {
        formatter: formatter,
        onInit: function () {

            var oOwnerComponent = this.getOwnerComponent();

            this.oRouter = oOwnerComponent.getRouter();
            this.oModel = oOwnerComponent.getModel();
            // Set base path for cockpit calls
var sComponentName = this.getOwnerComponent().getManifestObject().getComponentName();
this._sBasePath = sap.ui.require.toUrl(sComponentName.replace(/\./g, "/"));
            this.getView().byId("aiResponsePanel").setVisible(false);
            this.keytobeSet = "";
            this.airespText = "";
            this.oRouter.getRoute("DetailDetail").attachPatternMatched(this._onPatternMatch, this);


        },

        _onPatternMatch: function (oEvent) {
            this.keytobeSet = oEvent.getParameter("arguments").dispKey;
            this.getView().byId("cdGenInitText").setVisible(false);
            this.getView().byId("codeGenCitation").setVisible(false);
            //total height of screen
            const oTA = this.byId("dyID");
            const oContainer = oTA.$();   // container DOM
            const containerHeight = oContainer.height();

            const txtArea = this.byId("aiRespTxtArea");
            const oContTxtArea = txtArea.getParent().$();
            const TxtAreaHeight = oContTxtArea.height();

            ///footer height
            const footerSection = this.byId("footerOverFlow");
            const footerlineHeight = parseInt(footerSection.$().css("height"), 10);

            ////header content height
            const oHA = this.byId("headerHboxDetDet");
            const oContainerHa = oHA.$();
            const containerHeightHa = oContainerHa.height();

            //spacing is 2.5 rem ~~ 40 px
            var spacing = 2 * 40;

            var remH = containerHeight - footerlineHeight - containerHeightHa - spacing;
            ///line height is 1.5 rem which is 24 px;
            var lineHeight = 24;
            var totalLines = Math.floor(remH / lineHeight);
          
            txtArea.setGrowingMaxLines(totalLines + 1);

            var name = "";
            var settokentxt = "";

            var selectedAI = oEvent.getParameter("arguments").aimodel;
            var tokenData = this.getView().getModel("TokenLimit").oData;
            var tokenUsed = tokenData.usedToken;
            var secondMod = {
                selAI: selectedAI,
                toknUsd: tokenUsed,
                toknData: tokenData,
                keyTab: this.keytobeSet
            };
            var secondGoMod = new sap.ui.model.json.JSONModel(secondMod);
            this.getView().setModel(secondGoMod, "secondGoMod");

            this.getView().byId("aiResponsePanel").setVisible(true);
            this.getView().byId("gitPushBtn").setVisible(false);
            switch (this.keytobeSet) {
                case "DocGen":
                    name = "Document Generation";
                    settokentxt = tokenUsed + "/" + tokenData.User[selectedAI].TotalToken;
                    break;
                case "bdPMO":
                    name = "Business discussion/PMO";
                    settokentxt = tokenUsed + "/" + tokenData.BS[selectedAI].TotalToken;
                    break;
                case "usrCr":
                    name = "User Story Creation";
                    settokentxt = tokenUsed + "/" + tokenData.User[selectedAI].TotalToken;
                    break;
                case "fcFSD":
                    name = "Functional Configuration/FSD";
                    settokentxt = tokenUsed + "/" + tokenData.fstoconf[selectedAI].TotalToken;
                    break;
                case "osdTSD":
                    name = "Technical Specification";
                    settokentxt = tokenUsed + "/" + tokenData.fstots[selectedAI].TotalToken;
                    break;
                case "cdGen":
                    name = "Code Generation";
                    settokentxt = tokenUsed + "/" + tokenData.tstocode[selectedAI].TotalToken;
                    break;
                case "cdRem":
                    name = "Code Remediation";
                    settokentxt = tokenUsed + "/" + tokenData.coderem[selectedAI].TotalToken;
                    break;
                case "cdSum":
                    name = "Code Summary";
                    settokentxt = tokenUsed + "/" + tokenData.codesum[selectedAI].TotalToken;
                    break;

                case "gitKey":
                    name = "Git Integration";
                    settokentxt = tokenUsed + "/" + tokenData.tstocodeGit[selectedAI].TotalToken;
                    this.getView().byId("gitPushBtn").setVisible(true);
                    break;
                case "tutKey":
                    name = "Technical Unit Testing";
                    settokentxt = tokenUsed + "/" + tokenData.TUT[selectedAI].TotalToken;
                    break;
                case "bpmKey":
                    name = "Business Process Model";
                    settokentxt = tokenUsed + "/" + tokenData.TUT[selectedAI].TotalToken;
                    break;
                case "tcgKey":
                    name = "Test Case Generation";
                    settokentxt = tokenUsed + "/" + tokenData.TUT[selectedAI].TotalToken;
                    break;
                case "pctKey":
                    name = "Process Cycle Test";
                    settokentxt = tokenUsed + "/" + tokenData.TUT[selectedAI].TotalToken;
                    break;
            }

            var finalKeyGotten = { bindKey: name };
            var bindKeyVal = new sap.ui.model.json.JSONModel(finalKeyGotten);
            this.getView().setModel(bindKeyVal, "bindKeyVal");

            var ragModel = this.getOwnerComponent().getModel("ragModel");

            var isRagOn = ragModel.getProperty("/currentRagEnabled");
            if (this.keytobeSet == "cdGen" && isRagOn == false) {
              
                this.getView().byId("cdGenInitText").setVisible(true);
                this.getView().byId("multipleCodeEd").setVisible(true);
                this.getView().byId("codeGenCitation").setVisible(true);
                this.getView().byId("aiResponsePanel").setVisible(false);
            }

        },
        openHistory: async function () {
            var histM = this.getOwnerComponent().getModel("historyModel");
            this.getView().setModel(histM, "histM");
            BusyIndicator.show();
            if (!this.histFrg) {
                this.histFrg = await this.loadFragment({
                      name: "aicockpitfeq.fragment.HistoryFrg"
                }).then(function (oDialog) {
                    this.histFrg = oDialog;
                    oDialog.open();
                    BusyIndicator.hide();
                }.bind(this));
            } else {
                BusyIndicator.hide();
            }
        },
        _addToHistoryLogGeneric: function (sText, sLogKey) {
            var oModel = this.getView().getModel("historyModel");
            var aHistoryLog = oModel.getProperty(sLogKey) || [];

            if (aHistoryLog.length === 0) {
                aHistoryLog.push({ text: "" });
            }

            aHistoryLog.unshift({ text: sText });
            oModel.setProperty(sLogKey, aHistoryLog);
        },
        onCopy: function () {
            ///unused function
            this.airespText = this.getOwnerComponent().getModel("airesponseDetailModel").oData.resp;
        },

        histExport: function () {
            // Export history log using jsPDF via PdfUtil
            var histData = this.getView().getModel("histM")?.oData || [];
            var lines = [];

            for (var i = 0; i < histData.length; i++) {
                var promptPart = String(histData[i].promptHistory || "");
                var respPart = String(histData[i].aiResponseHistory || "");
                lines.push("Prompt:");
                lines.push(promptPart);
                lines.push("AI Response:");
                lines.push(respPart);
                lines.push(""); // blank separator
            }

            if (PdfUtil && PdfUtil.isAvailable()) {
                PdfUtil.createSimplePdf("History.pdf", lines);
            } else {
                sap.m.MessageToast.show("jsPDF not loaded. Ensure lib/jspdf.umd.min.js is included.");
            }
        },

         onDownloadPDF: function () {
            // Replace pdfmake with jsPDF export via PdfUtil (CSP-safe)
            var sSysMsg = this.getOwnerComponent().getModel("airesponseDetailModel").getProperty("/sysMsg") || "";
            var aiModelData = this.getOwnerComponent().getModel("airesponseDetailModel").oData || {};
            var lines = [];

            lines.push("System Message");
            lines.push("");
            lines.push(String(sSysMsg));
            lines.push("");
            lines.push("AI RESPONSE:");

            if (this.keytobeSet === "cdGen") {
                var multi = this.getView().getModel("airesponseDetailModel").getProperty("/multiCE") || [];
                for (var c = 0; c < multi.length; c++) {
                    var t = String(multi[c].textData || "");
                    var code = String(multi[c].codeData || "");
                    if (t) { lines.push(t); }
                    if (code) { lines.push(code); }
                }
            } else {
                lines.push(String(aiModelData.resp || ""));
            }

            var fileName = "Gen AI " + this.selectedTab() + ".pdf";
            if (PdfUtil && PdfUtil.isAvailable()) {
                PdfUtil.createSimplePdf(fileName, lines);
            } else {
                sap.m.MessageToast.show("jsPDF not loaded. Ensure lib/jspdf.umd.min.js is included.");
            }
        },
        selectedTab: function () {
            var name = "";
            switch (this.keytobeSet) {
                case "DocGen":
                    name = "Document Generation";
                    break;
                case "bdPMO":
                    name = "Business discussion/PMO";
                    break;
                case "usrCr":
                    name = "User Story Creation";
                    break;
                case "fcFSD":
                    name = "Functional Configuration/FSD";
                    break;
                case "osdTSD":
                    name = "Technical Specification";
                    break;
                case "cdGen":
                    name = "Code Generation";
                    break;
                case "cdRem":
                    name = "Code Remediation";
                    break;
                case "cdSum":
                    name = "Code Summary";
                    break;
                case "gitKey":
                    name = "Git Integration";
                    break;
                case "tutKey":
                    name = "Technical Unit Testing";
                    break;
                case "tcgKey":
                    name = "TCG";
                    break;
                case "pctKey":
                    name = "PCT";
                    break;
                case "bpmKey":
                    name = "BPM";
                    break;

            }
            return name;
        },
           
        generateWordContent: function () {
            const {
                AlignmentType,
                HeadingLevel,
                TextRun,
                Paragraph,
                Table,
                TableRow,
                TableCell,
                WidthType,
                Document,
                Packer,
                Numbering
            } = window.docx;
            if (!docx) {
                sap.m.MessageBox.information("Libraries not loaded");
                return;
            }
            const doc = new Document({
                styles: {
                    default: {
                        document: {
                            run: { font: "Calibri", size: 24 },
                            paragraph: { spacing: { line: 276 } }
                        }
                    }
                },

                sections: []
            });

            const sSelectedIconTab = this.selectedTab();
            const oResponseModel = this.getView().getModel("responseModel");

            var content = this.getView().byId("aiRespTxtArea").getValue();
            const docContent = content.split("\n");
            let finalContent = [];

            finalContent.push(new Paragraph({
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                children: [
                    new TextRun({ text: "AI Response", bold: true, size: 36 })
                ]
            }));

            let insideTable = false;
            let currentTableRows = [];

            ///gpt5 changes start
            function sanitizeMarkdown(text) {
                if (!text || typeof text !== "string") return text;
                return text
                    .replace(/\*\*(.*?)\*\*/g, "$1")
                    .replace(/\*(.*?)\*/g, "$1");
            }
            function isDecimalSectionHeading(text) {
                const m = text.match(/^(\d+(?:\.\d+)*)\.\s+(.+)$/);
                return m ? m[0] : null;
            }
            function splitNumberedLabel(text) {
                const m = text.match(/^(\d+\s*[\)\.\-]?\s*[^:]+:)(.*)$/);
                if (!m) return null;
                return { prefix: m[1], remainder: m[2] || "" };
            }
            function splitBoldBeforeColon(text, withDash = false) {
                const idx = text.indexOf(":");
                if (idx === -1) {
                    return [new TextRun({ text: (withDash ? "- " : "") + text })];
                }
                return [
                    new TextRun({
                        text: (withDash ? "- " : "") + text.slice(0, idx + 1),
                        bold: true
                    }),
                    new TextRun({ text: text.slice(idx + 1) })
                ];
            }
            function normalizeBullet(text) {
                return text.replace(/^[•●∙‣▸►▪]\s*/, "- ");
            }

           
            docContent.forEach((rawText, index) => {
                if (!rawText || typeof rawText !== "string") return;
                /////let text = rawText.trim();
                let text = sanitizeMarkdown(rawText.trim());
                const nextLine = docContent[index + 1]?.trim() || "";
                const decHeading = isDecimalSectionHeading(text);
                if (decHeading) {
                    finalContent.push(
                        new Paragraph({
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 300, after: 150 },
                            children: [
                                new TextRun({
                                    text: decHeading,
                                    bold: true,
                                    size: 30,
                                    color: "1F4E79"
                                })
                            ]
                        })
                    );
                    return;
                }

                if (
                    /^[A-Za-z][A-Za-z0-9 ()/-]{3,120}$/.test(text) &&
                    nextLine.startsWith("- ")
                ) {
                    finalContent.push(
                        new Paragraph({
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 300, after: 150 },
                            children: [
                                new TextRun({ text, bold: true, size: 30 })
                            ]
                        })
                    );
                    return;
                }

                if (/^[A-Z][A-Za-z0-9 ()/-]{3,80}:$/.test(text)) {
                    finalContent.push(
                        new Paragraph({
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 300, after: 150 },
                            children: [
                                new TextRun({
                                    text: text.replace(/:$/, ""),
                                    bold: true,
                                    size: 30
                                })
                            ]
                        })
                    );
                    return;
                }

                const labeled = splitNumberedLabel(text);
                if (labeled) {
                    finalContent.push(
                        new Paragraph({
                            spacing: { before: 150, after: 120 },
                            children: [
                                new TextRun({
                                    text: labeled.prefix,
                                    bold: true,
                                    color: "1F4E79",
                                    size: 26
                                }),
                                new TextRun({ text: labeled.remainder })
                            ]
                        })
                    );
                    return;
                }

                text = normalizeBullet(text);
                ////gpt5 changes end
                if (text.startsWith("#### ")) {
                    finalContent.push(new Paragraph({
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 300, after: 150 },
                        children: [new TextRun({ text: text.slice(5), bold: true, size: 26 })]
                    }));
                } else if (text.startsWith("### ")) {
                    finalContent.push(new Paragraph({
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 300, after: 150 },
                        children: [new TextRun({ text: text.slice(4), bold: true, size: 26 })]
                    }));
                } else if (text.startsWith("## ")) {
                    finalContent.push(new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 300, after: 150 },
                        children: [new TextRun({ text: text.slice(3), bold: true, size: 30 })]
                    }));
                } else if (text.startsWith("# ")) {
                    finalContent.push(new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400, after: 200 },
                        children: [new TextRun({ text: text.slice(2), bold: true, size: 32 })]
                    }));
                } else if (text.startsWith("- ") && (text.match(/\|/g) || []).length >= 2) {
                    // GPT-5 style: bullet point with pipe separators (e.g., "- Col1 | Col2 | Col3")
                    // Treat as table row - remove the leading "- " and process as table
                    const tableRow = text.slice(2).trim();
                    insideTable = true;
                    currentTableRows.push(tableRow);
                } else if (text.startsWith("- ")) {
                    // Regular bullet point (not a table row)
                    const bulletText = text.slice(2);
                    finalContent.push(
                        new Paragraph({
                            spacing: { after: 120 },
                            children: bulletText.includes(":")
                                ? splitBoldBeforeColon(bulletText, true)
                                : [new TextRun({ text: "- " + bulletText })]
                        })
                    );
                } else if (/^\s*\|?.+\|.+/.test(text)) {
                    insideTable = true;
                    currentTableRows.push(text);
                } else if (insideTable && text.includes("|")) {
                    currentTableRows.push(text);
                } else {
                    if (insideTable && currentTableRows.length > 0) {
                        const table = parseMarkdownTable(currentTableRows);
                        if (table) finalContent.push(table);
                        currentTableRows = [];
                        insideTable = false;
                    }

                    finalContent.push(new Paragraph({
                        spacing: { after: 200 },
                        children: parseText(text)
                    }));
                }
            });

            if (insideTable && currentTableRows.length > 0) {
                const table = parseMarkdownTable(currentTableRows);
                if (table) finalContent.push(table);
            }

            doc.addSection({
                properties: {},
                children: finalContent,

            });
            function mergeBrokenTableRows(rows) {
                const merged = [];
                let currentRow = "";
                let headerPipeCount = 0;

                const cleanRow = (row) =>
                    row
                        .replace(/\t/g, "|")        // tabs → pipes
                        .replace(/\s{2,}/g, " ")    // normalize spaces
                        .trim();

                rows.forEach((line, index) => {
                    const cleaned = cleanRow(line);

                    // Skip separator lines (e.g., |---|---|, |:---:|:---:|, etc.)
                    if (/^[\s|:\-]+$/.test(cleaned) && cleaned.includes("-")) return;

                    if (index === 0) {
                        merged.push(cleaned);
                        // Count pipes in header to determine expected column count
                        headerPipeCount = (cleaned.match(/\|/g) || []).length;
                        return;
                    }

                    const pipeCount = (cleaned.match(/\|/g) || []).length;
                    // Use dynamic threshold: at least 60% of header pipes, minimum 1
                    const threshold = Math.max(1, Math.floor(headerPipeCount * 0.6));

                    if (pipeCount >= threshold) {
                        if (currentRow) merged.push(currentRow);
                        currentRow = cleaned;
                    } else if (cleaned.includes("|")) {
                        // Row has some pipes but not enough - might be continuation
                        currentRow += " | " + cleaned;
                    } else if (currentRow) {
                        // No pipes - append as continuation text
                        currentRow += " " + cleaned;
                    }
                });

                if (currentRow) merged.push(currentRow);

                return merged;
            }

            function parseMarkdownTable(rows) {
                // Filter out empty rows first
                rows = rows.filter(r => r && r.trim());

                if (rows.length < 2) return null;

                // Check if this looks like a table (has pipes)
                const hasTableStructure = rows.some(r => r.includes("|"));
                if (!hasTableStructure) return null;

                rows = mergeBrokenTableRows(rows);

                if (rows.length < 2) return null;

                const splitRow = (row) =>
                    row
                        .replace(/\t/g, "|")      // handle tab-based tables
                        .replace(/^\|+/, "")      // remove leading pipes
                        .replace(/\|+$/, "")      // remove trailing pipes
                        .split("|")
                        .map(cell => cell.trim());

                // header
                const header = splitRow(rows[0]);

                // Validate header has actual content
                if (header.length === 0 || header.every(h => !h)) return null;

                // body (skip separator line - improved detection for various formats)
                const body = rows
                    .slice(1)
                    .filter(r => {
                        const clean = r.replace(/\t/g, "").trim();
                        // Skip empty lines
                        if (!clean) return false;
                        // Skip separator lines (various formats: |---|, :---:, |:--:|, |----|, etc.)
                        if (/^[\s|:\-]+$/.test(clean)) return false;
                        // Skip lines that are only dashes, pipes, colons, and spaces
                        if (/^[-|:\s]+$/.test(clean) && clean.includes("-")) return false;
                        return true;
                    })
                    .map(splitRow);

                // If no body rows after filtering, return null
                if (body.length === 0) return null;

                // normalize columns
                const colCount = header.length;

                const normalizedBody = body.map(row => {
                    if (row.length < colCount) {
                        return [...row, ...Array(colCount - row.length).fill("")];
                    }
                    if (row.length > colCount) {
                        return row.slice(0, colCount);
                    }
                    return row;
                });

                // Calculate column width
                const colWidth = Math.floor(100 / colCount);

                return new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: header.map(cell => new TableCell({
                                width: { size: colWidth, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: "single", size: 1, color: "000000" },
                                    bottom: { style: "single", size: 1, color: "000000" },
                                    left: { style: "single", size: 1, color: "000000" },
                                    right: { style: "single", size: 1, color: "000000" }
                                },
                                children: [new Paragraph({
                                    children: parseText(sanitizeMarkdown(cell))
                                })]
                            }))
                        }),
                        ...normalizedBody.map(row => new TableRow({
                            children: row.map(cell => new TableCell({
                                width: { size: colWidth, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: "single", size: 1, color: "000000" },
                                    bottom: { style: "single", size: 1, color: "000000" },
                                    left: { style: "single", size: 1, color: "000000" },
                                    right: { style: "single", size: 1, color: "000000" }
                                },
                                children: [new Paragraph({
                                    children: parseText(sanitizeMarkdown(cell))
                                })]
                            }))
                        }))
                    ]
                });
            }

            function parseText(text) {
                return [new TextRun({ text })];
            }
            Packer.toBlob(doc).then(blob => {
                sap.ui.core.util.File.save(blob, "GenAI_Doc_"+ this.selectedTab(), "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            });
        },

        syncH: function () {
            // Get FCL and View1
            var oAppView = this.getOwnerComponent().byId("App");
            var oFCL = oAppView.byId("flexibleColumnLayout");
            var oView1 = oFCL.getBeginColumnPages()[0];  // XMLView with View1

            // 1) Clear detail model data
            var oDetailModel = this.getOwnerComponent().getModel("airesponseDetailModel");
            if (oDetailModel) {
                oDetailModel.setProperty("/resp", "");
                oDetailModel.setProperty("/sysMsg", "");
                oDetailModel.setProperty("/beforeResult", "");
                oDetailModel.setProperty("/codeResult", "");
                oDetailModel.setProperty("/afterResult", "");
                oDetailModel.refresh();
            }

            // Hide AI panel in DetailDetail itself
            if (this.getView().byId("aiResponsePanel")) {
                this.getView().byId("aiResponsePanel").setVisible(false);
            }

            // 2) Reset hasDetail flag for this tab in View1's tabState
            var oView1Controller = oView1 && oView1.getController && oView1.getController();
            if (oView1Controller) {
                var oTabStateModel = oView1Controller.getView().getModel("tabState");
                oView1Controller.executedOnce = false;
                if (oTabStateModel) {
                    //var oTabs = oTabStateModel.getProperty("/tabs") || {};
                    // keytobeSet is filled in _onPatternMatch with the dispKey (bdPMO, usrCr, etc.)
                    var oTabs = oTabStateModel.getProperty("/tabs") || {};
                    var sKey = this.keytobeSet;
                    if (oTabs[sKey]) {
                        oTabs[sKey].hasDetail = false;
                        oTabs[sKey].detailResp = "";
                        oTabs[sKey].detailSys = "";
                        oTabStateModel.setProperty("/tabs", oTabs);
                    }


                }

                // 3) Clear only View1 fields via its onRefresh, if available
                if (oView1Controller.onRefresh) {
                    oView1Controller.onRefresh();
                }
            }

            // 4) Back to single-column layout
            this.oRouter.navTo("RouteView1", {tabName: this.keytobeSet,
                layout: fioriLibrary.LayoutType.OneColumn
            });
        },
        closeHistory: function () {
            for (var i = 0; i < this.getView().getDependents().length; i++) {
                if (this.getView().getDependents()[i].mProperties.title == "History") {
                    this.getView().getDependents()[i].close();
                }
            }
        },
        openCommitMsg: async function () {
            var that = this;
            var setTitleofDialog = this.getOwnerComponent().getModel("gitModel").getProperty("/gitCommit");
            var existingFileName = this.getOwnerComponent().getModel("gitModel").getProperty("/filePath");
            var selectedBranchforComm=this.getOwnerComponent().getModel("gitModel").getProperty("/selectedBranch");
            if (!this.gitFrg) {
                this.gitFrg = await this.loadFragment({
                    name: "aicockpitfeq.fragment.addGitDetails"
                }).then(function (oDialog) {
                    this.gitFrg = oDialog;
                    this.gitFrg.attachBrowserEvent("keydown", function (oEvent) {
                        if (oEvent.key === "Escape") {
                            oEvent.stopPropagation();
                            oEvent.preventDefault();
                        }
                    });
                    this.getView().byId("gitCommit").setVisible(true);
                    // this.getView().byId("fileNameCustom").setEnabled(existingFileName !== "" ? false : true);
                    // var getEn=this.getView().byId("fileNameCustom").getEnabled();
                    this.getView().byId("fileNameCustom").setValue(existingFileName ? existingFileName : "");
                    this.getView().byId("branchNameInput").setValue(selectedBranchforComm ? selectedBranchforComm : "");
                    this.getView().byId("gitInfo").setVisible(false);
                    this.getView().byId("commitGitBtn").setVisible(true);
                    this.getView().byId("getBranchBtn").setVisible(false);
                    this.getView().byId("gitDialog").setTitle(setTitleofDialog);
                    oDialog.open();
                }.bind(this));
            } else {

            }
        },
        onCommitMessageConfirm: function () {

            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sCommitMessage = this.getView().byId("commitMessageInput").getValue();
            this.getOwnerComponent().getModel("gitModel").setProperty("/commitMessage", sCommitMessage);
            var sBranchName = this.getView().byId("branchNameInput").getValue();
            this.getOwnerComponent().getModel("gitModel").setProperty("/branchName", sBranchName);
            // var custFileNameEn = this.getView().byId("fileNameCustom").getEnabled();
            var fileName = this.getView().byId("fileNameCustom").getValue();
            /////////payload, "userName": this.getOwnerComponent().getModel("gitModel").getProperty("/username")
            if (sCommitMessage == "" || sBranchName == "" || fileName == "") {
                MessageBox.error(oBundle.getText("missingGitDetails"));
            } else {
                var sUpdatedCode = this.getOwnerComponent().getModel("airesponseDetailModel").oData.resp;
                var filePathVal = fileName;
                var busyDialog = new sap.m.BusyDialog();
                busyDialog.open();
                var sendPayload = JSON.stringify({
                    payload: {
                        "filePath": filePathVal,
                        "content": sUpdatedCode,
                        "commitMsg": sCommitMessage,
                        "branchName": sBranchName,
                        "emailId": this.getOwnerComponent().getModel("gitModel").getProperty("/emailId"),
                        "targetBranch": this.getView().getModel("gitModel").getProperty("/selectedBranch"),
                        repo: this.getOwnerComponent().getModel("gitModel").getProperty("/repoUrl"),
                        username: this.getOwnerComponent().getModel("gitModel").getProperty("/username"),
                        token: this.getOwnerComponent().getModel("gitModel").getProperty("/patToken")
                    }
                });
                $.ajax({
                    url: this._sBasePath + '/cockpit/pushFileToGit',
                    type: "POST",
                    contentType: "application/json",
                    data: sendPayload,
                    success: function (response) {
                        busyDialog.close();
                        sap.m.MessageToast.show(oBundle.getText("successPushToGit"));
                        //  MessageBox.information(oBundle.getText("successPushToGit"));
                    }.bind(this),
                    error: function (error) {
                        busyDialog.close();
                        MessageBox.information(oBundle.getText("warningFailedtoPush"));
                        console.error(JSON.parse(error.responseText).error.message);
                    }
                });
                this.closeSysKeyFr();
            }
        },
        closeSysKeyFr: function () {
            var aDependents = this.getView().getDependents();

            aDependents.forEach(function (oDependent) {
                if (oDependent.isOpen && oDependent.isOpen()) {
                    oDependent.close();
                }

                if (oDependent instanceof sap.m.Dialog || oDependent.isA("sap.ui.core.Fragment")) {
                    oDependent.destroy();
                }
            });
        },
        onCopyCode: function (eve) {
            var allResp = this.getView().getModel("airesponseDetailModel").getProperty("/multiCE");
            var sCode = "";
            var selectedEditorNum = eve.oSource.mAggregations.layoutData.oPropagatedProperties.oBindingContexts.airesponseDetailModel.sPath.split("/multiCE/")[1]
            for (var l = 0; l < allResp.length; l++) {
                if (selectedEditorNum == l) {
                    sCode = allResp[l].codeData;
                }
            }
            navigator.clipboard.writeText(sCode).then(() => {
                sap.m.MessageToast.show("Code copied to clipboard!");
            }).catch(() => {
                sap.m.MessageToast.show("Failed to copy code.");
            });

        },

            onExportTemplate: function () {
            var that = this;
            const oModel = this.getView().getModel("airesponseDetailModel");
            const sContent = oModel.getProperty("/resp");
            const templateKey = oModel.getProperty("/templateKey");
            
            if (!sContent) {
                sap.m.MessageBox.warning("No AI content available");
                return;
            }
            if (!templateKey) {
                sap.m.MessageBox.warning("Please select or upload a template first");
                return;
            }

            const payload = {
                content: sContent,
                templateKey: templateKey,
                tabName: that.selectedTab()
            };

            $.ajax({
                url: this._sBasePath + "/cockpit/generateDocument",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),
                xhrFields: {
                    responseType: "blob"
                },

                success: function (blob, status, xhr) {
                    let fileName = "Template.docx";
                    const disposition = xhr.getResponseHeader("Content-Disposition");

                    if (disposition && disposition.indexOf("filename=") !== -1) {
                        fileName = disposition
                            .split("filename=")[1]
                            .replace(/"/g, "");
                    }

                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = fileName;

                    document.body.appendChild(a);
                    a.click();

                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                },

                error: function (xhr) {
                    sap.ui.core.BusyIndicator.hide();
                    let message = "Document generation failed";
                    try {
                        const err = JSON.parse(xhr.responseText);
                        message = err.error || message;
                    } catch (e) { }

                    sap.m.MessageBox.error(message);
                }
            });
        }
       
    });
});