import { createPortal } from "react-dom";

export default function PortalDropdown({ children, style, className }) {
  return createPortal(
    <div className={className} style={style}>
      {children}
    </div>,
    document.body
  );
} 