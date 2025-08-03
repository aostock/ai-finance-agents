import { AostockSettings } from "@/components/settings";
import { Client } from "@langchain/langgraph-sdk";

export function createClient(settings: AostockSettings) {
  const base64 = btoa(JSON.stringify(settings));
  return new Client({
    apiKey: settings.langsmithApiKey,
    apiUrl: settings.langgraphServerApiUrl,
    defaultHeaders: {
      "x-settings": base64,
    },
  });
}
