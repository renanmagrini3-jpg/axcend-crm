"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { cn } from "@/lib/cn";
import { Modal, Input } from "@/components/ui";
import { DealCard, type DealCardData } from "./DealCard";
import { DealDetailPanel, type DealFromApi } from "./DealDetailPanel";

export interface StageData {
  id: string;
  name: string;
  order: number;
}

interface ContactOption {
  id: string;
  name: string;
  company_id?: string | null;
}

interface CompanyOption {
  id: string;
  name: string;
}

export interface PipelineBoardProps {
  stages: StageData[];
  initialDeals: Record<string, DealCardData[]>;
  contacts?: ContactOption[];
  companies?: CompanyOption[];
  onMoveDeal?: (dealId: string, stageId: string, lossReason?: string) => Promise<boolean>;
  onDealClick?: (deal: DealCardData) => void;
  onDealUpdated?: (updated: DealFromApi) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function PipelineBoard({
  stages,
  initialDeals,
  contacts,
  companies,
  onMoveDeal,
  onDealClick,
  onDealUpdated,
}: PipelineBoardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const [dealsByStage, setDealsByStage] =
    useState<Record<string, DealCardData[]>>(initialDeals);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedStageName, setSelectedStageName] = useState<string>("");

  // Derive selected deal from current dealsByStage so updates flow through
  const selectedDeal = useMemo<DealCardData | null>(() => {
    if (!selectedDealId) return null;
    for (const list of Object.values(dealsByStage)) {
      const found = list.find((d) => d.id === selectedDealId);
      if (found) return found;
    }
    return null;
  }, [dealsByStage, selectedDealId]);

  // Loss reason modal
  const [lossModalOpen, setLossModalOpen] = useState(false);
  const [lossReason, setLossReason] = useState("");
  const [pendingDrop, setPendingDrop] = useState<{
    dealId: string;
    sourceId: string;
    sourceIndex: number;
    destId: string;
    destIndex: number;
  } | null>(null);

  // Sync with parent when initialDeals changes
  useEffect(() => {
    setDealsByStage(initialDeals);
  }, [initialDeals]);

  const isLostStage = useCallback(
    (stageId: string) => {
      const stage = stages.find((s) => s.id === stageId);
      return stage?.name === "Fechado Perdido";
    },
    [stages],
  );

  const moveDeal = useCallback(
    (
      sourceId: string,
      sourceIndex: number,
      destId: string,
      destIndex: number,
    ) => {
      setDealsByStage((prev) => {
        const sourceCopy = [...(prev[sourceId] ?? [])];
        const destCopy =
          sourceId === destId ? sourceCopy : [...(prev[destId] ?? [])];
        const [moved] = sourceCopy.splice(sourceIndex, 1);

        if (sourceId === destId) {
          sourceCopy.splice(destIndex, 0, moved);
          return { ...prev, [sourceId]: sourceCopy };
        }

        destCopy.splice(destIndex, 0, moved);
        return { ...prev, [sourceId]: sourceCopy, [destId]: destCopy };
      });
    },
    [],
  );

