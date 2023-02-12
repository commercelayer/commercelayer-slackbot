import { getIntegrationToken } from "@commercelayer/js-auth";

const BASE_ENDPOINT = process.env.COMMERCE_LAYER_BASE_ENDPOINT;
const CLIENT_ID = process.env.COMMERCE_LAYER_CLIENT_ID;
const CLIENT_SECRET = process.env.COMMERCE_LAYER_CLIENT_SECRET;

const getToken = async () => {
  const auth = await getIntegrationToken({
    endpoint: BASE_ENDPOINT,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET
  });
  return auth.accessToken;
};

export default getToken();
