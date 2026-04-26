'use client'

import { useQuery } from '@tanstack/react-query'

export interface WorkSchedule {
    work_start_time: string // "09:00" format
    work_end_time: string   // "17:00" format
}

const DEFAULT_SCHEDULE: WorkSchedule = {
    work_start_time: '09:00',
    work_end_time: '17:00',
}

export function useWorkSchedule() {
    return useQuery<WorkSchedule>({
        queryKey: ['work-schedule'],
        queryFn: async () => {
            const res = await fetch('/api/org/get')
            if (!res.ok) return DEFAULT_SCHEDULE
            const org = await res.json()
            return {
                work_start_time: org.work_start_time || '09:00',
                work_end_time: org.work_end_time || '17:00',
            }
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    })
}

/** Parse "HH:MM" → { hour, minute } */
export function parseTime(t: string): { hour: number; minute: number } {
    const [h, m] = (t || '09:00').split(':').map(Number)
    return { hour: h || 0, minute: m || 0 }
}

/** Check if a clock-in timestamp is late compared to work_start_time */
export function isLateClockIn(clockIn: string | Date, startTime: string): boolean {
    const d = new Date(clockIn)
    const { hour, minute } = parseTime(startTime)
    return d.getHours() > hour || (d.getHours() === hour && d.getMinutes() > minute)
}

/** Check if a clock-out timestamp is early compared to work_end_time */
export function isEarlyClockOut(clockOut: string | Date, endTime: string): boolean {
    const d = new Date(clockOut)
    const { hour, minute } = parseTime(endTime)
    return d.getHours() < hour || (d.getHours() === hour && d.getMinutes() < minute)
}

/** Get formatted time label e.g. "09:00" */
export function formatScheduleTime(t: string): string {
    const { hour, minute } = parseTime(t)
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}
