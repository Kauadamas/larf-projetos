import { useState } from "react";

function getInitial(): boolean {
  try {
    const saved = localStorage.getItem("larf_sidebar_collapsed");
    if (saved === "true") return true;
    if (saved === "false") return false;
  } catch {}
  return false; // aberto por padrão
}

export function useSidebar() {
  const [collapsed, setCollapsedState] = useState<boolean>(getInitial);

  function setCollapsed(val: boolean) {
    try { localStorage.setItem("larf_sidebar_collapsed", String(val)); } catch {}
    setCollapsedState(val);
  }

  function toggle() {
    setCollapsed(!collapsed);
  }

  return { collapsed, toggle, setCollapsed };
}
