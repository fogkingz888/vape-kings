import React from 'react';
import { Product } from '../types';

type CartItem = {
    product: Product & { stock: number };
    quantity: number;
};

type ReceiptProps = {
    saleData: { items: CartItem[], total: number };
    businessName: string;
    cashTendered: number;
    change: number;
};

const Receipt: React.FC<ReceiptProps> = ({ saleData, businessName, cashTendered, change }) => {
    const now = new Date();

    return (
        <div style={{ width: '288px', fontFamily: 'monospace', fontSize: '12px', color: '#000', padding: '10px' }}>
            <h1 style={{ textAlign: 'center', fontSize: '16px', margin: '0 0 10px 0' }}>{businessName}</h1>
            <p style={{ textAlign: 'center', margin: 0 }}>{now.toLocaleDateString()} {now.toLocaleTimeString()}</p>
            <hr style={{ borderTop: '1px dashed #000', margin: '10px 0' }} />
            
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', paddingBottom: '5px' }}>Item</th>
                        <th style={{ textAlign: 'center', paddingBottom: '5px' }}>Qty</th>
                        <th style={{ textAlign: 'right', paddingBottom: '5px' }}>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {saleData.items.map(item => (
                        <tr key={item.product.id}>
                            <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.product.name}
                            </td>
                            <td style={{ textAlign: 'center', padding: '0 5px' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right' }}>{(item.product.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <hr style={{ borderTop: '1px dashed #000', margin: '10px 0' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>TOTAL:</span>
                <span style={{ fontWeight: 'bold' }}>₱{saleData.total.toFixed(2)}</span>
            </div>
            {cashTendered > 0 && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                        <span>CASH:</span>
                        <span>₱{cashTendered.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>CHANGE:</span>
                        <span>₱{change.toFixed(2)}</span>
                    </div>
                </>
            )}

            <hr style={{ borderTop: '1px dashed #000', margin: '10px 0' }} />
            <p style={{ textAlign: 'center', margin: '10px 0 0 0' }}>Thank you!</p>
        </div>
    );
};

export default Receipt;
