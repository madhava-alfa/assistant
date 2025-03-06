import type { Content, GenerativeModel } from '@google/generative-ai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message, MessageStatus } from '../../database/entities.js';
import { epochTime } from '../../utils/index.js';
import { Logger } from '../../utils/logger.js';
import { DynamoMapper, Operator } from '@madhava-yallanki/dynamo-mapper';
import { ArchivalQueue } from '../archival/queue.js';

const logger = new Logger({ module: import.meta.url });

type HistoryManagerArgs = {
  userId: string;
};

type ExistingMessage = Pick<Message, 'sequence' | 'role' | 'data' | 'isSummary' | 'createdOn'>;

const CONTEXT_THRESHOLD = 1000000 * 0.75;

export class HistoryManager {
  private readonly userId: string;
  private readonly mapper: DynamoMapper;
  private readonly archivalQueue: ArchivalQueue;
  private readonly model: GenerativeModel;
  private existing: ExistingMessage[];
  private buffer: Pick<Message, 'role' | 'data' | 'createdOn'>[];

  constructor({ userId }: HistoryManagerArgs) {
    this.userId = userId;
    this.mapper = new DynamoMapper();
    this.archivalQueue = new ArchivalQueue();
    const genAI = new GoogleGenerativeAI(process.env['GOOGLE_API_KEY'] as string);
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    this.existing = [];
    this.buffer = [];
  }

  async getHistory(): Promise<Content[]> {
    const { items } = await this.mapper.query(
      Message,
      {
        partitionKey: Message.makePartitionKey({ userId: this.userId }),
        sortKey: MessageStatus.active,
        operator: Operator.BeginsWith,
      },
      {
        indexName: Message.StatusIndex,
        attributes: ['sequence', 'role', 'data', 'isSummary', 'createdOn'],
      },
    );

    const history: Content[] = [];
    if (items[0] && items[0].role !== 'user') {
      history.push({ role: 'user', parts: [{ text: ' ' }] });
    }

    this.existing = items;
    this.existing.forEach((row) => {
      history.push({ role: row.role, parts: [row.data] });
    });

    return history;
  }

  addToBuffer(item: Pick<Message, 'role' | 'data'>): void {
    this.buffer.push({ ...item, createdOn: epochTime() });
  }

  async saveBuffer(contextTokens: number): Promise<void> {
    const items: Message[] = [];
    for (const item of this.buffer) {
      items.push(
        new Message({
          userId: this.userId,
          sequence: item.createdOn,
          role: item.role,
          data: item.data,
          status: MessageStatus.active,
          createdBy: this.userId,
          createdOn: item.createdOn,
          updatedBy: this.userId,
          updatedOn: item.createdOn,
        }),
      );
    }

    await this.mapper.transactPut(items);
    logger.info('Buffer written to database.');

    await this.manageContext(contextTokens);
  }

  private async manageContext(contextTokens: number): Promise<void> {
    if (contextTokens < CONTEXT_THRESHOLD) {
      logger.info('Context threshold not met. Skipping summarization');
      return;
    }

    const bufferContents: Content[] = this.buffer.map(({ role, data }) => ({ role, parts: [data] }));
    const bufferTokens = await this.model.countTokens({ contents: bufferContents });

    let summarizedTokens = 0;
    for (const chunk of this.getDayChunks()) {
      await this.queueForArchival(chunk);
      const chunkContents = chunk.map(({ role, data }) => ({ role, parts: [data] }));
      const chunkTokens = await this.model.countTokens({ contents: chunkContents });
      summarizedTokens += chunkTokens.totalTokens;
      if (summarizedTokens > bufferTokens.totalTokens) {
        logger.info({ summarizedTokens }, 'Added messages for summarization to meet the new buffer tokens.');
        return;
      }
    }
  }

  private *getDayChunks(): Generator<ExistingMessage[]> {
    const items = this.existing.filter((item) => !item.isSummary);
    if (items.length === 0) {
      return;
    }

    let chunk: ExistingMessage[] = [];
    let chunkDay = new Date(items[0].createdOn).toLocaleDateString();
    for (const item of items) {
      const itemDay = new Date(item.sequence).toLocaleDateString();
      if (itemDay === chunkDay) {
        chunk.push(item);
      } else {
        yield chunk;
        chunk = [item];
        chunkDay = itemDay;
      }
    }

    yield chunk;
  }

  private async queueForArchival(chunk: ExistingMessage[]): Promise<void> {
    const startSequence = chunk[0]?.sequence;
    const endSequence = chunk[chunk.length - 1]?.sequence;
    await this.archivalQueue.sendMessage({ batch: { userId: this.userId, startSequence, endSequence } });
  }
}
