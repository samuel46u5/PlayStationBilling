import { supabase } from './supabase';

/**
 * Menghapus sale_item berdasarkan product_id dan rental_session_id
 * @param {string} productId - ID produk
 * @param {string} sessionId - ID rental session
 * @returns {Promise<boolean>} - true jika berhasil
 */
export async function deleteSaleItem(productId: string, sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('sale_items')
    .delete()
    .eq('product_id', productId)
    .eq('sale_id', sessionId);
  if (error) throw error;
  return true;
}
