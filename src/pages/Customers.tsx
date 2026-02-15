import { useState } from 'react';
import { Search, Plus, Edit, Trash2, User, Phone, Mail, MapPin, BookOpen, MessageCircle } from 'lucide-react';
import { useCustomers } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import PageTransition from '@/components/animations/PageTransition';
import ScrollReveal from '@/components/animations/ScrollReveal';
import StaggerContainer, { StaggerItem } from '@/components/animations/StaggerContainer';

const Customers = () => {
  const { data: customersList = [], isLoading } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = customersList.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.phone && c.phone.includes(searchQuery))
  );

  const totalBalance = customersList.reduce((sum, c) => sum + Number(c.total_debt), 0);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-sm text-muted-foreground">Loading customers...</p></div>;
  }

  return (
    <PageTransition>
      <div className="p-6 space-y-6">
        <ScrollReveal type="fade-down">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-heading text-foreground">
                <span className="text-primary text-glow">Customers</span>
              </h1>
              <p className="text-sm text-muted-foreground">{customersList.length} customers · Outstanding: OMR {totalBalance.toFixed(3)}</p>
            </div>
            <button onClick={() => toast.info('Add customer form coming soon')} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-cyan text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity glow-cyan">
              <Plus className="w-4 h-4" /> Add Customer
            </button>
          </div>
        </ScrollReveal>

        <ScrollReveal type="fade-up" delay={0.1}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search by name or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg glass border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" staggerDelay={0.06}>
          {filtered.map(customer => {
            const debt = Number(customer.total_debt);
            const debtLevel = debt > 50 ? 'red' : debt > 5 ? 'yellow' : 'green';
            
            return (
              <StaggerItem key={customer.id}>
                <div className="glass-card rounded-xl p-5 hover:glow-cyan transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-cyan flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{customer.name}</h3>
                        <p className="text-xs text-muted-foreground">Since {new Date(customer.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors text-muted-foreground"><Edit className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {customer.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{customer.phone}</div>}
                    {customer.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{customer.email}</div>}
                    {customer.address && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{customer.address}</div>}
                  </div>
                  
                  {debt > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground flex items-center gap-1"><BookOpen className="w-3 h-3" /> Khat Balance</span>
                        <span className={cn(
                          'font-bold',
                          debtLevel === 'red' ? 'text-destructive' : debtLevel === 'yellow' ? 'text-warning' : 'text-success'
                        )}>
                          OMR {debt.toFixed(3)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn(
                          'h-full rounded-full transition-all',
                          debtLevel === 'red' ? 'debt-gauge-red' : debtLevel === 'yellow' ? 'debt-gauge-yellow' : 'debt-gauge-green'
                        )} style={{ width: `${Math.min((debt / 300) * 100, 100)}%` }} />
                      </div>
                      {customer.phone && (
                        <a
                          href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${customer.name}, this is a friendly reminder from BHAEES. Your outstanding balance is OMR ${debt.toFixed(3)}. Please settle at your earliest convenience. Thank you!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-success/15 text-success text-xs font-medium hover:bg-success/25 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Send WhatsApp Reminder
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Purchases</p>
                      <p className="text-sm font-semibold text-foreground">OMR {Number(customer.total_spent).toFixed(3)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Debt</p>
                      <p className={`text-sm font-semibold ${debt > 0 ? 'text-destructive' : 'text-success'}`}>
                        OMR {debt.toFixed(3)}
                      </p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">No customers found</div>
        )}
      </div>
    </PageTransition>
  );
};

export default Customers;
