import { CommerceLayerClient } from "@commercelayer/sdk";

export interface ConfigOptions {
  cl: CommerceLayerClient;
  BASE_ENDPOINT: string;
  CLIENT_ID: string;
  CLIENT_ID_CHECKOUT: string;
  CLIENT_SECRET: string;
  organizationSlug: string;
  organizationMode: string;
}
