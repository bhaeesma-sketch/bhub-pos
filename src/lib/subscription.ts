import { Tables } from "@/integrations/supabase/types";

export const MASTER_STORE_NAME = "JABALSHAMS GROCERY";

export interface SubscriptionInfo {
    status: 'trial' | 'active' | 'blocked';
    expiresAt: string | null;
    daysRemaining: number;
    isExpired: boolean;
    isJabalShamsMaster: boolean;
    isBlocked: boolean;
}

/**
 * Global logic to check if the current store is the JabalShams Master Account.
 * This is utilized for super-admin privileges and multi-tenant management.
 */
export function isJabalShamsMaster(storeName?: string | null): boolean {
    if (!storeName) {
        return localStorage.getItem('bhub_store_name') === MASTER_STORE_NAME;
    }
    return storeName === MASTER_STORE_NAME;
}

/**
 * Calculates subscription metrics for a given store configuration.
 * Regular stores are subject to a 14-day trial period or manual activation.
 */
export function getSubscriptionInfo(config: Tables<'store_config'> | any): SubscriptionInfo {
    const storeName = config?.store_name || localStorage.getItem('bhub_store_name');
    const isMaster = isJabalShamsMaster(storeName);

    // Master Store is always Active and perpetual
    if (isMaster) {
        return {
            status: 'active',
            expiresAt: null,
            daysRemaining: 9999,
            isExpired: false,
            isJabalShamsMaster: true,
            isBlocked: false
        };
    }

    const status = (config?.subscription_status || 'trial') as 'trial' | 'active' | 'blocked';
    const expiresAt = config?.expires_at;
    const now = new Date();
    const expiryDate = expiresAt ? new Date(expiresAt) : null;

    let daysRemaining = 0;
    if (expiryDate) {
        const diffTime = expiryDate.getTime() - now.getTime();
        daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const isExpired = status === 'trial' && daysRemaining <= 0;
    const isBlocked = status === 'blocked';

    return {
        status,
        expiresAt,
        daysRemaining,
        isExpired,
        isJabalShamsMaster: false,
        isBlocked
    };
}
