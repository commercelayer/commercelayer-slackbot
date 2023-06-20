import * as dotenv from "dotenv";
dotenv.config();

import CommerceLayer from "@commercelayer/sdk";
import { database } from "../database/supabaseClient";
import { getSlug } from "./parseText";

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
  const BASE_ENDPOINT =
    mode === "production" ? clUserCredentials.endpoint : process.env.CL_ENDPOINT;
  const organizationSlug = getSlug(BASE_ENDPOINT);
  const clAccessToken =
    mode === "production" ? clUserCredentials.accessToken.token : process.env.CL_ACCESS_TOKEN;
  const CLIENT_ID = isProd ? clUserCredentials.clientId : process.env.CL_CLIENT_ID;
  const CLIENT_ID_CHECKOUT = isProd
    ? clUserCredentials.checkoutClientId
    : process.env.CL_CLIENT_ID_CHECKOUT;

  const cl = CommerceLayer({
    organization: organizationSlug,
    accessToken: clAccessToken
  });

  return {
    cl,
    ACCESS_TOKEN: clAccessToken,
    organizationMode,
    organizationSlug,
    BASE_ENDPOINT,
    CLIENT_ID,
    CLIENT_ID_CHECKOUT
  };
};
