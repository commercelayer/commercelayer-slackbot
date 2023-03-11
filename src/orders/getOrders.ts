import CommerceLayerPkg from "@commercelayer/sdk";
import getToken from "../utils/getToken.js";
import { generateDate } from "../utils/parseDate.js";

const organizationSlug = process.env.CL_ORGANIZATION_SLUG;
const organizationMode = process.env.CL_ORGANIZATION_MODE;

const token = await getToken();
const CommerceLayer = CommerceLayerPkg.default;
const cl = CommerceLayer({
  organization: organizationSlug,
  accessToken: token
});

const getOrderById = async (id: string) => {
  const orders = await cl.orders.retrieve(id, {
    include: ["customer", "market", "shipments", "shipping_address", "billing_address", "payment_method"]
  });

  return { orders, organizationSlug, organizationMode };
};

const getLastOrder = async (status: string) => {
  const orders = (
    await cl.orders.list({
      include: ["customer", "market", "shipments", "shipping_address", "billing_address", "payment_method"],
      filters: { status_eq: `${status}` },
      sort: status === "placed" ? { placed_at: "desc" } : { approved_at: "desc" }
    })
  ).first();

  return { orders, organizationSlug, organizationMode };
};

const getTodaysOrder = async () => {
  const orders = await cl.orders.list({
    filters: {
      status_eq: "placed",
      placed_at_gteq: `${generateDate("today")}}`,
      placed_at_lt: `${generateDate("next")}}`
    }
  });
  const recordCount = orders.meta.recordCount;

  return { orders, recordCount, organizationSlug };
};

export { getOrderById, getLastOrder, getTodaysOrder };
