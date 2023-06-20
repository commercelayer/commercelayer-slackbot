import * as dotenv from "dotenv";
dotenv.config();

import { authentication } from "@commercelayer/js-auth";
import { ConfigOptions } from "../types/config";

export const getCheckoutToken = async (config: ConfigOptions, marketNumber: number) => {
  const { organizationSlug, CLIENT_ID_CHECKOUT } = config;
  const auth = await authentication("client_credentials", {
    slug: organizationSlug,
    clientId: CLIENT_ID_CHECKOUT,
    scope: `market:${marketNumber}`
  });
  return auth.accessToken;
};
