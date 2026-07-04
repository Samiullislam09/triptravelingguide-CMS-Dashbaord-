import { redirect } from "next/navigation";

// The old analytics view is superseded by the SEMrush-style SEO page, which
// is powered by real Google Search Console data.
export default function Page() {
  redirect("/dashboard/seo");
}
