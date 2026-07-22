/* global Promise, $ */
sap.ui.define([
    "sap/ui/core/UIComponent",
    "aicockpitfeq/model/models",
    "sap/f/library",
    "sap/ui/model/json/JSONModel",
    "sap/f/FlexibleColumnLayoutSemanticHelper",
    "sap/ui/core/BusyIndicator",
    "aicockpitfeq/util/PdfUtil"
], (UIComponent, models, fioriLibrary, JSONModel, FlexibleColumnLayoutSemanticHelper, BusyIndicator, PdfUtil) => {
    "use strict";
    return UIComponent.extend("aicockpitfeq.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },
        defaultHeaders: {
            "AI-Resource-Group": "default",
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");
            var oFlagModel = new JSONModel({ isAdmin: false, isSys: false, isViewer: false });
            this.setModel(oFlagModel, "flagModel");

            var oModel = new JSONModel();
            this.setModel(oModel);
            var oRouter = this.getRouter();

            oRouter.attachBeforeRouteMatched(this._onBeforeRouteMatched, this);

            // proactively ensure jsPDF is loaded (managed runtime/FLP friendly)
            try {
                if (PdfUtil && typeof PdfUtil.ensureLoaded === "function") {
                    PdfUtil.ensureLoaded().catch(function (e) {
                        // log only; PdfUtil.createSimplePdf will still try again
                        // eslint-disable-next-line no-console
                        console.warn("[PdfUtil] initial ensureLoaded failed:", e && e.message);
                    });
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn("[PdfUtil] ensureLoaded preload error:", e && e.message);
            }

            // enable routing
            this.getRouter().initialize();
            var oHashObject = new sap.ui.core.routing.HashChanger();
            var currentHash = oHashObject.getHash();
            var tab = currentHash.split("/")[1] || "DocGen";

            oRouter.navTo("RouteView1", { tabName: tab, layout: fioriLibrary.LayoutType.OneColumn });
            var oNavModel = new JSONModel({
                "selectedProject": "CG-DevCockpit",
                "loggedInUserEmailId": "",
                "UseCaseKey": ""
            });
            this.setModel(oNavModel, "NetworkGraphModel");
            var respData = { resp: "", sysMsg: "", citationArr: [], downloadVis: false, beforeResult: "",
                codeResult: "", afterResult: "", codeType: "", codeEdVis: false, multiCE: [], templateKey: "" }; //Added Citation Array by Aishwarya
            var airesponseDetailModel = new JSONModel(respData);
            this.setModel(airesponseDetailModel, "airesponseDetailModel");
          
            var oHistoryModel = new sap.ui.model.json.JSONModel({ historyData: [] });
            this.setModel(oHistoryModel, "historyModel");
            var ragModelData = {
                ragMap: {
                    BS: false,
                    User: false,
                    fstoconf: false,
                    fstots: false,
                    tstocode: false,
                    coderem: false,
                    codesum: false,
                    TUT: false
                },
                currentRagEnabled: false
            };

            var oRagModel = new sap.ui.model.json.JSONModel(ragModelData);
            this.setModel(oRagModel, "ragModel");
            var chatModel = new sap.ui.model.json.JSONModel({
                data: []
            });
            this.setModel(chatModel, "chatModel");

            this._speakerOn = false;
            this._isListening = false;

            var gitData = {
                repoUrl: "",
                username: "",
                patToken: "",
                commitMsg: "",
                branchName: "",
                branches: {},
                selectedBranch: "",
                gitFileStr: {},
                filePath: "",
                gitFileContent: "",
                emailId: "",
                gitAddDet: "Add Git Details",
                gitCommit: "Commit Message",
                isFileSelected: false,
                selectedFilePath: ""
            };
            var gitModel = new sap.ui.model.json.JSONModel(gitData);
            this.setModel(gitModel, "gitModel");
            this.getFoundationModels();
            this.checkRoles();
            this.getUserinfo();
            const sComponentName = this.getManifestObject().getComponentName();
            const sInitBasePath = sap.ui.require.toUrl(sComponentName.replace(/\./g, "/"));
            models.getOrchestrationDeploymentId(sInitBasePath);
        },

        _onBeforeRouteMatched: function (oEvent) {
            var oModel = this.getModel();
            var sLayout = oEvent.getParameters().arguments.layout;
            if (!sLayout) {
               
                sLayout = fioriLibrary.LayoutType.OneColumn;
            }
            oModel.setProperty("/layout", sLayout);
        },
        checkRoles: function () {
            var that = this;

            var sComponentName = this.getManifestObject().getComponentName();
            var sBasePath = sap.ui.require.toUrl(sComponentName.replace(/\./g, "/"));
            var sUrl = sBasePath + "/user-api/currentUser";

            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: sUrl,
                    method: "GET",
                    success: function (data) {
                        var isAdmin = "";
                        // eslint-disable-next-line no-console
                        console.log("User Info:", data);
                        var flagModel = that.getModel("flagModel");
                        if (!flagModel) {
                            flagModel = new sap.ui.model.json.JSONModel({ isAdmin: false, isSys: false });
                            that.setModel(flagModel, "flagModel");
                        }
                        if (data?.scopes) {
                            var xsAppName = data.scopes.find(scopes => scopes.includes("!") && scopes.includes("."))?.split(".")[0];

                            if (xsAppName) {
                                var adminRole = xsAppName + ".Admin";
                                isAdmin = data.scopes.includes(adminRole);
                                flagModel.setProperty("/isAdmin", isAdmin);
                            } else {
                                flagModel.setProperty("/isAdmin", false);
                            }

                        }
                        // eslint-disable-next-line no-console
                        console.log("Admin:", isAdmin);

                        resolve({ isAdmin });
                    },
                    error: function (err) {
                        // eslint-disable-next-line no-console
                        console.error("Failed to fetch user roles:", err);
                        try {
                            var flagModel = that.getModel("flagModel");
                            if (!flagModel) {
                                flagModel = new sap.ui.model.json.JSONModel({ isAdmin: false, isSys: false, isViewer: false });
                                that.setModel(flagModel, "flagModel");
                            }
                            flagModel.setProperty("/isAdmin", false);
                        } catch (e) {
                            // no-op
                        }
                    }
                });
            });

        },
       
        getUserinfo: function () {
            var that = this;
            var oNG = this.getModel("NetworkGraphModel");

            var sEmail = "";
            var sName = "";
            var sUserId = "";

            // Try FLP user info first (when running inside Work Zone/Launchpad)
            try {
                 if (sap?.ushell?.Container) {
               // if (sap?.ushell?.services) {
                    var oUserInfo = sap.ushell.Container.getService && sap.ushell.Container.getService("UserInfo");
                    if (oUserInfo) {
                        sUserId = (oUserInfo.getId && oUserInfo.getId()) || "";
                        sEmail = (oUserInfo.getEmail && oUserInfo.getEmail()) || "";
                        sName = (oUserInfo.getFullName && oUserInfo.getFullName()) || "";
                    }
                    // sUserId =sap.ushell.services.getId()|| "";
                    // sEmail =sap.ushell.services.getEmail()|| "";
                    // sName =sap.ushell.services.getFullName()|| "";
                }
            } catch (_e) {
                // ignore - FLP not available
            }

            function applyUser(email, name, userId) {
                if (email) {
                    that._loggedInUser = email;
                } else if (userId && userId !== "DEFAULT_USER") {
                    that._loggedInUser = userId;
                } else {
                    that._loggedInUser = "";
                }
                oNG.setProperty("/loggedInUserEmailId", that._loggedInUser);
                oNG.setProperty("/loggedInUserName", name || "");
            }

            // If we already got values from FLP, apply and return
            if (sEmail || sName || sUserId) {
                applyUser(sEmail, sName, sUserId);
                return;
            }

            // Fallback for Managed HTML5 runtime: use approuter "user-api/currentUser"
            $.ajax({
                url: "user-api/currentUser",
                method: "GET",
                success: function (data) {
                    var email = data.email || data.mail || data.userEmail || data.user_name || data.username || "";
                    var fullName = data.name || [data.given_name, data.family_name].filter(Boolean).join(" ") || data.displayName || "";
                    var id = data.user_name || data.sub || data.logonName || data.id || "";
                    applyUser(email, fullName, id);
                },
                error: function () {
                    applyUser("", "", "");
                }
            });
        },

        // getFoundationModels: function () {
        //     let sComponentName = this.getManifestObject().getComponentName();
        //     let sBasePath = sap.ui.require.toUrl(sComponentName.replace(/\./g, "/"));
        //     let sUrl = sBasePath + "/lm/scenarios/foundation-models/models";

        //     let that = this;

        //     return fetch(sUrl, {
        //         method: "GET",
        //         headers: this.defaultHeaders,
        //         credentials: "same-origin"
        //     })
        //         .then(function (response) {
        //             if (!response.ok) {
        //                 throw new Error("API Error: " + response.status + " " + response.statusText);
        //             }
        //             return response.json();
        //         })
        //         .then(function (data) {
        //             let tokenData = {};

        //             if (Array.isArray(data.resources)) {
        //                 data.resources.forEach(function (modelInfo) {
        //                     if (modelInfo.model && modelInfo.versions[0].contextLength) {
        //                         tokenData[modelInfo.model] = {
        //                             UsageToken: 0,
        //                             TotalToken: modelInfo.versions[0].contextLength
        //                         };
        //                     }
        //                 });
        //             }

        //             const allModels = data?.resources || data?.models || data || [];
        //             let orchestrationModels = [];
        //             if (Array.isArray(allModels)) {
        //                 orchestrationModels = allModels
        //                     .filter(function (model) {
        //                         const modelName = (model.model || model.name || "").toLowerCase();
        //                         const isEmbeddingModel = modelName.includes("embed") || modelName.includes("embedding");

        //                         const versions = Array.isArray(model.versions) ? model.versions : [];
        //                         const hasNonDeprecatedVersion = versions.some(function (v) {
        //                             return v && (v.deprecated === false || v.deprecated === "false");
        //                         });

        //                         const allowed = Array.isArray(model.allowedScenarios) ? model.allowedScenarios : [];
        //                         const isOrchestrationAllowed = allowed.some(function (s) {
        //                             if (!s) { return false; }
        //                             if (typeof s === "string") {
        //                                 return s.toLowerCase() === "orchestration";
        //                             }
        //                             const sid = (s.scenarioId || s.id || "").toLowerCase();
        //                             return sid === "orchestration";
        //                         });

        //                         return !isEmbeddingModel && hasNonDeprecatedVersion && isOrchestrationAllowed;
        //                     })
        //                     .map(function (model) {
        //                         const nonDeprecatedVersions = (Array.isArray(model.versions) ? model.versions : []).filter(function (v) {
        //                             return v && (v.deprecated === false || v.deprecated === "false");
        //                         });

        //                         const firstVer = nonDeprecatedVersions && nonDeprecatedVersions[0] ? (nonDeprecatedVersions[0].name || nonDeprecatedVersions[0].version || "") : "";
        //                         const sModelName = model.model || model.name || model.modelName || "";
        //                         const key = sModelName;
        //                         const label = sModelName;

        //                         const sModelNameLower = sModelName.toLowerCase();
        //                         const sExecIdLower = (model.executableId || "").toLowerCase();
        //                         let aiType = "Others";
        //                         if (sModelNameLower.includes("gpt") || sModelNameLower.includes("o3") || sModelNameLower.includes("o4")) {
        //                             aiType = "GPT";
        //                         } else if (sModelNameLower.includes("mistral")) {
        //                             aiType = "Mistral";
        //                         } else if (sModelNameLower.includes("claude") || sModelNameLower.includes("anthropic")) {
        //                             aiType = "Anthropic";
        //                         } else if (sModelNameLower.includes("amazon") || sModelNameLower.includes("nova")) {
        //                             aiType = "Amazon";
        //                         } else if (sModelNameLower.includes("gemini")) {
        //                             aiType = "Google";
        //                         } else if (sModelNameLower.includes("sonar") || sExecIdLower.includes("perplexity")) {
        //                             aiType = "Perplexity";
        //                         } else if (sModelNameLower.includes("cohere")) {
        //                             aiType = "Cohere";
        //                         } else if (sModelNameLower.includes("sap")) {
        //                             aiType = "SAP";
        //                         }

        //                         return {
        //                             key: key,
        //                             text: label,
        //                             label: label,
        //                             aiType: aiType,
        //                             name: sModelName,
        //                             executableId: model.executableId,
        //                             description: model.description,
        //                             versions: nonDeprecatedVersions,
        //                             provider: model.provider,
        //                             displayName: model.displayName,
        //                             isOrchestrationCompatible: true,
        //                             contextLength: nonDeprecatedVersions[0] ? nonDeprecatedVersions[0].contextLength : 0,
        //                             streamingSupported: nonDeprecatedVersions[0] ? !!nonDeprecatedVersions[0].streamingSupported : false
        //                         };
        //                     })
        //                     .filter(function (m) { return m.name; });
        //             }

        //             let sDefaultKey = "";
        //             if (orchestrationModels.length > 0) {
        //                 let gpt4oModel = orchestrationModels.find(function (m) {
        //                     return (m.key || "").toLowerCase() === "gpt-4o";
        //                 });
        //                 sDefaultKey = gpt4oModel ? gpt4oModel.key : orchestrationModels[0].key;
        //             }

        //             that.setModel(new sap.ui.model.json.JSONModel({ items: orchestrationModels, selectedKey: sDefaultKey }), "OrchestrationModels");

        //             const apiVersion = (data && data.sqlResponse && data.sqlResponse.APIVERSION) || data?.APIVERSION || "";
        //             that.setModel(new sap.ui.model.json.JSONModel({ apiVersion: apiVersion }), "LMApiInfo");

        //             that.foundationModelTabs(tokenData,data);
                    
        //         })
        //         .catch(function (error) {
        //             console.error("API Error:", error);
        //             throw error;
        //         });
        // },

        getFoundationModels: function () {
            let sComponentName = this.getManifestObject().getComponentName();
            let sBasePath = sap.ui.require.toUrl(sComponentName.replace(/\./g, "/"));
            let sUrl = sBasePath + "/lm/scenarios/foundation-models/models";
 
            let that = this;
 
            return fetch(sUrl, {
                method: "GET",
                headers: this.defaultHeaders,
                credentials: "same-origin"
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("API Error: " + response.status + " " + response.statusText);
                    }
                    return response.json();
                })
                .then(function (data) {
                    let tokenData = {};
 
                    if (Array.isArray(data.resources)) {
                        data.resources.forEach(function (modelInfo) {
                            if (modelInfo.model && modelInfo.versions[0].contextLength) {
                                tokenData[modelInfo.model] = {
                                    UsageToken: 0,
                                    TotalToken: modelInfo.versions[0].contextLength
                                };
                            }
                        });
                    }
 
                    const allModels = data?.resources || data?.models || data || [];
                    let orchestrationModels = [];
                    if (Array.isArray(allModels)) {
                        const HIDDEN_MODELS = ["anthropic--claude-4.8-opus", "sap-abap-1"];
 
                        orchestrationModels = allModels
                            .filter(function (model) {
                                const modelName = (model.model || model.name || "").toLowerCase();
                                const isEmbeddingModel = modelName.includes("embed") || modelName.includes("embedding");
 
                                const versions = Array.isArray(model.versions) ? model.versions : [];
                                const hasNonDeprecatedVersion = versions.some(function (v) {
                                    return v && (v.deprecated === false || v.deprecated === "false");
                                });
 
                                const allowed = Array.isArray(model.allowedScenarios) ? model.allowedScenarios : [];
                                const isOrchestrationAllowed = allowed.some(function (s) {
                                    if (!s) { return false; }
                                    if (typeof s === "string") {
                                        return s.toLowerCase() === "orchestration";
                                    }
                                    const sid = (s.scenarioId || s.id || "").toLowerCase();
                                    return sid === "orchestration";
                                });
                                const isHiddenModel = HIDDEN_MODELS.indexOf(modelName) !== -1;
 
                                return !isEmbeddingModel && hasNonDeprecatedVersion && isOrchestrationAllowed && !isHiddenModel;
                            })
                            .map(function (model) {
                                const nonDeprecatedVersions = (Array.isArray(model.versions) ? model.versions : []).filter(function (v) {
                                    return v && (v.deprecated === false || v.deprecated === "false");
                                });
 
                                const firstVer = nonDeprecatedVersions && nonDeprecatedVersions[0] ? (nonDeprecatedVersions[0].name || nonDeprecatedVersions[0].version || "") : "";
                                const sModelName = model.model || model.name || model.modelName || "";
                                const key = sModelName;
                                const label = sModelName;
 
                                const sModelNameLower = sModelName.toLowerCase();
                                const sExecIdLower = (model.executableId || "").toLowerCase();
                                let aiType = "Others";
                                if (sModelNameLower.includes("gpt") || sModelNameLower.includes("o3") || sModelNameLower.includes("o4")) {
                                    aiType = "GPT";
                                } else if (sModelNameLower.includes("mistral")) {
                                    aiType = "Mistral";
                                } else if (sModelNameLower.includes("claude") || sModelNameLower.includes("anthropic")) {
                                    aiType = "Anthropic";
                                } else if (sModelNameLower.includes("amazon") || sModelNameLower.includes("nova")) {
                                    aiType = "Amazon";
                                } else if (sModelNameLower.includes("gemini")) {
                                    aiType = "Google";
                                } else if (sModelNameLower.includes("sonar") || sExecIdLower.includes("perplexity")) {
                                    aiType = "Perplexity";
                                } else if (sModelNameLower.includes("cohere")) {
                                    aiType = "Cohere";
                                } else if (sModelNameLower.includes("sap")) {
                                    aiType = "SAP";
                                }
 
                                return {
                                    key: key,
                                    text: label,
                                    label: label,
                                    aiType: aiType,
                                    name: sModelName,
                                    executableId: model.executableId,
                                    description: model.description,
                                    versions: nonDeprecatedVersions,
                                    provider: model.provider,
                                    displayName: model.displayName,
                                    isOrchestrationCompatible: true,
                                    contextLength: nonDeprecatedVersions[0] ? nonDeprecatedVersions[0].contextLength : 0,
                                    streamingSupported: nonDeprecatedVersions[0] ? !!nonDeprecatedVersions[0].streamingSupported : false
                                };
                            })
                            .filter(function (m) { return m.name; });
                    }
 
                    let sDefaultKey = "";
                    if (orchestrationModels.length > 0) {
                        let gpt4oModel = orchestrationModels.find(function (m) {
                            return (m.key || "").toLowerCase() === "gpt-4o";
                        });
                        sDefaultKey = gpt4oModel ? gpt4oModel.key : orchestrationModels[0].key;
                    }
 
                    that.setModel(new sap.ui.model.json.JSONModel({ items: orchestrationModels, selectedKey: sDefaultKey }), "OrchestrationModels");
 
                    const apiVersion = (data && data.sqlResponse && data.sqlResponse.APIVERSION) || data?.APIVERSION || "";
                    that.setModel(new sap.ui.model.json.JSONModel({ apiVersion: apiVersion }), "LMApiInfo");
 
                    that.foundationModelTabs(tokenData,data);
                   
                })
                .catch(function (error) {
                    console.error("API Error:", error);
                    throw error;
                });
        },
         
        foundationModelTabs: function(tokenData,data){
            let that=this;
                const tabs = [
                        "BS", "User", "fstoconf", "fstots", "tstocode", "tstocodeGit",
                        "coderem", "codesum", "TUT", "BPM", "TCG", "PCT", "DocGen", "RetroDoc"
                    ];
 
                    const tokenConfigByTab = {};
                    tabs.forEach(tab => {
                        tokenConfigByTab[tab] = { ...tokenData };
                    });
 
                    tokenConfigByTab.tokenVis = false;
                    tokenConfigByTab.usedToken = "";
 
                    let oTokenModel = new sap.ui.model.json.JSONModel();
                    oTokenModel.setData(tokenConfigByTab);
                    that.setModel(oTokenModel, "TokenLimit");
                    that.getModel("TokenLimit").refresh();
 
                    // Bind full foundation models response for UI consumption
                    let fmRaw = new sap.ui.model.json.JSONModel(data);
                    that.setModel(fmRaw, "FoundationModelsRaw");
                    let fmList = (Array.isArray(data.resources) ? data.resources : []).map(function (r) {
                        let v = (r.versions && r.versions[0]) || {};
                        return {
                            model: r.model || "",
                            displayName: r.displayName || "",
                            provider: r.provider || "",
                            executableId: r.executableId || "",
                            version: v.name || "",
                            isLatest: !!v.isLatest,
                            deprecated: !!v.deprecated,
                            retirementDate: v.retirementDate || "",
                            contextLength: v.contextLength || 0,
                            streamingSupported: !!v.streamingSupported,
                            accessType: r.accessType || "",
                            allowedScenarios: r.allowedScenarios || []
                        };
                    });
                    that.setModel(new sap.ui.model.json.JSONModel({ items: fmList }), "FoundationModels");
        },

    });
});