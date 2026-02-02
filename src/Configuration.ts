import { Environment } from 'aws-cdk-lib';
import { Statics } from './Statics';


export interface Configuration {
  verIdClientId: string;
  verIdIssuerUrl: string;
  arcCallbackEndpoint: string;
  deployToEnvironment: Required<Environment>;
}

const configuration: Record<string, Configuration> = {
  development: {
    verIdClientId: '6828f0a8-1c4c-478b-b60e-3db863a8a42e',
    verIdIssuerUrl: 'https://oauth.ssi.dev.ver.garden',
    arcCallbackEndpoint: 'https://mijn-services-dev.csp-nijmegen.nl/arc/callback',
    deployToEnvironment: Statics.gnMijnServicesDev,
  },
};


/**
 * Retrieve a configuration object by passing a branch string
 *
 * **NB**: This retrieves the subobject with key `branchName`, not
 * the subobject containing the `branchName` as the value of the `branch` key
 *
 * @param branchName the branch for which to retrieve the environment
 * @returns the configuration object for this branch
 */
export function getEnvironmentConfiguration(branchName: string): Configuration {
  const conf = configuration[branchName];
  if (!conf) {
    throw Error(`No configuration found for branch ${branchName}`);
  }
  return conf;
}
