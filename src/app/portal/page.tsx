import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { HOME_BY_ROLE } from "@/lib/auth";

/** /portal entry point: send signed-in users to their own dashboard, everyone else to the portal sign-in. */
export default async function PortalIndex() {
  const user = await getCurrentUser();
  redirect(user ? HOME_BY_ROLE[user.role] : "/portal/login");
}
