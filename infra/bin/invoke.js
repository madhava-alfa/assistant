#!/usr/bin/env node
import 'source-map-support/register.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { AssistantStack } from '../dist/lib/index.js';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });
const app = new cdk.App();
new AssistantStack(app);
