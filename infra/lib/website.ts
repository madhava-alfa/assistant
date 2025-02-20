import {
  aws_cloudfront,
  aws_s3,
  aws_iam,
  aws_certificatemanager,
  aws_cloudfront_origins,
  Duration,
  aws_route53,
  aws_route53_targets,
  aws_s3_deployment,
  Stack,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export class Website extends Construct {
  private readonly domainName: string;
  private oai: aws_cloudfront.OriginAccessIdentity;
  private bucket: aws_s3.Bucket;
  private distribution: aws_cloudfront.Distribution;

  constructor(scope: Stack) {
    super(scope, 'AssistantWebsite');
    this.domainName = 'assistant.helloalfa.ai';
    this.oai = this.createCloudFrontOAI();
    this.bucket = this.createBucket();
    this.distribution = this.createDistribution();
    this.createAliasRecord();
    this.createDeployment();
  }

  private createCloudFrontOAI(): aws_cloudfront.OriginAccessIdentity {
    return new aws_cloudfront.OriginAccessIdentity(this, 'CloudFrontOAI');
  }

  private createBucket(): aws_s3.Bucket {
    const bucket = new aws_s3.Bucket(this, 'Bucket', {
      bucketName: this.domainName,
      publicReadAccess: false,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
    });

    bucket.addToResourcePolicy(
      new aws_iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [bucket.arnForObjects('*')],
        principals: [new aws_iam.CanonicalUserPrincipal(this.oai.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
      }),
    );

    // List bucket is needed for CloudFront to respond with 404 when object is not present instead of 403
    bucket.addToResourcePolicy(
      new aws_iam.PolicyStatement({
        actions: ['s3:ListBucket'],
        resources: [bucket.bucketArn],
        principals: [new aws_iam.CanonicalUserPrincipal(this.oai.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
      }),
    );

    return bucket;
  }

  private createDistribution(): aws_cloudfront.Distribution {
    const responseHeadersPolicy = new aws_cloudfront.ResponseHeadersPolicy(this, 'ResponseHeadersPolicy', {
      responseHeadersPolicyName: `AssistantResponseHeadersPolicy`,
      corsBehavior: {
        accessControlAllowCredentials: false,
        accessControlAllowOrigins: ['*'],
        accessControlAllowHeaders: ['*'],
        accessControlAllowMethods: ['ALL'],
        originOverride: false,
      },
      customHeadersBehavior: {
        customHeaders: [{ header: 'Cache-Control', value: `max-age=${365 * 24 * 60 * 60}`, override: false }],
      },
    });

    return new aws_cloudfront.Distribution(this, 'Distribution', {
      certificate: aws_certificatemanager.Certificate.fromCertificateArn(
        this,
        'CertArn',
        'arn:aws:acm:us-east-1:442042510266:certificate/252e0a23-fe60-494d-8c67-b95d37895260',
      ),
      defaultRootObject: 'index.html',
      domainNames: [this.domainName, `www.${this.domainName}`],
      minimumProtocolVersion: aws_cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(30),
        },
      ],
      defaultBehavior: {
        origin: aws_cloudfront_origins.S3BucketOrigin.withOriginAccessIdentity(this.bucket, {
          originAccessIdentity: this.oai,
        }),
        compress: true,
        allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: aws_cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originRequestPolicy: aws_cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        responseHeadersPolicy: responseHeadersPolicy,
      },
    });
  }

  private createAliasRecord() {
    const zone = aws_route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: 'Z0997291U6WHZ5490GWJ',
      zoneName: 'helloalfa.ai',
    });
    const target = aws_route53.RecordTarget.fromAlias(new aws_route53_targets.CloudFrontTarget(this.distribution));
    new aws_route53.ARecord(this, 'AliasRecord', { recordName: this.domainName, zone, target });
    new aws_route53.ARecord(this, 'WWWAliasRecord', { recordName: `www.${this.domainName}`, zone, target });
  }

  private createDeployment() {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    new aws_s3_deployment.BucketDeployment(this, 'BucketDeployment', {
      sources: [aws_s3_deployment.Source.asset(join(currentDir, `../../../assistant/web/build`))],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
    });
  }
}
