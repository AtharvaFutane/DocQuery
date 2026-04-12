import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart3, FileText, Calendar, Activity, Percent, Users } from 'lucide-react';

interface MetricCardProps {
    label: string;
    value: string;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon?: string;
}

const iconMap: Record<string, React.ReactNode> = {
    'dollar': <DollarSign className="w-4 h-4" />,
    'chart': <BarChart3 className="w-4 h-4" />,
    'activity': <Activity className="w-4 h-4" />,
    'trending-up': <TrendingUp className="w-4 h-4" />,
    'trending-down': <TrendingDown className="w-4 h-4" />,
    'file-text': <FileText className="w-4 h-4" />,
    'calendar': <Calendar className="w-4 h-4" />,
    'percent': <Percent className="w-4 h-4" />,
    'users': <Users className="w-4 h-4" />,
};

export function MetricCard({ label, value, change, changeType, icon }: MetricCardProps) {
    const IconComponent = icon ? iconMap[icon] : <BarChart3 className="w-4 h-4" />;

    const changeColorClass =
        changeType === 'positive' ? 'text-emerald-500' :
            changeType === 'negative' ? 'text-rose-500' :
                'text-gray-400';

    const ChangeIcon = changeType === 'positive' ? TrendingUp :
        changeType === 'negative' ? TrendingDown : Minus;

    return (
        <div className="glass-card p-6 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-sm font-medium text-secondary">{label}</p>
                <div className="p-2 rounded-lg border border-subtle opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: 'var(--accent-glow)', color: 'var(--accent-primary)' }}>
                    {IconComponent}
                </div>
            </div>

            <div className="relative z-10">
                <p className="text-3xl font-bold tracking-tight text-primary mb-2">{value}</p>

                {change && (
                    <div className={`flex items-center gap-1.5 text-xs font-medium font-mono ${changeColorClass}`}>
                        <ChangeIcon className="w-3 h-3" />
                        <span>{change}</span>
                    </div>
                )}
            </div>

            {/* Accent glow on hover */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 opacity-0 group-hover:opacity-30 rounded-full blur-2xl transition-all duration-500" style={{ background: 'var(--accent-primary)' }} />
        </div>
    );
}
