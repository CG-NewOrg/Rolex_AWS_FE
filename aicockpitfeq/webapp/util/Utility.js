sap.ui.define([
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/BusyDialog",
    "sap/ui/model/json/JSONModel"
], function (Fragment, MessageBox, BusyDialog, JSONModel) {
    "use strict";

    return {

        initializeModel: function (view, modelName, dataObject) {
            if (dataObject && Array.isArray(dataObject.messages)) {

                // dataObject.messages.unshift({
                //     PROMPTID: "",
                //     PROMPT_TEMPLATE: ""
                // });
            } else {
                console.error("initializeModel: 'messages' must be an array inside the data object.");
                return;
            }

            var oModel = new sap.ui.model.json.JSONModel(dataObject);
            view.setModel(oModel, modelName);
        },
        initializePromptModels: function (view, modelName, dataArray) {
            // dataArray.unshift({
            //     key: "Select Prompt",
            //     text: "Select Prompt"
            // });
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(dataArray);
            view.setModel(oModel, modelName);
        },
        getSystemMessage: function (oView, sId) {

        },
        getApiUrl: function (apiModelName, aiKey, sApiUrl, basePath) {

            if (apiModelName && apiModelName.toLowerCase().includes("sap-abap")) {
                return `${basePath}/deployments/${aiKey}/completion`;
            } else if (apiModelName === "anthropic--claude-3.5-sonnet" || apiModelName === "anthropic--claude-3-haiku" || apiModelName === "anthropic--claude-3-sonnet" || apiModelName === "anthropic--claude-4.5-opus" || apiModelName === "anthropic--claude-4-sonnet") {
                return `${basePath}/deployments/${aiKey}/invoke`;
            } else if (apiModelName === "mistralai--mistral-large-instruct") {
                return `${basePath}/deployments/${aiKey}/chat/completions`;
            }
            else if (apiModelName === "amazon--nova-pro") {

                return `${basePath}/deployments/${aiKey}/converse-stream`;
            }

            else {
                if (apiModelName == "o3") {
                    sApiUrl = '2024-12-01-preview';
                }
                const v = sApiUrl || "2024-12-01-preview";
                return `${basePath}/deployments/${aiKey}/chat/completions?api-version=${v}`;
            }
        },
        createPayloadBasedOnModel: function (apiModelName, aMessages, oViewModel, controllerContext) {
            var stop = null;
            // var isPopupOpen = oViewModel.getProperty("/isParamPopupOpen");
            // var isPopupEdited = oViewModel.getProperty("/isParamPopupEdited");
            var payload;
            //for (var r = 0; r < aMessages.length; r++) {
            //     if (apiModelName.includes("anthropic")) {
            //         if (aMessages[r].role == "system") {
            //             aMessages[r].role = "user";
            //         }
            //     } else {
            //         if (aMessages[r].role == "system") {
            //             aMessages[r].role = "system";
            //         }
            //     }
            for (var r = 0; r < aMessages.length; r++) {
                if (apiModelName.includes("anthropic")) {
                    if (aMessages[r].role == "system") {
                        aMessages[r].role = "user";
                    }
                    if (apiModelName == "anthropic--claude-3-haiku") {
                        if (aMessages[r].role == "user" && aMessages[r + 1] && aMessages[r + 1].role == "user") {
                            aMessages[r + 1].role = "assistant";
                        }
                    }
                    if (aMessages[r].role == "assistant" && aMessages[r + 1] && aMessages[r + 1].role == "assistant") {
                        aMessages[r + 1].role = "user";
                    }
                } else {
                    if (aMessages[r].role == "system") {
                        aMessages[r].role = "system";
                    }
                }
                if (!apiModelName.includes("amazon--nova-pro") && aMessages[r].role == "assistant" && aMessages[r].usedTokens) {
                    delete aMessages[r].usedTokens;
                }

            }
            if (controllerContext.savedSettings == false) {
                // if (isPopupOpen && isPopupEdited) {
                var { system, messages: cleanedMessages } = this.sanitizePayloadMessages(aMessages);
                //var { system, messages: cleanedMessages } = this.sanitizePayloadMessages(aMessages);
                if (apiModelName === "anthropic--claude-3.5-sonnet") {
                    payload = this._createAnthropicPayload(cleanedMessages, system, controllerContext);
                    //payload = this._createAnthropicPayload(aMessages, system, oViewModel);
                } else if (apiModelName === "gpt-5" || apiModelName === "gpt-5-mini" || apiModelName === "gpt-5-nano") {
                    payload = this._createGPTModelPayload(aMessages, false);
                }
                else if (apiModelName === "mistralai--mistral-large-instruct") {
                    if (aMessages && aMessages.length > 0 && aMessages[0].role === "assistant") {
                        aMessages[0].role = "system";
                    }
                    payload = this._createMistralPayload(aMessages, stop, false, controllerContext);
                } else if (apiModelName === "anthropic--claude-3-haiku" || apiModelName === "anthropic--claude-3-sonnet" || apiModelName === "anthropic--claude-4.5-opus" || apiModelName === "anthropic--claude-4-sonnet") {

                    payload = this._createBasicAnthropicPayload(cleanedMessages, system);
                    //payload = this._createBasicAnthropicPayload(aMessages);
                } else if (apiModelName === "mistralai--mistral-small-instruct") {

                    if (aMessages && aMessages.length > 0 && aMessages[0].role === "assistant") {
                        aMessages[0].role = "system";
                    }
                    var payload = this._createMistralSmallPayload(aMessages, stop, false, controllerContext);
                } else if (apiModelName === "mistralai--mistral-medium-instruct") {

                    if (aMessages && aMessages.length > 0 && aMessages[0].role === "assistant") {
                        aMessages[0].role = "system";
                    }
                    var payload = this._createMistralMediumPayload(aMessages, stop, false, controllerContext);
                }
                else if (apiModelName === "amazon--nova-pro") {

                    var payload = this._createNovaProPayload(aMessages, stop, false, controllerContext);
                }
                else if (apiModelName === "o3") {

                    var payload = this._createo3Payload(aMessages, false, controllerContext);
                }
                else if (apiModelName === "sonar") {

                    var payload = this._createSonarPayload(aMessages, false, controllerContext);
                } else if (apiModelName === "sap-abap-1") {

                    var payload = this._createABAPPayload(aMessages, apiModelName);

                }
                else {
                    payload = this._createModelPayload(aMessages, stop, false, controllerContext);
                }
            } else {

                // for (var r = 0; r < aMessages.length; r++) {
                //     if (apiModelName.includes("anthropic")) {
                //         if (aMessages[r].role == "system") {
                //             aMessages[r].role = "user";
                //         }
                //     } if (aMessages[r].role == "system") {
                //         aMessages[r].role = "system";
                //     }
                // }
                var { system, messages: cleanedMessages } = this.sanitizePayloadMessages(aMessages);
                // var { system, messages: cleanedMessages } = this.sanitizePayloadMessages(aMessages);
                if (apiModelName === "anthropic--claude-3.5-sonnet") {
                    payload = this._createAnthropicPayloadFromModel(cleanedMessages, system, oViewModel);
                    //payload = this._createAnthropicPayloadFromModel(aMessages);
                } else if (apiModelName === "mistralai--mistral-large-instruct") {
                    if (aMessages && aMessages.length > 0 && aMessages[0].role === "assistant") {
                        aMessages[0].role = "system";
                    }
                    payload = this._createMistralPayloadFromModel(aMessages, stop, false, oViewModel);
                } else if (apiModelName === "anthropic--claude-3-haiku" || apiModelName === "anthropic--claude-3-sonnet" || apiModelName === "anthropic--claude-4.5-opus" || apiModelName === "anthropic--claude-4-sonnet") {

                    payload = this._createBasicAnthropicPayload(cleanedMessages, system);
                    //    payload = this._createBasicAnthropicPayload(aMessages);
                } else if (apiModelName === "gpt-5" || apiModelName === "gpt-5-mini" || apiModelName === "gpt-5-nano") {
                    payload = this._createGPTModelPayloadFromModel(aMessages, false);
                }
                else if (apiModelName === "mistralai--mistral-small-instruct") {

                    if (aMessages && aMessages.length > 0 && aMessages[0].role === "assistant") {
                        aMessages[0].role = "system";
                    }
                    var payload = this._createMistralSmallPayloadFromModel(aMessages, stop, false, oViewModel);
                } else if (apiModelName === "mistralai--mistral-medium-instruct") {

                    if (aMessages && aMessages.length > 0 && aMessages[0].role === "assistant") {
                        aMessages[0].role = "system";
                    }
                    var payload = this._createMistralMediumPayloadFromModel(aMessages, stop, false, oViewModel);
                }
                else if (apiModelName === "amazon--nova-pro") {
                    var payload = this._createNovaProPayloadFromModel(aMessages, stop, false, oViewModel);
                }
                else if (apiModelName === "o3") {
                    var payload = this._createo3PayloadFromModel(aMessages, false, oViewModel);
                } else if (apiModelName === "sonar") {
                    var payload = this._createSonarPayloadFromModel(aMessages, false, oViewModel);
                }
                else if (apiModelName === "sap-abap-1") {
                    var payload = this._createABAPPayloadFromModel(aMessages, apiModelName, oViewModel);
                }
                else {
                    payload = this._createPayloadFromModel(aMessages, stop, false, oViewModel);
                }
            }
            return payload;
        },
        createPayloadBasedOnModelNonStream: function (apiModelName, aMessages, oViewModel, controllerContext, promptMsgData) {
            var stop = null;
            // var isPopupOpen = oViewModel.getProperty("/isParamPopupOpen");
            // var isPopupEdited = oViewModel.getProperty("/isParamPopupEdited");
            var payload;
            // if (isPopupOpen && isPopupEdited) {
            // for (var r = 0; r < aMessages.length; r++) {
            //     if (apiModelName.includes("anthropic")) {
            //         if (aMessages[r].role == "system") {
            //             aMessages[r].role = "user";
            //         }

            //     } else {
            //         if (aMessages[r].role == "system") {
            //             aMessages[r].role = "system";
            //         }
            //     }
            for (var r = 0; r < aMessages.length; r++) {
                if (apiModelName.includes("anthropic")) {
                    if (aMessages[r].role == "system") {
                        aMessages[r].role = "user";
                    }
                    if (apiModelName == "anthropic--claude-3-haiku") {
                        if (aMessages[r].role == "user" && aMessages[r + 1] && aMessages[r + 1].role == "user") {
                            aMessages[r + 1].role = "assistant";
                        }
                        if (aMessages[r].role == "assistant" && aMessages[r + 1] && aMessages[r + 1].role == "assistant") {
                            aMessages[r + 1].role = "user";
                        }
                    }

                } else {
                    if (aMessages[r].role == "system") {
                        aMessages[r].role = "system";
                    }
                }
                if (!apiModelName.includes("amazon--nova-pro") && aMessages[r].role == "assistant" && aMessages[r].usedTokens) {
                    delete aMessages[r].usedTokens;
                }
            }
            if (apiModelName == "anthropic--claude-3-haiku") {
                var totalL = aMessages.length;
                if (aMessages[totalL - 1].role !== "user") {
                    aMessages.push({ "role": "user", "content": promptMsgData });
                }
            }
            if (controllerContext.savedSettings == false) {
                // if (isPopupOpen && isPopupEdited) {
                var { system, messages: cleanedMessages } = this.sanitizePayloadMessages(aMessages);
                // var { system, messages: cleanedMessages } = this.sanitizePayloadMessages(aMessages);
                if (apiModelName === "anthropic--claude-3.5-sonnet") {
                    //  payload = this._createAnthropicPayload(aMessages, system, oViewModel);
                    payload = this._createAnthropicPayload(cleanedMessages, system, controllerContext);
                } else if (apiModelName === "gpt-5" || apiModelName === "gpt-5-mini" || apiModelName === "gpt-5-nano") {
                    payload = this._createGPTModelPayload(aMessages, true);
                }
                else if (apiModelName === "mistralai--mistral-large-instruct") {
                    if (aMessages && aMessages.length > 0 && aMessages[0].role === "assistant") {
                        aMessages[0].role = "system";
                    }
                    payload = this._createMistralPayload(aMessages, stop, true, controllerContext);
                } else if (apiModelName === "anthropic--claude-3-haiku" || apiModelName === "anthropic--claude-3-sonnet" || apiModelName === "anthropic--claude-4.5-opus" || apiModelName === "anthropic--claude-4-sonnet") {

                    payload = this._createBasicAnthropicPayload(cleanedMessages, system);
                    //payload = this._createBasicAnthropicPayload(aMessages);
                } else if (apiModelName === "mistralai--mistral-small-instruct") {

                    if (aMessages && aMessages.length > 0 && aMessages[0].role === "assistant") {
                        aMessages[0].role = "system";
                    }
                    var payload = this._createMistralSmallPayload(aMessages, stop, true, controllerContext);
                } else if (apiModelName === "mistralai--mistral-medium-instruct") {

                    if (aMessages && aMessages.length > 0 && aMessages[0].role === "assistant") {
                        aMessages[0].role = "system";
                    }
                    var payload = this._createMistralMediumPayload(aMessages, stop, true, controllerContext);
                }
                else if (apiModelName === "amazon--nova-pro") {
                    var payload = this._createNovaProPayload(aMessages, stop, true, controllerContext);
                } else if (apiModelName === "o3") {

                    var payload = this._createo3Payload(aMessages, true, controllerContext);
                }
                else if (apiModelName === "sonar") {

                    var payload = this._createSonarPayload(aMessages, true, controllerContext);
                } else if (apiModelName === "sap-abap-1") {

                    var payload = this._createABAPPayload(aMessages, apiModelName);

                }
                else {
                    payload = this._createModelPayload(aMessages, stop, true, controllerContext);
                }
            } else {
                var { system, messages: cleanedMessages } = this.sanitizePayloadMessages(aMessages);
                // var { system, messages: cleanedMessages } = this.sanitizePayloadMessages(aMessages);
                if (apiModelName === "anthropic--claude-3.5-sonnet") {
                    payload = this._createAnthropicPayloadFromModel(cleanedMessages, system, oViewModel);
                    // payload = this._createAnthropicPayloadFromModel(aMessages);
                } else if (apiModelName === "mistralai--mistral-large-instruct") {
                    if (aMessages && aMessages.length > 0 && aMessages[0].role === "assistant") {
                        aMessages[0].role = "system";
                    }
                    payload = this._createMistralPayloadFromModel(aMessages, stop, true, oViewModel);
                } else if (apiModelName === "anthropic--claude-3-haiku" || apiModelName === "anthropic--claude-3-sonnet" || apiModelName === "anthropic--claude-4.5-opus" || apiModelName === "anthropic--claude-4-sonnet") {

                    payload = this._createBasicAnthropicPayload(cleanedMessages, system);
                    //    payload = this._createBasicAnthropicPayload(aMessages);

                } else if (apiModelName === "gpt-5" || apiModelName === "gpt-5-mini" || apiModelName === "gpt-5-nano") {
                    payload = this._createGPTModelPayloadFromModel(aMessages, true);
                }
                else if (apiModelName === "mistralai--mistral-small-instruct") {

                    if (aMessages && aMessages.length > 0 && aMessages[0].role === "assistant") {
                        aMessages[0].role = "system";
                    }
                    var payload = this._createMistralSmallPayloadFromModel(aMessages, stop, true, oViewModel);
                } else if (apiModelName === "mistralai--mistral-medium-instruct") {

                    if (aMessages && aMessages.length > 0 && aMessages[0].role === "assistant") {
                        aMessages[0].role = "system";
                    }
                    var payload = this._createMistralMediumPayloadFromModel(aMessages, stop, true, oViewModel);
                }
                else if (apiModelName === "amazon--nova-pro") {

                    var payload = this._createNovaProPayloadFromModel(aMessages, stop, true, oViewModel);
                }
                else if (apiModelName === "o3") {
                    var payload = this._createo3PayloadFromModel(aMessages, true, oViewModel);
                } else if (apiModelName === "sonar") {
                    var payload = this._createSonarPayloadFromModel(aMessages, true, oViewModel);
                }
                else if (apiModelName === "sap-abap-1") {
                    var payload = this._createABAPPayloadFromModel(aMessages, apiModelName, oViewModel);
                }
                else {
                    payload = this._createPayloadFromModel(aMessages, stop, true, oViewModel);
                }
            }
            return payload;
        },
        sanitizePayloadMessages: function (aMessages) {
            var systemPrompt = null;
            var sanitized = [];
            var lastRole = null;

            aMessages.forEach(function (msg) {
                // Ensure msg.content is a string before using .trim()
                const isStringContent = typeof msg.content === "string";

                if (msg.role === "system") {
                    if (!systemPrompt && isStringContent && msg.content.trim() !== "") {
                        systemPrompt = msg.content.trim();
                    }
                    return;
                }

                if (!isStringContent || msg.content.trim() === "") {
                    return;
                }
                if (msg.role === lastRole) {
                    return; 
                }

                if (sanitized.length === 0 && msg.role === "assistant") {
                    return;  // 
                }

                // Trim trailing whitespace from content to fix Anthropic API error
                var sanitizedMsg = {
                    role: msg.role,
                    content: msg.content.trimEnd()
                };
                sanitized.push(sanitizedMsg);
                lastRole = msg.role;
            });

            return {
                system: systemPrompt ? systemPrompt.trimEnd() : systemPrompt,
                messages: sanitized
            };

        },

        //create payload based on stream and AI model
        _createABAPPayload: function (aMessages, apiModelName) {
            var filteredMessages = aMessages
                .filter(function (msg) { return msg.role !== "system"; })
                .map(function (msg) {
                    var clean = { role: msg.role, content: msg.content };
                    return clean;
                });

            return {
                orchestration_config: {
                    module_configurations: {
                        templating_module_config: {
                            template: filteredMessages
                        },
                        llm_module_config: {
                            model_name: apiModelName
                        }
                    }
                }
            };
        },

        _createABAPPayloadFromModel: function (aMessages, apiModelName, oViewModel) {
            var filteredMessages = aMessages
                .filter(function (msg) { return msg.role !== "system"; })
                .map(function (msg) {
                    var clean = { role: msg.role, content: msg.content };
                    return clean;
                });

            return {
                orchestration_config: {
                    module_configurations: {
                        templating_module_config: {
                            template: filteredMessages
                        },
                        llm_module_config: {
                            model_name: apiModelName,
                            model_params: {
                                temperature: oViewModel.getProperty("/comnPopUpModelParamTemp"),
                                top_p: oViewModel.getProperty("/comnPopUpModelParamTopP"),
                                max_tokens: oViewModel.getProperty("/comnPopUpModelParamMaxLength")
                            }
                        }
                    }
                }
            };
        },
        _createPayloadFromModel: function (aMessages, stop, nonStream, oViewModel) {
            return {
                messages: aMessages,
                temperature: oViewModel.getProperty("/comnPopUpModelParamTemp"),
                top_p: oViewModel.getProperty("/comnPopUpModelParamTopP"),
                frequency_penalty: oViewModel.getProperty("/comnPopUpModelParamFreqP"),
                presence_penalty: oViewModel.getProperty("/comnPopUpModelParamPresenceP"),
                max_tokens: oViewModel.getProperty("/comnPopUpModelParamMaxLength"),
                stop: stop,
                stream: nonStream ? false : true

            };
        },
        _createo3PayloadFromModel: function (aMessages, nonStream) {
            return {
                "model": "o3",
                "messages": aMessages,
                "temperature": 1,
                "max_completion_tokens": 24576,
                "stream": nonStream ? false : true
            };
        },
        _createSonarPayloadFromModel: function (aMessages, nonStream) {
            return {
                "model": "sonar",
                "messages": aMessages,
                "max_tokens": 4096,
                "stop": null,
                "stream": nonStream ? false : true
            };
        },
        _createNovaProPayloadFromModel: function (aMessages, stop, nonStream, oViewModel) {
            // Format messages for Nova Pro: convert 'system' to 'user' and wrap content
            const formattedMessages = aMessages.map(msg => {
                const role = (msg.role === "system") ? "user" : msg.role;
                return {
                    role: role,
                    content: [{ text: msg.content }]
                };
            });

            return {
                model: "amazon--nova-pro",
                messages: formattedMessages,
                inferenceConfig: {
                    temperature: oViewModel.getProperty("/comnPopUpModelParamTemp"),
                    topP: oViewModel.getProperty("/comnPopUpModelParamTopP"),
                    maxTokens: oViewModel.getProperty("/comnPopUpModelParamMaxLength")
                },
                stopSequences: Array.isArray(stop) ? stop : [],
                stream: nonStream ? false : true
            };
        },
        _createMistralMediumPayloadFromModel: function (aMessages, stop, nonStream, oViewModel) {
            return {
                model: "mistralai--mistral-medium-instruct",
                messages: aMessages,
                temperature: oViewModel.getProperty("/comnPopUpModelParamTemp"),
                top_p: oViewModel.getProperty("/comnPopUpModelParamTopP"),
                frequency_penalty: oViewModel.getProperty("/comnPopUpModelParamFreqP"),
                presence_penalty: oViewModel.getProperty("/comnPopUpModelParamPresenceP"),
                max_tokens: oViewModel.getProperty("/comnPopUpModelParamMaxLength"),
                stop: stop,
                stream: nonStream ? false : true
            };
        },
        _createMistralSmallPayloadFromModel: function (aMessages, stop, nonStream, oViewModel) {
            return {
                model: "mistralai--mistral-small-instruct",
                messages: aMessages,
                temperature: oViewModel.getProperty("/comnPopUpModelParamTemp"),
                top_p: oViewModel.getProperty("/comnPopUpModelParamTopP"),
                frequency_penalty: oViewModel.getProperty("/comnPopUpModelParamFreqP"),
                presence_penalty: oViewModel.getProperty("/comnPopUpModelParamPresenceP"),
                max_tokens: oViewModel.getProperty("/comnPopUpModelParamMaxLength"),
                stop: stop,
                stream: nonStream ? false : true
            };
        },
        _createGPTModelPayloadFromModel: function (aMessages, nonStream) {
            return {
                messages: aMessages,
                temperature: 1,
                max_completion_tokens: 32000,
                stop: null,
                stream: nonStream ? false : true
            }
        },
        _createBasicAnthropicPayload: function (payloadtext) {
            return {
                anthropic_version: "bedrock-2023-05-31",
                messages: payloadtext,
                temperature: 1,
                max_tokens: 4096
                // stream: true
            };
        },
        _createMistralPayloadFromModel: function (aMessages, stop, nonStream, oViewModel) {
            return {
                model: "mistralai--mistral-large-instruct",
                messages: aMessages,
                temperature: oViewModel.getProperty("/comnPopUpModelParamTemp"),
                top_p: oViewModel.getProperty("/comnPopUpModelParamTopP"),
                frequency_penalty: oViewModel.getProperty("/comnPopUpModelParamFreqP"),
                presence_penalty: oViewModel.getProperty("/comnPopUpModelParamPresenceP"),
                max_tokens: oViewModel.getProperty("/comnPopUpModelParamMaxLength"),
                stop: stop,
                stream: nonStream ? false : true
            };
        },
        _createAnthropicPayloadFromModel: function (payloadText, stop, oViewModel) {
            return {
                anthropic_version: "bedrock-2023-05-31",
                messages: payloadText,
                temperature: oViewModel.getProperty("/comnPopUpModelParamTemp"),
                top_p: oViewModel.getProperty("/comnPopUpModelParamTopP"),
                max_tokens: oViewModel.getProperty("/comnPopUpModelParamMaxLength"),
                // stream: true
            };
        },
        _createModelPayload: function (aMessages, stop, nonStream, _this) {
            return {
                messages: aMessages,
                temperature: _this._savedTemperature,
                top_p: _this._savedTopP,
                frequency_penalty: _this._freqPenalty,
                presence_penalty: _this._prePenalty,
                max_tokens: _this._maxResponse,
                stop: stop,
                stream: nonStream ? false : true
            };
        },
        _createNovaProPayload: function (aMessages, stop, nonStream) {
            // Format messages for Nova Pro: convert 'system' to 'user' and wrap content
            const formattedMessages = aMessages.map(msg => {
                const role = (msg.role === "system") ? "user" : msg.role;
                return {
                    role: role,
                    content: [{ text: msg.content }]
                };
            });

            return {
                model: "amazon--nova-pro",
                messages: formattedMessages,
                inferenceConfig: {
                    temperature: oViewModel.getProperty("/comnPopUpModelParamTemp"),
                    topP: oViewModel.getProperty("/comnPopUpModelParamTopP"),
                    maxTokens: oViewModel.getProperty("/comnPopUpModelParamMaxLength")
                },
                stopSequences: Array.isArray(stop) ? stop : [],
                stream: nonStream ? false : true
            };
        },
        _createo3Payload: function (aMessages, nonStream, _this) {
            return {
                "model": "o3",
                "messages": aMessages,
                "temperature": _this._savedTemperature,
                "max_completion_tokens": _this._maxResponse,
                "stream": nonStream ? false : true
            };
        },
        _createSonarPayload: function (aMessages, nonStream, _this) {
            return {
                "model": "sonar",
                "messages": aMessages,
                "max_tokens": _this._maxResponse,
                "stop": null,
                "stream": nonStream ? false : true
            };
        },
        _createMistralMediumPayload: function (aMessages, stop, nonStream, _this) {
            return {
                model: "mistralai--mistral-medium-instruct",
                messages: aMessages,
                temperature: _this._savedTemperature,
                top_p: _this._savedTopP,
                frequency_penalty: _this._freqPenalty,
                presence_penalty: _this._prePenalty,
                max_tokens: _this._maxResponse,
                stop: stop,
                stream: nonStream ? false : true
            };
        },
        _createMistralSmallPayload: function (aMessages, stop, nonStream, _this) {
            return {
                model: "mistralai--mistral-small-instruct",
                messages: aMessages,
                temperature: _this._savedTemperature,
                top_p: _this._savedTopP,
                frequency_penalty: _this._freqPenalty,
                presence_penalty: _this._prePenalty,
                max_tokens: _this._maxResponse,
                stop: stop,
                stream: nonStream ? false : true

            };
        },
        _createMistralPayload: function (aMessages, stop, nonStream, _this) {
            return {
                model: "mistralai--mistral-large-instruct",
                messages: aMessages,
                temperature: this._savedTemperature,
                top_p: this._savedTopP,
                frequency_penalty: this._freqPenalty,
                presence_penalty: this._prePenalty,
                max_tokens: this._maxResponse,
                stop: stop,
                stream: nonStream ? false : true
            };
        },
        _createGPTModelPayload: function (aMessages, nonStream) {
            return {
                messages: aMessages,
                temperature: 1,
                // max_completion_tokens: this._maxResponse,
                max_completion_tokens: 32000,
                stop: null,
                stream: nonStream ? false : true

            }
        },
        _createAnthropicPayload: function (payloadText, system, _this) {
            return {
                anthropic_version: "bedrock-2023-05-31",
                messages: payloadText,
                temperature: _this._savedTemperature,
                top_p: _this._savedTopP,
                max_tokens: _this._maxResponse
                //stream: true
            };
        },
        processAPIResponse: async function (oController, payloadNonStream, response, apiModelName, busyDialog, apiUrl) {
            let oUsedToken, oResMsg, sResponse;
            // busyDialog.open();
            // find the switchId for this tab
            var sSelectedIconTab = oController.selectedKeyFunct();
            // var oTextAreaId = tabToSwitchId[sSelectedIconTab];
            // const oTextArea = oController.getView().byId(oTextAreaId);
            // oTextArea.setValue("");
            // Helper function to allow UI to repaint between chunks
            var ceArr = [];
              // Helper function to parse streaming code blocks progressively
            function parseCodeBlocksStreaming(text) {
                var blocks = [];
                var remaining = text;
                var codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
                var lastIndex = 0;
                var match;
                
                while ((match = codeBlockRegex.exec(text)) !== null) {
                    // Add text before code block
                    if (match.index > lastIndex) {
                        var textBefore = text.substring(lastIndex, match.index);
                        if (textBefore.trim()) {
                            blocks.push({ textData: textBefore, codeData: "", lang: "" });
                        }
                    }
                    // Add code block
                    var lang = match[1] || "";
                    var code = "```" + match[1] + "\n" + match[2] + "```";
                    blocks.push({ textData: "", codeData: code, lang: lang });
                    lastIndex = match.index + match[0].length;
                }
                
                // Add remaining text after last code block
                if (lastIndex < text.length) {
                    var remainingText = text.substring(lastIndex);
                    if (remainingText.trim()) {
                        blocks.push({ textData: remainingText, codeData: "", lang: "" });
                    }
                }
                
                // If no code blocks found, return the text as is
                if (blocks.length === 0 && text.trim()) {
                    blocks.push({ textData: text, codeData: "", lang: "" });
                }
                
                return blocks;
            }
            
            // Helper function to detect incomplete code block at the end
            function hasIncompleteCodeBlock(text) {
                var openCount = (text.match(/```/g) || []).length;
                return openCount % 2 !== 0;
            }
            
            // Helper function to extract current incomplete code block for streaming display
            function getStreamingCodeDisplay(text) {
                var blocks = [];
                var parts = text.split("```");
                
                for (var i = 0; i < parts.length; i++) {
                    if (i % 2 === 0) {
                        // Text part (outside code blocks)
                        if (parts[i].trim()) {
                            blocks.push({ textData: parts[i], codeData: "", lang: "" });
                        }
                    } else {
                        // Code part (inside code blocks)
                        var codeContent = parts[i];
                        var lang = "";
                        var firstNewline = codeContent.indexOf("\n");
                        if (firstNewline > 0) {
                            lang = codeContent.substring(0, firstNewline).trim();
                        }
                        // Check if this is a complete or incomplete code block
                        var isComplete = (i < parts.length - 1) || (parts.length > i + 1);
                        var codeWithBackticks = "```" + codeContent + (isComplete ? "```" : "");
                        blocks.push({ textData: "", codeData: codeWithBackticks, lang: lang });
                    }
                }
                
                return blocks;
            }

            function nextFrame() {
                return new Promise(resolve => requestAnimationFrame(resolve));
            }

            busyDialog.open();
            var tokenData = oController.getView().getModel("TokenLimit").oData;
            var selectedAI = oController.getView().byId("selModel").getSelectedItem().mProperties.text;
            var scenario = oController.selectedKeyFunct();
            var tknUsed = tokenData[scenario][selectedAI].TotalToken;
            oController.getView().getModel("TokenLimit").setProperty("/token", tknUsed);
            async function fetchTokenUsage() {
                // busyDialog.open();
                try {
                    const response = await fetch(apiUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...oController.defaultHeaders
                        },
                        body: JSON.stringify(payloadNonStream)
                    });
                    //   busyDialog.close();
                    //      oController.getView().getModel("airesponseDetailModel").setProperty("/downloadVis", true);
                    const json = await response.json();
                    return json.usage?.total_tokens || null;

                } catch (error) {
                    busyDialog.close();
                    console.error("Token usage fetch failed:", error);
                    return null;
                }
            }
            if (apiModelName === "anthropic--claude-3.5-sonnet" ||
                apiModelName === "anthropic--claude-3-haiku" ||
                apiModelName === "anthropic--claude-3-sonnet" ||
                apiModelName === "anthropic--claude-4.5-opus" ||
                apiModelName === "anthropic--claude-4-sonnet") {

                const aResponse = await response.json();
                if (!aResponse.content || aResponse.content.length === 0) {
                    sResponse = "No response generated by the model.";
                    oResMsg = {
                        role: aResponse.role || "assistant",
                        content: sResponse
                    };
                    oUsedToken = (aResponse.usage?.input_tokens || 0) + (aResponse.usage?.output_tokens || 0);
                } else {
                sResponse = aResponse.content[0].text;
                delete aResponse.content[0].type;
                aResponse.content[0].role = aResponse.role;
                aResponse.content[0].content = sResponse;
                delete aResponse.content[0].text;
                oResMsg = aResponse.content[0];
                oUsedToken = aResponse.usage.input_tokens + aResponse.usage.output_tokens;
                }
                busyDialog.close();
                oController.getView().getModel("airesponseDetailModel").setProperty("/resp", oResMsg.content);
                var beforeText = "", codeText = "", afterText = "", codeLanguage = "";
                //scenario == "coderem" ||
                if (scenario == "tstocode") {
                    var resArr = oResMsg.content.split("```");
                    for (var h = 0; h < resArr.length; h++) {
                        if (resArr[h + 1] !== undefined) {
                            var lang = resArr[h + 1].split("\n")[0];
                            codeLanguage = lang.split("```")[1];
                            ceArr.push({ textData: resArr[h], codeData: "```" + resArr[h + 1], lang: codeLanguage });
                            h++;
                        } else {
                            ceArr.push({ textData: resArr[h], codeData: "", lang: "" });
                        }
                    }
                    // beforeText += oResMsg.content.split("```")[0];
                    // codeText += "```" + oResMsg.content.split("```")[1];
                    // afterText += oResMsg.content.split(codeText)[1];
                    // var lang = codeText.split("\n")[0];
                    // codeLanguage = lang.split("```")[1];
                    oController.getView().getModel("airesponseDetailModel").setProperty("/multiCE", ceArr);
                }
                // oController.getView().getModel("airesponseDetailModel").setProperty("/codeType", codeLanguage);
                oController.getView().getModel("airesponseDetailModel").setProperty("/beforeResult", beforeText);
                // oController.getView().getModel("airesponseDetailModel").setProperty("/codeEdVis", codeText !== "```undefined" ? true : false);
                // oController.getView().getModel("airesponseDetailModel").setProperty("/codeResult", codeText !== "```undefined" ? codeText : "");
                oController.getView().getModel("airesponseDetailModel").setProperty("/afterResult", afterText !== "undefined" ? afterText : "");
                oController.getView().getModel("TokenLimit").setProperty("/usedToken", oUsedToken);
                oController.getView().getModel("TokenLimit").setProperty("/tokenVis", true);
            }
            else if (apiModelName === "amazon--nova-pro") {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                let done = false;
                let accumulatedText = "";
                let result = "";
                let usageData = null;
                const sResponseChunks = [];

                function normalizeChunk(rawData) {
                    return rawData
                        // Fix keys: 'key': → "key":
                        .replace(/'([^']+)':/g, '"$1":')
                        // Fix values: : 'value' → : "value"
                        .replace(/:\s*'([^']*?)'/gs, (_, val) => {
                            // Escape special chars inside values
                            let safeVal = val
                                .replace(/\\/g, "\\\\")
                                .replace(/"/g, '\\"')
                                .replace(/\n/g, "\\n"); // normalize line breaks
                            return `: "${safeVal}"`;
                        })
                        // Remove trailing commas before } or ]
                        .replace(/,(\s*[}\]])/g, "$1");
                }
                while (!done) {
                    const { value, done: streamDone } = await reader.read();
                    done = streamDone;

                    const chunk = decoder.decode(value || new Uint8Array(), { stream: true });
                    accumulatedText += chunk;

                    const lines = accumulatedText.split("\n");
                    accumulatedText = lines.pop(); // keep unfinished line

                    for (const line of lines) {
                        if (!line.trim().startsWith("data: ")) continue;

                        const rawData = line.replace("data: ", "").trim();

                        if (rawData === "[DONE]") {
                            ceArr.push({ textData: oController.getView().getModel("airesponseDetailModel").oData.resp, codeData: "", lang: "" });
                            oController.getView().getModel("airesponseDetailModel").setProperty("/multiCE", ceArr);

                            done = true;
                            break;
                        }

                        try {
                            const safeData = normalizeChunk(rawData);
                            const json = JSON.parse(safeData);

                            const deltaText =
                                json.contentBlockDelta?.delta?.text ||
                                json.generation ||
                                json.text ||
                                "";

                            if (deltaText) {
                                var beforeText = "", codeText = "", afterText = "", codeLanguage = "";
                                var formattedText = deltaText.replaceAll("\\n", "\n");
                                result += formattedText;
                                //scenario == "coderem" ||
                                if (scenario == "tstocode") {
                                    beforeText += result.split("```")[0];
                                    codeText += "```" + result.split("```")[1];
                                    afterText += result.split(codeText)[1];
                                    var lang = codeText.split("\n")[0];
                                    codeLanguage = lang.split("```")[1];
                                    if (afterText !== "undefined" && afterText !== "") {
                                        ceArr.push({ textData: beforeText, codeData: codeText, lang: codeLanguage });
                                        result = "";
                                        oController.getView().getModel("airesponseDetailModel").setProperty("/multiCE", ceArr);
                                    }
                                }
                                busyDialog.close();
                                oController.getView().getModel("airesponseDetailModel").setProperty("/codeType", codeLanguage);
                                oController.getView().getModel("airesponseDetailModel").setProperty("/beforeResult", beforeText);
                                // oController.getView().getModel("airesponseDetailModel").setProperty("/codeEdVis", codeText !== "```undefined" ? true : false);
                                // oController.getView().getModel("airesponseDetailModel").setProperty("/codeResult", codeText !== "```undefined" ? codeText : "");
                                oController.getView().getModel("airesponseDetailModel").setProperty("/afterResult", afterText !== "undefined" ? afterText : "");
                                oController.getView().getModel("airesponseDetailModel").setProperty("/resp", result);
                                await nextFrame();
                                ///check this text area update
                                // if (typeof oTextArea !== "undefined") {
                                //     oTextArea.setValue(result);
                                //     await nextFrame(); // Let UI update
                                // }

                                sResponseChunks.push({
                                    role: "assistant",
                                    content: deltaText
                                });
                            }

                            // Capture usage if present
                            if (json.metadata?.usage) usageData = json.metadata.usage;

                        } catch (err) {
                            busyDialog.close();
                            console.error("Failed to normalize/parse chunk:", rawData, err);
                        }
                    }
                }

                sResponse = result;
                oUsedToken = usageData?.totalTokens || 0;
                oController.getView().getModel("TokenLimit").setProperty("/usedToken", oUsedToken);
                oController.getView().getModel("TokenLimit").setProperty("/tokenVis", true);
                oResMsg = {
                    role: "assistant",
                    usedTokens: oUsedToken,
                    content: sResponse
                };
            }
            else if (apiModelName === "sap-abap-1") {
                const aResponse = await response.json();
                const orchestration = aResponse.orchestration_result;

                const choice = orchestration?.choices?.[0];
                const message = choice?.message;

                sResponse = message?.content || "";

                oResMsg = {
                    role: message?.role || "assistant",
                    content: sResponse
                };

                oUsedToken = orchestration?.usage?.total_tokens || 0;

                var beforeText = "", codeText = "", afterText = "", codeLanguage = "";
                //scenario == "coderem" ||
                if (scenario == "tstocode") {
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
                    oController.getView().getModel("airesponseDetailModel").setProperty("/multiCE", ceArr);
                }
                oController.getView().getModel("airesponseDetailModel").setProperty("/resp", sResponse);
                // oController.getView().getModel("airesponseDetailModel").setProperty("/codeType", codeLanguage);
                oController.getView().getModel("airesponseDetailModel").setProperty("/beforeResult", beforeText);
                // oController.getView().getModel("airesponseDetailModel").setProperty("/codeEdVis", codeText !== "```undefined" ? true : false);
                // oController.getView().getModel("airesponseDetailModel").setProperty("/codeResult", codeText !== "```undefined" ? codeText : "");
                oController.getView().getModel("airesponseDetailModel").setProperty("/afterResult", afterText !== "undefined" ? afterText : "");

                oController.getView().getModel("TokenLimit").setProperty("/usedToken", oUsedToken);
                oController.getView().getModel("TokenLimit").setProperty("/tokenVis", true);
                busyDialog.close();
            }
            else if (response.body && typeof response.body.getReader === 'function') {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let done = false;
                let accumulatedText = '';
                const sResponseChunks = [];
                let result = ''; // Accumulated text for UI
                oUsedToken = await fetchTokenUsage();
                oController.getView().getModel("TokenLimit").setProperty("/usedToken", oUsedToken);
                var tokenData = oController.getView().getModel("TokenLimit").oData;
                var selectedAI = oController.getView().byId("selModel").getSelectedItem().mProperties.text;
                var tknUsed = tokenData[scenario][selectedAI].TotalToken;
                oController.getView().getModel("TokenLimit").setProperty("/token", tknUsed);
                oController.getView().getModel("TokenLimit").setProperty("/tokenVis", true);
                while (!done) {
                    const { value, done: streamDone } = await reader.read();
                    done = streamDone;

                    const chunk = decoder.decode(value, { stream: true });
                    accumulatedText += chunk;

                    const lines = accumulatedText.split('\n');
                    accumulatedText = lines.pop(); // keep unfinished line

                    for (const line of lines) {
                        if (line.trim().startsWith('data: ')) {
                            const data = line.replace('data: ', '').trim();
                            if (data === '[DONE]') {
                                if (scenario == "tstocode") {
                                    var finalResult = oController.getView().getModel("airesponseDetailModel").oData.resp;
                                    ceArr = parseCodeBlocksStreaming(finalResult);
                                    oController.getView().getModel("airesponseDetailModel").setProperty("/multiCE", ceArr);
                                }
                                done = true;
                                break;
                            }
                            try {

                                const json = JSON.parse(data);
                                const deltaText = json.choices?.[0]?.delta?.content;


                                    if (deltaText) {
                                        var beforeText = "", codeText = "", afterText = "", codeLanguage = "";
                                        result += deltaText;
                                        if (scenario == "tstocode") {
                                            var streamingBlocks = getStreamingCodeDisplay(result);
                                            if (streamingBlocks.length > 0) {
                                                var tempCeArr = [];
                                                var parts = result.split("```");
                                                var completedResult = "";
                                                for (var p = 0; p < parts.length; p++) {
                                                    if (p % 2 === 0) {
                                                        // Text part
                                                        if (parts[p].trim() && p < parts.length - 1 && parts.length > 2) {
                                                            // This is text before a code block that's complete
                                                            var nextCodePart = parts[p + 1];
                                                            if (nextCodePart !== undefined && p + 2 < parts.length) {
                                                                var lang = nextCodePart.split("\n")[0] || "";
                                                                tempCeArr.push({ 
                                                                    textData: parts[p], 
                                                                    codeData: "```" + nextCodePart + "```", 
                                                                    lang: lang 
                                                                });
                                                                p++; // Skip the code part
                                                            }
                                                        }
                                                    }
                                                }
                                                
                                                // Check if there's an incomplete code block being streamed
                                                var hasIncomplete = hasIncompleteCodeBlock(result);
                                                if (hasIncomplete) {
                                                    // Find the last incomplete code block
                                                    var lastBacktickIndex = result.lastIndexOf("```");
                                                    var beforeIncomplete = result.substring(0, lastBacktickIndex);
                                                    var incompleteCode = result.substring(lastBacktickIndex);
                                                    
                                                    // Parse completed part
                                                    var completedBlocks = parseCodeBlocksStreaming(beforeIncomplete);
                                                    ceArr = completedBlocks.slice();
                                                    
                                                    // Add streaming code block
                                                    var streamLang = "";
                                                    var codeContent = incompleteCode.substring(3); // Remove opening ```
                                                    var firstNewline = codeContent.indexOf("\n");
                                                    if (firstNewline > 0 && firstNewline < 20) {
                                                        streamLang = codeContent.substring(0, firstNewline).trim();
                                                    }
                                                    ceArr.push({ 
                                                        textData: "", 
                                                        codeData: incompleteCode, 
                                                        lang: streamLang 
                                                    });
                                                } else {
                                                    // All blocks are complete, parse normally
                                                    ceArr = parseCodeBlocksStreaming(result);
                                                }
                                                
                                                oController.getView().getModel("airesponseDetailModel").setProperty("/multiCE", ceArr);
                                            }
                                        }
                                   
                                    oController.getView().getModel("airesponseDetailModel").setProperty("/codeType", codeLanguage);
                                    oController.getView().getModel("airesponseDetailModel").setProperty("/beforeResult", beforeText);
                                    // oController.getView().getModel("airesponseDetailModel").setProperty("/codeEdVis", codeText !== "```undefined" ? true : false);
                                    //oController.getView().getModel("airesponseDetailModel").setProperty("/codeResult", codeText !== "```undefined" ? codeText : "");
                                    oController.getView().getModel("airesponseDetailModel").setProperty("/afterResult", afterText !== "undefined" ? afterText : "");
                                    oController.getView().getModel("airesponseDetailModel").setProperty("/resp", result);
                                    busyDialog.close();
                                    await nextFrame();

                                    sResponseChunks.push({
                                        role: 'assistant',
                                        content: deltaText
                                    });
                                }

                            } catch (err) {
                                busyDialog.close();
                                console.error('Stream parse error:', err);
                            }
                        }
                    }
                }

                sResponse = result;

                oResMsg = {
                    role: 'assistant',
                    content: sResponse
                };
                busyDialog.close();
            }

            else {
                const aResponse = await response.json();
                const choice = aResponse.choices?.[0];
                const message = choice?.message;

                sResponse = message?.content || '';
                oResMsg = {
                    role: message?.role || 'assistant',
                    content: sResponse
                };
                if (scenario == "tstocode") {
                    var resArr = oResMsg.content.split("```");
                    for (var h = 0; h < resArr.length; h++) {
                        if (resArr[h + 1] !== undefined) {
                            var lang = resArr[h + 1].split("\n")[0];
                            codeLanguage = lang.split("```")[1];
                            ceArr.push({ textData: resArr[h], codeData: "```" + resArr[h + 1], lang: codeLanguage });
                            h++;
                        } else {
                            ceArr.push({ textData: resArr[h], codeData: "", lang: "" });
                        }
                    }
                    oController.getView().getModel("airesponseDetailModel").setProperty("/multiCE", ceArr);
                }
                oUsedToken = aResponse.usage?.total_tokens || 0;
                busyDialog.close();
                oController.getView().getModel("airesponseDetailModel").setProperty("/resp", sResponse);
                oController.getView().getModel("TokenLimit").setProperty("/usedToken", oUsedToken);
                oController.getView().getModel("TokenLimit").setProperty("/tokenVis", true);
            }

            busyDialog.close();

            return {
                message: oResMsg,
                usedTokens: oUsedToken,
                rawText: sResponse
            };
        },
        getTabConfig: function (tabKey, controller, basePath) {
            const view = controller.getView();
            const { sUrl, sApiUrl } = controller;
            const appModel = view.getModel("appmodel");
            const responseModel = view.getModel("responseModel");
            //sUrl[urlKey] = selectedKey;
            const apiUrl = this.getApiUrl(aiModelName, aiSelected, this.sApiUrl, basePath);

            const oQuestionAI = view.byId(questionId)?.getValue();
            const oPromtModel = view.getModel(promptModel);
            const oComboBox = view.byId(promptId);
            const sSysMsg = responseModel.getProperty(threadPath + "/0/content");
            const sContent = appModel.getProperty(contentPath);
            const oContent = sContent + "\n" + oQuestionAI;
            const aMessages = responseModel.getProperty(threadPath);
            const oMsg = { role: "user", content: oContent };

            return {
                apiModel,
                apiModelName,
                apiUrl,
                oQuestionAI,
                oPromtModel,
                oComboBox,
                sPath: path,
                sSysMsg,
                oContent,
                oMsg,
                aMessages,
                userInputPath
            };
        },
        createAndFetchPromptDetails: function (
            oQuestionAI,
            sSelectedIconTab,
            existsInLocalData,
            _this,
            oPromtModel,
            oBundle,
            isFirstResponse,
            basePath 
        ) {
            
            if (isFirstResponse && (!oQuestionAI || oQuestionAI.trim() === "")) {
                return;
            }

            var sBasePath = _this._sBasePath;

            var sUrl = `${sBasePath}/cockpit/getPromptDetails`;

            var fourDigitId = Date.now().toString().slice(-4);
            var uniqueName = sSelectedIconTab + "_" + fourDigitId + "_prompt";

            var oPayload = {
                name: uniqueName,
                version: "0.0.1",
                scenario: sSelectedIconTab,
                spec: {
                    template: [
                        {
                            role: "user",
                            content: oQuestionAI
                        }
                    ],
                    additional_fields: {
                        UserId: _this._loggedInUser,
                        ProjectId: _this._ProjectDetail,
                        Category: sSelectedIconTab,
                        MsgType: "prompt"
                    }
                }
            };

            var oResponseModel = _this.getView().getModel("responseModel");
            var originalPrompt = oResponseModel.getProperty("/originalPrompt") || "";
            var selectedPromptId = oResponseModel.getProperty("/selectedPromptId") || "";

            var isModified =
                originalPrompt.trim().toLowerCase() !==
                (oQuestionAI || "").trim().toLowerCase();

            $.ajax({
                url: `${sBasePath}/cockpit/getPromptDetails?Category=${encodeURIComponent(sSelectedIconTab)}&MsgType=prompt&ProjectId=${encodeURIComponent(_this._ProjectDetail)}`,
                method: "GET",
                contentType: "application/json",

                success: function (data) {

                    var existingPrompts = (data.resources || []).filter(function (item) {
                        return item.id === selectedPromptId;
                    });

                    if (existingPrompts.length > 0 && !isModified) {
                        return;
                    }

                    if (existingPrompts.length > 0 && isModified) {

                        sap.m.MessageBox.confirm(
                            "You have modified the selected prompt. Do you want to update it or create a new one?",
                            {
                                actions: ["Update", "Create"],

                                onClose: function (oAction) {

                                    if (oAction === "Update") {

                                        const existingPrompt = existingPrompts[0];

                                        const updatePayload = {
                                            name: existingPrompt.name,
                                            version: existingPrompt.version,
                                            scenario: existingPrompt.scenario,
                                            ProjectId: _this._ProjectDetail,
                                            Category: sSelectedIconTab,
                                            MsgType: "prompt",
                                            spec: {
                                                ...existingPrompt.spec,
                                                template: [
                                                    {
                                                        role: "user",
                                                        content: oQuestionAI
                                                    }
                                                ],
                                                defaults: {
                                                    UserId: _this._loggedInUser,
                                                    UpdatedIn: _this._ProjectDetail
                                                }
                                            }
                                        };

                                        $.ajax({
                                            url: sUrl,
                                            method: "POST",
                                            contentType: "application/json",
                                            data: JSON.stringify(updatePayload),

                                            success: function () {
                                                sap.m.MessageBox.success("Prompt updated.");
                                                _this.getDataPromptMsg();
                                            },

                                            error: function () {
                                                sap.m.MessageBox.error("Failed to update prompt.");
                                            }
                                        });

                                    } else {
                                        _this.addPromptFr(true);
                                    }
                                }
                            }
                        );

                        return;
                    }
                },

                error: function () {
                    sap.m.MessageBox.show(
                        oBundle.getText("errorDataRetrieval")
                    );
                }
            });
        },
        handleTabResponseDynamic: function (tabKey,
            context,
            sResponse,
            oResMsg,
            oQuestionAI,
            oUsedToken,
            oToken,
            oViewModel,
            fileCont) {
            const fallbackMap = {
                all: { responseKey: "respKey_all", threadKey: "thread_all", viewModelKey: "allTabs", logPath: "/historyLog" },
            };
            if (fileCont == true) {
                oViewModel.setProperty("/isResponseFileContent", fileCont);
            }

            const view = context.getView();
            const oResponseModel = view.getModel("responseModel");
            const oMsgModel = view.getModel("msgModel");
            var existingMsgs = oMsgModel.getProperty("/aMsg");
            existingMsgs.push(oResMsg);
            oMsgModel.setProperty("/aMsg", existingMsgs);

            if (context.selectedKeyFunct() == "tstocode") {
                var resp = "";
                var allcodeGenArr = context.getView().getModel("airesponseDetailModel").getProperty("/multiCE");;
                for (var c = 0; c < allcodeGenArr.length; c++) {
                    resp = resp + allcodeGenArr[c].textData + allcodeGenArr[c].codeData;
                }
                context._addToHistoryLogGeneric(resp);
            } else {
                context._addToHistoryLogGeneric(sResponse);
            }

        },
        handleTabApiSetupDynamic: function ({ tabKey, view, sApiUrl, sUrl, basePath}) {
            const map = {
                BS: ["BSgptModelSelect", "BSfileUploader", "/BSThread", "fileContentBSTextArea", "BSpdfpreview", "bsimagepreview", "BSUrl"],
                User: ["UserStorygptModelSelect", "UserStoryfileUploader", "/UserThread", "fileContentUserStoryTextArea", "UserStorypdfpreview", "userimagepreview", "UserUrl"],
                fstoconf: ["fsgptModelSelect", "fstofunconfileUploader", "/fsconfThread", "fileContentFsconfTextArea", "fsconfpdfpreview", "fsconfimagepreview", "fstoconfUrl"],
                fstots: ["gptModelSelect", "fsdToTsdfileUploader", "/fsThread", "fileContentFsTextArea", "fstotspdfpreview", "fstotsimagepreview", "fstotsUrl"],
                tstocode: ["gptModelTSSelect", "tsdtocodefileUploader", "/tsThread", "fileContentTsTextArea", "fstocodepdfpreview", "fstocodeimagepreview", "tstocodeUrl"],
                tstocodeGit: ["gptModelTSGitSelect", "tsdtocodeGitfileUploader", "/tsGitThread", "fileContentTsGitTextArea", "fstocodeGitpdfpreview", "fstocodeGitimagepreview", "tstocodeGitUrl"],
                coderem: ["gptModelcode", "codeRemediationFileUploader", "/ECCCodeThread", "fileECCContentTextArea", "coderempdfpreview", "coderemimagepreview", "coderemUrl"],
                codesum: ["gptModelsummary", "codeSummaryFileUploader", "/codeThread", "fileCodeContentTextArea", "codesumpdfpreview", "codesumimagepreview", "codesumUrl"],
                TUT: ["TUTgptModelSelect", "TUTfileUploader", "/TUTThread", "fileContentTUTTextArea", "TUTpdfpreview", "tutimagepreview", "TUTUrl"],
                PCT: ["PCTgptModelSelect", "PCTfileUploader", "/PCTThread", "fileContentPCTTextArea", "PCTpdfpreview", "pctimagepreview", "PCTUrl"],
                BPM: ["BPMgptModelSelect", "BPMfileUploader", "/BPMThread", "fileContentBPMTextArea", "BPMpdfpreview", "bpmimagepreview", "BPMUrl"],
                TCG: ["TCGgptModelSelect", "TCGfileUploader", "/TCGThread", "fileContentTCGTextArea", "TCGpdfpreview", "tcgimagepreview", "TCGUrl"],
                DocGen: ["DocGengptModelSelect", "DocGenfileUploader", "/DocGenThread", "fileContentDocGenTextArea", "DocGenpdfpreview", "DocGenimagepreview", "DocGenUrl"]
            };

            const [modelId, uploaderId, threadPath, textAreaId, previewId, imagePreviewId, urlKey] = map[tabKey] ||
                [`${tabKey}gptModelSelect`, `${tabKey}fileUploader`, `/${tabKey}Thread`, `fileContent${tabKey}TextArea`, `${tabKey}pdfpreview`, `${tabKey}imagepreview`, `${tabKey}Url`];

            const modelSelect = view.byId(modelId);
            const selectedKey = modelSelect?.getSelectedKey();
            const selectedText = modelSelect?._getSelectedItemText();

            sUrl[urlKey] = selectedKey;
            const apiSelect = `${basePath}/deployments/${selectedKey}/chat/completions?api-version=${sApiUrl || "2024-12-01-preview"}`;

            return {
                apiModel: selectedText,
                oFileUploader: view.byId(uploaderId),
                aMessages: view.getModel("responseModel").getProperty(threadPath),
                oTextArea: view.byId(textAreaId),
                opdfpreview: view.byId(previewId),
                imagePreview: view.byId(imagePreviewId),
                apiSelect
            };
        },
        handleTabPromptSetupDynamic: function ({ tabKey, view, sUrl, sApiUrl, oResponseModel, basePath }) {
            const map = {
                BS: ["BSgptModelSelect", "BSUrl", "BSQuestion", "/BSContent", "/BSThread", "BSPromptData", "BSprompt", "BSPromptData>"],
                User: ["UserStorygptModelSelect", "UserUrl", "UserStoryQuestion", "/UserContent", "/UserThread", "UserPromptData", "UserStoryprompt", "UserPromptData>"],
                fstoconf: ["fsgptModelSelect", "fstoconfUrl", "fsconfQuestion", "/fsconfContent", "/fsconfThread", "fstoconfPromptData", "fstoconfprompt", "fstoconfPromptData>"],
                fstots: ["gptModelSelect", "fstotsUrl", "fstotsQuestion", "fsContent", "/fsThread", "fstotsPromptData", "fstotsprompt", "fstotsPromptData>"],
                tstocode: ["gptModelTSSelect", "tstocodeUrl", "tstocodeQuestion", "/tsContent", "/tsThread", "tstocodePromptData", "tstocodeprompt", "tstocodePromptData>"],
                tstocodeGit: ["gptModelTSGitSelect", "tstocodeGitUrl", "tstocodeGitQuestion", "/tsGitContent", "/tsGitThread", "tstocodeGitPromptData", "tstocodeGitprompt", "tstocodeGitPromptData>"],
                coderem: ["gptModelcode", "coderemUrl", "eccCodeQuestion", "/ECCContent", "/ECCCodeThread", "coderemPromptData", "coderemprompt", "coderemPromptData>"],
                codesum: ["gptModelsummary", "codesumUrl", "codeSumQuestion", "/codeContent", "/codeThread", "codesumPromptData", "codesumprompt", "codesumPromptData>"],
                TUT: ["gptModelsummary", "TUTUrl", "TUTQuestion", "/TUTContent", "/TUTThread", "TUTPromptData", "TUTprompt", "TUTPromptData>"],
                BPM: ["gptModelsummary", "BPMUrl", "BPMQuestion", "/BPMContent", "/BPMThread", "BPMPromptData", "BPMprompt", "BPMPromptData>"],
                TCG: ["gptModelsummary", "TCGUrl", "TCGQuestion", "/TCGContent", "/TCGThread", "TCGPromptData", "TCGprompt", "TCGPromptData>"],
                PCT: ["gptModelsummary", "PCTUrl", "PCTQuestion", "/PCTContent", "/PCTThread", "PCTPromptData", "PCTprompt", "PCTPromptData>"],
                DocGen: ["gptModelsummary", "DocGenUrl", "DocGenQuestion", "/DocGenContent", "/DocGenThread", "DocGenPromptData", "DocGenprompt", "DocGenPromptData>"]
             };

            const [modelId, urlKey, questionId, contentPath, threadPath, promptModelId, promptId, path] = map[tabKey] || [];
            const modelSelect = view.byId(modelId);
            const apiModel = modelSelect?.getSelectedKey();
            const apiModelName = modelSelect?._getSelectedItemText();
            sUrl[urlKey] = apiModel;

            const apiUrl = this.getApiUrl(apiModelName, apiModel, sApiUrl, basePath);
            const oQuestionAI = view.byId(questionId)?.getValue();
            const sFileContent = view.getModel("appmodel").getProperty(contentPath) || "";
            const oContent = sFileContent + "\n" + oQuestionAI;
            const aMessages = oResponseModel.getProperty(threadPath) || [];
            const oMsg = { role: "user", content: oContent };
            aMessages.push(oMsg);
            oResponseModel.setProperty(threadPath, aMessages);

            return {
                apiModel,
                apiModelName,
                apiUrl,
                oQuestionAI,
                oContent,
                aMessages,
                oPromtModel: view.getModel(promptModelId),
                oComboBox: view.byId(promptId),
                sPath: path
            };
        },
        handleTabResponseUpdateDynamic: function ({
            tabKey,
            sResponse,
            oResMsg,
            oResponseModel,
            context,
            priceText,
            busyDialog,
            promptMsgData
        }) {
            const map = {
                BS: ["BSResponseContent", "/BSThread", "/historyLogBS", "BStoken"]
            };

            const [responsePath, threadPath, logPath, tokenId] = map[tabKey] || [];
            if (!responsePath || !threadPath || !logPath || !tokenId) return;

            oResponseModel.setProperty(`/${responsePath}`, sResponse);
            const aMessages = oResponseModel.getProperty(threadPath) || [];
            aMessages.push(oResMsg);
            oResponseModel.setProperty(threadPath, aMessages);

            var histData = {
                promptHistory: promptMsgData,
                aiResponseHistory: sResponse
            };
            that.getOwnerComponent().getModel("historyModel").oData.push(histData);
            that.getOwnerComponent().getModel("historyModel").refresh();

            const oUsage = context.getView().byId(tokenId);
            if (oUsage?.setText) oUsage.setText(priceText);
            busyDialog?.close();
        },
        handleUserMessageDynamic: function ({
            tabKey,
            view,
            oViewModel,
            oResponseModel
        }) {
            const configMap = {
                BS: { inputPath: "/BSuserInput", contentPath: "/BSContent", threadPath: "/BSThread", viewModelPath: "/BS/bFileContentChanged" },
                User: { inputPath: "/UserInput", contentPath: "/UserContent", threadPath: "/UserThread", viewModelPath: "/UserStory/bFileContentChanged" },
                fstoconf: { inputPath: "/fsconfuserInput", contentPath: "/fsconfContent", threadPath: "/fsconfThread", viewModelPath: "/FsToConf/bFileContentChanged" },
                fstots: { inputPath: "/fsuserInput", contentPath: "/fsContent", threadPath: "/fsThread", viewModelPath: "/FsToTs/bFileContentChanged" },
                tstocode: { inputPath: "/tsuserInput", contentPath: "/tsContent", threadPath: "/tsThread", viewModelPath: "/TsToCode/bFileContentChanged" },
                tstocodeGit: { inputPath: "/tsGituserInput", contentPath: "/tsGitContent", threadPath: "/tsGitThread", viewModelPath: "/tstocodeGit/bFileContentChanged" },
                coderem: { inputPath: "/ECCCodeuserInput", contentPath: "/ECCContent", threadPath: "/ECCCodeThread", viewModelPath: "/CodeRem/bFileContentChanged" },
                codesum: { inputPath: "/codesummaryuserInput", contentPath: "/CodeContent", threadPath: "/codeThread", viewModelPath: "/CodeSum/bFileContentChanged" },
                TUT: { inputPath: "/TUTuserInput", contentPath: "/TUTContent", threadPath: "/TUTThread", viewModelPath: "/TUT/bFileContentChanged" },
                BPM: { inputPath: "/bpmuserInput", contentPath: "/BpmContent", threadPath: "/bpmThread", viewModelPath: "/BPM/bFileContentChanged" },
                TCG: { inputPath: "/tcguserInput", contentPath: "/TcgContent", threadPath: "/tcgThread", viewModelPath: "/TCG/bFileContentChanged" },
                 PCT: { inputPath: "/pctuserInput", contentPath: "/PctContent", threadPath: "/pctThread", viewModelPath: "/PCT/bFileContentChanged" },
               DocGen: { inputPath: "/DocGenuserInput", contentPath: "/DocGenContent", threadPath: "/DocGenThread", viewModelPath: "/DocGen/bFileContentChanged" }
            };
// PCT: { inputPath: "/pctuserInput", contentPath: "/PctContent", threadPath: "/pctThread", viewModelPath: "/PCT/bFileContentChanged" }
            
            const config = configMap[tabKey];
            if (!config) return;

            const appModel = view.getModel("appmodel");
            ////// setting isUserContent to false as file edit functionality is not added
            ///const isUserContent = oViewModel.getProperty(config.viewModelPath) === true;
            const isUserContent = false
            const fileContent = appModel.getProperty("/BSContent") || "";

            ////ignoring the userInput value below as selected Prompt data is captured in reuploadcontent function
            const userInput = appModel.getProperty(config.inputPath) || "";
            const content = fileContent + "\n" + userInput;

            const oMsg = {
                role: "user",
                content: content
            };

            const aMessages = oResponseModel.getProperty(config.threadPath) || [];
            aMessages.push(oMsg);
            oResponseModel.setProperty(config.threadPath, aMessages);

            appModel.setProperty(config.inputPath, "");

            return {
                oMsg,
                userInput,
                isUserContent,
                updatedThread: aMessages
            };
        },
        transformSysMsgforTScenarios: function (aMessages, fileData, promptmsg, reupload, step, airesp, systemDesc) {
            if (step == "Step2" || step == "Step3") {
                var reMessages = this.transformforNextStep(aMessages, step, airesp, systemDesc, reupload, promptmsg, fileData);
                return reMessages;
            } else {
                var origSysMsg = aMessages.filter(function (a) {
                    if (a.role == "system") { return a.content; }
                });
                // var finalAMessages=aMessages.filter(item => (!item.content.includes(fileData) && item.role!=="system"));
                //  if (reupload == true && promptmsg!=="") {
                //     finalAMessages.push({"role":"user","content":promptmsg});
                //  }
                origSysMsg[0].content = origSysMsg[0].content.replace(/\{\{\?requirement_text\}\}/g, "");
                var newAMsg = [{
                    "role": "system",
                    "content": ""
                }];
                const hasPlaceholder = /\{\{\?additional_info\}\}/.test(origSysMsg[0].content || "");
                const hasPlaceholderforFile = /\{\{\?requirement_file\}\}/.test(origSysMsg[0].content || "");
                var hasPlaceholderReUpl = false;
                if (reupload == true) {
                    hasPlaceholderReUpl = /\n\nAdditional Information:\n/.test(origSysMsg[0].content || "");
                }
                var newSysContent = "";
                var newSysContentWithFile = "";
                // if (fileData == null || fileData == undefined && promptmsg=="") {
                //} 
                if (hasPlaceholder == true || hasPlaceholderforFile == true || hasPlaceholderReUpl == true) {
                    if (fileData && promptmsg == "") {

                        newSysContent = hasPlaceholderforFile ? (origSysMsg[0].content || "").replace(/\{\{\?requirement_file\}\}/g, fileData)
                            : `${origSysMsg[0].content || ""}\n\nRequirement File:\n${fileData}`;
                        newAMsg[0].content = newSysContent;


                    } else if (fileData && promptmsg !== "") {
                        newSysContent = hasPlaceholder ? origSysMsg[0].content.replace(/\{\{\?additional_info\}\}/g, promptmsg)
                            : `${origSysMsg[0].content}\n\nAdditional Information:\n${promptmsg}`;

                        newSysContentWithFile = hasPlaceholderforFile ? (newSysContent || "").replace(/\{\{\?requirement_file\}\}/g, fileData)
                            : `${newSysContent || ""}\n\nRequirement File:\n${fileData}`;

                        newAMsg[0].content = newSysContentWithFile;
                        if (hasPlaceholderReUpl == true) {
                            newSysContent = hasPlaceholderReUpl ? origSysMsg[0].content.replace("\n\nAdditional Information:\n", promptmsg) : origSysMsg[0].content;
                            newAMsg[0].content = newSysContent;
                        }

                    } else if (!fileData && promptmsg !== "") {
                        newSysContent = hasPlaceholder ? origSysMsg[0].content.replace(/\{\{\?additional_info\}\}/g, promptmsg)
                            : `${origSysMsg[0].content}\n\nAdditional Information:\n${promptmsg}`;

                        if (hasPlaceholderReUpl == true) {
                            newSysContent = hasPlaceholderReUpl ? origSysMsg[0].content.replace("\n\nAdditional Information:\n", promptmsg) : origSysMsg[0].content;
                        }
                        newAMsg[0].content = newSysContent;

                    }
                    // finalAMessages.push(newAMsg[0]);
                    //  return finalAMessages;
                    return newAMsg;
                }
            }
        },
        transformforNextStep: function (aMessages, step, airesp, systemDesc, reupload, promptmsg, fileData) {
            var origSysMsg = systemDesc.replace(/\{\{\?requirement_text\}\}/g, "");;
            var newAMsg = [{
                "role": "system",
                "content": ""
            }];
            //  var finalAMessages=aMessages.filter(item => (!item.content.includes(fileData) && item.role!=="system"));
            // if (reupload == true && promptmsg!=="") {
            //         finalAMessages.push({"role":"user","content":promptmsg});
            //      }
            var newSysContent = "";
            var hasPlaceholder = false;
            if (step == "Step2") {
                hasPlaceholder = /\{\{\?step_1_output\}\}/.test(origSysMsg || "");
                newSysContent = hasPlaceholder ? origSysMsg.replace(/\{\{\?step_1_output\}\}/g, airesp)
                    : origSysMsg;
            } else {
                hasPlaceholder = /\{\{\?step_2_output\}\}/.test(origSysMsg || "");
                newSysContent = hasPlaceholder ? origSysMsg.replace(/\{\{\?step_2_output\}\}/g, airesp)
                    : origSysMsg;
            }
            newAMsg[0].content = newSysContent;

            //  finalAMessages.push(newAMsg[0]);
            //          return finalAMessages;
            return newAMsg;
        },

    };
});