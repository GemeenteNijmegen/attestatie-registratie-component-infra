import { GemeenteNijmegenCdkApp } from '@gemeentenijmegen/projen-project-type';
const project = new GemeenteNijmegenCdkApp({
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  name: 'attestatie-registratie-component-infra',
  projenrcTs: true,
  releaseWorkflowEnv: {
    VER_ID_GH_TOKEN: '${{ secrets.VER_ID_GH_TOKEN }}',
  },
  buildWorkflowOptions: {
    env: {
      VER_ID_GH_TOKEN: '${{ secrets.VER_ID_GH_TOKEN }}',
    },
  },
  deps: [
    '@gemeentenijmegen/projen-project-type',
    '@gemeentenijmegen/attestatie-registratie-component',
    '@gemeentenijmegen/cross-region-parameters',
    '@gemeentenijmegen/utils',
    '@types/aws-lambda',
  ],
});
project.synth();