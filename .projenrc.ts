import { GemeenteNijmegenCdkApp } from '@gemeentenijmegen/projen-project-type';
const project = new GemeenteNijmegenCdkApp({
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  devDeps: ['@gemeentenijmegen/projen-project-type'],
  name: 'attestatie-registratie-component-infra',
  projenrcTs: true,
  deps: [
    '@gemeentenijmegen/attestatie-registratie-component',
    '@gemeentenijmegen/cross-region-parameters',
    '@gemeentenijmegen/utils',
    '@types/aws-lambda',
  ],
});
project.synth();