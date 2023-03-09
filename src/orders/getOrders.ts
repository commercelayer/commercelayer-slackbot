import CommerceLayerPkg from "@commercelayer/sdk";
import getToken from "../utils/getToken.js";

const token = await getToken();

const CommerceLayer = CommerceLayerPkg.default;
const cl = CommerceLayer({
  organization: process.env.CL_ORGANIZATION_SLUG,
  accessToken: token
});

const getOrderById = async (id: string) => {
  return await cl.orders.retrieve(id, {
    include: ["customer", "market", "shipments", "shipping_address", "billing_address", "payment_method"]
  });
};

const getLastOrder = async (status: string) => {
  const orders = await cl.orders.list({
    include: ["customer", "market", "shipments", "shipping_address", "billing_address", "payment_method"],
    filters: { status_eq: `${status}` },
    sort: status === "placed" ? { placed_at: "desc" } : { approved_at: "desc" }
  });

  return orders.first();
};

// fetch current total orders (count and revenue) for the current day

// fetch current total orders (count and revenue) for the week

// fetch current total orders (count and revenue) for the month

// fetch current total orders (count and revenue) for the year

// fetch current total orders (count and revenue) all time

export { getOrderById, getLastOrder };
