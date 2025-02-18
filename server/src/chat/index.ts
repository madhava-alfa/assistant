import { ChatSession, FunctionCallingMode, GoogleGenerativeAI } from '@google/generative-ai';
import type { FunctionCall, Part } from '@google/generative-ai';
import { getSystemInstructions } from './instructions.js';
import { HistoryManager } from './history/index.js';
import { functions, functionDeclarations } from './tools/index.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger({ module: import.meta.url });

type AssistantChatArgs = {
  userId: string;
};

export class AssistantChat {
  private readonly userId: string;
  private readonly historyManager: HistoryManager;
  private contextTokens: number;

  constructor({ userId }: AssistantChatArgs) {
    this.userId = userId;
    this.historyManager = new HistoryManager({ userId });
    this.contextTokens = 0;
  }

  async send(message: string): Promise<void> {
    const systemInstruction = await getSystemInstructions(this.userId);
    const history = await this.historyManager.getHistory();

    const genAI = new GoogleGenerativeAI(process.env['GOOGLE_API_KEY'] as string);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemInstruction,
      generationConfig: { temperature: 1, maxOutputTokens: 8192 },
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
      tools: [
        {
          functionDeclarations,
          // googleSearchRetrieval: {
          //   dynamicRetrievalConfig: { mode: DynamicRetrievalMode.MODE_DYNAMIC, dynamicThreshold: 0.7 },
          // },
        },
      ],
    });
    const chat = model.startChat({ history });
    this.historyManager.addToQueue({ role: 'user', parts: [{ text: message }] });
    await this.runStep(chat, [{ text: message }]);
    await this.historyManager.saveQueue(this.contextTokens);
  }

  private async runStep(chat: ChatSession, parts: Part[]): Promise<void> {
    const { response } = await chat.sendMessage(parts);
    const calls = response.functionCalls();
    const text = response.text();
    this.contextTokens = response.usageMetadata?.totalTokenCount || 0;
    if (text && (!calls || calls.length === 0)) {
      await this.sendResponse(text);
    }

    const steps = await this.buildSteps(calls);
    if (steps.length > 0) {
      await this.runStep(chat, steps);
    }
  }

  private async sendResponse(text: string): Promise<void> {
    console.log('#######\n', text, '#######');
    this.historyManager.addToQueue({ role: 'model', parts: [{ text }] });
  }

  private async buildSteps(calls?: FunctionCall[]): Promise<Part[]> {
    const steps: Part[] = [];
    for (const { name, args } of calls || []) {
      this.historyManager.addToQueue({ role: 'model', parts: [{ functionCall: { name, args } }] });
      logger.info({ name, args }, 'Calling function');
      const response = await functions[name]({ userId: this.userId }, args);
      steps.push({ functionResponse: { name, response } });
      this.historyManager.addToQueue({ role: 'function', parts: [{ functionResponse: { name, response } }] });
    }

    return steps;
  }
}
