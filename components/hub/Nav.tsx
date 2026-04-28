"use client";

import Image from "next/image";
import { TabLabel } from "./types";

const TABS: TabLabel[] = ["All", "Analysis", "Signal", "Report", "News"];

interface NavProps {
  activeTab: TabLabel;
  onTab: (tab: TabLabel) => void;
}

export function Nav({ activeTab, onTab }: NavProps) {
  return (
    <header className="ih-nav-wrap">
      <div className="ih-gradient-bar" />
      <div className="ih-nav">
        <div className="ih-nav-brand">
          <Image
            src="/hub/logo-mra-outline.svg"
            alt="Mineral Risk Analytics"
            width={32}
            height={35}
            className="ih-logo"
          />
          <span className="ih-wm">Mineral Risk Analytics</span>
        </div>
        <nav className="ih-nav-links">
          <a href="#">Intelligence</a>
          <a href="#">Reports</a>
          <a href="#">About</a>
          <button className="ih-btn-primary">Subscribe</button>
        </nav>
      </div>
      <div className="ih-tabs">
        <div className="ih-tabs-inner">
          {TABS.map((t) => (
            <button
              key={t}
              className={"ih-tab" + (t === activeTab ? " is-active" : "")}
              onClick={() => onTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
