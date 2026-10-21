import serverless from 'serverless-http';
import { app } from '../../server/src/app.js';
import { connectDatabase } from '../../server/src/config/database.js';
import { envConfig } from '../../server/src/config/env.js';

const expressHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  // Allow the database connection to be reused between warm invocations.
  context.callbackWaitsForEmptyEventLoop = false;

  // Normalize path so Express routes matching /api/... resolve correctly
  if (event.path && event.path.startsWith('/.netlify/functions/api')) {
    event.path = event.path.replace('/.netlify/functions/api', '/api');
  }

  try {
    if (envConfig.MONGODB_URI) {
      await connectDatabase(envConfig.MONGODB_URI);
    }
    return await expressHandler(event, context);
  } catch (error) {
    console.error('[Netlify API Error]', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'InternalServerError',
        message: 'The API could not process the request.',
      }),
    };
  }
};
