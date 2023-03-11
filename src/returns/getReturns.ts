import CommerceLayerPkg from "@commercelayer/sdk";
import getToken from "../utils/getToken.js";
import { generateDate } from "../utils/parseDate.js";

const organizationSlug = process.env.CL_ORGANIZATION_SLUG;
const organizationMode = process.env.CL_ORGANIZATION_MODE;

const token = await getToken();
const CommerceLayer = CommerceLayerPkg.default;
const cl = CommerceLayer({
  organization: process.env.CL_ORGANIZATION_SLUG,
  accessToken: token
});

const getReturnById = async (id: string) => {
  const returns = await cl.returns.retrieve(id, {
    include: ["order", "stock_location", "customer", "origin_address", "destination_address"]
  });

  return { returns, organizationMode, organizationSlug };
};

const getLastReturn = async (status: string) => {
  const returns = (
    await cl.returns.list({
      include: ["order", "stock_location", "customer", "origin_address", "destination_address"],
      filters: { status_eq: `${status}` },
      sort: status === "requested" ? { created_at: "desc" } : { approved_at: "desc" }
    })
  ).first();

  return { returns, organizationSlug, organizationMode };
};

const getTodaysReturn = async () => {
  const returns = await cl.returns.list({
    filters: {
      status_eq: "requested",
      created_at_gteq: `${generateDate("today")}}`,
      created_at_lt: `${generateDate("next")}}`
    }
  });
  const recordCount = returns.meta.recordCount;

  return { returns, recordCount, organizationSlug };
};

export { getReturnById, getLastReturn, getTodaysReturn };
