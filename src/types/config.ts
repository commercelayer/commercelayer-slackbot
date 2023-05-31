import { CommerceLayerClient } from "@commercelayer/sdk";

export interface ConfigOptions {
  cl: CommerceLayerClient;
  organizationSlug: string;
  organizationMode: string;
  BASE_ENDPOINT: string;
  CLIENT_ID: string;
  CLIENT_ID_CHECKOUT: string;
  CLIENT_SECRET: string;
  REDIRECT_URI: string;
  ACCESS_TOKEN: string;
}
