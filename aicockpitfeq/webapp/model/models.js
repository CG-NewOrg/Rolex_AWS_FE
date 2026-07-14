sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
],
    function (JSONModel, Device) {
        "use strict";

        var _sDeploymentId = null;
        var _oDeploymentIdPromise = null;

        return {
            /**
             * Provides runtime information for the device the UI5 app is running on as a JSONModel.
             * @returns {sap.ui.model.json.JSONModel} The device model.
             */
            createDeviceModel: function () {
                var oModel = new JSONModel(Device);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
            },
            // createHistoryModel: function () {
            //     var oModel = new JSONModel({
            //         historyLogBS: [],
            //         historyLogUS: [],
            //         historyLogfs: [],
            //         historyLog: [],
            //         historyLog_01: [],
            //         historyLog_02: [],
            //         historyLog_03: [],
            //         historyLog_04: [],
            //         historyLog_Git: [],
            //         historyLog_aws: []
            //     });
            //     return oModel;
            // },
            createViewModel: function (sSelectedProject) {
                return new JSONModel({
                    gptModels: [],
                    systemMsgResizeDialog: "",
                    BS: {
                        systemKey: "",
                        systemKeyPrefix: "BusD_" + sSelectedProject + "_",
                        bFileContentChanged: false,
                        bsContentBuffer: "",
                        isResponseFileContent: false,
                        Visible: {
                            SystemKeyVisible: false,
                            SystemTextAreaEditable: false
                        }
                    },
                    UserStory: {
                        systemKey: "",
                        systemKeyPrefix: "UserS_" + sSelectedProject + "_",
                        bFileContentChanged: false,
                        userContentBuffer: "",
                        isResponseFileContent: false,
                        Visible: {
                            SystemKeyVisible: false,
                            SystemTextAreaEditable: false
                        }
                    },
                    FsToConf: {
                        systemKey: "",
                        systemKeyPrefix: "FSCon_" + sSelectedProject + "_",
                        bFileContentChanged: false,
                        fsContentBuffer: "",
                        isResponseFileContent: false,
                        Visible: {
                            SystemKeyVisible: false,
                            SystemTextAreaEditable: false
                        }
                    },
                    FsToTs: {
                        systemKey: "",
                        systemKeyPrefix: "FsTs_" + sSelectedProject + "_",
                        bFileContentChanged: false,
                        fsToTsContentBuffer: "",
                        isResponseFileContent: false,
                        Visible: {
                            SystemKeyVisible: false,
                            SystemTextAreaEditable: false
                        }
                    },
                    TsToCode: {
                        systemKey: "",
                        systemKeyPrefix: "TsCod_" + sSelectedProject + "_",
                        bFileContentChanged: false,
                        tsToContentBuffer: "",
                        isResponseFileContent: false,
                        Visible: {
                            SystemKeyVisible: false,
                            SystemTextAreaEditable: false
                        }
                    },
                    tstocodeGit: {
                        systemKey: "",
                        systemKeyPrefix: "TsCodGit_" + sSelectedProject + "_",
                        bFileContentChanged: false,
                        tsToGitContentBuffer: "",
                        isResponseFileContent: false,
                        Visible: {
                            SystemKeyVisible: false,
                            SystemTextAreaEditable: false,
                            BranchDdVisible: false
                        }
                    },
                    CodeRem: {
                        systemKey: "",
                        systemKeyPrefix: "CodeR_" + sSelectedProject + "_",
                        bFileContentChanged: false,
                        codeRemContentBuffer: "",
                        isResponseFileContent: false,
                        Visible: {
                            SystemKeyVisible: false,
                            SystemTextAreaEditable: false
                        }
                    },
                    CodeSum: {
                        systemKey: "",
                        systemKeyPrefix: "CodeS_" + sSelectedProject + "_",
                        bFileContentChanged: false,
                        codeSumContentBuffer: "",
                        isResponseFileContent: false,
                        Visible: {
                            SystemKeyVisible: false,
                            SystemTextAreaEditable: false
                        }
                    },
                    AI: {
                        systemKey: "",
                        bFileContentChanged: false,
                        bsContentBuffer: "",
                        isResponseFileContent: false,
                        Visible: {
                            SystemKeyVisible: false,
                            SystemTextAreaEditable: false
                        }
                    },
                    isParamPopupOpen: false,
                    isParamPopupEdited: false,
                    comnPopUpModelParamTemp: 0.7,
                    comnPopUpModelParamTopP: 0.95,
                    comnPopUpModelParamMaxLength: 4000,
                    comnPopUpModelParamMax: 1200,
                    comnPopUpModelParamFreqP: 0.1,
                    comnPopUpModelParamPresenceP: 0.1,
                    AiModelParamTemp: 0.7,
                    AiModelParamTopP: 0.95,
                    AiModelParamMaxLength: 4000,
                    AiModelParamMax: 1200,
                    AiModelParamFreqP: 0.1,
                    AiModelParamPresenceP: 0.1,
                    isDocGen:false
                });
            },
            createResponseModel: function () {
                var oResponseModel = new JSONModel({
                    "responseModel": {
                        "content": ""
                    }
                });
                return oResponseModel;
            },
            createJSONModel: function (oCtrl, modelOf) {
                /// View1 Models
                if (modelOf === "currFrgModel") {
                    var switchFragments = new sap.ui.model.json.JSONModel({
                        frg: { "frName": "" }
                    });
                    return switchFragments;
                } else if (modelOf === "objStorageModel") {
                    var ObjectStorageFile = new sap.ui.model.json.JSONModel([]);
                    return ObjectStorageFile;
                }
                else if (modelOf === "appFileModel") {
                    var oModel = new sap.ui.model.json.JSONModel({
                        selectedFileName: "",
                        aFiles: [],
                        aFilesList: [],
                    });
                    return oModel;
                }
                else if (modelOf === "selKeyDetDetModel") {
                    var keytoSend = oCtrl.getView().byId("navigationList").getSelectedKey();
                    var selKeyForDetailDetail = new sap.ui.model.json.JSONModel({ keyD: keytoSend });
                    return selKeyForDetailDetail;
                }
                else if (modelOf === "prmLibaddprmModel") {
                    var enSysPromp = new sap.ui.model.json.JSONModel({ en: false, temp: "", sysKey: "", vis: false, isUpdate: false });
                    return enSysPromp;
                }
                else if (modelOf === "addPrmOpen") {
                    var scenarioEn = new sap.ui.model.json.JSONModel({ isAddPromptOpen: true })
                    return scenarioEn;
                }
                else if (modelOf === "tabState") {
                    var oTabStateModel = new sap.ui.model.json.JSONModel({
                        currentKey: "bdPMO",   // or whatever your default is
                        tabs: {}               // will hold state per nav key

                    });
                    return oTabStateModel;
                } else if (modelOf === "fileViewModel") {
                    var fileViewModel = new sap.ui.model.json.JSONModel({ Key: "", Name: "", srcUrl: "", xlsJsonData: "", content: "" });
                    return fileViewModel;
                } else if (modelOf === "ragModel") {
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
                        currentRagEnabled: false,
                        chatBotRagEnabled: false
                    };

                    var oRagModel = new sap.ui.model.json.JSONModel(ragModelData);
                    return oRagModel;
                }
                else if (modelOf === "ragFileModel") {
                    var oFileModel = new sap.ui.model.json.JSONModel({
                        BS: [],
                        User: [],
                        fstoconf: [],
                        fstots: [],
                        tstocode: [],
                        coderem: [],
                        codesum: [],
                        TUT: []
                    });
                    return oFileModel;
                } else if (modelOf === "promptModel") {
                    var initPromptModel = new sap.ui.model.json.JSONModel([]);
                    return initPromptModel;
                } else if (modelOf === "aMsgModel") {
                    var msgModel = new sap.ui.model.json.JSONModel({ aMsg: [] });
                    return msgModel;
                } else if (modelOf === "ampTCGModel") {
                    var tcgModel = new sap.ui.model.json.JSONModel({
                        wordFilePath: sap.ui.require.toUrl("aicockpitfeq/templates/TCG_Template_File.docx"),
                        excelFilePath: sap.ui.require.toUrl("aicockpitfeq/templates/TCG_Template_File.xlsx"),
                        linkVis: false,
                        wordorExcel: "",
                        selVal: "",
                        allResponses: []
                    });
                    return tcgModel;
                } else if (modelOf === "expandModel") {
                    var expModel = new sap.ui.model.json.JSONModel({});
                    return expModel;
                } else if (modelOf === "ampPCTStepModel") {
                    var stepModel = new sap.ui.model.json.JSONModel({ output: [] });
                    return stepModel;
                } else if (modelOf === "projectModel") {
                    var prjModel = new sap.ui.model.json.JSONModel([]);
                    return prjModel;
                } else if (modelOf === "switchTemp") {
                    var switchTempModel = new sap.ui.model.json.JSONModel({ roleofTemplate: "" });
                    return switchTempModel;
                }
                else if (modelOf === "categoryModel") {
                    var catData = [{
                        catkey: "BS",
                        catText: "Business Discussion/PMO"
                    },
                    {
                        catkey: "User",
                        catText: "User Story Creation"
                    },
                    {
                        catkey: "fstoconf",
                        catText: "Functional Configuration/FSD"
                    },
                    {
                        catkey: "fstots",
                        catText: "Technical Specification"
                    },
                    {
                        catkey: "tstocode",
                        catText: "Code Generation"
                    },
                    {
                        catkey: "coderem",
                        catText: "Code Remediation"
                    },
                    {
                        catkey: "codesum",
                        catText: "Code Summary"
                    },
                    {
                        catkey: "TUT",
                        catText: "Technical Unit Testing"
                    }];
                    var catModel = new sap.ui.model.json.JSONModel(catData);
                    return catModel;
                }
                else if (modelOf === "msgType") {
                      var msgTypData = [{
                    msgkey: "system",
                    msgText: "System"
                },
                {
                    msgkey: "user",
                    msgText: "Prompt"
                }];
                var msgtypeModel = new sap.ui.model.json.JSONModel(msgTypData);
                    return msgtypeModel;
                }
                ///App View Models
                else if (modelOf === "chatAppModel") {
                    var chatModel = new sap.ui.model.json.JSONModel({
                        data: []
                    });
                    return chatModel;
                } else if (modelOf === "ragChatbotModel") {
                    var ragModelDataChat = {
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
                        currentRagEnabled: false,
                        chatBotRagEnabled: false
                    };

                    var oRagModelChat = new sap.ui.model.json.JSONModel(ragModelDataChat);
                    return oRagModelChat;
                }else if (modelOf === "aMsgModelChatBot") {
                    let msgModelChatbot = new sap.ui.model.json.JSONModel({ aMsg: [] });
                    return msgModelChatbot;
                }
                // else if(modelOf === "git"){
                //     var gitData={
                //         repoUrl:"",
                //         username:"",
                //         patToken:"",
                //         commitMsg:"",
                //         branchName:"",
                //         branches:{},
                //         selectedBranch:"",
                //         gitFileStr:{}
                //     }
                //     var gitModel = new sap.ui.model.json.JSONModel(gitData);
                //     return gitModel;
                // }
            },

            getOrchestrationDeploymentId: function (basePath) {
                if (_sDeploymentId) {
                    return Promise.resolve(_sDeploymentId);
                }
                if (_oDeploymentIdPromise) {
                    return _oDeploymentIdPromise;
                }
                _oDeploymentIdPromise = fetch(basePath + "/lm/deployments", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "AI-Resource-Group": "default"
                    }
                })
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (data) {
                        var deployment = (data.resources || []).find(function (item) {
                            return item.configurationName === "orchestration" &&
                                item.status === "RUNNING";
                        });
                        if (deployment && deployment.id) {
                            _sDeploymentId = deployment.id;
                        }
                        return _sDeploymentId;
                    })
                    .catch(function (error) {
                        console.error("Failed to fetch orchestration deployment ID:", error);
                        _oDeploymentIdPromise = null;
                        return null;
                    });

                return _oDeploymentIdPromise;
            },
               aiModelDefaultPayload: function (apiModelName) {
                let defaultPayload = {}, retPayload;

                if (apiModelName === "amazon--nova-pro") {
                    defaultPayload = {
                        comnPopUpModelParamTemp: 0.5,
                        comnPopUpModelParamMaxLength: 6144,
                        maxValue: 10240,
                        tempVis: true,
                        maxRespVis: true,
                        topPVis: false,
                        freqPVis: false,
                        presPVis: false

                    };
                }
                // 
                else if (apiModelName === "amazon--nova-lite") {
                    defaultPayload = {
                        comnPopUpModelParamTemp: 0.5,
                        comnPopUpModelParamMaxLength: 3932,
                        maxValue: 65535,
                        tempVis: true,
                        maxRespVis: true,
                        topPVis: false,
                        freqPVis: false,
                        presPVis: false

                    };
                } else if (apiModelName == "amazon--nova-micro") {
                    defaultPayload = {
                        comnPopUpModelParamTemp: 0.5,
                        comnPopUpModelParamMaxLength:6000,
                        maxValue: 10000,
                        tempVis: true,
                        maxRespVis: true,
                        topPVis: false,
                        freqPVis: false,
                        presPVis: false

                    };
                }else if (apiModelName.includes("anthropic")) {
                    // || apiModelName == 'anthropic--claude-4.6-sonnet'
                    if (apiModelName == "anthropic--claude-4.7-opus" || apiModelName == "anthropic--claude-3-haiku" ) {
                        // comnPopUpModelParamMaxLength: 1000000,
                        defaultPayload = {
                            anthropic_version: "bedrock-2023-05-314",
                            comnPopUpModelParamTemp: 1,
                            comnPopUpModelParamMaxLength: 120000,
                            maxValue: 200000,
                            tempVis: true,
                            maxRespVis: true,
                            topPVis: false,
                            freqPVis: false,
                            presPVis: false
                        };
                    } else if(apiModelName == "anthropic--claude-4.5-opus"){
                        
                        defaultPayload = {
                            anthropic_version: "bedrock-2023-05-314",
                            comnPopUpModelParamTemp: 1,
                            comnPopUpModelParamMaxLength: 38400,
                            maxValue: 64000,
                            tempVis: true,
                            maxRespVis: true,
                            topPVis: false,
                            freqPVis: false,
                            presPVis: false
                        };
                    }else {
                        defaultPayload = {
                            anthropic_version: "bedrock-2023-05-31",
                            comnPopUpModelParamTemp: 1,
                            comnPopUpModelParamMaxLength: 76800,
                            maxValue: 128000,
                            tempVis: true,
                            maxRespVis: true,
                            topPVis: false,
                            freqPVis: false,
                            presPVis: false
                        };
                    }
                }
                else if (apiModelName.includes("gpt")) {
                    if (apiModelName === "gpt-5" || apiModelName === "gpt-5-mini" || apiModelName === "gpt-5-nano" || apiModelName === "gpt-5.5") {
                        defaultPayload = {
                            // comnPopUpModelParamMaxLength: 272000,
                            comnPopUpModelParamMaxLength: 76800,
                            maxValue: 128000,
                            tempVis: false,
                            maxRespVis: true,
                            topPVis: false,
                            freqPVis: false,
                            presPVis: false
                        };
                    } else if (apiModelName === "gpt-5.4") {
                        defaultPayload = {
                            comnPopUpModelParamMaxLength: 630000,
                            maxValue: 1050000,
                            tempVis: false,
                            maxRespVis: true,
                            topPVis: false,
                            freqPVis: false,
                            presPVis: false
                        };
                    } else if (apiModelName === "gpt-4.1" || apiModelName == "gpt-4.1-nano" || apiModelName == "gpt-4.1-mini") {
                        defaultPayload = {
                            comnPopUpModelParamTemp: 1,
                            // comnPopUpModelParamMaxLength: 1047576,
                            comnPopUpModelParamMaxLength: 19660,
                            maxValue: 32768,
                            comnPopUpModelParamFreqP: 0,
                            comnPopUpModelParamPresenceP: 0,
                            tempVis: true,
                            maxRespVis: true,
                            topPVis: false,
                            freqPVis: true,
                            presPVis: true
                        };
                    } else {
                        defaultPayload = {
                            comnPopUpModelParamTemp: 1,
                            comnPopUpModelParamMaxLength: 9830,
                            maxValue: 16384,
                            comnPopUpModelParamFreqP: 0,
                            comnPopUpModelParamPresenceP: 0,
                            tempVis: true,
                            maxRespVis: true,
                            topPVis: false,
                            freqPVis: true,
                            presPVis: true
                        };
                    }
                } else if (apiModelName === "mistralai--mistral-large-instruct") {
                    ///not in ai models list
                    defaultPayload = {
                        model: "mistralai--mistral-large-instruct",
                        comnPopUpModelParamTemp: 1,
                        comnPopUpModelParamFreqP: 0,
                        comnPopUpModelParamPresenceP: 0,
                        comnPopUpModelParamMaxLength: 38400,
                        maxValue: 64000,
                        tempVis: true,
                        maxRespVis: true,
                        topPVis: true,
                        freqPVis: true,
                        presPVis: true
                    };
                }
                else if (apiModelName === "mistralai--mistral-medium-instruct") {
                    defaultPayload = {
                        model: "mistralai--mistral-medium-instruct",
                        comnPopUpModelParamTemp: 1,
                        comnPopUpModelParamFreqP: 0,
                        comnPopUpModelParamPresenceP: 0,
                        comnPopUpModelParamMaxLength: 76800,
                        maxValue: 128000,
                        tempVis: true,
                        maxRespVis: true,
                        topPVis: true,
                        freqPVis: true,
                        presPVis: true
                    };
                }
                else if (apiModelName === "mistralai--mistral-small-instruct" || apiModelName === "mistralai--mistral-small") {
                    defaultPayload = {
                        model: "mistralai--mistral-small-instruct",
                        comnPopUpModelParamTemp: 1,
                        comnPopUpModelParamFreqP: 0,
                        comnPopUpModelParamPresenceP: 0,
                        comnPopUpModelParamMaxLength: 76800,
                        maxValue: 128000,
                        tempVis: true,
                        maxRespVis: true,
                        topPVis: false,
                        freqPVis: true,
                        presPVis: true
                    };
                } else if (apiModelName === "o3") {
                    //200000
                    defaultPayload = {
                        model: "o3",
                        comnPopUpModelParamMaxLength: 60000,
                        maxValue: 100000,
                        tempVis: false,
                        maxRespVis: true,
                        topPVis: false,
                        freqPVis: false,
                        presPVis: false
                    };
                } else if (apiModelName === "o4-mini") {
                    //200000
                    defaultPayload = {
                        model: "o3",
                        comnPopUpModelParamMaxLength: 60000,
                        maxValue: 100000,
                        tempVis: false,
                        maxRespVis: true,
                        topPVis: false,
                        freqPVis: false,
                        presPVis: false
                    };
                } else if (apiModelName === "sonar") {
                    defaultPayload = {
                        comnPopUpModelParamTemp: 0.3,
                        comnPopUpModelParamMaxLength: 76800,
                        maxValue: 128000,
                        tempVis: true,
                        maxRespVis: true,
                        topPVis: false,
                        freqPVis: false,
                        presPVis: false
                    };
                }
                else if (apiModelName === "sonar-pro") {
                    defaultPayload = {
                        comnPopUpModelParamTemp: 1.9,
                        comnPopUpModelParamMaxLength: 120000,
                        maxValue: 200000,
                        tempVis: true,
                        maxRespVis: true,
                        topPVis: false,
                        freqPVis: false,
                        presPVis: false
                    };
                }
                else if (apiModelName === "sap-abap-1") {
                    defaultPayload = {
                        model: "sap-abap-1",
                        comnPopUpModelParamTemp: 0.5,
                        comnPopUpModelParamMaxLength: 19660,
                        maxValue: 32768,
                        tempVis: true,
                        maxRespVis: true,
                        topPVis: false,
                        freqPVis: false,
                        presPVis: false
                    };
                }
                 else if (apiModelName === "cohere--command-a-reasoning") {
                    defaultPayload = {
                        model: "cohere--command-a-reasoning",
                        comnPopUpModelParamTemp: 1,
                        comnPopUpModelParamMaxLength: 2457,
                        maxValue: 4096,
                        comnPopUpModelParamFreqP: 0,
                        comnPopUpModelParamPresenceP: 0,
                        tempVis: true,
                        maxRespVis: true,
                        topPVis: false,
                        freqPVis: true,
                        presPVis: true
                    };
                }
                 else if (apiModelName === "gemini-2.5-pro") {
                    defaultPayload = {
                        comnPopUpModelParamTemp: 2,
                        comnPopUpModelParamMaxLength: 39321,
                        maxValue: 65536,
                        tempVis: true,
                        maxRespVis: true,
                        topPVis: false,
                        freqPVis: false,
                        presPVis: false
                    };
                }
                else if (apiModelName === "gemini-2.5-pro"|| apiModelName === "gemini-2.5-flash" || apiModelName === "gemini-3.5-flash") {
                    defaultPayload = {
                        comnPopUpModelParamTemp: 2,
                        comnPopUpModelParamMaxLength: 39321,
                        maxValue: 65536,
                        tempVis: true,
                        maxRespVis: true,
                        topPVis: false,
                        freqPVis: false,
                        presPVis: false
                    };
                }
                else if (apiModelName === "gemini-3.1-flash-lite" || apiModelName === "gemini-2.5-flash-lite") {
                 defaultPayload = {
                      
                        comnPopUpModelParamMaxLength: 39321,
                        maxValue: 65536,
                        tempVis: false,
                        maxRespVis: true,
                        topPVis: false,
                        freqPVis: false,
                        presPVis: false
                    };   
                }
                else {
                    defaultPayload = {
                        comnPopUpModelParamTemp: 1,
                        comnPopUpModelParamTopP: 0,
                        comnPopUpModelParamFreqP: 0,
                        comnPopUpModelParamPresenceP: 0,
                        comnPopUpModelParamMaxLength: 76800,
                        maxValue: 128000,
                        tempVis: true,
                        maxRespVis: true,
                        topPVis: true,
                        freqPVis: true,
                        presPVis: true
                    };
                }
                retPayload = new sap.ui.model.json.JSONModel(defaultPayload);
                return retPayload;
            }

        };

    });