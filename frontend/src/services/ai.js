import { GoogleGenAI } from "@google/genai";

let aiInstance = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("Gemini API Key is not set. Please add GEMINI_API_KEY to your Secrets in AI Studio.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function transcribeAudio(audioBase64) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            mimeType: "audio/wav",
            data: audioBase64,
          },
        },
        {
          text: "Transcribe this audio recording accurately. Identify different speakers if possible.",
        },
      ],
    });
    return response.text;
  } catch (error) {
    console.error("Transcription error:", error);
    return `Error: ${error.message}`;
  }
}

export async function summarizeTranscript(transcript) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          text: `Provide a concise summary of the following meeting transcript. Highlight key decisions and action items:\n\n${transcript}`,
        },
      ],
    });
    return response.text;
  } catch (error) {
    console.error("Summary error:", error);
    return `Error: ${error.message}`;
  }
}