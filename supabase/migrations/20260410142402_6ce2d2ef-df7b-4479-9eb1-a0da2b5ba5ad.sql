
CREATE POLICY "account_members_update_admin"
ON public.account_members
FOR UPDATE
TO public
USING (
  account_id = current_account_id()
  AND get_effective_role() IN ('owner', 'admin')
)
WITH CHECK (
  account_id = current_account_id()
  AND get_effective_role() IN ('owner', 'admin')
);
