'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useLeads, useRealtimeSync } from '@/hooks/use-erp-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult
} from '@hello-pangea/dnd'
import { Mail, Phone, MoreVertical, Plus, TrendingUp, GripVertical } from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient()

const stages = [
    { id: 'NEW', title: 'New Leads', color: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-100 dark:border-blue-900/30' },
    { id: 'CONTACTED', title: 'Contacted', color: 'bg-indigo-500', light: 'bg-indigo-50 dark:bg-indigo-900/10', border: 'border-indigo-100 dark:border-indigo-900/30' },
    { id: 'QUALIFIED', title: 'Qualified', color: 'bg-purple-500', light: 'bg-purple-50 dark:bg-purpleigo-900/10', border: 'border-purple-100 dark:border-purple-900/30' },
    { id: 'PROPOSAL', title: 'Proposal', color: 'bg-amber-500', light: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-100 dark:border-amber-900/30' },
    { id: 'CLOSED', title: 'Closed Won', color: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-100 dark:border-emerald-900/30' },
]

type Lead = {
    id: string
    name: string
    company?: string
    status: string
    lead_score: number
    email?: string
    phone?: string
}

export default function PipelinePage() {
    const qc = useQueryClient()
    const { data: leads, isLoading } = useLeads()
    useRealtimeSync('leads', ['leads'])

    // Local state for optimistic updates during drag
    const [columns, setColumns] = useState<Record<string, Lead[]>>({})

    useEffect(() => {
        if (!leads) return
        const grouped: Record<string, Lead[]> = {}
        stages.forEach(s => { grouped[s.id] = [] })
        leads.forEach((lead: Lead) => {
            const stage = lead.status || 'NEW'
            if (!grouped[stage]) grouped[stage] = []
            grouped[stage].push(lead)
        })
        setColumns(grouped)
    }, [leads])

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result
        if (!destination) return
        if (source.droppableId === destination.droppableId && source.index === destination.index) return

        const sourceStage = source.droppableId
        const destStage = destination.droppableId

        // Optimistic update — move card immediately in UI
        setColumns(prev => {
            const newCols = { ...prev }
            const sourceList = [...(newCols[sourceStage] || [])]
            const destList = sourceStage === destStage ? sourceList : [...(newCols[destStage] || [])]

            const [moved] = sourceList.splice(source.index, 1)
            moved.status = destStage
            destList.splice(destination.index, 0, moved)

            newCols[sourceStage] = sourceStage === destStage ? destList : sourceList
            newCols[destStage] = destList
            return newCols
        })

        // Persist to DB
        const { error } = await supabase
            .from('leads')
            .update({ status: destStage })
            .eq('id', draggableId)

        if (error) {
            toast.error('Failed to update lead status.')
            qc.invalidateQueries({ queryKey: ['leads'] }) // revert on error
        } else {
            toast.success(`Lead moved to "${stages.find(s => s.id === destStage)?.title}"`)
        }
    }

    if (isLoading) {
        return (
            <div className="flex gap-4 overflow-x-auto pb-4">
                {stages.map(s => (
                    <div key={s.id} className="min-w-[300px]">
                        <Skeleton className="h-8 w-32 mb-3" />
                        <Skeleton className="h-[400px] rounded-2xl" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-5 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
                    <p className="text-muted-foreground text-sm">Drag & drop leads between stages to update status.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl h-10 border-zinc-200">
                        <TrendingUp className="mr-2 h-4 w-4" /> Analytics
                    </Button>
                    <Button className="rounded-xl h-10 px-5 shadow-md shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> New Lead
                    </Button>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-6 flex-1 -mx-6 px-6">
                    {stages.map(stage => {
                        const stageLeads = columns[stage.id] || []
                        return (
                            <div key={stage.id} className="min-w-[300px] w-[300px] flex flex-col gap-3 shrink-0">
                                {/* Column Header */}
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                                        <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{stage.title}</h2>
                                        <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 h-5">
                                            {stageLeads.length}
                                        </Badge>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-zinc-400 hover:text-zinc-700">
                                        <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                {/* Droppable Column */}
                                <Droppable droppableId={stage.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex flex-col gap-2.5 min-h-[200px] rounded-2xl p-2.5 border transition-colors duration-150 ${snapshot.isDraggingOver
                                                    ? `${stage.light} ${stage.border} border-2 border-dashed`
                                                    : 'bg-zinc-100/40 dark:bg-zinc-900/30 border-zinc-200/50 dark:border-zinc-800/50 border'
                                                }`}
                                        >
                                            {stageLeads.map((lead, index) => (
                                                <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                        >
                                                            <Card className={`rounded-xl border-none select-none transition-all duration-150 ${snapshot.isDragging
                                                                    ? 'shadow-xl rotate-1 scale-105 ring-2 ring-primary/30'
                                                                    : 'shadow-sm hover:shadow-md hover:ring-1 hover:ring-primary/20'
                                                                }`}>
                                                                <CardContent className="p-3.5 space-y-3">
                                                                    <div className="flex justify-between items-start gap-2">
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">
                                                                                Score {lead.lead_score}
                                                                            </p>
                                                                            <h3 className="font-bold text-sm leading-snug truncate">
                                                                                {lead.company || lead.name}
                                                                            </h3>
                                                                            <p className="text-[11px] text-muted-foreground truncate">{lead.name}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-1 shrink-0">
                                                                            <Avatar className="h-8 w-8 rounded-lg shadow-sm border border-zinc-100">
                                                                                <AvatarFallback className="text-[10px] font-bold bg-zinc-50 text-zinc-700">
                                                                                    {lead.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            {/* Drag Handle */}
                                                                            <div
                                                                                {...provided.dragHandleProps}
                                                                                className="cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-300 hover:text-zinc-500 transition-colors"
                                                                            >
                                                                                <GripVertical className="h-4 w-4" />
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Score bar */}
                                                                    <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full transition-all ${lead.lead_score > 80 ? 'bg-emerald-500' : lead.lead_score > 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                                                                            style={{ width: `${lead.lead_score}%` }}
                                                                        />
                                                                    </div>

                                                                    <div className="flex items-center gap-3 text-muted-foreground">
                                                                        {lead.email && (
                                                                            <a href={`mailto:${lead.email}`} className="hover:text-primary transition-colors">
                                                                                <Mail className="h-3.5 w-3.5" />
                                                                            </a>
                                                                        )}
                                                                        {lead.phone && (
                                                                            <a href={`tel:${lead.phone}`} className="hover:text-primary transition-colors">
                                                                                <Phone className="h-3.5 w-3.5" />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}

                                            {stageLeads.length === 0 && !snapshot.isDraggingOver && (
                                                <div className="flex items-center justify-center h-16 text-[11px] text-zinc-400 italic">
                                                    Drop leads here
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        )
                    })}
                </div>
            </DragDropContext>
        </div>
    )
}
