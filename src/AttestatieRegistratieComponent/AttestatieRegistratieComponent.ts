import { AttributeType, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { Function, FunctionUrl } from 'aws-cdk-lib/aws-lambda';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { ArcFunction } from './lambda/arc-function';

export interface AttestatieRegistratieComponentProps {
  verIdClientId: string;
  verIdIssuerUrl: string;
  arcCallbackEndpoint: string;
}

export class AttestatieRegistratieComponent extends Construct {

  readonly functionUrl: FunctionUrl;

  constructor(scope: Construct, id: string, private readonly props: AttestatieRegistratieComponentProps) {
    super(scope, id);
    const lambda = this.setupLambda();
    this.functionUrl = this.setupFunctionUrl(lambda);
  }

  private setupLambda() {

    const clientSecret = new Secret(this, 'verid-client-secret', {
      description: 'Client secret VerID issueance',
    });

    const veridCacheTable = new TableV2(this, 'verid-cache-table', {
      partitionKey: {
        name: 'pk',
        type: AttributeType.STRING,
      },
      timeToLiveAttribute: 'ttl',
    });

    const arc = new ArcFunction(this, 'arc-function', {
      environment: {
        VERID_CLIENT_ID: this.props.verIdClientId,
        VERID_CLIENT_SECRET: clientSecret.secretArn,
        VERID_ISSUER_URL: this.props.verIdIssuerUrl,
        ARC_CALLBACK_ENDPOINT: this.props.arcCallbackEndpoint,
        CACHE_TABLE_NAME: veridCacheTable.tableName,
      },
    });

    veridCacheTable.grantReadWriteData(arc);
    clientSecret.grantRead(arc);
    return arc;
  }

  private setupFunctionUrl(lambda: Function) {
    return new FunctionUrl(this, 'function-url', {
      function: lambda,
    });
  }

}
