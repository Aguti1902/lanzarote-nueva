import { BlogEditor } from "@/components/admin/BlogEditor";

export default function NuevaBlogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Nueva entrada</h1>
        <p className="mt-1 text-sm text-ink-muted">Se publicará en /blog</p>
      </div>
      <BlogEditor />
    </div>
  );
}
