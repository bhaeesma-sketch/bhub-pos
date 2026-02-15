import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
}

const StatCard = ({ title, value, change, changeType = 'neutral', icon: Icon, iconColor }: StatCardProps) => {
  return (
    <div className="glass-card rounded-xl p-5 glow-cyan hover:glow-cyan-strong transition-all duration-300 animate-fade-in group">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold font-heading text-foreground">{value}</p>
          {change && (
            <p className={cn(
              'text-xs font-medium',
              changeType === 'positive' && 'text-success',
              changeType === 'negative' && 'text-destructive',
              changeType === 'neutral' && 'text-muted-foreground',
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
          iconColor || 'bg-primary/10'
        )}>
          <Icon className={cn('w-5 h-5', iconColor ? 'text-primary-foreground' : 'text-primary')} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
