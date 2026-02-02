export class Statics {

  // MARK: IMPORTED SSM Parameters
  static readonly ssmCertificatePath = '/mijn-services/certificate';
  static readonly ssmCertificateArn = '/mijn-services/certificate/arn';
  static readonly ssmWildcardCertificatePath = '/mijn-services/wildcard-certificate';
  static readonly ssmWildcardCertificateArn = '/mijn-services/wildcard-certificate/arn';

  // Managed in dns-managment project:
  // Below references the new hosted zone separeted from webformulieren
  static readonly ssmAccountRootHostedZonePath: string = '/gemeente-nijmegen/account/hostedzone';
  static readonly ssmAccountRootHostedZoneId: string = '/gemeente-nijmegen/account/hostedzone/id';
  static readonly ssmAccountRootHostedZoneName: string = '/gemeente-nijmegen/account/hostedzone/name';

  // MARK: Environments
  static readonly gnBuildEnvironment = {
    account: '836443378780',
    region: 'eu-central-1',
  };

  static readonly gnMijnServicesDev = {
    account: '958979025885',
    region: 'eu-central-1',
  };

  static readonly gnMijnServicesAccp = {
    account: '145023129433',
    region: 'eu-central-1',
  };

  static readonly gnMijnServicesProd = {
    account: '692859927138',
    region: 'eu-central-1',
  };

}
