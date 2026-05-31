import { useState } from "react";
import { addProduct } from "../api/productApi";

const ProductForm = ({ onProductAdded }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !quantity) return alert("Fill all fields!");

    const newProduct = await addProduct({
      name,
      price: parseFloat(price),
      quantity: parseInt(quantity),
    });

    // Notify parent to refresh list
    onProductAdded(newProduct);

    // Reset form
    setName("");
    setPrice("");
    setQuantity("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Product</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />
      <button type="submit">Add</button>
    </form>
  );
};

export default ProductForm;
