sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/f/library",
    "sap/ui/core/Fragment",
    "../model/formatter",
    "sap/ui/core/BusyIndicator",
    "aicockpitfeq/model/models",
    "aicockpitfeq/util/Utility",
    "sap/ui/export/Spreadsheet",
    "sap/ui/core/util/File",
    "sap/ui/Device",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/BusyDialog",
    "sap/m/MessageToast",
    "aicockpitfeq/util/PdfUtil",
    "aicockpitfeq/lib/pdf.min",
    "aicockpitfeq/lib/pdf.worker.min",
    "aicockpitfeq/xlxslibs/jszip",
    "aicockpitfeq/xlxslibs/xlsx",
    "aicockpitfeq/lib/index.umd"
], (Controller, fioriLibrary, Fragment, formatter, BusyIndicator, models, Utility, Spreadsheet, File, Device, Filter, Sorter, MessageBox, FilterOperator, JSONModel, BusyDialog, MessageToast, PdfUtil) => {
    "use strict";
    const EdmType = fioriLibrary.EdmType;
    return Controller.extend("aicockpitfeq.controller.View1", {
        formatter: formatter,
        _selectedTemplateKey: null,
        defaultHeaders: {
            "AI-Resource-Group": "default",
            "Content-Security-Policy": "default-src'none'"
        },

        onInit() {
            var that = this
            this.oView = this.getView();
            this.oRouter = this.getOwnerComponent().getRouter();
            this.isSystemSaved = false;
            ////models
            var switchFragments = models.createJSONModel(this, "currFrgModel");
            this.getView().setModel(switchFragments, "switchFragments");
            this._mViewSettingsDialogs = {};
            this._ProjectDetail = "";
            //view model setting
            this.executedOnce = false;
            this.isPromptAdded = true;
            this.isSystemEdited = false;
            this.savedSettings = false;
            this.stopEdit = false;
            this.addedFromCurrUser = false;
            this.isImage = false;
            this.saveAddEx = false;
            this.allAIModels = [];
            this.step = "Step1";
            this.setTCGKey = "";
            this.setBPMKey = "";

            const sUrl = sap.ui.require.toUrl("aicockpitfeq/templates/Style_Capgemini_Standard.docx");
            // this.byId("TemplateLink").setHref(sUrl);
            var sComponentName = this.getOwnerComponent().getManifestObject().getComponentName();
            this._sBasePath = sap.ui.require.toUrl(sComponentName.replace(/\./g, "/"));
            ////models
            var ObjectStorageFile = models.createJSONModel(this, "objStorageModel");
            this.getView().setModel(ObjectStorageFile, "ObjectFileList");

            this._loggedInUser = this.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/loggedInUserEmailId");
            this._loggedInUserName = this.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/loggedInUserName");
            var sSelectedProject = this.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/selectedProject");

            var oViewModel = models.createViewModel(sSelectedProject);

            this.getView().setModel(oViewModel, "viewModel");
            console.log("ViewModel:", oViewModel.getData()); 2
            this.getView().getModel("viewModel").setProperty("/templateToggle", false);
            ////models
            var oModel = models.createJSONModel(this, "appFileModel");
            this.getView().setModel(oModel, "appmodel");

            ////models
            var selKeyForDetailDetail = models.createJSONModel(this, "selKeyDetDetModel");
            this.getView().setModel(selKeyForDetailDetail, "selKeyForDetailDetail");
            ////models
            var enSysPromp = models.createJSONModel(this, "prmLibaddprmModel");
            this.getView().setModel(enSysPromp, "enSysPromp");

            var vFlagMod = this.getOwnerComponent().getModel("flagModel");
            this.getView().setModel(vFlagMod, "vFlagMod");

            this.getView().byId("selModel").setSelectedKey("M1");
            ///for select list
            ////models
            var scenarioEn = models.createJSONModel(this, "addPrmOpen");
            this.getView().setModel(scenarioEn, "scenarioEn");

            // start of madhu
            this.oBusyDialog = new sap.m.BusyDialog({
                title: "Please wait",
                text: "Getting data from Gen AI..."
            });
            // Model to store per-tab state
            ////models
            var oTabStateModel = models.createJSONModel(this, "tabState");
            this.getView().setModel(oTabStateModel, "tabState");

            // end of madhu
            ////models
            var fileViewModel = models.createJSONModel(this, "fileViewModel");
            this.getView().setModel(fileViewModel, "fileViewModel");

            //Start of Aishwarya
            ////models
            var oRagModel = models.createJSONModel(this, "ragModel");
            this.getView().setModel(oRagModel, "ragModel");

            ////models
            var oFileModel = models.createJSONModel(this, "ragFileModel");
            this.getView().setModel(oFileModel, "fileModel");

            //End of Aishwarya
            var oResponseModel = models.createResponseModel();
            this.getView().setModel(oResponseModel, "responseModel");
            oResponseModel.setProperty("/selectedPromptId", "");
            oResponseModel.setProperty("/originalPrompt", "");
            ////models
            var initPromptModel = models.createJSONModel(this, "promptModel");
            this.getView().setModel(initPromptModel, "BSPromptData");
            ////models
            var msgModel = models.createJSONModel(this, "aMsgModel");
            this.getView().setModel(msgModel, "msgModel");
            this._bUploadedViaRag = false;
            ////models
            var tcgModel = models.createJSONModel(this, "ampTCGModel");
            this.getView().setModel(tcgModel, "tcgModel");
            ////models
            var expModel = models.createJSONModel(this, "expandModel");
            this.getView().setModel(expModel, "expModel");
            ////models
            var stepModel = models.createJSONModel(this, "ampPCTStepModel");
            this.getView().setModel(stepModel, "stepModel");
            window.onbeforeunload = function (event) {

                that.getLogoutTime();

                return "";
            };
            var currentRoute = null;
            let logoutTriggered = false;
            let isManualNavigation = false;
            this.oRouter.attachRouteMatched(function (oEvent) {
                currentRoute = oEvent.getParameter("name");
                console.log("Route matched:", currentRoute);

                logoutTriggered = false;

                isManualNavigation = false;
            });
            var originalNavTo = this.oRouter.navTo.bind(this.oRouter);
            this.oRouter.navTo = function () {
                isManualNavigation = true;
                return originalNavTo.apply(null, arguments);
            };
            var oHashObject = new sap.ui.core.routing.HashChanger();
            var currentHash = oHashObject.getHash();
            var tab = currentHash.split("/")[1] || "DocGen";
            if (tab == "DocGen") {
                this.getView().getModel("viewModel").setProperty("/isDocGen", true);
            }
            this.getView().byId("navigationList").setSelectedKey(tab);
            this.getView().getModel("selKeyForDetailDetail").setProperty("/keyD", tab);
            // Initialize currentKey in tabState to match the initial tab from URL hash
            this.getView().getModel("tabState").setProperty("/currentKey", tab);
            window.addEventListener("popstate", function () {
                if (
                    currentRoute === "RouteView1" &&
                    !logoutTriggered &&
                    !isManualNavigation
                ) {
                    logoutTriggered = true;
                    console.log("Back button pressed on RouteView1");
                    that.getLogoutTime();
                }
            });
        },
        getLogoutTime: function () {
            var that = this;
            var mailId = that.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/loggedInUserEmailId");
            var date = new Date().toISOString();
            var logout_time = date.slice(0, date.indexOf(".")) + "Z";
            var sessionId = that.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/sessionId");
            var oPayload = {
                Email_Id: mailId,
                logout_time: logout_time,
                session_id: sessionId
            };
            var sUrl = this._sBasePath + "/cockpit/saveLogout";
            var payload = JSON.stringify({ payload: oPayload });
            // Use sendBeacon so the request survives page unload without timing out (no 504)
            if (navigator.sendBeacon) {
                navigator.sendBeacon(sUrl, new Blob([payload], { type: "application/json" }));
            } else {
                // Fallback for browsers without sendBeacon (synchronous XHR)
                var xhr = new XMLHttpRequest();
                xhr.open("POST", sUrl, false); // synchronous
                xhr.setRequestHeader("Content-Type", "application/json");
                try { xhr.send(payload); } catch (e) { console.warn("saveLogout XHR failed", e); }
            }
        },
        //Start of Aishwarya
        _refreshRagStateForKey: function (key) {
            //// need to review function
            var ragModel = this.getView().getModel("ragModel");
            var rag = ragModel.getProperty(`/ragMap/${key}`) || false;
            ragModel.setProperty("/currentRagEnabled", rag);
        },

        onNavItemSelect: function () {
            //// need to review function
            var key = this.selectedKeyFunct(); // uses navigationList.getSelectedKey() + switch
            this._refreshRagStateForKey(key);
        },

        getFiles: function (selDLTab) {
            var popUpSel = this.getView().getModel("switchFragments").getProperty("/frg/frName");
            if (popUpSel == "" || popUpSel == "knowlBAdmin") {
                BusyIndicator.show();

                var sSelectedIconTab = ""
                if (selDLTab && selDLTab !== "") {
                    sSelectedIconTab = selDLTab;
                } else {
                    sSelectedIconTab = this.selectedKeyFunct();
                }
                var ragModel = this.getView().getModel("ragModel");
                // var ragModel = this.getOwnerComponent().getModel("ragModel");
                var bRagEnabled = this.getView().byId("RagSwitch").getSelected()
                if (bRagEnabled) {
                    this.KBGetFiles(sSelectedIconTab);  //RAG function call
                } else {

                    var listObjectsUrl = this._sBasePath + "/cockpit/getFiles?Category=" + sSelectedIconTab + "&Project=" + this._ProjectDetail;

                    var that = this;
                    $.ajax({
                        url: listObjectsUrl,
                        type: "GET",
                        headers: that.defaultHeaders,
                        success: function (data) {
                            var fileNames = [];
                            var ObjectStorageFile = new sap.ui.model.json.JSONModel();
                            var contents = data?.value?.data?.Contents;
                            if (contents) {
                                var filteredFiles = contents.filter(item => item.category === sSelectedIconTab);
                                if (filteredFiles.length > 0) {
                                    fileNames = filteredFiles.map(file => ({
                                        Key: file.Key,
                                        Name: file.Key.split('/').pop(),
                                        UpdatedDate: file.LastModified
                                    }));
                                }
                            }

                            ObjectStorageFile.setData(fileNames);
                            that.getView().setModel(ObjectStorageFile, "ObjectFileList");
                            BusyIndicator.hide();
                        },
                        error: function (xhr, status, error) {
                            // Handle error if needed
                            BusyIndicator.hide();
                        }
                    });
                }
            }
        },
        KBGetFiles: function (sSelectedIconTab) {
            var listObjectsUrl = this._sBasePath + `/kb-integration/ListObjectStoreFiles?category=${sSelectedIconTab}&project=${this._ProjectDetail}`;
            var that = this;
            $.ajax({
                url: listObjectsUrl,
                type: "GET",
                headers: that.defaultHeaders,
                success: function (data) {
                    var fileNames = [];
                    var ObjectStorageFile = new sap.ui.model.json.JSONModel();
                    var contents = data?.files;
                    if (contents) {
                        var projUI = String(that._ProjectDetail).replace(/[^A-Za-z0-9]/g, "").toUpperCase();
                        var catUI = String(sSelectedIconTab).toUpperCase();
                        var filteredFiles = contents.filter(f => String(f.category).toUpperCase() === catUI && f.project === projUI);
                        if (filteredFiles.length > 0) {
                            fileNames = filteredFiles.map(file => ({
                                UpdatedDate: file.last_modified,
                                s3_key: "/" + catUI + "/" + projUI + "/" + file.filename,
                                Key: file.full_path,
                                Name: file.filename,
                                view_url: file.view_url,
                                download_url: file.download_url,
                                is_kb: file.full_path.startsWith("KB/")
                            }));
                        }
                    }

                    ObjectStorageFile.setData(fileNames);
                    that.getView().setModel(ObjectStorageFile, "ObjectFileList");
                    BusyIndicator.hide();
                },
                error: function (xhr, status, error) {
                    // Handle error if needed
                    BusyIndicator.hide();
                }
            });
        },
        onFileSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("value");  // what user typed
            var oBinding = oEvent.getSource().getBinding("items");

            var aFilters = [];

            if (sQuery) {
                aFilters.push(
                    new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sQuery)
                );
            }

            oBinding.filter(aFilters);
        },

        onBeforeRendering: function () {
            var that = this;

            // Create and set Project Model
            var prjModel = models.createJSONModel(this, "projectModel");
            this.getView().setModel(prjModel, "prjModel");

            if (!this._loggedInUser) {
                MessageBox.error("User ID is missing.");
                return;
            }

            BusyIndicator.show();
            var sUrl = this._sBasePath + "/cockpit/getProjectDetailsOfUser";
            var oPayload = {
                payload: {
                    UserId: this._loggedInUser,
                    userName: this._loggedInUserName
                }
            };

            $.ajax({
                url: sUrl,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(oPayload),
                success: function (data) {
                    var result = data && data.value && data.value.result ? data.value.result : {};
                    var projects = result.Project_Details || [];
                    var roles = result.UserRoles || {};
                    var hasAdminRole = !!roles.hasAdminRole;
                    var hasViewerRole = !!roles.hasViewerRole;

                    var oFlagModel = this.getOwnerComponent().getModel("flagModel");
                    if (oFlagModel) {
                        oFlagModel.setProperty("/isAdmin", hasAdminRole);
                        oFlagModel.setProperty("/isViewer", hasViewerRole);

                        if (oFlagModel.getProperty("/isSys") === undefined) {
                            oFlagModel.setProperty("/isSys", false);
                        }
                    }

                    this.getOwnerComponent().getModel("NetworkGraphModel").setProperty("/projects", projects);
                    that.getView().getModel("prjModel").setProperty("/projects", projects);

                    that.openPrjFragment();
                    BusyIndicator.hide();
                }.bind(this),
                error: function () {
                    BusyIndicator.hide();
                    MessageBox.show("Failed to load projects");
                }.bind(this)
            });
        },
        openPrjFragment: async function () {
            BusyIndicator.show();
            var that = this;
            if (!this.prjFrg) {
                this.prjFrg = await this.loadFragment({
                    name: "aicockpitfeq.fragment.ProjectList"
                }).then(function (oDialog) {
                    this.prjFrg = oDialog;
                    this.prjFrg.attachBrowserEvent("keydown", function (oEvent) {
                        if (oEvent.key === "Escape") {
                            oEvent.stopPropagation();
                            oEvent.preventDefault();
                        }
                    });
                    oDialog.open();
                    BusyIndicator.hide();
                    that.getTime();
                }.bind(this));
            } else {
                BusyIndicator.hide();
            }
        },
        onProjectSelected: function (oEvent) {
            var oSelectedItem = oEvent.getSource();
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext("prjModel");
            var projectId = oContext.getProperty("project");
            this._ProjectDetail = projectId;

            this.getView().getModel("prjModel").setProperty("/selectedProject", projectId);
            this.getOwnerComponent().getModel("NetworkGraphModel").setProperty("/selectedProject", projectId);
            this.closeSysKeyFr();

            this.updateProjectDetails(oEvent);
            this.getFiles();
        },

        onAfterRendering: function () {
            var that = this;
            this.onRefresh();
            // Load deployments
            that.callChatGPTModel();
            ///for switching between system and prompt fragment
            var switchTempModel = models.createJSONModel(this, "switchTemp");
            this.getView().setModel(switchTempModel, "switchTempModel");

        },
        callChatGPTModel: async function () {
            BusyIndicator.show();
            var that = this;
            var oPayload = {
                User_Email_Id: this._loggedInUser,
                userName: this._loggedInUserName
            };
            var payload = { payload: oPayload };
            var sUrl = this._sBasePath + "/cockpit/getDeployments";

            $.ajax({
                url: sUrl,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),
                success: async function (data, status, xhr) {
                    if (data.value.status && data.value.status == 400) {
                        if (!that.prjUserNotFound) {
                            that.prjUserNotFound = await that.loadFragment({
                                name: "aicockpitfeq.fragment.ProjectList"
                            }).then(function (oDialog) {
                                that.prjUserNotFound = oDialog;
                                this.prjUserNotFound.attachBrowserEvent("keydown", function (oEvent) {
                                    if (oEvent.key === "Escape") {
                                        oEvent.stopPropagation();
                                        oEvent.preventDefault();
                                    }
                                });
                                //  that.getView().byId("projectList").setVisible(false);
                                that.getView().getModel("prjModel").setProperty("/userDBnotAddedVis", true);
                                that.getView().getModel("prjModel").setProperty("/userDBnotAddedTxt", data.value.message);
                                // that.getView().byId("userDBnotAddedTxt").setVisible(true);
                                // that.getView().byId("userDBnotAddedTxt").setText(data.value.message);
                                oDialog.open();
                                BusyIndicator.hide();
                            }.bind(that));
                        } else {
                            BusyIndicator.hide();
                        }
                    } else {
                        that.getView().getModel("prjModel").setProperty("/userDBnotAddedVis", false);
                        that.getView().getModel("prjModel").setProperty("/userDBnotAddedTxt", "");
                        var aresult = data.value.result;
                        that.sApiUrl = aresult.sqlResponse.APIVERSION;
                        var allowedModels = [
                            "gpt-5",
                            "gpt-4o",
                            "anthropic--claude-3.5-sonnet",
                            "mistralai--mistral-small-instruct",
                            "mistralai--mistral-large-instruct",
                            "anthropic--claude-4.5-opus"
                        ];

                        var updatedGptModels = data.value.result.deployments.map(function (modelName) {
                            var modelType = "";
                            var sModelName =
                                modelName?.details?.resources?.backendDetails?.model?.name ||
                                modelName?.details?.resources?.backend_details?.model?.name ||
                                modelName?.configurationName ||
                                modelName?.scenarioId ||
                                modelName?.id;
                            var sConfigName = modelName?.configurationName?.toLowerCase() || "";
                            if (sConfigName.includes("gpt")) {
                                modelType = "GPT";
                            } else if (sConfigName.includes("mistral")) {
                                modelType = "Mistral";
                            } else if (sConfigName.includes("claude") || sConfigName.includes("sonnet")) {
                                modelType = "Anthropic";
                            }
                            else if (sConfigName.includes("amazon")) {
                                modelType = "Amazon";
                            } else {
                                modelType = "Others";
                            }
                            return {
                                key: modelName.id,
                                text: sModelName,
                                aiType: modelType
                            };
                        });
                        that.SelectedModel = updatedGptModels[0].text.configurationName;
                        var oViewModel = that.getView().getModel("viewModel");
                        oViewModel.setProperty("/gptModels", updatedGptModels);
                        that.allAIModels = updatedGptModels;
                        that.getView().byId("selModel").setSelectedKey("d5c02aa14db581a4");
                        var apiUrl = this._sBasePath + "/deployments/" + updatedGptModels[0].key + "/chat/completions?api-version=" + that.sApiUrl;

                        that.sUrl = {
                            BSUrl: "",
                            AIUrl: "",
                            UserUrl: "",
                            fstoconfUrl: "",
                            fstotsUrl: "",
                            tstocodeUrl: "",
                            tstocodeGitUrl: "",
                            coderemUrl: "",
                            codesumUrl: ""
                        };

                        Object.keys(that.sUrl).forEach(key => {
                            ////  that.sUrl[key] = apiUrl;
                            that.sUrl[key] = updatedGptModels[0].key;
                        });

                        var aimodels = updatedGptModels[0].text;
                        that.amodels = {
                            gpt32kmodel: "",
                            gpt4model: "",
                            gpt4omodel: "",
                            gpt35model: "",
                            gptpractmodel: "",
                            mistralmodel: "",
                            sonnetmodel: "",
                            textmodel: "",
                            textv2model: ""
                        };
                        Object.keys(that.amodels).forEach(key => {
                            that.amodels[key] = aimodels;
                        });
                        // that.getDataPromptMsg();
                        BusyIndicator.hide();
                    }
                }.bind(this),
                error: function (jqXhr, textStatus, errorMessage) {
                    try {
                        MessageBox.error(JSON.parse(jqXhr.responseText).error.message);
                    } catch (e) {
                        MessageBox.error("Failed to load deployments: " + jqXhr.statusText);
                    }
                    BusyIndicator.hide();
                }.bind(this)
            });

        },
        onListItemPress: async function (eveKey) {
            // start of madhu
            // saving tab tab
            var that = this;
            var oItem = eveKey.getParameter("item");
            var sNewKey = oItem.getKey();

            var oView = this.getView();
            var oStateModel = oView.getModel("tabState");
            // 1. Save current tab state
            var sOldKey = oStateModel.getProperty("/currentKey");
            this._saveTabState(sOldKey);
            // end of madhu
            // this.executedOnce = false;
            this.getView().byId("sapDocLabel").setVisible(false);
            this.getView().byId("sapDocSel").setVisible(false);
            this.getView().byId("tcTypeLabel").setVisible(false);
            this.getView().byId("tcTypeSel").setVisible(false);
            this.getView().getModel("ObjectFileList").setProperty("/", []);
            var that = this;
            this.getView().byId("prgIndicator").setVisible(false);
            this.getView().byId("nextBtn").setVisible(false);
            this.getView().byId("pctSysMsgBtn").setVisible(false);
            this.getView().getModel("tcgModel").setProperty("/linkVis", false);
            var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;

            this.getView().getModel("TokenLimit").setProperty("/tokenVis", false);
            this.getView().byId("gitAddBtn").setVisible(false);
            this.getView().byId("branchSel").setVisible(false);
            this.getView().byId("branchLabel").setVisible(false);
            this.getView().byId("gitFileTree").setVisible(false);
            this.getView().byId("sysAdd").setEnabled(true);
            this.getView().byId("addExBtn").setEnabled(true);
            //  this.getView().byId("openAIeditLabel").setVisible(false);
            this.getView().byId("openAiEdit").setVisible(false);
            this.getView().byId("openTCGTemp").setVisible(false);
            this.getView().byId("RagSwitch").setEnabled(true);
            this.getView().getModel("viewModel").setProperty("/isDocGen", false);
            if (eveKey.getParameters().item.getProperty("key")) {
                this.getView().byId("navigationList").setSelectedKey(eveKey.getParameters().item.getProperty("key"));
                if (eveKey.getParameters().item.getProperty("key") == "userLogKey") {
                    BusyIndicator.show();
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "user");
                    this.getView().getModel("switchFragments").refresh();
                    this.onAdminLogIconTabBarPress();

                } else if (eveKey.getParameters().item.getProperty("key") == "adminLogKey") {
                    BusyIndicator.show();
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "admin");
                    this.getView().getModel("switchFragments").refresh();
                    this.onAdminLogIconTabBarPress();

                } else if (eveKey.getParameters().item.getProperty("key") == "knowlegdeB") {
                    BusyIndicator.show();
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "knowlB");
                    this.getView().getModel("switchFragments").refresh();
                    var keytoSend = eveKey.getParameters().item.getProperty("key");
                    if (!this.kbfr) {
                        this.kbfr = await this.loadFragment({
                            name: "aicockpitfeq.fragment.KnowledgeBase"
                        });
                        this.getView().addDependent(this.kbfr);


                        BusyIndicator.hide();
                        this.kbfr.open();


                    } else {
                        BusyIndicator.hide();
                        this.kbfr.open(); // Reuse the g instance
                    }

                } else if (eveKey.getParameters().item.getProperty("key") == "knowlegdeBAdmin") {
                    BusyIndicator.show();
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "knowlBAdmin");
                    this.getView().getModel("switchFragments").refresh();
                    this.onAdminLogIconTabBarPress();
                }
                else if (eveKey.getParameters().item.getProperty("key") == "promptlib") {
                    BusyIndicator.show();
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "promptlibpr");
                    this.getView().getModel("switchFragments").refresh();
                    this.onAdminLogIconTabBarPress();
                } else if (eveKey.getParameters().item.getProperty("key") == "promptU") {
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "promptsUsed");
                    this.getView().getModel("switchFragments").refresh();
                    this.onAdminLogIconTabBarPress();
                }
                else if (eveKey.getParameters().item.getProperty("key") == "fb") {
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "feedback");
                    this.getView().getModel("switchFragments").refresh();
                    this.openFBfr();

                } else if (eveKey.getParameters().item.getProperty("key") == "DocGen") {
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "");
                    this.getView().getModel("switchFragments").refresh();
                    this.getView().byId("RagSwitch").setEnabled(false);
                    this.getView().byId("sysAdd").setEnabled(false);
                    this.getView().getModel("viewModel").setProperty("/isDocGen", true);
                    this.byId("docTypeSelector").setSelectedKey("");
                    this.getView().byId("navigationList").setSelectedKey(
                        eveKey.getParameters().item.getProperty("key")
                    );
                } else if (eveKey.getParameters().item.getProperty("key") == "bdPMO") {
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "");
                    this.getView().getModel("switchFragments").refresh();
                    this.getFiles();
                    this.getView().byId("navigationList").setSelectedKey(eveKey.getParameters().item.getProperty("key"));
                } else if (eveKey.getParameters().item.getProperty("key") == "usrCr") {
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "");
                    this.getView().getModel("switchFragments").refresh();
                    this.getFiles();
                    this.getView().byId("navigationList").setSelectedKey(eveKey.getParameters().item.getProperty("key"));
                }
                else if (eveKey.getParameters().item.getProperty("key") == "fcFSD") {
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "");
                    this.getView().getModel("switchFragments").refresh();
                    this.getFiles();
                    this.getView().byId("navigationList").setSelectedKey(eveKey.getParameters().item.getProperty("key"));

                }
                else if (eveKey.getParameters().item.getProperty("key") == "osdTSD") {
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "");
                    this.getView().getModel("switchFragments").refresh();
                    this.getFiles();
                    this.getView().byId("navigationList").setSelectedKey(eveKey.getParameters().item.getProperty("key"));

                }
                else if (eveKey.getParameters().item.getProperty("key") == "cdGen") {
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "");
                    this.getView().getModel("switchFragments").refresh();
                    this.getFiles();
                    this.getView().byId("navigationList").setSelectedKey(eveKey.getParameters().item.getProperty("key"));

                }
                else if (eveKey.getParameters().item.getProperty("key") == "cdRem") {
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "");
                    this.getView().getModel("switchFragments").refresh();
                    this.getFiles();
                    this.getView().byId("navigationList").setSelectedKey(eveKey.getParameters().item.getProperty("key"));

                }
                else if (eveKey.getParameters().item.getProperty("key") == "cdSum") {
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "");
                    this.getView().getModel("switchFragments").refresh();
                    this.getFiles();
                    this.getView().byId("navigationList").setSelectedKey(eveKey.getParameters().item.getProperty("key"));

                }
                else if (eveKey.getParameters().item.getProperty("key") == "gitKey") {
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "");
                    this.getView().getModel("switchFragments").refresh();
                    this.getView().byId("gitAddBtn").setVisible(true);
                    this.getView().byId("branchSel").setVisible(true);
                    this.getView().byId("branchLabel").setVisible(true);

                    this.getFiles();
                    this.getView().byId("navigationList").setSelectedKey(eveKey.getParameters().item.getProperty("key"));
                }
                else if (eveKey.getParameters().item.getProperty("key") == "tutKey") {
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "");
                    this.getView().getModel("switchFragments").refresh();
                    this.getFiles();
                    this.getView().byId("navigationList").setSelectedKey(eveKey.getParameters().item.getProperty("key"));
                }
                else if (eveKey.getParameters().item.getProperty("key") == "tcgKey") {
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "");
                    this.getView().getModel("switchFragments").refresh();
                    this.getView().getModel("tcgModel").setProperty("/linkVis", true);
                    this.getView().byId("tcTypeLabel").setVisible(true);
                    this.getView().byId("tcTypeSel").setVisible(true);
                    this.getView().byId("sysAdd").setEnabled(false);
                    this.getView().byId("addExBtn").setEnabled(false);
                    this.getView().byId("openTCGTemp").setVisible(true);
                    this.getFiles();
                    this.getView().byId("navigationList").setSelectedKey(eveKey.getParameters().item.getProperty("key"));
                }
                else if (eveKey.getParameters().item.getProperty("key") == "pctKey") {
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "");
                    this.getView().getModel("switchFragments").refresh();
                    this.getFiles();
                    //   this.getView().byId("openAIeditLabel").setVisible(true);
                    this.getView().byId("openAiEdit").setVisible(true);
                    this.getView().byId("sysAdd").setEnabled(false);
                    this.getView().byId("prgIndicator").setVisible(true);
                    this.getView().byId("addExBtn").setEnabled(false);
                    var pctStepArr = this.getView().getModel("stepModel").getProperty("/output");
                    if (pctStepArr.length !== 0) {
                        this.getView().byId("nextBtn").setVisible(true);
                    }
                    this.getView().byId("pctSysMsgBtn").setVisible(true);
                    this.getDataSysMsg();
                    this.getView().byId("navigationList").setSelectedKey(eveKey.getParameters().item.getProperty("key"));
                }
                else if (eveKey.getParameters().item.getProperty("key") == "bpmKey") {
                    this.getView().getModel("switchFragments").setProperty("/frg/frName", "");
                    this.getView().getModel("switchFragments").refresh();
                    this.getView().byId("sapDocLabel").setVisible(true);
                    this.getView().byId("sapDocSel").setVisible(true);
                    this.getView().byId("sysAdd").setEnabled(false);
                    this.getView().byId("addExBtn").setEnabled(false);
                    this.getFiles();
                    this.getView().byId("navigationList").setSelectedKey(eveKey.getParameters().item.getProperty("key"));
                }
                else {

                }
                var keytoSend = eveKey.getParameters().item.getProperty("key");
                var keyObj = { keyD: keytoSend };
                this.getView().getModel("selKeyForDetailDetail").setProperty("/keyD", keytoSend);
                //  Decide whether this tab should show DetailDetail or not
                var oTabs = oStateModel.getProperty("/tabs") || {};
                var oNewTabState = oTabs[sNewKey] || {};
                var bHasDetail = !!oNewTabState.hasDetail;
                if (this.getView().getModel("switchFragments").getProperty("/frg/frName") == "") {
                    if (bHasDetail) {
                        // show View1 + DetailDetail (two columns)
                        this.oRouter.navTo("DetailDetail", {
                            dispKey: keytoSend,
                            aimodel: selectedAI,
                            layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded
                        });
                    } else {
                        this.oRouter.navTo("RouteView1", {
                            tabName: keytoSend,
                            layout: fioriLibrary.LayoutType.OneColumn

                        });
                    }
                }

            }
            // 2. Set new current key
            oStateModel.setProperty("/currentKey", sNewKey);
            // 3. Restore values for new tab (if any)
            this._restoreTabState(sNewKey);
        },

        onFilterLogs: function () {
            var sFrg = this.getView().getModel("switchFragments").getProperty("/frg/frName");
            if (sFrg === "promptlibpr") {
                return this.onFilterPromptRegistry();
            }
            if (sFrg === "knowlBAdmin") {
                return this.onFilterKbAdmin();
            }
            if (sFrg === "promptsUsed") {
                return this.onPromptDetailsLiveSearch();
            }
            return this.onFilterUserLogs();
        },
        onFilterPromptRegistry: function () {
            var oTable = this.byId("idPromptRegistryTable");
            if (!oTable) {
                console.error("Prompt Registry table not found");
                return;
            }

            var oBinding = oTable.getBinding("items");
            if (!oBinding) {
                return;
            }

            var sSearch = this.byId("idUserLogSearch")
                ? this.byId("idUserLogSearch").getValue().trim()
                : "";

            var sUserId = this.byId("idPromptUserId")
                ? (this.byId("idPromptUserId").getValue() || "").trim()
                : "";



            var sStart = this.byId("idStartDate")?.getValue();
            //var sEnd = this.byId("idEndDate")?.getValue();

            var aFilters = [];
            //  new sap.ui.model.Filter("UpdatedBy",       sap.ui.model.FilterOperator.Contains, sSearch)
            /* Global search */
            if (sSearch) {
                aFilters.push(new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter({ path: "Prompt_Template", operator: sap.ui.model.FilterOperator.Contains, value1: sSearch, caseSensitive: false }),
                        new sap.ui.model.Filter({ path: "Name", operator: sap.ui.model.FilterOperator.Contains, value1: sSearch, caseSensitive: false }),
                        new sap.ui.model.Filter({ path: "UserId", operator: sap.ui.model.FilterOperator.Contains, value1: sSearch, caseSensitive: false }),
                        new sap.ui.model.Filter({ path: "ProjectId", operator: sap.ui.model.FilterOperator.Contains, value1: sSearch, caseSensitive: false })],
                    and: false
                }));
            }

            if (sUserId) {
                aFilters.push(new sap.ui.model.Filter("UserId", sap.ui.model.FilterOperator.Contains, sUserId));
            }
            if (sStart) {
                aFilters.push(
                    new sap.ui.model.Filter("Date_Added", function (value) {
                        if (!value) return false;

                        // value from model may be ISO string/date; normalize
                        var itemDate = new Date(value);
                        var startDate = new Date(sStart);

                        if (isNaN(itemDate.getTime()) || isNaN(startDate.getTime())) return false;

                        return (
                            itemDate.getFullYear() === startDate.getFullYear() &&
                            itemDate.getMonth() === startDate.getMonth() &&
                            itemDate.getDate() === startDate.getDate()
                        );
                    })
                );
            }
            oBinding.filter(aFilters, sap.ui.model.FilterType.Application);
        },
        onFilterKbAdmin: function () {
            var oTable = this.byId("kbTable");
            if (!oTable) return;

            var oBinding = oTable.getBinding("items");
            if (!oBinding) return;

            var sSearch = (this.byId("idUserLogSearch")?.getValue() || "").trim();
            var oSelectedDate = this.byId("idStartDate")?.getDateValue() || null;

            var aFilters = [];

            if (sSearch) {
                aFilters.push(new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter("filename", sap.ui.model.FilterOperator.Contains, sSearch),
                        new sap.ui.model.Filter("uplBy", sap.ui.model.FilterOperator.Contains, sSearch),
                        new sap.ui.model.Filter("project", sap.ui.model.FilterOperator.Contains, sSearch)
                    ],
                    and: false
                }));
            }


            if (oSelectedDate) {
                function toYMD(d) {
                    var dt = d instanceof Date ? d : new Date(d);
                    if (isNaN(dt)) return null;
                    return dt.getFullYear() + "-" +
                        String(dt.getMonth() + 1).padStart(2, "0") + "-" +
                        String(dt.getDate()).padStart(2, "0");
                }

                var selYMD = toYMD(oSelectedDate);

                aFilters.push(new sap.ui.model.Filter("last_modified", function (value) {
                    return toYMD(value) === selYMD;
                }));
            }

            oBinding.filter(aFilters, sap.ui.model.FilterType.Application);
        },
        onPromptDetailsLiveSearch: function (oEvent) {

            var q = "";
            if (oEvent && oEvent.getParameter) {
                q = oEvent.getParameter("newValue") || oEvent.getParameter("query") || "";
            }
            if (!q) {
                q = this.byId("idUserLogSearch")?.getValue() || "";
            }
            q = String(q).trim().toLowerCase();
            var table = this.byId("idPromptUsed");
            var binding = table && table.getBinding("items");
            if (!binding) return;
            var L = function (v) { return String(v || "").toLowerCase(); };
            var sUserId = (this.byId("idPromptUserId")?.getValue() || "").trim().toLowerCase();
            var oSelDate = this.byId("idStartDate")?.getDateValue() || null;
            function toYMD(d) {
                if (!d) return null;
                var dt = (d instanceof Date) ? d : new Date(d);
                if (isNaN(dt.getTime())) return null;
                var y = dt.getFullYear();
                var m = String(dt.getMonth() + 1).padStart(2, "0");
                var day = String(dt.getDate()).padStart(2, "0");
                return y + "-" + m + "-" + day;
            }

            var filters = [
                new sap.ui.model.Filter({ path: "user_id", test: function (v) { return L(v).includes(q); } }),
                new sap.ui.model.Filter({ path: "project", test: function (v) { return L(v).includes(q); } }),
                new sap.ui.model.Filter({ path: "model_name", test: function (v) { return L(v).includes(q); } }),
                new sap.ui.model.Filter({ path: "date", test: function (v) { return L(v).includes(q); } }),

                // arrays
                new sap.ui.model.Filter({ path: "prompts", test: function (arr) { return Array.isArray(arr) && L(arr.map(String).join(" ")).includes(q); } }),
                new sap.ui.model.Filter({ path: "sysmsgs", test: function (arr) { return Array.isArray(arr) && L(arr.map(String).join(" ")).includes(q); } }),
                new sap.ui.model.Filter({ path: "ids", test: function (arr) { return Array.isArray(arr) && L(arr.map(String).join(" ")).includes(q); } })
            ];
            var aAndFilters = [];

            // keep your current search behavior
            if (q) {
                aAndFilters.push(new sap.ui.model.Filter({ filters: filters, and: false }));
            }

            // apply User ID filter
            if (sUserId) {
                aAndFilters.push(new sap.ui.model.Filter({
                    path: "user_id",
                    test: function (v) { return L(v).includes(sUserId); }
                }));
            }
            if (oSelDate) {
                var selYMD = toYMD(oSelDate);
                aAndFilters.push(new sap.ui.model.Filter({
                    path: "date",
                    test: function (v) { return toYMD(v) === selYMD; }
                }));
            }

            // if nothing entered anywhere, clear
            if (aAndFilters.length === 0) {
                binding.filter([], sap.ui.model.FilterType.Application);
                return;
            }

            binding.filter(new sap.ui.model.Filter({ filters: aAndFilters, and: true }), sap.ui.model.FilterType.Application);
        },
        onFilterUserLogs: function () {
            var aFilters = [];
            var oTable = "";
            var popUpSel = this.getView().getModel("switchFragments").getProperty("/frg/frName");
            if (popUpSel == "user" || popUpSel == "admin") {

                oTable = this.byId("idUserLogTable");
                if (!oTable) {
                    console.error("User Log Table not found!");
                    return;
                }

                var oBinding = oTable.getBinding("items");
                var sSearch = this.byId("idUserLogSearch").getValue().toLowerCase();
                //       var sProjectKey = this.byId("idProjectFilter") ? this.byId("idProjectFilter").getSelectedKey() : "";
                var sStart = this.byId("idStartDate").getValue();
                //var sEnd = this.byId("idEndDate").getValue();

                ///       var sProjectText = this.byId("projectInput") ? this.byId("projectInput").getValue() : "";
                var sEmailText = this.byId("idPromptUserId") ? this.byId("idPromptUserId").getValue() : "";

                var aFilters = [];

                if (sSearch) {
                    aFilters.push(
                        new sap.ui.model.Filter({
                            filters: [
                                new sap.ui.model.Filter({
                                    path: "USERNAME",
                                    operator: sap.ui.model.FilterOperator.Contains,
                                    value1: sSearch,
                                    caseSensitive: false
                                }),
                                new sap.ui.model.Filter({
                                    path: "EMAIL_ID",
                                    operator: sap.ui.model.FilterOperator.Contains,
                                    value1: sSearch,
                                    caseSensitive: false
                                }),

                                new sap.ui.model.Filter("date", sap.ui.model.FilterOperator.Contains, sSearch),
                                new sap.ui.model.Filter("totalDuration", sap.ui.model.FilterOperator.Contains, sSearch)
                            ],
                            and: false
                        })
                    );
                }



                if (sEmailText) {
                    aFilters.push(new sap.ui.model.Filter("EMAIL_ID", sap.ui.model.FilterOperator.Contains, sEmailText));
                }

                if (sStart) {
                    aFilters.push(
                        new sap.ui.model.Filter("date", function (value) {

                            function convert(val) {
                                if (!val) return null;
                                if (val.includes("-")) {   // yyyy-mm-dd
                                    const p = val.split("-");
                                    return new Date(p[0], p[1] - 1, p[2]);
                                }
                                if (val.includes("/")) {   // dd/mm/yyyy
                                    const p = val.split("/");
                                    if (p.length === 3) {
                                        return new Date(p[2], p[1] - 1, p[0]);
                                    }
                                }
                                return null;
                            }

                            var itemDate = convert(value);
                            var startDate = convert(sStart);
                            if (!itemDate || !startDate) return false;
                            return (
                                itemDate.getFullYear() === startDate.getFullYear() &&
                                itemDate.getMonth() === startDate.getMonth() &&
                                itemDate.getDate() === startDate.getDate()
                            );

                        })
                    );
                }

                oBinding.filter(aFilters);

            } else if (popUpSel == "knowlBAdmin") {
                oTable = this.getView().byId("kbTable");

            } else if (popUpSel == "promptsUsed") {
                oTable = this.getView().byId("promptUsedTable");
            }
            var oBinding = oTable.getBinding("items");
            var sSearch = this.byId("idUserLogSearch").getValue().toLowerCase();
            var sProjectKey = this.byId("idProjectFilter") ? this.byId("idProjectFilter").getSelectedKey() : "";
            var sStart = this.byId("idStartDate").getValue();
            //var sEnd = this.byId("idEndDate").getValue();

            var sProjectText = this.byId("projectInput") ? this.byId("projectInput").getValue() : "";
            var sEmailText = this.byId("idPromptUserId") ? this.byId("idPromptUserId").getValue() : "";

            var aFilters = [];

            if (sSearch) {
                aFilters.push(
                    new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter({
                                path: "USERNAME",
                                operator: sap.ui.model.FilterOperator.Contains,
                                value1: sSearch,
                                caseSensitive: false
                            }),
                            new sap.ui.model.Filter({
                                path: "EMAIL_ID",
                                operator: sap.ui.model.FilterOperator.Contains,
                                value1: sSearch,
                                caseSensitive: false
                            }),
                            new sap.ui.model.Filter({
                                path: "project",
                                operator: sap.ui.model.FilterOperator.Contains,
                                value1: sSearch,
                                caseSensitive: false
                            }),
                            new sap.ui.model.Filter("date", sap.ui.model.FilterOperator.Contains, sSearch),
                            new sap.ui.model.Filter("totalDuration", sap.ui.model.FilterOperator.Contains, sSearch)
                        ],
                        and: false
                    })
                );
            }

            if (sProjectKey) {
                aFilters.push(new sap.ui.model.Filter("project", sap.ui.model.FilterOperator.EQ, sProjectKey));
            }

            if (sProjectText) {
                aFilters.push(new sap.ui.model.Filter("project", sap.ui.model.FilterOperator.Contains, sProjectText));
            }

            if (sEmailText) {
                aFilters.push(new sap.ui.model.Filter("EMAIL_ID", sap.ui.model.FilterOperator.Contains, sEmailText));
            }

            if (sStart) {
                aFilters.push(
                    new sap.ui.model.Filter("date", function (value) {

                        function convert(val) {
                            if (!val) return null;
                            if (val.includes("-")) {   // yyyy-mm-dd
                                const p = val.split("-");
                                return new Date(p[0], p[1] - 1, p[2]);
                            }
                            if (val.includes("/")) {   // dd/mm/yyyy
                                const p = val.split("/");
                                if (p.length === 3) {
                                    return new Date(p[2], p[1] - 1, p[0]);
                                }
                            }
                            return null;
                        }

                        var itemDate = convert(value);
                        var startDate = convert(sStart);
                        if (!itemDate || !startDate) return false;
                        return (
                            itemDate.getFullYear() === startDate.getFullYear() &&
                            itemDate.getMonth() === startDate.getMonth() &&
                            itemDate.getDate() === startDate.getDate()
                        );

                    })
                );
            }
            oBinding.filter(aFilters);
        },

        closeLogDialog: function () {
            var oDialog = this.byId("idUserLogDialog") || this.byId("idAdminLogDialog") || null;
            if (oDialog) {
                oDialog.close();
            }
        },


        onLogDialogClose: function (oEvent) {
            const oDialog = oEvent.getSource();

            if (oDialog) {
                oDialog.destroy();
            }
        },
        onFileDialogClose: function (oEvent) {
            const oDialog = oEvent.getSource();

            if (oDialog) {
                oDialog.destroy();
            }
        },
        onfileOpen: async function (ofileEve) {
            var that = this;
            var popUpSel = this.getView().getModel("switchFragments").getProperty("/frg/frName");
            if (popUpSel == "") {
                if (!this.fileFr) {
                    this.fileFr = await this.loadFragment({
                        name: "aicockpitfeq.fragment.SelectFile"
                    }).then(function (oDialog) {
                        this.fileFr = oDialog; // Store the dialog instance
                        this.fileFr.attachBrowserEvent("keydown", function (oEvent) {
                            if (oEvent.key === "Escape") {
                                oEvent.stopPropagation();
                                oEvent.preventDefault();
                            }
                        });
                        that.getFiles();
                        oDialog.open();
                        BusyIndicator.hide();
                    }.bind(this));
                } else {
                    BusyIndicator.hide();
                    this.fileFr.open(); // Reuse the existing instance
                }
            } else {
                MessageBox.information("Please select a functionality Tab from Navigation Group to use File Uploader!");

            }

        },
        onProjectSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue");
            var oTable = this.byId("idUserLogTable");
            var oBinding = oTable.getBinding("items");

            if (sQuery && sQuery.length > 0) {
                var oFilter = new sap.ui.model.Filter(
                    "project",
                    sap.ui.model.FilterOperator.Contains,
                    sQuery
                );
                oBinding.filter([oFilter]);
            } else {
                oBinding.filter([]);
            }
        },

        onAdminLogIconTabBarPress: async function () {

            var oview = this.getView();
            var that = this;
            var UserloginModel = new sap.ui.model.json.JSONModel();
            oview.setModel(UserloginModel, "UserloginModel");

            var catModel = models.createJSONModel(this, "categoryModel");
            this.getView().setModel(catModel, "catModel");
            if (this.getView().getModel("switchFragments").getProperty("/frg/frName") == "admin") {
                //user list log start
                var oPayload = {
                    project: this._ProjectDetail
                };

                var sUrl = this._sBasePath + "/cockpit/getLoginDetailsOfAllUser";

                /////original app url
                var oPayload1 = JSON.stringify(oPayload);
                $.ajax({
                    url: sUrl,
                    type: "GET",
                    data: oPayload,
                    success: function (data, status, xhr) {
                        var flattenedData = [];

                        data.value.result.forEach(function (session) {

                            flattenedData.push({
                                USERNAME: session.USERNAME,
                                EMAIL_ID: session.EMAIL_ID,
                                date: new Date(session.date).toLocaleDateString('en-GB'),
                                project: session.project === "null" ? " " : session.project,
                                totalSessions: session.totalSessions,
                                totalDuration: session.totalDuration,
                                totalTokensConsumed: session.totalTokensConsumed,
                                models: session.models || []
                            });
                        });


                        UserloginModel.setData(flattenedData);
                        UserloginModel.refresh();
                        BusyIndicator.hide();

                    },

                    error: function (jqXhr, textStatus, errorMessage) {
                        console.log(errorMessage);
                        console.log(JSON.parse(jqXhr.responseText).error.message);
                        BusyIndicator.hide();
                        MessageBox.error(jqXhr.responseText);
                    }
                });
                if (!this.adminLogList) {
                    // BusyIndicator.show();
                    this.adminLogList = await this.loadFragment({
                        name: "aicockpitfeq.fragment.UserListLog"
                    }).then(function (adminLogList) {
                        this.adminLogList = adminLogList; // Store the dialog instance
                        // this.adminLogList.setBusyIndicatorDelay(0);
                        // this.adminLogList.setBusy(true);
                        this.adminLogList.attachBrowserEvent("keydown", function (oEvent) {
                            if (oEvent.key === "Escape") {
                                oEvent.stopPropagation();
                                oEvent.preventDefault();
                            }
                        });
                        this.adminLogList.open();
                    }.bind(this));
                } else {
                    this.adminLogList.open();
                    BusyIndicator.hide();
                }
            } else if (this.getView().getModel("switchFragments").getProperty("/frg/frName") == "user") {

                var mailId = this._loggedInUser;
                var oPayload = {
                    Email_Id: mailId,
                    project: this._ProjectDetail
                };
                var sUrl = this._sBasePath + "/cockpit/getLoginDetails";

                BusyIndicator.show();
                $.ajax({
                    url: sUrl,
                    type: "GET",
                    data: oPayload,
                    success: function (data, status, xhr) {
                        var flattenedData = [];
                        var mailId = data.value.result.EMAIL_ID;
                        var uname = data.value.result.USERNAME;

                        data.value.result.sessionHistory.forEach(function (session) {

                            flattenedData.push({
                                USERNAME: uname,
                                EMAIL_ID: mailId,
                                date: new Date(session.date).toLocaleDateString('en-GB'),
                                sortDate: new Date(session.date).getTime(),
                                totalSessions: session.totalSessions,
                                totalDuration: session.totalDuration,
                                totalTokensConsumed: session.totalTokensConsumed,
                                project: session.project,
                                models: session.models || [],
                                selectedModelId: "",
                                selectedModelToken: ""
                            });

                        });

                        UserloginModel.setData(flattenedData);
                        UserloginModel.refresh();
                        BusyIndicator.hide();

                    },
                    error: function (jqXhr, textStatus, errorMessage) {
                        console.log(errorMessage);
                        console.log(JSON.parse(jqXhr.responseText).error.message);
                        BusyIndicator.hide();
                        MessageBox.error(jqXhr.responseText);
                    }
                });
                if (!this.adminLogList) {
                    // BusyIndicator.show();
                    this.adminLogList = await this.loadFragment({
                        name: "aicockpitfeq.fragment.UserListLog"
                    }).then(function (oDialog3) {
                        this.adminLogList = oDialog3; // Store the dialog instance
                        this.adminLogList.attachBrowserEvent("keydown", function (oEvent) {
                            if (oEvent.key === "Escape") {
                                oEvent.stopPropagation();
                                oEvent.preventDefault();
                            }
                        });
                        oDialog3.open();
                        //BusyIndicator.hide();
                    }.bind(this));
                } else {
                    this.adminLogList.open();
                    BusyIndicator.hide();
                }
            } else if (this.getView().getModel("switchFragments").getProperty("/frg/frName") == "promptlibpr") {

                var msgtypeModel = models.createJSONModel(this, "msgType");
                this.getView().setModel(msgtypeModel, "msgtypeModel");

                if (!this.adminLogList) {
                    // BusyIndicator.show();
                    this.adminLogList = await that.loadFragment({
                        name: "aicockpitfeq.fragment.UserListLog"
                    }).then(function (oDialog4) {
                        this.adminLogList = oDialog4;
                        this.adminLogList.attachBrowserEvent("keydown", function (oEvent) {
                            if (oEvent.key === "Escape") {
                                oEvent.stopPropagation();
                                oEvent.preventDefault();
                            }
                        });
                        oDialog4.open();
                        // var url = this._sBasePath + "/lm/promptTemplates?scenario=BS&version=0.0.1";
                        let sCategory = "BS";
                        let sMsgType = "prompt";
                        var roleSel = "user";
                        var url = this._sBasePath + "/cockpit/getPromptDetails?Category=" + sCategory + "&MsgType=" + sMsgType + "&ProjectId=" + that._ProjectDetail;
                        this.getView().byId("msgSelected").setSelectedKey(roleSel);
                        //this.getView().byId("msgSelected").setSelectedKey(roleSel);
                        that.onSearch(url, roleSel);
                        // BusyIndicator.hide();
                    }.bind(this));
                } else {
                    this.adminLogList.open();
                    BusyIndicator.hide();
                }
            } else if (this.getView().getModel("switchFragments").getProperty("/frg/frName") == "knowlB") {

            } else if (this.getView().getModel("switchFragments").getProperty("/frg/frName") == "promptsUsed") {
                this.getPromptDetailsofUser();
                if (!this.adminLogList) {
                    // BusyIndicator.show();
                    this.adminLogList = await this.loadFragment({
                        name: "aicockpitfeq.fragment.UserListLog"
                    }).then(function (oDialog5) {
                        this.adminLogList = oDialog5; // Store the dialog instance
                        this.adminLogList.attachBrowserEvent("keydown", function (oEvent) {
                            if (oEvent.key === "Escape") {
                                oEvent.stopPropagation();
                                oEvent.preventDefault();
                            }
                        });
                        oDialog5.open();
                        // BusyIndicator.hide();
                    }.bind(this));
                } else {
                    this.adminLogList.open();
                    BusyIndicator.hide();
                }
            } else if (this.getView().getModel("switchFragments").getProperty("/frg/frName") == "knowlBAdmin") {

                var sCategory = "BS";
                var sProject = this._ProjectDetail;
                var sUserName = this._loggedInUserName;
                this.loadKnowlBAdminFiles(sCategory, sProject, sUserName);

                if (!this.adminLogList) {
                    // BusyIndicator.show();
                    this.adminLogList = await this.loadFragment({
                        name: "aicockpitfeq.fragment.UserListLog"
                    }).then(function (oDialog) {
                        this.adminLogList = oDialog; // Store the dialog instance
                        this.adminLogList.attachBrowserEvent("keydown", function (oEvent) {
                            if (oEvent.key === "Escape") {
                                oEvent.stopPropagation();
                                oEvent.preventDefault();
                            }
                        });
                        oDialog.open();
                        //BusyIndicator.hide();
                    }.bind(this));
                } else {
                    this.adminLogList.open();
                    BusyIndicator.hide();
                }
            } else {
                this.getFiles("BS");
                if (!this.adminLogList) {
                    BusyIndicator.show();
                    this.adminLogList = await this.loadFragment({
                        name: "aicockpitfeq.fragment.UserListLog"
                    }).then(function (oDialog5) {
                        this.adminLogList = oDialog5; // Store the dialog instance
                        this.adminLogList.attachBrowserEvent("keydown", function (oEvent) {
                            if (oEvent.key === "Escape") {
                                oEvent.stopPropagation();
                                oEvent.preventDefault();
                            }
                        });
                        oDialog5.open();
                        // BusyIndicator.hide();
                    }.bind(this));
                } else {
                    this.adminLogList.open();
                    BusyIndicator.hide();
                }
            }

        },
        closeAdminLogListFragment: function () {
            for (var i = 0; i < this.getView().getDependents().length; i++) {
                if (this.getView().getDependents()[i].isOpen()) {
                    this.getView().getDependents()[i].close();
                }
            }

        },
        getPromptDetailsofUser: function () {
            var oView = this.getView();
            ////unused function
            var project = this._ProjectDetail;
            var busy = new sap.m.BusyDialog();
            busy.open();
            var sUrl = this._sBasePath + "/cockpit/getPromptDetailsofUser";
            $.ajax({
                url: sUrl,
                type: "POST",
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify({ payload: { project: project } }),
                success: function (resp) {
                    busy.close();
                    this._handlePromptDetailsSuccess(resp);
                }.bind(this),
                error: function (jqXhr) {
                    busy.close();
                    var msg = jqXhr?.responseJSON?.error?.message || "Failed to fetch prompt details.";
                    sap.m.MessageBox.error(msg);
                    console.error("getPromptDetailsofUser POST error:", msg);
                }
            });
        },

        _handlePromptDetailsSuccess: function (resp) {
            var oView = this.getView();
            var rows = [];
            for (var r = 0; r < resp.value.result.rows.length; r++) {
                var str = JSON.stringify(resp.value.result.rows[r].modelToken);
                var finalVal = str.replace(/[{}"]/g, "").replace(":", " : ");
                resp.value.result.rows[r].modelToken = finalVal;
            }
            var PromptsUsedModel = new sap.ui.model.json.JSONModel({
                rows: resp.value.result.rows
            });

            oView.setModel(PromptsUsedModel, "PromptsUsedModel");

            if (this.getView().getModel("promptsUsedDetail")) {
                this.getView().getModel("promptsUsedDetail").setData({
                    rows: resp.value.result.rows
                });
                this.getView().getModel("promptsUsedDetail").refresh();
            }
            BusyIndicator.hide();
            //this.getView().byId("idPromptUsedAdmin").getBinding("items").sort([new sap.ui.model.Sorter("model_name", false)]);
        },

        onMsgSel: function (eve) {

            var catSel = this.getView().byId("categorySelect").getSelectedKey();
            // var url = this._sBasePath + "/lm/promptTemplates?scenario=" + catSel + "&version=0.0.1";
            let url = "";
            if (eve.mParameters.selectedItem.mProperties.text == "Prompt") {
                url = this._sBasePath + "/cockpit/getPromptDetails?Category=" + catSel + "&MsgType=prompt&ProjectId=" + this._ProjectDetail;
                this.onSearch(url, "user");
                //  this.getView().byId("delPr").setEnabled(true);
                this.getOwnerComponent().getModel('flagModel').setProperty("/isSys", false);
            } else if (eve.mParameters.selectedItem.mProperties.text == "System") {
                url = this._sBasePath + "/cockpit/getPromptDetails?Category=" + catSel + "&MsgType=sysMsg&ProjectId=" + this._ProjectDetail;
                this.onSearch(url, "system");
                this.getOwnerComponent().getModel('flagModel').setProperty("/isSys", true);
                //this.getView().byId("delPr").setEnabled(false);
            }
        },
        openFBfr: async function () {
            var fbObj = {
                "priority": "Low",
                "issueType": "Technical",
                "issueSubject": "",
                "issueDesc": "",
                "CreatedBy": ""

            };
            this.getView().getModel("appmodel").setProperty("/feedbackForm", fbObj);
            if (!this.fbFragment) {
                this.fbFragment = await this.loadFragment({
                    name: "aicockpitfeq.fragment.Feedback"
                }).then(function (oDialog6) {
                    this.fbFragment = oDialog6; // Store the dialog instance
                    this.fbFragment.attachBrowserEvent("keydown", function (oEvent) {
                        if (oEvent.key === "Escape") {
                            oEvent.stopPropagation();
                            oEvent.preventDefault();
                        }
                    });
                    oDialog6.open();

                }.bind(this));
            } else {
                this.fbFragment.open();

            }
        },
        onFeedbackSubmit: function () {

            var oModel = this.getView().getModel("appmodel"),
                sPriority = oModel.getProperty("/feedbackForm/priority"),
                sIssueSub = oModel.getProperty("/feedbackForm/issueSubject"),
                sIssueDetail = oModel.getProperty("/feedbackForm/issueDesc"),
                sIssueType = oModel.getProperty("/feedbackForm/issueType"),
                that = this;
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            const formattedTime = `${hours}:${minutes}:${seconds}`;
            const dateTime = `${formattedDate} ${formattedTime}`;
            console.log("Date and Time:", dateTime);

            if (!sPriority || !sIssueDetail || !sIssueSub || !sIssueType) {
                sap.m.MessageBox.information(oBundle.getText("fillDetails"));
                return
            }
            var oPayload = {
                "Priority": sPriority,
                "IssueType": sIssueType,
                "IssueTitle": sIssueSub,
                "IssueDetail": sIssueDetail,
                "UserId": this._loggedInUser,
                "DateTime": dateTime
            };
            var payload = {};
            payload["payload"] = oPayload;
            oModel.setProperty("/feedbackDialog", oPayload);
            BusyIndicator.show();

            var sUrl = this._sBasePath + "/cockpit/createFeedback";
            $.ajax({
                url: sUrl,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),
                success: async function (data, status, xhr) {
                    var oFeedbackInit = {
                        "priority": "Low",
                        "issueType": "Technical",
                        "issueSubject": "",
                        "issueDesc": "",
                        "CreatedBy": ""
                    }
                    oModel.setProperty("/feedbackForm", oFeedbackInit);
                    BusyIndicator.hide();
                    that.closeSysKeyFr();
                    if (!that.tyfbFragment) {
                        that.tyfbSuccessFragment = await that.loadFragment({
                            name: "aicockpitfeq.fragment.FeedbackSuccess"
                        }).then(function (oDialog7) {
                            that.tyfbSuccessFragment = oDialog7; // Store the dialog instance
                            oDialog7.open();

                        }.bind(that));
                    } else {
                        that.tyfbSuccessFragment.open();

                    }
                    // sap.m.MessageBox.information(oBundle.getText("thankYouFeedback"));
                },
                error: function (jqXhr, textStatus, errorMessage) {
                    BusyIndicator.hide();
                    sap.m.MessageBox.error(oBundle.getText("errContactITTeam"));
                }
            });
        },
        onPressFeedbackEmail: function () {
            var oModel = this.getView().getModel("appmodel"),
                sIssueSub = oModel.getProperty("/feedbackForm/issueSubject") || " ",
                sIssueDetail = oModel.getProperty("/feedbackForm/issueDesc") || " ";
            window.location.href = "mailto:naassap-technicalsolutioncenter.in@capgemini.com?subject=" + sIssueSub + "&body=" + sIssueDetail;
        },
        onToggle: function () {
            const oSideNavigation = this.byId("sideNavigation"),
                bExpanded = oSideNavigation.getExpanded();

            oSideNavigation.setExpanded(!bExpanded);
            var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;

            var keyNeeded = this.getView().getModel("selKeyForDetailDetail").getProperty("/keyD");
            var sCurrentUrl = window.location.href;
            if (sCurrentUrl.includes("OneColumn")) {
                this.oRouter.navTo("RouteView1", { tabName: keyNeeded, layout: fioriLibrary.LayoutType.OneColumn });
            } else if (sCurrentUrl.includes("TwoColumnsMidExpanded")) {

                this.oRouter.navTo("DetailDetail", { dispKey: keyNeeded, aimodel: selectedAI, layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded })
            }
        },
        openAddFileFr: async function () {
            var fileData = [];
            var fileModel = new sap.ui.model.json.JSONModel(fileData);
            this.getView().setModel(fileModel, "fileModel");
            if (!this.addFileFr) {
                this.addFileFr = await this.loadFragment({
                    name: "aicockpitfeq.fragment.AddFile"
                }).then(function (oDialog8) {
                    this.addFileFr = oDialog8; // Store the dialog instance
                    this.addFileFr.attachBrowserEvent("keydown", function (oEvent) {
                        if (oEvent.key === "Escape") {
                            oEvent.stopPropagation();
                            oEvent.preventDefault();
                        }
                    });
                    oDialog8.open();
                }.bind(this));
            } else {
                this.addFileFr.open(); // Reuse the existing instance
            }
        },
        /////////////////////Detail page functions
        openAddExFragment: async function () {
            if (!this.addExFr) {
                this.addExFr = await this.loadFragment({
                    name: "aicockpitfeq.fragment.AddExamples"
                }).then(function (oDialog9) {
                    this.addExFr = oDialog9; // Store the dialog instance
                    this.addExFr.attachBrowserEvent("keydown", function (oEvent) {
                        if (oEvent.key === "Escape") {
                            oEvent.stopPropagation();
                            oEvent.preventDefault();
                        }
                    });
                    this.getView().addDependent(oDialog9);
                    oDialog9.open();
                }.bind(this));
            } else {

                this.addExFr.open(); // Reuse the existing instance
            }
        },
        cancelAddEx: function () {
            for (var i = 0; i < this.getView().getDependents().length; i++) {
                if (this.getView().getDependents()[i].isOpen()) {
                    this.getView().getDependents()[i].close();
                }
            }
        },
        saveAddExamples: function () {
            this.saveAddEx = true;
            var userTxt = this.getView().byId("userInputText").getValue();
            var assistTxt = this.getView().byId("assistInpText").getValue();
            var aMessages = [
                {
                    "role": "user",
                    "content": userTxt
                },
                {
                    "role": "assistant",
                    "content": assistTxt
                }
            ];
            this.getView().getModel("msgModel").setProperty("/aMsg", aMessages);
            sap.m.MessageToast.show("Added User and Assistant examples to the Payload!");
            this.closeSysKeyFr();
        },
        handleValueHelp: async function (evClick) {

            var popUpSel = this.getView().getModel("switchFragments").getProperty("/frg/frName");
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sSelectedIconTab = this.selectedKeyFunct();
            if (sSelectedIconTab !== "PCT" && sSelectedIconTab !== "BPM" && sSelectedIconTab !== "TCG" && sSelectedIconTab !== "DocGen") {
                if (popUpSel == "") {

                    if (!this.sysKeySelFr) {
                        BusyIndicator.show();
                        this.sysKeySelFr = await this.loadFragment({
                            name: "aicockpitfeq.fragment.SystemKeySelection"
                        }).then(async function (oDialog) {
                            this.oDialog = oDialog;
                            this.sysKeySelFr = oDialog; // Store the dialog instance
                            this.sysKeySelFr.setBusyIndicatorDelay(0);
                            this.sysKeySelFr.setBusy(true);
                            this.sysKeySelFr.attachBrowserEvent("keydown", function (oEvent) {
                                if (oEvent.key === "Escape") {
                                    oEvent.stopPropagation();
                                    oEvent.preventDefault();
                                }
                            });
                            this.getView().addDependent(oDialog);
                            this.getDataSysMsg();
                            this.oDialog.open();
                        }.bind(this)).finally(() => { BusyIndicator.hide() });

                    } else {
                        this.oDialog.setBusy(true);
                        this.oDialog.setBusyIndicatorDelay(0);
                        this.getDataSysMsg();
                        this.oDialog.open();
                        BusyIndicator.hide();
                        //this.sysKeySelFr.setBusy(false);
                    }
                } else {
                    MessageBox.information(oBundle.getText("selFuncTabspopup"));
                }
            }
        },
        openPromptValueHelp: async function () {
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var popUpSel = this.getView().getModel("switchFragments").getProperty("/frg/frName");
            if (popUpSel == "") {
                if (!this.promptVH) {
                    BusyIndicator.show();
                    this.promptVH = await this.loadFragment({
                        name: "aicockpitfeq.fragment.SelectPrompt"
                    }).then(function (oDialog1) {
                        this.oDialog1 = oDialog1;
                        this.promptVH = oDialog1;
                        this.promptVH.setBusyIndicatorDelay(0);
                        this.promptVH.setBusy(true);
                        this.promptVH.attachBrowserEvent("keydown", function (oEvent) {
                            if (oEvent.key === "Escape") {
                                oEvent.stopPropagation();
                                oEvent.preventDefault();
                            }
                        });
                        this.getView().addDependent(oDialog1);
                        this.getDataPromptMsg();
                        oDialog1.open();
                    }.bind(this)).finally(() => { BusyIndicator.hide() });
                } else {
                    this.oDialog1.setBusy(true);
                    this.oDialog1.setBusyIndicatorDelay(0);
                    this.getDataPromptMsg();
                    this.oDialog1.open();
                    BusyIndicator.hide();
                }
            } else {
                MessageBox.information(oBundle.getText("selFuncTabspopup"));
            }
        },
        closeSettings: function () {
            if (this.getView().getModel("viewModel").getProperty("/isParamPopupOpen")) {
                this.getView().getModel("viewModel").setProperty("/isParamPopupOpen", false);
            }
            for (var i = 0; i < this.getView().getDependents().length; i++) {
                if (this.getView().getDependents()[i].mProperties.title == "Settings") {
                    this.getView().getDependents()[i].close();
                }
            }
        },

        closeAddPrompt: function () {
            var catSel = this.byId("categorySelect").getSelectedKey();
            var msgSel = this.byId("msgSelected").getSelectedKey();
            // var url = this._sBasePath + "/lm/promptTemplates?scenario=" + catSel + "&version=0.0.1";
            if (msgSel == "user") {
                msgSel = "prompt";
            } else {
                msgSel = "sysMsg";
            }
            let url = this._sBasePath + "/cockpit/getPromptDetails?Category=" + catSel + "&MsgType=" + msgSel + "&ProjectId=" + this._ProjectDetail;
            this.onSearch(url, msgSel);
            var aDependents = this.getView().getDependents();

            aDependents.forEach(function (oDependent) {
                var title = oDependent.mProperties.title;
                if (title == "Add System Key" || title == "Add Prompt" || title == "Update System Key" || title == "Update Prompt") {
                    if (oDependent.isOpen && oDependent.isOpen()) {
                        oDependent.close();
                    }

                    if (oDependent instanceof sap.m.Dialog || oDependent.isA("sap.ui.core.Fragment")) {
                        oDependent.destroy();
                    }
                }
            });

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

            this.getView().getModel("viewModel").setProperty("/isParamPopupOpen", false);
        },
        onlistSysKeySel: function (selKeySys) {
            var descToExpanded = {};
            //Prompt
            if (this.getView().getModel("systemKeysModel").oData[0].fragmentName.includes("Prompt")) {
                this.getView().byId("multiInputPrompt").setValue(selKeySys.getSource().getProperty("title"));
                this.getView().byId("descTxtAreaPrompt").setValue(selKeySys.getSource().getProperty("description"));
                descToExpanded = { exTxt: selKeySys.getSource().getProperty("description") };
                ////this.getView().byId("editPrm").setVisible(true);

            } else if (this.getView().getModel("systemKeysModel").oData[0].fragmentName.includes("System")) {
                //systemkey
                this.getView().byId("multiInputSystem").setValue(selKeySys.getSource().getProperty("title"));
                this.getView().byId("descTxtArea").setValue(selKeySys.getSource().getProperty("description"));
                descToExpanded = { exTxt: selKeySys.getSource().getProperty("description") };

                this.getView().byId("editSys").setVisible(true);
                this.getView().byId("multiInputSystem").setEnabled(false);
                ////          this.getView().byId("deleteSysBtn").setVisible(true);
            } else {

            }
            this.getView().getModel("expModel").setProperty("/exTxt", descToExpanded);
            this.closeSysKeyFr();
        },
        onExpand: async function (ev) {
            if (!this.expandedTextFr) {
                this.expandedTextFr = await this.loadFragment({
                    name: "aicockpitfeq.fragment.expandedMsg"
                }).then(function (oDialog10) {
                    this.expandedTextFr = oDialog10; // Store the dialog instance
                    this.expandedTextFr.attachBrowserEvent("keydown", function (oEvent) {
                        if (oEvent.key === "Escape") {
                            oEvent.stopPropagation();
                            oEvent.preventDefault();
                        }
                    });
                    this.getView().addDependent(oDialog10);
                    if (ev.getSource().getId().includes("sysExpand")) {
                        this.getView().getModel("expModel").setProperty("/exTxt", this.getView().byId("descTxtArea").getValue());
                    } else if (ev.getSource().getId().includes("prmExpand")) {
                        this.getView().getModel("expModel").setProperty("/exTxt", this.getView().byId("descTxtAreaPrompt").getValue());

                    } else {
                        this.getView().getModel("expModel").setProperty("/exTxt", this.getOwnerComponent().getModel("gitModel").getProperty("/gitFileContent"));

                    }
                    this.getView().getModel("expModel").refresh();
                    oDialog10.open();
                }.bind(this));
            } else {
                if (ev.getSource().getId().includes("sysExpand")) {
                    if (this.getView().byId("descTxtArea").getValue() !== "") {
                        this.getView().getModel("expModel").setProperty("/exTxt", this.getView().byId("descTxtArea").getValue());
                    }
                } else if (ev.getSource().getId().includes("prmExpand")) {
                    if (this.getView().byId("descTxtAreaPrompt").getValue() !== "") {
                        this.getView().getModel("expModel").setProperty("/exTxt", this.getView().byId("descTxtAreaPrompt").getValue());
                    }
                } else {
                    this.getView().getModel("expModel").setProperty("/exTxt", this.getOwnerComponent().getModel("gitModel").getProperty("/gitFileContent"));
                }
                this.getView().getModel("expModel").refresh();
                this.expandedTextFr.open(); // Reuse the existing instance
            }

        },
        onRefresh: function (event) {
            this.isImage = false;
            var gitkeyTab = true;

            if (event && event.getSource().getId().includes("refreshBtn")) {
                gitkeyTab = false;
            }
            this.executedOnce = false;
            this.getView().byId("editSys").setVisible(false);
            this.getView().byId("editPrm").setVisible(false);
            this.getView().byId("multiInputSystem").setValue("");
            this.getView().byId("multiInputSystem").setEditable(true);
            this.getView().byId("multiInputSystem").setEnabled(true);
            this.getView().byId("addSysPart").setVisible(false);
            this.getView().byId("infoSys").setVisible(false);
            this.getView().byId("addSysPrefix").setVisible(false);
            this.getView().byId("RagSwitch").setSelected(false);
            this.onRagToggle();
            this.getView().byId("descTxtArea").setValue("");
            this.getView().byId("multiInputPrompt").setValue("");
            this.getView().byId("descTxtArea").setEditable(false);
            this.getView().byId("multiInputPrompt").setEditable(true);
            this.getView().byId("multiInputPrompt").setEnabled(true);
            this.getView().byId("cancelPrmBtn").setVisible(false);
            this.getView().byId("addPrPart").setVisible(false);
            this.getView().byId("addPrName").setVisible(false);
            this.getView().byId("descTxtAreaPrompt").setValue("");
            this.getView().byId("descTxtAreaPrompt").setEditable(false);
            this.getView().byId("docNameText").setVisible(false);
            this.getView().byId("viewDocBtn").setVisible(false);
            this.getView().byId("selDocList").setSelectedKey("");
            this.getView().byId("multiInputSystem").setValueState("None");
            this.getView().byId("descTxtArea").setValueState("None");
            this.getView().byId("multiInputPrompt").setValueState("None");
            this.getView().byId("descTxtAreaPrompt").setValueState("None");
            this.getView().byId("selDocList").setValueState("None");
            this.getView().getModel("ObjectFileList").setProperty("/", []);
            this.getView().getModel("appmodel").setProperty("/BSContent", "");
            this.getView().getModel("ragModel").setProperty("/ragFiles", []);
            ///   this.getView().byId("openAIeditLabel").setVisible(false);
            this.getView().byId("openAiEdit").setVisible(false);
            ////template changes
            this.getView().byId("TemplateUploader").setValue("");
            this.getView().byId("selectedTemplateName").setVisible(false);
            this.getView().byId("viewTemplateBtn").setVisible(false);
            var sTab = this.selectedKeyFunct();
            this.getView().getModel("fileModel").setProperty("/" + sTab, []);
            if (sTab == "DocGen") {
                this.getView().byId("docTypeSelector").setSelectedKey("");
            } else if (sTab == "BPM") {
                this.getView().byId("sapDocSel").setSelectedKey("");
            } else if (sTab == "TCG") {
                this.getView().byId("tcTypeSel").setSelectedKey("");

            } else if (sTab == "PCT") {
                this.getView().byId("pctSysMsgBtn").setVisible(false);
                this.getView().byId("prgIndicator").setPercentValue("0%");
                this.getView().byId("prgIndicator").setDisplayValue("Step1");
                this.getView().byId("nextBtn").setVisible(false);
                this.step = "Step1";
                this.getDataSysMsg();
                ///        this.getView().byId("openAIeditLabel").setVisible(true);
                this.getView().byId("openAiEdit").setVisible(true);
                this.getView().byId("pctSysMsgBtn").setVisible(true);
                this.getView().getModel("stepModel").setProperty("/output", []);
            }
            else if (sTab == "tstocodeGit" && gitkeyTab == false) {
                this.getOwnerComponent().getModel("gitModel").setProperty("/repoUrl", "");
                this.getOwnerComponent().getModel("gitModel").setProperty("/selectedBranch", "");
                this.getOwnerComponent().getModel("gitModel").setProperty("/patToken", "");
                this.getOwnerComponent().getModel("gitModel").setProperty("/username", "");
                this.getOwnerComponent().getModel("gitModel").setProperty("/gitFileStr", {});
                this.getOwnerComponent().getModel("gitModel").setProperty("/gitFileContent", "");

                this.getOwnerComponent().getModel("gitModel").setProperty("/filePath", "");
                this.getOwnerComponent().getModel("gitModel").setProperty("/emailId", "");
                this.getOwnerComponent().getModel("gitModel").setProperty("/commitMessage", "");
                this.getOwnerComponent().getModel("gitModel").setProperty("/branches", []);
                this.getOwnerComponent().getModel("gitModel").setProperty("/isFileSelected", false);
                this.getOwnerComponent().getModel("gitModel").setProperty("/selectedFilePath", "");
                //      this.getView().byId("viewGitFilebtn").setVisible(false);
                this.getView().byId("gitFileTree").setVisible(false);

            }


            this.getView().byId("saveSysBtn").setVisible(false);
            this.getView().byId("savePrm").setVisible(false);
            if (this.getView().getModel("expModel")) {
                this.getView().getModel("expModel").setProperty("/exTxt", "");
            }

            var historyMod = this.getOwnerComponent().getModel("historyModel");
            if (historyMod) {
                historyMod.oData = {};
                historyMod.refresh()
            }
            var aiMod = this.getOwnerComponent().getModel("airesponseDetailModel");
            if (aiMod) {
                aiMod.oData = {};
                aiMod.refresh()
            }
            var tokenMod = this.getView().getModel("TokenLimit");
            if (tokenMod) {
                tokenMod.setProperty("/tokenVis", false);
                tokenMod.setProperty("/usedToken", "");
                tokenMod.refresh();
            }

            var keyNeeded = this.getView().getModel("selKeyForDetailDetail").getProperty("/keyD");
            this.oRouter.navTo("RouteView1", { tabName: keyNeeded, layout: fioriLibrary.LayoutType.OneColumn });

        },
        disableInputsysmsg: function (oInput) {
            // oInput.setValue(sSelectedId);
            oInput.setEditable(true);
            oInput.setShowValueHelp(true);
            oInput.attachBrowserEvent("keydown", function (oEvent) {
                oEvent.preventDefault();
            });
            oInput.attachBrowserEvent("input", function (oEvent) {
                oEvent.preventDefault();
            });
            oInput.attachBrowserEvent("contextmenu", function (oEvent) {
                oEvent.preventDefault();
            });
        },
        onSuggtItemBSSysMsg: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var sDescription = oSelectedItem.getText();
                this.getView().byId("descTxtArea").setValue(sDescription);
                ///  this.BSinitialSysMsg = true;
            }
        },

        onSuggtItemBSPrompt: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var sDescription = oSelectedItem.getText();
                this.getView().byId("descTxtAreaPrompt").setValue(sDescription);
                ///  this.BSinitialSysMsg = true;
            }
        },
        addKey: function (eveKey) {

            var oView = this.getView();
            this.stopEdit = false;
            this.addedFromCurrUser = true;
            var oBundle = oView.getModel("i18n").getResourceBundle();
            var popUpSel = this.getView().getModel("switchFragments").getProperty("/frg/frName");
            if (popUpSel == "") {

                var scenarioSel = oView.byId("navigationList").getSelectedKey();

                if (!this._systemState) this._systemState = {};
                if (!this._systemState[scenarioSel]) {
                    this._systemState[scenarioSel] = { systemText: "" };
                }

                var oState = this._systemState[scenarioSel];

                if (oState.systemText && oState.systemText.trim() !== "") {
                    sap.m.MessageBox.warning(oBundle.getText("warningSystemMessage"));
                }


                this.onRefresh();

                if (eveKey.getSource().getId().includes("sysAdd")) {
                    oView.byId("saveSysBtn").setVisible(true);
                    oView.byId("addExBtn").setVisible(false);
                    oView.byId("editSys").setVisible(false);
                    oView.byId("descTxtArea").setValue("");

                    switch (scenarioSel) {
                        case "DocGen":
                            this.keyConst = "DocGen_CG-" + this._ProjectDetail + "_";
                            break;
                        case "bdPMO":
                            this.keyConst = "BusD_" + this._ProjectDetail + "_";
                            ////this.keyConst = "BusD_CG-DevCockpit_";
                            break;
                        case "usrCr":
                            this.keyConst = "UserS_" + this._ProjectDetail + "_";
                            //// this.keyConst = "UserS_CG-DevCockpit_";
                            break;
                        case "fcFSD":
                            this.keyConst = "FSCon_" + this._ProjectDetail + "_";
                            ////this.keyConst = "FSCon_CG-DevCockpit_";
                            break;
                        case "osdTSD":
                            this.keyConst = "FsTs_" + this._ProjectDetail + "_";
                            ////this.keyConst = "FsTs_CG-DevCockpit_";
                            break;
                        case "cdGen":
                            this.keyConst = "TsCod_" + this._ProjectDetail + "_";
                            //// this.keyConst = "TsCod_CG-DevCockpit_";
                            break;
                        case "cdRem":
                            this.keyConst = "CodeR_" + this._ProjectDetail + "_";
                            ////this.keyConst = "CodeR_CG-DevCockpit_";
                            break;
                        case "cdSum":
                            this.keyConst = "CodeS_" + this._ProjectDetail + "_";
                            //// this.keyConst = "CodeS_CG-DevCockpit_";
                            break;
                        case "gitKey":
                            this.keyConst = "TsCodGit_" + this._ProjectDetail + "_";
                            ////this.keyConst = "TsCodGit_CG-DevCockpit_";
                            break;
                        case "tutKey":
                            this.keyConst = "TUT_" + this._ProjectDetail + "_";
                            //// this.keyConst = "TUT_CG-DevCockpit_";
                            break;
                        case "bpmKey":
                            this.keyConst = "BPM_" + this._ProjectDetail + "_";
                            //// this.keyConst = "BPM_CG-DevCockpit_";
                            break;
                        case "tcgKey":
                            this.keyConst = "TCG_" + this._ProjectDetail + "_";
                            //// this.keyConst = "TCG_CG-DevCockpit_";
                            break;
                        case "pctKey":
                            this.keyConst = "PCT_" + this._ProjectDetail + "_";
                            ////this.keyConst = "PCT_CG-DevCockpit_";
                            break;
                    }

                    //     oView.byId("vbxSysAdd").setVisible(true);
                    oView.byId("addSysPrefix").setVisible(true);
                    oView.byId("infoSys").setVisible(true);
                    oView.byId("addSysPart").setVisible(true);
                    oView.byId("addSysPrefix").setValue(this.keyConst);
                    oView.byId("multiInputSystem").setEnabled(true);
                    oView.byId("multiInputSystem").setEditable(true);
                    oView.byId("infoSys").setVisible(false);
                    oView.byId("descTxtArea").setEditable(true);
                } else {
                    oView.byId("savePrm").setVisible(true);
                    oView.byId("descTxtAreaPrompt").setValue("");
                }
            }
            else {
                MessageBox.information(oBundle.getText("selFuncTabs"));
            }
        },

        deleteSysPrompt: function (eveBtn, onRefreshtab) {

            ///test this
            // this.getView().byId("keySysPart").setVisible(false);
            if (onRefreshtab || onRefreshtab == true) {
                this.getView().byId("saveSysBtn").setVisible(false);
                this.getView().byId("deleteSysBtn").setVisible(false);
                this.getView().byId("addExBtn").setVisible(true);
                this.getView().byId("editSys").setVisible(true);
                this.getView().byId("multiInputSystem").setValue("");
                this.getView().byId("descTxtArea").setValue("");
                this.getView().byId("descTxtArea").setEditable(false);
                this.getView().byId("multiInputSystem").setEnabled(true);
                this.getView().byId("editSys").setVisible(false); /// check functionality
                ////
                this.getView().byId("savePrm").setVisible(false);
                ////            this.getView().byId("cancelPrmBtn").setVisible(false);
                /////      this.getView().byId("editPrm").setVisible(false);
                this.getView().byId("promptAdd").setVisible(true);
                this.getView().byId("multiInputPrompt").setValue("");
                this.getView().byId("multiInputPrompt").setEnabled(true);
                // this.getView().byId("descTxtAreaPrompt").setEditable(false);
                this.getView().byId("descTxtAreaPrompt").setValue("");
            }
            if (eveBtn.getSource().getId().includes("deleteSysBtn")) {
                this.getView().byId("saveSysBtn").setVisible(false);
                this.getView().byId("deleteSysBtn").setVisible(false);
                this.getView().byId("addExBtn").setVisible(true);
                this.getView().byId("editSys").setVisible(true);
                this.getView().byId("multiInputSystem").setValue("");
                this.getView().byId("descTxtArea").setValue("");
                this.getView().byId("descTxtArea").setEditable(false);
                this.getView().byId("multiInputSystem").setEnabled(true);
                this.getView().byId("editSys").setVisible(false); /// check functionality
            } else {
                this.getView().byId("savePrm").setVisible(false);
                ////    this.getView().byId("cancelPrmBtn").setVisible(false);
                /////       this.getView().byId("editPrm").setVisible(false);
                this.getView().byId("promptAdd").setVisible(true);
                this.getView().byId("multiInputPrompt").setValue("");
                this.getView().byId("multiInputPrompt").setEnabled(true);
                this.getView().byId("multiInputPrompt").setEditable(true);
                //  this.getView().byId("descTxtAreaPrompt").setEditable(false);
                this.getView().byId("descTxtAreaPrompt").setValue("");
            }
        },
        openSettings: async function () {
            this.getView().getModel("viewModel").setProperty("/isParamPopupOpen", true);
            this.getView().getModel("viewModel").setProperty("/isParamPopupEdited", false);
            if (!this.settingsFr) {
                this.settingsFr = await this.loadFragment({
                    name: "aicockpitfeq.fragment.Settings"
                }).then(function (oDialog11) {
                    this.settingsFr = oDialog11; // Store the dialog instance
                    this.getView().addDependent(oDialog11);
                    this.settingsFr.open();
                }.bind(this));
            } else {

                this.settingsFr.open(); // Reuse the existing instance
            }
        },
        handleSaveParameterPopUp: function (oEvent) {

            // if (this.settingsFr) {
            this._savedTemperature = this.getView().getModel("viewModel").getProperty("/comnPopUpModelParamTemp");
            this._savedTopP = this.getView().getModel("viewModel").getProperty("/comnPopUpModelParamTopP");
            this._maxResponse = this.getView().getModel("viewModel").getProperty("/comnPopUpModelParamMaxLength");
            this._freqPenalty = this.getView().getModel("viewModel").getProperty("/comnPopUpModelParamFreqP");
            this._prePenalty = this.getView().getModel("viewModel").getProperty("/comnPopUpModelParamPresenceP");
            this._contextHist = this.getView().getModel("viewModel").getProperty("/comnPopUpModelParamContextHist");
            this.savedSettings = true;
            this.closeSysKeyFr();
            // } else {
            //     console.error("Failed to get the popover instance");
            // };
        },
        settingsRefresh: function () {

            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/comnPopUpModelParamTemp", 0.7);
            oViewModel.setProperty("/comnPopUpModelParamTopP", 0.95);
            oViewModel.setProperty("/comnPopUpModelParamMaxLength", 4000);
            oViewModel.setProperty("/comnPopUpModelParamFreqP", 0.1);
            oViewModel.setProperty("/comnPopUpModelParamPresenceP", 0.1);
            oViewModel.setProperty("/comnPopUpModelParamContextHist", 2);
            oViewModel.setProperty("/SelectedStopSequence", "None");
            oViewModel.setProperty("/TokenCount", 0);
            oViewModel.refresh(true);
        },
        onSystemEdit: function () {

            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            sap.m.MessageBox.warning(oBundle.getText("warningSystemMessage"));
            this.isSystemEdited = true;
            this.stopEdit = true;
            this.getView().byId("descTxtArea").setEditable(true);
            this.getView().byId("saveSysBtn").setVisible(true);
            this.getView().byId("editSys").setVisible(false);
        },

        saveSys: function (ev) {
            var oView = this.getView()
            var sFragmentName = oView.getModel("switchFragments").getProperty("/frg/frName");
            var systemKeyPayload = "";
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sysContent = "";
            var scenarioSel = this.getView().byId("navigationList").getSelectedKey();
            let catSel = "";
            if (ev.getSource().getId().includes("listView1--saveSysBtn") == true && scenarioSel == "promptlib") {
                MessageBox.error(oBundle.getText("selFuncTabsBtn"));
            } else {
                if (sFragmentName !== "promptlibpr") {
                    catSel = this.selectedKeyFunct();
                    sysContent = this.getView().byId("descTxtArea").getValue();
                    //if (ev.getSource().getId().includes("listView1--saveSysBtn") == true) {
                    this.getView().byId("descTxtArea").setEditable(false);
                    this.getView().byId("multiInputSystem").setEditable(true);
                    this.getView().byId("saveSysBtn").setVisible(false);
                    ////      this.getView().byId("deleteSysBtn").setVisible(false);
                    this.getView().byId("editSys").setVisible(true);

                    var scenario = "";
                    switch (scenarioSel) {
                        case "bdPMO":
                            scenario = "BS";
                            break;
                        case "usrCr":
                            scenario = "User";
                            break;
                        case "DocGen":
                            scenario = "DocGen";
                            break;
                        case "fcFSD":
                            scenario = "fstoconf";
                            break;
                        case "osdTSD":
                            scenario = "fstots";
                            break;
                        case "cdGen":
                            scenario = "tstocode";
                            break;
                        case "cdRem":
                            scenario = "coderem";
                            break;
                        case "cdSum":
                            scenario = "codesum";
                            break;
                        case "gitKey":
                            scenario = "tstocodeGit";
                            break;
                        case "tutKey":
                            scenario = "TUT";
                            break;
                        case "bpmKey":
                            scenario = "BPM";
                            break;
                        case "tcgKey":
                            scenario = "TCG";
                            break;
                        case "pctKey":
                            scenario = "PCT";
                            break;
                    }
                    var sysName = "";
                    /////var sysName = this.getView().byId("multiInputSystem").getValue();
                    if (this.isSystemEdited == true) {
                        sysName = this.getView().byId("multiInputSystem").getValue();
                    } else {
                        sysName = this.getView().byId("addSysPrefix").getValue() + this.getView().byId("multiInputSystem").getValue();
                        this.getView().byId("addSysPart").setVisible(false);
                        this.getView().byId("multiInputSystem").setValue(sysName);
                        this.stopEdit = true;
                        this.getView().byId("addSysPrefix").setVisible(false);
                        this.getView().byId("infoSys").setVisible(false);
                    }
                    this.stopEdit = true;
                    var createdIn = "";
                    var updatedIn = "";
                    if (this.addedFromCurrUser == true) {
                        createdIn = this._ProjectDetail;
                    }
                    if (this.isSystemEdited == true) {
                        updatedIn = this._ProjectDetail;
                    }
                }
                if (this.keyConst == sysName && sFragmentName !== "promptlibpr") {
                    //    if (this.keyConst == sysName && ev.getSource().getId().includes("listView1--saveSysBtn") == true) {
                    this.getView().byId("multiInputSystem").setEnabled(true);
                    this.getView().byId("multiInputSystem").setValueState("Error");
                    this.getView().byId("multiInputSystem").setValueStateText("Enter Unique System Message ID");
                    this.getView().byId("editSys").setVisible(false);
                } else if (sysContent == "" && sFragmentName !== "promptlibpr") {
                    //} else if (sysContent == "" && ev.getSource().getId().includes("listView1--saveSysBtn") == true) {
                    this.getView().byId("descTxtArea").setEditable(true);
                    this.getView().byId("descTxtArea").setValueState("Error");
                    this.getView().byId("descTxtArea").setValueStateText("Enter System Message Description");
                    this.getView().byId("editSys").setVisible(false);
                } else if (sFragmentName == "promptlibpr") {
                    catSel = this.getView().byId("categorySelect").getSelectedKey();
                    sysContent = this.getView().getModel("savePrmModel").oData.spec.template[0].content;
                    sysName = this.getView().getModel("savePrmModel").oData.name;
                }
                // else {
                // if (sFragmentName !== "promptlibpr") {
                //if (ev.getSource().getId().includes("listView1--saveSysBtn") == true) {

                systemKeyPayload = {
                    payload: {
                        Prompt_Details: sysContent,
                        Category: catSel,
                        MsgType: "sysMsg",
                        ProjectId: this._ProjectDetail,
                        PromptId: sysName,
                        UserId: this._loggedInUser,
                        DateTime: new Date().toISOString(),
                    }
                };
                // } 
                // else {
                //     ////delete this.getView().getModel("savePrmModel").oData.additionalInfo;
                //     systemKeyPayload = this.getView().getModel("savePrmModel").oData;
                //     if (systemKeyPayload.name.includes(this.getView().getModel("enSysPromp").getProperty("/sysKey"))) {

                //     } else {
                //         systemKeyPayload.name = this.getView().getModel("enSysPromp").getProperty("/sysKey") + systemKeyPayload.name;
                //     }
                // }
                var that = this;

                $.ajax({
                    url: this._sBasePath + "/cockpit/createPromptDetails",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(systemKeyPayload),
                    success: async function (data, status, xhr) {
                        if (that.addedFromCurrUser == true) {
                            sap.m.MessageToast.show("System Message Created");
                        }
                        if (that.isSystemEdited == true) {
                            sap.m.MessageToast.show("System Message Updated");
                        }
                        that.getDataSysMsg();
                        if (sFragmentName === "promptlibpr") {
                            //if (ev.getSource().getId().includes("listView1--saveSysBtn") == true) {
                            that.getView().byId("idPromptRegistryTable").removeSelections(true);
                            if (that.getView().byId("idPromptRegistryTable").getBinding("items")) {
                                that.getView().byId("idPromptRegistryTable").getBinding("items").refresh();
                                var catSel = that.getView().byId("categorySelect").getSelectedKey();
                                //var url = "/cockpit/getPromptDetails?scenario=" + catSel + "&version=0.0.1&ProjectId=" + that._ProjectDetail;
                                var roleSel = "sysMsg"
                                var url = this._sBasePath + "/cockpit/getPromptDetails?Category=" + catSel + "&MsgType=" + roleSel + "&ProjectId=" + that._ProjectDetail;

                                that.onSearch(url, roleSel);
                            }
                            that.closeAddPrompt();
                        } else {
                            that.isSystemSaved = true;
                            that.isSystemEdited = false;

                            that.getView().byId("saveSysBtn").setVisible(false);
                            that.getView().byId("addExBtn").setVisible(true);
                            that.getView().byId("descTxtArea").setEditable(false);
                            that.getView().byId("multiInputSystem").setEnabled(true);
                            that.getView().byId("editSys").setVisible(true);
                            ///       that.disableInputsysmsg(that.getView().byId("multiInputSystem"));
                            that.getFiles();
                        }
                    },
                    error: function (jqXhr, textStatus, errorMessage) {
                        that.getView().byId("descTxtArea").setValue("");
                        that.getView().byId("multiInputSystem").setValue("");
                        that.getView().byId("editSys").setVisible(false);
                        BusyIndicator.hide();
                        MessageBox.error(JSON.parse(jqXhr.responseText).message);
                    }
                });
                // }
            }
        },

        selChangeDoc: function (eveSelVal) {
            var that = this;
            var _this = this;
            var busyDialog = new sap.m.BusyDialog();
            var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
            if (bRagEnabled) {
                that.KBselChangeDoc(eveSelVal);
            } else {
                busyDialog.open();
                var aContexts = eveSelVal.getParameter("selectedContexts");
                var fileDets = {};
                var oFile = "";
                if (aContexts && aContexts.length) {
                    var obj = aContexts[0].getObject();
                    var oKey = obj.Key || obj.s3_key || obj.full_path;
                    var oFile = obj.Name;
                    var encodedKey = encodeURIComponent(oKey);
                    var objectStoreUrl = this._sBasePath + "/cockpit/getFileDetails(key='" + encodedKey + "')";
                    this.getView().byId("fileUploader1").setValue("");
                    this.getView().byId("docNameText").setVisible(true);
                    this.getView().byId("viewDocBtn").setVisible(true);

                    this.getView().byId("docNameText").setText(oFile);

                    var vector = 0;
                    var sSelectedIconTab = this.selectedKeyFunct();

                    var oModel = this.getView().getModel("appmodel");
                    var selItem = eveSelVal.getParameters().selectedItem;

                    var oBundle = this.getView().getModel("i18n").getResourceBundle();
                    var encodedKey = encodeURIComponent(oKey);
                    var objectStoreUrl = this._sBasePath + "/cockpit/getFileDetails(key='" + encodedKey + "')";
                    var fileExtension = oFile.split('.').pop().toLowerCase();
                    fileDets = {
                        Key: oKey,
                        Name: oFile,
                        srcUrl: ""
                    };

                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", objectStoreUrl, true);
                    xhr.responseType = "arraybuffer";

                    xhr.onload = function () {
                        if (xhr.status !== 200) {
                            busyDialog.close();
                            sap.m.MessageBox.error("File download failed");
                            return;
                        }
                        var data = xhr.response;

                        _this.executedOnce = false;
                        if (fileExtension === "txt") {
                            that.getView().getModel("fileViewModel").setProperty("/srcUrl", "");
                            _this.getView().getModel("tcgModel").setProperty("/wordorExcel", "word");
                            var text = new TextDecoder("utf-8").decode(data);
                            oModel.setProperty("/BSContent", text);
                            busyDialog.close();
                        } else if (fileExtension === "pdf") {

                            that.getView().getModel("fileViewModel").setProperty("/srcUrl", "");
                            _this.getView().getModel("tcgModel").setProperty("/wordorExcel", "word");


                            let uint8;
                            try {
                                const text = new TextDecoder("utf-8").decode(data);
                                const json = JSON.parse(text);

                                if (json && json.value) {
                                    const cleanB64 = json.value
                                        .replace(/\s/g, "")
                                        .replace(/^data:application\/pdf;base64,/, "");

                                    const binary = atob(cleanB64);
                                    uint8 = new Uint8Array(binary.length);
                                    for (let i = 0; i < binary.length; i++) {
                                        uint8[i] = binary.charCodeAt(i);
                                    }
                                } else {
                                    throw "Not JSON PDF";
                                }
                            } catch (e) {

                                uint8 = new Uint8Array(data);
                            }

                            pdfjsLib.getDocument({ data: uint8 }).promise
                                .then(pdf => {
                                    const promises = [];
                                    for (let i = 1; i <= pdf.numPages; i++) {
                                        promises.push(
                                            pdf.getPage(i)
                                                .then(p => p.getTextContent())
                                                .then(tc => tc.items.map(it => it.str).join(" "))
                                        );
                                    }
                                    return Promise.all(promises);
                                })
                                .then(pages => {
                                    oModel.setProperty("/BSContent", pages.join("\n"));
                                    busyDialog.close();
                                })
                                .catch(err => {
                                    console.error("PDF parse failed", err);
                                    busyDialog.close();
                                });

                            return;
                        } else if (fileExtension === "docx") {
                            that.getView().getModel("fileViewModel").setProperty("/srcUrl", "");
                            _this.getView().getModel("tcgModel").setProperty("/wordorExcel", "word");
                            var text = new TextDecoder("utf-8").decode(data);
                            var jsonData = JSON.parse(text);
                            var actualText = jsonData.value;
                            oModel.setProperty("/BSContent", actualText);
                            busyDialog.close();

                        }
                        else if (fileExtension === "xlsx" || fileExtension === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                            that.getView().getModel("fileViewModel").setProperty("/srcUrl", "");
                            _this.getView().getModel("tcgModel").setProperty("/wordorExcel", "excel");
                            console.log("XHR response:", data);
                            //Step 1: Convert ArrayBuffer → UTF‑8 text
                            let jsonText = new TextDecoder("utf-8").decode(data);

                            //Step 2: Parse JSON containing Base64 Excel
                            let json = JSON.parse(jsonText);

                            //Step 3: Base64 → binary string
                            const base64 = json.value;
                            const binary = atob(base64);

                            // Step 4: binary string → Uint8Array (required for XLSX)
                            const uint8 = new Uint8Array(binary.length);
                            for (let i = 0; i < binary.length; i++) {
                                uint8[i] = binary.charCodeAt(i);
                            }

                            // Step 5: Parse Excel using XLSX.js
                            const workbook = XLSX.read(uint8, { type: "array" });

                            // Step 6: Convert all sheets to CSV or text
                            let allText = "";
                            let excelDataAsObjects = {};
                            let sheetName = "";
                            workbook.SheetNames.forEach(name => {
                                allText += `Sheet: ${name}\n`;
                                sheetName = name;
                                allText += XLSX.utils.sheet_to_csv(workbook.Sheets[name]) + "\n\n";
                                excelDataAsObjects[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
                            });

                            // Save both raw text + structured JSON
                            that.getView().getModel("fileViewModel").setProperty("/xlsJsonData", excelDataAsObjects[sheetName]);
                            oModel.setProperty("/BSContent", allText);

                            busyDialog.close();
                            return;
                        } else if (fileExtension === "png" || fileExtension === "jpeg" || fileExtension === "jpg") {
                            that.getView().getModel("tcgModel").setProperty("/wordorExcel", "image");
                            that.getView().getModel("fileViewModel").setProperty("/srcUrl", "");

                            // ✅ 1. Convert ArrayBuffer → Text (UTF‑8)
                            let jsonText = new TextDecoder("utf-8").decode(data);

                            // ✅ 2. Parse JSON
                            let json;
                            try {
                                json = JSON.parse(jsonText);   // contains { value: "base64-string" }
                            } catch (e) {
                                console.error("Image JSON parse failed", e);
                                busyDialog.close();
                                return;
                            }

                            // ✅ 3. Base64 data returned by backend
                            const base64 = json.value;

                            // ✅ 4. Create data URL
                            const fileDataUrl = "data:image/" + fileExtension + ";base64," + base64;

                            // ✅ 5. Set preview image in UI5 model
                            that.getView().getModel("fileViewModel").setProperty("/srcUrl", fileDataUrl);

                            // ✅ 6. Create payload object (like you did before)
                            var imageObject = {
                                "type": "image_url",
                                "image_url": {
                                    "url": fileDataUrl
                                }
                            };

                            oModel.setProperty("/BSContent", [imageObject]);
                            busyDialog.close();
                        } else {
                            busyDialog.close();
                        }

                        that.closeSysKeyFr();
                    };
                    xhr.onerror = function () {
                        busyDialog.close();
                        MessageBox.error("Network error");
                    };

                    xhr.send();
                } else {
                    busyDialog.close();
                    this.closeSysKeyFr();
                    MessageBox.warning(oBundle.getText("warningNoItemsSelected"));

                }
                this.getView().byId("selDocList").setValueState("None");
                this.getView().byId("multiInputPrompt").setValueState("None");
                this.getView().getModel("fileViewModel").setData(fileDets);
                this.getView().getModel("fileViewModel").refresh();
            }
        },
        KBselChangeDoc: function (eveSelVal) {

            var busyDialog = new sap.m.BusyDialog();
            busyDialog.open();
            const aContexts = eveSelVal.getParameter("selectedContexts");

            if (!aContexts || !aContexts.length) {
                this.closeSysKeyFr();
                return;
            }
            const obj = aContexts[0].getObject();
            const oFile = obj.filename || obj.Name || "";
            const fileExtension = (oFile.split(".").pop() || "").toLowerCase();
            const objectStoreUrl = obj.view_url || obj.download_url || obj.Key || obj.url;

            this.getView().byId("fileUploader1").setValue("");
            this.getView().byId("docNameText").setText(oFile);
            this.getView().byId("docNameText").setVisible(true);
            this.getView().byId("viewDocBtn").setVisible(true);


            const fileDets = {
                Key: obj.full_path || obj.Key || "",   // keep your key/path
                Name: oFile,
                srcUrl: objectStoreUrl
            };
            const fileVM = this.getView().getModel("fileViewModel");
            fileVM.setData(fileDets);
            fileVM.refresh();
            const appModel = this.getView().getModel("appmodel");
            var data = {
                url: objectStoreUrl
            };
            appModel.setProperty("/BSContent", data);
            this.getView().getModel("tcgModel").setProperty("/wordorExcel", "word");
            busyDialog.close();
            this.closeSysKeyFr();
            this.getView().byId("selDocList").setValueState("None");
            this.getView().byId("multiInputPrompt").setValueState("None");
            this._lastSelectedFileExt = fileExtension;

        },

        onFileDelete: function (oEvent) {
            var _this = this;
            var sFragmentName = this.getView().getModel("switchFragments").getProperty("/frg/frName");
            var oSource = oEvent.getSource();
            var oItem = oSource;
            var typeDel = "POST";
            while (oItem && !oItem.getBindingContext("ObjectFileList")) {
                oItem = oItem.getParent();
            }
            var oContext = oItem && oItem.getBindingContext("ObjectFileList");
            if (!oContext) {
                sap.m.MessageBox.error("Unable to retrieve file details");
                return;
            }

            var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
            var sFileRef = "";
            if (sFragmentName === "knowlBAdmin") {
                sFileRef = oContext.getProperty("view_url")
            }
            else {
                sFileRef = oContext.getProperty("Key");
            }
            if (!sFileRef || typeof sFileRef !== "string") {
                sap.m.MessageBox.error("Invalid file reference");
                return;
            }
            var sObjectKey = sFileRef;
            var aParts = [];
            if (sFileRef.startsWith("http")) {
                var oUrl = new URL(sFileRef);
                aParts = oUrl.pathname.replace(/^\/+/, "").split("/");

                aParts.shift();

                sObjectKey = aParts.join("/");
            } else {
                aParts = sObjectKey.replace(/^\/+/, "").split("/");
            }
            var oPayload = {
                files: [sObjectKey]
            };
            var sUrl = this._sBasePath + "/cockpit/deleteFiles";
            var deleteObjectsUrl = sUrl;
            if (bRagEnabled === true) {
                oPayload.Kb = true;
                delete oPayload.files;
                oPayload.filenames = [aParts[3]];
                oPayload.category = this.selectedKeyFunct();
                oPayload.project = this._ProjectDetail;
                // deleteObjectsUrl = this._sBasePath + "/kb-integration/DeleteFromObjectStore"
                typeDel = "POST";
            }
            if (sFragmentName === "knowlBAdmin") {
                oPayload.Kb = true;
                delete oPayload.files;
                oPayload.filenames = [aParts[3]];
                oPayload.category = this.byId("categorySelect").getSelectedKey();
                oPayload.project = this._ProjectDetail;
                // deleteObjectsUrl = this._sBasePath + "/kb-integration/DeleteFromObjectStore"
                typeDel = "POST";
            }

            MessageBox.confirm(`Are you sure you want to delete this file?`, {
                title: "Confirm Deletion",
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {

                        $.ajax({
                            url: deleteObjectsUrl,
                            type: typeDel,
                            contentType: "application/json",
                            data: JSON.stringify(oPayload),
                            success: function (data) {
                                if (data) {
                                    var oModel = _this.getView().getModel("ObjectFileList");
                                    var sListPath = sFragmentName === "knowlBAdmin" ? "/files" : "/";
                                    var sDeletedFileKey = sFragmentName === "knowlBAdmin" ? sFileRef : sObjectKey;
                                    var aFileList = oModel.getProperty(sListPath);

                                    if (Array.isArray(aFileList)) {
                                        var aUpdatedList = aFileList.filter(file => (file.view_url || file.Key) !== sDeletedFileKey);
                                        oModel.setProperty(sListPath, aUpdatedList);
                                        oModel.refresh(true);
                                    }
                                    if (bRagEnabled === true || sFragmentName === "knowlBAdmin") {
                                        _this.KBGetFiles(_this.selectedKeyFunct());
                                    } else {
                                        _this.getFiles(_this.selectedKeyFunct());
                                    }

                                    sap.m.MessageBox.success(data.message || "File deleted successfully", {
                                        title: "Delete File",
                                        actions: [sap.m.MessageBox.Action.OK]
                                    });
                                } else {
                                    MessageBox.show("Failed to delete file.");
                                }
                            },
                            error: function (xhr, status, error) {
                                MessageBox.error("Error deleting file: " + JSON.parse(xhr.responseText).error.message);
                            }
                        });

                    }
                }
            });
        },


        _getViewDocDialog: async function () {
            if (this.viewDocFr && this.viewDocFr.bIsDestroyed) {
                this.viewDocFr = null;
            }

            // Create once
            if (!this.viewDocFr) {
                this.viewDocFr = await sap.ui.core.Fragment.load({
                    id: this.getView().getId(), //  important: prefixed IDs
                    name: "aicockpitfeq.fragment.ViewDocument",
                    controller: this
                });
                this.getView().addDependent(this.viewDocFr);
            }

            return this.viewDocFr;
        },

        viewDoc: async function () {
            if (this._bViewDocOpening) return;
            this._bViewDocOpening = true;

            try {
                var sKey = this.getView().getModel("fileViewModel").getProperty("/Key");
                var srcUrl = this.getView().getModel("fileViewModel").getProperty("/srcUrl");
                var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
                if (bRagEnabled && this._bUploadedViaRag == false) {
                    if (sKey && srcUrl) {
                        this.KBfileDisplay();
                    }
                    return;
                } else if (bRagEnabled && this._bUploadedViaRag == true) {
                    if (sKey) {
                        this.fileDisplay();
                    }
                }
                var oDialog = await this._getViewDocDialog();
                if (sKey) {
                    this.fileDisplay();
                }
                if (oDialog.isOpen && oDialog.isOpen()) {
                    return;
                }
                oDialog.open();
            } finally {
                this._bViewDocOpening = false;
            }
        },

        onCloseViewDoc: function () {
            if (this.viewDocFr) {
                this.viewDocFr.close();   // close only
            }
        },


        fileDisplay: function () {
            var sSelectedIconTab = "BS";  //hardcoded as data is only in BSContent
            ////dont remove this hardcodeded value
            var that = this;
            var sComponentName = this.getOwnerComponent().getManifestObject().getComponentName();
            var sBasePath = sap.ui.require.toUrl(sComponentName.replace(/\./g, "/"));
            var oModel = this.getView().getModel("appmodel");
            var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
            if (bRagEnabled) {
                that.KBfileDisplay();  //RAG function call
            } else {

                var oKey = this.getView().getModel("fileViewModel").oData.Key;
                var oFile = this.getView().getModel("fileViewModel").oData.Name;
                var encodedKey = encodeURIComponent(oKey);
                var sUrl = this._sBasePath + `/cockpit/getFileDetails(key='${encodedKey}')`;
                var objectStoreUrl = sUrl;
                var fileExtension = oFile.split('.').pop().toLowerCase();
                var opdfpreview, oTextArea;
                $.ajax({
                    url: objectStoreUrl,
                    type: "GET",
                    success: function (data) {
                        that.executedOnce = false;
                        if (fileExtension === "txt") {
                            switch (sSelectedIconTab) {
                                case "BS":
                                    oModel.setProperty("/BSContent", data.value);
                                    break;
                                case "User":
                                    oModel.setProperty("/UserContent", data.value);
                                    break;
                                case "fstoconf":
                                    oModel.setProperty("/fsconfContent", data.value);
                                    break;
                                case "fstots":
                                    oModel.setProperty("/fsContent", data.value);
                                    break;
                                case "tstocode":
                                    oModel.setProperty("/tsContent", data.value);
                                    break;
                                case "tstocodeGit":
                                    oModel.setProperty("/tsGitContent", data.value);
                                    break;
                                case "coderem":
                                    oModel.setProperty("/ECCContent", data.value);
                                    break;
                                case "codesum":
                                    oModel.setProperty("/CodeContent", data.value);
                                    break;
                                default:
                                    break;
                            }
                            BusyIndicator.hide();
                        } else if (fileExtension === "pdf") {
                            that.getView().getModel("fileViewModel").setProperty("/srcUrl", objectStoreUrl);
                            ///////////////////check
                            pdfjsLib.getDocument(objectStoreUrl).promise.then(function (pdf) {
                                var maxPages = pdf.numPages;
                                var countPromises = [];
                                for (var j = 1; j <= maxPages; j++) {
                                    var pagePromise = pdf.getPage(j).then(function (page) {
                                        return page.getTextContent().then(function (textContent) {
                                            return textContent.items.map(function (item) {
                                                return item.str;
                                            }).join('');
                                        });
                                    });
                                    countPromises.push(pagePromise);
                                }

                                Promise.all(countPromises).then(function (pagesText) {
                                    var pdfText = pagesText.join('');
                                    switch (sSelectedIconTab) {
                                        case "BS":
                                            oModel.setProperty("/BSContent", pdfText);
                                            break;
                                        case "User":
                                            oModel.setProperty("/UserContent", pdfText);
                                            break;
                                        case "fstoconf":
                                            oModel.setProperty("/fsconfContent", pdfText);
                                            break;
                                        case "fstots":
                                            oModel.setProperty("/fsContent", pdfText);
                                            break;
                                        case "tstocode":
                                            oModel.setProperty("/tsContent", pdfText);
                                            break;
                                        case "tstocodeGit":
                                            oModel.setProperty("/tsGitContent", pdfText);
                                            break;
                                        case "coderem":
                                            oModel.setProperty("/ECCContent", pdfText);
                                            break;
                                        case "codesum":
                                            oModel.setProperty("/CodeContent", pdfText);
                                            break;
                                        default:
                                            break;
                                    }
                                    BusyIndicator.hide();
                                });
                            });
                        } else if (fileExtension === "docx") {
                            switch (sSelectedIconTab) {
                                case "BS":
                                    oModel.setProperty("/BSContent", data.value);
                                    break;
                                case "User":
                                    oModel.setProperty("/UserContent", data.value);
                                    break;
                                case "fstoconf":
                                    oModel.setProperty("/fsconfContent", data.value);
                                    break;
                                case "fstots":
                                    oModel.setProperty("/fsContent", data.value);
                                    break;
                                case "tstocode":
                                    oModel.setProperty("/tsContent", data.value);
                                    break;
                                case "tstocodeGit":
                                    oModel.setProperty("/tsGitContent", data.value);
                                    break;
                                case "coderem":
                                    oModel.setProperty("/ECCContent", data.value);
                                    break;
                                case "codesum":
                                    oModel.setProperty("/CodeContent", data.value);
                                    break;
                                default:
                                    break;
                            }
                            BusyIndicator.hide();
                            var docxContent = data;
                            var data = {
                                url: objectStoreUrl
                            };
                        }
                    }.bind(this),
                    error: function (error) {
                        BusyIndicator.hide();
                    }
                });
            }
        },
        //Start of Aishwarya
        KBfileDisplay: function () {
            ///upl/select files of rag preview viewdoc part
            var oDialog = this.viewDocFr;
            if (oDialog && oDialog.isOpen && oDialog.isOpen()) {
                oDialog.close();
            }

            // Hardcode as data is stored in BSContent
            var sSelectedIconTab = "BS";

            var fileVM = this.getView().getModel("fileViewModel");
            var appModel = this.getView().getModel("appmodel");


            var srcUrl = fileVM.getProperty("/srcUrl"); // pre-signed view/download URL
            var oFile = fileVM.getProperty("/Name") || "";
            var ext = (oFile.split('.').pop() || "").toLowerCase();
            var data = {
                url: srcUrl
            };
            if (srcUrl === "") {
                var oDialog = this.viewDocFr;
                if (oDialog && oDialog.isOpen && oDialog.isOpen()) {
                    oDialog.close();
                }
                return;
            } else {

                if (ext === "pdf") {
                    var pdfViewer = this.byId("pdfViewer");
                    if (!pdfViewer) {
                        pdfViewer = new sap.m.PDFViewer({
                            id: this.createId("pdfViewer"),
                            source: srcUrl,
                            title: oFile,
                            showDownloadButton: true
                        });
                        this.getView().addDependent(pdfViewer);
                    } else {
                        pdfViewer.setSource(srcUrl);
                        pdfViewer.setTitle(oFile);
                    }
                    pdfViewer.open();
                    appModel.setProperty("/BSContent", data);

                } else if (ext === "docx") {
                    var officeViewer = "https://view.officeapps.live.com/op/view.aspx?src=" + encodeURIComponent(srcUrl);
                    sap.m.URLHelper.redirect(officeViewer, true);

                    appModel.setProperty("/BSContent", data);

                } else if (ext === "txt") {
                    sap.m.URLHelper.redirect(srcUrl, true);
                    appModel.setProperty("/BSContent", data);
                } else {
                    sap.m.URLHelper.redirect(srcUrl, true);
                    appModel.setProperty("/BSContent", data);
                }

            }
        },
        loadKnowlBAdminFiles: async function (sCategory, sProject, sUserName) {
            ////kb admin fragment get call
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var that = this;
            this.byId("fileUploaderKBAdmin")?.setValue("");
            try {
                var base = this._sBasePath + "/kb-integration";
                var url = `${base}/ListObjectStoreFiles?category=${encodeURIComponent(sCategory)}&project=${encodeURIComponent(sProject)}`;
                const data = await new Promise(function (resolve, reject) {
                    $.ajax({
                        url: url,
                        type: "GET",
                        success: resolve,
                        error: reject
                    });
                });
                var files = Array.isArray(data?.files) ? data.files : [];

                var normalized = files.map(function (f) {
                    return {
                        project: f.project || "",
                        filename: f.filename || "",
                        view_url: f.view_url || "",
                        last_modified: f.last_modified || "",
                        uplBy: f.uplBy || ""
                    };
                });

                var oModel = that.getView().getModel("ObjectFileList");
                if (!oModel) {
                    oModel = new sap.ui.model.json.JSONModel();
                    that.getView().setModel(oModel, "ObjectFileList");
                }
                oModel.setData({ files: normalized });
                BusyIndicator.hide();
            } catch (err) {
                BusyIndicator.hide();
                MessageBox.error(oBundle.getText("kbfilesloaderror"));
            } finally {
                sap.ui.core.BusyIndicator.hide();
            }
        },

        formatDate: function (v) {
            if (!v) return "";

            var d = v instanceof Date ? v : new Date(v);
            if (isNaN(d)) return v;

            var dd = String(d.getDate()).padStart(2, "0");
            var mm = String(d.getMonth() + 1).padStart(2, "0");
            var yyyy = d.getFullYear();

            return dd + "/" + mm + "/" + yyyy;
        },

        onViewFile: function (oEvent) {
            ////kb frg view column func
            var sUrl = oEvent.getSource()
                .getBindingContext("ObjectFileList")
                .getProperty("viewUrl");

            window.open(sUrl, "_blank");
        },
        //End of Aishwarya
        addPromptFr: async function (ifFromUtil) {
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var popUpSel = this.getView().getModel("switchFragments").getProperty("/frg/frName");
            if (popUpSel == "") {
                var descContent = "";
                this.getView().byId("cancelPrmBtn").setVisible(true);
                this.getView().byId("editPrm").setVisible(false);
                if (ifFromUtil && ifFromUtil == true) {
                    descContent = this.getView().byId("descTxtAreaPrompt").getValue();
                } else {
                    descContent = "";
                    this.getView().byId("savePrm").setVisible(true);
                    this.getView().byId("descTxtAreaPrompt").setValue("");
                }
                var descContent = "";
                if (ifFromUtil && ifFromUtil == true) {
                    descContent = this.getView().byId("descTxtAreaPrompt").getValue();
                } else {
                    descContent = "";
                    this.getView().byId("savePrm").setVisible(true);
                    this.getView().byId("descTxtAreaPrompt").setValue("");
                }
                this.getView().byId("descTxtAreaPrompt").setEditable(true);
                this.getView().byId("multiInputPrompt").setEnabled(true);
                this.getView().byId("multiInputPrompt").setEditable(true);
                var scenarioSel = this.getView().byId("navigationList").getSelectedKey();
                //// value states
                this.getView().byId("multiInputPrompt").setValueState("None");
                this.getView().byId("descTxtAreaPrompt").setValueState("None");
                this.getView().byId("selDocList").setValueState("None");

                var scenario = "";
                switch (scenarioSel) {
                    case "DocGen":
                        scenario = "DocGen";
                        break;
                    case "bdPMO":
                        scenario = "BS";
                        break;
                    case "usrCr":
                        scenario = "User";
                        break;
                    case "fcFSD":
                        scenario = "fstoconf";
                        break;
                    case "osdTSD":
                        scenario = "fstots";
                        break;
                    case "cdGen":
                        scenario = "tstocode";
                        break;
                    // case "tstocodeGit":
                    //      keyConst = "TsCodGit_CG-DevCockpit_";
                    //     break;
                    case "cdRem":
                        scenario = "coderem";
                        break;
                    case "cdSum":
                        scenario = "codesum";
                        break;
                    case "gitKey":
                        scenario = "tstocodeGit";
                        break;
                    case "tutKey":
                        scenario = "TUT";
                        break;
                    case "bpmKey":
                        scenario = "BPM";
                        break;
                    case "tcgKey":
                        scenario = "TCG";
                        break;
                    case "pctKey":
                        scenario = "PCT";
                        break;
                };
                var fourDigitId = Date.now().toString().slice(-4);
                var uniqueName = scenario + "_" + fourDigitId + "_prompt";
                if (ifFromUtil && ifFromUtil == true) {
                    uniqueName = this.getView().byId("multiInputPrompt").getValue();
                } else {
                    this.getView().byId("multiInputPrompt").setValue(uniqueName);
                    if (ifFromUtil && ifFromUtil == true) {
                        uniqueName = this.getView().byId("multiInputPrompt").getValue();
                    } else {
                        this.getView().byId("multiInputPrompt").setValue(uniqueName);
                    }
                    this.disableInputsysmsg(this.getView().byId("multiInputPrompt"));
                    var createdIn = this._ProjectDetail;


                    var promptAdd = {
                        "name": uniqueName, // promptid 
                        "version": "0.0.1",
                        "scenario": scenario, //category 
                        "spec": {
                            "template": [
                                {
                                    "role": "user",
                                    "content": descContent
                                }
                            ],
                            "defaults": {
                                "UserId": this._loggedInUser,
                                "ProjectId": this._ProjectDetail,
                                "CreatedIn": createdIn,
                                "UpdatedIn": "",
                                "msgType": "Prompt",
                                "updBy": this._loggedInUserName,
                                "updAt": new Date().toISOString()
                            }
                        }
                    };
                    this.isPromptAdded = false;
                    var savePrmModel = new sap.ui.model.json.JSONModel(promptAdd);
                    this.getView().setModel(savePrmModel, "savePrmModel");
                    if (ifFromUtil && ifFromUtil == true) {
                        this.savePrompt();
                    }
                }
            } else {
                MessageBox.information(oBundle.getText("selFuncTabs"));
            }

        },
        editPrompt: function () {
            this.getView().byId("savePrm").setVisible(true);
            this.getView().byId("descTxtAreaPrompt").setEditable(true);
            this.getView().byId("editPrm").setVisible(false);
            this.getView().byId("cancelPrmBtn").setVisible(true);
            //  this.getView().byId("cancelPrmBtn").setVisible(true);
        },
        savePrompt: function () {
            let oView = this.getView();
            let sFragmentName = oView.getModel("switchFragments").getProperty("/frg/frName");
            let promptContent = "";
            let sPromptId = "", catSel = "";

            if (sFragmentName == "promptlibpr") {
                promptContent = this.getView().getModel("savePrmModel").oData.spec.template[0].content;
                catSel = this.byId("categorySelect").getSelectedKey();
            } else {
                this.getView().byId("savePrm").setVisible(false);
                this.getView().byId("cancelPrmBtn").setVisible(true);
                sPromptId = oView.byId("multiInputPrompt").getValue();
                catSel = this.selectedKeyFunct();
                promptContent = this.getView().byId("descTxtAreaPrompt").getValue();
            }

            if (promptContent == "" && sFragmentName == "") {
                ///  this.getView().byId("descTxtAreaPrompt").setEditable(true);
                this.getView().byId("descTxtAreaPrompt").setValueState("Error");
                this.getView().byId("descTxtAreaPrompt").setValueStateText("Enter Prompt Description");
                this.getView().byId("editPrm").setVisible(false);
            } else if (promptContent !== "" || sFragmentName == "promptlibpr") {
                ////delete this.getView().getModel("savePrmModel").oData.additionalInfo;
                //this.getView().byId("multiInputPrompt").setValue(this.getView().byId("addPrName").getValue());

                this.getView().byId("addPrPart").setVisible(false);
                this.getView().byId("addPrName").setVisible(false);
                oView.byId("descTxtAreaPrompt").setValueState("None");
            }
            var promptPayload1 = {};

            if (this.getView().getModel("savePrmModel") == undefined) {
                var scenario = this.selectedKeyFunct();
                promptPayload1 = {
                    "name": this.getView().byId("multiInputPrompt").getValue(),
                    "version": "0.0.1",
                    "scenario": scenario, //category 
                    "spec": {
                        "template": [
                            {
                                "role": "user",
                                "content": ""
                            }
                        ],
                        "defaults": {
                            "UserId": this._loggedInUser,
                            "ProjectId": this._ProjectDetail,
                            "CreatedIn": this._ProjectDetail,
                            "UpdatedIn": this._ProjectDetail,
                            "msgType": "Prompt",
                            "updBy": this._loggedInUserName,
                            "updAt": new Date().toISOString()
                        }
                    }
                };
            } else {
                promptPayload1 = this.getView().getModel("savePrmModel").oData;
                sPromptId = this.getView().getModel("savePrmModel").oData.name;
                if (sFragmentName !== "promptlibpr") {
                    promptPayload1.scenario = this.selectedKeyFunct();
                }
            }
            promptPayload1.spec.defaults.updBy = this._loggedInUserName;
            promptPayload1.spec.defaults.updAt = new Date().toISOString();
            promptPayload1.spec.template[0].content = promptContent;


            if (sFragmentName === "promptlibpr") {
                if (catSel) {
                    promptPayload1.scenario = catSel;
                }
            }
            var payload = {
                payload: {
                    Prompt_Details: promptContent,
                    Category: catSel,
                    MsgType: "prompt",
                    ProjectId: this._ProjectDetail,
                    UserId: this._loggedInUser,
                    DateTime: new Date().toISOString(),
                    PromptId: sPromptId
                }
            };
            var that = this;

            $.ajax({
                url: this._sBasePath + "/cockpit/createPromptDetails",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),

                success: function (data) {

                    if (sFragmentName === "promptlibpr") {
                        //if (ev.getSource().getId().includes("listView1--saveSysBtn") == true) {
                        that.getView().byId("idPromptRegistryTable").removeSelections(true);
                        if (that.getView().byId("idPromptRegistryTable").getBinding("items")) {
                            that.getView().byId("idPromptRegistryTable").getBinding("items").refresh();
                            var catSel = that.getView().byId("categorySelect").getSelectedKey();
                            //  var url = "/cockpit/getPromptDetails?scenario=" + catSel + "&version=0.0.1&ProjectId=" + that._ProjectDetail;
                            var roleSel = "user"
                            var msgType = "prompt";
                            var url = this._sBasePath + "/cockpit/getPromptDetails?Category=" + catSel + "&MsgType=" + msgType + "&ProjectId=" + that._ProjectDetail;

                            that.onSearch(url, roleSel);
                        }
                        that.closeAddPrompt();
                    } else {
                        sap.m.MessageToast.show("Prompt saved successfully");
                        oView.byId("descTxtAreaPrompt").setEditable(false);
                        oView.byId("savePrm").setVisible(false);
                        oView.byId("promptAdd").setVisible(true);
                        oView.byId("editPrm").setVisible(true);

                        // Ensure GO validation passes after a successful save
                        that.isPromptAdded = true;

                        // Persist selection into response model so downstream logic sees it
                        try {
                            var oRespModel = that.getView().getModel("responseModel");
                            if (oRespModel) {
                                oRespModel.setProperty("/originalPrompt", promptContent);
                                oRespModel.setProperty("/selectedPromptId", sPromptId || oView.byId("multiInputPrompt").getValue());
                            }
                        } catch (e) {
                            // no-op
                        }

                        // that.getDataPromptMsg && that.getDataPromptMsg();
                        // that.getFiles && that.getFiles();
                    }
                },

                error: function (jqXhr) {
                    var errMsg = "Error while saving prompt";
                    try {
                        errMsg = JSON.parse(jqXhr.responseText).error.message;
                    } catch (e) { }

                    MessageBox.error(errMsg);
                }
            });
        },
        onLiveChange: function (oEvent) {
            oEvent.getSource().setProperty("valueState", "None");
            var id = oEvent.getParameter("id").split("--")[2];
            if (id == "descTxtArea") {
                // this.getView().byId("deleteSysBtn").setVisible(true);
                this.getView().byId("saveSysBtn").setVisible(true);
            }
            if (id == "descTxtAreaPrompt") {
                //this.getView().byId("cancelPrmBtn").setVisible(true);
                this.getView().byId("savePrm").setVisible(true);

            }
            if (oEvent.getParameter("id").includes("multiInputSystem") && this.stopEdit == true) {
                const typed = oEvent.getParameter("newValue");
                const fixed = oEvent.getSource().getProperty("value");
                if (typed !== fixed) {
                    this.getView().byId("multiInputSystem").setValue(fixed);
                }

            }
        },
        getDataSysMsg: function () {

            var that = this;
            // var busyDialog = new sap.m.BusyDialog();
            // busyDialog.open();
            // that.getView().setBusy(true);
            var Category = this.selectedKeyFunct();
            var MsgType = "sysMsg";
            var ProjectId = this._ProjectDetail;

            return new Promise(function (resolve, reject) {

                $.ajax({
                    url: that._sBasePath + "/cockpit/getPromptDetails",
                    method: "GET",
                    data: {
                        Category: Category,
                        MsgType: MsgType,
                        ProjectId: ProjectId
                    },
                    headers: that.defaultHeaders,

                    success: function (response) {
                        let finalData = [];

                        if (response && response.value && Array.isArray(response.value.result)) {
                            finalData = response.value.result
                                .filter(function (item) {
                                    return item.Project_Id === ProjectId || item.Project_Id === "default";
                                })
                                .map(function (item) {
                                    return {
                                        PROMPTID: item.ID,
                                        UUID: item.ID, // fallback since UUID not coming
                                        PROMPT_TEMPLATE: item.Prompt_Details,
                                        NAME: item.PromptId,
                                        SCENARIO: item.Category,
                                        CREATED_AT: item.Date_Added,
                                        PROJECT_ID: item.Project_Id,
                                        ProjectId: item.Project_Id
                                    };
                                });
                        }


                        // Populate model used by System Key dialog
                        Utility.initializeModel(
                            that.getView(),
                            "BSData",
                            { messages: finalData }
                        );

                        // Ensure SystemKey list (bound to BSData>/messages) is visible
                        var oSwitchTemp = that.getView().getModel("switchTempModel");
                        if (oSwitchTemp) {
                            oSwitchTemp.setProperty("/roleofTemplate", "system");
                        }
                        // tcg data

                        //  IMPORTANT: match selected key
                        //var selectedKey = that.setTCGKey;
                        var selectedKey = that._currentSelectionKey;

                        if (selectedKey && finalData.length > 0) {

                            var selectedObj = finalData.find(function (item) {
                                return item.UUID === selectedKey;
                            });

                            if (selectedObj) {
                                that.getView().byId("multiInputSystem")
                                    .setValue(selectedObj.NAME);

                                that.getView().byId("descTxtArea")
                                    .setValue(selectedObj.PROMPT_TEMPLATE);
                            }
                        }

                        // tcg data
                        // pct handle
                        var scenarioSel = that._tempScenarioKey || that.getView().byId("navigationList").getSelectedKey();

                        // STEP-based selection for PCT
                        if (scenarioSel === "pctKey" && finalData.length > 0) {

                            let expectedPromptId = "";

                            if (that.step === "Step1" || that.step === "step1") {
                                expectedPromptId = "Logical_Process_Cycle_Test";
                            }
                            else if (that.step === "Step2" || that.step === "step2") {
                                expectedPromptId = "Test_Process_Cycle_Test";
                            }
                            else if (that.step === "Step3" || that.step === "step3") {
                                expectedPromptId = "Function_Process_Cycle_Test";
                            }

                            var selectedObj = finalData.find(function (item) {
                                return item.NAME === expectedPromptId; //  IMPORTANT
                            });

                            if (selectedObj) {

                                that.getView().byId("multiInputSystem")
                                    .setValue(selectedObj.NAME);

                                that.getView().byId("descTxtArea")
                                    .setValue(selectedObj.PROMPT_TEMPLATE);

                                //that._currentSelectionKey = selectedObj.UUID; //  keep consistency
                            }

                            //  Clear history
                            var historyMod = that.getOwnerComponent().getModel("historyModel");
                            if (historyMod && historyMod.oData.historyData) {
                                historyMod.oData = {};
                                historyMod.refresh();
                            }
                        }
                        // Clear busy states on both dialogs if present
                        if (that.oDialog) {
                            that.oDialog.setBusy(false);
                        }
                        if (that.sysKeySelFr) {
                            that.sysKeySelFr.setBusy(false);
                        }
                        //that.oDialog.setBusy(false);
                        BusyIndicator.hide();

                        resolve(finalData);
                    },

                    error: function (error) {
                        if (that.oDialog) {
                            that.oDialog.setBusy(false);
                        }
                        if (that.sysKeySelFr) {
                            that.sysKeySelFr.setBusy(false);
                        }
                        if (that.oDialog1) {
                            that.oDialog1.setBusy(false);
                        }
                        console.error("GET Prompt Error:", error);
                        reject(error);
                    }
                });

            });
        },

        getDataPromptMsg: function () {

            var that = this;
            var busyDialog = new sap.m.BusyDialog();
            busyDialog.open();

            var Category = this.selectedKeyFunct();
            var MsgType = "prompt";
            var ProjectId = this._ProjectDetail;

            return new Promise(function (resolve, reject) {

                var sUrl = that._sBasePath + "/cockpit/getPromptDetails?Category=" + encodeURIComponent(Category) +
                    "&MsgType=" + encodeURIComponent(MsgType) +
                    "&ProjectId=" + encodeURIComponent(ProjectId);

                $.ajax({
                    url: sUrl,
                    method: "GET",
                    headers: that.defaultHeaders,

                    success: function (response) {
                        busyDialog.close();

                        let finalData = [];

                        if (response && response.value && Array.isArray(response.value.result)) {

                            finalData = response.value.result
                                .filter(function (item) {
                                    return item.Project_Id === ProjectId || item.Project_Id === "default";
                                })
                                .map(function (item) {
                                    return {
                                        PROMPTID: item.ID,
                                        UUID: item.ID, // fallback (since UUID not in response)
                                        PROMPT_TEMPLATE: item.Prompt_Details,
                                        NAME: item.PromptId,
                                        SCENARIO: item.Category,
                                        CREATED_AT: item.Date_Added,
                                        PROJECT_ID: item.Project_Id
                                    };
                                });
                        }


                        Utility.initializePromptModels(
                            that.getView(),
                            "BSPromptData",
                            finalData
                        );

                        if (that.oDialog1) {
                            that.oDialog1.setBusy(false);
                        }

                        resolve(finalData);
                    },

                    error: function (error) {
                        if (that.oDialog) {
                            that.oDialog.setBusy(false);
                        }
                        console.error("GET Prompt Error:", error);
                        reject(error);
                    }
                });

            });
        },

        onTableExport: function (eveTable) {
            var toHide = this.getView().getModel("switchFragments").getProperty("/frg/frName");
            var oTable = eveTable.getSource().getParent().getParent().mAggregations;
            var aCols = [];
            var exportExcelName = "";
            var oRowBinding, newaCols = [];
            var exportLibrary = sap.ui.requireSync("sap/ui/export/library");
            var EdmType = exportLibrary.EdmType;
            var oDTFmt = sap.ui.core.format.DateFormat.getDateTimeInstance({ pattern: "dd/MM/yyyy hh:mm:ss a" });

            for (var i = 0; i < oTable.columns.length; i++) {
                var sHeader = oTable.columns[i].mAggregations.header.mProperties.text;

                aCols.push({
                    label: sHeader, //oTable.columns[i].mAggregations.header.mProperties.text,
                    property: sHeader, //oTable.columns[i].mAggregations.header.mProperties.text,
                    type: EdmType.String, //String,
                    format: undefined
                });
            }
            if (toHide == "admin" || toHide == "user") {
                aCols.map((unit) => {
                    if (unit.property == "User Name") {
                        unit.property = "USERNAME";
                    } else if (unit.property == "User ID") {
                        unit.property = "EMAIL_ID";
                    }
                    else if (unit.property == "Project") {
                        unit.property = "project";
                    }
                    else if (unit.property == "Date") {
                        unit.property = "date";
                    }
                    else if (unit.property == "Total Duration") {
                        unit.property = "totalDuration";
                    }
                    else if (unit.property == "Token Used") {
                        unit.property = "totalTokensConsumed";
                    }
                    else if (unit.property == "No. of Session") {
                        unit.property = "totalSessions";
                    }
                    else if (unit.property == "Total Tokens per Model") {
                        unit.property = "modelData"; //newly created
                    }
                    return unit;
                });
                if (toHide == "user") {
                    exportExcelName = "User List Log.xlsx";
                    newaCols = aCols.filter(item => (item.property !== "USERNAME" && item.property !== "EMAIL_ID"));
                } else if (toHide == "admin") {
                    exportExcelName = "Admin Log.xlsx";
                    newaCols = aCols;
                }
                oRowBinding = this.getView().getModel("UserloginModel").oData;
            }
            else if (toHide == "promptlibpr") {
                exportExcelName = "Prompt Library.xlsx";
                aCols.map((unit) => {
                    if (unit.property == "Prompt Template") {
                        unit.property = "Prompt_Template";
                    } else if (unit.property == "Date Added") {
                        unit.property = "Date_Added";
                    }
                    else if (unit.property == "Category") {
                        unit.property = "Category";
                    }
                    else if (unit.property == "Project ID") {
                        unit.property = "ProjectId";
                    }
                    else if (unit.property == "Message Type") {
                        unit.property = "MsgType";
                    }
                    else if (unit.property == "User ID") {
                        unit.property = "UserId";
                    }
                    else if (unit.property == "Prompt Name") {
                        unit.property = "name";
                    }
                    else if (unit.property == "Updated By") {
                        unit.property = "UpdatedBy";
                    }
                    else if (unit.property == "Updated At") {
                        unit.property = "UpdatedAt";
                    }
                    return unit;
                });
                // newaCols = aCols;
                newaCols = aCols.filter(item => (item.property !== "Category" && item.property !== "MsgType"));

                oRowBinding = this.getView().getModel("allPromptsModel").oData;
                if (oRowBinding && oRowBinding.results) {
                    oRowBinding = oRowBinding.results;
                }
                if (Array.isArray(oRowBinding)) {
                    for (var r = 0; r < oRowBinding.length; r++) {
                        var s = "";
                        if (oRowBinding[r] && oRowBinding[r].Date_Added) {
                            s = String(oRowBinding[r].Date_Added);
                        }
                        if (oRowBinding[r] && oRowBinding[r].UpdatedAt) {
                            s = String(oRowBinding[r].UpdatedAt);
                        }
                        // trim microseconds to milliseconds: .320000 -> .320
                        s = s.replace(/(\.\d{3})\d+/, "$1");

                        // if no timezone present, assume UTC for consistent parsing
                        if (!/[zZ]|[+-]\d\d:\d\d$/.test(s)) { s = s + "Z"; }

                        var d = new Date(s);

                        if (oRowBinding[r] && oRowBinding[r].Date_Added) {
                            if (!isNaN(d.getTime())) {
                                oRowBinding[r].Date_Added = oDTFmt.format(d);
                            }
                        }
                        if (oRowBinding[r] && oRowBinding[r].UpdatedAt) {
                            if (!isNaN(d.getTime())) {
                                oRowBinding[r].UpdatedAt = oDTFmt.format(d);
                            }
                        }
                    }
                }
            } else if (toHide == "knowlBAdmin") {
                exportExcelName = "Knowledge Base Admin.xlsx";
                aCols.map((unit) => {
                    if (unit.property == "Project") {
                        unit.property = "project";
                    }
                    else if (unit.property == "File Name") {
                        unit.property = "filename";
                    }
                    else if (unit.property == "Last Modified") {
                        unit.property = "last_modified";
                    }
                    else if (unit.property == "View URL") {
                        unit.property = "remove";
                    }
                    else if (unit.property == "Uploaded By") {
                        unit.property = "remove";
                    }
                    else if (unit.property == "Delete") {
                        unit.property = "remove";
                    }

                    return unit;
                });

                newaCols = aCols.filter(item => (item.property !== "remove"));
                oRowBinding = this.getView().getModel("ObjectFileList").oData.files;
                if (Array.isArray(oRowBinding)) {
                    for (var r2 = 0; r2 < oRowBinding.length; r2++) {
                        if (oRowBinding[r2] && oRowBinding[r2].last_modified) {
                            var s2 = String(oRowBinding[r2].last_modified);

                            // keep consistent parsing
                            s2 = s2.replace(/(\.\d{3})\d+/, "$1");
                            if (!/[zZ]|[+-]\d\d:\d\d$/.test(s2)) { s2 = s2 + "Z"; }

                            var d2 = new Date(s2);
                            if (!isNaN(d2.getTime())) {
                                oRowBinding[r2].last_modified = oDTFmt.format(d2);
                            }
                        }
                    }
                }
            } else if (toHide == "promptsUsed") {
                //  this.onExportPromptDetailsExcel(eveTable);
                exportExcelName = "Prompts Used.xlsx";
                aCols.map((unit) => {
                    if (unit.property == "System Key") {
                        unit.property = "system_id";
                    } else if (unit.property == "Prompts") {
                        unit.property = "prompt";
                    } else if (unit.property == "Consumption Token per Prompt") {
                        unit.property = "token_consumed";
                    } else if (unit.property == "Total Tokens per Model") {
                        unit.property = "modelToken";
                    }
                    else if (unit.property == "System Key-Prompts") {
                        unit.property = "remove";
                    }
                    return unit;
                });
                newaCols = aCols.filter(item => (item.property !== "remove"));
                var oPUModel = this.getView().getModel("PromptsUsedModel") ||
                    this.getView().getModel("promptsUsedDetail");
                oRowBinding = (oPUModel && (oPUModel.getProperty("/rows") || oPUModel.getData().rows)) || [];
                if (Array.isArray(oRowBinding)) {
                    for (var r = 0; r < oRowBinding.length; r++) {
                        var row = oRowBinding[r];


                        var idsArr = Array.isArray(row.ids) ? row.ids : [];
                        row.SystemKey = idsArr.join("\n");                  // multiline cell

                        // Prompts -> join prompts[] into multiline
                        var prArr = Array.isArray(row.prompts) ? row.prompts : [];
                        row.prompts = prArr.join("\n");

                        var nTok = Number(row.tokens_used || 0);
                        row.tokens_used = nTok;

                        // Models-Token -> reuse model_name property to hold "model - tokens"
                        var mName = row.model_name || "";
                        row.model_name = mName ? (mName + " - " + nTok) : "";
                    }
                }
                //this.onExportPromptDetailsExcel(eveTable);
                // oRowBinding = this.getView().getModel("allPromptsModel").oData;

            }

            if (toHide == "user" || toHide == "admin") {
                var modelconcat = "";
                for (var i = 0; i < oRowBinding.length; i++) {
                    for (var j = 0; j < oRowBinding[i].models.length; j++) {

                        if (oRowBinding[i].models[j].model_name == null) {
                            modelconcat = modelconcat + ",0";
                        } if (oRowBinding[i].models[j].model_name !== null) {
                            var abc = oRowBinding[i].models[j].model_name + "-" + oRowBinding[i].models[j].tokens_used;
                            modelconcat = modelconcat + "," + abc;
                        }
                    } if (modelconcat.charAt(0) == ",") {
                        modelconcat = modelconcat.slice(1, modelconcat.length)
                    }
                    oRowBinding[i]["modelData"] = modelconcat;
                    modelconcat = "";
                }
            }
            const oSettings = {
                workbook: {
                    columns: newaCols,
                    hierarchyLevel: "Level"
                },
                dataSource: oRowBinding,
                fileName: exportExcelName,
                worker: false // We need to disable worker because we are using a MockServer as OData Service
            };

            const oSheet = new Spreadsheet(oSettings);
            oSheet.build().finally(function () {
                oSheet.destroy();
            });
        },
        onExportPromptDetailsExcel: function (oEvent) {
            if (!this._oPromptDatePopover) {
                this._oPromptDatePopover = new sap.m.Popover({
                    title: "Select Date Range",
                    placement: sap.m.PlacementType.Bottom,
                    content: [
                        new sap.m.DateRangeSelection("drsPromptExportRange", {
                            delimiter: " to ",
                            displayFormat: "dd/MM/yyyy",
                            valueFormat: "yyyy-MM-dd",
                            dateValue: new Date(),
                            secondDateValue: new Date()
                        }).addStyleClass("sapUiSmallMargin"),
                        new sap.m.Button({
                            text: "Export",
                            type: "Accept",
                            press: this._onConfirmPromptExport.bind(this)
                        }).addStyleClass("sapUiSmallMarginTop")
                    ]
                });
                this.getView().addDependent(this._oPromptDatePopover);
            }

            this._oPromptDatePopover.openBy(oEvent.getSource());
        },

        _formatYMD: function (oDate) {
            if (!oDate) return "";
            const pad = n => String(n).padStart(2, "0");
            return oDate.getFullYear() + "-" + pad(oDate.getMonth() + 1) + "-" + pad(oDate.getDate());
        },
        _onConfirmPromptExport: function () {
            var oRange = sap.ui.getCore().byId("drsPromptExportRange");
            var oFrom = oRange.getDateValue();
            var oTo = oRange.getSecondDateValue();
            var fromDate = this._formatYMD(oFrom);
            var toDate = this._formatYMD(oTo);
            var project = this._ProjectDetail;

            if (!project) {
                MessageBox.show("Please select a project first.");
                return;
            }
            if (!fromDate || !toDate) {
                MessageBox.show("Please pick a valid date range.");
                return;
            }
            var params = new URLSearchParams({ project, fromDate, toDate });
            var sUrl = this._sBasePath + "/cockpit/promptDataExcel?" + params.toString();
            sap.m.URLHelper.redirect(sUrl, true);
            this._oPromptDatePopover && this._oPromptDatePopover.close();
        },
        _handlePCTExecution: function () {
            if (this.step === "Step2") {
                this.pctkbwithstep2();
            } else if (this.step === "Step3") {
                this.pctkbwithstep3();
            } else {
                this.PCTKBwithTCG();
            }


        },

        aicallforTCG_onlyKB: async function () {
            BusyIndicator.show();
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", false);
            var oViewModel = this.getView().getModel("viewModel");
            var that = this;

            var modelName = this.getView().byId("selModel").getValue();
            var aMsgContentSystemDesc = this.getView().byId("descTxtArea").getValue();
            var promptMsgData = this.getView().byId("descTxtAreaPrompt").getValue();
            // var allMessages = [];
            var oModel = this.getView().getModel("appmodel");
            var fileData = oModel.getProperty("/BSContent");
            var tcgRespArr = [];
            var fileViewData = this.getView().getModel("fileViewModel").oData;
            var fileExtension = (fileViewData.Name.split(".").pop() || "").toLowerCase();
            var dataObj = { "UserStory_ID": "", "Epic": "", "Features": "", "User Stories Description": "", "Acceptance Criteria": "" };

            var useridPattern = /UserStory_ID/g;

            var tcc = this.getView().byId("tcCountNum").getValue();


            var tokensUsed = 0;

            var freeTextData = this.getView().getModel("tcgModel").getProperty("/fText") || "";
            var citationIndex = [];
            var apiKMUrl = this._sBasePath + "/kbintegration/tcg";

            var typeofTC = "";

            var selectedSysMsgType = this.getView().getModel("tcgModel").getProperty("/selVal");
            if (selectedSysMsgType == "positive_scenario") {
                typeofTC = "HAPPY";
            } else if (selectedSysMsgType == "boundary_scenario") {
                typeofTC = "BOUNDARY";
            } else {
                typeofTC = "NEGATIVE";
            }
            this.getView().getModel("tcgModel").setProperty("/allResponses", []);
            var aiModelName = that.getView().byId("selModel").getValue();
            if (aiModelName == "anthropic--claude-4.5-opus") {
                aiModelName = "claude-opus4.5";
            }
            else if (aiModelName == "anthropic--claude-4-sonnet") {
                aiModelName = "claude-4-sonnet";
            }
            else if (aiModelName == "anthropic--claude-3-haiku") {
                aiModelName = "claude-3-haiku";
            }
            var fileDataRepeat = "";
            var histPayload = {};
            var aMessages = []
            var kbPayload = {
                "model": aiModelName,
                "temperature": Number(oViewModel.getProperty("/comnPopUpModelParamTemp") || 0.7),
                "top_p": Number(oViewModel.getProperty("/comnPopUpModelParamTopP") || 0.95),
                "max_tokens": Number(oViewModel.getProperty("/comnPopUpModelParamMaxLength") || 5000),
                "scenario": "",
                "UserStory_ID": "",
                "Epic": "",
                "Features": "",
                "UserStoriesDescription": "",
                "AcceptanceCriteria": "",
                "system_prompt": {
                    "name": this.getView().byId("multiInputSystem").getValue(),
                    "version": "1.0.0",
                    "scenario": "",
                    "spec": {
                        "template": [
                            {
                                "role": "system",
                                "content": ""
                            }
                        ],
                        "defaults": {
                            "additional_info": promptMsgData,
                            "UserId": this._loggedInUser,
                            "ProjectId": this._ProjectDetail,
                            "selection": this.getView().getModel("tcgModel").getProperty("/selVal")
                        }
                    }
                }
            };
            // start scenario change
            var promptName = this.getView().byId("multiInputSystem").getValue();

            var scenarioValue = "Happy Path"; // default

            if (promptName === "Boundary_Test_Case_Generation") {
                scenarioValue = "Boundary";
            } else if (promptName === "Negative_Test_Case_Generation") {
                scenarioValue = "Negative Test";
            } else if (promptName === "Positive_Test_Case_Generation") {
                scenarioValue = "Happy Path";
            }
            kbPayload.scenario = scenarioValue;
            kbPayload.system_prompt.scenario = scenarioValue;
            // end scenario change
            if (fileData === "" && freeTextData == "") {
                BusyIndicator.hide();
                MessageBox.error("Please upload a File or Enter Text Data in Free Text Area!");
                this.getView().byId("selDocList").setValueState("Error");
                this.getView().byId("selDocList").setValueStateText("Upload/Select File");
                return;
            } else if (Array.isArray(fileData)) {
                BusyIndicator.hide();
                sap.m.MessageBox.warning(oBundle.getText("wrongTemplate"));
                return;
            } else if (fileData.url) {
                BusyIndicator.hide();
                sap.m.MessageBox.warning(oBundle.getText("kbTCGFileSel"));
                return;
            }
            else if (fileData !== "" || freeTextData !== "") {

                ///////// test case count replacement
                var testCaseCountText = "{test_case_count}: Number of test cases to generate (REQUIRED, default: 5)";
                if (tcc == "0" || tcc == "") {
                    aMsgContentSystemDesc = aMsgContentSystemDesc.replace(testCaseCountText, "{test_case_count}:5");
                } else {
                    aMsgContentSystemDesc = aMsgContentSystemDesc.replace(testCaseCountText, "{test_case_count}:" + tcc.toString());

                }

                //////////////additional info/ prompt replacement
                var additionalInfoText = "{additional_info}: Supplementary context for test generation (OPTIONAL)";
                if (promptMsgData !== "") {
                    aMsgContentSystemDesc = aMsgContentSystemDesc.replace(additionalInfoText, "{additional_info}:" + promptMsgData + "</TCG_" + typeofTC + ">");
                } else {
                    aMsgContentSystemDesc = aMsgContentSystemDesc.replace(additionalInfoText, "{additional_info}:\n</TCG_" + typeofTC + ">");
                }
                /////file content true///
                var originalSysMsg = aMsgContentSystemDesc;

                var reqFileText = "{requirement_file}: Document containing user stories (OPTIONAL)";
                var reqFreeText = "{requirement_text}: Direct user story text (OPTIONAL)";


                if (!fileData.match(useridPattern) && !freeTextData.match(useridPattern)) {
                    ///////// free text replacement
                    if (freeTextData !== "") {
                        aMsgContentSystemDesc = aMsgContentSystemDesc.replace(reqFreeText, "{requirement_text}:" + freeTextData);
                    } else {
                        aMsgContentSystemDesc = aMsgContentSystemDesc.replace(reqFreeText, "{requirement_text}:");
                    }
                    aMsgContentSystemDesc = aMsgContentSystemDesc.replace(reqFileText, "<TCG_" + typeofTC + ">\n {requirement_file}:" + fileData);
                    aMessages = [{ "role": "system", "content": aMsgContentSystemDesc }];
                    histPayload = Utility.createPayloadBasedOnModelNonStream(modelName, aMessages, oViewModel, this, promptMsgData);
                    // allMessages.push(histPayload);
                    kbPayload.system_prompt.spec.template = aMessages;
                    try {
                        const response = await fetch(apiKMUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                ...(this.defaultHeaders || {})
                            },
                            body: JSON.stringify(kbPayload)
                        });

                        if (!response.ok) {
                            const errText = await response.text().catch(() => "");
                            throw new Error(`TCG call failed for ${story.UserStory_ID || "Unknown"}: ${response.status} ${errText}`);
                        }
                        const rawText = await response.text();

                        // Parse NDJSON; if not NDJSON, fallback to single JSON or plain text
                        const parsedResponse = this._parseNdjsonOrJsonText(rawText);

                        citationIndex = [];
                        // var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
                        // if (bRagEnabled) {
                        parsedResponse[0].citations.forEach((item) => {
                            if (!item) return;

                            const filename = item.filename || "Unknown";
                            const link = item.download_url;
                            if (link || filename) { citationIndex.push({ link: link, fname: filename }); }
                        });
                        citationIndex.forEach(c => {
                            const key = `${c.fname}|${c.link}`;
                            if (!citationIndex.some(m => `${m.fname}|${m.link}` === key)) citationIndex.push(c);
                        });
                        // }
                        tokensUsed = tokensUsed + parsedResponse[0].token_usage.total_tokens;
                        tcgRespArr = this.getView().getModel("tcgModel").getProperty("/allResponses");
                        tcgRespArr.push({ UserStory_ID: "****************" + kbPayload.UserStory_ID + "****************", response: parsedResponse[0].response, citationTcg: citationIndex, tokensGen: tokensUsed });
                        this.getView().getModel("tcgModel").setProperty("/allResponses", tcgRespArr);

                    } catch (err) {
                        BusyIndicator.hide();
                        sap.m.MessageBox.error(`TCG processing error: ${err.message}`);
                    } finally {

                    }

                } else {
                    var fileORText = "";
                    var changeinFT = "";
                    if (fileData.match(useridPattern)) {
                        fileORText = fileData;
                        changeinFT = "File";
                    } else if (freeTextData.match(useridPattern)) {
                        fileORText = freeTextData;
                        changeinFT = "FreeText";
                    }
                    if (this.getView().getModel("tcgModel").getProperty("/wordorExcel") == "word" || changeinFT == "FreeText") {

                        var count = fileORText.match(useridPattern).length;
                        var searchUserId = "UserStory_ID :";
                        var searchEpic = "Epic :";
                        var searchFeatures = "Features :";
                        var searchUserStorriesDesc = "User Stories Description :";
                        var searchAccCrit = "Acceptance Criteria :";
                        var para = 0;
                        // var dataArr = [];
                        var userId, epic, features, userstoriesDesc, acccrit;

                        for (var i = 0; i < count; i++) {
                            if (i == 0) {
                                para = 0;

                                userId = fileORText.indexOf(searchUserId);
                                epic = fileORText.indexOf(searchEpic);
                                features = fileORText.indexOf(searchFeatures);
                                userstoriesDesc = fileORText.indexOf(searchUserStorriesDesc);
                                acccrit = fileORText.indexOf(searchAccCrit);
                            } else {
                                if (fileExtension == "txt") {

                                    para = fileORText.search(/\r\n\r\n/) + 4;
                                } else if (fileExtension == "pdf") {

                                } else {

                                    para = fileORText.search(/\n{4}/) + 4;
                                }
                                if (fileExtension !== "pdf") {

                                    fileORText = fileORText.slice(para);
                                }


                                userId = fileORText.indexOf(searchUserId);
                                epic = fileORText.indexOf(searchEpic);
                                features = fileORText.indexOf(searchFeatures);
                                userstoriesDesc = fileORText.indexOf(searchUserStorriesDesc);
                                acccrit = fileORText.indexOf(searchAccCrit);
                            }
                            var textAfterIndex1 = userId + searchUserId.length;
                            var textAfterString1 = fileORText.substring(textAfterIndex1).trim();
                            if (fileExtension == "txt") {
                                dataObj["UserStory_ID"] = textAfterString1.split("\r\n")[0].trim();
                            } else if (fileExtension == "pdf") {
                                dataObj["UserStory_ID"] = textAfterString1.split(searchEpic.slice(0, 4))[0].trim();
                            } else {
                                dataObj["UserStory_ID"] = textAfterString1.split("\n\n")[0].trim();
                            }
                            var textAfterIndex2 = epic + searchEpic.length;
                            var textAfterString2 = fileORText.substring(textAfterIndex2).trim();
                            if (fileExtension == "txt") {
                                dataObj["Epic"] = textAfterString2.split("\r\n")[0].trim();
                            } else if (fileExtension == "pdf") {
                                dataObj["Epic"] = textAfterString2.split(searchFeatures.slice(0, 8))[0].trim();
                            } else {
                                dataObj["Epic"] = textAfterString2.split("\n\n")[0].trim();
                            }
                            var textAfterIndex3 = features + searchFeatures.length;
                            var textAfterString3 = fileORText.substring(textAfterIndex3).trim();
                            if (fileExtension == "txt") {
                                dataObj["Features"] = textAfterString3.split("\r\n")[0].trim();
                            } else if (fileExtension == "pdf") {
                                dataObj["Features"] = textAfterString3.split(searchUserStorriesDesc.slice(0, 24))[0].trim();
                            } else {
                                dataObj["Features"] = textAfterString3.split("\n\n")[0].trim();
                            }
                            var textAfterIndex4 = userstoriesDesc + searchUserStorriesDesc.length;
                            var textAfterString4 = fileORText.substring(textAfterIndex4).trim();
                            if (fileExtension == "txt") {
                                dataObj["User Stories Description"] = textAfterString4.split("\r\n")[0].trim();
                            } else if (fileExtension == "pdf") {
                                dataObj["User Stories Description"] = textAfterString4.split(searchAccCrit.slice(0, 19))[0].trim();
                            } else {
                                dataObj["User Stories Description"] = textAfterString4.split("\n\n")[0].trim();
                            }
                            var textAfterIndex5 = acccrit + searchAccCrit.length;

                            var textAfterString5 = fileORText.substring(textAfterIndex5).trim();
                            if (fileExtension == "txt") {
                                dataObj["Acceptance Criteria"] = textAfterString5.split("\r\n")[0].trim();
                            } else if (fileExtension == "pdf") {
                                dataObj["Acceptance Criteria"] = textAfterString5.split(searchUserId.slice(0, 12))[0].trim();
                            } else {
                                dataObj["Acceptance Criteria"] = textAfterString5.split("\n\n")[0].trim();
                            }
                            if (fileExtension == "pdf") {
                                var newLength = dataObj["Acceptance Criteria"].length;

                                fileData = fileORText.slice(newLength);
                            }
                            fileDataRepeat = "UserStory_ID : " + dataObj["UserStory_ID"] + "\nEpic : " + dataObj["Epic"] + "\nFeatures : " + dataObj["Features"] + "\nUser Stories Description : " + dataObj["User Stories Description"] + "\nAcceptance Criteria : " + dataObj["Acceptance Criteria"];

                            if (changeinFT == "File") {
                                aMsgContentSystemDesc = aMsgContentSystemDesc.replace(reqFileText, "<TCG_" + typeofTC + ">\n {requirement_file}:" + fileDataRepeat);
                                aMsgContentSystemDesc = aMsgContentSystemDesc.replace(reqFreeText, "{requirement_text}:" + freeTextData);
                            } else if (changeinFT == "FreeText") {
                                aMsgContentSystemDesc = aMsgContentSystemDesc.replace(reqFileText, "<TCG_" + typeofTC + ">\n {requirement_file}:" + fileData);
                                aMsgContentSystemDesc = aMsgContentSystemDesc.replace(reqFreeText, "{requirement_text}:" + fileDataRepeat);
                            }

                            kbPayload["UserStory_ID"] = dataObj["UserStory_ID"];
                            kbPayload["Epic"] = dataObj["Epic"];
                            kbPayload["Features"] = dataObj["Features"];
                            kbPayload["UserStoriesDescription"] = dataObj["User Stories Description"];
                            kbPayload["AcceptanceCriteria"] = dataObj["Acceptance Criteria"];
                            aMessages = [{ "role": "system", "content": aMsgContentSystemDesc }];
                            histPayload = Utility.createPayloadBasedOnModelNonStream(modelName, aMessages, oViewModel, this, promptMsgData);
                            // allMessages.push(histPayload);
                            kbPayload.system_prompt.spec.template = aMessages;
                            try {
                                const response = await fetch(apiKMUrl, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        ...(this.defaultHeaders || {})
                                    },
                                    body: JSON.stringify(kbPayload)
                                });

                                if (!response.ok) {
                                    const errText = await response.text().catch(() => "");
                                    throw new Error(`TCG call failed for ${story.UserStory_ID || "Unknown"}: ${response.status} ${errText}`);
                                }
                                const rawText = await response.text();

                                // Parse NDJSON; if not NDJSON, fallback to single JSON or plain text
                                const parsedResponse = this._parseNdjsonOrJsonText(rawText);

                                citationIndex = [];
                                // var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
                                // if (bRagEnabled) {
                                parsedResponse[0].citations.forEach((item) => {
                                    if (!item) return;
                                    const filename = item.filename || "Unknown";
                                    const link = item.download_url;
                                    if (link || filename) { citationIndex.push({ link: link, fname: filename }); }
                                });
                                citationIndex.forEach(c => {
                                    const key = `${c.fname}|${c.link}`;
                                    if (!citationIndex.some(m => `${m.fname}|${m.link}` === key)) citationIndex.push(c);
                                });
                                // }

                                tokensUsed = tokensUsed + parsedResponse[0].token_usage.total_tokens;
                                tcgRespArr = this.getView().getModel("tcgModel").getProperty("/allResponses");
                                tcgRespArr.push({ UserStory_ID: "****************" + kbPayload.UserStory_ID + "****************", response: parsedResponse[0].response, citationTcg: citationIndex, tokensGen: tokensUsed });
                                this.getView().getModel("tcgModel").setProperty("/allResponses", tcgRespArr);
                                ///////reinit sys msg for req file changes for next user story
                                aMsgContentSystemDesc = originalSysMsg;

                            } catch (err) {
                                BusyIndicator.hide();
                                sap.m.MessageBox.error(`TCG processing error: ${err.message}`);
                            } finally {

                            }


                            // dataArr.push(dataObj);
                        }

                    } else if (this.getView().getModel("tcgModel").getProperty("/wordorExcel") == "excel") {
                        var excelfileDetails = [];
                        if (Array.isArray(this.getView().getModel("fileViewModel").oData.xlsJsonData)) {
                            excelfileDetails = this.getView().getModel("fileViewModel").oData.xlsJsonData;
                        } else {
                            excelfileDetails = this.getView().getModel("fileViewModel").oData.xlsJsonData.Sheet1;
                        }

                        var excelfileDetails = [];

                        if (Array.isArray(this.getView().getModel("fileViewModel").oData.xlsJsonData)) {
                            excelfileDetails = this.getView().getModel("fileViewModel").oData.xlsJsonData;
                        } else {
                            excelfileDetails = this.getView().getModel("fileViewModel").oData.xlsJsonData.Sheet1;
                        }

                        // ✅ Create parallel tasks
                        var promises = excelfileDetails.map(async (row) => {

                            var localPayload = JSON.parse(JSON.stringify(kbPayload)); // ✅ clone payload
                            var localSysMsg = originalSysMsg; // ✅ avoid overwrite issue

                            var fileDataRepeat =
                                "UserStory_ID : " + row["UserStory_ID"] +
                                "\nEpic : " + row["Epic"] +
                                "\nFeatures : " + row["Features"] +
                                "\nUser Stories Description : " + row["User Stories Description"] +
                                "\nAcceptance Criteria : " + row["Acceptance Criteria"] + "\n";

                            let updatedMsg = localSysMsg
                                .replace(reqFileText, "<TCG_" + typeofTC + ">\n {requirement_file}:" + fileDataRepeat)
                                .replace(reqFreeText, "{requirement_text}:" + freeTextData);

                            var aMessages = [{ "role": "system", "content": updatedMsg }];

                            localPayload.UserStory_ID = row["UserStory_ID"];
                            localPayload.Epic = row["Epic"];
                            localPayload.Features = row["Features"];
                            localPayload.UserStoriesDescription = row["User Stories Description"];
                            localPayload.AcceptanceCriteria = row["Acceptance Criteria"];
                            localPayload.system_prompt.spec.template = aMessages;

                            try {
                                const response = await fetch(apiKMUrl, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        ...(that.defaultHeaders || {})
                                    },
                                    body: JSON.stringify(localPayload)
                                });

                                const rawText = await response.text();
                                const parsedResponse = that._parseNdjsonOrJsonText(rawText);

                                let citationIndex = [];
                                parsedResponse[0].citations.forEach((item) => {
                                    if (!item) return;
                                    citationIndex.push({
                                        link: item.download_url,
                                        fname: item.filename || "Unknown"
                                    });
                                });

                                return {
                                    UserStory_ID: row["UserStory_ID"],
                                    response: parsedResponse[0].response,
                                    citations: citationIndex,
                                    tokens: parsedResponse[0].token_usage.total_tokens || 0
                                };

                            } catch (err) {
                                return {
                                    UserStory_ID: row["UserStory_ID"],
                                    error: err.message
                                };
                            }
                        });

                        // ✅ EXECUTE PARALLEL
                        const results = await Promise.all(promises);

                        // ✅ Store results
                        tcgRespArr = [];

                        results.forEach(res => {
                            if (!res.error) {
                                tokensUsed += res.tokens;

                                tcgRespArr.push({
                                    UserStory_ID: "***************" + res.UserStory_ID + "***************",
                                    response: res.response,
                                    citationTcg: res.citations,
                                    tokensGen: tokensUsed
                                });
                            }
                        });

                        this.getView().getModel("tcgModel").setProperty("/allResponses", tcgRespArr);

                    }
                }
                const oSideNavigation = this.byId("sideNavigation");
                oSideNavigation.setExpanded(false);
            }

            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", false);
            var aMsgContentSystemDesc1 = this.getView().byId("descTxtArea").getValue();
            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/sysMsg", aMsgContentSystemDesc1);
            this.getOwnerComponent().getModel("airesponseDetailModel").refresh();
            var keytoSend = this.getView().getModel("selKeyForDetailDetail").getProperty("/keyD");
            var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;
            var tokenData = this.getView().getModel("TokenLimit").oData;
            var scenario = this.selectedKeyFunct();
            var tknallotted = tokenData[scenario][selectedAI].TotalToken;
            this.oRouter.navTo("DetailDetail", { dispKey: keytoSend, aimodel: selectedAI, layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded });

            this.getView().getModel("TokenLimit").setProperty("/token", tknallotted);
            var resp = "";
            var cit = [];
            tcgRespArr = this.getView().getModel("tcgModel").getProperty("/allResponses");
            for (var r = 0; r < tcgRespArr.length; r++) {

                resp = resp + tcgRespArr[r].UserStory_ID + "\n" + tcgRespArr[r].response + "\n";
                for (var c = 0; c < tcgRespArr[r].citationTcg.length; c++) {
                    cit.push(tcgRespArr[r].citationTcg[c]);
                }
            }

            this.getView().getModel("TokenLimit").setProperty("/usedToken", tokensUsed);
            this.getView().getModel("TokenLimit").setProperty("/tokenVis", true);
            this.getView().getModel("airesponseDetailModel").setProperty("/resp", resp);
            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/citationArr", cit);
            var oResMsg = {
                role: 'assistant',
                content: resp
            };
            var totToken = 0;
            var fileCont = true;

            Utility.handleTabResponseDynamic(
                scenario,
                that,
                resp,
                oResMsg,
                promptMsgData,
                totToken,
                tknallotted,
                oViewModel,
                fileCont
            );
            this.getView().getModel("tcgModel").setProperty("/fText", "");
            BusyIndicator.hide();
        },

        onGo: function () {
            var that = this;
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sSelectedIconTab = this.selectedKeyFunct();
            var aFileData = this.getView().getModel("appmodel").getProperty("/BSContent");
            var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
            var promptMsgData = this.getView().byId("descTxtAreaPrompt").getValue();
            var promptID = this.getView().byId("multiInputPrompt").getValue();
            var popUpSel = this.getView().getModel("switchFragments").getProperty("/frg/frName");
            if (popUpSel == "") {

                if (sSelectedIconTab == "PCT") {
                    if (aFileData == "") {
                        MessageBox.error("Please Upload/ Select a file");
                    } else {
                        if (this.step == "Step1" && this.executedOnce !== false) {
                            sap.m.MessageBox.confirm(oBundle.getText("questionMsg"), {
                                actions: ["Next Step", "Send to AI"],
                                onClose: function (oAction) {
                                    if (oAction === "Next Step") {
                                        MessageBox.information(oBundle.getText("nextMsg"));
                                    } else {
                                        that.executedOnce == false;
                                        //that.MergeButtonTest1();
                                        that._handlePCTExecution();
                                    }
                                }
                            });
                            this._handlePCTExecution();
                            return;

                        } else {
                            if (sSelectedIconTab == "PCT") {
                                this._handlePCTExecution();
                                return;
                            }
                            this.MergeButtonTest1();
                        }
                        const oSideNavigation = this.byId("sideNavigation"),
                            bExpanded = oSideNavigation.getExpanded();
                        oSideNavigation.setExpanded(false);
                    }

                } else if (sSelectedIconTab == "TCG") {
                    // this.AIcallforTCG();
                    this.aicallforTCG_onlyKB();
                }
                // else if (sSelectedIconTab == "PCT") {
                //       this._handlePCTExecution();

                // }
                else if (sSelectedIconTab == "BPM" && aFileData == "") {
                    MessageBox.error("Please Upload/ Select a file");
                } else if (sSelectedIconTab == "BPM" && aFileData !== "") {
                    //MessageBox.error("Please Upload/ Select a file");
                    this.aicallforBPM_onlyKB();
                } else {
                    var sysName = this.getView().byId("multiInputSystem").getValue();
                    var sysContent = this.getView().byId("descTxtArea").getValue();
                    var editableSysDesc = this.getView().byId("descTxtArea").getEditable();
                    // var promptDesc = this.getView().byId("descTxtAreaPrompt").getValue();
                    var noGo = false;
                    if (sysName == "") {
                        this.getView().byId("multiInputSystem").setValueState("Error");
                        this.getView().byId("multiInputSystem").setValueStateText("Please Select / Add a System Message");
                        MessageBox.error("Please Select / Add a System Message");
                        noGo = true;
                    } else if (this.keyConst == sysName) {
                        this.getView().byId("multiInputSystem").setValueState("Error");
                        this.getView().byId("multiInputSystem").setValueStateText("Please Enter Unique System Message ID");
                        MessageBox.error("Please Enter Unique System Message ID");
                        noGo = true;
                    } else if (sysContent == "") {
                        this.getView().byId("descTxtArea").setValueState("Error");
                        this.getView().byId("descTxtArea").setValueStateText("Please Enter System Message Description");
                        MessageBox.error("Please Enter System Message Description");
                        noGo = true;
                    } else if (editableSysDesc == true) {
                        this.getView().byId("descTxtArea").setValueState("Error");
                        this.getView().byId("descTxtArea").setValueStateText("Please Save System Message");
                        MessageBox.error("Please Save System Message to proceed!");
                        noGo = true;
                    } else if (promptID !== "" && promptMsgData == "") {
                        this.getView().byId("descTxtAreaPrompt").setValueState("Error");
                        this.getView().byId("descTxtAreaPrompt").setValueStateText("Please Enter and Save Prompt Description");
                        MessageBox.error("Please Enter and Save Prompt Description");
                        noGo = true;
                    } else if (promptID == "" && promptMsgData !== "") {
                        this.getView().byId("descTxtAreaPrompt").setValueState("Error");
                        this.getView().byId("descTxtAreaPrompt").setValueStateText("Please Select a Prompt ID or Create a Prompt");
                        this.getView().byId("descTxtAreaPrompt").setValue("");
                        MessageBox.error("Please Select a Prompt ID or Create a Prompt");
                        noGo = true;
                    }
                    //else if (promptID !== "" && promptMsgData !== "" && this.isPromptAdded == false) {
                    //     MessageBox.error("Please Save Prompt Details to proceed!");
                    //     noGo = true;
                    // }
                    else if (!aFileData && promptMsgData == "" && bRagEnabled == false && this.executedOnce == false) {
                        MessageBox.error("Please upload/ select a file OR select/add a Prompt!");
                        this.getView().byId("multiInputPrompt").setValueState("Error");
                        this.getView().byId("multiInputPrompt").setValueStateText("Enter/Select Prompt ID");
                        this.getView().byId("selDocList").setValueState("Error");
                        this.getView().byId("selDocList").setValueStateText("Upload/Select File");

                        // this.getView().byId("fileUploader1").setValueState("Error");
                        // this.getView().byId("fileUploader1").setValueStateText("Upload/Select File");

                    } else if ((promptMsgData == "" || promptID == "") && bRagEnabled == true && (sSelectedIconTab !== "PCT" && sSelectedIconTab !== "TCG" && sSelectedIconTab !== "BPM")) {
                        this.getView().byId("multiInputPrompt").setValueState("Error");
                        this.getView().byId("multiInputPrompt").setValueStateText("Enter/Select Prompt ID");
                        MessageBox.error("Please Select/Add a Prompt!");

                    } else if (promptMsgData == "" && promptID == "" && bRagEnabled == false && this.executedOnce == true) {
                        this.getView().byId("descTxtAreaPrompt").setValueState("Error");
                        this.getView().byId("descTxtAreaPrompt").setValueStateText("Please Select a Prompt ID or Create a Prompt");
                        this.getView().byId("descTxtAreaPrompt").setValue("");
                        this.getView().byId("multiInputPrompt").setValueState("Error");
                        this.getView().byId("multiInputPrompt").setValueStateText("Enter/Select Prompt ID");
                        MessageBox.error("Please Select a Prompt ID or Create a Prompt");
                        noGo = true;
                    } else {
                        this.MergeButtonTest1();
                        const oSideNavigation = this.byId("sideNavigation"),
                            bExpanded = oSideNavigation.getExpanded();
                        oSideNavigation.setExpanded(false);
                    }
                }
            }
            else {
                MessageBox.information("Please select a functionality Tab from Navigation Group to press Go!");
            }
        },
        MergeButtonTest1: function () {
            var that = this;
            var sSelectedIconTab = this.selectedKeyFunct();
            //RAG changes Aishwarya
            var ragModel = this.getView().getModel("ragModel");
            var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
            if (bRagEnabled) {
                // var kbPayload = "";
                that.KBImpliment();  //RAG function call
            } else {
                var oModel = this.getView().getModel("appmodel");


                var oQuestionAI;
                var oFileUploader;
                // var sInputFieldId = "";
                var aMessages;
                var oResponseModel = this.getView().getModel("responseModel");
                var oBundle = this.getView().getModel("i18n").getResourceBundle();


                if (!this.isSystemSaved) {
                    MessageBox.warning(oBundle.getText("mandatorySysMsg"));
                    return;
                }
                var oPromptModel = this.getView().getModel("BSPromptData");
                var promptMsgData = this.getView().byId("descTxtAreaPrompt").getValue();

                oQuestionAI = promptMsgData;

                var contentPath = "/BSContent";
                var sContent = oModel.getProperty(contentPath); ///file path



                var aiSelected = that.getView().byId("selModel").getSelectedKey();//
                var aiModelName = that.getView().byId("selModel").getValue(); //
                var apiUrl4 = Utility.getApiUrl(aiModelName, aiSelected, this.sApiUrl, this._sBasePath);//
                var aMsgContentSystemDesc = this.getView().byId("descTxtArea").getValue();
                oFileUploader = this.byId("fileUploader1");

                var oModel = this.getView().getModel("appmodel");

                var aFiles = [];
                if (oFileUploader.oFileUpload.files.length == 0 && this.getView().getModel("fileViewModel").oData.Key) {
                    aFiles.push(this.getView().getModel("fileViewModel").oData);
                    if (aFiles[0].Name.split(".")[1] == "png" || aFiles[0].Name.split(".")[1] === "jpeg" || aFiles[0].Name.split(".")[1] === "jpg") {
                        aFiles[0].type = "image/" + aFiles[0].Name.split(".")[1];
                    }
                } else {
                    aFiles = oFileUploader.oFileUpload.files;
                }
                var _this = this;
                if (_this.executedOnce) {
                    this.reUploadContentResponse();
                } else if (!_this.executedOnce && (!aFiles || aFiles.length !== 0)) {
                    if (aFiles[0].type === "image/png" || aFiles[0].type === "image/jpeg" || aFiles[0].type === "image/jpg") {
                        this.onImageUpload();
                        this.isImage = true;
                        _this.executedOnce = true;
                    } else {
                        this.uploadContentResponse();
                        _this.executedOnce = true;
                    }
                } else if (_this.executedOnce === false) {
                    this.handleUploadContentPress(); //first time
                    _this.executedOnce = true;
                }
                this.getFiles();

            }
            var oResponseModel = this.getView().getModel("responseModel");
            oResponseModel.setProperty("/selectedPromptId", "");
            oResponseModel.setProperty("/originalPrompt", "");
            this.onRagToggle();
        },
        onImageUpload: async function () {
            var oFileUploader;
            var busyDialog = new sap.m.BusyDialog();
            var aMessages = [];
            var oResponseModel = this.getView().getModel("responseModel");
            var aModel = this.getView().getModel("appmodel");
            var sSelectedIconTab = this.selectedKeyFunct();
            var oFileUploader = this.getView().byId("fileUploader1");
            var aMessages = [];
            var aModel = this.getView().getModel("appmodel");
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var _this = this;
            var oToken;
            var usedToken;
            var that = this;
            var aModel = this.getView().getModel("appmodel");

            var aMsgContentSystemKey = this.getView().byId("multiInputSystem").getValue();
            var aMsgContentSystemDesc = this.getView().byId("descTxtArea").getValue();
            var promptMsgData = this.getView().byId("descTxtAreaPrompt").getValue();
            var aiSelected = that.getView().byId("selModel").getSelectedKey();
            var aiModelName = that.getView().byId("selModel").getValue();
            var apiUrl = Utility.getApiUrl(aiModelName, aiSelected, this.sApiUrl, this._sBasePath);
            var contentPath = "/BSContent";
            var sContent = aModel.getProperty(contentPath); ///file path
            var oContent = "";

            if (sContent == undefined) {
                sContent = null;
                oContent = sContent + "\n" + promptMsgData;
            } else if (Array.isArray(sContent)) {
                if (promptMsgData !== "") {
                    sContent.push({ "type": "text", "text": promptMsgData })
                }
                oContent = sContent;

            }
            var aMessages = [
                {
                    "role": "system",
                    "content": aMsgContentSystemDesc
                },
                {
                    "role": "user",
                    "content": oContent
                }
            ];
            ////var aMessages = view.getModel("responseModel").getProperty(threadPath);
            var aMsgExisting = this.getView().getModel("msgModel").getProperty("/aMsg");
            if (aMsgExisting.length !== 0 && this.saveAddEx == true) {
                aMsgExisting.push(aMessages[0]);
                aMsgExisting.push(aMessages[1]);
                this.getView().getModel("msgModel").setProperty("/aMsg", aMsgExisting);
                aMessages = aMsgExisting;
            } else {
                this.getView().getModel("msgModel").setProperty("/aMsg", aMessages);
            }
            if (sSelectedIconTab == "TCG" || sSelectedIconTab == "BPM" || sSelectedIconTab == "PCT") {

            }
            var oModel = this.getView().getModel("TokenLimit");
            var _this = this;
            var oViewModel = this.getView().getModel("viewModel");
            var payloadNonStream = Utility.createPayloadBasedOnModelNonStream(aiModelName, aMessages, oViewModel, this);
            var payload = Utility.createPayloadBasedOnModel(aiModelName, aMessages, oViewModel, this);
            //var payloadNonStream = Utility.createPayloadBasedOnModelNonStream(aiModelName, aMessages, oViewModel, this);
            BusyIndicator.show();
            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", false);
            var aMsgContentSystemDesc = this.getView().byId("descTxtArea").getValue();
            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/sysMsg", aMsgContentSystemDesc);
            this.getOwnerComponent().getModel("airesponseDetailModel").refresh();
            var keytoSend = this.getView().getModel("selKeyForDetailDetail").getProperty("/keyD");
            var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;
            this.oRouter.navTo("DetailDetail", { dispKey: keytoSend, aimodel: selectedAI, layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded });

            var busyDialog = new sap.m.BusyDialog();

            try {

                const response = await fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...this.defaultHeaders
                    },
                    body: JSON.stringify(payload)
                });
                that.getOwnerComponent().getModel("airesponseDetailModel").refresh();

                const sSelectedIconTab = this.selectedKeyFunct();
                const oResponseModel = this.getView().getModel("responseModel");
                ///commenting history for testing
                const { message: oResMsg, usedTokens: oUsedToken, rawText: sResponse } =
                    await Utility.processAPIResponse(this, payloadNonStream, response, aiModelName, busyDialog, apiUrl);
                // that.getView().byId("prgIndicator").setPercentValue("30%");
                // that.getView().byId("prgIndicator").setDisplayValue("Step2");
                // that.getView().byId("nextBtn").setVisible(true);
                BusyIndicator.show();
                sap.m.MessageToast.show("Loading History..");
                const tokenData = oModel.getProperty(`/${sSelectedIconTab}/${aiModelName}`);

                if (tokenData) {
                    oToken = tokenData.TotalToken || 0;
                    usedToken = tokenData.UsageToken || 0;
                }

                //var priceText = "Token Limit : " + oUsedToken + " / " + oToken;
                var oUsage;
                var fileCont = false;
                busyDialog.close();
                BusyIndicator.hide();
                Utility.handleTabResponseDynamic(sSelectedIconTab,
                    this,
                    sResponse,
                    oResMsg,
                    promptMsgData,
                    oUsedToken,
                    oToken,
                    oViewModel,
                    fileCont
                );
                // start of madhu
                // STEP 1: store final response for DetailDetail
                var oDetailModel = that.getOwnerComponent().getModel("airesponseDetailModel");
                if (oDetailModel) {
                    oDetailModel.setProperty("/resp", sResponse || "");
                    oDetailModel.setProperty("/sysMsg", aMsgContentSystemDesc || "");
                    oDetailModel.refresh(true);
                }
                // end of madhu

                this.sendTokenUsageLog(oUsedToken, promptMsgData);
                BusyIndicator.hide();
                busyDialog.close();

            } catch (error) {
                sap.m.MessageBox.error(oBundle.getText("errorAzureAPI"));
                console.error("Fetch error:", error);
                BusyIndicator.hide();
                busyDialog.close();
            } finally {
                BusyIndicator.hide();
                busyDialog.close();
            }

        },
        AIcallforTCG: async function () {
            BusyIndicator.show();
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", false);
            var oViewModel = this.getView().getModel("viewModel");
            var that = this;
            var modelId = this.getView().byId("selModel").getSelectedKey();
            var modelName = this.getView().byId("selModel").getValue();
            var aMsgContentSystemDesc = this.getView().byId("descTxtArea").getValue();
            var promptMsgData = this.getView().byId("descTxtAreaPrompt").getValue();
            var allMessages = [];
            var oModel = this.getView().getModel("appmodel");
            var fileData = oModel.getProperty("/BSContent");
            // var fileData2 = fileData;
            var fileViewData = this.getView().getModel("fileViewModel").oData;
            var fileExtension = (fileViewData.Name.split(".").pop() || "").toLowerCase();
            const hasPlaceholder = /\{\{\?additional_info\}\}/.test(aMsgContentSystemDesc || "");
            const hasPlaceholderReqText = /\{\{\?requirement_text\}\}/.test(aMsgContentSystemDesc || "");
            const hasPlaceholderforFile = /\{\{\?requirement_file\}\}/.test(aMsgContentSystemDesc || "");
            var dataObj = { "UserStory_ID": "", "Epic": "", "Features": "", "User Stories Description": "", "Acceptance Criteria": "" };
            var payloadExtractedData = [];
            var useridPattern = /UserStory_ID/g;
            var tobeRepeated = "";
            var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
            var yesGo = false;
            var tokensUsed = 0;
            // this.savedSettings=true;
            this.getView().getModel("tcgModel").setProperty("/allResponses", []);
            var kbPayload = {
                "UserStory_ID": "",
                "Epic": "",
                "Features": "",
                "UserStoriesDescription": "",
                "AcceptanceCriteria": "",
                "system_prompt": {
                    "name": this.getView().byId("multiInputSystem").getValue(),
                    "version": "1.0.0",
                    "scenario": "TCG",
                    "spec": {
                        "template": [
                            {
                                "role": "system",
                                "content": ""
                            }
                        ],
                        "defaults": {
                            "additional_info": promptMsgData,
                            "UserId": this._loggedInUser,
                            "ProjectId": this._ProjectDetail,
                            "selection": this.getView().getModel("tcgModel").getProperty("/selVal")
                        }
                    }
                }
            };
            if (fileData === "") {
                BusyIndicator.hide();
                MessageBox.error("Please upload a File!");
                this.getView().byId("selDocList").setValueState("Error");
                this.getView().byId("selDocList").setValueStateText("Upload/Select File");
                return;
            } else if (Array.isArray(fileData) == true) {
                BusyIndicator.hide();
                sap.m.MessageBox.warning(oBundle.getText("wrongTemplate"));
            } else if (fileData.url && bRagEnabled === true) {
                BusyIndicator.hide();
                sap.m.MessageBox.warning(oBundle.getText("kbTCGFileSel"));
            } else if (promptMsgData === "" && bRagEnabled === true) {
                BusyIndicator.hide();
                this.getView().byId("multiInputPrompt").setValueState("Error");
                this.getView().byId("multiInputPrompt").setValueStateText("Enter/Select Prompt ID");
                MessageBox.error("Please Select/Add a Prompt!");
                return;
            } else if (fileData !== "") {
                //hasPlaceholderReqText ? aMsgContentSystemDesc.replace(/\{\{\?requirement_text\}\}/g, ""): aMsgContentSystemDesc;
                aMsgContentSystemDesc = aMsgContentSystemDesc.replace(/\{\{\?requirement_text\}\}/g, "");
                // var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
                if (promptMsgData !== "") {
                    tobeRepeated = hasPlaceholder ? aMsgContentSystemDesc.replace(/\{\{\?additional_info\}\}/g, promptMsgData)
                        : `${aMsgContentSystemDesc}\n\nAdditional Information:\n${promptMsgData}`;
                } else {
                    tobeRepeated = aMsgContentSystemDesc.replace(/\{\{\?additional_info\}\}/g, "");
                    //tobeRepeated = aMsgContentSystemDesc;
                }
                /////file content true///
                if (this.getView().getModel("tcgModel").getProperty("/wordorExcel") == "word") {
                    if (!fileData.match(useridPattern)) {
                        sap.m.MessageBox.warning(oBundle.getText("wrongTemplate"));
                        BusyIndicator.hide();
                    } else {
                        var count = fileData.match(useridPattern).length;
                        var searchUserId = "UserStory_ID :";
                        var searchEpic = "Epic :";
                        var searchFeatures = "Features :";
                        var searchUserStorriesDesc = "User Stories Description :";
                        var searchAccCrit = "Acceptance Criteria :";
                        var paraBreakPattern = /\n\n\n\n/g;
                        var para = 0;
                        var dataArr = [];
                        var userId, epic, features, userstoriesDesc, acccrit;

                        for (var i = 0; i < count; i++) {
                            if (i == 0) {
                                para = 0;
                                userId = fileData.indexOf(searchUserId);
                                epic = fileData.indexOf(searchEpic);
                                features = fileData.indexOf(searchFeatures);
                                userstoriesDesc = fileData.indexOf(searchUserStorriesDesc);
                                acccrit = fileData.indexOf(searchAccCrit);
                            } else {
                                if (fileExtension == "txt") {
                                    para = fileData.search(/\r\n\r\n/) + 4;
                                } else if (fileExtension == "pdf") {
                                    // para = fileData.indexOf("UserStory_ID : US00" + ((count + 1).toString()));
                                } else {
                                    para = fileData.search(/\n{4}/) + 4;
                                }
                                if (fileExtension !== "pdf") {
                                    fileData = fileData.slice(para);
                                }
                                userId = fileData.indexOf(searchUserId);
                                epic = fileData.indexOf(searchEpic);
                                features = fileData.indexOf(searchFeatures);
                                userstoriesDesc = fileData.indexOf(searchUserStorriesDesc);
                                acccrit = fileData.indexOf(searchAccCrit);
                            }
                            var textAfterIndex1 = userId + searchUserId.length;
                            var textAfterString1 = fileData.substring(textAfterIndex1).trim();
                            if (fileExtension == "txt") {
                                dataObj["UserStory_ID"] = textAfterString1.split("\r\n")[0].trim();
                            } else if (fileExtension == "pdf") {
                                dataObj["UserStory_ID"] = textAfterString1.split(searchEpic.slice(0, 4))[0].trim();
                            } else {
                                dataObj["UserStory_ID"] = textAfterString1.split("\n\n")[0].trim();
                            }
                            var textAfterIndex2 = epic + searchEpic.length;
                            var textAfterString2 = fileData.substring(textAfterIndex2).trim();
                            if (fileExtension == "txt") {
                                dataObj["Epic"] = textAfterString2.split("\r\n")[0].trim();
                            } else if (fileExtension == "pdf") {
                                dataObj["Epic"] = textAfterString2.split(searchFeatures.slice(0, 8))[0].trim();
                            } else {
                                dataObj["Epic"] = textAfterString2.split("\n\n")[0].trim();
                            }
                            var textAfterIndex3 = features + searchFeatures.length;
                            var textAfterString3 = fileData.substring(textAfterIndex3).trim();
                            if (fileExtension == "txt") {
                                dataObj["Features"] = textAfterString3.split("\r\n")[0].trim();
                            } else if (fileExtension == "pdf") {
                                dataObj["Features"] = textAfterString3.split(searchUserStorriesDesc.slice(0, 24))[0].trim();
                            } else {
                                dataObj["Features"] = textAfterString3.split("\n\n")[0].trim();
                            }
                            var textAfterIndex4 = userstoriesDesc + searchUserStorriesDesc.length;
                            var textAfterString4 = fileData.substring(textAfterIndex4).trim();
                            if (fileExtension == "txt") {
                                dataObj["User Stories Description"] = textAfterString4.split("\r\n")[0].trim();
                            } else if (fileExtension == "pdf") {
                                dataObj["User Stories Description"] = textAfterString4.split(searchAccCrit.slice(0, 19))[0].trim();
                            } else {
                                dataObj["User Stories Description"] = textAfterString4.split("\n\n")[0].trim();
                            }
                            var textAfterIndex5 = acccrit + searchAccCrit.length;
                            var textAfterString5 = fileData.substring(textAfterIndex5).trim();
                            if (fileExtension == "txt") {
                                dataObj["Acceptance Criteria"] = textAfterString5.split("\r\n")[0].trim();
                            } else if (fileExtension == "pdf") {
                                dataObj["Acceptance Criteria"] = textAfterString5.split(searchUserId.slice(0, 12))[0].trim();
                            } else {
                                dataObj["Acceptance Criteria"] = textAfterString5.split("\n\n")[0].trim();
                            }
                            if (fileExtension == "pdf") {
                                var newLength = dataObj["Acceptance Criteria"].length;
                                fileData = textAfterString5.slice(newLength);
                            }
                            var fileDataRepeat = "UserStory_ID : " + dataObj["UserStory_ID"] + "\nEpic : " + dataObj["Epic"] + "\nFeatures : " + dataObj["Features"] + "\nUser Stories Description : " + dataObj["User Stories Description"] + "\nAcceptance Criteria : " + dataObj["Acceptance Criteria"];
                            var newSysContentWithFile = hasPlaceholderforFile ? (tobeRepeated || "").replace(/\{\{\?requirement_file\}\}/g, fileDataRepeat)
                                : `${tobeRepeated || ""}\n\nRequirement File:\n${fileDataRepeat}`;
                            var aMessages = [{ "role": "system", "content": newSysContentWithFile }];
                            //var payload1 = Utility.createPayloadBasedOnModel(modelName, aMessages, oViewModel, this);
                            var histPayload = Utility.createPayloadBasedOnModelNonStream(modelName, aMessages, oViewModel, this);
                            //var repeatedMsg = { "messages": aMessages, "temperature": oViewModel.getProperty("/comnPopUpModelParamTemp"), "top_p": oViewModel.getProperty("/comnPopUpModelParamTopP"), "frequency_penalty": oViewModel.getProperty("/comnPopUpModelParamFreqP"), "presence_penalty": oViewModel.getProperty("/comnPopUpModelParamPresenceP"), "max_tokens": oViewModel.getProperty("/comnPopUpModelParamMaxLength"), "stop": null, "stream": false };
                            // repeatedMsg=payload1;
                            allMessages.push(histPayload);
                            if (promptMsgData !== "" && bRagEnabled == true) {
                                kbPayload["UserStory_ID"] = dataObj["UserStory_ID"];
                                kbPayload["Epic"] = dataObj["Epic"];
                                kbPayload["Features"] = dataObj["Features"];
                                kbPayload["UserStoriesDescription"] = dataObj["User Stories Description"];
                                kbPayload["AcceptanceCriteria"] = dataObj["Acceptance Criteria"];
                                kbPayload.system_prompt.spec.template[0].content = newSysContentWithFile;
                                //var apiKMUrl                  = "https://TCG.cfapps.eu10.hana.ondemand.com/sap-testcase-generator";

                                var apiKMUrl = this._sBasePath + "/kb-integration/sap-testcase-generator";
                                try {
                                    const response = await fetch(apiKMUrl, {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            ...(this.defaultHeaders || {})
                                        },
                                        body: JSON.stringify(kbPayload)
                                    });

                                    if (!response.ok) {
                                        const errText = await response.text().catch(() => "");
                                        throw new Error(`TCG call failed for ${story.UserStory_ID || "Unknown"}: ${response.status} ${errText}`);
                                    }
                                    const rawText = await response.text();

                                    // Parse NDJSON; if not NDJSON, fallback to single JSON or plain text
                                    const parsedResponse = this._parseNdjsonOrJsonText(rawText);
                                    var tokenConsumed = {};
                                    var citationIndex = [];
                                    parsedResponse[0].citations.forEach((item) => {
                                        if (!item) return;
                                        const filePath = item.download_url || item.file_path || "";
                                        const filename = item.filename || "Unknown";
                                        const link = item.download_url;
                                        if (link || filename) { citationIndex.push({ link: link, fname: filename }); }
                                    });
                                    citationIndex.forEach(c => {
                                        const key = `${c.fname}|${c.link}`;
                                        if (!citationIndex.some(m => `${m.fname}|${m.link}` === key)) citationIndex.push(c);
                                    });

                                    tokensUsed = tokensUsed + parsedResponse[0].token_usage.total_tokens;
                                    var tcgRespArr = this.getView().getModel("tcgModel").getProperty("/allResponses");
                                    tcgRespArr.push({ UserStory_ID: "****************" + kbPayload.UserStory_ID + "****************", response: parsedResponse[0].response, citationTcg: citationIndex, tokensGen: tokensUsed });
                                    this.getView().getModel("tcgModel").setProperty("/allResponses", tcgRespArr);

                                } catch (err) {
                                    BusyIndicator.hide();
                                    sap.m.MessageBox.error(`TCG processing error: ${err.message}`);
                                } finally {
                                    // BusyIndicator.hide();
                                }
                            }

                            dataArr.push(dataObj);
                        }
                        yesGo = true;
                    }

                } else if (this.getView().getModel("tcgModel").getProperty("/wordorExcel") == "excel") {
                    var excelfileDetails = [];
                    excelfileDetails = this.getView().getModel("fileViewModel").oData.xlsJsonData;
                    for (var x = 0; x < excelfileDetails.length; x++) {
                        // if(excelfileDetails[x]["UserStory_ID"].includes("US00")==false){
                        // excelfileDetails[x]["UserStory_ID"] = "US00" + excelfileDetails[x]["UserStory_ID"];
                        // }
                        var fileDataRepeat = "UserStory_ID : " + excelfileDetails[x]["UserStory_ID"] + "\nEpic : " + excelfileDetails[x]["Epic"] + "\nFeatures : " + excelfileDetails[x]["Features"] + "\nUser Stories Description : " + excelfileDetails[x]["User Stories Description"] + "\nAcceptance Criteria : " + excelfileDetails[x]["Acceptance Criteria"] + "\n";
                        var newSysContentWithFile = hasPlaceholderforFile ? (tobeRepeated || "").replace(/\{\{\?requirement_file\}\}/g, fileDataRepeat)
                            : `${tobeRepeated || ""}\n\nRequirement File:\n${fileDataRepeat}`;
                        var aMessages = [{ "role": "system", "content": newSysContentWithFile }];
                        var histPayload = Utility.createPayloadBasedOnModelNonStream(modelName, aMessages, oViewModel, this);
                        var payload1 = Utility.createPayloadBasedOnModel(modelName, aMessages, oViewModel, this);
                        // var histPayload = Utility.createPayloadBasedOnModelNonStream(modelName, aMessages, oViewModel, this);

                        var repeatedMsg = { "messages": [{ "role": "system", "content": newSysContentWithFile }], "temperature": oViewModel.getProperty("/comnPopUpModelParamTemp"), "top_p": oViewModel.getProperty("/comnPopUpModelParamTopP"), "frequency_penalty": oViewModel.getProperty("/comnPopUpModelParamFreqP"), "presence_penalty": oViewModel.getProperty("/comnPopUpModelParamPresenceP"), "max_tokens": oViewModel.getProperty("/comnPopUpModelParamMaxLength"), "stop": null, "stream": false };

                        allMessages.push(histPayload);
                        if (promptMsgData !== "" && bRagEnabled == true) {
                            kbPayload["UserStory_ID"] = excelfileDetails[x]["UserStory_ID"];
                            kbPayload["Epic"] = excelfileDetails[x]["Epic"];
                            kbPayload["Features"] = excelfileDetails[x]["Features"];
                            kbPayload["UserStoriesDescription"] = excelfileDetails[x]["User Stories Description"];
                            kbPayload["AcceptanceCriteria"] = excelfileDetails[x]["Acceptance Criteria"];
                            kbPayload.system_prompt.spec.template[0].content = newSysContentWithFile;
                            var apiKMUrl = this._sBasePath + "/kb-integration/sap-testcase-generator";
                            try {
                                const response = await fetch(apiKMUrl, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        ...(this.defaultHeaders || {})
                                    },
                                    body: JSON.stringify(kbPayload)
                                });

                                if (!response.ok) {
                                    const errText = await response.text().catch(() => "");
                                    throw new Error(`TCG call failed for ${story.UserStory_ID || "Unknown"}: ${response.status} ${errText}`);
                                }
                                const rawText = await response.text();

                                // Parse NDJSON; if not NDJSON, fallback to single JSON or plain text
                                const parsedResponse = this._parseNdjsonOrJsonText(rawText);
                                var citationIndex = [];
                                parsedResponse[0].citations.forEach((item) => {
                                    if (!item) return;
                                    const filePath = item.download_url || item.file_path || "";
                                    const filename = item.filename || "Unknown";
                                    const link = item.download_url;
                                    if (link || filename) { citationIndex.push({ link: link, fname: filename }); }
                                });
                                citationIndex.forEach(c => {
                                    const key = `${c.fname}|${c.link}`;
                                    if (!citationIndex.some(m => `${m.fname}|${m.link}` === key)) citationIndex.push(c);
                                });

                                // const { message: oResMsg, usedTokens: oUsedToken, rawText: sResponse } = await this.KnowledgeBaseTCG(parsedResponse);
                                var tcgRespArr = this.getView().getModel("tcgModel").getProperty("/allResponses");
                                tokensUsed = tokensUsed + parsedResponse[0].token_usage.total_tokens;
                                // tcgRespArr.push({ UserStory_ID: kbPayload.UserStory_ID, response: parsedResponse.response, tokenUserUsed: oUsedToken });
                                tcgRespArr.push({ UserStory_ID: "****************" + kbPayload.UserStory_ID + "****************", response: parsedResponse[0].response, citationTcg: citationIndex, tokensGen: tokensUsed });
                                this.getView().getModel("tcgModel").setProperty("/allResponses", tcgRespArr);
                            } catch (err) {
                                BusyIndicator.hide();
                                sap.m.MessageBox.error(`TCG processing error: ${err.message}`);
                            } finally {
                                // BusyIndicator.hide();
                            }
                        }
                    }

                }

                const oSideNavigation = this.byId("sideNavigation"),
                    bExpanded = oSideNavigation.getExpanded();
                oSideNavigation.setExpanded(false);
                this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", false);
                var aMsgContentSystemDesc1 = this.getView().byId("descTxtArea").getValue();
                this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/sysMsg", aMsgContentSystemDesc1);
                this.getOwnerComponent().getModel("airesponseDetailModel").refresh();
                var keytoSend = this.getView().getModel("selKeyForDetailDetail").getProperty("/keyD");
                var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;
                this.oRouter.navTo("DetailDetail", { dispKey: keytoSend, aimodel: selectedAI, layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded });
                var tokenData = this.getView().getModel("TokenLimit").oData;
                var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;
                var scenario = this.selectedKeyFunct();
                var tknallotted = tokenData[scenario][selectedAI].TotalToken;
                this.getView().getModel("TokenLimit").setProperty("/token", tknallotted);
                if (promptMsgData == "" && bRagEnabled == true) {
                    BusyIndicator.hide();
                    this.getView().byId("multiInputPrompt").setValueState("Error");
                    this.getView().byId("multiInputPrompt").setValueStateText("Enter/Select Prompt ID");
                    MessageBox.error("Please Select/Add a Prompt!");
                }
                else if (promptMsgData !== "" && bRagEnabled == true) {
                    var resp = "";
                    var cit = [];
                    var tcgRespArr = this.getView().getModel("tcgModel").getProperty("/allResponses");
                    for (var r = 0; r < tcgRespArr.length; r++) {

                        resp = resp + tcgRespArr[r].UserStory_ID + "\n" + tcgRespArr[r].response + "\n";
                        for (var c = 0; c < tcgRespArr[r].citationTcg.length; c++) {
                            cit.push(tcgRespArr[r].citationTcg[c]);
                        }


                    }

                    this.getView().getModel("TokenLimit").setProperty("/usedToken", tokensUsed);
                    this.getView().getModel("TokenLimit").setProperty("/tokenVis", true);
                    this.getView().getModel("airesponseDetailModel").setProperty("/resp", resp);
                    this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/citationArr", cit);
                    //this._addToHistoryLogGeneric(resp);
                    var oResMsg = {
                        role: 'assistant',
                        content: resp
                    };
                    var totToken = 0;
                    var fileCont = true;
                    var oViewModel = that.getView().getModel("viewModel");
                    Utility.handleTabResponseDynamic(
                        scenario,
                        that,
                        resp,
                        oResMsg,
                        promptMsgData,
                        totToken,
                        tknallotted,
                        oViewModel,
                        fileCont
                    );

                    BusyIndicator.hide();
                } else if (bRagEnabled == false) {
                    if (allMessages.length !== 0) {

                        var finpayload = {
                            "payload": {
                                "promptref": JSON.stringify(allMessages),
                                "model": modelId,
                                "modelname": modelName,
                            }
                        };

                        $.ajax({
                            url: this._sBasePath + '/cockpit/apiCompletion',
                            type: "POST",
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            timeout: 1200000,
                            data: JSON.stringify(finpayload),
                            success: function (data, status, xhr) {
                                BusyIndicator.hide();
                                var generated = this._extractCompletionText(data);
                                generated = generated.replaceAll("\n", " \n ");
                                generated = generated.replaceAll("\\n", " \n ");
                                generated = generated.replaceAll("<br>", " \n ");
                                generated = generated.replaceAll("&nbsp;", ' ');
                                that.getView().getModel("airesponseDetailModel").setProperty("/resp", generated);
                                var totToken = 0;
                                for (var k = 0; k < data.value.results.length; k++) {
                                    totToken = totToken + data.value.results[k].tokenvalue;
                                }
                                that.getView().getModel("TokenLimit").setProperty("/usedToken", totToken);
                                that.getView().getModel("TokenLimit").setProperty("/tokenVis", true);
                                that.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", true);
                                that.sendTokenUsageLog(totToken, promptMsgData);
                                var oResMsg = {
                                    role: 'assistant',
                                    content: data
                                };
                                var fileCont = true;
                                var oViewModel = that.getView().getModel("viewModel")
                                Utility.handleTabResponseDynamic(
                                    scenario,
                                    that,
                                    generated,
                                    oResMsg,
                                    promptMsgData,
                                    totToken,
                                    tknallotted,
                                    oViewModel,
                                    fileCont
                                );
                            }.bind(this),
                            error: function (jqXhr, textStatus, errorMessage) {
                                MessageBox.error("Timeout");
                                BusyIndicator.hide();
                            }.bind(this)
                        });
                    }
                }
            }

        },
        _extractCompletionText: function (data) {
            if (!data) return "";

            // AI Response-like chat format
            try {
                var c1 = data.choices && data.choices[0];
                if (c1 && c1.message && typeof c1.message.content === "string") {
                    return c1.message.content;
                }
            } catch (e1) { }

            // AI Response-like text format
            try {
                var c2 = data.choices && data.choices[0];
                if (c2 && typeof c2.text === "string") {
                    return c2.text;
                }
            } catch (e2) { }

            // Custom backend shapes
            if (typeof data.result === "string") {
                return data.result;
            }
            if (data.data && typeof data.data.content === "string") {
                return data.data.content;
            }

            // Fallback: stringify whole response
            return typeof data === "string" ? data : JSON.stringify(data, null, 2);
        },
        sendTokenUsageLog: function (tokensUsed, promptMsgData) {
            var that = this;
            var nwModel = this.getOwnerComponent().getModel("NetworkGraphModel");
            var sessionId = nwModel.getProperty("/sessionId");
            var sSelectedIconTab = this.selectedKeyFunct();

            var modelId = that.getView().byId("selModel").getSelectedKey()
            var modelName = that.getView().byId("selModel").getValue()
            var keytoSend = this.getView().getModel("selKeyForDetailDetail").getProperty("/keyD");
            var keyObj = { keyD: keytoSend };
            var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;
            this.getView().getModel("selKeyForDetailDetail").setProperty("/keyD", keytoSend);
            //  NEW: mark this tab as having detail
            var oStateModel = this.getView().getModel("tabState");
            if (oStateModel) {
                var oTabs = oStateModel.getProperty("/tabs") || {};
                var sNavKey = keytoSend || this.getView().byId("navigationList").getSelectedKey();
                oTabs[sNavKey] = oTabs[sNavKey] || {};
                oTabs[sNavKey].hasDetail = true;
                oStateModel.setProperty("/tabs", oTabs);
            }
            //this.oRouter.navTo("DetailDetail", { dispKey: keytoSend, aimodel: selectedAI, layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded });

            var aMsgContentSystemKey = this.getView().byId("multiInputSystem").getValue();
            var aMsgContentSystemDesc = this.getView().byId("descTxtArea").getValue();
            // var dateToday = new Date();
            // var dateAdded = dateToday.getDate() + "-" + (dateToday.getMonth() + 1) + "-" + dateToday.getFullYear();
            var dateAdded = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
            var payload = {
                session_id: sessionId,
                model_id: modelId,
                tokensGenerated: tokensUsed,
                model_name: modelName,
                user_id: this._loggedInUser,
                Prompt: promptMsgData || "",
                sysmsg: aMsgContentSystemDesc,
                date_added: dateAdded,
                system_id: aMsgContentSystemKey,
                project: this._ProjectDetail
            };

            $.ajax({
                url: this._sBasePath + "/cockpit/logTokenUsage",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({ payload: payload }),
                success: function (oData) {
                    console.log("Token usage logged successfully:", oData);
                },
                error: function (oError) {
                    console.error("Error logging token usage:", JSON.parse(oError.responseText).error.message);
                }
            });
        },
        onSystemSelect: function (oeveS) {

            var that = this;
            var oView = this.getView();
            var oBundle = oView.getModel("i18n").getResourceBundle();
            var scenarioSel = oView.byId("navigationList").getSelectedKey();

            if (!this._systemState) this._systemState = {};
            if (!this._systemState[scenarioSel]) {
                this._systemState[scenarioSel] = { systemText: "" };
            }

            var oState = this._systemState[scenarioSel];

            if (oState.systemText && oState.systemText.trim() !== "") {
                sap.m.MessageBox.warning(oBundle.getText("warningSystemMessage"));
            }

            that.getFiles();
            this.onRefresh();
            that.getOwnerComponent().getModel("historyModel").refresh();

            oView.byId("multiInputSystem").setValue(
                oeveS.getSource().getProperty("title")
            );
            oView.byId("descTxtArea").setValue(
                oeveS.getSource().getProperty("description")
            );
            oView.byId("addSysPrefix").setVisible(false);
            oView.byId("addSysPart").setVisible(false);
            var descToExpanded = {
                exTxt: oeveS.getSource().getProperty("description")
            };
            this.getView().getModel("expModel").setProperty("/exTxt", descToExpanded);

            this.isSystemSaved = true;
            this.stopEdit = true;
            oState.systemText = oeveS.getSource().getProperty("description") || "";

            var prj = oeveS.getSource().getBindingContext("BSData").getObject().PROJECT_ID;
            if (prj == "default" || prj == "Default" || prj == "DEFAULT") {
                this.getView().byId("editSys").setVisible(false);
            } else {
                this.getView().byId("editSys").setVisible(true);
            }
            oView.byId("multiInputSystem").setValueState("None");
            oView.byId("descTxtArea").setValueState("None");

            oView.byId("multiInputSystem").setEditable(true);
            oView.byId("descTxtArea").setEditable(false);

            ////to make systemkey non editable
            // this.disableInputsysmsg(this.getView().byId("multiInputSystem"));
            this.closeSysKeyFr();
        },

        onPromptSelect: function (oeveP) {
            // this.getView().byId("multiInputPrompt").setValue(oeveP.getSource().getAggregation("content")[0].getBindingContext("BSPromptData").getObject().NAME);
            this.getView().byId("multiInputPrompt").setValue(oeveP.getSource().getBindingContext("BSPromptData").getObject().NAME);
            //this.getView().byId("descTxtAreaPrompt").setValue(oeveP.getSource().getAggregation("content")[0].getBindingContext("BSPromptData").getObject().PROMPT_TEMPLATE);
            this.getView().byId("descTxtAreaPrompt").setValue(oeveP.getSource().getBindingContext("BSPromptData").getObject().PROMPT_TEMPLATE);
            this.getView().byId("addPrPart").setVisible(false);
            this.getView().byId("addPrName").setVisible(false);
            this.getView().byId("cancelPrmBtn").setVisible(true);
            var descToExpanded = { exTxt: oeveP.getSource().getBindingContext("BSPromptData").getObject().PROMPT_TEMPLATE };

            this.getView().getModel("expModel").setProperty("/exTxt", descToExpanded);
            ///
            this.getView().byId("multiInputPrompt").setEditable(true);
            this.getView().byId("descTxtAreaPrompt").setEditable(false);
            ////      this.getView().byId("cancelPrmBtn").setVisible(true);
            var oResponseModel = this.getView().getModel("responseModel");
            oResponseModel.setProperty("/originalPrompt", oeveP.getSource().getBindingContext("BSPromptData").getObject().PROMPT_TEMPLATE);
            oResponseModel.setProperty("/selectedPromptId", oeveP.getSource().getBindingContext("BSPromptData").getObject().PROMPTID);
            this.getView().byId("multiInputPrompt").setValueState("None");
            this.getView().byId("descTxtAreaPrompt").setValueState("None");
            this.getView().byId("selDocList").setValueState("None");

            this.getView().byId("savePrm").setVisible(false);
            this.disableInputsysmsg(this.getView().byId("multiInputPrompt"));
            this.isPromptAdded = true;
            this.getView().byId("editPrm").setVisible(true);
            this.closeSysKeyFr();
        },
        getViewSettingsDialog: function (sDialogFragmentName) {
            var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];

            if (!pDialog) {
                pDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: sDialogFragmentName,
                    controller: this
                }).then(function (oDialog13) {
                    if (Device.system.desktop) {
                        oDialog13.addStyleClass("sapUiSizeCompact");
                    }
                    return oDialog13;
                });
                this._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
            }
            return pDialog;
        },


        handleSortButtonPressed: function () {
            var sPopup = this.getView().getModel("switchFragments").getProperty("/frg/frName");

            this.getViewSettingsDialog("aicockpitfeq.fragment.SortDialog")
                .then(function (oViewSettingsDialog) {

                    // Build sort items per popup BEFORE open()
                    oViewSettingsDialog.removeAllSortItems();

                    var aPopupSortItems = this._buildSortItemsForPopup(sPopup);
                    aPopupSortItems.forEach(function (oIt) {
                        oViewSettingsDialog.addSortItem(new sap.m.ViewSettingsItem({
                            text: oIt.text,
                            key: oIt.key,
                            selected: !!oIt.selected
                        }));
                    });

                    oViewSettingsDialog.open();
                }.bind(this));
        },

        handleSortDialogConfirm: function (oEvent) {
            var mParams = oEvent.getParameters();
            var sPath = mParams.sortItem && mParams.sortItem.getKey();
            var bDescending = !!mParams.sortDescending;

            if (!sPath) {
                return;
            }

            var oBinding = this._getActivePopupTableBinding();
            if (!oBinding) {
                sap.m.MessageBox.error("Unable to apply sorting: active table binding not found.");
                return;
            }
            var sPopup = this.getView().getModel("switchFragments").getProperty("/frg/frName");

            if ((sPopup === "user" || sPopup === "admin") && sPath === "date") {
                var oDF = sap.ui.core.format.DateFormat.getInstance({ pattern: "dd/MM/yyyy" });
                oBinding.sort([new sap.ui.model.Sorter("date", bDescending, false, function (a, b) {
                    return oDF.parse(a).getTime() - oDF.parse(b).getTime();
                })]);
                return;
            }

            if (sPopup === "promptlibpr" && sPath === "name") {
                oBinding.sort([
                    new sap.ui.model.Sorter("name", bDescending, false, function (a, b) {
                        var na = parseInt((a || "").match(/_(\d+)$/)?.[1], 10);
                        var nb = parseInt((b || "").match(/_(\d+)$/)?.[1], 10);

                        if (!isNaN(na) && !isNaN(nb)) {
                            return na - nb;
                        }
                        return String(a || "").localeCompare(String(b || ""));
                    })
                ]);
                return;
            }
            oBinding.sort([new sap.ui.model.Sorter(sPath, bDescending)]);
        },
        _getActivePopupTableBinding: function () {
            var sPopup = this.getView().getModel("switchFragments").getProperty("/frg/frName");
            var oTable;

            // USER / ADMIN
            if (sPopup === "user" || sPopup === "admin") {
                oTable = this.byId("idUserLogTable");
            }
            // KNOWLEDGE BASE ADMIN
            else if (sPopup === "knowlBAdmin") {
                oTable = this.byId("kbTable");
            }
            // PROMPT LIB PR
            else if (sPopup === "promptlibpr") {
                oTable = this.byId("idPromptRegistryTable");
            }
            // PROMPTS USED
            else if (sPopup === "promptsUsed") {
                oTable = this.byId("idPromptUsedAdmin");
            }
            // fallback (safety)
            else {
                oTable = this.byId("idUserLogTable");
            }

            return oTable ? oTable.getBinding("items") : null;
        }, _buildSortItemsForPopup: function (sPopup) {
            // Return array of {text, key, selected}
            if (sPopup === "promptlibpr") {
                return [
                    { text: "Prompt Template", key: "Prompt_Template", selected: true },
                    { text: "Date Added", key: "Date_Added" },
                    { text: "Prompt Name", key: "name" },
                    { text: "Updated By", key: "UpdatedBy" },
                    { text: "Updated At", key: "UpdatedAt" },
                    // { text: "Category", key: "Category" },
                    // { text: "Project ID", key: "ProjectId" },
                    // { text: "Message Type", key: "MsgType" },
                    { text: "User ID", key: "UserId" }
                ];
            }

            if (sPopup === "knowlBAdmin") {
                return [
                    { text: "File Name", key: "filename", selected: true },
                    { text: "Uploaded By", key: "uplBy" },
                    { text: "Last Modified", key: "last_modified" }

                ];
            }

            if (sPopup === "promptsUsed") {
                return [
                    // { text: "User ID", key: "user_id", selected: true },
                    // { text: "Date", key: "date" },
                    // { text: "Project", key: "project" },
                    { text: "Total Tokens", key: "tokens_used" },
                    // { text: "Prompts", key: "prompts" },
                    // { text: "System Key", key: "ids" }
                    // { text: "Model Name", key: "model_name" }
                ];
            }

            // default: user/admin
            return [
                { text: "Username", key: "USERNAME", selected: true },
                { text: "Email", key: "EMAIL_ID" },
                { text: "Project", key: "project" },
                { text: "Date", key: "date" },
                { text: "Total Duration", key: "totalDuration" },
                { text: "Tokens Used", key: "totalTokensConsumed" },
                { text: "No. of Session", key: "totalSessions" }
            ];
        },
        onSortChange: function (oEvent) {
            var oQuickSortItem = oEvent.getParameter("item");
            // var oBinding = this.byId("idUserLogTable").getBinding("items");
            var oBinding = this._getActivePopupTableBinding();
            if (!oBinding) {
                sap.m.MessageBox.error("Unable to apply sorting: active table binding not found.");
                return;
            }
            if (!oQuickSortItem || oQuickSortItem.getSortOrder() === "None") {
                oBinding.sort(null);
                return;
            }

            var sPath = oQuickSortItem.getKey();
            if (!sPath) {
                return;
            }
            // if (oQuickSortItem.getSortOrder() === "None") {
            //     oBinding.sort(null);
            // } else {
            oBinding.sort([
                new sap.ui.model.Sorter(
                    oQuickSortItem.getKey(),
                    oQuickSortItem.getSortOrder() === "Descending"
                )
            ]);
        },

        onUploadFile: function (oEvent) {
            let oBundle = this.getView().getModel("i18n").getResourceBundle();
            let popUpSel = this.getView().getModel("switchFragments").getProperty("/frg/frName");
            this.executedOnce = false;
            let bRagEnabled = this.getView().byId("RagSwitch").getSelected();
            let fileN = oEvent.mParameters.files[0].name;

            let stopUpload = this.validateFileName(fileN);
            if (!stopUpload) {
                if (popUpSel == "knowlBAdmin") {
                    this.ragHandleUploadPress();
                }
                else if (bRagEnabled) {
                    this.ragHandleUploadPress();
                }
                else if (popUpSel == "") {
                    this.getView().byId("selDocList").setValueState("None");
                    this.getView().byId("multiInputPrompt").setValueState("None");
                    this.extractPDFContent(oEvent);
                } else {
                    MessageBox.information(oBundle.getText("selFuncTabs"));
                }

                this.getView().byId("selDocList").setSelectedKey("");
            } else {
                MessageBox.error(oBundle.getText("invalidFileName"));
            }
        },
        validateFileName: function (fileName) {
            let stopUpload = false;
            const allowedExtensions = [
                "pdf",
                "doc",
                "docx",
                "xls",
                "xlsx",
                "jpg",
                "jpeg",
                "png"
            ];
            const dangerousExtensions = [
                "exe", "bat", "cmd", "js", "vbs", "scr",
                "ps1", "jar", "com", "msi", "dll"
            ];

            const parts = fileName.split(".");

            if (parts.length < 3) {
                // return false;
                stopUpload = false;
            } else {
                stopUpload = true;
            }

            const extension = parts.pop().toLowerCase();

            if (!allowedExtensions.includes(extension)) {
                stopUpload = false;
            }
            for (let p of parts) {
                if (dangerousExtensions.includes(p.toLowerCase())) {
                    stopUpload = true;
                }
            }
            return stopUpload;
        },

        extractPDFContent: function (oEvent) {
            var that = this;
            var busyDialog = new sap.m.BusyDialog();
            var fileReader = new FileReader();
            var oFileUploader = this.getView().byId("fileUploader1");
            var sSelectedIconTab = this.selectedKeyFunct();
            var oResponseModel = this.getView().getModel("responseModel");
            var aModel = this.getView().getModel("appmodel");
            // var aMessages = oResponseModel.getProperty("/fsThread");
            var apiModel;
            var apiSelect;
            var fileNames = [];
            var opdfpreview;
            var textArea,
                imagePreview;
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var selectedFiles = oEvent.getParameter("files");
            var oModel = this.getView().getModel("appmodel");
            // var contentPath="/BSContent";
            // var sContent = oModel.getProperty(contentPath); ///file path
            var finalText = "";

            var oPromptModel = this.getView().getModel("BSPromptData");
            var promptMsgData = this.getView().byId("descTxtAreaPrompt").getValue();
            var aMsgContentSystemKey = this.getView().byId("multiInputSystem").getValue();
            var aMsgContentSystemDesc = this.getView().byId("descTxtArea").getValue();


            //   const oContent = sContent + "\n" + promptMsgData;
            var aMessages = [
                {
                    "role": "system",
                    "content": aMsgContentSystemDesc
                },
                {
                    "role": "user",
                    "content": promptMsgData
                }
            ];
            var aiSelected = that.getView().byId("selModel").getSelectedKey();
            var aiModelName = that.getView().byId("selModel").getValue();
            var apiSelect = `deployments/${aiSelected}/chat/completions?api-version=${this.sApiUrl}`;
            var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
            apiModel = aiModelName;
            ///////not using handleTabApiSetupDynamic utility function
            var vector = bRagEnabled ? 1 : 0;
            var deploymentName = apiModel.split("/").pop();
            var aFiles = oFileUploader.oFileUpload.files;
            if (!aFiles || aFiles.length === 0) {
                sap.m.MessageBox.information(oBundle.getText("fileUpload"));
                return;
            }
            if (bRagEnabled) {
                this.ragHandleUploadPress();
                return;
            } else {
                var oFile = aFiles[0];
                var fFormData = new FormData;
                fFormData.append("file", oFile);

                var objectStoreUrl = this._sBasePath + `/cockpit/upload/Category=` + sSelectedIconTab + `/Project=` + this._ProjectDetail + `/Vector=` + vector;
                var oHeaders = {

                };
                // | oFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                if (oFile.type === "application/pdf") {
                    busyDialog.open();
                    var that = this;
                    that.getView().getModel("tcgModel").setProperty("/wordorExcel", "word");
                    that._uploadFileNew(oFile, sSelectedIconTab, that._ProjectDetail)
                        .then(function (result) {
                            var fileModel = new sap.ui.model.json.JSONModel(result);
                            that.getView().setModel(fileModel, "fileModel");
                            var key = result.objectStoreRefKey || result.ObjectStoreRefKey;
                            var name = result.fileName || result.FileName || oFile.name;
                            that.getView().byId("viewDocBtn").setVisible(true);
                            that.getView().getModel("fileViewModel").setProperty("/Key", key);
                            that.getView().getModel("fileViewModel").setProperty("/Name", name);
                            that.getView().byId("docNameText").setVisible(true);
                            that.getView().byId("docNameText").setText(name);
                            busyDialog.close();
                            sap.m.MessageToast.show(oBundle.getText("successFileUpload"));
                            that.getFiles();
                        })
                        .catch(function (err) {
                            busyDialog.close();
                            var msg = "";
                            try { msg = JSON.parse(err.responseText).error?.message || ""; } catch (e) { }
                            sap.m.MessageBox.error(msg || "File upload failed");
                        });

                    busyDialog.open();
                    fileReader.onload = function (event) {
                        var arrayBuffer = event.target.result;
                        if (arrayBuffer) {
                            pdfjsLib.getDocument({
                                data: arrayBuffer
                            }).promise.then(function (pdf) {
                                var maxPages = pdf.numPages;
                                var countPromises = [];
                                for (var j = 1; j <= maxPages; j++) {
                                    var pagePromise = pdf.getPage(j).then(function (page) {
                                        return page.getTextContent().then(function (textContent) {
                                            return textContent.items.map(function (item) {
                                                return item.str;
                                            }).join('');
                                        });
                                    });
                                    countPromises.push(pagePromise);
                                }
                                Promise.all(countPromises).then(function (pagesText) {
                                    var pdfText = pagesText.join();
                                    var oModel = this.getView().getModel("appmodel");

                                    switch (sSelectedIconTab) {
                                        case "BS":
                                            oModel.setProperty("/BSContent", pdfText);
                                            break;
                                        case "User":
                                            oModel.setProperty("/UserContent", pdfText);
                                            break;
                                        case "fstoconf":
                                            oModel.setProperty("/fsconfContent", pdfText);
                                            break;
                                        case "fstots":
                                            oModel.setProperty("/fsContent", pdfText);
                                            break;
                                        case "tstocode":
                                            oModel.setProperty("/tsContent", pdfText);
                                            break;
                                        // case "tstocodeGit":
                                        //     oModel.setProperty("/tsGitContent", pdfText);
                                        //     break;
                                        case "coderem":
                                            oModel.setProperty("/ECCContent", pdfText);
                                            break;
                                        case "codesum":
                                            oModel.setProperty("/CodeContent", pdfText);
                                            break;
                                        default:
                                            break;
                                    }

                                    oModel.setProperty("/BSContent", pdfText);
                                    that.getFiles();
                                    busyDialog.close();
                                }.bind(this));
                            }.bind(this));
                        } else {
                            busyDialog.close();
                        }
                    }.bind(this);

                    fileReader.onerror = function (event) {
                        busyDialog.close();
                    };

                    fileReader.readAsArrayBuffer(oFile);

                    //vbox code

                    busyDialog.close();
                } else if (oFile.type == "image/png" || oFile.type === "image/jpeg" || oFile.type === "image/jpg") {

                    if (deploymentName !== "gpt-4o") {
                        oFileUploader.clear();
                        sap.m.MessageBox.information(oBundle.getText("imageProcessingSupported"))
                    } else {
                        //preview
                        var reader = new FileReader();

                        reader.onload = function (event) {
                            var fileDataUrl = event.target.result;
                            that.getView().getModel("fileViewModel").setProperty("/srcUrl", fileDataUrl);
                            var imageObject = {
                                "type": "image_url",
                                "image_url": {
                                    "url": fileDataUrl
                                }
                            };
                            oModel.setProperty("/BSContent", [imageObject]);

                        };

                        reader.readAsDataURL(oFile);
                        //vbox code
                        var that = this;
                        busyDialog.open();
                        that._uploadFileNew(oFile, sSelectedIconTab, that._ProjectDetail)
                            .then(function (result) {
                                var fileModel = new sap.ui.model.json.JSONModel(result);
                                that.getView().setModel(fileModel, "fileModel");
                                var key = result.objectStoreRefKey || result.ObjectStoreRefKey;
                                var name = result.fileName || result.FileName || oFile.name;
                                that.getView().byId("viewDocBtn").setVisible(true);
                                that.getView().getModel("fileViewModel").setProperty("/Key", key);
                                that.getView().getModel("fileViewModel").setProperty("/Name", name);
                                that.getView().byId("docNameText").setVisible(true);
                                that.getView().byId("docNameText").setText(name);
                                busyDialog.close();
                                sap.m.MessageToast.show(oBundle.getText("successFileUpload"));
                                that.getFiles();
                            })
                            .catch(function (err) {
                                busyDialog.close();
                                var msg = "";
                                try { msg = JSON.parse(err.responseText).error?.message || ""; } catch (e) { }
                                sap.m.MessageBox.error(msg || "File upload failed");
                            });

                    }
                }
                else if (oFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                    this.getView().getModel("tcgModel").setProperty("/wordorExcel", "excel");
                    this.handleExcelUpload(oFile, sSelectedIconTab, this.getView().getModel("appmodel"), aMessages);
                    that.getFiles();
                }
                else {
                    this.handleUploadPress(oFile);
                    that.getFiles();
                }
            }
        },

        handleExcelUpload: function (oFile, sSelectedIconTab, oModel, aMessages) {
            var busyDialog = new sap.m.BusyDialog();
            busyDialog.open();
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var aModel = this.getView().getModel("appmodel");
            var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
            var vector = bRagEnabled ? 1 : 0;
            var oFileUploader = this.getView().byId("fileUploader1");
            var aFiles = oFileUploader.oFileUpload.files;
            if (!aFiles || aFiles.length === 0) {
                sap.m.MessageBox.information(oBundle.getText("fileUpload"));
                return;
            }
            var oFile = aFiles[0];
            var fFormData = new FormData;
            var sSelectedIconTab = this.selectedKeyFunct();
            fFormData.append("file", oFile);
            var objectStoreUrl = this._sBasePath + `/cockpit/upload/Category=` + sSelectedIconTab + `/Project=` + this._ProjectDetail + `/Vector=` + vector;
            var oHeaders = {

            };
            var reader = new FileReader();
            reader.onload = function (e) {
                var data = new Uint8Array(e.target.result);
                var workbook = XLSX.read(data, { type: 'array' });
                var allText = '';
                var excelDataAsObjects = {};
                workbook.SheetNames.forEach(function (sheetName) {
                    var sheet = workbook.Sheets[sheetName];
                    var sheetText = XLSX.utils.sheet_to_csv(sheet);
                    allText += `Sheet: ${sheetName}\n${sheetText}\n\n`;
                    excelDataAsObjects = XLSX.utils.sheet_to_json(sheet);
                });
                that.getView().getModel("fileViewModel").setProperty("/xlsJsonData", excelDataAsObjects);
                aMessages.push({ role: "user", content: allText });
                aModel.setProperty("/BSContent", allText);
                busyDialog.close();
            }.bind(this);

            reader.readAsArrayBuffer(oFile);
            var that = this;
            busyDialog.open();
            var that = this;
            that._uploadFileNew(oFile, sSelectedIconTab, that._ProjectDetail)
                .then(function (result) {
                    var fileModel = new sap.ui.model.json.JSONModel(result);
                    that.getView().setModel(fileModel, "fileModel");
                    var key = result.objectStoreRefKey || result.ObjectStoreRefKey;
                    var name = result.fileName || result.FileName || oFile.name;

                    that.getView().byId("viewDocBtn").setVisible(true);
                    that.getView().getModel("fileViewModel").setProperty("/Key", key);
                    that.getView().getModel("fileViewModel").setProperty("/Name", name);
                    that.getView().byId("docNameText").setVisible(true);
                    that.getView().byId("docNameText").setText(name);
                    busyDialog.close();
                    sap.m.MessageToast.show(oBundle.getText("successFileUpload"));
                    that.getFiles();
                })
                .catch(function (err) {
                    busyDialog.close();
                    var msg = "";
                    try { msg = JSON.parse(err.responseText).error?.message || ""; } catch (e) { }
                    sap.m.MessageBox.error(msg || "File upload failed");
                });
        },

        handleUploadPress: function () {
            var that = this;
            var oModel = this.getView().getModel("appmodel");
            var busyDialog = new sap.m.BusyDialog();
            var sSelectedIconTab = this.selectedKeyFunct();
            var oFileUploader = this.getView().byId("fileUploader1");
            var oBundle = this.getView().getModel("i18n").getResourceBundle();

            var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
            var vector = bRagEnabled ? 1 : 0;
            var aFiles = oFileUploader.oFileUpload.files;
            if (!aFiles || aFiles.length === 0) {
                sap.m.MessageBox.show(oBundle.getText("fileUpload"));
                return;
            }

            var oFile = aFiles[0];
            var allowedFileTypes = ["txt", "pdf", "docx"];
            var fileExtension = oFile.name.split('.').pop().toLowerCase();

            if (!allowedFileTypes.includes(fileExtension)) {
                sap.m.MessageBox.error(oBundle.getText("allowedFileTypes"), {
                    title: "File Type Error",
                    actions: [sap.m.MessageBox.Action.OK]
                });
                return;
            }

            busyDialog.open();
            var formData = new FormData();
            formData.append('file', oFile);

            that._uploadFileNew(oFile, sSelectedIconTab, that._ProjectDetail)
                .then(function (data) {
                    busyDialog.close();
                    that.getView().getModel("tcgModel").setProperty("/wordorExcel", "word");

                    var key = data.value?.objectStoreRefKey || data.objectStoreRefKey || data.ObjectStoreRefKey;
                    var name = data.value?.fileName || data.fileName || data.FileName || oFile.name;

                    that.getView().byId("viewDocBtn").setVisible(true);
                    that.getView().getModel("fileViewModel").setProperty("/Key", key);
                    that.getView().getModel("fileViewModel").setProperty("/Name", name);
                    that.getView().byId("docNameText").setVisible(true);
                    that.getView().byId("docNameText").setText(name);

                    if (fileExtension === "docx") {
                        that.fileDisplay();
                    }
                    if (fileExtension === "txt") {
                        var fr = new FileReader();
                        fr.onload = function (e) {
                            var extractedContent = e.target.result || "";
                            oModel.setProperty("/BSContent", extractedContent);
                        };
                        fr.readAsText(oFile);
                    }
                    sap.m.MessageToast.show(oBundle.getText("successFileUpload"));
                })
                .catch(function (err) {
                    busyDialog.close();
                    var msg = "";
                    try { msg = JSON.parse(err.responseText).error?.message || ""; } catch (e) { }
                    MessageBox.error(msg || "File upload failed");
                });
        },

        _uploadFileNew: function (oFile, category, project) {
            var that = this;
            return new Promise(function (resolve, reject) {
                try {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var result = e.target.result || "";
                        var base64 = "";
                        if (typeof result === "string" && result.indexOf(",") !== -1) {
                            base64 = result.split(",")[1];
                        } else {
                            // ArrayBuffer -> base64
                            var bytes = new Uint8Array(result);
                            var binary = "";
                            for (var i = 0; i < bytes.byteLength; i++) {
                                binary += String.fromCharCode(bytes[i]);
                            }
                            base64 = btoa(binary);
                        }
                        var payload = {
                            payload: {
                                Category: category,
                                Project: project,
                                userId: that._loggedInUser,
                                fileName: oFile.name,
                                mimeType: oFile.type || "application/octet-stream",
                                fileBase64: base64
                            }
                        };
                        $.ajax({
                            url: that._sBasePath + "/cockpit/uploadFile",
                            type: "POST",
                            contentType: "application/json",
                            data: JSON.stringify(payload),
                            success: function (res) {
                                // After successful upload, call getFileDetails
                                var key = (res && (res.objectStoreRefKey || res.ObjectStoreRefKey || res.value?.objectStoreRefKey)) || "";
                                if (key) {
                                    var encodedKey = encodeURIComponent(key);
                                    $.ajax({
                                        url: that._sBasePath + "/cockpit/getFileDetails(key='" + encodedKey + "')",
                                        type: "GET",
                                        success: function (detailsData) {
                                            res.fileDetails = detailsData;
                                            console.log("File details retrieved:", detailsData);
                                            resolve(res);
                                        },
                                        error: function (detailsErr) {
                                            console.warn("getFileDetails failed, continuing with upload response:", detailsErr);
                                            resolve(res || {});
                                        }
                                    });
                                } else {
                                    console.log("No objectStoreRefKey found in upload response");
                                    resolve(res || {});
                                }
                            },
                            error: function (jqXHR) {
                                reject(jqXHR);
                            }
                        });
                    };
                    // Read as DataURL to easily extract base64
                    reader.readAsDataURL(oFile);
                } catch (err) {
                    reject(err);
                }
            });
        },

        selectedKeyFunct: function () {
            var scenarioSel = this.getView().byId("navigationList").getSelectedKey();
            var scenario = "";
            switch (scenarioSel) {
                case "DocGen":
                    scenario = "DocGen";
                    break;
                case "bdPMO":
                    scenario = "BS";
                    break;
                case "usrCr":
                    scenario = "User";
                    break;
                case "fcFSD":
                    scenario = "fstoconf";
                    break;
                case "osdTSD":
                    scenario = "fstots";
                    break;
                case "cdGen":
                    scenario = "tstocode";
                    break;
                // case "tstocodeGit":
                //      keyConst = "TsCodGit_CG-DevCockpit_";
                //     break;
                case "cdRem":
                    scenario = "coderem";
                    break;
                case "cdSum":
                    scenario = "codesum";
                    break;
                case "gitKey":
                    scenario = "tstocodeGit";
                    break;
                case "tutKey":
                    scenario = "TUT";
                    break;
                case "tcgKey":
                    scenario = "TCG";
                    break;
                case "pctKey":
                    scenario = "PCT";
                    break;
                case "bpmKey":
                    scenario = "BPM";
                    break;
            }
            return scenario;
        },

        handleUploadContentPress: async function () {
            var _this = this;
            var that = this;
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var oModel = this.getView().getModel("appmodel");
            var busyDialog = new sap.m.BusyDialog();
            var sSelectedIconTab = this.selectedKeyFunct();
            var oQuestionAI
            var apiModel, apiModelName;
            var apiUrl,
                oPromptModel,
                oComboBox,
                sPath;
            var oToken;
            var usedToken;
            var sSysMsg;
            var oViewModel = this.getView().getModel("viewModel");
            var aMsgContentSystemKey = this.getView().byId("multiInputSystem").getValue();
            var aMsgContentSystemDesc = this.getView().byId("descTxtArea").getValue();

            var promptMsgData = this.getView().byId("descTxtAreaPrompt").getValue();

            var contentPath = "/BSContent";
            var sContent = oModel.getProperty(contentPath); ///file path


            var finalText = "";
            var aiSelected = that.getView().byId("selModel").getSelectedKey();//
            var aiModelName = that.getView().byId("selModel").getValue(); //
            var apiUrl4 = Utility.getApiUrl(aiModelName, aiSelected, this.sApiUrl, this._sBasePath);//
            var oPromptModel = this.getView().getModel("BSPromptData");
            if (sContent == undefined) {
                sContent = null;
            }
            const oContent = sContent + "\n" + promptMsgData;
            var aMessages = [
                {
                    "role": "system",
                    "content": aMsgContentSystemDesc
                },
                {
                    "role": "user",
                    "content": oContent
                }
            ];
            if (aiModelName == "gpt-5" && sSelectedIconTab == "tstocode") {
                aMessages.push({ "role": "user", "content": "Give ``` before code language as indicator that after this line code is being provided" });
            }
            var aMsgExisting = this.getView().getModel("msgModel").getProperty("/aMsg");
            if (aMsgExisting.length !== 0 && this.saveAddEx == true) {
                aMsgExisting.push(aMessages[0]);
                aMsgExisting.push(aMessages[1]);
                if (aiModelName == "gpt-5" && sSelectedIconTab == "tstocode") {
                    aMsgExisting.push(aMessages[2]);
                }
                this.getView().getModel("msgModel").setProperty("/aMsg", aMsgExisting);
                aMessages = aMsgExisting;
            } else {
                this.getView().getModel("msgModel").setProperty("/aMsg", aMessages);
            }
            var oPromptModel = this.getView().getModel("BSPromptData");
            var localData = oPromptModel.getData();
            var existsInLocalData = localData.some(item => item.PROMPT_TEMPLATE === promptMsgData);
            var isFirstResponse = true;

            Utility.createAndFetchPromptDetails(
                promptMsgData,
                sSelectedIconTab,
                existsInLocalData,
                this,
                oPromptModel,
                oBundle,
                isFirstResponse,
                this._sBasePath
            );
            if (sSelectedIconTab == "TCG" || sSelectedIconTab == "BPM" || sSelectedIconTab == "PCT") {
                var reupload = false;
                var airesp = "";
                aMessages = Utility.transformSysMsgforTScenarios(aMessages, sContent, promptMsgData, reupload, this.step, airesp, aMsgContentSystemDesc);
                this.getView().getModel("msgModel").setProperty("/aMsg", aMessages);
            }
            var histPayload = Utility.createPayloadBasedOnModelNonStream(aiModelName, aMessages, oViewModel, this);
            var payload1 = Utility.createPayloadBasedOnModel(aiModelName, aMessages, oViewModel, this);

            //var histPayload = Utility.createPayloadBasedOnModelNonStream(aiModelName, aMessages, oViewModel, this);
            var payloadNonStream = histPayload;

            this.apiCall(apiUrl4, payload1, payloadNonStream, busyDialog, aiModelName, oModel, promptMsgData);
        },
        apiCall: async function (apiUrl4, payload1, payloadNonStream, busyDialog, aiModelName, oModel, promptMsgData) {
            let oToken, usedToken;
            var that = this;
            const oBundle = this.getView().getModel("i18n").getResourceBundle();
            const oViewModel = this.getView().getModel("viewModel");
            busyDialog.open();
            var keytoSend = this.getView().getModel("selKeyForDetailDetail").getProperty("/keyD");
            var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;
            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", false);
            var aMsgContentSystemDesc = this.getView().byId("descTxtArea").getValue();
            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/sysMsg", aMsgContentSystemDesc);
            this.getOwnerComponent().getModel("airesponseDetailModel").refresh();
            var sSelectedIconTab = this.selectedKeyFunct();
            this.oRouter.navTo("DetailDetail", { dispKey: keytoSend, aimodel: selectedAI, layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded });


            try {

                const response = await fetch(apiUrl4, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...this.defaultHeaders
                    },
                    body: JSON.stringify(payload1)
                });

                const { message: oResMsg, usedTokens: oUsedToken, rawText: sResponse } =
                    await Utility.processAPIResponse(this, payloadNonStream, response, aiModelName, busyDialog, apiUrl4);
                if (sSelectedIconTab == "PCT") {
                    that.getView().byId("nextBtn").setVisible(true);
                    MessageBox.information(oBundle.getText("nextMsg"));
                    this.getView().byId("pctSysMsgBtn").setVisible(true);
                    this.onPctStepOutput(payload1.messages);

                }
                BusyIndicator.show();

                const oResponseModel = this.getView().getModel("responseModel");

                const tokenData = oModel.getProperty(`/${sSelectedIconTab}/${aiModelName}`);
                if (tokenData) {
                    oToken = tokenData.TotalToken || 0;
                    usedToken = tokenData.UsageToken || 0;
                }

                var fileCont = true;
                busyDialog.close();
                BusyIndicator.hide();
                Utility.handleTabResponseDynamic(
                    sSelectedIconTab,
                    this,
                    sResponse,
                    oResMsg,
                    promptMsgData,
                    oUsedToken,
                    oToken,
                    oViewModel,
                    fileCont
                );
                this.sendTokenUsageLog(oUsedToken, promptMsgData);
                busyDialog.close();
                BusyIndicator.hide();
            } catch (error) {
                busyDialog.close();
                try {
                    const responseMsg = await error.response?.json();
                    if (responseMsg?.error?.code === "429") {
                        sap.m.MessageBox.information(oBundle.getText("errorMsgManyRequest"));
                    } else {
                        sap.m.MessageBox.information(oBundle.getText("openAIErrorMsg"));
                    }
                } catch (parseError) {
                    sap.m.MessageBox.information(oBundle.getText("openAIErrorMsg"));
                }

                console.error("API call failed:", error);
            } finally {
                busyDialog.close();
            }
        },
        _addToHistoryLogGeneric: function (sText) {
            var promptMsgData = this.getView().byId("descTxtAreaPrompt").getValue();
            var histArr = [];
            var histData = {
                promptHistory: promptMsgData,
                aiResponseHistory: sText
            };

            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", true);
            var histArr = this.getOwnerComponent().getModel("historyModel").getProperty("/historyData") || [];
            histArr.push(histData);
            this.getOwnerComponent().getModel("historyModel").setProperty("/historyData", histArr);
            this.getOwnerComponent().getModel("historyModel").refresh();
            this.getView().byId("multiInputPrompt").setValue("");
            this.getView().byId("descTxtAreaPrompt").setValue("");
            this.getView().byId("cancelPrmBtn").setVisible(false);
            this.getView().byId("editPrm").setVisible(false);
            var sSelectedIconTab = this.selectedKeyFunct();
            var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
        },
        reUploadContentResponse: async function () {
            var that = this;
            const view = this.getView();
            let sSelectedIconTab = this.selectedKeyFunct();
            const oBundle = view.getModel("i18n").getResourceBundle();
            const oViewModel = view.getModel("viewModel");
            const oResponseModel = view.getModel("responseModel");
            const appModel = view.getModel("appmodel");
            const oTokenModel = view.getModel("TokenLimit");
            var busyDialog = new sap.m.BusyDialog();
            var aMsgContentSystemKey = this.getView().byId("multiInputSystem").getValue();
            var aMsgContentSystemDesc = this.getView().byId("descTxtArea").getValue();

            var finalText = "";
            var aiSelected = that.getView().byId("selModel").getSelectedKey();
            var aiModelName = that.getView().byId("selModel").getValue();
            var apiUrl4 = Utility.getApiUrl(aiModelName, aiSelected, this.sApiUrl2 || this.sApiUrl, this._sBasePath);
            var oPromptModel = this.getView().getModel("BSPromptData");
            var promptMsgData = this.getView().byId("descTxtAreaPrompt").getValue();
            const {
                oMsg,
                userInput,
                isUserContent,
                updatedThread
            } = Utility.handleUserMessageDynamic({
                tabKey: sSelectedIconTab,
                view,
                oViewModel,
                oResponseModel
            });

            /////////userInput being replaced by promptMsgData
            if (!isUserContent && (!promptMsgData || promptMsgData === "") && this.step == "Step1") {
                MessageBox.warning(oBundle.getText("userInputMsg"));
                this.getView().byId("multiInputPrompt").setValueState("Error");
                this.getView().byId("multiInputPrompt").setValueStateText("Enter/Select Prompt ID");
                return;
            }

            const localData = oPromptModel.getData();
            const existsInLocalData = isUserContent ? true : localData.some(item => {
                return item.PROMPT_TEMPLATE?.toLowerCase() === promptMsgData?.toLowerCase();
            });
            var isFirstResponse = true;
            Utility.createAndFetchPromptDetails(
                promptMsgData,
                sSelectedIconTab,
                existsInLocalData,
                this,
                oPromptModel,
                oBundle,
                isFirstResponse,
                this._sBasePath
            );
            var oModel = this.getView().getModel("appmodel");
            var updatedaMsgs = [];
            var contentPath = "/BSContent";
            var sContent = oModel.getProperty(contentPath);
            if (sContent == undefined) {
                sContent = null;
            }
            var aMsgModel = this.getView().getModel("msgModel");   //// aMsgs formed in first call with assistant role added
            if (promptMsgData !== "") {
                if (this.isImage == true && aiModelName.includes("gpt-4")) {
                    for (var f = 0; f < sContent.length; f++) {
                        if (sContent[f].type == "text") {
                            sContent.pop();
                        }
                    }
                    sContent.push({ "type": "text", "text": promptMsgData })
                    oContent = sContent;
                    updatedThread[0].content = oContent;
                } else {
                    var oContent = sContent + "\n" + promptMsgData;
                    updatedThread[0].content = oContent;
                }
            } else {
                updatedThread[0].content = sContent;
            }
            //  if(this.isImage==true){
            //     sContent.push({ "type": "text", "text": promptMsgData })

            //     oContent = sContent;
            //     }
            if (sSelectedIconTab == "TCG" || sSelectedIconTab == "BPM" || sSelectedIconTab == "PCT") {
                var reupload = true;
                var airesp = this.getView().getModel("airesponseDetailModel").getProperty("/resp");
                var reAMessages = Utility.transformSysMsgforTScenarios(aMsgModel.oData.aMsg, sContent, promptMsgData, reupload, this.step, airesp, aMsgContentSystemDesc);
                aMsgModel.oData.aMsg = [];
                for (var m = 0; m < reAMessages.length; m++) {
                    aMsgModel.oData.aMsg.push(reAMessages[m]);
                }
                if (sSelectedIconTab == "PCT") {
                    that.onPctStepOutput(reAMessages);
                }
            } else {
                aMsgModel.oData.aMsg.push(updatedThread[0]);
            }

            updatedaMsgs = aMsgModel.oData.aMsg;
            if (aiModelName == "gpt-5" && sSelectedIconTab == "tstocode") {
                updatedaMsgs.push({ "role": "user", "content": "Give ``` before code language as indicator that after this line code is being provided" });
            }

            this.getView().getModel("msgModel").setProperty("/aMsg", updatedaMsgs);
            busyDialog.open();
            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", false);

            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/sysMsg", aMsgContentSystemDesc);
            this.getOwnerComponent().getModel("airesponseDetailModel").refresh();
            var keytoSend = this.getView().getModel("selKeyForDetailDetail").getProperty("/keyD");
            var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;

            this.oRouter.navTo("DetailDetail", { dispKey: keytoSend, aimodel: selectedAI, layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded });


            var payloadNonStream = Utility.createPayloadBasedOnModelNonStream(aiModelName, updatedaMsgs, oViewModel, this);

            const payload = Utility.createPayloadBasedOnModel(aiModelName, updatedaMsgs, oViewModel, this);

            try {
                const response = await fetch(apiUrl4, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...this.defaultHeaders
                    },
                    body: JSON.stringify(payload)
                });

                const { message: oResMsg, usedTokens: oUsedToken, rawText: sResponse } =
                    await Utility.processAPIResponse(this, payloadNonStream, response, aiModelName, busyDialog, apiUrl4);
                if (that.step == "Step2" && sSelectedIconTab == "PCT") {
                    // that.getView().byId("prgIndicator").setPercentValue("60%");
                    // that.getView().byId("prgIndicator").setDisplayValue("Step3");
                    // that.step = "Step3";
                    MessageBox.information(oBundle.getText("nextMsg"));
                } else if (that.step == "Step3" && sSelectedIconTab == "PCT") {
                    that.getView().byId("prgIndicator").setPercentValue("100%");
                    that.getView().byId("prgIndicator").setDisplayValue("Completed");
                    that.getView().byId("nextBtn").setVisible(false);
                    // that.onPctStepOutput(reAMessages);
                    MessageBox.success("All Steps Completed!");
                    // that.step = "Step1"; ///initializing again
                }
                const tokenData = oTokenModel.getProperty(`/${sSelectedIconTab}/${aiModelName}`);
                let oToken = tokenData?.TotalToken ?? 0;
                let usedToken = tokenData?.UsageToken ?? 0;
                const priceText = "Token Limit : " + oUsedToken + " / " + oToken;
                var fileCont = false;
                busyDialog.close();
                BusyIndicator.hide();
                Utility.handleTabResponseDynamic(sSelectedIconTab,
                    this,
                    sResponse,
                    oResMsg,
                    promptMsgData,
                    oUsedToken,
                    oToken,
                    oViewModel,
                    fileCont
                );

                this.sendTokenUsageLog(oUsedToken, promptMsgData);

            } catch (error) {
                // busyDialog.close();
                try {
                    busyDialog.close();
                    const responseMsg = await error.response?.json();
                    if (responseMsg?.error?.code === "429") {
                        sap.m.MessageBox.error(oBundle.getText("errorMsgManyRequest"));
                    } else {
                        sap.m.MessageBox.error(oBundle.getText("openAIErrorMsg"));
                    }
                } catch (parseError) {
                    sap.m.MessageBox.error(oBundle.getText("openAIErrorMsg"));
                }
                console.error("API call failed:", error);
            } finally {
                busyDialog.close();
            }

        },

        onAIselect: function (eve) {
            var sSelectedIconTab = this.selectedKeyFunct();
            var TokenModel = this.getOwnerComponent().getModel("TokenLimit");
            var keytoSend = this.getView().getModel("selKeyForDetailDetail").getProperty("/keyD");
            var selectedAI = eve.getSource().getSelectedItem().mProperties.text;
            var totToken = TokenModel.oData[sSelectedIconTab][selectedAI].TotalToken;
            this.getView().getModel("TokenLimit").setProperty("/token", totToken);
            this.getView().getModel("TokenLimit").setProperty("/usedToken", 0);
            MessageBox.information("The selected Model is " + selectedAI);
        },
        onSearch: function (url, roleSel) {

            var that = this;
            var sUrl = url;
            // Initialize/reset the model used by Prompt Library table
            var allPromptsModel = new sap.ui.model.json.JSONModel([]);
            that.getView().setModel(allPromptsModel, "allPromptsModel");
            that.getView().getModel("allPromptsModel").refresh(true);

            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: sUrl,
                    method: "GET",
                    headers: that.defaultHeaders,
                    success: function (data) {
                        try {
                            var items = [];
                            var projectId = that._ProjectDetail || "";

                            // New API shape: /cockpit/getPromptDetails returns { value: { status, result: [...] } }
                            if (data && data.value && Array.isArray(data.value.result)) {
                                items = data.value.result
                                    .filter(function (item) {
                                        return item.Project_Id === "default" || item.Project_Id === projectId;
                                    })
                                    .map(function (item) {
                                        var msgTypeNorm = item.MsgType || "";
                                        if (roleSel === "user" || msgTypeNorm === "prompt") {
                                            msgTypeNorm = "Prompt";
                                        } else if (roleSel === "system" || msgTypeNorm === "sysMsg") {
                                            msgTypeNorm = "System Message";
                                        }
                                        return {
                                            ID: item.ID,
                                            UUID: item.ID, // fallback alias
                                            Prompt_Template: item.Prompt_Details,
                                            Date_Added: item.Date_Added,
                                            Category: item.Category,
                                            ProjectId: item.Project_Id,
                                            MsgType: msgTypeNorm,
                                            UserId: item.UpdatedBy || item.CreatedBy || "",
                                            name: item.PromptId,
                                            UpdatedBy: item.UpdatedBy || "",
                                            UpdatedAt: item.UpdatedAt || item.Date_Added || ""
                                        };
                                    });
                                that.getView().getModel("allPromptsModel").setData(items);
                                that.getView().getModel("allPromptsModel").refresh(true);
                                BusyIndicator.hide();
                                resolve(items);
                                return;
                            }

                            // Legacy fallback (old LM promptTemplates flow)
                            if (data && Array.isArray(data.resources)) {
                                var pending = data.resources.map(function (resource) {
                                    return $.ajax({
                                        url: that._sBasePath + "/lm/promptTemplates/" + resource.id,
                                        method: "GET",
                                        headers: that.defaultHeaders
                                    }).then(function (response) {
                                        if (response && response.spec && response.spec.defaults) {
                                            if (response.spec.defaults.ProjectId === "default" || response.spec.defaults.ProjectId === projectId) {
                                                response.spec.template.forEach(function (templateItem) {
                                                    if (templateItem.role === roleSel && templateItem.content) {
                                                        var updatedBy = response?.spec?.defaults?.updBy || "";
                                                        var updatedAt = response?.spec?.defaults?.updAt || "";
                                                        var msgType = response?.spec?.defaults?.msgType || "";
                                                        var rec = {
                                                            ID: response.id,
                                                            UUID: response.id,
                                                            Prompt_Template: response.spec.template[0].content,
                                                            UpdatedAt: updatedAt,
                                                            ProjectId: response.spec.defaults.ProjectId,
                                                            Date_Added: response.creationTimestamp,
                                                            Category: response.scenario,
                                                            MsgType: msgType,
                                                            UserId: response.spec.defaults.UserId,
                                                            UpdatedBy: updatedBy,
                                                            name: response.name
                                                        };
                                                        if (response.spec.template[0].role == "user") {
                                                            rec.MsgType = "Prompt";
                                                        } else if (response.spec.template[0].role == "system") {
                                                            rec.MsgType = "System Message";
                                                        }
                                                        items.push(rec);
                                                    }
                                                });
                                            }
                                        }
                                    });
                                });

                                $.when.apply($, pending).always(function () {
                                    that.getView().getModel("allPromptsModel").setData(items);
                                    that.getView().getModel("allPromptsModel").refresh(true);
                                    BusyIndicator.hide();
                                    resolve(items);
                                });
                                return;
                            }

                            // No recognized data shape
                            that.getView().getModel("allPromptsModel").setData([]);
                            that.getView().getModel("allPromptsModel").refresh(true);
                            BusyIndicator.hide();
                            resolve([]);
                        } catch (e) {
                            BusyIndicator.hide();
                            reject(e);
                        }
                    },
                    error: function (xhr, status, error) {
                        BusyIndicator.hide();
                        reject(error || status);
                    }
                });
            });

        },
        catSelChange: function (eveSelCh) {
            var sProject = this._ProjectDetail;
            var sUserName = this._loggedInUserName;
            var selPar = eveSelCh.getSource().getSelectedKey();
            var popUpSel = this.getView().getModel("switchFragments").getProperty("/frg/frName");
            var url = "";
            var msgsel = this.getView().byId("msgSelected").getSelectedKey();
            let msgType = "";
            if (msgsel == "user") {
                msgType = "prompt";
            } else {
                msgType = "sysMsg";
            }
            if (popUpSel == "promptlibpr") {
                // url = this._sBasePath + "/lm/promptTemplates?scenario=" + selPar + "&version=0.0.1";
                url = this._sBasePath + "/cockpit/getPromptDetails?Category=" + selPar + "&MsgType=" + msgType + "&ProjectId=" + this._ProjectDetail;
                this.onSearch(url, msgsel);
            } else if (popUpSel == "knowlBAdmin") {
                this.loadKnowlBAdminFiles(selPar, sProject, sUserName);
            } else {

            }
        },

        updateProjectDetails: function (oEvent) {
            var sessionId = this.getView().getModel("prjModel").getProperty("/sessionId");
            var sessionId = this.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/sessionId");
            var oItem = oEvent.getSource();
            var projectId = oItem.getProperty("title");
            var oPayload = {
                session_id: sessionId,
                project: projectId
            };

            $.ajax({
                url: this._sBasePath + "/cockpit/updateProject",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(oPayload),
                success: function (data) {
                    console.log("Project updated successfully:", data);
                },
                error: function (xhr, status, error) {
                    console.error("Error updating project", error);
                }
            });
        },
        getTime: function () {
            var userName = this.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/loggedInUserName");
            var mailId = this.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/loggedInUserEmailId");
            var date = new Date().toISOString();
            var loginTime = date.slice(0, date.indexOf("."));
            loginTime = loginTime + "Z";
            var nwModel = this.getOwnerComponent().getModel("NetworkGraphModel");

            var oPayload = {
                Email_Id: mailId,
                UserName: userName,
                login_time: loginTime
            };
            var payload = {};
            payload["payload"] = oPayload;
            $.ajax({
                url: this._sBasePath + '/cockpit/saveLogin',
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),
                success: function (data, status, xhr) {
                    var sessionId = data.value.result.session_id;
                    nwModel.setProperty("/sessionId", sessionId);

                    console.log("Success");
                    console.log(data.value.message);
                },
                error: function (jqXhr, textStatus, errorMessage) {
                    console.log("Error");
                    console.log(JSON.parse(jqXhr.responseText).error.message);


                }
            });

        },

        uploadContentResponse: async function () {
            var that = this;
            var sSelectedIconTab = this.selectedKeyFunct();
            var apiModel, apiModelName;
            var apiUrl;
            var oQuestionAI;
            var messages,
                oPromptModel,
                oComboBox,
                sPath;
            var oToken;
            var usedToken;
            var oModel = this.getView().getModel("appmodel");
            var busyDialog = new sap.m.BusyDialog();
            var oResponseModel = this.getView().getModel("responseModel");
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var oViewModel = this.getView().getModel("viewModel");
            var oViewModel = this.getView().getModel("viewModel");
            var aMsgContentSystemKey = this.getView().byId("multiInputSystem").getValue();
            var aMsgContentSystemDesc = this.getView().byId("descTxtArea").getValue();

            var promptMsgData = this.getView().byId("descTxtAreaPrompt").getValue();
            var oQuestionAI = promptMsgData;
            var contentPath = "/BSContent";
            var sContent = oModel.getProperty(contentPath); ///file path


            var finalText = "";
            var aiSelected = that.getView().byId("selModel").getSelectedKey();//
            var aiModelName = that.getView().byId("selModel").getValue(); //
            var apiUrl4 = Utility.getApiUrl(aiModelName, aiSelected, this.sApiUrl, this._sBasePath);//
            var oPromptModel = this.getView().getModel("BSPromptData");
            if (sContent == undefined) {
                sContent = null;
            }
            var oContent = sContent + "\n" + promptMsgData;
            var aMessages = [
                {
                    "role": "system",
                    "content": aMsgContentSystemDesc
                },
                {
                    "role": "user",
                    "content": oContent
                }
            ];
            if (aiModelName == "gpt-5" && sSelectedIconTab == "tstocode") {
                aMessages.push({ "role": "user", "content": "Give ``` before code language as indicator that after this line code is being provided" });
            }
            var aMsgExisting = this.getView().getModel("msgModel").getProperty("/aMsg");
            if (aMsgExisting.length !== 0 && this.saveAddEx == true) {
                aMsgExisting.push(aMessages[0]);
                aMsgExisting.push(aMessages[1]);
                if (aiModelName == "gpt-5" && sSelectedIconTab == "tstocode") {
                    aMsgExisting.push(aMessages[2]);
                }
                this.getView().getModel("msgModel").setProperty("/aMsg", aMsgExisting);
                aMessages = aMsgExisting;
            } else {
                this.getView().getModel("msgModel").setProperty("/aMsg", aMessages);
            }
            var tabConfig = Utility.handleTabPromptSetupDynamic({
                tabKey: sSelectedIconTab,
                view: this.getView(),
                sUrl: this.sUrl,
                sApiUrl: this.sApiUrl,
                oResponseModel: this.getView().getModel("responseModel"),
            });
            var oPromptModel = this.getView().getModel("BSPromptData");
            //here
            var oPromptModel = this.getView().getModel("BSPromptData");
            var oModel = this.getView().getModel("TokenLimit");
            var isUserContent = this.getView().getModel("viewModel").getProperty("/bFileContentChanged");

            /////////userInput being replaced by promptMsgData
            isUserContent = true;
            if (!isUserContent && (!promptMsgData || promptMsgData === "")) {
                MessageBox.warning(oBundle.getText("userInputMsg"));

                return;
            }
            var localData = oPromptModel.getData();
            var existsInLocalData = localData.some(item => item.PROMPT_TEMPLATE === promptMsgData);


            var isFirstResponse = true;
            Utility.createAndFetchPromptDetails(
                oQuestionAI,
                sSelectedIconTab,
                existsInLocalData,
                this,
                oPromptModel,
                oBundle,
                isFirstResponse,
                this._sBasePath
            );

            if (sSelectedIconTab == "TCG" || sSelectedIconTab == "BPM" || sSelectedIconTab == "PCT") {
                var reupload = false;
                var airesp = "";
                aMessages = Utility.transformSysMsgforTScenarios(aMessages, sContent, promptMsgData, reupload, this.step.airesp, aMsgContentSystemDesc);
                this.getView().getModel("msgModel").setProperty("/aMsg", aMessages);
            }
            var oViewModel = this.getView().getModel("viewModel");
            var payloadNonStream = Utility.createPayloadBasedOnModelNonStream(aiModelName, aMessages, oViewModel, this);
            var payload = Utility.createPayloadBasedOnModel(aiModelName, aMessages, oViewModel, this);

            var busyDialog = new sap.m.BusyDialog();
            busyDialog.open();
            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", false);
            var aMsgContentSystemDesc = this.getView().byId("descTxtArea").getValue();
            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/sysMsg", aMsgContentSystemDesc);
            this.getOwnerComponent().getModel("airesponseDetailModel").refresh();
            var keytoSend = this.getView().getModel("selKeyForDetailDetail").getProperty("/keyD");
            var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;
            this.oRouter.navTo("DetailDetail", { dispKey: keytoSend, aimodel: selectedAI, layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded });

            try {

                const response = await fetch(apiUrl4, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...this.defaultHeaders
                    },
                    body: JSON.stringify(payload)
                });

                const oResponseModel = this.getView().getModel("responseModel");
                const { message: oResMsg, usedTokens: oUsedToken, rawText: sResponse } =
                    await Utility.processAPIResponse(this, payloadNonStream, response, aiModelName, busyDialog, apiUrl4);
                const tokenData = oModel.getProperty(`/${sSelectedIconTab}/${aiModelName}`);
                ////// 
                if (sSelectedIconTab == "PCT") {
                    that.getView().byId("pctSysMsgBtn").setVisible(true);
                    that.onPctStepOutput(payload.messages);
                    that.getView().byId("nextBtn").setVisible(true);
                    MessageBox.information(oBundle.getText("nextMsg"));
                }
                if (tokenData) {
                    oToken = tokenData.TotalToken || 0;
                    usedToken = tokenData.UsageToken || 0;
                }

                var priceText = "Token Limit : " + oUsedToken + " / " + oToken;
                var oUsage;
                var fileCont = true;
                busyDialog.close();
                BusyIndicator.hide();
                Utility.handleTabResponseDynamic(sSelectedIconTab,
                    this,
                    sResponse,
                    oResMsg,
                    promptMsgData,
                    oUsedToken,
                    oToken,
                    oViewModel,
                    fileCont
                );

                this.sendTokenUsageLog(oUsedToken, promptMsgData);
            } catch (error) {

                sap.m.MessageBox.error(oBundle.getText("errorAzureAPI"));
            } finally {
                busyDialog.close();
            }
        },
        searchSysPrompt: function (eveSearch) {
            var sQuery = eveSearch.getSource().getValue();

            // Access the List by ID
            var oList = this.byId("sysMsgList");
            var oBinding = oList.getBinding("items");

            var aFilters = [];

            if (sQuery && sQuery.length > 0) {
                // Filter on NAME and PROMPT_TEMPLATE
                aFilters.push(
                    new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter("NAME", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("PROMPT_TEMPLATE", sap.ui.model.FilterOperator.Contains, sQuery)
                        ],
                        and: false
                    })
                );
            }

            // Apply the filter
            oBinding.filter(aFilters, "Application");
        },

        searchPrompt: function (oEvent) {
            var sQuery = oEvent.getSource().getValue();

            // Get List & binding
            var oList = this.byId("promptList");
            var oBinding = oList.getBinding("items");

            var aFilters = [];

            if (sQuery && sQuery.length > 0) {
                aFilters.push(
                    new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter("PROMPT_TEMPLATE", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("PROMPTID", sap.ui.model.FilterOperator.Contains, sQuery) // optional
                        ],
                        and: false
                    })
                );
            }

            oBinding.filter(aFilters, "Application");
        },

        onAddPrompt: async function (oEvent) {
            var that = this;
            //////unused funct
            this.getView().getModel("scenarioEn").setProperty("/isAddPromptOpen", true);
            var msgSel = this.getView().byId("msgSelected").getSelectedKey();
            var scenarioSel = this.getView().byId("categorySelect").getSelectedKey();
            this.getView().byId("editPrm").setVisible(false);
            // var scenarioSel = this.getView().byId("addPromptCatChange").getSelectedKey();
            var fullname = this._loggedInUserName;
            var promptAdd, scenario = "";
            scenario = this.getView().byId("categorySelect").getSelectedKey();
            if (msgSel == "user") {
                this.getView().getModel("enSysPromp").setProperty("/en", false);
                this.getView().getModel("enSysPromp").setProperty("/isUpdate", false);
                this.getView().getModel("enSysPromp").setProperty("/vis", false);
                this.getView().getModel("enSysPromp").setProperty("/temp", "Add Prompt");
                var fourDigitId = Date.now().toString().slice(-4);
                var uniqueName = scenario + "_" + fourDigitId + "_prompt";
                promptAdd = {
                    "name": uniqueName, // promptid 
                    "version": "0.0.1",
                    "scenario": scenario, //category 
                    "spec": {
                        "template": [
                            {
                                "role": "user",
                                "content": ""
                            }
                        ],
                        "defaults": {
                            "UserId": this._loggedInUser,
                            "ProjectId": this._ProjectDetail,
                            "CreatedIn": this._ProjectDetail,
                            "UpdatedIn": "",
                            "msgType": "Prompt",
                            "updBy": this._loggedInUserName,
                            "updAt": new Date().toISOString()
                        }
                    }
                };

            } else {
                var sysName = "";
                switch (scenarioSel) {
                    case "BS":
                        sysName = "BusD_" + this._ProjectDetail + "_";
                        //// sysName = "BusD_CG-DevCockpit_";
                        break;
                    case "User":
                        sysName = "UserS_" + this._ProjectDetail + "_";
                        ////   sysName = "UserS_CG-DevCockpit_";
                        break;
                    case "fstoconf":
                        sysName = "FSCon_" + this._ProjectDetail + "_";
                        ////   sysName = "FSCon_CG-DevCockpit_";
                        break;
                    case "fstots":
                        sysName = "FsTs_" + this._ProjectDetail + "_";
                        ////  sysName = "FsTs_CG-DevCockpit_";
                        break;
                    case "tstocode":
                        sysName = "TsCod_" + this._ProjectDetail + "_";
                        ////   sysName = "TsCod_CG-DevCockpit_";
                        break;
                    case "coderem":
                        sysName = "CodeR_" + this._ProjectDetail + "_";
                        ////   sysName = "CodeR_CG-DevCockpit_";
                        break;
                    case "codesum":
                        sysName = "CodeS_" + this._ProjectDetail + "_";
                        ////    sysName = "CodeS_CG-DevCockpit_";
                        break;
                    case "tstocodeGit":
                        sysName = "TsCodGit_" + this._ProjectDetail + "_";
                        ////   sysName = "TsCodGit_CG-DevCockpit_";
                        break;
                    case "TUT":
                        sysName = "TUT_" + this._ProjectDetail + "_";
                        ////  sysName = "TUT_CG-DevCockpit_";
                        break;
                    case "BPM":
                        sysName = "BPM_" + this._ProjectDetail + "_";
                        ////   sysName = "BPM_CG-DevCockpit_";
                        break;
                    case "TCG":
                        sysName = "TCG_" + this._ProjectDetail + "_";
                        ////  sysName = "TCG_CG-DevCockpit_";
                        break;
                    case "PCT":
                        sysName = "PCT_" + this._ProjectDetail + "_";
                        //// sysName = "PCT_CG-DevCockpit_";
                        break;
                }
                this.getView().getModel("enSysPromp").setProperty("/en", true);
                this.getView().getModel("enSysPromp").setProperty("/vis", true);

                this.getView().getModel("enSysPromp").setProperty("/sysKey", sysName);
                this.getView().getModel("enSysPromp").setProperty("/temp", "Add System Key");
                var promptAdd = {
                    "name": "",
                    "version": "0.0.1",
                    "scenario": scenario, //like BS, User, etc 
                    "spec": {
                        "template": [
                            {
                                "role": "system",
                                "content": ""
                            }
                        ],
                        "defaults": {
                            "ProjectId": this._ProjectDetail,
                            "UserId": this._loggedInUser,
                            "CreatedIn": this._ProjectDetail,
                            "UpdatedIn": "",
                            "msgType": "System",
                            "updBy": this._loggedInUserName,
                            "updAt": new Date().toISOString()
                        }
                    }
                };
            }
            var savePrmModel = new sap.ui.model.json.JSONModel(promptAdd);
            this.getView().setModel(savePrmModel, "savePrmModel");
            if (!this.addPromptFrag) {
                this.addPromptFrag = await this.loadFragment({
                    name: "aicockpitfeq.fragment.AddPrompt"
                }).then(function (oDialog15) {
                    this.addPromptFrag = oDialog15;
                    this.oDialog15 = oDialog15;
                    this.oDialog15.attachBrowserEvent("keydown", function (oEvent) {
                        if (oEvent.key === "Escape") {
                            oEvent.stopPropagation();
                            oEvent.preventDefault();
                        }
                    });
                    this.getView().addDependent(oDialog15);
                    if (msgSel == "user") {
                        this.getView().byId("vis").setVisible(false);
                    } else {
                        this.getView().byId("vis").setVisible(true);
                    }
                    oDialog15.open();
                }.bind(this));
            } else {
                this.addPromptFrag.open(); // Reuse the existing instance
            }
        },
        onCancel: function () {
            this.oDialog15.close();
        },
        addPromptCatChange: function (eve) {
            var selPar = eve.getSource().getSelectedKey();
            var msgSel = this.getView().getModel("savePrmModel").oData.spec.defaults.msgType;
            var sysName = "";
            if (msgSel == "System") {
                switch (selPar) {
                    case "BS":
                        sysName = "BusD_" + this._ProjectDetail + "_";
                        ////       sysName = "BusD_CG-DevCockpit_";
                        break;
                    case "User":
                        sysName = "UserS_" + this._ProjectDetail + "_";
                        ////     sysName = "UserS_CG-DevCockpit_";
                        break;
                    case "fstoconf":
                        sysName = "FSCon_" + this._ProjectDetail + "_";
                        /////    sysName = "FSCon_CG-DevCockpit_";
                        break;
                    case "fstots":
                        sysName = "FsTs_" + this._ProjectDetail + "_";
                        ////    sysName = "FsTs_CG-DevCockpit_";
                        break;
                    case "tstocode":
                        sysName = "TsCod_" + this._ProjectDetail + "_";
                        /////      sysName = "TsCod_CG-DevCockpit_";
                        break;
                    case "coderem":
                        sysName = "CodeR_" + this._ProjectDetail + "_";
                        /////     sysName = "CodeR_CG-DevCockpit_";
                        break;
                    case "codesum":
                        sysName = "CodeS_" + this._ProjectDetail + "_";
                        ////      sysName = "CodeS_CG-DevCockpit_";
                        break;
                    case "tstocodeGit":
                        sysName = "TsCodGit_" + this._ProjectDetail + "_";
                        ////      sysName = "TsCodGit_CG-DevCockpit_";
                        break;
                    case "TUT":
                        sysName = "TUT_" + this._ProjectDetail + "_";
                        ////  sysName = "TUT_CG-DevCockpit_";
                        break;
                    case "BPM":
                        sysName = "BPM_" + this._ProjectDetail + "_";
                        // sysName = "BPM_CG-DevCockpit_";
                        break;
                    case "TCG":
                        sysName = "TCG_" + this._ProjectDetail + "_";
                        ////sysName = "TCG_CG-DevCockpit_";
                        break;
                    case "PCT":
                        sysName = "PCT_" + this._ProjectDetail + "_";
                        ////  sysName = "PCT_CG-DevCockpit_";
                        break;

                }
                this.getView().getModel("savePrmModel").oData.sysKey = sysName;
                this.getView().byId("vis").setValue(sysName);
                this.getView().getModel("enSysPromp").oData.sysKey = sysName;
                this.getView().getModel("enSysPromp").refresh();
            } else if (msgSel == "Prompt") {
                var fourDigitId = Date.now().toString().slice(-4);
                sysName = selPar + "_" + fourDigitId + "_prompt";
                this.getView().getModel("savePrmModel").oData.name = sysName;
            }

            this.getView().getModel("savePrmModel").refresh();
            let msgType = "";
            if (msgSel == "user") {
                msgType = "prompt";
            } else {
                msgType = "sysMsg";
            }
            var url = this._sBasePath + "/cockpit/getPromptDetails?Category=" + selPar + "&MsgType=" + msgType + "&ProjectId=" + this._ProjectDetail;
            // var url = this._sBasePath + "/lm/promptTemplates?scenario=" + selPar + "&version=0.0.1";

            this.getView().byId("categorySelect").setSelectedKey(selPar);
            this.onSearch(url, msgSel);
        },
        savefromAddPrompt: function (event) {
            var msgSel = this.getView().byId("msgSelected").getSelectedKey();
            if (msgSel == "user") {
                this.savePrompt(event);
            } else if (msgSel == "system") {
                this.saveSys(event);
            }
        },
        onUpdatePrompt: async function (oEve) {
            var oView = this.getView();
            this.getView().getModel("scenarioEn").setProperty("/isAddPromptOpen", false);
            var catSel = this.getView().byId("categorySelect").getSelectedKey();
            var oBundle = oView.getModel("i18n").getResourceBundle();
            this.getView().getModel("enSysPromp").setProperty("/isUpdate", true);
            if (!this.getView().getModel("savePrmModel")) {
                var promptAdd = {
                    "name": "",
                    "version": "0.0.1",
                    "scenario": catSel,
                    "spec": {
                        "template": [
                            {
                                "role": "system",
                                "content": ""
                            }
                        ],
                        "defaults": {
                            "ProjectId": this._ProjectDetail,
                            "UserId": this._loggedInUser,
                            "CreatedIn": "",
                            "UpdatedIn": this._ProjectDetail,
                            "msgType": "System",
                            "updBy": this._loggedInUserName,
                            "updAt": new Date().toISOString()
                        }
                    }
                };
                var savePrmModel = new sap.ui.model.json.JSONModel(promptAdd);
                this.getView().setModel(savePrmModel, "savePrmModel");
            }
            // Only for Prompt Registry screen
            var sFragmentName = oView.getModel("switchFragments").getProperty("/frg/frName");
            if (sFragmentName !== "promptlibpr") {
                return;
            }
            var oTable = oView.byId("idPromptRegistryTable");
            if (!oTable) {
                MessageBox.error("Prompt Registry table not found");
                return;
            }
            var oSelectedItem = oTable.getSelectedItem();
            if (!oSelectedItem) {
                MessageBox.warning(oBundle.getText("selectPromptToUpdate"));
                return;
            }
            this.getView().getModel("enSysPromp").setProperty("/en", false);

            this.getView().getModel("enSysPromp").setProperty("/vis", false);
            var oContext = oSelectedItem.getBindingContext("allPromptsModel");
            var oPromptData = oContext.getObject();
            var updPrmModel = this.getView().getModel("savePrmModel");
            var msgSel = this.getView().byId("msgSelected").getSelectedKey();
            if (oPromptData.ProjectId) {
                updPrmModel.oData.spec.defaults.ProjectId = oPromptData.ProjectId;
            }
            if (oPromptData.CreatedIn) {
                updPrmModel.oData.spec.defaults.CreatedIn = oPromptData.CreatedIn;
            }

            if (oPromptData.ProjectId == "default") {
                MessageBox.information("Cannot Update Default Project");
            } else {
                if (msgSel == "user") {
                    this.getView().getModel("enSysPromp").setProperty("/temp", "Update Prompt");
                    //     updPrmModel.oData.spec.defaults.UpdatedIn = this._ProjectDetail;                
                    updPrmModel.oData.spec.template[0].role = "user";
                    updPrmModel.oData.spec.defaults.msgType = "Prompt";

                } else if (msgSel == "system") {
                    this.getView().getModel("enSysPromp").setProperty("/temp", "Update System Key");
                    //     updPrmModel.oData.spec.defaults.UpdatedIn = this._ProjectDetail;
                    updPrmModel.oData.spec.template[0].role = "system";
                    updPrmModel.oData.spec.defaults.msgType = "System";
                }
                updPrmModel.oData.spec.template[0].content = oPromptData.Prompt_Template
                updPrmModel.oData.name = oPromptData.name;
                updPrmModel.oData.scenario = this.getView().byId("categorySelect").getSelectedKey();
                this.getView().byId("categorySelect").getSelectedKey();
                if (!this.updPromptFrag) {
                    this.updPromptFrag = await this.loadFragment({
                        name: "aicockpitfeq.fragment.AddPrompt"
                    }).then(function (oDialog15) {
                        this.updPromptFrag = oDialog15;
                        this.oDialog15 = oDialog15;
                        this.oDialog15.attachBrowserEvent("keydown", function (oEvent) {
                            if (oEvent.key === "Escape") {
                                oEvent.stopPropagation();
                                oEvent.preventDefault();
                            }
                        });
                        this.getView().addDependent(oDialog15);
                        oDialog15.open();
                    }.bind(this));
                } else {
                    this.updPromptFrag.open(); // Reuse the existing instance
                }
            }
        },
        onDeletePrompt: function (oEvent) {
            var that = this;
            var sPromptId = "";
            var oPromptModel, aPrompts = [];
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sFragmentName = this.getView().getModel("switchFragments").getProperty("/frg/frName");
            var oTable = "";
            if (sFragmentName === "promptlibpr") {
                oTable = this.getView().byId("idPromptRegistryTable");
                if (!oTable) {
                    MessageBox.error("Prompt Registry table not found");
                    return;
                }
                var oSelectedItem = oTable.getSelectedItem();
                if (!oSelectedItem) {
                    MessageBox.warning(oBundle.getText("selectPromptToDelete"));
                    return;
                }
                oPromptModel = this.getView().getModel("allPromptsModel");
                var oContext = oSelectedItem.getBindingContext("allPromptsModel");
                aPrompts = this.getView().getModel("allPromptsModel").getData();
                var oPromptData = oContext.getObject();
                sPromptId = oPromptData.UUID;
                if (!sPromptId) {
                    MessageBox.error("Prompt ID is missing. Cannot delete.");
                    return;
                }
            } else {
                /////sPromptId = oEvent.getParameter("listItem").getBindingContext("BSPromptData").getObject().PROMPTID;
                sPromptId = oEvent.getParameter("listItem").getBindingContext("BSPromptData").getObject().UUID;
                oPromptModel = this.getView().getModel("BSPromptData");
                aPrompts = oPromptModel.getData();
            }
            var oModel = this.getView().getModel("BSPromptData");
            var aData = oModel.getData();
            sap.m.MessageBox.confirm(oBundle.getText("confirmDeletePrompt"), {
                title: oBundle.getText("deletePromptTitle"),
                actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],

                onClose: function (oAction) {

                    if (oAction === sap.m.MessageBox.Action.YES) {
                        if (that.oDialog1) {
                            that.oDialog1.setBusy(true);
                        }

                        $.ajax({
                            url: that._sBasePath + "/cockpit/deletePromptDetails",   // CAP action
                            method: "POST",
                            contentType: "application/json",
                            headers: that.defaultHeaders,
                            data: JSON.stringify({
                                // ID: sUUID
                                // uuid: sID
                                uuid: sPromptId
                            }),

                            success: function () {

                                sap.m.MessageToast.show(oBundle.getText("promptDeletedSuccess"));

                                if (sFragmentName === "promptlibpr") {
                                    oTable.removeSelections(true);
                                    var catSel = that.byId("categorySelect").getSelectedKey();

                                    var roleSel = that.byId("msgSelected").getSelectedKey();
                                    var msgType = (roleSel === "user") ? "prompt" : "sysMsg";

                                    var url = that._sBasePath +
                                        "/cockpit/getPromptDetails?Category=" + catSel +
                                        "&MsgType=" + msgType +
                                        "&ProjectId=" + that._ProjectDetail;

                                    that.onSearch(url, roleSel);

                                } else {
                                    var updatedData = aData.filter(function (item) {
                                        return item.UUID !== sPromptId;
                                    });

                                    oModel.setData(updatedData);
                                    oModel.refresh(true);
                                }

                                if (that.oDialog1) {
                                    that.oDialog1.setBusy(false);
                                }

                            },

                            error: function (error) {

                                if (that.oDialog1) {
                                    that.oDialog1.setBusy(false);
                                }

                                console.error("Delete error:", error);

                                var errMsg = oBundle.getText("promptDeleteError");
                                try {
                                    errMsg = JSON.parse(error.responseText).error.message;
                                } catch (e) { }

                                sap.m.MessageBox.error(errMsg);
                            }
                        });
                    }
                }
            });
        },
        onClearFil: function () {
            var oView = this.getView();
            [
                "idUserLogSearch",
                "idStartDate",
                "idEndDate",
                "projectInput",
                "emailInput",
                "idProjectFilter",
                "idPromptUserId"
            ].forEach(function (id) {
                var ctrl = oView.byId(id);
                if (ctrl) {
                    if (ctrl.setValue) ctrl.setValue("");
                    if (ctrl.setSelectedKey) ctrl.setSelectedKey("");
                    if (ctrl.setDateValue) ctrl.setDateValue(null);
                }
            });

            ["idUserLogTable", "idPromptRegistryTable", "idPromptUsed", "kbTable"].forEach(function (sTableId) {
                var oTable = oView.byId(sTableId);
                if (!oTable) return;

                var oBinding = oTable.getBinding("items") || oTable.getBinding("rows");
                if (oBinding) {
                    oBinding.filter([]);
                    if (oBinding.refresh) {
                        oBinding.refresh(true);
                    }
                }

                var oModel = oTable.getModel && oTable.getModel();
                if (oModel && oModel.refresh) {
                    oModel.refresh(true);
                }
            });

        },
        promptRegExport: function () {
            var oTable = eveTable.getSource().getParent().getParent().mAggregations;
            var aCols = [];
            for (var i = 0; i < oTable.columns.length; i++) {
                aCols.push({
                    label: oTable.columns[i].mAggregations.header.mProperties.text,
                    property: oTable.columns[i].mAggregations.header.mProperties.text,
                    type: String,
                });
            }
            aCols.map((unit) => {
                if (unit.property == "ID") {
                    unit.property = "USERNAME";
                } else if (unit.property == "Prompt Template") {
                    unit.property = "EMAIL_ID";
                }
                else if (unit.property == "Date Added") {
                    unit.property = "project";
                }
                else if (unit.property == "Category") {
                    unit.property = "date";
                }
                else if (unit.property == "Project ID") {
                    unit.property = "totalDuration";
                }
                else if (unit.property == "Message Type") {
                    unit.property = "totalTokensConsumed";
                }
                else if (unit.property == "User ID") {
                    unit.property = "totalSessions";
                }
                else if (unit.property == "Prompt ID") {
                    unit.property = "modelData"; //newly created
                }
                else if (unit.property == "Updated By") {
                    unit.property = "modelData"; //newly created
                }
                else if (unit.property == "Updated At") {
                    unit.property = "modelData";
                }
                return unit;
            });
            var newaCols = [];
            var oRowBinding = this.getView().getModel("allPromptsModel").oData;
            const oSettings = {
                workbook: {
                    columns: newaCols,
                    hierarchyLevel: "Level"
                },
                dataSource: oRowBinding,
                fileName: "Prompt Registry.xlsx",
                worker: false // We need to disable worker because we are using a MockServer as OData Service
            };

            const oSheet = new Spreadsheet(oSettings);
            oSheet.build().finally(function () {
                oSheet.destroy();
            });
        },
        // start of madhu
        KBIntegration: function () {     //Function name changed due to duplicate names
            //unused function
            if (this.kbfr) {
                this.onSendPress();
            }

        },
        onSendPress: function () {
            //unused function
            var query = this.getView().byId("userInput").getValue().trim();
            var session_id = "newsessionTTE";

            if (!query) {
                MessageBox.show("Please enter a message.");
                return;
            }

            var validate = this.onValidatePress(query);
            if (!validate) {
                MessageBox.show("Validation failed.");
                return;
            }
            this.apiLink = "https://knowledge-management-inegration.cfapps.eu10.hana.ondemand.com/SAP Brownfield Implementation";
            // this.getView().byId("id_UserPrompt").setText("SAP Brownfield Implementation");

            this.oBusyDialog.open();

            var payload = {
                question: query,
                session_id: session_id
            };

            var that = this;
            $.ajax({
                url: this.apiLink,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),
                success: function (data) {
                    console.log("API Response:", data);
                    var response = (data.response && data.response.answer) || data.answer || "No answer available.";

                    var citations = [];
                    if (Array.isArray(data.citation)) {
                        citations = data.citation.map(function (citation, index) {
                            var meta = (data.metadata && data.metadata[index]) || {};
                            return {
                                index: index,
                                citation: "Citation", // clickable text in chat
                                content: citation, // actual file name for dialog
                                source: meta.source || "",
                                page: meta.page || "",
                                link: meta.sharepoint_link || "",
                                linkText: meta.sharepoint_link ? "View Document" : ""
                            };
                        });
                    } else if (data.citation) {
                        var meta = (data.metadata && data.metadata[0]) || {};
                        citations.push({
                            index: 0,
                            citation: "Citation", // clickable text
                            content: data.citation, // actual file name
                            source: meta.source || "",
                            page: meta.page || "",
                            link: meta.sharepoint_link || "",
                            linkText: meta.sharepoint_link ? "View Document" : ""
                        });
                    }
                    var chatModel = that.getView().getModel("chatModel");
                    var aData = chatModel.getProperty("/data") || [];
                    aData.push({
                        userMessage: query,
                        aiResponse: response,
                        Citations: citations
                    });
                    chatModel.setProperty("/data", aData);

                    that.getView().byId("id_citations").setVisible(citations.length > 0);

                    that.getView().byId("userInput").setValue("");
                    that.oBusyDialog.close();

                    var oSC = that.getView().byId("chatScrollContainer");
                    setTimeout(() => oSC.scrollTo(0, 99999, 300), 0);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    that.oBusyDialog.close();
                    sap.m.MessageBox.error("POST request failed. Error: " + textStatus);
                    console.error("Error details:", jqXHR.responseText);
                }
            });
        },
        onCitationPress: function (oEvent) {

            var oLink = oEvent.getSource();
            var oCitationData = oLink.getBindingContext("chatModel").getObject();
            var sContent = oCitationData.content;
            if (sContent) {
                if (!this._oDialog) {
                    this._oDialog = Fragment.load({
                        id: this.getView().getId(),
                        name: "aicockpitfeq.fragment.CitationDialog",
                        controller: this
                    }).then(function (oDialog) {
                        this.getView().addDependent(oDialog);
                        return oDialog;
                    }.bind(this));
                }
                this._oDialog.then(function (oDialog) {
                    console.log("JSONModel is:", JSONModel);
                    var oModel = new sap.ui.model.json.JSONModel({
                        content: sContent
                    });
                    oDialog.setModel(oModel, "citationModel");
                    oDialog.open();
                });

            } else {
                MessageBox.error("An error occurred while retrieving the citation content");
            }

        },
        onCloseCitationDialog: function () {
            this.byId("CitationDialog").close();
        },


        onCloseDialog: function () {
            const oDialog = this.kbfr || sap.ui.core.Fragment.byId(this.getView().getId(), "kbDialog");
            oDialog && oDialog.close();
        },
        onValidatePress: function (query) {

            if (query === "" || null) {
                MessageBox.show("Please enter your query!", {
                    duration: 3000, // default
                    width: "15em", // default
                    my: "center center", // default
                    at: "center center", // default
                    of: window, // default
                    offset: "0 0", // default
                    collision: "fit fit", // default
                    onClose: null, // default
                    autoClose: true, // default
                    animationTimingFunction: "ease", // default
                    animationDuration: 1000, // default
                    closeOnBrowserNavigation: true // default
                });
                return false;
            }
            return true;
        },

        refresh: function () {
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            this.executedOnce = false;
            var that = this;

            sap.m.MessageBox.information(oBundle.getText("warningDataDelete"), {
                icon: sap.m.MessageBox.Icon.WARNING,
                title: "Warning",
                actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                onClose: function (oAction) {
                    if (oAction === sap.m.MessageBox.Action.OK) {

                        if (that.kbfr) {
                            // Clear TextArea inside dialog
                            var oTextArea = sap.ui.core.Fragment.byId(that.getView().getId(), "userInput");
                            if (oTextArea) {
                                oTextArea.setValue("");
                            }

                            // Clear chat list model
                            var oChatModel = that.getView().getModel("chatModel");
                            if (oChatModel) {
                                oChatModel.setData({ data: [] });
                            }

                            // Optionally close the dialog
                            //that.kbfr.close();
                        }
                    }
                }
            });
        },


        onCloseDialog: function () {
            if (this.kbfr) {
                this.kbfr.close();
            }
        },


        onDownloadPDF: function () {
            // Build simple lines for jsPDF-based PDF
            var oChatModel = this.getView().getModel("chatModel");
            var aChatData = oChatModel ? oChatModel.getProperty("/data") : [];

            if (!aChatData || aChatData.length === 0) {
                MessageBox.show("No Knowledge Base data available to export.");
                return;
            }

            var lines = [];
            lines.push("Knowledge Base Export");
            lines.push("");

            aChatData.forEach(function (item) {
                lines.push("User Prompt:");
                lines.push(item.userMessage || "");
                lines.push("");
                lines.push("AI Response:");
                lines.push(item.aiResponse || "");
                lines.push("");
                if (item.Citations && item.Citations.length > 0) {
                    lines.push("Citations:");
                    item.Citations.forEach(function (c) {
                        var fname = c.content || c.citation || "Unknown file";
                        lines.push("  - " + fname + (c.link ? " (" + c.link + ")" : ""));
                    });
                }
                lines.push("");
            });

            // Use PdfUtil (jsPDF wrapper) to generate PDF
            PdfUtil.createSimplePdf("KnowledgeBase_Export.pdf", lines);
        },

        generateWordContent: function () {
            const {
                AlignmentType,
                HeadingLevel,
                TextRun,
                Paragraph,
                ExternalHyperlink,
                Document,
                Packer
            } = window.docx || {};

            if (!window.docx || !Document || !Packer) {
                sap.m.MessageBox.information("Libraries not loaded");
                return;
            }

            // Helper for bold text (**text**)
            const parseText = (text) => {
                const parts = String(text).split(/(\*\*.*?\*\*)/g);
                return parts.map((part) =>
                    part.startsWith("**") && part.endsWith("**")
                        ? new TextRun({ text: part.slice(2, -2), bold: true })
                        : new TextRun({ text: part })
                );
            };

            //  Get chat data from Knowledge Base dialog model
            const oChatModel = this.getView().getModel("chatModel");
            const aChatData = (oChatModel && oChatModel.getProperty("/data")) || [];

            if (!Array.isArray(aChatData) || aChatData.length === 0) {
                MessageBox.show("No Knowledge Base data available to export.");
                return;
            }

            // Create Word document
            const doc = new Document({
                styles: {
                    default: {
                        document: { run: { font: "Calibri", size: 24 }, paragraph: { spacing: { line: 276 } } },
                    },
                    characterStyles: [
                        { id: "Hyperlink", name: "Hyperlink", run: { color: "0B5ED7", underline: {} } },
                    ],
                },
                sections: [],
            });

            const finalContent = [];

            // Title
            finalContent.push(
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                    children: [new TextRun({ text: "Knowledge Base Export", bold: true, size: 36, color: "1F4E79" })],
                })
            );

            // Loop through chat data
            aChatData.forEach((item) => {
                const userMsg = item.userMessage || "";
                const aiMsg = item.aiResponse || "";
                const cites = Array.isArray(item.Citations) ? item.Citations : [];

                // User Prompt
                finalContent.push(new Paragraph({ children: [new TextRun({ text: "User Prompt:", bold: true, color: "1F4E79", size: 26 })], spacing: { after: 100 } }));
                String(userMsg).split(/\r?\n/).filter(Boolean).forEach((line) => {
                    finalContent.push(new Paragraph({ children: parseText(line), spacing: { after: 120 } }));
                });

                // AI Response
                finalContent.push(new Paragraph({ children: [new TextRun({ text: "AI Response:", bold: true, color: "1F4E79", size: 26 })], spacing: { before: 100, after: 100 } }));
                String(aiMsg).split(/\r?\n/).filter(Boolean).forEach((line) => {
                    finalContent.push(new Paragraph({ children: parseText(line), spacing: { after: 120 } }));
                });

                // Citations
                if (cites.length > 0) {
                    finalContent.push(new Paragraph({ children: [new TextRun({ text: "Citation:", bold: true, color: "1F4E79", size: 26 })], spacing: { before: 120, after: 60 } }));

                    cites.forEach((c) => {
                        const fileName = c.content || c.citation || "No file name";

                        // File name bullet
                        finalContent.push(new Paragraph({
                            spacing: { after: 60 },
                            children: [new TextRun({ text: "• ", bold: true }), new TextRun({ text: fileName, size: 22 })],
                        }));

                        // Source | Page
                        const meta = [c.source ? `Source: ${c.source}` : "", c.page ? `Page: ${c.page}` : ""].filter(Boolean).join(" | ");
                        if (meta) {
                            finalContent.push(new Paragraph({ children: [new TextRun({ text: meta, size: 18, color: "666666" })], spacing: { after: 60 } }));
                        }

                        // Clickable link
                        if (c.link) {
                            finalContent.push(
                                new Paragraph({
                                    children: [
                                        new ExternalHyperlink({
                                            link: c.link,
                                            children: [new TextRun({ text: c.linkText || "Open Document", style: "Hyperlink", size: 22 })],
                                        }),
                                    ],
                                    spacing: { after: 120 },
                                })
                            );
                        }
                    });
                }
            });

            doc.addSection({ children: finalContent });

            // Save as Word file
            Packer.toBlob(doc).then((blob) => {
                sap.ui.core.util.File.save(
                    blob,
                    "KnowledgeBase_Export",
                    "docx",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                );
            });
        },
        //helpers for save and restore
        _saveTabState: function (sKey) {
            if (!sKey) { return; }

            var oView = this.getView();
            var oStateModel = oView.getModel("tabState");
            var oTabs = oStateModel.getProperty("/tabs") || {};
            // keep previous state (important to preserve hasDetail flag)
            var oPrevState = oTabs[sKey] || {};
            // --- RAG ---
            var oRagModel = this.getView().getModel("ragModel");
            var aMsgModel = this.getView().getModel("msgModel");
            var oState = {
                excOnce: this.executedOnce,
                // System message
                systemKey: oView.byId("multiInputSystem") ? oView.byId("multiInputSystem").getValue() : "",
                systemText: oView.byId("descTxtArea") ? oView.byId("descTxtArea").getValue() : "",
                systemTextEditable: oView.byId("descTxtArea") ? oView.byId("descTxtArea").getEditable() : false,

                // Prompt
                promptKey: oView.byId("multiInputPrompt") ? oView.byId("multiInputPrompt").getValue() : "",
                promptText: oView.byId("descTxtAreaPrompt") ? oView.byId("descTxtAreaPrompt").getValue() : "",
                promptEditable: oView.byId("descTxtAreaPrompt") ? oView.byId("descTxtAreaPrompt").getEditable() : false,
                // File select
                docKey: oView.byId("selDocList") ? oView.byId("selDocList").getSelectedKey() : "",
                docNameText: oView.byId("docNameText") ? oView.byId("docNameText").getText() : "",
                docNameVisible: oView.byId("docNameText") ? oView.byId("docNameText").getVisible() : false,
                viewDocVisible: oView.byId("viewDocBtn") ? oView.byId("viewDocBtn").getVisible() : false,

                //add System
                addSysLabel: oView.byId("addSysPart") ? oView.byId("addSysPart").getVisible() : false,
                // addVb: oView.byId("vbxSysAdd") ? oView.byId("vbxSysAdd").getVisible() : false,
                // addSysInfo:oView.byId("infoSys") ? oView.byId("infoSys").getVisible() : false,
                addSys1st: oView.byId("addSysPrefix") ? oView.byId("addSysPrefix").getValue() : "",
                addSys1stVis: oView.byId("addSysPrefix") ? oView.byId("addSysPrefix").getVisible() : false,
                editSysBtn: oView.byId("editSys") ? oView.byId("editSys").getVisible() : false,
                saveSysBtn: oView.byId("saveSysBtn") ? oView.byId("saveSysBtn").getVisible() : false,
                // addSys2nd: oView.byId("addSysSuffix") ? oView.byId("addSysSuffix").getValue() : "",
                // add Prompt
                addPrLabel: oView.byId("addPrPart") ? oView.byId("addPrPart").getVisible() : false,
                addPromptName: oView.byId("addPrName") ? oView.byId("addPrName").getValue() : "",
                addPromptNameVisible: oView.byId("addPrName") ? oView.byId("addPrName").getVisible() : false,
                editPrmBtn: oView.byId("editPrm") ? oView.byId("editPrm").getVisible() : false,
                cancelPrm: oView.byId("cancelPrmBtn") ? oView.byId("cancelPrmBtn").getVisible() : false,
                savePrmBtn: oView.byId("savePrm") ? oView.byId("savePrm").getVisible() : false,
                /////tcg and bpm
                sapDocSelected: oView.byId("sapDocSel") ? oView.byId("sapDocSel").getValue() : "",
                tcTypeSelected: oView.byId("tcTypeSel") ? oView.byId("tcTypeSel").getValue() : "",
                /////DocGen - Document Type
                docTypeSelected: oView.byId("docTypeSelector") ? oView.byId("docTypeSelector").getSelectedKey() : "",
                ///Rag
                ragSwitchState: oView.byId("RagSwitch") ? oView.byId("RagSwitch").getSelected() : false,
                selDocListKeyView: oView.byId("SelDocList") ? oView.byId("SelDocList").getSelectedKey() : "",
                docNameTextViewVisible: oView.byId("DocNameText") ? oView.byId("DocNameText").getVisible() : false,

                /// parameter settings
                parsett: this.savedSettings || false,
                savedTemperature: this._savedTemperature,
                savedTopP: this._savedTopP,
                maxResponse: this._maxResponse,
                freqPenalty: this._freqPenalty,
                prePenalty: this._prePenalty,
                contextHist: this._contextHist,
                // --- New RAG model-backed keys ---
                ragEnabled: (oRagModel) ? !!oRagModel.getProperty("/currentRagEnabled") : false,
                ///  aRagFiles: (oRagModel) ? oRagModel.getProperty("/ragFiles") : [],
                aRagFiles: (oRagModel) ? JSON.parse(JSON.stringify(oRagModel.getProperty("/ragFiles") || [])) : [],
                ///value states
                valStateSys: oView.byId("multiInputSystem") ? oView.byId("multiInputSystem").getValueState() : "None",
                valStatePrompt: oView.byId("multiInputPrompt") ? oView.byId("multiInputPrompt").getValueState() : "None",
                valStateUpl: oView.byId("selDocList") ? oView.byId("selDocList").getValueState() : "None",
                /////git tab
                selectedBranch: oView.byId("branchSel") ? oView.byId("branchSel").getSelectedKey() : "",
                gitTreeVis: oView.byId("gitFileTree") ? oView.byId("gitFileTree").getVisible() : false,
                //     gitGitfileViewVis: oView.byId("viewGitFilebtn") ? oView.byId("viewGitFilebtn").getVisible() : false,
                templateFileName: oView.byId("TemplateUploader") ? oView.byId("TemplateUploader").getValue() : "",
                templateKey: this._selectedTemplateKey || "",
                templateNameText: oView.byId("selectedTemplateName") ? oView.byId("selectedTemplateName").getText() : "",
                templateInfoVisible: oView.byId("templateInfoBox") ? oView.byId("templateInfoBox").getVisible() : false,
                templateToggleState: oView.byId("templateToggle") ? oView.byId("templateToggle").getState() : false,
            };
            // STEP 2: also store detail response for this tab
            var oAiRespModel = this.getOwnerComponent().getModel("airesponseDetailModel");
            if (oAiRespModel) {
                oState.detailResp = oAiRespModel.getProperty("/resp") || "";
                oState.detailSys = oAiRespModel.getProperty("/sysMsg") || "";
                // oState.before = oAiRespModel.getProperty("/beforeResult") || "";
                // oState.code = oAiRespModel.getProperty("/codeResult") || "";
                // oState.after = oAiRespModel.getProperty("/afterResult") || "";
                // oState.lang = oAiRespModel.getProperty("/codeType") || "";
                oState.codeEdResp = oAiRespModel.getProperty("/multiCE") || [];
                oState.btnVis = oAiRespModel.getProperty("/downloadVis") || false;
                oState.codeeditorVisible = oAiRespModel.getProperty("/codeEdVis") || false;
                oState.citation = oAiRespModel.getProperty("/citationArr") || [];
            }
            var histM = this.getOwnerComponent().getModel("historyModel");
            if (histM) {
                oState.histData = histM.getProperty("/historyData") || [];
            }

            // var ragModel = this.getOwnerComponent().getModel("ragModel");
            // if (ragModel) {
            //     oState.citation = ragModel.getProperty("/citationArr") || [];
            // }

            ////msgmodel for reupload
            if (aMsgModel) {
                oState.updMsgs = aMsgModel.getProperty("/aMsg") || [];
            }

            var TokenModel = this.getOwnerComponent().getModel("TokenLimit");
            if (TokenModel) {
                oState.currUsedTokens = TokenModel.getProperty("/usedToken");
            }
            ////ai models list
            var oViewModel = this.getView().getModel("viewModel");
            if (oViewModel) {
                oState.aiModels = oViewModel.getProperty("/gptModels");
            }
            // keep the hasDetail flag if it existed before
            if (oPrevState.hasDetail !== undefined) {
                if (oState.detailResp == "") {
                    oState.hasDetail = false;
                } else {
                    oState.hasDetail = oPrevState.hasDetail;
                }
            }


            var oAppModel = this.getView().getModel("appmodel");
            var oFileVM = this.getView().getModel("fileViewModel");
            // Save BSContent text & fileViewModel object for this tab
            oState.BSContent = oAppModel.getProperty("/BSContent") ?? "";
            oState.fileViewData = oFileVM.getData() ?? {};

            oTabs[sKey] = oState;
            oStateModel.setProperty("/tabs", oTabs);
        },

        _restoreTabState: function (sKey) {
            var oView = this.getView();
            var oStateModel = oView.getModel("tabState");
            var oTabs = oStateModel.getProperty("/tabs") || {};
            var oState = oTabs[sKey];
            var oViewModel = this.getView().getModel("viewModel");
            var oDetailModel = this.getOwnerComponent().getModel("airesponseDetailModel");
            var popUpSel = this.getView().getModel("switchFragments").getProperty("/frg/frName");

            if (!oState || !oState.hasDetail) {
                oDetailModel.setProperty("/resp", "");
                oDetailModel.setProperty("/sysMsg", "");
                // oDetailModel.getProperty("/beforeResult", "");
                // oDetailModel.getProperty("/codeResult", "");
                // oDetailModel.getProperty("/codeType", "");
                // oDetailModel.getProperty("/afterResult", "");
                oDetailModel.getProperty("/multiCE", []);
                oDetailModel.getProperty("/downloadVis", false);
                oDetailModel.getProperty("/codeEdVis", false);
                oDetailModel.refresh(true);
                oDetailModel.setProperty("/citationArr", []);
            }
            if (popUpSel !== "user" && popUpSel !== "admin" && popUpSel !== "knowlB" && popUpSel !== "promptlibpr" && popUpSel !== "feedback") {
                if (!oState) {
                    // First time on this tab -> clear the form so it doesn't show previous tab's data
                    ////   this.executedOnce=false;
                    if (oView.byId("multiInputSystem")) {
                        oView.byId("multiInputSystem").setValue("");
                    }
                    if (oView.byId("descTxtArea")) {
                        oView.byId("descTxtArea").setValue("");
                    }
                    if (oView.byId("descTxtArea")) {
                        oView.byId("descTxtArea").setEditable(false);
                    }
                    if (oView.byId("multiInputPrompt")) {
                        oView.byId("multiInputPrompt").setValue("");
                    }
                    if (oView.byId("descTxtAreaPrompt")) {
                        oView.byId("descTxtAreaPrompt").setValue("");
                    }
                    if (oView.byId("descTxtAreaPrompt")) {
                        oView.byId("descTxtAreaPrompt").setEditable(false);
                    }
                    if (oView.byId("selDocList")) {
                        oView.byId("selDocList").setSelectedKey("");
                    }
                    if (oView.byId("docNameText")) {
                        oView.byId("docNameText").setText("").setVisible(false);
                    }
                    if (oView.byId("viewDocBtn")) {
                        oView.byId("viewDocBtn").setVisible(false);
                    }
                    //add System
                    // if (oView.byId("vbxSysAdd")) {
                    //     oView.byId("vbxSysAdd").setVisible(false);
                    // }
                    if (oView.byId("addSysPrefix")) {
                        oView.byId("addSysPrefix").setVisible(false);
                    }
                    if (oView.byId("addSysPart")) {
                        oView.byId("addSysPart").setVisible(false);
                    }
                    if (oView.byId("editSys")) {
                        oView.byId("editSys").setVisible(false);
                    }
                    if (oView.byId("saveSysBtn")) {
                        oView.byId("saveSysBtn").setVisible(false);
                    }
                    //  if (oView.byId("infoSys")) {
                    //     oView.byId("infoSys").setVisible(false);
                    // }
                    //AddPrompt
                    if (oView.byId("addPrPart")) {
                        oView.byId("addPrPart").setVisible(false);
                    }
                    if (oView.byId("addPrName")) {
                        oView.byId("addPrName").setValue("").setVisible(false);
                    }
                    if (oView.byId("editPrm")) {
                        oView.byId("editPrm").setVisible(false);
                    }
                    if (oView.byId("cancelPrmBtn")) {
                        oView.byId("cancelPrmBtn").setVisible(false);
                    }
                    if (oView.byId("savePrm")) {
                        oView.byId("savePrm").setVisible(false);
                    }
                    ////rag
                    var oRagModel = this.getView().getModel("ragModel");
                    if (oRagModel) {
                        oRagModel.setProperty("/currentRagEnabled", false);
                        oRagModel.setProperty("/ragFiles", []);
                        oRagModel.refresh(true);
                    }
                    // var ragModel = this.getOwnerComponent().getModel("ragModel");
                    // if (ragModel) {
                    //     ragModel.setProperty("/citationArr", []);
                    //     ragModel.refresh(true);
                    // }
                    var aMsgModel = this.getView().getModel("msgModel");
                    if (aMsgModel) {
                        aMsgModel.setProperty("/aMsg", []);
                        aMsgModel.refresh(true);
                    }

                    if (oView.byId("RagSwitch")) {
                        oView.byId("RagSwitch").setSelected(false);
                    }
                    if (oView.byId("ragFileList")) {
                        oView.byId("ragFileList").removeSelections(true);

                    }
                    ////value state
                    if (oView.byId("multiInputSystem")) {
                        oView.byId("multiInputSystem").setValueState("None");
                    }
                    if (oView.byId("multiInputPrompt")) {
                        oView.byId("multiInputPrompt").setValueState("None");
                    }
                    if (oView.byId("selDocList")) {
                        oView.byId("selDocList").setValueState("None");
                    }
                    ////ai models list
                    var oViewModel = this.getView().getModel("viewModel");
                    if (oViewModel) {
                        oViewModel.setProperty("/gptModels", this.allAIModels);
                        oViewModel.refresh(true);
                    }
                    //parameters settings
                    if (this.savedSettings == false) {
                        this.settingsRefresh();
                    }
                    //// git tab
                    if (oView.byId("gitTreeVis")) {
                        oView.byId("gitTreeVis").setVisible(false);
                    }

                    oView.getModel("viewModel").setProperty("/templateToggle", false);
                    // if (oView.byId("viewGitFilebtn")) {
                    //     oView.byId("viewGitFilebtn").setVisible(false);
                    // }
                    if (oView.byId("TemplateUploader")) {
                        oView.byId("TemplateUploader").setValue("");
                    }

                    this._selectedTemplateKey = "";

                    if (oView.byId("templateInfoBox")) {
                        oView.byId("templateInfoBox").setVisible(false);
                    }

                    if (oView.byId("selectedTemplateName")) {
                        oView.byId("selectedTemplateName").setText("");
                    }
                    if (oView.byId("templateToggle")) {
                        oView.byId("templateToggle").setState(false);
                    }
                    return;
                }

                var oAppModel = this.getView().getModel("appmodel");
                var oFileVM = this.getView().getModel("fileViewModel");

                if ("BSContent" in oState && oAppModel) {
                    oAppModel.setProperty("/BSContent", oState.BSContent ?? "");
                }

                if (oFileVM) {
                    oFileVM.setData(oState.fileViewData ?? {});
                    oFileVM.refresh(true);
                }
                // ---- if we have saved state, apply it ----
                this.executedOnce = oState.excOnce || false;
                // System message
                if (oView.byId("multiInputSystem")) {
                    oView.byId("multiInputSystem").setValue(oState.systemKey || "");
                }
                if (oView.byId("descTxtArea")) {
                    oView.byId("descTxtArea").setValue(oState.systemText || "");
                }
                if (oView.byId("descTxtArea")) {
                    oView.byId("descTxtArea").setEditable(oState.systemTextEditable || false);
                }

                // Prompt
                if (oView.byId("multiInputPrompt")) {
                    oView.byId("multiInputPrompt").setValue(oState.promptKey || "");
                }
                if (oView.byId("descTxtAreaPrompt")) {
                    oView.byId("descTxtAreaPrompt").setValue(oState.promptText || "");
                }
                if (oView.byId("descTxtAreaPrompt")) {
                    oView.byId("descTxtAreaPrompt").setEditable(oState.promptEditable || false);
                }
                // File select
                if (oView.byId("selDocList")) {
                    oView.byId("selDocList").setSelectedKey(oState.docKey || "");
                }
                if (oView.byId("docNameText")) {
                    oView.byId("docNameText")
                        .setText(oState.docNameText || "")
                        .setVisible(!!oState.docNameVisible);
                }
                if (oView.byId("viewDocBtn")) {
                    oView.byId("viewDocBtn").setVisible(!!oState.viewDocVisible);
                }

                //Add System
                // if (oView.byId("vbxSysAdd")) {
                //     oView.byId("vbxSysAdd").setVisible(oState.addVb || false);
                // }

                if (oView.byId("addSysPart")) {
                    oView.byId("addSysPart").setVisible(oState.addSysLabel || false);
                }
                if (oView.byId("addSysPrefix")) {
                    oView.byId("addSysPrefix").setValue(oState.addSys1st || "");
                }
                if (oView.byId("addSysPrefix")) {
                    oView.byId("addSysPrefix").setVisible(oState.addSys1stVis || false);
                }
                if (oView.byId("editSys")) {
                    oView.byId("editSys").setVisible(oState.editSysBtn || false);
                }

                if (oView.byId("saveSysBtn")) {
                    oView.byId("saveSysBtn").setVisible(oState.saveSysBtn || false);
                }
                //  if (oView.byId("addSysSuffix")) {
                //     oView.byId("addSysSuffix").setValue(oState.addSys2nd||"");
                // }

                //Add Prompt
                if (oView.byId("addPrPart")) {
                    oView.byId("addPrPart").setVisible(oState.addPrLabel || false);
                }
                if (oView.byId("addPrName")) {
                    oView.byId("addPrName").setValue(oState.addPromptName || "").setVisible(oState.addPromptNameVisible || false);
                }
                if (oView.byId("editPrm")) {
                    oView.byId("editPrm").setVisible(oState.editPrmBtn || false);
                }
                if (oView.byId("cancelPrmBtn")) {
                    oView.byId("cancelPrmBtn").setVisible(oState.cancelPrm || false);
                }
                if (oView.byId("savePrm")) {
                    oView.byId("savePrm").setVisible(oState.savePrmBtn || false);
                }
                ////bpm and tcg
                if (oView.byId("sapDocSel")) {
                    oView.byId("sapDocSel").setValue(oState.sapDocSelected || "");
                }
                if (oView.byId("tcTypeSel")) {
                    oView.byId("tcTypeSel").setValue(oState.tcTypeSelected || "");
                }
                ////DocGen - Document Type
                if (oView.byId("docTypeSelector")) {
                    oView.byId("docTypeSelector").setSelectedKey(oState.docTypeSelected || "");
                }
                // STEP 3: restore detail model for DetailDetail
                var oAiRespModel = this.getOwnerComponent().getModel("airesponseDetailModel");
                if (oAiRespModel) {
                    oAiRespModel.setProperty("/resp", oState.detailResp || "");
                    oAiRespModel.setProperty("/sysMsg", oState.detailSys || "");
                    // oAiRespModel.setProperty("/beforeResult", oState.before || "");
                    // oAiRespModel.setProperty("/codeResult", oState.code || "");
                    // oAiRespModel.setProperty("/afterResult", oState.after || "");
                    // oAiRespModel.setProperty("/codeType", oState.lang || "");
                    oAiRespModel.setProperty("/downloadVis", oState.btnVis || false);
                    oAiRespModel.setProperty("/multiCE", oState.codeEdResp);
                    oAiRespModel.setProperty("/codeEdVis", oState.codeeditorVisible || false);
                    oAiRespModel.setProperty("/citationArr", oState.citation || []);
                    oAiRespModel.refresh(true);

                }
                var histM = this.getOwnerComponent().getModel("historyModel");
                if (histM) {
                    //histM.setProperty("/promptHistory", oState.histPrompt || "");
                    histM.setProperty("/historyData", oState.histData || [])
                    // histM.setProperty("/aiResponseHistory", oState.histAIResp || "");
                }
                /////RAG
                // var ragModel = this.getOwnerComponent().getModel("ragModel");
                // if (ragModel) {
                //     ragModel.setProperty("/citationArr", oState.citation || []);
                //     //  ragModel.refresh(true);
                // }
                var oRagModel = this.getView().getModel("ragModel");
                if (oRagModel) {
                    oRagModel.setProperty("/currentRagEnabled", oState.ragEnabled);
                    ///oRagModel.setProperty("/ragFiles", Array.isArray(oState.ragFiles) ? oState.ragFiles : []);
                    oRagModel.setProperty("/ragFiles",
                        Array.isArray(oState.aRagFiles) ? JSON.parse(JSON.stringify(oState.aRagFiles)) : []
                    );
                    oRagModel.refresh(true);
                }

                var aMsgModel = this.getView().getModel("msgModel");
                if (aMsgModel) {
                    aMsgModel.setProperty("/aMsg", oState.updMsgs);
                    aMsgModel.refresh(true);
                }

                var TokenModel = this.getOwnerComponent().getModel("TokenLimit");
                if (TokenModel) {
                    TokenModel.setProperty("/usedToken", oState.currUsedTokens || "");
                    TokenModel.refresh(true);
                }
                ////ai models list
                var oViewModel = this.getView().getModel("viewModel");
                if (oViewModel) {
                    oViewModel.setProperty("/gptModels", oState.aiModels);
                    oViewModel.refresh(true);
                }
                if (oState.currUsedTokens == "") {
                    this.getView().getModel("TokenLimit").setProperty("/tokenVis", false);
                } else {
                    this.getView().getModel("TokenLimit").setProperty("/tokenVis", true);
                }
                if (oView.byId("RagSwitch")) {
                    oView.byId("RagSwitch").setSelected(!!oState.ragEnabled);
                }
                ////value state
                if (oView.byId("multiInputSystem")) {
                    oView.byId("multiInputSystem").setValueState(oState.valStateSys || "None");
                }
                if (oView.byId("multiInputPrompt")) {
                    oView.byId("multiInputPrompt").setValueState(oState.valStatePrompt || "None");
                }
                if (oView.byId("selDocList")) {
                    oView.byId("selDocList").setValueState(oState.valStateUpl || "None");
                }
                ///settings parameters

                this.savedSettings = oState.parsett || false;

                if (this.savedSettings == true) {
                    oViewModel.setProperty("/comnPopUpModelParamTemp", oState.savedTemperature || 0.7);
                    oViewModel.setProperty("/comnPopUpModelParamTopP", oState.savedTopP || 0.95);
                    oViewModel.setProperty("/comnPopUpModelParamMaxLength", oState.maxResponse || 4000);
                    oViewModel.setProperty("/comnPopUpModelParamFreqP", oState.freqPenalty || 0.1);
                    oViewModel.setProperty("/comnPopUpModelParamPresenceP", oState.prePenalty || 0.1);
                    // oViewModel.setProperty("/SelectedStopSequence",this._prePenalty || 0.7);
                    oViewModel.setProperty("/comnPopUpModelParamContextHist", oState.contextHist || 2);
                    // oViewModel.setProperty("/TokenCount", 0 ||);
                }

                ////git tab
                if (oView.byId("gitFileTree")) {
                    oView.byId("gitFileTree").setVisible(oState.gitTreeVis || false);
                }
                // if (oView.byId("viewGitFilebtn")) {
                //     oView.byId("viewGitFilebtn").setVisible(oState.gitGitfileViewVis || false);
                // }
                if (oView.byId("TemplateUploader")) {
                    oView.byId("TemplateUploader").setValue(oState.templateFileName || "");
                }

                this._selectedTemplateKey = oState.templateKey || "";

                if (oView.byId("selectedTemplateName")) {
                    oView.byId("selectedTemplateName")
                        .setText(oState.templateNameText || "");
                }

                if (oView.byId("templateInfoBox")) {
                    oView.byId("templateInfoBox")
                        .setVisible(!!oState.templateInfoVisible);
                }
                oView.getModel("viewModel").setProperty("/templateToggle", !!oState.templateToggleState);

                if (oView.byId("templateToggle")) {
                    oView.byId("templateToggle").setState(!!oState.templateToggleState);
                }
            }
        },
        resolveModelName: function (apiModelText) {

            const model = apiModelText?.toLowerCase();

            if (
                model === "anthropic--claude-3.5-sonnet" ||
                model === "anthropic--claude-3-haiku" ||
                model === "anthropic--claude-3-sonnet" ||
                model === "anthropic--claude-4.5-opus" ||
                model === "anthropic--claude-4-sonnet"
            ) {
                return "claude-opus4.5";
            }

            if (
                model === "gpt-5" ||
                model === "gpt-5-mini" ||
                model === "gpt-5-nano"
            ) {
                return "gpt5";
            }

            if (model === "mistralai--mistral-large-instruct") {
                return "mistral-large";
            }

            if (model === "mistralai--mistral-small-instruct") {
                return "mistral-small";
            }

            if (
                model === "gpt-4o" ||
                model === "gpt-4.1-nano" ||
                model === "gpt-4.1"
            ) {
                return "gpt-4o";
            }


            return null;
        },
        // end of  madhu
        // Start of Aishwarya for KnowledgeBase Search
        KBImpliment: async function () {
            ////rag call to AI with sys and prompt
            var that = this;
            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", false);
            var busyDialog = new sap.m.BusyDialog();
            var oView = that.getView();
            const sSelectedIconTab = this.selectedKeyFunct();
            const oResponseModel = this.getView().getModel("responseModel");
            var oViewModel = this.getView().getModel("viewModel").getData();
            var oToken, usedToken;
            var oBundle = this.getView().getModel("i18n").getResourceBundle();

            var sPromt = "", oTextArea = "", oUsage = "", sysMsg = "", fromattedtext = "", osysMsgVal = "", apiModelSelect = "", apiModelText = "", oPromtModel = null;

            oUsage = this.getView().getModel("TokenLimit").oData.usedToken;
            osysMsgVal = that.getView().byId("descTxtArea").getValue();
            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/sysMsg", osysMsgVal);
            this.getOwnerComponent().getModel("airesponseDetailModel").refresh();
            sysMsg = that.getView().byId("multiInputSystem").getValue();
            var promptMsgData = this.getView().byId("descTxtAreaPrompt").getValue();
            oTextArea = this.getOwnerComponent().getModel("airesponseDetailModel").oData.resp;
            fromattedtext = that.getView().byId("Citations");
            apiModelSelect = that.getView().byId("selModel").getSelectedKey();
            apiModelText = that.getView().byId("selModel").getValue();

            const oMsgModel = this.getView().getModel("msgModel");
            var oModel = this.getView().getModel("appmodel");
            var contentPath = "/BSContent";
            var sContent = oModel.getProperty(contentPath);
            if (sContent == undefined) {
                sContent = null;
            }
            const oContent = sContent + "\n" + promptMsgData;
            var aMsgContentSystemDesc = this.getView().byId("descTxtArea").getValue();
            var aMessages = [
                {
                    "role": "system",
                    "content": aMsgContentSystemDesc
                },
                {
                    "role": "user",
                    "content": oContent
                }
            ];
            this.getView().getModel("msgModel").setProperty("/aMsg", aMessages);

            if (sSelectedIconTab == "BPM" || sSelectedIconTab == "PCT") {
                var reupload = false;
                var airesp = this.getView().getModel("airesponseDetailModel").getProperty("/resp");
                aMessages = Utility.transformSysMsgforTScenarios(aMessages, sContent, promptMsgData, reupload, this.step, airesp, aMsgContentSystemDesc);
                this.getView().getModel("msgModel").setProperty("/aMsg", aMessages);
                if (sSelectedIconTab == "PCT") {
                    this.onPctStepOutput(aMessages);
                }
            }
            var oPromptModel = this.getView().getModel("BSPromptData");
            var isUserContent = this.getView().getModel("viewModel").getProperty("/bFileContentChanged");
            isUserContent = true;
            if (!isUserContent && (!promptMsgData || promptMsgData === "")) {
                MessageBox.warning(oBundle.getText("userInputMsg"));

                return;
            }
            var localData = oPromptModel.getData();
            var existsInLocalData = localData.some(item => item.PROMPT_TEMPLATE === promptMsgData);


            var isFirstResponse = true;
            Utility.createAndFetchPromptDetails(
                promptMsgData,
                sSelectedIconTab,
                existsInLocalData,
                this,
                oPromptModel,
                oBundle,
                isFirstResponse
            );

            var oViewModel = this.getView().getModel("viewModel");
            var payload = Utility.createPayloadBasedOnModel(apiModelText, aMessages, oViewModel, this);

            // Resolve modelName: updating the model name fro KB payload
            const resolvedModelName = this.resolveModelName(apiModelText);

            // Update payload ONLY if mapping exists
            if (resolvedModelName) {
                // payload.modelName = resolvedModelName;
            }

            var apiKMUrl = "";
            var oPayload = {};
            var ceArr = [];
            apiKMUrl = this.KBModelSelect(apiModelText);
            if (apiKMUrl == false) {
                MessageBox.error(oBundle.getText("kbAIModelMsg"));
            } else {
                oPayload = {
                    category: sSelectedIconTab,
                    project: this._ProjectDetail,
                    prompt: promptMsgData,
                    streaming: true,
                    modelName: resolvedModelName,
                    modelPayload: JSON.stringify(payload)
                };

                var keytoSend = this.getView().getModel("selKeyForDetailDetail").getProperty("/keyD");
                var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;

                this.oRouter.navTo("DetailDetail", { dispKey: keytoSend, aimodel: selectedAI, layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded });

                try {
                    busyDialog.open();

                    const response = await fetch(apiKMUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...this.defaultHeaders
                        },
                        body: JSON.stringify(oPayload)
                    });

                    if (!response.ok) {
                        const errText = await response.text().catch(() => "");
                        throw new Error(`HTTP ${response.status}: ${errText || response.statusText}`);
                    }
                    if (sSelectedIconTab == "PCT") {
                        that.getView().byId("nextBtn").setVisible(true);
                        that.getView().byId("pctSysMsgBtn").setVisible(true);
                        if (that.step == "Step2" && sSelectedIconTab == "PCT") {
                            // that.getView().byId("prgIndicator").setPercentValue("60%");
                            // that.getView().byId("prgIndicator").setDisplayValue("Step3");
                            // that.step = "Step3";
                            MessageBox.information(oBundle.getText("nextMsg"));
                        } else if (that.step == "Step3" && sSelectedIconTab == "PCT") {
                            that.getView().byId("prgIndicator").setPercentValue("100%");
                            that.getView().byId("prgIndicator").setDisplayValue("Completed");
                            that.getView().byId("nextBtn").setVisible(false);
                            // that.onPctStepOutput(reAMessages);
                            MessageBox.success("All Steps Completed!");
                            that.step = "Step1"; ///initializing again
                        }
                    }
                    // ======== STREAMING ========
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();

                    const oDetailModel = this.getOwnerComponent().getModel("airesponseDetailModel");
                    const oTokenModel = this.getView().getModel("TokenLimit");

                    const tokenPath = `/${sSelectedIconTab}/${apiModelText}`;

                    const tokenDefaults = oTokenModel.getProperty(tokenPath) || { TotalToken: 0, UsageToken: 0 };
                    oTokenModel.setProperty(tokenPath, tokenDefaults);
                    oTokenModel.refresh(true);

                    if (oDetailModel) {
                        oDetailModel.setProperty("/resp", "");
                        oDetailModel.setProperty("/citationArr", []);
                        oDetailModel.refresh(true);
                    }

                    let buffer = "";
                    let finalText = "";
                    let usedToken = 0;
                    const streamedEvents = [];
                    let hasShownFirstToken = false;

                    const parseLine = (line) => {
                        const trimmed = (line || "").trim();
                        if (!trimmed) return null;
                        if (trimmed === "[DONE]") return { type: "done" };
                        const payloadStr = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed;
                        try { return JSON.parse(payloadStr); } catch { return null; }
                    };

                    const pushCitations = (meta) => {
                        if (!meta || !oDetailModel) return;
                        const arr = Array.isArray(meta) ? meta : (typeof meta === "object" ? [meta] : []);
                        const existing = oDetailModel.getProperty("/citationArr") || [];
                        arr.forEach((item) => {
                            if (!item) return;
                            const filePath = item.source || item.file_path || "";
                            const fileName = filePath ? filePath.split("/").pop() : (item.file_name || "Unknown");
                            const viewUrl = item.view_url || item.url || "";
                            const key = `${fileName}|${viewUrl}`;
                            if (!existing.some(c => `${c.fname}|${c.link}` === key)) {
                                existing.push({ link: viewUrl, fname: fileName });
                            }
                        });
                        oDetailModel.setProperty("/citationArr", existing);
                        oDetailModel.refresh(true);
                    };

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });

                        const lines = buffer.split("\n");
                        buffer = lines.pop() || ""; // keep partial line

                        for (const line of lines) {
                            const evt = parseLine(line);
                            if (!evt) continue;
                            streamedEvents.push(evt);
                            if (!hasShownFirstToken && (evt.type === "content" || evt.type === "completion" || evt?.data?.metadata)) {
                                hasShownFirstToken = true;
                                try { busyDialog.close(); } catch (e) { }
                                try { BusyIndicator.hide(); } catch (e) { }
                            }

                            // Stream content per token/word
                            if (evt.type === "content" && evt?.data?.chunk && oDetailModel) {
                                finalText += evt.data.chunk;               // preserves backend spacing
                                oDetailModel.setProperty("/resp", finalText);
                                oDetailModel.refresh(true);
                                if (evt?.data?.metadata) pushCitations(evt.data.metadata);
                            }


                            // Live tokens: update whenever token_usage appears
                            if (evt?.data?.token_usage) {
                                const usage = evt.data.token_usage;
                                if (typeof usage.total_tokens === "number") {
                                    usedToken = usage.total_tokens;
                                    oTokenModel.setProperty(`${tokenPath}/UsageToken`, usedToken);
                                    oTokenModel.refresh(true);
                                    if (oTokenModel.updateBindings) oTokenModel.updateBindings(true);
                                }
                            }

                            if (evt?.data?.metadata && evt.type !== "content") {
                                pushCitations(evt.data.metadata);
                            }
                        }
                    }

                    if (buffer.trim()) {
                        const evt = parseLine(buffer);
                        if (evt) {
                            streamedEvents.push(evt);
                            if (!hasShownFirstToken && (evt.type === "content" || evt.type === "completion" || evt?.data?.metadata)) {
                                hasShownFirstToken = true;
                                try { busyDialog.close(); } catch (e) { }
                                try { BusyIndicator.hide(); } catch (e) { }
                            }
                            if (evt.type === "content" && evt?.data?.chunk && oDetailModel) {
                                finalText += evt.data.chunk;
                                oDetailModel.setProperty("/resp", finalText);
                                oDetailModel.refresh(true);
                            }
                            if (evt?.data?.metadata) pushCitations(evt.data.metadata);
                            if (evt?.data?.token_usage) {
                                const usage = evt.data.token_usage;
                                if (typeof usage.total_tokens === "number") {
                                    usedToken = usage.total_tokens;
                                    oTokenModel.setProperty(`${tokenPath}/UsageToken`, usedToken);
                                    oTokenModel.refresh(true);
                                    if (oTokenModel.updateBindings) oTokenModel.updateBindings(true);
                                }
                            }
                        }
                    }

                    // if (sSelectedIconTab == "PCT") {
                    //     that.getView().byId("nextBtn").setVisible(true);
                    //     MessageBox.information(oBundle.getText("nextMsg"));

                    // }

                    // ======== END STREAMING ========
                    busyDialog.close();

                    const safeEvents = Array.isArray(streamedEvents) ? streamedEvents : [];
                    const { message: oResMsg, usedTokens: oUsedToken, rawText: sResponse } =
                        await this.KnowledgeBase(safeEvents, busyDialog);

                    var codeLanguage = "";
                    //scenario == "coderem" ||
                    if (sSelectedIconTab == "tstocode") {
                        var resArr = oResMsg.content.split("```");
                        for (var h = 0; h < resArr.length; h++) {
                            if (resArr[h + 1] !== undefined) {
                                var lang = resArr[h + 1].split("\n")[0];
                                codeLanguage = lang.split("```")[1];
                                ceArr.push({ textData: resArr[h], codeData: "```" + resArr[h + 1], lang: codeLanguage });
                                h++;
                            }
                            else {
                                ceArr.push({ textData: resArr[h], codeData: "", lang: "" });
                            }
                        }
                        that.getView().getModel("airesponseDetailModel").setProperty("/multiCE", ceArr);
                    }
                    var tokenData = this.getView().getModel("TokenLimit").oData;
                    var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;
                    var scenario = this.selectedKeyFunct();
                    var tknUsed = tokenData[scenario][selectedAI].TotalToken;
                    this.getView().getModel("TokenLimit").setProperty("/token", tknUsed);

                    this.getView().getModel("TokenLimit").setProperty("/usedToken", oUsedToken);
                    this.getView().getModel("TokenLimit").setProperty("/tokenVis", true);
                    // }
                    this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", true);
                    const fileCont = true;
                    Utility.handleTabResponseDynamic(
                        sSelectedIconTab,
                        this,
                        sResponse,
                        oResMsg,
                        promptMsgData,
                        oUsedToken,
                        oToken,
                        oViewModel,
                        fileCont
                    );
                    this.sendTokenUsageLog(usedToken, promptMsgData);

                } catch (error) {
                    MessageBox.error("error");
                } finally {
                    busyDialog.close();
                }
            }
        },
        KnowledgeBase: async function (aResponse, busyDialog) {
            ////payload nonstream? check ////function working
            ////final resp creation and chunk streaming
            var sSelectedIconTab = this.selectedKeyFunct();
            const chunks = Array.isArray(aResponse)
                ? aResponse.filter(item => item?.type === "content" && item?.data?.chunk)
                    .map(item => item.data.chunk)
                : [];

            const finalJoined = chunks.join("");
            const firstWithMetadata = Array.isArray(aResponse)
                ? aResponse.find(it => it?.data?.metadata)
                : null;
            const metadataRaw = firstWithMetadata?.data?.metadata;
            const metadataArr = Array.isArray(metadataRaw)
                ? metadataRaw
                : (metadataRaw && typeof metadataRaw === "object" ? [metadataRaw] : []);

            const citationIndex = [];
            metadataArr.forEach((item) => {
                if (!item) return;
                const filePath = item.source || item.file_path || "";
                const filename = filePath ? filePath.split("/").pop() : (item.file_name || "Unknown");
                // const viewUrl = item.view_url || item.url || "";
                // if (viewUrl || fileName) citationIndex.push({ link: viewUrl, fname: fileName });
                const link = item.sharepoint_link && item.sharepoint_link !== "null" ? item.sharepoint_link : (item.view_url || item.url || "");
                if (link || filename) { citationIndex.push({ link: link, fname: filename }); }
            });

            const oDetailModel = this.getOwnerComponent().getModel("airesponseDetailModel");

            if (oDetailModel) {
                if (citationIndex.length) {
                    const existing = oDetailModel.getProperty("/citationArr") || [];
                    const merged = [...existing];
                    citationIndex.forEach(c => {
                        const key = `${c.fname}|${c.link}`;
                        if (!merged.some(m => `${m.fname}|${m.link}` === key)) merged.push(c);
                    });
                    oDetailModel.setProperty("/citationArr", merged);
                }
                const current = oDetailModel.getProperty("/resp") || "";
                const next = current && finalJoined && !current.endsWith(finalJoined)
                    ? current + finalJoined
                    : (current || finalJoined);

                oDetailModel.setProperty("/resp", next);
                oDetailModel.refresh(true);
            }

            const completionData = Array.isArray(aResponse)
                ? aResponse.find(item => item?.type === "completion")
                : null;
            const oUsedToken = completionData?.data?.token_usage?.total_tokens || 0;

            const finalText = oDetailModel ? (oDetailModel.getProperty("/resp") || finalJoined) : finalJoined;
            return {
                message: {
                    role: "assistant",
                    content: finalText
                },
                usedTokens: oUsedToken,
                rawText: finalText
            };
        },
        _parseNdjsonOrJsonText: function (rawText) {
            if (!rawText || typeof rawText !== "string") return [];

            // Try NDJSON first (one JSON object per line)
            const lines = rawText.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
            const ndjson = [];
            let allJson = true;
            for (const line of lines) {
                try { ndjson.push(JSON.parse(line)); }
                catch (e) { allJson = false; break; }
            }
            if (allJson && ndjson.length) return ndjson;

            // Try single pretty-printed JSON
            try { return [JSON.parse(rawText)]; }
            catch (e) { /* ignore */ }

            // Fallback: plain text wrapped
            return [{ type: "text/plain", content: rawText }];
        },
        KBModelSelect: function (apiModelText) {

            switch (apiModelText) {
                case "gpt-5":
                case "gpt-4o":
                case "gpt-4.1":
                case "gpt-4.1-nano":
                case "gpt-5-mini":
                case "gpt-5-nano":
                case "anthropic--claude-3.5-sonnet":
                case "anthropic--claude-4.5-sonnet":
                case "anthropic--claude-4-sonnet":
                case "anthropic--claude-3-haiku":
                case "anthropic--claude-3-sonnet":
                case "anthropic--claude-4.5-opus":
                case "mistralai--mistral-small-instruct":
                case "mistralai--mistral-large-instruct":
                    return this._sBasePath + `/kb-integration/ragquery`;
                default:
                    return "";
            }

        },
        ragHandleUploadPress: function () {
            var that = this;
            var sProject = this._ProjectDetail;
            var sUserName = this._loggedInUserName;
            var popUpSel = this.getView().getModel("switchFragments").getProperty("/frg/frName");
            var oFileUploader = "";
            var sSelectedIconTab = "";
            if (popUpSel == "knowlBAdmin") {
                if (this.getView().byId("categorySelect")) {
                    sSelectedIconTab = this.getView().byId("categorySelect").getSelectedKey();
                    oFileUploader = this.getView().byId("fileUploaderKBAdmin");
                }
            } else {
                sSelectedIconTab = this.selectedKeyFunct();
                oFileUploader = this.getView().byId("fileUploader1");
                this.getView().byId("viewDocBtn").setVisible(false);
                this.getView().byId("docNameText").setVisible(false);
            }
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var aFiles = (oFileUploader && oFileUploader.oFileUpload && oFileUploader.oFileUpload.files) ? oFileUploader.oFileUpload.files : [];



            if (!aFiles || aFiles.length === 0) {
                ////   sap.m.MessageBox.success(oBundle.getText("fileUpload"));
                sap.m.MessageToast.show(oBundle.getText("fileUpload"));
                return;
            }

            var allowedFileTypes = ["txt", "pdf", "docx", "doc"];
            var formData = new FormData();

            for (var i = 0; i < aFiles.length; i++) {
                var oFile = aFiles[i];
                var fileExtension = oFile.name.split('.').pop().toLowerCase();
                if (allowedFileTypes.indexOf(fileExtension) === -1) {
                    sap.m.MessageBox.error(oBundle.getText("allowedFileTypes"));
                    return;
                }
                formData.append('files', oFile);
            }
            formData.append('category', sSelectedIconTab);
            formData.append('project', this._ProjectDetail);
            formData.append('KB', true);
            formData.append('overwrite', 'false'); // initial pass
            var busyDialog = new sap.m.BusyDialog();
            // https://KMDevCockpitIntegrationApp.cfapps.eu10.hana.ondemand.com/UploadToObjectStore",
            /// https://KMDevCockpitIntegrationAppV2.cfapps.eu10.hana.ondemand.com/UploadToObjectStore
            busyDialog.open();

            $.ajax({
                url: this._sBasePath + "/kb-integration/UploadToObjectStore",
                method: "POST",
                processData: false,
                contentType: false,
                data: formData,
                success: function (data) {
                    busyDialog.close();
                    var oFileModel = that.getView().getModel("fileModel");
                    var currentFiles = oFileModel.getProperty("/" + sSelectedIconTab) || [];
                    currentFiles.push.apply(currentFiles, data.extracted_contents || []);
                    oFileModel.setProperty("/" + sSelectedIconTab, currentFiles);
                    var ragModel = that.getView().getModel("ragModel");

                    var aNormalized = (currentFiles || []).map(function (x) {
                        var sKey = x.s3_key || "";
                        var sFileName = x.filename || "";
                        var extracted_content = x.extracted_value || "";

                        return {
                            Key: sKey,
                            Name: sFileName,
                            filename: sFileName,
                            content: extracted_content
                        };
                    });
                    if (popUpSel == "knowlBAdmin") {
                        /// sap.m.MessageBox.success(oBundle.getText("successFileUpload"));
                        sap.m.MessageToast.show(oBundle.getText("successFileUpload"));
                        var catSel = that.getView().byId("categorySelect").getSelectedKey();
                        // var url = this._sBasePath + "/lm/promptTemplates?scenario=" + catSel + "&version=0.0.1";
                        // var roleSel = "system"
                        //  that.onSearch(url, roleSel);
                        that.loadKnowlBAdminFiles(sSelectedIconTab, sProject, sUserName);
                        that.getView().byId("kbTable").getBinding("items").refresh();
                    } else {
                        ragModel.setProperty("/ragFiles", aNormalized);
                        ragModel.refresh(true);
                        that._bUploadedViaRag = true;
                        ////sap.m.MessageBox.success(oBundle.getText("successFileUpload"));
                        sap.m.MessageToast.show(oBundle.getText("successFileUpload"));
                    }
                    // ragModel.setProperty("/ragFiles", aNormalized);
                    // ragModel.refresh(true);
                    // that._bUploadedViaRag = true;
                    // sap.m.MessageBox.success(oBundle.getText("successFileUpload"));

                },
                error: function (jqXHR) {
                    var resp = jqXHR.responseJSON;
                    try {
                        if (!resp && jqXHR.responseText) {
                            resp = JSON.parse(jqXHR.responseText);
                        }
                    } catch (e) { }
                    if (jqXHR.status === 409 && resp && resp.status === "confirmation_required") {
                        var filesNeedingConfirm = (resp.files_requiring_confirmation || []).map(function (f) { return f.filename; });
                        var msg = (resp.message || oBundle.getText("successFileUpload"));
                        if (filesNeedingConfirm.length) {
                            msg = oBundle.getText("fileExistsConfirm", [filesNeedingConfirm.join(", ")]);
                        }
                        busyDialog.close();
                        sap.m.MessageBox.confirm(
                            msg,
                            {
                                actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                                onClose: function (oAction) {
                                    if (oAction === sap.m.MessageBox.Action.OK) {
                                        var formData2 = new FormData();
                                        for (var i = 0; i < aFiles.length; i++) {
                                            formData2.append('files', aFiles[i]);
                                        }
                                        formData2.append('category', sSelectedIconTab);
                                        formData2.append('project', that._ProjectDetail);
                                        formData2.append('KB', true);
                                        formData2.append('overwrite', 'true'); // overwrite pass

                                        busyDialog.open();
                                        $.ajax({
                                            url: this._sBasePath + "/kb-integration/UploadToObjectStore",
                                            method: "POST",
                                            processData: false,
                                            contentType: false,
                                            data: formData2,
                                            dataType: "json",

                                            success: function (data2) {
                                                var oFileModel = that.getView().getModel("fileModel");
                                                var currentFiles = oFileModel.getProperty("/" + sSelectedIconTab) || [];
                                                currentFiles.push.apply(currentFiles, data2.extracted_contents || []);
                                                oFileModel.setProperty("/" + sSelectedIconTab, currentFiles);
                                                var ragModel = that.getView().getModel("ragModel");

                                                var aNormalized = (currentFiles || []).map(function (x) {
                                                    var sKey = x.s3_key || "";
                                                    var sFileName = x.filename || "";
                                                    var extracted_content = x.extracted_value || "";

                                                    return {
                                                        Key: sKey,
                                                        Name: sFileName,
                                                        filename: sFileName,
                                                        content: extracted_content
                                                    };
                                                });
                                                ragModel.setProperty("/ragFiles", aNormalized);
                                                ragModel.refresh(true);
                                                that._bUploadedViaRag = true;
                                                /// sap.m.MessageBox.success(oBundle.getText("successFileUpload"));
                                                sap.m.MessageToast.show(oBundle.getText("successFileUpload"));

                                                busyDialog.close();
                                            },
                                            error: function () {
                                                busyDialog.close();
                                                sap.m.MessageBox.error(oBundle.getText("errorFileUpload"));
                                            }
                                        });
                                    } else {
                                    }
                                }
                            }
                        );

                    } else {
                        busyDialog.close();
                        sap.m.MessageBox.error(oBundle.getText("errorFileUpload"));
                    }
                    //sap.m.MessageBox.error(oBundle.getText("errorFileUpload"));
                }
            });
        },

        onRagFileSelect: function (oEvent) {
            /// file list pop up select and upload
            var oSelObj = oEvent.getSource().getBindingContext("ragModel").getObject();
            this.getView().getModel("fileViewModel").setData({
                Key: oSelObj.Key,
                Name: oSelObj.Name,
                srcUrl: oSelObj.srcUrl || ""
            });
            this.getView().getModel("fileViewModel").refresh(true);
            this.getView().byId("docNameText").setText(oSelObj.Name);
            this.getView().byId("docNameText").setVisible(true);
            this.getView().byId("viewDocBtn").setVisible(true);
        },

        onRagPreviewPress: function (oEvent) {
            ////upload and file selected
            var sSelectedIconTab = this.selectedKeyFunct();
            var aFiles = this.getView().getModel("fileModel").getProperty("/" + sSelectedIconTab) || [];
            var oRowObj = oEvent.getSource().getBindingContext("ragModel").getObject();
            var sFileName = oRowObj.filename || oRowObj.Name;

            var oFile = aFiles.find(function (f) {
                return (f.filename || f.FileName || f.Name) === sFileName;
            });

            if (!oFile) {
                sap.m.MessageBox.error("previewErr");
                return;
            }

            var sExt = (sFileName || "").split(".").pop().toLowerCase();

            var sKey = "/" + oFile.s3_key || oFile.Key || oFile.objectStoreRefKey || oFile.key || "";
            var oFileModel = this.getView().getModel("fileModel");
            var arrofExtCont = oFileModel.oData[sSelectedIconTab].filter(item => item.s3_key === oFile.s3_key);

            if (sExt === "pdf") {
                this.getView().getModel("fileViewModel").setData({
                    Key: sKey,
                    Name: sFileName,
                    srcUrl: "",
                    content: arrofExtCont[0].extracted_value
                });
                var oModel = this.getView().getModel("appmodel");
                oModel.setProperty("/BSContent", arrofExtCont[0].extracted_value);
                this.viewDoc();
                return;
            }

            var sText = oFile.extracted_value || oFile.content || oFile.text || "";
            sText = (sText || "").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();

            this.getView().getModel("appmodel").setProperty("/BSContent", sText);
            this.getView().getModel("fileViewModel").setData({
                Key: "",
                Name: sFileName,
                srcUrl: ""
            });

            this.viewDoc();

        },

        onRagToggle: function () {
            var bSelected = this.getView().byId("RagSwitch").getSelected();
            var oRagModel = this.getView().getModel("ragModel");
            var oDetailModel = this.getOwnerComponent().getModel("airesponseDetailModel");

            oRagModel.setProperty("/currentRagEnabled", bSelected);

            if (!bSelected) {
                oRagModel.setProperty("/ragFiles", []);
                oRagModel.refresh(true);

                oDetailModel.setProperty("/citationArr", []);
                oDetailModel.refresh(true);
            }
            var oViewModel = this.getView().getModel("viewModel");
            var existingAImodels = oViewModel.getProperty("/gptModels");
            var bRagEnabled = this.getView().byId("RagSwitch").getSelected();

            if (bRagEnabled) {
                //   this.getView().byId("docNameText").setVisible(false);
                //   this.getView().byId("viewDocBtn").setVisible(false);
                var filteredModels = existingAImodels.filter(item => (item.text === "gpt-5" || item.text === "gpt-4o" || item.text === "anthropic--claude-3.5-sonnet" || item.text === "mistralai--mistral-small-instruct" || item.text === "mistralai--mistral-large-instruct"));
                oViewModel.setProperty("/gptModels", filteredModels);
            } else {
                oViewModel.setProperty("/gptModels", this.allAIModels);
                // this.getView().byId("selModel").setSelectedKey("d7bcd076748c9c61");
            }
        },
        // End of Aishwarya for Chatbot
        adminPromptsUsed: function (event) {
            var that = this;
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            this.getView().getModel("switchFragments").setProperty("/frg/frName", "promptsUsed");
            var oRowData = event.getSource().getBindingContext("UserloginModel").getObject();
            if (oRowData.totalTokensConsumed == 0) {
                MessageBox.information(oBundle.getText("noPrmUsedData"));
                this.onBack();
            } else {
                this.getView().byId("adminPanel").setVisible(true);
                this.getView().byId("idUserLogTable").setVisible(false);
                this.getView().byId("filterBar1").setVisible(false);
                var completeDate = event.getSource().getBindingContext("UserloginModel").getObject().date;
                var year = completeDate.split("/")[2];
                var month = completeDate.split("/")[1];
                var dd = completeDate.split("/")[0];
                var finalDate = year + "-" + month + "-" + dd + "T00:00:00Z"
                var payload = {
                    "project": event.getSource().getBindingContext("UserloginModel").getObject().project,
                    "user_id": event.getSource().getBindingContext("UserloginModel").getObject().EMAIL_ID,
                    "date_added": finalDate
                };
                var promptsUsedDetail = new sap.ui.model.json.JSONModel([]);
                this.getView().setModel(promptsUsedDetail, "promptsUsedDetail");
                this.getView().getModel("promptsUsedDetail").refresh();

                $.ajax({
                    url: this._sBasePath + '/cockpit/getPromptDetailsofUser2_0',
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(payload),
                    success: function (data, status, xhr) {
                        console.log(data);
                        that._handlePromptDetailsSuccess(data);
                        that.getView().getModel("promptsUsedDetail").refresh();
                    },
                    error: function (jqXhr, textStatus, errorMessage) {
                        console.log("Error");
                        console.log(JSON.parse(jqXhr.responseText).error.message);
                    }
                });
            }
        },
        onBack: function () {
            this.getView().getModel("switchFragments").setProperty("/frg/frName", "admin");
            this.getView().byId("adminPanel").setVisible(false);
            this.getView().byId("idUserLogTable").setVisible(true);
            this.getView().byId("filterBar1").setVisible(true);
        },

        ////amplifier
        onSapDocSel: function (sEve) {
            this.setBPMKey = sEve.getSource().getSelectedKey();
            var selectedKey = sEve.getSource().getSelectedKey();
            this.setBPMKey = selectedKey;      // BPM key
            this._currentSelectionKey = selectedKey; // COMMON key (important)

            this.isSystemSaved = true;
            BusyIndicator.show();
            this.onRefresh();
            this.getDataSysMsg();
        },
        onTCTypeSel: function (sEve) {
            this.isSystemSaved = true;
            this.setTCGKey = sEve.getSource().getSelectedKey();
            var selectedKey = sEve.getSource().getSelectedKey();
            this._currentSelectionKey = selectedKey;
            var selection = "";
            if (sEve.getSource().getSelectedItem().mProperties.text == "Positive") {
                selection = "positive_scenario";
            }
            else if (sEve.getSource().getSelectedItem().mProperties.text == "Negative") {
                selection = "negative_scenario";
            }
            else if (sEve.getSource().getSelectedItem().mProperties.text == "Boundary") {
                selection = "boundary_scenario";
            }
            this.getView().getModel("tcgModel").setProperty("/selVal", selection);
            // to avoid multiple calls

            var oModel = this.getView().getModel("BSData");

            if (oModel) {
                var data = oModel.getProperty("/messages");

                var selectedObj = data.find(item => item.UUID === selectedKey);

                if (selectedObj) {
                    this.getView().byId("multiInputSystem")
                        .setValue(selectedObj.NAME);

                    this.getView().byId("descTxtArea")
                        .setValue(selectedObj.PROMPT_TEMPLATE);

                    return; //  no API call needed
                }
            }

            BusyIndicator.show();
            this.onRefresh();
            this.getDataSysMsg();
        },
        onNext: function () {
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var pctStepArr = this.getView().getModel("stepModel").getProperty("/output");
            if (this.step == "Step1") {
                this.step = "Step2";
                this.getView().byId("prgIndicator").setPercentValue("30%");
                this.getView().byId("prgIndicator").setDisplayValue("Step2");
                MessageBox.information(oBundle.getText("goNextStep"));
            } else if (this.step == "Step2") {
                var isStep2 = pctStepArr.filter(item => (item.step == "Step2"));
                if (isStep2.length == 0 && this.step == "Step2") {
                    MessageBox.information(oBundle.getText("goNextStep"));
                }
                else {
                    if (this.getView().byId("prgIndicator").getPercentValue() == "30%") {
                        MessageBox.information(oBundle.getText("goNextStep"));
                    } else {
                        this.step = "Step3";
                        this.getView().byId("prgIndicator").setPercentValue("60%");
                        this.getView().byId("prgIndicator").setDisplayValue(this.step);
                        // this.getView().byId("nextBtn").setVisible(false);
                        MessageBox.information(oBundle.getText("goNextStep3"));
                    }
                }
            } else if (this.step == "Step3") {
                MessageBox.information(oBundle.getText("goNextStep3"));
            }
            this.getDataSysMsg();

        },
        openTCGTemplateFragment: async function () {
            BusyIndicator.show();
            var that = this;
            if (!this.TCGtemplate) {
                this.TCGtemplate = await this.loadFragment({
                    name: "aicockpitfeq.fragment.TCGFreeText"
                }).then(function (oDialog) {
                    this.TCGtemplate = oDialog;
                    this.TCGtemplate.attachBrowserEvent("keydown", function (oEvent) {
                        if (oEvent.key === "Escape") {
                            oEvent.stopPropagation();
                            oEvent.preventDefault();
                        }
                    });
                    oDialog.open();
                    BusyIndicator.hide();

                }.bind(this));
            } else {
                BusyIndicator.hide();
            }
        },
        saveTcgFreeText: function () {
            ///keep as it is
            this.getView().byId("selDocList").setValueState("None");
            for (var i = 0; i < this.getView().getDependents().length; i++) {
                if (this.getView().getDependents()[i]._dialog) {
                    this.getView().getDependents()[i]._dialog.close();
                } else {
                    this.getView().getDependents()[i].close();
                }
            }
        },

        saveTCGInfo: function () {
            var oFileUploader = this.getView().byId("fileUploader1");
            this.getView().byId("viewDocBtn").setVisible(false);
            this.getView().byId("docNameText").setVisible(false);
            var aFiles = (oFileUploader && oFileUploader.oFileUpload && oFileUploader.oFileUpload.files) ? oFileUploader.oFileUpload.files : [];
            this.getView().byId("docNameText").setText("Template");
            this.getView().byId("docNameText").setVisible(true);
            this.getView().byId("viewDocBtn").setVisible(true);
            this.closeSysKeyFr();
        },
        onopenPCTsysFrg: async function () {
            if (!this.pctFrg) {
                this.pctFrg = await this.loadFragment({
                    name: "aicockpitfeq.fragment.PCTStepAIOutputs"
                }).then(function (oDialogPCT) {
                    this.pctFrg = oDialogPCT; // Store the dialog instance
                    this.getView().addDependent(oDialogPCT);
                    oDialogPCT.open();
                }.bind(this));
            } else {
                this.pctFrg.open(); // Reuse the existing instance
            }
        },
        onPctStepOutput: function (aMsg) {
            var opt = this.getView().getModel("stepModel").getProperty("/output");
            var airesp = this.getView().getModel("airesponseDetailModel").getProperty("/resp");
            for (var m = 0; m < aMsg.length; m++) {
                opt.push({ step: this.step, sysMessage: aMsg[m].content, aiResponsePCT: airesp });
            }
            this.getView().getModel("stepModel").setProperty("/output", opt);
        },
        onKbRefresh: function () {
            sap.ui.core.BusyIndicator.show(0);
            var sCategory = this.byId("categorySelect").getSelectedKey();
            var sProject = this._ProjectDetail;
            var sUserName = this._loggedInUserName;
            var that = this;
            this.loadKnowlBAdminFiles(sCategory, sProject, sUserName)
                .finally(function () {
                    sap.ui.core.BusyIndicator.hide();
                });
        },
        openGit: async function () {
            var that = this;
            var setTitleofDialog = this.getOwnerComponent().getModel("gitModel").getProperty("/gitAddDet");

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
                    this.getView().byId("commitGitBtn").setVisible(false);
                    this.getView().byId("gitCommit").setVisible(false);
                    this.getView().byId("gitInfo").setVisible(true);
                    this.getView().byId("getBranchBtn").setVisible(true);
                    this.getView().byId("gitDialog").setTitle(setTitleofDialog);
                    oDialog.open();
                }.bind(this));
            } else {

            }
        },
        getBranch: function () {
            var that = this;
            BusyIndicator.show();
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var giturl = this.getView().byId("gitRepoURL").getValue();
            var gituser = this.getView().byId("gitUserName").getValue();
            var gittoken = this.getView().byId("gitPATToken").getValue();

            this.getOwnerComponent().getModel("gitModel").setProperty("/repoUrl", giturl);
            this.getOwnerComponent().getModel("gitModel").setProperty("/username", gituser);
            this.getOwnerComponent().getModel("gitModel").setProperty("/patToken", gittoken);
            this.getOwnerComponent().getModel("gitModel").setProperty("/emailId", this._loggedInUser);
            this.getOwnerComponent().getModel("gitModel").setProperty("/branches", []);
            if (giturl == "" || gituser == "" || gittoken == "") {
                BusyIndicator.hide();
                MessageBox.error(oBundle.getText("missingGitDetails"));
            } else {
                jQuery.ajax({
                    url: this._sBasePath + "/cockpit/getAllBranches",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify({
                        payload: {
                            repo: giturl,
                            username: gituser,
                            token: gittoken
                        }
                    }),
                    success: function (data) {
                        var branches = data.value.map(function (branchName) {
                            return {
                                key: branchName,
                                name: branchName
                            };
                        });
                        that.getOwnerComponent().getModel("gitModel").setProperty("/branches", branches);
                        if (branches && branches.length > 0) {
                            that.getOwnerComponent().getModel("gitModel").setProperty("/selectedBranch", branches[0].key);
                            that.getView().byId("branchSel").setSelectedKey(branches[0].key);
                            that.loadGitTreeData(branches[0].key, giturl, gituser, gittoken);
                        }
                        BusyIndicator.hide();
                        that.closeSysKeyFr();
                    },
                    error: function (error) {
                        MessageBox.error(JSON.parse(error.responseText).error.message);
                        console.error("Failed to load Git tree data", JSON.parse(error.responseText).error.message);
                        BusyIndicator.hide();
                        that.closeSysKeyFr();
                    }
                });
            }

        },
        loadGitTreeData: function (sSelectedBranch, sGitRepo, sGitUsername, SGitToken) {
            var that = this;
            BusyIndicator.show();
            jQuery.ajax({
                url: this._sBasePath + "/cockpit/getGitRepoTreeStructure",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                    payload: {
                        branchName: sSelectedBranch,
                        repo: sGitRepo,
                        username: sGitUsername,
                        token: SGitToken
                    }
                }),
                success: function (data) {
                    that.getOwnerComponent().getModel("gitModel").setProperty("/gitFileStr", data);
                    that.getView().byId("gitFileTree").setVisible(true);
                    MessageBox.information("Click on the file you want to push code to!");
                    BusyIndicator.hide();
                },
                error: function (error) {

                    BusyIndicator.hide();
                    MessageBox.error(JSON.parse(error.responseText).error.message);
                    console.error("Failed to load Git tree data", JSON.parse(error.responseText).error.message);
                }
            });
        },
        onBranchSelect: function (oEvent) {
            var getSelectedBranch = oEvent.getSource().getSelectedKey();
            var giturl = this.getOwnerComponent().getModel("gitModel").getProperty("/repoUrl");
            var gituser = this.getOwnerComponent().getModel("gitModel").getProperty("/username");
            var gittoken = this.getOwnerComponent().getModel("gitModel").getProperty("/patToken");
            this.getOwnerComponent().getModel("gitModel").setProperty("/selectedBranch", getSelectedBranch);
            this.loadGitTreeData(getSelectedBranch, giturl, gituser, gittoken);
        },
        onGitFilePress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var sPath = oItem.getBindingContext("gitModel").getPath();
            var oData = this.getView().getModel("gitModel").getProperty(sPath);
            var sGitRepo = this.getView().getModel("gitModel").getProperty("/repoUrl");
            var sGitUsername = this.getView().getModel("gitModel").getProperty("/username");
            var SGitToken = this.getView().getModel("gitModel").getProperty("/patToken");


            if (oData.file) {
                this.loadFileContent(oData.file, sGitRepo, sGitUsername, SGitToken);
                this.getOwnerComponent().getModel("gitModel").setProperty("/filePath", oData.file);
            }
        },

        onGitPreviewPress: function (oEvent) {
            try {
                var ctx = oEvent.getSource().getBindingContext("gitModel");
                var obj = ctx && ctx.getObject();
                if (obj && obj.file) {
                    var gitModel = this.getOwnerComponent().getModel("gitModel");

                    var sGitRepo = gitModel.getProperty("/repoUrl");
                    var sGitUsername = gitModel.getProperty("/username");
                    var sGitToken = gitModel.getProperty("/patToken");

                    gitModel.setProperty("/filePath", obj.file);

                    this.loadFileContent(obj.file, sGitRepo, sGitUsername, sGitToken)
                        .then(() => {
                            this.onExpand(oEvent);
                        });
                }
            } catch (e) {
                console.error(e);
            }
        },

        loadFileContent: function (sFilePath, sGitRepo, sGitUserName, sGitToken) {
            var that = this;
            var busyDialog = new sap.m.BusyDialog();
            busyDialog.open();

            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: this._sBasePath + "/cockpit/readFileFromGit",
                    method: "POST",
                    data: JSON.stringify({
                        payload: {
                            pathAccess: sFilePath,
                            branchName: that.getOwnerComponent().getModel("gitModel").getProperty("/selectedBranch"),
                            repo: sGitRepo,
                            username: sGitUserName,
                            token: sGitToken
                        }
                    }),
                    contentType: "application/json",

                    success: function (data) {
                        var jsonResponse = data.value;

                        that.getOwnerComponent()
                            .getModel("gitModel")
                            .setProperty("/gitFileContent", jsonResponse);

                        busyDialog.close();
                        resolve();   // ✅ notify caller that content is ready
                    },

                    error: function (error) {
                        busyDialog.close();
                        console.error("Failed to load file content", JSON.parse(error.responseText).error.message);
                        sap.m.MessageBox.error(JSON.parse(error.responseText).error.message);

                        reject(error);  // ❌ notify failure
                    }
                });
            });
        },
        onFileIsLeaf: function (oItemCtx) {
            const obj = oItemCtx && oItemCtx.getObject();
            return obj && (!obj.children || obj.children.length === 0);
        },

        onFileSelectionChange: function (oEvent) {
            const oListItem = oEvent.getParameter("listItem");
            const ctx = oListItem && oListItem.getBindingContext("gitModel");
            const obj = ctx && ctx.getObject();
            const gitModel = this.getOwnerComponent().getModel("gitModel");

            if (obj && this.onFileIsLeaf(ctx)) {
                gitModel.setProperty("/filePath", obj.file);
                gitModel.setProperty("/selectedFilePath", obj.file);
                gitModel.setProperty("/isFileSelected", true);
            } else {
                gitModel.setProperty("/isFileSelected", false);
                gitModel.setProperty("/selectedFilePath", "");
            }
        },
        cancelPrompt: function () {
            this.getView().byId("multiInputPrompt").setValue("");
            this.getView().byId("descTxtAreaPrompt").setValue("");
            this.getView().byId("cancelPrmBtn").setVisible(false);
            this.getView().byId("savePrm").setVisible(false);
            this.getView().byId("editPrm").setVisible(false);
            this.getView().byId("multiInputPrompt").setValueState("None");
            this.getView().byId("descTxtAreaPrompt").setValueState("None");
            this.getView().byId("descTxtAreaPrompt").setEditable(false);
        },
        openAIRespEditFragment: async function () {
            BusyIndicator.show();
            var that = this;
            if (!this.airespED) {
                this.airespED = await this.loadFragment({
                    name: "aicockpitfeq.fragment.AIResponseEdit"
                }).then(function (oDialog) {
                    this.airespED = oDialog;
                    this.airespED.attachBrowserEvent("keydown", function (oEvent) {
                        if (oEvent.key === "Escape") {
                            oEvent.stopPropagation();
                            oEvent.preventDefault();
                        }
                    });
                    oDialog.open();
                    BusyIndicator.hide();

                }.bind(this));
            } else {
                BusyIndicator.hide();
            }
        },

        saveAIResponse: function () {
            var toSave = this.getView().byId("editAIPCT").getValue();
            this.getOwnerComponent().getModel("airesponseDetailModel").oData.resp = toSave;
            this.closeSysKeyFr();
        },

        onOpenTemplateDialog: function () {

            const that = this;
            var sSelectedIconTab = this.selectedKeyFunct();
            const url = this._sBasePath + `/cockpit/getFiles?Category=${sSelectedIconTab}Template&Project=${this._ProjectDetail}`;

            $.ajax({
                url: url,
                type: "GET",

                success: function (data) {

                    let files = [];
                    var contents = data?.value?.data?.Contents;

                    if (contents) {
                        files = contents.map(f => ({
                            Key: f.Key,
                            Name: f.Key.split("/").pop()
                        }));
                    }

                    console.log("FILES:", files);

                    var model = new sap.ui.model.json.JSONModel(files);
                    that.getView().setModel(model, "ObjectFileList");
                    model.refresh(true);

                    var oView = that.getView();

                    if (!that._oTemplateDialog || that._oTemplateDialog.bIsDestroyed) {

                        sap.ui.core.Fragment.load({
                            id: oView.getId(),
                            name: "aicockpitfeq.fragment.TemplateDialog",
                            controller: that
                        }).then(function (oDialog) {

                            that._oTemplateDialog = oDialog;
                            oView.addDependent(oDialog);
                            oDialog.open();

                        });

                    } else {

                        that._oTemplateDialog.open();

                    }
                }
            });
        },
        onCloseTemplateDialog: function () {
            if (this._oTemplateDialog) {
                this._oTemplateDialog.close();
            }
        },
        onTemplateSelect: function (oEvent) {
            const oItem = oEvent.getParameter("listItem");
            if (!oItem) return;
            const oContext = oItem.getBindingContext("ObjectFileList");
            const oData = oContext.getObject();

            this._selectedTemplateKey = oData.Key;
            this.getView().getModel("airesponseDetailModel").setProperty("/templateKey", oData.Key);

            this.byId("selectedTemplateName").setText(oData.Name);
            this.byId("templateInfoBox").setVisible(true);
            this.getView().byId("selectedTemplateName").setVisible(true);
            this.getView().byId("viewTemplateBtn").setVisible(true);

            sap.m.MessageToast.show(
                "Template selected: " + oData.Name
            );

            this._oTemplateDialog.close();
        },

        onTemplateFileDelete: function (oEvent) {
            let _this = this;
            let oSource = oEvent.getSource();
            let oItem = oSource;

            // Traverse up to find binding context
            while (oItem && !oItem.getBindingContext("ObjectFileList")) {
                oItem = oItem.getParent();
            }

            let oContext = oItem?.getBindingContext("ObjectFileList");
            if (!oContext) {
                sap.m.MessageBox.error("Unable to retrieve file details");
                return;
            }

            let sFileRef = oContext.getProperty("Key");

            if (!sFileRef || typeof sFileRef !== "string") {
                sap.m.MessageBox.error("Invalid file reference");
                return;
            }

            let sObjectKey = sFileRef;
            let aParts = [];
            if (sFileRef.startsWith("http")) {
                let oUrl = new URL(sFileRef);
                aParts = oUrl.pathname.replace(/^\/+/, "").split("/");
                aParts.shift();
                sObjectKey = aParts.join("/");
            } else {
                aParts = sObjectKey.replace(/^\/+/, "").split("/");
            }

            let oPayload = {
                files: [sObjectKey]
            };

            sap.m.MessageBox.confirm("Are you sure you want to delete this template?", {
                title: "Confirm Deletion",
                onClose: function (oAction) {
                    if (oAction === sap.m.MessageBox.Action.OK) {
                        $.ajax({
                            url: this._sBasePath + `/cockpit/deleteFiles`,
                            type: "DELETE",
                            contentType: "application/json",
                            data: JSON.stringify(oPayload),
                            success: function (data) {
                                if (data) {
                                    let oModel = _this.getView().getModel("ObjectFileList");
                                    let aFileList = oModel.getProperty("/");

                                    if (Array.isArray(aFileList)) {
                                        let aUpdatedList = aFileList.filter(file => file.Key !== sFileRef);
                                        oModel.setProperty("/", aUpdatedList);
                                        oModel.refresh(true);
                                    }

                                    let sSelectedIconTab = _this.selectedKeyFunct();
                                    let sTemplateCategory = sSelectedIconTab + "Template";
                                    _this.getFiles(sTemplateCategory);

                                    sap.m.MessageBox.success(data.message || "Template deleted successfully", {
                                        title: "Delete Template",
                                        actions: [sap.m.MessageBox.Action.OK]
                                    });
                                } else {
                                    sap.m.MessageBox.show("Failed to delete template.");
                                }
                            },
                            error: function (xhr) {
                                let sError = "";
                                try {
                                    sError = JSON.parse(xhr.responseText).error.message;
                                } catch (e) {
                                    sError = xhr.responseText;
                                    console.error(e);
                                }
                                sap.m.MessageBox.error("Error deleting template: " + sError);
                            }
                        });

                    }
                }
            });
        },

        onTemplateToggle: function (oEvent) {
            const bState = oEvent.getParameter("state");
            this.getView().getModel("viewModel").setProperty("/templateToggle", bState);
            this._saveTabState(this.selectedKeyFunct());
            if (!bState) {
                this._selectedTemplateKey = null;

                this.byId("selTemplateList").setValue("");
                this.byId("selectedTemplateName").setText("");

                this.byId("templateInfoBox").setVisible(false);
                this.byId("selectedTemplateName").setVisible(false);
                this.byId("viewTemplateBtn").setVisible(false);
                this.getOwnerComponent()
                    .getModel("airesponseDetailModel")
                    .setProperty("/downloadVis", false);
                this.getView().getModel("airesponseDetailModel").setProperty("/templateKey", null);
            }
        },
        onFileRadioSelect: function (oEvent) {
            var oRadioButton = oEvent.getSource();
            var ctx = oRadioButton.getBindingContext("gitModel");
            var obj = ctx && ctx.getObject();
            var gitModel = this.getOwnerComponent().getModel("gitModel");

            if (obj && obj.file) {
                gitModel.setProperty("/filePath", obj.file);
                gitModel.setProperty("/selectedFilePath", obj.file);
                gitModel.setProperty("/isFileSelected", true);
            }
        },

        onViewTemplate: function () {
            if (!this._selectedTemplateKey) {
                sap.m.MessageToast.show("No template selected");
                return;
            }
            let key = encodeURIComponent(this._selectedTemplateKey);
            let url = this._sBasePath + "/cockpit/viewTemplate(key='" + key + "')";
            // Show busy indicator
            sap.ui.core.BusyIndicator.show(0);
            $.ajax({
                url: url,
                method: "GET",
                success: function (response) {
                    sap.ui.core.BusyIndicator.hide();
                    try {
                        // Parse the response (it's a JSON string)
                        let data = typeof response === 'string' ? JSON.parse(response) : response;
                        // If response has a 'value' property (OData wrapper), extract it
                        if (data.value) {
                            data = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                        }
                        // Convert Base64 to Blob
                        let byteCharacters = atob(data.content);
                        let byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        let byteArray = new Uint8Array(byteNumbers);
                        let blob = new Blob([byteArray], { type: data.contentType });
                        // Create object URL and open in new tab
                        let blobUrl = URL.createObjectURL(blob);
                        window.open(blobUrl, "_blank");
                        // Clean up the object URL after a delay
                        setTimeout(function () {
                            URL.revokeObjectURL(blobUrl);
                        }, 10000);
                    } catch (e) {
                        console.error("Error processing response:", e);
                        sap.m.MessageToast.show("Error displaying template");
                    }
                },
                error: function (err) {
                    sap.ui.core.BusyIndicator.hide();
                    console.error("Error fetching template:", err);
                    sap.m.MessageToast.show("Failed to fetch template");
                }
            });
        },
        onTemplateUpload: function (oEvent) {
            var that = this;
            var sSelectedIconTab = this.selectedKeyFunct();
            const oFile = oEvent.getParameter("files")[0];
            if (!oFile) { return; }

            const busy = new sap.m.BusyDialog();
            busy.open();

            try {
                var reader = new FileReader();
                reader.onload = function (e) {
                    var result = e.target.result || "";
                    var base64 = "";
                    if (typeof result === "string" && result.indexOf(",") !== -1) {
                        base64 = result.split(",")[1];
                    } else {
                        var bytes = new Uint8Array(result);
                        var binary = "";
                        for (var i = 0; i < bytes.byteLength; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        base64 = btoa(binary);
                    }

                    var payload = {
                        payload: {
                            Category: sSelectedIconTab + "Template",
                            Project: that._ProjectDetail,
                            userId: that._loggedInUser,
                            fileName: oFile.name,
                            mimeType: oFile.type || "application/octet-stream",
                            fileBase64: base64
                        }
                    };

                    $.ajax({
                        url: that._sBasePath + "/cockpit/uploadFile",
                        type: "POST",
                        contentType: "application/json",
                        data: JSON.stringify(payload),
                        success: function (res) {
                            busy.close();
                            var templateKey = res.objectStoreRefKey || res.ObjectStoreRefKey || res.value?.objectStoreRefKey;
                            if (!templateKey) {
                                sap.m.MessageBox.error("Template upload failed");
                                return;
                            }

                            that._selectedTemplateKey = templateKey;
                            that.getView().getModel("airesponseDetailModel").setProperty("/templateKey", templateKey);
                            var fileName = templateKey.split("/").pop();

                            that.byId("selectedTemplateName").setText(fileName);
                            that.byId("templateInfoBox").setVisible(true);
                            that.getView().byId("selectedTemplateName").setVisible(true);
                            that.getView().byId("viewTemplateBtn").setVisible(true);
                            sap.m.MessageToast.show("Template uploaded successfully");
                        },
                        error: function (xhr) {
                            busy.close();
                            var msg = "";
                            try { msg = JSON.parse(xhr.responseText).error?.message || ""; } catch (e) { }
                            sap.m.MessageBox.error(msg || "Template upload failed");
                        }
                    });
                };

                // Read based on file type
                if (oFile.type && oFile.type.startsWith("text/")) {
                    reader.readAsText(oFile);
                } else {
                    reader.readAsArrayBuffer(oFile);
                }
            } catch (e) {
                busy.close();
                sap.m.MessageBox.error("Template upload failed");
            }
        },
        onDocTypeChange: function (oEvent) {
            const selectedKey = oEvent.getSource().getSelectedKey();
            this.setDocGenKey = selectedKey;
            this._tempScenarioKey = "DocGen";
            this.getDataSysMsgDocGen();
        },

        pctkbwithstep3: async function () {
            BusyIndicator.show();
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", false);
            var oViewModel = this.getView().getModel("viewModel");
            var that = this;
            var modelId = this.getView().byId("selModel").getSelectedKey();
            var modelName = this.getView().byId("selModel").getValue();
            var aMsgContentSystemDesc = this.getView().byId("descTxtArea").getValue();
            var promptMsgData = this.getView().byId("descTxtAreaPrompt").getValue();
            var allMessages = [];
            var oModel = this.getView().getModel("appmodel");
            var fileData = oModel.getProperty("/BSContent");
            var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
            var tokensUsed = 0;
            this.getView().getModel("tcgModel").setProperty("/allResponses", []);
            var aiModelName = that.getView().byId("selModel").getValue();
            var respValue = this.getOwnerComponent()
                .getModel("airesponseDetailModel")
                .getProperty("/resp");
            var messages = [];
            var attachments = [];

            /*  System message ALWAYS */
            aMsgContentSystemDesc = aMsgContentSystemDesc.replace(/\{step_2_output}/g, respValue);
            messages.push({
                role: "system",
                content: aMsgContentSystemDesc
            });






            var kbPayload = {
                "step_number": 3,
                "model": aiModelName,
                temperature: Number(oViewModel.getProperty("/comnPopUpModelParamTemp") || 0.7),
                top_p: Number(oViewModel.getProperty("/comnPopUpModelParamTopP") || 0.95),
                max_tokens: Number(oViewModel.getProperty("/comnPopUpModelParamMaxLength") || 4000),
                session_id: "",
                messages: messages,

            };

            if (attachments.length > 0) {
                kbPayload.attachments = attachments;
            }




            if (fileData === "") {
                BusyIndicator.hide();
                MessageBox.error("Please upload a File!");
                this.getView().byId("selDocList").setValueState("Error");
                this.getView().byId("selDocList").setValueStateText("Upload/Select File");
                return;
            }
            // else if (Array.isArray(fileData) == true) {
            //     BusyIndicator.hide();
            //     sap.m.MessageBox.warning(oBundle.getText("wrongTemplate"));
            // }
            else if (fileData.url && bRagEnabled === true) {
                BusyIndicator.hide();
                sap.m.MessageBox.warning(oBundle.getText("kbTCGFileSel"));
            }
            else if (fileData !== "") {
                //// aMsgContentSystemDesc = aMsgContentSystemDesc.replace(/\{\{\?requirement_file\}\}/g, fileData);
                aMsgContentSystemDesc = aMsgContentSystemDesc.replace(/\{requirement_file}/g, fileData);
                var aMessages = [{ "role": "system", "content": aMsgContentSystemDesc }];
                this.onPctStepOutput(aMessages);
                if (Array.isArray(fileData)) { aMessages.push({ "role": "user", "content": fileData }); }
                var histPayload = Utility.createPayloadBasedOnModelNonStream(modelName, aMessages, oViewModel, this, promptMsgData);
                allMessages.push(histPayload);

                //var apiKMUrl = "/kb-integration/PCT_STEP3";
                var apiKMUrl = this._sBasePath + "/kbintegration/pct";
                try {
                    const response = await fetch(apiKMUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...(this.defaultHeaders || {})
                        },
                        body: JSON.stringify(kbPayload)
                    });

                    if (!response.ok) {
                        const errText = await response.text().catch(() => "");
                        throw new Error(`PCT call failed for : ${response.status} ${errText}`);
                    }
                    const rawText = await response.text();

                    // Parse NDJSON; if not NDJSON, fallback to single JSON or plain text
                    const parsedResponse = this._parseNdjsonOrJsonText(rawText);
                    var tokenConsumed = {};
                    var citationIndex = [];
                    parsedResponse[0].citations.forEach((item) => {
                        if (!item) return;
                        const filePath = item.download_url || item.file_path || "";
                        const filename = item.filename || "Unknown";
                        const link = item.download_url;
                        if (link || filename) { citationIndex.push({ link: link, fname: filename }); }
                    });
                    citationIndex.forEach(c => {
                        const key = `${c.fname}|${c.link}`;
                        if (!citationIndex.some(m => `${m.fname}|${m.link}` === key)) citationIndex.push(c);
                    });
                    tokensUsed = tokensUsed + parsedResponse[0].token_usage.total_tokens;
                    var tcgRespArr = this.getView().getModel("tcgModel").getProperty("/allResponses");
                    tcgRespArr.push({ UserStory_ID: "****************" + kbPayload.UserStory_ID + "****************", response: parsedResponse[0].step3_output, citationTcg: citationIndex || [], tokensGen: tokensUsed });
                    this.getView().getModel("tcgModel").setProperty("/allResponses", tcgRespArr);

                } catch (err) {
                    BusyIndicator.hide();
                    sap.m.MessageBox.error(`TCG processing error: ${err.message}`);
                } finally {
                    // BusyIndicator.hide();
                }
                const oSideNavigation = this.byId("sideNavigation"),
                    bExpanded = oSideNavigation.getExpanded();
                oSideNavigation.setExpanded(false);
                this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", false);
                var aMsgContentSystemDesc1 = this.getView().byId("descTxtArea").getValue();
                this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/sysMsg", aMsgContentSystemDesc1);
                this.getOwnerComponent().getModel("airesponseDetailModel").refresh();
                var keytoSend = this.getView().getModel("selKeyForDetailDetail").getProperty("/keyD");
                var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;
                this.oRouter.navTo("DetailDetail", { dispKey: keytoSend, aimodel: selectedAI, layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded });
                var tokenData = this.getView().getModel("TokenLimit").oData;
                var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;
                var scenario = this.selectedKeyFunct();
                var tknallotted = tokenData[scenario][selectedAI].TotalToken;
                this.getView().getModel("TokenLimit").setProperty("/token", tknallotted);
                var resp = "";
                var cit = [];
                var tcgRespArr = this.getView().getModel("tcgModel").getProperty("/allResponses");
                for (var r = 0; r < tcgRespArr.length; r++) {

                    resp = resp + tcgRespArr[r].UserStory_ID + "\n" + tcgRespArr[r].response + "\n";
                    for (var c = 0; c < tcgRespArr[r].citationTcg.length; c++) {
                        cit.push(tcgRespArr[r].citationTcg[c]);
                    }
                    // for(var t=0;t<tcgRespArr.length;t++){
                    // // tokensUsed = tokensUsed + tcgRespArr[t].tokensGen;
                    // }

                }
                this.getView().byId("prgIndicator").setPercentValue("100%");
                this.getView().byId("prgIndicator").setDisplayValue("Completed");
                this.getView().byId("nextBtn").setVisible(false);
                // that.onPctStepOutput(reAMessages);
                MessageBox.success("All Steps Completed!");

                this.getView().getModel("TokenLimit").setProperty("/usedToken", tokensUsed);
                this.getView().getModel("TokenLimit").setProperty("/tokenVis", true);
                this.getView().getModel("airesponseDetailModel").setProperty("/resp", resp);
                this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/citationArr", cit);
                //this._addToHistoryLogGeneric(resp);
                var oResMsg = {
                    role: 'assistant',
                    content: resp
                };
                var totToken = 0;
                var fileCont = true;
                var oViewModel = that.getView().getModel("viewModel");
                Utility.handleTabResponseDynamic(
                    scenario,
                    that,
                    resp,
                    oResMsg,
                    promptMsgData,
                    totToken,
                    tknallotted,
                    oViewModel,
                    fileCont
                );

                BusyIndicator.hide();
            }
        },
        pctkbwithstep2: async function () {
            BusyIndicator.show();
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", false);
            var oViewModel = this.getView().getModel("viewModel");
            var that = this;
            var modelId = this.getView().byId("selModel").getSelectedKey();
            var modelName = this.getView().byId("selModel").getValue();
            var aMsgContentSystemDesc = this.getView().byId("descTxtArea").getValue();
            var promptMsgData = this.getView().byId("descTxtAreaPrompt").getValue();
            var allMessages = [];
            var oModel = this.getView().getModel("appmodel");
            var fileData = oModel.getProperty("/BSContent");
            var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
            var tokensUsed = 0;
            this.getView().getModel("tcgModel").setProperty("/allResponses", []);
            var aiModelName = that.getView().byId("selModel").getValue();
            var respValue = this.getOwnerComponent()
                .getModel("airesponseDetailModel")
                .getProperty("/resp");
            var messages = [];
            var attachments = [];

            /*  System message ALWAYS */
            aMsgContentSystemDesc = aMsgContentSystemDesc.replace(/\{step_1_output}/g, respValue);
            messages.push({
                role: "system",
                content: aMsgContentSystemDesc
            });






            var kbPayload = {
                step_number: 2,
                "model": aiModelName,
                temperature: Number(oViewModel.getProperty("/comnPopUpModelParamTemp") || 0.7),
                top_p: Number(oViewModel.getProperty("/comnPopUpModelParamTopP") || 0.95),
                max_tokens: Number(oViewModel.getProperty("/comnPopUpModelParamMaxLength") || 4000),
                session_id: " ",
                messages: messages,

            };

            if (attachments.length > 0) {
                kbPayload.attachments = attachments;
            }




            if (fileData === "") {
                BusyIndicator.hide();
                MessageBox.error("Please upload a File!");
                this.getView().byId("selDocList").setValueState("Error");
                this.getView().byId("selDocList").setValueStateText("Upload/Select File");
                return;
            }
            // else if (Array.isArray(fileData) == true) {
            //     BusyIndicator.hide();
            //     sap.m.MessageBox.warning(oBundle.getText("wrongTemplate"));
            // }
            else if (fileData.url && bRagEnabled === true) {
                BusyIndicator.hide();
                sap.m.MessageBox.warning(oBundle.getText("kbTCGFileSel"));
            }
            else if (fileData !== "") {
                //// aMsgContentSystemDesc = aMsgContentSystemDesc.replace(/\{\{\?requirement_file\}\}/g, fileData);
                aMsgContentSystemDesc = aMsgContentSystemDesc.replace(/\{requirement_file}/g, fileData);
                var aMessages = [{ "role": "system", "content": aMsgContentSystemDesc }];
                this.onPctStepOutput(aMessages);
                if (Array.isArray(fileData)) { aMessages.push({ "role": "user", "content": fileData }); }
                var histPayload = Utility.createPayloadBasedOnModelNonStream(modelName, aMessages, oViewModel, this, promptMsgData);
                allMessages.push(histPayload);
                //kbPayload.system_prompt.spec.template = aMessages;
                //var apiKMUrl = "/kb-integration/PCT_STEP2";
                var apiKMUrl = this._sBasePath + "/kbintegration/pct";
                try {
                    const response = await fetch(apiKMUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...(this.defaultHeaders || {})
                        },
                        body: JSON.stringify(kbPayload)
                    });

                    if (!response.ok) {
                        const errText = await response.text().catch(() => "");
                        throw new Error(`PCT call failed for : ${response.status} ${errText}`);
                    }
                    const rawText = await response.text();

                    // Parse NDJSON; if not NDJSON, fallback to single JSON or plain text
                    const parsedResponse = this._parseNdjsonOrJsonText(rawText);
                    var tokenConsumed = {};
                    var citationIndex = [];

                    tokensUsed = tokensUsed + parsedResponse[0].token_usage.total_tokens;
                    var tcgRespArr = this.getView().getModel("tcgModel").getProperty("/allResponses");
                    tcgRespArr.push({ UserStory_ID: "****************" + kbPayload.UserStory_ID + "****************", response: parsedResponse[0].step2_output, citationTcg: citationIndex || [], tokensGen: tokensUsed });
                    this.getView().getModel("tcgModel").setProperty("/allResponses", tcgRespArr);

                } catch (err) {
                    BusyIndicator.hide();
                    sap.m.MessageBox.error(`TCG processing error: ${err.message}`);
                } finally {
                    // BusyIndicator.hide();
                }
                const oSideNavigation = this.byId("sideNavigation"),
                    bExpanded = oSideNavigation.getExpanded();
                oSideNavigation.setExpanded(false);
                this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", false);
                var aMsgContentSystemDesc1 = this.getView().byId("descTxtArea").getValue();
                this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/sysMsg", aMsgContentSystemDesc1);
                this.getOwnerComponent().getModel("airesponseDetailModel").refresh();
                var keytoSend = this.getView().getModel("selKeyForDetailDetail").getProperty("/keyD");
                var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;
                this.oRouter.navTo("DetailDetail", { dispKey: keytoSend, aimodel: selectedAI, layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded });
                var tokenData = this.getView().getModel("TokenLimit").oData;
                var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;
                var scenario = this.selectedKeyFunct();
                var tknallotted = tokenData[scenario][selectedAI].TotalToken;
                this.getView().getModel("TokenLimit").setProperty("/token", tknallotted);
                var resp = "";
                var cit = [];
                var tcgRespArr = this.getView().getModel("tcgModel").getProperty("/allResponses");
                for (var r = 0; r < tcgRespArr.length; r++) {

                    resp = resp + tcgRespArr[r].UserStory_ID + "\n" + tcgRespArr[r].response + "\n";
                    for (var c = 0; c < tcgRespArr[r].citationTcg.length; c++) {
                        cit.push(tcgRespArr[r].citationTcg[c]);
                    }
                    // for(var t=0;t<tcgRespArr.length;t++){
                    // // tokensUsed = tokensUsed + tcgRespArr[t].tokensGen;
                    // }

                }
                this.getView().byId("pctSysMsgBtn").setVisible(true);
                this.onPctStepOutput(kbPayload.messages);
                this.getView().byId("nextBtn").setVisible(true);
                MessageBox.information(oBundle.getText("nextMsg"));

                this.getView().getModel("TokenLimit").setProperty("/usedToken", tokensUsed);
                this.getView().getModel("TokenLimit").setProperty("/tokenVis", true);
                this.getView().getModel("airesponseDetailModel").setProperty("/resp", resp);
                this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/citationArr", cit);
                //this._addToHistoryLogGeneric(resp);
                var oResMsg = {
                    role: 'assistant',
                    content: resp
                };
                var totToken = 0;
                var fileCont = true;
                var oViewModel = that.getView().getModel("viewModel");
                Utility.handleTabResponseDynamic(
                    scenario,
                    that,
                    resp,
                    oResMsg,
                    promptMsgData,
                    totToken,
                    tknallotted,
                    oViewModel,
                    fileCont
                );

                BusyIndicator.hide();
            }
        },

        PCTKBwithTCG: async function () {
            BusyIndicator.show();
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", false);
            var oViewModel = this.getView().getModel("viewModel");
            var that = this;
            var modelId = this.getView().byId("selModel").getSelectedKey();
            var modelName = this.getView().byId("selModel").getValue();
            var aMsgContentSystemDesc = this.getView().byId("descTxtArea").getValue();
            var promptMsgData = this.getView().byId("descTxtAreaPrompt").getValue();
            var allMessages = [];
            var oModel = this.getView().getModel("appmodel");
            var fileData = oModel.getProperty("/BSContent");
            var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
            var tokensUsed = 0;
            this.getView().getModel("tcgModel").setProperty("/allResponses", []);
            var aiModelName = that.getView().byId("selModel").getValue();

            var messages = [];
            var attachments = [];

            /* System message ALWAYS */
            //aMsgContentSystemDesc = aMsgContentSystemDesc.replace(/\{requirement_file}/g, fileData);

            aMsgContentSystemDesc = aMsgContentSystemDesc
                .replace(/\{requirement_file}/g, fileData)
                .replace(/\{additional_info}/g, promptMsgData || "");

            messages.push({
                role: "system",
                content: aMsgContentSystemDesc
            });

            /*  IMAGE case */
            if (
                Array.isArray(fileData) &&
                fileData.length > 0 &&
                fileData[0].type === "image_url"
            ) {
                messages.push({
                    role: "user",
                    content: [
                        {
                            type: "image_url",
                            image_url: {
                                url: fileData[0].image_url.url
                            }
                        },
                        {
                            type: "text",
                            text: "Analyze the BPMN process diagram above and identify all decision points and paths."
                        }
                    ]
                });
            }

            /* ATTACHMENT case (NOT image) */
            else if (fileData && fileData.data && fileData.filename) {

                messages.push({
                    role: "user",
                    content: promptMsgData || "Please analyze the attached document."
                });

                attachments.push({
                    type: "file",
                    filename: fileData.filename,
                    content_type: fileData.contentType || "application/octet-stream",
                    data: fileData.data   // base64
                });
            }

            /* Final payload */
            var kbPayload = {
                "step_number": 1,
                "model": aiModelName,
                temperature: Number(oViewModel.getProperty("/comnPopUpModelParamTemp") || 0.7),
                top_p: Number(oViewModel.getProperty("/comnPopUpModelParamTopP") || 0.95),
                max_tokens: Number(oViewModel.getProperty("/comnPopUpModelParamMaxLength") || 4000),
                "session_id": "",
                messages: messages,



            };

            if (attachments.length > 0) {
                kbPayload.attachments = attachments;
            }




            if (fileData === "") {
                BusyIndicator.hide();
                MessageBox.error("Please upload a File!");
                this.getView().byId("selDocList").setValueState("Error");
                this.getView().byId("selDocList").setValueStateText("Upload/Select File");
                return;
            }
            // else if (Array.isArray(fileData) == true) {
            //     BusyIndicator.hide();
            //     sap.m.MessageBox.warning(oBundle.getText("wrongTemplate"));
            // }
            else if (fileData.url && bRagEnabled === true) {
                BusyIndicator.hide();
                sap.m.MessageBox.warning(oBundle.getText("kbTCGFileSel"));
            }
            else if (fileData !== "") {
                //// aMsgContentSystemDesc = aMsgContentSystemDesc.replace(/\{\{\?requirement_file\}\}/g, fileData);
                aMsgContentSystemDesc = aMsgContentSystemDesc.replace(/\{requirement_file}/g, fileData);
                var aMessages = [{ "role": "system", "content": aMsgContentSystemDesc }];
                this.onPctStepOutput(aMessages);
                if (Array.isArray(fileData)) { aMessages.push({ "role": "user", "content": fileData }); }
                var histPayload = Utility.createPayloadBasedOnModelNonStream(modelName, aMessages, oViewModel, this, promptMsgData);
                allMessages.push(histPayload);

                //var apiKMUrl = "/kb-integration/PCT_STEP1";
                var apiKMUrl = this._sBasePath + "/kbintegration/pct";
                try {
                    const response = await fetch(apiKMUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...(this.defaultHeaders || {})
                        },
                        body: JSON.stringify(kbPayload)
                    });

                    if (!response.ok) {
                        const errText = await response.text().catch(() => "");
                        throw new Error(`PCT call failed for : ${response.status} ${errText}`);
                    }
                    const rawText = await response.text();

                    // Parse NDJSON; if not NDJSON, fallback to single JSON or plain text
                    const parsedResponse = this._parseNdjsonOrJsonText(rawText);
                    var tokenConsumed = {};
                    var citationIndex = [];

                    tokensUsed = tokensUsed + parsedResponse[0].token_usage.total_tokens;
                    var tcgRespArr = this.getView().getModel("tcgModel").getProperty("/allResponses");
                    tcgRespArr.push({ UserStory_ID: "****************" + kbPayload.UserStory_ID + "****************", response: parsedResponse[0].step1_output, citationTcg: citationIndex || [], tokensGen: tokensUsed });
                    this.getView().getModel("tcgModel").setProperty("/allResponses", tcgRespArr);

                } catch (err) {
                    BusyIndicator.hide();
                    sap.m.MessageBox.error(`TCG processing error: ${err.message}`);
                } finally {
                    // BusyIndicator.hide();
                }
                const oSideNavigation = this.byId("sideNavigation"),
                    bExpanded = oSideNavigation.getExpanded();
                oSideNavigation.setExpanded(false);
                this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", false);
                var aMsgContentSystemDesc1 = this.getView().byId("descTxtArea").getValue();
                this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/sysMsg", aMsgContentSystemDesc1);
                this.getOwnerComponent().getModel("airesponseDetailModel").refresh();
                var keytoSend = this.getView().getModel("selKeyForDetailDetail").getProperty("/keyD");
                var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;
                this.oRouter.navTo("DetailDetail", { dispKey: keytoSend, aimodel: selectedAI, layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded });
                var tokenData = this.getView().getModel("TokenLimit").oData;
                var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;
                var scenario = this.selectedKeyFunct();
                var tknallotted = tokenData[scenario][selectedAI].TotalToken;
                this.getView().getModel("TokenLimit").setProperty("/token", tknallotted);
                var resp = "";
                var cit = [];
                var tcgRespArr = this.getView().getModel("tcgModel").getProperty("/allResponses");
                for (var r = 0; r < tcgRespArr.length; r++) {

                    resp = resp + tcgRespArr[r].UserStory_ID + "\n" + tcgRespArr[r].response + "\n";
                    for (var c = 0; c < tcgRespArr[r].citationTcg.length; c++) {
                        cit.push(tcgRespArr[r].citationTcg[c]);
                    }
                    // for(var t=0;t<tcgRespArr.length;t++){
                    // // tokensUsed = tokensUsed + tcgRespArr[t].tokensGen;
                    // }

                }
                this.getView().byId("pctSysMsgBtn").setVisible(true);
                this.onPctStepOutput(kbPayload.messages);
                this.getView().byId("nextBtn").setVisible(true);
                MessageBox.information(oBundle.getText("nextMsg"));

                this.getView().getModel("TokenLimit").setProperty("/usedToken", tokensUsed);
                this.getView().getModel("TokenLimit").setProperty("/tokenVis", true);
                this.getView().getModel("airesponseDetailModel").setProperty("/resp", resp);
                this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/citationArr", cit);
                //this._addToHistoryLogGeneric(resp);
                var oResMsg = {
                    role: 'assistant',
                    content: resp
                };
                var totToken = 0;
                var fileCont = true;
                var oViewModel = that.getView().getModel("viewModel");
                Utility.handleTabResponseDynamic(
                    scenario,
                    that,
                    resp,
                    oResMsg,
                    promptMsgData,
                    totToken,
                    tknallotted,
                    oViewModel,
                    fileCont
                );

                BusyIndicator.hide();
            }
        },
        aicallforBPM_onlyKB: async function () {
            BusyIndicator.show();
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", false);
            var oViewModel = this.getView().getModel("viewModel");
            var that = this;
            var modelId = this.getView().byId("selModel").getSelectedKey();
            var modelName = this.getView().byId("selModel").getValue();
            var aMsgContentSystemDesc = this.getView().byId("descTxtArea").getValue();
            var promptMsgData = this.getView().byId("descTxtAreaPrompt").getValue();
            var allMessages = [];
            var oModel = this.getView().getModel("appmodel");
            var fileData = oModel.getProperty("/BSContent");
            var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
            var tokensUsed = 0;
            this.getView().getModel("tcgModel").setProperty("/allResponses", []);
            var aiModelName = this.getView().byId("selModel").getValue();

            var messages = [];
            var attachments = [];

            aMsgContentSystemDesc = aMsgContentSystemDesc
                .replace(/\{\{\?requirement_file\}\}/g, fileData || "")
                .replace(/\{\{\?additional_info\}\}/g, promptMsgData || "");


            messages.push({
                role: "system",
                content: aMsgContentSystemDesc
            });

            // IMAGE case
            if (
                Array.isArray(fileData) &&
                fileData.length > 0 &&
                fileData[0].type === "image_url"
            ) {
                messages.push({
                    role: "user",
                    content: [
                        {
                            type: "image_url",
                            image_url: {
                                url: fileData[0].image_url.url
                            }
                        },
                        {
                            type: "text",
                            text: promptMsgData || "Testing"
                        }
                    ]
                });
            }

            //ATTACHMENT case (NOT image)
            else if (fileData && fileData.data && fileData.filename) {

                messages.push({
                    role: "user",
                    content: promptMsgData || "Please analyze the attached document."
                });

                attachments.push({
                    type: "file",
                    filename: fileData.filename,
                    content_type: fileData.contentType || "application/octet-stream",
                    data: fileData.data   // base64
                });
            }


            var kbPayload = {
                "model": aiModelName,
                temperature: Number(oViewModel.getProperty("/comnPopUpModelParamTemp") || 0.7),
                top_p: Number(oViewModel.getProperty("/comnPopUpModelParamTopP") || 0.95),
                max_tokens: Number(oViewModel.getProperty("/comnPopUpModelParamMaxLength") || 4000),
                messages: messages,
            };

            if (attachments.length > 0) {
                kbPayload.attachments = attachments;
            }
            if (fileData === "") {
                BusyIndicator.hide();
                MessageBox.error("Please upload a File!");
                this.getView().byId("selDocList").setValueState("Error");
                this.getView().byId("selDocList").setValueStateText("Upload/Select File");
                return;
            }

            else if (fileData.url) {
                BusyIndicator.hide();
                sap.m.MessageBox.warning(oBundle.getText("kbTCGFileSel"));
            }
            else if (fileData !== "") {
                //// aMsgContentSystemDesc = aMsgContentSystemDesc.replace(/\{\{\?requirement_file\}\}/g, fileData);
                //aMsgContentSystemDesc = aMsgContentSystemDesc.replace(/\{requirement_file}/g, fileData);

                aMsgContentSystemDesc = aMsgContentSystemDesc
                    .replace(/\{\{\?requirement_file\}\}/g, fileData || "")
                    .replace(/\{\{\?additional_info\}\}/g, promptMsgData || "");

                var aMessages = [{ "role": "system", "content": aMsgContentSystemDesc }];

                if (Array.isArray(fileData)) { aMessages.push({ "role": "user", "content": fileData }); }
                var histPayload = Utility.createPayloadBasedOnModelNonStream(modelName, aMessages, oViewModel, this, promptMsgData);
                allMessages.push(histPayload);

                //var apiKMUrl = "/kb-integration/BPM";
                var apiKMUrl = this._sBasePath + "/kbintegration/bpm";
                try {
                    const response = await fetch(apiKMUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...(this.defaultHeaders || {})
                        },
                        body: JSON.stringify(kbPayload)
                    });

                    if (!response.ok) {
                        const errText = await response.text().catch(() => "");
                        throw new Error(`BPM call failed for : ${response.status} ${errText}`);
                    }
                    const rawText = await response.text();

                    // Parse NDJSON; if not NDJSON, fallback to single JSON or plain text
                    const parsedResponse = this._parseNdjsonOrJsonText(rawText);
                    var tokenConsumed = {};
                    var citationIndex = [];
                    // var bRagEnabled = this.getView().byId("RagSwitch").getSelected();
                    // if (bRagEnabled) {
                    parsedResponse[0].citations.forEach((item) => {
                        if (!item) return;
                        const filePath = item.download_url || item.file_path || "";
                        const filename = item.filename || "Unknown";
                        const link = item.download_url;
                        if (link || filename) { citationIndex.push({ link: link, fname: filename }); }
                    });
                    citationIndex.forEach(c => {
                        const key = `${c.fname}|${c.link}`;
                        if (!citationIndex.some(m => `${m.fname}|${m.link}` === key)) citationIndex.push(c);
                    });
                    // }
                    tokensUsed = tokensUsed + parsedResponse[0].token_usage.total_tokens;
                    var tcgRespArr = this.getView().getModel("tcgModel").getProperty("/allResponses");
                    tcgRespArr.push({ UserStory_ID: "****************" + kbPayload.UserStory_ID + "****************", response: parsedResponse[0].bpm_output, citationTcg: citationIndex || [], tokensGen: tokensUsed });
                    this.getView().getModel("tcgModel").setProperty("/allResponses", tcgRespArr);

                } catch (err) {
                    BusyIndicator.hide();
                    sap.m.MessageBox.error(`TCG processing error: ${err.message}`);
                } finally {
                    // BusyIndicator.hide();
                }
                const oSideNavigation = this.byId("sideNavigation"),
                    bExpanded = oSideNavigation.getExpanded();
                oSideNavigation.setExpanded(false);
                this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/downloadVis", false);
                var aMsgContentSystemDesc1 = this.getView().byId("descTxtArea").getValue();
                this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/sysMsg", aMsgContentSystemDesc1);
                this.getOwnerComponent().getModel("airesponseDetailModel").refresh();
                var keytoSend = this.getView().getModel("selKeyForDetailDetail").getProperty("/keyD");
                var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;
                this.oRouter.navTo("DetailDetail", { dispKey: keytoSend, aimodel: selectedAI, layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded });
                var tokenData = this.getView().getModel("TokenLimit").oData;
                var selectedAI = this.getView().byId("selModel").getSelectedItem().mProperties.text;
                var scenario = this.selectedKeyFunct();
                var tknallotted = tokenData[scenario][selectedAI].TotalToken;
                this.getView().getModel("TokenLimit").setProperty("/token", tknallotted);
                var resp = "";
                var cit = [];
                var tcgRespArr = this.getView().getModel("tcgModel").getProperty("/allResponses");
                for (var r = 0; r < tcgRespArr.length; r++) {

                    resp = resp + tcgRespArr[r].UserStory_ID + "\n" + tcgRespArr[r].response + "\n";
                    for (var c = 0; c < tcgRespArr[r].citationTcg.length; c++) {
                        cit.push(tcgRespArr[r].citationTcg[c]);
                    }


                }


                this.getView().getModel("TokenLimit").setProperty("/usedToken", tokensUsed);
                this.getView().getModel("TokenLimit").setProperty("/tokenVis", true);
                this.getView().getModel("airesponseDetailModel").setProperty("/resp", resp);
                this.getOwnerComponent().getModel("airesponseDetailModel").setProperty("/citationArr", cit);
                //this._addToHistoryLogGeneric(resp);
                var oResMsg = {
                    role: 'assistant',
                    content: resp
                };
                var totToken = 0;
                var fileCont = true;
                var oViewModel = that.getView().getModel("viewModel");
                Utility.handleTabResponseDynamic(
                    scenario,
                    that,
                    resp,
                    oResMsg,
                    promptMsgData,
                    totToken,
                    tknallotted,
                    oViewModel,
                    fileCont
                );

                BusyIndicator.hide();
            }

        },
        getDataSysMsgDocGen: function () {
            var that = this;
            var sUrl = this._sBasePath + "/lm/promptTemplates?scenario=DocGen";

            $.ajax({
                url: sUrl,
                method: "GET",
                success: function (data) {
                    if (data && data.resources && data.resources.length > 0) {

                        var BSData = [];

                        var fetchDetails = data.resources.map(function (resource) {
                            return $.ajax({
                                url: that._sBasePath + `/lm/promptTemplates/${resource.id}`,
                                method: "GET",
                                headers: that.defaultHeaders
                            }).then(function (response) {

                                if (response?.spec?.template) {

                                    response.spec.template.forEach(function (templateItem) {

                                        if (templateItem.role === "system") {

                                            if (resource.id === that.setDocGenKey) {

                                                BSData.push({
                                                    PROMPTID: resource.id,
                                                    PROMPT_TEMPLATE: templateItem.content,
                                                    NAME: resource.name
                                                });

                                                that.getView().byId("multiInputSystem")
                                                    .setValue(resource.name);

                                                that.getView().byId("descTxtArea")
                                                    .setValue(templateItem.content);
                                            }
                                        }
                                    });
                                }
                            });
                        });

                        Promise.all(fetchDetails).then(function () {
                            Utility.initializeModel(that.getView(), "BSData", { messages: BSData });

                            var oModel = that.getView().getModel("switchTempModel");
                            if (!oModel.getProperty("/DocGen")) {
                                oModel.setProperty("/DocGen", {});
                            }
                            oModel.setProperty("/DocGen/roleofTemplate", "system");

                            that.isSystemSaved = true;
                        });
                    }
                }
            });
        },
    });
});