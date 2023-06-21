import { CommerceLayerClient } from "@commercelayer/sdk";

export interface ConfigOptions {
  cl: CommerceLayerClient;
  organizationMode: string;
  organizationSlug: string;
  BASE_ENDPOINT: string;
  CLIENT_ID: string;
  CLIENT_ID_CHECKOUT: string;
}
