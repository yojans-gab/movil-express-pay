// Simple encryption for cart data in localStorage
// Not cryptographically secure, but better than plain text

const CART_KEY = 'movil_express_cart';
const ENCRYPTION_KEY = 'cart_security_key_2024';

// Simple XOR encryption (better than plain text)
function simpleEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result); // Base64 encode
}

function simpleDecrypt(encryptedText: string, key: string): string {
  try {
    const decoded = atob(encryptedText); // Base64 decode
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  } catch {
    return '';
  }
}

export function saveCartToStorage(cartItems: any[]): void {
  try {
    const cartData = JSON.stringify({
      items: cartItems,
      timestamp: Date.now(),
      checksum: btoa(JSON.stringify(cartItems)).slice(0, 8) // Simple integrity check
    });
    
    const encrypted = simpleEncrypt(cartData, ENCRYPTION_KEY);
    localStorage.setItem(CART_KEY, encrypted);
  } catch (error) {
    console.error('Error saving cart:', error);
  }
}

export function loadCartFromStorage(): any[] {
  try {
    const encrypted = localStorage.getItem(CART_KEY);
    if (!encrypted) return [];
    
    const decrypted = simpleDecrypt(encrypted, ENCRYPTION_KEY);
    if (!decrypted) return [];
    
    const cartData = JSON.parse(decrypted);
    
    // Verify data integrity
    const expectedChecksum = btoa(JSON.stringify(cartData.items)).slice(0, 8);
    if (cartData.checksum !== expectedChecksum) {
      console.warn('Cart data integrity check failed');
      return [];
    }
    
    // Check if data is not too old (7 days)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (Date.now() - cartData.timestamp > maxAge) {
      localStorage.removeItem(CART_KEY);
      return [];
    }
    
    return cartData.items || [];
  } catch (error) {
    console.error('Error loading cart:', error);
    localStorage.removeItem(CART_KEY); // Clear corrupted data
    return [];
  }
}

export function clearCartFromStorage(): void {
  localStorage.removeItem(CART_KEY);
}