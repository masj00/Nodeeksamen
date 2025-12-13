import toastr from 'toastr'
import 'toastr/build/toastr.min.css'

toastr.options = {
  closeButton: true,
  debug: false,
  newestOnTop: true,
  progressBar: true,
  positionClass: 'toast-top-right',
  preventDuplicates: true,
  onclick: null,
  showDuration: 300,
  hideDuration: 500,
  timeOut: 10000,
  extendedTimeOut: 1000,
  showEasing: 'swing',
  hideEasing: 'linear',
  showMethod: 'fadeIn',
  hideMethod: 'fadeOut'
}

function toastrDisplayHTTPCode (code, message) {
  if (code >= 200 && code < 300) {
    toastr.success(message, `Status ${code}`)
  } else if (code >= 300 && code < 400) {
    toastr.info(message, `Status ${code}`)
  } else if (code >= 400 && code < 500) {
    toastr.warning(message, `Status ${code}`)
  } else if (code >= 500 && code < 600) {
    toastr.warning(message, `Status ${code}`)
  } else {
    toastr.error(message, `Status ${code}`)
  }
}

export default toastrDisplayHTTPCode
