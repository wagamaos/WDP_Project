(function () {
  'use strict';

  var categories = ['Food', 'Transport', 'Housing', 'Study', 'Entertainment', 'Other'];
  var categoryColors = {
    Food: 'var(--royal)',
    Transport: 'var(--gold)',
    Housing: 'var(--mid-blue-2)',
    Study: 'var(--mint)',
    Entertainment: 'var(--mid-blue-3)',
    Other: 'var(--pale-blue-2)'
  };
  var categoryIcons = {
    Food: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    Transport: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    Housing: '<path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/>',
    Study: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    Entertainment: '<circle cx="12" cy="12" r="10"/><path d="M8 15s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
    Other: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>'
  };
  var expenseList = document.getElementById('budget-expense-list');
  var emptyState = document.getElementById('budget-empty');
  var expenseDialog = document.getElementById('expense-dialog');
  var expenseForm = document.getElementById('expense-form');
  var budgetDialog = document.getElementById('budget-dialog');
  var budgetForm = document.getElementById('budget-form');
  var expenses = [];
  var monthlyBudget = 1000;

  function money(amount) {
    return 'SGD ' + Number(amount).toFixed(2);
  }

  function currentMonth() {
    var now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  }

  function localDate() {
    var now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') +
      '-' + String(now.getDate()).padStart(2, '0');
  }

  function showFormMessage(id, message) {
    var element = document.getElementById(id);
    element.textContent = message || '';
    element.hidden = !message;
  }

  function render() {
    var month = currentMonth();
    var thisMonth = expenses.filter(function (expense) {
      return expense.date.slice(0, 7) === month;
    });
    var spent = thisMonth.reduce(function (total, expense) { return total + expense.amount; }, 0);
    var totals = {};
    categories.forEach(function (category) { totals[category] = 0; });
    thisMonth.forEach(function (expense) { totals[expense.category] += expense.amount; });

    document.getElementById('monthly-budget').textContent = money(monthlyBudget);
    document.getElementById('spent-this-month').textContent = money(spent);
    document.getElementById('donut-total').textContent = Math.round(spent).toString();
    document.querySelectorAll('[data-category-total]').forEach(function (element) {
      element.textContent = money(totals[element.dataset.categoryTotal]);
    });

    var percent = monthlyBudget ? spent / monthlyBudget * 100 : 0;
    var roundedPercent = Math.round(percent);
    document.getElementById('budget-percent').textContent = roundedPercent + '%';
    document.getElementById('budget-percent').setAttribute('aria-label', roundedPercent + ' percent spent');
    document.getElementById('budget-progress').setAttribute('aria-valuenow', String(Math.min(100, roundedPercent)));
    document.getElementById('budget-progress').setAttribute('aria-label', 'Budget used: ' + roundedPercent + '%');
    document.getElementById('budget-progress-fill').style.width = Math.min(100, percent) + '%';
    document.getElementById('budget-status').textContent =
      spent > monthlyBudget ? 'Over monthly budget' : 'Monthly spending';
    document.getElementById('budget-remaining').textContent = money(Math.abs(monthlyBudget - spent)) +
      (spent > monthlyBudget ? ' over budget' : ' remaining');

    var circumference = 2 * Math.PI * 60;
    var offset = 0;
    document.querySelectorAll('.donut-svg circle[data-category]').forEach(function (circle) {
      var value = totals[circle.dataset.category];
      var segment = spent ? value / spent * circumference : 0;
      circle.setAttribute('stroke-dasharray', segment + ' ' + (circumference - segment));
      circle.setAttribute('stroke-dashoffset', String(-offset));
      offset += segment;
    });

    expenseList.innerHTML = '';
    emptyState.hidden = expenses.length > 0;
    expenses.forEach(function (expense) {
      var item = document.createElement('li');
      var icon = document.createElement('div');
      var info = document.createElement('div');
      var name = document.createElement('div');
      var meta = document.createElement('div');
      var amount = document.createElement('span');
      var remove = document.createElement('button');
      item.className = 'budget-expense-item';
      icon.className = 'budget-expense-icon';
      icon.style.background = categoryColors[expense.category];
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<svg viewBox="0 0 24 24">' + categoryIcons[expense.category] + '</svg>';
      info.className = 'budget-expense-info';
      name.className = 'budget-expense-name';
      name.textContent = expense.name;
      meta.className = 'budget-expense-meta';
      meta.textContent = expense.category + ' · ' + new Date(expense.date + 'T00:00:00').toLocaleDateString();
      amount.className = 'budget-expense-amount';
      amount.textContent = money(expense.amount);
      remove.type = 'button';
      remove.className = 'budget-expense-remove';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', 'Remove ' + expense.name);
      remove.addEventListener('click', function () {
        window.LandedAuth.deleteBudgetEntry(expense.id).then(loadData).catch(showError);
      });
      info.appendChild(name);
      info.appendChild(meta);
      item.appendChild(icon);
      item.appendChild(info);
      item.appendChild(amount);
      item.appendChild(remove);
      expenseList.appendChild(item);
    });
  }

  function loadData() {
    return Promise.all([
      window.LandedAuth.listBudgetEntries(),
      window.LandedAuth.getMonthlyBudget()
    ]).then(function (data) {
      expenses = data[0];
      monthlyBudget = data[1];
      render();
    });
  }

  function showError(error) {
    var message = error && error.message ? error.message : 'Could not load budget data.';
    window.alert(message);
  }

  document.getElementById('add-expense-btn').addEventListener('click', function () {
    showFormMessage('expense-message', '');
    expenseForm.reset();
    expenseForm.elements.date.value = localDate();
    expenseDialog.showModal();
  });
  document.getElementById('cancel-expense-btn').addEventListener('click', function () {
    expenseDialog.close();
  });
  expenseForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!expenseForm.reportValidity()) return;
    var button = document.getElementById('save-expense-btn');
    button.disabled = true;
    window.LandedAuth.addBudgetEntry({
      name: expenseForm.elements.name.value,
      amount: expenseForm.elements.amount.value,
      category: expenseForm.elements.category.value,
      date: expenseForm.elements.date.value
    }).then(function () {
      expenseDialog.close();
      return loadData();
    }).catch(function (error) {
      showFormMessage('expense-message', error.message);
    }).finally(function () {
      button.disabled = false;
    });
  });

  document.getElementById('edit-budget-btn').addEventListener('click', function () {
    showFormMessage('budget-message', '');
    budgetForm.elements.amount.value = monthlyBudget.toFixed(2);
    budgetDialog.showModal();
  });
  document.getElementById('cancel-budget-btn').addEventListener('click', function () {
    budgetDialog.close();
  });
  budgetForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!budgetForm.reportValidity()) return;
    var button = document.getElementById('save-budget-btn');
    button.disabled = true;
    window.LandedAuth.updateMonthlyBudget(budgetForm.elements.amount.value).then(function (budget) {
      monthlyBudget = budget;
      render();
      budgetDialog.close();
    }).catch(function (error) {
      showFormMessage('budget-message', error.message);
    }).finally(function () {
      button.disabled = false;
    });
  });

  window.LandedAuth.getCurrentUser().then(function (user) {
    if (!user) {
      window.location.replace('login.html');
      return;
    }
    return loadData();
  }).catch(showError);
})();
