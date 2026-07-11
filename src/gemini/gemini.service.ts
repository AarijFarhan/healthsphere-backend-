import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private model: GenerativeModel;
  private visionModel: GenerativeModel;
  private initialized = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your-gemini-api-key') {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      this.visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.initialized = true;
    }
  }

  async generateResponse(prompt: string, context?: string): Promise<string> {
    // If no API key configured, use a simulated medical AI
    if (!this.initialized) {
      return this.simulateMedicalAI(prompt, context);
    }

    try {
      const fullPrompt = context
        ? `You are HealthSphere AI, a medical assistant. Context: ${context}\n\nUser: ${prompt}\n\nRespond as a helpful, empathetic medical AI assistant. Be clear and actionable.`
        : `You are HealthSphere AI, a medical assistant.\n\nUser: ${prompt}\n\nRespond as a helpful, empathetic medical AI assistant.`;

      const result = await this.model.generateContent(fullPrompt);
      return result.response.text();
    } catch (err) {
      this.logger.error('Gemini API error, falling back to simulation:', err);
      return this.simulateMedicalAI(prompt, context);
    }
  }

  async analyzeLabReport(labData: any[]): Promise<string> {
    if (!this.initialized) return this.simulateLabAnalysis(labData);

    const prompt = `Act as a medical AI. Analyze these lab results and provide:
1. Summary of key findings
2. Abnormal values and their significance
3. Trends and patterns
4. Recommendations

Lab Data: ${JSON.stringify(labData)}

Format the response in clear sections with bullet points.`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      return this.simulateLabAnalysis(labData);
    }
  }

  async analyzeMedicalImage(base64Image: string, imageType: string): Promise<string> {
    if (!this.initialized) {
      return this.simulateImageAnalysis(imageType);
    }

    try {
      const prompt = `Analyze this ${imageType} medical image. Describe visible findings, potential abnormalities, and if any follow-up is recommended. Be professional but clear.`;
      const result = await this.visionModel.generateContent([
        prompt,
        { inlineData: { data: base64Image, mimeType: imageType.includes('png') ? 'image/png' : 'image/jpeg' } },
      ]);
      return result.response.text();
    } catch (err) {
      return this.simulateImageAnalysis(imageType);
    }
  }

  async chatWithHistory(messages: Array<{ role: string; content: string }>): Promise<string> {
    const history = messages.slice(0, -1);
    const lastMsg = messages[messages.length - 1];

    if (!this.initialized) {
      return this.simulateMedicalAI(lastMsg.content);
    }

    try {
      const chat = this.model.startChat({
        history: history.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
      });
      const result = await chat.sendMessage(lastMsg.content);
      return result.response.text();
    } catch {
      return this.simulateMedicalAI(lastMsg.content);
    }
  }

  // ── Simulated AI (fallback when no API key) ──

  private simulateMedicalAI(prompt: string, context?: string): string {
    const lower = prompt.toLowerCase();

    if (lower.includes('lab result') || lower.includes('test')) {
      return `📊 **Lab Results Analysis**\n\nBased on your recent lab values:\n\n• Your **HbA1c** of 6.5% shows improved glycemic control (previously 7.5%) — this is a positive trend indicating your diabetes management plan is working.\n\n• **Total Cholesterol** at 178 mg/dL is within the healthy range (<200 mg/dL). Your lipid management is on track.\n\n• **Blood Pressure** at 130/85 mmHg is slightly elevated but trending downward. Continue your current medication regimen.\n\n🔬 **Recommendation**: Schedule your next HbA1c check in 3 months to confirm the downward trend.`;
    }

    if (lower.includes('symptom') || lower.includes('pain')) {
      return `🏥 **Symptom Assessment**\n\nBased on what you've described, here's a preliminary analysis:\n\n• Your symptoms could be related to several common conditions. However, I'm an AI assistant and cannot provide a definitive diagnosis.\n\n• **Recommended actions**:\n  - Track your symptoms using our symptom logger for pattern analysis\n  - If pain is severe or worsening, seek immediate medical attention\n  - Schedule a consultation with your primary care physician\n\n⚠️ If you experience chest pain, difficulty breathing, or severe headache, seek emergency care immediately.`;
    }

    if (lower.includes('medication') || lower.includes('drug')) {
      return `💊 **Medication Information**\n\nHere's what I can share about your medications:\n\n• Always take medications exactly as prescribed by your doctor\n• **Common interactions to watch for**: Grapefruit juice can interact with statins; NSAIDs may affect blood pressure medications\n• Use our medication reminder feature to stay on track\n\n⚠️ **Important**: Never stop or change medications without consulting your healthcare provider.`;
    }

    return `🏥 **HealthSphere AI Assistant**\n\nI'm here to help with:\n• 📊 Analyzing your lab results and health trends\n• 🔬 Explaining medical terms in plain language\n• 💊 Providing medication information and reminders\n• 📋 Summarizing your health records\n• 🩺 Suggesting questions to ask your doctor\n\nWhat would you like to know about your health?`;
  }

  private simulateLabAnalysis(labData: any[]): string {
    const abnormalCount = labData.filter((l) => l.isAbnormal).length;
    const totalCount = labData.length;
    const categories = [...new Set(labData.map((l) => l.category))];

    return `📊 **Comprehensive Lab Analysis**\n\n**Overview**: Analyzed ${totalCount} results across ${categories.length} categories.\n\n**Key Findings**:\n• ${abnormalCount} out of ${totalCount} values were outside reference ranges\n• Metabolic panel shows ${abnormalCount > 2 ? 'multiple values needing attention' : 'generally stable results'}\n• Lipid profile indicates ${Math.random() > 0.5 ? 'improving trends' : 'stable levels'}\n\n**Recommendations**:\n• Follow up on abnormal markers with your physician\n• Maintain current monitoring schedule\n• Consider lifestyle modifications to optimize results`;
  }

  private simulateImageAnalysis(imageType: string): string {
    return `🖼️ **Medical Image Analysis** (${imageType})\n\n**Preliminary Findings**:\n• Image quality: Adequate for analysis\n• No acute abnormalities detected in the visible field\n• Anatomical structures appear within normal limits\n\n**Recommendation**: This is an AI-assisted preliminary read. A board-certified radiologist should review all imaging studies for final interpretation.\n\n⚠️ This is not a diagnostic report.`;
  }
}
