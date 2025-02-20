import { aws_lambda, aws_iam, RemovalPolicy, aws_logs, Duration, aws_kms } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export type LambdaFunctionArgs = Pick<
  aws_lambda.FunctionProps,
  'description' | 'memorySize' | 'timeout' | 'handler' | 'code' | 'environment' | 'deadLetterQueue'
> &
  Pick<aws_lambda.VersionOptions, 'provisionedConcurrentExecutions'> & {
    functionName: string;
    rolePolicyStatements?: aws_iam.PolicyStatement[];
    encryptionKey?: aws_kms.IKey;
  };

export class LambdaFunction extends Construct {
  private readonly args: LambdaFunctionArgs;
  role: aws_iam.Role;
  func: aws_lambda.Function;
  alias: aws_lambda.Alias;

  constructor(scope: Construct, args: LambdaFunctionArgs) {
    super(scope, args.functionName);
    this.args = args;
    this.createRole();
    this.createFunction();
    this.createAlias();
  }

  private createRole(): void {
    const defaultPolicy: aws_iam.PolicyStatement[] = [
      new aws_iam.PolicyStatement({ actions: ['cloudwatch:*', 'logs:*'], resources: ['*'] }),
      // new aws_iam.PolicyStatement({
      //   actions: ['kms:*'],
      //   resources: [this.args.encryptionKey.keyArn],
      //   conditions: { StringLike: { 'kms:ViaService': 'dynamodb.*.amazonaws.com' } },
      // }),
    ];

    this.role = new aws_iam.Role(this, 'Role', {
      roleName: `Lambda-${this.args.functionName}-Role`,
      assumedBy: new aws_iam.ServicePrincipal('lambda'),
      inlinePolicies: {
        DefaultPolicy: new aws_iam.PolicyDocument({
          statements: [...defaultPolicy, ...(this.args.rolePolicyStatements || [])],
        }),
      },
    });
  }

  private createFunction(): void {
    this.func = new aws_lambda.Function(this, 'Function', {
      functionName: this.args.functionName,
      description: `${this.args.description || ''}-${new Date().toISOString()}`,
      role: this.role,
      runtime: aws_lambda.Runtime.NODEJS_22_X,
      memorySize: this.args.memorySize || 1024,
      timeout: this.args.timeout || Duration.seconds(30),
      handler: this.args.handler,
      code: this.args.code,
      environment: {
        ...this.args.environment,
      },
      deadLetterQueue: this.args.deadLetterQueue,
      currentVersionOptions: {
        removalPolicy: RemovalPolicy.DESTROY,
        provisionedConcurrentExecutions: this.args.provisionedConcurrentExecutions,
      },
      tracing: aws_lambda.Tracing.ACTIVE,
      logRetention: aws_logs.RetentionDays.SIX_MONTHS,
    });
  }

  private createAlias(): void {
    this.alias = new aws_lambda.Alias(this, 'Alias', {
      aliasName: 'live',
      version: this.func.currentVersion,
    });
  }
}
