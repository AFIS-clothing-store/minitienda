import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // Permitir peticiones CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Obtener productos, configuración y categorías de la nube
            const products = (await kv.get('products')) || [];
            const config = (await kv.get('config')) || null;
            const categories = (await kv.get('categories')) || null;
            
            return res.status(200).json({ products, config, categories });
        }

        if (req.method === 'POST') {
            const body = req.body;

            // Caso 1: Guardar datos globales (configuración y categorías)
            if (body.action === 'saveGlobalData') {
                if (body.config) await kv.set('config', body.config);
                if (body.categories) await kv.set('categories', body.categories);
                return res.status(200).json({ success: true });
            }

            // Caso 2: Eliminar producto
            if (body.action === 'delete') {
                let products = (await kv.get('products')) || [];
                products = products.filter(p => p.id !== body.id);
                await kv.set('products', products);
                return res.status(200).json({ success: true });
            }

            // Caso 3: Guardar o actualizar producto individual
            const newProduct = body;
            let products = (await kv.get('products')) || [];
            const index = products.findIndex(p => p.id === newProduct.id);

            if (index >= 0) {
                products[index] = newProduct;
            } else {
                products.unshift(newProduct);
            }

            await kv.set('products', products);
            return res.status(200).json({ success: true, product: newProduct });
        }
    } catch (error) {
        console.error("Error en API productos:", error);
        return res.status(500).json({ error: error.message });
    }
}
