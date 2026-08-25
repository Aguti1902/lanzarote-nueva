import { GroupsPanel } from "@/app/admin/cruceros/hub-client";

export default function AdminGruposCrucerosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Grupos cruceros</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Gestión de grupos por escala, mínimo de pax y estado del grupo.
        </p>
      </div>
      <GroupsPanel />
    </div>
  );
}
