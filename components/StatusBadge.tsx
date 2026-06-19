const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  discovered: { label: "Discovered", bg: "bg-gray-500/10", text: "text-gray-400" },
  titled: { label: "Titled", bg: "bg-gray-500/10", text: "text-gray-400" },
  drafted: { label: "Drafted", bg: "bg-blue-500/10", text: "text-blue-400" },
  seo_tagged: { label: "SEO tagged", bg: "bg-blue-500/10", text: "text-blue-400" },
  linked: { label: "Linked", bg: "bg-blue-500/10", text: "text-blue-400" },
  imaged: { label: "Imaged", bg: "bg-blue-500/10", text: "text-blue-400" },
  pending_review: {
    label: "Pending review",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
  },
  approved: { label: "Approved", bg: "bg-green-500/10", text: "text-green-400" },
  published: { label: "Published", bg: "bg-emerald-500/10", text: "text-emerald-400" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.discovered;
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-md ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
