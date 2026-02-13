export function EventCardSkeleton() {
    return (
        <div className="glass-card rounded-2xl p-6 border-2 border-border/50">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                        <div className="h-6 w-3/4 bg-muted/50 rounded animate-shimmer" />
                        <div className="h-4 w-1/2 bg-muted/30 rounded animate-shimmer" />
                    </div>
                    <div className="h-10 w-10 bg-muted/50 rounded-full animate-pulse" />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="space-y-2">
                        <div className="h-3 w-full bg-muted/30 rounded" />
                        <div className="h-5 w-16 bg-muted/50 rounded" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-full bg-muted/30 rounded" />
                        <div className="h-5 w-16 bg-muted/50 rounded" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-full bg-muted/30 rounded" />
                        <div className="h-5 w-16 bg-muted/50 rounded" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function BadgeCardSkeleton() {
    return (
        <div className="glass-card rounded-xl p-6 border-2 border-border/50 card-hover-3d">
            <div className="space-y-4">
                <div className="h-32 w-full bg-gradient-to-br from-muted/50 to-muted/20 rounded-lg animate-pulse" />
                <div className="space-y-2">
                    <div className="h-5 w-3/4 bg-muted/50 rounded animate-shimmer" />
                    <div className="h-4 w-full bg-muted/30 rounded" />
                    <div className="h-4 w-5/6 bg-muted/30 rounded" />
                </div>
                <div className="flex gap-2 pt-2">
                    <div className="h-8 flex-1 bg-muted/40 rounded" />
                    <div className="h-8 flex-1 bg-muted/40 rounded" />
                </div>
            </div>
        </div>
    )
}

export function DashboardStatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card rounded-xl p-6 border-2 border-border/50">
                    <div className="space-y-3">
                        <div className="h-4 w-32 bg-muted/40 rounded" />
                        <div className="h-10 w-20 bg-muted/60 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    )
}
