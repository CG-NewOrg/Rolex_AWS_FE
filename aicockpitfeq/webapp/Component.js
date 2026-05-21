/* global Promise, $ */
sap.ui.define([
    "sap/ui/core/UIComponent",
    "aicockpitfeq/model/models",
    "sap/f/library",
    "sap/ui/model/json/JSONModel",
    "sap/f/FlexibleColumnLayoutSemanticHelper",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/routing/HashChanger",
    "aicockpitfeq/util/PdfUtil"
], (UIComponent, models, fioriLibrary, JSONModel, FlexibleColumnLayoutSemanticHelper, BusyIndicator, HashChanger, PdfUtil) => {
    "use strict";
    return UIComponent.extend("aicockpitfeq.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },
        defaultHeaders: {
            "AI-Resource-Group": "default"
        },
        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");
            //for flexiblecol
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
            ////   var historyData = [{promptHistory:"",aiResponseHistory:""}];

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
        },

        _onBeforeRouteMatched: function (oEvent) {
            var oModel = this.getModel();
            var sLayout = oEvent.getParameters().arguments.layout;
            if (!sLayout) {
                //  sLayout = fioriLibrary.LayoutType.TwoColumnsMidExpanded;
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
                        if (data && data.scopes) {
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
                    }
                });
            });

        },
        //    getUserinfo: function () {

        //     if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("UserInfo")) {
        //         var oUserInfoService = sap.ushell.Container.getService("UserInfo");
        //         var sUserId = oUserInfoService.getId();
        //         var sEmailId = oUserInfoService.getEmail();
        //         if (sEmailId) {
        //             this._loggedInUser = sEmailId;
        //         }
        //         else if (sUserId && sUserId !== 'DEFAULT_USER') {
        //             this._loggedInUser = sUserId;
        //         }
        //     }
        //     this.getModel("NetworkGraphModel").setProperty("/loggedInUserEmailId", this._loggedInUser);

        //     this.getModel("NetworkGraphModel").setProperty("/loggedInUserName", oUserInfoService.getFullName());

        // },
        getUserinfo: function () {
            var that = this;
            var oNG = this.getModel("NetworkGraphModel");

            var sEmail = "";
            var sName = "";
            var sUserId = "";

            // Try FLP user info first (when running inside Work Zone/Launchpad)
            try {
                if (sap && sap.ushell && sap.ushell.Container) {
                    var oUserInfo = sap.ushell.Container.getService && sap.ushell.Container.getService("UserInfo");
                    if (oUserInfo) {
                        sUserId = (oUserInfo.getId && oUserInfo.getId()) || "";
                        sEmail = (oUserInfo.getEmail && oUserInfo.getEmail()) || "";
                        sName = (oUserInfo.getFullName && oUserInfo.getFullName()) || "";
                    }
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

        getFoundationModels: function () {
            var sComponentName = this.getManifestObject().getComponentName();
            var sBasePath = sap.ui.require.toUrl(sComponentName.replace(/\./g, "/"));
            var sUrl = sBasePath + "/lm/scenarios/foundation-models/models";

            var that = this;

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
                    var tokenData = {};

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

                    const tabs = [
                        "BS", "User", "fstoconf", "fstots", "tstocode", "tstocodeGit",
                        "coderem", "codesum", "TUT", "BPM", "TCG", "PCT", "DocGen"
                    ];

                    const tokenConfigByTab = {};
                    tabs.forEach(tab => {
                        tokenConfigByTab[tab] = { ...tokenData };
                    });

                    tokenConfigByTab.tokenVis = false;
                    tokenConfigByTab.usedToken = "";

                    var oTokenModel = new sap.ui.model.json.JSONModel();
                    oTokenModel.setData(tokenConfigByTab);
                    that.setModel(oTokenModel, "TokenLimit");
                    that.getModel("TokenLimit").refresh();

                    // Bind full foundation models response for UI consumption
                    var fmRaw = new sap.ui.model.json.JSONModel(data);
                    that.setModel(fmRaw, "FoundationModelsRaw");

                    // Flatten for simple list/table/dropdown bindings
                    var fmList = (Array.isArray(data.resources) ? data.resources : []).map(function (r) {
                        var v = (r.versions && r.versions[0]) || {};
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

                    // eslint-disable-next-line no-console
                    console.log("Token Data:", tokenConfigByTab);
                })
                .catch(function (error) {
                    // eslint-disable-next-line no-console
                    console.error("API Error:", error);
                    throw error;
                });
        },

    });
});