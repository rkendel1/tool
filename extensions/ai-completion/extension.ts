import * as vscode from "vscode"

interface CompletionRequest {
  content: string
  cursorPosition: {
    line: number
    character: number
  }
  fileName: string
  language: string
  sessionId?: string
  userId?: string
}

interface CompletionResponse {
  suggestions: Array<{
    text: string
    description?: string
    insertText?: string
  }>
}

let isEnabled = true
let statusBarItem: vscode.StatusBarItem

export function activate(context: vscode.ExtensionContext) {
  console.log("AI Code Completion extension is now active")

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  statusBarItem.text = "$(lightbulb) AI Completion"
  statusBarItem.tooltip = "AI Code Completion is active"
  statusBarItem.show()
  context.subscriptions.push(statusBarItem)

  // Read initial configuration
  const config = vscode.workspace.getConfiguration("aiCompletion")
  isEnabled = config.get("enabled", true)
  updateStatusBar()

  // Register completion provider for all languages
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    { pattern: "**" },
    {
      async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext,
      ): Promise<vscode.CompletionItem[]> {
        const config = vscode.workspace.getConfiguration("aiCompletion")

        // Check if enabled
        if (!isEnabled || !config.get("enabled", true)) {
          return []
        }

        try {
          const backendUrl = config.get<string>("backendUrl", "")
          if (!backendUrl) {
            return []
          }

          // Prepare the request
          const completionRequest: CompletionRequest = {
            content: document.getText(),
            cursorPosition: {
              line: position.line,
              character: position.character,
            },
            fileName: document.fileName,
            language: document.languageId,
            sessionId: config.get("dyadSessionId", ""),
            userId: config.get("dyadUserId", ""),
          }

          // Call the backend API
          const response = await fetchCompletions(completionRequest, config)

          if (!response || !response.suggestions) {
            return []
          }

          // Convert API response to completion items
          const maxSuggestions = config.get<number>("maxSuggestions", 5)
          return response.suggestions.slice(0, maxSuggestions).map((suggestion, index) => {
            const item = new vscode.CompletionItem(
              suggestion.text,
              vscode.CompletionItemKind.Text,
            )
            item.insertText = suggestion.insertText || suggestion.text
            item.detail = suggestion.description || "AI Completion"
            item.sortText = `0${index}` // Ensure our items appear first
            return item
          })
        } catch (error) {
          console.error("Error fetching completions:", error)
          return []
        }
      },
    },
  )

  context.subscriptions.push(completionProvider)

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("aiCompletion.enable", () => {
      isEnabled = true
      const config = vscode.workspace.getConfiguration("aiCompletion")
      config.update("enabled", true, vscode.ConfigurationTarget.Global)
      updateStatusBar()
      vscode.window.showInformationMessage("AI Code Completion enabled")
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("aiCompletion.disable", () => {
      isEnabled = false
      const config = vscode.workspace.getConfiguration("aiCompletion")
      config.update("enabled", false, vscode.ConfigurationTarget.Global)
      updateStatusBar()
      vscode.window.showInformationMessage("AI Code Completion disabled")
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("aiCompletion.testConnection", async () => {
      const config = vscode.workspace.getConfiguration("aiCompletion")
      const backendUrl = config.get<string>("backendUrl", "")

      if (!backendUrl) {
        vscode.window.showErrorMessage("Backend URL is not configured")
        return
      }

      try {
        vscode.window.showInformationMessage(`Testing connection to ${backendUrl}...`)

        const testRequest: CompletionRequest = {
          content: "test",
          cursorPosition: { line: 0, character: 0 },
          fileName: "test.txt",
          language: "plaintext",
        }

        await fetchCompletions(testRequest, config)
        vscode.window.showInformationMessage("Backend connection successful!")
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        vscode.window.showErrorMessage(`Backend connection failed: ${errorMessage}`)
      }
    }),
  )

  // Watch for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
      if (e.affectsConfiguration("aiCompletion.enabled")) {
        const config = vscode.workspace.getConfiguration("aiCompletion")
        isEnabled = config.get("enabled", true)
        updateStatusBar()
      }
    }),
  )
}

async function fetchCompletions(
  request: CompletionRequest,
  config: vscode.WorkspaceConfiguration,
): Promise<CompletionResponse> {
  const backendUrl = config.get<string>("backendUrl", "")
  const apiKey = config.get<string>("apiKey", "")
  const timeout = config.get<number>("requestTimeout", 5000)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`
    }

    const response = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}: ${response.statusText}`)
    }

    const data = (await response.json()) as unknown

    // Validate response format
    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format: expected object")
    }

    const responseData = data as Record<string, unknown>
    if (!Array.isArray(responseData.suggestions)) {
      throw new Error("Invalid response format: suggestions must be an array")
    }

    return data as unknown as CompletionResponse
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout")
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

function updateStatusBar() {
  if (isEnabled) {
    statusBarItem.text = "$(lightbulb) AI Completion"
    statusBarItem.tooltip = "AI Code Completion is active"
    statusBarItem.backgroundColor = undefined
  } else {
    statusBarItem.text = "$(lightbulb-off) AI Completion"
    statusBarItem.tooltip = "AI Code Completion is disabled"
    statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground")
  }
}

export function deactivate() {
  // Cleanup if needed
}
