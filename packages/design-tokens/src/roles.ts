// > STATUS: PROVISIONAL — created by Codex in bootstrap mode. Not approved. Owner: Brand owner. Do not treat as policy.
export interface ProvisionalTokenRoles {
  color: Record<string, string>;
  type: Record<string, string>;
  space: Record<string, string>;
  radius: Record<string, string>;
  motion: Record<string, string>;
}

export const neutralStructure: Omit<ProvisionalTokenRoles, "color"> = {
  type: { body: "TODO(owner)", display: "TODO(owner)" },
  space: { compact: "TODO(owner)", standard: "TODO(owner)", spacious: "TODO(owner)" },
  radius: { control: "TODO(owner)", panel: "TODO(owner)" },
  motion: { standard: "TODO(owner)", reduced: "TODO(owner)" },
};
