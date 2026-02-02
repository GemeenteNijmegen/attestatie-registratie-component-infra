
import { App } from 'aws-cdk-lib';
import { getEnvironmentConfiguration } from './Configuration';
import { PipelineStack } from './PipelineStack';

const branchName = process.env.BRANCH_NAME ?? 'development';
console.log('Building for branch:', branchName);
const configuration = getEnvironmentConfiguration(branchName);

const app = new App();

new PipelineStack(app, `arc-infra-pipeline-${configuration.branch}`, {
  env: configuration.deployFromEnvironment,
  configuration: configuration,
});

app.synth();