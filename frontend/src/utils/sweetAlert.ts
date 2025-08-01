import Swal from 'sweetalert2';

// Custom SweetAlert configurations
const defaultConfig = {
  confirmButtonColor: '#2563eb',
  cancelButtonColor: '#6b7280',
  reverseButtons: true,
  customClass: {
    popup: 'rounded-lg',
    confirmButton: 'px-4 py-2 rounded-md',
    cancelButton: 'px-4 py-2 rounded-md'
  }
};

export const sweetAlert = {
  // Success notification
  success: (title: string, text?: string) => {
    return Swal.fire({
      ...defaultConfig,
      icon: 'success',
      title,
      text,
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false
    });
  },

  // Error notification
  error: (title: string, text?: string) => {
    return Swal.fire({
      ...defaultConfig,
      icon: 'error',
      title,
      text,
      confirmButtonText: 'OK'
    });
  },

  // Warning notification
  warning: (title: string, text?: string) => {
    return Swal.fire({
      ...defaultConfig,
      icon: 'warning',
      title,
      text,
      confirmButtonText: 'OK'
    });
  },

  // Info notification
  info: (title: string, text?: string) => {
    return Swal.fire({
      ...defaultConfig,
      icon: 'info',
      title,
      text,
      confirmButtonText: 'OK'
    });
  },

  // Confirmation dialog
  confirm: (title: string, text?: string, confirmText: string = 'Ya', cancelText: string = 'Batal') => {
    return Swal.fire({
      ...defaultConfig,
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText
    });
  },

  // Delete confirmation
  confirmDelete: (title: string = 'Hapus Data?', text: string = 'Data yang dihapus tidak dapat dikembalikan!') => {
    return Swal.fire({
      ...defaultConfig,
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626'
    });
  },

  // Loading dialog
  loading: (title: string = 'Memproses...', text?: string) => {
    return Swal.fire({
      ...defaultConfig,
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  },

  // Close any open SweetAlert
  close: () => {
    Swal.close();
  },

  // Toast notification (small notification)
  toast: {
    success: (title: string) => {
      return Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    },
    error: (title: string) => {
      return Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title,
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true
      });
    },
    warning: (title: string) => {
      return Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    },
    info: (title: string) => {
      return Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    }
  }
};

// Shorthand functions for common use cases
export const showSuccess = sweetAlert.success;
export const showError = sweetAlert.error;
export const showWarning = sweetAlert.warning;
export const showInfo = sweetAlert.info;
export const showConfirm = sweetAlert.confirm;
export const showConfirmDelete = sweetAlert.confirmDelete;
export const showLoading = sweetAlert.loading;
export const closeAlert = sweetAlert.close;

// Toast shortcuts
export const toastSuccess = sweetAlert.toast.success;
export const toastError = sweetAlert.toast.error;
export const toastWarning = sweetAlert.toast.warning;
export const toastInfo = sweetAlert.toast.info;

export default sweetAlert;