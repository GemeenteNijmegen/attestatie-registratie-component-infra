import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ArcStack } from '../src/main';

test('Snapshot arc stack', () => {
  const app = new App();
  const stack = new ArcStack(app, 'test', {
    env: {
      account: '123456789012',
      region: 'eu-central-1',
    },
    configuration: {
      arcCallbackEndpoint: 'https://arc.example.com/callback',
      verIdClientId: 'test-client-id',
      verIdIssuerUrl: 'https://verid.example.com/issuer',
      deployToEnvironment: {
        account: '123456789012',
        region: 'eu-central-1',
      },
    },
  });

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
