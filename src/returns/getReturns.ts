import CommerceLayerPkg from "@commercelayer/sdk";
import getToken from "../utils/getToken.js";

const token = await getToken();

const CommerceLayer = CommerceLayerPkg.default;
const cl = CommerceLayer({
  organization: process.env.CL_ORGANIZATION_SLUG,
  accessToken: token
});

const getReturnById = async (id: string) => {
  return await cl.returns.retrieve(id, {
    include: ["order", "stock_location", "customer", "origin_address", "destination_address"]
  });
};

const getLastReturn = async (status: string) => {
  const returns = await cl.returns.list({
    include: ["order", "stock_location", "customer", "origin_address", "destination_address"],
    filters: { status_eq: `${status}` },
    sort: status === "requested" ? { created_at: "desc" } : { approved_at: "desc" }
  });

  return returns.first();
};

// fetch current total returns (count) for the current day

// fetch current total returns (count) for the week

// fetch current total returns (count) for the month

// fetch current total returns (count) for the year

// fetch current total returns (count) all time

export { getReturnById, getLastReturn };
