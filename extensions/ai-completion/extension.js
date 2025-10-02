"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
let isEnabled = true;
let statusBarItem;
function activate(context) {
    console.log("AI Code Completion extension is now active");
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(lightbulb) AI Completion";
    statusBarItem.tooltip = "AI Code Completion is active";
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    // Read initial configuration
    const config = vscode.workspace.getConfiguration("aiCompletion");
    isEnabled = config.get("enabled", true);
    updateStatusBar();
    // Register completion provider for all languages
    const completionProvider = vscode.languages.registerCompletionItemProvider({ pattern: "**" }, {
        async provideCompletionItems(document, position, token, context) {
            const config = vscode.workspace.getConfiguration("aiCompletion");
            // Check if enabled
            if (!isEnabled || !config.get("enabled", true)) {
                return [];
            }
            try {
                const backendUrl = config.get("backendUrl", "");
                if (!backendUrl) {
                    return [];
                }
                // Prepare the request
                const completionRequest = {
                    content: document.getText(),
                    cursorPosition: {
                        line: position.line,
                        character: position.character,
                    },
                    fileName: document.fileName,
                    language: document.languageId,
                    sessionId: config.get("dyadSessionId", ""),
                    userId: config.get("dyadUserId", ""),
                };
                // Call the backend API
                const response = await fetchCompletions(completionRequest, config);
                if (!response || !response.suggestions) {
                    return [];
                }
                // Convert API response to completion items
                const maxSuggestions = config.get("maxSuggestions", 5);
                return response.suggestions.slice(0, maxSuggestions).map((suggestion, index) => {
                    const item = new vscode.CompletionItem(suggestion.text, vscode.CompletionItemKind.Text);
                    item.insertText = suggestion.insertText || suggestion.text;
                    item.detail = suggestion.description || "AI Completion";
                    item.sortText = `0${index}`; // Ensure our items appear first
                    return item;
                });
            }
            catch (error) {
                console.error("Error fetching completions:", error);
                return [];
            }
        },
    });
    context.subscriptions.push(completionProvider);
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand("aiCompletion.enable", () => {
        isEnabled = true;
        const config = vscode.workspace.getConfiguration("aiCompletion");
        config.update("enabled", true, vscode.ConfigurationTarget.Global);
        updateStatusBar();
        vscode.window.showInformationMessage("AI Code Completion enabled");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("aiCompletion.disable", () => {
        isEnabled = false;
        const config = vscode.workspace.getConfiguration("aiCompletion");
        config.update("enabled", false, vscode.ConfigurationTarget.Global);
        updateStatusBar();
        vscode.window.showInformationMessage("AI Code Completion disabled");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("aiCompletion.testConnection", async () => {
        const config = vscode.workspace.getConfiguration("aiCompletion");
        const backendUrl = config.get("backendUrl", "");
        if (!backendUrl) {
            vscode.window.showErrorMessage("Backend URL is not configured");
            return;
        }
        try {
            vscode.window.showInformationMessage(`Testing connection to ${backendUrl}...`);
            const testRequest = {
                content: "test",
                cursorPosition: { line: 0, character: 0 },
                fileName: "test.txt",
                language: "plaintext",
            };
            await fetchCompletions(testRequest, config);
            vscode.window.showInformationMessage("Backend connection successful!");
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Backend connection failed: ${errorMessage}`);
        }
    }));
    // Watch for configuration changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("aiCompletion.enabled")) {
            const config = vscode.workspace.getConfiguration("aiCompletion");
            isEnabled = config.get("enabled", true);
            updateStatusBar();
        }
    }));
}
async function fetchCompletions(request, config) {
    const backendUrl = config.get("backendUrl", "");
    const apiKey = config.get("apiKey", "");
    const timeout = config.get("requestTimeout", 5000);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const headers = {
            "Content-Type": "application/json",
        };
        if (apiKey) {
            headers["Authorization"] = `Bearer ${apiKey}`;
        }
        const response = await fetch(backendUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(request),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
        }
        const data = (await response.json());
        // Validate response format
        if (!data || typeof data !== "object") {
            throw new Error("Invalid response format: expected object");
        }
        const responseData = data;
        if (!Array.isArray(responseData.suggestions)) {
            throw new Error("Invalid response format: suggestions must be an array");
        }
        return data;
    }
    catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw new Error("Request timeout");
        }
        throw error;
    }
    finally {
        clearTimeout(timeoutId);
    }
}
function updateStatusBar() {
    if (isEnabled) {
        statusBarItem.text = "$(lightbulb) AI Completion";
        statusBarItem.tooltip = "AI Code Completion is active";
        statusBarItem.backgroundColor = undefined;
    }
    else {
        statusBarItem.text = "$(lightbulb-off) AI Completion";
        statusBarItem.tooltip = "AI Code Completion is disabled";
        statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
    }
}
function deactivate() {
    // Cleanup if needed
}
//# sourceMappingURL=extension.js.map