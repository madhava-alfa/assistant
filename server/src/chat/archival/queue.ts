import * as sqs from '@aws-sdk/client-sqs';
import { Logger } from '../../utils/logger.js';

const logger = new Logger({ module: import.meta.url });

type ArchivalBatch = {
  userId: string;
  startSequence: number;
  endSequence: number;
};

type SendMessageArgs = {
  batch: ArchivalBatch;
};

export class ArchivalQueue {
  private readonly client: sqs.SQSClient;
  private readonly queueUrl: string;

  constructor() {
    this.client = new sqs.SQSClient({});
    this.queueUrl = process.env['ARCHIVAL_QUEUE_URL'] as string;
    logger.info('Archival Queue Client initialized');
  }

  async sendMessage(args: SendMessageArgs): Promise<string | undefined> {
    const command = new sqs.SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify({ batch: args.batch }),
    });

    const response = await this.client.send(command);
    logger.info({ args, response }, 'Sent message to Queue');
    return response.MessageId;
  }
}
