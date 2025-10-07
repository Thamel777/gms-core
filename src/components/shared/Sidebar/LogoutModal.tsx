interface LogoutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutModal({ isOpen, onConfirm, onCancel }: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-md rounded-xl p-6 max-w-sm mx-4 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Confirm Logout</h3>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to logout? You will need to sign in again to access the system.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Yes, Logout
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-white/80 backdrop-blur-sm text-gray-800 py-2 px-4 rounded-lg hover:bg-white transition-all duration-200 text-sm font-medium border border-gray-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}