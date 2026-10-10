// Mobile table-of-contents drawer. A modal <dialog> provides the focus trap,
// Escape handling and inert page; this adds backdrop close and aria-expanded.
const drawer = document.querySelector<HTMLDialogElement>('#toc-drawer')
const openButton = document.querySelector<HTMLButtonElement>('.toc-open')

if (drawer && openButton) {
  openButton.addEventListener('click', () => {
    drawer.showModal()
    openButton.setAttribute('aria-expanded', 'true')
  })
  drawer.addEventListener('close', () => openButton.setAttribute('aria-expanded', 'false'))
  // The panel fills the dialog, so a click targeting the dialog itself hit ::backdrop.
  drawer.addEventListener('click', event => {
    if (event.target === drawer) drawer.close()
  })
  drawer.querySelector('.toc-close')?.addEventListener('click', () => drawer.close())
  matchMedia('(min-width: 768px)').addEventListener('change', event => {
    if (event.matches && drawer.open) drawer.close()
  })
}
