// Define the settings structure
export interface Settings {
  // General settings
  serverApiUrl: string;
  assistantId: string;
  serverApiKey?: string | undefined;

  // Data settings
  remoteFinancialDataApiUrl: string;
  remoteFinancialDataApiKey: string;

  // Model settings
  intentRecognitionModel: {
    model: string;
    api_key: string;
    api_base?: string;
    [key: string]: any;
  };
  analysisModel: {
    model: string;
    api_key: string;
    api_base?: string;
    [key: string]: any;
  };
}

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  serverApiUrl: "http://localhost:2024",
  assistantId: "agent",
  serverApiKey: undefined,
  remoteFinancialDataApiUrl: "http://127.0.0.1:8000/",
  remoteFinancialDataApiKey: "test",
  intentRecognitionModel: {
    model: "gpt-4o-mini",
    api_key: "",
  },
  analysisModel: {
    model: "gpt-4o",
    api_key: "",
  },
};
