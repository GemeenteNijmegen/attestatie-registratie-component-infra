import { RemovalPolicy } from 'aws-cdk-lib';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';


export class StateTable extends Construct {
  public readonly table: Table;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.table = new Table(this, 'table', {
      partitionKey: { name: 'pk', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }
}
