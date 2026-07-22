sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "aicockpitfeq/util/Utility",
    "../model/formatter",
    "aicockpitfeq/model/models",
], (BaseController, Fragment, Utility, formatter, models) => {
    "use strict";

    return BaseController.extend("aicockpitfeq.controller.App", {
        formatter: formatter,
        defaultHeaders: {
            "AI-Resource-Group": "default",
            "Content-Security-Policy": "default-src'none'"
        },
        onInit() {
            var that = this;
            // var chatModel = new sap.ui.model.json.JSONModel({
            //     data: []
            // });
            ////models
            const aMsgModelForChatBot = models.createJSONModel(this, "aMsgModelChatBot");
            this.getView().setModel(aMsgModelForChatBot, "aMsgModelForChatBot");

            var chatModel = models.createJSONModel(this, "chatAppModel");
            this.getView().setModel(chatModel, "chatModel");
            // Start of Aishwarya
            this.oView = this.getView();
            this._ProjectDetail = "";
            this._speakerOn = false;
            this._isListening = false;

            // Feature detection for Web Speech API
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                this._recognition = null;
                // Optional: disable mic button if not supported
                var micBtn = sap.ui.getCore().byId("micButton");
                if (micBtn) { micBtn.setEnabled(false); }
                return;
            }

            // Create one reusable recognition instance
            this._recognition = new SpeechRecognition();
            this._recognition.lang = "en-IN";      // set your locale (e.g., "en-US", "hi-IN", etc.)
            this._recognition.continuous = false;  // one utterance per click
            this._recognition.interimResults = false;

            // Bind callbacks to controller context
            this._recognition.onresult = this._onVoiceResult.bind(this);
            this._recognition.onerror = this._onVoiceError.bind(this);
            this._recognition.onend = this._onVoiceEnd.bind(this);
            this.oOwnerComponent = this.getOwnerComponent();
            this.oRouter = this.oOwnerComponent.getRouter();
            this.oRouter.attachRouteMatched(this.onRouteMatched, this);
            ////models
            var oRagModel = models.createJSONModel(this, "ragChatbotModel");
            this.getView().setModel(oRagModel, "ragModel");

            var sIconPath = sap.ui.require.toUrl("aicockpitfeq/images/sapCompanyLogo.png");
            this.getView().byId("chatbot").setIcon(sIconPath);

            // Set base path for cockpit calls
            var sComponentName = this.getOwnerComponent().getManifestObject().getComponentName();
            this._sBasePath = sap.ui.require.toUrl(sComponentName.replace(/\./g, "/"));
            //End Of Aishwarya

            window.onbeforeunload = function (event) {

                that.getLogoutTime();

                return "";
            };
        },
        // getLogoutTime: function () {

        //     var that = this;
        //     var mailId = that.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/loggedInUserEmailId");
        //     var date = new Date().toISOString();
        //     var logout_time = date.slice(0, date.indexOf("."));
        //     logout_time = logout_time + "Z";
        //     var sessionId = that.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/sessionId");
        //     var oPayload = {
        //         Email_Id: mailId,
        //         logout_time: logout_time,
        //         session_id: sessionId
        //     };
        //     let oHeader = {
        //         "Access-Control-Allow-Origin": "https://*.hana.ondemand.com/**" || null,
        //         "Access-Control-Allow-Methods": "POST, GET, PUT, PATCH, DELETE" || null,
        //         "X-Frame-Options": "DENY",
        //         "X-XSS-Protection": "0",
        //         "X-Content-Type-Options": "nosniff"
        //     };
        //     var payload = {};

        //     payload["payload"] = oPayload;
        //     $.ajax({
        //         url: this._sBasePath + '/cockpit/saveLogout',
        //         type: "POST",
        //         headers: oHeader,
        //         contentType: "application/json",
        //         data: JSON.stringify(payload),
        //         success: function (data, status, xhr) {
        //             console.log("logout time recorded");
        //             console.log(data.value.message);
        //         },
        //         error: function (jqXhr, textStatus, errorMessage) {
        //             console.log("Error");
        //             console.log(JSON.parse(jqXhr.responseText).error.message);
        //         }
        //     });
        // },
        //For chatbot RAG citations by Aishwarya
        
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
            let oHeaders = {
                "X-Frame-Options": "DENY",
                "X-XSS-Protection": "0",
                "X-Content-Type-Options": "nosniff",
                "Access-Control-Allow-Origin": "https://*.hana.ondemand.com/**" || null,
                "Access-Control-Allow-Methods": "POST, GET, PUT, PATCH, DELETE" || null
            };
 
            // Synchronous XHR completes BEFORE the browser navigates to the logout URL,
            var xhr = new XMLHttpRequest();
            xhr.open("POST", sUrl, false); // false = synchronous
            xhr.setRequestHeader("Content-Type", "application/json");
            try {
                xhr.send(payload);
            } catch (e) {
                // Sync XHR blocked (strict browser policy)
                if (navigator.sendBeacon) {
                    navigator.sendBeacon(sUrl, new Blob([payload], { type: "application/json" }));
                }
                console.warn("saveLogout sync XHR failed, used sendBeacon instead", e);
            }
        },

        isCitationsVisible: function (citations) {
            return Array.isArray(citations) && citations.length > 0;
        },
        onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name"),
                oArguments = oEvent.getParameter("arguments");

            // Save the current route name
            this.currentRouteName = sRouteName;
            //this.currentProduct = oArguments.product;
        },
        onStateChanged: function (oEvent) {
            var bIsNavigationArrow = oEvent.getParameter("isNavigationArrow"),
                sLayout = oEvent.getParameter("layout");
            sLayout = "TwoColumnsMidExpanded";

            // Replace the URL with the new layout if a navigation arrow was used
            if (bIsNavigationArrow) {
                this.oRouter.navTo(this.currentRouteName, { layout: sLayout }, true);
            }
        },
        onExit: function () {
            this.oRouter.detachRouteMatched(this.onRouteMatched, this);
        },

        // Start of Aishwarya for Chatbot 
        onToggleChat: function () {
            var oPanel = this.byId("chatPanel");
            oPanel.setVisible(!oPanel.getVisible());
        },
        onOpenChat: function () {
            var that = this;
            if (!this._oChatDialog) {
                this._oChatDialog = sap.ui.xmlfragment("aicockpitfeq.fragment.ChatBot", this);
                this._oChatDialog.attachBrowserEvent("keydown", function (oEvent) {
                    if (oEvent.key === "Escape") {
                        oEvent.stopPropagation();
                        oEvent.preventDefault();
                    }
                });
                this.getView().addDependent(this._oChatDialog);
            }
            this.callChatGPTModelforChatbot();
            this._oChatDialog.open();


            var oTgl = sap.ui.getCore().byId("speakerToggle");
            if (oTgl) {
                oTgl.setPressed(this._speakerOn);
                oTgl.setIcon(this._speakerOn ? "sap-icon://sound-loud" : "sap-icon://sound-off");
            }


            var userName = this.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/loggedInUserName");
            var oChatModel = this.getView().getModel("chatModel");
            var aData = oChatModel.getProperty("/data") || [];
            if (aData.length === 0) {
                aData.push({
                    aiResponse: `Hello ${userName}, How can I help you?`,
                    Citations: []
                });
                oChatModel.setProperty("/data", aData);
            }
        },
        onClear: function () {
            sap.ui.getCore().byId("chatInput").setValue("");
        },
        onValidatePress: function (query) {

            if (query === "" || null) {
                sap.m.MessageToast.show("Please enter your query!", {
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
        onNewChat: function () {

            this._stopSpeaking({ resetToggle: false });
            this.getView().getModel("aMsgModelForChatBot").setProperty("/aMsg", []);
            if (this._recognition && this._isListening) {
                try { this._recognition.stop(); } catch (e) {
                    console.error('Error stopping recognition:', e);
                }
                this._isListening = false;
                const oMicBtn = sap.ui.getCore().byId("micButton");
                if (oMicBtn) { oMicBtn.setType("Default"); }
            }

            const oChatModel = this.getView().getModel("chatModel");
            if (oChatModel) {
                oChatModel.setProperty("/data", []);
            }
            const userName = this.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/loggedInUserName");
            let aData = oChatModel.getProperty("/data") || [];
            if (aData.length === 0) {
                aData.push({
                    aiResponse: `Hello ${userName}, How can I help you?`,
                    Citations: []
                });
                oChatModel.setProperty("/data", aData);
            }

        },
        onSendMessage: async function () {
            const that = this;
            const oSendBtn = sap.ui.getCore().byId("sendButton");
            const oList = sap.ui.getCore().byId("chatListChatBot");
            const currentIcon = oSendBtn.getIcon();
            let noScript = true;
            if (currentIcon === "sap-icon://stop") {

                if (this._chatAbortController) {
                    this._chatAbortController.abort();
                    this._chatAbortController = null;
                }

                sap.m.MessageToast.show("Request stopped.");
                this._resetSendButton();
                return;
            }

            if (currentIcon === "sap-icon://paper-plane") {
                const query = sap.ui.getCore().byId("chatInput").getValue().trim();
                if (!query) {
                    sap.m.MessageToast.show("Please enter a message.");
                    return;
                }

                const validate = this.onValidatePress(query);
                if (!validate) {
                    sap.m.MessageToast.show("Validation failed.");
                    return;
                }

                const chatBotRagEnabled = sap.ui.getCore().byId("RagSwitch2").getSelected();
                if (chatBotRagEnabled) {
                    that.KBImplimentChatbot(query);
                } else {
                    const oSelect = sap.ui.getCore().byId("chatModelSelect");
                    const modelKey = oSelect.getSelectedKey();
                    const modelText = oSelect.getSelectedItem().getText();

                    oSendBtn.setIcon("sap-icon://stop");
                    const chatModel = this.getView().getModel("chatModel");
                    let aData = chatModel.getProperty("/data") || [];
                    const oChatItem = {
                        userMessage: query,
                        aiResponse: ""
                    };
                    aData.push(oChatItem);
                    chatModel.setProperty("/data", aData);
                    sap.ui.getCore().byId("chatInput").setValue("");

                    setTimeout(() => {
                        oList.scrollToIndex(aData.length - 1);
                    }, 0);

                    const aMsgModelChatBot = this.getView().getModel("aMsgModelForChatBot");
                    const allMsgs = aMsgModelChatBot.oData.aMsg;
                    allMsgs.push({
                        "role": "user",
                        "content": query
                    });
                    this.getView().getModel("aMsgModelForChatBot").setProperty("/aMsg", allMsgs);

                    const oViewModel = this.getView().getModel("chatModel");
                    that.callChatGPTModelforChatbot();
                    const apiUrl = await that.getApiUrlforChatbot(modelText, modelKey, this.sApiUrl);
                    const payload = that.createPayloadBasedOnModelforChatbot(modelKey, allMsgs, oViewModel, this);

                    this._chatAbortController = new AbortController();
                    try {
                        const response = await fetch(apiUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Access-Control-Allow-Origin": "https://*.hana.ondemand.com/**" || null,
                                "Access-Control-Allow-Methods": "POST, GET, PUT, PATCH, DELETE" || null,
                                "X-Frame-Options": "DENY",
                                "X-XSS-Protection": "0",
                                "X-Content-Type-Options": "nosniff",
                                ...this.defaultHeaders
                            },
                            body: JSON.stringify(payload),
                            signal: this._chatAbortController.signal
                        });

                        const data = await response.json();

                        let answer = "";

                        if (data.orchestration_result && data.orchestration_result.choices && data.orchestration_result.choices.length > 0) {
                            const msg = data.orchestration_result.choices[0].message;
                            if (msg?.content) {
                                answer = msg.content;
                            }
                        }
                        else if (data.choices && data.choices.length > 0) {
                            const msg = data.choices[0].message;
                            if (msg?.content) {
                                answer = msg.content;
                            }
                        }
                        else if (data.output_text) {
                            answer = data.output_text;
                        }
                        else if (data.content && Array.isArray(data.content)) {
                            answer = data.content
                                .filter(c => c.type === "text")
                                .map(c => c.text)
                                .join("\n");
                        }

                        allMsgs.push({
                            "role": "assistant",
                            "content": answer
                        });
                        this.getView().getModel("aMsgModelForChatBot").setProperty("/aMsg", allMsgs);
                        this.getView().getModel("aMsgModelForChatBot").refresh();

                        if (!answer) {
                            answer = "No response received from model.";
                        }
                        oChatItem.aiResponse = answer;
                        chatModel.refresh(true);
                        setTimeout(() => {
                            oList.scrollToIndex(aData.length - 1);
                        }, 0);

                        that.speakText(answer);
                        that._resetSendButton();

                    } catch (error) {
                        if (error.name === "AbortError") {
                            console.log("Request aborted by user.");
                        } else {
                            console.error("API call failed:", error);
                            sap.m.MessageBox.error("Some error occurred. Please try again.");
                        }
                        that._resetSendButton();

                    } finally {
                        this._chatAbortController = null;
                    }
                }
            }
        },
        callChatGPTModelforChatbot: async function () {
            const that = this;
            const allowedModels = [
                "gpt-5",
                "gpt-4o",
                "anthropic--claude-3.5-sonnet",
                "mistralai--mistral-small-instruct",
                "mistralai--mistral-large-instruct",
                "anthropic--claude-4.5-opus"
            ];

            const sUrl = this._sBasePath + "/lm/scenarios/foundation-models/models";

            $.ajax({
                url: sUrl,
                type: "GET",
                headers: {
                    "Access-Control-Allow-Origin": "https://*.hana.ondemand.com/**" || null,
                    "Access-Control-Allow-Methods": "POST, GET, PUT, PATCH, DELETE" || null,
                    "X-Frame-Options": "DENY",
                    "X-XSS-Protection": "0",
                    "X-Content-Type-Options": "nosniff",
                     ...this.defaultHeaders
                },
                success: function (data, status, xhr) {
                    const aModels = (data && data.resources) ? data.resources : [];

                    const updatedGptModelsforChatbot = aModels
                        .filter(function (item) {
                            return allowedModels.includes(item.model);
                        })
                        .map(function (item) {
                            return {
                                key: item.model,
                                text: item.model
                            };
                        });

                    that.SelectedModel =
                        updatedGptModelsforChatbot.length > 0
                            ? updatedGptModelsforChatbot[0].key
                            : "";

                    const oViewModel = that.getView().getModel("chatModel");

                    oViewModel.setProperty(
                        "/gptModels",
                        updatedGptModelsforChatbot
                    );
                },
                error: function (jqXhr, textStatus, errorMessage) {
                    try {
                        sap.m.MessageBox.error(JSON.parse(jqXhr.responseText).error.message);
                    } catch (e) {
                        sap.m.MessageBox.error("Failed to load models: " + jqXhr.statusText);
                    }
                }
            });
        },
        getApiUrlforChatbot: async function (apiModelName, aiKey, sApiUrl) {
            const deploymentId = await models.getOrchestrationDeploymentId(this._sBasePath);
            if (!deploymentId) {
                throw new Error("Orchestration deployment not found");
            }
            return this._sBasePath + `/deployments/${deploymentId}/completion`;
        },
        createPayloadBasedOnModelforChatbot: function (apiModelName, aMessages, oViewModel, controllerContext) {
            const template = (aMessages || [])
                .filter(function (m) { return m && typeof m.content !== "undefined"; })
                .map(function (m) {
                    return { role: m.role, content: m.content };
                });
 
            return {
                orchestration_config: {
                    module_configurations: {
                        templating_module_config: {
                            template: template
                        },
                        llm_module_config: {
                            model_name: apiModelName,
                            model_params: {
                            }
                        }
                    }
                },
            };
        },
        sanitizePayloadMessagesforChatbot: function (aMessages) {
            var userPrompt = null;
            var sanitized = [];
            var lastRole = null;

            aMessages.forEach(function (msg) {
                // Ensure msg.content is a string before using .trim()
                const isStringContent = typeof msg.content === "string";

                if (msg.role === "user") {
                    if (!userPrompt && isStringContent && msg.content.trim() !== "") {
                        userPrompt = msg.content.trim();
                    }
                    sanitized.push(msg);
                    return;
                }

                if (!isStringContent || msg.content.trim() === "" || msg.role === lastRole) {
                    sanitized.push(msg);
                    return;
                }

                lastRole = msg.role;
            });

            return {
                user: userPrompt,
                messages: sanitized
            };

        },
        // _createAnthropicPayloadFromModelfrChatbot: function (aMessages, stop, oViewModel) {
        //     return {
        //         anthropic_version: "bedrock-2023-05-31",
        //         messages: aMessages,
        //         max_tokens: 1024,
        //         temperature: 0.7
        //     };
        // },

        // _createGPTModelPayloadFromModelfrChatbot: function (aMessages, nonStream) {
        //     return {
        //         messages: aMessages,
        //         temperature: 1,
        //         max_completion_tokens: 32000,
        //         stop: null
        //     }
        // },
        // _createMistralPayloadFromModelfrChatbot: function (aMessages, stop, nonStream, oViewModel) {
        //     return {
        //         model: "mistralai--mistral-large-instruct",
        //         messages: aMessages,
        //         temperature: 0.7,
        //         top_p: 0.95,
        //         frequency_penalty: 0.1,
        //         presence_penalty: 0.1,
        //         max_tokens: 4000,
        //         stop: stop || null
        //     };
        // },
        // _createMistralSmallPayloadFromModelfrChatbot: function (aMessages, stop, nonStream, oViewModel) {
        //     return {
        //         model: "mistralai--mistral-small-instruct",
        //         messages: aMessages,
        //         temperature: 0.7,
        //         top_p: 0.95,
        //         frequency_penalty: 0.1,
        //         presence_penalty: 0.1,
        //         max_tokens: 4000,
        //         stop: stop || null
        //     };
        // },
        // _createPayloadFromModelfrChatbot: function (aMessages, stop, nonStream, oViewModel) {
        //     return {
        //         messages: aMessages,
        //         temperature: 0.7,
        //         top_p: 0.95,
        //         frequency_penalty: 0.1,
        //         presence_penalty: 0.1,
        //         max_tokens: 4000,
        //         stop: stop || null
        //     };
        // },
        //Start of Aishwarya for chatbot RAG 
        KBImplimentChatbot: async function (userMessage) {
            //main function for RAG 
            let oSendBtn = sap.ui.core.Fragment.byId(this.getView().getId(), "sendButton");
            var oList = sap.ui.getCore().byId("chatListChatBot");
            var oChatModel = this.getView().getModel("chatModel");
            var aData = oChatModel.getProperty("/data") || [];
            // var modelKey = sap.ui.getCore().byId("chatModelSelect").getSelectedKey();
            var oSelect = sap.ui.getCore().byId("chatModelSelect");
            var modelKey = oSelect.getSelectedKey();
            var modelText = oSelect.getSelectedItem().getText();
            var apiUrl = this.KBModelSelect(modelText);
            if (!apiUrl) {
                sap.m.MessageBox.error("Unsupported/unknown AI model selected.");
                return;
            }

            var oChatItem = {
                userMessage: userMessage,
                aiResponse: "",
                Citations: []
            };

            aData.push(oChatItem);

            oChatModel.setProperty("/data", aData);
            setTimeout(() => {
                oList.scrollToIndex(aData.length - 1);
            }, 0);

            sap.ui.getCore().byId("chatInput").setValue("");
            if (oSendBtn) { oSendBtn.setIcon("sap-icon://stop"); }
            var category = "BS";
            var project = this.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/selectedProject");// single lookup

            var aMessages = [
                { role: "system", content: "" },
                { role: "user", content: userMessage }
            ];
            const aMsgModelChatBot = this.getView().getModel("aMsgModelForChatBot");
            const allMsgs = aMsgModelChatBot.oData.aMsg;
            if (allMsgs.length == 0) {
                allMsgs.push({ role: "system", content: "" });
            }
            allMsgs.push({
                "role": "user",
                "content": userMessage
            });
            this.getView().getModel("aMsgModelForChatBot").setProperty("/aMsg", allMsgs);

            var payload = {
                category: category,
                project: project,
                prompt: userMessage,
                streaming: false,
                modelPayload: JSON.stringify({
                    messages: allMsgs,
                    stream: false
                })
            };

            const controller = new AbortController();
            this._chatAbortController = controller;

            try {
                const resp = await fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "https://*.hana.ondemand.com/**" || null,
                        "Access-Control-Allow-Methods": "POST, GET, PUT, PATCH, DELETE" || null,
                        "X-Frame-Options": "DENY",
                        "X-XSS-Protection": "0",
                        "X-Content-Type-Options": "nosniff",
                        ...(this.defaultHeaders || {})
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                if (!resp.ok) {
                    const errText = await resp.text().catch(() => "");
                    throw new Error(`HTTP ${resp.status}: ${errText || resp.statusText}`);
                }

                const data = await resp.json();
                var result = this.KnowledgeBase(data);

                // var lastIdx = (oChatModel.getProperty("/data") || []).length - 1;
                // if (lastIdx >= 0) {
                //     oChatModel.setProperty(`/data/${lastIdx}/aiResponse`, result.aiResponse);
                //     oChatModel.setProperty(`/data/${lastIdx}/Citations`, result.Citations || []);
                //     oChatModel.refresh(true);
                oChatItem.aiResponse = result.aiResponse || "No answer available.";
                oChatItem.Citations = result.Citations || [];
                oChatModel.refresh(true);

                setTimeout(() => {
                    oList.scrollToIndex(aData.length - 1);
                }, 0);

                if (this.speakText) {
                    this.speakText(oChatItem.aiResponse);
                }

                // this.speakText && this.speakText(result.aiResponse);

            } catch (error) {
                if (error.name === "AbortError") {
                    sap.m.MessageToast.show("Request stopped.");
                } else {
                    sap.m.MessageBox.error("RAG request failed. " + error.message);
                    var lastIdxErr = (oChatModel.getProperty("/data") || []).length - 1;
                    if (lastIdxErr >= 0) {
                        // oChatModel.setProperty(`/data/${lastIdxErr}/aiResponse`, "No answer available.");
                        // oChatModel.setProperty(`/data/${lastIdxErr}/Citations`, []);
                        // oChatModel.refresh(true);
                        oChatItem.aiResponse = "No answer available.";
                        oChatItem.Citations = [];
                        oChatModel.refresh(true);
                    }
                }
            } finally {
                this._resetSendButton && this._resetSendButton();
                this._chatAbortController = null;

                setTimeout(() => {
                    oList.scrollToIndex(aData.length - 1);
                }, 0);

            }
        },
        KnowledgeBase: function (data) {
            //getting ai response and citation
            var aiResponse =
                (data && (data.answer ||
                    (data.response && data.response.answer) ||
                    data.content ||
                    (data.message && data.message.content))) ||
                "No answer available.";
            var citations = [];

            if (Array.isArray(data && data.metadata)) {
                citations = (data.metadata || []).map(function (m) {
                    var filePath = (m && (m.source || m.file_path)) || "";
                    var fname = filePath ? filePath.split("/").pop() : (m && (m.file_name || m.title)) || "Unknown";
                    var link = (m && (m.view_url || m.url || m.sharepoint_link)) || "";
                    return { fname: fname, link: link };
                });
            } else if (Array.isArray(data && data.citation)) {
                citations = (data.citation || []).map(function (_c, idx) {
                    var meta = (Array.isArray(data.metadata) && data.metadata[idx]) || {};
                    var filePath = (meta && (meta.source || meta.file_path)) || "";
                    var fname = filePath ? filePath.split("/").pop() : (meta && (meta.file_name || meta.title)) || "Unknown";
                    var link = (meta && (meta.view_url || meta.url || meta.sharepoint_link)) || "";
                    return { fname: fname, link: link };
                });
            }
            citations=citations.filter(ml => {if(ml.link!==""){return ml}});
            return {
                aiResponse: aiResponse,
                Citations: citations
            };
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
        _resetSendButton: function () {
            var oSendBtn = sap.ui.getCore().byId("sendButton");
            oSendBtn.setIcon("sap-icon://paper-plane");
        },
        onStopRequest: function () {
            if (this._xhr) {
                this._xhr.abort(); // Cancel the AJAX request
                sap.m.MessageToast.show("Request stopped.");
            }
            this._resetSendButton();
        },
        onCloseChat: function () {

            // Stop TTS and reset the speaker toggle to OFF on close
            this._stopSpeaking({ resetToggle: true });

            // Stop mic if recording
            if (this._recognition && this._isListening) {
                try { this._recognition.stop(); } catch (e) { }
                this._isListening = false;
                var oMicBtn = sap.ui.getCore().byId("micButton");
                if (oMicBtn) { oMicBtn.setType("Default"); }
            }

            var oChatModel = this.getView().getModel("chatModel");
            if (oChatModel) {
                oChatModel.setProperty("/data", []); // Clear all messages
            }
            if (this._oChatDialog) {
                this._oChatDialog.close();
            }
        },
        onVoiceInput: function () {
            // Guard: browser not supported
            if (!this._recognition) {
                sap.m.MessageToast.show("Voice input is not supported in this browser.");
                return;
            }

            var oMicBtn = sap.ui.getCore().byId("micButton");

            // If already listening, clicking mic again stops recognition
            if (this._isListening) {
                try { this._recognition.stop(); } catch (e) { }
                return;
            }

            // Start listening (requires HTTPS & user permission)
            this._isListening = true;
            if (oMicBtn) { oMicBtn.setType("Emphasized"); }
            sap.m.MessageToast.show("Listening… Speak now.");

            try {
                this._recognition.start();
            } catch (e) {
                // Some browsers throw if start() is called too quickly
                this._isListening = false;
                if (oMicBtn) { oMicBtn.setType("Default"); }
                console.error("Could not start recognition:", e);
                sap.m.MessageToast.show("Could not start microphone.");
            }
        },
        _stopSpeaking: function (opts) {
            // opts: { resetToggle: boolean }
            try {
                if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                }
            } catch (e) {
                // no-op
            }

            if (opts && opts.resetToggle) {
                this._speakerOn = false;
                var oTgl = sap.ui.getCore().byId("speakerToggle");
                if (oTgl) {
                    oTgl.setPressed(false);
                    oTgl.setIcon("sap-icon://sound-off");
                }
            }
        },


        // Called when speech is recognized
        _onVoiceResult: function (event) {
            // Get best transcript
            var voiceText = (event.results && event.results[0] && event.results[0][0] && event.results[0][0].transcript) || "";

            // Put text into chat input
            sap.ui.getCore().byId("chatInput").setValue(voiceText);

            // Auto-send (toggle this as needed)
            // If you prefer manual send, comment out the next line:
            // this.onSendOrStop();
            this.onSendMessage();
        },

        // Called on errors: no-speech, audio-capture, not-allowed, etc.
        _onVoiceError: function (event) {
            console.error("Voice input error:", event && event.error);
            // Friendly messages per error type
            var msg = "Voice input error.";
            switch (event && event.error) {
                case "no-speech": msg = "No speech detected. Please try again."; break;
                case "audio-capture": msg = "No microphone detected."; break;
                case "not-allowed": msg = "Microphone permission denied."; break;
                case "aborted": msg = "Voice capture aborted."; break;
                default: msg = "Voice input error: " + (event && event.error || "unknown");
            }
            sap.m.MessageToast.show(msg);

            // Ensure UI resets
            this._isListening = false;
            var oMicBtn = sap.ui.getCore().byId("micButton");
            if (oMicBtn) { oMicBtn.setType("Default"); }
        },

        // Called when recognition stops (naturally or via stop())
        _onVoiceEnd: function () {
            this._isListening = false;
            var oMicBtn = sap.ui.getCore().byId("micButton");
            if (oMicBtn) { oMicBtn.setType("Default"); }
        },


        speakText: function (text) {
            if (!this._speakerOn) return;                 // ← respect toggle
            if (!text || !window.speechSynthesis) return;

            try { window.speechSynthesis.cancel(); } catch (e) { }
            var utter = new SpeechSynthesisUtterance(text);

            // Tune to your locale and preferences
            utter.lang = "en-IN";  // e.g., "en-US", "en-GB"
            utter.rate = 1.35;
            utter.pitch = 5;

            window.speechSynthesis.speak(utter);
        },


        onSpeakerToggle: function (oEvent) {
            var oTgl = oEvent.getSource();
            var pressed = oTgl.getPressed();

            // Update internal flag
            this._speakerOn = pressed;

            // Update icon based on state
            if (pressed) {
                oTgl.setIcon("sap-icon://sound-loud");
            } else {
                oTgl.setIcon("sap-icon://sound-off");
                // If turning OFF while speaking, stop TTS
                if (window.speechSynthesis) {
                    try { window.speechSynthesis.cancel(); } catch (e) { }
                }
            }
        },
        refresh: function () {
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            this.executedOnce = false;
            var that = this;

            sap.m.MessageBox.information(oBundle.getText("warningSystemMessage"), {
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
        onDownloadPDF: function () {
            // Directly handle Knowledge Base dialog content
            var oChatModel = this.getView().getModel("chatModel");
            var aChatData = oChatModel ? oChatModel.getProperty("/data") : [];

            if (!aChatData || aChatData.length === 0) {
                sap.m.MessageToast.show("No Knowledge Base data available to export.");
                return;
            }

            // Prepare PDF content
            var content = [
                { text: "Knowledge Base Export", style: "header", margin: [0, 0, 0, 20] }
            ];

            aChatData.forEach(function (item) {
                // User Prompt
                content.push({ text: "User Prompt:", style: "label" });
                content.push({ text: item.userMessage || "", margin: [0, 2, 0, 8] });

                // AI Response
                content.push({ text: "AI Response:", style: "label" });
                content.push({ text: item.aiResponse || "", margin: [0, 2, 0, 8] });

                // Citations
                if (item.Citations && item.Citations.length > 0) {
                    content.push({ text: "Citation:", style: "label" });
                    item.Citations.forEach(function (c) {
                        content.push({
                            text: c.content || c.citation || "No file name",
                            margin: [10, 2, 0, 2],
                            fontSize: 11
                        });

                        if (c.link) {
                            content.push({
                                text: c.linkText || "Open Document",
                                link: c.link,
                                color: "#0b5ed7",
                                decoration: "underline",
                                fontSize: 10,
                                margin: [10, 0, 0, 6]
                            });
                        }
                    });
                }

                content.push({ text: "\n" });
            });

            // PDF definition
            var docDefinition = {
                pageSize: "A4",
                pageMargins: [40, 40, 40, 40],
                content: content,
                styles: {
                    header: { fontSize: 18, bold: true },
                    label: { fontSize: 12, bold: true }
                },
                defaultStyle: { fontSize: 11 }
            };

            // Generate and download PDF
            pdfMake.createPdf(docDefinition).download("KnowledgeBase_Export.pdf");
        },
        hasText: function (sText) {
            return !!(sText && sText.trim());
        },
        // End of Aishwarya for Chatbot
        onJ4CLinkPress: function () {
            window.open("https://jouleforconsultants.eu10.sapdas.cloud.sap/joule", "_blank");
        },

    });
});