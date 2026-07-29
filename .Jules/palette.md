## 2024-06-06 - Missing ARIA labels on DetailCard and Modal close buttons
**Learning:** This application extensively uses `<XMarkIcon />` for close buttons in DetailCards and Modals without providing text alternatives. Screen readers would just announce "button" or the SVG contents without context.
**Action:** When creating or modifying new DetailCards or Modals, always ensure the close button includes an explicit `aria-label="Close"` or `aria-label="Tutup"` to maintain accessibility.
