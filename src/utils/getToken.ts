import * as dotenv from "dotenv";
dotenv.config();

import { authentication } from "@commercelayer/js-auth";
import { ConfigOptions } from "../types/config";

export const getCheckoutToken = async (config: ConfigOptions, marketNumber: number) => {
  const { organizationSlug, clientIdCheckout } = config;
  const auth = await authentication("client_credentials", {
    slug: organizationSlug,
    clientId: clientIdCheckout,
    scope: `market:${marketNumber}`
  });
  return auth.accessToken;
};
