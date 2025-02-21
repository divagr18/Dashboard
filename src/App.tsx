// App.tsx (Updated with Number Formatting)
import React, { useState, useEffect } from 'react';
import { Package, BarChart3, Settings, Search, Plus, Edit, Trash2, Menu } from 'lucide-react';
import AddProductDialog from './components/AddProductDialog';
import EditProductDialog from './components/EditProductDialog';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';
import Analytics from './components/Analytics';

type InventoryItem = {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  price: string;
  cost_price: number;
  stock_level: number;
  reorder_point: number;
};

type MetricsData = {
  total_sales: number;
  total_profit: number;
  total_transactions: number;
  total_products: number;
};

const API_BASE_URL = 'http://localhost:8000/api'; // Replace with your actual API URL

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]); // Initialize as empty array
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProductSku, setSelectedProductSku] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null); // NEW: Metrics state
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);

  // *** NEW: Fetch data on component mount ***
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products/`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: InventoryItem[] = await response.json();
        setItems(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        // Consider setting an error state to display an error message to the user
      }
    };

    const fetchMetrics = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/metrics/`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: MetricsData = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        // Handle error (e.g., display an error message)
      }
    };

    fetchProducts();
    fetchMetrics();
  }, []); // Empty dependency array means this runs only once on mount

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(items.map(item => item.category))];

  const getStockLevelColor = (level: number) => {
    if (level > 10) return 'bg-emerald-500';
    if (level > 0) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // *** UPDATED: handleAddProduct to use API ***
  const handleAddProduct = async (newProduct: Omit<InventoryItem, 'id'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const addedProduct: InventoryItem = await response.json(); // Assuming API returns the new product
      setItems([...items, addedProduct]);
    } catch (error) {
      console.error('Error adding product:', error);
      // Handle error (e.g., display an error message)
    }
  };

  // *** UPDATED: handleEditProduct to use API ***
  const handleEditProduct = async (updatedProduct: InventoryItem) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${updatedProduct.id}/`, {
        method: 'PUT', // or PATCH, depending on your API
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProduct),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setItems(
        items.map(item => (item.id === updatedProduct.id ? updatedProduct : item))
      );
    } catch (error) {
      console.error('Error updating product:', error);
      // Handle error
    }
  };

  // *** UPDATED: handleDeleteProduct to use API ***
  const handleDeleteProduct = async () => {
    if (selectedProduct) {
      try {
        const response = await fetch(`${API_BASE_URL}/products/${selectedProduct.id}/`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        setItems(items.filter(item => item.id !== selectedProduct.id));
        setIsDeleteDialogOpen(false);
        setSelectedProduct(null);
      } catch (error) {
        console.error('Error deleting product:', error);
        // Handle error
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50 shadow-sm backdrop-blur-sm bg-white/80">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-transparent bg-clip-text">
              Inventory Pro
            </h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64 transition-shadow"
            />
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white border-r transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0'}`}>
        <div className="pt-20 px-4">
          <select
            value={selectedProductSku || ''}
            onChange={(e) => setSelectedProductSku(e.target.value === '' ? null : e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a Product</option>
            {items.map(item => (
              <option key={item.id} value={item.sku}>{item.name} ({item.sku})</option>
            ))}
          </select>
          <nav className="space-y-2 mt-4">
            <button className="w-full flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium">
              <Package className="h-5 w-5" />
              <span>Inventory</span>
            </button>
            <button
              onClick={() => setIsAnalyticsOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <BarChart3 className="h-5 w-5" />
              <span>Analytics</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-20 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="p-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {metrics && ( // Check if metrics is not null
              <>
                <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                  <h3 className="text-gray-500 text-sm font-medium">Total Sales</h3>
                  <p className="text-2xl font-bold mt-2 text-gray-900">${metrics.total_sales.toLocaleString()}</p>
                  <p className="text-emerald-600 text-sm mt-1 font-medium">+12% from last month</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                  <h3 className="text-gray-500 text-sm font-medium">Total Profit</h3>
                  <p className="text-2xl font-bold mt-2">$ {metrics.total_profit.toLocaleString()}</p>
                  <p className="text-emerald-600 text-sm mt-1 font-medium">+8% from last month</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                  <h3 className="text-gray-500 text-sm font-medium">Transactions</h3>
                  <p className="text-3xl font-bold mt-2">{metrics.total_transactions.toLocaleString()}</p>
                  <p className="text-sm opacity-90 mt-1">+15% from last month</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                  <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
                  <p className="text-3xl font-bold mt-2">{metrics.total_products.toLocaleString()}</p>
                  <p className="text-sm opacity-90 mt-1">+5% from last month</p>
                </div>
              </>
            )}
          </div>

          {/* Products Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 flex justify-between items-center border-b">
              <h2 className="text-xl font-semibold text-gray-900">Products</h2>
              <button
                onClick={() => setIsAddDialogOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
              >
                <Plus className="h-5 w-5" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Reorder Point</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.sku}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-full">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900 font-medium">${item.price}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">${item.cost_price}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-1 text-xs font-medium ${getStockLevelColor(item.stock_level)} text-white rounded-full`}>
                          {item.stock_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{item.reorder_point}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(item);
                            setIsEditDialogOpen(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Edit className="h-4 w-4 text-indigo-600" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProduct(item);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <AddProductDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddProduct}
      />

      <EditProductDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedProduct(null);
        }}
        onEdit={handleEditProduct}
        product={selectedProduct}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDeleteProduct}
        productName={selectedProduct?.name || ''}
      />

      <Analytics
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        productSku={selectedProductSku}
      />
    </div>
  );
}

export default App;