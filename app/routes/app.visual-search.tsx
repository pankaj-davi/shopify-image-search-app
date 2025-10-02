import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";

// Redirect to app blocks page since automatic setup is no longer available
export async function loader({ request: _request }: LoaderFunctionArgs) {
  return redirect("/app/app-blocks");
}

export async function action({ request: _request }: ActionFunctionArgs) {
  return redirect("/app/app-blocks");
}
