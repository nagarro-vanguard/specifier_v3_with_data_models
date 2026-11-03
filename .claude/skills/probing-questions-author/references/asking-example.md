# A question, asked

> **What this is:** One decision, asked the way probing-questions-author asks every decision in Ask mode. It shows the message the specifier sees, then what goes in the control for picking an answer.
>
> **What it is not:** The rules. The steps are in probing-questions-author's own instructions, "Ask: put one decision to the specifier".

The product is an online shop. prd-author is at its gate, and hands over question 7 from the Question log.

## The message

> Decision 3. 6 left at this step, this one included.
>
> **Where we are:** I'm writing the detailed requirements for the online shop. The part about returns is done, except for one point the client's words leave open.
>
> **When do the 30 days for a return start: on the day the order is placed, or on the day it arrives?**
>
> **What I found:** the client's returns policy says: "Customers can return any item within 30 days." It doesn't say when the 30 days start. No other document speaks to it.
>
> **Why it matters:** Sam orders a coat on 1 March. It arrives on 20 March, because it was out of stock. On 5 April, Sam wants to return it. If the 30 days start at the order, Sam is too late: it's day 35. If they start when the coat arrives, it's day 16, and Sam can return it.
> - If we get it wrong: customers are refused returns they are owed, or the shop pays refunds it doesn't owe. Severity: High, because it's about money.
> - Fixing it later means redoing the returns rules and their stories. Impact: Medium, because it reaches one part of the product.
>
> **Your choices:**
> - **From the day it arrives.** What it means: Sam can return the coat until 19 April. Choose this if: orders can arrive late, or the law where the shop sells counts from that day.
> - **From the day of the order.** What it means: Sam can return the coat only until 31 March, 11 days after it arrived. Choose this if: the client wants one date that support staff can check from the order alone.
> - **I don't know yet.** Meanwhile: I use "from the day it arrives", not confirmed yet, and the client's customer service lead is asked before the returns rules are written.
>
> **My recommendation:** from the day it arrives, because a customer can't return what they haven't received. This comes from common practice, not from the client's words.
> - **How sure I am:** Fairly sure. In many countries, the law counts from the day the item arrives. I don't know yet where the client sells.
> - **Choose something else if:** the client sells only where counting from the order is allowed, and wants the simpler rule.
>
> **What I'd do now:** choose "from the day it arrives" now, and ask the client which countries they sell in.
>
> (question 7)

## The control

| Label | Description |
|---|---|
| From the day it arrives (Recommended) | Choose this if orders can arrive late. Then the 30 days start when the customer gets the item. |
| From the day of the order | Choose this if the client wants one date that support can check. Then a late delivery shortens the time to return. |
| I don't know yet | Then I use "from the day it arrives", not confirmed yet, and the client is asked before the returns rules are written. |
