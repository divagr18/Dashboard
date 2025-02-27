import React, { useState, useEffect } from 'react';
import { Package, BarChart3, Settings, Search, Plus, Edit, Trash2, Menu, ArrowUpRight, 
         ArrowDownRight, DollarSign, Package as PackageIcon, MessageCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentView, setCurrentView] = useState<'inventory' | 'analytics' | 'settings'>('inventory');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProductSku, setSelectedProductSku] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isViewingAllProducts, setIsViewingAllProducts] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);

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
      }
    };

    fetchProducts();
    fetchMetrics();
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate pagination values
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = isViewingAllProducts 
    ? filteredItems 
    : filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const categories = ['All', ...new Set(items.map(item => item.category))];

  const getStockLevelColor = (level: number) => {
    if (level > 10) return 'bg-emerald-500';
    if (level > 0) return 'bg-amber-500';
    return 'bg-rose-500';
  };

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

      const addedProduct: InventoryItem = await response.json();
      setItems([...items, addedProduct]);
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleEditProduct = async (updatedProduct: InventoryItem) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${updatedProduct.id}/`, {
        method: 'PUT',
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
    }
  };

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
      }
    }
  };
  
  // Pagination controls
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  const toggleViewAllProducts = () => {
    setIsViewingAllProducts(!isViewingAllProducts);
    if (isViewingAllProducts) {
      // When switching back to paginated view, reset to first page
      setCurrentPage(1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Simplified pagination display logic
    const maxPageButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    if (endPage - startPage < maxPageButtons - 1) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  const renderPagination = () => {
    const pageNumbers = getPageNumbers();
    
    return (
      <div className="flex items-center justify-between px-6 py-3 border-t">
        <div className="flex items-center space-x-2">
          <select 
            value={itemsPerPage} 
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
              setIsViewingAllProducts(false);
            }}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
          </select>
          <span className="text-sm text-gray-600">
            Showing {currentItems.length} of {filteredItems.length} items
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => handlePageChange(1)} 
            disabled={currentPage === 1 || isViewingAllProducts}
            className={`p-1 rounded ${currentPage === 1 || isViewingAllProducts ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'}`}
          >
            <span className="text-sm">First</span>
          </button>
          
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1 || isViewingAllProducts}
            className={`p-1 rounded ${currentPage === 1 || isViewingAllProducts ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'}`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => handlePageChange(number)}
              disabled={isViewingAllProducts}
              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                currentPage === number && !isViewingAllProducts
                  ? 'bg-indigo-600 text-white'
                  : isViewingAllProducts
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-indigo-50'
              }`}
            >
              {number}
            </button>
          ))}
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages || isViewingAllProducts}
            className={`p-1 rounded ${currentPage === totalPages || isViewingAllProducts ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'}`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          
          <button 
            onClick={() => handlePageChange(totalPages)} 
            disabled={currentPage === totalPages || isViewingAllProducts}
            className={`p-1 rounded ${currentPage === totalPages || isViewingAllProducts ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'}`}
          >
            <span className="text-sm">Last</span>
          </button>
          
          <button
            onClick={toggleViewAllProducts}
            className="ml-2 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:bg-indigo-50 rounded-md transition-colors"
          >
            {isViewingAllProducts ? "Paginate Results" : "View All"}
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'analytics':
        return <Analytics productSku={selectedProductSku} />;
      case 'settings':
        return <div>Settings Page</div>;
      default:
        return (
          <div className="space-y-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
              {metrics && (
                <>
                  <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100 bg-gradient-to-br from-blue-50 to-blue-100 hover:translate-y-[-3px] duration-300">
                    <div className="flex items-center justify-between">
                      <span className="p-2 bg-blue-200 rounded-xl shadow-sm">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                      </span>
                      <span className="flex items-center text-emerald-600 text-sm font-medium">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        12%
                      </span>
                    </div>
                    <h3 className="text-lg font-medium mt-4 text-gray-900">Total Revenue</h3>
                    <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                      ${metrics.total_sales.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">vs. last month</p>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100 bg-gradient-to-br from-emerald-50 to-emerald-100 hover:translate-y-[-3px] duration-300">
                    <div className="flex items-center justify-between">
                      <span className="p-2 bg-emerald-200 rounded-xl shadow-sm">
                        <PackageIcon className="h-6 w-6 text-emerald-600" />
                      </span>
                      <span className="flex items-center text-emerald-600 text-sm font-medium">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        8%
                      </span>
                    </div>
                    <h3 className="text-lg font-medium mt-4 text-gray-900">Total Products</h3>
                    <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-transparent bg-clip-text">
                      {metrics.total_products.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Active inventory items</p>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100 bg-gradient-to-br from-violet-50 to-violet-100 hover:translate-y-[-3px] duration-300">
                    <div className="flex items-center justify-between">
                      <span className="p-2 bg-violet-200 rounded-xl shadow-sm">
                        <BarChart3 className="h-6 w-6 text-violet-600" />
                      </span>
                      <span className="flex items-center text-emerald-600 text-sm font-medium">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        15%
                      </span>
                    </div>
                    <h3 className="text-lg font-medium mt-4 text-gray-900">Transactions</h3>
                    <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-violet-600 to-purple-600 text-transparent bg-clip-text">
                      {metrics.total_transactions.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Total processed</p>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100 bg-gradient-to-br from-amber-50 to-amber-100 hover:translate-y-[-3px] duration-300">
                    <div className="flex items-center justify-between">
                      <span className="p-2 bg-amber-200 rounded-xl shadow-sm">
                        <DollarSign className="h-6 w-6 text-amber-600" />
                      </span>
                      <span className="flex items-center text-rose-600 text-sm font-medium">
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                        3%
                      </span>
                    </div>
                    <h3 className="text-lg font-medium mt-4 text-gray-900">Profit Margin</h3>
                    <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-amber-600 to-orange-600 text-transparent bg-clip-text">
                      {((metrics?.total_profit || 0) / (metrics?.total_sales || 1) * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Average margin</p>
                  </div>
                </>
              )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Products Table Section - Takes up 2 columns */}
              <div className="xl:col-span-2">
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                  <div className="p-6 flex justify-between items-center border-b">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Products</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage your inventory items</p>
                    </div>
                    <button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-[1.02] duration-300"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add Product</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {currentItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">{item.description}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{item.sku}</td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-full">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-gray-900 font-medium">${item.price}</td>
                            <td className="px-6 py-4 text-right">
                              <span className={`px-2 py-1 text-xs font-medium ${getStockLevelColor(item.stock_level)} text-white rounded-full`}>
                                {item.stock_level}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedProduct(item);
                                  setIsEditDialogOpen(true);
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Edit className="h-4 w-4 text-indigo-600" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProduct(item);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4 text-rose-500" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination Component */}
                  {renderPagination()}
                </div>
              </div>

              {/* Quick Actions & Stats - Takes up 1 column */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setIsAddDialogOpen(true)}
                      className="p-4 border rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-colors text-left group"
                    >
                      <Package className="h-6 w-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="block text-sm font-medium text-gray-900">Add Product</span>
                      <span className="text-xs text-gray-500">Create new item</span>
                    </button>
                    <button 
                      onClick={() => setCurrentView('analytics')}
                      className="p-4 border rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-colors text-left group"
                    >
                      <BarChart3 className="h-6 w-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="block text-sm font-medium text-gray-900">Analytics</span>
                      <span className="text-xs text-gray-500">View reports</span>
                    </button>
                  </div>
                </div>

                {/* Low Stock Alert */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alert</h3>
                  <div className="space-y-3">
                    {filteredItems
                      .filter(item => item.stock_level <= item.reorder_point)
                      .slice(0, 3)
                      .map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium ${getStockLevelColor(item.stock_level)} text-white rounded-full shadow-sm`}>
                            {item.stock_level}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Newest Products */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Added</h3>
                  <div className="space-y-3">
                    {filteredItems
                      .slice(0, 3)
                      .map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl hover:from-indigo-100 hover:to-purple-100 transition-colors duration-300">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">Added recently</p>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium bg-white text-indigo-600 rounded-full shadow-sm border border-indigo-100">
                            ${item.price}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  // Chatbot component
  const Chatbot = () => {
    const [messages, setMessages] = useState<{text: string, isUser: boolean}[]>([
      {text: "Hi there! How can I help you with your inventory management today?", isUser: false}
    ]);
    const [newMessage, setNewMessage] = useState("");

    const handleSendMessage = () => {
      if (!newMessage.trim()) return;
      
      // Add user message
      setMessages([...messages, {text: newMessage, isUser: true}]);
      setNewMessage("");
      
      // Simulate bot response after a short delay
      setTimeout(() => {
        setMessages(prev => [...prev, {
          text: "I'll help you with that! Would you like me to check inventory levels or assist with product management?",
          isUser: false
        }]);
      }, 1000);
    };

    return (
      <div className="fixed bottom-20 right-6 w-80 h-96 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden z-50">
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex justify-between items-center">
          <h3 className="font-semibold">Inventory Assistant</h3>
          <button onClick={() => setChatbotOpen(false)} className="p-1 hover:bg-white/20 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {messages.map((msg, index) => (
            <div key={index} className={`mb-3 ${msg.isUser ? 'text-right' : ''}`}>
              <div className={`inline-block p-3 rounded-xl ${
                msg.isUser 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your question..."
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button 
            onClick={handleSendMessage}
            className="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700"
          >
            Send
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50 shadow-sm backdrop-blur-sm bg-white/80">
        <div className="flex items-center justify-between px-6 h-16">
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
          <div className="relative flex items-center gap-4">
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
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-gray-50 border rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white border-r transition-all duration-300 z-40 shadow-md ${sidebarOpen ? 'w-64' : 'w-0 -translate-x-full'}`}>
        <div className="pt-20 px-4 h-full flex flex-col">
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
          <nav className="space-y-2 mt-4 flex-1">
            <button 
              onClick={() => setCurrentView('inventory')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                currentView === 'inventory' 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Package className="h-5 w-5" />
              <span>Inventory</span>
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                currentView === 'analytics' 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                currentView === 'settings' 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </button>
          </nav>
          
          <div className="p-4 mb-6 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
            <h4 className="font-medium text-indigo-700 mb-2">Need help?</h4>
            <p className="text-sm text-gray-600 mb-3">Ask our assistant about inventory management</p>
            <button 
              onClick={() => setChatbotOpen(true)}
              className="w-full py-2 text-center bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Chat with Support
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-20 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="p-6">
          {renderContent()}
        </div>
      </main>

      {/* Chatbot Button - Fixed at bottom right */}
      <button
        onClick={() => setChatbotOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chatbot Window */}
      {chatbotOpen && <Chatbot />}

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
    </div>
  );
}

export default App;