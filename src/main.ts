
import { App, Stack, StackProps } from 'aws-cdk-lib';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { AttestatieRegistratieComponent } from './AttestatieRegistratieComponent/AttestatieRegistratieComponent';
import { CloudfrontDistributionSubdomain } from './CloudfrontDistributionSubdomain';
import { Configuration, getEnvironmentConfiguration } from './Configuration';
import { Statics } from './Statics';

interface ArcStackProps extends StackProps {
  configuration: Configuration;
}

export class ArcStack extends Stack {
  constructor(scope: Construct, id: string, private readonly props: ArcStackProps) {
    super(scope, id, props);

    // Import exisitng hosted zone
    const hostedzone = HostedZone.fromHostedZoneAttributes(this, 'hostedzone', {
      hostedZoneId: StringParameter.valueForStringParameter(this, Statics.ssmAccountRootHostedZoneId),
      zoneName: StringParameter.valueForStringParameter(this, Statics.ssmAccountRootHostedZoneName),
    });

    // Setup arc
    const arc = new AttestatieRegistratieComponent(this, 'arc', {
      arcCallbackEndpoint: this.props.configuration.arcCallbackEndpoint,
      verIdClientId: this.props.configuration.verIdClientId,
      verIdIssuerUrl: this.props.configuration.verIdIssuerUrl,
    });

    // Setup cloudfront incl subdomain for existing hosted zone
    new CloudfrontDistributionSubdomain(this, 'cloudfront', {
      functionUrl: arc.functionUrl,
      hostedZone: hostedzone,
      subdomain: 'arc',
    });

  }
}

const branchName = process.env.BRANCH_NAME ?? 'development';
console.log('Building for branch:', branchName);
const configuration = getEnvironmentConfiguration(branchName);

const app = new App();

new ArcStack(app, 'arc-stack', {
  env: configuration.deployToEnvironment,
  configuration: configuration,
});

app.synth();