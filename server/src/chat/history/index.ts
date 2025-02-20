import type { Part, Content, GenerativeModel } from '@google/generative-ai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DB } from '../../database/index.js';
import { ConversationRow } from '../../database/tables.js';
import { epochTime } from '../../utils/index.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger({ module: import.meta.url });

type HistoryManagerArgs = {
  userId: string;
};

type QueueItem = { role: string; message: Part; createdAt: number };

type ExistingRow = Pick<ConversationRow, 'message_sequence' | 'role' | 'message' | 'is_summary'>;

type SummaryGroupArgs = { startIdx: number };

type SummaryGroupResult = {
  nextIdx: number;
  rows: ExistingRow[];
};

type ArchiveRowsArgs = {
  summary: string;
  rows: ExistingRow[];
};

const SUMMARIZATION_INSTRUCTIONS = `
You are a helpful, perceptive personal assistant. Your purpose is to assist the user with a wide variety of tasks, engage in meaningful conversations, and understand their needs and emotions, providing support that goes beyond simple task completion and fosters a deeper connection.

You will be provided with a historical conversation between and the user. Summarize it so that you can remember important details to allow for more personalized and friend-like conversation in the future. 

Only respond with the summary without adding any preamble or epilogue.
`;

const CONTEXT_THRESHOLD = 1000000 * 0.75;

export class HistoryManager {
  private readonly db: DB;
  private readonly userId: string;
  private readonly model: GenerativeModel;
  private existing: ExistingRow[];
  private queue: QueueItem[];

  constructor({ userId }: HistoryManagerArgs) {
    this.db = new DB();
    this.userId = userId;
    const genAI = new GoogleGenerativeAI(process.env['GOOGLE_API_KEY'] as string);
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', systemInstruction: SUMMARIZATION_INSTRUCTIONS });
    this.existing = [];
    this.queue = [];
  }

  async getHistory(): Promise<Content[]> {
    const { rows } = await this.db.query<ExistingRow>(
      `SELECT message_sequence, role, message, is_summary
        FROM conversation_history
        WHERE user_id = $1
        AND is_archived IS NOT true
        ORDER BY message_sequence;`,
      [this.userId],
    );

    const history: Content[] = [];
    if (rows[0] && rows[0].role !== 'user') {
      history.push({ role: 'user', parts: [{ text: ' ' }] });
    }

    this.existing = rows;
    this.existing.forEach((row) => {
      history.push({ role: row.role, parts: [row.message] });
    });

    return history;
  }

  addToQueue(item: Omit<QueueItem, 'createdAt'>): void {
    this.queue.push({ ...item, createdAt: epochTime() });
  }

  async saveQueue(contextTokens: number): Promise<void> {
    for (const { createdAt, role, message } of this.queue) {
      await this.db.query(
        `INSERT INTO conversation_history (user_id, message_sequence, role, message, created_at, updated_at) VALUES 
          ($1, $2, $3, $4, $5, $6)`,
        [this.userId, createdAt, role, message, createdAt, createdAt],
      );
    }

    logger.info('Queue written to database.');
    await this.manageContext(contextTokens);
  }

  private async manageContext(contextTokens: number): Promise<void> {
    if (contextTokens < CONTEXT_THRESHOLD) {
      logger.info('Context threshold not met. Skipping summarization');
      return;
    }

    const queueContents: Content[] = this.queue.map(({ role, message }) => ({ role, parts: [message] }));
    const queueTokens = await this.model.countTokens({ contents: queueContents });
    let summarizedTokens = 0;
    let startIdx = 0;

    while (true) {
      const group = this.getSummaryGroup({ startIdx });
      if (!group) break;

      summarizedTokens += await this.summarizeRows(group.rows);
      if (summarizedTokens > queueTokens.totalTokens) {
        break;
      }

      startIdx = group.nextIdx;
    }
  }

  private getSummaryGroup({ startIdx }: SummaryGroupArgs): SummaryGroupResult | undefined {
    const batch = this.existing.slice(startIdx);
    const firstRow = batch.find((row) => !row.is_summary);
    if (!firstRow) {
      logger.info('Un-summarized rows not found');
      return;
    }

    const selectedDay = new Date(parseInt(firstRow.message_sequence)).toLocaleDateString();
    let nextIdx = startIdx;
    const groupRows: ExistingRow[] = [];
    for (const [idx, row] of batch.entries()) {
      if (row.is_summary) continue;
      if (selectedDay === new Date(parseInt(row.message_sequence)).toLocaleDateString()) {
        groupRows.push(row);
      } else {
        nextIdx = idx;
        break;
      }
    }

    logger.info({ selectedDay, rows: groupRows.length }, 'Grouped messages for a the oldest date');
    return { nextIdx, rows: groupRows };
  }

  private async summarizeRows(rows: ExistingRow[]): Promise<number> {
    const contents = rows.map(({ role, message }) => ({ role, parts: [message] }));
    const { totalTokens } = await this.model.countTokens({ contents });

    contents.push({ role: 'user', parts: [{ text: 'Summarize the conversation.' }] });
    const { response } = await this.model.generateContent({ contents });
    const summary = response.text();
    await this.archiveRows({ summary, rows });
    return totalTokens - (response.usageMetadata?.candidatesTokenCount || 0);
  }

  private async archiveRows({ summary, rows }: ArchiveRowsArgs): Promise<void> {
    for (const row of rows) {
      await this.db.query(
        `UPDATE conversation_history 
          SET is_archived=$1, updated_at=$2
          WHERE user_id = $3
          AND message_sequence = $4`,
        [true, epochTime(), this.userId, parseInt(row.message_sequence)],
      );
    }
    logger.info('Created embeddings and updated rows to archived.');

    const summarySequence = parseInt(rows[rows.length - 1].message_sequence);
    await this.db.query(
      `INSERT INTO conversation_history (user_id, message_sequence, role, message, is_summary, created_at, updated_at) VALUES 
        ($1, $2, $3, $4, $5, $6, $7)`,
      [this.userId, summarySequence, 'model', { text: summary }, true, epochTime(), epochTime()],
    );
    logger.info('Summary inserted to database');
  }
}
