# The update test

> **What this is:** The fixed steps change-request-disposition follows to decide whether a change alters an existing rule, value, limit or wording, and so whether its kind is Update or optimize.
>
> **What it is not:** The Feature Fit verdict, which comes first and says whether the change's words exist in the Glossary. Feature Fit calls a change to an existing limit "Fits", because every word in it exists. This test finds that the limit itself changes.
>
> **Who uses it:** change-request-disposition, for each ask, after Feature Fit. adversarial-check opens each rule it compared, and check-change-report.cjs checks every rule compared has a result.

## The steps

1. Take each noun and each limit in the restated ask, in section 5 of the Change impact report.
2. Find the FRD rules that name it: every rule whose text, or whose thing in the FRD's Data, names the noun or the limit.
3. For each rule, compare what the change says with what the rule says, and give one result:
   - **same:** the change says what the rule already says
   - **opposite:** the rule says **not** or **only**, and the change allows it, or the other way round
   - **changed value:** a different count, list or limit
   - **new:** the rule doesn't speak to what the change asks
4. If any rule is opposite or changed value, the kind is **Update or optimize**.
5. If the change only rewords a requirement, and no rule is touched, the kind is **Update or optimize**, and the requirement's result is **wording only**. Section 5 then reads `{ID} now reads: "{the new wording}"`, so copy-wording.cjs can offer to copy it.
6. Otherwise the kind is Feature Fit's:
   - Fits is Already covered when every rule is same, and Extend or enhance when a rule is new
   - Extend is Extend or enhance
   - New capability is Net new
   - Blocked is Blocked

## How it is written

Section 7's "The test that decided it" holds the Feature Fit verdict first, then each rule compared, one per line, with its result:

> • Feature Fit: Fits. Member, Loan and Extend are all in the Glossary<br>• F-05.1: changed value<br>• F-05.3: changed value

A rule that no comparison reached isn't listed. A wording-only change lists the requirement instead: `REQ-4.2: wording only`.

## Worked examples, from the made-up City library product

| The change | Rules compared | Result | Kind |
|---|---|---|---|
| A loan can be extended twice, not once | F-05.1 and F-05.3, each naming "once" | changed value | Update or optimize |
| A member who owes a fine can borrow again | F-04.2, "**not** lend a book to a member who owes a fine" | opposite | Update or optimize |
| A librarian can also extend a loan for a member | F-05.1 and F-05.2, which only let the member extend | new | Extend or enhance, from Feature Fit's Extend |
| REQ-4.2 now reads "A member can extend a loan one time." | none: no rule's meaning changes | wording only | Update or optimize |
| A member who owes a fine can't borrow | F-04.2, which already says so | same | Already covered |
