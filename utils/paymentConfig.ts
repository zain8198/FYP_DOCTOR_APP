// Payment Configuration for FYP Demo
// Using mock payment processing (test mode)

export const PaymentConfig = {
    // Test mode - no real transactions
    testMode: true,

    // Currency
    currency: 'PKR',
    currencySymbol: 'Rs.',

    // Payment methods available
    paymentMethods: {
        card: {
            enabled: true,
            name: 'Credit/Debit Card',
            icon: 'card-outline',
            description: 'Pay securely with your card'
        },
        jazzcash: {
            enabled: true,
            name: 'JazzCash',
            icon: 'phone-portrait-outline',
            description: 'Pay with JazzCash wallet'
        },
        easypaisa: {
            enabled: true,
            name: 'Easypaisa',
            icon: 'wallet-outline',
            description: 'Pay with Easypaisa wallet'
        }
    },

    // Test card numbers (for demo)
    testCards: {
        success: '4242424242424242',
        decline: '4000000000000002',
        insufficient: '4000000000009995'
    },

    // Platform fee (if any)
    platformFee: 0, // No fee for now
    platformFeePercentage: 0,

    // Transaction settings
    transaction: {
        timeout: 30000, // 30 seconds
        retryAttempts: 3
    }
};

// Validate card number (Luhn algorithm)
export const validateCardNumber = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\s/g, '');

    if (!/^\d{13,19}$/.test(cleaned)) {
        return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i]);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
};

// Format card number with spaces
export const formatCardNumber = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
};

// Validate expiry date
export const validateExpiryDate = (expiry: string): boolean => {
    const cleaned = expiry.replace(/\s/g, '');
    const match = cleaned.match(/^(\d{2})\/(\d{2})$/);

    if (!match) return false;

    const month = parseInt(match[1]);
    const year = parseInt('20' + match[2]);

    if (month < 1 || month > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    return true;
};

// Validate CVV
export const validateCVV = (cvv: string): boolean => {
    return /^\d{3,4}$/.test(cvv);
};

// Get card type from number
export const getCardType = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\s/g, '');

    if (/^4/.test(cleaned)) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
    if (/^3[47]/.test(cleaned)) return 'American Express';
    if (/^6(?:011|5)/.test(cleaned)) return 'Discover';

    return 'Unknown';
};

// Generate transaction ID
export const generateTransactionId = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `TXN${timestamp}${random}`;
};

// Calculate total amount
export const calculateTotal = (consultationFee: number): {
    consultationFee: number;
    platformFee: number;
    total: number;
} => {
    const platformFee = Math.round(consultationFee * PaymentConfig.platformFeePercentage / 100);
    const total = consultationFee + platformFee;

    return {
        consultationFee,
        platformFee,
        total
    };
};

// Format amount
export const formatAmount = (amount: number): string => {
    return `${PaymentConfig.currencySymbol} ${amount.toLocaleString()}`;
};

// Mock payment processing (for demo)
export const processPayment = async (
    paymentMethod: 'card' | 'jazzcash' | 'easypaisa',
    amount: number,
    paymentDetails: any
): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
}> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For card payments, check if it's a test decline card
    if (paymentMethod === 'card') {
        const cardNumber = paymentDetails.cardNumber?.replace(/\s/g, '');

        if (cardNumber === PaymentConfig.testCards.decline) {
            return {
                success: false,
                error: 'Card declined. Please try another card.'
            };
        }

        if (cardNumber === PaymentConfig.testCards.insufficient) {
            return {
                success: false,
                error: 'Insufficient funds. Please try another card.'
            };
        }
    }

    // Success for all other cases (test mode)
    return {
        success: true,
        transactionId: generateTransactionId()
    };
};
