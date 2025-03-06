import { aws_dynamodb, aws_kms, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

type DynamoDBArgs = {
  encryptionKey: aws_kms.Key;
};

export type Tables = {
  assistant: aws_dynamodb.Table;
};

export class DynamoDB extends Construct {
  private args: DynamoDBArgs;
  readonly tables: Tables;

  constructor(scope: Stack, args: DynamoDBArgs) {
    super(scope, 'DynamoDB');
    this.args = args;
    this.tables = {
      assistant: this.createAssistantTable(),
    };
  }

  createAssistantTable(): aws_dynamodb.Table {
    const table = new aws_dynamodb.Table(this, 'Assistant', {
      tableName: 'Assistant',
      partitionKey: { name: 'partitionKey', type: aws_dynamodb.AttributeType.STRING },
      sortKey: { name: 'sortKey', type: aws_dynamodb.AttributeType.STRING },
      encryption: aws_dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.args.encryptionKey,
      removalPolicy: RemovalPolicy.RETAIN,
      deletionProtection: true,
      billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    table.addLocalSecondaryIndex({
      indexName: 'MessageStatusIndex',
      sortKey: { name: 'statusSequence', type: aws_dynamodb.AttributeType.STRING },
      projectionType: aws_dynamodb.ProjectionType.ALL,
    });

    return table;
  }
}
