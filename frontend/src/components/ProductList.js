// frontend/src/components/ProductList.js
import React, { useEffect, useState } from "react";
import { getProducts, deleteProduct } from "../api/productApi";

const ProductList = () => {
    const [products, setProducts] = useState([]);

    const fetchData = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id) => {
        try {
            await deleteProduct(id);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <h2>Product List</h2>
            <table border="1" cellPadding="5">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Brand</th>
                        <th>Model</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                        <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>{p.name}</td>
                            <td>{p.brand}</td>
                            <td>{p.model_name}</td>
                            <td>{p.price}</td>
                            <td>{p.quantity}</td>
                            <td>
                                <button onClick={() => handleDelete(p.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductList;
