import * as dotenv from "dotenv";
dotenv.config();

import { authentication } from "@commercelayer/js-auth";
import { ConfigOptions } from "../types/config";

// Note: This function is not used in the codebase.
export const getToken = async (config: ConfigOptions) => {
  const { organizationSlug, CLIENT_ID, CLIENT_SECRET } = config;
  const auth = await authentication("client_credentials", {
    slug: organizationSlug,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET
  });
  return auth.accessToken;
};

export const getCheckoutToken = async (config: ConfigOptions, marketNumber: number) => {
  const { organizationSlug, CLIENT_ID_CHECKOUT } = config;
  const auth = await authentication("client_credentials", {
    slug: organizationSlug,
    clientId: CLIENT_ID_CHECKOUT,
    scope: `market:${marketNumber}`
  });
  return auth.accessToken;
};
