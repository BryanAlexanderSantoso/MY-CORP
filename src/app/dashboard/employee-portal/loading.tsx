import { Loader2 } from 'lucide-react'

export default function Loading() {
    return (
        <div className="flex h-[80vh] w-full flex-col items-center justify-center space-y-4">
            <div className="relative">
                <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse" />
                <Loader2 className="relative h-12 w-12 animate-spin text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground animate-pulse">
                Menarik data...
            </p>
        </div>
    )
}
