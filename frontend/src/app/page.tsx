import { redirect } from "next/navigation";

// Landing route; real home becomes the dashboard once auth lands.
export default function Home() {
  redirect("/design-system");
}
