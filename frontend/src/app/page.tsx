import { redirect } from "next/navigation";

// Home: send to the dashboard; the authenticated layout bounces guests to /login.
export default function Home() {
  redirect("/dashboard");
}
