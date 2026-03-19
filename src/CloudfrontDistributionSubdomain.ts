import { RemoteParameters } from '@gemeentenijmegen/cross-region-parameters';
import { aws_cloudfront_origins } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { AllowedMethods, CachePolicy, Distribution, OriginRequestPolicy, PriceClass, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { FunctionUrl } from 'aws-cdk-lib/aws-lambda';
import { AaaaRecord, ARecord, IHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import { Statics } from './Statics';

class CloudfrontDistributionSubdomainProps {
  subdomain: string;
  functionUrl: FunctionUrl;
  hostedZone: IHostedZone;
}
export class CloudfrontDistributionSubdomain extends Construct {
  private domain: string;

  constructor(scope: Construct, id: string, private props: CloudfrontDistributionSubdomainProps) {
    super(scope, id);
    this.domain = `${this.props.subdomain}.${this.props.hostedZone.zoneName}`;
    this.createDistribution();
  }

  /**
   * Get the certificate ARN from parameter store in us-east-1
   * @returns string Certificate ARN
   */
  private certificateArn() {
    const parameters = new RemoteParameters(this, 'params', {
      path: `${Statics.ssmWildcardCertificatePath}/`,
      region: 'us-east-1',
    });
    const certificateArn = parameters.get(Statics.ssmWildcardCertificateArn);
    return certificateArn;
  }


  createDistribution() {
    const certificate = Certificate.fromCertificateArn(this, 'certificate', this.certificateArn());

    const origin = aws_cloudfront_origins.FunctionUrlOrigin.withOriginAccessControl(this.props.functionUrl);

    const distribution = new Distribution(this, 'MyDistribution', {
      comment: 'Distribution for arc infra',
      defaultBehavior: {
        origin: origin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
        cachePolicy: CachePolicy.CACHING_DISABLED, // Maybe later we can look into this
      },
      defaultRootObject: 'index.html',
      certificate: certificate,
      domainNames: [this.domain],
      priceClass: PriceClass.PRICE_CLASS_100,
    });
    this.addDnsRecords(distribution);

    return distribution;
  }

  private addDnsRecords(distribution: Distribution) {
    new ARecord(this, 'a-record', {
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone: this.props.hostedZone,
      recordName: this.props.subdomain,
    });
    new AaaaRecord(this, 'aaaa', {
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone: this.props.hostedZone,
      recordName: this.props.subdomain,
    });
  }

}
