import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ARC, DynamoDb, OpenProduct, OpenProductStandplaatsvergunning, VerID } from '@gemeentenijmegen/attestatie-registratie-component';
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
  console.debug('event', JSON.stringify(event));
  const request = parseEvent(event);

  try {

    // const arc = new AttestatieRegistratieComponent({
    //   attestationService: new VerIdAttestationService({
    //     client_secret: await AWS.getSecret(process.env.VERID_CLIENT_SECRET!),
    //     issuerUri: process.env.VERID_ISSUER_URL!,
    //     redirectUri: process.env.ARC_CALLBACK_ENDPOINT!,
    //     cacheManager: dynamoDbCacheManager,
    //   }),
    //   productenService: new OpenProductApiService({
    //     apiToken: await AWS.getSecret(process.env.OPEN_PRODUCT_API_KEY!),
    //     baseUrl: process.env.OPEN_PRODUCT_BASE_URL!,
    //   }),
    //   apiKey: await AWS.getSecret(process.env.ARC_API_KEY_ARN!),
    // });

    if (request.path.includes('/start')) {
      return await start(request);
    };

    if (request.path.includes('/callback')) {
      return await callback(request);
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

/**
 * Starts the issueance process
 * @param request
 * @param arc
 * @returns
 */
async function start(request: ArcRequest): Promise<ALBResult> {
  console.log('Handling start...', request);

  // Secure this endpoint
  const apikey = await AWS.getSecret(process.env.ARC_API_KEY_ARN!);
  if (!apikey || request.authorization !== apikey) {
    throw Error('Unauthorized');
  }

  if (request.type != 'producten' || !request.authorization) {
    throw Error('Invalid request');
  }

  const arc = await createARC();

  const result = await arc.issue({
    source: 'openproduct', //TODO map from request.type
    id: request.productId,
    attestation: 'standplaatsvergunning',
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ url: result.url }),
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Redirects the user to the portal's result page after callback.
 * @param request
 * @param arc
 * @returns
 */
async function callback(request: ArcRequest): Promise<ALBResult> {
  console.log('Handling callback...', request);

  const prarams = new URLSearchParams({
    is_wallet_ingeladen: 'true',
    status: 'true',
  });

  return {
    statusCode: 302,
    headers: {
      Location: `https://mijn.dev.nijmegen.nl/producten?${prarams.toString()}`,
    },
  };
}


async function createARC() {
  const dynamoDbCacheManager = new DynamoDBCacheManager({
    client: dynamoClient,
    tableName: process.env.CACHE_TABLE_NAME!,
    options: {
      ttlSeconds: 600,
    },
  });
  const arc = new ARC({
    provider: new VerID(
      {
        issuerUri: process.env.VERID_ISSUER_URL!,
        redirectUri: process.env.ARC_CALLBACK_ENDPOINT!,
        clientSecret: await AWS.getSecret(process.env.VERID_CLIENT_SECRET!),
        cacheManager: dynamoDbCacheManager,
      },
      {
        standplaatsvergunning: {
          flowUuid: 'xxx-xxx-xxx-xxx',
        },
        overkleidingsakte: {
          flowUuid: 'xxx-xxx-xxx-xxx',
        },
      },
    ),
    store: new DynamoDb({
      tableName: process.env.ARC_STATE_TABLE!,
      defaultTtlSeconds: 3600,
    }),
    sources: [
      new OpenProduct({
        baseUrl: process.env.OPEN_PRODUCT_BASE_URL!,
        apiToken: await AWS.getSecret(process.env.OPEN_PRODUCT_API_KEY!),
      }),
    ],
    attestations: [
      new OpenProductStandplaatsvergunning(),
    ],
  });

  return arc;
}
