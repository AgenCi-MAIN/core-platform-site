# authz-matrix — code manifest (the lane's territory)

- `app/portal/access.ts — the entire authorization core`
- `app/portal/members/manage/route.ts — writes + owner peer-protection`
- `every app/portal/*/page.tsx guard call — the requireCapability/requireFounder surface`
- `app/google-auth.ts, app/auth/ — the identity layer the matrix sits on`
