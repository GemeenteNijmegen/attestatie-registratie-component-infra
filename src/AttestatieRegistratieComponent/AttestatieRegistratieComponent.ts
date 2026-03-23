import { Duration, Stack } from 'aws-cdk-lib';
import { AttributeType, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Function, FunctionUrl, FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { StateTable } from '../StateTable';
import { ArcFunction } from './lambda/arc-function';

export interface AttestatieRegistratieComponentProps {
  verIdIssuerUrl: string;
  arcCallbackEndpoint: string;
  openProductBaseUrl: string;
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

    const state = new StateTable(this, 'state');

    const veridCacheTable = new TableV2(this, 'verid-cache-table', {
      partitionKey: {
        name: 'pk',
        type: AttributeType.STRING,
      },
      timeToLiveAttribute: 'ttl',
    });

    const apiKey = new Secret(this, 'arc-api-key', {
      description: 'API key for ARC',
    });

    const openProductApiKey = new Secret(this, 'open-product-api-key', {
      description: 'API key for OpenProduct',
    });

    const arc = new ArcFunction(this, 'arc-function', {
      environment: {
        VERID_CLIENT_SECRET: clientSecret.secretArn,
        VERID_ISSUER_URL: this.props.verIdIssuerUrl,
        ARC_CALLBACK_ENDPOINT: this.props.arcCallbackEndpoint,
        CACHE_TABLE_NAME: veridCacheTable.tableName,
        ARC_API_KEY_ARN: apiKey.secretArn,
        OPEN_PRODUCT_API_KEY: openProductApiKey.secretArn,
        OPEN_PRODUCT_BASE_URL: this.props.openProductBaseUrl,
        STATE_TABLE_NAME: state.table.tableName,
      },
      timeout: Duration.seconds(6),
    });

    arc.grantInvoke(new ServicePrincipal('cloudfront.amazonaws.com', {
      conditions: {
        ArnLike: {
          'aws:SourceArn': `arn:aws:cloudfront::${Stack.of(this).account}:distribution/*`, // https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html
        },
      },
    }));

    openProductApiKey.grantRead(arc);
    veridCacheTable.grantReadWriteData(arc);
    state.table.grantReadWriteData(arc);
    clientSecret.grantRead(arc);
    apiKey.grantRead(arc);
    return arc;
  }

  private setupFunctionUrl(lambda: Function) {
    return new FunctionUrl(this, 'function-url', {
      function: lambda,
      authType: FunctionUrlAuthType.AWS_IAM, // Use IAM to allow cloudfront access to this function url
    });
  }

}
