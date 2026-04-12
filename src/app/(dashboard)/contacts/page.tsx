"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Upload,
  Download,
  Search,
  Trash2,
  Pencil,
  Users,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Button, Badge, Modal, Input, useToast } from "@/components/ui";
import { DataTable, type Column } from "@/components/data";
import { cn } from "@/lib/cn";

// --- Types ---

interface ContactRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  origin: string | null;
  company_id: string | null;
  organization_id: string;
  created_at: string;
  companies: { id: string; name: string } | null;
  deals: { id: string }[] | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type OriginLabel = "Facebook Ads" | "Google Ads" | "Indicação" | "Orgânico" | "LinkedIn";

const originVariant: Record<string, "info" | "success" | "warning" | "default"> = {
  "Facebook Ads": "info",
  "Google Ads": "warning",
  "Indicação": "success",
  "Orgânico": "default",
  "LinkedIn": "info",
};

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function unmaskPhone(value: string): string {
  return value.replace(/\D/g, "");
}

const ORIGINS: OriginLabel[] = [
  "Facebook Ads",
  "Google Ads",
  "Indicação",
  "Orgânico",
  "LinkedIn",
];

// --- Page ---

export default function ContactsPage() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formOrigin, setFormOrigin] = useState("");
  const [formCompanyId, setFormCompanyId] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  // Companies for select
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/companies?limit=100");
        const json = await res.json();
        if (res.ok) setCompanies(json.data ?? []);
      } catch { /* ignore */ }
    }
    loadCompanies();
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      search,
    });
    if (filterOrigin) params.set("origin", filterOrigin);

    try {
      const res = await fetch(`/api/contacts?${params}`);
      const json = await res.json();

      if (!res.ok) {
        toast(json.error || "Erro ao carregar contatos", "error");
        return;
      }

      setContacts(json.data);
      setPagination(json.pagination);
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, filterOrigin, toast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  function resetForm() {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormPosition("");
    setFormOrigin("");
    setFormCompanyId("");
    setEditId(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) {
      toast("Nome é obrigatório", "warning");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          email: formEmail || undefined,
          phone: formPhone || undefined,
          position: formPosition || undefined,
          origin: formOrigin || undefined,
          company_id: formCompanyId || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao criar contato", "error");
        return;
      }

      toast("Contato criado com sucesso!", "success");
      setShowCreateModal(false);
      resetForm();
      fetchContacts();
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId || !formName.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          email: formEmail || null,
          phone: formPhone || null,
          position: formPosition || null,
          origin: formOrigin || null,
          company_id: formCompanyId || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao atualizar contato", "error");
        return;
      }

      toast("Contato atualizado!", "success");
      setShowEditModal(false);
      resetForm();
      fetchContacts();
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${selectedId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        toast(json.error || "Erro ao deletar contato", "error");
        return;
      }

      toast("Contato removido", "success");
      setShowDeleteConfirm(false);
      setSelectedId(null);
      fetchContacts();
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(contact: ContactRow) {
    setEditId(contact.id);
    setFormName(contact.name);
    setFormEmail(contact.email || "");
    setFormPhone(unmaskPhone(contact.phone || ""));
    setFormPosition(contact.position || "");
    setFormOrigin(contact.origin || "");
    setFormCompanyId(contact.company_id || "");
    setShowEditModal(true);
  }

  function downloadCsv(data: ContactRow[], filename: string) {
    const headers = ["Nome", "Email", "Telefone", "Cargo", "Empresa", "Origem", "Criado em"];
    const rows = data.map((c) => [
      c.name,
      c.email || "",
      c.phone || "",
      c.position || "",
      c.companies?.name || "",
      c.origin || "",
      new Date(c.created_at).toLocaleDateString("pt-BR"),
    ]);

    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExport() {
    if (contacts.length === 0) {
      toast("Nenhum contato para exportar", "warning");
      return;
    }
    downloadCsv(contacts, `contatos-pagina-${new Date().toISOString().slice(0, 10)}.csv`);
    toast("CSV exportado!", "success");
  }

  async function handleExportAll() {
    try {
      const res = await fetch(`/api/contacts?limit=5000`);
      const json = await res.json();
      if (!res.ok || !json.data?.length) {
        toast("Nenhum contato para exportar", "warning");
        return;
      }
      downloadCsv(json.data as ContactRow[], `contatos-todos-${new Date().toISOString().slice(0, 10)}.csv`);
      toast(`${json.data.length} contatos exportados!`, "success");
    } catch {
      toast("Erro ao exportar", "error");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setSaving(true);
    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao importar CSV", "error");
        return;
      }

      toast(`${json.imported} contato(s) importado(s)!`, "success");
      fetchContacts();
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // --- Columns ---
  const columns: Column<ContactRow>[] = [
    { key: "name" as keyof ContactRow, label: "Nome" },
    {
      key: "email" as keyof ContactRow,
      label: "Email",
      render: (row) => row.email || "—",
    },
    {
      key: "phone" as keyof ContactRow,
      label: "Telefone",
      sortable: false,
      render: (row) => row.phone ? formatPhone(row.phone) : "—",
    },
    {
      key: "position" as keyof ContactRow,
      label: "Cargo",
      sortable: false,
      render: (row) => row.position || "—",
    },
    {
      key: "companies" as keyof ContactRow,
      label: "Empresa",
      render: (row) => row.companies?.name || "—",
    },
    {
      key: "deals" as keyof ContactRow,
      label: "Deals",
      sortable: false,
      render: (row) => {
        const count = row.deals?.length ?? 0;
        return (
          <span className={cn(
            "text-sm font-medium",
            count > 0 ? "text-orange-500" : "text-[var(--text-muted)]",
          )}>
            {count}
          </span>
        );
      },
    },
    {
      key: "origin" as keyof ContactRow,
      label: "Origem",
      render: (row) =>
        row.origin ? (
          <Badge
            variant={originVariant[row.origin] || "default"}
            size="sm"
          >
            {row.origin}
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      key: "created_at" as keyof ContactRow,
      label: "Criado em",
      render: (row) =>
        new Date(row.created_at).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    {
      key: "id" as keyof ContactRow,
      label: "",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
            className="rounded p-1 text-[var(--text-muted)] hover:text-orange-500 transition-colors"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(row.id);
              setShowDeleteConfirm(true);
            }}
            className="rounded p-1 text-[var(--text-muted)] hover:text-red-500 transition-colors"
            title="Excluir"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  // --- Contact form fields (shared between create/edit) ---
  function renderContactForm(onSubmit: (e: React.FormEvent) => void) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Nome *"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          value={formEmail}
          onChange={(e) => setFormEmail(e.target.value)}
        />
        <Input
          label="Telefone"
          value={maskPhone(formPhone)}
          onChange={(e) => setFormPhone(unmaskPhone(e.target.value))}
          placeholder="(11) 99999-9999"
        />
        <Input
          label="Cargo"
          value={formPosition}
          onChange={(e) => setFormPosition(e.target.value)}
        />
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            Empresa
          </label>
          <select
            value={formCompanyId}
            onChange={(e) => setFormCompanyId(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none transition-colors"
          >
            <option value="">Nenhuma</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            Origem
          </label>
          <select
            value={formOrigin}
            onChange={(e) => setFormOrigin(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none transition-colors"
          >
            <option value="">Selecione...</option>
            {ORIGINS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              resetForm();
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Salvar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <PageContainer title="Contatos" description="Gerencie sua base de contatos">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            placeholder="Buscar contato..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)] focus:outline-none transition-colors"
          />
        </div>

        <select
          value={filterOrigin}
          onChange={(e) => {
            setFilterOrigin(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
        >
          <option value="">Todas origens</option>
          {ORIGINS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>

        <div className="flex-1" />

        <Button
          variant="secondary"
          size="sm"
          icon={<Download size={14} />}
          onClick={handleExport}
        >
          Exportar
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<Download size={14} />}
          onClick={handleExportAll}
        >
          Exportar Todos
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleImport}
          className="hidden"
        />
        <Button
          variant="secondary"
          size="sm"
          icon={<Upload size={14} />}
          onClick={() => fileInputRef.current?.click()}
          loading={saving}
        >
          Importar CSV
        </Button>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
        >
          Novo Contato
        </Button>
      </div>

      {/* Table or empty state */}
      {!loading && contacts.length === 0 && !search ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-[var(--bg-elevated)] p-4">
            <Users size={32} className="text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Nenhum contato ainda
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Crie seu primeiro contato!
          </p>
          <Button
            className="mt-4"
            icon={<Plus size={16} />}
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            Novo Contato
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={contacts}
          onRowClick={(row) =>
            setSelectedId(row.id === selectedId ? null : row.id)
          }
          selectedId={selectedId}
          loading={loading}
        />
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-muted)]">
          <span>
            {pagination.total} contato(s) — Página {pagination.page} de{" "}
            {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() =>
                setPagination((p) => ({ ...p, page: p.page - 1 }))
              }
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setPagination((p) => ({ ...p, page: p.page + 1 }))
              }
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Novo Contato"
      >
        {renderContactForm(handleCreate)}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Editar Contato"
      >
        {renderContactForm(handleEdit)}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirmar exclusão"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Tem certeza que deseja excluir este contato? Esta ação não pode ser
          desfeita.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={saving}>
            Excluir
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
