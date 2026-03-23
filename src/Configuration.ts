import { Environment } from 'aws-cdk-lib';
import { Statics } from './Statics';


export interface Configuration {
  branch: string;
  verIdIssuerUrl: string;
  arcCallbackEndpoint: string;
  openProductBaseUrl: string;
  deployToEnvironment: Required<Environment>;
  deployFromEnvironment: Required<Environment>;
}

const configuration: Record<string, Configuration> = {
  development: {
    branch: 'development',
    verIdIssuerUrl: 'https://ssi.oauth.ver.id/authorization/request',
    arcCallbackEndpoint: 'https://arc.mijn-services-dev.csp-nijmegen.nl/callback',
    openProductBaseUrl: 'https://mijn-services-dev.csp-nijmegen.nl/open-product/producten/api/v1',
    deployToEnvironment: Statics.gnMijnServicesDev,
    deployFromEnvironment: Statics.gnBuildEnvironment,
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
