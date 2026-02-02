import { PermissionsBoundaryAspect } from '@gemeentenijmegen/aws-constructs';
import { getNodeVersion } from '@gemeentenijmegen/projen-project-type';
import { Aspects, CfnParameter, Stack, StackProps, pipelines } from 'aws-cdk-lib';
import { BuildSpec } from 'aws-cdk-lib/aws-codebuild';
import { PipelineType } from 'aws-cdk-lib/aws-codepipeline';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { ArcStage } from './ArcStack';
import { Configuration } from './Configuration';
import { Statics } from './Statics';

export interface PipelineStackProps extends StackProps {
  configuration: Configuration;
}

/**
 * The pipeline runs in a build environment, and is responsible for deploying
 * Cloudformation stacks to the workload account. The pipeline will first build
 * and synth the project, then deploy (self-mutating if necessary).
 */
export class PipelineStack extends Stack {
  branchName: string;

  private secrets: Record<string, Secret> = {};

  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);
    Aspects.of(this).add(new PermissionsBoundaryAspect());
    this.branchName = props.configuration.branch;

    /**
     * INSTRUCTIONS:
     * On first deploy, providing a connectionArn param to `cdk deploy` is required, so the
     * codestarconnection can be setup. This connection is responsible for further deploys
     * triggering from a commit to the specified branch on Github.
     */
    const connectionArn = new CfnParameter(this, 'connectionArn');
    const source = this.connectionSource(connectionArn);

    const pipeline = this.pipeline(source, props);

    const arc = new ArcStage(this, 'arc-infra', {
      env: props.configuration.deployToEnvironment,
      configuration: props.configuration,
    });
    pipeline.addStage(arc);

    // Trigger build so we can access the synth project
    pipeline.buildPipeline();

    Object.entries(this.secrets).forEach(([_, secret]) => {
      secret.grantRead(pipeline.synthProject);
    });

  }

  pipeline(source: pipelines.CodePipelineSource, props: PipelineStackProps): pipelines.CodePipeline {
    // We use a private package
    const verIdGithubSecret = new Secret(this, 'ver-id-github-token', {
      description: 'Github token for private package from verid',
    });
    this.secrets.VER_ID_GH_TOKEN = verIdGithubSecret;


    const synthStep = new pipelines.ShellStep('Synth', {
      input: source,
      env: {
        BRANCH_NAME: this.branchName,
      },
      installCommands: [ // Command is used to set secrets (used for private npm repos for example)
        ...Object.entries(this.secrets).map(([key, secret]) => {
          return `export ${key}=$(aws secretsmanager get-secret-value --secret-id ${secret.secretArn} --query SecretString --output text)`;
        }),
      ],
      commands: [
        'yarn install --frozen-lockfile',
        'npx projen build',
      ],
    });

    const pipelineName = `${Statics.projectName}-${props.configuration.branch}`;
    const pipeline = new pipelines.CodePipeline(this, pipelineName, {
      pipelineName: pipelineName,
      crossAccountKeys: true,
      synth: synthStep,
      pipelineType: PipelineType.V1,
      synthCodeBuildDefaults: {
        partialBuildSpec: BuildSpec.fromObject({
          phases: {
            install: {
              'runtime-versions': {
                nodejs: getNodeVersion(),
              },
            },
          },
        }),
      },
    });

    return pipeline;
  }

  /**
   * We use a codestarconnection to trigger automatic deploys from Github
   *
   * The value for this ARN can be found in the CodePipeline service under [settings->connections](https://eu-central-1.console.aws.amazon.com/codesuite/settings/connections?region=eu-central-1)
   * Usually this will be in the build-account.
   *
   * @param connectionArn the ARN for the codestarconnection.
   * @returns
   */
  private connectionSource(connectionArn: CfnParameter): pipelines.CodePipelineSource {
    return pipelines.CodePipelineSource.connection(Statics.projectRepo, this.branchName, {
      connectionArn: connectionArn.valueAsString,
    });
  }
}
