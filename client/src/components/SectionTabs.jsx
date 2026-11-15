import React, { useEffect, useId, useRef, useState } from "react";
import { Button } from "./FormControls";

export function SectionTabs({ tabs, children, activeId }) {
  const id = useId();
  const [active, setActive] = useState(0);
  const buttons = useRef([]);
  useEffect(() => {
    const index = tabs.findIndex(tab => tab.id === activeId);
    if (index >= 0) setActive(index);
  }, [activeId]);
  return <div>
    <div role="tablist" aria-label="Task sections" className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((tab, index) => <Button key={tab.id} type="button" role="tab" id={`${id}-${tab.id}-tab`} aria-controls={`${id}-${tab.id}-panel`} aria-selected={active === index} tabIndex={active === index ? 0 : -1} ref={element => { buttons.current[index] = element; }}
        className="shrink-0 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-500 hover:text-primary aria-selected:border-primary aria-selected:text-primary"
        onClick={() => setActive(index)} onKeyDown={event => {
          let next;
          if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
          else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
          else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = tabs.length - 1;
          else return;
          event.preventDefault(); setActive(next); buttons.current[next]?.focus();
        }}>{tab.label}</Button>)}
    </div>
    {React.Children.toArray(children).map((child, index) => <div key={tabs[index].id} role="tabpanel" id={`${id}-${tabs[index].id}-panel`} aria-labelledby={`${id}-${tabs[index].id}-tab`} hidden={active !== index}>{child}</div>)}
  </div>;
}
