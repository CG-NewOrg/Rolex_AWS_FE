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
        isImageContent: function (value) {
            return typeof value === "string" && value.startsWith("data:image");
        },
        enableSys:function(isAdmin,isSys){
            if(isSys==true){
                return false;
            }else{
                return true;
            }
        }
    };
});