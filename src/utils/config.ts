import * as dotenv from "dotenv";
dotenv.config();

import CommerceLayer from "@commercelayer/sdk";
import { authentication } from "@commercelayer/js-auth";
import { database } from "../database/supabaseClient";

const mode = process.env.APPLICATION_MODE;
const isProd = mode === "production";

export const initConfig = async (slackId: string) => {
  const { data, error } = await database
    .from("users")
    .select("cl_app_credentials")
    .eq("slack_id", slackId);
  if (error) {
    throw error;
  }
  const clUserCredentials = data[0].cl_app_credentials;
  console.log("clUserCredentials", clUserCredentials);

  // Variables for all required credentials.
  const organizationMode = isProd ? clUserCredentials.mode : process.env.CL_ORGANIZATION_MODE;
  const BASE_ENDPOINT = isProd ? clUserCredentials.endpoint : process.env.CL_BASE_ENDPOINT;
  const organizationSlug = BASE_ENDPOINT.split("https://")[1].split(".")[0];
  const CLIENT_ID = isProd ? clUserCredentials.clientId : process.env.CL_CLIENT_ID;
  const CLIENT_ID_CHECKOUT = isProd
    ? clUserCredentials.integrationClientId
    : process.env.CL_CLIENT_ID_CHECKOUT;
  const CLIENT_SECRET = isProd ? clUserCredentials.clientSecret : process.env.CL_CLIENT_SECRET;
  const REDIRECT_URI = process.env.CL_REDIRECT_URI;

  let ACCESS_TOKEN = clUserCredentials.accessToken;
  let REFRESH_TOKEN = clUserCredentials.refreshToken;
  let EXPIRES = clUserCredentials.expires;

  if (new Date(EXPIRES) < new Date()) {
    console.log("Refreshing token...");
    await authentication("refresh_token", {
      slug: organizationSlug,
      refreshToken: REFRESH_TOKEN,
      clientId: CLIENT_ID
    })
      .then(async (token) => {
        console.log("token", token);
        ACCESS_TOKEN = token.accessToken;
        REFRESH_TOKEN = token.refreshToken;
        EXPIRES = token.expires;
        await database
          .from("users")
          .update({
            cl_app_credentials: {
              mode: organizationMode,
              endpoint: BASE_ENDPOINT,
              clientId: CLIENT_ID,
              accessToken: ACCESS_TOKEN,
              refreshToken: REFRESH_TOKEN,
              expires: EXPIRES
            }
          })
          .eq("slack_id", slackId);
      })
      .catch((error) => {
        console.error("error", error);
      });
  }

  const cl = CommerceLayer({
    organization: organizationSlug,
    accessToken: ACCESS_TOKEN
  });

  return {
    cl,
    organizationMode,
    BASE_ENDPOINT,
    organizationSlug,
    CLIENT_ID,
    REDIRECT_URI,
    CLIENT_ID_CHECKOUT,
    CLIENT_SECRET,
    ACCESS_TOKEN
  };
};
