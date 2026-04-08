"use client";

import { useState, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { cn } from "@/lib/cn";
import { Modal, Input } from "@/components/ui";
import { DealCard, type DealCardData } from "./DealCard";
import { DealDetailPanel } from "./DealDetailPanel";

export interface StageData {
  id: string;
  name: string;
  order: number;
}

export interface PipelineBoardProps {
  stages: StageData[];
  initialDeals: Record<string, DealCardData[]>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function PipelineBoard({ stages, initialDeals }: PipelineBoardProps) {
  const [dealsByStage, setDealsByStage] =
    useState<Record<string, DealCardData[]>>(initialDeals);
  const [selectedDeal, setSelectedDeal] = useState<DealCardData | null>(null);
  const [selectedStageName, setSelectedStageName] = useState<string>("");

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

      moveDeal(
        source.droppableId,
        source.index,
        destination.droppableId,
        destination.index,
      );
    },
    [isLostStage, moveDeal],
  );

  const confirmLoss = useCallback(() => {
    if (!pendingDrop) return;
    moveDeal(
      pendingDrop.sourceId,
      pendingDrop.sourceIndex,
      pendingDrop.destId,
      pendingDrop.destIndex,
    );
    setLossModalOpen(false);
    setLossReason("");
    setPendingDrop(null);
  }, [pendingDrop, moveDeal]);

  const cancelLoss = useCallback(() => {
    setLossModalOpen(false);
    setLossReason("");
    setPendingDrop(null);
  }, []);

  const handleDealClick = useCallback(
    (deal: DealCardData, stageName: string) => {
      setSelectedDeal(deal);
      setSelectedStageName(stageName);
    },
    [],
  );

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
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
        onClose={() => setSelectedDeal(null)}
      />
    </>
  );
}

export { PipelineBoard };
