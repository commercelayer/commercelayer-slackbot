import * as dotenv from "dotenv";
dotenv.config();

import { getSalesChannelToken, getIntegrationToken } from "@commercelayer/js-auth";

const BASE_ENDPOINT = `https://${process.env.CL_ORGANIZATION_SLUG}.commercelayer.io`;
const CLIENT_ID = process.env.CL_CLIENT_ID;
const CLIENT_ID_CART = process.env.CL_CLIENT_ID_CART;
const CLIENT_SECRET = process.env.CL_CLIENT_SECRET;

export const getToken = async () => {
  const auth = await getIntegrationToken({
    endpoint: BASE_ENDPOINT,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET
  });
  return auth.accessToken;
};

export const getCartToken = async (marketNumber: number) => {
  const auth = await getSalesChannelToken({
    endpoint: BASE_ENDPOINT,
    clientId: CLIENT_ID_CART,
    scope: `market:${marketNumber}`
  });
  return auth.accessToken;
};
