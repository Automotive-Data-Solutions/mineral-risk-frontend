/**
 * Material-exposure row — informative-first variant (2026-07-15):
 * material × stage × source geography only. The mockup's risk track +
 * level chip are deliberately absent until scoring goes public; the
 * ExposureOut type still carries risk_score/band for Phase 4.
 */

import type { ExposureOut } from "@/lib/api/entities";

export function ExposureRow({ row }: { row: ExposureOut }) {
  return (
    <div className="ih-expo-row ih-expo-row-plain">
      <div className="ih-expo-main">
        <span className="ih-expo-name">{row.material}</span>
        {row.stage_label ? <span className="ih-tag ih-tag-mat">{row.stage_label}</span> : null}
        {row.geography ? <span className="ih-tag ih-tag-geo">{row.geography}</span> : null}
      </div>
    </div>
  );
}
