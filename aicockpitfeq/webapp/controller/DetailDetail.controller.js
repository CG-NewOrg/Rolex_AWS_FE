sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "aicockpitfeq/model/models",
    "aicockpitfeq/util/Utility",
    "sap/f/library",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/util/File",
    "../model/formatter",
    'sap/m/MessageBox',
    'sap/m/MessageToast',
    'aicockpitfeq/util/PdfUtil'
], function (Controller, models, Utility, fioriLibrary, BusyIndicator, FileUtil, formatter, MessageBox, MessageToast, PdfUtil) {
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
            // Propagate viewModel from View1 so bindings like viewModel>/useMCP work here
            try {
                var oAppView = this.getOwnerComponent().byId("App");
                var oFCL = oAppView.byId("flexibleColumnLayout");
                var oView1 = oFCL.getBeginColumnPages()[0];
                if (oView1) {
                    var oVM = oView1.getModel("viewModel");
                    if (oVM) {
                        this.getView().setModel(oVM, "viewModel");
                    }
                    // Propagate the View1 default (unnamed) JSONModel that
                    // holds Retro Documentation pipeline state (downloadItems,
                    // logEntries, agentSteps, downloadPanelVisible, etc.).
                    var oDefault = oView1.getModel();
                    if (oDefault) {
                        this.getView().setModel(oDefault);
                    }
                    // Also propagate the retroDocModel so any bindings
                    // referencing retroDocModel>/... resolve here too.
                    var oRetro = oView1.getModel("retroDocModel");
                    if (oRetro) {
                        this.getView().setModel(oRetro, "retroDocModel");
                    }
                }
            } catch (e) { /* viewModel propagation best-effort */ }
            this.keytobeSet = oEvent.getParameter("arguments").dispKey;
            this.getView().byId("cdGenInitText").setVisible(false);
            this.getView().byId("codeGenCitation").setVisible(false);
            this.getView().byId("multipleCodeEd").setVisible(false);
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
                case "retroDocKey":
                    name = "Retro Documentation";
                    settokentxt = "";
                    this.getView().byId("tokenHBox").setVisible(false);
                    this.getView().byId("aiResponsePanel").setVisible(false);
                    try {
                        var oDetailMod = this.getOwnerComponent().getModel("airesponseDetailModel");
                        if (oDetailMod) {
                            oDetailMod.setProperty("/tsVisible", false);
                            oDetailMod.setProperty("/fsVisible", false);
                            oDetailMod.setProperty("/codeEdVis", false);
                            oDetailMod.setProperty("/multiCE", []);
                        }
                    } catch (e) { /* best-effort */ }
                    try {
                        var oOwnerCmp = this.getOwnerComponent();
                        var oAppViewPF = oOwnerCmp && oOwnerCmp.byId("App");
                        var oFCLPF = oAppViewPF && oAppViewPF.byId("flexibleColumnLayout");
                        if (oFCLPF) {
                            var aBeginPgs = oFCLPF.getBeginColumnPages ? oFCLPF.getBeginColumnPages() : [];
                            if (aBeginPgs && aBeginPgs.length) {
                                var oV1Page = aBeginPgs[0];
                                var oV1Ctrl = oV1Page && oV1Page.getController && oV1Page.getController();
                                if (oV1Ctrl && typeof oV1Ctrl._replayRetroProcessFlowFromLog === "function") {
                                    setTimeout(function () {
                                        oV1Ctrl._replayRetroProcessFlowFromLog();
                                    }, 150);
                                }
                            }
                        }
                    } catch (ePF) { /* best-effort */ }
                    break;
            }
            const oPushBtn = this.byId("pushToS4Btn");

            if (oPushBtn) {
                const bShowPushBtn = this.keytobeSet !== "retroDocKey";

                oPushBtn.setVisible(bShowPushBtn);
                oPushBtn.setEnabled(bShowPushBtn);
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
                this.histFrg.open();
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


            PdfUtil.createSimplePdf("History.pdf", lines);


        },

        onDownloadPDF: async function () {
            // Retro Documentation tab has its own TS + FS structure and must
            // download BOTH documents as SEPARATE PDFs (no "Save As" prompt).
            if (this.keytobeSet === "retroDocKey") {
                await this._downloadRetroPdfs();
                return;
            }
            
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

            PdfUtil.createSimplePdf(fileName, lines);

        },

        _downloadRetroPdfs: async function () {
            var oAiResp = this.getOwnerComponent().getModel("airesponseDetailModel");
            var aiData = oAiResp ? (oAiResp.oData || {}) : {};

            // Prefer content directly stored on the model; fall back to the
            // Documents Ready list on the View1 default model.
            function stripOuterFence(s) {
                var t = (s || "").trim();
                var m = t.match(/^```[^\n]*\n([\s\S]*?)```\s*$/);
                return m ? m[1].trim() : t;
            }

            var sTs = stripOuterFence(aiData.tsContent || "");
            var sFs = stripOuterFence(aiData.fsContent || "");

            if (!sTs && !sFs) {
                // Fallback: look up downloadItems from the View1 default model
                try {
                    var oApp = this.getOwnerComponent().byId("App");
                    var oFCL = oApp && oApp.byId("flexibleColumnLayout");
                    var oV1 = oFCL && oFCL.getBeginColumnPages && oFCL.getBeginColumnPages()[0];
                    var oDM = oV1 && oV1.getModel();
                    var aItems = (oDM && oDM.getProperty("/downloadItems")) || [];
                    aItems.forEach(function (o) {
                        var sK = (o.docKind || "").toLowerCase();
                        if (!sK) {
                            var sH = ((o.name || "") + " " + (o.filename || "")).toLowerCase();
                            if (sH.indexOf("technical") !== -1) { sK = "ts"; }
                            else if (sH.indexOf("functional") !== -1) { sK = "fs"; }
                        }
                        if (sK === "ts" && !sTs) { sTs = stripOuterFence(o.generatedContent || ""); }
                        if (sK === "fs" && !sFs) { sFs = stripOuterFence(o.generatedContent || ""); }
                    });
                } catch (e) { /* best-effort */ }
            }

            if (!sTs && !sFs) {
                sap.m.MessageToast.show("No content available to download.");
                return;
            }

            // Generate + download each PDF sequentially. Using a small delay
            // between the two anchor clicks avoids some browsers coalescing
            // multiple rapid downloads into a single prompt.
            if (sTs) {
                await this._generateAndAutoDownloadPdf(
                    "Retro_Documentation_TS.pdf",
                    ["__PDF_NOTITLE__", "", sTs].join("\n")
                );
            }
            if (sFs) {
                // Delay slightly so both downloads succeed silently
                await new Promise(function (r) { setTimeout(r, 800); });
                await this._generateAndAutoDownloadPdf(
                    "Retro_Documentation_FS.pdf",
                    ["__PDF_NOTITLE__", "", sFs].join("\n")
                );
            }
        },

        /**
         * Build a jsPDF document with the same markdown parser used by
         * PdfUtil.createSimplePdf, then trigger a direct anchor download
         * (Blob URL) so the browser does NOT show a "Save As" dialog.
         */
        _generateAndAutoDownloadPdf: async function (sFileName, sMarkdown) {
            try {
                // Delegate to PdfUtil to build the PDF as a Blob then download
                // via an anchor click (no native Save-As prompt).
                if (PdfUtil && typeof PdfUtil.createPdfBlob === "function") {
                    var oBlob = await PdfUtil.createPdfBlob(sMarkdown, { markdown: true });
                    this._triggerBlobDownload(oBlob, sFileName);
                    return;
                }
                // Fallback: PdfUtil doesn't expose a blob API — capture the
                // Blob by monkey-patching jsPDF's save on the fly.
                await PdfUtil.createSimplePdf(sFileName, sMarkdown, { markdown: true });
            } catch (e) {
                sap.m.MessageToast.show("PDF generation failed: " + (e && e.message ? e.message : e));
            }
        },

        _triggerBlobDownload: function (oBlob, sFileName) {
            if (!oBlob) { return; }
            var sUrl = URL.createObjectURL(oBlob);
            var oLink = document.createElement("a");
            oLink.href = sUrl;
            oLink.download = sFileName || "document.pdf";
            oLink.style.display = "none";
            document.body.appendChild(oLink);
            oLink.click();
            document.body.removeChild(oLink);
            setTimeout(function () { URL.revokeObjectURL(sUrl); }, 1500);
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
                case "retroDocKey":
                    name = "Retro Documentation";
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
                sap.ui.core.util.File.save(blob, "GenAI_Doc_" + this.selectedTab(), "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
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
                // Retro Documentation data
                oDetailModel.setProperty("/tsContent", "");
                oDetailModel.setProperty("/fsContent", "");
                oDetailModel.setProperty("/tsVisible", false);
                oDetailModel.setProperty("/fsVisible", false);
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
                if (this.keytobeSet === "retroDocKey") {
                    try {
                        const oView1View = oView1Controller.getView();

                        const oRetroDocModel = oView1View.getModel("retroDocModel");
                        if (oRetroDocModel) {
                            oRetroDocModel.setProperty("/selectedObjectType", "PROG");
                            oRetroDocModel.setProperty("/selectedSapSystem", "DEV");
                            oRetroDocModel.setProperty("/searchPattern", "Z*");
                            oRetroDocModel.setProperty("/searchResults", []);
                            oRetroDocModel.setProperty("/searchResultsCount", 0);
                            oRetroDocModel.setProperty("/searchResultsVisible", false);
                            oRetroDocModel.setProperty("/searchSuggestions", []);
                            oRetroDocModel.setProperty("/selectedObjects", []);
                            oRetroDocModel.setProperty("/selectedObject", "");
                            oRetroDocModel.setProperty("/isSearching", false);
                            oRetroDocModel.setProperty("/buttonsEnabled", false);
                            oRetroDocModel.setProperty("/documentModeEnabled", false);
                            oRetroDocModel.setProperty("/documentMode", "create");
                            oRetroDocModel.setProperty("/hasExistingFS", false);
                            oRetroDocModel.setProperty("/hasExistingTS", false);
                            oRetroDocModel.setProperty("/existingFSFileName", "");
                            oRetroDocModel.setProperty("/existingTSFileName", "");
                            oRetroDocModel.setProperty("/existingFSFileKey", "");
                            oRetroDocModel.setProperty("/existingTSFileKey", "");
                            oRetroDocModel.setProperty("/existingFSDownloadUrl", "");
                            oRetroDocModel.setProperty("/existingTSDownloadUrl", "");
                            oRetroDocModel.setProperty("/existingFSViewUrl", "");
                            oRetroDocModel.setProperty("/existingTSViewUrl", "");
                            oRetroDocModel.setProperty("/createFS", false);
                            oRetroDocModel.setProperty("/createTS", false);
                            oRetroDocModel.setProperty("/updateFS", false);
                            oRetroDocModel.setProperty("/updateTS", false);
                            oRetroDocModel.setProperty("/uploadCodeEnabled", false);
                            oRetroDocModel.setProperty("/uploadedCodeFileName", "");
                            oRetroDocModel.setProperty("/uploadedSourceCode", "");
                            oRetroDocModel.setProperty("/sourceInputType", "selection");
                            oRetroDocModel.setProperty("/sourceMode", -1);
                            oRetroDocModel.setProperty("/sourceConfigKey", "");
                            oRetroDocModel.setProperty("/sourceConfigContent",
                                "Select a Source Configuration option above to view the next-step instructions.");
                            oRetroDocModel.setProperty("/fsTemplateFileName", "");
                            oRetroDocModel.setProperty("/tsTemplateFileName", "");
                            oRetroDocModel.setProperty("/retroTemplateToggle", false);
                            oRetroDocModel.setProperty("/templateEnabled", false);
                            oRetroDocModel.setProperty("/resetEnabled", false);
                            oRetroDocModel.refresh(true);
                        }

                        const oDefModel = oView1View.getModel();
                        if (oDefModel) {
                            oDefModel.setProperty("/agentPipelineVisible", false);
                            oDefModel.setProperty("/agentPipelineStatus", "");
                            oDefModel.setProperty("/agentPipelineComplete", false);
                            oDefModel.setProperty("/agentSteps", [
                                { status: "pending" },
                                { status: "pending" },
                                { status: "pending" },
                                { status: "pending" }
                            ]);
                            oDefModel.setProperty("/agentConnectors", [
                                { completed: false },
                                { completed: false },
                                { completed: false }
                            ]);
                            oDefModel.setProperty("/logEntries", []);
                            oDefModel.setProperty("/logPanelVisible", false);
                            oDefModel.setProperty("/downloadItems", []);
                            oDefModel.setProperty("/downloadPanelVisible", false);
                            oDefModel.refresh(true);
                        }

                        setTimeout(function () {
                            try {
                                const oPF = oView1Controller._getRetroProcessFlow
                                    ? oView1Controller._getRetroProcessFlow()
                                    : oView1View.byId("retroProcessFlow");
                                if (oPF) {
                                    oPF.getLanes().forEach(function (oLane) {
                                        oLane.setState([]);
                                    });
                                    oPF.getNodes().forEach(function (oNode) {
                                        oNode.setState("Neutral");
                                        oNode.setTitle("");
                                        oNode.setTitleAbbreviation("");
                                    });
                                    oPF.invalidate();
                                }
                            } catch (ePF) { /* best-effort */ }
                        }, 0);

                        if (oTabStateModel) {
                            const oTabsR = oTabStateModel.getProperty("/tabs") || {};
                            if (oTabsR["retroDocKey"]) {
                                delete oTabsR["retroDocKey"].retroDocData;
                                delete oTabsR["retroDocKey"].retroLogEntries;
                                delete oTabsR["retroDocKey"].retroDownloadItems;
                                delete oTabsR["retroDocKey"].retroLogPanelVisible;
                                delete oTabsR["retroDocKey"].retroDlPanelVisible;
                                delete oTabsR["retroDocKey"].retroPipelineVisible;
                                delete oTabsR["retroDocKey"].retroPipelineStatus;
                                delete oTabsR["retroDocKey"].retroPipelineComplete;
                                delete oTabsR["retroDocKey"].retroAgentSteps;
                                delete oTabsR["retroDocKey"].retroAgentConnectors;
                                oTabStateModel.setProperty("/tabs", oTabsR);
                            }
                        }
                        if (oView1Controller._retroUploadedDocCache) {
                            oView1Controller._retroUploadedDocCache = {};
                        }
                    } catch (eRetro) {
                        console.warn("Retro refresh cleanup failed:", eRetro && eRetro.message);
                    }
                }

                // 3) Clear only View1 fields via its onRefresh, if available
                if (oView1Controller.onRefresh) {
                    oView1Controller.onRefresh();
                }
            }

            // 4) Back to single-column layout
            this.oRouter.navTo("RouteView1", {
                tabName: this.keytobeSet,
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
            var selectedBranchforComm = this.getOwnerComponent().getModel("gitModel").getProperty("/selectedBranch");
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
            let oHeader = {
                "Access-Control-Allow-Origin": "https://*.hana.ondemand.com/**" || null,
                "Access-Control-Allow-Methods": "POST, GET, PUT, PATCH, DELETE" || null,
                "X-Frame-Options": "DENY",
                "X-XSS-Protection": "0",
                "X-Content-Type-Options": "nosniff"
            };
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
                    headers: oHeader,
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

            let oHeader = {
                "Access-Control-Allow-Origin": "https://*.hana.ondemand.com/**" || null,
                "Access-Control-Allow-Methods": "POST, GET, PUT, PATCH, DELETE" || null,
                "X-Frame-Options": "DENY",
                "X-XSS-Protection": "0",
                "X-Content-Type-Options": "nosniff"
            };

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
                headers: oHeader,
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
        },

        onExportFSTemplate: function () {
            var that = this;
            var oModel = this.getView().getModel("airesponseDetailModel");
            var sContent = oModel.getProperty("/fsContent");
            var templateKey = oModel.getProperty("/templateKey");
            var oHeader = {
                "Access-Control-Allow-Origin": "https://*.hana.ondemand.com/**" || null,
                "Access-Control-Allow-Methods": "POST, GET, PUT, PATCH, DELETE" || null,
                "X-Frame-Options": "DENY",
                "X-XSS-Protection": "0",
                "X-Content-Type-Options": "nosniff"
            };
            if (!sContent) {
                sap.m.MessageBox.warning("No Functional Specification content available.");
                return;
            }
            if (!templateKey) {
                sap.m.MessageBox.warning("Please select or upload a template first.");
                return;
            }
            var payload = {
                content: sContent,
                templateKey: templateKey,
                tabName: that.selectedTab()
            };
            $.ajax({
                url: this._sBasePath + "/cockpit/generateDocument",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),
                headers: oHeader,
                xhrFields: { responseType: "blob" },
                success: function (blob, status, xhr) {
                    var fileName = "FS_Template.docx";
                    var disposition = xhr.getResponseHeader("Content-Disposition");
                    if (disposition && disposition.indexOf("filename=") !== -1) {
                        fileName = disposition.split("filename=")[1].replace(/"/g, "");
                    }
                    var url = window.URL.createObjectURL(blob);
                    var a = document.createElement("a");
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                },
                error: function (xhr) {
                    sap.ui.core.BusyIndicator.hide();
                    var message = "FS Document generation failed";
                    try {
                        var err = JSON.parse(xhr.responseText);
                        message = err.error || message;
                    } catch (e) {
                        console.error("Error parsing response:", e);
                    }
                    sap.m.MessageBox.error(message);
                }
            });
        },

        onExportTSTemplate: function () {
            var that = this;
            var oModel = this.getView().getModel("airesponseDetailModel");
            var sContent = oModel.getProperty("/tsContent");
            var templateKey = oModel.getProperty("/templateKey");
            var oHeader = {
                "Access-Control-Allow-Origin": "https://*.hana.ondemand.com/**" || null,
                "Access-Control-Allow-Methods": "POST, GET, PUT, PATCH, DELETE" || null,
                "X-Frame-Options": "DENY",
                "X-XSS-Protection": "0",
                "X-Content-Type-Options": "nosniff"
            };
            if (!sContent) {
                sap.m.MessageBox.warning("No Technical Specification content available.");
                return;
            }
            if (!templateKey) {
                sap.m.MessageBox.warning("Please select or upload a template first.");
                return;
            }
            var payload = {
                content: sContent,
                templateKey: templateKey,
                tabName: that.selectedTab()
            };
            $.ajax({
                url: this._sBasePath + "/cockpit/generateDocument",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),
                headers: oHeader,
                xhrFields: { responseType: "blob" },
                success: function (blob, status, xhr) {
                    var fileName = "TS_Template.docx";
                    var disposition = xhr.getResponseHeader("Content-Disposition");
                    if (disposition && disposition.indexOf("filename=") !== -1) {
                        fileName = disposition.split("filename=")[1].replace(/"/g, "");
                    }
                    var url = window.URL.createObjectURL(blob);
                    var a = document.createElement("a");
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                },
                error: function (xhr) {
                    sap.ui.core.BusyIndicator.hide();
                    var message = "TS Document generation failed";
                    try {
                        var err = JSON.parse(xhr.responseText);
                        message = err.error || message;
                    } catch (e) {
                        console.error("Error parsing response:", e);
                    }
                    sap.m.MessageBox.error(message);
                }
            });
        },

        generateWordContent2: function (_retroDocMode) {
            if (_retroDocMode && typeof _retroDocMode !== "string") {
                _retroDocMode = undefined;
            }
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
                BorderStyle
            } = window.docx;

            if (!window.docx) {
                sap.m.MessageBox.information("Libraries not loaded");
                return;
            }

            // const content = this.getView().byId("aiRespTxtArea").getValue();/
            var that2 = this;
            function resolveRetroContent(sKind) {
                var oModel = that2.getOwnerComponent().getModel("airesponseDetailModel");
                var sProp = sKind === "ts" ? "/tsContent" : "/fsContent";
                var sVal = (oModel && oModel.getProperty(sProp)) || "";
                if (sVal) return sVal;
                // Fallback: downloadItems on View1 default model
                try {
                    var oApp = that2.getOwnerComponent().byId("App");
                    var oFCL = oApp && oApp.byId("flexibleColumnLayout");
                    var oV1 = oFCL && oFCL.getBeginColumnPages && oFCL.getBeginColumnPages()[0];
                    var oDM = oV1 && oV1.getModel();
                    if (oDM) {
                        var aDownload = oDM.getProperty("/downloadItems") || [];
                        for (var di = 0; di < aDownload.length; di++) {
                            var oItm = aDownload[di];
                            var sK = (oItm.docKind || "").toLowerCase();
                            if (!sK) {
                                var sH = ((oItm.name || "") + " " + (oItm.filename || "")).toLowerCase();
                                if (sH.indexOf("technical") !== -1 || /(^|[^a-z])ts([^a-z]|$)/.test(sH)) { sK = "ts"; }
                                else if (sH.indexOf("functional") !== -1 || /(^|[^a-z])fs([^a-z]|$)/.test(sH)) { sK = "fs"; }
                            }
                            if (sK === sKind && oItm.generatedContent) return oItm.generatedContent;
                        }
                    }
                } catch (e) { /* best-effort */ }
                return "";
            }
            let content = "";
            let sRetroTS = "";
            let sRetroFS = "";
            if (this.keytobeSet === "retroDocKey") {
                sRetroTS = resolveRetroContent("ts");
                sRetroFS = resolveRetroContent("fs");

                if (!sRetroTS && !sRetroFS) {
                    sap.m.MessageToast.show("No content to export");
                    return;
                }

                if (!_retroDocMode) {
                    try {
                        var oFCLT = this.getOwnerComponent().byId("App").byId("flexibleColumnLayout");
                        var oV1CT = oFCLT.getBeginColumnPages()[0].getController();
                        var oRTM = oV1CT.getView().getModel("retroTemplateModel");
                        var bTSTmpl = !!(sRetroTS && oRTM.getProperty("/hasUploadedTemplateTS"));
                        var bFSTmpl = !!(sRetroFS && oRTM.getProperty("/hasUploadedTemplateFS"));
                        if ((bTSTmpl || bFSTmpl) && oV1CT._generateDocxFromTemplate) {
                            var self2 = this;
                            var aTempl = [];
                            if (bTSTmpl) { aTempl.push({ t: "Technical Specification", c: sRetroTS, n: "Retro_Documentation_TS.docx", k: "TS" }); }
                            if (bFSTmpl) { aTempl.push({ t: "Functional Specification", c: sRetroFS, n: "Retro_Documentation_FS.docx", k: "FS" }); }
                            // Download template-based docs
                            aTempl.forEach(function (d, i) {
                                setTimeout(function () {
                                    oV1CT._generateDocxFromTemplate(d.t, d.c, d.n, d.k).then(function (f) {
                                        if (!f) return;
                                        var u = URL.createObjectURL(f); var a = document.createElement("a");
                                        a.href = u; a.download = f.name || d.n;
                                        document.body.appendChild(a); a.click(); document.body.removeChild(a);
                                        setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
                                    });
                                }, i * 1200);
                            });
                            // Docs WITHOUT an uploaded template → download normally via docx.js
                            var iDelay = aTempl.length * 1200;
                            if (!bTSTmpl && sRetroTS) { setTimeout(function () { self2.generateWordContent2("ts"); }, iDelay); iDelay += 1200; }
                            if (!bFSTmpl && sRetroFS) { setTimeout(function () { self2.generateWordContent2("fs"); }, iDelay); }
                            return;
                        }
                    } catch (eT) { /* best-effort, fall through to normal generation */ }
                }
                if (!_retroDocMode && sRetroTS && sRetroFS) {
                    this.generateWordContent2("ts");
                    return;
                }
                if (_retroDocMode === "fs" || (!_retroDocMode && !sRetroTS && sRetroFS)) {
                    content = "# Functional Specification\n\n" + sRetroFS;
                    sRetroTS = "";
                } else {
                    content = "# Technical Specification\n\n" + sRetroTS;
                    sRetroFS = "";
                }
            } else {
                content = this.getView().byId("aiRespTxtArea").getValue();
            }
            if (!content) {
                sap.m.MessageToast.show("No content to export");
                return;
            }

            let src = String(content);

            // ============================================================
            // 1) Extract fenced code blocks first (same as mdToHTML)
            // ============================================================
            const codeBlocks = [];
            src = src.replace(/```([a-zA-Z0-9_+\-]*)\n([\s\S]*?)```/g, function (m, lang, code) {
                const token = "\u0000CODEBLOCK" + codeBlocks.length + "\u0000";

                // Check if fenced block is actually a markdown table
                const trimmed = code.replace(/^\s+|\s+$/g, "");
                const firstTwo = trimmed.split(/\r?\n/, 2);
                const sepRe = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/;
                const langOk = !lang || /^(plaintext|text|md|markdown)$/i.test(lang);

                if (langOk && firstTwo.length === 2 &&
                    firstTwo[0].indexOf("|") !== -1 && sepRe.test(firstTwo[1])) {
                    // It's a table inside code fence - store as table
                    codeBlocks.push({ type: "table", content: trimmed });
                } else {
                    // It's a code block
                    codeBlocks.push({ type: "code", lang: lang || "", content: code.replace(/\n$/, "") });
                }
                return token;
            });

            // ============================================================
            // 2) Helper functions (matching mdToHTML logic)
            // ============================================================
            function isTableSeparator(s) {
                return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(s);
            }

            function splitRow(s) {
                let r = s.trim();
                if (r.charAt(0) === "|") r = r.slice(1);
                if (r.charAt(r.length - 1) === "|") r = r.slice(0, -1);
                return r.split("|").map(function (c) { return c.trim(); });
            }

            // Parse inline formatting and return TextRun array
            function parseTextRuns(text) {
                if (!text) return [new TextRun({ text: "" })];

                const runs = [];
                let remaining = String(text);

                // Convert links [text](url) to just text
                remaining = remaining.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

                // Process inline formatting
                const regex = /(\*\*[\s\S]+?\*\*|__[\s\S]+?__|`[^`]+`|\*[^*\n]+?\*|_[^_\n]+?_)/g;
                let lastIndex = 0;
                let match;

                while ((match = regex.exec(remaining)) !== null) {
                    // Add text before the match
                    if (match.index > lastIndex) {
                        runs.push(new TextRun({ text: remaining.slice(lastIndex, match.index) }));
                    }

                    const token = match[0];
                    if (token.startsWith("**") && token.endsWith("**")) {
                        // Bold **text**
                        runs.push(new TextRun({ text: token.slice(2, -2), bold: true }));
                    } else if (token.startsWith("__") && token.endsWith("__")) {
                        // Bold __text__
                        runs.push(new TextRun({ text: token.slice(2, -2), bold: true }));
                    } else if (token.startsWith("`") && token.endsWith("`")) {
                        // Inline code `text`
                        runs.push(new TextRun({
                            text: token.slice(1, -1),
                            font: "Courier New",
                            shading: { fill: "E8E8E8" }
                        }));
                    } else if (token.startsWith("*") && token.endsWith("*")) {
                        // Italic *text*
                        runs.push(new TextRun({ text: token.slice(1, -1), italics: true }));
                    } else if (token.startsWith("_") && token.endsWith("_")) {
                        // Italic _text_
                        runs.push(new TextRun({ text: token.slice(1, -1), italics: true }));
                    }

                    lastIndex = regex.lastIndex;
                }

                // Add remaining text
                if (lastIndex < remaining.length) {
                    runs.push(new TextRun({ text: remaining.slice(lastIndex) }));
                }

                return runs.length > 0 ? runs : [new TextRun({ text: text })];
            }

            // Bold label prefix for list items (matching mdToHTML)
            function boldLabelPrefix(itemText) {
                if (/^\*\*/.test(itemText)) return parseTextRuns(itemText);
                const m = itemText.match(/^([A-Za-z][A-Za-z0-9 ()\/&\-]{0,60}):\s+(.+)$/);
                if (m) {
                    return [
                        new TextRun({ text: m[1] + ": ", bold: true }),
                        ...parseTextRuns(m[2])
                    ];
                }
                return parseTextRuns(itemText);
            }

            // Create table from rows
            function createTable(headerRow, bodyRows) {
                const colCount = headerRow.length;
                const colWidth = Math.floor(100 / colCount);

                return new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: headerRow.map(cell => new TableCell({
                                width: { size: colWidth, type: WidthType.PERCENTAGE },
                                shading: { fill: "D9E2F3" },
                                children: [new Paragraph({ children: parseTextRuns(cell) })]
                            }))
                        }),
                        ...bodyRows.map(row => new TableRow({
                            children: row.map(cell => new TableCell({
                                width: { size: colWidth, type: WidthType.PERCENTAGE },
                                children: [new Paragraph({ children: parseTextRuns(cell) })]
                            }))
                        }))
                    ]
                });
            }

            // ============================================================
            // 3) Parse lines (matching mdToHTML block-level logic)
            // ============================================================
            const lines = src.split(/\r?\n/);
            const finalContent = [];
            let i = 0;
            let paraBuf = [];

            function flushPara() {
                if (paraBuf.length) {
                    finalContent.push(new Paragraph({
                        spacing: { after: 200 },
                        children: parseTextRuns(paraBuf.join(" "))
                    }));
                    paraBuf = [];
                }
            }

            if (this.keytobeSet !== "retroDocKey") {
            finalContent.push(new Paragraph({
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                children: [new TextRun({ text: "AI Response", bold: true, size: 36 })]
            }));
        }

            while (i < lines.length) {
                let line = lines[i];

                // Page-break marker (used to separate TS and FS in retro tab)
                if (/^\s*<!--\s*PAGEBREAK\s*-->\s*$/i.test(line)) {
                    flushPara();
                    finalContent.push(new Paragraph({
                        children: [new TextRun({ break: 1 })],
                        pageBreakBefore: true
                    }));
                    i++;
                    continue;
                }

                // Restore code-block placeholder
                const codeMatch = line.match(/\u0000CODEBLOCK(\d+)\u0000/);
                if (codeMatch) {
                    flushPara();
                    const block = codeBlocks[parseInt(codeMatch[1], 10)];
                    if (block) {
                        if (block.type === "table") {
                            // Parse table from code block
                            const tableRows = block.content.split(/\r?\n/);
                            if (tableRows.length >= 2) {
                                const header = splitRow(tableRows[0]);
                                const body = tableRows.slice(2)
                                    .filter(r => r.trim().length > 0)
                                    .map(splitRow);
                                if (header.length > 0 && body.length > 0) {
                                    finalContent.push(createTable(header, body));
                                }
                            }
                        } else {
                            // Code block - render as monospace paragraphs
                            const codeLines = block.content.split(/\r?\n/);
                            codeLines.forEach(codeLine => {
                                finalContent.push(new Paragraph({
                                    spacing: { after: 0 },
                                    shading: { fill: "F5F5F5" },
                                    children: [new TextRun({
                                        text: codeLine || " ",
                                        font: "Courier New",
                                        size: 20
                                    })]
                                }));
                            });
                            finalContent.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
                        }
                    }
                    i++;
                    continue;
                }

                // Blank line -> paragraph break
                if (/^\s*$/.test(line)) {
                    flushPara();
                    i++;
                    continue;
                }

                // ATX Headings # .. ######
                const mH = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
                if (mH) {
                    flushPara();
                    const lvl = mH[1].length;
                    const headingLevels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3,
                    HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6];
                    const sizes = [36, 32, 28, 26, 24, 22];
                    finalContent.push(new Paragraph({
                        heading: headingLevels[lvl - 1] || HeadingLevel.HEADING_6,
                        spacing: { before: 300, after: 150 },
                        children: [new TextRun({ text: mH[2], bold: true, size: sizes[lvl - 1] || 22 })]
                    }));
                    i++;
                    continue;
                }

                // SECTION/PART/APPENDIX/CHAPTER/PHASE/STEP heading
                const mSec = line.match(/^\s*((?:SECTION|PART|APPENDIX|CHAPTER|PHASE|STEP)\s+[\w\d.\-]+(?:\s*[—:\-]\s*.+)?)\s*$/);
                if (mSec) {
                    flushPara();
                    finalContent.push(new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 300, after: 150 },
                        children: [new TextRun({ text: mSec[1].trim(), bold: true, size: 32 })]
                    }));
                    i++;
                    continue;
                }

                // Multi-level numbered heading (1.1, 1.1.1, ...)
                const mMultiNum = line.match(/^\s*(\d+(?:\.\d+)+)\.?\s+(\S.*?)\s*$/);
                if (mMultiNum && !/[.;!?]\s*$/.test(line)) {
                    flushPara();
                    const depthDots = (mMultiNum[1].match(/\./g) || []).length;
                    const hLvl = Math.min(5, 1 + depthDots);
                    const headingLevels = [HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4,
                    HeadingLevel.HEADING_5, HeadingLevel.HEADING_6];
                    const sizes = [32, 28, 26, 24, 22];
                    finalContent.push(new Paragraph({
                        heading: headingLevels[hLvl - 1] || HeadingLevel.HEADING_5,
                        spacing: { before: 300, after: 150 },
                        children: [new TextRun({
                            text: mMultiNum[1] + " " + mMultiNum[2],
                            bold: true,
                            size: sizes[hLvl - 1] || 24,
                            color: "1F4E79"
                        })]
                    }));
                    i++;
                    continue;
                }

                // Single-level "1. Title" when followed by sub-numbered heading
                const mTopNum = line.match(/^\s*(\d+)\.\s+([A-Z][^\n]{0,200})$/);
                if (mTopNum && !/[.;!?]\s*$/.test(line)) {
                    let lookJ = i + 1;
                    while (lookJ < lines.length && /^\s*$/.test(lines[lookJ])) lookJ++;
                    const nextL = (lookJ < lines.length) ? lines[lookJ] : "";
                    const nextIsSubNum = /^\s*\d+(?:\.\d+)+\.?\s+\S/.test(nextL);
                    if (nextIsSubNum) {
                        flushPara();
                        finalContent.push(new Paragraph({
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 300, after: 150 },
                            children: [new TextRun({ text: mTopNum[1] + ". " + mTopNum[2], bold: true, size: 32 })]
                        }));
                        i++;
                        continue;
                    }
                }

                // Horizontal rule
                if (/^\s*([-*_])\s*\1\s*\1[\s\S]*$/.test(line) && line.replace(/[\s*\-_]/g, "") === "") {
                    flushPara();
                    finalContent.push(new Paragraph({
                        spacing: { before: 200, after: 200 },
                        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" } },
                        children: []
                    }));
                    i++;
                    continue;
                }

                // Pipe table
                if (line.indexOf("|") !== -1 && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
                    flushPara();
                    const header = splitRow(line);
                    i += 2;
                    const rows = [];
                    while (i < lines.length && lines[i].indexOf("|") !== -1 && !/^\s*$/.test(lines[i])) {
                        rows.push(splitRow(lines[i]));
                        i++;
                    }
                    if (header.length > 0 && rows.length > 0) {
                        finalContent.push(createTable(header, rows));
                        finalContent.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
                    }
                    continue;
                }

                // Unordered list
                if (/^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/.test(line)) {
                    flushPara();
                    while (i < lines.length && /^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/.test(lines[i])) {
                        const item = lines[i].replace(/^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/, "");
                        finalContent.push(new Paragraph({
                            bullet: { level: 0 },
                            spacing: { after: 80 },
                            children: boldLabelPrefix(item)
                        }));
                        i++;
                    }
                    continue;
                }

                // Ordered list
                if (/^\s*\d+[\.\)]\s+/.test(line)) {
                    flushPara();
                    let listNum = 1;
                    while (i < lines.length) {
                        if (/^\s*$/.test(lines[i]) &&
                            i + 1 < lines.length && /^\s*\d+[\.\)]\s+/.test(lines[i + 1])) {
                            i++;
                            continue;
                        }
                        if (!/^\s*\d+[\.\)]\s+/.test(lines[i])) break;
                        const item = lines[i].replace(/^\s*\d+[\.\)]\s+/, "");
                        finalContent.push(new Paragraph({
                            numbering: { reference: "default-numbering", level: 0 },
                            spacing: { after: 80 },
                            children: boldLabelPrefix(item)
                        }));
                        listNum++;
                        i++;
                    }
                    continue;
                }

                // "Label1: val1 Label2: val2 Label3: val3" → split into paragraphs
                const labelMatches = line.match(/[A-Z][A-Za-z][A-Za-z0-9 \/\-]{1,40}:/g);
                if (labelMatches && labelMatches.length >= 3) {
                    flushPara();
                    const splitRe = /\s+(?=[A-Z][A-Za-z][A-Za-z0-9 \/\-]{1,40}:\s)/g;
                    line.split(splitRe).forEach(function (seg) {
                        seg = seg.trim();
                        if (!seg) return;
                        const idx = seg.indexOf(":");
                        if (idx > -1) {
                            finalContent.push(new Paragraph({
                                spacing: { after: 120 },
                                children: [
                                    new TextRun({ text: seg.slice(0, idx + 1), bold: true }),
                                    new TextRun({ text: seg.slice(idx + 1) })
                                ]
                            }));
                        } else {
                            finalContent.push(new Paragraph({
                                spacing: { after: 120 },
                                children: parseTextRuns(seg)
                            }));
                        }
                    });
                    i++;
                    continue;
                }

                // "Label:" heading followed by list
                if (paraBuf.length === 0 &&
                    /^\s*[A-Z][A-Za-z0-9 \/&()\-]{0,99}:\s*$/.test(line) &&
                    !/[*_`#|]/.test(line)) {
                    let k0 = i + 1;
                    while (k0 < lines.length && /^\s*$/.test(lines[k0])) k0++;
                    const nextLn0 = (k0 < lines.length) ? lines[k0] : "";
                    const nextIsListLbl = /^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/.test(nextLn0) ||
                        /^\s*\d+[\.\)]\s+/.test(nextLn0);
                    if (nextIsListLbl) {
                        flushPara();
                        finalContent.push(new Paragraph({
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 300, after: 150 },
                            children: [new TextRun({ text: line.trim(), bold: true, size: 28 })]
                        }));
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
                    let j = i + 1;
                    while (j < lines.length && /^\s*$/.test(lines[j])) j++;
                    const nextLine = (j < lines.length) ? lines[j] : "";
                    const nextStartsList = /^\s*[-*\u2022\u2023\u25E6\u2043\u25AA]\s+/.test(nextLine) ||
                        /^\s*\d+[\.\)]\s+/.test(nextLine);
                    const nextIsBareHeading = /^\s*[A-Z][^\n]{0,79}$/.test(nextLine) &&
                        !/[.,;:!?]\s*$/.test(nextLine) &&
                        !/[*_`#|]/.test(nextLine) &&
                        nextLine.trim().length > 0;
                    const wordCount = line.trim().split(/\s+/).length;
                    const hasHyphenWord = /[A-Za-z]-[A-Za-z]/.test(line);
                    if ((nextStartsList || nextIsBareHeading) && (wordCount >= 2 || hasHyphenWord)) {
                        flushPara();
                        finalContent.push(new Paragraph({
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 300, after: 150 },
                            children: [new TextRun({ text: line.trim(), bold: true, size: 28 })]
                        }));
                        i++;
                        continue;
                    }
                }

                // Default: accumulate paragraph text
                paraBuf.push(line.trim());
                i++;
            }

            flushPara();

            // ============================================================
            // 4) Create and save document
            // ============================================================
            const doc = new Document({
                styles: {
                    default: {
                        document: {
                            run: { font: "Calibri", size: 24 },
                            paragraph: { spacing: { line: 276 } }
                        }
                    }
                },
                numbering: {
                    config: [{
                        reference: "default-numbering",
                        levels: [{
                            level: 0,
                            format: "decimal",
                            text: "%1.",
                            alignment: AlignmentType.LEFT,
                            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                        }]
                    }]
                },
                sections: [{
                    properties: {},
                    children: finalContent
                }]
            });

            const that = this;
            let sDocxFileName = "GenAI_Doc_" + that.selectedTab();
            if (this.keytobeSet === "retroDocKey") {
                if (sRetroTS) {
                    sDocxFileName = "Retro_Documentation_TS";
                } else if (sRetroFS) {
                    sDocxFileName = "Retro_Documentation_FS";
                }
            }
            Packer.toBlob(doc).then(function (blob) {
                var sExt = ".docx";
                var sMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                var oUrl = URL.createObjectURL(blob);
                var oA = document.createElement("a");
                oA.href = oUrl;
                oA.download = sDocxFileName + sExt;
                document.body.appendChild(oA);
                oA.click();
                document.body.removeChild(oA);
                setTimeout(function () { URL.revokeObjectURL(oUrl); }, 1500);
                if (that.keytobeSet === "retroDocKey" && _retroDocMode === "ts") {
                    setTimeout(function () { that.generateWordContent2("fs"); }, 1200);
                }
            });
        },

        onDownloadPDF3: async function () {
            var aiModelData = this.getOwnerComponent().getModel("airesponseDetailModel").oData || {};
            var combinedMarkdown = "";
            var fileName = "";

            if (this.keytobeSet === "retroDocKey") {
                // Retro Documentation has its own structure (TS + FS), no
                // System Message / AI Response concept - build markdown directly
                var sTsPdf = aiModelData.tsContent || "";
                var sFsPdf = aiModelData.fsContent || "";

                if (!sTsPdf.trim() && !sFsPdf.trim()) {
                    sap.m.MessageToast.show("No content");
                    return;
                }

                // Strip a wrapping code-fence if the AI returned the entire
                // content inside a single ``` block – this causes PdfUtil to
                // render everything in monospace/code style instead of as
                // normal markdown prose.
                function stripOuterFence(s) {
                    var t = (s || "").trim();
                    var m = t.match(/^```[^\n]*\n([\s\S]*?)```\s*$/);
                    return m ? m[1].trim() : t;
                }
                sTsPdf = stripOuterFence(sTsPdf);
                sFsPdf = stripOuterFence(sFsPdf);

                if (sTsPdf && sFsPdf) {
                    // Both present – generate 2 separate PDFs (one for TSD, one for FSD).
                    // Do NOT inject a heading here – the AI content already starts with
                    // its own "# Technical/Functional Specification Document" heading,
                    // so adding one would produce a duplicate.
                    var tsMd = ["__PDF_NOTITLE__", "", sTsPdf].join("\n");
                    var fsMd = ["__PDF_NOTITLE__", "", sFsPdf].join("\n");
                    try {
                        await PdfUtil.createSimplePdf("Retro_Documentation_TS.pdf", tsMd, { markdown: true });
                        await PdfUtil.createSimplePdf("Retro_Documentation_FS.pdf", fsMd, { markdown: true });
                    } catch (e) {
                        sap.m.MessageToast.show("PDF generation failed: " + e.message);
                    }
                    return;
                }

                // Only one document available – same approach, no extra heading injected.
                if (sTsPdf) {
                    combinedMarkdown = ["__PDF_NOTITLE__", "", sTsPdf].join("\n");
                    fileName = "Retro_Documentation_TS.pdf";
                } else {
                    combinedMarkdown = ["__PDF_NOTITLE__", "", sFsPdf].join("\n");
                    fileName = "Retro_Documentation_FS.pdf";
                }

            } else {
                var sSysMsg = this.getView().getModel("airesponseDetailModel").getProperty("/sysMsg") || "";
                var mdContent = "";

                if (this.keytobeSet === "cdGen") {
                    var multi = this.getView().getModel("airesponseDetailModel").getProperty("/multiCE") || [];
                    multi.forEach(function (m) {
                        if (m.textData) mdContent += m.textData + "\n\n";
                        if (m.codeData) mdContent += "```\n" + m.codeData + "\n```\n\n";
                    });
                } else {
                    mdContent = String(aiModelData.resp || "");
                }

                if (!mdContent.trim()) {
                    sap.m.MessageToast.show("No content");
                    return;
                }

                var lines = [];
                if (sSysMsg.trim()) {
                    lines.push("## System Message");
                    lines.push("");
                    lines.push(sSysMsg);
                    lines.push("");
                }
                lines.push("## AI Response");
                lines.push("");
                lines.push(mdContent);

                combinedMarkdown = lines.join("\n");
                fileName = "Gen AI " + (this.selectedTab ? this.selectedTab() : "Output") + ".pdf";
            }

            // Use PdfUtil with markdown option (no html2canvas needed)
            try {
                await PdfUtil.createSimplePdf(fileName, combinedMarkdown, { markdown: true });
            } catch (e) {
                sap.m.MessageToast.show("PDF generation failed: " + e.message);
            }
        },

        /**
         * Push remediated code back to S/4HANA via ARC-1 MCP Server (JSON-RPC format)
         * Performs: SAPWrite (creates inactive draft) -> SAPActivate (activates it)
         * Adds a small dialog to capture ABAP object type/name
         */
        onPushToS4T: function () {
            var that = this;

            // Read code fresh each time (not cached in closure)
            var codeText = (this.byId("aiRespTxtArea") && this.byId("aiRespTxtArea").getValue()) || "";
            // Also check multiCE code blocks if TextArea is hidden
            if ((!codeText || codeText.trim().length === 0)) {
                var oAiResp = this.getOwnerComponent().getModel("airesponseDetailModel");
                codeText = oAiResp ? (oAiResp.getProperty("/resp") || "") : "";
            }
            if (!codeText || codeText.trim().length === 0) {
                MessageBox.error("No AI response found to push. Generate or paste the remediated code first.");
                return;
            }
            // Store on instance so press handler always gets latest
            this._pushSourceCode = codeText;

            // Lazy-create dialog
            if (!this._pushDialog) {
                var oTypeSelect = new sap.m.Select({
                    width: "100%",
                    items: [
                        new sap.ui.core.Item({ key: "PROG", text: "Program (Report)" }),
                        new sap.ui.core.Item({ key: "CLAS", text: "Class" }),
                        new sap.ui.core.Item({ key: "INTF", text: "Interface" }),
                        new sap.ui.core.Item({ key: "FUGR", text: "Function Group" })
                    ]
                });

                // default to Program for Code Remediation tab
                if (this.keytobeSet === "cdRem" || this.keytobeSet === "cdGen") {
                    oTypeSelect.setSelectedKey("PROG");
                }

                this._pushNameInput = new sap.m.Input({
                    width: "100%",
                    placeholder: "Enter ABAP object name e.g. ZABAP_MCP_TEST or ZCL_MY_CLASS",
                    value: "",
                    editable: false
                });
                var oNameInput = this._pushNameInput;

                var oActivateCheckbox = new sap.m.CheckBox({
                    text: "Activate after push",
                    selected: true
                });
                var oLintCheckbox = new sap.m.CheckBox({
                    text: "Auto-fix before write (SAPLint)",
                    selected: true
                });

                this._pushDialog = new sap.m.Dialog({
                    title: "Push to S/4HANA (ARC-1 MCP)",
                    contentWidth: "480px",
                    content: [
                        new sap.m.Label({ text: "ABAP Object Name", labelFor: oNameInput, class: "sapUiSmallMarginBottom" }),
                        oNameInput,
                        new sap.m.VBox({ class: "sapUiSmallMarginTop", items: [oActivateCheckbox, oLintCheckbox] })
                    ],
                    beginButton: new sap.m.Button({
                        text: "Push",
                        type: "Emphasized",
                        press: async function () {
                            var typeKey = oTypeSelect.getSelectedKey();
                            var objName = (oNameInput.getValue() || "").trim().toUpperCase();
                            var shouldActivate = oActivateCheckbox.getSelected();

                            if (!objName) {
                                MessageBox.error("Please enter an ABAP object name.");
                                return;
                            }

                            // Validate that the object name hasn't been tampered with via browser dev tools
                            var oVM = that.getView().getModel("viewModel");
                            var oExpectedObj = oVM ? (oVM.getProperty("/selectedAbapObject") || {}) : {};
                            if (oExpectedObj.name && objName !== oExpectedObj.name.toUpperCase()) {
                                MessageBox.error("ABAP Object Name mismatch. Please select a valid object before pushing.");
                                return;
                            }

                            // Prepare code - strip markdown code fences if present (use fresh value)
                            var cleaned = that._stripMarkdownCodeFences(that._pushSourceCode);

                            // Validate ABAP source for selected type
                            try {
                                var cleanedForCheck = cleaned.replace(/^(?:\s*(?:\*|").*\r?\n)+/g, "").trim();

                                if (typeKey === "PROG") {
                                    var isAbapProg = /^(REPORT|PROGRAM|INCLUDE)\b/i.test(cleanedForCheck);
                                    if (!isAbapProg) {
                                        MessageBox.error("Selected type PROG expects ABAP program source starting with 'REPORT', 'PROGRAM' or 'INCLUDE'. The current content does not look like ABAP code.");
                                        return;
                                    }
                                    var codeNameMatch = cleanedForCheck.match(/^(?:REPORT|PROGRAM)\s+([A-Z][A-Z0-9_]+)/i);
                                    if (codeNameMatch && codeNameMatch[1]) {
                                        var codeReportName = codeNameMatch[1].toUpperCase();
                                        if (codeReportName !== objName) {
                                            MessageBox.error("The REPORT name in the code ('" + codeReportName + "') does not match the selected object ('" + objName + "'). The AI may have changed the program name. Please correct the code before pushing.");
                                            return;
                                        }
                                    }
                                } else if (typeKey === "CLAS") {
                                    var isAbapClass = /CLASS\s+\w+\s+DEFINITION/i.test(cleanedForCheck);
                                    if (!isAbapClass) {
                                        MessageBox.error("Selected type CLAS expects ABAP class source containing 'CLASS <name> DEFINITION'.");
                                        return;
                                    }
                                } else if (typeKey === "INTF") {
                                    var isAbapIntf = /INTERFACE\s+\w+/i.test(cleanedForCheck);
                                    if (!isAbapIntf) {
                                        MessageBox.error("Selected type INTF expects ABAP interface source containing 'INTERFACE <name>'.");
                                        return;
                                    }
                                }
                            } catch (vErr) {
                                MessageBox.error("Validation failed: " + (vErr.message || vErr.toString()));
                                return;
                            }

                            // Pre-activation quick fix
                            if (oLintCheckbox.getSelected()) {
                                var fixRes = that._clientPreflightFixAbap(cleaned);
                                if (fixRes && fixRes.fixed) {
                                    cleaned = fixRes.code;
                                    MessageToast.show("Preflight: fixed untyped RETURNING parameter(s)");
                                }
                            }

                            var busy = new sap.m.BusyDialog({ title: "Pushing to S/4HANA...", text: "Writing code (Step 1/2)" });
                            busy.open();

                            try {
                                // Step 1: SAPWrite - Creates an inactive draft
                                var writeAction = "update";
                                var writeArgs = {
                                    type: typeKey,
                                    name: objName,
                                    action: writeAction,
                                    source: cleaned
                                };
                                if (writeAction === "update") {
                                    writeArgs.lintBeforeWrite = false;
                                }

                                var writePayload = {
                                    jsonrpc: "2.0",
                                    id: Date.now(),
                                    method: "tools/call",
                                    params: {
                                        name: "SAPWrite",
                                        arguments: writeArgs
                                    }
                                };

                                var writeRes = await fetch(this._sBasePath + "/abap-mcp/mcp", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "Accept": "application/json, text/event-stream"
                                    },
                                    body: JSON.stringify(writePayload)
                                });

                                var writeText = await writeRes.text();
                                var writeResult = that._parseArc1Response(writeText);

                                if (writeResult.isError) {
                                    throw new Error("Write failed: " + writeResult.message);
                                }

                                // Step 2: SAPActivate - Activates the inactive draft
                                if (shouldActivate) {
                                    busy.setText("Activating code (Step 2/2)");

                                    var activatePayload = {
                                        jsonrpc: "2.0",
                                        id: Date.now() + 1,
                                        method: "tools/call",
                                        params: {
                                            name: "SAPActivate",
                                            arguments: {
                                                type: typeKey,
                                                name: objName
                                            }
                                        }
                                    };

                                    var activateRes = await fetch(this._sBasePath + "/abap-mcp/mcp", {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            "Accept": "application/json, text/event-stream"
                                        },
                                        body: JSON.stringify(activatePayload)
                                    });

                                    var activateText = await activateRes.text();
                                    var activateResult = that._parseArc1Response(activateText);

                                    if (activateResult.isError) {
                                        MessageBox.warning(
                                            "Code was written but activation failed:\n" + activateResult.message +
                                            "\n\nThe code exists as an inactive draft. Please activate manually in SAP GUI."
                                        );
                                        busy.close();
                                        that._pushDialog.close();
                                        return;
                                    }

                                    MessageToast.show("Successfully pushed and activated " + typeKey + " " + objName);
                                } else {
                                    MessageToast.show("Successfully pushed " + typeKey + " " + objName + " (inactive draft)");
                                }

                                that._pushDialog.close();

                            } catch (err) {
                                MessageBox.error("Push failed: " + (err.message || err.toString()));
                            } finally {
                                busy.close();
                            }
                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () { this._pushDialog.close(); }.bind(this)
                    }),
                    afterClose: function () {
                        // Optional: clear fields on close
                    }.bind(this)
                });

                this._pushDialog.addStyleClass("sapUiSizeCompact");
            }

            // Pre-populate ABAP Object Name with the selected ABAP object name from MCP search
            var oViewModel = this.getView().getModel("viewModel");
            var sAbapObjName = "";
            if (oViewModel) {
                var oSelObj = oViewModel.getProperty("/selectedAbapObject") || {};
                sAbapObjName = oSelObj.name || "";
            }
            if (this._pushNameInput) {
                this._pushNameInput.setValue(sAbapObjName);
            }

            // Open dialog
            this._pushDialog.open();
        },

        _stripMarkdownCodeFences: function (text) {
            if (!text || typeof text !== "string") return text || "";
            var t = text.trim();

            // Find all code blocks in the response
            var codeBlockRegex = /```([a-zA-Z]*)\s*\n?([\s\S]*?)```/g;
            var allCodeBlocks = [];
            var match;

            while ((match = codeBlockRegex.exec(t)) !== null) {
                var lang = (match[1] || "").toLowerCase();
                var code = (match[2] || "").trim();
                if (code) {
                    allCodeBlocks.push({ lang: lang, code: code });
                }
            }

            if (allCodeBlocks.length > 0) {
                // First, look for explicitly marked ABAP code blocks
                for (var i = 0; i < allCodeBlocks.length; i++) {
                    var block = allCodeBlocks[i];
                    if (block.lang === "abap" || block.lang === "sap") {
                        return block.code;
                    }
                }

                // Second, look for code blocks that look like ABAP
                var abapKeywords = /^(REPORT|PROGRAM|INCLUDE|CLASS|INTERFACE|FUNCTION|FORM|METHOD|DATA|TYPES|CONSTANTS)\b/im;
                for (var j = 0; j < allCodeBlocks.length; j++) {
                    if (abapKeywords.test(allCodeBlocks[j].code)) {
                        return allCodeBlocks[j].code;
                    }
                }

                // If no ABAP-specific block found, return the first code block
                return allCodeBlocks[0].code;
            }

            // No code fences found - try to extract code-like content
            var lines = t.split("\n");
            var codeLines = [];
            var inCodeSection = false;

            for (var k = 0; k < lines.length; k++) {
                var line = lines[k];
                var trimmedLine = line.trim();

                // Skip markdown headers
                if (/^#+\s/.test(trimmedLine)) continue;

                // Skip list items that are explanatory text
                if (/^[-*]\s+[A-Z][^:]*:/.test(trimmedLine)) continue;

                // Check if line looks like ABAP code
                var looksLikeAbap = /^(REPORT|PROGRAM|INCLUDE|CLASS|INTERFACE|FUNCTION|FORM|METHOD|DATA|TYPES|CONSTANTS|WRITE|IF|ENDIF|LOOP|ENDLOOP|SELECT|ENDSELECT|TRY|ENDTRY|CATCH|DO|ENDDO|WHILE|ENDWHILE|CASE|ENDCASE|AT|ENDAT|\*|")/i.test(trimmedLine);

                if (looksLikeAbap) {
                    inCodeSection = true;
                }

                if (inCodeSection) {
                    codeLines.push(line);
                }
            }

            if (codeLines.length > 0) {
                return codeLines.join("\n").trim();
            }

            // Fallback: just remove backticks lines
            t = t.replace(/^```.*$/gm, "").trim();
            return t;
        },

        _parseArc1Response: function (responseText) {
            try {
                var jsonMatch = responseText.match(/data:\s*(\{[\s\S]*\})/);
                if (!jsonMatch) {
                    var parsed = JSON.parse(responseText);
                    if (parsed.result && parsed.result.isError) {
                        return {
                            isError: true,
                            message: (parsed.result.content && parsed.result.content[0] && parsed.result.content[0].text) || "Unknown error"
                        };
                    }
                    return {
                        isError: false,
                        message: (parsed.result && parsed.result.content && parsed.result.content[0] && parsed.result.content[0].text) || "Success"
                    };
                }

                var json = JSON.parse(jsonMatch[1]);

                if (json.result && json.result.isError) {
                    var errorText = (json.result.content && json.result.content[0] && json.result.content[0].text) || "Unknown error";
                    return { isError: true, message: errorText };
                }

                var successText = (json.result && json.result.content && json.result.content[0] && json.result.content[0].text) || "Success";
                return { isError: false, message: successText };

            } catch (e) {
                return { isError: true, message: "Failed to parse response: " + e.message };
            }
        },

        onViewDocument: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            if (!oContext) {
                sap.m.MessageToast.show("No document selected.");
                return;
            }
            var oItem = oContext.getObject() || {};
            var sContent = oItem.generatedContent || "";
            if (!sContent) {
                sap.m.MessageToast.show("No content available for this document.");
                return;
            }

            // Resolve which panel to populate: prefer explicit docKind, else
            // fall back to sniffing name / filename for TS or FS markers.
            var sKind = String(oItem.docKind || "").toLowerCase();
            if (!sKind) {
                var sHay = ((oItem.name || "") + " " + (oItem.filename || "")).toLowerCase();
                if (/(^|[^a-z])(ts|tech(nical)?)([^a-z]|$)/.test(sHay) || sHay.indexOf("technical") !== -1) {
                    sKind = "ts";
                } else if (/(^|[^a-z])(fs|func(tional)?)([^a-z]|$)/.test(sHay) || sHay.indexOf("functional") !== -1) {
                    sKind = "fs";
                }
            }

            var oAiResp = this.getOwnerComponent().getModel("airesponseDetailModel");
            if (!oAiResp) {
                sap.m.MessageToast.show("Response model not available.");
                return;
            }

            var sPanelId;
            if (sKind === "fs" || sKind === "functional") {
                oAiResp.setProperty("/fsContent", sContent);
                oAiResp.setProperty("/fsVisible", true);
                sPanelId = "retroFSDocPanel";
            } else {
                // Default to TS panel
                oAiResp.setProperty("/tsContent", sContent);
                oAiResp.setProperty("/tsVisible", true);
                sPanelId = "retroTSDocPanel";
            }

            // Enable footer download buttons now that we have content bound
            oAiResp.setProperty("/downloadVis", true);

            // Expand + scroll to the newly rendered panel on next tick so the
            // user immediately sees the rendered document.
            var oView = this.getView();
            setTimeout(function () {
                var oPanel = oView.byId(sPanelId);
                if (oPanel) {
                    if (oPanel.setExpanded) {
                        oPanel.setExpanded(true);
                    }
                    var oDom = oPanel.getDomRef();
                    if (oDom && oDom.scrollIntoView) {
                        oDom.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                }
            }, 50);
        },

        _clientPreflightFixAbap: function (code) {
            try {
                if (!code || typeof code !== "string") {
                    return { code: code || "", fixed: false };
                }
                var fixed = false;
                var reFull = /(RETURNING\s+VALUE\(\s*\w+\s*\))\s+TYPE\s+p([^.\n]*)\./gi;
                var newCode = code.replace(reFull, function (full, valPart, rest) {
                    if (/\bLENGTH\b/i.test(rest)) {
                        return full;
                    }
                    fixed = true;
                    return valPart + " TYPE p LENGTH 5 DECIMALS 1.";
                });
                return { code: newCode, fixed: fixed };
            } catch (e) {
                return { code: code, fixed: false };
            }
        },
        onEditAIResponse: function () {
            this.getView().byId("aiRespTxtArea").setEditable(true);
            this.getView().byId("aiRespHtml").setVisible(false);
            this.getView().byId("cancelResponse").setVisible(true);
            this.getView().byId("aiRespTxtArea").setVisible(true);
            this.getView().byId("saveResponse").setVisible(true);
            this.getView().byId("editResponse").setVisible(false);
        },
        onSaveAIResponse: function () {
            let newResponse = this.getView().byId("aiRespTxtArea").getValue();
            this.getView().getModel("airesponseDetailModel").setProperty("/resp", newResponse);
            let aiContent = this.formatter.mdToHTML(newResponse);
            // Use setContent() (not setProperty) so that sap.ui.core.HTML clears its
            // internal _sDOMContent cache; otherwise preferDOM re-inserts the stale
            // old DOM when the control is made visible, showing the old response.
            this.getView().byId("aiRespHtml").setContent(aiContent);
            this.getView().byId("aiRespHtml").setVisible(true);
            this.getView().byId("aiRespTxtArea").setVisible(false);
            this.getView().byId("aiRespTxtArea").setEditable(false);
            this.getView().byId("editResponse").setVisible(true);
            this.getView().byId("cancelResponse").setVisible(false);
            this.getView().byId("saveResponse").setVisible(false);
        },
        onCancelAIResponse: function () {
            let oldResponse = this.fixed;
            this.getView().byId("aiRespTxtArea").setValue(oldResponse);
            let aiContent = this.formatter.mdToHTML(oldResponse);
            this.getView().byId("aiRespHtml").setContent(aiContent);
            this.getView().byId("aiRespHtml").setVisible(true);
            this.getView().byId("aiRespTxtArea").setVisible(false);
            this.getView().byId("aiRespTxtArea").setEditable(false);
            this.getView().byId("cancelResponse").setVisible(false);
            this.getView().byId("saveResponse").setVisible(false);
            this.getView().byId("editResponse").setVisible(true);
        },
         handleLiveChangeTxtArea: function (oEvent) {
            let typed, fixed;
            this.typed = oEvent.getParameter("newValue");
            this.fixed = oEvent.getSource().getProperty("value");
        }

    });
});