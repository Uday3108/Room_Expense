"""
Settlement calculation: minimise the number of transactions needed to
settle all debts among members.

Algorithm (greedy):
  1. Split members into creditors (balance > 0) and debtors (balance < 0).
  2. Repeatedly match the largest creditor with the largest debtor.
  3. Transfer min(|creditor|, |debtor|) and reduce both balances.
  4. Repeat until all balances are (approximately) zero.
"""


def calculate_settlement(balances: dict) -> list:
    """
    Parameters
    ----------
    balances : dict[str, float]
        Mapping of member name → net balance.
        Positive  → member is owed money (creditor).
        Negative  → member owes money    (debtor).

    Returns
    -------
    list[dict]
        Each dict has keys: "from_member", "to_member", "amount".
    """
    EPSILON = 0.005  # ignore rounding dust below half a paisa

    # Build mutable lists of (name, balance) sorted by absolute value desc
    creditors = sorted(
        [(name, bal) for name, bal in balances.items() if bal > EPSILON],
        key=lambda x: x[1],
        reverse=True,
    )
    debtors = sorted(
        [(name, -bal) for name, bal in balances.items() if bal < -EPSILON],
        key=lambda x: x[1],
        reverse=True,
    )

    transactions = []
    i, j = 0, 0

    while i < len(creditors) and j < len(debtors):
        cred_name, cred_amt = creditors[i]
        debt_name, debt_amt = debtors[j]

        transfer = min(cred_amt, debt_amt)
        transactions.append(
            {
                "from_member": debt_name,
                "to_member": cred_name,
                "amount": round(transfer, 2),
            }
        )

        cred_amt -= transfer
        debt_amt -= transfer

        if cred_amt < EPSILON:
            i += 1
        else:
            creditors[i] = (cred_name, cred_amt)

        if debt_amt < EPSILON:
            j += 1
        else:
            debtors[j] = (debt_name, debt_amt)

    return transactions
