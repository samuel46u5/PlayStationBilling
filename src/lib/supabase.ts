import { createClient } from '@supabase/supabase-js';
import { UserSession } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRole = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper function to get current user with proper error handling
async function getCurrentUserSafe() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // Handle the specific case where no session exists - this is normal
      if (error.message === 'Auth session missing!') {
        return null;
      }
      throw new Error(`Failed to retrieve user session: ${error.message}`);
    }
    
    if (!user) {
      return null;
    }
    
    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Authentication error: Unable to verify user session');
  }
}

// Database helper functions
export const db = {
  // Generic query functions
  async select(table: string, columns = '*', filters?: Record<string, any>) {
    let query = supabase.from(table).select(columns);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async insert(table: string, data: any) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async update(table: string, id: string, data: any) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async delete(table: string, id: string) {
    const { data: result, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  // Specific business logic functions
  customers: {
    async getAll() {
      return db.select('customers', '*', { status: 'active' });
    },

    async create(customer: any) {
      const user = await getCurrentUserSafe();
      if (!user) {
        throw new Error('No authenticated user found. Please log in to continue.');
      }
      return db.insert('customers', {
        ...customer,
        created_by: user.id
      });
    },

    async update(id: string, customer: any) {
      return db.update('customers', id, customer);
    }
  },

  consoles: {
    async getAll() {
      const { data, error } = await supabase
        .from('consoles')
        .select(`
          *,
          equipment_types(name, category),
          rate_profiles(name, hourly_rate, daily_rate)
        `)
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },

    async updateStatus(id: string, status: string) {
      return db.update('consoles', id, { status });
    }
  },

  products: {
    async getAll() {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          suppliers(name)
        `)
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },

    async create(product: any) {
      const user = await getCurrentUserSafe();
      if (!user) {
        throw new Error('Authentication error');
      }
      return db.insert('products', {
        ...product,
        created_by: user.id
      });
    },

    async updateStock(id: string, quantity: number) {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', id)
        .single();
      
      if (product) {
        return db.update('products', id, { 
          stock: product.stock - quantity 
        });
      }
    },

    async increaseStock(id: string, quantity: number) {
      const { data: product, error } = await supabase
        .from('products')
        .select('stock')
        .eq('id', id)
        .single();
      if (error) throw error;
      if (!product) throw new Error('Produk tidak ditemukan');
      return db.update('products', id, { stock: (Number(product.stock) || 0) + Number(quantity) });
    },

    async decreaseStock(id: string, quantity: number) {
      const { data: product, error } = await supabase
        .from('products')
        .select('stock')
        .eq('id', id)
        .single();
      if (error) throw error;
      if (!product) throw new Error('Produk tidak ditemukan');
      return db.update('products', id, { stock: (Number(product.stock) || 0) - Number(quantity) });
    },

    async update(id: string, product: any) {
      return db.update('products', id, product);
    }
  },

  sales: {
    async create(sale: any, items: any[]) {
      const user = await getCurrentUserSafe();
      if (!user) {
        throw new Error('No authenticated user found. Please log in to continue.');
      }
      
      // Create sale
      const saleData = await db.insert('sales', {
        ...sale,
        cashier_id: user.id,
        sale_date: new Date().toISOString()
      });

      // Create sale items
      const itemsData = await Promise.all(
        items.map(item => 
          db.insert('sale_items', {
            ...item,
            sale_id: saleData.id
          })
        )
      );

      // Update product stock
      await Promise.all(
        items.map(item => 
          db.products.updateStock(item.product_id, item.quantity)
        )
      );

      return { sale: saleData, items: itemsData };
    }
  },

  rentals: {
    async create(rental: any) {
      const user = await getCurrentUserSafe();
      if (!user) {
        throw new Error('No authenticated user found. Please log in to continue.');
      }
      
      return db.insert('rental_sessions', {
        ...rental,
        created_by: user.id,
        start_time: new Date().toISOString()
      });
    },

    async getActive() {
      return db.select('rental_sessions', `
        *,
        customers(name, phone),
        consoles(name, location)
      `, { status: 'active' });
    },

    async endSession(id: string, endData: any) {
      return db.update('rental_sessions', id, {
        ...endData,
        end_time: new Date().toISOString(),
        status: 'completed'
      });
    }
  },

  vouchers: {
    async create(voucher: any) {
      const user = await getCurrentUserSafe();
      if (!user) {
        throw new Error('No authenticated user found. Please log in to continue.');
      }
      
      // Generate voucher code
      const { data } = await supabase.rpc('generate_voucher_code');
      
      return db.insert('vouchers', {
        ...voucher,
        voucher_code: data,
        // created_by: user.id,
        // expiry_date: new Date(Date.now() + voucher.validity_days * 24 * 60 * 60 * 1000).toISOString()
      });
    },

    async use(voucherId: string, hoursUsed: number) {
      const { data: voucher } = await supabase
        .from('vouchers')
        .select('*')
        .eq('id', voucherId)
        .single();

      if (voucher && voucher.remaining_hours >= hoursUsed) {
        const newRemainingHours = voucher.remaining_hours - hoursUsed;
        const newUsedHours = voucher.used_hours + hoursUsed;
        
        // Update voucher
        await db.update('vouchers', voucherId, {
          remaining_hours: newRemainingHours,
          used_hours: newUsedHours,
          status: newRemainingHours <= 0 ? 'used-up' : 'active'
        });

        // Record usage
        const user = await getCurrentUserSafe();
        if (!user) {
          throw new Error('No authenticated user found. Please log in to continue.');
        }
        await db.insert('voucher_usages', {
          voucher_id: voucherId,
          voucher_code: voucher.voucher_code,
          hours_used: hoursUsed,
          remaining_hours_after: newRemainingHours,
          used_by: user.id
        });

        return true;
      }
      
      return false;
    }
  },

  cashierSessions: {
    async getCurrent(cashierId: string) {
      const { data, error } = await supabase
        .from('cashier_sessions')
        .select('*')
        .eq('cashier_id', cashierId)
        .eq('status', 'active')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async create(sessionData: any) {
      const user = await getCurrentUserSafe();
      if (!user) {
        throw new Error('No authenticated user found. Please log in to continue.');
      }
      
      return db.insert('cashier_sessions', {
        ...sessionData,
        cashier_id: user.id,
      });
    },

    async close(sessionId: string, closeData: any) {
      return db.update('cashier_sessions', sessionId, {
        ...closeData,
        end_time: new Date().toISOString(),
        status: 'closed'
      });
    }
  },

  suppliers: {
    async getAll() {
      return db.select('suppliers', '*');
    },
    async create(supplier: any) {
      // Hilangkan autentikasi user
      return db.insert('suppliers', supplier);
    },
    async update(id: string, supplier: any) {
      return db.update('suppliers', id, supplier);
    },
    async delete(id: string) {
      return db.delete('suppliers', id);
    }
  },

  purchases: {
    async getAll() {
      return db.select('purchase_orders', '*');
    },
    async create(purchase: any) {
      // Generate PO number (simple: PO-YYYYMMDD-<random4>)
      const today = new Date();
      const dateStr = today.toISOString().slice(0,10).replace(/-/g, '');
      const rand = Math.floor(1000 + Math.random() * 9000);
      const po_number = `PO-${dateStr}-${rand}`;
      // Insert PO
      const po = await db.insert('purchase_orders', {
        po_number,
        supplier_id: purchase.supplier_id,
        notes: purchase.notes,
        expected_date: purchase.expected_date,
        subtotal: purchase.subtotal,
        // tax: purchase.tax,
        total_amount: purchase.total_amount || purchase.total, // fallback for old code
        // status: 'pending',
        // created_by: null // tidak perlu jika tidak ada user
      });
      // Insert PO items
      if (purchase.items && Array.isArray(purchase.items)) {
        for (const item of purchase.items) {
          await db.insert('purchase_order_items', {
            po_id: po.id,
            product_id: item.productId,
            product_name: item.productName,
            quantity: item.quantity,
            unit_cost: item.unitCost,
            total: item.total
          });

          if (item.productId && item.quantity > 0) {
            await db.products.increaseStock(item.productId, item.quantity);
          }
        }
      }
      return po;
    },

    async delete(poId: string) {
      const { data: items, error: itemsErr } = await supabase
        .from('purchase_order_items')
        .select('product_id, quantity')
        .eq('po_id', poId);
      if (itemsErr) throw itemsErr;

      if (Array.isArray(items)) {
        for (const it of items) {
          if (it?.product_id && it?.quantity) {
            await db.products.decreaseStock(it.product_id, it.quantity);
          }
        }
      }

      return db.delete('purchase_orders', poId);
    }
  },

  // System settings (single row: id = 'default')
  settings: {
    async get() {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 'default')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },

    async upsert(payload: any) {
      const { data, error } = await supabase
        .from('system_settings')
        .upsert(
          {
            id: 'default',
            general: payload.general,
            printer: payload.printer,
            api: payload.api,
            whatsapp_crm: payload.whatsapp_crm,
            notifications: payload.notifications,
            security: payload.security,
            backup: payload.backup,
            system: payload.system,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },
  sessions: {
    async getActiveSessions() {
      const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq("status", "active")
      .order('created_at', { ascending: false })
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
    },
    async createSession(userId: string, sessionData: {
      ip_address?: string;
      user_agent?: string;}): Promise<UserSession | null> {
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          ip_address: sessionData.ip_address || null,
          user_agent: sessionData.user_agent || null,
          status: 'active'
        })
        .select()
        .single();
      if (error) throw error;
      return data || null;
    },

    async logoutSession(sessionId: string): Promise<boolean> {
      try {
        const { error } = await supabase
          .from('user_sessions')
          .update({
            status: 'offline',
            logout_time: new Date().toISOString(),
          })
          .eq('id', sessionId);
  
        return !error;
      } catch (error) {
        console.error('Error terminating session:', error);
        return false;
      }
    }
  },
  logs: { 
    async logActivity(logData: {
      user_id: string;
      action: string;
      module: string;
      description: string;
      ip_address?: string;
      metadata?: any;
    }): Promise<boolean> {
      try {
        const { error } = await supabase
          .from('activity_logs')
          .insert({
            user_id: logData.user_id,
            action: logData.action,
            module: logData.module,
            description: logData.description,
            ip_address: logData.ip_address || await getClientIP(),
            metadata: logData.metadata || null,
            timestamp: new Date().toISOString()
          });
  
        return !error;
      } catch (error) {
        console.error('Error logging activity:', error);
        return false;
      }
    },
    async getLogs() {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20)
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    }
  }
};

// Auth helper functions
export const auth = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    try {
      const user = await getCurrentUserSafe();
      
      if (!user) {
        return null;
      }
      
      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          *,
          roles(name, nav_items)
        `)
        .eq('id', user.id)
        .single();
      
      if (error) {
        throw new Error(`Failed to retrieve user data: ${error.message}`);
      }
      
      return userData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get current user information');
    }
  }
};

const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch {
    return "Unknown";
  }
};