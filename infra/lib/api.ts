import { aws_lambda, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { LambdaFunction } from './constructs/lambda.js';

export class RestApi extends Construct {
  private readonly code: aws_lambda.Code;
  private readonly env: Record<string, string>;

  constructor(scope: Stack) {
    super(scope, 'RestApi');
    this.code = this.getCode();
    this.env = {
      GOOGLE_API_KEY: process.env['GOOGLE_API_KEY'] as string,
      PGHOST: process.env['PGHOST'] as string,
      PGUSER: process.env['PGUSER'] as string,
      PGPASSWORD: process.env['PGPASSWORD'] as string,
    };
    this.createFunctions();
  }

  private getCode(): aws_lambda.Code {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const codePath = join(currentDir, `../code/server/package`);
    return aws_lambda.Code.fromAsset(codePath);
  }

  private createFunctions() {
    new LambdaFunction(this, {
      functionName: 'Assistant-GetHistory',
      handler: 'dist/src/handlers/index.chatHistoryHandler',
      code: this.code,
      environment: this.env,
    });

    new LambdaFunction(this, {
      functionName: 'Assistant-SendMessage',
      handler: 'dist/src/handlers/index.chatMessageHandler',
      code: this.code,
      environment: this.env,
    });
  }
}
