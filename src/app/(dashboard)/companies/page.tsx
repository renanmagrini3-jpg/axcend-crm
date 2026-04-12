"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Building2,
  Download,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Button, Badge, Modal, Input, useToast } from "@/components/ui";
import { DataTable, type Column } from "@/components/data";

// --- Types ---

interface CompanyRow {
  id: string;
  name: string;
  cnpj: string | null;
  segment: string | null;
  size: string | null;
  website: string | null;
  organization_id: string;
  contact_count: number;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type CompanySize = "Pequena" | "Média" | "Grande";

const sizeVariant: Record<string, "default" | "info" | "success"> = {
  Pequena: "default",
  Média: "info",
  Grande: "success",
};

const SIZES: CompanySize[] = ["Pequena", "Média", "Grande"];

const SEGMENTS = [
  "Tecnologia",
  "SaaS",
  "Indústria",
  "Marketing",
  "Logística",
  "Financeiro",
  "Saúde",
  "Educação",
  "Varejo",
  "Outro",
];

// --- Page ---

export default function CompaniesPage() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSegment, setFilterSegment] = useState("");
  const [filterSize, setFilterSize] = useState("");
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

  // Form fields
  const [formName, setFormName] = useState("");
  const [formCnpj, setFormCnpj] = useState("");
  const [formSegment, setFormSegment] = useState("");
  const [formSize, setFormSize] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  async function handleExportAll() {
    try {
      const res = await fetch(`/api/companies?limit=5000`);
      const json = await res.json();
      if (!res.ok || !json.data?.length) {
        toast("Nenhuma empresa para exportar", "warning");
        return;
      }
      const headers = ["Nome", "CNPJ", "Segmento", "Tamanho", "Website", "Contatos", "Criado em"];
      const rows = (json.data as CompanyRow[]).map((c) => [
        c.name, c.cnpj || "", c.segment || "", c.size || "",
        c.website || "", String(c.contact_count), new Date(c.created_at).toLocaleDateString("pt-BR"),
      ]);
      const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(";")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `empresas-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`${json.data.length} empresas exportadas!`, "success");
    } catch {
      toast("Erro ao exportar", "error");
    }
  }

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      search,
    });
    if (filterSegment) params.set("segment", filterSegment);
    if (filterSize) params.set("size", filterSize);

    try {
      const res = await fetch(`/api/companies?${params}`);
      const json = await res.json();

      if (!res.ok) {
        toast(json.error || "Erro ao carregar empresas", "error");
        return;
      }

      setCompanies(json.data);
      setPagination(json.pagination);
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, filterSegment, filterSize, toast]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

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
    setFormCnpj("");
    setFormSegment("");
    setFormSize("");
    setFormWebsite("");
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
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          cnpj: formCnpj || undefined,
          segment: formSegment || undefined,
          size: formSize || undefined,
          website: formWebsite || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao criar empresa", "error");
        return;
      }

      toast("Empresa criada com sucesso!", "success");
      setShowCreateModal(false);
      resetForm();
      fetchCompanies();
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
      const res = await fetch(`/api/companies/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          cnpj: formCnpj || null,
          segment: formSegment || null,
          size: formSize || null,
          website: formWebsite || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao atualizar empresa", "error");
        return;
      }

      toast("Empresa atualizada!", "success");
      setShowEditModal(false);
      resetForm();
      fetchCompanies();
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
      const res = await fetch(`/api/companies/${selectedId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        toast(json.error || "Erro ao deletar empresa", "error");
        return;
      }

      toast("Empresa removida", "success");
      setShowDeleteConfirm(false);
      setSelectedId(null);
      fetchCompanies();
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(company: CompanyRow) {
    setEditId(company.id);
    setFormName(company.name);
    setFormCnpj(company.cnpj || "");
    setFormSegment(company.segment || "");
    setFormSize(company.size || "");
    setFormWebsite(company.website || "");
    setShowEditModal(true);
  }

  // --- Columns ---
  const columns: Column<CompanyRow>[] = [
    { key: "name" as keyof CompanyRow, label: "Nome" },
    {
      key: "cnpj" as keyof CompanyRow,
      label: "CNPJ",
      sortable: false,
      render: (row) => row.cnpj || "—",
    },
    {
      key: "segment" as keyof CompanyRow,
      label: "Segmento",
      render: (row) => row.segment || "—",
    },
    {
      key: "size" as keyof CompanyRow,
      label: "Tamanho",
      render: (row) =>
        row.size ? (
          <Badge variant={sizeVariant[row.size] || "default"} size="sm">
            {row.size}
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      key: "website" as keyof CompanyRow,
      label: "Website",
      sortable: false,
      render: (row) =>
        row.website ? (
          <a
            href={row.website.startsWith("http") ? row.website : `https://${row.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500 hover:text-orange-400 transition-colors truncate max-w-[120px] inline-block"
            onClick={(e) => e.stopPropagation()}
          >
            {row.website.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          "—"
        ),
    },
    {
      key: "contact_count" as keyof CompanyRow,
      label: "Contatos",
      render: (row) => (
        <span className="font-mono text-[var(--text-secondary)]">
          {row.contact_count}
        </span>
      ),
    },
    {
      key: "created_at" as keyof CompanyRow,
      label: "Criado em",
      render: (row) =>
        new Date(row.created_at).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    {
      key: "id" as keyof CompanyRow,
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

  // --- Company form ---
  function renderCompanyForm(onSubmit: (e: React.FormEvent) => void) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Nome *"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
        />
        <Input
          label="CNPJ"
          value={formCnpj}
          onChange={(e) => setFormCnpj(e.target.value)}
        />
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            Segmento
          </label>
          <select
            value={formSegment}
            onChange={(e) => setFormSegment(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none transition-colors"
          >
            <option value="">Selecione...</option>
            {SEGMENTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            Tamanho
          </label>
          <select
            value={formSize}
            onChange={(e) => setFormSize(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none transition-colors"
          >
            <option value="">Selecione...</option>
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Website"
          value={formWebsite}
          onChange={(e) => setFormWebsite(e.target.value)}
        />
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
    <PageContainer
      title="Empresas"
      description="Gerencie suas empresas clientes"
    >
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)] focus:outline-none transition-colors"
          />
        </div>

        <select
          value={filterSegment}
          onChange={(e) => {
            setFilterSegment(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
        >
          <option value="">Todos segmentos</option>
          {SEGMENTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={filterSize}
          onChange={(e) => {
            setFilterSize(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
        >
          <option value="">Todos tamanhos</option>
          {SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="flex-1" />

        <Button
          variant="secondary"
          size="sm"
          icon={<Download size={14} />}
          onClick={handleExportAll}
        >
          Exportar Todos
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
          Nova Empresa
        </Button>
      </div>

      {/* Table or empty state */}
      {!loading && companies.length === 0 && !search ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-[var(--bg-elevated)] p-4">
            <Building2 size={32} className="text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Nenhuma empresa ainda
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Cadastre sua primeira empresa!
          </p>
          <Button
            className="mt-4"
            icon={<Plus size={16} />}
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            Nova Empresa
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={companies}
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
            {pagination.total} empresa(s) — Página {pagination.page} de{" "}
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
        title="Nova Empresa"
      >
        {renderCompanyForm(handleCreate)}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Editar Empresa"
      >
        {renderCompanyForm(handleEdit)}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirmar exclusão"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Tem certeza que deseja excluir esta empresa? Os contatos vinculados
          perderão a associação.
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
