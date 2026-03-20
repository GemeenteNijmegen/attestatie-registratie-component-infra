import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { PipelineStack } from '../src/PipelineStack';

test('Snapshot arc stack', () => {
  const app = new App();
  const stack = new PipelineStack(app, 'test', {
    env: {
      account: '123456789012',
      region: 'eu-central-1',
    },
    configuration: {
      branch: 'test',
      arcCallbackEndpoint: 'https://arc.example.com/callback',
      verIdClientId: 'test-client-id',
      verIdIssuerUrl: 'https://verid.example.com/issuer',
      openProductBaseUrl: 'https://mijn-services-dev.csp-nijmegen.nl/open-product/producten/api/v1',
      deployToEnvironment: {
        account: '123456789012',
        region: 'eu-central-1',
      },
      deployFromEnvironment: {
        account: '123456789012',
        region: 'eu-central-1',
      },
    },
  });

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
