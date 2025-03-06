import { ChatSession, FunctionCallingMode, GoogleGenerativeAI } from '@google/generative-ai';
import type { FunctionCall, Part } from '@google/generative-ai';
import { getSystemInstructions } from './instructions.js';
import { HistoryManager } from './history/index.js';
import { functions, functionDeclarations } from './tools/index.js';
import { Logger } from '../utils/logger.js';
import { epochTime } from '../utils/index.js';
import { Message } from '../database/entities.js';

const logger = new Logger({ module: import.meta.url });

type AssistantChatArgs = {
  userId: string;
};

type ResponseItem = Pick<Message, 'role' | 'data' | 'createdOn'> & { thinking?: boolean };

type ChatResponse = {
  messages: ResponseItem[];
};

export class AssistantChat {
  private readonly userId: string;
  private readonly historyManager: HistoryManager;
  private contextTokens: number;
  private response: ChatResponse;

  constructor({ userId }: AssistantChatArgs) {
    this.userId = userId;
    this.historyManager = new HistoryManager({ userId });
    this.contextTokens = 0;
    this.response = { messages: [] };
  }

  async send(message: string): Promise<ChatResponse> {
    const systemInstruction = await getSystemInstructions(this.userId);
    const history = await this.historyManager.getHistory();

    const genAI = new GoogleGenerativeAI(process.env['GOOGLE_API_KEY'] as string);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemInstruction,
      generationConfig: { temperature: 1, maxOutputTokens: 8192 },
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
      tools: [
        // { googleSearchRetrieval: {} },
        { functionDeclarations: functionDeclarations },
      ],
    });
    const chat = model.startChat({ history });
    this.historyManager.addToBuffer({ role: 'user', data: { text: message } });
    await this.runStep(chat, [{ text: message }]);
    await this.historyManager.saveBuffer(this.contextTokens);
    return this.response;
  }

  private async runStep(chat: ChatSession, parts: Part[]): Promise<void> {
    logger.info({ parts }, 'Running step');
    const { response } = await chat.sendMessage(parts);
    const calls = response.functionCalls();
    const text = response.text();
    this.contextTokens = response.usageMetadata?.totalTokenCount || 0;
    if (text && (!calls || calls.length === 0)) {
      this.addToResponse({ data: { text } });
    }

    const steps = await this.buildSteps(calls);
    if (steps.length > 0) {
      await this.runStep(chat, steps);
    }
  }

  private addToResponse({ data, thinking }: Pick<ResponseItem, 'data' | 'thinking'>): void {
    this.response.messages.push({ role: 'model', data, thinking, createdOn: epochTime() });
    if (!thinking) {
      this.historyManager.addToBuffer({ role: 'model', data });
    }
  }

  private async buildSteps(calls?: FunctionCall[]): Promise<Part[]> {
    const steps: Part[] = [];
    for (const { name, args } of calls || []) {
      if (name === 'record_thoughts') {
        steps.push({ functionResponse: { name, response: {} } });
        this.addToResponse({ data: { text: (args as Record<string, string>).thoughts }, thinking: true });
        continue;
      }

      logger.info({ name, args }, 'Calling function');
      this.historyManager.addToBuffer({ role: 'model', data: { functionCall: { name, args } } });
      const response = await functions[name]({ userId: this.userId }, args);
      steps.push({ functionResponse: { name, response } });
      this.historyManager.addToBuffer({ role: 'function', data: { functionResponse: { name, response } } });
    }

    return steps;
  }
}
