import { StageProps, Stage, StackProps, Stack } from "aws-cdk-lib";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { AttestatieRegistratieComponent } from "./AttestatieRegistratieComponent/AttestatieRegistratieComponent";
import { CloudfrontDistributionSubdomain } from "./CloudfrontDistributionSubdomain";
import { Configuration } from "./Configuration";
import { Statics } from "./Statics";

export interface ArcStageProps extends StageProps {
  configuration: Configuration;
}

export class ArcStage extends Stage {
  constructor(scope: Construct, id: string, private readonly props: ArcStageProps) {
    super(scope, id, props);
    new ArcStack(this, 'arc-stack', {
      configuration: props.configuration,
      env: props.configuration.deployToEnvironment,
    })
  }
}

interface ArcStackProps extends StackProps {
  configuration: Configuration;
}
class ArcStack extends Stack {
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