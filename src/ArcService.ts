import { IHostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { AttestatieRegistratieComponent } from './AttestatieRegistratieComponent/AttestatieRegistratieComponent';
import { CloudfrontDistributionSubdomain } from './CloudfrontDistributionSubdomain';
import { Configuration } from './Configuration';

export interface ArcServiceProps {
  readonly hostedZone: IHostedZone;
  readonly configuration: Configuration;
}

export class ArcService extends Construct {
  constructor(scope: Construct, id: string, private readonly props: ArcServiceProps) {
    super(scope, id);

    // Setup arc
    const arc = new AttestatieRegistratieComponent(this, 'arc', {
      arcCallbackEndpoint: this.props.configuration.arcCallbackEndpoint,
      verIdClientId: this.props.configuration.verIdClientId,
      verIdIssuerUrl: this.props.configuration.verIdIssuerUrl,
    });

    // Setup cloudfront incl subdomain for existing hosted zone
    new CloudfrontDistributionSubdomain(this, 'cloudfront', {
      functionUrl: arc.functionUrl,
      hostedZone: this.props.hostedZone,
      subdomain: 'arc',
    });
  }
}
