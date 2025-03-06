import { aws_sqs, Duration, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class ArchivalResources extends Construct {
  readonly archivalQueue: aws_sqs.Queue;
  readonly dlq: aws_sqs.Queue;

  constructor(scope: Stack) {
    super(scope, 'ArchivalResources');

    this.dlq = new aws_sqs.Queue(this, 'DLQ', {
      queueName: 'assistant-messages-archival-dlq',
      retentionPeriod: Duration.days(14),
    });

    this.archivalQueue = new aws_sqs.Queue(this, 'Queue', {
      queueName: 'assistant-messages-archival-queue',
      deadLetterQueue: { queue: this.dlq, maxReceiveCount: 3 },
      visibilityTimeout: Duration.minutes(6),
    });
  }
}
