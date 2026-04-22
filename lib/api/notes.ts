/**
 * Per-entity notes API helpers.
 *
 * The backend exposes a parallel ``POST/GET /api/v1/{entity}/{id}/notes``
 * route for every flaggable entity type. We hardcode the URL templates
 * here so the rest of the app can talk in entity-type terms instead of
 * raw paths.
 */

import type { ApiClient } from "./client";
import type {
  AnalystNoteRead,
  EntityNoteCreate,
  FlaggableEntityType,
} from "@/lib/types";

/**
 * URL prefix for the per-entity notes routes. The trailing
 * ``/{id}/notes`` is appended at call time. Keep these synchronized with
 * `.cursorrules` → "Notes / Flag-Issue Pattern".
 */
const NOTE_ROUTE_PREFIX: Record<
  Exclude<FlaggableEntityType, "hs_code_material_mapping">,
  string
> = {
  company: "/api/v1/companies",
  material: "/api/v1/materials",
  regulation: "/api/v1/regulations",
  risk_event: "/api/v1/risk-events",
  facility: "/api/v1/facilities",
  battery_chemistry: "/api/v1/chemistries",
};

/**
 * Builds the notes URL for any flaggable entity. ``hs_code_material_mapping``
 * is special-cased because the route is nested under the parent material
 * (``/materials/{material_id}/hs-code-mappings/{mapping_id}/notes``) —
 * pass the parent material id via ``parentId``.
 */
export function buildNotesUrl(
  entityType: FlaggableEntityType,
  entityId: string,
  parentId?: string,
): string {
  if (entityType === "hs_code_material_mapping") {
    if (!parentId) {
      throw new Error(
        "buildNotesUrl: hs_code_material_mapping requires parentId (the parent material id)",
      );
    }
    return `/api/v1/materials/${parentId}/hs-code-mappings/${entityId}/notes`;
  }
  const prefix = NOTE_ROUTE_PREFIX[entityType];
  return `${prefix}/${entityId}/notes`;
}

export async function getEntityNotes(
  client: ApiClient,
  entityType: FlaggableEntityType,
  entityId: string,
  parentId?: string,
): Promise<AnalystNoteRead[]> {
  const { data } = await client.get<AnalystNoteRead[]>(
    buildNotesUrl(entityType, entityId, parentId),
  );
  return data;
}

export async function createEntityNote(
  client: ApiClient,
  entityType: FlaggableEntityType,
  entityId: string,
  body: EntityNoteCreate,
  parentId?: string,
): Promise<AnalystNoteRead> {
  const { data } = await client.post<AnalystNoteRead>(
    buildNotesUrl(entityType, entityId, parentId),
    body,
  );
  return data;
}
