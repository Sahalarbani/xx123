import React, { useState } from 'react';
import { Product } from '../types';
import { Button } from './Button';
import { callApi } from '../services/api';
import Swal from 'sweetalert2';

interface Props {
  authToken: string;
  products: Product[];
  onRefresh: () => void;
}

export const ProductManager: React.FC<Props> = ({ authToken, products, onRefresh }) => {
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEdit = (p: Product) => {
    setEditing({ ...p });
    setIsNew(false);
  };

  const handleAdd = () => {
    setEditing({ name: '', price: 0, stock: 0, category: 'General' });
    setIsNew(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.name) return;

    setLoading(true);
    try {
      await callApi('manageProduct', {
        token: authToken,
        type: isNew ? 'ADD' : 'UPDATE',
        product: editing
      });
      Swal.fire('Success', isNew ? 'Product added' : 'Product updated', 'success');
      setEditing(null);
      onRefresh();
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (p: Product) => {
    const result = await Swal.fire({
      title: 'Delete Product?',
      text: `Are you sure you want to remove ${p.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      confirmButtonColor: '#d33'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await callApi('manageProduct', {
          token: authToken,
          type: 'DELETE',
          product: p
        });
        Swal.fire('Deleted', 'Product removed', 'success');
        onRefresh();
      } catch (e: any) {
        Swal.fire('Error', e.message, 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
        <h2 className="font-bold text-slate-700">Inventory Management</h2>
        <Button onClick={handleAdd} variant="primary">+ Add Product</Button>
      </div>

      {editing ? (
        <div className="p-6 flex-1 overflow-y-auto">
          <h3 className="text-lg font-bold mb-4">{isNew ? 'New Product' : 'Edit Product'}</h3>
          <form onSubmit={handleSave} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name</label>
              <input 
                required
                className="w-full p-2 border rounded"
                value={editing.name}
                onChange={e => setEditing({...editing, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input 
                  required
                  type="number"
                  className="w-full p-2 border rounded"
                  value={editing.price}
                  onChange={e => setEditing({...editing, price: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input 
                  required
                  type="number"
                  className="w-full p-2 border rounded"
                  value={editing.stock}
                  onChange={e => setEditing({...editing, stock: Number(e.target.value)})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input 
                className="w-full p-2 border rounded"
                placeholder="e.g. Food, Electronics"
                value={editing.category}
                onChange={e => setEditing({...editing, category: e.target.value})}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" isLoading={loading}>{isNew ? 'Create' : 'Save Changes'}</Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="p-3 border-b">Name</th>
                <th className="p-3 border-b">Category</th>
                <th className="p-3 border-b">Price</th>
                <th className="p-3 border-b">Stock</th>
                <th className="p-3 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 border-b">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3 text-sm text-slate-500">{p.category}</td>
                  <td className="p-3 font-mono">{p.price.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${p.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800 text-sm font-bold">Edit</button>
                    <button onClick={() => handleDelete(p)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};