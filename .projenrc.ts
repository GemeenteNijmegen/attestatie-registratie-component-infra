import { GemeenteNijmegenCdkApp } from '@gemeentenijmegen/projen-project-type';
const project = new GemeenteNijmegenCdkApp({
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  name: 'attestatie-registratie-component-infra',
  projenrcTs: true,
  deps: [
    '@gemeentenijmegen/projen-project-type',
    '@gemeentenijmegen/attestatie-registratie-component',
    '@gemeentenijmegen/cross-region-parameters',
    '@gemeentenijmegen/utils',
    '@types/aws-lambda',
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/lib-dynamodb',
    '@ver-id/node-client',
  ],
});
project.synth();