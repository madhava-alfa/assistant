import { Stack, App } from 'aws-cdk-lib';
import { Website } from './website.js';
import { RestApi } from './api.js';

export class AssistantStack extends Stack {
  constructor(scope: App) {
    super(scope, 'AssistantStack', { env: { region: 'us-west-2', account: '442042510266' } });

    new Website(this);
    new RestApi(this);
  }
}
