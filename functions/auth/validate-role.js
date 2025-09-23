import { Client, Databases, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  log(`Function started.`);

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.send('', 200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
  }

  let bodyData;
  if (typeof req.body === 'string') {
    bodyData = JSON.parse(req.body || '{}');
  } else {
    bodyData = req.body || {};
  }
  const { userId, requiredRole } = bodyData;

  if (!userId) {
    return res.json({ error: 'User ID is required' }, 400, {
      'Access-Control-Allow-Origin': '*'
    });
  }

  try {
    const client = new Client();
  
  // Use global endpoint to avoid "request cannot have request body" error with regional endpoints
  const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const globalEndpoint = endpoint.replace('nyc.cloud.appwrite.io', 'cloud.appwrite.io');
  
  client
    .setEndpoint(globalEndpoint)
    .setProject(process.env.APPWRITE_PROJECT_ID || '68af870000012641090a')
    .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    const databaseId = process.env.APPWRITE_DATABASE_ID || 'atSupplyFinder';

    log(`Querying for user ${userId}`);

    const response = await databases.listDocuments(
      databaseId,
      'userRoles',
      [Query.equal('userId', userId)]
    );

    if (response.documents.length === 0) {
      return res.json({ hasRole: false, role: null }, 200, {
        'Access-Control-Allow-Origin': '*'
      });
    }

    const userRole = response.documents[0].role;

    if (!requiredRole) {
      return res.json({ hasRole: true, role: userRole }, 200, {
        'Access-Control-Allow-Origin': '*'
      });
    }

    const hasRequiredRole = userRole === requiredRole;

    return res.json({ hasRole: hasRequiredRole, role: userRole }, 200, {
      'Access-Control-Allow-Origin': '*'
    });
  } catch (e) {
    error(e);
    return res.json({ error: 'An error occurred', details: e.message }, 500, {
      'Access-Control-Allow-Origin': '*'
    });
  }
};