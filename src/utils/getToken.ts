import * as dotenv from "dotenv";
dotenv.config();

import { getSalesChannelToken, getIntegrationToken } from "@commercelayer/js-auth";
import { ConfigOptions } from "../types/config";

export const getToken = async (config: ConfigOptions) => {
  const { BASE_ENDPOINT, CLIENT_ID, CLIENT_SECRET } = config;
  const auth = await getIntegrationToken({
    endpoint: BASE_ENDPOINT,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET
  });
  return auth.accessToken;
};

export const getCheckoutToken = async (config: ConfigOptions, marketNumber: number) => {
  const { BASE_ENDPOINT, CLIENT_ID_CHECKOUT } = config;
  const auth = await getSalesChannelToken({
    endpoint: BASE_ENDPOINT,
    clientId: CLIENT_ID_CHECKOUT,
    scope: `market:${marketNumber}`
  });
  return auth.accessToken;
};
