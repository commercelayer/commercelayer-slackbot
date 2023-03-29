import * as dotenv from "dotenv";
dotenv.config();

import CommerceLayer from "@commercelayer/sdk";
import { getIntegrationToken } from "@commercelayer/js-auth";
import { database } from "../database/supabaseClient";

const mode = process.env.APPLICATION_MODE;

export const initConfig = async (slackId: string) => {
  const { data, error } = await database
    .from("users")
    .select("cl_app_credentials")
    .eq("slack_id", slackId);
  if (error) {
    throw error;
  }
  const slackUserCredentials = data[0].cl_app_credentials;

  const BASE_ENDPOINT = `https://${
    mode === "production" ? slackUserCredentials.slug : process.env.CL_ORGANIZATION_SLUG
  }.commercelayer.io`;
  const CLIENT_ID =
    mode === "production" ? slackUserCredentials.salesClientId : process.env.CL_CLIENT_ID;
  const CLIENT_ID_CHECKOUT =
    mode === "production"
      ? slackUserCredentials.integrationClientId
      : process.env.CL_CLIENT_ID_CHECKOUT;
  const CLIENT_SECRET =
    mode === "production" ? slackUserCredentials.salesClientSecret : process.env.CL_CLIENT_SECRET;
  const organizationSlug =
    mode === "production" ? slackUserCredentials.slug : process.env.CL_ORGANIZATION_SLUG;
  const organizationMode =
    mode === "production" ? slackUserCredentials.mode : process.env.CL_ORGANIZATION_MODE;

  const { accessToken: token } = await getIntegrationToken({
    endpoint: BASE_ENDPOINT,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET
  });

  const cl = CommerceLayer({
    organization: organizationSlug,
    accessToken: token
  });

  return {
    cl,
    BASE_ENDPOINT,
    CLIENT_ID,
    CLIENT_ID_CHECKOUT,
    CLIENT_SECRET,
    organizationSlug,
    organizationMode
  };
};
