import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { AttestatieRegestratieComponent, OpenProductApiService, VerIdAttestationService } from '@gemeentenijmegen/attestatie-registratie-component';
import { AWS } from '@gemeentenijmegen/utils';
import { DynamoDBCacheManager } from '@ver-id/node-client';
import { ALBResult, LambdaFunctionURLEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';

const dynamoClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({}),
);
/**
 * Very minimal setup to test full cycle
 * @param event
 * @returns
 */
export async function handler(event: LambdaFunctionURLEvent): Promise<ALBResult> {

  try {
    const dynamoDbCacheManager = new DynamoDBCacheManager({
      client: dynamoClient,
      tableName: process.env.CACHE_TABLE_NAME!,
      options: {
        ttlSeconds: 600,
      },
    });
    const arc = new AttestatieRegestratieComponent({
      attestationService: new VerIdAttestationService({
        client_id: process.env.VERID_CLIENT_ID!,
        client_secret: await AWS.getSecret(process.env.VERID_CLIENT_SECRET!),
        issuerUri: process.env.VERID_ISSUER_URL!,
        redirectUri: process.env.ARC_CALLBACK_ENDPOINT!,
        cacheManager: dynamoDbCacheManager,
      }),
      productenService: new OpenProductApiService({
        apiToken: await AWS.getSecret(process.env.OPEN_PRODUCT_API_KEY!),
        baseUrl: process.env.OPEN_PRODUCT_BASE_URL!,
      }),
      apiKey: await AWS.getSecret(process.env.ARC_API_KEY_ARN!),
    });

    if (event.rawPath.includes('/start')) {
      return await start(event, arc);
    };

    if (event.rawPath.includes('/callback')) {
      return await callback(event, arc);
    };

  } catch (error) {
    console.log(error);

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Request not handled' }),
      headers: {
        'Conten-Type': 'application/json',
      },
    };
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Request not handled' }),
  };


}


async function start(event: LambdaFunctionURLEvent, arc: AttestatieRegestratieComponent): Promise<ALBResult> {
  console.log('Handling start...', event);

  const redirectUri = await arc.start({
    id: randomUUID(),
    type: 'producten',
    token: event.headers?.['x-api-key'] ?? 'undefined',
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ url: redirectUri }),
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

async function callback(event: LambdaFunctionURLEvent, arc: AttestatieRegestratieComponent): Promise<ALBResult> {
  console.log('Handling callback...', event);

  const success = await arc.callback(event);

  return {
    statusCode: 302,
    headers: {
      Location: `https://mijn.dev.nijmegen.nl/producten?is_wallet_ingeladen=true&status=${success}`,
    },
  };
}