import { Stack, App, aws_kms } from 'aws-cdk-lib';
import { Website } from './website.js';
import { RestApi } from './api.js';
import { DynamoDB } from './database.js';
import { ArchivalResources } from './archival.js';

export class AssistantStack extends Stack {
  constructor(scope: App) {
    super(scope, 'AssistantStack', { env: { region: 'us-west-2', account: '442042510266' } });
    const encryptionKey = new aws_kms.Key(this, 'AssistantKey', { alias: 'AssistantKey', enableKeyRotation: true });

    new Website(this);
    const { tables } = new DynamoDB(this, { encryptionKey });
    const { archivalQueue } = new ArchivalResources(this);
    new RestApi(this, { encryptionKey, tables, archivalQueue });
  }
}
