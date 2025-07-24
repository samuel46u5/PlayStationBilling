import { supabase } from './supabase';

/**
 * Menghapus sale_item berdasarkan product_id dan rental_session_id
 * @param {string} productId - ID produk
 * @param {string} sessionId - ID rental session
 * @returns {Promise<boolean>} - true jika berhasil
 */
export async function deleteSaleItem(productId: string, sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('rental_session_products')
    .delete()
    .eq('product_id', productId)
    .eq('session_id', sessionId);
  if (error) throw error;
  return true;
}
