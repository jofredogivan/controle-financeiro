let receitas = [];
let despesas = [];
let reservas = [];
let objetivos = [];

// Alternar abas
function mostrarAba(aba) {
  document.querySelectorAll('.aba').forEach(sec => sec.style.display = 'none');
  document.getElementById(aba).style.display = 'block';
}

// Receitas
function adicionarReceita() {
  const desc = document.getElementById('descReceita').value;
  const valor = parseFloat(document.getElementById('valorReceita').value);
  if (desc && valor > 0) {
    receitas.push({ desc, valor });
    atualizarLista('listaReceitas', receitas);
    atualizarDashboard();
  }
}

// Despesas
function adicionarDespesa() {
  const desc = document.getElementById('descDespesa').value;
  const valor = parseFloat(document.getElementById('valorDespesa').value);
  if (desc && valor > 0) {
    despesas.push({ desc, valor });
    atualizarLista('listaDespesas', despesas);
    atualizarDashboard();
  }
}

// Reservas (conta como DESPESA)
function adicionarReserva() {
  const desc = document.getElementById('descReserva').value;
  const valor = parseFloat(document.getElementById('valorReserva').value);
  if (desc && valor > 0) {
    reservas.push({ desc, valor });
    atualizarLista('listaReservas', reservas);
    atualizarDashboard();
  }
}

// Objetivos
function adicionarObjetivo() {
  const desc = document.getElementById('descObjetivo').value;
  const valor = parseFloat(document.getElementById('valorObjetivo').value);
  if (desc && valor > 0) {
    objetivos.push({ desc, valor, acumulado: 0 });
    atualizarListaObjetivos();
  }
}

// Atualiza listas
function atualizarLista(id, lista) {
  const ul = document.getElementById(id);
  ul.innerHTML = '';
  lista.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.desc} - R$ ${item.valor}`;
    ul.appendChild(li);
  });
}

function atualizarListaObjetivos() {
  const ul = document.getElementById('listaObjetivos');
  ul.innerHTML = '';
  objetivos.forEach(obj => {
    const li = document.createElement('li');
    li.textContent = `${obj.desc} - Meta: R$ ${obj.valor} | Acumulado: R$ ${obj.acumulado}`;
    ul.appendChild(li);
  });
}

// Atualiza Dashboard
function atualizarDashboard() {
  const totalReceitas = receitas.reduce((sum, r) => sum + r.valor, 0);
  const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);
  const totalReservas = reservas.reduce((sum, r) => sum + r.valor, 0);

  document.getElementById('totalReceitas').textContent = totalReceitas.toFixed(2);
  document.getElementById('totalDespesas').textContent = totalDespesas.toFixed(2);
  document.getElementById('totalReservas').textContent = totalReservas.toFixed(2);

  const saldo = totalReceitas - totalDespesas - totalReservas;
  document.getElementById('saldo').textContent = saldo.toFixed(2);
}