  const revertDeal = useCallback(
    (
      sourceId: string,
      sourceIndex: number,
      destId: string,
      destIndex: number,
    ) => {
      // Revert: move from dest back to source
      setDealsByStage((prev) => {
        const destCopy = [...(prev[destId] ?? [])];
        const sourceCopy = [...(prev[sourceId] ?? [])];
        const [moved] = destCopy.splice(destIndex, 1);
        sourceCopy.splice(sourceIndex, 0, moved);
        return { ...prev, [sourceId]: sourceCopy, [destId]: destCopy };
      });
    },
    [],
  );

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination } = result;
      if (!destination) return;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return;

      // If dropping into "Fechado Perdido", ask for reason
      if (
        isLostStage(destination.droppableId) &&
        !isLostStage(source.droppableId)
      ) {
        setPendingDrop({
          dealId: result.draggableId,
          sourceId: source.droppableId,
          sourceIndex: source.index,
          destId: destination.droppableId,
          destIndex: destination.index,
        });
        setLossModalOpen(true);
        return;
      }

      // Optimistic move
      moveDeal(
        source.droppableId,
        source.index,
        destination.droppableId,
        destination.index,
      );

      // API call if stage changed
      if (source.droppableId !== destination.droppableId && onMoveDeal) {
        onMoveDeal(result.draggableId, destination.droppableId).then(
          (success) => {
            if (!success) {
              revertDeal(
                source.droppableId,
                source.index,
                destination.droppableId,
                destination.index,
              );
            }
          },
        );
      }
    },
    [isLostStage, moveDeal, revertDeal, onMoveDeal],
  );

  const confirmLoss = useCallback(async () => {
    if (!pendingDrop) return;
    moveDeal(
      pendingDrop.sourceId,
      pendingDrop.sourceIndex,
      pendingDrop.destId,
      pendingDrop.destIndex,
    );

    if (onMoveDeal) {
      const success = await onMoveDeal(
        pendingDrop.dealId,
        pendingDrop.destId,
        lossReason.trim(),
      );
      if (!success) {
        revertDeal(
          pendingDrop.sourceId,
          pendingDrop.sourceIndex,
          pendingDrop.destId,
          pendingDrop.destIndex,
        );
      }
    }

    setLossModalOpen(false);
    setLossReason("");
    setPendingDrop(null);
  }, [pendingDrop, moveDeal, revertDeal, onMoveDeal, lossReason]);

  const cancelLoss = useCallback(() => {
    setLossModalOpen(false);
    setLossReason("");
    setPendingDrop(null);
  }, []);

  const handleDealClick = useCallback(
    (deal: DealCardData, stageName: string) => {
      setSelectedDealId(deal.id);
      setSelectedStageName(stageName);
      onDealClick?.(deal);
    },
    [onDealClick],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 0);
    setShowRightFade(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateFades();
    el.addEventListener("scroll", updateFades);
    window.addEventListener("resize", updateFades);
    return () => {
      el.removeEventListener("scroll", updateFades);
      window.removeEventListener("resize", updateFades);
    };
  }, [updateFades]);

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="relative">
          {showLeftFade && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-[var(--bg-primary)] to-transparent" />
          )}
          {showRightFade && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-[var(--bg-primary)] to-transparent" />
          )}
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto scroll-smooth pb-4">
          {stages.map((stage) => {
            const deals = dealsByStage[stage.id] ?? [];
            const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

            return (
              <div
                key={stage.id}
                className="flex w-72 shrink-0 flex-col rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)]"
              >
                {/* Column header */}
                <div className="border-b border-[var(--border-default)] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {stage.name}
                    </h3>
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--bg-surface)] px-1.5 text-xs font-medium text-[var(--text-secondary)]">
                      {deals.length}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {formatCurrency(totalValue)}
                  </p>
                </div>

                {/* Droppable area */}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 space-y-2 p-2 min-h-[120px] transition-colors rounded-b-xl",
                        snapshot.isDraggingOver && "bg-orange-500/5",
                      )}
                    >
                      {deals.map((deal, index) => (
                        <Draggable
                          key={deal.id}
                          draggableId={deal.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={provided.draggableProps.style}
                              className={cn(
                                snapshot.isDragging && "opacity-90",
                              )}
                            >
                              <DealCard
                                deal={deal}
                                onClick={() =>
                                  handleDealClick(deal, stage.name)
                                }
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
          </div>
        </div>
      </DragDropContext>

      {/* Loss reason modal */}
      <Modal
        open={lossModalOpen}
        onClose={cancelLoss}
        title="Motivo da Perda"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Por que o deal foi perdido?"
            value={lossReason}
            onChange={(e) => setLossReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={cancelLoss}
              className="rounded-lg px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmLoss}
              disabled={!lossReason.trim()}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              Confirmar Perda
            </button>
          </div>
        </div>
      </Modal>

      {/* Deal detail panel */}
      <DealDetailPanel
        deal={selectedDeal}
        stageName={selectedStageName}
        stages={stages}
        contacts={contacts}
        companies={companies}
        onClose={() => setSelectedDealId(null)}
        onMoveDeal={onMoveDeal}
        onDealUpdated={onDealUpdated}
      />
    </>
  );
}

export { PipelineBoard };
