// This route has been removed as automatic script injection is no longer supported
import { redirect } from "@remix-run/node";

export function loader() {
  return redirect("/app/app-blocks");
}
