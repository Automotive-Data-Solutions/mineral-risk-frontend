import type { FacilityOut } from "@/lib/api/entities";

/** Facility row: name/type, country tag + place (city, else region — may
 *  be absent entirely: ~4% of facilities have a city), status chip. */
export function FacilityRow({ row }: { row: FacilityOut }) {
  return (
    <div className="ih-fac-row">
      <div className="ih-fac-type">
        {row.name ? row.name : row.facility_type}
        {row.name ? <span className="ih-fac-kind"> — {row.facility_type}</span> : null}
      </div>
      <div className="ih-fac-loc">
        <span className="ih-tag ih-tag-geo">{row.country}</span>
        {row.place ? <span className="ih-fac-place">{row.place}</span> : null}
      </div>
      <div className={"ih-fac-status ih-fac-status-" + row.status_level}>{row.status}</div>
    </div>
  );
}
