const ALL_PEOPLE = ["Alice", "Bob", "Charlie", "Dana"];
let expenses = [];
let balances = {};

const expenseForm = document.getElementById('expense-form');
const paidBySelect = document.getElementById('paid-by');
const sharedByCheckboxesDiv = document.getElementById('shared-by-checkboxes');
const expenseTableBody = document.getElementById('expense-table-body');
const balancesBody = document.getElementById('balances-body');
const settlementAdviceDiv = document.getElementById('settlement-advice');

function calculateBalances() {
    ALL_PEOPLE.forEach(person => {
        balances[person] = 0;
    });

    expenses.filter(e => !e.isSettled).forEach(expense => {
        const numSharers = expense.sharedBy.length;
        if (numSharers === 0) return;
        
        const shareAmount = expense.amount / numSharers;
        
        balances[expense.paidBy] += expense.amount;

        expense.sharedBy.forEach(sharer => {
            balances[sharer] -= shareAmount;
        });
    });
    
    renderBalances();
}

function calculateSettlements() {
    const debtors = [];
    const creditors = [];
    const settlements = [];

    for (const person in balances) {
        const balance = parseFloat(balances[person].toFixed(2));
        if (balance < -0.01) {
            debtors.push({ person, amount: Math.abs(balance) });
        } else if (balance > 0.01) {
            creditors.push({ person, amount: balance });
        }
    }

    let d_index = 0;
    let c_index = 0;

    while (d_index < debtors.length && c_index < creditors.length) {
        const debtor = debtors[d_index];
        const creditor = creditors[c_index];

        const transactionAmount = Math.min(debtor.amount, creditor.amount);

        if (transactionAmount > 0.01) {
            settlements.push({
                from: debtor.person,
                to: creditor.person,
                amount: transactionAmount
            });

            debtor.amount -= transactionAmount;
            creditor.amount -= transactionAmount;
        }

        if (debtor.amount < 0.01) {
            d_index++;
        }
        if (creditor.amount < 0.01) {
            c_index++;
        }
    }
    
    renderSettlements(settlements);
}

function renderBalances() {
    balancesBody.innerHTML = '';
    
    const sortedPeople = Object.keys(balances).sort();

    sortedPeople.forEach(person => {
        const balance = balances[person];
        const balanceClass = balance < 0 ? 'negative' : (balance > 0 ? 'positive' : '');
        const formattedBalance = balance.toFixed(2);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${person}</td>
            <td class="${balanceClass}">PKR ${formattedBalance}</td>
        `;
        balancesBody.appendChild(row);
    });
    
    calculateSettlements();
}

function renderSettlements(settlements) {
    settlementAdviceDiv.innerHTML = '';
    
    if (settlements.length === 0) {
        settlementAdviceDiv.innerHTML = '<p style="text-align: center; color: var(--positive-balance); font-weight: 600;">Everyone is settled up!</p>';
        return;
    }
    
    const list = document.createElement('ul');
    list.style.listStyleType = 'none';
    list.style.paddingLeft = '0';
    list.style.maxWidth = '400px';
    list.style.margin = '10px auto';
    
    settlements.forEach(s => {
        const listItem = document.createElement('li');
        listItem.style.borderBottom = '1px dotted var(--border-color)';
        listItem.style.padding = '8px 0';
        listItem.innerHTML = `
            <strong>${s.from}</strong> owes <strong>${s.to}</strong> <strong>PKR ${s.amount.toFixed(2)}</strong>
        `;
        list.appendChild(listItem);
    });
    
    settlementAdviceDiv.appendChild(list);
}

function renderExpenses() {
    expenseTableBody.innerHTML = '';
    
    if (expenses.length === 0) {
        expenseTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No expenses added yet.</td></tr>';
        return;
    }

    expenses.forEach((expense, index) => {
        const row = expenseTableBody.insertRow();
        if (expense.isSettled) {
            row.classList.add('settled-row');
        }
        
        row.innerHTML = `
            <td>${expense.description}</td>
            <td>PKR ${expense.amount.toFixed(2)}</td>
            <td>${expense.paidBy}</td>
            <td>${expense.sharedBy.join(', ')}</td>
            <td>${expense.isSettled ? 'Yes' : 'No'}</td>
            <td>
                <button class="settle-up-btn" data-index="${index}" onclick="toggleSettled(${index})" ${expense.isSettled ? 'disabled' : ''}>
                    ${expense.isSettled ? 'Settled' : 'Settle'}
                </button>
            </td>
        `;
    });
}

function setupPeopleOptions() {
    paidBySelect.innerHTML = '';
    sharedByCheckboxesDiv.innerHTML = '';
    
    ALL_PEOPLE.forEach(person => {
        const option = document.createElement('option');
        option.value = person;
        option.textContent = person;
        paidBySelect.appendChild(option);

        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" name="shared-by" value="${person}" checked>
            ${person}
        `;
        sharedByCheckboxesDiv.appendChild(label);
        
        balances[person] = 0;
    });
}

expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const paidBy = document.getElementById('paid-by').value;
    
    const sharedByCheckboxes = Array.from(document.querySelectorAll('input[name="shared-by"]:checked'));
    const sharedBy = sharedByCheckboxes.map(cb => cb.value);

    if (!description || isNaN(amount) || amount <= 0 || !paidBy || sharedBy.length === 0) {
        alert('Please fill out all fields correctly and select at least one person to share the expense.');
        return;
    }

    const newExpense = {
        description,
        amount,
        paidBy,
        sharedBy,
        isSettled: false,
        id: Date.now()
    };

    expenses.push(newExpense);
    
    renderExpenses();
    calculateBalances();

    expenseForm.reset();
    document.querySelectorAll('input[name="shared-by"]').forEach(cb => cb.checked = true);
});

window.toggleSettled = function(index) {
    if (expenses[index]) {
        expenses[index].isSettled = !expenses[index].isSettled;
        
        renderExpenses();
        calculateBalances();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupPeopleOptions();
    renderExpenses();
    calculateBalances();
});