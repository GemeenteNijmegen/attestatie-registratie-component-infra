import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { AttestatieRegestratieComponent, OpenProductApiService, VerIdAttestationService } from '@gemeentenijmegen/attestatie-registratie-component';
import { AWS } from '@gemeentenijmegen/utils';
import { DynamoDBCacheManager } from '@ver-id/node-client';
import { ALBResult, LambdaFunctionURLEvent } from 'aws-lambda';

const dynamoClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({}),
);

interface ArcRequest {
  path: string;
  productId: string;
  type: string;
  authorization?: string;
}

function parseEvent(event: LambdaFunctionURLEvent): ArcRequest {
  return {
    path: event.rawPath,
    productId: event.queryStringParameters?.productId ?? '',
    type: event.queryStringParameters?.type ?? '',
    authorization: event.headers?.['x-api-key'] ?? event.headers?.Authorization,
  };
}

/**
 * Very minimal setup to test full cycle
 * @param event
 * @returns
 */
export async function handler(event: LambdaFunctionURLEvent): Promise<ALBResult> {

  const request = parseEvent(event);

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

    if (request.path.includes('/start')) {
      return await start(request, arc);
    };

    if (request.path.includes('/callback')) {
      return await callback(request, arc);
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


async function start(request: ArcRequest, arc: AttestatieRegestratieComponent): Promise<ALBResult> {
  console.log('Handling start...', request);

  if (request.type != 'producten' || !request.authorization) {
    throw Error('Invalid request');
  }

  const redirectUri = await arc.start({
    id: request.productId,
    type: request.type,
    token: request.authorization,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ url: redirectUri }),
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

async function callback(request: ArcRequest, arc: AttestatieRegestratieComponent): Promise<ALBResult> {
  console.log('Handling callback...', request);

  const success = await arc.callback(request);

  return {
    statusCode: 302,
    headers: {
      Location: `https://mijn.dev.nijmegen.nl/producten?is_wallet_ingeladen=true&status=${success}`,
    },
  };
}