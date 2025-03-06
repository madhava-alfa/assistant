import { aws_iam, aws_kms, aws_lambda, aws_sqs, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { LambdaFunction } from './constructs/lambda.js';
import { Tables } from './database.js';

type RestApiArgs = {
  encryptionKey: aws_kms.Key;
  tables: Tables;
  archivalQueue: aws_sqs.Queue;
};

export class RestApi extends Construct {
  private readonly args: RestApiArgs;
  private readonly code: aws_lambda.Code;

  constructor(scope: Stack, args: RestApiArgs) {
    super(scope, 'RestApi');
    this.args = args;
    this.code = this.getCode();
    this.createFunctions();
  }

  private getCode(): aws_lambda.Code {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const codePath = join(currentDir, `../../code/server/package`);
    return aws_lambda.Code.fromAsset(codePath);
  }

  private createFunctions() {
    new LambdaFunction(this, {
      functionName: 'Assistant-GetHistory',
      handler: 'dist/src/handlers/index.chatHistoryHandler',
      code: this.code,
      encryptionKey: this.args.encryptionKey,
      rolePolicyStatements: [
        new aws_iam.PolicyStatement({ actions: ['dynamodb:Query'], resources: [this.args.tables.assistant.tableArn] }),
      ],
    });

    new LambdaFunction(this, {
      functionName: 'Assistant-SendMessage',
      handler: 'dist/src/handlers/index.chatMessageHandler',
      code: this.code,
      environment: {
        GOOGLE_API_KEY: process.env['GOOGLE_API_KEY'] as string,
        ARCHIVAL_QUEUE_URL: this.args.archivalQueue.queueUrl,
      },
      encryptionKey: this.args.encryptionKey,
      rolePolicyStatements: [
        new aws_iam.PolicyStatement({
          actions: ['dynamodb:Query'],
          resources: [`${this.args.tables.assistant.tableArn}/index/*`],
        }),
        new aws_iam.PolicyStatement({
          actions: ['dynamodb:PutItem'],
          resources: [this.args.tables.assistant.tableArn],
        }),
        new aws_iam.PolicyStatement({
          actions: ['sqs:SendMessage'],
          resources: [this.args.archivalQueue.queueArn],
        }),
      ],
    });
  }
}
