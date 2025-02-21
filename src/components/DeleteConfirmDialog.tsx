import React from 'react';
import { X } from 'lucide-react';

type DeleteConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
};

export default function DeleteConfirmDialog({ isOpen, onClose, onConfirm, productName }: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Delete Product</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-gray-600">
            Are you sure you want to delete <span className="font-medium text-gray-900">{productName}</span>? This action cannot be undone.
          </p>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}